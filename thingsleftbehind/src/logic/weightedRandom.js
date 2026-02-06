// src/logic/weightedRandom.js

/**
 * Selects a key from an object using weighted probability.
 * Weights do not need to sum to 1.
 *
 * @param {Object<string, number>} weights
 * @returns {string}
 */
export function choose(weights) {
  let totalWeight = 0;

  for (const key in weights) {
    if (weights[key] > 0) {
      totalWeight += weights[key];
    }
  }

  if (totalWeight <= 0) {
    throw new Error("WeightedRandom.choose called with no positive weights.");
  }

  let roll = Math.random() * totalWeight;
  let cumulative = 0;

  for (const key in weights) {
    const weight = weights[key];
    if (weight <= 0) continue;

    cumulative += weight;
    if (roll <= cumulative) {
      return key;
    }
  }

  // Fallback (floating point safety)
  for (const key in weights) {
    if (weights[key] > 0) {
      return key;
    }
  }

  throw new Error("WeightedRandom.choose failed unexpectedly.");
}

/**
 * Returns true with the given probability (0–1).
 *
 * @param {number} probability
 * @returns {boolean}
 */
export function roll(probability) {
  const clamped = Math.max(0, Math.min(1, probability));
  return Math.random() <= clamped;
}