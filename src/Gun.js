import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const CANNON = window.CANNON;

console.log('Gun.js loaded successfully');
console.log('Defining Gun class...');

export class Gun {
    constructor(scene, playerMesh, world, terrain, resourceCluster, buildings) {
        console.log('Gun constructor called with scene:', scene, 'playerMesh:', playerMesh, 'world:', world);
        this.scene = scene;
        this.playerMesh = playerMesh;
        this.world = world;
        this.terrain = terrain;
        this.resourceCluster = resourceCluster;
        this.bullets = [];
        this.lastShotTime = 0;
        this.fireRate = 0.5;
        this.isZoomMode = false; // 줌 모드 상태 추가
        this.createGun();

        // 클릭 이벤트 (발사)
        document.addEventListener('click', (event) => {
            if (event.button === 0) {
                if (document.pointerLockElement === document.body) {
                    this.shoot();
                }
            }
        });

        // F 키로 줌 모드 토글
        document.addEventListener('keydown', (event) => {
            if (event.key === 'f' || event.key === 'F') {
                this.isZoomMode = !this.isZoomMode;
                console.log('Zoom mode:', this.isZoomMode ? 'ON' : 'OFF');
                if (!this.isZoomMode && this.trajectoryLine) {
                    // 줌 모드가 꺼지면 궤적 제거
                    this.scene.remove(this.trajectoryLine);
                    this.trajectoryLine.geometry.dispose();
                    this.trajectoryLine.material.dispose();
                    this.trajectoryLine = null;
                }
            }
        });
    }

    async createGun() {
        const loader = new GLTFLoader();

        try {
            console.log('Attempting to load gun model from: ../assets/gun/gun.gltf');
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    '../assets/gun/gun.gltf',
                    (gltf) => resolve(gltf),
                    (progress) => console.log('Loading progress:', progress.loaded, '/', progress.total),
                    (error) => reject(error)
                );
            });

            this.mesh = gltf.scene;
            this.mesh.scale.set(0.2, 0.2, 0.2);
            this.mesh.position.set(0.5, -0.6, 0.7);
            this.mesh.castShadow = true;
            console.log('Gun mesh created with position:', this.mesh.position);

            const textureLoader = new THREE.TextureLoader();
            const baseColorMap = await textureLoader.loadAsync('../assets/gun/textures/Cybergun_baseColor.png');
            const normalMap = await textureLoader.loadAsync('../assets/gun/textures/Cybergun_normal.png');

            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (!child.material || child.material.type === 'MeshBasicMaterial') {
                        child.material = new THREE.MeshPhongMaterial({
                            map: baseColorMap,
                            normalMap: normalMap,
                            normalScale: new THREE.Vector2(1, 1),
                            color: 0xffffff,
                            specular: 0x050505,
                            shininess: 100
                        });
                        child.material.needsUpdate = true;
                    }
                    child.castShadow = true;
                }
            });

            this.playerMesh.add(this.mesh);
            console.log('Gun mesh added to player:', this.mesh);
        } catch (error) {
            console.error('Failed to load gun model:', error);
            const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.5);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(0.5, 0.5, -0.5);
            this.mesh.scale.set(0.3, 0.3, 0.3);
            this.playerMesh.add(this.mesh);
            console.log('Fallback gun mesh added:', this.mesh);
        }
    }

    showPredictedTrajectory() {
        // 기존 궤적 선이 있으면 제거
        if (this.trajectoryLine) {
            this.scene.remove(this.trajectoryLine);
            this.trajectoryLine.geometry.dispose();
            this.trajectoryLine.material.dispose();
        }

        // 총구 위치와 방향 계산
        const muzzleOffset = new THREE.Vector3(0, 1, 0);
        const muzzlePosition = muzzleOffset.clone().applyQuaternion(this.mesh.quaternion).add(this.mesh.getWorldPosition(new THREE.Vector3()));
        const direction = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(this.mesh.quaternion)
            .applyQuaternion(this.playerMesh.quaternion)
            .normalize();

        // 궤적의 끝점 계산 (최대 거리 설정, 예: 100 유닛)
        const maxDistance = 100;
        const endPoint = muzzlePosition.clone().add(direction.clone().multiplyScalar(maxDistance));

        // 궤적 선 생성
        const geometry = new THREE.BufferGeometry().setFromPoints([muzzlePosition, endPoint]);
        const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        this.trajectoryLine = new THREE.Line(geometry, material);
        this.scene.add(this.trajectoryLine);

        console.log('Predicted trajectory shown from:', muzzlePosition, 'to:', endPoint);
    }

    shoot() {
        const currentTime = performance.now() / 1000;
        const timeSinceLastShot = currentTime - this.lastShotTime;

        if (timeSinceLastShot < this.fireRate) {
            return;
        }

        this.lastShotTime = currentTime;

        const bulletGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

        const muzzleOffset = new THREE.Vector3(0, 1, 0);
        const muzzlePosition = muzzleOffset.clone().applyQuaternion(this.mesh.quaternion).add(this.mesh.getWorldPosition(new THREE.Vector3()));
        bulletMesh.position.copy(muzzlePosition);
        this.scene.add(bulletMesh);

        const direction = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(this.mesh.quaternion)
            .applyQuaternion(this.playerMesh.quaternion);
        direction.normalize();

        const bulletShape = new CANNON.Sphere(0.1);
        const bulletBody = new CANNON.Body({
            mass: 1,
            shape: bulletShape,
            material: new CANNON.Material('bulletMaterial')
        });
        bulletBody.position.copy(bulletMesh.position);

        const bulletSpeed = 400;
        bulletBody.velocity.set(
            direction.x * bulletSpeed,
            direction.y * bulletSpeed,
            direction.z * bulletSpeed
        );

        this.world.addBody(bulletBody);
        this.bullets.push({ mesh: bulletMesh, body: bulletBody });

        bulletBody.addEventListener('collide', (event) => {
            const otherBody = event.body;
            if (this.isCollidableObject(otherBody)) {
                this.removeBullet(bulletMesh, bulletBody);
            }
        });

        const gunshotSound = new Audio('../assets/sounds/gunshot.mp3');
        gunshotSound.volume = 0.2;
        gunshotSound.play().catch(error => {
            console.error('Failed to play gunshot sound:', error);
        });

        console.log('Shot fired from muzzle at:', muzzlePosition, 'Direction:', direction);
    }

    isCollidableObject(body) {
        const isTree = this.resourceCluster.trees.some(tree => tree.body === body);
        const isRock = this.resourceCluster.rocks.some(rock => rock.body === body);
        const isPlayer = body === this.playerMesh.userData.physicsBody;
        const isTerrain = body === this.terrain.groundBody;

        return isTree || isRock || isPlayer || isTerrain;
    }

    removeBullet(mesh, body) {
        this.scene.remove(mesh);
        this.world.removeBody(body);
        this.bullets = this.bullets.filter(bullet => bullet.mesh !== mesh);
        console.log('Bullet removed:', mesh);
    }

    update() {
        this.bullets.forEach(bullet => {
            bullet.mesh.position.copy(bullet.body.position);
            bullet.mesh.quaternion.copy(bullet.body.quaternion);
        });

        // 줌 모드일 때 궤적 지속적으로 업데이트
        if (this.isZoomMode) {
            this.showPredictedTrajectory();
        }
    }
}

console.log('Gun class defined and exported');