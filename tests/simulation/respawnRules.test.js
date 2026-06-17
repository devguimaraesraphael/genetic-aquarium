import { describe, it, expect } from "vitest";
import {
  splitGizmosByType,
  getRespawnPlan,
} from "../../src/simulation/respawnRules.js";

const herb = (id) => ({ id, identity: [0, 1, 0] });
const carn = (id) => ({ id, identity: [0, 0, 1] });

describe("respawn rules by class list", () => {
  it("splits gizmos into herbivore and carnivore lists", () => {
    const result = splitGizmosByType([herb(1), carn(2), herb(3)]);
    expect(result.herbivores.map((g) => g.id)).toEqual([1, 3]);
    expect(result.carnivores.map((g) => g.id)).toEqual([2]);
  });

  it("when herbivore list is empty, plans herbivore respawn", () => {
    const plan = getRespawnPlan([carn(1), carn(2)], 20, 0.2);
    expect(plan.herbivores.length).toBe(0);
    expect(plan.spawnHerbivores).toBeGreaterThan(0);
    expect(plan.spawnCarnivores).toBe(0);
  });

  it("when carnivore list is empty, plans carnivore respawn", () => {
    const plan = getRespawnPlan([herb(1), herb(2)], 20, 0.25);
    expect(plan.carnivores.length).toBe(0);
    expect(plan.spawnCarnivores).toBeGreaterThan(0);
    expect(plan.spawnHerbivores).toBe(0);
  });

  it("when both lists are empty, plans both respawns", () => {
    const plan = getRespawnPlan([], 20, 0.3);
    expect(plan.fullExtinction).toBe(true);
    expect(plan.spawnHerbivores).toBeGreaterThan(0);
    expect(plan.spawnCarnivores).toBeGreaterThan(0);
  });

  it("when both lists have members, no respawn is planned", () => {
    const plan = getRespawnPlan([herb(1), carn(2)], 20, 0.2);
    expect(plan.fullExtinction).toBe(false);
    expect(plan.spawnHerbivores).toBe(0);
    expect(plan.spawnCarnivores).toBe(0);
  });
});
