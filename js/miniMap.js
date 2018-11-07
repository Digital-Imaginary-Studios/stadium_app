THREE.MiniMap = function(scene) {
    var buttonImage = loader_TEX.load("images/button.png", image => {
        this.button = new THREE.Sprite(new THREE.SpriteMaterial({map: buttonImage}));
        console.log(buttonImage);
        this.button.scale.set(buttonImage.image.width, buttonImage.image.height, 1);
        this.button.center.set(0.0, 1.0);
        this.button.position.set(-viewport_width/2, viewport_height/2, 1);
        // this.button.position.set(0, 0, 1);
        scene.add(this.button);
    });

    // var sprite = new THREE.Sprite(new THREE.SpriteMaterial({color: 0x000000}));
    
    // sprite.scale.set(100, 200, 1);
    // sprite.position.set(0, 0, 1);

    // scene.add(sprite);
};

THREE.MiniMap.prototype.constructor = THREE.MiniMap;