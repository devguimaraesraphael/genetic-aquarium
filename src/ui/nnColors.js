/**
 * nnColors.js – color helper functions for the NN visualizer canvas.
 * Extracted from nnDrawer.js to keep file sizes small.
 */

/** Map activation value in [-1,1] to an RGBA fill color string */
export function actColor(a) {
  if (a >= 0) {
    return `rgba(${Math.round(40 + a * 20)},${Math.round(140 + a * 100)},${Math.round(200 + a * 55)},1)`;
  }
  const t = -a;
  return `rgba(${Math.round(200 + t * 40)},${Math.round(50 - t * 30)},${Math.round(50 - t * 30)},1)`;
}

/** Map weight value to an RGBA stroke color string */
export function edgeColor(w, alpha = 0.55) {
  const t = Math.max(0, Math.min(1, (Math.tanh(w) + 1) / 2));
  const r =
    t < 0.5 ? Math.round(180 - t * 200) : Math.round(30 + (t - 0.5) * 60);
  const g = Math.round(50 + (1 - Math.abs(t - 0.5) * 2) * 80);
  const b =
    t < 0.5 ? Math.round(40 + t * 100) : Math.round(90 + (t - 0.5) * 260);
  return `rgba(${r},${g},${b},${alpha})`;
}
