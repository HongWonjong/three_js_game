import * as THREE from 'three';

console.log('JumpController.js loaded successfully');
console.log('Defining JumpController class...');

export class JumpController {
    constructor(playerMesh, terrain) {
        console.log('JumpController constructor called with playerMesh:', playerMesh, 'and terrain:', terrain);
        this.mesh = playerMesh;
        this.terrain = terrain;
        this.velocityY = 0;
        this.gravity = -0.02;
        this.isGrounded = false;
        this.jumpStrength = 0.5;
        this.keys = {};
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.key.toLowerCase()] = true;
            if (event.key === ' ' && this.isGrounded) {
                this.velocityY = this.jumpStrength;
                this.isGrounded = false;
            }
        });
        document.addEventListener('keyup', (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });
        console.log('JumpController controls set up');
    }

    update() {
        this.velocityY += this.gravity;
        this.mesh.position.y += this.velocityY;

        const terrainHeight = this.terrain.getHeightAt(this.mesh.position.x, this.mesh.position.z);
        if (this.mesh.position.y <= terrainHeight + 0.5) {
            this.mesh.position.y = terrainHeight + 0.5;
            this.velocityY = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
    }
}

console.log('JumpController class defined and exported');