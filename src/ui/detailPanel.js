const PANEL_CSS = `
#aq-detail {
  position: fixed;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  background: rgba(9, 29, 53, 0.93);
  border: 1.5px solid #1a5e6e;
  border-radius: 12px;
  padding: 14px 16px 12px;
  width: 360px;
  color: #cce8f0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 12px;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(74,241,242,0.06);
  display: none;
  z-index: 100;
}
#aq-detail-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: #4af1f2;
}
.aq-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.aq-dswatch {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.25);
  flex-shrink: 0;
}
#aq-detail table {
  width: 100%;
  border-collapse: collapse;
}
#aq-detail td {
  padding: 3px 0;
}
#aq-detail td:first-child {
  color: #7ab0c8;
  padding-right: 10px;
}
#aq-detail td:last-child {
  color: #e8f8ff;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
#aq-detail-close {
  margin-top: 12px;
  width: 100%;
  padding: 5px;
  border-radius: 6px;
  border: 1px solid #1a5e6e;
  background: transparent;
  color: #7ab0c8;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.15s, color 0.15s;
}
#aq-detail-close:hover {
  background: #1a5e6e;
  color: #4af1f2;
}
#aq-starv-wrap {
  position: relative;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255,255,255,0.15);
}
#aq-starv-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #ff5f5f, #ffc34a, #47f58f);
  transition: width 0.12s linear;
}
#aq-starv-label {
  margin-top: 4px;
  font-size: 10px;
  color: #9fd0df;
  text-align: right;
}
#aq-nn-section {
  margin-top: 8px;
  border-top: 1px solid rgba(74,241,242,0.18);
  padding-top: 8px;
}
#aq-nn-inline {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid rgba(74,241,242,0.22);
  background: linear-gradient(180deg, rgba(8,24,42,0.95), rgba(7,18,32,0.95));
}
#aq-nn-error {
  margin-top: 6px;
  font-size: 10px;
  color: #ff8b8b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#aq-nn-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 7px;
  border-radius: 999px;
  border: 1px solid #4af1f2;
  color: #4af1f2;
  background: rgba(74,241,242,0.08);
}
#aq-nn-badge.error {
  border-color: #ff8b8b;
  color: #ff8b8b;
  background: rgba(255,139,139,0.1);
}
`;

let _el = null;
let _onClose = null;
let _nnIntervalId = null;

function _ensure() {
  if (_el) return;

  const style = document.createElement("style");
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);

  _el = document.createElement("div");
  _el.id = "aq-detail";
  _el.innerHTML = `
    <div id="aq-detail-title">
      <div class="aq-title-left">
        <span class="aq-dswatch" id="aq-dswatch"></span>
        <span id="aq-dtitle"></span>
      </div>
      <span id="aq-nn-badge">NN OK</span>
    </div>
    <table id="aq-dtable"></table>
    <div id="aq-nn-section">
      <canvas id="aq-nn-inline" width="330" height="260"></canvas>
      <div id="aq-nn-error" style="display:none"></div>
    </div>
    <button id="aq-detail-close">✕ Fechar</button>
  `;
  document.body.appendChild(_el);

  document.getElementById("aq-detail-close").addEventListener("click", () => {
    hide();
    if (_onClose) _onClose();
  });
}

export function show(gizmo, onClose) {
  _ensure();
  _onClose = onClose;
  _currentGizmo = gizmo;
  _el.style.display = "block";
  document.getElementById("aq-nn-section").style.display = "block";
  _startNNInlineLoop();
  update(gizmo);
}

export function showFood(food, onClose) {
  _ensure();
  _onClose = onClose;
  _el.style.display = "block";
  document.getElementById("aq-nn-section").style.display = "none";
  document.getElementById("aq-nn-badge").style.display = "none";
  _stopNNInlineLoop();
  updateFood(food);
}

export function hide() {
  if (_el) _el.style.display = "none";
  _stopNNInlineLoop();
  _currentGizmo = null;
}

