import * as THREE from 'three';

console.log('JumpController.js loaded successfully');
console.log('Defining JumpController class...');

export class JumpController {
    constructor(playerBody, terrain) {
        console.log('JumpController constructor called with playerBody:', playerBody, 'and terrain:', terrain);
        this.body = playerBody;
        this.terrain = terrain;
        this.isGrounded = false;
        this.jumpStrength = 10;
        this.keys = {};
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.key.toLowerCase()] = true;
            if (event.key === ' ' && this.isGrounded) {
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
        // Trimesh는 물리 엔진이 충돌을 처리하므로, 지형 높이 조정 불필요
        // isGrounded는 물리 엔진의 충돌 이벤트를 통해 설정
        // 여기서는 단순히 점프 상태만 관리
        if (this.body.velocity.y < -0.1) {
            this.isGrounded = false; // 떨어지는 중
        }
    }

    setGrounded(isGrounded) {
        this.isGrounded = isGrounded;
    }
}

console.log('JumpController class defined and exported');