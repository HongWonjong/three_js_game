import * as THREE from 'three';
import { ResourceCluster } from './ResourceCluster.js';

console.log('Terrain.js loaded successfully');
console.log('Defining Terrain class...');

const CANNON = window.CANNON;
console.log('CANNON:', CANNON);

export class Terrain {
    constructor(scene, mapData, world) {
        console.log('Terrain constructor called with scene:', scene, 'and mapData:', mapData, 'and world:', world);
        this.scene = scene;
        this.mapData = mapData;
        this.world = world;
        this.trees = [];
        this.rocks = [];
        try {
            this.createTerrain();
            this.createResourceClusters();
        } catch (error) {
            console.error('Error in Terrain constructor:', error);
        }
    }

    async createTerrain() {
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

        // 텍스처 로드
        const textureLoader = new THREE.TextureLoader();
        const grassTextures = await Promise.all([
            textureLoader.loadAsync('../assets/textures/grass1.jpg', () => console.log('grass1 loaded')),
            textureLoader.loadAsync('../assets/textures/grass2.jpg', () => console.log('grass2 loaded')),
            textureLoader.loadAsync('../assets/textures/grass3.jpg', () => console.log('grass3 loaded')),
            textureLoader.loadAsync('../assets/textures/grass4.jpg', () => console.log('grass4 loaded'))
        ]);
        const dirtTextures = await Promise.all([
            textureLoader.loadAsync('../assets/textures/dirt1.jpg', () => console.log('dirt1 loaded')),
            textureLoader.loadAsync('../assets/textures/dirt2.jpg', () => console.log('dirt2 loaded')),
            textureLoader.loadAsync('../assets/textures/dirt3.jpg', () => console.log('dirt3 loaded')),
            textureLoader.loadAsync('../assets/textures/dirt4.jpg', () => console.log('dirt4 loaded'))
        ]);

        grassTextures.forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(width / 10, height / 10);
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = true;
        });
        dirtTextures.forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(width / 10, height / 10);
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = true;
        });

        const material = new THREE.ShaderMaterial({
            uniforms: {
                grass1: { value: grassTextures[0] },
                grass2: { value: grassTextures[1] },
                grass3: { value: grassTextures[2] },
                grass4: { value: grassTextures[3] },
                dirt1: { value: dirtTextures[0] },
                dirt2: { value: dirtTextures[1] },
                dirt3: { value: dirtTextures[2] },
                dirt4: { value: dirtTextures[3] },
                maxHeight: { value: Math.max(...hills.map(h => h.height)) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying float vHeight;
                void main() {
                    vUv = uv;
                    vHeight = position.z;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D grass1;
                uniform sampler2D grass2;
                uniform sampler2D grass3;
                uniform sampler2D grass4;
                uniform sampler2D dirt1;
                uniform sampler2D dirt2;
                uniform sampler2D dirt3;
                uniform sampler2D dirt4;
                uniform float maxHeight;
                varying vec2 vUv;
                varying float vHeight;

                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }

                void main() {
                    float n = noise(vUv * 10.0);
                    float heightFactor = clamp(vHeight / maxHeight, 0.0, 1.0);

                    vec4 finalColor;
                    if (vHeight > 0.0) {
                        float dirtNoise = noise(vUv * 5.0 + vec2(1.0));
                        if (dirtNoise < 0.25) {
                            finalColor = texture2D(dirt1, vUv);
                        } else if (dirtNoise < 0.5) {
                            finalColor = texture2D(dirt2, vUv);
                        } else if (dirtNoise < 0.75) {
                            finalColor = texture2D(dirt3, vUv);
                        } else {
                            finalColor = texture2D(dirt4, vUv);
                        }
                    } else {
                        if (n < 0.25) {
                            finalColor = texture2D(grass1, vUv);
                        } else if (n < 0.5) {
                            finalColor = texture2D(grass2, vUv);
                        } else if (n < 0.75) {
                            finalColor = texture2D(grass3, vUv);
                        } else {
                            finalColor = texture2D(grass4, vUv);
                        }
                    }
                    gl_FragColor = finalColor;
                }
            `
        });
        console.log('Shader material with multiple textures created:', material);

        const terrainMesh = new THREE.Mesh(geometry, material);
        terrainMesh.rotation.x = -Math.PI / 2;
        console.log('Terrain mesh created:', terrainMesh);

        this.scene.add(terrainMesh);
        console.log('Terrain mesh added to scene');
        this.mesh = terrainMesh;

        // Trimesh로 물리 바디 생성
        const indices = geometry.index.array;
        const positions = geometry.attributes.position.array;
        const trimeshShape = new CANNON.Trimesh(positions, indices);
        this.groundBody = new CANNON.Body({
            mass: 0, // 정적 객체
            shape: trimeshShape,
            material: new CANNON.Material('groundMaterial')
        });
        this.groundBody.position.set(0, 0, 0);
        this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(this.groundBody);
        console.log('Terrain physics body (Trimesh) created and added:', this.groundBody);

        const groundMaterial = this.groundBody.material;
        const playerMaterial = new CANNON.Material('playerMaterial');
        const contactMaterial = new CANNON.ContactMaterial(
            groundMaterial,
            playerMaterial,
            {
                friction: 0.1,
                restitution: 0.1
            }
        );
        this.world.addContactMaterial(contactMaterial);

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
        const resourceCluster = new ResourceCluster(this.scene, this, this.world);
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