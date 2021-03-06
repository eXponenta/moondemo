(function () {
    'use strict';

    var SVG_ID_PAIRS = [
        {
            id: "red", 
            normal: { color: "#ff0000", opacity: 0.2},
            hover: { color: "#ceac00", opacity: 0.6},
        },
        {
            id: "green", 
            normal: { color: "#00ff00", opacity: 0.2},
            hover: { color: "#00ff00", opacity: 0.6},
        },
        {
            id: "blue", 
            normal: { color: "#0000ff", opacity: 0.2},
            hover: { color: "#0000ff", opacity: 0.6},
        }
    ];

    //eXponenta variables
    var shadows = true;
    var ambiendLight = new THREE.AmbientLight(0xffffff, 0.5);
    var area;
    var svg_loader;
    var area_texture;
    //

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
    }

    var hud = document.getElementById('hud');
    var container = document.getElementById('container');

    var loadingContainer = document.getElementById('loading-container');
    var loadingMessage = document.getElementById('loading-message');

    var scene;
    var renderer;
    var camera;
    var clock;
    var controls;
    var stats;

    var starfield;
    var moon;

    var light = {
        light: new THREE.DirectionalLight(0xffffff, 1),
        speed: 0.1,
        distance: 1000,
        //position: new THREE.Vector3(0, 0, 0),
        orbit: function (center, time) {
            this.light.position.x =
                (center.x + this.distance) * Math.sin(time * -this.speed);

            this.light.position.z =
                (center.z + this.distance) * Math.cos(time * this.speed);
        }
    };

    function createMoon(textureMap, normalMap) {
        var radius = 100;
        var xSegments = 50;
        var ySegments = 50;
        var geo = new THREE.SphereGeometry(radius, xSegments, ySegments);

        var mat = new THREE.MeshPhongMaterial({
            map: textureMap,
            normalMap: normalMap,
            shininess: 0,
        });

        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 180, 0);
        scene.add(mesh);
        
        return mesh;
    }

    function createMoonMap(texture) {
        var radius = 100.1; // делаем карту чуть-больше, что бы она была поверх луны,можно конечно отключить сортировку, но так точже можно=))
        var xSegments = 50;
        var ySegments = 50;
        var geo = new THREE.SphereGeometry(radius, xSegments, ySegments);

        var mat = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 0,
            transparent: true,
            opacity: 0.4
        });

        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 180, 0);
        scene.add(mesh);
        
        return mesh;
    }

    function createSkybox(texture) {
        var size = 15000;

        var cubemap = THREE.ShaderLib.cube;
        cubemap.uniforms.tCube.value = texture;

        var mat = new THREE.ShaderMaterial({
            fragmentShader: cubemap.fragmentShader,
            vertexShader: cubemap.vertexShader,
            uniforms: cubemap.uniforms,
            depthWrite: false,
            side: THREE.BackSide
        });

        var geo = new THREE.CubeGeometry(size, size, size);
        
        var mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        
        return mesh;
    }

    function init() {
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true
        });

        renderer.setClearColor(0x000000, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        var fov = 35;
        var aspect = window.innerWidth / window.innerHeight;
        var near = 1;
        var far = 65536;
        
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(0, 0, 800);

        scene = new THREE.Scene();
        scene.add(camera);

        scene.add(light.light);
        scene.add(ambiendLight);
        ambiendLight.intensity = 0;
        

        controls = new THREE.TrackballControls(camera);
        controls.rotateSpeed = 0.5;
        controls.dynamicDampingFactor = 0.5;
        controls.minDistance = 140;
        controls.maxDistance = 1000;

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.bottom = '0px';
        hud.appendChild(stats.domElement);

        clock = new THREE.Clock();

        // load svg
        svg_loader =  new SVGTextureManager();
        //

        Hooker.setCallback(function(state) {

            console.log(state);
            var color_state = null;

            if(state.type == "over")
            {
                renderer.domElement.style.cursor = "pointer";
                color_state = state.target.hover;

            } else if(state.type == "out") {
            
                renderer.domElement.style.cursor = "";
                if(state.target)
                    color_state = state.target.normal;
            } else {

                console.log("clicked on:", state.target, state.meta);
            }

            if(color_state){
                svg_loader.setColorById( state.target.id, color_state.color, color_state.opacity);
                svg_loader.generateTexture(area_texture);
                //console.log(area_texture.needsUpdate);
            }
        });

    }

    function animate() {
        requestAnimationFrame(animate);
        light.orbit(moon.position, clock.getElapsedTime());
        controls.update(camera);
        stats.update();
        //Hooker.update();        
        renderer.render(scene, camera);
    }

    function toggleHud() {
        hud.style.display = hud.style.display === 'none' ? 'block' : 'none';
    }

    function onDocumentKeyDown (evt) {
        switch (evt.keyCode) {
        case 'H'.charCodeAt(0):
            toggleHud();
            break;
        case 'F'.charCodeAt(0):
            if (screenfull.enabled) screenfull.toggle();
            break;
        case 'P'.charCodeAt(0):
            window.open(renderer.domElement.toDataURL('image/png'));
            break;
        case 'L'.charCodeAt(0): {
            toogleShadows();
            break;
        }
        }
    }

    //eXponenta injection
    //toogle shadows
    function toogleShadows() {
        shadows  = !shadows;
        if(shadows){
            light.light.intensity = 1;
            ambiendLight.intensity = 0;
        } else {
            light.light.intensity = 0;
            ambiendLight.intensity = 0.8;
        }
    }

    function onWindowResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    function loadAssets(options) {
        var paths = options.paths;
        var onBegin = options.onBegin;
        var onComplete = options.onComplete;
        var onProgress = options.onProgress;
        var total = 0;
        var completed = 0;
        var textures = { };
        var key;

        for (key in paths)
            if (paths.hasOwnProperty(key)) total++;

        onBegin({
            total: total,
            completed: completed
        });

        for (key in paths) {
            if (paths.hasOwnProperty(key)) {
                var path = paths[key];
                if (typeof path === 'string')
                    THREE.ImageUtils.loadTexture(path, null, getOnLoad(path, key));
                else if (typeof path === 'object')
                    THREE.ImageUtils.loadTextureCube(path, null, getOnLoad(path, key));
            }
        }

        function getOnLoad(path, name) {
            return function (tex) {
                textures[name] = tex;
                completed++;
                if (typeof onProgress === 'function') {
                    onProgress({
                        path: path,
                        name: name,
                        total: total,
                        completed: completed
                    });
                }
                if (completed === total && typeof onComplete === 'function') {
                    onComplete({
                        textures: textures
                    });
                }
            };
        }
    }

    /** When the window loads, we immediately begin loading assets. While the
        assets loading Three.JS is initialized. When all assets finish loading
        they can be used to create objects in the scene and animation begins */
    function onWindowLoaded() {
        loadAssets({
            paths: {
                moon: 'img/maps/moon.jpg',
                moonNormal: 'img/maps/normal.jpg',
                starfield: [
                    'img/starfield/front.png',
                    'img/starfield/back.png',
                    'img/starfield/left.png',
                    'img/starfield/right.png',
                    'img/starfield/top.png',
                    'img/starfield/bottom.png'
                ]
            },
            onBegin: function () {
                loadingContainer.style.display = 'block';
            },
            onProgress: function (evt) {
                loadingMessage.innerHTML = evt.name;
            },
            onComplete: function (evt) {

                loadingContainer.style.display = 'none';
                var textures = evt.textures;

                moon = createMoon(textures.moon, textures.moonNormal);
                
                
                svg_loader.loadSvg("img/maps/area.svg", null, function(){

                    area_texture = svg_loader.generateTexture();
                    
                    area = createMoonMap(area_texture);
                    Hooker.init(camera, area);
                    Hooker.setObjects(SVG_ID_PAIRS, svg_loader);
                    
                    for(var i = 0; i < SVG_ID_PAIRS.length; i++) {
                        var e = SVG_ID_PAIRS[i];
                        svg_loader.setColorById(e.id, e.normal.color, e.normal.opacity)
                    }
                    svg_loader.generateTexture(area_texture);

                });

                starfield = createSkybox(textures.starfield);

                // init texture hooker for check areas on map

                animate();
            }
        });

        init();
    }

    /** Window load event kicks off execution */
    window.addEventListener('load', onWindowLoaded, false);
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onDocumentKeyDown, false);
})();
