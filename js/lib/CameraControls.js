CameraControls = function(camera, domElement) {
	domElement.requestPointerLock = domElement.requestPointerLock || domElement.mozRequestPointerLock;
	document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

	// MOUSE CONTROLS
	var onPointerLockChange = e => this.isLocked = (document.pointerLockElement === domElement);
	var onMouseWheel = e => {
		camera.translateZ(e.deltaY * 2 * this.moveSpeed);
	};
	var onMouseUp = e => {
		document.exitPointerLock();
		this.button = -1;
		this.keys = [];
	};
	var onMouseDown = e => {
		this.button = e.button;
		e.preventDefault();
		domElement.requestPointerLock();
	};
	var onMouseMove = e => {
		if (this.isLocked === false) return;
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		
		switch (this.button) {
			case 0:
				camera.rotateY(-movementX * this.lookSpeed);
				camera.rotateX(-movementY * this.lookSpeed);
				camera.rotation.z = 0;
				break;
			case 2:
				camera.translateX(movementX * this.moveSpeed);
				camera.translateY(-movementY * this.moveSpeed);
				break;
			case 1:
				camera.translateX(movementX * this.moveSpeed);
				camera.translateZ(movementY * this.moveSpeed);
				break;
		}
	};

	// KEYBOARD CONTROLS
	var onKeyUp = e => this.keys[e.key.toLowerCase()] = false;
	var onKeyDown = e => this.keys[e.key.toLowerCase()] = true;
	this.update = () => {
		if (this.isLocked === false) return;

		var multiplier = 5;
		this.keys["shift"] && (multiplier *= 4);
		
		this.keys["w"] && camera.translateZ(-multiplier * this.moveSpeed);
		this.keys["s"] && camera.translateZ( multiplier * this.moveSpeed);

		this.keys["a"] && camera.translateX(-multiplier * this.moveSpeed);
		this.keys["d"] && camera.translateX( multiplier * this.moveSpeed);

		this.keys["q"] && (camera.position.y -= multiplier * this.moveSpeed);
		this.keys["e"] && (camera.position.y += multiplier * this.moveSpeed);

		this.save();
	};

	// RECEIVING EVENTS FROM BROWSER
	this.disconnect = () => {
		domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
		domElement.removeEventListener( 'mousedown', onMouseDown, false );
		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		document.removeEventListener( 'keydown', onKeyDown, false );
		document.removeEventListener( 'keyup', onKeyUp, false );
		document.removeEventListener( 'pointerlockchange', onPointerLockChange, false );
		document.removeEventListener( 'mozpointerlockchange', onPointerLockChange, false );
	};
	this.dispose = () => this.disconnect();

	domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	domElement.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'mouseup', onMouseUp, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );
	document.addEventListener( 'pointerlockchange', onPointerLockChange, false );
	document.addEventListener( 'mozpointerlockchange', onPointerLockChange, false );
	
	// INIT
	this.load = () => {
		if (! DEBUG) return false;
		var result = document.cookie.match(new RegExp("cam"+'=([^;]+)'));
		if (result) {
			result = JSON.parse(result[1]);
			camera.position.set(...result.p);
			camera.rotation.set(...result.r, 0);
			this.lookSpeed = result.l || 0.002;
			this.moveSpeed = result.m || 0.1;
			return true;
		}
		return false;
	};
	this.save = () => {
		document.cookie = "cam="+ JSON.stringify({
			"p": [camera.position.x, camera.position.y, camera.position.z],
			"r": [camera.rotation.x, camera.rotation.y],
			"l": this.lookSpeed,
			"m": this.moveSpeed
		});
	};
	this.reset = () => {
		document.cookie = "cam=;";
		this.changeView(model.config.seats.default);
	};
	this.getPos = () => {
		return camera.position;
	};

	this.changeView = (sector,row,col) => {
		var config = model.calculateSeatPosition(sector,row,col,true);
		camera.position.set(...config.position);
		camera.rotation.set(...config.rotation);
	};

	this.isLocked = false;
	this.button = -1;
	this.keys = [];
	this.moveSpeed = 0.1;
	this.lookSpeed = 0.002;
	camera.rotation.set(0, 0, 0);
	camera.rotation.order = "YXZ";
};

CameraControls.prototype = Object.create( THREE.EventDispatcher.prototype );
CameraControls.prototype.constructor = CameraControls;