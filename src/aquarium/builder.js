/**
 * aquariumBuilder.js – helpers for building the aquarium scene geometry and plankton.
 * Extracted from main.js to keep file sizes small.
 */

import * as THREE from "three";

const BORDER = 8;

// ── Color helpers ─────────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function disposeObject(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (obj.material.map) obj.material.map.dispose();
    obj.material.dispose();
  }
}

// ── Glow sprite factory ───────────────────────────────────────────────────────

export function makeGlowSprite(r, g, b, scaleX, scaleY) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cr = size / 2;
  const grad = ctx.createRadialGradient(cr, cr, 0, cr, cr, cr);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.50)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.18)`);
  grad.addColorStop(0.7, `rgba(${r},${g},${b},0.05)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const mat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleX, scaleY, 1);
  return sprite;
}

// ── Aquarium mesh builder ─────────────────────────────────────────────────────

/**
 * Rebuild aquarium water/border/lights meshes.
 * @param {THREE.Scene} scene
 * @param {object} config
 * @param {THREE.Object3D[]} aqObjects – mutable array; old objects are removed, new ones pushed
 */
export function buildAquarium(scene, config, aqObjects) {
  aqObjects.forEach((o) => {
    scene.remove(o);
    disposeObject(o);
  });
  aqObjects.length = 0;

  const {
    aquariumWidth: AW,
    aquariumHeight: AH,
    aquariumBg,
    aquariumBorder,
    aquariumLine,
  } = config;
  const hw = AW / 2;
  const hh = AH / 2;

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(AW, AH),
    new THREE.MeshBasicMaterial({ color: aquariumBg }),
  );
  scene.add(water);
  aqObjects.push(water);

  const outer = new THREE.Shape();
  outer.moveTo(-(hw + BORDER), -(hh + BORDER));
  outer.lineTo(hw + BORDER, -(hh + BORDER));
  outer.lineTo(hw + BORDER, hh + BORDER);
  outer.lineTo(-(hw + BORDER), hh + BORDER);
  outer.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-hw, -hh);
  hole.lineTo(hw, -hh);
  hole.lineTo(hw, hh);
  hole.lineTo(-hw, hh);
  hole.closePath();
  outer.holes.push(hole);

  const frame = new THREE.Mesh(
    new THREE.ShapeGeometry(outer),
    new THREE.MeshBasicMaterial({ color: aquariumBorder }),
  );
  scene.add(frame);
  aqObjects.push(frame);

  const innerPts = [
    new THREE.Vector3(-hw, -hh, 0.06),
    new THREE.Vector3(hw, -hh, 0.06),
    new THREE.Vector3(hw, hh, 0.06),
    new THREE.Vector3(-hw, hh, 0.06),
  ];
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(innerPts),
    new THREE.LineBasicMaterial({ color: aquariumLine }),
  );
  scene.add(line);
  aqObjects.push(line);
}

// ── Plankton / floating bubbles ───────────────────────────────────────────────

const PLANKTON_COUNT = 120;

export function setupPlankton(scene) {
  const pos = new Float32Array(PLANKTON_COUNT * 3);
  const vel = new Float32Array(PLANKTON_COUNT);

  for (let i = 0; i < PLANKTON_COUNT; i++) {
    pos[i * 3] = (Math.random() * 2 - 1) * (window.innerWidth / 2);
    pos[i * 3 + 1] = (Math.random() * 2 - 1) * (window.innerHeight / 2);
    pos[i * 3 + 2] = 0.02;
    vel[i] = 5 + Math.random() * 10;
  }

  const geo = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(pos, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", attr);

  const mesh = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0x44ffcc,
      size: 1.5,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(mesh);

  return { pos, vel, attr, mesh };
}

export function updatePlankton(plankton, config, dt) {
  const { pos, vel, attr } = plankton;
  const hh = config.aquariumHeight / 2;
  for (let i = 0; i < PLANKTON_COUNT; i++) {
    pos[i * 3 + 1] += vel[i] * dt;
    if (pos[i * 3 + 1] > hh) {
      pos[i * 3 + 1] = -hh;
      pos[i * 3] = (Math.random() * 2 - 1) * (config.aquariumWidth / 2);
    }
  }
  attr.needsUpdate = true;
}
