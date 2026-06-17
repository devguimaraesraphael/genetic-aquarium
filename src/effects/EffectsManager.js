import * as THREE from "three";

// ── Particle pool for fire-and-forget effects ─────────────────────────────────
// All effects are pooled (reused) to avoid GC spikes.

const _v = new THREE.Vector3();

class BurstEffect {
  constructor(scene, color, count, speed, lifespan, size) {
    this.active = false;
    this.age = 0;
    this.lifespan = lifespan;

    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      velocities.push(
        Math.cos(a) * speed * (0.6 + Math.random() * 0.8),
        Math.sin(a) * speed * (0.6 + Math.random() * 0.8),
      );
    }
    this._velocities = velocities;
    this._count = count;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this._posAttr = geo.attributes.position;

    this.mesh = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  trigger(x, y) {
    this.active = true;
    this.age = 0;
    this.mesh.visible = true;
    this.mesh.material.opacity = 0.55;
    for (let i = 0; i < this._count; i++) {
      this._posAttr.setXYZ(i, x, y, 0.5);
    }
    this._posAttr.needsUpdate = true;
    this._origin = { x, y };
  }

  update(dt) {
    if (!this.active) return;
    this.age += dt;
    const t = this.age / this.lifespan;
    if (t >= 1) {
      this.active = false;
      this.mesh.visible = false;
      return;
    }

    this.mesh.material.opacity = 0.55 * (1 - t);
    for (let i = 0; i < this._count; i++) {
      const vx = this._velocities[i * 2];
      const vy = this._velocities[i * 2 + 1];
      this._posAttr.setXYZ(
        i,
        this._origin.x + vx * this.age,
        this._origin.y + vy * this.age,
        0.5,
      );
    }
    this._posAttr.needsUpdate = true;
  }
}

class RingEffect {
  constructor(scene, color, lifespan) {
    this.active = false;
    this.age = 0;
    this.lifespan = lifespan;

    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    }
    this.mesh = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 }),
    );
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  trigger(x, y, startRadius = 0) {
    this.active = true;
    this.age = 0;
    this._x = x;
    this._y = y;
    this._startRadius = startRadius;
    this.mesh.visible = true;
    this.mesh.material.opacity = 0.45;
    this.mesh.position.set(x, y, 0.5);
    this.mesh.scale.setScalar(startRadius || 1);
  }

  update(dt) {
    if (!this.active) return;
    this.age += dt;
    const t = this.age / this.lifespan;
    if (t >= 1) {
      this.active = false;
      this.mesh.visible = false;
      return;
    }
    const r = this._startRadius + 60 * t;
    this.mesh.scale.setScalar(r);
    this.mesh.material.opacity = 0.45 * (1 - t);
  }
}

// ── Pool sizes ────────────────────────────────────────────────────────────────
const DEATH_POOL_SIZE = 12;
const BIRTH_POOL_SIZE = 8;
const PREY_POOL_SIZE = 8;

export class EffectsManager {
  constructor(scene) {
    this._scene = scene;

    // Death: white burst
    this._deathPool = Array.from(
      { length: DEATH_POOL_SIZE },
      () => new BurstEffect(scene, 0xffffff, 6, 70, 0.3, 1.8),
    );
    // Birth: cyan ring expanding
    this._birthPool = Array.from(
      { length: BIRTH_POOL_SIZE },
      () => new RingEffect(scene, 0x00ffe7, 0.5),
    );
    // Predation: red burst
    this._preyPool = Array.from(
      { length: PREY_POOL_SIZE },
      () => new BurstEffect(scene, 0xff2200, 5, 55, 0.28, 2),
    );
  }

  death(x, y) {
    const e = this._deathPool.find((e) => !e.active);
    if (e) e.trigger(x, y);
  }

  birth(x, y, radius = 0) {
    const e = this._birthPool.find((e) => !e.active);
    if (e) e.trigger(x, y, radius);
  }

  predation(x, y) {
    const e = this._preyPool.find((e) => !e.active);
    if (e) e.trigger(x, y);
  }

  update(dt) {
    this._deathPool.forEach((e) => e.update(dt));
    this._birthPool.forEach((e) => e.update(dt));
    this._preyPool.forEach((e) => e.update(dt));
  }
}
