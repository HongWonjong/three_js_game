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
        this.isAvoiding = false;
        this.lastUpdateTime = 0;
        this.updateInterval = 0.3;
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

        const allResources = [...trees, ...rocks];
        let nearest = null;
        let minDist = Infinity;
        const centerPos = this.commandCenter.body.position;

        for (const resource of allResources) {
            if (!resource.body || !resource.body.position || resource.amount <= 0 || resource.isBeingHarvested) {
                console.log('Invalid, depleted, or already targeted resource detected:', resource);
                continue;
            }
            const dist = centerPos.distanceTo(resource.body.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = resource;
            }
        }

        if (nearest) {
            nearest.isBeingHarvested = true;
            console.log(`Nearest target found and reserved: ${nearest.type} at distance ${minDist}, position:`, nearest.body.position);
        } else {
            console.log('No valid targets found from Command Center');
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

        // 장애물 감지: 앞쪽으로 2유닛 테스트
        const forward = direction.clone().multiplyScalar(2);
        const testPos = currentPos.clone().add(forward);
        let closestObstacle = null;
        let minDistToObstacle = Infinity;

        this.world.bodies.forEach(body => {
            if (body === this.drone.body || body === this.target?.body) return;
            const bodyPos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
            const dist = testPos.distanceTo(bodyPos);
            if (dist < 2 && dist < minDistToObstacle) {
                minDistToObstacle = dist;
                closestObstacle = bodyPos;
            }
        });

        if (closestObstacle) {
            // 오른쪽으로만 회피 (고정된 90도)
            this.avoidanceAngle = Math.PI / 2;
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.avoidanceAngle);
            this.isAvoiding = true;

            const avoidanceSpeed = this.speed * 0.7;
            this.drone.body.velocity.set(direction.x * avoidanceSpeed, this.drone.body.velocity.y, direction.z * avoidanceSpeed);
            console.log('Obstacle detected, avoiding to the right at angle:', this.avoidanceAngle, 'Velocity:', this.drone.body.velocity);
        } else {
            if (this.isAvoiding) {
                this.avoidanceAngle = 0;
                this.isAvoiding = false;
                console.log('Obstacle cleared, resuming direct path');
            }
            this.drone.body.velocity.set(direction.x * this.speed, this.drone.body.velocity.y, direction.z * this.speed);
            console.log('No obstacles, moving directly to:', target, 'Velocity:', this.drone.body.velocity);
        }

        // 높이 조정
        const currentHeight = this.terrain.getHeightAt(this.drone.body.position.x, this.drone.body.position.z);
        const targetHeight = currentHeight + 1;
        if (Math.abs(this.drone.body.position.y - targetHeight) > 0.1) {
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
        target.isBeingHarvested = false;
        this.target = null;
        console.log('Resource collected, target reset');
    }

    update() {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
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
            if (dist < 10) {
                this.collectResource(this.target);
            } else {
                this.moveToTarget(this.target.body.position);
            }
        } else {
            const dist = this.drone.body.position.distanceTo(this.commandCenter.body.position);
            console.log('Distance to Command Center:', dist);
            if (dist < 10) {
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