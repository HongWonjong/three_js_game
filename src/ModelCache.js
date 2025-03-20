import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

export const modelCache = {
    commandCenter: null,
    workerDrone: null,
    pickaxe: null,
    barrack: null
};

export async function preloadModels() {
    const loader = new GLTFLoader();

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
            console.log('Command Center model preloaded successfully');
        } catch (error) {
            console.error('Failed to preload Command Center model:', error);
        }
    }

    if (!modelCache.workerDrone) {
        // 기존 로직 동일
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
            console.log('WorkerDrone model preloaded successfully');
        } catch (error) {
            console.error('Failed to preload WorkerDrone model:', error);
        }
    }

    if (!modelCache.pickaxe) {
        // 기존 로직 동일
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
            console.log('Pickaxe model preloaded successfully');
        } catch (error) {
            console.error('Failed to preload Pickaxe model:', error);
        }
    }

    if (!modelCache.barrack) {
        try {
            console.log('Preloading Barrack model (low quality)');
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
}