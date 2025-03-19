import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

console.log('Gun.js loaded successfully');
console.log('Defining Gun class...');

export class Gun {
    constructor(scene, playerMesh) {
        console.log('Gun constructor called with scene:', scene, 'and playerMesh:', playerMesh);
        this.scene = scene;
        this.playerMesh = playerMesh;
        this.createGun();
    }

    async createGun() {
        const loader = new GLTFLoader();

        try {
            console.log('Attempting to load gun model from: ../assets/gun/gun.gltf');
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    '../assets/gun/gun.gltf',
                    (gltf) => {
                        console.log('Gun model loaded successfully:', gltf);
                        resolve(gltf);
                    },
                    (progress) => {
                        console.log('Loading progress:', progress.loaded, '/', progress.total);
                    },
                    (error) => {
                        console.error('Error loading gun model:', error);
                        reject(error);
                    }
                );
            });

            this.mesh = gltf.scene;
            this.mesh.scale.set(0.2, 0.2, 0.2);
            this.mesh.position.set(0.5, 0.5, -0.5);
            this.mesh.castShadow = true;
            console.log('Gun mesh created with position:', this.mesh.position, 'scale:', this.mesh.scale);

            // 텍스처 로드
            const textureLoader = new THREE.TextureLoader();
            console.log('Attempting to load base color map from: ../assets/gun/textures/Cybergun_baseColor.png');
            const baseColorMap = await textureLoader.loadAsync('../assets/gun/textures/Cybergun_baseColor.png');
            console.log('Base color map loaded successfully:', baseColorMap);

            console.log('Attempting to load normal map from: ../assets/gun/textures/Cybergun_normal.png');
            const normalMap = await textureLoader.loadAsync('../assets/gun/textures/Cybergun_normal.png');
            console.log('Normal map loaded successfully:', normalMap);

            // 재질 적용 (기존 재질 유지, 필요한 경우에만 추가)
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    // 기존 재질이 없거나 기본 재질인 경우에만 새 재질 적용
                    if (!child.material || child.material.type === 'MeshBasicMaterial') {
                        const material = new THREE.MeshPhongMaterial({
                            map: baseColorMap, // 기본 텍스처 추가
                            normalMap: normalMap,
                            normalScale: new THREE.Vector2(1, 1),
                            color: 0xffffff,
                            specular: 0x050505,
                            shininess: 100
                        });
                        child.material = material;
                        child.material.needsUpdate = true;
                    }
                    child.castShadow = true;
                    console.log('Applied material to mesh child:', child);
                }
            });

            console.log('Adding gun mesh to player:', this.mesh);
            this.playerMesh.add(this.mesh);
        } catch (error) {
            console.error('Failed to load gun model. Ensure gun.gltf and scene.bin (or gun.bin) files exist in the assets folder:', error);
            const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.5);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(0.5, 0.5, -0.5);
            this.mesh.scale.set(0.3, 0.3, 0.3);
            this.playerMesh.add(this.mesh);
            console.log('Fallback gun mesh added:', this.mesh);
        }
    }

    update(rotationY) {
        // 총은 플레이어의 자식 객체이므로 플레이어의 회전을 자연스럽게 따라감
        // 별도의 회전 설정 제거
    }
}

console.log('Gun class defined and exported');