export function update(gizmo) {
  if (!_el || _el.style.display === "none") return;
  _currentGizmo = gizmo;
  const d = gizmo.getDetails();
  const starvPct = Math.max(0, Math.min(1, d.starvationPct ?? 0));
  const nnBadge = document.getElementById("aq-nn-badge");
  nnBadge.style.display = "inline-block";
  nnBadge.textContent = d.nnFault ? "NN ERROR" : "NN OK";
  nnBadge.classList.toggle("error", !!d.nnFault);

  document.getElementById("aq-dswatch").style.background = d.colorHex;
  document.getElementById("aq-dtitle").textContent = `Gizmo #${d.id}`;
  document.getElementById("aq-dtable").innerHTML = `
    <tr><td>Tipo</td><td>${d.type}</td></tr>
    <tr><td>Cor</td><td><span style="font-family:monospace">${d.colorHex}</span> <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${d.colorHex};vertical-align:middle;border:1px solid rgba(255,255,255,0.3)"></span></td></tr>
    <tr><td>Tamanho</td><td>${d.size}</td></tr>
    <tr><td>Visão</td><td>${d.vision} px</td></tr>
    <tr><td>Score 🍃</td><td>${d.score}</td></tr>
    <tr><td>Idade</td><td>${d.age} s</td></tr>
    <tr>
      <td colspan="2" style="padding-top:6px;">
        <div style="color:#9fd0df;margin-bottom:3px;">Tempo sem comer</div>
        <div id="aq-starv-wrap"><div id="aq-starv-bar" style="width:${Math.round(starvPct * 100)}%"></div></div>
        <div id="aq-starv-label">${d.timeSinceEat} s</div>
      </td>
    </tr>
    <tr><td>Saída [ax,ay,eat]</td><td style="font-size:11px">${d.nnOut}</td></tr>
  `;

  const errEl = document.getElementById("aq-nn-error");
  if (d.nnFault) {
    errEl.style.display = "block";
    const reason = d.nnFaultReason || "falha desconhecida";
    let errorText = `Erro NN: ${reason}`;
    if (d.nnFaultStack) {
      errorText += `\n\n${d.nnFaultStack}`;
    }
    errEl.textContent = errorText;
    errEl.style.whiteSpace = "pre-wrap";
    errEl.style.wordBreak = "break-word";
    errEl.style.fontSize = "9px";
  } else {
    errEl.style.display = "none";
    errEl.textContent = "";
  }
}

let _currentGizmo = null;

export function updateFood(food) {
  if (!_el || _el.style.display === "none") return;
  const shapes = ["Triângulo", "Diamante", "Hexágono"];
  const atMax = food.waiting;
  const cooldown = food.cooldown ?? 0;
  const timeLeft = cooldown > 0 ? cooldown.toFixed(1) + "s" : "—";
  const phaseLabel = !atMax
    ? "🌱 Crescendo"
    : cooldown > 0
      ? "⏳ Aguardando"
      : "✨ Pronto p/ spawn";

  document.getElementById("aq-dswatch").style.background = "#66ff88";
  document.getElementById("aq-dtitle").textContent = "Food";
  document.getElementById("aq-dtable").innerHTML = `
    <tr><td>Tipo</td><td>Comida</td></tr>
    <tr><td>Forma</td><td>${shapes[food.shapeType] ?? "?"}</td></tr>
    <tr><td>Tamanho</td><td>${food.size.toFixed(2)} px</td></tr>
    <tr><td>Tamanho máx</td><td>${atMax ? "✔ sim" : "não"}</td></tr>
    <tr><td>Fase</td><td>${phaseLabel}</td></tr>
    <tr><td>Cooldown</td><td>${atMax ? (food.cooldown <= 0 ? "concluído" : food.cooldown.toFixed(1) + "s") : "—"}</td></tr>
    <tr><td>Próx. filhos em</td><td>${timeLeft}</td></tr>
    <tr><td>Pos X</td><td>${food.x.toFixed(1)}</td></tr>
    <tr><td>Pos Y</td><td>${food.y.toFixed(1)}</td></tr>
  `;
}

