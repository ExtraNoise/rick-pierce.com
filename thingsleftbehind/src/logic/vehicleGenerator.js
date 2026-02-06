// src/logic/vehicleGenerator.js

import { choose, roll } from "./weightedRandom.js";
import { getMultiplier as getYearMultiplier } from "./yearBias.js";
import { capacityPointsFromSize } from "./storageMath.js";
import {
  applyVehicleAffinity,
  applyStorageAffinity,
} from "./affinityBias.js";

export class VehicleGenerator {
  constructor({
    itemDb,
    vehicleDb,
    sceneDb,
    worldTime,
    scene = null
  }) {
    this.itemDb = itemDb;
    this.vehicleDb = vehicleDb;
    this.sceneDb = sceneDb;
    this.worldTime = worldTime;
    this.scene = scene;
  }

  chooseSafe(weightMap) {
    if (!weightMap || Object.keys(weightMap).length === 0) {
      return null;
    }

    // Filter out non-positive weights
    const filtered = {};
    for (const key in weightMap) {
      if (weightMap[key] > 0) {
        filtered[key] = weightMap[key];
      }
    }

    if (Object.keys(filtered).length === 0) {
      return null;
    }

    return choose(filtered);
  }

  /* -----------------------------
     VARIANT + STATE SELECTION
  ------------------------------*/

  chooseVariant(item, vehicle) {
    const weightedVariants = {};

    for (const variant of item.variants) {
      // HARD vehicle-era gate:
      // If the vehicle is newer than the variant's end,
      // this variant could never have existed in it.
      if (variant.end && vehicle.yearStart > variant.end) {
        continue;
      }

      // Soft time-based availability (invention + decay)
      const yearMultiplier = getYearMultiplier(
        this.worldTime.apocalypseYear,
        variant.start,
        variant.end
      );

      const finalWeight = variant.comVari * yearMultiplier;

      if (finalWeight > 0) {
        weightedVariants[variant.type] = finalWeight;
      }
    }

    if (Object.keys(weightedVariants).length === 0) {
      return null;
    }

    const chosenType = choose(weightedVariants);
    return item.variants.find(v => v.type === chosenType);
  }

  chooseStateWithDecay(item, elapsedDays) {
    const weightedStates = {};

    for (const stateKey in item.itmState) {
      weightedStates[stateKey] = item.itmState[stateKey].comState;
    }

    const initialState = choose(weightedStates);

    // Base pre-apocalypse age for items
    let age;

    if (item.category === "consumable_food") {
      age = Math.floor(Math.random() * 8);
    } else {
      age = Math.floor(Math.random() * 440);
    }

    age += elapsedDays;

    const stateData = item.itmState[initialState];

    if (stateData.decay == null) {
      return { state: initialState, ageDays: age };
    }

    const decayStates = Object.entries(item.itmState)
      .filter(([_, v]) => v.decay != null && v.ord != null)
      .sort((a, b) => a[1].ord - b[1].ord);

    let finalState = initialState;

    for (const [stateKey, data] of decayStates) {
      if (age >= data.decay) {
        finalState = stateKey;
      }
    }

    return { state: finalState, ageDays: age };
  }

  /* -----------------------------
     SCENE + VEHICLE SELECTION
  ------------------------------*/

  chooseScene() {
    return this.sceneDb.chooseRandomScene();
  }

  chooseVehicle(scene) {
    const preferred = [];
    const fallback = [];

    for (const vehicle of Object.values(this.vehicleDb)) {
      if (vehicle.yearStart > this.worldTime.apocalypseYear) continue;

      if (scene.affVehicles.includes(vehicle.type)) {
        preferred.push(vehicle);
      } else {
        fallback.push(vehicle);
      }
    }

    if (preferred.length > 0 && Math.random() < 0.85) {
      return preferred[Math.floor(Math.random() * preferred.length)];
    }

    if (fallback.length > 0) {
      return fallback[Math.floor(Math.random() * fallback.length)];
    }

    return null;
  }

  rollVehicleFullness() {
    return 0.3 + Math.random() * 0.9;
  }

  /* -----------------------------
     STORAGE + HANGERS
  ------------------------------*/

  getAllLocations(vehicle) {
    const locations = {};

    for (const [key, value] of Object.entries(vehicle)) {
      if (
        key.startsWith("stor") ||
        key.startsWith("seat") ||
        key.startsWith("seatUnder") ||
        key.startsWith("hang")
      ) {
        locations[key] = value;
      }
    }

    return locations;
  }

  getStorageLocations(vehicle) {
    const storages = {};

    for (const key in vehicle) {
      const data = vehicle[key];
      if (data && data.capacity > 0) {
        storages[key] = data;
      }
    }

    return storages;
  }

  getHangingPoints(vehicle) {
    const hangers = {};

    for (const key in vehicle) {
      const data = vehicle[key];
      if (data && data.exists === true) {
        hangers[key] = data;
      }
    }

    return hangers;
  }

  isHanger(key) {
    return key.startsWith("hang");
  }

