'use strict';

function SVGTextureManager() {
    
    var svgDom;
    Object.defineProperty(this, "svg", {
        
        get: function () {
              return svgDom 
        }

    });

    this.loadSvg = function(path, dom, callback) {

        if(!dom){
            dom = document.createElement("div");
            dom.style.display = 'none';
            document.body.appendChild(dom);
        }

        var loader = new THREE.FileLoader();
        loader.load( path, 
            function ( data ) {
                inject(data, dom);
                if(callback)
                    callback(svgDom);
            }
        );
    }

    function inject(data, dom) {
        var parser = new DOMParser();
        var svg = parser.parseFromString(data, "image/svg+xml");
        svgDom = svg.documentElement;
        dom.appendChild(svgDom);
        console.log(svgDom);
    }

    this.generateTexture = function(canvas) {
        
        if(!canvas)
            canvas = document.createElement("canvas");
        
        canvas.width = svgDom.getAttribute('width');
        canvas.height = svgDom.getAttribute('height');
        
        canvas.getContext('2d').drawSvg(svgDom.parentElement.innerHTML, 0,0);

        return new THREE.CanvasTexture(canvas);
    }
}