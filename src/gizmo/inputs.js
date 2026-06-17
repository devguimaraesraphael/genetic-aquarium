/**
 * gizmoInputs.js – pure function that builds the 12-element NN input vector.
 * Extracted from Gizmo.js to keep file sizes small.
 *
 * Input layout (indices 0-11):
 *   [0]  closest_identity_food  – 1 if nearest visible entity is food, else 0
 *   [1]  closest_identity_herb  – 1 if nearest visible entity is herbivore, else 0
 *   [2]  closest_identity_carn  – 1 if nearest visible entity is carnivore, else 0
 *   [3]  c_dist_x              – normalised X-distance to nearest entity (1=same X, 0=at vision edge/none)
 *   [4]  c_dist_y              – normalised Y-distance to nearest entity (1=same Y, 0=at vision edge/none)
 *   [5]  count_food             – count of food items in vision, normalised 0-1 (clamps at 10)
 *   [6]  count_herb             – count of herbivores in vision, normalised 0-1 (clamps at 10)
 *   [7]  count_carn             – count of carnivores in vision, normalised 0-1 (clamps at 10)
 *   [8]  avg_distance           – average distance of all visible entities, normalised 0-1
 *   [9]  starvation             – starvation level (0=just ate, 1=about to die)
 *   [10] wall_distance          – proximity to nearest wall (0=centre, 1=against wall)
 *   [11] bias                   – always 1.0
 *
 * All outputs are sanitized to finite values so NaN never reaches NeuralNetwork.forward().
 */

const COUNT_NORM = 10; // >10 entities of any type clips to 1

/**
 * Build NN input vector from gizmo state + environment.
 *
 * @param {object} state  – Gizmo instance
 * @param {object} config – live config object
 * @param {Array}  allGizmos
 * @param {object} foodManager
 * @returns {number[]} 12-element array, all values finite in [0,1]
 */
export function buildInputs(state, config, allGizmos, foodManager) {
  const { position, genes, starvationCounter } = state;

  const visionRange = (genes.visionRange && genes.visionRange[1]) || 100;
  const maxStarv = config.gizmoStarvation || 1;
  const hw = (config.aquariumWidth || 1200) / 2;
  const hh = (config.aquariumHeight || 700) / 2;

  // ── Scan visible entities ──────────────────────────────────────────────────
  let nearestDist = Infinity;
  let nearestDx = 0;
  let nearestDy = 0;
  let nearestType = null; // "food" | "herb" | "carn"

  let countFood = 0;
  let countHerb = 0;
  let countCarn = 0;
  let totalDist = 0;
  let totalVisible = 0;

  // Other gizmos
  for (const other of allGizmos) {
    if (other === state || other.isDead) continue;
    const dx = other.position.x - position.x;
    const dy = other.position.y - position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > visionRange) continue;

    totalDist += dist;
    totalVisible++;

    const isHerb = other.identity === "herbivore";
    if (isHerb) countHerb++;
    else countCarn++;

    if (dist < nearestDist) {
      nearestDist = dist;
      nearestDx = dx;
      nearestDy = dy;
      nearestType = isHerb ? "herb" : "carn";
    }
  }

  // Food items
  if (foodManager && foodManager.foods) {
    for (const food of foodManager.foods) {
      if (food.size < 0.01) continue;
      const dx = food.x - position.x;
      const dy = food.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > visionRange) continue;

      totalDist += dist;
      totalVisible++;
      countFood++;

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestDx = dx;
        nearestDy = dy;
        nearestType = "food";
      }
    }
  }

  // ── Encode nearest entity identity (one-hot) ───────────────────────────────
  const closestIsFood = nearestType === "food" ? 1 : 0;
  const closestIsHerb = nearestType === "herb" ? 1 : 0;
  const closestIsCarn = nearestType === "carn" ? 1 : 0;

  // ── X/Y distance to nearest (1=same axis, 0=at vision edge/none) ──────────
  // Inverted: high value = close on that axis
  const closestDistX =
    nearestType !== null
      ? 1 - Math.min(Math.abs(nearestDx) / visionRange, 1)
      : 0;
  const closestDistY =
    nearestType !== null
      ? 1 - Math.min(Math.abs(nearestDy) / visionRange, 1)
      : 0;

  // ── Aggregates ─────────────────────────────────────────────────────────────
  const normCountFood = Math.min(countFood / COUNT_NORM, 1);
  const normCountHerb = Math.min(countHerb / COUNT_NORM, 1);
  const normCountCarn = Math.min(countCarn / COUNT_NORM, 1);
  const avgDist =
    totalVisible > 0 ? Math.min(totalDist / totalVisible / visionRange, 1) : 1;

  // ── Starvation ─────────────────────────────────────────────────────────────
  const starvation = Math.min(starvationCounter / maxStarv, 1);

  // ── Wall proximity ─────────────────────────────────────────────────────────
  const distToWallX = hw - Math.abs(position.x);
  const distToWallY = hh - Math.abs(position.y);
  const distToWall = Math.min(distToWallX, distToWallY);
  const wallMax = Math.min(hw, hh);
  const wallInput = 1 - Math.min(distToWall / wallMax, 1); // 0=centre, 1=wall

  const inputs = [
    closestIsFood, // [0]
    closestIsHerb, // [1]
    closestIsCarn, // [2]
    closestDistX, // [3] 1=same X, 0=far/none
    closestDistY, // [4] 1=same Y, 0=far/none
    normCountFood, // [5]
    normCountHerb, // [6]
    normCountCarn, // [7]
    avgDist, // [8]
    starvation, // [9]
    wallInput, // [10]
    1, // [11] bias
  ];

  // Final sanitization: replace any NaN/Infinity with 0 (bias stays 1 regardless)
  return inputs.map((v, i) => (i === 11 ? 1 : Number.isFinite(v) ? v : 0));
}
