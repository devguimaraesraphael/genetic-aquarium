import { describe, it, expect } from "vitest";
import { CONFIG } from "../../src/constants.js";

describe("config rules", () => {
  it("does not expose global showVision flag", () => {
    expect("showVision" in CONFIG).toBe(false);
  });
});
