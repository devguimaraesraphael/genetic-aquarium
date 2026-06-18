import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { Gizmo } from "../../src/Gizmo.js";
import { buildInputs } from "../../src/gizmo/inputs.js";
import { CONFIG } from "../../src/constants.js";
import { FoodManager } from "../../src/Food.js";

// Input index constants matching inputs.js layout
const IDX = {
  C_FOOD: 0, // closest entity is food (0/1)
  C_HERB: 1, // closest entity is herbivore (0/1)
  C_CARN: 2, // closest entity is carnivore (0/1)
  C_PROX: 3, // proximity to nearest (1=close, 0=far/none)
  C_ANGLE: 4, // heading alignment (1=front, 0=behind, 0=none)
  C_LEFT: 5, // target is left or front (1/0)
  C_RIGHT: 6, // target is right or front (1/0)
  N_FOOD: 7, // food count in vision (0-1, clamps at 10)
  N_HERB: 8, // herb count in vision (0-1, clamps at 10)
  N_CARN: 9, // carn count in vision (0-1, clamps at 10)
  AVG_D: 10, // avg distance (0-1)
  STARV: 11, // starvation (0-1)
  WALL: 12, // wall proximity (0=none, 1=wall)
  BIAS: 13, // always 1.0
};

describe("Neural Network Input/Output Process", () => {
  let scene;
  let foodManager;

  beforeEach(() => {
    scene = new THREE.Scene();
    foodManager = new FoodManager(scene, CONFIG);
  });

  afterEach(() => {
    scene.clear();
  });

  it("NN should receive 14 inputs on each frame", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    const cfg = { ...CONFIG };
    const allGizmos = [gizmo];

    gizmo.update(0.1, cfg, allGizmos, foodManager);

    expect(gizmo._lastInputs).toBeDefined();
    expect(gizmo._lastInputs.length).toBe(14);
    gizmo._lastInputs.forEach((input) => {
      expect(typeof input).toBe("number");
      expect(Number.isFinite(input)).toBe(true);
    });
  });

  it("all inputs must be in [0, 1]", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    gizmo.update(0.1, { ...CONFIG }, [gizmo], foodManager);
    gizmo._lastInputs.forEach((v, i) => {
      expect(v, `input[${i}] out of range`).toBeGreaterThanOrEqual(0);
      expect(v, `input[${i}] out of range`).toBeLessThanOrEqual(1);
    });
  });

  it("bias input [11] must always be 1.0", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    gizmo.update(0.1, { ...CONFIG }, [gizmo], foodManager);
    expect(gizmo._lastInputs[IDX.BIAS]).toBe(1);
  });

  it("closest identity inputs form a valid one-hot or all-zero vector", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    gizmo.update(0.1, { ...CONFIG }, [gizmo], foodManager);
    const identity = [
      gizmo._lastInputs[IDX.C_FOOD],
      gizmo._lastInputs[IDX.C_HERB],
      gizmo._lastInputs[IDX.C_CARN],
    ];
    // each must be 0 or 1
    identity.forEach((v) => expect([0, 1]).toContain(v));
    // sum must be 0 (nothing visible) or 1 (one-hot)
    const sum = identity.reduce((a, b) => a + b, 0);
    expect([0, 1]).toContain(sum);
  });

  it("starvation input increases over time without eating", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    const cfg = { ...CONFIG };
    const allGizmos = [gizmo];

    gizmo.update(0.1, cfg, allGizmos, foodManager);
    const starv1 = gizmo._lastInputs[IDX.STARV];

    // Simulate 30s of starvation without killing it
    gizmo.starvationCounter = 30;
    gizmo.update(0.1, cfg, allGizmos, foodManager);
    const starv2 = gizmo._lastInputs[IDX.STARV];

    expect(starv2).toBeGreaterThan(starv1);
  });

  it("wall input is high when gizmo is near a wall", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    // Place gizmo against the right wall
    gizmo.position.x = CONFIG.aquariumWidth / 2 - 1;
    gizmo.position.y = 0;
    gizmo.update(0.1, { ...CONFIG }, [gizmo], foodManager);
    expect(gizmo._lastInputs[IDX.WALL]).toBeGreaterThan(0.9);
  });

  it("wall input is low when gizmo is near centre", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    gizmo.position.x = 0;
    gizmo.position.y = 0;
    gizmo.update(0.1, { ...CONFIG }, [gizmo], foodManager);
    expect(gizmo._lastInputs[IDX.WALL]).toBeLessThan(0.1);
  });

  it("proximity and bearing inputs are 0 with no target; c_prox > 0 when target nearby", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    gizmo.position.set(0, 0);

    // No target → proximity and bearing must all be 0
    const noTarget = buildInputs(gizmo, { ...CONFIG }, [], { foods: [] });
    expect(noTarget[IDX.C_PROX]).toBe(0);
    expect(noTarget[IDX.C_ANGLE]).toBe(0);
    expect(noTarget[IDX.C_LEFT]).toBe(0);
    expect(noTarget[IDX.C_RIGHT]).toBe(0);

    // Food nearby → c_prox > 0; c_angle/c_left/c_right are in valid ranges
    const fm = { foods: [{ x: 5, y: 0, size: 5 }] };
    const inputs = buildInputs(gizmo, { ...CONFIG }, [], fm);
    expect(inputs[IDX.C_FOOD]).toBe(1);
    expect(inputs[IDX.C_PROX]).toBeGreaterThan(0);
    expect(inputs[IDX.N_FOOD]).toBeGreaterThan(0);
    expect([0, 1]).toContain(inputs[IDX.C_LEFT]);
    expect([0, 1]).toContain(inputs[IDX.C_RIGHT]);
    expect(inputs[IDX.C_ANGLE]).toBeGreaterThanOrEqual(0);
    expect(inputs[IDX.C_ANGLE]).toBeLessThanOrEqual(1);
  });

  it("c_prox is higher when target is closer", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    gizmo.position.set(0, 0);

    const visionRange = CONFIG.visionMax ?? 180;
    const near = { foods: [{ x: 5, y: 0, size: 5 }] };
    const far = { foods: [{ x: visionRange * 0.9, y: 0, size: 5 }] };

    const nearInputs = buildInputs(gizmo, { ...CONFIG }, [], near);
    const farInputs = buildInputs(gizmo, { ...CONFIG }, [], far);
    expect(nearInputs[IDX.C_PROX]).toBeGreaterThan(farInputs[IDX.C_PROX]);
  });

  it("c_left=1 c_right=1 when target is directly in front", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    gizmo.position.set(0, 0);
    // Gizmo direction starts as (0, 1) i.e. pointing up
    // Target directly above → cross = 0, dot = 1
    const fm = { foods: [{ x: 0, y: 50, size: 5 }] };
    const inputs = buildInputs(gizmo, { ...CONFIG }, [], fm);
    expect(inputs[IDX.C_ANGLE]).toBeCloseTo(1, 1);
    expect(inputs[IDX.C_LEFT]).toBe(1);
    expect(inputs[IDX.C_RIGHT]).toBe(1);
  });

  it("NN should produce 3 valid outputs in [0,1]", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    const cfg = { ...CONFIG };
    const allGizmos = [gizmo];

    gizmo.update(0.1, cfg, allGizmos, foodManager);

    expect(gizmo._lastOutputs).toBeDefined();
    expect(gizmo._lastOutputs.length).toBe(3);

    gizmo._lastOutputs.forEach((output) => {
      expect(typeof output).toBe("number");
      expect(Number.isFinite(output)).toBe(true);
      expect(output).toBeGreaterThanOrEqual(0);
      expect(output).toBeLessThanOrEqual(1);
    });
  });

  it("NN should not fail on valid inputs", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    const cfg = { ...CONFIG };
    const allGizmos = [gizmo];

    gizmo.update(0.1, cfg, allGizmos, foodManager);

    expect(gizmo._nnFault).toBe(false);
    expect(gizmo._nnFaultReason).toBe("");
  });

  it("NN fallback should be [0.5, 0.5, 0.5]", () => {
    const gizmo = new Gizmo(scene, CONFIG);

    // Force error
    const originalForward = gizmo.nn.forward;
    gizmo.nn.forward = () => {
      throw new Error("Test error");
    };

    const cfg = { ...CONFIG };
    const allGizmos = [gizmo];

    gizmo.update(0.1, cfg, allGizmos, foodManager);

    expect(gizmo._nnFault).toBe(true);
    expect(gizmo._lastOutputs).toEqual([0.5, 0.5, 0.5]);

    gizmo.nn.forward = originalForward;
  });

  it("NN should process multiple frames consistently", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    const cfg = { ...CONFIG };
    const allGizmos = [gizmo];

    const outputFrames = [];

    for (let i = 0; i < 3; i++) {
      gizmo.update(0.1, cfg, allGizmos, foodManager);
      if (!gizmo._nnFault) {
        outputFrames.push(gizmo._lastOutputs.slice());
      }
    }

    expect(outputFrames.length).toBe(3);
    outputFrames.forEach((frame) => {
      expect(frame.length).toBe(3);
      frame.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      });
    });
  });
});
