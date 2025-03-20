import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

console.log('RobotGun.js loaded successfully');
console.log('Defining RobotGun class...');

export class RobotGun {
    constructor(scene, robotMesh) {
        console.log('RobotGun constructor called with scene:', scene, 'robotMesh:', robotMesh);
        this.scene = scene;
        this.robotMesh = robotMesh;
        this.mesh = null;
        this.createGun();
    }

    async createGun() {
        const loader = new GLTFLoader();

        try {
            console.log('Attempting to load gun model from: ../assets/gun/gun.gltf');
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    '../assets/gun/gun.gltf',
                    (gltf) => resolve(gltf),
                    (progress) => console.log('Loading progress:', progress.loaded, '/', progress.total),
                    (error) => reject(error)
                );
            });

            this.mesh = gltf.scene;
            this.mesh.scale.set(0.4, 0.4, 0.4); // 플레이어와 동일한 크기
            this.mesh.position.set(2, 1, 0.8); // 플레이어와 동일한 상대 위치
            this.mesh.castShadow = true;
            console.log('RobotGun mesh created with position:', this.mesh.position);

            const textureLoader = new THREE.TextureLoader();
            const baseColorMap = await textureLoader.loadAsync('../assets/gun/textures/Cybergun_baseColor.png');
            const normalMap = await textureLoader.loadAsync('../assets/gun/textures/Cybergun_normal.png');

            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (!child.material || child.material.type === 'MeshBasicMaterial') {
                        child.material = new THREE.MeshPhongMaterial({
                            map: baseColorMap,
                            normalMap: normalMap,
                            normalScale: new THREE.Vector2(1, 1),
                            color: 0xffffff,
                            specular: 0x050505,
                            shininess: 100
                        });
                        child.material.needsUpdate = true;
                    }
                    child.castShadow = true;
                }
            });

            this.robotMesh.add(this.mesh);
            console.log('RobotGun mesh added to robot:', this.mesh);
        } catch (error) {
            console.error('Failed to load gun model:', error);
            const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.5);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(0.5, 0.5, -0.5);
            this.mesh.scale.set(0.3, 0.3, 0.3);
            this.robotMesh.add(this.mesh);
            console.log('Fallback gun mesh added:', this.mesh);
        }
    }

    update() {
        // 로직은 나중에 추가할 예정이므로 현재는 빈 메서드
    }
}

console.log('RobotGun class defined and exported');