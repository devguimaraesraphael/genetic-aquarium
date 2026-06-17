import * as THREE from "three";
import { NeuralNetwork } from "./NeuralNetwork.js";
import { IDENTITY_HERBIVORE, IDENTITY_CARNIVORE } from "./Identity.js";

const GIZMO_BASE_RADIUS = 15; // px at size = 1

/**
 * Gizmo: Individual agent in the genetic aquarium.
 * Implements behavior via neural network inference, physics-based movement,
 * reproduction, and interaction with food/environment.
 */
export class Gizmo {
  /**
   * @param {THREE.Scene} scene
   * @param {object}      config  – shared live-config object (read every frame)
   * @param {object}      options – optional overrides
   */
  constructor(scene, config, options = {}) {
    this._scene = scene;
    this._config = config;

    // ── Position & Velocity ────────────────────────────────────────────────
    const hw = config.aquariumWidth / 2;
    const hh = config.aquariumHeight / 2;

    this.position = new THREE.Vector2(
      (Math.random() * 2 - 1) * hw * 0.85,
      (Math.random() * 2 - 1) * hh * 0.85,
    );

    this.velocity = new THREE.Vector2(
      (Math.random() * 2 - 1) * 2,
      (Math.random() * 2 - 1) * 2,
    );

    this.acceleration = new THREE.Vector2(
      (Math.random() * 2 - 1) * 800,
      (Math.random() * 2 - 1) * 800,
    );

    this.direction = new THREE.Vector2(0, 1);

    // ── Genes ──────────────────────────────────────────────────────────────
    this.genes = {
      vision: options.vision ?? 3,
      visionRange: options.visionRange ?? [config.visionMin, config.visionMax],
      size: options.size ?? 1,
    };

    // ── Identity (herbivore vs carnivore) ──────────────────────────────────
    this.identity =
      options.identity ??
      (Math.random() < config.carnivoreRatio
        ? IDENTITY_CARNIVORE
        : IDENTITY_HERBIVORE);

    // ── Visual ─────────────────────────────────────────────────────────────
    // Colors: random on first spawn; inherited (with variation) on clone;
    // averaged on crossover; slightly shifted on mutation.
    if (options.color) {
      this.color = options.color.clone();
    } else {
      this.color = new THREE.Color().setHSL(Math.random(), 0.75, 0.58);
    }
    this.lineageHue = options.lineageHue ?? this.color.getHSL({}).h;

    // ── Neural Network ─────────────────────────────────────────────────────
    this.nn = options.nn ?? new NeuralNetwork(12, config.nnHiddenSize, 3);

    // ── Life State ─────────────────────────────────────────────────────────
    this.isDead = false;
    this.age = 0;
    this.starvationCounter = 0; // increments each frame, resets on eating
    this.score = 0;

    // ── NN Error Handling ──────────────────────────────────────────────────
    this._nnFault = false;
    this._nnFaultReason = "";
    this._nnFaultStack = "";
    this._lastInputs = this._nullInputs(config);
    this._lastOutputs = [0.5, 0.5, 0.5];

    // ── Three.js Objects ──────────────────────────────────────────────────
    this.group = new THREE.Group();
    this._buildMesh();
    this._scene.add(this.group);

    // Vision circle (debug)
    this._visionCircle = null;
    this.visionMesh = null;
    this._buildVisionMesh();
    this._isSelected = false;

    // Seen target marker (for selection visualization)
    this._seenTargetMarker = this._buildSeenTargetMarker();
    this.group.add(this._seenTargetMarker);

    // Reproduction tracking
    this.readyToReproduce = false;
    this.reproductionEnergy = 0;
  }

  // ────────────────────────────────────────────────────────────────────────
  // BUILDING & RENDERING
  // ────────────────────────────────────────────────────────────────────────

