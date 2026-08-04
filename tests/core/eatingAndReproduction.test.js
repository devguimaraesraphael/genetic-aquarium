/**
 * eatingAndReproduction.test.js
 *
 * 1. Diet rules: herbivores eat food only; carnivores eat herbivores only.
 * 2. Reproduction heuristic: eating enough times triggers readyToReproduce,
 *    reproduce() clones the parent, and a cooldown blocks immediate re-trigger.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { Gizmo } from "../../src/Gizmo.js";
import { tryEat } from "../../src/gizmo/eating.js";
import { IDENTITY_HERBIVORE, IDENTITY_CARNIVORE } from "../../src/Identity.js";
import { CONFIG } from "../../src/constants.js";

describe("1. Diet rules – carnivores eat herbivores, not food", () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  it("carnivore does not eat nearby food", () => {
    const carn = new Gizmo(scene, CONFIG, { identity: IDENTITY_CARNIVORE });
    const food = { x: carn.position.x, y: carn.position.y, size: 5 };
    const foodManager = { foods: [food] };
    tryEat(carn, CONFIG, foodManager, [carn]);
    expect(food.size).toBe(5);
    expect(carn.score).toBe(0);
  });

  it("herbivore eats nearby food", () => {
    const herb = new Gizmo(scene, CONFIG, { identity: IDENTITY_HERBIVORE });
    const food = { x: herb.position.x, y: herb.position.y, size: 5 };
    const foodManager = { foods: [food] };
    tryEat(herb, CONFIG, foodManager, [herb]);
    expect(food.size).toBe(0);
    expect(herb.score).toBe(10);
  });

  it("carnivore eats a nearby herbivore (kills it)", () => {
    const carn = new Gizmo(scene, CONFIG, { identity: IDENTITY_CARNIVORE });
    const herb = new Gizmo(scene, CONFIG, { identity: IDENTITY_HERBIVORE });
    herb.position.copy(carn.position);
    tryEat(carn, CONFIG, { foods: [] }, [carn, herb]);
    expect(herb.isDead).toBe(true);
    expect(herb.group.visible).toBe(false);
    expect(carn.score).toBe(10);
  });

  it("carnivore does not eat another carnivore", () => {
    const carn = new Gizmo(scene, CONFIG, { identity: IDENTITY_CARNIVORE });
    const otherCarn = new Gizmo(scene, CONFIG, {
      identity: IDENTITY_CARNIVORE,
    });
    otherCarn.position.copy(carn.position);
    tryEat(carn, CONFIG, { foods: [] }, [carn, otherCarn]);
    expect(otherCarn.isDead).toBe(false);
    expect(carn.score).toBe(0);
  });

  it("carnivore does not eat a herbivore outside eat radius", () => {
    const carn = new Gizmo(scene, CONFIG, { identity: IDENTITY_CARNIVORE });
    const herb = new Gizmo(scene, CONFIG, { identity: IDENTITY_HERBIVORE });
    herb.position.set(carn.position.x + 500, carn.position.y + 500);
    tryEat(carn, CONFIG, { foods: [] }, [carn, herb]);
    expect(herb.isDead).toBe(false);
  });
});

describe("2. Reproduction after eating, with cooldown", () => {
  let scene, config;

  beforeEach(() => {
    scene = new THREE.Scene();
    config = { ...CONFIG, scoreToReproduce: 2, reproductionCooldown: 10 };
  });

  it("gizmo is not ready to reproduce before eating", () => {
    const g = new Gizmo(scene, config, { identity: IDENTITY_HERBIVORE });
    expect(g.readyToReproduce).toBe(false);
    expect(g.reproductionEnergy).toBe(0);
  });

  it("becomes ready to reproduce once scoreToReproduce eats are reached", () => {
    const g = new Gizmo(scene, config, { identity: IDENTITY_HERBIVORE });
    for (let i = 0; i < config.scoreToReproduce; i++) {
      g.eatCooldownRemaining = 0; // simulate the bite cooldown having elapsed
      const food = { x: g.position.x, y: g.position.y, size: 5 };
      tryEat(g, config, { foods: [food] }, [g]);
    }
    expect(g.reproductionEnergy).toBeGreaterThanOrEqual(config.scoreToReproduce);
    expect(g.readyToReproduce).toBe(true);
  });

  it("eating starts a bite cooldown that blocks immediate re-eating", () => {
    const g = new Gizmo(scene, config, { identity: IDENTITY_HERBIVORE });
    const food1 = { x: g.position.x, y: g.position.y, size: 5 };
    tryEat(g, config, { foods: [food1] }, [g]);
    expect(g.eatCooldownRemaining).toBe(config.herbEatCooldown);

    const food2 = { x: g.position.x, y: g.position.y, size: 5 };
    tryEat(g, config, { foods: [food2] }, [g]);
    expect(food2.size).toBe(5); // second bite blocked by cooldown
    expect(g.reproductionEnergy).toBe(1);
  });

  it("a herbivore does not devour an entire food cluster in one bite", () => {
    const g = new Gizmo(scene, config, { identity: IDENTITY_HERBIVORE });
    const cluster = Array.from({ length: 5 }, () => ({
      x: g.position.x,
      y: g.position.y,
      size: 5,
    }));
    tryEat(g, config, { foods: cluster }, [g]);
    const eaten = cluster.filter((f) => f.size === 0).length;
    expect(eaten).toBe(1);
  });

  it("reproduce() spawns a mutated clone and resets readiness + starts cooldown", () => {
    const g = new Gizmo(scene, config, { identity: IDENTITY_HERBIVORE });
    g.readyToReproduce = true;
    g.reproductionEnergy = config.scoreToReproduce;

    const child = g.reproduce(config, 1);

    expect(child).toBeInstanceOf(Gizmo);
    expect(child.identity).toBe(g.identity);
    expect(child.id).not.toBe(g.id);
    expect(g.readyToReproduce).toBe(false);
    expect(g.reproductionEnergy).toBe(0);
    expect(g.reproductionCooldownRemaining).toBe(config.reproductionCooldown);
  });

  it("does not reproduce again while cooldown is active, even after enough eats", () => {
    const g = new Gizmo(scene, config, { identity: IDENTITY_HERBIVORE });
    g.reproductionCooldownRemaining = config.reproductionCooldown;
    for (let i = 0; i < config.scoreToReproduce; i++) {
      g.eatCooldownRemaining = 0; // simulate the bite cooldown having elapsed
      const food = { x: g.position.x, y: g.position.y, size: 5 };
      tryEat(g, config, { foods: [food] }, [g]);
    }
    expect(g.readyToReproduce).toBe(false);
  });

  it("cooldown counts down over time via update()", () => {
    const g = new Gizmo(scene, config, { identity: IDENTITY_HERBIVORE });
    g.reproductionCooldownRemaining = 1;
    g.update(0.5, config, [g], { foods: [] });
    expect(g.reproductionCooldownRemaining).toBeCloseTo(0.5, 5);
    g.update(0.5, config, [g], { foods: [] });
    expect(g.reproductionCooldownRemaining).toBe(0);
  });

  it("bite cooldown also counts down over time via update()", () => {
    const g = new Gizmo(scene, config, { identity: IDENTITY_HERBIVORE });
    g.eatCooldownRemaining = 1;
    g.update(0.5, config, [g], { foods: [] });
    expect(g.eatCooldownRemaining).toBeCloseTo(0.5, 5);
    g.update(0.6, config, [g], { foods: [] });
    expect(g.eatCooldownRemaining).toBe(0);
  });

  it("reproduce() respects the population cap", () => {
    const g = new Gizmo(scene, config, { identity: IDENTITY_HERBIVORE });
    g.readyToReproduce = true;
    g.reproductionEnergy = config.scoreToReproduce;

    const cappedConfig = { ...config, gizmoCount: 5 };
    const child = g.reproduce(cappedConfig, 5); // already at cap
    expect(child).toBeNull();
    expect(g.readyToReproduce).toBe(false);
  });
});
