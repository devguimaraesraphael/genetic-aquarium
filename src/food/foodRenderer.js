/**
 * foodRenderer.js – cozy rounded "flake pellet" rendering for food items.
 * Each food item is a small rounded disc in a single InstancedMesh, colored
 * per-instance from a warm palette so the tank floor feels lively, not sterile.
 */

import * as THREE from "three";

export const FOOD_MAX = 2000;

// Warm pellet palette – amber / coral / cream / salmon, cozy fish-flake tones.
export const FOOD_PALETTE = [0xffb347, 0xff8c69, 0xffe1a8, 0xffa07a];

// Single flat rounded disc shared for all food items
const _pelletGeo = new THREE.CircleGeometry(0.5, 10);

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

/**
 * Create a single InstancedMesh for all food pellets and add it to the scene.
 * Returns a single-element array for API compatibility with Food.js.
 * @param {THREE.Scene} scene
 * @returns {THREE.InstancedMesh[]} array with one mesh
 */
export function createFoodMeshes(scene) {
  const mesh = new THREE.InstancedMesh(
    _pelletGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    FOOD_MAX,
  );
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(FOOD_MAX * 3),
    3,
  );
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  return [mesh]; // wrap in array – Food.js expects an array
}

/**
 * Update InstancedMesh transforms + per-instance colors from the current food array.
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
    mesh.setMatrixAt(count, _dummy.matrix);
    _color.setHex(FOOD_PALETTE[f.colorIdx % FOOD_PALETTE.length]);
    mesh.setColorAt(count, _color);
    count++;
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
}

// Kept for API compatibility (Food.js references geometry count indirectly via shapeType).
export const FOOD_GEOS = [_pelletGeo];
