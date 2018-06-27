var Hooker = {};

(function() {
    'use strict';

    //var image;
    var map;
    var canvas; 
    var ctx;
    var object;

    var screen = {};
    var camera;
    var pairs = [];
    var svg;

    var eventsCallback;
    var lastColor = null;
    var lastHoweredObject = null;

    var raycaster = new THREE.Raycaster();
    var currentRaycastData = {};

    Hooker.init = function(_camera, _target, _testTexture) {
       
        handleResize();
        document.addEventListener("mousemove", mouseMove, false);
        document.addEventListener("mousedown", mouseDown, false);
        document.addEventListener("mouseup", mouseUp, false);
        window.addEventListener("resize", handleResize, false);

        camera = _camera;
        object = _target;
    }

    Hooker.release = function() {
        
        document.removeEventListener("pointermove", mouseMove, false);
        document.removeEventListener("pointerdown", mouseDown, false);
        document.removeEventListener("pointerup", mouseUp,  false);
        window.removeEventListener("resize", handleResize, false);

    }

    Hooker.setTestTexture = function(_texture) {
        map = _texture || _target.material.map;

        if(map.image instanceof HTMLCanvasElement){

            canvas = map.image;
            ctx = canvas.getContext('2d');
        
        } else {

            createCanvasTexture(map);

        }
    }

    Hooker.setObjects = function(_pairs, svgTexture) {
        
        if(!svgTexture)
            return;

        pairs = _pairs;
        
        for(var i = 0; i < pairs.length; i++) {
            
            var p = pairs[i];
            
            p.texcolor = new THREE.Color(i / pairs.length, i / pairs.length, i / pairs.length);

            svgTexture.setColorById(p.id, "#" + p.texcolor.getHexString());

        }

        if(!canvas)
            Hooker.setTestTexture(svgTexture.generateTexture());
        else
            svgTexture.generateTexture(canvas);

    }

    
    Hooker.getObjects = function() {
        return pairs;
    }

    Hooker.setCallback = function(_callback) {
        eventsCallback = _callback;
    }

    function mouseMove(event) {
        
        if(!eventsCallback)
            return;

        var color = checkIntersects(event);
       // console.log(color);

        if( (!lastColor && !color) || (lastColor && color && colorEq(color, lastColor)) )
            return;

        if(lastColor != null){
            eventsCallback({type:"out", orig: event, target: lastHoweredObject});
        }
        
        var target = checkColor(color);
        if(target){
            eventsCallback({type:"over", orig: event, target:target});
        }
        
        lastHoweredObject = target;
        lastColor = color;
    }

    function checkColor(color) {
        if(!color)
            return null;
        
        for (var i = 0; i < pairs.length; i++)
        {
            var m = pairs[i];

            if(m.texcolor && colorEq(m.texcolor, color)) {
                return m;
            }
        }

    }

    function mouseDown(e){
        mouseUpDown(e, "down");
    }
    function mouseUp(e){
        mouseUpDown(e, "up");
    }
    
    function mouseUpDown(event, type) {
        var color = checkIntersects(event);
        
        if(!color && !eventsCallback)
            return;

        var target = checkColor(color);
        if(target){
            eventsCallback({type: type, orig: event, target: target, meta: currentRaycastData});
        }
    }

    function createCanvasTexture(orig) {

        if(!canvas)
            canvas = document.createElement("canvas");
        
        ctx = canvas.getContext("2d");

        canvas.width = orig.image.width;
        canvas.height = orig.image.height;
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.drawImage(orig.image,0,0);

        return canvas;
    }

    function checkIntersects(event) {
   
        var screen = getMouseOnScreen(event.clientX, event.clientY);
        var interesects = getIntersect(screen, object);
        if(interesects.length == 0) return null;
       
        var uv = interesects[0].uv;
        object.material.map.transformUv( uv );
        
        var x = (uv.x * canvas.width >> 0);
        var y = (uv.y * canvas.height >> 0);
        
        currentRaycastData.point = {x:interesects[0].point.x, y: interesects[0].point.y};
        currentRaycastData.texturePoint = {x: x, y: y};

        var data = ctx.getImageData(x, y, 1,1).data;
        
        if(data[3] < 10)
            return null;

        return new THREE.Color(data[0] / 255, data[1] / 255, data[2] / 255);
    }

    function getIntersect( point, object ) {

        var mouse = new THREE.Vector2( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
        raycaster.setFromCamera( mouse, camera );
        return raycaster.intersectObject( object );

    };

    function getMouseOnScreen( clientX, clientY ) {

		return new THREE.Vector2(
			clientX / screen.width,
			clientY / screen.height
		);

    };
    
	 function handleResize() {
		screen.width = window.innerWidth;
        screen.height = window.innerHeight;
    };
    
    // так как в ThreeJS прикол с цветами и они разные
    function colorEq(a, b) {

        var summ = Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
        
        return summ <= (3.0 / 256.0);
        
    }

})();