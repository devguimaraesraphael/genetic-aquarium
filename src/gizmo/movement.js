/**
 * movement.js – physics and interaction helpers for Gizmo.
 * Extracted from Gizmo.js to keep file sizes small.
 *
 * All functions operate on a gizmo instance (passed as first argument)
 * rather than using closures over class internals.
 */

import * as THREE from "three";

// bodyRadius is now stored on the gizmo instance; this constant is no longer used for eat detection

/**
 * Apply lerp-based physics: steer acceleration toward target, apply friction.
 * Mutates gizmo.acceleration, gizmo.velocity in-place.
 * @param {Gizmo} gizmo
 * @param {number} accelX – NN-derived target accel X
 * @param {number} accelY – NN-derived target accel Y
 * @param {object} config
 * @param {number} dt
 */
export function applyPhysics(gizmo, accelX, accelY, config, dt) {
  const deltaA = config.deltaA ?? 3; // acceleration multiplier (0-100)
  const deltaV = config.deltaV ?? 3; // velocity approach rate  (0-100)

  // Target velocity driven by NN acceleration output, scaled by deltaA.
  // Velocity approaches target at a rate controlled by deltaV.
  // No friction factor – velocity is only bounded by the maxVelocity cap.
  const targetX = accelX * deltaA;
  const targetY = accelY * deltaA;
  const approach = deltaV / 100;

  gizmo.velocity.x += (targetX - gizmo.velocity.x) * approach;
  gizmo.velocity.y += (targetY - gizmo.velocity.y) * approach;

  const speed = gizmo.velocity.length();
  if (speed > config.maxVelocity) {
    gizmo.velocity.multiplyScalar(config.maxVelocity / speed);
  }

  if (speed > 0.1) {
    gizmo.direction.copy(gizmo.velocity).normalize();
  }
}

/**
 * Move gizmo by velocity*dt and wrap around aquarium borders.
 */
export function advancePosition(gizmo, config, dt) {
  gizmo.position.x += gizmo.velocity.x * dt;
  gizmo.position.y += gizmo.velocity.y * dt;

  const hw = config.aquariumWidth / 2;
  const hh = config.aquariumHeight / 2;
  if (gizmo.position.x < -hw) gizmo.position.x += config.aquariumWidth;
  if (gizmo.position.x > hw) gizmo.position.x -= config.aquariumWidth;
  if (gizmo.position.y < -hh) gizmo.position.y += config.aquariumHeight;
  if (gizmo.position.y > hh) gizmo.position.y -= config.aquariumHeight;
}

/**
 * Attempt to eat nearby food items.
 * Mutates gizmo.starvationCounter, gizmo.score, gizmo.reproductionEnergy, gizmo.readyToReproduce.
 * Marks eaten food with size=0 for removal by FoodManager.update().
 */
export function tryEat(gizmo, foodManager) {
  if (!foodManager || !foodManager.foods) return;

  const eatRadius = (gizmo.bodyRadius ?? 6) * 1.5; // use stored bodyRadius
  for (const food of foodManager.foods) {
    if (food.size < 0.01) continue;
    const dist = gizmo.position.distanceTo(new THREE.Vector2(food.x, food.y));
    if (dist < eatRadius) {
      gizmo.starvationCounter = 0;
      gizmo.score += 10;
      gizmo.reproductionEnergy += 5;
      food.size = 0;
      if (gizmo.reproductionEnergy >= 50) gizmo.readyToReproduce = true;
    }
  }
}

/**
 * Update the seen-target marker to point at the nearest other gizmo.
 * Only called when gizmo is selected.
 */
export function updateSeenTargetMarker(gizmo, allGizmos) {
  let nearest = null,
    minDist = Infinity;
  for (const other of allGizmos) {
    if (other === gizmo || other.isDead) continue;
    const dist = gizmo.position.distanceTo(other.position);
    if (dist < minDist) {
      minDist = dist;
      nearest = other;
    }
  }
  if (nearest) {
    gizmo._seenTargetMarker.position.copy(nearest.position);
    gizmo._seenTargetMarker.position.z = 0.15;
    gizmo._seenTargetMarker.material.opacity = 0.5;
  } else {
    gizmo._seenTargetMarker.material.opacity = 0;
  }
}
