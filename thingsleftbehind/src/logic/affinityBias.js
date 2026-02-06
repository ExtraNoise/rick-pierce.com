// src/logic/affinityBias.js

// Tunable constants (match C#)
const MATCH_MULTIPLIER = 1.85;
const MISMATCH_MULTIPLIER = 0.3;
const NEUTRAL_MULTIPLIER = 1.0;

/**
 * Applies vehicle-type affinity to an item's base weight.
 *
 * @param {number} baseWeight
 * @param {string[] | null} itemAffVehicles
 * @param {string} vehicleType
 * @returns {number}
 */
export function applyVehicleAffinity(baseWeight, itemAffVehicles, vehicleType) {
  if (!itemAffVehicles || itemAffVehicles.length === 0) {
    return baseWeight * NEUTRAL_MULTIPLIER;
  }

  if (itemAffVehicles.includes(vehicleType)) {
    return baseWeight * MATCH_MULTIPLIER;
  }

  return baseWeight * MISMATCH_MULTIPLIER;
}

/**
 * Applies storage-location affinity to an item's base weight.
 *
 * @param {number} baseWeight
 * @param {string[] | null} itemAffStorage
 * @param {string} storageKey
 * @returns {number}
 */
export function applyStorageAffinity(baseWeight, itemAffStorage, storageKey) {
  if (!itemAffStorage || itemAffStorage.length === 0) {
    return baseWeight * NEUTRAL_MULTIPLIER;
  }

  if (itemAffStorage.includes(storageKey)) {
    return baseWeight * MATCH_MULTIPLIER;
  }

  return baseWeight * MISMATCH_MULTIPLIER;
}
