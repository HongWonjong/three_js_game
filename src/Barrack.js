import * as THREE from 'three';
import { modelCache } from './ModelCache.js';

export class Barrack {
    constructor(scene, world, resources, position, terrain, resourceCluster, game) {
        this.scene = scene;
        this.world = world;
        this.resources = resources;
        this.position = position; // 지형 표면 위치
        this.terrain = terrain;
        this.resourceCluster = resourceCluster;
        this.game = game;
        this.mesh = null;
        this.body = null;
    }

    async init() {
        console.log('Barrack init called with position:', this.position);

        // 모델 로드
        if (!modelCache.barrack) {
            console.error('Barrack model not loaded in modelCache');
            const geometry = new THREE.BoxGeometry(1, 1, 1); // 대체 모델
            const material = new THREE.MeshBasicMaterial({ color: 0x808080 });
            this.mesh = new THREE.Mesh(geometry, material);
        } else {
            this.mesh = modelCache.barrack.scene.clone();
            this.mesh.scale.set(0.2, 0.2, 0.2); // 크기 조정
            console.log('Barrack mesh loaded from cache');
        }

        // 위치 설정 (지형 표면에서 1 유닛 위로 띄움)
        const adjustedPosition = this.position.clone();
        adjustedPosition.y += 1; // 1 유닛 띄우기
        this.mesh.position.copy(adjustedPosition);
        this.scene.add(this.mesh);
        console.log('Barrack mesh added to scene at:', this.mesh.position);

        // 물리 바디 설정
        const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1)); // 크기 조정 필요 시 수정
        this.body = new CANNON.Body({
            mass: 0, // 정적 객체
            shape,
            material: new CANNON.Material('buildingMaterial')
        });
        this.body.position.copy(adjustedPosition); // 물리 바디도 동일하게 띄움
        this.world.addBody(this.body);
        console.log('Barrack body added to world at:', this.body.position);
    }

    update(delta) {
        // 나중에 막사 고유 기능 추가 시 사용
    }
}