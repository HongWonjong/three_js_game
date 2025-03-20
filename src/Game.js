import * as THREE from 'three';
import { Terrain } from './Terrain.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { ResourceCluster } from './ResourceCluster.js';
import { Sky } from './Sky.js';
import { GameUI } from './GameUI.js';
import { preloadModels, modelCache } from './ModelCache.js';
import { BuildingManager } from './BuildingManager.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.world = new CANNON.World();
        this.world.gravity.set(0, -20, 0);

        this.resources = { wood: 100, stone: 100 };
        this.buildings = [];

        this.ui = new GameUI(this);
        this.buildingManager = new BuildingManager(this);

        this.loadMap('maps/map1.json');
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
        if (this.terrain?.buildings) this.terrain.buildings.forEach(building => building.update());
        if (this.buildings) this.buildings.forEach(building => building.update(delta));
        if (this.sky) this.sky.update();
        this.renderer.render(this.scene, this.cameraController.camera);
    }

    async loadMap(mapPath) {
        const mapData = await fetch(mapPath).then(res => res.json()).catch(() => ({
            width: 100, height: 100, segments: 50, hills: []
        }));
        await preloadModels();
        if (!modelCache.commandCenter || !modelCache.barrack) {
            console.error('Critical error: Required building models failed to preload. Check paths in ModelCache.js');
            // 진행 중단 가능성 고려 (필요 시 주석 해제)
            // throw new Error('Model preload failed');
        } else {
            console.log('All models preloaded successfully');
        }
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

        this.player = new Player(this.scene, this.terrain, this.world, this.resourceCluster, this.buildings);
        this.sky = new Sky(this.scene);

        this.renderer.shadowMap.enabled = true;
        this.terrain.mesh.receiveShadow = true;

        window.addEventListener('resize', () => this.onWindowResize(), false);

        this.animate();
    }

    onWindowResize() {
        if (this.cameraController && this.cameraController.camera) {
            this.cameraController.camera.aspect = window.innerWidth / window.innerHeight;
            this.cameraController.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        } else {
            console.warn('CameraController not initialized yet');
        }
    }
}