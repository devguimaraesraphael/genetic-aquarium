import * as THREE from "three";
import GUI from "lil-gui";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { Gizmo } from "./Gizmo.js";
import { FoodManager } from "./Food.js";
import { HallOfFame } from "./HallOfFame.js";
import { IDENTITY } from "./Identity.js";
import { CONFIG, AQUARIUM_PRESETS } from "./constants.js";
import { openSettingsModal } from "./ui/settingsModal.js";
import * as detailPanel from "./ui/detailPanel.js";
import { gizmoList } from "./ui/gizmoList.js";
import { createCameraSelectionRules } from "./ui/cameraSelectionRules.js";
import { getRespawnPlan } from "./simulation/respawnRules.js";
import { EffectsManager } from "./effects/EffectsManager.js";

const STORAGE_KEY = "genetic-aquarium-config";

// ── Persist helpers ───────────────────────────────────────────────────────────
function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
function loadSavedConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Live config ───────────────────────────────────────────────────────────────
const saved = loadSavedConfig();
// Merge: CONFIG supplies defaults, saved values override them.
// This way new keys added to CONFIG always have a value even when
// localStorage was written before those keys existed.
const config = {
  ...CONFIG,
  lights: CONFIG.lights.map((l) => ({ ...l })),
  ...(saved ? { ...saved, lights: undefined } : {}),
};
if (saved && Array.isArray(saved.lights)) config.lights = saved.lights;
// First visit → fill the window
if (!saved?.aquariumWidth) config.aquariumWidth = window.innerWidth - 20;
if (!saved?.aquariumHeight) config.aquariumHeight = window.innerHeight - 20;

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ── Scene ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04101e);

// ── Lighting (needed for MeshPhongMaterial on gizmos) ────────────────────────
const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(0, 0, 1);
scene.add(dirLight);
// Accent lights — cyan + magenta atmosphere
const cyanLight = new THREE.PointLight(0x00ffe7, 1.5, 800);
cyanLight.position.set(-300, 200, 50);
scene.add(cyanLight);
const magentaLight = new THREE.PointLight(0xff44aa, 1.0, 700);
magentaLight.position.set(300, -200, 50);
scene.add(magentaLight);

// ── Camera – orthographic = pure 2D ──────────────────────────────────────────
const camera = new THREE.OrthographicCamera(
  -window.innerWidth / 2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  -window.innerHeight / 2,
  -200, // deep enough for 3D geometry to not clip
  200,
);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.left = -window.innerWidth / 2;
  camera.right = window.innerWidth / 2;
  camera.top = window.innerHeight / 2;
  camera.bottom = -window.innerHeight / 2;
  camera.updateProjectionMatrix();
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ── Bloom post-processing ─────────────────────────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55, // strength
  0.4, // radius
  0.38, // threshold – only brightest surfaces bloom
);
composer.addPass(bloomPass);

