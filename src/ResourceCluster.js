import * as THREE from '../node_modules/three/build/three.module.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

console.log('ResourceCluster.js loaded successfully');
const CANNON = window.CANNON;
console.log('CANNON:', CANNON);
console.log('Defining ResourceCluster class...');

// ResourceCluster 전용 모델 캐시
const resourceModelCache = {
    tree: null,
    rock: null
};

// 모델을 미리 로드하는 함수
async function preloadResourceModels() {
    const loader = new GLTFLoader();

    if (!resourceModelCache.tree) {
        try {
            console.log('Preloading Tree model');
            resourceModelCache.tree = await loader.loadAsync('../assets/tree/tree.gltf');
            console.log('Tree model preloaded');
        } catch (error) {
            console.error('Failed to preload Tree model:', error);
        }
    }

    if (!resourceModelCache.rock) {
        try {
            console.log('Preloading Rock model');
            resourceModelCache.rock = await loader.loadAsync('../assets/rock/rock.gltf');
            console.log('Rock model preloaded');
        } catch (error) {
            console.error('Failed to preload Rock model:', error);
        }
    }
}

// 캐시 준비 여부를 확인하는 플래그
let isCacheReady = false;
preloadResourceModels().then(() => {
    isCacheReady = true;
    console.log('Resource models preload completed');
}).catch(error => {
    console.error('Error during resource preload:', error);
});

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

        // 캐시가 준비될 때까지 대기
        if (!isCacheReady) {
            console.log('Waiting for resource models to preload...');
            await new Promise(resolve => {
                const checkCache = setInterval(() => {
                    if (isCacheReady) {
                        clearInterval(checkCache);
                        resolve();
                    }
                }, 100);
            });
        }

        const numClusters = 5;
        const clusterRadius = 50;
        const pairDistance = 150;
        const mapData = this.terrain.mapData;

        // 나무 모델 준비
        let treeModel = resourceModelCache.tree ? resourceModelCache.tree.scene : null;
        let treeSize;
        if (treeModel) {
            const treeBoundingBox = new THREE.Box3().setFromObject(treeModel);
            treeSize = new THREE.Vector3();
            treeBoundingBox.getSize(treeSize);
            console.log('Tree model size (before scale):', treeSize);
        } else {
            console.error('Tree model not available in cache, using fallback');
            treeModel = new THREE.Mesh(
                new THREE.BoxGeometry(1, 5, 1),
                new THREE.MeshBasicMaterial({ color: 0x8B4513 })
            );
            treeSize = new THREE.Vector3(1, 5, 1);
        }

        // 바위 모델 준비
        let rockModel = resourceModelCache.rock ? resourceModelCache.rock.scene : null;
        let rockSize;
        if (rockModel) {
            const rockBoundingBox = new THREE.Box3().setFromObject(rockModel);
            rockSize = new THREE.Vector3();
            rockBoundingBox.getSize(rockSize);
            console.log('Rock model size (before scale):', rockSize);
        } else {
            console.error('Rock model not available in cache, using fallback');
            rockModel = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 2),
                new THREE.MeshBasicMaterial({ color: 0x808080 })
            );
            rockSize = new THREE.Vector3(2, 2, 2);
        }

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

                const scaledTreeSize = treeSize.clone().multiplyScalar(treeScale);
                const trunkWidthFactor = 0.15;
                const trunkHeightFactor = 0.7;
                const treeShape = new CANNON.Box(
                    new CANNON.Vec3(
                        scaledTreeSize.x * trunkWidthFactor / 2,
                        scaledTreeSize.y * trunkHeightFactor / 2,
                        scaledTreeSize.z * trunkWidthFactor / 2
                    )
                );
                const treeBody = new CANNON.Body({ mass: 0, material: treeMaterial });
                treeBody.addShape(treeShape);
                treeBody.position.set(x, y + scaledTreeSize.y * trunkHeightFactor / 2, z);
                this.world.addBody(treeBody);

                this.trees.push({
                    mesh: tree,
                    body: treeBody,
                    type: 'wood',
                    amount: 100
                });
            }
            console.log(`Tree cluster ${i + 1} created at (${treeClusterX}, ${treeClusterZ}) with 7 trees`);

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

                this.rocks.push({
                    mesh: rock,
                    body: rockBody,
                    type: 'stone',
                    amount: 100
                });
            }
            console.log(`Rock cluster ${i + 1} created at (${rockClusterX}, ${rockClusterZ}) with 7 rocks`);
        }
    }
}

console.log('ResourceCluster class defined and exported');