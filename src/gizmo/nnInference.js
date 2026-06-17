/**
 * nnInference.js – NeuralNetwork inference wrapper with validation and fallback.
 * Extracted from Gizmo.js to keep file sizes small.
 */

/**
 * Run NN forward pass with full validation.
 * If config.nnDisabled is true (or no config provided), returns random [0,1] outputs.
 * Returns 3-element [0,1] array, or fallback [0.5,0.5,0.5] on any error.
 *
 * @param {NeuralNetwork} nn
 * @param {number[]} inputs – 12-element array (already sanitized)
 * @param {string|number} gizmoId – used in error log
 * @param {object} [config] – live config; checked for nnDisabled flag
 * @returns {{ outputs: number[], fault: boolean, reason: string, stack: string }}
 */
export function inferNN(nn, inputs, gizmoId, config) {
  // Disabled mode: skip NN entirely and return random outputs in [0,1]
  if (config?.nnDisabled) {
    return {
      outputs: [Math.random(), Math.random(), Math.random()],
      fault: false,
      reason: "",
      stack: "",
    };
  }
  try {
    const output = nn.forward(inputs);

    if (!Array.isArray(output) || output.length !== 3) {
      throw new Error("Invalid output: not 3-element array");
    }
    for (let i = 0; i < 3; i++) {
      if (!Number.isFinite(output[i])) {
        throw new Error(`non-finite NN output at index ${i}: ${output[i]}`);
      }
      if (output[i] < 0 || output[i] > 1) {
        throw new Error(`Invalid output[${i}]: ${output[i]} (not in [0,1])`);
      }
    }

    return { outputs: output, fault: false, reason: "", stack: "" };
  } catch (err) {
    console.error(`[Gizmo #${gizmoId} NN ERROR] ${err.message}\n${err.stack}`);
    return {
      outputs: [0.5, 0.5, 0.5],
      fault: true,
      reason: err.message,
      stack: err.stack,
    };
  }
}
