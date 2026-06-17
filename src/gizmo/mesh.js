/**
 * gizmoMesh.js – minimal 2D flat meshes for Gizmo rendering.
 * All geometries are flat (no 3D depth), no emissive, MeshBasicMaterial only.
 */

import * as THREE from "three";

export const GIZMO_BASE_RADIUS = 6; // px at size = 1  (was 15 – too large)

const IDENTITY_HERBIVORE = "herbivore";

export function buildBodyMesh(identity, size) {
  const r = GIZMO_BASE_RADIUS * size;
  const geo = new THREE.CircleGeometry(r, 16); // 16 segments is enough for small circles
  const mat = new THREE.MeshBasicMaterial({
    color: identity === IDENTITY_HERBIVORE ? 0x00cc33 : 0xdd2200,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = 0.1;
  return mesh;
}

/**
 * Direction indicator: a small flat triangle pointing forward (+Y in local space).
 * No LatheGeometry – just 3 flat vertices.
 */
export function buildSpikeMesh(identity, size) {
  const r = GIZMO_BASE_RADIUS * size;
  const tip = r * 1.6; // tip extends 1.6× body radius forward
  const base = r * 0.5; // half-width of base

  // Triangle: tip at (0, tip), base at (±base, 0) – all in XY plane (z=0)
  const positions = new Float32Array([0, tip, 0, -base, 0, 0, base, 0, 0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshBasicMaterial({
    color: identity === IDENTITY_HERBIVORE ? 0xffff00 : 0xff4400,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = 0.2;
  return mesh;
}

export function buildVisionMesh(visionRange) {
  const geo = new THREE.CircleGeometry(visionRange, 32);
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
  mesh.position.z = 0;
  mesh.visible = false;
  return mesh;
}

export function buildSeenTargetMarker() {
  const geo = new THREE.CircleGeometry(4, 8);
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
