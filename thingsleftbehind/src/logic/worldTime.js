// src/logic/worldTime.js

export const TimeUnit = {
  DAYS: "Days",
  WEEKS: "Weeks",
  MONTHS: "Months",
  YEARS: "Years",
};

export class WorldTime {
  /**
   * @param {number} apocalypseYear
   * @param {number} elapsedAmount
   * @param {string} elapsedUnit - one of TimeUnit
   */
  constructor(apocalypseYear, elapsedAmount = 0, elapsedUnit = TimeUnit.DAYS) {
    this.apocalypseYear = apocalypseYear;
    this.elapsedAmount = elapsedAmount;
    this.elapsedUnit = elapsedUnit;
  }

  /**
   * Returns the current in-world year.
   * Matches C# behavior.
   *
   * @returns {number}
   */
  getCurrentYear() {
    switch (this.elapsedUnit) {
      case TimeUnit.YEARS:
        return this.apocalypseYear + this.elapsedAmount;
      case TimeUnit.DAYS:
      case TimeUnit.WEEKS:
      case TimeUnit.MONTHS:
      default:
        return this.apocalypseYear;
    }
  }

  /**
   * Returns elapsed time converted to days.
   *
   * @returns {number}
   */
  getElapsedDays() {
    switch (this.elapsedUnit) {
      case TimeUnit.DAYS:
        return this.elapsedAmount;
      case TimeUnit.WEEKS:
        return this.elapsedAmount * 7;
      case TimeUnit.MONTHS:
        return this.elapsedAmount * 30;
      case TimeUnit.YEARS:
        return this.elapsedAmount * 365;
      default:
        return 0;
    }
  }
}
