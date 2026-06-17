// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { HallOfFame } from "../../src/HallOfFame.js";

const makeGizmo = ({ score, isHerb }) => ({
  score,
  genes: { size: 1, vision: 50, lineageHue: 0.5 },
  nn: {
    w1: [
      [0.1, 0.2],
      [0.3, 0.4],
    ],
    w2: [[0.5, 0.6, 0.7]],
  },
  identity: isHerb ? [0, 1, 0] : [0, 0, 1],
  colorHex: "#00ff00",
});

describe("Hall of Fame rules", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores top scores sorted desc and capped to top N", () => {
    const hof = new HallOfFame();
    [5, 20, 10, 30, 25, 1].forEach((score) => {
      hof.register(makeGizmo({ score, isHerb: true }));
    });
    expect(hof.herbivores.length).toBeLessThanOrEqual(5);
    const scores = hof.herbivores.map((x) => x.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("pickParents returns two entries when class has data", () => {
    const hof = new HallOfFame();
    hof.register(makeGizmo({ score: 10, isHerb: false }));
    hof.register(makeGizmo({ score: 12, isHerb: false }));
    const [a, b] = hof.pickParents("carnivores");
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
  });

  it("bestChampion chooses highest score across classes", () => {
    const hof = new HallOfFame();
    hof.register(makeGizmo({ score: 10, isHerb: true }));
    hof.register(makeGizmo({ score: 50, isHerb: false }));
    expect(hof.bestChampion().score).toBe(50);
  });
});
