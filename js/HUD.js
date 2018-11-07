THREE.HUD = function(config) {
    this.render = renderer => {
        renderer.clearDepth();
        renderer.render(this.scene, this.camera);
    };

    this.setCameraAspect = aspect => {
        if (this.camera) {
            this.camera.aspect = aspect;
            this.camera.updateProjectionMatrix();
        }
    };

    this.testIntersects = (x, y) => {
        x = (x / viewport_width) * 2 - 1;
        y = -(y / viewport_height) * 2 + 1;
        this.raycaster.setFromCamera(new THREE.Vector3(x, y, 1), this.camera);
        var intersects = this.raycaster.intersectObject(this.scene, true);
        if (intersects.length > 0) {
            var res = intersects.filter(res => {
                return res && res.object;
            })[0];
            if (res && res.object)
                return res.object;
        }
        return false;
    };

    this.addButton = (ID, texture, X, Y, CX, CY, callback) => {
        loader_TEX.load(texture, tex => {
            let button = new THREE.Sprite(new THREE.SpriteMaterial({map: tex}));
            button.scale.set(tex.image.width, tex.image.height, 1);
            button.center.set(CX, CY);
            button.position.set(X, Y, 1);
            button.visible = true;
            button.ID = ID;
            button.callback = () => callback(button);
            this.sprites.push(button);
            this.scene.add(button);
        });
    };


    function makeTextSprite( message, parameters ){
        if ( parameters === undefined ) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ? 
            parameters["fontface"] : "Arial";
        var fontsize = parameters.hasOwnProperty("fontsize") ? 
            parameters["fontsize"] : 40;
        var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
            parameters["borderThickness"] : 5;
        var borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        var metrics = context.measureText( message );
        var textWidth = metrics.width;

        context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
        context.strokeStyle = "rgba(" +     borderColor.r + "," +     borderColor.g + "," +     borderColor.b + "," +     borderColor.a + ")";
        context.lineWidth = borderThickness;
        ((ctx, x, y, w, h, r) => {
            ctx.beginPath();
            ctx.moveTo(x+r, y);
            ctx.lineTo(x+w-r, y);
            ctx.quadraticCurveTo(x+w, y, x+w, y+r);
            ctx.lineTo(x+w, y+h-r);
            ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
            ctx.lineTo(x+r, y+h);
            ctx.quadraticCurveTo(x, y+h, x, y+h-r);
            ctx.lineTo(x, y+r);
            ctx.quadraticCurveTo(x, y, x+r, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();   
        })(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);

        // text color
        context.fillStyle = "rgba(0, 0, 0, 1.0)";
        context.fillText( message, borderThickness, fontsize + borderThickness);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas) 
        texture.needsUpdate = true;
        return texture;
    }

    this.initSectorsMiniMap = (sectors) => {
        for (let i = bSectors.children.length - 1; i >= 0; i--)
            bSectors.remove(bSectors.children[i]);
        for (let index in sectors) {
            if (index == "default") continue;
            let tex = makeTextSprite(index);
            let sector = new THREE.Sprite(new THREE.SpriteMaterial({map: tex}));
            sector.scale.set(tex.image.width, tex.image.height, 1);
            sector.position.set(...(sectors[index].origin || sectors[index].position).slice(0, 2).map(x => x * 5), 1);
            sector.position.y -= 300;
            sector.callback = () => {
                console.log("clicked!", index);
                controls.changeView(index, 0, 0);
            };
            bSectors.add(sector);
        }
    };

    // CONNECT EVENT LISTENERS
    this.eventListeners = {};
    if (config) for (let index in config)
        this.eventListeners[index] = config[index];
	this.dispose = () => {
		for (let event in this.eventListeners)
			(() => { this.eventListeners[event][0].removeEventListener(event, this.eventListeners[event][1], false); })();
	};
	for (let event in this.eventListeners)
		(() => { this.eventListeners[event][0].addEventListener(event, this.eventListeners[event][1], false); })();

    // INITIALIZE HUD
    this.sprites = [];
    this.raycaster = new THREE.Raycaster();
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-viewport_width/2, viewport_width/2, viewport_height/2, -viewport_height/2, 1, 10);
    this.camera.position.z = 10;
    
    this.addButton("bChooseSector", "images/button.png", -viewport_width/2 + 10, viewport_height/2 - 10, 0.0, 1.0, () => {
        bSectors.visible = !bSectors.visible;
    });

    let bSectors = new THREE.Group();
    bSectors.visible = false;
    this.scene.add(bSectors);
};

THREE.HUD.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.HUD.prototype.constructor = THREE.HUD;