/** CSS strings for the detail panel and NN inspector */

export const PANEL_CSS = `
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
#aq-wall-wrap {
  position: relative;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255,255,255,0.15);
}
#aq-wall-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #ffcc00, #ff8800, #ff2222);
  transition: width 0.12s linear;
}
#aq-wall-label {
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

export const NN_INSPECTOR_CSS = `
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