// ── Floating plankton / bubbles ───────────────────────────────────────────────
const PLANKTON_COUNT = 120;
const _planktonPos = new Float32Array(PLANKTON_COUNT * 3);
const _planktonVel = new Float32Array(PLANKTON_COUNT); // Y velocity per particle
for (let i = 0; i < PLANKTON_COUNT; i++) {
  _planktonPos[i * 3] = (Math.random() * 2 - 1) * (window.innerWidth / 2);
  _planktonPos[i * 3 + 1] = (Math.random() * 2 - 1) * (window.innerHeight / 2);
  _planktonPos[i * 3 + 2] = 0.02;
  _planktonVel[i] = 5 + Math.random() * 10; // px/s upward
}
const planktonGeo = new THREE.BufferGeometry();
const planktonAttr = new THREE.BufferAttribute(_planktonPos, 3);
planktonAttr.setUsage(THREE.DynamicDrawUsage);
planktonGeo.setAttribute("position", planktonAttr);
const planktonMesh = new THREE.Points(
  planktonGeo,
  new THREE.PointsMaterial({
    color: 0x44ffcc,
    size: 1.5,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
scene.add(planktonMesh);

function updatePlankton(dt, aqH) {
  const hh = aqH / 2;
  for (let i = 0; i < PLANKTON_COUNT; i++) {
    _planktonPos[i * 3 + 1] += _planktonVel[i] * dt;
    if (_planktonPos[i * 3 + 1] > hh) {
      _planktonPos[i * 3 + 1] = -hh;
      _planktonPos[i * 3] =
        (Math.random() * 2 - 1) * (config.aquariumWidth / 2);
    }
  }
  planktonAttr.needsUpdate = true;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function makeGlowSprite(r, g, b, scaleX, scaleY) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cr = size / 2;
  const grad = ctx.createRadialGradient(cr, cr, 0, cr, cr, cr);
  // Subtler opacity values
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

function disposeObject(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (obj.material.map) obj.material.map.dispose();
    obj.material.dispose();
  }
}

// ── Aquarium builder ──────────────────────────────────────────────────────────
const BORDER = 8;
let aqObjects = [];

function buildAquarium() {
  aqObjects.forEach((o) => {
    scene.remove(o);
    disposeObject(o);
  });
  aqObjects = [];

  const {
    aquariumWidth: AW,
    aquariumHeight: AH,
    aquariumBg,
    aquariumBorder,
    aquariumLine,
    lights,
  } = config;
  const hw = AW / 2;
  const hh = AH / 2;

  // Water fill
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(AW, AH),
    new THREE.MeshBasicMaterial({ color: aquariumBg }),
  );
  scene.add(water);
  aqObjects.push(water);

  // Solid border frame
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

  // Inner highlight line
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

  // Glow lights (0 top-left, 1 top-right, 2 bottom-center)
  const positions = [
    [-hw + 10, hh - 10, 0.03],
    [hw - 10, hh - 10, 0.03],
    [0, -hh + 10, 0.03],
  ];
  lights.forEach((l, i) => {
    const [r, g, b] = hexToRgb(l.color);
    const sprite = makeGlowSprite(r, g, b, l.scaleX, l.scaleY);
    sprite.position.set(...positions[i]);
    scene.add(sprite);
    aqObjects.push(sprite);
  });
}

buildAquarium();

// ── Gizmos ────────────────────────────────────────────────────────────────────
let gizmos = [];
let selectedGizmo = null;
let selectedFood = null;

// ── Camera zoom state ─────────────────────────────────────────────────────────
let zoomCurrent = 1.0;
let zoomTarget = 1.0;
let zoomTargetX = 0;
let zoomTargetY = 0;
const originalCameraWidth = window.innerWidth;
const originalCameraHeight = window.innerHeight;
const zoomSpeed = 5; // ease speed (5 units/sec)
const selectionRules = createCameraSelectionRules();

function _setSelectedGizmo(gizmo) {
  gizmos.forEach((g) => g.deselect());
  selectedFood = null;
  selectedGizmo = gizmo;
  if (gizmo) {
    gizmo.select();
    detailPanel.show(gizmo, _clearSelection);
  } else {
    detailPanel.hide();
  }
}

function _clearSelection() {
  gizmos.forEach((g) => g.deselect());
  selectedGizmo = null;
  selectedFood = null;
  detailPanel.hide();
  selectionRules.clear();
  gizmoList.deselectGizmo(false);
}

function createGizmos() {
  gizmos.forEach((g) => g.dispose());
  const n = config.gizmoCount ?? 20;
  const carnRatio = config.carnivoreRatio ?? 0.1;
  const herbCount = Math.round(n * (1 - carnRatio)) || n;
  let herbIdx = 0;
  gizmos = Array.from({ length: n }, () => {
    const isCarnivore = Math.random() < carnRatio;
    const opts = isCarnivore
      ? { identity: [0, 0, 1] }
      : {
          identity: [0, 1, 0],
          lineageHue: herbIdx++ / Math.max(1, herbCount - 1),
        };
    return new Gizmo(scene, config, opts);
  });
  selectedGizmo = null;
  detailPanel.hide();
}

createGizmos();
updateGizmoList();

// ── Pause on Space ────────────────────────────────────────────────────────────
let paused = false;
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
    paused = !paused;
  }
});

