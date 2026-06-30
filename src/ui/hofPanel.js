/**

* hofPanel.js – Hall of Fame panel (right side, collapsible, starts collapsed).
*
* Shows Hall of Fame DNA separately by type:
*
* Herbivores:
* * Historical Top 3
* * Latest Generation Top 3
* * Current Generation Top 3
*
* Carnivores:
* * Historical Top 3
* * Latest Generation Top 3
* * Current Generation Top 3
    */

const panel = document.getElementById("hof-panel");
const toggleBtn = document.getElementById("hof-panel-toggle");
const herbList = document.getElementById("hof-herb-list");
const carnList = document.getElementById("hof-carn-list");

let _collapsed = true;

if (toggleBtn && panel) {
  toggleBtn.addEventListener("click", () => {
    _collapsed = !_collapsed;

    panel.classList.toggle("collapsed", _collapsed);
    toggleBtn.textContent = _collapsed ? "▶" : "◀";
    toggleBtn.setAttribute(
      "aria-label",
      _collapsed ? "Expandir HoF" : "Colapsar HoF",
    );
  });
}
function _escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function _safeColor(value) {
  const color = String(value ?? "#888888");

  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#888888";
}

function _formatScore(score) {
  return Math.round(Number.isFinite(score) ? score : 0);
}

function _formatGeneration(generation) {
  return Number.isFinite(generation) ? ` · Gen ${generation}` : "";
}

function _rowHtml(snap) {
  const color = _safeColor(snap?.colorHex);
  const score = _formatScore(snap?.score);
  const id = _escapeHtml(snap?.id ?? "???");
  const generation = Number.isFinite(snap?.generation)
    ? `<span class="hof-generation">G${snap.generation}</span>`
    : "";

  return `<div class="hof-row"> <span class="hof-swatch" style="background:${color}"></span> <span class="hof-id">${id}</span>
${generation} <span class="hof-score">${score}</span>

  </div>`;
}

function _groupHtml(title, list, generation = null) {
  const items = Array.isArray(list) ? list : [];
  const genLabel = _formatGeneration(generation);

  return `<div class="hof-group"> <div class="hof-group-title">${_escapeHtml(title)}${genLabel}</div>
${
  items.length ? items.map(_rowHtml).join("") : '<div class="hof-empty">—</div>'
}

  </div>`;
}

/**
 * Re-render the panel with current HallOfFame data.
 * @param {import('../HallOfFame.js').HallOfFame} hallOfFame
 */
export function updateHofPanel(hallOfFame) {
  if (!herbList || !carnList || !hallOfFame) return;
  herbList.innerHTML = _groupHtml("🏆 Top Herbivores", hallOfFame.herbivores ?? []);
  carnList.innerHTML = _groupHtml("🏆 Top Carnivores", hallOfFame.carnivores ?? []);
}

const genOverlay = document.getElementById("gen-overlay");
const genHerbNum = document.getElementById("gen-herb-num");
const genCarnNum = document.getElementById("gen-carn-num");

/**

* Update the bottom-right generation counter.
* @param {{ herbGeneration?: number, carnGeneration?: number }} hofStats
  */
export function updateGenOverlay(hofStats) {
  if (!genHerbNum || !genCarnNum) return;

  genHerbNum.textContent = hofStats?.herbGeneration ?? 1;
  genCarnNum.textContent = hofStats?.carnGeneration ?? 1;

  if (genOverlay) genOverlay.classList.add("visible");
}
