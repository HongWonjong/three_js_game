import * as THREE from 'three';
import { CommandCenter } from './CommandCenter.js';
import { Barrack } from './Barrack.js';
import { modelCache } from './ModelCache.js';

export class BuildingManager {
    constructor(game) {
        this.game = game;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.buildMenu = null;
        this.isMenuOpen = false;
        this.selectedPosition = null;
        this.buildings = [
            { type: 'commandCenter', name: 'Command Center', wood: 100, stone: 100, buildTime: 2000 },
            { type: 'barrack', name: 'Barrack', wood: 50, stone: 50, buildTime: 1500 }
        ];
        this.setupInput();
    }

    setupInput() {
        document.removeEventListener('click', this.handleClick);
        document.removeEventListener('keydown', this.handleKeydown);

        this.handleClick = (event) => {
            if (event.button === 2) {
                console.log('Right-click event triggered, isMenuOpen:', this.isMenuOpen);
                if (this.isMenuOpen) {
                    this.hideBuildMenu();
                } else {
                    this.showBuildMenu(event);
                }
            }
        };

        this.handleKeydown = (event) => {
            if (this.isMenuOpen && this.selectedPosition) {
                const index = parseInt(event.key);
                if (!isNaN(index) && index >= 0 && index < this.buildings.length) {
                    console.log('Building selected via key:', index);
                    this.buildStructure(this.buildings[index].type, this.selectedPosition);
                    this.hideBuildMenu();
                }
            }
        };

        document.addEventListener('click', this.handleClick);
        document.addEventListener('keydown', this.handleKeydown);
    }

    showBuildMenu(event) {
        if (!this.game || !this.game.cameraController || !this.game.cameraController.camera || !this.game.terrain || !this.game.terrain.mesh) {
            console.error('Game state is invalid. Cannot show build menu.');
            return;
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.game.cameraController.camera);
        const intersects = this.raycaster.intersectObject(this.game.terrain.mesh);

        if (intersects.length > 0) {
            this.selectedPosition = intersects[0].point;
            console.log('Selected position for building:', this.selectedPosition);

            if (!this.buildMenu || !document.body.contains(this.buildMenu)) {
                this.buildMenu = document.createElement('div');
                this.buildMenu.style.position = 'absolute';
                this.buildMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                this.buildMenu.style.color = 'white';
                this.buildMenu.style.padding = '10px';
                this.buildMenu.style.borderRadius = '5px';
                this.buildMenu.style.zIndex = '1000';
                document.body.appendChild(this.buildMenu);
                console.log('Build menu DOM element recreated');
            }

            this.buildMenu.style.display = 'block';
            this.buildMenu.style.left = `${event.clientX + 10}px`;
            this.buildMenu.style.top = `${event.clientY + 10}px`;

            this.buildMenu.innerHTML = '<h3>Select a Building:</h3>';
            this.buildings.forEach((building, index) => {
                this.buildMenu.innerHTML += `<p>${index}: ${building.name} (Wood: ${building.wood}, Stone: ${building.stone}, Time: ${building.buildTime / 1000}s)</p>`;
            });

            this.isMenuOpen = true;
            console.log('Build menu shown at:', { left: this.buildMenu.style.left, top: this.buildMenu.style.top });
        } else {
            console.log('No intersection with terrain for building placement');
        }
    }

    hideBuildMenu() {
        if (this.buildMenu) {
            this.buildMenu.style.display = 'none';
            this.isMenuOpen = false;
            this.selectedPosition = null;
            console.log('Build menu hidden');
        }
    }

