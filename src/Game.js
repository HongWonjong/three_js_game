import * as THREE from 'three';
import { Terrain } from './Terrain.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js'; // CameraController.js -> Camera.js, CameraController -> Camera

console.log('Game.js loaded successfully');
console.log('Terrain module:', Terrain);
console.log('Player module:', Player);
console.log('Camera module:', Camera); // CameraController -> Camera
console.log('Defining Game class...');

export class Game {
    constructor() {
        console.log('Game constructor called');
        try {
            this.scene = new THREE.Scene();
            console.log('Scene created:', this.scene);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            console.log('Renderer created:', this.renderer);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            console.log('Renderer size set:', window.innerWidth, window.innerHeight);
            document.body.appendChild(this.renderer.domElement);
            console.log('Renderer DOM element appended');

            window.addEventListener('resize', () => this.onWindowResize(), false);
            console.log('Resize event listener added');

            console.log('Starting to load map...');
            this.loadMap('maps/map1.json');
        } catch (error) {
            console.error('Error in Game constructor:', error);
        }
    }

    async loadMap(mapPath) {
        try {
            console.log(`Attempting to load map from: ${mapPath}`);
            const response = await fetch(mapPath);
            if (!response.ok) {
                throw new Error(`Failed to load map: ${response.status} ${response.statusText}`);
            }
            const mapData = await response.json();
            console.log('Map data loaded successfully:', mapData);
            this.init(mapData);
        } catch (error) {
            console.error('Failed to load map:', error);
            // 대체 맵 데이터로 초기화
            const defaultMapData = {
                width: 100,
                height: 100,
                segments: 50,
                hills: [
                    { x: 20, z: 20, height: 5, radius: 10 },
                    { x: -20, z: 20, height: 4, radius: 8 },
                    { x: 20, z: -20, height: 6, radius: 12 },
                    { x: -20, z: -20, height: 5, radius: 10 }
                ]
            };
            console.log('Using default map data due to load failure:', defaultMapData);
            this.init(defaultMapData);
        }
    }

    init(mapData) {
        console.log('Initializing game with map data:', mapData);
        try {
            const ambientLight = new THREE.AmbientLight(0x404040, 1);
            this.scene.add(ambientLight);
            console.log('Ambient light added:', ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 10, 7.5);
            directionalLight.castShadow = true;
            this.scene.add(directionalLight);
            console.log('Directional light added:', directionalLight);

            this.cameraController = new Camera(this.scene); // CameraController -> Camera
            console.log('Camera created:', this.cameraController);

            console.log('Creating Terrain...');
            this.terrain = new Terrain(this.scene, mapData);
            console.log('Terrain created:', this.terrain);

            console.log('Creating Player...');
            this.player = new Player(this.scene, this.terrain);
            console.log('Player created:', this.player);

            this.terrain.mesh.receiveShadow = true;
            console.log('Terrain shadow enabled');

            console.log('Scene objects:', this.scene.children);
            console.log('Camera position:', this.cameraController.camera.position);
            console.log('Starting animation loop...');
            this.animate();
        } catch (error) {
            console.error('Error in init method:', error);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.player) {
            this.player.update();
            this.cameraController.update(this.player.mesh.position, this.player.rotationY);
        }
        this.renderer.render(this.scene, this.cameraController.camera);
    }

    onWindowResize() {
        this.cameraController.camera.aspect = window.innerWidth / window.innerHeight;
        this.cameraController.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

console.log('Game class defined and exported');