const MODAL_CSS = `
#aq-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 8, 18, 0.80);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}
#aq-modal {
  background: #0d2233;
  border: 1.5px solid #1a5e6e;
  border-radius: 14px;
  padding: 28px 32px 24px;
  width: 500px;
  max-height: 88vh;
  overflow-y: auto;
  color: #cce8f0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  box-shadow: 0 12px 50px rgba(0, 160, 190, 0.22), 0 0 0 1px rgba(74,241,242,0.08);
  scrollbar-width: thin;
  scrollbar-color: #1a5e6e transparent;
}
#aq-modal h2 {
  margin: 0 0 18px;
  font-size: 15px;
  color: #4af1f2;
  letter-spacing: 0.06em;
  font-weight: 600;
}
#aq-modal h3 {
  margin: 20px 0 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #4af1f2;
  border-bottom: 1px solid #1a3d4e;
  padding-bottom: 5px;
}
.aq-field {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 9px;
}
.aq-field label {
  flex: 0 0 128px;
  color: #8ab4c8;
  font-size: 12px;
}
.aq-field input[type=range] {
  flex: 1;
  accent-color: #4af1f2;
  cursor: pointer;
}
.aq-field input[type=color] {
  width: 40px;
  height: 24px;
  border: 1px solid #1a5e6e;
  border-radius: 4px;
  cursor: pointer;
  background: none;
  padding: 1px;
}
.aq-field .aq-val {
  flex: 0 0 38px;
  text-align: right;
  color: #4af1f2;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.aq-presets {
  display: flex;
  gap: 10px;
}
.aq-preset-btn {
  flex: 1;
  padding: 12px 8px;
  border-radius: 9px;
  border: 1.5px solid rgba(255,255,255,0.12);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.7);
  transition: border-color 0.18s, transform 0.12s;
  letter-spacing: 0.02em;
}
.aq-preset-btn:hover {
  border-color: #fff;
  transform: scale(1.04);
}
.aq-light-card {
  margin-bottom: 12px;
  padding: 11px 14px;
  border-radius: 8px;
  border: 1px solid #1a3a4a;
  background: rgba(255,255,255,0.02);
}
.aq-light-label {
  color: #4af1f2;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  margin-bottom: 8px;
}
.aq-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}
.aq-btn {
  padding: 8px 22px;
  border-radius: 7px;
  border: 1.5px solid #1a5e6e;
  background: #112535;
  color: #cce8f0;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.18s;
}
.aq-btn:hover { background: #1a5e6e; }
.aq-btn.primary {
  background: #1a5e6e;
  color: #4af1f2;
  border-color: #4af1f2;
  font-weight: 600;
}
.aq-btn.primary:hover { background: #2a8e9e; }
`;

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
