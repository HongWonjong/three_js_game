import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

console.log('ResourceCluster.js loaded successfully');
console.log('Defining ResourceCluster class...');

export class ResourceCluster {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain; // Terrain 객체를 통해 getHeightAt 메서드 사용
        this.trees = [];
        this.rocks = [];
    }

    async createClusters() {
        const loader = new GLTFLoader();
        const numClusters = 5; // 클러스터 쌍의 개수
        const clusterRadius = 50; // 클러스터 내 객체 간 최대 거리 (3 → 10)
        const pairDistance = 150; // 클러스터 쌍 간 최대 거리 (10 → 30)
        const mapData = this.terrain.mapData;

        // 나무 모델 로드
        let treeModel;
        try {
            console.log('Attempting to load tree model from: ../assets/tree/tree.gltf');
            treeModel = await new Promise((resolve, reject) => {
                loader.load(
                    '../assets/tree/tree.gltf',
                    (gltf) => {
                        console.log('Tree model loaded successfully:', gltf);
                        resolve(gltf.scene);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading tree model:', error);
                        reject(error);
                    }
                );
            });
        } catch (error) {
            console.error('Failed to load tree model:', error);
            return;
        }

        // 바위 모델 로드
        let rockModel;
        try {
            console.log('Attempting to load rock model from: ../assets/rock/rock.gltf');
            rockModel = await new Promise((resolve, reject) => {
                loader.load(
                    '../assets/rock/rock.gltf',
                    (gltf) => {
                        console.log('Rock model loaded successfully:', gltf);
                        resolve(gltf.scene);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading rock model:', error);
                        reject(error);
                    }
                );
            });
        } catch (error) {
            console.error('Failed to load rock model:', error);
            return;
        }

        // 클러스터 쌍 생성
        for (let i = 0; i < numClusters; i++) {
            // 클러스터 쌍의 중심 위치 랜덤 설정
            const clusterX = (Math.random() - 0.5) * mapData.width * 0.8; // 지형 범위 내 랜덤 X
            const clusterZ = (Math.random() - 0.5) * mapData.height * 0.8; // 지형 범위 내 랜덤 Z

            // 나무 클러스터 중심
            const treeClusterX = clusterX + (Math.random() - 0.5) * pairDistance;
            const treeClusterZ = clusterZ + (Math.random() - 0.5) * pairDistance;

            // 바위 클러스터 중심 (나무 클러스터와 가까운 위치)
            const rockClusterX = treeClusterX + (Math.random() - 0.5) * pairDistance;
            const rockClusterZ = treeClusterZ + (Math.random() - 0.5) * pairDistance;

            // 나무 클러스터 생성 (7개 나무)
            for (let j = 0; j < 7; j++) {
                const offsetX = (Math.random() - 0.5) * clusterRadius * 2;
                const offsetZ = (Math.random() - 0.5) * clusterRadius * 2;
                const x = treeClusterX + offsetX;
                const z = treeClusterZ + offsetZ;
                const y = this.terrain.getHeightAt(x, z);

                const tree = treeModel.clone();
                tree.position.set(x, y, z);
                tree.scale.set(0.2, 0.2, 0.2);
                this.scene.add(tree);
                this.trees.push(tree);
            }
            console.log(`Tree cluster ${i + 1} created at (${treeClusterX}, ${treeClusterZ}) with 7 trees`);

            // 바위 클러스터 생성 (7개 바위)
            for (let j = 0; j < 7; j++) {
                const offsetX = (Math.random() - 0.5) * clusterRadius * 2;
                const offsetZ = (Math.random() - 0.5) * clusterRadius * 2;
                const x = rockClusterX + offsetX;
                const z = rockClusterZ + offsetZ;
                const y = this.terrain.getHeightAt(x, z);

                const rock = rockModel.clone();
                rock.position.set(x, y, z);
                rock.scale.set(0.02, 0.02, 0.02);
                this.scene.add(rock);
                this.rocks.push(rock);
            }
            console.log(`Rock cluster ${i + 1} created at (${rockClusterX}, ${rockClusterZ}) with 7 rocks`);
        }
    }
}

console.log('ResourceCluster class defined and exported');