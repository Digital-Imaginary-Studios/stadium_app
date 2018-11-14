Number.prototype.clamp = function(min, max) { return Math.min(max, Math.max(min, this)); };
Array.prototype.inverse = function() {
    var result = [];
    for (let i = this.length-1; i>=0; i--)
        result.push(this[i]);
    return result;
};

function updateRowColInputs(selected) {
    let index = selected.value;
    console.log(index);
}

function createSkybox(path) {
    var texLoader = new THREE.TextureLoader();
	var skyboxPath = "images/skybox/"+ path +"/";
	var directions  = ["px", "nx", "py", "ny", "pz", "nz"];
	var skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 );

	var skyMaterial = [];
	for (let i = 0; i < 6; i++)
        skyMaterial.push( new THREE.MeshBasicMaterial({
			map: texLoader.load( skyboxPath + directions[i] + ".jpg" ),
			side: THREE.BackSide
		}));
	return new THREE.Mesh( skyGeometry, skyMaterial );
}

var viewport3d, renderer3d;
var viewport_width, viewport_height, controls;
var loader_FBX, loader_TEX;
var scene, camera, cameraTop, HUD, mouse;
var map, model;
var bSectors

function updateRendererSize(e) {
    viewport_width = viewport3d.offsetWidth;
    viewport_height = viewport3d.offsetHeight;
    renderer3d.setSize(viewport_width, viewport_height);
    if (camera) {
        camera.aspect = viewport_width / viewport_height;
        camera.updateProjectionMatrix();
    }
    HUD && HUD.setCameraAspect(viewport_width / viewport_height);
}

function update() {
    requestAnimationFrame(update);
    controls.update();
    renderer3d.clear();
    renderer3d.render(scene, bSectors.visible ? cameraTop : camera);
    HUD && HUD.render(renderer3d);
};

function init() {
    // WebGL Renderer
    viewport3d = document.getElementById('viewport3D');
    renderer3d = new THREE.WebGLRenderer({antialias: true, premultipliedAlpha: false});
    renderer3d.setPixelRatio( 2 );
    renderer3d.autoClear = false;
    viewport3d.appendChild(renderer3d.domElement);
    updateRendererSize();

    // INITIALIZE SCENE
    loader_FBX = new THREE.FBXLoader();
    loader_TEX = new THREE.TextureLoader();
    scene = new THREE.Scene();
    // create skybox
	scene.add( createSkybox( SKYBOX ) );
    // setup scene lights
    var light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(0, 70, 0);
    scene.add(light);
    light = new THREE.AmbientLight( 0x5f5f5f );
    scene.add(light);
    // initialize camera
    camera = new THREE.PerspectiveCamera(60, viewport_width / viewport_height, 0.1, 10000);
    cameraTop = new THREE.OrthographicCamera( viewport_width/ -8, viewport_width/ 8, viewport_height/ 8, viewport_height/ -8, 1, 1000)
    cameraTop.position.set(0, 31, 0);
    cameraTop.rotation.x = -Math.PI / 2;

    // INITIALIZE HUD AND CONTROLS
    mouse = new THREE.Mouse();
    // initializing hud before controls makes it receiving events first
    HUD = new THREE.HUD({
        mousedown: [renderer3d.domElement, e => {
            mouse.update(e); // manually update mouse state
            controls.canLock = !(HUD.process(mouse.X, mouse.Y) || bSectors.visible);
        }],
        // mouseup: [renderer3d.domElement, e => controls.canLock = true],
        mousemove: [renderer3d.domElement, e => {
            // console.log(mouse);
        }]
    });

    bSectors = new THREE.Group();
    bSectors.visible = false;
    HUD.addElem(bSectors);
    HUD.addButton("bChooseSector", "images/button.png", -viewport_width/2 + 10, viewport_height/2 - 10, 0.0, 1.0, (_this) => {
        bSectors.visible = !bSectors.visible;
    });
    controls = new THREE.CameraControls(camera, renderer3d.domElement);

    // INITIALIZE MODEL AND RUN MAIN LOOP
    model = loadModel(MODEL_NAME);
    scene.add(cubes);
    update();
}

function startup() {
    WEBGL.isWebGLAvailable()
        ? init()
        : document.body.appendChild( WEBGL.getWebGLErrorMessage() );
    window.addEventListener('resize', updateRendererSize, false);
}
