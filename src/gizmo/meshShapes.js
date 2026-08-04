/**
 * meshShapes.js – identity-specific spike/fin geometry builders.
 * Extracted from mesh.js to keep file sizes small.
 *
 * Herbivore: a single rounded, paddle-like fin – soft and harmless.
 * Carnivore: a long thin fang flanked by two small back-swept barbs – sharp and predatory.
 */

import * as THREE from "three";

/**
 * Rounded paddle-fin shape (herbivore). Wide base, soft bezier-rounded tip.
 */
export function buildFinGeometry(r) {
  const stemStart = r;
  const tipY = r * 2.2;
  const halfWidth = r * 0.62;

  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth, stemStart);
  shape.lineTo(-halfWidth * 0.85, tipY * 0.68);
  shape.quadraticCurveTo(-halfWidth * 0.7, tipY, 0, tipY);
  shape.quadraticCurveTo(halfWidth * 0.7, tipY, halfWidth * 0.85, tipY * 0.68);
  shape.lineTo(halfWidth, stemStart);
  shape.closePath();

  return new THREE.ShapeGeometry(shape);
}

/**
 * Long thin dagger triangle (carnivore's main fang).
 */
function fangTriangle(r) {
  const stemStart = r;
  const tip = r * 3.1;
  const halfBase = r * 0.32;

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array([
    0, tip, 0.2,
    -halfBase, stemStart, 0.2,
    halfBase, stemStart, 0.2,
  ]);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return geo;
}

/** A small back-swept barb, mirrored left/right, flanking the main fang. */
function barbTriangle(r, side) {
  const baseY = r * 1.05;
  const tipX = side * r * 1.15;
  const tipY = r * 1.75;
  const halfBase = r * 0.22;

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array([
    side * halfBase * 0.3, baseY, 0.18,
    tipX, tipY, 0.18,
    side * (halfBase + r * 0.25), baseY, 0.18,
  ]);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return geo;
}

/**
 * Builds the carnivore spike: one long central fang + two small side barbs,
 * all sharing the same material/color, returned as a Group.
 */
export function buildFangGroup(r, color) {
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(fangTriangle(r), mat));
  group.add(new THREE.Mesh(barbTriangle(r, -1), mat));
  group.add(new THREE.Mesh(barbTriangle(r, 1), mat));
  return group;
}
