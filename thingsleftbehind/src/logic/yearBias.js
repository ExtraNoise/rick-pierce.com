// src/logic/yearBias.js

/**
 * Returns a multiplier based on apocalypse year vs variant range.
 * - Before start year: 0 (cannot spawn)
 * - Between start and end: 1
 * - After end: decays smoothly toward 0
 *
 * @param {number} apocalypseYear
 * @param {number} startYear
 * @param {number} endYear
 * @returns {number}
 */
export function getMultiplier(apocalypseYear, startYear, endYear) {
  if (apocalypseYear < startYear) {
    return 0;
  }

  if (apocalypseYear <= endYear) {
    return 1;
  }

  // After end year: exponential decay
  const yearsPastEnd = apocalypseYear - endYear;

  // Tunable decay constant (matches C#)
  const decayRate = 0.15;

  return Math.exp(-decayRate * yearsPastEnd);
}
