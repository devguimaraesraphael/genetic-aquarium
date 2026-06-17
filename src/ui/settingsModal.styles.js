/** CSS for the Aquarium Settings modal */
export const MODAL_CSS = `
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
