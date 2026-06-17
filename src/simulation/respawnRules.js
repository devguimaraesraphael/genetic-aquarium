export function splitGizmosByType(gizmos) {
  const herbivores = [];
  const carnivores = [];

  gizmos.forEach((g) => {
    // identity is a STRING ("herbivore" / "carnivore") – never an array
    if (g.identity === "herbivore") herbivores.push(g);
    else if (g.identity === "carnivore") carnivores.push(g);
  });

  return { herbivores, carnivores };
}

export function getRespawnPlan(gizmos, total, carnRatio) {
  const { herbivores, carnivores } = splitGizmosByType(gizmos);
  const nCarns = Math.max(0, Math.round(total * carnRatio));
  const nHerbs = Math.max(1, total - nCarns);

  const fullExtinction = herbivores.length === 0 && carnivores.length === 0;

  return {
    herbivores,
    carnivores,
    fullExtinction,
    spawnHerbivores: herbivores.length === 0 ? nHerbs : 0,
    spawnCarnivores:
      carnivores.length === 0 && carnRatio > 0 ? Math.max(1, nCarns) : 0,
  };
}
