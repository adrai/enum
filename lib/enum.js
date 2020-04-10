import EnumItem from './enumItem.js'
import { isString, isNumber } from './isType.js'
import { indexOf } from './indexOf.js'

const isBuffer = (obj) => {
  return obj != null && obj.constructor != null &&
    typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

/**
 * Returns a string identifying the endianness of the CPU for which the Deno
 * binary was compiled. Possible values are 'BE' for big endian and 'LE' for
 * little endian.
 **/
const getEndianess = () => {
  // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView#Endianness
  const buffer = new ArrayBuffer(2)
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */)
  // Int16Array uses the platform's endianness.
  return new Int16Array(buffer)[0] === 256 ? 'LE' : 'BE'
}

const endianness = getEndianess()

/**
 * Represents an Enum with enum items.
 * @param {Array || Object}  map     This are the enum items.
 * @param {String || Object} options This are options. [optional]
 */
export default class Enum {
  constructor (map, options) {
    /* implement the "ref type interface", so that Enum types can
     * be used in `node-ffi` function declarations and invokations.
     * In C, these Enums act as `uint32_t` types.
     *
     * https://github.com/TooTallNate/ref#the-type-interface
     */
    this.size = 4
    this.indirection = 1

    if (options && isString(options)) {
      options = { name: options }
    }

    this._options = options || {}
    this._options.separator = this._options.separator || ' | '
    this._options.endianness = this._options.endianness || endianness
    this._options.ignoreCase = this._options.ignoreCase || false
    this._options.freez = this._options.freez || false // backword compatability
    this._options.freeze = this._options.freeze || this._options.freez || false

    this.enums = []

    if (map.length) {
      this._enumLastIndex = map.length
      var array = map
      map = {}

      for (var i = 0; i < array.length; i++) {
        map[array[i]] = Math.pow(2, i)
      }
    }

    for (var member in map) {
      guardReservedKeys(this._options.name, member)
      this[member] = new EnumItem(member, map[member], { ignoreCase: this._options.ignoreCase })
      this.enums.push(this[member])
    }
    this._enumMap = map

    if (this._options.ignoreCase) {
      this.getLowerCaseEnums = function () {
        var res = {}
        for (var i = 0, len = this.enums.length; i < len; i++) {
          res[this.enums[i].key.toLowerCase()] = this.enums[i]
        }
        return res
      }
    }

    if (this._options.name) {
      this.name = this._options.name
    }

    const isFlaggable = () => {
      for (var i = 0, len = this.enums.length; i < len; i++) {
        var e = this.enums[i]

        if (!(e.value !== 0 && !(e.value & e.value - 1))) {
          return false
        }
      }
      return true
    }

    this.isFlaggable = isFlaggable()
    if (this._options.freeze) {
      this.freezeEnums() // this will make instances of Enum non-extensible
    }
  }

  /**
   * Returns the appropriate EnumItem key.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {String}                           The get result.
   */
  getKey (value) {
    var item = this.get(value)
    if (item) {
      return item.key
    }
  }

  /**
   * Returns the appropriate EnumItem value.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {Number}                           The get result.
   */
  getValue (key) {
    var item = this.get(key)
    if (item) {
      return item.value
    }
  }

  /**
   * Returns the appropriate EnumItem.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {EnumItem}                         The get result.
   */
  get (key, offset) {
    if (key === null || key === undefined) {
      return
    } // Buffer instance support, part of the ref Type interface
    if (isBuffer(key)) {
      key = key['readUInt32' + this._options.endianness](offset || 0)
    }

    if (EnumItem.isEnumItem(key)) {
      var foundIndex = indexOf.call(this.enums, key)
      if (foundIndex >= 0) {
        return key
      }
      if (!this.isFlaggable || (this.isFlaggable && key.key.indexOf(this._options.separator) < 0)) {
        return
      }
      return this.get(key.key)
    } else if (isString(key)) {
      var enums = this
      if (this._options.ignoreCase) {
        enums = this.getLowerCaseEnums()
        key = key.toLowerCase()
      }

      if (key.indexOf(this._options.separator) > 0) {
        var parts = key.split(this._options.separator)

        var value = 0
        for (var i = 0; i < parts.length; i++) {
          var part = parts[i]

          value |= enums[part].value
        }

        return new EnumItem(key, value)
      } else {
        return enums[key]
      }
    } else {
      for (var m in this) {
        // eslint-disable-next-line no-prototype-builtins
        if (this.hasOwnProperty(m)) {
          if (this[m].value === key) {
            return this[m]
          }
        }
      }

      var result = null

      if (this.isFlaggable) {
        for (var n in this) {
          // eslint-disable-next-line no-prototype-builtins
          if (this.hasOwnProperty(n)) {
            if ((key & this[n].value) !== 0) {
              if (result) {
                result += this._options.separator
              } else {
                result = ''
              }
              result += n
            }
          }
        }
      }

      return this.get(result || null)
    }
  }

