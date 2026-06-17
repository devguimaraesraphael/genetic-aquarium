export function splitGizmosByType(gizmos) {
  const herbivores = [];
  const carnivores = [];

  gizmos.forEach((g) => {
    if (g.identity?.[1] === 1) herbivores.push(g);
    else if (g.identity?.[2] === 1) carnivores.push(g);
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
