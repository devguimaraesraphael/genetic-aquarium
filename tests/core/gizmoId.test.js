import { describe, it, expect, beforeEach } from "vitest";
import {
  generateInitialId,
  generateCloneId,
  generateCrossoverId,
  resetIdRegistry,
} from "../../src/gizmo/gizmoId.js";

describe("Gizmo ID generation", () => {
  beforeEach(() => {
    resetIdRegistry(); // fresh pool before each test
  });

  it("initial ID has format SEG1(3)-SEG2(4)-SEG3(4)", () => {
    const id = generateInitialId();
    expect(id).toMatch(/^[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  });

  it("initial ID starts with generation 0 ('0')", () => {
    const id = generateInitialId();
    expect(id[0]).toBe("0");
  });

  it("initial IDs never have boring repeated-char segments (e.g. '0000', 'FFFF')", () => {
    for (let i = 0; i < 30; i++) {
      const id = generateInitialId();
      const [, seg2, seg3] = id.split("-");
      expect(seg2).not.toMatch(/^(.)\1+$/);
      expect(seg3).not.toMatch(/^(.)\1+$/);
    }
  });

  it("initial IDs in the same run have unique SEG2 values", () => {
    const seg2s = new Set();
    for (let i = 0; i < 20; i++) {
      const id = generateInitialId();
      seg2s.add(id.split("-")[1]);
    }
    expect(seg2s.size).toBe(20);
  });

  it("initial IDs in the same run have unique SEG3 values", () => {
    const seg3s = new Set();
    for (let i = 0; i < 20; i++) {
      const id = generateInitialId();
      seg3s.add(id.split("-")[2]);
    }
    expect(seg3s.size).toBe(20);
  });

  it("clone ID increments generation digit", () => {
    const parent = "0AB-1234-5678";
    const child = generateCloneId(parent);
    expect(child[0]).toBe("1"); // gen 0 → 1
    expect(child).toMatch(/^[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  });

  it("clone SEG1 tail is NEW random (not inherited from parent)", () => {
    const parent = "0AB-1234-5678";
    // Run many times – statistically the tail should differ from parent's "AB" at least once
    const tails = new Set();
    for (let i = 0; i < 30; i++) {
      const child = generateCloneId(parent);
      tails.add(child.slice(1, 3));
    }
    // Should see more than one unique tail across 30 attempts
    expect(tails.size).toBeGreaterThan(1);
  });

  it("clone ID inherits SEG2 and SEG3 unchanged", () => {
    const parent = "0AB-ABCD-EF12";
    const child = generateCloneId(parent);
    const parts = child.split("-");
    expect(parts[1]).toBe("ABCD");
    expect(parts[2]).toBe("EF12");
  });

  it("two clones of the same parent always have different IDs", () => {
    const parent = "0AB-1234-5678";
    const ids = new Set();
    for (let i = 0; i < 50; i++) ids.add(generateCloneId(parent));
    // With 2 random hex chars (256 combos), 50 draws will almost certainly produce >1 unique
    expect(ids.size).toBeGreaterThan(1);
  });

  it("clone of clone increments generation again", () => {
    const gen1 = "1AB-1234-5678";
    const gen2 = generateCloneId(gen1);
    expect(gen2[0]).toBe("2");
    expect(gen2.split("-")[1]).toBe("1234");
    expect(gen2.split("-")[2]).toBe("5678");
  });

  it("generation counter clamps at F (15)", () => {
    const old = "FAB-1234-5678";
    const child = generateCloneId(old);
    expect(child[0]).toBe("F"); // still F, clamped
  });

  it("crossover ID uses gen = max(p1gen, p2gen) + 1", () => {
    const p1 = "1AB-CCCC-EEEE";
    const p2 = "1AB-DDDD-GGGG";
    const child = generateCrossoverId(p1, p2);
    expect(child[0]).toBe("2"); // max(1,1)+1 = 2
  });

  it("crossover SEG1 tail is NEW random (not inherited)", () => {
    const p1 = "1AB-CCCC-EEEE";
    const p2 = "1CD-DDDD-GGGG";
    const tails = new Set();
    for (let i = 0; i < 30; i++) {
      const child = generateCrossoverId(p1, p2);
      tails.add(child.slice(1, 3));
    }
    expect(tails.size).toBeGreaterThan(1);
  });

  it("crossover SEG2 = parent1's SEG3", () => {
    const p1 = "1AB-CCCC-EEEE";
    const p2 = "1CD-DDDD-GGGG";
    const child = generateCrossoverId(p1, p2);
    expect(child.split("-")[1]).toBe("EEEE");
  });

  it("crossover SEG3 = parent2's SEG3", () => {
    const p1 = "1AB-CCCC-EEEE";
    const p2 = "1CD-DDDD-GGGG";
    const child = generateCrossoverId(p1, p2);
    expect(child.split("-")[2]).toBe("GGGG");
  });

  it("crossover of two initial gizmos gives generation 1", () => {
    const p1 = "0A1-B2C3-D4E5";
    const p2 = "0F2-1234-ABCD";
    const child = generateCrossoverId(p1, p2);
    expect(child[0]).toBe("1");
  });

  it("two crossovers of the same parents always have different IDs", () => {
    const p1 = "1AB-CCCC-EEEE";
    const p2 = "1CD-DDDD-GGGG";
    const ids = new Set();
    for (let i = 0; i < 50; i++) ids.add(generateCrossoverId(p1, p2));
    expect(ids.size).toBeGreaterThan(1);
  });

  it("generateCloneId handles missing/invalid parent gracefully", () => {
    const id = generateCloneId("invalid");
    expect(id).toMatch(/^[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  });

  it("generateCrossoverId handles invalid parents gracefully", () => {
    const id = generateCrossoverId("bad", "alsoBad");
    expect(id).toMatch(/^[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  });
});
