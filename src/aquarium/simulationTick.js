/**
 * simulationTick.js – one frame of simulation: gizmo updates, death, respawn, offspring.
 * Extracted from main.js to keep file sizes small.
 */

import { getRespawnPlan } from "../simulation/respawnRules.js";
import { IDENTITY_HERBIVORE } from "../Identity.js";
import * as detailPanel from "../ui/detailPanel.js";

/**
 * Run one simulation frame.
 * @param {number} dt – delta time in seconds
 * @param {object} ctx – { ctrl, config, hallOfFame, hofStats, effects, foodManager,
 *                         foodStats, gizmoList, plankton, updatePlankton }
 */
export function simulationTick(dt, ctx) {
  const {
    ctrl,
    config,
    hallOfFame,
    hofStats,
    effects,
    foodManager,
    foodStats,
    gizmoList,
    plankton,
    updatePlankton,
  } = ctx;
  const gizmos = ctrl.gizmos;

  // Update all live gizmos
  gizmos.forEach((g) => {
    if (!g.isDead) g.update(dt, config, gizmos, foodManager);
  });

  // Remove dead gizmos
  const dead = gizmos.filter((g) => g.isDead);
  if (dead.length > 0) {
    dead.forEach((g) => {
      effects.death(g.position.x, g.position.y);
      const isNew = hallOfFame.register(g);
      if (isNew) {
        const slot =
          g.identity === IDENTITY_HERBIVORE ? "herbivores" : "carnivores";
        hofStats[slot === "herbivores" ? "herb" : "carn"] =
          hallOfFame[slot][0]?.score ?? 0;
      }
      if (g === ctrl.selectedGizmo) ctrl.clearSelection();
      g.dispose();
      gizmoList.removeGizmo(g.id);
    });
    ctrl.gizmos = gizmos.filter((g) => !g.isDead);
    ctrl.updateGizmoList();
  }

  // Respawn logic – only fires when a type goes extinct, respects population cap
  const total = config.gizmoCount ?? 20;
  const carnRatio = config.carnivoreRatio ?? 0.1;
  const respawnPlan = getRespawnPlan(ctrl.gizmos, total, carnRatio);
  const currentPop = ctrl.gizmos.length;

  if (respawnPlan.fullExtinction) {
    // Both types extinct – new joint generation only if there is HoF data
    if (hallOfFame.herbivores.length > 0 || hallOfFame.carnivores.length > 0) {
      const nCarns = Math.max(0, Math.round(total * carnRatio));
      const nHerbs = Math.max(0, total - nCarns);
      hofStats.herbGeneration = (hofStats.herbGeneration ?? 1) + 1;
      hofStats.carnGeneration = (hofStats.carnGeneration ?? 1) + 1;
      hofStats.herb = 0;
      hofStats.carn = 0;
      if (nHerbs > 0) {
        ctrl.spawnGeneration(
          "herbivores",
          Math.min(nHerbs, total - ctrl.gizmos.length),
          false,
        );
      }
      if (nCarns > 0 && ctrl.gizmos.length < total) {
        ctrl.spawnGeneration(
          "carnivores",
          Math.min(nCarns, total - ctrl.gizmos.length),
          true,
        );
      }
    } else {
      // No HoF yet – just recreate from scratch
      ctrl.createGizmos();
    }
  } else {
    // Partial extinction – only spawn the missing type if under cap
    if (respawnPlan.spawnHerbivores > 0 && currentPop < total) {
      const canSpawn = Math.min(
        respawnPlan.spawnHerbivores,
        total - currentPop,
      );
      hofStats.herbGeneration = (hofStats.herbGeneration ?? 1) + 1;
      hofStats.herb = 0;
      foodManager.reset();
      ctrl.spawnGeneration("herbivores", canSpawn, false);
    }
    if (respawnPlan.spawnCarnivores > 0 && ctrl.gizmos.length < total) {
      const canSpawn = Math.min(
        respawnPlan.spawnCarnivores,
        total - ctrl.gizmos.length,
      );
      hofStats.carnGeneration = (hofStats.carnGeneration ?? 1) + 1;
      hofStats.carn = 0;
      ctrl.spawnGeneration("carnivores", canSpawn, true);
    }
  }

  // Spawn offspring – enforce population cap BEFORE creating any child
  const maxGizmos = config.gizmoCount ?? 20;
  const offspring = [];
  ctrl.gizmos.forEach((g) => {
    const atCap = ctrl.gizmos.length + offspring.length >= maxGizmos;
    if (g._pendingOffspring && !atCap) {
      offspring.push(g.spawnClone(ctrl.scene));
    } else if (g._pendingOffspring) {
      // cap reached – reset flag so the gizmo doesn't accumulate energy
      g._pendingOffspring = false;
      g.readyToReproduce = false;
    }
  });
  ctrl.gizmos.push(...offspring);
  offspring.forEach((g) =>
    effects.birth(g.position.x, g.position.y, g.bodyRadius),
  );

  // Champion stars
  let bestHerb = null,
    bestCarn = null;
  ctrl.gizmos.forEach((g) => {
    if (g.identity === IDENTITY_HERBIVORE) {
      if (!bestHerb || g.score > bestHerb.score) bestHerb = g;
    } else {
      if (!bestCarn || g.score > bestCarn.score) bestCarn = g;
    }
  });
  ctrl.gizmos.forEach(
    (g) =>
      g.setChampionStar && g.setChampionStar(g === bestHerb || g === bestCarn),
  );

  // Updates
  foodManager.update(dt);
  foodStats.count = foodManager.count;
  effects.update(dt);
  updatePlankton(plankton, config, dt);

  if (ctrl.selectedGizmo) detailPanel.update(ctrl.selectedGizmo);
  if (ctrl.selectedFood) detailPanel.updateFood(ctrl.selectedFood);
  ctrl.updateGizmoList();
}
