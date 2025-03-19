import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { Terrain } from './Terrain.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { ResourceCluster } from './ResourceCluster.js';
import { Building } from './Building.js';
import { Sky } from './Sky.js';
import { CommandCenter } from './CommandCenter.js';
import { WorkerDrone } from './WorkerDrone.js';
import { GameUI } from './GameUI.js';

// 게임 전체 모델 캐시
const modelCache = {
    commandCenter: null,
    workerDrone: null,
    pickaxe: null
};

// 모델을 저품질로 미리 로드하는 함수
async function preloadModels() {
    const loader = new GLTFLoader();

    // CommandCenter 모델 저품질 로드
    if (!modelCache.commandCenter) {
        try {
            console.log('Preloading Command Center model (low quality)');
            modelCache.commandCenter = await loader.loadAsync('../assets/buildings/command_center/command_center.gltf');
            modelCache.commandCenter.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    child.material.map.minFilter = THREE.NearestFilter; // 저품질 필터
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.anisotropy = 1; // 텍스처 선명도 낮춤
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

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.world = new CANNON.World();
        this.world.gravity.set(0, -20, 0);

        this.resources = { wood: 100, stone: 100 };
        this.commandCenters = [];

        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.setupInput();
        this.ui = new GameUI(this);

        this.loadMap('maps/map1.json');
    }

    setupInput() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        document.addEventListener('click', (event) => {
            if (event.button === 2) {
                this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, this.cameraController.camera);
                const intersects = this.raycaster.intersectObject(this.terrain.mesh);

                if (intersects.length > 0) {
                    const position = intersects[0].point;
                    this.buildCommandCenter(position);
                }
            }
        });
    }

    async buildCommandCenter(position) {
        if (this.resources.wood >= 100 && this.resources.stone >= 100) {
            this.resources.wood -= 100;
            this.resources.stone -= 100;
            this.ui.updateUI();

            const playerPos = this.player.mesh.position;
            const distanceToPlayer = position.distanceTo(playerPos);
            const minDistance = 10;
            let adjustedPosition = position.clone();

            if (distanceToPlayer < minDistance) {
                const direction = position.clone().sub(playerPos).normalize();
                adjustedPosition = playerPos.clone().add(direction.multiplyScalar(minDistance));
                console.log(`Adjusted Command Center position: ${adjustedPosition.toArray()}`);
            }

            const commandCenter = new CommandCenter(
                this.scene,
                this.world,
                this.resources,
                adjustedPosition,
                this.terrain,
                this.resourceCluster,
                this,
                modelCache
            );
            await commandCenter.init(); // 초기화 완료 대기
            this.commandCenters.push(commandCenter);
            console.log('Command Center construction completed at:', adjustedPosition);
        } else {
            this.ui.showWarning('Not enough resources to build Command Center!');
            console.log('Not enough resources!');
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const now = performance.now();
        const delta = (now - (this.lastTime || now)) / 1000;
        this.lastTime = now;

        if (this.world) this.world.step(1 / 60);
        if (this.player) {
            this.player.update();
            this.cameraController.update(this.player.mesh.position, this.player.rotationY, this.player.rotationX);
        }
        if (this.terrain.buildings) this.terrain.buildings.forEach(building => building.update());
        if (this.commandCenters) this.commandCenters.forEach(center => center.update(delta));
        if (this.sky) this.sky.update();
        this.renderer.render(this.scene, this.cameraController.camera);
    }

    async loadMap(mapPath) {
        const mapData = await fetch(mapPath).then(res => res.json()).catch(() => ({
            width: 100, height: 100, segments: 50, hills: []
        }));
        await preloadModels(); // 게임 시작 시 저품질 모델 로드
        await this.init(mapData);
    }

    async init(mapData) {
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        this.cameraController = new Camera(this.scene);
        this.terrain = new Terrain(this.scene, mapData, this.world);
        await this.terrain.createTerrain();

        this.resourceCluster = new ResourceCluster(this.scene, this.terrain, this.world);
        await this.resourceCluster.createClusters();

        this.buildings = [];
        const buildingPositions = [new THREE.Vector3(10, 0, 10), new THREE.Vector3(-10, 0, -10)];
        for (const pos of buildingPositions) {
            const building = new Building(this.scene, this.world, pos, this.terrain);
            await building.load();
            this.buildings.push(building);
        }

        this.player = new Player(this.scene, this.terrain, this.world, this.resourceCluster, this.buildings);
        this.sky = new Sky(this.scene);

        this.renderer.shadowMap.enabled = true;
        this.terrain.mesh.receiveShadow = true;

        this.animate();
    }

    onWindowResize() {
        this.cameraController.camera.aspect = window.innerWidth / window.innerHeight;
        this.cameraController.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}