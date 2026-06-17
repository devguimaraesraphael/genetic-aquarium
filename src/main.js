import * as THREE from "three";
import GUI from "lil-gui";
import { CONFIG, AQUARIUM_PRESETS } from "./constants.js";
import { openSettingsModal } from "./ui/settingsModal.js";
import * as detailPanel from "./ui/detailPanel.js";
import { gizmoList } from "./ui/gizmoList.js";
import { createCameraSelectionRules } from "./ui/cameraSelectionRules.js";
import { HallOfFame } from "./HallOfFame.js";
import { FoodManager } from "./Food.js";
import { EffectsManager } from "./effects/EffectsManager.js";
import {
  createRenderer,
  createScene,
  createCamera,
  createComposer,
  bindResizeHandler,
} from "./aquarium/sceneSetup.js";
import {
  buildAquarium,
  setupPlankton,
  updatePlankton,
} from "./aquarium/builder.js";
import { GizmoController } from "./aquarium/gizmoController.js";
import { simulationTick } from "./aquarium/simulationTick.js";
import { setupGui } from "./aquarium/guiSetup.js";

const STORAGE_KEY = "genetic-aquarium-config";

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
function loadSavedConfig() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

// ── Live config ───────────────────────────────────────────────────────────────
const saved = loadSavedConfig();
const config = {
  ...CONFIG,
  lights: CONFIG.lights.map((l) => ({ ...l })),
  ...(saved ? { ...saved, lights: undefined } : {}),
};
if (saved && Array.isArray(saved.lights)) config.lights = saved.lights;
if (!saved?.aquariumWidth) config.aquariumWidth = window.innerWidth - 20;
if (!saved?.aquariumHeight) config.aquariumHeight = window.innerHeight - 20;
// Default NN to disabled on fresh start (user can enable in controls)
if (!saved || saved.nnDisabled === undefined) config.nnDisabled = true;

// ── Scene / renderer / camera ─────────────────────────────────────────────────
const renderer = createRenderer();
const scene = createScene();
const camera = createCamera();
const composer = createComposer(renderer, scene, camera);
bindResizeHandler(renderer, camera, composer);

// ── Aquarium + plankton ───────────────────────────────────────────────────────
const aqObjects = [];
buildAquarium(scene, config, aqObjects);
const plankton = setupPlankton(scene);

// ── Simulation objects ────────────────────────────────────────────────────────
const hallOfFame = new HallOfFame();
const hofStats = { herb: 0, carn: 0, generation: 1 };
let foodManager = null;
const foodStats = { count: 0 };
const effects = new EffectsManager(scene);
const selectionRules = createCameraSelectionRules();

// ── Gizmo controller (created but NOT populated until Start Simulation) ───────
const ctrl = new GizmoController(scene, config, {
  hallOfFame,
  hofStats,
  gizmoList,
  selectionRules,
});

// ── Simulation state ──────────────────────────────────────────────────────────
let simulationStarted = false;
let paused = true; // start paused until user clicks Start

function startSimulation() {
  if (simulationStarted) return;
  simulationStarted = true;
  paused = false;
  foodManager = new FoodManager(scene, config);
  ctrl.createGizmos();
}

// ── Camera zoom state ─────────────────────────────────────────────────────────
let zoomCurrent = 1.0,
  zoomTarget = 1.0,
  zoomTargetX = 0,
  zoomTargetY = 0;
const originalCameraWidth = window.innerWidth;
const originalCameraHeight = window.innerHeight;
const zoomSpeed = 5;

// ── Pause on Space ────────────────────────────────────────────────────────────
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
    paused = !paused;
  }
});

// ── Click → select gizmo or food ─────────────────────────────────────────────
renderer.domElement.addEventListener("click", (e) => {
  if (!simulationStarted) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const wx =
    (((e.clientX - rect.left) / rect.width) * 2 - 1) * (window.innerWidth / 2);
  const wy =
    -(((e.clientY - rect.top) / rect.height) * 2 - 1) *
    (window.innerHeight / 2);

  let closest = null,
    closestDist = Infinity;
  ctrl.gizmos.forEach((g) => {
    const dist = Math.sqrt((g.position.x - wx) ** 2 + (g.position.y - wy) ** 2);
    if (dist <= (g.bodyRadius ?? 15) && dist < closestDist) {
      closest = g;
      closestDist = dist;
    }
  });
  if (closest) {
    ctrl.setSelectedGizmo(selectionRules.onAquariumSelect(closest).fixed);
    gizmoList.selectGizmo(closest, false);
    return;
  }
  if (foodManager) {
    const hitFood = foodManager.hitTest(wx, wy);
    if (hitFood) {
      ctrl.clearSelection();
      ctrl.selectedFood = hitFood;
      detailPanel.showFood(hitFood, () => ctrl.clearSelection());
      return;
    }
  }
  ctrl.clearSelection();
});

// ── GUI ───────────────────────────────────────────────────────────────────────
const gui = new GUI({ title: "Aquarium Controls" });
const gizmosRef = {
  get current() {
    return ctrl.gizmos;
  },
  set current(v) {
    ctrl.gizmos = v;
  },
};
const { openAquariumControls } = setupGui(gui, config, {
  foodManager: { reset: () => foodManager?.reset() },
  foodStats,
  hofStats,
  createGizmos: () => ctrl.createGizmos(),
  hallOfFame,
  gizmosRef,
  spawnGeneration: (...a) => ctrl.spawnGeneration(...a),
  openSettingsModal,
  AQUARIUM_PRESETS,
  buildAquariumFn: () => buildAquarium(scene, config, aqObjects),
  saveConfig,
  clearSelection: () => ctrl.clearSelection(),
  STORAGE_KEY,
  startSimulation,
});
ctrl.initGizmoListPanel(openAquariumControls);

// Open controls immediately on load
openAquariumControls();

// ── Animation loop ────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

(function animate() {
  requestAnimationFrame(animate);
  const rawDt = clock.getDelta();
  if (paused || !simulationStarted) {
    composer.render();
    return;
  }
  const dt = Math.min(rawDt, 0.1);

  // Camera zoom
  const follow = selectionRules.getFollowGizmo();
  if (follow && !follow.isDead) selectionRules.syncFollowTarget();
  const state = selectionRules.getState();
  zoomTarget = state.zoom;
  zoomTargetX = state.targetX;
  zoomTargetY = state.targetY;
  zoomCurrent =
    Math.abs(zoomCurrent - zoomTarget) > 0.01
      ? zoomCurrent + (zoomTarget - zoomCurrent) * zoomSpeed * dt
      : zoomTarget;
  if (zoomTarget === 1.0) {
    zoomTargetX *= 1 - 3 * dt;
    zoomTargetY *= 1 - 3 * dt;
  }
  const hw = originalCameraWidth / 2 / zoomCurrent;
  const hh = originalCameraHeight / 2 / zoomCurrent;
  camera.left = -hw + zoomTargetX;
  camera.right = hw + zoomTargetX;
  camera.top = hh + zoomTargetY;
  camera.bottom = -hh + zoomTargetY;
  camera.updateProjectionMatrix();

  if (foodManager) {
    const tickCtx = {
      ctrl,
      config,
      hallOfFame,
      hofStats,
      effects,
      foodManager,
      foodStats,
      gizmoList,
      plankton,
      updatePlankton,
    };
    simulationTick(dt, tickCtx);
  }
  composer.render();
})();
