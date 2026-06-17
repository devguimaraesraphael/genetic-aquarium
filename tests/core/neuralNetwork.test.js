import { describe, it, expect } from "vitest";
import { NeuralNetwork } from "../../src/NeuralNetwork.js";

describe("Neural network rules", () => {
  it("forward output size matches outputSize and is bounded by tanh", () => {
    const nn = new NeuralNetwork(12, 6, 3);
    const out = nn.forward(new Array(12).fill(0.5));
    expect(out.length).toBe(3);
    out.forEach((v) => {
      expect(v).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(-1);
    });
  });

  it("clone creates deep copy (weights independent)", () => {
    const nn = new NeuralNetwork(4, 3, 2);
    const cloned = nn.clone();
    cloned.w1[0][0] += 1;
    cloned.w2[0][0] -= 1;
    expect(cloned.w1[0][0]).not.toBe(nn.w1[0][0]);
    expect(cloned.w2[0][0]).not.toBe(nn.w2[0][0]);
  });

  it("crossover preserves architecture", () => {
    const a = new NeuralNetwork(12, 6, 3);
    const b = new NeuralNetwork(12, 6, 3);
    const child = a.crossover(b);
    expect(child.inputSize).toBe(12);
    expect(child.hiddenSize).toBe(6);
    expect(child.outputSize).toBe(3);
    expect(child.w1.length).toBe(6);
    expect(child.w2.length).toBe(3);
  });

  it("mutate with zero rate leaves weights unchanged", () => {
    const nn = new NeuralNetwork(4, 3, 2);
    const before = JSON.stringify({ w1: nn.w1, w2: nn.w2 });
    nn.mutate(0, 0.5);
    const after = JSON.stringify({ w1: nn.w1, w2: nn.w2 });
    expect(after).toBe(before);
  });
});
