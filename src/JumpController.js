import * as THREE from 'three';

console.log('JumpController.js loaded successfully');
console.log('Defining JumpController class...');

export class JumpController {
    constructor(playerBody, terrain) {
        console.log('JumpController constructor called with playerBody:', playerBody, 'and terrain:', terrain);
        this.body = playerBody; // 물리 바디 사용
        this.terrain = terrain;
        this.isGrounded = false;
        this.jumpStrength = 5; // 물리 엔진 기준 점프 힘 (조정 필요)
        this.keys = {};
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.key.toLowerCase()] = true;
            if (event.key === ' ' && this.isGrounded) {
                // 물리 바디에 점프 힘 적용
                this.body.velocity.y = this.jumpStrength;
                this.isGrounded = false;
            }
        });
        document.addEventListener('keyup', (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });
        console.log('JumpController controls set up');
    }

    update() {
        // 지형 높이 계산
        const terrainHeight = this.terrain.getHeightAt(this.body.position.x, this.body.position.z);
        const playerBottom = this.body.position.y - 0.5; // Sphere 반지름 0.5 고려

        // 지형과 충돌 체크
        if (playerBottom <= terrainHeight) {
            this.body.position.y = terrainHeight + 0.5;
            this.body.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
    }
}

console.log('JumpController class defined and exported');