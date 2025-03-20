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
    constructor(scene, terrain, world, resourceCluster, buildings) {
        console.log('Player constructor called with scene:', scene, 'terrain:', terrain, 'world:', world);
        this.scene = scene;
        this.terrain = terrain;
        this.world = world;
        this.resourceCluster = resourceCluster;
        this.buildings = buildings;
        this.speed = 10;
        this.rotationX = 0; // 위아래 회전
        this.rotationY = 0; // 좌우 회전
        this.keys = {};
        this.createPlayer();
        this.jumpController = new JumpController(this.body, this.terrain);
        this.gun = new Gun(this.scene, this.mesh, this.world, this.terrain, this.resourceCluster, this.buildings);
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

        this.mesh.userData.physicsBody = this.body;
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
                this.rotationY -= event.movementX * sensitivity; // 좌우 회전
                this.rotationX -= event.movementY * sensitivity; // 위아래 회전
                // 위아래 회전 제한 (-60도 ~ 60도, 약 -1.047 ~ 1.047 라디안)
                this.rotationX = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, this.rotationX));

                // 쿼터니언으로 회전 계산
                const quaternion = new THREE.Quaternion();
                quaternion.setFromEuler(new THREE.Euler(this.rotationX, this.rotationY, 0, 'YXZ'));

                this.mesh.quaternion.copy(quaternion);
                this.body.quaternion.copy(quaternion);
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
            this.body.velocity.x = 0;
            this.body.velocity.z = 0;
        }

        this.jumpController.update();
        this.gun.update();

        this.mesh.position.copy(this.body.position);
    }
}

console.log('Player class defined and exported');