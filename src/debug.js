// Debug monitoring script to track gizmo state
// Add this to a browser console or include it in the page

export function monitorGizmoState(gizmos, foodManager) {
  const stats = {
    totalCreated: gizmos.length,
    alive: 0,
    dead: 0,
    withFault: 0,
    inFallback: 0,
    moving: 0,
    stationary: 0,
  };

  for (const g of gizmos) {
    if (g.isDead) {
      stats.dead++;
    } else {
      stats.alive++;

      if (g._nnFault) stats.withFault++;

      const isInFallback =
        g._lastOutputs &&
        g._lastOutputs[0] === 0.5 &&
        g._lastOutputs[1] === 0.5 &&
        g._lastOutputs[2] === 0.5;
      if (isInFallback) stats.inFallback++;

      const speed = g.velocity ? g.velocity.length() : 0;
      if (speed > 0.1) {
        stats.moving++;
      } else {
        stats.stationary++;
      }
    }
  }

  stats.foodCount = foodManager.foods.length;

  console.log("=== GIZMO STATE ===");
  console.log(
    `Total: ${stats.totalCreated}, Alive: ${stats.alive}, Dead: ${stats.dead}`,
  );
  console.log(`With NN Fault: ${stats.withFault}`);
  console.log(`In Fallback [0.5,0.5,0.5]: ${stats.inFallback}`);
  console.log(`Moving: ${stats.moving}, Stationary: ${stats.stationary}`);
  console.log(`Food Count: ${stats.foodCount}`);
  console.log("==================");

  return stats;
}

export function debugGizmo(gizmo) {
  if (!gizmo) {
    console.log("Gizmo not found");
    return;
  }

  console.log(`\n=== GIZMO #${gizmo.id} DEBUG ===`);
  console.log(
    `Position: (${gizmo.position.x.toFixed(2)}, ${gizmo.position.y.toFixed(2)})`,
  );
  console.log(
    `Velocity: (${gizmo.velocity.x.toFixed(2)}, ${gizmo.velocity.y.toFixed(2)})`,
  );
  console.log(
    `Acceleration: (${gizmo.acceleration.x.toFixed(2)}, ${gizmo.acceleration.y.toFixed(2)})`,
  );
  console.log(
    `Last Outputs: [${gizmo._lastOutputs?.map((v) => v.toFixed(2)).join(", ") || "null"}]`,
  );
  console.log(`NN Fault: ${gizmo._nnFault}`);
  console.log(`Fault Reason: ${gizmo._nnFaultReason}`);
  console.log(`Dead: ${gizmo.isDead}`);
  console.log(`Age: ${gizmo.age.toFixed(1)}s`);
  console.log(`Time Since Eat: ${gizmo.timeSinceEat.toFixed(1)}s`);
  console.log(`Mesh visible: ${gizmo.group?.visible}`);
  console.log(
    `In scene: ${gizmo._scene?.children.includes(gizmo.group) ? "Yes" : "No"}`,
  );
  console.log("=======================\n");
}
