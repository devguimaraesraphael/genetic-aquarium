import { describe, it, expect } from "vitest";
import { createCameraSelectionRules } from "../../src/ui/cameraSelectionRules.js";

const g1 = { id: 1, position: { x: 10, y: 20 } };
const g2 = { id: 2, position: { x: -30, y: 50 } };

describe("camera selection rules", () => {
  it("rule 1: click in list fixes and follows selected gizmo", () => {
    const rules = createCameraSelectionRules();
    rules.onListSelectToggle(g1);

    let state = rules.getState();
    expect(state.fixed.id).toBe(1);
    expect(state.zoom).toBe(3.5);

    g1.position.x = 99;
    g1.position.y = -42;
    rules.syncFollowTarget();
    state = rules.getState();
    expect(state.targetX).toBe(99);
    expect(state.targetY).toBe(-42);
  });

  it("rule 2: hover follows only when nothing is fixed", () => {
    const rules = createCameraSelectionRules();
    rules.onListHover(g2);
    let state = rules.getState();
    expect(state.hovered.id).toBe(2);
    expect(state.zoom).toBe(3.5);

    rules.onListSelectToggle(g1);
    rules.onListHover(g2);
    state = rules.getState();
    expect(state.fixed.id).toBe(1);
    expect(state.hovered).toBeNull();
  });

  it("rule 3: click selected item again resets zoom and origin", () => {
    const rules = createCameraSelectionRules();
    rules.onListSelectToggle(g1);
    rules.onListSelectToggle(g1);
    const state = rules.getState();
    expect(state.fixed).toBeNull();
    expect(state.zoom).toBe(1);
    expect(state.targetX).toBe(0);
    expect(state.targetY).toBe(0);
  });

  it("rule 4: leaving list without fixed resets zoom and origin", () => {
    const rules = createCameraSelectionRules();
    rules.onListHover(g2);
    rules.onListLeave();
    const state = rules.getState();
    expect(state.fixed).toBeNull();
    expect(state.hovered).toBeNull();
    expect(state.zoom).toBe(1);
    expect(state.targetX).toBe(0);
    expect(state.targetY).toBe(0);
  });

  it("rule 5: aquarium click forces fixed selection with zoom", () => {
    const rules = createCameraSelectionRules();
    const result = rules.onAquariumSelect(g2);
    const state = rules.getState();
    expect(result.fixed.id).toBe(2);
    expect(state.fixed.id).toBe(2);
    expect(state.zoom).toBe(3.5);
    expect(state.targetX).toBe(g2.position.x);
    expect(state.targetY).toBe(g2.position.y);
  });

  it("rule 6: clicking a new list item switches fixed selection", () => {
    const rules = createCameraSelectionRules();
    rules.onListSelectToggle(g1);
    let state = rules.getState();
    expect(state.fixed.id).toBe(1);

    rules.onListSelectToggle(g2);
    state = rules.getState();
    expect(state.fixed.id).toBe(2);
    expect(state.zoom).toBe(3.5);
    expect(state.targetX).toBe(g2.position.x);
    expect(state.targetY).toBe(g2.position.y);
  });
});
