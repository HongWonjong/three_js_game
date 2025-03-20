import * as THREE from 'three';
import { CommandCenter } from './CommandCenter.js';
import { modelCache } from './ModelCache.js';

export class BuildingManager {
    constructor(game) {
        this.game = game;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.setupInput();
    }

    setupInput() {
        document.addEventListener('click', (event) => {
            if (event.button === 2) { // 우클릭 감지
                console.log('Right-click detected'); // 디버깅 로그
                this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, this.game.cameraController.camera);
                const intersects = this.raycaster.intersectObject(this.game.terrain.mesh);

                if (intersects.length > 0) {
                    const position = intersects[0].point;
                    console.log('Intersection point:', position); // 교차점 확인
                    this.buildCommandCenter(position);
                } else {
                    console.log('No intersection with terrain');
                }
            }
        });
    }

    async buildCommandCenter(position) {
        console.log('buildCommandCenter called with position:', position);
        if (this.game.resources.wood >= 100 && this.game.resources.stone >= 100) {
            this.game.resources.wood -= 100;
            this.game.resources.stone -= 100;
            this.game.ui.updateUI();
            console.log('Resources deducted, remaining:', this.game.resources);

            const playerPos = this.game.player.mesh.position;
            const distanceToPlayer = position.distanceTo(playerPos);
            const minDistance = 10;
            let adjustedPosition = position.clone();

            if (distanceToPlayer < minDistance) {
                const direction = position.clone().sub(playerPos).normalize();
                adjustedPosition = playerPos.clone().add(direction.multiplyScalar(minDistance));
                console.log(`Adjusted Command Center position: ${adjustedPosition.toArray()}`);
            }

            const commandCenter = new CommandCenter(
                this.game.scene,
                this.game.world,
                this.game.resources,
                adjustedPosition,
                this.game.terrain,
                this.game.resourceCluster,
                this.game,
                modelCache
            );
            console.log('CommandCenter instance created:', commandCenter);

            await commandCenter.init();
            this.game.commandCenters.push(commandCenter);
            console.log('Command Center construction completed at:', adjustedPosition);
        } else {
            this.game.ui.showWarning('Not enough resources to build Command Center!');
            console.log('Not enough resources!');
        }
    }

    async buildStructure(type, position) {
        switch (type) {
            case 'commandCenter':
                await this.buildCommandCenter(position);
                break;
            default:
                console.log('Unknown building type:', type);
        }
    }
}