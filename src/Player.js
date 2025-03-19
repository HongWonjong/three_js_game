import * as THREE from 'three';
import { JumpController } from './JumpController.js';
import { Gun } from './Gun.js';

console.log('Player.js loaded successfully');
console.log('JumpController module:', JumpController);
console.log('Gun module:', Gun);
console.log('Defining Player class...');

export class Player {
    constructor(scene, terrain) {
        console.log('Player constructor called with scene:', scene, 'and terrain:', terrain);
        this.scene = scene;
        this.terrain = terrain;
        this.speed = 0.1;
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
        console.log('Player mesh created and added to scene:', this.mesh);
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
            this.mesh.position.add(direction.multiplyScalar(this.speed));
        }

        this.jumpController.update();
        this.gun.update(this.rotationY);
    }
}

console.log('Player class defined and exported');