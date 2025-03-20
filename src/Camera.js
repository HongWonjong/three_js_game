import * as THREE from 'three';

// 전역 AudioListener 선언
export const audioListener = new THREE.AudioListener();

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

        // AudioListener를 카메라에 추가
        this.camera.add(audioListener);
        console.log('AudioListener added to camera (global)');

        // 초기 거리 설정
        this.baseY = 5; // 기본 Y 오프셋
        this.baseZ = -20; // 기본 Z 오프셋
        this.distance = 1.0; // 거리 비율 (1.0: 기본 거리, 0.5: 절반 거리)
        this.minDistance = 0.01; // 최소 거리 비율 (절반)
        this.maxDistance = 0.5; // 최대 거리 비율 (기본)

        // 초기 위치 설정
        this.camera.position.set(0, this.baseY, this.baseZ);
        this.camera.lookAt(0, 0, 0);
        console.log('Camera created, position:', this.camera.position);

        // 마우스 휠 이벤트 리스너 추가
        window.addEventListener('wheel', this.onMouseWheel.bind(this));
    }

    onMouseWheel(event) {
        const delta = event.deltaY * -0.001;
        this.distance -= delta;
        this.distance = THREE.MathUtils.clamp(this.distance, this.minDistance, this.maxDistance);
        console.log('Camera distance adjusted:', this.distance);
    }

    update(playerPosition, rotationY) {
        const yOffset = this.baseY * this.distance;
        const zOffset = this.baseZ * this.distance;

        const offset = new THREE.Vector3(0, yOffset, zOffset)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        const cameraPosition = playerPosition.clone().add(offset);
        
        this.camera.position.copy(cameraPosition);
        this.camera.lookAt(playerPosition);
    }
}

console.log('Camera class defined and exported');