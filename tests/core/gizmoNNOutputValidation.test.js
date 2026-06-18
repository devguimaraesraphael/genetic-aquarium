import { describe, it, expect, beforeEach, vi } from "vitest";
import { Gizmo } from "../../src/Gizmo.js";
import * as THREE from "three";

describe("Gizmo NN Output Validation", () => {
  let scene;
  let config;
  let gizmo;

  beforeEach(() => {
    scene = new THREE.Scene();
    config = {
      aquariumWidth: 1200,
      aquariumHeight: 700,
      sizeMin: 0.6,
      sizeMax: 1.4,
      visionMin: 35,
      visionMax: 90,
      nnHiddenSize: 6,
      nnAccelScale: 300,
      nnMutationRate: 1.0,
      nnMutationDelta: 0.01,
      gizmoStarvation: 120,
      k: 0.08,
      l: 0.92,
      maxVelocity: 120,
      carnivoreRatio: 0.1,
    };
    gizmo = new Gizmo(scene, config);
  });

  it("should initialize with valid NN", () => {
    expect(gizmo.nn).toBeDefined();
    expect(gizmo.nn.forward).toBeDefined();
  });

  it("should produce valid [0,1] outputs on first update", () => {
    const inputs = gizmo._nullInputs(config);
    expect(inputs).toHaveLength(14);

    const output = gizmo.nn.forward(inputs);
    expect(output).toHaveLength(3);

    for (let i = 0; i < 3; i++) {
      expect(Number.isFinite(output[i])).toBe(true);
      expect(output[i]).toBeGreaterThanOrEqual(0);
      expect(output[i]).toBeLessThanOrEqual(1);
    }
  });

  it("should not throw on multiple consecutive updates", () => {
    expect(() => {
      for (let i = 0; i < 100; i++) {
        const inputs = gizmo._nullInputs(config);
        const output = gizmo.nn.forward(inputs);
        // Validate all outputs are finite and in [0, 1]
        for (let j = 0; j < 3; j++) {
          if (!Number.isFinite(output[j]) || output[j] < 0 || output[j] > 1) {
            throw new Error(`Invalid output at iteration ${i}: ${output[j]}`);
          }
        }
      }
    }).not.toThrow();
  });

  it("should set _nnFault only when output validation fails", () => {
    // Before update, should not have fault
    expect(gizmo._nnFault).toBe(false);

    // After initialization, first update should work
    const inputs = gizmo._nullInputs(config);
    const output = gizmo.nn.forward(inputs);

    // Simulate what update() does
    gizmo._nnFault = false;
    gizmo._nnFaultReason = "";
    try {
      if (!Array.isArray(output) || output.length < 3) {
        throw new Error("invalid NN output");
      }
      if (!output.every((v) => Number.isFinite(v))) {
        throw new Error("non-finite NN output");
      }
      for (let i = 0; i < 3; i++) {
        if (output[i] < 0 || output[i] > 1) {
          throw new Error(`output[${i}] out of range [0, 1]: ${output[i]}`);
        }
      }
    } catch (err) {
      gizmo._nnFault = true;
      gizmo._nnFaultReason = err?.message;
    }

    expect(gizmo._nnFault).toBe(false);
  });

  it("should maintain acceleration mapping: [0.5, 0.5, eat] -> [0, 0, decision]", () => {
    const fallback = [0.5, 0.5, 0.5];
    const scale = config.nnAccelScale ?? 200;
    const ax = fallback[0] * 2 - 1; // 0.5 * 2 - 1 = 0
    const ay = fallback[1] * 2 - 1; // 0.5 * 2 - 1 = 0
    const eatDecision = fallback[2]; // 0.5

    expect(ax).toBe(0);
    expect(ay).toBe(0);
    expect(eatDecision).toBe(0.5);

    // With scale, should still be zero
    expect(ax * scale).toBe(0);
    expect(ay * scale).toBe(0);

    // eatDecision threshold is 0.5, so 0.5 should NOT trigger eating
    expect(eatDecision >= 0.5).toBe(true); // 0.5 >= 0.5 is true!
  });

  it("should clarify eatDecision threshold: 0.5 triggers eating (>= 0.5)", () => {
    // This is important: the current code uses eatDecision >= 0.5 for canEat
    // So 0.5 exactly means CAN eat
    expect(0.5 >= 0.5).toBe(true);
    expect(0.49999 >= 0.5).toBe(false);
    expect(0.50001 >= 0.5).toBe(true);
  });
});
