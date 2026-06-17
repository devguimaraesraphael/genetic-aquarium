/**
 * foodRenderer.js – simple green square rendering for food items.
 * Each food item is a small PlaneGeometry (square) in a single InstancedMesh.
 */

import * as THREE from "three";

export const FOOD_MAX = 2000;

// Single flat green square shared for all food items
const _squareGeo = new THREE.PlaneGeometry(1, 1);
const FOOD_COLOR = new THREE.Color(0x00cc44); // solid green

const _dummy = new THREE.Object3D();

/**
 * Create a single InstancedMesh for all food squares and add it to the scene.
 * Returns a single-element array for API compatibility with Food.js.
 * @param {THREE.Scene} scene
 * @returns {THREE.InstancedMesh[]} array with one mesh
 */
export function createFoodMeshes(scene) {
  const mesh = new THREE.InstancedMesh(
    _squareGeo,
    new THREE.MeshBasicMaterial({ color: FOOD_COLOR }),
    FOOD_MAX,
  );
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  return [mesh]; // wrap in array – Food.js expects an array
}

/**
 * Update InstancedMesh transforms from the current food array.
 * Food items are rendered as flat squares (no rotation, no color variation).
 * @param {THREE.InstancedMesh[]} meshes – array with one mesh
 * @param {object[]} foods
 * @param {number} _dt – unused (no animation)
 */
export function renderFoodInstances(meshes, foods, _dt) {
  const mesh = meshes[0];
  let count = 0;
  for (const f of foods) {
    _dummy.position.set(f.x, f.y, 0.05);
    _dummy.scale.setScalar(f.size);
    _dummy.rotation.set(0, 0, 0);
    _dummy.updateMatrix();
    mesh.setMatrixAt(count++, _dummy.matrix);
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
}

// Keep FOOD_PALETTE export for backward compat (unused now)
export const FOOD_PALETTE = [FOOD_COLOR];
export const FOOD_GEOS = [_squareGeo];
