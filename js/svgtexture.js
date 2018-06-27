'use strict';
// для рендра SVG  и манипуляций над элементами его 
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
       // console.log(svgDom);
    }

    this.generateTexture = function(_texture) {
        
        var texture;
        var canvas;
        if(_texture && (_texture.image instanceof HTMLCanvasElement))
        {
            texture = _texture; 
            canvas = texture.image;
        
        }else{
        
            canvas = document.createElement("canvas");
            texture = new THREE.CanvasTexture(canvas);
        }

        canvas.width = svgDom.getAttribute('width');
        canvas.height = svgDom.getAttribute('height');

        canvas.getContext('2d').drawSvg(svgDom.parentElement.innerHTML, 0,0);
        texture.needsUpdate = true;

        return texture;
    }

    this.setColorById = function(id, color, opacity) {
        if(!svgDom || !id || !color)
            return;

        var elem = svgDom.getElementById(id);
        if(elem)
        {
            elem.setAttribute("fill", color);
            
            if(opacity){
                elem.setAttribute("fill-opacity", Math.min(1, opacity));
            }
        }

    }

}