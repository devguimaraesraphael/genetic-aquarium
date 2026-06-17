// ── Helpers ───────────────────────────────────────────────────────────────────
function randMatrix(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.random() * 2 - 1),
  );
}

// Sigmoid activation: maps to [0, 1]
// Numerically stable implementation to avoid overflow
function sigmoid(x) {
  if (x >= 0) {
    return 1 / (1 + Math.exp(-x));
  } else {
    const ex = Math.exp(x);
    return ex / (1 + ex);
  }
}

/**
 * Minimal feedforward neural network (one hidden layer).
 *
 * Architecture:  inputSize → hiddenSize → outputSize
 * Activation:    tanh on hidden layer; mixed on output layer
 *
 * Inputs (always 12):
 *   [0-2] closest_identity – [food, herb, carn] flags (0 or 1)
 *   [3] closest_distance   – mapped 0-1 (0 = nearby, 1 = no target)
 *   [4] closest_angle      – mapped 0-1 (angle relative to facing)
 *   [5-7] count_*          – [food, herb, carn] visible count (normalized 0-1)
 *   [8] avg_distance       – average distance of all visible targets (0-1)
 *   [9] starvation         – mapped 0-1 (1 = just ate, 0 = about to die)
 *   [10] wallDistance      – mapped 0-1 (0 = no wall, 1 = against wall)
 *   [11] bias              – always 1.0
 *
 * Outputs (always 3):
 *   [0] ax          – sigmoid activation, range [0, 1]
 *   [1] ay          – sigmoid activation, range [0, 1]
 *   [2] eatDecision – sigmoid activation, range [0, 1]
 */
export class NeuralNetwork {
  /**
   * @param {number} inputSize
   * @param {number} hiddenSize
   * @param {number} outputSize
   */
  constructor(inputSize, hiddenSize, outputSize) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    // Weight matrices: w1[hiddenSize][inputSize], w2[outputSize][hiddenSize]
    this.w1 = randMatrix(hiddenSize, inputSize);
    this.w2 = randMatrix(outputSize, hiddenSize);
  }

  /**
   * Forward pass.
   * @param {number[]} inputs  array of length inputSize
   * @returns {number[]}       array of length outputSize
   *                          outputs[0] and outputs[1] in [0, 1] (sigmoid)
   *                          outputs[2] in [-1, 1] (tanh)
   */
  forward(inputs) {
    // Guard: validate that weight matrices exist and have the expected shape.
    // A mismatch (e.g. after crossover with wrong hiddenSize) must not crash.
    if (
      !Array.isArray(this.w1) ||
      this.w1.length !== this.hiddenSize ||
      !Array.isArray(this.w1[0]) ||
      this.w1[0].length !== this.inputSize ||
      !Array.isArray(this.w2) ||
      this.w2.length !== this.outputSize ||
      !Array.isArray(this.w2[0]) ||
      this.w2[0].length !== this.hiddenSize
    ) {
      throw new Error(
        `NN matrix shape mismatch: w1=${this.w1?.length}x${this.w1?.[0]?.length} ` +
          `(expected ${this.hiddenSize}x${this.inputSize}), ` +
          `w2=${this.w2?.length}x${this.w2?.[0]?.length} ` +
          `(expected ${this.outputSize}x${this.hiddenSize})`,
      );
    }

    // Sanitize: any NaN or Infinity input becomes 0 to avoid NaN propagation
    // (0 * Infinity = NaN in matrix multiply, which poisons the entire output)
    const safeInputs = inputs.map((v) => (Number.isFinite(v) ? v : 0));

    // Hidden layer (tanh activation)
    const h = new Array(this.hiddenSize);
    for (let j = 0; j < this.hiddenSize; j++) {
      let sum = 0;
      for (let i = 0; i < this.inputSize; i++)
        sum += this.w1[j][i] * safeInputs[i];
      h[j] = Math.tanh(sum);
    }
    // Output layer (all sigmoid for [0, 1] range)
    const out = new Array(this.outputSize);
    for (let k = 0; k < this.outputSize; k++) {
      let sum = 0;
      for (let j = 0; j < this.hiddenSize; j++) sum += this.w2[k][j] * h[j];
      // All outputs use sigmoid activation for [0, 1] range
      out[k] = sigmoid(sum);
    }
    return out;
  }

  /**
   * Deep-clone this network.
   * @returns {NeuralNetwork}
   */
  clone() {
    const nn = new NeuralNetwork(
      this.inputSize,
      this.hiddenSize,
      this.outputSize,
    );
    nn.w1 = this.w1.map((row) => [...row]);
    nn.w2 = this.w2.map((row) => [...row]);
    return nn;
  }

  /**
   * Mutate weights in-place.
   * Each weight independently has `rate` probability of being nudged by ±1%.
   * @param {number} rate  probability per weight (default 0.01 = every weight)
   * @param {number} delta max fractional change (default 0.01 = 1%)
   */
  mutate(rate = 1.0, delta = 0.01) {
    const _mutateRow = (row) => {
      for (let i = 0; i < row.length; i++) {
        if (Math.random() < rate) {
          row[i] += row[i] * (Math.random() * 2 - 1) * delta;
          // Guard: if weight became NaN or Infinity, reset to small random value
          if (!Number.isFinite(row[i])) {
            row[i] = (Math.random() * 2 - 1) * 2;
          }
        }
      }
    };
    this.w1.forEach(_mutateRow);
    this.w2.forEach(_mutateRow);
  }

  /**
   * Uniform crossover with another network.
   * Each weight is taken randomly from either this or `other` (50/50).
   * Returns a new NeuralNetwork — neither parent is modified.
   * @param {NeuralNetwork} other
   * @returns {NeuralNetwork}
   */
  crossover(other) {
    const child = new NeuralNetwork(
      this.inputSize,
      this.hiddenSize,
      this.outputSize,
    );
    child.w1 = this.w1.map((row, j) =>
      row.map((w, i) => (Math.random() < 0.5 ? w : other.w1[j][i])),
    );
    child.w2 = this.w2.map((row, k) =>
      row.map((w, j) => (Math.random() < 0.5 ? w : other.w2[k][j])),
    );
    return child;
  }
}
