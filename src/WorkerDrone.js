import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { WorkerDroneLogic } from './WorkerDroneLogic.js';

export class WorkerDrone {
    constructor(scene, world, terrain, resourceCluster, commandCenter) {
        this.scene = scene;
        this.world = world;
        this.logic = new WorkerDroneLogic(this, world, terrain, resourceCluster, commandCenter);
        this.mesh = null;
        this.body = null;
    }

    async createDrone() {
        const loader = new GLTFLoader();
        let model;
        let size;

        try {
            console.log('Loading WorkerDrone model from: /assets/robots/worker/worker.gltf');
            model = await new Promise((resolve, reject) => {
                loader.load(
                    '/assets/robots/worker/worker.gltf',
                    (gltf) => {
                        console.log('WorkerDrone model loaded successfully:', gltf.scene);
                        resolve(gltf.scene);
                    },
                    (progress) => console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%'),
                    (error) => reject(error)
                );
            });
        } catch (error) {
            console.error('Failed to load WorkerDrone model:', error);
        }

        if (model) {
            this.mesh = model;
            this.mesh.scale.set(0.5, 0.5, 0.5);
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            size = new THREE.Vector3();
            boundingBox.getSize(size);
            console.log('WorkerDrone model size (scaled):', size);
        } else {
            console.log('Using fallback mesh');
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            this.mesh = new THREE.Mesh(geometry, material);
            size = new THREE.Vector3(1, 1, 1);
        }
        this.scene.add(this.mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        this.body = new CANNON.Body({ mass: 1 });
        this.body.addShape(shape);
        this.body.position.copy(this.mesh.position);
        this.body.velocity.set(0, 0, 0);
        this.body.material = new CANNON.Material('droneMaterial');
        this.body.material.friction = 0;
        this.world.addBody(this.body);
        console.log('Drone body added to world:', this.body.position);

        this.createPickaxe();
        console.log('WorkerDrone created with position:', this.mesh.position);
    }

    createPickaxe() {
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 1.5);
        const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        this.pickaxe = new THREE.Mesh(geometry, material);
        this.pickaxe.position.set(0.8, 0, 0);
        this.mesh.add(this.pickaxe);
        this.swingAngle = 0;
        this.swingSpeed = 0.1;
        console.log('Pickaxe added to drone');
    }

    animatePickaxe() {
        this.swingAngle += this.swingSpeed;
        if (this.swingAngle > Math.PI / 4 || this.swingAngle < -Math.PI / 4) {
            this.swingSpeed *= -1;
        }
        this.pickaxe.rotation.z = this.swingAngle;
    }

    addResourceMesh(type) {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: type === 'wood' ? 0x8B4513 : 0x808080
        });
        this.resourceMesh = new THREE.Mesh(geometry, material);
        this.resourceMesh.position.set(0, 0.8, 0);
        this.mesh.add(this.resourceMesh);
        console.log('Resource mesh added:', type);
    }

    removeResourceMesh() {
        if (this.resourceMesh) {
            this.mesh.remove(this.resourceMesh);
            this.resourceMesh = null;
            console.log('Resource mesh removed');
        }
    }

    update() {
        this.logic.update();
        if (this.mesh && this.body) {
            this.mesh.position.copy(this.body.position);

            // 이동 방향으로 회전
            const velocity = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z); // y축 회전 무시
            const speed = velocity.length();
            if (speed > 0.1) { // 속도가 충분히 클 때만 회전 (작은 진동 방지)
                const direction = velocity.clone().normalize();
                const targetPosition = this.mesh.position.clone().add(direction);
                this.mesh.lookAt(targetPosition);
                console.log('Drone rotated to face direction:', direction);
            }

            console.log('Drone mesh position updated to:', this.mesh.position);
        }
    }
}