// ── Gizmo List Panel Initialization ───────────────────────────────────────────
gizmoList.init({
  onHover: (gizmo) => {
    selectionRules.onListHover(gizmo);
  },
  onUnhover: (gizmo) => {
    selectionRules.onListUnhover(gizmo);
  },
  onListLeave: () => {
    selectionRules.onListLeave();
  },
  onSelect: (gizmo) => {
    const result = selectionRules.onListSelectToggle(gizmo);
    _setSelectedGizmo(result.fixed);
  },
  onDeselect: () => {
    const result = selectionRules.clear();
    _setSelectedGizmo(result.fixed);
  },
  onControlsClick: () => {
    openAquariumControls();
  },
});

// Update list when gizmos spawn/die
function updateGizmoList() {
  const alivGizmos = gizmos.filter((g) => !g.isDead);
  gizmoList.updateList(alivGizmos);
}

// ── Hall of Fame ───────────────────────────────────────────────────────────────
const hallOfFame = new HallOfFame();
const hofStats = { herb: 0, carn: 0, generation: 1 };

// ── Food ─────────────────────────────────────────────────────────────────────
const foodManager = new FoodManager(scene, config);
const foodStats = { count: 0 };

// ── Effects ───────────────────────────────────────────────────────────────────
const effects = new EffectsManager(scene);

// ── spawnGeneration: create N gizmos from HoF crossover ───────────────────────
// Declared here (not inside animate) so the GUI button can also call it.
// 99% of individuals: crossover of 2 random HoF parents + mutation
//  1% totally random: diversity injection
const RANDOM_RATE = 0.2; // 20% of each new generation is fully random
function spawnGeneration(hofSlot, count, isCarnivore) {
  const id = isCarnivore ? [0, 0, 1] : [0, 1, 0];
  const mutRate = config.nnMutationRate ?? 1.0;
  const mutDelta = config.nnMutationDelta ?? 0.01;

  for (let i = 0; i < count; i++) {
    if (Math.random() < RANDOM_RATE) {
      // Fully random — no parents
      gizmos.push(new Gizmo(scene, config, { identity: id }));
      continue;
    }

    const [pA, pB] = hallOfFame.pickParents(hofSlot);
    const hueA = pA?.genes?.lineageHue ?? Math.random();
    const hueB = pB?.genes?.lineageHue ?? Math.random();
    const hue = Math.max(
      0,
      Math.min(
        1,
        (Math.random() < 0.5 ? hueA : hueB) + (Math.random() * 2 - 1) * 0.04,
      ),
    );

    // Compute crossed-over genes BEFORE constructing so the mesh is built correctly
    const crossedSize =
      pA && pB
        ? Math.max(
            0.2,
            (Math.random() < 0.5 ? pA.genes.size : pB.genes.size) +
              (Math.random() * 2 - 1) * 0.1,
          )
        : undefined;
    const crossedVision =
      pA && pB
        ? (Math.random() < 0.5 ? pA.genes.vision : pB.genes.vision) +
          (Math.random() * 2 - 1) * 6
        : undefined;

    const g = new Gizmo(scene, config, {
      identity: id,
      lineageHue: hue,
      sizeOverride: crossedSize,
      // visionOverride computed after we know bodyRadius
    });

    if (crossedVision !== undefined) {
      g.genes.vision = Math.max(g.bodyRadius * 1.6, crossedVision);
    }

    if (pA && pB) {
      // Uniform crossover of NN weights
      g.nn.w1 = pA.nnW1.map((row, j) =>
        row.map((w, k) => (Math.random() < 0.5 ? w : pB.nnW1[j][k])),
      );
      g.nn.w2 = pA.nnW2.map((row, j) =>
        row.map((w, k) => (Math.random() < 0.5 ? w : pB.nnW2[j][k])),
      );
      g.nn.mutate(mutRate, mutDelta);
    }

    gizmos.push(g);
  }
}

