// ── Identity string constants ─────────────────────────────────────────────────
// Use these everywhere for identity comparisons (string === string is safe).
export const IDENTITY_HERBIVORE = "herbivore";
export const IDENTITY_CARNIVORE = "carnivore";
export const IDENTITY_FOOD = "food";

// Legacy vector format (kept for backward compatibility only – do not use for comparisons)
export const IDENTITY = {
  FOOD: [1, 0, 0],
  HERBIVORE: [0, 1, 0],
  CARNIVORE: [0, 0, 1],
};

export function identityLabel(id) {
  if (!id) return "?";
  if (id[1] === 1) return "Herbívoro";
  if (id[2] === 1) return "Carnívoro";
  return "Comida";
}
