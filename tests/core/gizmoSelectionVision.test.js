import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { Gizmo } from "../../src/Gizmo.js";
import { CONFIG } from "../../src/constants.js";

describe("gizmo vision circle selection rule", () => {
  it("vision circle starts hidden, shows on select, hides on deselect", () => {
    const scene = new THREE.Scene();
    const cfg = { ...CONFIG };
    const gizmo = new Gizmo(scene, cfg, { identity: [0, 1, 0] });

    expect(gizmo.visionMesh.visible).toBe(false);

    gizmo.select();
    expect(gizmo.visionMesh.visible).toBe(true);

    gizmo.deselect();
    expect(gizmo.visionMesh.visible).toBe(false);

    gizmo.dispose();
  });

  it("red circle marker created and opacity controlled on select/deselect", () => {
    const scene = new THREE.Scene();
    const cfg = { ...CONFIG };
    const gizmo = new Gizmo(scene, cfg, { identity: [0, 1, 0] });

    // Marker should exist
    expect(gizmo._seenTargetMarker).toBeTruthy();
    expect(gizmo._seenTargetMarker.material.color.getHex()).toBe(0xff0000); // red

    // Should start invisible (opacity 0)
    expect(gizmo._seenTargetMarker.material.opacity).toBe(0);

    // On select with no target, marker stays invisible
    gizmo.select();
    expect(gizmo._seenTargetMarker.material.opacity).toBe(0);

    // On deselect, marker is hidden
    gizmo.deselect();
    expect(gizmo._seenTargetMarker.material.opacity).toBe(0);

    gizmo.dispose();
  });

  it("seen target marker positioned at closest item when selected and item visible", () => {
    const scene = new THREE.Scene();
    const cfg = { ...CONFIG, gizmoCount: 2 };
    const gizmo1 = new Gizmo(scene, cfg, { identity: [0, 1, 0] });
    const gizmo2 = new Gizmo(scene, cfg, { identity: [0, 1, 0] });

    // Place gizmo2 at known position within gizmo1's vision range
    // Default visionMin is 30, so place gizmo2 at distance 40 from gizmo1
    gizmo1.position.set(0, 0);
    gizmo2.position.set(40, 0);

    // First update to establish visionStats and _lastSeenTargetPos
    const mockFoodManager = { foods: [] };
    gizmo1.update(0.016, cfg, [gizmo1, gizmo2], mockFoodManager);

    // Now select gizmo1 - this should show marker if there's a closest item
    gizmo1.select();

    // Update again to update marker position
    gizmo1.update(0.016, cfg, [gizmo1, gizmo2], mockFoodManager);

    // The marker should now be positioned at gizmo2's location with opacity > 0
    expect(gizmo1._seenTargetMarker.material.opacity).toBeGreaterThan(0);
    expect(gizmo1._seenTargetMarker.position.x).toBeCloseTo(gizmo2.position.x);
    expect(gizmo1._seenTargetMarker.position.y).toBeCloseTo(gizmo2.position.y);

    gizmo1.dispose();
    gizmo2.dispose();
  });
});
