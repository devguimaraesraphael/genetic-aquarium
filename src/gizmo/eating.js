/**
 * eating.js – diet rules and eat-triggered reproduction bookkeeping.
 * Extracted from movement.js to keep file sizes small.
 *
 * Herbivores eat food; carnivores eat herbivores (never food, never each other).
 */

import * as THREE from "three";
import { IDENTITY_HERBIVORE, IDENTITY_CARNIVORE } from "../Identity.js";

/**
 * Registers a successful eat: resets starvation, awards score, and accumulates
 * progress toward reproduction. Once a gizmo has eaten `config.scoreToReproduce`
 * times and its post-reproduction cooldown has elapsed, it becomes ready to
 * reproduce (consumed by GizmoController each tick).
 */
function registerEat(gizmo, config) {
  gizmo.starvationCounter = 0;
  gizmo.score += 10;

  gizmo.reproductionEnergy = (gizmo.reproductionEnergy ?? 0) + 1;
  const threshold = config?.scoreToReproduce ?? 5;
  const cooldown = gizmo.reproductionCooldownRemaining ?? 0;
  if (gizmo.reproductionEnergy >= threshold && cooldown <= 0) {
    gizmo.readyToReproduce = true;
  }
}

/**
 * Attempt to eat: herbivores eat food, carnivores eat herbivores.
 * Mutates gizmo.starvationCounter, gizmo.score, reproduction bookkeeping.
 * Marks eaten food with size=0 for removal by FoodManager.update(); kills
 * eaten herbivores directly (isDead=true), same as any other death.
 */
export function tryEat(gizmo, config, foodManager, allGizmos) {
  const eatRadius = (gizmo.bodyRadius ?? 6) * 1.5; // use stored bodyRadius

  if (gizmo.identity === IDENTITY_CARNIVORE) {
    if (!allGizmos) return;
    for (const other of allGizmos) {
      if (other === gizmo || other.isDead) continue;
      if (other.identity !== IDENTITY_HERBIVORE) continue;
      const dist = gizmo.position.distanceTo(other.position);
      if (dist < eatRadius) {
        other.isDead = true;
        other.group.visible = false;
        other._killedByPredation = true; // lets simulationTick show a predation effect
        registerEat(gizmo, config);
        break; // one kill per attempt
      }
    }
    return;
  }

  if ((gizmo.eatCooldownRemaining ?? 0) > 0) return;
  if (!foodManager || !foodManager.foods) return;
  for (const food of foodManager.foods) {
    if (food.size < 0.01) continue;
    const dist = gizmo.position.distanceTo(new THREE.Vector2(food.x, food.y));
    if (dist < eatRadius) {
      food.size = 0;
      registerEat(gizmo, config);
      gizmo.eatCooldownRemaining = config?.herbEatCooldown ?? 2.5;
      break; // one food per bite – no more devouring a whole cluster instantly
    }
  }
}
