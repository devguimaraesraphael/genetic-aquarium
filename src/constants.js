/**
 * Shared live-config object.
 * All values are read by Gizmo.update() every frame,
 * so changing them via the GUI takes effect immediately.
 */
export const CONFIG = {
  // ── Physics ───────────────────────────────────────────────────────────────
  //   newVel = (accel * k + vel) * l     (applied per-second via dt)
  //   position += newVel * dt
  k: 0.08, // acceleration contribution (0–1)
  l: 0.92, // velocity retention per second (0=stop,1=no friction)
  maxVelocity: 120, // px / second

  // ── Gene ranges (applied when creating gizmos) ────────────────────────────
  visionMin: 35,
  visionMax: 90,
  sizeMin: 0.6,
  sizeMax: 1.4,

  // ── Aquarium dimensions (overridden on first load to window size) ─────────
  aquariumWidth: 1200,
  aquariumHeight: 700,

  // ── Aquarium colors ───────────────────────────────────────────────────────
  aquariumBg: "#091d35",
  aquariumBorder: "#1a5e6e",
  aquariumLine: "#4af1f2",

  // ── Lights – subtler opacity and smaller spread ───────────────────────────
  lights: [
    { label: "Top-Left", color: "#00dcc8", scaleX: 280, scaleY: 220 },
    { label: "Top-Right", color: "#50a0ff", scaleX: 260, scaleY: 200 },
    { label: "Bottom-Center", color: "#14b482", scaleX: 320, scaleY: 190 },
  ],

  // ── Food ──────────────────────────────────────────────────────────────────
  foodInitial: 40, // seeds at start
  foodMaxCount: 400, // hard cap (was 2000 – too many)
  foodMinSize: 2, // px at birth
  foodSpawnSize: 5, // px – max size / spawn trigger (small squares)
  foodGrowthRate: 1.5, // px / second
  foodSpawnRadius: 40, // max px radius for child placement
  foodSpawnCooldown: 8, // seconds a food waits at max size before spawning again
  // ── Population ────────────────────────────────────────────────────────────
  gizmoCount: 20, // number of gizmos created on start/restart
  carnivoreRatio: 0.1, // fraction of initial gizmos that are carnivores

  // ── Neural Network ──────────────────────────────────────────────────────
  nnHiddenSize: 6, // neurons in hidden layer
  nnAccelScale: 300, // max acceleration magnitude (px/s²)
  nnMutationRate: 1.0, // probability per weight of being mutated
  nnMutationDelta: 0.01, // max fractional change per mutation (1%)
  nnDisabled: false, // set to true in GUI to skip NN and use random outputs

  // ── Reproduction ──────────────────────────────────────────────────────
  scoreToReproduce: 5, // food/kills before a gizmo can clone
  reproductionCooldown: 15, // seconds after birth (or last clone) before reproducing again

  // ── Lifespan ──────────────────────────────────────────────────────────
  gizmoMaxAge: 600, // seconds before a gizmo dies of old age (10 min)
  gizmoStarvation: 120, // seconds a gizmo can go without eating (2 min)
  gizmoMaxWallTime: 30, // seconds of continuous wall contact before death
};

// ── Aquarium presets ──────────────────────────────────────────────────────────
export const AQUARIUM_PRESETS = [
  {
    name: "Ocean Deep",
    bg: "#091d35",
    border: "#1a5e6e",
    line: "#4af1f2",
    lights: [
      { color: "#00dcc8", scaleX: 280, scaleY: 220 },
      { color: "#50a0ff", scaleX: 260, scaleY: 200 },
      { color: "#14b482", scaleX: 320, scaleY: 190 },
    ],
  },
  {
    name: "Volcano Rift",
    bg: "#1a0805",
    border: "#7a2510",
    line: "#ff6030",
    lights: [
      { color: "#ff4400", scaleX: 300, scaleY: 230 },
      { color: "#ff9020", scaleX: 260, scaleY: 200 },
      { color: "#cc2200", scaleX: 340, scaleY: 200 },
    ],
  },
  {
    name: "Bioluminescent",
    bg: "#030820",
    border: "#1a1050",
    line: "#8060ff",
    lights: [
      { color: "#4020ff", scaleX: 280, scaleY: 220 },
      { color: "#a030ff", scaleX: 260, scaleY: 200 },
      { color: "#20c0ff", scaleX: 320, scaleY: 190 },
    ],
  },
];
