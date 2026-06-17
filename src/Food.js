import * as THREE from "three";
import { IDENTITY } from "./Identity.js";

export const FOOD_MAX = 2000;

// ── Shared 3D geometries ──────────────────────────────────────────────────────
const _GEOS = (() => {
  const tetra = new THREE.TetrahedronGeometry(1, 0);
  const octa = new THREE.OctahedronGeometry(1, 0);
  const icosa = new THREE.IcosahedronGeometry(1, 0);
  return [tetra, octa, icosa];
})();

// ── Color palette – bioluminescent greens/teals ───────────────────────────────
const _PALETTE = [
  new THREE.Color(0x00ff66),
  new THREE.Color(0x33dd55),
  new THREE.Color(0x55ff33),
  new THREE.Color(0x00cc44),
  new THREE.Color(0x88ffaa),
  new THREE.Color(0x22ee77),
  new THREE.Color(0xaaff44),
  new THREE.Color(0x00ff99),
];

const _dummy = new THREE.Object3D();

export class FoodManager {
  /**
   * @param {THREE.Scene} scene
   * @param {object}      config  – shared live-config
   */
  constructor(scene, config) {
    this._scene = scene;
    this._config = config;

    // Identity – all food is [0,0,0]
    this.identity = IDENTITY.FOOD;

    /** @type {Array<{x,y,size,rotation,shapeType,colorIdx}>} */
    this._foods = [];

    // One InstancedMesh per shape type, pre-allocated for FOOD_MAX instances.
    this._meshes = _GEOS.map((geo) => {
      const mesh = new THREE.InstancedMesh(
        geo,
        new THREE.MeshBasicMaterial(),
        FOOD_MAX,
      );
      mesh.count = 0;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(mesh);
      return mesh;
    });

    this._seedInitial();
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get count() {
    return this._foods.length;
  }

  /** Read-only access to the raw food array for vision scanning. */
  get foods() {
    return this._foods;
  }

  /** Returns the food item closest to (wx, wy) within its radius, or null. */
  hitTest(wx, wy) {
    let closest = null;
    let closestDist = Infinity;
    for (const f of this._foods) {
      const dx = f.x - wx;
      const dy = f.y - wy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= f.size * 1.5 && dist < closestDist) {
        closest = f;
        closestDist = dist;
      }
    }
    return closest;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _clampToTank(x, y) {
    const hw = this._config.aquariumWidth / 2 - 6;
    const hh = this._config.aquariumHeight / 2 - 6;
    return [Math.max(-hw, Math.min(hw, x)), Math.max(-hh, Math.min(hh, y))];
  }

  _addFood(x, y) {
    if (this._foods.length >= FOOD_MAX) return;
    const [cx, cy] = this._clampToTank(x, y);
    const minSize = this._config.foodMinSize ?? 3;
    const spawnSize = this._config.foodSpawnSize ?? 16;
    // Start at a fraction of max so growth is always visible
    const startSize = Math.min(minSize, spawnSize * 0.3);
    this._foods.push({
      x: cx,
      y: cy,
      size: startSize + Math.random() * startSize * 0.5,
      rotation: Math.random() * Math.PI * 2,
      shapeType: Math.floor(Math.random() * 3),
      colorIdx: Math.floor(Math.random() * _PALETTE.length),
      cooldown: 0,
      waiting: false,
    });
  }

  _seedInitial() {
    const cfg = this._config;
    const hw = (cfg.aquariumWidth / 2) * 0.86;
    const hh = (cfg.aquariumHeight / 2) * 0.86;
    const n = cfg.foodInitial ?? 10;

    // Spread initial seeds as small clusters
    const nClusters = Math.max(2, Math.round(n / 3));
    const perCluster = Math.ceil(n / nClusters);

    for (let c = 0; c < nClusters && this._foods.length < n; c++) {
      const cx = (Math.random() * 2 - 1) * hw;
      const cy = (Math.random() * 2 - 1) * hh;
      for (let j = 0; j < perCluster && this._foods.length < n; j++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 22;
        this._addFood(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      }
    }
  }

  reset() {
    this._foods = [];
    this._meshes.forEach((m) => {
      m.count = 0;
    });
    this._seedInitial();
  }

  /**
   * @param {number} dt  seconds since last frame
   */
  update(dt) {
    const cfg = this._config;
    const spawnSize = cfg.foodSpawnSize ?? 8;
    const growthRate = cfg.foodGrowthRate ?? 3;
    const minSize = cfg.foodMinSize ?? 2;
    const spawnRadius = cfg.foodSpawnRadius ?? 50;
    const maxCount = Math.min(cfg.foodMaxCount ?? FOOD_MAX, FOOD_MAX);

    const pending = [];

    for (const f of this._foods) {
      // ── Guard: if not waiting but already at/above max, enter waiting ────
      if (!f.waiting && f.size >= spawnSize) {
        f.size = spawnSize;
        f.waiting = true;
        f.cooldown = cfg.foodSpawnCooldown ?? 5;
      }

      // ── Phase 1: grow until max size ──────────────────────────────────
      if (!f.waiting && f.size < spawnSize) {
        f.size = Math.min(f.size + dt * growthRate, spawnSize);
        if (f.size >= spawnSize) {
          f.waiting = true;
          f.cooldown = cfg.foodSpawnCooldown ?? 5;
        }
        continue;
      }

      // ── Phase 2: count down cooldown ──────────────────────────────────
      if (f.waiting && f.cooldown > 0) {
        f.cooldown -= dt;
        continue;
      }

      // ── Phase 3: spawn children, restart cooldown ─────────────────────
      if (
        f.waiting &&
        f.cooldown <= 0 &&
        this._foods.length + pending.length < maxCount
      ) {
        const nChildren = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < nChildren; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 5 + Math.random() * spawnRadius;
          pending.push({
            x: f.x + Math.cos(angle) * dist,
            y: f.y + Math.sin(angle) * dist,
          });
        }
        f.cooldown = cfg.foodSpawnCooldown ?? 5; // restart cycle
      }
    }

    for (const p of pending) {
      if (this._foods.length < maxCount) this._addFood(p.x, p.y);
    }

    // Remove eaten food (size set to near-zero by gizmo feeding)
    this._foods = this._foods.filter((f) => f.size > 0.01);

    // ── Rebuild InstancedMesh data ────────────────────────────────────────
    const counts = [0, 0, 0];
    for (const f of this._foods) {
      const t = f.shapeType;
      const i = counts[t]++;
      f.rotation += dt * (0.8 + f.colorIdx * 0.15); // each food spins at its own rate
      _dummy.position.set(f.x, f.y, 0.05);
      _dummy.scale.setScalar(f.size);
      _dummy.rotation.set(f.rotation * 0.7, f.rotation, f.rotation * 1.3); // 3D tumble
      _dummy.updateMatrix();
      this._meshes[t].setMatrixAt(i, _dummy.matrix);
      this._meshes[t].setColorAt(i, _PALETTE[f.colorIdx]);
    }

    for (let t = 0; t < 3; t++) {
      this._meshes[t].count = counts[t];
      this._meshes[t].instanceMatrix.needsUpdate = true;
      if (this._meshes[t].instanceColor) {
        this._meshes[t].instanceColor.needsUpdate = true;
      }
    }
  }

  dispose() {
    this._meshes.forEach((m) => {
      this._scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this._foods = [];
  }
}
