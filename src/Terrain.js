import * as THREE from 'three';
import { ResourceCluster } from './ResourceCluster.js';

console.log('Terrain.js loaded successfully');
console.log('Defining Terrain class...');

export class Terrain {
    constructor(scene, mapData) {
        console.log('Terrain constructor called with scene:', scene, 'and mapData:', mapData);
        this.scene = scene;
        this.mapData = mapData;
        this.trees = [];
        this.rocks = [];
        try {
            this.createTerrain();
            this.createResourceClusters();
        } catch (error) {
            console.error('Error in Terrain constructor:', error);
        }
    }

    createTerrain() {
        console.log('Creating terrain...');
        const { width, height, segments, hills } = this.mapData;
        console.log('Map data for terrain:', { width, height, segments, hills });

        const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
        console.log('Geometry created:', geometry);

        const vertices = geometry.attributes.position.array;
        console.log('Vertices array length:', vertices.length);

        for (let i = 2; i < vertices.length; i += 3) {
            vertices[i] = 0;
        }
        console.log('Vertices initialized');

        for (const hill of hills) {
            this.addHill(geometry, hill);
        }
        console.log('Hills added to geometry');

        geometry.computeVertexNormals();
        console.log('Vertex normals computed');

        const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, wireframe: true });
        console.log('Material created:', material);

        const terrainMesh = new THREE.Mesh(geometry, material);
        console.log('Terrain mesh created:', terrainMesh);

        terrainMesh.rotation.x = -Math.PI / 2;
        console.log('Terrain mesh rotated:', terrainMesh.rotation);

        this.scene.add(terrainMesh);
        console.log('Terrain mesh added to scene');

        this.mesh = terrainMesh;
        console.log('Terrain mesh assigned:', this.mesh);
    }

    addHill(geometry, hill) {
        console.log('Adding hill:', hill);
        const vertices = geometry.attributes.position.array;
        const { x: hillX, z: hillZ, height, radius } = hill;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];
            const distance = Math.sqrt((x - hillX) ** 2 + (z - hillZ) ** 2);

            if (distance < radius) {
                const influence = 1 - distance / radius;
                vertices[i + 2] += height * influence;
            }
        }
        console.log('Hill added to geometry');
    }

    async createResourceClusters() {
        console.log('Creating resource clusters...');
        const resourceCluster = new ResourceCluster(this.scene, this);
        await resourceCluster.createClusters();
        this.trees = resourceCluster.trees;
        this.rocks = resourceCluster.rocks;
        console.log('Resource clusters created:', this.trees.length, 'trees,', this.rocks.length, 'rocks');
    }

    getHeightAt(x, z) {
        const { width, height, segments } = this.mapData;
        const gridX = Math.floor((x + width / 2) / width * segments);
        const gridZ = Math.floor((z + height / 2) / height * segments);

        if (gridX < 0 || gridX >= segments || gridZ < 0 || gridZ >= segments) {
            return 0;
        }

        const index = (gridZ * (segments + 1) + gridX) * 3 + 2;
        const heightAt = this.mesh.geometry.attributes.position.array[index] || 0;
        return heightAt;
    }
}

console.log('Terrain class defined and exported');