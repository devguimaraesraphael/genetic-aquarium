/**
 * nnCanvas.js – draws edges and nodes on the NN visualizer canvas.
 * Extracted from nnDrawer.js to keep file sizes small.
 */

import { actColor, edgeColor } from "./nnColors.js";

export function drawEdges(ctx, fromX, toX, fromYFn, toYFn, fromR, toR, matrix) {
  matrix.forEach((row, j) => {
    row.forEach((w, i) => {
      const wSafe = isFinite(w) ? w : 0;
      const x1 = fromX + fromR,
        y1 = fromYFn(i);
      const x2 = toX - toR,
        y2 = toYFn(j);
      const thick = Math.max(0.3, Math.min(2.2, Math.abs(wSafe) * 1.2));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = edgeColor(wSafe, 0.55);
      ctx.lineWidth = thick;
      ctx.stroke();
    });
  });
}

export function drawNodes(
  ctx,
  col,
  yFn,
  acts,
  labels,
  radius,
  side = "center",
) {
  acts.forEach((a, i) => {
    const cx = col,
      cy = yFn(i);
    const col0 = actColor(a);
    const col25 = col0.replace(",1)", ",0.25)");
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.2);
    grad.addColorStop(0, col25 !== col0 ? col25 : "rgba(74,241,242,0.12)");
    grad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = col0;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.0;
    ctx.stroke();

    const label = labels[i] ?? "?";
    const val = a.toFixed(2);
    ctx.font = "700 9px Segoe UI, sans-serif";
    ctx.fillStyle = "#dffcff";
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = 2;

    const lx =
      side === "left"
        ? cx - radius - 8
        : side === "right"
          ? cx + radius + 8
          : cx;
    const ly = side === "center" ? cy - 3 : cy - 1;
    ctx.textAlign =
      side === "left" ? "right" : side === "right" ? "left" : "center";
    ctx.strokeText(label, lx, ly);
    ctx.fillText(label, lx, ly);
    ctx.font = "8px Segoe UI, sans-serif";
    const vy = side === "center" ? cy + 7 : cy + 9;
    ctx.strokeText(val, lx, vy);
    ctx.fillText(val, lx, vy);
  });
}
