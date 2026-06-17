/**
 * selection.js – select/deselect helpers for Gizmo.
 * Extracted from Gizmo.js to keep file sizes small.
 */

const IDENTITY_HERBIVORE = "herbivore";

function _setArrowColor(spikeMesh, color) {
  if (!spikeMesh) return;
  // spikeMesh may be a Group (arrow) or a plain Mesh (legacy)
  if (spikeMesh.isGroup) {
    spikeMesh.children.forEach((child) => {
      if (child.material) child.material.color.set(color);
    });
  } else if (spikeMesh.material) {
    spikeMesh.material.color.set(color);
  }
}

export function selectGizmo(gizmo) {
  gizmo._isSelected = true;
  if (gizmo.visionMesh) gizmo.visionMesh.visible = true;
  _setArrowColor(gizmo.spikeMesh, 0xffffff); // white arrow when selected
  if (gizmo._seenTargetMarker) gizmo._seenTargetMarker.visible = true;
}

export function deselectGizmo(gizmo) {
  gizmo._isSelected = false;
  if (gizmo.visionMesh) gizmo.visionMesh.visible = false;
  const defaultColor =
    gizmo.identity === IDENTITY_HERBIVORE ? 0xffff00 : 0xff4400;
  _setArrowColor(gizmo.spikeMesh, defaultColor);
  if (gizmo._seenTargetMarker) {
    gizmo._seenTargetMarker.visible = false;
  }
}
