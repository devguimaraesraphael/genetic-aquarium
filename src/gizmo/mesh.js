/**
 * gizmoMesh.js – minimal 2D flat meshes for Gizmo rendering.
 *
 * Each Gizmo is composed of:
 *   1. Body   – filled circle (16 segments), MeshBasicMaterial
 *   2. Arrow  – a velocity-direction indicator:
 *               a stem line from circle edge to tip + a small filled arrowhead
 *               Rendered in the bodyGroup so it rotates with the group.
 *
 * No emissive, no lights, no 3D geometry.
 */

import * as THREE from "three";

export const GIZMO_BASE_RADIUS = 6; // px at size = 1

const IDENTITY_HERBIVORE = "herbivore";

// ── Body ────────────────────────────────────────────────────────────────────

/**
 * @param {string} identity – "herbivore" | "carnivore"
 * @param {number} size – gene size multiplier
 * @param {THREE.Color} [color] – lineage color (uses identity fallback if omitted)
 */
export function buildBodyMesh(identity, size, color) {
  const r = GIZMO_BASE_RADIUS * size;
  const geo = new THREE.CircleGeometry(r, 16);
  // Use the gizmo's unique lineage color when provided
  const fallback = identity === IDENTITY_HERBIVORE ? 0x00cc33 : 0xdd2200;
  const mat = new THREE.MeshBasicMaterial({
    color: color ?? fallback,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = 0.1;
  return mesh;
}

// ── Arrow (direction indicator) ─────────────────────────────────────────────

/**
 * Returns a Group containing:
 *   - A stem line from the body edge to the arrowhead base
 *   - A filled triangle arrowhead
 *
 * The arrow points along +Y in local space; the bodyGroup is rotated
 * so +Y aligns with the velocity direction.
 */
export function buildSpikeMesh(identity, size) {
  const r = GIZMO_BASE_RADIUS * size;
  const stemStart = r; // start at body edge
  const stemEnd = r * 1.8; // end of stem / base of head
  const headTip = r * 2.6; // tip of arrowhead
  const headBase = r * 0.55; // half-width of arrowhead base

  const color = identity === IDENTITY_HERBIVORE ? 0xffff00 : 0xff4400;
  const group = new THREE.Group();

  // Stem: a Line from bodyEdge → headBase
  const stemGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, stemStart, 0.15),
    new THREE.Vector3(0, stemEnd, 0.15),
  ]);
  const stemLine = new THREE.Line(
    stemGeo,
    new THREE.LineBasicMaterial({ color }),
  );
  group.add(stemLine);

  // Arrowhead: filled triangle
  const headPos = new Float32Array([
    0,
    headTip,
    0.2, // tip
    -headBase,
    stemEnd,
    0.2, // left base
    headBase,
    stemEnd,
    0.2, // right base
  ]);
  const headGeo = new THREE.BufferGeometry();
  headGeo.setAttribute("position", new THREE.BufferAttribute(headPos, 3));
  const headMesh = new THREE.Mesh(
    headGeo,
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
  );
  group.add(headMesh);

  return group;
}

// ── Vision circle ────────────────────────────────────────────────────────────

export function buildVisionMesh(visionRange) {
  const geo = new THREE.CircleGeometry(visionRange, 32);
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
  mesh.position.z = 0;
  mesh.visible = false;
  return mesh;
}

// ── Selection marker (red ring over nearest target) ─────────────────────────

export function buildSeenTargetMarker() {
  const geo = new THREE.CircleGeometry(10, 24);
  const edges = new THREE.EdgesGeometry(geo);
  const mat = new THREE.LineBasicMaterial({ color: 0xff2222, linewidth: 2 });
  const marker = new THREE.LineSegments(edges, mat);
  marker.position.z = 0.5;
  marker.visible = false;
  return marker;
}