  _buildMesh() {
    // Body: simple circle
    const bodyGeo = new THREE.CircleGeometry(
      GIZMO_BASE_RADIUS * this.genes.size,
      32,
    );
    const bodyMat = new THREE.MeshBasicMaterial({
      color: this.identity === IDENTITY_HERBIVORE ? 0x00ff00 : 0xff0000,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.z = 0.1;

    // Spike indicator
    const spikeGeo = this._buildSpikeGeometry();
    const spikeMat = new THREE.MeshBasicMaterial({
      color: this.identity === IDENTITY_HERBIVORE ? 0xffff00 : 0xff0000,
    });
    this.spikeMesh = new THREE.Mesh(spikeGeo, spikeMat);
    this.spikeMesh.position.z = 0.2;

    // Group
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.add(this.bodyMesh);
    this.bodyGroup.add(this.spikeMesh);
    this.group.add(this.bodyGroup);

    // Update group position
    this.group.position.set(this.position.x, this.position.y, 0);
    this.group.rotation.z = Math.atan2(this.direction.y, this.direction.x);
  }

  _buildSpikeGeometry() {
    const points = [];
    const size = GIZMO_BASE_RADIUS * this.genes.size;

    if (this.identity === IDENTITY_HERBIVORE) {
      // Rounded spike: arc at tip
      for (let i = 0; i <= 16; i++) {
        const angle = (i / 16) * Math.PI * 0.5 - Math.PI * 0.25;
        points.push(
          new THREE.Vector2(
            Math.cos(angle) * size * 0.4,
            Math.sin(angle) * size * 0.6,
          ),
        );
      }
    } else {
      // Sharp V-shape spike
      points.push(new THREE.Vector2(0, 0));
      points.push(new THREE.Vector2(-size * 0.2, size * 0.6));
      points.push(new THREE.Vector2(size * 0.2, size * 0.6));
    }

    const latheGeo = new THREE.LatheGeometry(points, 8);
    return latheGeo;
  }

  _buildVisionMesh() {
    const visionGeo = new THREE.CircleGeometry(this.genes.visionRange[1], 64);
    const visionMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
    });
    this.visionMesh = new THREE.LineSegments(
      new THREE.EdgesGeometry(visionGeo),
      visionMat,
    );
    this.visionMesh.position.z = 0;
    this.visionMesh.visible = false;
    this.group.add(this.visionMesh);
  }

  _buildSeenTargetMarker() {
    const markerGeo = new THREE.CircleGeometry(10, 32);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0,
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.z = 0.15;
    marker.visible = false;
    return marker;
  }

  /**
   * Build null input vector (all zeros)
   */
  _nullInputs(config) {
    return new Array(12).fill(0);
  }

  /**
   * Build input vector for NN from environment observations
   */
  _buildInputs(config, allGizmos, foodManager) {
    const inputs = [
      // Self state (4)
      this.velocity.x / config.maxVelocity, // velocity X normalized
      this.velocity.y / config.maxVelocity, // velocity Y normalized
      this.starvationCounter / config.gizmoStarvation, // hunger level [0,1]
      this.age / 300, // age normalized

      // Nearest ally (4)
      0,
      0,
      0,
      0,

      // Nearest food (4)
      0,
      0,
      0,
      0,
    ];

    // Find nearest ally
    let minAllyDist = Infinity;
    for (const other of allGizmos) {
      if (other === this || other.isDead) continue;
      const dist = this.position.distanceTo(other.position);
      if (dist < minAllyDist) {
        minAllyDist = dist;
        const visionRange = this.genes.visionRange[1];
        const angle = Math.atan2(
          other.position.y - this.position.y,
          other.position.x - this.position.x,
        );
        const selfAngle = Math.atan2(this.direction.y, this.direction.x);
        inputs[4] = Math.cos(angle - selfAngle); // relative direction
        inputs[5] = Math.sin(angle - selfAngle);
        inputs[6] = Math.min(dist / visionRange, 1); // relative distance
        inputs[7] = other.identity === this.identity ? 1 : 0; // same type?
      }
    }

    // Find nearest food
    if (foodManager && foodManager.foods && foodManager.foods.length > 0) {
      let minFoodDist = Infinity;
      let nearestFood = null;
      for (const food of foodManager.foods) {
        if (food.size < 0.01) continue; // Skip eaten food
        const foodPos = new THREE.Vector2(food.x, food.y);
        const dist = this.position.distanceTo(foodPos);
        if (dist < minFoodDist) {
          minFoodDist = dist;
          nearestFood = food;
        }
      }

      if (nearestFood) {
        const visionRange = this.genes.visionRange[1];
        const foodPos = new THREE.Vector2(nearestFood.x, nearestFood.y);
        const angle = Math.atan2(
          foodPos.y - this.position.y,
          foodPos.x - this.position.x,
        );
        const selfAngle = Math.atan2(this.direction.y, this.direction.x);
        inputs[8] = Math.cos(angle - selfAngle);
        inputs[9] = Math.sin(angle - selfAngle);
        inputs[10] = Math.min(minFoodDist / visionRange, 1);
        inputs[11] = 1; // food detected
      }
    }

    return inputs;
  }

