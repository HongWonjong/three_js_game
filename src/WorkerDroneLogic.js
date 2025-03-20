import * as THREE from 'three';
import { audioListener } from './Camera.js';

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
        this.avoidanceStartTime = 0;
        this.avoidanceDuration = 3;
        this.lastUpdateTime = 0;
        this.updateInterval = 0.3;
        this.isHarvesting = false;
        this.harvestStartTime = 0;
        this.harvestDuration = 3;

        this.miningSound = null; // 초기화 지연
        console.log('WorkerDroneLogic initialized');
    }

    setupMiningSound() {
        this.miningSound = new THREE.PositionalAudio(audioListener);
        this.miningSound.setRefDistance(10);
        this.miningSound.setRolloffFactor(1);
        this.miningSound.setMaxDistance(50);
        this.miningSound.setLoop(true);
        this.miningSound.setVolume(0.5);

        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('../assets/sounds/mining.mp3', (buffer) => {
            this.miningSound.setBuffer(buffer);
            console.log('Mining sound loaded successfully');
        }, undefined, (error) => {
            console.error('Failed to load mining sound:', error);
        });

        this.drone.mesh.add(this.miningSound);
        console.log('Mining sound added to drone mesh');
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

    findSafeWaypoint(currentPos, targetPos) {
        const directionToTarget = targetPos.clone().sub(currentPos).setY(0).normalize();
        const testAngles = [-Math.PI / 2, Math.PI / 2, -Math.PI / 4, Math.PI / 4];
        let bestWaypoint = null;
        let minDistanceToTarget = Infinity;

        for (const angle of testAngles) {
            const testDirection = directionToTarget.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            const testPos = currentPos.clone().add(testDirection.multiplyScalar(5));

            let isSafe = true;
            this.world.bodies.forEach(body => {
                if (body === this.drone.body || body === this.target?.body) return;
                const bodyPos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
                if (testPos.distanceTo(bodyPos) < 2) {
                    isSafe = false;
                }
            });

            if (isSafe) {
                const distanceToTarget = testPos.distanceTo(targetPos);
                if (distanceToTarget < minDistanceToTarget) {
                    minDistanceToTarget = distanceToTarget;
                    bestWaypoint = testPos;
                }
            }
        }

        return bestWaypoint || currentPos.clone().add(directionToTarget.multiplyScalar(5));
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

        const currentTime = performance.now() / 1000;
        const timeSinceAvoidance = currentTime - this.avoidanceStartTime;

        if (this.isAvoiding && timeSinceAvoidance < this.avoidanceDuration) {
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.avoidanceAngle);
            const avoidanceSpeed = this.speed * 0.7;
            this.drone.body.velocity.set(direction.x * avoidanceSpeed, this.drone.body.velocity.y, direction.z * avoidanceSpeed);
            console.log('Continuing avoidance for', (this.avoidanceDuration - timeSinceAvoidance).toFixed(2), 'seconds, Velocity:', this.drone.body.velocity);
            return;
        }

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
            const waypoint = this.findSafeWaypoint(currentPos, target);
            direction = waypoint.clone().sub(currentPos).setY(0).normalize();
            this.avoidanceAngle = Math.acos(directionToTarget.dot(direction));
            if (directionToTarget.cross(direction).y < 0) this.avoidanceAngle = -this.avoidanceAngle;
            this.isAvoiding = true;
            this.avoidanceStartTime = currentTime;
            const avoidanceSpeed = this.speed * 0.7;
            this.drone.body.velocity.set(direction.x * avoidanceSpeed, this.drone.body.velocity.y, direction.z * avoidanceSpeed);
            console.log('Obstacle detected, moving to safe waypoint:', waypoint, 'Velocity:', this.drone.body.velocity);
        } else {
            if (this.isAvoiding) {
                this.avoidanceAngle = 0;
                this.isAvoiding = false;
                console.log('Obstacle cleared, resuming direct path');
            }
            this.drone.body.velocity.set(direction.x * this.speed, this.drone.body.velocity.y, direction.z * this.speed);
            console.log('No obstacles, moving directly to:', target, 'Velocity:', this.drone.body.velocity);
        }
    }

    collectResource(target) {
        if (!target || !target.body) {
            console.log('Invalid target for collection');
            return;
        }

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
            this.target = null;
        }

        this.carrying = { type: target.type, amount: harvestAmount };
        this.drone.addResourceMesh(this.carrying.type);
        this.isHarvesting = false;
        console.log('Resource collected, carrying:', this.carrying);
    }

    update() {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = currentTime;

        console.log('WorkerDroneLogic update called, carrying:', this.carrying, 'target:', this.target?.body?.position);

        if (!this.carrying) {
            if (!this.target || !this.target.body || this.target.amount <= 0) {
                this.target = this.findNearestTarget();
                if (!this.target) {
                    console.log('No resources available, drone idle');
                    this.drone.body.velocity.set(0, this.drone.body.velocity.y, 0);
                    if (this.miningSound && this.miningSound.isPlaying) {
                        this.miningSound.stop();
                        console.log('Mining sound stopped due to idle state');
                    }
                    return;
                }
            }

            const dist = this.drone.body.position.distanceTo(this.target.body.position);
            console.log('Distance to target:', dist);
            if (dist < 10) {
                if (!this.isHarvesting) {
                    this.isHarvesting = true;
                    this.harvestStartTime = currentTime;
                    this.drone.body.velocity.set(0, this.drone.body.velocity.y, 0);
                    if (this.miningSound && !this.miningSound.isPlaying) {
                        this.miningSound.play();
                        console.log('Mining sound started');
                    }
                    console.log('Starting harvest of', this.target.type, 'at', this.target.body.position);
                }

                const timeSinceHarvestStart = currentTime - this.harvestStartTime;
                if (timeSinceHarvestStart >= this.harvestDuration) {
                    this.collectResource(this.target);
                    if (this.miningSound && this.miningSound.isPlaying) {
                        this.miningSound.stop();
                        console.log('Mining sound stopped after harvest');
                    }
                } else {
                    console.log('Harvesting in progress, time remaining:', (this.harvestDuration - timeSinceHarvestStart).toFixed(2), 'seconds');
                }
            } else {
                this.moveToTarget(this.target.body.position);
                if (this.miningSound && this.miningSound.isPlaying) {
                    this.miningSound.stop();
                    console.log('Mining sound stopped while moving to target');
                }
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
            if (this.miningSound && this.miningSound.isPlaying) {
                this.miningSound.stop();
                console.log('Mining sound stopped while returning to Command Center');
            }
        }
    }
}