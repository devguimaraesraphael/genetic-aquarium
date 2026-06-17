/**
 * gizmoMesh.js – pure factory functions for building Three.js meshes used by Gizmo.
 * Extracted from Gizmo.js to keep file sizes small.
 */

import * as THREE from "three";

export const GIZMO_BASE_RADIUS = 15; // px at size = 1

const IDENTITY_HERBIVORE = "herbivore";

export function buildBodyMesh(identity, size) {
  const geo = new THREE.CircleGeometry(GIZMO_BASE_RADIUS * size, 32);
  const mat = new THREE.MeshBasicMaterial({
    color: identity === IDENTITY_HERBIVORE ? 0x00ff00 : 0xff0000,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = 0.1;
  return mesh;
}

export function buildSpikeGeometry(identity, size) {
  const points = [];
  const r = GIZMO_BASE_RADIUS * size;

  if (identity === IDENTITY_HERBIVORE) {
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 0.5 - Math.PI * 0.25;
      points.push(
        new THREE.Vector2(Math.cos(angle) * r * 0.4, Math.sin(angle) * r * 0.6),
      );
    }
  } else {
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(-r * 0.2, r * 0.6));
    points.push(new THREE.Vector2(r * 0.2, r * 0.6));
  }

  return new THREE.LatheGeometry(points, 8);
}

export function buildSpikeMesh(identity, size) {
  const geo = buildSpikeGeometry(identity, size);
  const mat = new THREE.MeshBasicMaterial({
    color: identity === IDENTITY_HERBIVORE ? 0xffff00 : 0xff0000,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = 0.2;
  return mesh;
}

export function buildVisionMesh(visionRange) {
  const geo = new THREE.CircleGeometry(visionRange, 64);
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
  const mesh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
  mesh.position.z = 0;
  mesh.visible = false;
  return mesh;
}

export function buildSeenTargetMarker() {
  const geo = new THREE.CircleGeometry(10, 32);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0,
  });
  const marker = new THREE.Mesh(geo, mat);
  marker.position.z = 0.15;
  marker.visible = false;
  return marker;
}
