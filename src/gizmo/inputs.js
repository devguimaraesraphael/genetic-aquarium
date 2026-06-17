/**
 * gizmoInputs.js – pure function that builds the 12-element NN input vector.
 * Extracted from Gizmo.js to keep file sizes small.
 *
 * All outputs are sanitized to finite values so NaN never reaches NeuralNetwork.forward().
 */

import * as THREE from "three";

/**
 * Build NN input vector from gizmo state + environment.
 *
 * @param {object} state  – { position, velocity, direction, genes, starvationCounter, age, identity }
 * @param {object} config – live config object
 * @param {Array}  allGizmos
 * @param {object} foodManager
 * @returns {number[]} 12-element array, all values finite
 */
export function buildInputs(state, config, allGizmos, foodManager) {
  const {
    position,
    velocity,
    direction,
    genes,
    starvationCounter,
    age,
    identity,
  } = state;

  const maxVel = config.maxVelocity || 1;
  const maxStarv = config.gizmoStarvation || 1;

  const inputs = [
    velocity.x / maxVel,
    velocity.y / maxVel,
    Math.min(starvationCounter / maxStarv, 1),
    Math.min(age / 300, 1),
    0,
    0,
    0,
    0, // nearest ally
    0,
    0,
    0,
    0, // nearest food
  ];

  const visionRange = (genes.visionRange && genes.visionRange[1]) || 1;

  // Nearest ally
  let minAllyDist = Infinity;
  for (const other of allGizmos) {
    if (other === state || other.isDead) continue;
    const dist = position.distanceTo(other.position);
    if (dist < minAllyDist) {
      minAllyDist = dist;
      const angle = Math.atan2(
        other.position.y - position.y,
        other.position.x - position.x,
      );
      const selfAngle = Math.atan2(direction.y, direction.x);
      inputs[4] = Math.cos(angle - selfAngle);
      inputs[5] = Math.sin(angle - selfAngle);
      inputs[6] = Math.min(dist / visionRange, 1);
      inputs[7] = other.identity === identity ? 1 : 0;
    }
  }

  // Nearest food
  if (foodManager && foodManager.foods && foodManager.foods.length > 0) {
    let minFoodDist = Infinity;
    let nearestFood = null;
    for (const food of foodManager.foods) {
      if (food.size < 0.01) continue;
      const foodPos = new THREE.Vector2(food.x, food.y);
      const dist = position.distanceTo(foodPos);
      if (dist < minFoodDist) {
        minFoodDist = dist;
        nearestFood = food;
      }
    }

    if (nearestFood) {
      const foodPos = new THREE.Vector2(nearestFood.x, nearestFood.y);
      const angle = Math.atan2(foodPos.y - position.y, foodPos.x - position.x);
      const selfAngle = Math.atan2(direction.y, direction.x);
      inputs[8] = Math.cos(angle - selfAngle);
      inputs[9] = Math.sin(angle - selfAngle);
      inputs[10] = Math.min(minFoodDist / visionRange, 1);
      inputs[11] = 1;
    }
  }

  // Final sanitization: replace any NaN/Infinity with 0
  return inputs.map((v) => (Number.isFinite(v) ? v : 0));
}
