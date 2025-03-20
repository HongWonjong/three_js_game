import * as THREE from 'three';

export class RobotSoldierLogic {
    constructor(soldier, world, player, allSoldiers) { // 모든 로봇 솔저 배열 추가
        this.soldier = soldier;
        this.world = world;
        this.player = player;
        this.allSoldiers = allSoldiers; // 모든 로봇 솔저 참조
        this.speed = 3;
        this.isAvoiding = false;
        this.avoidanceAngle = 0;
        this.avoidanceStartTime = 0;
        this.avoidanceDuration = 2;
        this.lastUpdateTime = 0;
        this.updateInterval = 0.2;
        this.minSeparationDistance = 5; // 로봇 간 최소 거리
        console.log('RobotSoldierLogic initialized');
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
                if (body === this.soldier.body || body === this.player.body) return;
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

    // 로봇 솔저 간 분리 힘 계산
    calculateSeparationForce(currentPos) {
        const separationForce = new THREE.Vector3();
        let nearbyCount = 0;

        this.allSoldiers.forEach(otherSoldier => {
            if (otherSoldier === this.soldier || !otherSoldier.body) return;
            const otherPos = new THREE.Vector3(otherSoldier.body.position.x, otherSoldier.body.position.y, otherSoldier.body.position.z);
            const distance = currentPos.distanceTo(otherPos);

            if (distance < this.minSeparationDistance && distance > 0) {
                const awayDirection = currentPos.clone().sub(otherPos).normalize();
                const forceMagnitude = (this.minSeparationDistance - distance) / this.minSeparationDistance;
                separationForce.add(awayDirection.multiplyScalar(forceMagnitude));
                nearbyCount++;
            }
        });

        if (nearbyCount > 0) {
            separationForce.divideScalar(nearbyCount).normalize().multiplyScalar(this.speed * 0.5);
        }

        return separationForce;
    }

    moveToTarget(targetPos) {
        if (!targetPos) {
            console.log('No target position provided, stopping soldier');
            this.soldier.body.velocity.set(0, this.soldier.body.velocity.y, 0);
            return;
        }

        const target = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
        const currentPos = new THREE.Vector3(this.soldier.body.position.x, this.soldier.body.position.y, this.soldier.body.position.z);
        let direction = target.clone().sub(currentPos).setY(0).normalize();

        const currentTime = performance.now() / 1000;
        const timeSinceAvoidance = currentTime - this.avoidanceStartTime;

        // 장애물 회피 중일 때
        if (this.isAvoiding && timeSinceAvoidance < this.avoidanceDuration) {
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.avoidanceAngle);
            const avoidanceSpeed = this.speed * 0.7;
            this.soldier.body.velocity.set(direction.x * avoidanceSpeed, this.soldier.body.velocity.y, direction.z * avoidanceSpeed);
            console.log('Continuing avoidance for', (this.avoidanceDuration - timeSinceAvoidance).toFixed(2), 'seconds');
            return;
        }

        // 장애물 감지
        const forward = direction.clone().multiplyScalar(2);
        const testPos = currentPos.clone().add(forward);
        let closestObstacle = null;
        let minDistToObstacle = Infinity;

        this.world.bodies.forEach(body => {
            if (body === this.soldier.body || body === this.player.body) return;
            const bodyPos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
            const dist = testPos.distanceTo(bodyPos);
            if (dist < 2 && dist < minDistToObstacle) {
                minDistToObstacle = dist;
                closestObstacle = bodyPos;
            }
        });

        // 분리 힘 계산
        const separationForce = this.calculateSeparationForce(currentPos);

        if (closestObstacle) {
            const waypoint = this.findSafeWaypoint(currentPos, target);
            direction = waypoint.clone().sub(currentPos).setY(0).normalize();
            this.avoidanceAngle = Math.acos(direction.dot(direction.clone().sub(currentPos).normalize()));
            if (direction.cross(direction.clone().sub(currentPos)).y < 0) this.avoidanceAngle = -this.avoidanceAngle;
            this.isAvoiding = true;
            this.avoidanceStartTime = currentTime;
            const avoidanceSpeed = this.speed * 0.7;
            this.soldier.body.velocity.set(direction.x * avoidanceSpeed, this.soldier.body.velocity.y, direction.z * avoidanceSpeed);
            console.log('Obstacle detected, moving to safe waypoint:', waypoint);
        } else {
            if (this.isAvoiding) {
                this.avoidanceAngle = 0;
                this.isAvoiding = false;
                console.log('Obstacle cleared, resuming direct path');
            }
            // 목표 방향과 분리 힘 결합
            direction.add(separationForce).normalize();
            this.soldier.body.velocity.set(direction.x * this.speed, this.soldier.body.velocity.y, direction.z * this.speed);
            console.log('Moving with separation, Velocity:', this.soldier.body.velocity);
        }
    }

    update() {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = currentTime;

        const playerPos = new THREE.Vector3(this.player.body.position.x, this.player.body.position.y, this.player.body.position.z);
        const distToPlayer = this.soldier.body.position.distanceTo(this.player.body.position);

        if (distToPlayer > 5) {
            this.moveToTarget(playerPos);
        } else {
            this.soldier.body.velocity.set(0, this.soldier.body.velocity.y, 0);
            console.log('Close to player, stopping');
        }

        if (this.soldier.game.terrain && typeof this.soldier.game.terrain.getHeightAt === 'function') {
            const currentHeight = this.soldier.game.terrain.getHeightAt(this.soldier.body.position.x, this.soldier.body.position.z);
            const targetHeight = currentHeight + 3;
            const heightDiff = targetHeight - this.soldier.body.position.y;
            if (Math.abs(heightDiff) > 0.01) {
                this.soldier.body.velocity.y = heightDiff * 5;
            } else {
                this.soldier.body.velocity.y = 0;
            }
        }
    }
}