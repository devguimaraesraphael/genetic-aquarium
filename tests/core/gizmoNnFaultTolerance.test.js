import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { Gizmo } from "../../src/Gizmo.js";
import { CONFIG } from "../../src/constants.js";

describe("gizmo NN fault tolerance", () => {
  it("does not throw when NN forward fails, even if gizmo is selected", () => {
    const scene = new THREE.Scene();
    const cfg = { ...CONFIG };
    const gizmo = new Gizmo(scene, cfg, { identity: [0, 1, 0] });
    gizmo.select();

    gizmo.nn.forward = () => {
      throw new Error("NN failure");
    };

    expect(() =>
      gizmo.update(0.016, cfg, [gizmo], {
        foods: [],
      }),
    ).not.toThrow();

    // Fallback: [0.5, 0.5, 0.5] (no acceleration, no eat)
    expect(gizmo._lastOutputs).toEqual([0.5, 0.5, 0.5]);
    expect(gizmo._nnFault).toBe(true);
    expect(gizmo._nnFaultReason).toContain("NN failure");

    gizmo.dispose();
  });

  it("flags non-finite NN output as fault without throwing", () => {
    const scene = new THREE.Scene();
    const cfg = { ...CONFIG };
    const gizmo = new Gizmo(scene, cfg, { identity: [0, 1, 0] });

    gizmo.nn.forward = () => [NaN, 0.2, 0.1];

    expect(() =>
      gizmo.update(0.016, cfg, [gizmo], {
        foods: [],
      }),
    ).not.toThrow();

    expect(gizmo._nnFault).toBe(true);
    expect(gizmo._nnFaultReason).toContain("non-finite NN output");
    // Fallback: [0.5, 0.5, 0.5] (no acceleration, no eat)
    expect(gizmo._lastOutputs).toEqual([0.5, 0.5, 0.5]);

    gizmo.dispose();
  });
});
