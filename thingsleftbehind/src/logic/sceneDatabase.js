// src/logic/sceneDatabase.js

export class SceneData {
  constructor({
    id,
    description,
    affOwners = [],
    affVehicles = [],
    state = [],
    stateBias = {},
  }) {
    this.id = id;
    this.description = description;
    this.label = description
      .split(" ")
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(" ");

    this.affOwners = affOwners;
    this.affVehicles = affVehicles;
    this.state = state;
    this.stateBias = stateBias;
  }
}

/**
 * Holds all scenes and provides selection helpers.
 */
export class SceneDatabase {
  /**
   * @param {Object<string, Object>} scenesRaw
   */
  constructor(scenesRaw) {
    this.scenes = {};

    for (const key in scenesRaw) {
      this.scenes[key] = new SceneData({
        id: key,
        ...scenesRaw[key]
      });
    }
  }

  /**
   * Returns all scenes as an array (UI-friendly).
   *
   * @returns {SceneData[]}
   */
  getAllScenes() {
    return Object.values(this.scenes);
  }

  /**
   * Returns a scene by ID.
   *
   * @param {string} id
   * @returns {SceneData|null}
   */
  getSceneById(id) {
    return this.scenes[id] || null;
  }

  chooseRandomScene() {
    const keys = Object.keys(this.scenes);
    if (keys.length === 0) {
      throw new Error("SceneDatabase contains no scenes.");
    }

    const index = Math.floor(Math.random() * keys.length);
    return this.scenes[keys[index]];
  }
}
