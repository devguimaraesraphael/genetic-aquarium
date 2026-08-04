/**
 * gizmoVisualIdentity.test.js
 *
 * Herbivores and carnivores must be visually distinguishable at a glance:
 * different body hue bands, different spike shapes (rounded fin vs fang+barbs),
 * different eye styles, plus a body outline and always-visible eyes.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { Gizmo } from "../../src/Gizmo.js";
import {
  buildFinGeometry,
  buildFangGroup,
} from "../../src/gizmo/meshShapes.js";
import { buildEyesMesh, buildBodyOutline } from "../../src/gizmo/mesh.js";
import { IDENTITY_HERBIVORE, IDENTITY_CARNIVORE } from "../../src/Identity.js";
import { CONFIG } from "../../src/constants.js";

describe("1. Spike shape differs by identity", () => {
  it("herbivore spike is a single rounded fin mesh", () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(buildFinGeometry(6)));
    expect(group.children.length).toBe(1);
    expect(group.children[0].geometry.type).toBe("ShapeGeometry");
  });

  it("carnivore spike is a fang + two barbs (3 meshes)", () => {
    const group = buildFangGroup(6, 0xff0000);
    expect(group.children.length).toBe(3);
    group.children.forEach((c) => {
      expect(c.material.color.getHex()).toBe(0xff0000);
    });
  });
});

describe("2. Eyes differ by identity", () => {
  it("herbivore eyes are larger (rounder/cuter) than carnivore eyes", () => {
    const herbEyes = buildEyesMesh(IDENTITY_HERBIVORE, 1);
    const carnEyes = buildEyesMesh(IDENTITY_CARNIVORE, 1);
    // children: [white, pupil, white, pupil]
    const herbWhiteRadius = herbEyes.children[0].geometry.parameters.radius;
    const carnWhiteRadius = carnEyes.children[0].geometry.parameters.radius;
    expect(herbWhiteRadius).toBeGreaterThan(carnWhiteRadius);
  });

  it("eyes and spike sit on the same local +Y side (facing direction of travel)", () => {
    const eyes = buildEyesMesh(IDENTITY_CARNIVORE, 1);
    eyes.children.forEach((c) => expect(c.position.y).toBeGreaterThan(0));
    const fangY = [
      ...buildFangGroup(6, 0xff0000).children[0].geometry.attributes.position
        .array,
    ].filter((_, i) => i % 3 === 1);
    fangY.forEach((y) => expect(y).toBeGreaterThan(0));
  });
});

describe("3. Gizmo assembles outline + eyes + spike into bodyGroup", () => {
  let scene;
  beforeEach(() => {
    scene = new THREE.Scene();
  });

  it("bodyGroup contains bodyMesh, bodyOutline, spikeMesh, eyesMesh", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.bodyGroup.children).toContain(g.bodyMesh);
    expect(g.bodyGroup.children).toContain(g.bodyOutline);
    expect(g.bodyGroup.children).toContain(g.spikeMesh);
    expect(g.bodyGroup.children).toContain(g.eyesMesh);
  });

  it("bodyOutline is a LineLoop around the body", () => {
    const g = new Gizmo(scene, CONFIG);
    expect(g.bodyOutline).toBeInstanceOf(THREE.LineLoop);
  });
});

describe("4. Body hue is banded by identity", () => {
  it("herbivore body hue falls in the warm yellow-green band", () => {
    for (let i = 0; i < 20; i++) {
      const scene = new THREE.Scene();
      const g = new Gizmo(scene, CONFIG, { identity: IDENTITY_HERBIVORE });
      const hsl = {};
      g.color.getHSL(hsl);
      expect(hsl.h).toBeGreaterThanOrEqual(0.2);
      expect(hsl.h).toBeLessThanOrEqual(0.42);
    }
  });

  it("carnivore body hue falls in the red-orange band", () => {
    for (let i = 0; i < 20; i++) {
      const scene = new THREE.Scene();
      const g = new Gizmo(scene, CONFIG, { identity: IDENTITY_CARNIVORE });
      const hsl = {};
      g.color.getHSL(hsl);
      const inBand = hsl.h >= 0.97 || hsl.h <= 0.07;
      expect(inBand).toBe(true);
    }
  });
});