  /**
   * Sets the Enum "value" onto the give `buffer` at the specified `offset`.
   * Part of the ref "Type interface".
   *
   * @param  {Buffer} buffer The Buffer instance to write to.
   * @param  {Number} offset The offset in the buffer to write to. Default 0.
   * @param  {EnumItem || String || Number} value The EnumItem to write.
   */
  set (buffer, offset, value) {
    var item = this.get(value)
    if (item) {
      return buffer['writeUInt32' + this._options.endianness](item.value, offset || 0)
    }
  }

  /**
   * Define freezeEnums() as a property of the prototype.
   * make enumerable items nonconfigurable and deep freeze the properties. Throw Error on property setter.
   */
  freezeEnums () {
    function envSupportsFreezing () {
      return (
        Object.isFrozen && Object.isSealed &&
        Object.getOwnPropertyNames && Object.getOwnPropertyDescriptor &&
        Object.defineProperties && Object.__defineGetter__ && Object.__defineSetter__
      )
    }

    function freezer (o) {
      var props = Object.getOwnPropertyNames(o)
      props.forEach(function (p) {
        if (!Object.getOwnPropertyDescriptor(o, p).configurable) {
          return
        }

        Object.defineProperties(o, p, { writable: false, configurable: false })
      })
      return o
    }

    function getPropertyValue (value) {
      return value
    }

    function deepFreezeEnums (o) {
      if (typeof o !== 'object' || o === null || Object.isFrozen(o) || Object.isSealed(o)) {
        return
      }
      for (var key in o) {
        // eslint-disable-next-line no-prototype-builtins
        if (o.hasOwnProperty(key)) {
          o.__defineGetter__(key, getPropertyValue.bind(null, o[key]))
          o.__defineSetter__(key, function throwPropertySetError (value) {
            throw TypeError('Cannot redefine property; Enum Type is not extensible.')
          })
          deepFreezeEnums(o[key])
        }
      }
      if (Object.freeze) {
        Object.freeze(o)
      } else {
        freezer(o)
      }
    }

    if (envSupportsFreezing()) {
      deepFreezeEnums(this)
    }

    return this
  }

  /**
   * Return true whether the enumItem parameter passed in is an EnumItem object and
   * has been included as constant of this Enum
   * @param  {EnumItem} enumItem
   */
  isDefined (enumItem) {
    let condition = (e) => e === enumItem
    if (isString(enumItem) || isNumber(enumItem)) {
      condition = (e) => e.is(enumItem)
    }
    return this.enums.some(condition)
  }

  /**
   * Returns JSON object representation of this Enum.
   * @return {String} JSON object representation of this Enum.
   */
  toJSON () {
    return this._enumMap
  }

  /**
   * Extends the existing Enum with a New Map.
   * @param  {Array}  map  Map to extend from
   */
  extend (map) {
    if (map.length) {
      var array = map
      map = {}

      for (var i = 0; i < array.length; i++) {
        var exponent = this._enumLastIndex + i
        map[array[i]] = Math.pow(2, exponent)
      }

      for (var member in map) {
        guardReservedKeys(this._options.name, member)
        this[member] = new EnumItem(member, map[member], { ignoreCase: this._options.ignoreCase })
        this.enums.push(this[member])
      }

      for (var key in this._enumMap) {
        map[key] = this._enumMap[key]
      }

      this._enumLastIndex += map.length
      this._enumMap = map

      if (this._options.freeze) {
        this.freezeEnums() // this will make instances of new Enum non-extensible
      }
    }
  };

  /**
   * Registers the Enum Type globally in node.js.
   * @param  {String} key Global variable. [optional]
   */
  static register (key = 'Enum') {
    if (typeof global !== 'undefined' && !global[key]) {
      global[key] = Enum
    } else if (typeof window !== 'undefined' && !window[key]) {
      window[key] = Enum
    }
  }

  [Symbol.iterator] () {
    let index = 0
    return {
      next: () => index < this.enums.length ? { done: false, value: this.enums[index++] } : { done: true }
    }
  }
};

// private

var reservedKeys = ['_options', 'get', 'getKey', 'getValue', 'enums', 'isFlaggable', '_enumMap', 'toJSON', '_enumLastIndex']

function guardReservedKeys (customName, key) {
  if ((customName && key === 'name') || indexOf.call(reservedKeys, key) >= 0) {
    throw new Error(`Enum key ${key} is a reserved word!`)
  }
}
