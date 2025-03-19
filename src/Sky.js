import * as THREE from 'three';

console.log('Sky.js loaded successfully');
console.log('Defining Sky class...');

export class Sky {
    constructor(scene) {
        console.log('Sky constructor called with scene:', scene);
        this.scene = scene;
        this.clouds = [];
        this.initSky();
    }

    initSky() {
        // 하늘색 배경 설정
        this.scene.background = new THREE.Color(0x87CEEB); // 하늘색 (#87CEEB)
        console.log('Sky background set to sky blue');

        // 사각형 구름 생성
        this.addClouds();
    }

    addClouds() {
        const cloudGeometry = new THREE.PlaneGeometry(20, 10); // 사각형 구름 크기
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff, // 흰색 구름
            opacity: 0.8,    // 약간 투명
            transparent: true,
            side: THREE.DoubleSide // 양면 렌더링
        });

        const cloudCount = 50; // 구름 개수를 10 -> 50으로 증가
        const mapWidth = 100;  // 맵 크기
        const mapHeight = 100; // 맵 크기
        const cloudHeightMin = 40; // 구름 최소 높이
        const cloudHeightMax = 80; // 구름 최대 높이

        for (let i = 0; i < cloudCount; i++) {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

            // 무작위 위치 설정
            const x = (Math.random() - 0.5) * mapWidth * 2.5; // 맵 크기의 2.5배로 확장
            const z = (Math.random() - 0.5) * mapHeight * 2.5;
            const y = cloudHeightMin + Math.random() * (cloudHeightMax - cloudHeightMin); // 높이 범위 내에서 랜덤

            cloud.position.set(x, y, z);
            cloud.rotation.x = Math.PI / 2; // 수평 배치

            // 약간의 크기 변동 추가
            const scale = 0.5 + Math.random() * 1.5; // 0.5배 ~ 2배 크기
            cloud.scale.set(scale, scale, 1);

            this.clouds.push(cloud);
            this.scene.add(cloud);
            console.log(`Cloud ${i + 1} added at position:`, cloud.position, 'scale:', cloud.scale);
        }
    }

    update() {
        // 필요 시 구름 애니메이션 추가 가능 (현재는 정적)
    }
}

console.log('Sky class defined and exported');