// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

function makeGizmoDetails() {
  return {
    id: 7,
    type: "Herbívoro",
    colorHex: "#00ff88",
    size: "1.00",
    vision: "70.0",
    speed: "42.3",
    score: 3,
    age: "12.5",
    timeSinceEat: "9.2",
    starvationPct: 0.65,
    nnOut: "[0.35, 0.65, 0.55]",
    nnFault: false,
    nnFaultReason: "",
  };
}

describe("detail panel layout and fields", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.resetModules();
  });

  it("shows selected gizmo panel on right with required fields and inline NN section", async () => {
    const panel = await import("../../src/ui/detailPanel.js");
    const gizmo = {
      getDetails: () => makeGizmoDetails(),
      nn: null,
      isDead: false,
      _lastOutputs: null,
    };

    panel.show(gizmo, () => {});

    const styleTag = Array.from(document.querySelectorAll("style")).find((s) =>
      s.textContent.includes("#aq-detail"),
    );
    expect(styleTag?.textContent).toContain("right: 16px;");

    const html = document.getElementById("aq-dtable").innerHTML;
    expect(html).toContain("Score");
    expect(html).toContain("Idade");
    expect(html).toContain("Velocidade");
    expect(html).toContain("Tempo sem comer");

    expect(html).not.toContain("Pos X");
    expect(html).not.toContain("Pos Y");
    expect(html).not.toContain("Aceleração");
    expect(html).not.toContain("Ativa");
    expect(html).not.toContain("Sensoriando");

    expect(document.getElementById("aq-starv-bar")).toBeTruthy();
    expect(document.getElementById("aq-nn-section").style.display).toBe(
      "block",
    );
    expect(document.getElementById("aq-nn-badge").textContent).toBe("NN OK");

    panel.hide();
  });

  it("shows NN error message when selected gizmo reports NN fault", async () => {
    const panel = await import("../../src/ui/detailPanel.js");
    const gizmo = {
      getDetails: () => ({
        ...makeGizmoDetails(),
        nnFault: true,
        nnFaultReason: "invalid NN output",
      }),
      nn: null,
      isDead: false,
      _lastOutputs: null,
    };

    panel.show(gizmo, () => {});

    const errEl = document.getElementById("aq-nn-error");
    expect(errEl).toBeTruthy();
    expect(errEl.style.display).toBe("block");
    expect(errEl.textContent).toContain("Erro NN");
    expect(errEl.textContent).toContain("invalid NN output");

    const badge = document.getElementById("aq-nn-badge");
    expect(badge.textContent).toBe("NN ERROR");
    expect(badge.classList.contains("error")).toBe(true);

    panel.hide();
  });
});
