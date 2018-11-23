var sectors = {
    getLastSeatIndex: sector => {

        return [100,100]; // [row, col]
    },

    calculateSectorSize: sector => {
        var A = model.calculateSeatPosition(sector, 0,0, false);                         // 0,0 -- first index
        var B = model.calculateSeatPosition(sector, ...sectors.getLastSeatIndex(sector), false); // getLastSeatIndex returns array[row,col]
        return A.distanceTo(B);
    },

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
    }
};