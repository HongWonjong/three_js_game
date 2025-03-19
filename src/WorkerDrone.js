import * as THREE from 'three';
import { WorkerDroneLogic } from './WorkerDroneLogic.js';

export class WorkerDrone {
    constructor(scene, world, terrain, resourceCluster, commandCenter) {
        this.scene = scene;
        this.world = world;
        this.logic = new WorkerDroneLogic(this, world, terrain, resourceCluster, commandCenter);
        this.createDrone();
        console.log('WorkerDrone created with position:', this.mesh.position);
    }

    createDrone() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        this.body = new CANNON.Body({ mass: 1 });
        this.body.addShape(shape);
        this.body.position.copy(this.mesh.position);
        this.body.velocity.set(0, 0, 0);
        this.body.material = new CANNON.Material('droneMaterial');
        this.body.material.friction = 0; // 마찰 0으로 설정
        this.world.addBody(this.body);
        console.log('Drone body added to world:', this.body.position);

        this.createPickaxe();
    }

    createPickaxe() {
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 1.5);
        const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        this.pickaxe = new THREE.Mesh(geometry, material);
        this.pickaxe.position.set(0.8, 0, 0);
        this.mesh.add(this.pickaxe);
        this.swingAngle = 0;
        this.swingSpeed = 0.1;
        console.log('Pickaxe added to drone');
    }

    animatePickaxe() {
        this.swingAngle += this.swingSpeed;
        if (this.swingAngle > Math.PI / 4 || this.swingAngle < -Math.PI / 4) {
            this.swingSpeed *= -1;
        }
        this.pickaxe.rotation.z = this.swingAngle;
    }

    addResourceMesh(type) {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: type === 'wood' ? 0x8B4513 : 0x808080
        });
        this.resourceMesh = new THREE.Mesh(geometry, material);
        this.resourceMesh.position.set(0, 0.8, 0);
        this.mesh.add(this.resourceMesh);
        console.log('Resource mesh added:', type);
    }

    removeResourceMesh() {
        if (this.resourceMesh) {
            this.mesh.remove(this.resourceMesh);
            this.resourceMesh = null;
            console.log('Resource mesh removed');
        }
    }

    update() {
        this.logic.update();
        // 물리 바디와 메시 위치 동기화
        this.mesh.position.copy(this.body.position);
        console.log('Drone mesh position updated to:', this.mesh.position);
    }
}