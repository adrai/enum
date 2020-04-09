import { isObject, isString } from './isType.js'

/**
 * Represents an Item of an Enum.
 * @param {String} key   The Enum key.
 * @param {Number} value The Enum value.
 */
export default class EnumItem {
  /* constructor reference so that, this.constructor===EnumItem//=>true */
  constructor (key, value, options = {}) {
    this.key = key
    this.value = value

    this._options = options
    this._options.ignoreCase = this._options.ignoreCase || false
  }

  /**
   * Checks if the flagged EnumItem has the passing object.
   * @param  {EnumItem || String || Number} value The object to check with.
   * @return {Boolean}                            The check result.
   */
  has (value) {
    if (EnumItem.isEnumItem(value)) {
      return (this.value & value.value) !== 0
    } else if (isString(value)) {
      if (this._options.ignoreCase) {
        return this.key.toLowerCase().indexOf(value.toLowerCase()) >= 0
      }
      return this.key.indexOf(value) >= 0
    } else {
      return (this.value & value) !== 0
    }
  }

  /**
   * Checks if the EnumItem is the same as the passing object.
   * @param  {EnumItem || String || Number} key The object to check with.
   * @return {Boolean}                          The check result.
   */
  is (key) {
    if (EnumItem.isEnumItem(key)) {
      return this.key === key.key
    } else if (isString(key)) {
      if (this._options.ignoreCase) {
        return this.key.toLowerCase() === key.toLowerCase()
      }
      return this.key === key
    } else {
      return this.value === key
    }
  }

  /**
   * Returns String representation of this EnumItem.
   * @return {String} String representation of this EnumItem.
   */
  toString () {
    return this.key
  }

  /**
   * Returns JSON object representation of this EnumItem.
   * @return {String} JSON object representation of this EnumItem.
   */
  toJSON () {
    return this.key
  }

  /**
   * Returns the value to compare with.
   * @return {String} The value to compare with.
   */
  valueOf () {
    return this.value
  }

  static isEnumItem (value) {
    return value instanceof EnumItem || (isObject(value) && value.key !== undefined && value.value !== undefined)
  }
};
