function loadModel(path) {
    // Ensure path string ends with slash
    if (path[path.length-1] != '/')
        path += '/';

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
            for (let index in result.config.seats) {
                if (index == "default") continue;
                let tex = makeTextSprite(index);
                let sector = new THREE.Sprite(new THREE.SpriteMaterial({map: tex}));
                sector.scale.set(tex.image.width, tex.image.height, 100);
                let seat = result.config.seats[index];
                if (seat.hasOwnProperty("rows"))
                    seat = seat.rows[0];
                sector.position.set(...(seat.origin || seat.position));//.map(x => x * 5), 1);
                sector.callback = () => {
                    console.log("clicked!", index);
                    controls.changeView(index, 1, 1);
                };
                obj.add(sector);
            }
        }
    };


    // Load config
    getJSON(path +'config.json', config => result.config = config);
    // Load model
    new THREE.ObjectLoader().load(path +'model.json', obj => {
        result.object = obj;
        scene.add(result.object);

        if (controls) {
            fitCameraToObject(cameraTop, result.object);
            if (! controls.load())
                controls.changeView(result.config.seats.default);
        }

        if (addSeatToCombobox) {
            for(index in result.config.seats) {
                if (index == "default") continue;
                addSeatToCombobox(index);
            }
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

        result.initSectorsMiniMap(HUD.SectorsOverlay);
    });
    return result;
}