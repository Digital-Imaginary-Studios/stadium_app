function loadModel(path) {
    // Ensure path string ends with slash
    if (path[path.length-1] != '/')
        path += '/';

    var parseConfig = config_path => {
        var loadTextures = textures => {
            var result = {};
            for (var id in textures) {
                var tex = loader_TEX.load(path + textures[id]);
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.LinearMipMapLinearFilter;
                result[id] = tex;
            }
            return result;
        };
        var loadMaterials = (textures, materials) => {
            var result = {};
            for (let id in materials) {
                let config = {
                    side: THREE.DoubleSide,
                    envMap: scene.background,
                    name: id,
                    metalness: 0,
                    roughness: 1
                };
                let material = new THREE.MeshStandardMaterial(config);
                let toParse = materials[id];
                for (let index in toParse)
                    switch (index) {
                        case 'color':
                            material.color.setHex(parseInt(toParse[index], 16));
                            break;
                        case 'emissive':
                            material.emissive = parseInt(toParse[index], 16);
                            break;
                        case 'map':
                            material.map = textures[toParse[index]];
                            material.transparent = true;
                            material.opacity = 1.0;
                            material.alphaTest = 0.5;
                            break;
                        default:
                            if (material.hasOwnProperty(index))
                                material[index] = toParse[index];
                            break;
                    }
                material.needsUpdate = true;
                result[id] = material;
            }
            return result;
        };
    
        var config = {};
        getJSON(config_path, toParse => {
            config.textures = loadTextures(toParse.textures);
            config.materials = loadMaterials(config.textures, toParse.materials);
            delete toParse.textures;
            delete toParse.materials;
            for (let index in toParse) 
                config[index] = toParse[index];
        });
        return config;
    }



    // initialize
    var result = {
        config: {},
        calculateSeatPosition: (sector,row,col,lookAt0) => {
            var O3D = new THREE.Object3D();
            lookAt0 = lookAt0 || false;
            // get config, calculate row & col
            var config = (typeof(sector) == "object") ? sector : result.config.seats[sector];
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
            if (result.config.hasOwnProperty("camera_offset"))
                O3D.translateOnAxis(new THREE.Vector3(...result.config.camera_offset), 1);
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
        },

        
        getLastSeatIndex: sector => {
            return [100,100]; // [row, col]
        },

        calculateSectorSize: sector => {
            var A = result.calculateSeatPosition(sector, 0,0, false);                         // 0,0 -- first index
            var B = result.calculateSeatPosition(sector, ...result.getLastSeatIndex(sector), false); // getLastSeatIndex returns array[row,col]
            A = new THREE.Vector3(...A.position);
            B = new THREE.Vector3(...B.position);
            A.lerp(B, 0.5);
            return [A.x, A.z];
        },

        initSectorsMiniMap: (obj, seats) => {
            for (let i = obj.children.length - 1; i >= 0; i--)
                obj.remove(obj.children[i]);
            // var merged_geometry = new THREE.Geometry();
            for (let index in seats) {
                if (index == "default" || index == seats["default"]) continue;

                let text_geometry = new THREE.TextGeometry(index, {
                    font: font,
                    size: 3,
                    height: 1,
                    bevelEnabled: false
                });
				text_geometry.computeBoundingBox();
                text_geometry.translate(-text_geometry.boundingBox.max.x / 2, -text_geometry.boundingBox.max.y / 2, 0);

                let textMesh = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry(text_geometry), font_material);
                textMesh.rotation.x = -Math.PI / 2;
                
                if (seats[index].hasOwnProperty("sector_center"))
                    position = seats[index].sector_center;
                else
                    position = result.calculateSectorSize(index);
                console.log(index, position);
                textMesh.position.set(position[0], 1, position[1]);
                textMesh.position.y = 1;
                obj.add(textMesh);
                // text_geometry.translate(-position[0]/100, position[2]/100, 0);

                // merged_geometry.merge(text_geometry);
            }
            // var textMesh = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry(merged_geometry), font_material);
            // textMesh.position.set(0, 1, 0);
            // textMesh.rotation.x = -Math.PI / 2;
            // obj.add(textMesh);
        }
    };


    var prepareMaterial = (material, config) => {
        if (Array.isArray(material)) {
            for (let index in material)
                material[index] = prepareMaterial(material[index], config);
        } else {
            if (config.hasOwnProperty(material.name)) {
                material = config[material.name];
            }
        }
        return material;
    };


    // Load config
    result.config = parseConfig(path +'config.json');
    // Load model
    loader_MESH.load(path +'model.fbx', obj => {
        obj.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = prepareMaterial(child.material, result.config.materials);
            }
        });
        result.object = obj;
        scene.add(result.object);

        if (controls) {
            fitCameraToObject(cameraTop, result.object);
            if (! controls.load())
                controls.changeView(result.config.seats.default);
        }

        // if (result.config.hasOwnProperty("test")) {
        //     var spawnCubes = (sector, seat, actualRow) => {
        //         actualRow = actualRow || 0;
        //         for (var row = 0; row <= seat.max.rows; row++)
        //             for (var col = 0; col <= seat.max.cols; col++)
        //                 spawnCube( result.calculateSeatPosition(sector, actualRow + row, col, false) );
        //     }
        //     for (index in result.config.test) {
        //         index = result.config.test[index];
        //         var seat = result.config.seats[index];
        //         if (seat.hasOwnProperty("rows")) {
        //             var actualRow = 0;
        //             for (var i = 0; i < seat.max; i++) {
        //                 spawnCubes(index, seat.rows[i], actualRow);
        //                 actualRow += seat.rows[i].max.rows;
        //             }
        //         } else {
        //             spawnCubes(index, seat);
        //         }
        //     }
        // }

        result.initSectorsMiniMap(HUD.SectorsOverlay, model.config.seats);

        // Run main loop
        update();
    });
    return result;
}