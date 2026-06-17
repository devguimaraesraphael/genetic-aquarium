import { IDENTITY, IDENTITY_FOOD } from "./Identity.js";
import { FOOD_MAX, createFoodMeshes, renderFoodInstances, FOOD_PALETTE } from "./food/foodRenderer.js";

export { FOOD_MAX };

export class FoodManager {
  /**
   * @param {THREE.Scene} scene
   * @param {object}      config  – shared live-config
   */
  constructor(scene, config) {
    this._scene = scene;
    this._config = config;

    this.identity = IDENTITY_FOOD;
    this._foods = [];
    this._meshes = createFoodMeshes(scene);
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
      colorIdx: Math.floor(Math.random() * FOOD_PALETTE.length),
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

    // Remove eaten food
    this._foods = this._foods.filter((f) => f.size > 0.01);
    renderFoodInstances(this._meshes, this._foods, dt);
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