// ── NN Inspector modal (live Canvas) ─────────────────────────────────────────

const NN_INSPECTOR_CSS = `
#aq-nn-overlay {
  position:fixed;inset:0;background:rgba(0,8,18,.82);display:flex;
  align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(5px);
}
#aq-nn-modal {
  background:#0b1e30;border:1.5px solid #1a5e6e;border-radius:14px;
  padding:18px 22px 14px;max-width:96vw;
  color:#cce8f0;font-family:'Segoe UI',system-ui,sans-serif;font-size:12px;
  box-shadow:0 12px 50px rgba(0,160,190,.25);
}
#aq-nn-modal h2 { margin:0 0 10px;font-size:13px;color:#4af1f2;font-weight:600; }
#aq-nn-canvas { display:block;border-radius:8px; }
#aq-nn-close {
  margin-top:12px;width:100%;padding:7px;border-radius:7px;border:1.5px solid #1a5e6e;
  background:#112535;color:#4af1f2;cursor:pointer;font-size:12px;font-weight:600;
}
#aq-nn-close:hover { background:#1a5e6e; }
`;

const INPUT_LABELS = [
  "c_food",
  "c_herb",
  "c_carn",
  "c_dist",
  "c_ang",
  "n_food",
  "n_herb",
  "n_carn",
  "avg_d",
  "starv",
  "wall",
  "bias",
];
const OUTPUT_LABELS = ["ax", "ay", "eat"];

/** Map activation in [-1,1] to canvas fill colour */
function _actColor(a) {
  if (a >= 0) {
    const t = a;
    return `rgba(${Math.round(40 + t * 20)},${Math.round(140 + t * 100)},${Math.round(200 + t * 55)},1)`;
  } else {
    const t = -a;
    return `rgba(${Math.round(200 + t * 40)},${Math.round(50 - t * 30)},${Math.round(50 - t * 30)},1)`;
  }
}

/** Map weight to edge colour */
function _edgeColor(w, alpha = 0.55) {
  const t = Math.max(0, Math.min(1, (Math.tanh(w) + 1) / 2));
  const r =
    t < 0.5 ? Math.round(180 - t * 200) : Math.round(30 + (t - 0.5) * 60);
  const g = Math.round(50 + (1 - Math.abs(t - 0.5) * 2) * 80);
  const b =
    t < 0.5 ? Math.round(40 + t * 100) : Math.round(90 + (t - 0.5) * 260);
  return `rgba(${r},${g},${b},${alpha})`;
}

