/**
 * Shared live-config object.
 * All values are read by Gizmo.update() every frame,
 * so changing them via the GUI takes effect immediately.
 */
export const CONFIG = {
  // ── Physics ───────────────────────────────────────────────────────────────
  k: 0.001, // acceleration multiplier  →  newVel = (accel*k + vel)*l
  l: 0.001, // velocity scale factor    →  try l ≈ 0.98–1.0 for movement
  maxVelocity: 2, // maximum speed (units / normalised frame)

  // ── Gene defaults ─────────────────────────────────────────────────────────
  v1: 1, // vision range – inner bound
  v2: 2, // vision range – outer bound

  // ── Aquarium ──────────────────────────────────────────────────────────────
  aquariumWidth: 800,
  aquariumHeight: 500,
};
