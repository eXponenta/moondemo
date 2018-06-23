var Hooker = {};

(function() {
    'use strict';

    var texture;
    var map;
    var canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var object;

    var screen = {};
    var camera;
    var colorMap = [];
    var howerCallback;
    var wasHowered = false;

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
        
        texture = new THREE.CanvasTexture( createCanvasTexture(_testTexture || _target.material.map ));

    }

    Hooker.release = function() {
        
        document.removeEventListener("mousemove", mouseMove, false);
        document.removeEventListener("mousedown", mouseDown, false);
        document.removeEventListener("mouseup", mouseUp, false);
        window.removeEventListener("resize", handleResize, false);

    }

    Hooker.setColorMap = function(_colorMap) {
        colorMap = _colorMap;
    }

    Hooker.setHowerCallback = function(_callback) {
        howerCallback = _callback;
    }

    function mouseMove(event) {
        
        var color = checkIntersects(event);
        if(howerCallback){
            
            if(color != null && !wasHowered){
                
                howerCallback(true);

            } else if( color == null && wasHowered){
                
                howerCallback(false);

            }

        }
        
        wasHowered = color != null;
    }

    function checkColor(color) {

        colorMap.forEach( function(m) {
            if(m.color && m.color.equals(color)) {
                if(m.callback instanceof Function)
                    m.callback(currentRaycastData);
            }
        });

    }

    function mouseUp(event) {

    }

    function mouseDown(event) {
        var color = checkIntersects(event);
        if(color == null) return;
        checkColor(color);
    }

    function createCanvasTexture(orig) {

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
        
        var x = (uv.x * texture.image.width >> 0);
        var y = (uv.y * texture.image.height >> 0);
        
        currentRaycastData.point = {x:interesects[0].point.x, y: interesects[0].point.y};
        currentRaycastData.texturePoint = {x: x, y: y};

        var data = ctx.getImageData(x, y, 1,1).data;
        
        if(data[3] < 10)
            return null;

        return new THREE.Color(data[0], data[1], data[2]);
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

})();