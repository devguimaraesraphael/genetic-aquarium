// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

function setupDom() {
  document.body.innerHTML = `
    <div id="gizmo-list"></div>
    <button id="aquarium-controls-btn">Aquarium Controls</button>
  `;
}

describe("gizmo list", () => {
  beforeEach(() => {
    setupDom();
    vi.resetModules();
  });

  it("selectGizmo highlights selected item and toggles off", async () => {
    const { gizmoList } = await import("../../src/ui/gizmoList.js");
    const g1 = { id: 1, identity: [0, 1, 0] };
    gizmoList.init({});
    gizmoList.updateList([g1]);

    gizmoList.selectGizmo(g1, false);
    expect(gizmoList.getSelectedGizmoId()).toBe(1);
    gizmoList.deselectGizmo(false);
    expect(gizmoList.getSelectedGizmoId()).toBeNull();
  });

  it("clicking a new item switches selection to new gizmo", async () => {
    const { gizmoList } = await import("../../src/ui/gizmoList.js");
    const g1 = { id: 1, identity: [0, 1, 0] };
    const g2 = { id: 2, identity: [0, 0, 1] };
    gizmoList.init({});
    gizmoList.updateList([g1, g2]);

    gizmoList.selectGizmo(g1, false);
    expect(gizmoList.getSelectedGizmoId()).toBe(1);

    gizmoList.selectGizmo(g2, false);
    expect(gizmoList.getSelectedGizmoId()).toBe(2);
  });
});