// ── Click → select gizmo or food ─────────────────────────────────────────────
renderer.domElement.addEventListener("click", (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const wx =
    (((e.clientX - rect.left) / rect.width) * 2 - 1) * (window.innerWidth / 2);
  const wy =
    -(((e.clientY - rect.top) / rect.height) * 2 - 1) *
    (window.innerHeight / 2);

  // 1. Check gizmos first (they are larger)
  let closestGizmo = null;
  let closestGizmoDist = Infinity;
  gizmos.forEach((g) => {
    const dx = g.position.x - wx;
    const dy = g.position.y - wy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= g.bodyRadius && dist < closestGizmoDist) {
      closestGizmo = g;
      closestGizmoDist = dist;
    }
  });

  if (closestGizmo) {
    const result = selectionRules.onAquariumSelect(closestGizmo);
    _setSelectedGizmo(result.fixed);
    gizmoList.selectGizmo(closestGizmo, false);
    return;
  }

  // 2. Check food
  const hitFood = foodManager.hitTest(wx, wy);
  if (hitFood) {
    _clearSelection();
    selectedFood = hitFood;
    detailPanel.showFood(hitFood, _clearSelection);
    return;
  }

  // 3. Clicked empty space
  _clearSelection();
});

// ── GUI ───────────────────────────────────────────────────────────────────────
const gui = new GUI({ title: "Aquarium Controls" });

// Keep lil-gui hidden from the default right side; we show it in a centered modal.
gui.domElement.style.display = "none";

let controlsOverlay = null;
let pausedBeforeControls = false;

function closeAquariumControls() {
  if (!controlsOverlay) return;
  gui.domElement.style.display = "none";
  document.body.appendChild(gui.domElement);
  controlsOverlay.remove();
  controlsOverlay = null;
  paused = pausedBeforeControls;
}

function openAquariumControls() {
  if (controlsOverlay) return;
  pausedBeforeControls = paused;
  paused = true;

  controlsOverlay = document.createElement("div");
  controlsOverlay.id = "aq-controls-overlay";
  controlsOverlay.style.position = "fixed";
  controlsOverlay.style.inset = "0";
  controlsOverlay.style.background = "rgba(0, 8, 18, 0.8)";
  controlsOverlay.style.display = "flex";
  controlsOverlay.style.alignItems = "center";
  controlsOverlay.style.justifyContent = "center";
  controlsOverlay.style.zIndex = "10001";
  controlsOverlay.style.backdropFilter = "blur(5px)";

  const modal = document.createElement("div");
  modal.style.position = "relative";
  modal.style.maxHeight = "88vh";
  modal.style.overflowY = "auto";
  modal.style.padding = "12px";
  modal.style.borderRadius = "12px";
  modal.style.border = "1.5px solid #1a5e6e";
  modal.style.background = "rgba(13, 34, 51, 0.96)";
  modal.style.boxShadow = "0 12px 50px rgba(0, 160, 190, 0.22)";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Fechar";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "10px";
  closeBtn.style.padding = "6px 12px";
  closeBtn.style.borderRadius = "7px";
  closeBtn.style.border = "1.5px solid #1a5e6e";
  closeBtn.style.background = "#112535";
  closeBtn.style.color = "#4af1f2";
  closeBtn.style.cursor = "pointer";
  closeBtn.addEventListener("click", closeAquariumControls);

  gui.domElement.style.display = "block";
  gui.domElement.style.position = "static";
  gui.domElement.style.marginTop = "34px";
  gui.domElement.style.maxHeight = "80vh";
  gui.domElement.style.overflowY = "auto";

  modal.appendChild(closeBtn);
  modal.appendChild(gui.domElement);
  controlsOverlay.appendChild(modal);
  document.body.appendChild(controlsOverlay);

  controlsOverlay.addEventListener("click", (e) => {
    if (e.target === controlsOverlay) closeAquariumControls();
  });
}

