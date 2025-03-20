import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';


// 게임 전체 모델 캐시
export const modelCache = {
    commandCenter: null,
    workerDrone: null,
    pickaxe: null
};

// 모델을 저품질로 미리 로드하는 함수
export async function preloadModels() {
    const loader = new GLTFLoader();

    // CommandCenter 모델 저품질 로드
    if (!modelCache.commandCenter) {
        try {
            console.log('Preloading Command Center model (low quality)');
            modelCache.commandCenter = await loader.loadAsync('../assets/buildings/command_center/command_center.gltf');
            modelCache.commandCenter.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    child.material.map.minFilter = THREE.NearestFilter;
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.anisotropy = 1;
                    child.material.needsUpdate = true;
                }
            });
            console.log('Command Center model preloaded (low quality)');
        } catch (error) {
            console.error('Failed to preload Command Center model:', error);
        }
    }

    // WorkerDrone 모델 저품질 로드
    if (!modelCache.workerDrone) {
        try {
            console.log('Preloading WorkerDrone model (low quality)');
            modelCache.workerDrone = await loader.loadAsync('/assets/robots/worker/worker.gltf');
            modelCache.workerDrone.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    child.material.map.minFilter = THREE.NearestFilter;
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.anisotropy = 1;
                    child.material.needsUpdate = true;
                }
            });
            console.log('WorkerDrone model preloaded (low quality)');
        } catch (error) {
            console.error('Failed to preload WorkerDrone model:', error);
        }
    }

    // Pickaxe 모델 저품질 로드
    if (!modelCache.pickaxe) {
        try {
            console.log('Preloading Pickaxe model (low quality)');
            modelCache.pickaxe = await loader.loadAsync('/assets/tools/pickaxe/pickaxe.gltf');
            modelCache.pickaxe.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    child.material.map.minFilter = THREE.NearestFilter;
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.anisotropy = 1;
                    child.material.needsUpdate = true;
                }
            });
            console.log('Pickaxe model preloaded (low quality)');
        } catch (error) {
            console.error('Failed to preload Pickaxe model:', error);
        }
    }
}