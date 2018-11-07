THREE.HUD = function() {

    this.setCameraAspect = aspect => {
        if (this.camera) {
            this.camera.aspect = aspect;
            this.camera.updateProjectionMatrix();
        }
    };

    this.render = renderer => {
        renderer.render(this.scene, this.camera);
    };

    this.testMouse = (x, y) => {

    };
    

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-viewport_width/2, viewport_width/2, viewport_height/2, -viewport_height/2, 1, 10);
    this.camera.position.z = 10;
    
    loader_TEX.load("images/button.png", texture => {
        console.log(texture);
        this.button = new THREE.Sprite(new THREE.SpriteMaterial({map: texture}));
        this.button.scale.set(texture.image.width, texture.image.height, 1);
        this.button.center.set(0.0, 1.0);
        this.button.position.set(-viewport_width/2, viewport_height/2, 1);
        this.scene.add(this.button);
    });
};
THREE.HUD.prototype.constructor = THREE.HUD;