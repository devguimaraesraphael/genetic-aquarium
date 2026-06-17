import { PANEL_CSS } from "./detailPanelStyles.js";
import { drawNN, openNNInspector } from "./nnDrawer.js";

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
  const wallPct = Math.max(0, Math.min(1, d.wallTimePct ?? 0));
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
    <tr><td>Velocidade</td><td>${d.speed} px/s</td></tr>
    <tr><td>Score 🍃</td><td>${d.score}</td></tr>
    <tr><td>Idade</td><td>${d.age} s</td></tr>
    <tr>
      <td colspan="2" style="padding-top:6px;">
        <div style="color:#9fd0df;margin-bottom:3px;">Tempo sem comer</div>
        <div id="aq-starv-wrap"><div id="aq-starv-bar" style="width:${Math.round(starvPct * 100)}%"></div></div>
        <div id="aq-starv-label">${d.timeSinceEat} s</div>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="padding-top:6px;">
        <div style="color:#9fd0df;margin-bottom:3px;">Tempo preso na parede</div>
        <div id="aq-wall-wrap"><div id="aq-wall-bar" style="width:${Math.round(wallPct * 100)}%"></div></div>
        <div id="aq-wall-label">${d.wallTime} s</div>
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

function _startNNInlineLoop() {
  if (_nnIntervalId) return;
  const canvas = document.getElementById("aq-nn-inline");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  _nnIntervalId = setInterval(() => {
    if (!_currentGizmo || !_el || _el.style.display === "none") return;
    update(_currentGizmo);
    if (_currentGizmo._lastOutputs) drawNN(ctx, _currentGizmo, 330, 260);
  }, 60);
}

function _stopNNInlineLoop() {
  if (!_nnIntervalId) return;
  clearInterval(_nnIntervalId);
  _nnIntervalId = null;
}
