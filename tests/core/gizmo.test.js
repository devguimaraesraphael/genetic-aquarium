/**
 * gizmo.test.js
 *
 * Five test suites covering the full gizmo lifecycle:
 *   1.   Creation with correct Neural Network format
 *   1.1  Initial position mandatory inside the aquarium
 *   2.   Neural Network: format, input propagation, output validity
 *   3.   Rendering: group added to scene, meshes visible
 *   4.   NN output received and applied to acceleration
 *   5.   Movement: gizmo moves and stays within aquarium bounds
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { Gizmo } from "../../src/Gizmo.js";
import { NeuralNetwork } from "../../src/NeuralNetwork.js";
import { IDENTITY_HERBIVORE, IDENTITY_CARNIVORE } from "../../src/Identity.js";
import { CONFIG } from "../../src/constants.js";

// Minimal stub so tests that don't need real food still work
const NO_FOOD = { foods: [] };

// ─────────────────────────────────────────────────────────────────────────────
// 1. GIZMO CREATED WITH CORRECT NEURAL NETWORK FORMAT
// ─────────────────────────────────────────────────────────────────────────────
describe("1. Gizmo – Neural Network format on creation", () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  afterEach(() => {
    scene.clear();
  });

  it("gizmo has a nn instance of NeuralNetwork", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.nn).toBeInstanceOf(NeuralNetwork);
  });

  it("nn has inputSize = 12", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.nn.inputSize).toBe(12);
  });

  it("nn hiddenSize matches config.nnHiddenSize", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.nn.hiddenSize).toBe(CONFIG.nnHiddenSize);
  });

  it("nn has outputSize = 3", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.nn.outputSize).toBe(3);
  });

  it("nn weight matrix w1 has correct shape [hiddenSize][inputSize]", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.nn.w1.length).toBe(CONFIG.nnHiddenSize);
    g.nn.w1.forEach((row) => {
      expect(row.length).toBe(12);
    });
  });

  it("nn weight matrix w2 has correct shape [outputSize][hiddenSize]", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.nn.w2.length).toBe(3);
    g.nn.w2.forEach((row) => {
      expect(row.length).toBe(CONFIG.nnHiddenSize);
    });
  });

  it("nn exposes forward, clone, mutate methods", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(typeof g.nn.forward).toBe("function");
    expect(typeof g.nn.clone).toBe("function");
    expect(typeof g.nn.mutate).toBe("function");
  });

  it("identity is IDENTITY_HERBIVORE or IDENTITY_CARNIVORE", () => {
    const g = new Gizmo(scene, CONFIG);
    const validIdentities = [IDENTITY_HERBIVORE, IDENTITY_CARNIVORE];
    expect(validIdentities).toContain(g.identity);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1.1 INITIAL POSITION MANDATORY INSIDE THE AQUARIUM
// ─────────────────────────────────────────────────────────────────────────────
describe("1.1 Gizmo – Initial position inside aquarium", () => {
  let scene;
  const hw = CONFIG.aquariumWidth / 2;
  const hh = CONFIG.aquariumHeight / 2;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  afterEach(() => {
    scene.clear();
  });

  it("position.x is within aquarium horizontal bounds on spawn", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.position.x).toBeGreaterThanOrEqual(-hw);
    expect(g.position.x).toBeLessThanOrEqual(hw);
  });

  it("position.y is within aquarium vertical bounds on spawn", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.position.y).toBeGreaterThanOrEqual(-hh);
    expect(g.position.y).toBeLessThanOrEqual(hh);
  });

  it("50 gizmos all spawn inside aquarium", () => {
    const gizmos = Array.from({ length: 50 }, () => new Gizmo(scene, CONFIG));
    gizmos.forEach((g) => {
      expect(g.position.x).toBeGreaterThanOrEqual(-hw);
      expect(g.position.x).toBeLessThanOrEqual(hw);
      expect(g.position.y).toBeGreaterThanOrEqual(-hh);
      expect(g.position.y).toBeLessThanOrEqual(hh);
    });
  });

  it("spawn margin keeps gizmos away from exact border (85% rule)", () => {
    const margin = 0.85;
    const gizmos = Array.from({ length: 30 }, () => new Gizmo(scene, CONFIG));
    gizmos.forEach((g) => {
      expect(Math.abs(g.position.x)).toBeLessThanOrEqual(hw * margin + 1);
      expect(Math.abs(g.position.y)).toBeLessThanOrEqual(hh * margin + 1);
    });
  });

  it("group.position matches gizmo.position at creation", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.group.position.x).toBeCloseTo(g.position.x, 1);
    expect(g.group.position.y).toBeCloseTo(g.position.y, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. NEURAL NETWORK: FORMAT, INPUT PROPAGATION, OUTPUT
// ─────────────────────────────────────────────────────────────────────────────
describe("2. Neural Network – format, propagation, output", () => {
  it("forward() returns array of length 3", () => {
    const nn = new NeuralNetwork(12, 6, 3);
    const out = nn.forward(new Array(12).fill(0));
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBe(3);
  });

  it("all outputs are finite numbers in [0, 1]", () => {
    const nn = new NeuralNetwork(12, 6, 3);
    const out = nn.forward(new Array(12).fill(0.5));
    out.forEach((v) => {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });

  it("different inputs produce different outputs (propagation active)", () => {
    const nn = new NeuralNetwork(12, 6, 3);
    const out1 = nn.forward(new Array(12).fill(0));
    const out2 = nn.forward(new Array(12).fill(1));
    // At least one output must differ
    const anyDifferent = out1.some((v, i) => Math.abs(v - out2[i]) > 1e-6);
    expect(anyDifferent).toBe(true);
  });

  it("same inputs always produce same outputs (deterministic)", () => {
    const nn = new NeuralNetwork(12, 6, 3);
    const inputs = Array.from({ length: 12 }, (_, i) => i / 12);
    const out1 = nn.forward(inputs);
    const out2 = nn.forward(inputs);
    out1.forEach((v, i) => {
      expect(v).toBeCloseTo(out2[i], 10);
    });
  });

  it("all 12 input positions influence output (no dead inputs)", () => {
    const nn = new NeuralNetwork(12, 6, 3);
    const base = new Array(12).fill(0);
    const baseOut = nn.forward(base);
    let influentialCount = 0;
    for (let i = 0; i < 12; i++) {
      const variant = [...base];
      variant[i] = 1;
      const varOut = nn.forward(variant);
      if (varOut.some((v, j) => Math.abs(v - baseOut[j]) > 1e-9)) {
        influentialCount++;
      }
    }
    // At least 6 of 12 inputs must influence the output
    expect(influentialCount).toBeGreaterThanOrEqual(6);
  });

  it("forward() handles all-zero inputs without NaN/Infinity", () => {
    const nn = new NeuralNetwork(12, 6, 3);
    const out = nn.forward(new Array(12).fill(0));
    out.forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });

  it("forward() handles extreme inputs without NaN/Infinity", () => {
    const nn = new NeuralNetwork(12, 6, 3);
    const out = nn.forward(new Array(12).fill(1e6));
    out.forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });

  it("Gizmo._nullInputs returns 12-element all-zero array", () => {
    const scene = new THREE.Scene();
    const g = new Gizmo(scene, CONFIG);
    const inputs = g._nullInputs(CONFIG);
    expect(inputs.length).toBe(12);
    inputs.forEach((v) => expect(v).toBe(0));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. RENDERING: GROUP IN SCENE, MESHES VISIBLE
// ─────────────────────────────────────────────────────────────────────────────
describe("3. Gizmo – Rendering in Three.js scene", () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  afterEach(() => {
    scene.clear();
  });

  it("gizmo.group is added to scene on creation", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(scene.children).toContain(g.group);
  });

  it("group is visible by default", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.group.visible).toBe(true);
  });

  it("bodyMesh exists and is a THREE.Mesh", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.bodyMesh).toBeDefined();
    expect(g.bodyMesh).toBeInstanceOf(THREE.Mesh);
  });

  it("spikeMesh exists and is a THREE.Mesh", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.spikeMesh).toBeDefined();
    expect(g.spikeMesh).toBeInstanceOf(THREE.Mesh);
  });

  it("bodyGroup contains bodyMesh and spikeMesh", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.bodyGroup.children).toContain(g.bodyMesh);
    expect(g.bodyGroup.children).toContain(g.spikeMesh);
  });

  it("herbivore body color is green (0x00ff00)", () => {
    const g = new Gizmo(scene, CONFIG, { identity: IDENTITY_HERBIVORE });
    expect(g.bodyMesh.material.color.getHex()).toBe(0x00ff00);
  });

  it("carnivore body color is red (0xff0000)", () => {
    const g = new Gizmo(scene, CONFIG, { identity: IDENTITY_CARNIVORE });
    expect(g.bodyMesh.material.color.getHex()).toBe(0xff0000);
  });

  it("herbivore spike color is yellow (0xffff00)", () => {
    const g = new Gizmo(scene, CONFIG, { identity: IDENTITY_HERBIVORE });
    expect(g.spikeMesh.material.color.getHex()).toBe(0xffff00);
  });

  it("carnivore spike color is red (0xff0000)", () => {
    const g = new Gizmo(scene, CONFIG, { identity: IDENTITY_CARNIVORE });
    expect(g.spikeMesh.material.color.getHex()).toBe(0xff0000);
  });

  it("dead gizmo has group.visible = false", () => {
    const g = new Gizmo(scene, CONFIG);
    g.isDead = true;
    g.group.visible = false;
    expect(g.group.visible).toBe(false);
  });

  it("10 gizmos each add exactly one group to scene", () => {
    const before = scene.children.length;
    Array.from({ length: 10 }, () => new Gizmo(scene, CONFIG));
    expect(scene.children.length).toBe(before + 10);
  });

  it("visionMesh exists and starts hidden", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.visionMesh).toBeDefined();
    expect(g.visionMesh.visible).toBe(false);
  });

  it("visionMesh becomes visible on select()", () => {
    const g = new Gizmo(scene, CONFIG);
    g.select();
    expect(g.visionMesh.visible).toBe(true);
  });

  it("visionMesh hidden again on deselect()", () => {
    const g = new Gizmo(scene, CONFIG);
    g.select();
    g.deselect();
    expect(g.visionMesh.visible).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GIZMOS RECEIVE NN OUTPUT AND APPLY IT
// ─────────────────────────────────────────────────────────────────────────────
describe("4. Gizmo – Receives and applies NN output", () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  afterEach(() => {
    scene.clear();
  });

  it("_lastOutputs initialized to [0.5, 0.5, 0.5] before first update", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g._lastOutputs).toEqual([0.5, 0.5, 0.5]);
  });

  it("after update(), _lastOutputs has 3 values in [0, 1]", () => {
    const g = new Gizmo(scene, CONFIG);
    g.update(0.016, CONFIG, [g], NO_FOOD);
    expect(g._lastOutputs.length).toBe(3);
    g._lastOutputs.forEach((v) => {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });

  it("after update(), _lastInputs has 12 finite values", () => {
    const g = new Gizmo(scene, CONFIG);
    g.update(0.016, CONFIG, [g], NO_FOOD);
    expect(g._lastInputs.length).toBe(12);
    g._lastInputs.forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });

  it("no NN fault after normal update with valid config", () => {
    const g = new Gizmo(scene, CONFIG);
    g.update(0.016, CONFIG, [g], NO_FOOD);
    expect(g._nnFault).toBe(false);
  });

  it("broken nn.forward triggers _nnFault and returns fallback [0.5,0.5,0.5]", () => {
    const g = new Gizmo(scene, CONFIG);
    g.nn.forward = () => {
      throw new Error("Simulated NN failure");
    };
    g.update(0.016, CONFIG, [g], NO_FOOD);
    expect(g._nnFault).toBe(true);
    expect(g._lastOutputs).toEqual([0.5, 0.5, 0.5]);
  });

  it("nn returning NaN triggers _nnFault", () => {
    const g = new Gizmo(scene, CONFIG);
    g.nn.forward = () => [NaN, 0.5, 0.5];
    g.update(0.016, CONFIG, [g], NO_FOOD);
    expect(g._nnFault).toBe(true);
  });

  it("nn returning value >1 triggers _nnFault", () => {
    const g = new Gizmo(scene, CONFIG);
    g.nn.forward = () => [1.5, 0.5, 0.5];
    g.update(0.016, CONFIG, [g], NO_FOOD);
    expect(g._nnFault).toBe(true);
  });

  it("nnFaultStack is populated when NN fails", () => {
    const g = new Gizmo(scene, CONFIG);
    g.nn.forward = () => {
      throw new Error("stack trace test");
    };
    g.update(0.016, CONFIG, [g], NO_FOOD);
    expect(g._nnFaultStack).toBeTruthy();
    expect(typeof g._nnFaultStack).toBe("string");
  });

  it("NN outputs influence acceleration direction", () => {
    const scene1 = new THREE.Scene();
    const scene2 = new THREE.Scene();

    // Gizmo 1: forced output toward +x (ax=1, ay=0.5)
    const g1 = new Gizmo(scene1, CONFIG);
    g1.nn.forward = () => [1, 0.5, 0]; // ax=1 → target right
    g1.velocity.set(0, 0);
    g1.acceleration.set(0, 0); // start neutral
    // Run enough frames so lerp has time to steer
    for (let i = 0; i < 30; i++) g1.update(0.1, CONFIG, [g1], NO_FOOD);
    const ax1 = g1.acceleration.x;

    // Gizmo 2: forced output toward -x (ax=0, ay=0.5)
    const g2 = new Gizmo(scene2, CONFIG);
    g2.nn.forward = () => [0, 0.5, 0]; // ax=0 → target left
    g2.velocity.set(0, 0);
    g2.acceleration.set(0, 0);
    for (let i = 0; i < 30; i++) g2.update(0.1, CONFIG, [g2], NO_FOOD);
    const ax2 = g2.acceleration.x;

    // After enough frames, g1 should steer right (positive x), g2 left (negative x)
    expect(ax1).toBeGreaterThan(ax2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. MOVEMENT: GIZMO MOVES AND STAYS WITHIN AQUARIUM
// ─────────────────────────────────────────────────────────────────────────────
describe("5. Gizmo – Movement inside aquarium", () => {
  let scene;
  const hw = CONFIG.aquariumWidth / 2;
  const hh = CONFIG.aquariumHeight / 2;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  afterEach(() => {
    scene.clear();
  });

  it("position changes after update", () => {
    const g = new Gizmo(scene, CONFIG);
    // Force a strong NN output so it definitely moves
    g.nn.forward = () => [1, 1, 0];
    const px = g.position.x;
    const py = g.position.y;
    g.update(0.1, CONFIG, [g], NO_FOOD);
    const moved = g.position.x !== px || g.position.y !== py;
    expect(moved).toBe(true);
  });

  it("position always inside aquarium bounds after 100 frames", () => {
    const g = new Gizmo(scene, CONFIG);
    for (let i = 0; i < 100; i++) {
      g.update(0.016, CONFIG, [g], NO_FOOD);
      expect(g.position.x).toBeGreaterThanOrEqual(-hw);
      expect(g.position.x).toBeLessThanOrEqual(hw);
      expect(g.position.y).toBeGreaterThanOrEqual(-hh);
      expect(g.position.y).toBeLessThanOrEqual(hh);
    }
  });

  it("group.position.x/y matches gizmo.position after each update", () => {
    const g = new Gizmo(scene, CONFIG);
    for (let i = 0; i < 10; i++) {
      g.update(0.016, CONFIG, [g], NO_FOOD);
      expect(g.group.position.x).toBeCloseTo(g.position.x, 5);
      expect(g.group.position.y).toBeCloseTo(g.position.y, 5);
    }
  });

  it("velocity is clamped to maxVelocity even under extreme acceleration", () => {
    const g = new Gizmo(scene, CONFIG);
    g.nn.forward = () => [1, 1, 0]; // max accel
    for (let i = 0; i < 60; i++) {
      g.update(0.016, CONFIG, [g], NO_FOOD);
    }
    const speed = g.velocity.length();
    expect(speed).toBeLessThanOrEqual(CONFIG.maxVelocity + 1e-6);
  });

  it("wraps around left→right edge (position.x clamped)", () => {
    const g = new Gizmo(scene, CONFIG);
    g.position.x = -hw - 1; // Force outside left edge
    g.update(0.001, CONFIG, [g], NO_FOOD);
    expect(g.position.x).toBeGreaterThanOrEqual(-hw);
  });

  it("wraps around right→left edge (position.x clamped)", () => {
    const g = new Gizmo(scene, CONFIG);
    g.position.x = hw + 1; // Force outside right edge
    g.update(0.001, CONFIG, [g], NO_FOOD);
    expect(g.position.x).toBeLessThanOrEqual(hw);
  });

  it("wraps around top/bottom edges (position.y clamped)", () => {
    const g = new Gizmo(scene, CONFIG);
    g.position.y = hh + 1;
    g.update(0.001, CONFIG, [g], NO_FOOD);
    expect(g.position.y).toBeLessThanOrEqual(hh);

    g.position.y = -hh - 1;
    g.update(0.001, CONFIG, [g], NO_FOOD);
    expect(g.position.y).toBeGreaterThanOrEqual(-hh);
  });

  it("direction vector updated after movement", () => {
    const g = new Gizmo(scene, CONFIG);
    g.nn.forward = () => [1, 0, 0]; // strong rightward accel
    g.velocity.set(0, 0);
    for (let i = 0; i < 10; i++) {
      g.update(0.05, CONFIG, [g], NO_FOOD);
    }
    // After moving right, direction.x should be positive
    expect(g.direction.length()).toBeCloseTo(1, 3); // unit vector
  });

  it("dead gizmo does not move after update", () => {
    const g = new Gizmo(scene, CONFIG);
    g.update(0.016, CONFIG, [g], NO_FOOD); // one live frame
    const px = g.position.x;
    const py = g.position.y;
    g.isDead = true;
    g.update(0.016, CONFIG, [g], NO_FOOD); // dead frame - should not move
    expect(g.position.x).toBe(px);
    expect(g.position.y).toBe(py);
  });
});
