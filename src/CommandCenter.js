import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { WorkerDrone } from './WorkerDrone.js';

export class CommandCenter {
    constructor(scene, world, resources, position, terrain, resourceCluster, game) {
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

        // 플레이스홀더 생성
        this.createPlaceholder();
        // 비동기 초기화 시작
        this.init().catch(error => console.error('CommandCenter init failed:', error));
    }

    async init() {
        await this.createCommandCenter();
        this.isLoading = false; // 로딩 완료
        this.spawnDrones(); // 로딩 완료 후 드론 생성
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
        const loader = new GLTFLoader();
        let model;
        let size = new THREE.Vector3(0.4, 0.4, 0.4);

        try {
            console.log('Loading Command Center model...');
            model = await new Promise((resolve, reject) => {
                loader.load(
                    '../assets/buildings/command_center/command_center.gltf',
                    (gltf) => resolve(gltf.scene),
                    (progress) => console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%'),
                    (error) => reject(error)
                );
            });
        } catch (error) {
            console.error('Failed to load Command Center model:', error);
        }

        // 플레이스홀더 제거
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        if (model) {
            this.mesh = model;
            this.mesh.scale.set(0.4, 0.4, 0.4);
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            boundingBox.getSize(size);
            console.log('Command Center model size:', size);
        } else {
            console.log('Using fallback mesh');
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

    update() {
        if (!this.isLoading) {
            this.drones.forEach(drone => drone.update());
        }
    }
}