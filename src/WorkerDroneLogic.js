import * as THREE from 'three';

export class WorkerDroneLogic {
    constructor(drone, world, terrain, resourceCluster, commandCenter) {
        this.drone = drone;
        this.world = world;
        this.terrain = terrain;
        this.resourceCluster = resourceCluster;
        this.commandCenter = commandCenter;
        this.speed = 5;
        this.target = null;
        this.carrying = null;
        this.avoidanceAngle = 0;
        this.lastUpdateTime = 0;
        this.updateInterval = 0.3; // 0.3초 간격
        console.log('WorkerDroneLogic initialized');
    }

    findNearestTarget() {
        const trees = this.resourceCluster.trees || [];
        const rocks = this.resourceCluster.rocks || [];
        console.log('Available trees:', trees.length, 'rocks:', rocks.length);
        if (trees.length === 0 && rocks.length === 0) {
            console.log('No resources available to target');
            return null;
        }

        let nearest = null;
        let minDist = Infinity;
        const dronePos = this.drone.body.position;

        for (const tree of trees) {
            if (!tree.body || !tree.body.position || tree.amount <= 0 || tree.isBeingHarvested) {
                console.log('Invalid, depleted, or already targeted tree detected:', tree);
                continue;
            }
            const dist = dronePos.distanceTo(tree.body.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = tree;
            }
        }
        for (const rock of rocks) {
            if (!rock.body || !rock.body.position || rock.amount <= 0 || rock.isBeingHarvested) {
                console.log('Invalid, depleted, or already targeted rock detected:', rock);
                continue;
            }
            const dist = dronePos.distanceTo(rock.body.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = rock;
            }
        }

        if (nearest) {
            nearest.isBeingHarvested = true; // 타겟 선택 시 즉시 채취 중으로 표시
            console.log(`Nearest target found and reserved: ${nearest.type} at distance ${minDist}, position:`, nearest.body.position);
        } else {
            console.log('No valid targets found');
        }
        return nearest;
    }

    moveToTarget(targetPos) {
        if (!targetPos) {
            console.log('No target position provided, stopping drone');
            this.drone.body.velocity.set(0, this.drone.body.velocity.y, 0);
            return;
        }

        const target = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
        const currentPos = new THREE.Vector3(this.drone.body.position.x, this.drone.body.position.y, this.drone.body.position.z);
        let direction = target.clone().sub(currentPos).setY(0).normalize();

        const forward = direction.clone().multiplyScalar(2);
        const testPos = currentPos.clone().add(forward);
        const isBlocked = this.world.bodies.some(body => {
            if (body === this.drone.body || body === this.target?.body) return false;
            const bodyPos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
            return testPos.distanceTo(bodyPos) < 2;
        });

        if (isBlocked) {
            this.avoidanceAngle += Math.PI / 4;
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.avoidanceAngle);
            console.log('Obstacle detected, avoiding at angle:', this.avoidanceAngle);
        } else {
            this.avoidanceAngle = 0;
            console.log('No obstacles, moving directly');
        }

        this.drone.body.velocity.set(direction.x * this.speed, this.drone.body.velocity.y, direction.z * this.speed);
        console.log('Drone moving to:', target, 'Velocity:', this.drone.body.velocity);

        const currentHeight = this.terrain.getHeightAt(this.drone.body.position.x, this.drone.body.position.z);
        const targetHeight = currentHeight + 1;
        if (this.drone.body.position.y < targetHeight) {
            this.drone.body.position.y = targetHeight;
            this.drone.body.velocity.y = 0;
            console.log('Adjusted drone height to:', this.drone.body.position.y);
        }
    }

    collectResource(target) {
        if (!target || !target.body) {
            console.log('Invalid target for collection');
            return;
        }

        this.drone.animatePickaxe();
        console.log(`Collecting ${target.type} at position:`, target.body.position);
        const harvestAmount = Math.min(8, target.amount);
        target.amount -= harvestAmount;
        console.log(`Harvested ${harvestAmount} ${target.type}, remaining:`, target.amount);

        if (target.amount <= 0) {
            this.drone.scene.remove(target.mesh);
            this.world.removeBody(target.body);
            if (target.type === 'wood') {
                this.resourceCluster.trees = this.resourceCluster.trees.filter(t => t !== target);
            } else if (target.type === 'stone') {
                this.resourceCluster.rocks = this.resourceCluster.rocks.filter(r => r !== target);
            }
            console.log(`${target.type} depleted and removed`);
        }

        this.carrying = { type: target.type, amount: harvestAmount };
        this.drone.addResourceMesh(this.carrying.type);
        target.isBeingHarvested = false; // 채취 완료 후 해제
        this.target = null;
        console.log('Resource collected, target reset');
    }

    update() {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return; // 0.3초 미만이면 스킵
        }
        this.lastUpdateTime = currentTime;

        console.log('WorkerDroneLogic update called, carrying:', this.carrying, 'target:', this.target?.body?.position);
        if (!this.carrying) {
            if (!this.target || !this.target.body) {
                this.target = this.findNearestTarget();
                if (!this.target) {
                    console.log('No resources available, drone idle');
                    this.drone.body.velocity.set(0, this.drone.body.velocity.y, 0);
                    return;
                }
            }

            const dist = this.drone.body.position.distanceTo(this.target.body.position);
            console.log('Distance to target:', dist);
            if (dist < 10) { // 거리 10 유지
                this.collectResource(this.target);
            } else {
                this.moveToTarget(this.target.body.position);
            }
        } else {
            const dist = this.drone.body.position.distanceTo(this.commandCenter.body.position);
            console.log('Distance to Command Center:', dist);
            if (dist < 10) { // 거리 10 유지
                this.commandCenter.receiveResources(this.carrying.type, this.carrying.amount);
                this.drone.removeResourceMesh();
                this.carrying = null;
                console.log('Resource delivered to Command Center');
            } else {
                this.moveToTarget(this.commandCenter.body.position);
            }
        }
    }
}