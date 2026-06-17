// ── Identity vectors ──────────────────────────────────────────────────────────
// [food, herbivore, carnivore]
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
