import * as THREE from "three";
import { getGizmoDetails } from "./gizmo/details.js";
import { NeuralNetwork } from "./NeuralNetwork.js";
import {
  buildBodyMesh,
  buildBodyOutline,
  buildEyesMesh,
  buildSpikeMesh,
  buildVisionMesh,
  buildSeenTargetMarker,
} from "./gizmo/mesh.js";
import { buildInputs } from "./gizmo/inputs.js";
import { mutateColor, crossoverColor } from "./gizmo/colors.js";
import { inferNN } from "./gizmo/nnInference.js";
import {
  applyPhysics,
  advancePosition,
  updateSeenTargetMarker,
} from "./gizmo/movement.js";
import { tryEat } from "./gizmo/eating.js";
import { reproduce as _reproduceGizmo } from "./gizmo/lifecycle.js";
import { initGizmoState } from "./gizmo/gizmoInit.js";
import { selectGizmo, deselectGizmo } from "./gizmo/selection.js";

/**
 * Gizmo: neural-network-driven agent in the genetic aquarium.
 * Complex behaviours are delegated to helpers in ./gizmo/*.js.
 */
export class Gizmo {
  constructor(scene, config, options = {}) {
    initGizmoState(this, scene, config, options);
    this.group = new THREE.Group();
    this._buildMesh();
    this._scene.add(this.group);
    this._visionCircle = null;
    this.visionMesh = null;
    this._isSelected = false;
    this._buildVisionMesh();
    this._seenTargetMarker = this._buildSeenTargetMarker();
    this._scene.add(this._seenTargetMarker); // world-space: must NOT be child of group
  }

  // ── Mesh building ──────────────────────────────────────────────────────────

  _buildMesh() {
    // Body uses the gizmo's unique lineage color
    this.bodyMesh = buildBodyMesh(this.identity, this.genes.size, this.color);
    this.bodyOutline = buildBodyOutline(this.genes.size);
    this.eyesMesh = buildEyesMesh(this.identity, this.genes.size);
    this.spikeMesh = buildSpikeMesh(this.identity, this.genes.size);
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.add(this.bodyMesh);
    this.bodyGroup.add(this.bodyOutline);
    this.bodyGroup.add(this.spikeMesh);
    this.bodyGroup.add(this.eyesMesh);
    this.group.add(this.bodyGroup);
    this.group.position.set(this.position.x, this.position.y, 0);
    // Arrow points along local +Y; atan2 aligns local +X with velocity.
    // Subtract π/2 so +Y (the arrow) aligns with the velocity direction.
    this.group.rotation.z =
      Math.atan2(this.direction.y, this.direction.x) - Math.PI / 2;
  }

  _buildVisionMesh() {
    this.visionMesh = buildVisionMesh(this.genes.visionRange[1]);
    this.group.add(this.visionMesh);
  }

  _buildSeenTargetMarker() {
    return buildSeenTargetMarker();
  }

  // ── NN helpers ─────────────────────────────────────────────────────────────

  _nullInputs() {
    return new Array(14).fill(0);
  }
  _buildInputs(config, allGizmos, foodManager) {
    return buildInputs(this, config, allGizmos, foodManager);
  }

  _inferNN(inputs, config) {
    // Guard: if NN shape doesn't match current config, rebuild it in-place.
    // This can happen when HoF weights from an old session were applied, or
    // when config.nnHiddenSize is changed via the GUI on a live gizmo.
    const expHidden = config.nnHiddenSize ?? 6;
    const shapeValid =
      this.nn &&
      this.nn.inputSize === 14 &&
      this.nn.hiddenSize === expHidden &&
      this.nn.outputSize === 3 &&
      Array.isArray(this.nn.w1) &&
      this.nn.w1.length === expHidden &&
      Array.isArray(this.nn.w1[0]) &&
      this.nn.w1[0].length === 14 &&
      Array.isArray(this.nn.w2) &&
      this.nn.w2.length === 3 &&
      Array.isArray(this.nn.w2[0]) &&
      this.nn.w2[0].length === expHidden;

    if (!shapeValid) {
      console.warn(
        `[Gizmo #${this.id}] NN shape invalid (hidden=${this.nn?.hiddenSize}, ` +
          `expected=${expHidden}) – rebuilding`,
      );
      this.nn = new NeuralNetwork(14, expHidden, 3);
    }

    const r = inferNN(this.nn, inputs, this.id, config);
    this._nnFault = r.fault;
    this._nnFaultReason = r.reason;
    this._nnFaultStack = r.stack;
    this._lastOutputs = r.outputs;
    return r.outputs;
  }

  // ── Update loop ─────────────────────────────────────────────────────────────

  update(dt, config, allGizmos, foodManager) {
    if (this.isDead) return;
    this.age += dt;
    this.starvationCounter += dt;

    if (this.starvationCounter > config.gizmoStarvation || this.age > 300) {
      this.isDead = true;
      this.group.visible = false;
      return;
    }

    if (this.reproductionCooldownRemaining > 0) {
      this.reproductionCooldownRemaining = Math.max(
        0,
        this.reproductionCooldownRemaining - dt,
      );
    }
    if (this.eatCooldownRemaining > 0) {
      this.eatCooldownRemaining = Math.max(0, this.eatCooldownRemaining - dt);
    }

    this._lastInputs = this._buildInputs(config, allGizmos, foodManager);
    const out = this._inferNN(this._lastInputs, config);
    const accelX = (out[0] * 2 - 1) * config.nnAccelScale;
    const accelY = (out[1] * 2 - 1) * config.nnAccelScale;
    const eat = out[2] >= 0.5;

    applyPhysics(this, accelX, accelY, config, dt);
    advancePosition(this, config, dt);

    this.group.position.set(this.position.x, this.position.y, 0);
    this.group.rotation.z =
      Math.atan2(this.direction.y, this.direction.x) - Math.PI / 2;

    if (eat) tryEat(this, config, foodManager, allGizmos);
    if (this._isSelected) updateSeenTargetMarker(this, allGizmos, foodManager);
  }

  // ── Reproduction ────────────────────────────────────────────────────────────

  reproduce(config, currentPopulation = 0) {
    return _reproduceGizmo(this, config, currentPopulation);
  }
  static mutateColor(color, delta = 0.05) {
    return mutateColor(color, delta);
  }
  static crossoverColor(a, b) {
    return crossoverColor(a, b);
  }

  // ── Selection ───────────────────────────────────────────────────────────────

  select() {
    selectGizmo(this);
  }
  deselect() {
    deselectGizmo(this);
  }
  _showSelectionMarker() {}
  _hideSelectionMarker() {}

  // ── Serialization ───────────────────────────────────────────────────────────

  getDetails() {
    return getGizmoDetails(this);
  }

  destroy() {
    if (this.group.parent) this.group.parent.remove(this.group);
    if (this._seenTargetMarker && this._seenTargetMarker.parent) {
      this._seenTargetMarker.parent.remove(this._seenTargetMarker);
    }
    this.isDead = true;
  }
  dispose() {
    this.destroy();
  }
}
