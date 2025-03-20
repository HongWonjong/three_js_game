import * as THREE from 'three';
import { Terrain } from './Terrain.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { ResourceCluster } from './ResourceCluster.js';
import { Sky } from './Sky.js';
import { GameUI } from './GameUI.js';
import { preloadModels } from './ModelCache.js';
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
        this.commandCenters = [];

        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.ui = new GameUI(this);
        this.buildingManager = new BuildingManager(this); // BuildingManager 추가

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
        if (this.terrain.buildings) this.terrain.buildings.forEach(building => building.update());
        if (this.commandCenters) this.commandCenters.forEach(center => center.update(delta));
        if (this.sky) this.sky.update();
        this.renderer.render(this.scene, this.cameraController.camera);
    }

    async loadMap(mapPath) {
        const mapData = await fetch(mapPath).then(res => res.json()).catch(() => ({
            width: 100, height: 100, segments: 50, hills: []
        }));
        await preloadModels(); // ModelCache에서 가져옴
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

        this.animate();
    }

    onWindowResize() {
        this.cameraController.camera.aspect = window.innerWidth / window.innerHeight;
        this.cameraController.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}