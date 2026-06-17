export function createCameraSelectionRules() {
  const state = {
    fixed: null,
    hovered: null,
    zoom: 1.0,
    targetX: 0,
    targetY: 0,
  };

  const applyFocus = (gizmo) => {
    if (!gizmo) {
      state.zoom = 1.0;
      state.targetX = 0;
      state.targetY = 0;
      return;
    }
    state.zoom = 3.5;
    state.targetX = gizmo.position.x;
    state.targetY = gizmo.position.y;
  };

  return {
    onListSelectToggle(gizmo) {
      if (state.fixed && state.fixed.id === gizmo.id) {
        state.fixed = null;
        state.hovered = null;
        state.zoom = 1.0;
        state.targetX = 0;
        state.targetY = 0;
        return { type: "deselect", fixed: null };
      }
      state.fixed = gizmo;
      state.hovered = null;
      applyFocus(gizmo);
      return { type: "select", fixed: gizmo };
    },

    onListHover(gizmo) {
      if (state.fixed) return { type: "ignored" };
      state.hovered = gizmo;
      applyFocus(gizmo);
      return { type: "hover", fixed: null };
    },

    onListUnhover(gizmo) {
      if (state.fixed) return { type: "ignored" };
      if (state.hovered && state.hovered.id === gizmo.id) {
        state.hovered = null;
        state.zoom = 1.0;
        state.targetX = 0;
        state.targetY = 0;
      }
      return { type: "unhover", fixed: null };
    },

    onListLeave() {
      if (state.fixed) return { type: "ignored" };
      state.hovered = null;
      state.zoom = 1.0;
      state.targetX = 0;
      state.targetY = 0;
      return { type: "leave", fixed: null };
    },

    onAquariumSelect(gizmo) {
      state.fixed = gizmo;
      state.hovered = null;
      applyFocus(gizmo);
      return { type: "select", fixed: gizmo };
    },

    clear() {
      state.fixed = null;
      state.hovered = null;
      state.zoom = 1.0;
      state.targetX = 0;
      state.targetY = 0;
      return { type: "clear", fixed: null };
    },

    getState() {
      return {
        fixed: state.fixed,
        hovered: state.hovered,
        zoom: state.zoom,
        targetX: state.targetX,
        targetY: state.targetY,
      };
    },

    getFollowGizmo() {
      return state.fixed || state.hovered;
    },

    syncFollowTarget() {
      const gizmo = state.fixed || state.hovered;
      if (!gizmo) return;
      state.targetX = gizmo.position.x;
      state.targetY = gizmo.position.y;
    },
  };
}
