import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

console.log('Building.js loaded successfully');
console.log('Defining Building class...');

const CANNON = window.CANNON;
console.log('CANNON:', CANNON);

export class Building {
    constructor(scene, world, position, terrain) {
        console.log('Building constructor called with scene:', scene, 'world:', world, 'position:', position);
        this.scene = scene;
        this.world = world;
        this.position = position;
        this.terrain = terrain;
        this.mesh = null;
        this.body = null;
    }

    async load() {
        const loader = new GLTFLoader();
        try {
            console.log('Attempting to load building model from: ../assets/buildings/house/house.gltf');
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    '../assets/buildings/house/house.gltf',
                    (gltf) => {
                        console.log('Building model loaded successfully:', gltf.scene);
                        resolve(gltf);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading building model:', error);
                        reject(error);
                    }
                );
            });
    
            this.mesh = gltf.scene;
            this.mesh.scale.set(5, 5, 5);
    
            // 지형 높이에 정확히 맞추기
            const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
            this.position.y = terrainHeight; // 메시의 바닥을 지형 높이에 맞춤
            this.mesh.position.copy(this.position);
            this.scene.add(this.mesh);
    
            // 충돌체 크기 계산
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
            
            // 충돌체를 지형에 맞게 위치 조정 (바닥을 지형에 맞춤)
            this.body = new CANNON.Body({
                mass: 0, // 정적 객체로 유지 (이전에 수정한 대로)
                position: new CANNON.Vec3(this.position.x, this.position.y + size.y / 2, this.position.z),
                shape: shape,
                material: new CANNON.Material('buildingMaterial')
            });
            this.world.addBody(this.body);
    
            console.log('Building created at position:', this.position, 'with size:', size);
        } catch (error) {
            console.error('Failed to load building model:', error);
        }
    }

    update() {
        if (this.mesh && this.body) {
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        }
    }
}

console.log('Building class defined and exported');