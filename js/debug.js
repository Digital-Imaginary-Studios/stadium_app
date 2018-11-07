var DEBUG = true;

var D2R = (Math.PI / 180);
var R2D = (180 / Math.PI);
var boxGeom = new THREE.BoxGeometry( 0.25, 0.25, 0.25 );

var nieparzyste = true;

function spawnCube(config) {
    var boxMat = [];
    var whiteMat = new THREE.MeshBasicMaterial();
    for (i = 0; i < 5; i++)
        boxMat.push( whiteMat );
    boxMat.push( new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load("face.png")
    }) );
    var cube = new THREE.Mesh(boxGeom, boxMat);
    cube.position.set(...config.position);
    cube.rotation.order = "YXZ";
    cube.rotation.set(...config.rotation);
    scene.add(cube);
}