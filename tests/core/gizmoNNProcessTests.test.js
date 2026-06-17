import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { Gizmo } from "../../src/Gizmo.js";
import { CONFIG } from "../../src/constants.js";
import { FoodManager } from "../../src/Food.js";

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
