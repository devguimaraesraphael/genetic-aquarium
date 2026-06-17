import { describe, it, expect } from "vitest";
import { IDENTITY, identityLabel } from "../../src/Identity.js";

describe("Identity rules", () => {
  it("identity vectors are one-hot by class", () => {
    expect(IDENTITY.FOOD).toEqual([1, 0, 0]);
    expect(IDENTITY.HERBIVORE).toEqual([0, 1, 0]);
    expect(IDENTITY.CARNIVORE).toEqual([0, 0, 1]);
  });

  it("identityLabel maps vectors to expected labels", () => {
    expect(identityLabel(IDENTITY.HERBIVORE)).toBe("Herbívoro");
    expect(identityLabel(IDENTITY.CARNIVORE)).toBe("Carnívoro");
    expect(identityLabel(IDENTITY.FOOD)).toBe("Comida");
    expect(identityLabel(null)).toBe("?");
  });
});
