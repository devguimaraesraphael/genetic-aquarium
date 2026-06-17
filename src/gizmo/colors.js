/**
 * colors.js – static color utilities for Gizmo.
 * Extracted from Gizmo.js to keep file sizes small.
 */

import * as THREE from "three";

/**
 * Mutate a color: clone it and shift hue by a random amount in [-delta, +delta].
 */
export function mutateColor(color, delta = 0.05) {
  const hsl = {};
  color.getHSL(hsl);
  const newH = (hsl.h + (Math.random() * 2 - 1) * delta + 1) % 1;
  return new THREE.Color().setHSL(newH, hsl.s, hsl.l);
}

/**
 * Crossover two colors: average their H, S, L values using circular hue mean.
 */
export function crossoverColor(a, b) {
  const ha = {},
    hb = {};
  a.getHSL(ha);
  b.getHSL(hb);
  const dh = ((hb.h - ha.h + 1.5) % 1) - 0.5;
  return new THREE.Color().setHSL(
    (ha.h + dh * 0.5 + 1) % 1,
    (ha.s + hb.s) / 2,
    (ha.l + hb.l) / 2,
  );
}
