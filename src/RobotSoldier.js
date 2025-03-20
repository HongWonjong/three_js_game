import * as THREE from 'three';
import { modelCache } from './ModelCache.js';
import { RobotSoldierLogic } from './RobotSoldierLogic.js';

// 모든 로봇 솔저를 저장하는 배열 (클래스 외부에서 관리하거나, 게임 객체에 추가할 수도 있음)
const allSoldiers = [];

export class RobotSoldier {
    constructor(scene, position, player, game) {
        this.scene = scene;
        this.position = position.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            0,
            (Math.random() - 0.5) * 20
        ));
        this.player = player;
        this.game = game;
        this.mesh = null;
        this.body = null;
        this.debugMesh = null;
        this.speed = 3;
        this.logic = new RobotSoldierLogic(this, game.world, player, allSoldiers); // 모든 솔저 배열 전달
        this.init();
        allSoldiers.push(this); // 생성 시 배열에 추가
    }

    init() {
        const CANNON = window.CANNON;

        let size;
        if (modelCache.robotSoldier && modelCache.robotSoldier.scene) {
            this.mesh = modelCache.robotSoldier.scene.clone();
            this.mesh.scale.set(0.2, 0.2, 0.2);
            console.log('Using cached RobotSoldier model');
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            size = new THREE.Vector3();
            boundingBox.getSize(size);
            console.log('RobotSoldier model size (scaled):', size);
        } else {
            console.error('RobotSoldier model not found in cache, using fallback');
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.mesh = new THREE.Mesh(geometry, material);
            size = new THREE.Vector3(1, 1, 1);
        }

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        this.body = new CANNON.Body({
            mass: 0.1,
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
        const debugMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true
        });
        this.debugMesh = new THREE.Mesh(debugGeometry, debugMaterial);
        this.debugMesh.position.copy(this.body.position);
        this.scene.add(this.debugMesh);
    }

    update(delta) {
        if (!this.mesh || !this.player || !this.body || !this.debugMesh) return;

        this.logic.update();

        this.mesh.position.copy(this.body.position);
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

        console.log('RobotSoldier position:', this.mesh.position, 'Velocity:', this.body.velocity);
        console.log('DebugMesh position:', this.debugMesh.position);
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.debugMesh) {
            this.scene.remove(this.debugMesh);
        }
        if (this.body) {
            this.game.world.removeBody(this.body);
        }
        // 배열에서 제거
        const index = allSoldiers.indexOf(this);
        if (index !== -1) {
            allSoldiers.splice(index, 1);
        }
    }
}