import * as THREE from "three";
import GUI from "lil-gui";
import { Gizmo } from "./Gizmo.js";
import { CONFIG } from "./constants.js";

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ── Scene ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06192e);

// ── Camera – orthographic = pure 2D ──────────────────────────────────────────
const camera = new THREE.OrthographicCamera(
  -window.innerWidth / 2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  -window.innerHeight / 2,
  -1,
  1,
);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.left = -window.innerWidth / 2;
  camera.right = window.innerWidth / 2;
  camera.top = window.innerHeight / 2;
  camera.bottom = -window.innerHeight / 2;
  camera.updateProjectionMatrix();
});

// ── Aquarium ──────────────────────────────────────────────────────────────────
const AW = CONFIG.aquariumWidth;
const AH = CONFIG.aquariumHeight;
const hw = AW / 2;
const hh = AH / 2;
const BORDER = 8; // px thickness of the frame

// Water background fill
scene.add(
  new THREE.Mesh(
    new THREE.PlaneGeometry(AW, AH),
    new THREE.MeshBasicMaterial({ color: 0x091d35 }),
  ),
);

// ── Solid border frame (outer rect with inner hole) ───────────────────────────
{
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

  scene.add(
    new THREE.Mesh(
      new THREE.ShapeGeometry(outer),
      new THREE.MeshBasicMaterial({ color: 0x1a5e6e }),
    ),
  );

  // Thin inner highlight line on top of frame
  const innerPts = [
    new THREE.Vector3(-hw, -hh, 0.06),
    new THREE.Vector3(hw, -hh, 0.06),
    new THREE.Vector3(hw, hh, 0.06),
    new THREE.Vector3(-hw, hh, 0.06),
  ];
  scene.add(
    new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(innerPts),
      new THREE.LineBasicMaterial({ color: 0x4af1f2 }),
    ),
  );
}

// ── Helper: radial glow sprite ────────────────────────────────────────────────
function makeGlowSprite(r, g, b, scaleX, scaleY) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cr = size / 2;
  const grad = ctx.createRadialGradient(cr, cr, 0, cr, cr, cr);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.90)`);
  grad.addColorStop(0.3, `rgba(${r},${g},${b},0.45)`);
  grad.addColorStop(0.7, `rgba(${r},${g},${b},0.12)`);
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

// ── 3 ambient lights along the border ────────────────────────────────────────
// Top-left  → cool cyan
const lightTL = makeGlowSprite(0, 220, 200, 520, 400);
lightTL.position.set(-hw + 10, hh - 10, 0.03);
scene.add(lightTL);

// Top-right → soft blue-white (like a UV/fluorescent tube)
const lightTR = makeGlowSprite(80, 160, 255, 480, 380);
lightTR.position.set(hw - 10, hh - 10, 0.03);
scene.add(lightTR);

// Bottom-center → warm teal-green (algae / nature light)
const lightBC = makeGlowSprite(20, 180, 130, 600, 350);
lightBC.position.set(0, -hh + 10, 0.03);
scene.add(lightBC);

// ── Live config (GUI writes directly into this object) ───────────────────────
const config = { ...CONFIG };

// ── Gizmos ────────────────────────────────────────────────────────────────────
const gizmos = Array.from({ length: 5 }, () => new Gizmo(scene, config));

// ── GUI ───────────────────────────────────────────────────────────────────────
const gui = new GUI({ title: "Aquarium Controls" });

const physicsFolder = gui.addFolder("Physics");
physicsFolder.add(config, "k", 0, 1, 0.0001).name("K  — accel factor");
physicsFolder.add(config, "l", 0, 2, 0.001).name("L  — velocity scale");
physicsFolder.add(config, "maxVelocity", 0, 50, 0.1).name("Max Velocity");
physicsFolder.open();

const genesFolder = gui.addFolder("Genes (vision range)");
genesFolder.add(config, "v1", 0, 20, 0.1).name("v1 — inner");
genesFolder.add(config, "v2", 0, 20, 0.1).name("v2 — outer");
genesFolder.open();

// ── Animation loop ────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

(function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta(); // seconds since last frame
  gizmos.forEach((g) => g.update(dt, config));
  renderer.render(scene, camera);
})();
