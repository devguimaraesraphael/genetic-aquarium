/**
 * guiModal.js – lil-gui modal overlay (open/close controls panel).
 * Extracted from guiSetup.js to keep file sizes small.
 */

/**
 * Set up the modal overlay that wraps lil-gui.
 * @param {GUI} gui
 * @param {{ value: boolean }} pauseRef – mutable pause flag shared with caller
 * @returns {{ openAquariumControls: Function, closeAquariumControls: Function }}
 */
export function setupGuiModal(gui, pauseRef) {
  let controlsOverlay = null;
  let pausedBeforeControls = false;

  function closeAquariumControls() {
    if (!controlsOverlay) return;
    gui.domElement.style.display = "none";
    document.body.appendChild(gui.domElement);
    controlsOverlay.remove();
    controlsOverlay = null;
    pauseRef.value = pausedBeforeControls;
  }

  function openAquariumControls() {
    if (controlsOverlay) return;
    pausedBeforeControls = pauseRef.value;
    pauseRef.value = true;

    controlsOverlay = document.createElement("div");
    controlsOverlay.id = "aq-controls-overlay";
    Object.assign(controlsOverlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0, 8, 18, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10001",
      backdropFilter: "blur(5px)",
    });

    const modal = document.createElement("div");
    Object.assign(modal.style, {
      position: "relative",
      maxHeight: "88vh",
      overflowY: "auto",
      padding: "12px",
      borderRadius: "12px",
      border: "1.5px solid #1a5e6e",
      background: "rgba(13, 34, 51, 0.96)",
      boxShadow: "0 12px 50px rgba(0, 160, 190, 0.22)",
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Fechar";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "10px",
      right: "10px",
      padding: "6px 12px",
      borderRadius: "7px",
      border: "1.5px solid #1a5e6e",
      background: "#112535",
      color: "#4af1f2",
      cursor: "pointer",
    });
    closeBtn.addEventListener("click", closeAquariumControls);

    Object.assign(gui.domElement.style, {
      display: "block",
      position: "static",
      marginTop: "34px",
      maxHeight: "80vh",
      overflowY: "auto",
    });

    modal.appendChild(closeBtn);
    modal.appendChild(gui.domElement);
    controlsOverlay.appendChild(modal);
    document.body.appendChild(controlsOverlay);
    controlsOverlay.addEventListener("click", (e) => {
      if (e.target === controlsOverlay) closeAquariumControls();
    });
  }

  return { openAquariumControls, closeAquariumControls };
}
