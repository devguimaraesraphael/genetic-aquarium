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
  C_DIST_X: 3, // X-distance to closest (1=nearby, 0=far/none)
  C_DIST_Y: 4, // Y-distance to closest (1=nearby, 0=far/none)
  N_FOOD: 5, // food count in vision (0-1, clamps at 10)
  N_HERB: 6, // herb count in vision (0-1, clamps at 10)
  N_CARN: 7, // carn count in vision (0-1, clamps at 10)
  AVG_D: 8, // avg distance (0-1)
  STARV: 9, // starvation (0-1)
  WALL: 10, // wall proximity (0=centre, 1=wall)
  BIAS: 11, // always 1.0
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

  it("NN should receive 12 inputs on each frame", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    const cfg = { ...CONFIG };
    const allGizmos = [gizmo];

    gizmo.update(0.1, cfg, allGizmos, foodManager);

    expect(gizmo._lastInputs).toBeDefined();
    expect(gizmo._lastInputs.length).toBe(12);
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

  it("c_dist_x/c_dist_y are high (near 1) when food is directly alongside the gizmo", () => {
    const gizmo = new Gizmo(scene, CONFIG);
    gizmo.position.set(0, 0);

    // Food at (5, 0): very close on X axis, same Y
    const fm = { foods: [{ x: 5, y: 0, size: 5 }] };
    const inputs = buildInputs(gizmo, { ...CONFIG }, [], fm);

    expect(inputs[IDX.C_FOOD]).toBe(1);
    expect(inputs[IDX.C_HERB]).toBe(0);
    expect(inputs[IDX.C_CARN]).toBe(0);
    // X distance close → c_dist_x near 1; Y distance = 0 → c_dist_y = 1
    expect(inputs[IDX.C_DIST_X]).toBeGreaterThan(0.8);
    expect(inputs[IDX.C_DIST_Y]).toBe(1);
    expect(inputs[IDX.N_FOOD]).toBeGreaterThan(0);
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
