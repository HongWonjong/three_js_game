import * as THREE from 'three';
import { WorkerDrone } from './WorkerDrone.js';

export class CommandCenter {
    constructor(scene, world, resources, position, terrain, resourceCluster, game, modelCache) {
        this.scene = scene;
        this.world = world;
        this.resources = resources;
        this.position = position;
        this.terrain = terrain;
        this.resourceCluster = resourceCluster;
        this.game = game;
        this.drones = [];
        this.mesh = null;
        this.body = null;
        this.isLoading = true;
        this.modelCache = modelCache;
    }

    async init() {
        this.createPlaceholder(); // 먼저 플레이스홀더 생성
        await this.createCommandCenter(); // 그 다음 커맨드 센터 생성
        this.isLoading = false;
        await this.spawnDrones();
        console.log('Command Center fully initialized with drones');
    }

    createPlaceholder() {
        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const material = new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: true });
        this.mesh = new THREE.Mesh(geometry, material);
        const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
        this.position.y = terrainHeight;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        console.log('Placeholder Command Center added at:', this.position);
    }

    async createCommandCenter() {
        let model = this.modelCache.commandCenter ? this.modelCache.commandCenter.scene : null;
        let size = new THREE.Vector3(0.4, 0.4, 0.4);

        // 기존 mesh가 있으면 안전하게 제거
        if (this.mesh && this.mesh.geometry && this.mesh.material) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        if (model) {
            this.mesh = model.clone();
            this.mesh.scale.set(0.4, 0.4, 0.4);
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            boundingBox.getSize(size);
            console.log('Command Center model size:', size);
        } else {
            console.log('Using fallback mesh (cache not available)');
            const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const material = new THREE.MeshBasicMaterial({ color: 0x808080 });
            this.mesh = new THREE.Mesh(geometry, material);
        }

        const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
        this.position.y = terrainHeight;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        this.body = new CANNON.Body({ mass: 0 });
        this.body.addShape(shape);
        this.body.position.copy(this.position);
        this.world.addBody(this.body);

        console.log('Command Center fully loaded and added at:', this.position);
    }

    async spawnDrones() {
        const spawnDrone = async () => {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 30,
                0,
                (Math.random() - 0.5) * 30
            );
            const dronePosition = this.position.clone().add(offset);
            const terrainHeight = this.terrain.getHeightAt(dronePosition.x, dronePosition.z);
            dronePosition.y = terrainHeight + 1;

            const drone = new WorkerDrone(this.scene, this.world, this.terrain, this.resourceCluster, this, this.modelCache);
            await drone.createDrone();
            drone.mesh.position.copy(dronePosition);
            drone.body.position.copy(dronePosition);
            this.drones.push(drone);
            console.log(`Drone spawned at:`, dronePosition);
        };

        for (let i = 0; i < 4; i++) {
            await new Promise(resolve => requestAnimationFrame(() => {
                spawnDrone().then(resolve);
            }));
        }
        console.log('Total drones spawned:', this.drones.length);
    }

    receiveResources(type, amount) {
        if (type === 'wood') {
            this.resources.wood += amount;
        } else if (type === 'stone') {
            this.resources.stone += amount;
        }
        console.log(`Received ${amount} ${type}. Total:`, this.resources);
        this.game.ui.updateUI();
    }

    update(delta) {
        if (!this.isLoading) {
            this.drones.forEach(drone => drone.update(delta));
        }
    }
}