  /**
   * Infer NN output with error handling
   */
  _inferNN(inputs) {
    try {
      const output = this.nn.forward(inputs);

      // Validate output
      if (!Array.isArray(output) || output.length !== 3) {
        throw new Error("Invalid output: not 3-element array");
      }

      for (let i = 0; i < 3; i++) {
        if (!Number.isFinite(output[i])) {
          throw new Error(`non-finite NN output at index ${i}: ${output[i]}`);
        }
        if (output[i] < 0 || output[i] > 1) {
          throw new Error(`Invalid output[${i}]: ${output[i]} (not in [0,1])`);
        }
      }

      this._nnFault = false;
      this._nnFaultReason = "";
      this._nnFaultStack = "";
      this._lastOutputs = output;
      return output;
    } catch (err) {
      this._nnFault = true;
      this._nnFaultReason = err.message;
      this._nnFaultStack = err.stack;

      console.error(
        `[Gizmo #${this.id} NN ERROR] ${err.message}\n${err.stack}`,
      );

      // Fallback: neutral behavior
      this._lastOutputs = [0.5, 0.5, 0.5];
      return [0.5, 0.5, 0.5];
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // PHYSICS & BEHAVIOR
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Main update loop
   */
  update(dt, config, allGizmos, foodManager) {
    if (this.isDead) return;

    // Age and starvation
    this.age += dt;
    this.starvationCounter += dt;

    // Death check
    if (this.starvationCounter > config.gizmoStarvation || this.age > 300) {
      this.isDead = true;
      this.group.visible = false;
      return;
    }

    // Build inputs and infer NN
    this._lastInputs = this._buildInputs(config, allGizmos, foodManager);
    const nnOutput = this._inferNN(this._lastInputs);

    // Parse NN output
    const accelX = (nnOutput[0] * 2 - 1) * config.nnAccelScale; // [-1, 1] → acceleration
    const accelY = (nnOutput[1] * 2 - 1) * config.nnAccelScale;
    const eatDecision = nnOutput[2] >= 0.5;

    // Update acceleration
    this.acceleration.set(accelX, accelY);

    // ── Physics (lerp-based) ──────────────────────────────────────────────
    // Rule: this.vector = lerp(this.vector, newVector, deltaK)
    // where deltaK = k * dt
    // frictionFactor dampens velocity each frame.
    const k = config.k;
    const deltaK = Math.min(k * dt, 1); // clamp to avoid overshoot
    const frictionFactor = Math.pow(config.l, dt);

    // Smoothly steer acceleration toward NN target
    this.acceleration.lerp(new THREE.Vector2(accelX, accelY), deltaK);

    // Smoothly steer velocity toward acceleration, then apply friction
    this.velocity.lerp(this.acceleration, deltaK);
    this.velocity.multiplyScalar(frictionFactor);

    // Clamp velocity
    const speed = this.velocity.length();
    if (speed > config.maxVelocity) {
      this.velocity.multiplyScalar(config.maxVelocity / speed);
    }

    // Update direction
    if (speed > 0.1) {
      this.direction.copy(this.velocity).normalize();
    }

    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // Wrap around screen
    const hw = config.aquariumWidth / 2;
    const hh = config.aquariumHeight / 2;
    if (this.position.x < -hw) this.position.x += config.aquariumWidth;
    if (this.position.x > hw) this.position.x -= config.aquariumWidth;
    if (this.position.y < -hh) this.position.y += config.aquariumHeight;
    if (this.position.y > hh) this.position.y -= config.aquariumHeight;

    // Update mesh
    this.group.position.set(this.position.x, this.position.y, 0);
    this.group.rotation.z = Math.atan2(this.direction.y, this.direction.x);

    // Eating logic
    if (eatDecision && foodManager) {
      this._tryEat(foodManager, config);
    }

    // Update seen target marker if selected
    if (this._isSelected) {
      this._updateSeenTargetMarker(allGizmos);
    }
  }

  _tryEat(foodManager, config) {
    const eatRadius = GIZMO_BASE_RADIUS * this.genes.size * 1.5;

    if (!foodManager || !foodManager.foods) return;

    for (const food of foodManager.foods) {
      if (food.size < 0.01) continue; // Already eaten
      const dist = this.position.distanceTo(new THREE.Vector2(food.x, food.y));
      if (dist < eatRadius) {
        // Eat food by marking as consumed
        this.starvationCounter = 0;
        this.score += 10;
        this.reproductionEnergy += 5;
        food.size = 0; // Mark as eaten (will be filtered out next update)

        // Check reproduction
        if (this.reproductionEnergy >= 50) {
          this.readyToReproduce = true;
        }
      }
    }
  }

  _updateSeenTargetMarker(allGizmos) {
    // Find nearest ally
    let nearestGizmo = null;
    let minDist = Infinity;

    for (const other of allGizmos) {
      if (other === this || other.isDead) continue;
      const dist = this.position.distanceTo(other.position);
      if (dist < minDist) {
        minDist = dist;
        nearestGizmo = other;
      }
    }

    if (nearestGizmo) {
      // Position marker at nearest gizmo location
      this._seenTargetMarker.position.copy(nearestGizmo.position);
      this._seenTargetMarker.position.z = 0.15;
      this._seenTargetMarker.material.opacity = 0.5;
    } else {
      // No target
      this._seenTargetMarker.material.opacity = 0;
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // REPRODUCTION
  // ────────────────────────────────────────────────────────────────────────

  // Clone: child inherits parent color with slight hue variation.
  // Crossover (two parents): call Gizmo.crossoverColor(a, b) externally
  //   and pass the result as options.color.
  reproduce(config) {
    if (!this.readyToReproduce) return null;

    const childGenes = {
      vision:
        this.genes.vision + (Math.random() - 0.5) * config.nnMutationDelta,
      visionRange: this.genes.visionRange.slice(),
      size: this.genes.size + (Math.random() - 0.5) * config.nnMutationDelta,
    };

    const childNN = this.nn.clone();
    childNN.mutate(config.nnMutationRate, config.nnMutationDelta);

    // Color: clone parent with small random hue shift (±0.04)
    const childColor = Gizmo.mutateColor(this.color, 0.04);

    const child = new Gizmo(this._scene, config, {
      vision: childGenes.vision,
      visionRange: childGenes.visionRange,
      size: Math.max(config.sizeMin, Math.min(config.sizeMax, childGenes.size)),
      nn: childNN,
      identity: this.identity,
      lineageHue: this.lineageHue,
      color: childColor,
    });

    this.reproductionEnergy = 0;
    this.readyToReproduce = false;

    return child;
  }

  /**
   * Mutate a color: clone it and shift H by a random amount in [-delta, +delta].
   */
  static mutateColor(color, delta = 0.05) {
    const hsl = {};
    color.getHSL(hsl);
    const newH = (hsl.h + (Math.random() * 2 - 1) * delta + 1) % 1;
    return new THREE.Color().setHSL(newH, hsl.s, hsl.l);
  }

  /**
   * Crossover two colors: average their H, S, L values.
   * Use externally when creating offspring from two parents.
   */
  static crossoverColor(a, b) {
    const ha = {}, hb = {};
    a.getHSL(ha);
    b.getHSL(hb);
    // Average hue via circular mean to avoid wrap-around artifacts
    const dh = ((hb.h - ha.h + 1.5) % 1) - 0.5;
    return new THREE.Color().setHSL(
      (ha.h + dh * 0.5 + 1) % 1,
      (ha.s + hb.s) / 2,
      (ha.l + hb.l) / 2,
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // SELECTION & DEBUG
  // ────────────────────────────────────────────────────────────────────────

  select() {
    this._isSelected = true;

    if (this.visionMesh) {
      this.visionMesh.visible = true;
    }

    // Highlight spike
    if (this.spikeMesh) {
      this.spikeMesh.material.color.set(0xff0000);
    }

    // Show marker
    if (this._seenTargetMarker) {
      this._seenTargetMarker.visible = true;
    }
  }

  deselect() {
    this._isSelected = false;

    if (this.visionMesh) {
      this.visionMesh.visible = false;
    }

    if (this.spikeMesh) {
      const color = this.identity === IDENTITY_HERBIVORE ? 0xffff00 : 0xff0000;
      this.spikeMesh.material.color.set(color);
    }

    if (this._seenTargetMarker) {
      this._seenTargetMarker.visible = false;
      this._seenTargetMarker.material.opacity = 0;
    }
  }

  _showSelectionMarker() {
    if (!this._selectionMarker) {
      const markerGeo = new THREE.CircleGeometry(
        GIZMO_BASE_RADIUS * this.genes.size * 1.3,
        32,
      );
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
      });
      this._selectionMarker = new THREE.Mesh(markerGeo, markerMat);
      this._selectionMarker.position.z = 0.05;
      this.group.add(this._selectionMarker);
    }
  }

  _hideSelectionMarker() {
    if (this._selectionMarker) {
      this.group.remove(this._selectionMarker);
      this._selectionMarker = null;
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // SERIALIZATION
  // ────────────────────────────────────────────────────────────────────────

  getDetails() {
    return {
      id: Math.random().toString(36).substring(7), // placeholder
      type: this.identity === IDENTITY_HERBIVORE ? "herbivore" : "carnivore",
      colorHex: "#" + this.color.getHexString(),
      score: this.score.toFixed(0),
      age: (this.age * 1000).toFixed(0) + "ms",
      nnOut: `[${this._lastOutputs.map((x) => x.toFixed(3)).join(", ")}]`,
      nnFault: this._nnFault,
      nnFaultReason: this._nnFaultReason,
      nnFaultStack: this._nnFaultStack,
    };
  }

  destroy() {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    this.isDead = true;
  }

  dispose() {
    this.destroy();
  }
}