// Population
const popFolder = gui.addFolder("Population");
popFolder.add(config, "gizmoCount", 20, 200, 1).name("Gizmo count (→ restart)");
popFolder
  .add(config, "carnivoreRatio", 0, 1, 0.01)
  .name("Carnivore % (→ restart)");
popFolder.open();

// Lifespan (live display + controls)
const lifespanFolder = gui.addFolder("Lifespan");
lifespanFolder.add(config, "gizmoMaxAge", 60, 1200, 30).name("Max age (s)");
lifespanFolder
  .add(config, "gizmoStarvation", 10, 600, 10)
  .name("Starvation (s)");
lifespanFolder.add(config, "gizmoMaxWallTime", 5, 120, 5).name("Wall trap (s)");
lifespanFolder
  .add(hofStats, "generation")
  .name("Generation")
  .listen()
  .disable(false);
lifespanFolder
  .add(hofStats, "herb")
  .name("Best Herb score (top-1)")
  .listen()
  .disable(false);
lifespanFolder
  .add(hofStats, "carn")
  .name("Best Carn score (top-1)")
  .listen()
  .disable(false);
lifespanFolder.open();

const physicsFolder = gui.addFolder("Physics");
physicsFolder.add(config, "k", 0, 1, 0.001).name("K  — accel contribution");
physicsFolder.add(config, "l", 0, 1, 0.001).name("L  — friction (per second)");
physicsFolder
  .add(config, "maxVelocity", 0, 1000, 5)
  .name("Max Velocity (px/s)");
physicsFolder.open();

const geneFolder = gui.addFolder("Gene Ranges");
geneFolder.add(config, "visionMin", 10, 200, 1).name("Vision Min (px)");
geneFolder.add(config, "visionMax", 10, 300, 1).name("Vision Max (px)");
geneFolder.add(config, "sizeMin", 0.2, 3, 0.05).name("Size Min");
geneFolder.add(config, "sizeMax", 0.2, 3, 0.05).name("Size Max");
geneFolder.open();

const nnFolder = gui.addFolder("Neural Network");
nnFolder
  .add(config, "nnHiddenSize", 2, 32, 1)
  .name("Hidden neurons (→ restart)");
nnFolder.add(config, "nnAccelScale", 10, 2000, 10).name("Accel scale (px/s²)");
nnFolder
  .add(config, "nnMutationDelta", 0.001, 0.5, 0.001)
  .name("Mutation δ (1%=0.01)");
nnFolder.add(config, "scoreToReproduce", 1, 50, 1).name("Score to clone");
nnFolder
  .add(config, "reproductionCooldown", 0, 120, 5)
  .name("Reprod. cooldown (s)");
nnFolder.close();

// Food
const foodFolder = gui.addFolder("Food");
foodFolder.add(foodStats, "count").name("Total (live)").listen().disable(false);
foodFolder
  .add(config, "foodInitial", 1, 200, 1)
  .name("Initial count (→ reset)");
foodFolder.add(config, "foodMaxCount", 100, 2000, 100).name("Max count");
foodFolder.add(config, "foodGrowthRate", 0.1, 30, 0.1).name("Growth rate");
foodFolder.add(config, "foodSpawnSize", 2, 40, 1).name("Max size (px)");
foodFolder.add(config, "foodSpawnRadius", 5, 300, 5).name("Spawn radius");
foodFolder
  .add(config, "foodSpawnCooldown", 1, 60, 1)
  .name("Spawn cooldown (s)");
