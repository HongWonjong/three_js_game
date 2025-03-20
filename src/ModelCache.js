import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

export const modelCache = {
    commandCenter: null,
    workerDrone: null,
    pickaxe: null,
    barrack: null,
    gun: null // 총 모델 추가
};

export async function preloadModels() {
    const loader = new GLTFLoader();

    // Command Center 로드
    if (!modelCache.commandCenter) {
        try {
            console.log('Preloading Command Center model');
            modelCache.commandCenter = await loader.loadAsync('../assets/buildings/command_center/command_center.gltf');
            modelCache.commandCenter.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    child.material.map.minFilter = THREE.NearestFilter;
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.anisotropy = 1;
                    child.material.needsUpdate = true;
                }
            });
            console.log('Command Center model preloaded successfully');
        } catch (error) {
            console.error('Failed to preload Command Center model:', error);
        }
    }

    // Worker Drone 로드 (일꾼)
    if (!modelCache.workerDrone) {
        try {
            console.log('Preloading WorkerDrone model');
            modelCache.workerDrone = await loader.loadAsync('../assets/robots/worker/worker.gltf');
            modelCache.workerDrone.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    child.material.map.minFilter = THREE.NearestFilter;
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.anisotropy = 1;
                    child.material.needsUpdate = true;
                }
            });
            console.log('WorkerDrone model preloaded successfully');
        } catch (error) {
            console.error('Failed to preload WorkerDrone model:', error);
        }
    }

    // Pickaxe 로드
    if (!modelCache.pickaxe) {
        try {
            console.log('Preloading Pickaxe model');
            modelCache.pickaxe = await loader.loadAsync('../assets/tools/pickaxe/pickaxe.gltf');
            modelCache.pickaxe.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    child.material.map.minFilter = THREE.NearestFilter;
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.anisotropy = 1;
                    child.material.needsUpdate = true;
                }
            });
            console.log('Pickaxe model preloaded successfully');
        } catch (error) {
            console.error('Failed to preload Pickaxe model:', error);
        }
    }

    // Barrack 로드
    if (!modelCache.barrack) {
        try {
            console.log('Preloading Barrack model');
            modelCache.barrack = await loader.loadAsync('../assets/buildings/barrack/barrack.gltf');
            modelCache.barrack.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    child.material.map.minFilter = THREE.NearestFilter;
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.anisotropy = 1;
                    child.material.needsUpdate = true;
                }
            });
            console.log('Barrack model preloaded successfully');
        } catch (error) {
            console.error('Failed to preload Barrack model:', error);
        }
    }

    // Gun 로드
    if (!modelCache.gun) {
        try {
            console.log('Preloading Gun model');
            modelCache.gun = await loader.loadAsync('../assets/gun/gun.gltf');
            modelCache.gun.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    child.material.map.minFilter = THREE.NearestFilter;
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.anisotropy = 1;
                    child.material.needsUpdate = true;
                }
            });
            console.log('Gun model preloaded successfully');
        } catch (error) {
            console.error('Failed to preload Gun model:', error);
        }
    }
}

// 초기 로드 시작
preloadModels();