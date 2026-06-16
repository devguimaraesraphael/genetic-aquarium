import * as THREE from "three";

const GIZMO_BASE_RADIUS = 15; // px at size = 1

export class Gizmo {
  /**
   * @param {THREE.Scene} scene
   * @param {object}      config  – shared live-config (read every frame)
   */
  constructor(scene, config) {
    this._scene = scene;

    const hw = config.aquariumWidth / 2;
    const hh = config.aquariumHeight / 2;

    // ── State vectors ──────────────────────────────────────────────────────
    this.position = new THREE.Vector2(
      (Math.random() * 2 - 1) * hw * 0.85,
      (Math.random() * 2 - 1) * hh * 0.85,
    );

    this.velocity = new THREE.Vector2(
      (Math.random() * 2 - 1) * 2,
      (Math.random() * 2 - 1) * 2,
    );

    // Random acceleration – large magnitude so k*accel is meaningful even
    // at the default k = 0.001 (user can raise k in GUI for stronger effect)
    this.acceleration = new THREE.Vector2(
      (Math.random() * 2 - 1) * 800,
      (Math.random() * 2 - 1) * 800,
    );

    this.direction = new THREE.Vector2(0, 1); // unit vector, updated from velocity

    // ── Genes ──────────────────────────────────────────────────────────────
    this.genes = {
      vision: 3,
      visionRange: [config.v1, config.v2],
      size: 1,
    };

    // ── Visual colour ──────────────────────────────────────────────────────
    this.color = new THREE.Color().setHSL(Math.random(), 0.75, 0.58);

    this._buildMesh();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  _buildMesh() {
    const r = GIZMO_BASE_RADIUS * this.genes.size;

    // Body – filled circle
    const bodyGeo = new THREE.CircleGeometry(r, 40);
    const bodyMat = new THREE.MeshBasicMaterial({ color: this.color });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);

    // Outline ring
    const ringGeo = new THREE.RingGeometry(r, r + 2, 40);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);

    // Direction arrow – triangle that points toward +Y by default.
    // Tip sits above the body; base overlaps the body edge.
    const shape = new THREE.Shape();
    shape.moveTo(0, r + r * 1.9); // tip
    shape.lineTo(-r * 0.45, r + r * 0.35); // left base corner
    shape.lineTo(r * 0.45, r + r * 0.35); // right base corner
    shape.closePath();

    const arrowGeo = new THREE.ShapeGeometry(shape);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);

    // Group – rotating the group rotates body + arrow together
    this.group = new THREE.Group();
    this.group.add(this.bodyMesh, this.ringMesh, this.arrowMesh);
    this.group.position.set(this.position.x, this.position.y, 0.1);

    this._scene.add(this.group);
  }

  // ── Public ───────────────────────────────────────────────────────────────

  /**
   * Called once per animation frame.
   * @param {number} dt  – delta time in seconds (from THREE.Clock)
   * @param {object} cfg – shared live-config object
   */
  update(dt, cfg) {
    const { k, l, maxVelocity, aquariumWidth, aquariumHeight } = cfg;

    // ── Physics formula ───────────────────────────────────────────────────
    // newVelocity = (acceleration * k  +  velocity) * l
    const nvx = (this.acceleration.x * k + this.velocity.x) * l;
    const nvy = (this.acceleration.y * k + this.velocity.y) * l;

    // clamp magnitude to maxVelocity
    const speed = Math.sqrt(nvx * nvx + nvy * nvy);
    const clampScale =
      speed > maxVelocity && speed > 0 ? maxVelocity / speed : 1;

    this.velocity.set(nvx * clampScale, nvy * clampScale);

    // ── Frame-rate independent movement ───────────────────────────────────
    // Normalise to 60 fps so the simulation speed is consistent regardless
    // of the actual frame rate.
    const move = dt * 60;
    this.position.x += this.velocity.x * move;
    this.position.y += this.velocity.y * move;

    // Keep direction unit-vector in sync with velocity
    if (speed > 1e-5) {
      this.direction.set(
        this.velocity.x / this.velocity.length(),
        this.velocity.y / this.velocity.length(),
      );
    }

    // ── Wall bounce ───────────────────────────────────────────────────────
    const r = GIZMO_BASE_RADIUS * this.genes.size;
    const hw = aquariumWidth / 2 - r;
    const hh = aquariumHeight / 2 - r;

    if (this.position.x > hw) {
      this.position.x = hw;
      this.velocity.x = -Math.abs(this.velocity.x);
      this.acceleration.x = -Math.abs(this.acceleration.x);
    } else if (this.position.x < -hw) {
      this.position.x = -hw;
      this.velocity.x = Math.abs(this.velocity.x);
      this.acceleration.x = Math.abs(this.acceleration.x);
    }

    if (this.position.y > hh) {
      this.position.y = hh;
      this.velocity.y = -Math.abs(this.velocity.y);
      this.acceleration.y = -Math.abs(this.acceleration.y);
    } else if (this.position.y < -hh) {
      this.position.y = -hh;
      this.velocity.y = Math.abs(this.velocity.y);
      this.acceleration.y = Math.abs(this.acceleration.y);
    }

    // ── Sync mesh ─────────────────────────────────────────────────────────
    this.group.position.set(this.position.x, this.position.y, 0.1);

    // Arrow points toward +Y by default; rotate group so it tracks direction.
    // rotation.z = -atan2(dir.x, dir.y) maps:
    //   (0, 1) → 0        (up    → no rotation)
    //   (1, 0) → -PI/2    (right → CW 90°)
    //  (-1, 0) → +PI/2    (left  → CCW 90°)
    this.group.rotation.z = -Math.atan2(this.direction.x, this.direction.y);
  }

  dispose() {
    this._scene.remove(this.group);
    this.bodyMesh.geometry.dispose();
    this.ringMesh.geometry.dispose();
    this.arrowMesh.geometry.dispose();
  }
}
