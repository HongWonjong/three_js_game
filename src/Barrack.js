import * as THREE from 'three';
import { modelCache } from './ModelCache.js';
import { RobotSoldier } from './RobotSoldier.js';

export class Barrack {
    constructor(scene, world, resources, position, terrain, resourceCluster, game) {
        this.scene = scene;
        this.world = world;
        this.resources = resources;
        this.position = position;
        this.terrain = terrain;
        this.resourceCluster = resourceCluster;
        this.game = game;
        this.mesh = null;
        this.soldiers = [];
        this.maxSoldiers = 4;
        this.spawnInterval = 5;
        this.timeSinceLastSpawn = 0;
        this.isLoading = true;
    }

    async init() {
        console.log('Barrack init called with position:', this.position);

        this.createPlaceholder();
        await this.createBarrack();
        this.isLoading = false;
        await this.spawnSoldiers();
        console.log('Barrack fully initialized with soldiers');
    }

    createPlaceholder() {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: true });
        this.mesh = new THREE.Mesh(geometry, material);
        const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
        this.position.y = terrainHeight;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        console.log('Placeholder Barrack added at:', this.position);
    }

    async createBarrack() {
        let model = modelCache.barrack ? modelCache.barrack.scene : null;
        let size = new THREE.Vector3(0.2, 0.2, 0.2);

        if (this.mesh && this.mesh.geometry && this.mesh.material) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        if (model) {
            this.mesh = model.clone(); // 기본 클론만 사용
            this.mesh.scale.set(0.2, 0.2, 0.2);
            console.log('Using cached Barrack model');
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            boundingBox.getSize(size);
            console.log('Barrack model size:', size);
        } else {
            console.error('Barrack model not loaded in modelCache');
            const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
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

        console.log('Barrack fully loaded and added at:', this.position);
    }

    async spawnSoldiers() {
        const spawnSoldier = async () => {
            if (this.soldiers.length >= this.maxSoldiers) return;

            const spawnOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                0,
                (Math.random() - 0.5) * 2
            );
            const spawnPosition = this.position.clone().add(spawnOffset);
            const terrainHeight = this.terrain.getHeightAt(spawnPosition.x, spawnPosition.z);
            spawnPosition.y = terrainHeight + 0.025;

            const soldier = new RobotSoldier(this.scene, spawnPosition, this.game.player, this.game);
            this.soldiers.push(soldier);
            console.log('Robot soldier spawned at:', spawnPosition);
        };

        for (let i = 0; i < this.maxSoldiers; i++) {
            await new Promise(resolve => requestAnimationFrame(() => {
                spawnSoldier().then(resolve);
            }));
        }
        console.log('Total soldiers spawned:', this.soldiers.length);
    }

    update(delta) {
        if (!this.isLoading) {
            this.timeSinceLastSpawn += delta;
            if (this.timeSinceLastSpawn >= this.spawnInterval && this.soldiers.length < this.maxSoldiers) {
                this.spawnSoldierAsync();
                this.timeSinceLastSpawn = 0;
            }
            this.soldiers.forEach(soldier => soldier.update(delta));
        }
    }

    async spawnSoldierAsync() {
        const spawnOffset = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2
        );
        const spawnPosition = this.position.clone().add(spawnOffset);
        const terrainHeight = this.terrain.getHeightAt(spawnPosition.x, spawnPosition.z);
        spawnPosition.y = terrainHeight + 0.025;

        const soldier = new RobotSoldier(this.scene, spawnPosition, this.game.player, this.game);
        this.soldiers.push(soldier);
        console.log('Robot soldier spawned asynchronously at:', spawnPosition);
    }
}