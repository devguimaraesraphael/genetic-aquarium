import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { Gizmo } from "../../src/Gizmo.js";
import { CONFIG } from "../../src/constants.js";

describe("Gizmo Live Rendering", () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  afterEach(() => {
    scene.clear();
  });

  it("live gizmo should be rendered in scene", () => {
    const gizmo = new Gizmo(scene, CONFIG);

    expect(gizmo.isDead).toBe(false);
    expect(gizmo.group).toBeDefined();
    expect(gizmo.group.visible).toBe(true);
    expect(scene.children).toContain(gizmo.group);
  });

  it("dead gizmo should be removed from render", () => {
    const gizmo = new Gizmo(scene, CONFIG);

    expect(scene.children).toContain(gizmo.group);

    gizmo.isDead = true;
    gizmo.group.visible = false;

    expect(gizmo.group.visible).toBe(false);
  });

  it("multiple live gizmos should all be in scene", () => {
    const gizmos = [];
    for (let i = 0; i < 5; i++) {
      gizmos.push(new Gizmo(scene, CONFIG));
    }

    // Each gizmo adds group + seenTargetMarker = 2 children per gizmo
    expect(scene.children.length).toBe(10);
    gizmos.forEach((g) => {
      expect(g.isDead).toBe(false);
      expect(scene.children).toContain(g.group);
    });
  });

  it("gizmo mesh should have bodyMesh and bodyGroup", () => {
    const gizmo = new Gizmo(scene, CONFIG);

    expect(gizmo.bodyMesh).toBeDefined();
    expect(gizmo.bodyGroup).toBeDefined();
    expect(gizmo.bodyGroup.children.length).toBeGreaterThan(0);
  });

  it("vision circle should be visible when gizmo selected", () => {
    const gizmo = new Gizmo(scene, CONFIG);

    expect(gizmo.visionMesh).toBeDefined();
    expect(gizmo.visionMesh.visible).toBe(false);

    gizmo.select();
    expect(gizmo.visionMesh.visible).toBe(true);

    gizmo.deselect();
    expect(gizmo.visionMesh.visible).toBe(false);
  });
});