function _drawNN(ctx, gizmo, W, H) {
  // Guard: gizmo must be alive and have a valid NN with matching input size
  if (!gizmo || !gizmo.nn || !gizmo.nn.w1 || !gizmo.nn.w2) return;
  if (gizmo.isDead) return;

  const { w1, w2 } = gizmo.nn;
  const nIn = INPUT_LABELS.length; // 12
  const nH = w1.length;
  const nOut = OUTPUT_LABELS.length; // 3

  // Guard: weight matrices must have the right shape
  if (!nH || !w1[0] || w1[0].length !== nIn) return;
  if (w2.length !== nOut || !w2[0] || w2[0].length !== nH) return;

  // Snapshot inputs/outputs (never mutate them)
  const rawIn = gizmo._lastInputs;
  const rawOut = gizmo._lastOutputs;
  const inputs =
    rawIn && rawIn.length === nIn ? [...rawIn] : new Array(nIn).fill(0);
  const outputs =
    rawOut && rawOut.length === nOut ? [...rawOut] : new Array(nOut).fill(0);

  // Compute hidden activations from the snapshot
  const hidden = w1.map((row) =>
    Math.tanh(
      row.reduce(
        (s, v, i) =>
          s + (isFinite(v) && isFinite(inputs[i]) ? v * inputs[i] : 0),
        0,
      ),
    ),
  );

  // Clamp all values to [-1,1] so colours never go out of range
  const clamp = (v) => Math.max(-1, Math.min(1, isFinite(v) ? v : 0));
  const safeIn = inputs.map(clamp);
  const safeHid = hidden.map(clamp);
  const safeOut = outputs.map(clamp);

  const IN_R = 7;
  const HID_R = 12;
  const OUT_R = 10;
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

  // Wrap the entire draw in try/catch so a canvas error never propagates up
  try {
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "rgba(10, 33, 56, 0.85)");
    bg.addColorStop(1, "rgba(6, 20, 38, 0.85)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Layer title labels
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

    const drawEdges = (fromX, toX, fromYFn, toYFn, fromR, toR, matrix) => {
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
          ctx.strokeStyle = _edgeColor(wSafe, 0.55);
          ctx.lineWidth = thick;
          ctx.stroke();
        });
      });
    };

    drawEdges(COL[0], COL[1], inY, hidY, IN_R, HID_R, w1);
    drawEdges(COL[1], COL[2], hidY, outY, HID_R, OUT_R, w2);

    const drawNodes = (col, yFn, acts, labels, radius, side = "center") => {
      acts.forEach((a, i) => {
        const cx = col,
          cy = yFn(i);
        const col0 = _actColor(a);
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

        if (side === "left") {
          ctx.textAlign = "right";
          ctx.strokeText(label, cx - radius - 8, cy - 1);
          ctx.fillText(label, cx - radius - 8, cy - 1);
          ctx.font = "8px Segoe UI, sans-serif";
          ctx.strokeText(val, cx - radius - 8, cy + 9);
          ctx.fillText(val, cx - radius - 8, cy + 9);
        } else if (side === "right") {
          ctx.textAlign = "left";
          ctx.strokeText(label, cx + radius + 8, cy - 1);
          ctx.fillText(label, cx + radius + 8, cy - 1);
          ctx.font = "8px Segoe UI, sans-serif";
          ctx.strokeText(val, cx + radius + 8, cy + 9);
          ctx.fillText(val, cx + radius + 8, cy + 9);
        } else {
          ctx.textAlign = "center";
          ctx.strokeText(label, cx, cy - 3);
          ctx.fillText(label, cx, cy - 3);
          ctx.font = "8px Segoe UI, sans-serif";
          ctx.strokeText(val, cx, cy + 7);
          ctx.fillText(val, cx, cy + 7);
        }
      });
    };

    drawNodes(COL[0], inY, safeIn, INPUT_LABELS, IN_R, "left");
    drawNodes(
      COL[1],
      hidY,
      safeHid,
      safeHid.map((_, j) => `h${j}`),
      HID_R,
      "center",
    );
    drawNodes(COL[2], outY, safeOut, OUTPUT_LABELS, OUT_R, "right");
  } catch (err) {
    // Silently swallow canvas errors; never let them reach the main loop
    ctx.clearRect(0, 0, W, H);
  }
}

function openNNInspector(d, getGizmo) {
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

  // Use setInterval instead of RAF so it keeps running regardless of
  // whether the main simulation loop is paused, and doesn't compete with it.
  const intervalId = setInterval(() => {
    const g = getGizmo();
    if (!g || !overlay.parentNode) {
      clearInterval(intervalId);
      return;
    }
    if (g._lastOutputs) _drawNN(ctx, g, W, H);
  }, 32); // ~30fps is enough for the inspector

  const close = () => {
    clearInterval(intervalId);
    overlay.remove();
  };
  document.getElementById("aq-nn-close").onclick = close;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

function _startNNInlineLoop() {
  if (_nnIntervalId) return;
  const canvas = document.getElementById("aq-nn-inline");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  _nnIntervalId = setInterval(() => {
    if (!_currentGizmo || !_el || _el.style.display === "none") return;
    update(_currentGizmo);
    if (_currentGizmo._lastOutputs) _drawNN(ctx, _currentGizmo, 330, 260);
  }, 60);
}

function _stopNNInlineLoop() {
  if (!_nnIntervalId) return;
  clearInterval(_nnIntervalId);
  _nnIntervalId = null;
}
