function loadModel(path) {
    var parseConfig = () => {
        var loadTextures = textures => {
            var result = {};
            for (var id in textures) {
                var tex = loader_TEX.load(path + textures[id]);
                // tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.LinearMipMapLinearFilter;
                result[id] = tex;
            }
            return result;
        };
        var loadMaterials = (textures, materials) => {
            var result = {};
            for (var id in materials) {
                var values = {
                    side: THREE.DoubleSide,
                    color: 0xffffff
                };
                value = materials[id];
                switch (value.substr(0,1)) {
                    case '#':
                        values.color = parseInt(value.substr(1,6), 16);
                        break;
                    case '!':
                        values.color = values.emissive = parseInt(value.substr(1,6), 16);
                        break;
                    default:
                        values.map = textures[value];
                        values.transparent = true;
                        values.opacity = 1.0;
                        values.alphaTest = 0.5;
                        break;
                }
                result[id] = values;
            }
            return result;
        };
    
        var config = {};
        getJSON(path + "data.json", toParse => {
            config.textures = loadTextures(toParse.textures);
            config.materials = loadMaterials(config.textures, toParse.materials);
            if (toParse.hasOwnProperty("camera_offset"))
                config.camera_offset = toParse.camera_offset;
            config.seats = toParse.seats;
            config.test = toParse.test;
        });
        return config;
    }

    if (path[path.length-1] != '/')
        path += '/';

    var setupMaterial = (material, config) => {
        if (Array.isArray(material))
            material.forEach( child => setupMaterial(child, config) );
        else
            if (config.hasOwnProperty(material.name))
                material.setValues( config[material.name] );
    };
    
    // initialize
    var model = {};
    model.calculateSeatPosition = (sector,row,col,lookAt0) => {
		var O3D = new THREE.Object3D();
		lookAt0 = lookAt0 || false;
		// get config, calculate row & col
		var config = (typeof(sector) == "object") ? sector : model.config.seats[sector];
		row = row || 0;
		col = col - 1 || 0;
		if (config.hasOwnProperty("rows")) {
			for (var i = 0; i < config.max; i++) {
				if (row <= config.rows[i].max.rows) {
					config = config.rows[i];
					break;
				}
				row = row - config.rows[i].max.rows;
			}
		}
		row -= 1;
		// set base position
		if (config.hasOwnProperty("position") || config.hasOwnProperty("origin"))
			O3D.position.set(...(config.position || config.origin));
		// set base rotation
		O3D.rotation.order = "YXZ";
		O3D.rotation.set(0,0,0);
		if (config.hasOwnProperty("rotation"))
            O3D.rotation.set(...config.rotation.inverse(), 0);
		// offset if need be
		if (model.config.hasOwnProperty("camera_offset"))
			O3D.translateOnAxis(new THREE.Vector3(...model.config.camera_offset), 1);
		if (config.hasOwnProperty("max") && config.hasOwnProperty("offset")) {
			col = col.clamp(0, config.max.cols-1);
			row = row.clamp(0, config.max.rows-1);
			O3D.translateX(config.offset[0] * col);
			O3D.translateY(config.offset[1] * row);
			O3D.translateZ(config.offset[2] * row);
		}
		// look at origin
		if (lookAt0) {
			O3D.lookAt(0,0,0);
			O3D.rotateY(Math.PI);
		}
		return {
			position: O3D.position.toArray(),
			rotation: O3D.rotation.toArray().slice(0,3)
		}
    };

    // Load config
    model.config = parseConfig(path);
    // Load model
    loader_FBX.load(path +'data.fbx', object => {
        object.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                setupMaterial(child.material, model.config.materials);
            }
        });
        model.object = object;
        model.object.castShadow = true;
        model.object.receiveShadow = true;
        scene.add(model.object);

        if (! controls.load())
            controls.changeView(model.config.seats.default);

        if (addSeatToCombobox) {
            for(index in model.config.seats) {
                if (index == "default") continue;
                addSeatToCombobox(index);
            }
        }

        if (model.config.hasOwnProperty("test")) {
            var spawnCubes = (sector, seat, actualRow) => {
                actualRow = actualRow || 0;
                for (var row = 0; row <= seat.max.rows; row++)
                    for (var col = 0; col <= seat.max.cols; col++)
                        spawnCube( model.calculateSeatPosition(sector, actualRow + row, col, false) );
            }
            for (index in model.config.test) {
                index = model.config.test[index];
                var seat = model.config.seats[index];
                if (seat.hasOwnProperty("rows")) {
                    var actualRow = 0;
                    for (var i = 0; i < seat.max; i++) {
                        spawnCubes(index, seat.rows[i], actualRow);
                        actualRow += seat.rows[i].max.rows;
                    }
                } else {
                    spawnCubes(index, seat);
                }
            }
        }

        HUD.initSectorsMiniMap(model.config.seats);
    });
    return model;
}