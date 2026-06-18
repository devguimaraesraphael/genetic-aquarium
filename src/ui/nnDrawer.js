/**
 * nnDrawer.js – renders a live Neural Network diagram to a Canvas 2D context.
 * Extracted from detailPanel.js to keep files small.
 */

import { NN_INSPECTOR_CSS } from "./detailPanelStyles.js";
import { actColor, edgeColor } from "./nnColors.js";
import { drawEdges, drawNodes } from "./nnCanvas.js";

export const INPUT_LABELS = [
  "c_food", // [0]  closest entity is food (0/1)
  "c_herb", // [1]  closest entity is herbivore (0/1)
  "c_carn", // [2]  closest entity is carnivore (0/1)
  "c_prox", // [3]  proximity to nearest (1=close, 0=far/none)
  "c_angle", // [4]  heading alignment (1=front, 0=behind, 0=none)
  "c_left", // [5]  target is left or front (1/0)
  "c_right", // [6]  target is right or front (1/0)
  "n_food", // [7]  food count in vision (0-1)
  "n_herb", // [8]  herbivore count in vision (0-1)
  "n_carn", // [9]  carnivore count in vision (0-1)
  "avg_d", // [10] avg distance of visible entities (0-1)
  "starv", // [11] starvation level (0=full, 1=dying)
  "wall", // [12] wall proximity (0=none, 1=wall)
  "bias", // [13] always 1.0
];
export const OUTPUT_LABELS = ["ax", "ay", "eat"];

export function drawNN(ctx, gizmo, W, H) {
  if (!gizmo || !gizmo.nn || !gizmo.nn.w1 || !gizmo.nn.w2) return;
  if (gizmo.isDead) return;

  const { w1, w2 } = gizmo.nn;
  const nIn = INPUT_LABELS.length;
  const nH = w1.length;
  const nOut = OUTPUT_LABELS.length;

  if (!nH || !w1[0] || w1[0].length !== nIn) return;
  if (w2.length !== nOut || !w2[0] || w2[0].length !== nH) return;

  const rawIn = gizmo._lastInputs;
  const rawOut = gizmo._lastOutputs;
  const inputs =
    rawIn && rawIn.length === nIn ? [...rawIn] : new Array(nIn).fill(0);
  const outputs =
    rawOut && rawOut.length === nOut ? [...rawOut] : new Array(nOut).fill(0);

  const hidden = w1.map((row) =>
    Math.tanh(
      row.reduce(
        (s, v, i) =>
          s + (isFinite(v) && isFinite(inputs[i]) ? v * inputs[i] : 0),
        0,
      ),
    ),
  );

  const clamp = (v) => Math.max(-1, Math.min(1, isFinite(v) ? v : 0));
  const safeIn = inputs.map(clamp);
  const safeHid = hidden.map(clamp);
  const safeOut = outputs.map(clamp);

  const IN_R = 7,
    HID_R = 12,
    OUT_R = 10;
  const COL = [64, W / 2, W - 64];

  const colY = (n, r) => {
    const top = 24 + r;
    const bottom = H - 14 - r;
    const span = Math.max(0, bottom - top);
    return (i) => (n <= 1 ? top + span / 2 : top + (span * i) / (n - 1));
  };

  const inY = colY(nIn, IN_R);
  const hidY = colY(nH, HID_R);
  const outY = colY(nOut, OUT_R);

  try {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "rgba(10, 33, 56, 0.85)");
    bg.addColorStop(1, "rgba(6, 20, 38, 0.85)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.font = "bold 10px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    [
      ["Inputs", COL[0]],
      ["Hidden", COL[1]],
      ["Outputs", COL[2]],
    ].forEach(([t, x]) => {
      ctx.fillStyle = "#86fbff";
      ctx.fillText(t.toUpperCase(), x, 14);
    });

    drawEdges(ctx, COL[0], COL[1], inY, hidY, IN_R, HID_R, w1);
    drawEdges(ctx, COL[1], COL[2], hidY, outY, HID_R, OUT_R, w2);

    drawNodes(ctx, COL[0], inY, safeIn, INPUT_LABELS, IN_R, "left");
    drawNodes(
      ctx,
      COL[1],
      hidY,
      safeHid,
      safeHid.map((_, j) => `h${j}`),
      HID_R,
      "center",
    );
    drawNodes(ctx, COL[2], outY, safeOut, OUTPUT_LABELS, OUT_R, "right");
  } catch (_err) {
    ctx.clearRect(0, 0, W, H);
  }
}

export function openNNInspector(d, getGizmo) {
  if (!document.getElementById("aq-nn-style")) {
    const s = document.createElement("style");
    s.id = "aq-nn-style";
    s.textContent = NN_INSPECTOR_CSS;
    document.head.appendChild(s);
  }

  const W = 620,
    H = 380;

  const overlay = document.createElement("div");
  overlay.id = "aq-nn-overlay";
  overlay.innerHTML = `
    <div id="aq-nn-modal">
      <h2>🔬 Rede Neural — Gizmo #${d.id} (${d.type})</h2>
      <canvas id="aq-nn-canvas" width="${W}" height="${H}"></canvas>
      <button id="aq-nn-close">Fechar</button>
    </div>`;
  document.body.appendChild(overlay);

  const canvas = document.getElementById("aq-nn-canvas");
  const ctx = canvas.getContext("2d");

  const intervalId = setInterval(() => {
    const g = getGizmo();
    if (!g || !overlay.parentNode) {
      clearInterval(intervalId);
      return;
    }
    if (g._lastOutputs) drawNN(ctx, g, W, H);
  }, 32);

  const close = () => {
    clearInterval(intervalId);
    overlay.remove();
  };
  document.getElementById("aq-nn-close").onclick = close;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}
