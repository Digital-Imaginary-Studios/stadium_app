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
    this.process = (x, y) => {
        var elem = this.testIntersects(x, y);
        if ((elem.callback !== false) && elem.hasOwnProperty("callback")) {
            elem.callback(elem);
            return true;
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
    this.addElem = elem => {
        this.scene.add(elem);
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
};

THREE.HUD.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.HUD.prototype.constructor = THREE.HUD;