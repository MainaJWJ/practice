var petalColors = [0xf25346, 0xedeb27, 0x68c3c0];

worldObjectBlueprints.default = {
    'tree': function() {
        this.mesh = new THREE.Object3D();
        var matTreeLeaves = new THREE.MeshPhongMaterial({ color: 0x458248, shading: THREE.FlatShading });
        var geonTreeBase = new THREE.BoxGeometry(10, 20, 10);
        var matTreeBase = new THREE.MeshBasicMaterial({ color: 0x59332e });
        var treeBase = new THREE.Mesh(geonTreeBase, matTreeBase);
        treeBase.castShadow = true;
        treeBase.receiveShadow = true;
        this.mesh.add(treeBase);
        var geomTreeLeaves1 = new THREE.CylinderGeometry(1, 12 * 3, 12 * 3, 4);
        var treeLeaves1 = new THREE.Mesh(geomTreeLeaves1, matTreeLeaves);
        treeLeaves1.castShadow = true;
        treeLeaves1.receiveShadow = true;
        treeLeaves1.position.y = 20;
        this.mesh.add(treeLeaves1);
        var geomTreeLeaves2 = new THREE.CylinderGeometry(1, 9 * 3, 9 * 3, 4);
        var treeLeaves2 = new THREE.Mesh(geomTreeLeaves2, matTreeLeaves);
        treeLeaves2.castShadow = true;
        treeLeaves2.position.y = 40;
        treeLeaves2.receiveShadow = true;
        this.mesh.add(treeLeaves2);
        var geomTreeLeaves3 = new THREE.CylinderGeometry(1, 6 * 3, 6 * 3, 4);
        var treeLeaves3 = new THREE.Mesh(geomTreeLeaves3, matTreeLeaves);
        treeLeaves3.castShadow = true;
        treeLeaves3.position.y = 55;
        treeLeaves3.receiveShadow = true;
        this.mesh.add(treeLeaves3);
    },
    'flower': function() {
        this.mesh = new THREE.Object3D();
        var geomStem = new THREE.BoxGeometry(5, 50, 5, 1, 1, 1);
        var matStem = new THREE.MeshPhongMaterial({ color: 0x458248, shading: THREE.FlatShading });
        var stem = new THREE.Mesh(geomStem, matStem);
        stem.castShadow = false;
        stem.receiveShadow = true;
        this.mesh.add(stem);
        var geomPetalCore = new THREE.BoxGeometry(10, 10, 10, 1, 1, 1);
        var matPetalCore = new THREE.MeshPhongMaterial({ color: 0xedeb27, shading: THREE.FlatShading });
        var petalCore = new THREE.Mesh(geomPetalCore, matPetalCore);
        petalCore.castShadow = false;
        petalCore.receiveShadow = true;
        var petalColor = petalColors[Math.floor(Math.random() * 3)];
        var geomPetal = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
        var matPetal = new THREE.MeshBasicMaterial({ color: petalColor });
        geomPetal.vertices[5].y -= 4;
        geomPetal.vertices[4].y -= 4;
        geomPetal.vertices[7].y += 4;
        geomPetal.vertices[6].y += 4;
        geomPetal.translate(12.5, 0, 3);
        var petals = [];
        for (var i = 0; i < 4; i++) {
            petals[i] = new THREE.Mesh(geomPetal, matPetal);
            petals[i].rotation.z = i * Math.PI / 2;
            petals[i].castShadow = true;
            petals[i].receiveShadow = true;
        }
        petalCore.add(petals[0], petals[1], petals[2], petals[3]);
        petalCore.position.y = 25;
        petalCore.position.z = 3;
        this.mesh.add(petalCore);
    },
    'building': function() {
        this.mesh = new THREE.Object3D();
        var geom = new THREE.BoxGeometry(1, 1, 1);
        var mat = new THREE.MeshPhongMaterial({ color: 0xd8d0d1, shading: THREE.FlatShading });
        var building = new THREE.Mesh(geom, mat);
        building.castShadow = true;
        building.receiveShadow = true;
        this.mesh.add(building);
    }
};