import * as THREE from 'three';
import { WorkerDroneLogic } from './WorkerDroneLogic.js';

export class WorkerDrone {
    constructor(scene, world, terrain, resourceCluster, commandCenter, modelCache) {
        this.scene = scene;
        this.world = world;
        this.terrain = terrain;
        this.resourceCluster = resourceCluster;
        this.commandCenter = commandCenter;
        this.modelCache = modelCache || {};
        this.logic = new WorkerDroneLogic(this, world, terrain, resourceCluster, commandCenter);
        this.mesh = null;
        this.body = null;
    }

    async createDrone() {
        let model;
        let size;

        if (this.modelCache.workerDrone) {
            model = this.modelCache.workerDrone.scene.clone();
            console.log('Using cached WorkerDrone model');
        } else {
            console.log('Using fallback mesh (cache not ready)');
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            this.mesh = new THREE.Mesh(geometry, material);
            size = new THREE.Vector3(1, 1, 1);
        }

        if (model) {
            this.mesh = model;
            this.mesh.scale.set(0.5, 0.5, 0.5);
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            size = new THREE.Vector3();
            boundingBox.getSize(size);
            console.log('WorkerDrone model size (scaled):', size);
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

        await this.createPickaxe();
        console.log('WorkerDrone created with position:', this.mesh.position);
    }

    async createPickaxe() {
        let pickaxeModel;

        if (this.modelCache.pickaxe) {
            pickaxeModel = this.modelCache.pickaxe.scene.clone();
            console.log('Using cached Pickaxe model');
        } else {
            console.log('Using fallback pickaxe mesh (cache not ready)');
            const geometry = new THREE.BoxGeometry(0.3, 0.3, 3.0); // 길이 3인 직사각형
            const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
            pickaxeModel = new THREE.Mesh(geometry, material);
        }

        this.pickaxe = new THREE.Object3D(); // 피벗용 빈 객체 생성
        this.pickaxeMesh = pickaxeModel; // 실제 곡괭이 메쉬
        this.pickaxeMesh.scale.set(0.8, 0.8, 0.8);

        // 곡괭이 중간을 피벗으로 설정 (길이 3의 중간 → z = -1.5로 이동 후 조정)
        this.pickaxeMesh.position.set(0, 3, 0); // 중간이 (0, 0, 0)이 되도록
        this.pickaxe.add(this.pickaxeMesh); // 피벗 객체에 추가
        this.pickaxe.position.set(1.5, 3.0, 0); // 드론에서의 위치 조정

        this.mesh.add(this.pickaxe);
        this.swingAngle = 0;
        this.swingSpeed = 0.15; // 더 빠르게 흔들리도록 속도 증가
        console.log('Pickaxe added to drone with pivot at center');
    }

    animatePickaxe() {
        this.swingAngle += this.swingSpeed;
        if (this.swingAngle > Math.PI / 2 || this.swingAngle < -Math.PI / 2) { // 90도 범위로 더 크게 흔들림
            this.swingSpeed *= -1;
        }
        this.pickaxe.rotation.x = this.swingAngle; // 앞뒤 흔들림 (X축)
    }

    addResourceMesh(type) {
        const geometry = new THREE.SphereGeometry(1.0, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: type === 'wood' ? 0x8B4513 : 0x808080
        });
        this.resourceMesh = new THREE.Mesh(geometry, material);
        this.resourceMesh.position.set(0, 4.0, -0.6);
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

            const velocity = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z);
            const speed = velocity.length();
            if (speed > 0.1) {
                const direction = velocity.clone().normalize();
                const targetPosition = this.mesh.position.clone().add(direction);
                this.mesh.lookAt(targetPosition);
                console.log('Drone rotated to face direction:', direction);
            }

            if (this.terrain && typeof this.terrain.getHeightAt === 'function') {
                const currentHeight = this.terrain.getHeightAt(this.body.position.x, this.body.position.z);
                const targetHeight = currentHeight + 1;
                if (Math.abs(this.body.position.y - targetHeight) > 0.1) {
                    this.body.position.y = targetHeight;
                    this.body.velocity.y = 0;
                    console.log('Adjusted drone height to:', this.body.position.y);
                }
            } else {
                console.warn('Terrain is not properly initialized in WorkerDrone');
            }

            if (this.logic.isHarvesting) {
                this.animatePickaxe();
            }

            console.log('Drone mesh position updated to:', this.mesh.position);
        }
    }
}