const foodActions = { "Reset Food": () => foodManager.reset() };
foodFolder.add(foodActions, "Reset Food");
foodFolder.close();

const settingsFolder = gui.addFolder("⚙  Aquarium Settings");
const settingsActions = {
  "Open Settings...": () =>
    openSettingsModal(config, AQUARIUM_PRESETS, () => {
      buildAquarium();
      saveConfig();
    }),
  "Reset Config": () => {
    if (confirm("Resetar todas as configurações para os valores padrão?")) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  },
};
settingsFolder.add(settingsActions, "Open Settings...");
settingsFolder.add(settingsActions, "Reset Config");
settingsFolder.open();

const restartActions = {
  "↺ Restart Gizmos": () => {
    if (confirm("Recriar todas as criaturas? O estado atual será perdido.")) {
      createGizmos();
    }
  },
  "⭐ Restaurar Melhores Genes": () => {
    if (!hallOfFame.herbivores.length && !hallOfFame.carnivores.length) {
      alert("Nenhum gene campeão registrado ainda.");
      return;
    }
    if (!confirm("Recriar população a partir dos melhores genes registrados?"))
      return;

    gizmos.forEach((g) => g.dispose());
    gizmos = [];
    _clearSelection();

    const total = config.gizmoCount ?? 20;
    const carnRatio = config.carnivoreRatio ?? 0.1;
    const nCarns = Math.max(0, Math.round(total * carnRatio));
    const nHerbs = total - nCarns;

    spawnGeneration(
      hallOfFame.herbivores.length > 0 ? "herbivores" : "carnivores",
      nHerbs,
      false,
    );
    spawnGeneration(
      hallOfFame.carnivores.length > 0 ? "carnivores" : "herbivores",
      nCarns,
      true,
    );
    hofStats.generation += 1;
  },
};
gui.add(restartActions, "↺ Restart Gizmos");
gui.add(restartActions, "⭐ Restaurar Melhores Genes");

// Persist on any GUI change
gui.onChange(() => saveConfig());

// ── Animation loop ────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

