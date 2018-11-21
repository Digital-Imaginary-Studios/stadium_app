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

function fitCameraToObject( camera, object, offset ) {
    offset = offset || 1.25;

    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);
    const center = boundingBox.getCenter();
    const size = boundingBox.getSize();

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    cameraZ = Math.abs(maxDim / 2 * Math.tan( fov * 2 ));
    cameraZ *= offset;
    scene.updateMatrixWorld();
    var objectWorldPosition = new THREE.Vector3();
    objectWorldPosition.setFromMatrixPosition(object.matrixWorld);

    const directionVector = camera.position.sub(objectWorldPosition);
    const unitDirectionVector = directionVector.normalize();
    camera.position = unitDirectionVector.multiplyScalar(cameraZ);
    camera.lookAt(objectWorldPosition);

    const minZ = boundingBox.min.z;
    const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;
    
    camera.far = cameraToFarEdge * 3;
    camera.updateProjectionMatrix();
    camera.lookAt(center);
}

function loadSkybox(path) {
    scene.background = new THREE.CubeTextureLoader().setPath("images/skybox/"+ path +"/").load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
    scene.background.format = THREE.RGBFormat;
}

var viewport3d, renderer3d;
var viewport_width, viewport_height, controls;
var loader_MESH, loader_TEX;
var scene, camera, cameraTop, HUD, mouse;
var map, model;
var bSectors;

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
    loader_MESH = new THREE.FBXLoader();
    loader_TEX = new THREE.TextureLoader();
    scene = new THREE.Scene();
    // create skybox
	loadSkybox( SKYBOX );
    // setup scene lights
    // var light = new THREE.PointLight(0xffffff, 1, 0);
    // light.position.set(0, 70, 0);
    // scene.add(light);
    var light = new THREE.AmbientLight( 0xffffff );
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
