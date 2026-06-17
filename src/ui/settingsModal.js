import { MODAL_CSS } from "./settingsModal.styles.js";

export function openSettingsModal(config, presets, onApply) {
  // inject stylesheet once
  if (!document.getElementById("aq-modal-style")) {
    const style = document.createElement("style");
    style.id = "aq-modal-style";
    style.textContent = MODAL_CSS;
    document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.id = "aq-overlay";

  overlay.innerHTML = `
    <div id="aq-modal">
      <h2>⚙ &nbsp;Aquarium Settings</h2>

      <h3>Presets</h3>
      <div class="aq-presets">
        ${presets
          .map(
            (p, i) => `
          <button class="aq-preset-btn" data-idx="${i}"
            style="background: linear-gradient(140deg, ${p.lights[0].color} -20%, ${p.bg} 55%, ${p.lights[2].color} 130%);">
            ${p.name}
          </button>`,
          )
          .join("")}
      </div>

      <h3>Aquarium</h3>
      ${rangeField("aquariumWidth", "Width", config.aquariumWidth, 400, 3840, 10)}
      ${rangeField("aquariumHeight", "Height", config.aquariumHeight, 200, 2160, 10)}
      ${colorField("aquariumBg", "Water color", config.aquariumBg)}
      ${colorField("aquariumBorder", "Border color", config.aquariumBorder)}
      ${colorField("aquariumLine", "Frame line", config.aquariumLine)}

      <h3>Lights</h3>
      ${config.lights
        .map(
          (l, i) => `
        <div class="aq-light-card">
          <div class="aq-light-label">${l.label}</div>
          ${colorField(`light${i}Color`, "Color", l.color)}
          ${rangeField(`light${i}ScaleX`, "Width", l.scaleX, 50, 1200, 10)}
          ${rangeField(`light${i}ScaleY`, "Height", l.scaleY, 50, 900, 10)}
        </div>`,
        )
        .join("")}

      <div class="aq-actions">
        <button class="aq-btn" id="aq-close-btn">Close</button>
        <button class="aq-btn primary" id="aq-apply-btn">Apply</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // live range display
  overlay.querySelectorAll("input[type=range]").forEach((input) => {
    const span = input.nextElementSibling;
    input.addEventListener("input", () => {
      if (span) span.textContent = input.value;
    });
  });

  // preset buttons
  overlay.querySelectorAll(".aq-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      applyPresetToForm(overlay, presets[+btn.dataset.idx]),
    );
  });

  const closeModal = () => overlay.remove();
  document.getElementById("aq-close-btn").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.getElementById("aq-apply-btn").addEventListener("click", () => {
    readFormIntoConfig(overlay, config);
    onApply();
    closeModal();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rangeField(id, label, value, min, max, step) {
  return `
    <div class="aq-field">
      <label>${label}</label>
      <input type="range" id="aq-${id}" min="${min}" max="${max}" step="${step}" value="${value}">
      <span class="aq-val">${value}</span>
    </div>`;
}

function colorField(id, label, value) {
  return `
    <div class="aq-field">
      <label>${label}</label>
      <input type="color" id="aq-${id}" value="${value}">
    </div>`;
}

function applyPresetToForm(overlay, preset) {
  setVal(overlay, "aquariumBg", preset.bg);
  setVal(overlay, "aquariumBorder", preset.border);
  setVal(overlay, "aquariumLine", preset.line);
  preset.lights.forEach((l, i) => {
    setVal(overlay, `light${i}Color`, l.color);
    setVal(overlay, `light${i}ScaleX`, l.scaleX);
    setVal(overlay, `light${i}ScaleY`, l.scaleY);
  });
}

function setVal(overlay, id, value) {
  const el = overlay.querySelector(`#aq-${id}`);
  if (!el) return;
  el.value = value;
  if (el.type === "range") {
    const span = el.nextElementSibling;
    if (span) span.textContent = value;
  }
}

function readFormIntoConfig(overlay, config) {
  config.aquariumWidth = +overlay.querySelector("#aq-aquariumWidth").value;
  config.aquariumHeight = +overlay.querySelector("#aq-aquariumHeight").value;
  config.aquariumBg = overlay.querySelector("#aq-aquariumBg").value;
  config.aquariumBorder = overlay.querySelector("#aq-aquariumBorder").value;
  config.aquariumLine = overlay.querySelector("#aq-aquariumLine").value;
  config.lights.forEach((l, i) => {
    l.color = overlay.querySelector(`#aq-light${i}Color`).value;
    l.scaleX = +overlay.querySelector(`#aq-light${i}ScaleX`).value;
    l.scaleY = +overlay.querySelector(`#aq-light${i}ScaleY`).value;
  });
}