(function animate() {
  requestAnimationFrame(animate);
  // Always drain the clock so pausing doesn't accumulate a large dt spike
  const rawDt = clock.getDelta();
  if (paused) return;
  // Cap dt to 100ms to prevent physics explosions after tab becomes visible
  const dt = Math.min(rawDt, 0.1);

  // ── Camera zoom animation ─────────────────────────────────────────────────
  const followGizmo = selectionRules.getFollowGizmo();
  if (followGizmo && !followGizmo.isDead) {
    selectionRules.syncFollowTarget();
  }

  const state = selectionRules.getState();
  zoomTarget = state.zoom;
  zoomTargetX = state.targetX;
  zoomTargetY = state.targetY;

  if (Math.abs(zoomCurrent - zoomTarget) > 0.01) {
    zoomCurrent += (zoomTarget - zoomCurrent) * zoomSpeed * dt;
  } else {
    zoomCurrent = zoomTarget;
  }

  // Smoothly pan camera back to origin when zoom is 1.0
  if (zoomTarget === 1.0) {
    const panSpeed = 3.0; // pan back to origin speed
    zoomTargetX += (0 - zoomTargetX) * panSpeed * dt;
    zoomTargetY += (0 - zoomTargetY) * panSpeed * dt;
  }

  // Update camera: adjust left/right/top/bottom based on zoom
  const halfWidth = originalCameraWidth / 2 / zoomCurrent;
  const halfHeight = originalCameraHeight / 2 / zoomCurrent;
  camera.left = -halfWidth + zoomTargetX;
  camera.right = halfWidth + zoomTargetX;
  camera.top = halfHeight + zoomTargetY;
  camera.bottom = -halfHeight + zoomTargetY;
  camera.updateProjectionMatrix();
  gizmos.forEach((g) => {
    if (!g.isDead) g.update(dt, config, gizmos, foodManager);
  });

  // ── Remove dead gizmos immediately (before render) ────────────────────
  // Collect, register, dispose, and purge in one pass so dead gizmos
  // are NEVER visible or iterable after this point in the same frame.
  const dead = gizmos.filter((g) => g.isDead);
  if (dead.length > 0) {
    dead.forEach((g) => {
      effects.death(g.position.x, g.position.y);
      const isNew = hallOfFame.register(g);
      if (isNew) {
        const slot = g.identity[1] === 1 ? "herbivores" : "carnivores";
        hofStats[slot === "herbivores" ? "herb" : "carn"] =
          hallOfFame[slot][0]?.score ?? 0;
      }
      if (g === selectedGizmo) _clearSelection();
      g.dispose();
      gizmoList.removeGizmo(g.id);
    });
    gizmos = gizmos.filter((g) => !g.isDead);
    updateGizmoList();
  }

  // ── Respawn by type-list accounting ───────────────────────────────────────
  const total = config.gizmoCount ?? 20;
  const carnRatio = config.carnivoreRatio ?? 0.1;
  const respawnPlan = getRespawnPlan(gizmos, total, carnRatio);

  if (respawnPlan.fullExtinction) {
    hofStats.generation += 1;
    hofStats.herb = 0;
    hofStats.carn = 0;
    if (hallOfFame.herbivores.length > 0 || hallOfFame.carnivores.length > 0) {
      if (respawnPlan.spawnHerbivores > 0) {
        spawnGeneration(
          hallOfFame.herbivores.length > 0 ? "herbivores" : "carnivores",
          respawnPlan.spawnHerbivores,
          false,
        );
      }
      if (respawnPlan.spawnCarnivores > 0) {
        spawnGeneration(
          hallOfFame.carnivores.length > 0 ? "carnivores" : "herbivores",
          respawnPlan.spawnCarnivores,
          true,
        );
      }
    } else {
      createGizmos();
      updateGizmoList();
    }
  } else {
    if (respawnPlan.spawnHerbivores > 0) {
      hofStats.generation += 1;
      hofStats.herb = 0;
      foodManager.reset(); // respawn food when all herbivores die
      spawnGeneration("herbivores", respawnPlan.spawnHerbivores, false);
    }
    if (respawnPlan.spawnCarnivores > 0) {
      hofStats.generation += 1;
      hofStats.carn = 0;
      spawnGeneration("carnivores", respawnPlan.spawnCarnivores, true);
    }
  }

  // ── Spawn offspring ─────────────────────────────────────────────────────
  const maxGizmos = config.gizmoCount ?? 20;
  const offspring = [];
  gizmos.forEach((g) => {
    if (g._pendingOffspring && gizmos.length + offspring.length < maxGizmos) {
      offspring.push(g.spawnClone(scene));
    } else if (g._pendingOffspring) {
      g._pendingOffspring = false;
    }
  });
  gizmos.push(...offspring);
  offspring.forEach((g) =>
    effects.birth(g.position.x, g.position.y, g.bodyRadius),
  );

  // ── Champion stars (live leaders by score per class) ──────────────────────
  let bestHerb = null,
    bestCarn = null;
  gizmos.forEach((g) => {
    if (g.identity[1] === 1) {
      if (!bestHerb || g.score > bestHerb.score) bestHerb = g;
    } else {
      if (!bestCarn || g.score > bestCarn.score) bestCarn = g;
    }
  });
  gizmos.forEach((g) => g.setChampionStar(g === bestHerb || g === bestCarn));

  foodManager.update(dt);
  foodStats.count = foodManager.count;
  effects.update(dt);
  updatePlankton(dt, config.aquariumHeight);
  if (selectedGizmo) detailPanel.update(selectedGizmo);
  if (selectedFood) detailPanel.updateFood(selectedFood);
  composer.render();
  updateGizmoList();
})();
