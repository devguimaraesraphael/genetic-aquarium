export const gizmoList = (() => {
  const listContainer = document.getElementById("gizmo-list");
  const btn = document.getElementById("aquarium-controls-btn");
  const panel = document.getElementById("gizmo-list-panel");
  const toggleBtn = document.getElementById("gizmo-list-toggle");

  // Track which gizmo item is currently hovered (for visual feedback)
  let hoveredGizmoId = null;
  let selectedGizmoId = null;

  // Map gizmo ID to DOM element for quick lookup
  const gizmoItems = new Map();
  let lastListKey = "";

  let onHover = null;
  let onUnhover = null;
  let onSelect = null;
  let onDeselect = null;
  let onControlsClick = null;
  let onListLeave = null;

  function init(callbacks) {
    onHover = callbacks.onHover || (() => {});
    onUnhover = callbacks.onUnhover || (() => {});
    onSelect = callbacks.onSelect || (() => {});
    onDeselect = callbacks.onDeselect || (() => {});
    onControlsClick = callbacks.onControlsClick || (() => {});
    onListLeave = callbacks.onListLeave || (() => {});

    btn.addEventListener("click", () => {
      onControlsClick();
    });

    if (toggleBtn && panel) {
      toggleBtn.addEventListener("click", () => {
        const collapsed = panel.classList.toggle("collapsed");
        toggleBtn.textContent = collapsed ? "▶" : "◀";
        toggleBtn.setAttribute(
          "aria-label",
          collapsed ? "Expandir lista" : "Colapsar lista",
        );
      });
    }

    listContainer.addEventListener("mouseleave", () => {
      if (hoveredGizmoId !== null) {
        const hovered = gizmoItems.get(hoveredGizmoId);
        if (hovered) onUnhover(hovered.gizmo);
        hoveredGizmoId = null;
      }
      onListLeave();
    });
  }

  function updateList(gizmos) {
    const nextKey = gizmos.map((g) => g.id).join(",");
    if (nextKey === lastListKey) return;
    lastListKey = nextKey;

    const prevSelected = selectedGizmoId;
    const prevHovered = hoveredGizmoId;

    // Build new list while preserving state when possible
    listContainer.innerHTML = "";
    gizmoItems.clear();
    hoveredGizmoId = null;
    selectedGizmoId = null;

    gizmos.forEach((gizmo) => {
      const item = document.createElement("div");
      item.className = "gizmo-item";
      const type = gizmo.identity[1] === 1 ? "🌿" : "🔴";
      item.textContent = `${type} #${gizmo.id}`;
      item.dataset.gizmoId = gizmo.id;

      if (prevSelected === gizmo.id) {
        item.classList.add("selected");
        selectedGizmoId = gizmo.id;
      }
      if (prevHovered === gizmo.id) {
        hoveredGizmoId = gizmo.id;
      }

      // Hover effect
      item.addEventListener("mouseenter", () => {
        hoveredGizmoId = gizmo.id;
        onHover(gizmo);
      });

      item.addEventListener("mouseleave", () => {
        if (hoveredGizmoId === gizmo.id) {
          hoveredGizmoId = null;
          // Only unhover if not selected
          if (selectedGizmoId !== gizmo.id) {
            onUnhover(gizmo);
          }
        }
      });

      // Click to select/deselect
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        if (selectedGizmoId === gizmo.id) {
          // Deselect
          deselectGizmo(true);
        } else {
          // Select new gizmo
          selectGizmo(gizmo, true);
        }
      });

      listContainer.appendChild(item);
      gizmoItems.set(gizmo.id, { element: item, gizmo });
    });
  }

  function selectGizmo(gizmo, emit = true) {
    if (!gizmo) return;

    // Deselect previous
    if (selectedGizmoId !== null) {
      const prev = gizmoItems.get(selectedGizmoId);
      if (prev) {
        prev.element.classList.remove("selected");
      }
    }

    selectedGizmoId = gizmo.id;
    const item = gizmoItems.get(gizmo.id);
    if (item) {
      item.element.classList.add("selected");
    }
    if (emit) onSelect(gizmo);
  }

  function deselectGizmo(emit = true) {
    if (selectedGizmoId !== null) {
      const item = gizmoItems.get(selectedGizmoId);
      if (item) {
        item.element.classList.remove("selected");
      }
      selectedGizmoId = null;
    }
    if (emit) onDeselect();
  }

  function isGizmoSelected(gizmoId) {
    return selectedGizmoId === gizmoId;
  }

  function isGizmoHovered(gizmoId) {
    return hoveredGizmoId === gizmoId;
  }

  // When a gizmo dies, remove it from selection tracking
  function removeGizmo(gizmoId) {
    if (selectedGizmoId === gizmoId) {
      deselectGizmo(true);
    }
    gizmoItems.delete(gizmoId);
    lastListKey = "";
    if (hoveredGizmoId === gizmoId) {
      hoveredGizmoId = null;
    }
  }

  function getSelectedGizmoId() {
    return selectedGizmoId;
  }

  return {
    init,
    updateList,
    selectGizmo,
    deselectGizmo,
    isGizmoSelected,
    isGizmoHovered,
    getSelectedGizmoId,
    removeGizmo,
  };
})();
