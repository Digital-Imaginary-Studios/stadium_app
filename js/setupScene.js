Number.prototype.clamp = function(min, max) { return Math.min(max, Math.max(min, this)); };
Array.prototype.inverse = function() {
    var result = [];
    for (var i = this.length-1; i>=0; i--)
        result.push(this[i]);
    return result;
};

function updateRowColInputs(selected) {
    var index = selected.value;
    console.log(index);
}

function createSkybox(path) {
    var texLoader = new THREE.TextureLoader();
	var skyboxPath = "images/skybox/"+ path +"/";
	var directions  = ["px", "nx", "py", "ny", "pz", "nz"];
	var skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 );
	
	var skyMaterial = [];
	for (var i = 0; i < 6; i++)
        skyMaterial.push( new THREE.MeshBasicMaterial({
			map: texLoader.load( skyboxPath + directions[i] + ".jpg" ),
			side: THREE.BackSide
		}));
	return new THREE.Mesh( skyGeometry, skyMaterial );
}

var viewport3d, renderer3d;
var viewport_width, viewport_height, controls;
var loader_FBX, loader_TEX;
var scene, camera, HUD;
var map, model;

function updateRendererSize(e) {
    viewport_width = viewport3d.offsetWidth;
    viewport_height = viewport3d.offsetHeight;
    renderer3d.setSize(viewport_width, viewport_height);
    if (camera) {
        camera.aspect = viewport_width / viewport_height;
        camera.updateProjectionMatrix();
    }
    if (HUD)
        HUD.setCameraAspect(viewport_width / viewport_height);
}

function update() {
    requestAnimationFrame(update);
    controls.update();
    if (HUD) {
        renderer3d.clear();
        renderer3d.render(scene, camera);
        renderer3d.clearDepth();
        HUD.render(renderer3d);
    } else {
        renderer3d.clear();
        renderer3d.render(scene, camera);
    }
};

function init() {
    // WebGL Renderer
    viewport3d = document.getElementById('viewport3D');
    renderer3d = new THREE.WebGLRenderer({antialias: true, premultipliedAlpha: false});
    renderer3d.setPixelRatio( 2 );
    renderer3d.autoClear = false;
    viewport3d.appendChild(renderer3d.domElement);
    updateRendererSize();

    // Instantiate scene
    loader_FBX = new THREE.FBXLoader();
    loader_TEX = new THREE.TextureLoader();
    scene = new THREE.Scene();

    // make skybox
	scene.add( createSkybox( SKYBOX ) );

    // setup scene lights
    var light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(0, 70, 0);
    scene.add(light);
    var light = new THREE.AmbientLight( 0x5f5f5f );
    scene.add(light);

    // initialize camera and controls
    camera = new THREE.PerspectiveCamera(60, viewport_width / viewport_height, 0.1, 10000);
    controls = new CameraControls(camera, renderer3d.domElement);
    HUD = new THREE.HUD();

    model = loadModel(MODEL_NAME);
    update();
}

function startup() {
    WEBGL.isWebGLAvailable()
        ? init()
        : document.body.appendChild( WEBGL.getWebGLErrorMessage() );
    window.addEventListener('resize', updateRendererSize, false);
}
