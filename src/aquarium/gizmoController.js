/**
 * gizmoController.js – manages the gizmo population, selection, and list panel.
 * Extracted from main.js to keep file sizes small.
 */

import { Gizmo } from "../Gizmo.js";
import { IDENTITY_HERBIVORE, IDENTITY_CARNIVORE } from "../Identity.js";
import * as detailPanel from "../ui/detailPanel.js";

const RANDOM_RATE = 0.2; // 20% of each new generation is fully random

export class GizmoController {
  constructor(
    scene,
    config,
    { hallOfFame, hofStats, gizmoList, selectionRules },
  ) {
    this.scene = scene;
    this.config = config;
    this.hallOfFame = hallOfFame;
    this.hofStats = hofStats;
    this.gizmoList = gizmoList;
    this.selectionRules = selectionRules;

    this.gizmos = [];
    this.selectedGizmo = null;
    this.selectedFood = null;
  }

  createGizmos() {
    this.gizmos.forEach((g) => g.dispose());
    const n = this.config.gizmoCount ?? 20;
    const carnRatio = this.config.carnivoreRatio ?? 0.1;
    const herbCount = Math.round(n * (1 - carnRatio)) || n;
    let herbIdx = 0;
    this.gizmos = Array.from({ length: n }, () => {
      const isCarnivore = Math.random() < carnRatio;
      const opts = isCarnivore
        ? { identity: IDENTITY_CARNIVORE }
        : {
            identity: IDENTITY_HERBIVORE,
            lineageHue: herbIdx++ / Math.max(1, herbCount - 1),
          };
      return new Gizmo(this.scene, this.config, opts);
    });
    this.selectedGizmo = null;
    detailPanel.hide();
    this.updateGizmoList();
  }

  spawnGeneration(hofSlot, count, isCarnivore) {
    const id = isCarnivore ? IDENTITY_CARNIVORE : IDENTITY_HERBIVORE;
    const mutRate = this.config.nnMutationRate ?? 1.0;
    const mutDelta = this.config.nnMutationDelta ?? 0.01;

    for (let i = 0; i < count; i++) {
      if (Math.random() < RANDOM_RATE) {
        this.gizmos.push(new Gizmo(this.scene, this.config, { identity: id }));
        continue;
      }

      const [pA, pB] = this.hallOfFame.pickParents(hofSlot);
      const hueA = pA?.genes?.lineageHue ?? Math.random();
      const hueB = pB?.genes?.lineageHue ?? Math.random();
      const hue = Math.max(
        0,
        Math.min(
          1,
          (Math.random() < 0.5 ? hueA : hueB) + (Math.random() * 2 - 1) * 0.04,
        ),
      );

      const crossedSize =
        pA && pB
          ? Math.max(
              0.2,
              (Math.random() < 0.5 ? pA.genes.size : pB.genes.size) +
                (Math.random() * 2 - 1) * 0.1,
            )
          : undefined;
      const crossedVision =
        pA && pB
          ? (Math.random() < 0.5 ? pA.genes.vision : pB.genes.vision) +
            (Math.random() * 2 - 1) * 6
          : undefined;

      const g = new Gizmo(this.scene, this.config, {
        identity: id,
        lineageHue: hue,
        sizeOverride: crossedSize,
      });

      if (crossedVision !== undefined) {
        g.genes.vision = Math.max(g.bodyRadius * 1.6, crossedVision);
      }

      if (pA && pB) {
        g.nn.w1 = pA.nnW1.map((row, j) =>
          row.map((w, k) => (Math.random() < 0.5 ? w : pB.nnW1[j][k])),
        );
        g.nn.w2 = pA.nnW2.map((row, j) =>
          row.map((w, k) => (Math.random() < 0.5 ? w : pB.nnW2[j][k])),
        );
        g.nn.mutate(mutRate, mutDelta);
      }

      this.gizmos.push(g);
    }
  }

  updateGizmoList() {
    this.gizmoList.updateList(this.gizmos.filter((g) => !g.isDead));
  }

  setSelectedGizmo(gizmo) {
    this.gizmos.forEach((g) => g.deselect());
    this.selectedFood = null;
    this.selectedGizmo = gizmo;
    if (gizmo) {
      gizmo.select();
      detailPanel.show(gizmo, () => this.clearSelection());
    } else {
      detailPanel.hide();
    }
  }

  clearSelection() {
    this.gizmos.forEach((g) => g.deselect());
    this.selectedGizmo = null;
    this.selectedFood = null;
    detailPanel.hide();
    this.selectionRules.clear();
    this.gizmoList.deselectGizmo(false);
  }

  initGizmoListPanel(openAquariumControls) {
    this.gizmoList.init({
      onHover: (g) => this.selectionRules.onListHover(g),
      onUnhover: (g) => this.selectionRules.onListUnhover(g),
      onListLeave: () => this.selectionRules.onListLeave(),
      onSelect: (g) => {
        const result = this.selectionRules.onListSelectToggle(g);
        this.setSelectedGizmo(result.fixed);
      },
      onDeselect: () => {
        const result = this.selectionRules.clear();
        this.setSelectedGizmo(result.fixed);
      },
      onControlsClick: () => openAquariumControls(),
    });
  }
}