  populateHanger(hangerKey, vehicle, itemSpawnCounts) {
    const results = [];

    if (Math.random() > 0.2) return results;

    const items = Object.entries(this.itemDb);
    const maxItems = 1 + Math.floor(Math.random() * 3);

    for (const [itemKey, item] of Object.entries(this.itemDb)) {
      const prior = itemSpawnCounts[itemKey] ?? 0;

      // Hard uniqueness rule: no repeats allowed
      if (prior > 0 && item.comRepeat === 0) {
        continue;
      }

      if (!this.itemPresence[itemKey]) continue;

      if (results.length >= maxItems) break;

      if (!item.affStorage || !item.affStorage.includes(hangerKey)) continue;

      const variant = this.chooseVariant(item, vehicle);
      if (!variant) continue;

      const elapsedDays = this.worldTime.getElapsedDays();
      const { state, ageDays } = this.chooseStateWithDecay(item, elapsedDays);

      // Determine bundle count
      let spawnCount = 1;

      if (variant.spawnGroup) {
        const min = variant.spawnGroup.min ?? 2;
        const max = variant.spawnGroup.max ?? min;
        spawnCount = min + Math.floor(Math.random() * (max - min + 1));
      }

      for (let i = 0; i < spawnCount; i++) {
        results.push({
          itemId: item.name,
          displayName: `${variant.type} ${item.name}`,
          variantType: variant.type,
          state,
          ageDays,
          size: item.size,
          isBundle: !!variant.spawnGroup,
          bundleMode: variant.spawnGroup?.mode ?? null,
        });
      }

      if (Math.random() > 0.6) break;
    }

    return results;
  }

  populateStorageLocation(storageKey, capacity, vehicle, itemSpawnCounts) {
    const results = [];

    let remainingCapacity = capacityPointsFromSize(capacity);

    if (storageKey.startsWith("seatUnder") && Math.random() > 0.95) return results;
    if (storageKey.startsWith("seat") && Math.random() > 0.35) return results;

    const fullness = Math.random();
    const items = Object.entries(this.itemDb);

    for (const [itemKey, item] of Object.entries(this.itemDb)) {
      const prior = itemSpawnCounts[itemKey] ?? 0;

      // HARD uniqueness rule: no repeats allowed
      if (prior > 0 && item.comRepeat === 0) {
        continue;
      }

      if (!this.itemPresence[itemKey]) continue;

      const itemPoints = capacityPointsFromSize(item.size);
      if (itemPoints > remainingCapacity) continue;

      let weight = item.comBase;

      weight = applyVehicleAffinity(weight, item.affVehicle, vehicle.type);
      weight = applyStorageAffinity(weight, item.affStorage, storageKey);

      if (prior > 0) {
        const repeatChance = item.repeatChance ?? 0.25;
        if (Math.random() > repeatChance) continue;
      }

      if (!roll(weight)) continue;

      const variant = this.chooseVariant(item, vehicle);
      if (!variant) continue;

      const elapsedDays = this.worldTime.getElapsedDays();
      const { state, ageDays } = this.chooseStateWithDecay(item, elapsedDays);

      // Determine bundle count
      let spawnCount = 1;

      if (variant.spawnGroup) {
        const min = variant.spawnGroup.min ?? 2;
        const max = variant.spawnGroup.max ?? min;
        spawnCount = min + Math.floor(Math.random() * (max - min + 1));
      }

      for (let i = 0; i < spawnCount; i++) {
        results.push({
          itemId: item.name,
          displayName: `${variant.type} ${item.name}`,
          variantType: variant.type,
          state,
          ageDays,
          size: item.size,
          isBundle: !!variant.spawnGroup,
          bundleMode: variant.spawnGroup?.mode ?? null,
        });
      }

      remainingCapacity -= itemPoints;
      itemSpawnCounts[itemKey] = (itemSpawnCounts[itemKey] ?? 0) + 1;

      if (Math.random() > fullness) break;
    }

    return results;
  }

  /* -----------------------------
     MAIN ENTRY POINT
  ------------------------------*/

  generateSingleVehicle() {
    this.itemPresence = {};

    for (const [itemKey, item] of Object.entries(this.itemDb)) {
      this.itemPresence[itemKey] = Math.random() < item.comBase;
    }

    const scene = this.scene ?? this.chooseScene();
    const vehicle = this.chooseVehicle(scene);
    if (!vehicle) return null;

    const itemSpawnCounts = {};

    const maxYear = Math.min(vehicle.yearEnd, this.worldTime.apocalypseYear);
    const year =
      vehicle.yearStart +
      Math.floor(Math.random() * (maxYear - vehicle.yearStart + 1));

    const state = this.chooseSafe(scene.stateBias);

    const generated = {
      vehicleData: vehicle,
      year,
      color: choose(vehicle.color),
      trim: vehicle.trim && Object.keys(vehicle.trim).length > 0
        ? choose(vehicle.trim)
        : null,
      transmission: vehicle.trans[Math.floor(Math.random() * vehicle.trans.length)],
      state: state ?? "unknown",
      contents: {},
    };

    // Initialize ALL storage locations as empty
    for (const storageKey of Object.keys(vehicle.storageAreas ?? {})) {
      generated.contents[storageKey] = [];
    }

    const locations = this.getAllLocations(vehicle);

    // Initialize all locations
    for (const key of Object.keys(locations)) {
      generated.contents[key] = [];
    }

    // Populate locations
    for (const key of Object.keys(locations)) {
      let items = [];

      if (key.startsWith("hang")) {
        items = this.populateHanger(key, vehicle, itemSpawnCounts);
      } else {
        const capacity = locations[key].capacity ?? 0;
        items = this.populateStorageLocation(
          key,
          capacity,
          vehicle,
          itemSpawnCounts
        );
      }

      generated.contents[key] = items;
    }

    return generated;
  }
}
