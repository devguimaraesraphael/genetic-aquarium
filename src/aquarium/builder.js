/**
 * aquariumBuilder.js – helpers for building the aquarium scene geometry and plankton.
 * Extracted from main.js to keep file sizes small.
 */

import * as THREE from "three";

const BORDER = 8;
const CORNER_RADIUS = 36; // rounded tank corners for a softer, cozy silhouette

/** Traces a rounded-rectangle path (centered) into the given Shape/Path. */
function roundedRectPath(target, halfW, halfH, r) {
  target.moveTo(-halfW + r, -halfH);
  target.lineTo(halfW - r, -halfH);
  target.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
  target.lineTo(halfW, halfH - r);
  target.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
  target.lineTo(-halfW + r, halfH);
  target.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
  target.lineTo(-halfW, -halfH + r);
  target.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);
  target.closePath();
}

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

  const r = Math.min(CORNER_RADIUS, hw * 0.3, hh * 0.3);

  const outer = new THREE.Shape();
  roundedRectPath(outer, hw + BORDER, hh + BORDER, r + BORDER);
  const hole = new THREE.Path();
  roundedRectPath(hole, hw, hh, r);
  outer.holes.push(hole);

  const frame = new THREE.Mesh(
    new THREE.ShapeGeometry(outer),
    new THREE.MeshBasicMaterial({ color: aquariumBorder }),
  );
  frame.position.z = 0.03; // above the water plane, avoids z-fighting in rounded corners
  scene.add(frame);
  aqObjects.push(frame);

  const linePath = new THREE.Path();
  roundedRectPath(linePath, hw, hh, r);
  const innerPts = linePath
    .getPoints(8)
    .map((p) => new THREE.Vector3(p.x, p.y, 0.06));
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
  const baseX = new Float32Array(PLANKTON_COUNT);
  const phase = new Float32Array(PLANKTON_COUNT);

  for (let i = 0; i < PLANKTON_COUNT; i++) {
    baseX[i] = (Math.random() * 2 - 1) * (window.innerWidth / 2);
    pos[i * 3] = baseX[i];
    pos[i * 3 + 1] = (Math.random() * 2 - 1) * (window.innerHeight / 2);
    pos[i * 3 + 2] = 0.02;
    vel[i] = 5 + Math.random() * 10;
    phase[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(pos, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", attr);

  // Warm cream bubbles rather than cold teal plankton streaks – cozier.
  const mesh = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xfff2d0,
      size: 2.2,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(mesh);

  return { pos, vel, baseX, phase, time: 0, attr, mesh };
}

export function updatePlankton(plankton, config, dt) {
  const { pos, vel, baseX, phase, attr } = plankton;
  plankton.time = (plankton.time ?? 0) + dt;
  const hh = config.aquariumHeight / 2;
  const hw = config.aquariumWidth / 2;
  for (let i = 0; i < PLANKTON_COUNT; i++) {
    pos[i * 3 + 1] += vel[i] * dt;
    // Gentle horizontal sway – bubbles wobble instead of rising in a straight line.
    pos[i * 3] = baseX[i] + Math.sin(plankton.time * 0.6 + phase[i]) * 6;
    if (pos[i * 3 + 1] > hh) {
      pos[i * 3 + 1] = -hh;
      baseX[i] = (Math.random() * 2 - 1) * hw;
    }
  }
  attr.needsUpdate = true;
}
