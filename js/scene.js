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
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    // if (camera instanceof THREE.OrthographicCamera) {
        var aspect = viewport_width / viewport_height;
        var z = -size.z / 2;
        var x = (size.z * aspect) / 2;

        camera.left = -x;
        camera.right = x;
        camera.top = -z;
        camera.bottom = z;

        camera.position.set(center.x, (model.config.top_view || 100), center.z);
        camera.updateProjectionMatrix();
        camera.rotation.y = camera.rotation.z = 0;
        camera.rotation.x = -Math.PI / 2;
    // } else {

    //     const maxDim = Math.max(size.x, size.y, size.z);
    //     const fov = 50 * (Math.PI / 180);
    //     cameraZ = Math.abs(maxDim / 2 * Math.tan( fov * 2 ));
    //     cameraZ *= offset;
    //     scene.updateMatrixWorld();
    //     var objectWorldPosition = new THREE.Vector3();
    //     objectWorldPosition.setFromMatrixPosition(object.matrixWorld);
    
    //     const directionVector = camera.position.sub(objectWorldPosition);
    //     const unitDirectionVector = directionVector.normalize();
    //     camera.position = unitDirectionVector.multiplyScalar(cameraZ);
    //     camera.lookAt(objectWorldPosition);
    
    //     const minZ = boundingBox.min.z;
    //     const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;
        
    //     camera.far = cameraToFarEdge * 3;
    //     camera.updateProjectionMatrix();
    //     camera.lookAt(center);
    //     camera.rotation.y = 0;
    //     camera.rotation.z = 0;
    // }
}

function loadSkybox(path) {
    scene.background = new THREE.CubeTextureLoader().setPath("images/skybox/"+ path +"/").load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
    scene.background.format = THREE.RGBFormat;
}

var renderer3d;
var viewport_width, viewport_height, controls;
var scene, camera, cameraTop, HUD, mouse;
var loader_TEX, loader_MESH;
var map, model;
var font, font_material;

function updateRendererSize(e) {
    viewport_width = window.innerWidth;
    viewport_height = window.innerHeight;
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
    renderer3d.render(scene, HUD.chooseSectorMode ? cameraTop : camera);
    renderer3d.autoClear = false;
    HUD && HUD.render(renderer3d);
    renderer3d.autoClear = true;
};

function init() {
    // WebGL Renderer
    renderer3d = new THREE.WebGLRenderer({antialias: true, premultipliedAlpha: false});
    renderer3d.setPixelRatio( 2 );
    renderer3d.autoClear = false;
    updateRendererSize();

    // LOAD FONT
    new THREE.FontLoader().load('fonts/helvetiker_regular.typeface.json', f => font = f);
    font_material = new THREE.MeshPhongMaterial({color: 0x000000});

    // INITIALIZE SCENE
    loader_TEX = new THREE.TextureLoader();
    loader_MESH = new THREE.FBXLoader();
    scene = new THREE.Scene();

    // create skybox
    loadSkybox( "2" );
    // setup scene light
    var light = new THREE.AmbientLight( 0xffffff );
    scene.add(light);
    // initialize camera
    camera = new THREE.PerspectiveCamera(60, viewport_width / viewport_height, 0.1, 10000);
    cameraTop = new THREE.OrthographicCamera( viewport_width/ -8, viewport_width/ 8, viewport_height/ 8, viewport_height/ -8, 1, 1000)
    cameraTop.position.set(0, 31, 0);
    cameraTop.rotation.x = -Math.PI / 2;
    
    // INITIALIZE HUD AND CONTROLS
    mouse = new THREE.Mouse();
    // initializing hud before controls makes it receive events first
    HUD = new THREE.HUD({
        mousedown: [renderer3d.domElement, e => {
            mouse.update(e); // manually update mouse state
            controls.canLock = !(HUD.process(mouse.X, mouse.Y) || HUD.chooseSectorMode);
        }],
        mouseup: [renderer3d.domElement, e => controls.canLock = !HUD.chooseSectorMode],
        mousemove: [renderer3d.domElement, e => {
            // console.log(mouse);
        }]
    });

    HUD.addButton("bChooseSector", "images/button.png", -viewport_width/2 + 10, viewport_height/2 - 10, 0.0, 1.0, (_this) => {
        HUD.chooseSectorMode = !HUD.chooseSectorMode;
    });
    controls = new THREE.CameraControls(camera, renderer3d.domElement);

    // INITIALIZE MODEL AND RUN MAIN LOOP (automatically after model is loaded)
    model = loadModel(MODEL_NAME);
    document.body.appendChild(renderer3d.domElement);
}

function startup() {
    WEBGL.isWebGLAvailable()
        ? init()
        : document.body.appendChild( WEBGL.getWebGLErrorMessage() );
    window.addEventListener('resize', updateRendererSize, false);
}
