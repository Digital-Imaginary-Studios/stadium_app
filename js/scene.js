Number.prototype.clamp = function(min, max) { return Math.min(max, Math.max(min, this)); };
Array.prototype.inverse = function() {
    let result = [];
    for (let i = this.length-1; i>=0; i--)
        result.push(this[i]);
    return result;
};

function updateRowColInputs(selected) {
    let index = selected.value;
    console.log(index);
}

function createSkybox(path) {
    let texLoader = new THREE.TextureLoader();
	let skyboxPath = "images/skybox/"+ path +"/";
	let directions  = ["px", "nx", "py", "ny", "pz", "nz"];
	let skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 );
	
	let skyMaterial = [];
	for (let i = 0; i < 6; i++)
        skyMaterial.push( new THREE.MeshBasicMaterial({
			map: texLoader.load( skyboxPath + directions[i] + ".jpg" ),
			side: THREE.BackSide
		}));
	return new THREE.Mesh( skyGeometry, skyMaterial );
}

let viewport3d, renderer3d;
let viewport_width, viewport_height, controls;
let loader_FBX, loader_TEX;
let scene, camera, HUD, mouse;
let map, model;

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
    renderer3d.render(scene, camera);
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
    let light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(0, 70, 0);
    scene.add(light);
    light = new THREE.AmbientLight( 0x5f5f5f );
    scene.add(light);
    // initialize camera
    camera = new THREE.PerspectiveCamera(60, viewport_width / viewport_height, 0.1, 10000);

    // INITIALIZE HUD AND CONTROLS
    mouse = new THREE.Mouse();
    // initializing hud before controls makes it receiving events first
    HUD = new THREE.HUD({
        mousedown: [renderer3d.domElement, e => {
            controls.canLock = false;
            mouse.update(e); // manually update mouse state
            let HUD_elem = HUD.testIntersects(mouse.X, mouse.Y);
            controls.canLock = HUD_elem === false;
            if (HUD_elem.callback)
                HUD_elem.callback();
        }],
        mouseup: [renderer3d.domElement, e => controls.canLock = true],
        mousemove: [renderer3d.domElement, e => {
            // console.log(mouse);
        }]
    });
    controls = new THREE.CameraControls(camera, renderer3d.domElement);

    // INITIALIZE MODEL AND RUN MAIN LOOP
    model = loadModel(MODEL_NAME);
    update();
}

function startup() {
    WEBGL.isWebGLAvailable()
        ? init()
        : document.body.appendChild( WEBGL.getWebGLErrorMessage() );
    window.addEventListener('resize', updateRendererSize, false);
}
