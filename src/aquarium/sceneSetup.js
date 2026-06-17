/**
 * sceneSetup.js – creates the Three.js renderer, scene, and camera.
 * No bloom, no lights – all materials are MeshBasicMaterial (unlit).
 */

import * as THREE from "three";

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04101e);
  return scene;
}

export function createCamera() {
  return new THREE.OrthographicCamera(
    -window.innerWidth / 2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    -window.innerHeight / 2,
    -200,
    200,
  );
}

/**
 * Returns a thin wrapper so callers can use composer.render() unchanged.
 * No post-processing – just renders the scene directly.
 */
export function createComposer(renderer, scene, camera) {
  return {
    render: () => renderer.render(scene, camera),
    setSize: (w, h) => renderer.setSize(w, h),
  };
}

export function bindResizeHandler(renderer, camera, composer) {
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.left = -window.innerWidth / 2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = -window.innerHeight / 2;
    camera.updateProjectionMatrix();
  });
}
