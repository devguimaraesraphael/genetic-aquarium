/**
 * details.js – Gizmo.getDetails() serialization helper.
 * Extracted from Gizmo.js to keep file sizes small.
 */

import { IDENTITY_HERBIVORE } from "../Identity.js";

export function getGizmoDetails(gizmo) {
  const starvLimit = gizmo._config?.gizmoStarvation ?? 120;
  const wallLimit = gizmo._config?.gizmoMaxWallTime ?? 30;
  return {
    id: gizmo.id,
    type: gizmo.identity === IDENTITY_HERBIVORE ? "herbivore" : "carnivore",
    colorHex: "#" + gizmo.color.getHexString(),
    size: gizmo.genes.size.toFixed(2),
    vision: Math.round(
      gizmo.genes.visionRange?.[1] ?? gizmo.genes.visionRange?.[0] ?? 0,
    ),
    score: gizmo.score.toFixed(0),
    age: gizmo.age.toFixed(1),
    speed: gizmo.velocity.length().toFixed(1),
    timeSinceEat: gizmo.starvationCounter.toFixed(1),
    starvationPct: gizmo.starvationCounter / starvLimit,
    wallTime: (gizmo.wallTime ?? 0).toFixed(1),
    wallTimePct: Math.min(1, (gizmo.wallTime ?? 0) / wallLimit),
    nnOut: `[${gizmo._lastOutputs.map((x) => x.toFixed(3)).join(", ")}]`,
    nnFault: gizmo._nnFault,
    nnFaultReason: gizmo._nnFaultReason,
    nnFaultStack: gizmo._nnFaultStack,
  };
}
