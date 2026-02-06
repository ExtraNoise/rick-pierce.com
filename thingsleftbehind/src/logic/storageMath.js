// src/logic/storageMath.js

/**
 * Converts an item size (1–n) into capacity points.
 * Matches C# bit-shift logic.
 *
 * @param {number} size
 * @returns {number}
 */
export function capacityPointsFromSize(size) {
  return 1 << (size - 1);
}

/**
 * Returns true if an item of the given size can fit
 * within the remaining capacity points.
 *
 * @param {number} remainingCapacityPoints
 * @param {number} itemSize
 * @returns {boolean}
 */
export function canFit(remainingCapacityPoints, itemSize) {
  return remainingCapacityPoints >= capacityPointsFromSize(itemSize);
}
