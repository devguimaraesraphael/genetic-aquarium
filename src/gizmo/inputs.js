/**
 * gizmoInputs.js – pure function that builds the 14-element NN input vector.
 * Extracted from Gizmo.js to keep file sizes small.
 *
 * Input layout (indices 0-13):
 *   [0]  c_food    – 1 if nearest visible entity is food, else 0
 *   [1]  c_herb    – 1 if nearest visible entity is herbivore, else 0
 *   [2]  c_carn    – 1 if nearest visible entity is carnivore, else 0
 *   [3]  c_prox    – proximity to nearest (1=touching, 0=at vision edge / no target)
 *   [4]  c_angle   – heading alignment (1=front, 0=behind; 0=no target)
 *   [5]  c_left    – 1 if target is to the left or directly ahead; 0=right or no target
 *   [6]  c_right   – 1 if target is to the right or directly ahead; 0=left or no target
 *   [7]  n_food    – count of food items in vision, normalised 0-1 (clamps at 10)
 *   [8]  n_herb    – count of herbivores in vision, normalised 0-1 (clamps at 10)
 *   [9]  n_carn    – count of carnivores in vision, normalised 0-1 (clamps at 10)
 *   [10] avg_d     – average distance of all visible entities, normalised 0-1
 *   [11] starv     – starvation level (0=just ate, 1=about to die)
 *   [12] wall      – proximity to nearest wall within vision range (0=none, 1=touching)
 *   [13] bias      – always 1.0
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

  // ── Proximity + ego-centric bearing to nearest entity ───────────────────────
  // c_prox: 1 = touching, 0 = at edge or no target
  const cProx =
    nearestType !== null ? 1 - Math.min(nearestDist / visionRange, 1) : 0;

  // c_angle / c_left / c_right: computed from gizmo heading vs target direction.
  // cross > 0 → target is to the LEFT; cross < 0 → target is to the RIGHT.
  // When directly in front (cross=0, dot=1): c_left=1, c_right=1  (matches "total front" case).
  // All three are 0 when no target in vision.
  let cAngle = 0,
    cLeft = 0,
    cRight = 0;
  if (nearestType !== null && nearestDist > 1e-6) {
    const tx = nearestDx / nearestDist;
    const ty = nearestDy / nearestDist;
    const dirX = state.direction ? state.direction.x : 0;
    const dirY = state.direction ? state.direction.y : 1;
    const dot = dirX * tx + dirY * ty; // [-1, 1]  1=front, -1=behind
    const cross = dirX * ty - dirY * tx; // >0=left,  <0=right
    cAngle = (dot + 1) / 2; // map [-1,1] → [0,1]
    cLeft = cross >= 0 ? 1 : 0;
    cRight = cross <= 0 ? 1 : 0;
  }

  // ── Aggregates ─────────────────────────────────────────────────────────────
  const normCountFood = Math.min(countFood / COUNT_NORM, 1);
  const normCountHerb = Math.min(countHerb / COUNT_NORM, 1);
  const normCountCarn = Math.min(countCarn / COUNT_NORM, 1);
  const avgDist =
    totalVisible > 0 ? Math.min(totalDist / totalVisible / visionRange, 1) : 1;

  // ── Starvation ─────────────────────────────────────────────────────────────
  const starvation = Math.min(starvationCounter / maxStarv, 1);

  // ── Wall proximity ─────────────────────────────────────────────────────────
  // Only register wall if it is within the gizmo's vision range.
  // 0 = wall not visible (outside vision), 1 = gizmo is touching the wall.
  const distToWallX = hw - Math.abs(position.x);
  const distToWallY = hh - Math.abs(position.y);
  const distToWall = Math.min(distToWallX, distToWallY);
  const wallInput =
    distToWall > visionRange ? 0 : 1 - Math.min(distToWall / visionRange, 1);

  const inputs = [
    closestIsFood, // [0]
    closestIsHerb, // [1]
    closestIsCarn, // [2]
    cProx, // [3] proximity to nearest (1=close, 0=far/none)
    cAngle, // [4] heading alignment (1=front, 0=behind, 0=none)
    cLeft, // [5] target is left or directly ahead (1/0); 0 if none
    cRight, // [6] target is right or directly ahead (1/0); 0 if none
    normCountFood, // [7]
    normCountHerb, // [8]
    normCountCarn, // [9]
    avgDist, // [10]
    starvation, // [11]
    wallInput, // [12]
    1, // [13] bias
  ];

  // Final sanitization: replace any NaN/Infinity with 0 (bias stays 1 regardless)
  return inputs.map((v, i) => (i === 13 ? 1 : Number.isFinite(v) ? v : 0));
}
