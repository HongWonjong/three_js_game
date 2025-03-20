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
        this.setupInput();

        this.buildings = [
            { type: 'commandCenter', name: 'Command Center', wood: 100, stone: 100 },
            { type: 'barrack', name: 'Barrack', wood: 50, stone: 50 }
        ];
    }

    setupInput() {
        document.addEventListener('click', (event) => {
            if (event.button === 2) { // 우클릭
                console.log('Right-click event triggered, isMenuOpen:', this.isMenuOpen);
                if (this.isMenuOpen) {
                    this.hideBuildMenu();
                } else {
                    this.showBuildMenu(event);
                }
            }
        });

        document.addEventListener('keydown', (event) => {
            if (this.isMenuOpen && this.selectedPosition) {
                const index = parseInt(event.key);
                if (!isNaN(index) && index >= 0 && index < this.buildings.length) {
                    console.log('Building selected via key:', index);
                    this.buildStructure(this.buildings[index].type, this.selectedPosition);
                    this.hideBuildMenu();
                }
            }
        });
    }

    showBuildMenu(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.game.cameraController.camera);
        const intersects = this.raycaster.intersectObject(this.game.terrain.mesh);

        if (intersects.length > 0) {
            this.selectedPosition = intersects[0].point;
            console.log('Selected position for building:', this.selectedPosition);

            // 건물 선택 UI 생성 또는 재사용
            if (!this.buildMenu) {
                this.buildMenu = document.createElement('div');
                this.buildMenu.style.position = 'absolute';
                this.buildMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                this.buildMenu.style.color = 'white';
                this.buildMenu.style.padding = '10px';
                this.buildMenu.style.borderRadius = '5px';
                this.buildMenu.style.zIndex = '1000';
                document.body.appendChild(this.buildMenu);
                console.log('Build menu DOM element created');
            }

            // 메뉴 표시 및 위치 설정
            this.buildMenu.style.display = 'block'; // 숨김 해제
            this.buildMenu.style.left = `${event.clientX + 10}px`;
            this.buildMenu.style.top = `${event.clientY + 10}px`;

            // 건물 목록 갱신
            this.buildMenu.innerHTML = '<h3>Select a Building:</h3>';
            this.buildings.forEach((building, index) => {
                this.buildMenu.innerHTML += `<p>${index}: ${building.name} (Wood: ${building.wood}, Stone: ${building.stone})</p>`;
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
                        this.game
                    );
                    break;
                default:
                    console.error('Unknown building type:', type);
                    return;
            }

            await building.init();
            this.game.buildings.push(building);
            console.log(`${buildingData.name} construction completed at:`, adjustedPosition);
        } else {
            this.game.ui.showWarning(`Not enough resources to build ${buildingData.name}!`);
            console.log('Not enough resources!');
        }
    }
}