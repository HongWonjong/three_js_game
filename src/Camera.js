import * as THREE from 'three';

console.log('Camera.js loaded successfully');
console.log('Defining Camera class...');

export class Camera {
    constructor(scene) {
        console.log('Camera constructor called with scene:', scene);
        this.camera = new THREE.PerspectiveCamera(
            90,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // 초기 거리 설정
        this.baseY = 20; // 기본 Y 오프셋
        this.baseZ = -30; // 기본 Z 오프셋
        this.distance = 1.0; // 거리 비율 (1.0: 기본 거리, 0.5: 절반 거리)
        this.minDistance = 0.3; // 최소 거리 비율 (절반)
        this.maxDistance = 1.0; // 최대 거리 비율 (기본)

        // 초기 위치 설정
        this.camera.position.set(0, this.baseY, this.baseZ);
        this.camera.lookAt(0, 0, 0);
        console.log('Camera created, position:', this.camera.position);

        // 마우스 휠 이벤트 리스너 추가
        window.addEventListener('wheel', this.onMouseWheel.bind(this));
    }

    onMouseWheel(event) {
        // 마우스 휠 방향에 따라 거리 비율 조정
        const delta = event.deltaY * -0.001;
        this.distance -= delta;
        this.distance = THREE.MathUtils.clamp(this.distance, this.minDistance, this.maxDistance);
        console.log('Camera distance adjusted:', this.distance);
    }

    update(playerPosition, rotationY) {
        // 거리 비율에 따라 Y, Z 오프셋 계산 (비율 유지)
        const yOffset = this.baseY * this.distance;
        const zOffset = this.baseZ * this.distance;

        // 오프셋 설정
        const offset = new THREE.Vector3(0, yOffset, zOffset)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        const cameraPosition = playerPosition.clone().add(offset);
        
        this.camera.position.copy(cameraPosition);

        // 플레이어를 정 중앙에 위치시키도록 조정
        this.camera.lookAt(playerPosition);
    }
}

console.log('Camera class defined and exported');