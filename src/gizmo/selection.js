/**
 * selection.js – select/deselect helpers for Gizmo.
 * Extracted from Gizmo.js to keep file sizes small.
 */

const IDENTITY_HERBIVORE = "herbivore";

export function selectGizmo(gizmo) {
  gizmo._isSelected = true;
  if (gizmo.visionMesh) gizmo.visionMesh.visible = true;
  if (gizmo.spikeMesh) gizmo.spikeMesh.material.color.set(0xff0000);
  if (gizmo._seenTargetMarker) gizmo._seenTargetMarker.visible = true;
}

export function deselectGizmo(gizmo) {
  gizmo._isSelected = false;
  if (gizmo.visionMesh) gizmo.visionMesh.visible = false;
  if (gizmo.spikeMesh) {
    gizmo.spikeMesh.material.color.set(
      gizmo.identity === IDENTITY_HERBIVORE ? 0xffff00 : 0xff0000,
    );
  }
  if (gizmo._seenTargetMarker) {
    gizmo._seenTargetMarker.visible = false;
    gizmo._seenTargetMarker.material.opacity = 0;
  }
}
