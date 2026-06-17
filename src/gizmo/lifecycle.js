/**
 * lifecycle.js – Gizmo reproduction helper.
 * Extracted from Gizmo.js to keep file sizes small.
 */

import { Gizmo } from "../Gizmo.js";
import { mutateColor } from "./colors.js";

/**
 * Clone parent Gizmo into a child with slight mutations.
 * Returns the new Gizmo instance, or null if reproduction not ready.
 */
export function reproduce(parent, config) {
  if (!parent.readyToReproduce) return null;

  const childGenes = {
    vision:
      parent.genes.vision + (Math.random() - 0.5) * config.nnMutationDelta,
    visionRange: parent.genes.visionRange.slice(),
    size: parent.genes.size + (Math.random() - 0.5) * config.nnMutationDelta,
  };

  const childNN = parent.nn.clone();
  childNN.mutate(config.nnMutationRate, config.nnMutationDelta);
  const childColor = mutateColor(parent.color, 0.04);

  const child = new Gizmo(parent._scene, config, {
    vision: childGenes.vision,
    visionRange: childGenes.visionRange,
    size: Math.max(config.sizeMin, Math.min(config.sizeMax, childGenes.size)),
    nn: childNN,
    identity: parent.identity,
    lineageHue: parent.lineageHue,
    color: childColor,
  });

  parent.reproductionEnergy = 0;
  parent.readyToReproduce = false;

  return child;
}
