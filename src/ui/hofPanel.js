/**
 * hofPanel.js – Hall of Fame panel (right side, collapsible, starts collapsed).
 * Shows top N herbivores and carnivores with colour swatch, ID and score.
 */

const panel = document.getElementById("hof-panel");
const toggleBtn = document.getElementById("hof-panel-toggle");
const herbList = document.getElementById("hof-herb-list");
const carnList = document.getElementById("hof-carn-list");

let _collapsed = true;

if (toggleBtn) {
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

function _rowHtml(snap) {
  const color = snap.colorHex ?? "#888888";
  const score = Math.round(snap.score ?? 0);
  const id = snap.id ?? "???";
  return `<div class="hof-row">
    <span class="hof-swatch" style="background:${color}"></span>
    <span class="hof-id">${id}</span>
    <span class="hof-score">${score}</span>
  </div>`;
}

/**
 * Re-render the panel with current HallOfFame data.
 * @param {import('../HallOfFame.js').HallOfFame} hallOfFame
 */
export function updateHofPanel(hallOfFame) {
  if (!herbList || !carnList) return;

  const herbs = hallOfFame.herbivores ?? [];
  const carns = hallOfFame.carnivores ?? [];

  herbList.innerHTML = herbs.length
    ? herbs.map(_rowHtml).join("")
    : '<div class="hof-empty">—</div>';

  carnList.innerHTML = carns.length
    ? carns.map(_rowHtml).join("")
    : '<div class="hof-empty">—</div>';
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
  genHerbNum.textContent = hofStats.herbGeneration ?? 1;
  genCarnNum.textContent = hofStats.carnGeneration ?? 1;
  if (genOverlay) genOverlay.classList.add("visible");
}
