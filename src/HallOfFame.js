/**
 * Hall of Fame – stores the top-3 Gizmos per type (herbivore / carnivore).
 * "Best" = highest score at time of death.
 * Persisted to localStorage automatically.
 */

const HOF_KEY = "genetic-aquarium-hof";
const TOP_N = 10;

function _snapshot(gizmo) {
  return {
    id: gizmo.id,
    score: gizmo.score,
    genes: {
      size: gizmo.genes.size,
      vision: gizmo.genes.vision,
      lineageHue: gizmo.genes.lineageHue ?? Math.random(),
    },
    nnW1: gizmo.nn.w1.map((row) => [...row]),
    nnW2: gizmo.nn.w2.map((row) => [...row]),
    identity: gizmo.identity,
    colorHex: gizmo.color ? "#" + gizmo.color.getHexString() : "#888888",
  };
}

export class HallOfFame {
  constructor() {
    /** @type {Array} top-3 herbivores, sorted desc by score */
    this.herbivores = [];
    /** @type {Array} top-3 carnivores, sorted desc by score */
    this.carnivores = [];
    this._load();
  }

  // ── Convenience getters (best of each class) ─────────────────────────────
  get herbivore() {
    return this.herbivores[0] ?? null;
  }
  get carnivore() {
    return this.carnivores[0] ?? null;
  }

  // ── Persistence ─────────────────────────────────────────────────────────

  _load() {
    try {
      const raw = localStorage.getItem(HOF_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.herbivores)) this.herbivores = data.herbivores;
      if (Array.isArray(data.carnivores)) this.carnivores = data.carnivores;
      // Backwards compat: single-entry format from old version
      if (!data.herbivores && data.herbivore)
        this.herbivores = [data.herbivore];
      if (!data.carnivores && data.carnivore)
        this.carnivores = [data.carnivore];
    } catch {
      /* ignore */
    }
  }

  _save() {
    try {
      localStorage.setItem(
        HOF_KEY,
        JSON.stringify({
          herbivores: this.herbivores,
          carnivores: this.carnivores,
        }),
      );
    } catch {
      /* ignore */
    }
  }

  clear() {
    this.herbivores = [];
    this.carnivores = [];
    localStorage.removeItem(HOF_KEY);
  }

  // ── Registration ─────────────────────────────────────────────────────────

  /**
   * Called when a gizmo dies.
   * Inserts into the appropriate top-3 list if it qualifies.
   * @returns {boolean} true if this gizmo entered the top-3
   */
  register(gizmo) {
    const isHerb = gizmo.identity === "herbivore";
    const list = isHerb ? this.herbivores : this.carnivores;
    const snap = _snapshot(gizmo);

    // Only enter if score > 0 or list has room
    if (list.length < TOP_N || snap.score > list[list.length - 1].score) {
      list.push(snap);
      list.sort((a, b) => b.score - a.score);
      if (list.length > TOP_N) list.pop();
      this._save();
      return true;
    }
    return false;
  }

  // ── Champion selection ───────────────────────────────────────────────────

  /** Best across both classes. */
  bestChampion() {
    const h = this.herbivores[0] ?? null;
    const c = this.carnivores[0] ?? null;
    if (!h && !c) return null;
    if (!c) return h;
    if (!h) return c;
    return h.score >= c.score ? h : c;
  }

  /** Best score in the given slot (used by simulationTick for UI stats). */
  getBestScore(slot) {
    return (this[slot] ?? [])[0]?.score ?? 0;
  }

  /**
   * Returns a copy of the breeding pool for the given slot.
   * Used by simulationTick to check if HoF has data before spawning.
   */
  getBreedingPool(slot) {
    return [...(this[slot] ?? [])];
  }

  /**
   * No-op in the flat-list model — kept for API compatibility with simulationTick.
   * The flat list is always up-to-date; no generation finalization is needed.
   * @returns {boolean} always false
   */
  finalizeGeneration(_slot) {
    return false;
  }

  /**
   * Pick 2 parents from the breeding pool using tournament selection.
   * Draws `tournamentSize` candidates at random (with replacement), sorts
   * them by score descending, then returns the top two — biasing towards
   * higher-scoring individuals while preserving genetic variety.
   * @param {'herbivores'|'carnivores'} slot
   * @param {number} [tournamentSize=4] number of candidates to draw
   * @returns {[object|null, object|null]}
   */
  pickParents(slot, tournamentSize = 4) {
    const list = this[slot] ?? [];

    if (list.length === 0) return [null, null];
    if (list.length === 1) return [list[0], list[0]];

    const k = Math.min(tournamentSize, list.length);
    const sample = Array.from({ length: k },
      () => list[Math.floor(Math.random() * list.length)]);
    sample.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return [sample[0], sample[1] ?? sample[0]];
  }
}
