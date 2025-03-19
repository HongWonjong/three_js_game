import * as THREE from '../node_modules/three/build/three.module.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

console.log('ResourceCluster.js loaded successfully');
const CANNON = window.CANNON;
console.log('CANNON:', CANNON); // 로드 상태 확인
console.log('Defining ResourceCluster class...');

export class ResourceCluster {
    constructor(scene, terrain, world) {
        this.scene = scene;
        this.terrain = terrain;
        this.world = world;
        this.trees = [];
        this.rocks = [];
    }

    async createClusters() {
        if (!CANNON || !CANNON.Cylinder) {
            throw new Error('CANNON.Cylinder is not available. Ensure cannon.min.js is loaded.');
        }
    
        const loader = new GLTFLoader();
        const numClusters = 5;
        const clusterRadius = 50;
        const pairDistance = 150;
        const mapData = this.terrain.mapData;
    
        // 나무 모델 로드 (기존 코드 유지)
        let treeModel;
        try {
            console.log('Attempting to load tree model from: ../assets/tree/tree.gltf');
            treeModel = await new Promise((resolve, reject) => {
                loader.load(
                    '../assets/tree/tree.gltf',
                    (gltf) => {
                        console.log('Tree model loaded successfully:', gltf.scene);
                        resolve(gltf.scene);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading tree model:', error);
                        reject(error);
                    }
                );
            });
            if (!(treeModel instanceof THREE.Object3D)) {
                throw new Error('Loaded tree model is not a valid Object3D');
            }
        } catch (error) {
            console.error('Failed to load tree model:', error);
            return;
        }
    
        // 바위 모델 로드 (기존 코드 유지)
        let rockModel;
        try {
            console.log('Attempting to load rock model from: ../assets/rock/rock.gltf');
            rockModel = await new Promise((resolve, reject) => {
                loader.load(
                    '../assets/rock/rock.gltf',
                    (gltf) => {
                        console.log('Rock model loaded successfully:', gltf.scene);
                        resolve(gltf.scene);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading rock model:', error);
                        reject(error);
                    }
                );
            });
            if (!(rockModel instanceof THREE.Object3D)) {
                throw new Error('Loaded rock model is not a valid Object3D');
            }
        } catch (error) {
            console.error('Failed to load rock model:', error);
            return;
        }
    
        const treeBoundingBox = new THREE.Box3().setFromObject(treeModel);
        const treeSize = new THREE.Vector3();
        treeBoundingBox.getSize(treeSize);
        console.log('Tree model size (before scale):', treeSize);
    
        const rockBoundingBox = new THREE.Box3().setFromObject(rockModel);
        const rockSize = new THREE.Vector3();
        rockBoundingBox.getSize(rockSize);
        console.log('Rock model size (before scale):', rockSize);
    
        // 나무 재질 정의 (이전 수정 유지)
        const treeMaterial = new CANNON.Material('treeMaterial');
        const playerMaterial = new CANNON.Material('playerMaterial');
        const treePlayerContact = new CANNON.ContactMaterial(
            treeMaterial,
            playerMaterial,
            { friction: 0.5, restitution: 0.1 }
        );
        this.world.addContactMaterial(treePlayerContact);
    
        for (let i = 0; i < numClusters; i++) {
            const clusterX = (Math.random() - 0.5) * mapData.width * 0.8;
            const clusterZ = (Math.random() - 0.5) * mapData.height * 0.8;
    
            const treeClusterX = clusterX + (Math.random() - 0.5) * pairDistance;
            const treeClusterZ = clusterZ + (Math.random() - 0.5) * pairDistance;
            const rockClusterX = treeClusterX + (Math.random() - 0.5) * pairDistance;
            const rockClusterZ = treeClusterZ + (Math.random() - 0.5) * pairDistance;
    
            const treeScale = 0.2;
            for (let j = 0; j < 7; j++) {
                const offsetX = (Math.random() - 0.5) * clusterRadius * 2;
                const offsetZ = (Math.random() - 0.5) * clusterRadius * 2;
                const x = treeClusterX + offsetX;
                const z = treeClusterZ + offsetZ;
                const y = this.terrain.getHeightAt(x, z);
    
                const tree = treeModel.clone();
                console.log('Cloned tree:', tree);
                tree.position.set(x, y, z);
                tree.scale.set(treeScale, treeScale, treeScale);
                this.scene.add(tree);
    
                // 나무 충돌체를 기둥 크기에 맞게 조정
                const scaledTreeSize = treeSize.clone().multiplyScalar(treeScale);
                const trunkWidthFactor = 0.15; // 기둥 너비를 전체 모델의 20%로 가정 (조정 가능)
                const trunkHeightFactor = 0.7; // 기둥 높이를 전체 모델의 70%로 가정 (조정 가능)
                const treeShape = new CANNON.Box(
                    new CANNON.Vec3(
                        scaledTreeSize.x * trunkWidthFactor / 2, // 기둥 너비 축소
                        scaledTreeSize.y * trunkHeightFactor / 2, // 기둥 높이 조정
                        scaledTreeSize.z * trunkWidthFactor / 2  // 기둥 깊이 축소
                    )
                );
                const treeBody = new CANNON.Body({ mass: 0, material: treeMaterial });
                treeBody.addShape(treeShape);
                // 충돌체 중심을 기둥 하단에 맞추고 약간의 여유 공간 추가
                treeBody.position.set(x, y + scaledTreeSize.y * trunkHeightFactor / 2, z);
                this.world.addBody(treeBody);
    
                this.trees.push({ mesh: tree, body: treeBody });
            }
            console.log(`Tree cluster ${i + 1} created at (${treeClusterX}, ${treeClusterZ}) with 7 trees`);
    
            // 바위 생성 (이전 수정 유지)
            const rockScale = 0.02;
            for (let j = 0; j < 7; j++) {
                const offsetX = (Math.random() - 0.5) * clusterRadius * 2;
                const offsetZ = (Math.random() - 0.5) * clusterRadius * 2;
                const x = rockClusterX + offsetX;
                const z = rockClusterZ + offsetZ;
                const y = this.terrain.getHeightAt(x, z);
    
                const rock = rockModel.clone();
                console.log('Cloned rock:', rock);
                rock.position.set(x, y, z);
                rock.scale.set(rockScale, rockScale, rockScale);
                this.scene.add(rock);
    
                const scaledRockSize = rockSize.clone().multiplyScalar(rockScale);
                const rockShape = new CANNON.Box(
                    new CANNON.Vec3(
                        scaledRockSize.x / 2,
                        scaledRockSize.y * 1.5 / 2,
                        scaledRockSize.z / 2
                    )
                );
                const rockBody = new CANNON.Body({ mass: 0 });
                rockBody.addShape(rockShape);
                rockBody.position.set(x, y + scaledRockSize.y / 2 - scaledRockSize.y * 0.25, z);
                this.world.addBody(rockBody);
    
                this.rocks.push({ mesh: rock, body: rockBody });
            }
            console.log(`Rock cluster ${i + 1} created at (${rockClusterX}, ${rockClusterZ}) with 7 rocks`);
        }
    }
}

console.log('ResourceCluster class defined and exported');