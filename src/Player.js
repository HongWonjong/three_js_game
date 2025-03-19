import * as THREE from 'three';
import { JumpController } from './JumpController.js';
import { Gun } from './Gun.js';

console.log('Player.js loaded successfully');
console.log('JumpController module:', JumpController);
console.log('Gun module:', Gun);
console.log('Defining Player class...');

const CANNON = window.CANNON;
console.log('CANNON:', CANNON);

export class Player {
    constructor(scene, terrain, world) {
        console.log('Player constructor called with scene:', scene, 'and terrain:', terrain, 'and world:', world);
        this.scene = scene;
        this.terrain = terrain;
        this.world = world;
        this.speed = 10;
        this.rotationY = 0;
        this.keys = {};
        this.createPlayer();
        this.jumpController = new JumpController(this.mesh, this.terrain);
        this.gun = new Gun(this.scene, this.mesh);
        this.setupControls();
    }

    createPlayer() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0.5, 0);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        const playerShape = new CANNON.Sphere(0.5);
        this.body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(0, 0.5, 0),
            shape: playerShape,
            material: new CANNON.Material('playerMaterial')
        });
        this.world.addBody(this.body);

        console.log('Player mesh and body created:', this.mesh, this.body);
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.key.toLowerCase()] = true;
        });
        document.addEventListener('keyup', (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });

        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body) {
                const sensitivity = 0.002;
                this.rotationY -= event.movementX * sensitivity;
                this.mesh.rotation.y = this.rotationY;
                this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.rotationY);
            }
        });

        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) {
                console.log('Pointer lock activated');
            } else {
                console.log('Pointer lock deactivated');
            }
        });

        console.log('Player controls set up');
    }

    update() {
        const direction = new THREE.Vector3();

        if (this.keys['w']) { direction.z += 1; }
        if (this.keys['s']) { direction.z -= 1; }
        if (this.keys['a']) { direction.x += 1; }
        if (this.keys['d']) { direction.x -= 1; }

        if (direction.length() > 0) {
            direction.normalize();
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
            const velocity = direction.multiplyScalar(this.speed);
            this.body.velocity.set(velocity.x, this.body.velocity.y, velocity.z);
        } else {
            this.body.velocity.x *= 0.9;
            this.body.velocity.z *= 0.9;
        }

        // 회전 제한 (최대 80도)
        const maxAngle = 10 * (Math.PI / 180); // 80도를 라디안으로 변환 (약 1.396)
        const quaternion = this.body.quaternion;

        // 쿼터니언에서 오일러 각도로 변환
        const euler = new CANNON.Vec3();
        quaternion.toEuler(euler);

        // X축과 Z축 회전 제한
        euler.x = Math.max(-maxAngle, Math.min(maxAngle, euler.x));
        euler.z = Math.max(-maxAngle, Math.min(maxAngle, euler.z));

        // Y축 회전은 유지 (마우스 회전)
        euler.y = this.rotationY;

        // 제한된 각도로 쿼터니언 재설정
        quaternion.setFromEuler(euler.x, euler.y, euler.z);

        this.jumpController.update();
        this.gun.update(this.rotationY);

        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
}

console.log('Player class defined and exported');