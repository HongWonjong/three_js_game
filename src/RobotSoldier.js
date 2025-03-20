import * as THREE from 'three';
import { modelCache } from './ModelCache.js';
import { RobotSoldierLogic } from './RobotSoldierLogic.js';
import { RobotGun } from './RobotGun.js';

const allSoldiers = [];

export class RobotSoldier {
    constructor(scene, position, player, game) {
        this.scene = scene;
        this.position = position.clone();
        this.player = player;
        this.game = game;
        this.mesh = null;
        this.body = null;
        this.debugMesh = null;
        this.speed = 3;
        this.logic = null;
        this.modelOffsetY = 0;
        this.gun = null; // 총 추가
        allSoldiers.push(this);
    }

    async init() {
        const CANNON = window.CANNON;

        console.log('Initializing RobotSoldier at:', this.position);
        if (!modelCache.workerDrone) {
            console.log('Waiting for WorkerDrone model to load...');
            await modelCache.loadModels();
        }

        let size;
        if (modelCache.workerDrone && modelCache.workerDrone.scene) {
            this.mesh = modelCache.workerDrone.scene.clone();
            this.mesh.scale.set(1.0, 1.0, 1.0);
            this.mesh.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x1a1a1a,
                            metalness: 0.8,
                            roughness: 0.4
                        });
                    } else {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x1a1a1a,
                            metalness: 0.8,
                            roughness: 0.4
                        });
                    }
                }
            });
            console.log('Using cached WorkerDrone model for RobotSoldier with dark color');
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            size = new THREE.Vector3();
            boundingBox.getSize(size);
            console.log('RobotSoldier model size (scaled):', size);

            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            this.modelOffsetY = -center.y + (size.y / 2);
            console.log('Model offset Y calculated:', this.modelOffsetY);
        } else {
            console.error('WorkerDrone model not found in cache, using fallback');
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.mesh = new THREE.Mesh(geometry, material);
            size = new THREE.Vector3(1, 1, 1);
            this.modelOffsetY = 0;
        }

        const terrainHeight = this.game.terrain.getHeightAt(this.position.x, this.position.z);
        this.position.y = terrainHeight + (size.y / 2);
        this.bodyPositionY = this.position.y;
        this.mesh.position.set(this.position.x, this.position.y + this.modelOffsetY, this.position.z);
        this.scene.add(this.mesh);
        console.log('RobotSoldier mesh added at:', this.mesh.position);

        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        this.body = new CANNON.Body({
            mass: 1.0,
            position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z),
            shape: shape
        });
        this.body.material = new CANNON.Material('soldierMaterial');
        this.body.material.friction = 0;
        this.body.linearDamping = 0.1;
        this.body.fixedRotation = true;
        this.body.updateMassProperties();
        this.game.world.addBody(this.body);

        const debugGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        this.debugMesh = new THREE.Mesh(debugGeometry, debugMaterial);
        this.debugMesh.position.copy(this.body.position);
        this.scene.add(this.debugMesh);

        this.logic = new RobotSoldierLogic(this, this.game.world, this.player, allSoldiers);

        // 총 추가
        this.gun = new RobotGun(this.scene, this.mesh);
        await this.gun.createGun();
        console.log('RobotSoldier fully initialized with gun');
    }

    update(delta) {
        if (!this.mesh || !this.player || !this.body || !this.debugMesh || !this.logic || !this.gun) return;

        this.logic.update();

        // 제공된 높이 설정 유지
        this.mesh.position.set(
            this.body.position.x,
            this.body.position.y - 2, // 사용자가 설정한 높이 그대로 유지
            this.body.position.z
        );
        this.debugMesh.position.copy(this.body.position);

        const direction = new THREE.Vector3(
            this.player.mesh.position.x - this.body.position.x,
            0,
            this.player.mesh.position.z - this.body.position.z
        ).normalize();
        const speed = this.body.velocity.length();
        if (speed > 0.1) {
            const angle = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.set(0, angle, 0);
            this.debugMesh.rotation.set(0, angle, 0);
        }

        this.gun.update();
    }

    destroy() {
        if (this.mesh) this.scene.remove(this.mesh);
        if (this.debugMesh) this.scene.remove(this.debugMesh);
        if (this.body) this.game.world.removeBody(this.body);
        const index = allSoldiers.indexOf(this);
        if (index !== -1) allSoldiers.splice(index, 1);
    }

    static async create(scene, position, player, game) {
        const soldier = new RobotSoldier(scene, position, player, game);
        await soldier.init();
        return soldier;
    }
}