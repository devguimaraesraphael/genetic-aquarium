/**
 * gizmoMesh.js – minimal 2D flat meshes for Gizmo rendering.
 *
 * Each Gizmo is composed of:
 *   1. Body    – filled circle (16 segments) with a soft dark outline
 *   2. Eyes    – two small dots facing the direction of travel (character/cuteness)
 *   3. Spike   – identity-specific direction indicator:
 *                herbivore = rounded fin (soft), carnivore = fang + barbs (sharp)
 *               Rendered in the bodyGroup so it rotates with the group.
 *
 * No emissive, no lights, no 3D geometry.
 */

import * as THREE from "three";
import { buildFinGeometry, buildFangGroup } from "./meshShapes.js";

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

/** Soft dark outline around the body – gives the flat circle a cozy, cartoon "pop". */
export function buildBodyOutline(size) {
  const r = GIZMO_BASE_RADIUS * size;
  const geo = new THREE.CircleGeometry(r, 16);
  const edges = new THREE.EdgesGeometry(geo);
  const mat = new THREE.LineBasicMaterial({ color: 0x102028, transparent: true, opacity: 0.55 });
  const outline = new THREE.LineLoop(edges, mat);
  outline.position.z = 0.12;
  return outline;
}

// ── Eyes ────────────────────────────────────────────────────────────────────

/**
 * Two small forward-facing eyes for personality. Herbivores get big round
 * "cute" eyes; carnivores get narrow slit pupils for a sharper, predatory look.
 */
export function buildEyesMesh(identity, size) {
  const r = GIZMO_BASE_RADIUS * size;
  const isHerb = identity === IDENTITY_HERBIVORE;
  const eyeY = r * 0.35; // slightly toward the spike/front
  const eyeSpacing = r * 0.42;
  const whiteRadius = isHerb ? r * 0.34 : r * 0.26;
  const pupilRadius = isHerb ? r * 0.16 : r * 0.09;

  const group = new THREE.Group();
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const whiteGeo = new THREE.CircleGeometry(whiteRadius, 12);
  const pupilGeo = isHerb
    ? new THREE.CircleGeometry(pupilRadius, 10)
    : new THREE.PlaneGeometry(pupilRadius * 2.4, pupilRadius);

  for (const side of [-1, 1]) {
    const white = new THREE.Mesh(whiteGeo, whiteMat);
    white.position.set(side * eyeSpacing, eyeY, 0.22);
    group.add(white);

    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(side * eyeSpacing, eyeY, 0.24);
    group.add(pupil);
  }
  return group;
}

// ── Spike (direction indicator, identity-specific) ──────────────────────────

/**
 * Herbivore: a single rounded fin – soft, harmless silhouette.
 * Carnivore: a thin fang flanked by two small barbs – sharp, predatory silhouette.
 */
export function buildSpikeMesh(identity, size) {
  const r = GIZMO_BASE_RADIUS * size;

  if (identity === IDENTITY_HERBIVORE) {
    const color = 0xffff00;
    const mesh = new THREE.Mesh(
      buildFinGeometry(r),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  const color = 0xff0000;
  return buildFangGroup(r, color);
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
