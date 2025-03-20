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
        this.buildings = buildings;
        this.bullets = [];
        this.createGun();

        document.addEventListener('click', (event) => {
            if (event.button === 0) {
                if (document.pointerLockElement === document.body) {
                    this.shoot();
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
            this.mesh.position.set(0.5, -0.6, 0.7); // 플레이어 손에 맞춘 1인칭 위치
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

    shoot() {
        const bulletGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

        // 총구 위치 계산
        const muzzleOffset = new THREE.Vector3(0, 1, 0); // 총구 위치 조정 필요 시 변경
        const muzzlePosition = muzzleOffset.clone().applyQuaternion(this.mesh.quaternion).add(this.mesh.getWorldPosition(new THREE.Vector3()));
        bulletMesh.position.copy(muzzlePosition);
        this.scene.add(bulletMesh);

        // 총구 방향 계산
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

        const bulletSpeed = 200;
        bulletBody.velocity.set(
            direction.x * bulletSpeed,
            direction.y * bulletSpeed,
            direction.z * bulletSpeed
        );

        this.world.addBody(bulletBody);
        const creationTime = performance.now(); // 총알 생성 시간 기록
        this.bullets.push({ mesh: bulletMesh, body: bulletBody, creationTime });

        // 충돌 이벤트 처리
        bulletBody.addEventListener('collide', (event) => {
            const otherBody = event.body;
            if (this.isCollidableObject(otherBody)) {
                this.removeBullet(bulletMesh, bulletBody);
            }
        });

        console.log('Shot fired from muzzle at:', muzzlePosition, 'Direction:', direction);
    }

    isCollidableObject(body) {
        const isTree = this.resourceCluster.trees.some(tree => tree.body === body);
        const isRock = this.resourceCluster.rocks.some(rock => rock.body === body);
        const isBuilding = this.buildings.some(building => building.body === body);
        const isPlayer = body === this.playerMesh.userData.physicsBody;
        const isTerrain = body === this.terrain.groundBody; // 'body' 대신 'groundBody'로 수정 (Terrain.js와 일치)

        return isTree || isRock || isBuilding || isPlayer || isTerrain;
    }

    removeBullet(mesh, body) {
        this.scene.remove(mesh);
        this.world.removeBody(body);
        this.bullets = this.bullets.filter(bullet => bullet.mesh !== mesh);
        console.log('Bullet removed:', mesh);
    }

    update() {
        const currentTime = performance.now();
        this.bullets.forEach(bullet => {
            bullet.mesh.position.copy(bullet.body.position);
            bullet.mesh.quaternion.copy(bullet.body.quaternion);

            // 지형 높이 체크
            const terrainHeight = this.terrain.getHeightAt(bullet.body.position.x, bullet.body.position.z);
            if (bullet.body.position.y - 0.05 <= terrainHeight) {
                this.removeBullet(bullet.mesh, bullet.body);
                return; // 제거 후 다음 총알로 넘어감
            }

            // 5초 수명 체크
            const elapsedTime = (currentTime - bullet.creationTime) / 1000; // 초 단위
            if (elapsedTime >= 5) {
                this.removeBullet(bullet.mesh, bullet.body);
            }
        });
    }
}

console.log('Gun class defined and exported');