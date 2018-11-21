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
        //*
        var loadMaterials = (textures, configs) => {
            var result = {};
            var material = {};
            for (var id in configs) {
                material = {
                    side: THREE.DoubleSide,
                    color: 0xffffff,
                    envMap: scene.background,
                    reflectivity: 0.2,
                    name: id
                };
                let config = configs[id];
                for (var option in config) {
                    let value = config[option];
                    switch (option) {
                        case 'map':
                            if (textures.hasOwnProperty(value)) {
                                material.map = textures[value];
                                material.transparent = true;
                                material.opacity = 1.0;
                                material.alphaTest = 0.5;
                                console.log(id, "texture set");
                            }
                            break;

                        case 'color':
                            material.color = parseInt(value, 16);
                            break;

                        case 'emissive':
                            material.emissive = parseInt(value, 16);
                            break;
                        
                        default:
                            material[option] = config[option];
                            break;
                    }
                }
                result[id] = new THREE.MeshPhongMaterial(material);
            }
            return result;
        };
        /*/
        var loadMaterials = (textures, materials) => {
            var result = {};
            for (var id in materials) {
                var config = {
                    side: THREE.DoubleSide,
                    color: 0xffffff,
                    envMap: scene.background,
                    name: id
                };
                value = materials[id];
                switch (value.substr(0,1)) {
                    case '#':
                        config.color = parseInt(value.substr(1,6), 16);
                        break;
                    case '!':
                        config.color = config.emissive = parseInt(value.substr(1,6), 16);
                        break;
                    default:
                        config.map = textures[value];
                        config.transparent = true;
                        config.opacity = 1.0;
                        config.alphaTest = 0.5;
                        break;
                }
                result[id] = new THREE.MeshPhongMaterial(config);
            }
            return result;
        };
        //*/
    
        var config = {};
        getJSON(path + "data.json", toParse => {
            config.textures = loadTextures(toParse.textures);
            config.materials = loadMaterials(config.textures, toParse.materials_test);
            // config.materials = loadMaterials(config.textures, toParse.materials);
            if (toParse.hasOwnProperty("camera_offset"))
                config.camera_offset = toParse.camera_offset;
            config.seats = toParse.seats;
            config.test = toParse.test;
        });
        return config;
    }

    if (path[path.length-1] != '/')
        path += '/';

    var applyMaterials = (material, config) => {
        if (Array.isArray(material))
            material.forEach( child => applyMaterials(child, config) );
        else
            if (config.hasOwnProperty(material.name))
                material = config[material.name];
    };
    
    // initialize
    var model = {
        config: {},
        calculateSeatPosition: (sector,row,col,lookAt0) => {
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
        },

        initSectorsMiniMap: (obj) => {
            function makeTextSprite( message, parameters ){
                if ( parameters === undefined ) parameters = {};
                var fontface = parameters.hasOwnProperty("fontface") ? 
                    parameters["fontface"] : "Arial";
                var fontsize = parameters.hasOwnProperty("fontsize") ? 
                    parameters["fontsize"] : 40;
                var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
                    parameters["borderThickness"] : 5;
        
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                context.font = "Bold " + fontsize + "px " + fontface;

                // canvas.width = context.measureText( message ).width;
                // canvas.height = fontsize * 1.5;
        
                // text color
                context.fillStyle = "rgba(255, 0, 0, 1.0)";
                context.fillText( message, borderThickness, fontsize + borderThickness);
        
                // canvas contents will be used for a texture
                var texture = new THREE.Texture(canvas) 
                texture.needsUpdate = true;
                return texture;
            }

            for (let i = obj.children.length - 1; i >= 0; i--)
                obj.remove(obj.children[i]);
            for (let index in model.config.seats) {
                if (index == "default") continue;
                let tex = makeTextSprite(index);
                let sector = new THREE.Sprite(new THREE.SpriteMaterial({map: tex}));
                sector.scale.set(tex.image.width, tex.image.height, 100);
                console.log(index);
                sector.position.set(...(model.config.seats[index].origin || model.config.seats[index].position));//.map(x => x * 5), 1);
                sector.callback = () => {
                    console.log("clicked!", index);
                    controls.changeView(index, 1, 1);
                };
                obj.add(sector);
            }
        }
    };


    // Load config
    model.config = parseConfig(path);
    // Load model
    loader_MESH.load(path +'data.fbx', obj => {
        obj.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                applyMaterials(child.material, model.config.materials);
            }
        });
        model.object = obj;
        for (let index = 0; index < model.object.children[0].material.length; index++) {
            let material = model.object.children[0].material[index];
            if (model.config.materials.hasOwnProperty(material.name))
                model.object.children[0].material[index] = model.config.materials[material.name];
        }
        model.object.castShadow = true;
        model.object.receiveShadow = true;
        scene.add(model.object);

        if (controls) {
            fitCameraToObject(controls.camera, model.object);
            if (! controls.load())
                controls.changeView(model.config.seats.default);
        }


        if (addSeatToCombobox) {
            for(index in model.config.seats) {
                if (index == "default") continue;
                addSeatToCombobox(index);
            }
        }

        // if (model.config.hasOwnProperty("test")) {
        //     var spawnCubes = (sector, seat, actualRow) => {
        //         actualRow = actualRow || 0;
        //         for (var row = 0; row <= seat.max.rows; row++)
        //             for (var col = 0; col <= seat.max.cols; col++)
        //                 spawnCube( model.calculateSeatPosition(sector, actualRow + row, col, false) );
        //     }
        //     for (index in model.config.test) {
        //         index = model.config.test[index];
        //         var seat = model.config.seats[index];
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

        model.initSectorsMiniMap(bSectors);
    });
    return model;
}