    async buildStructure(type, position) {
        console.log(`Building ${type} at position:`, position);
        const buildingData = this.buildings.find(b => b.type === type);
        if (!buildingData) {
            console.error('Invalid building type:', type);
            return;
        }

        if (this.game.resources.wood >= buildingData.wood && this.game.resources.stone >= buildingData.stone) {
            this.game.resources.wood -= buildingData.wood;
            this.game.resources.stone -= buildingData.stone;
            this.game.ui.updateUI();
            console.log('Resources deducted, remaining:', this.game.resources);

            const playerPos = this.game.player.mesh.position;
            const distanceToPlayer = position.distanceTo(playerPos);
            const minDistance = 10;
            let adjustedPosition = position.clone();

            if (distanceToPlayer < minDistance) {
                const direction = position.clone().sub(playerPos).normalize();
                adjustedPosition = playerPos.clone().add(direction.multiplyScalar(minDistance));
                console.log(`Adjusted ${type} position: ${adjustedPosition.toArray()}`);
            }

            // 프로토스 스타일 구체 생성
            const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
            const constructionSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            constructionSphere.position.copy(adjustedPosition);
            constructionSphere.position.y += 3; // 지형 위에 1만큼 띄움
            this.game.scene.add(constructionSphere);

            // 진행률 텍스트 (Sprite 사용)
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            context.font = 'Bold 120px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const progressSprite = new THREE.Sprite(spriteMaterial);
            progressSprite.position.copy(adjustedPosition);
            progressSprite.position.y += 6;
            progressSprite.scale.set(4, 4, 1);
            this.game.scene.add(progressSprite);

            // 건설 애니메이션
            const buildTime = buildingData.buildTime;
            const startTime = performance.now();
            const animateConstruction = () => {
                const currentTime = performance.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / buildTime, 1);

                // 진행률 텍스트 업데이트
                context.clearRect(0, 0, canvas.width, canvas.height);
                const percentage = Math.round(progress * 100);
                context.fillText(`${percentage}%`, canvas.width / 2, canvas.height / 2);
                texture.needsUpdate = true;

                if (progress < 1) {
                    requestAnimationFrame(animateConstruction);
                } else {
                    // 건설 완료
                    this.game.scene.remove(constructionSphere);
                    this.game.scene.remove(progressSprite);
                    sphereGeometry.dispose();
                    sphereMaterial.dispose();
                    spriteMaterial.dispose();
                    texture.dispose();

                    let building;
                    switch (type) {
                        case 'commandCenter':
                            building = new CommandCenter(
                                this.game.scene,
                                this.game.world,
                                this.game.resources,
                                adjustedPosition,
                                this.game.terrain,
                                this.game.resourceCluster,
                                this.game,
                                modelCache
                            );
                            break;
                        case 'barrack':
                            building = new Barrack(
                                this.game.scene,
                                this.game.world,
                                this.game.resources,
                                adjustedPosition,
                                this.game.terrain,
                                this.game.resourceCluster,
                                this.game,
                                modelCache
                            );
                            break;
                        default:
                            console.error('Unknown building type:', type);
                            return;
                    }

                    building.init().then(() => {
                        this.game.buildings.push(building);
                        console.log(`${buildingData.name} construction completed at:`, adjustedPosition);

                        // 사운드 재생
                        const completionSound = new Audio('../assets/sounds/building_complete.mp3');
                        completionSound.volume = 0.5; // 볼륨 조정 (0.0 ~ 1.0)
                        completionSound.play().catch(error => {
                            console.error('Failed to play completion sound:', error);
                        });

                        // UI에 완료 메시지 표시
                        this.game.ui.showCompletion(`${buildingData.name} construction completed`);
                    });
                }
            };

            requestAnimationFrame(animateConstruction);
        } else {
            this.game.ui.showWarning(`Not enough resources to build ${buildingData.name}!`);
            console.log('Not enough resources!');
        }
    }

    destroy() {
        document.removeEventListener('click', this.handleClick);
        document.removeEventListener('keydown', this.handleKeydown);
        if (this.buildMenu && document.body.contains(this.buildMenu)) {
            document.body.removeChild(this.buildMenu);
        }
        this.buildMenu = null;
        this.isMenuOpen = false;
        console.log('BuildingManager destroyed');
    }
}