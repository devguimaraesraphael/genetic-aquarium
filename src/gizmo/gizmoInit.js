/**
 * gizmoInit.js – initializes Gizmo instance fields.
 * Extracted from Gizmo.js to keep file sizes small.
 */

import * as THREE from "three";
import { NeuralNetwork } from "../NeuralNetwork.js";

const IDENTITY_HERBIVORE = "herbivore";
const IDENTITY_CARNIVORE = "carnivore";

// Auto-incrementing ID so every gizmo gets a stable, unique number
let _nextId = 1;
export function resetGizmoIdCounter() {
  _nextId = 1;
}

export function initGizmoState(gizmo, scene, config, options) {
  gizmo.id = _nextId++;
  gizmo._scene = scene;
  gizmo._config = config;

  const hw = config.aquariumWidth / 2;
  const hh = config.aquariumHeight / 2;
  gizmo.position = new THREE.Vector2(
    (Math.random() * 2 - 1) * hw * 0.85,
    (Math.random() * 2 - 1) * hh * 0.85,
  );
  gizmo.velocity = new THREE.Vector2(
    (Math.random() * 2 - 1) * 2,
    (Math.random() * 2 - 1) * 2,
  );
  gizmo.acceleration = new THREE.Vector2(
    (Math.random() * 2 - 1) * 800,
    (Math.random() * 2 - 1) * 800,
  );
  gizmo.direction = new THREE.Vector2(0, 1);

  gizmo.genes = {
    vision: options.vision ?? 3,
    visionRange: options.visionRange ?? [config.visionMin, config.visionMax],
    size: options.size ?? 1,
  };
  // bodyRadius used for click detection and eating range
  gizmo.bodyRadius = 6 * (options.size ?? 1);

  gizmo.identity =
    options.identity ??
    (Math.random() < config.carnivoreRatio
      ? IDENTITY_CARNIVORE
      : IDENTITY_HERBIVORE);

  gizmo.color = options.color
    ? options.color.clone()
    : new THREE.Color().setHSL(Math.random(), 0.75, 0.58);
  gizmo.lineageHue = options.lineageHue ?? gizmo.color.getHSL({}).h;

  gizmo.nn = options.nn ?? new NeuralNetwork(12, config.nnHiddenSize, 3);

  gizmo.isDead = false;
  gizmo.age = 0;
  gizmo.starvationCounter = 0;
  gizmo.score = 0;

  gizmo._nnFault = false;
  gizmo._nnFaultReason = "";
  gizmo._nnFaultStack = "";
  gizmo._lastInputs = new Array(12).fill(0);
  gizmo._lastOutputs = [0.5, 0.5, 0.5];

  gizmo.readyToReproduce = false;
  gizmo.reproductionEnergy = 0;
}
