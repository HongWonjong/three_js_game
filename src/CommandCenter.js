import * as THREE from 'three';
import { WorkerDrone } from './WorkerDrone.js';

export class CommandCenter {
    constructor(scene, world, resources, position, terrain, resourceCluster, game) {
        this.scene = scene;
        this.world = world;
        this.resources = resources; // Game.resources 참조
        this.position = position;
        this.terrain = terrain;
        this.resourceCluster = resourceCluster;
        this.game = game; // Game 인스턴스 참조 추가
        this.drones = [];
        this.createCommandCenter();
        this.spawnDrones();
    }

    createCommandCenter() {
        const geometry = new THREE.BoxGeometry(5, 5, 5);
        const material = new THREE.MeshBasicMaterial({ color: 0x808080 });
        this.mesh = new THREE.Mesh(geometry, material);

        const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
        this.position.y = terrainHeight + 2.5;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 2.5));
        this.body = new CANNON.Body({ mass: 0 });
        this.body.addShape(shape);
        this.body.position.copy(this.position);
        this.world.addBody(this.body);

        console.log('Command Center created at:', this.position);
    }

    spawnDrones() {
        for (let i = 0; i < 4; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                0,
                (Math.random() - 0.5) * 20
            );
            const dronePosition = this.position.clone().add(offset);
            const terrainHeight = this.terrain.getHeightAt(dronePosition.x, dronePosition.z);
            dronePosition.y = terrainHeight + 1;

            const drone = new WorkerDrone(this.scene, this.world, this.terrain, this.resourceCluster, this);
            drone.mesh.position.copy(dronePosition);
            drone.body.position.copy(dronePosition);
            this.drones.push(drone);
            console.log(`Drone ${i + 1} spawned at:`, dronePosition);
        }
    }

    receiveResources(type, amount) {
        if (type === 'wood') {
            this.resources.wood += amount;
        } else if (type === 'stone') {
            this.resources.stone += amount;
        }
        console.log(`Received ${amount} ${type}. Total:`, this.resources);
        this.game.ui.updateUI(); // UI 업데이트 호출
    }

    update() {
        this.drones.forEach(drone => drone.update());
    }
}