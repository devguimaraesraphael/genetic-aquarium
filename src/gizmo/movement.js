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
  // Proper Newtonian chain: force → acceleration → velocity → position
  //   F = ma  (unit mass, so a = F)
  //   velocity += acceleration * dt
  //   position += velocity * dt  (done in advancePosition)
  //
  // deltaA: scales the NN force output (0–100, default 3)
  // deltaV: drag coefficient that limits top speed (0–100, default 3)
  //   drag = -velocity * (deltaV/100)  applied each frame
  //
  // The exponential lerp on acceleration smooths transitions so the
  // direction vector doesn't flip instantly when the NN changes output.

  const deltaA = config.deltaA ?? 3;
  const deltaV = config.deltaV ?? 3;

  // NN outputs a target force direction/magnitude
  const forceX = accelX * deltaA;
  const forceY = accelY * deltaA;

  // Smooth acceleration toward target force (frame-rate-independent lerp)
  // Rate 5 gives ~0.5s half-life at 60fps – snappy but not instant
  const accelRate = 1 - Math.exp(-5 * dt);
  gizmo.acceleration.x += (forceX - gizmo.acceleration.x) * accelRate;
  gizmo.acceleration.y += (forceY - gizmo.acceleration.y) * accelRate;

  // Clamp acceleration magnitude
  const accelMag = gizmo.acceleration.length();
  const maxAccel = config.maxAcceleration ?? 400;
  if (accelMag > maxAccel) {
    gizmo.acceleration.multiplyScalar(maxAccel / accelMag);
  }

  // Integrate acceleration into velocity
  gizmo.velocity.x += gizmo.acceleration.x * dt;
  gizmo.velocity.y += gizmo.acceleration.y * dt;

  // Apply drag proportional to velocity (simulates fluid resistance)
  const drag = 1 - (deltaV / 100) * dt;
  gizmo.velocity.x *= Math.max(0, drag);
  gizmo.velocity.y *= Math.max(0, drag);

  // Clamp to max speed
  const speed = gizmo.velocity.length();
  if (speed > config.maxVelocity) {
    gizmo.velocity.multiplyScalar(config.maxVelocity / speed);
  }

  // Direction follows velocity only when moving meaningfully
  if (speed > 0.5) {
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
  if (gizmo.position.x < -hw) gizmo.position.x = -hw;
  if (gizmo.position.x > hw) gizmo.position.x = hw;
  if (gizmo.position.y < -hh) gizmo.position.y = -hh;
  if (gizmo.position.y > hh) gizmo.position.y = hh;
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
 * Update the seen-target marker to point at the nearest gizmo or food item.
 * Marker lives in world space (added to scene, not to gizmo.group).
 * Only called when gizmo is selected.
 */
export function updateSeenTargetMarker(gizmo, allGizmos, foodManager) {
  let nearestX = null;
  let nearestY = null;
  let minDist = Infinity;

  // Check nearest other gizmo
  for (const other of allGizmos) {
    if (other === gizmo || other.isDead) continue;
    const dist = gizmo.position.distanceTo(other.position);
    if (dist < minDist) {
      minDist = dist;
      nearestX = other.position.x;
      nearestY = other.position.y;
    }
  }

  // Check nearest food
  if (foodManager && foodManager.foods) {
    for (const food of foodManager.foods) {
      if (food.size < 0.01) continue;
      const dx = food.x - gizmo.position.x;
      const dy = food.y - gizmo.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearestX = food.x;
        nearestY = food.y;
      }
    }
  }

  if (nearestX !== null) {
    gizmo._seenTargetMarker.position.set(nearestX, nearestY, 0.5);
    gizmo._seenTargetMarker.visible = true;
  } else {
    gizmo._seenTargetMarker.visible = false;
  }
}
