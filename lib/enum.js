"use strict";

var endianness = require('os').endianness();

function isType(type, value) {
  return typeof(value) === type;
}

function isObject(value) {
  return isType('object', value);
}

function isString(value) {
  return isType('string', value);
}

function isEnumItem(value) {
  return (value instanceof EnumItem || (isObject(value) && value.key !== undefined && value.value !== undefined));
}


/**
 * Represents an Item of an Enum.
 * @param {String} key   The Enum key.
 * @param {Number} value The Enum value.
 */
function EnumItem(key, value, options) {
  this.key = key;
  this.value = value;

  this._options = options || {};
  this._options.ignoreCase = this._options.ignoreCase || false;
}

EnumItem.prototype = {

  /*constructor reference so that, this.constructor===EnumItem//=>true */
  constructor: EnumItem,

  /**
   * Checks if the flagged EnumItem has the passing object.
   * @param  {EnumItem || String || Number} value The object to check with.
   * @return {Boolean}                            The check result.
   */
  has: function(value) {
    if (isEnumItem(value)) {
      return (this.value & value.value) !== 0;
    } else if (isString(value)) {
      if (this._options.ignoreCase) {
        return this.key.toLowerCase().indexOf(value.toLowerCase()) >= 0;
      }
      return this.key.indexOf(value) >= 0;
    } else {
      return (this.value & value) !== 0;
    }
  },

  /**
   * Checks if the EnumItem is the same as the passing object.
   * @param  {EnumItem || String || Number} key The object to check with.
   * @return {Boolean}                          The check result.
   */
  is: function(key) {
    if (isEnumItem(key)) {
      return this.key === key.key;
    } else if (isString(key)) {
      if (this._options.ignoreCase) {
        return this.key.toLowerCase() === key.toLowerCase();
      }
      return this.key === key;
    } else {
      return this.value === key;
    }
  },

  /**
   * Returns String representation of this EnumItem.
   * @return {String} String representation of this EnumItem.
   */
  toString: function() {
    return this.key;
  },

  /**
   * Returns JSON object representation of this EnumItem.
   * @return {String} JSON object representation of this EnumItem.
   */
  toJSON: function() {
    return this.key;
  },

  /**
   * Returns the value to compare with.
   * @return {String} The value to compare with.
   */
  valueOf: function() {
    return this.value;
  }

};


/**
 * Represents an Enum with enum items.
 * @param {Array || Object}  map     This are the enum items.
 * @param {String || Object} options This are options. [optional]
 */
function Enum(map, options) {

  if (options && isString(options)) {
    options = { name: options };
  }

  this._options = options || {};
  this._options.separator = this._options.separator || ' | ';
  this._options.endianness = this._options.endianness || endianness;
  this._options.ignoreCase = this._options.ignoreCase || false;

  this.enums = [];

  if (map.length) {
    var array = map;
    map = {};

    for (var i = 0; i < array.length; i++) {
      map[array[i]] = Math.pow(2, i);
    }
  }

  for (var member in map) {
    if ((this._options.name && member === 'name') || member === '_options' || member === 'get' || member === 'getKey' || member === 'getValue' || member === 'enums' || member === 'isFlaggable') {
      throw new Error('Enum key "' + member + '" is a reserved word!');
    }
    this[member] = new EnumItem(member, map[member], { ignoreCase: this._options.ignoreCase });
    this.enums.push(this[member]);
  }

  if (this._options.ignoreCase) {
    this.getLowerCaseEnums = function () {
      var res = {};
      for (var i = 0, len = this.enums.length; i < len; i++) {
        res[this.enums[i].key.toLowerCase()] = this.enums[i];
      }
      return res;
    };
  }

  if (this._options.name) {
    this.name = this._options.name;
  }

  var self = this;

  function isFlaggable() {
    for (var i = 0, len = self.enums.length; i < len; i++) {
      var e = self.enums[i];

      if (!((e.value !== 0) && !(e.value & (e.value - 1)))) {
        return false;
      }
    }
    return true;
  }

  this.isFlaggable = isFlaggable();
  this.freezeEnums(); //this will make instances of Enum non-extensible
}

Enum.prototype = {

  /*constructor reference so that, this.constructor===Enum//=>true */
  constructor: Enum,

  /* implement the "ref type interface", so that Enum types can
   * be used in `node-ffi` function declarations and invokations.
   * In C, these Enums act as `uint32_t` types.
   *
   * https://github.com/TooTallNate/ref#the-type-interface
   */
  size: 4,
  indirection: 1,

  /**
   * Returns the appropriate EnumItem key.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {String}                           The get result.
   */
  getKey: function(value) {
    var item = this.get(value);
    if (item) {
      return item.key;
    } else {
      return 'Undefined';
    }
  },

  /**
   * Returns the appropriate EnumItem value.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {Number}                           The get result.
   */
  getValue: function(key) {
    var item = this.get(key);
    if (item) {
      return item.value;
    }
  },

  /**
   * Returns the appropriate EnumItem.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {EnumItem}                         The get result.
   */
  get: function(key, offset) {
    if (key === null || key === undefined) return;

    // Buffer instance support, part of the ref Type interface
    if (Buffer.isBuffer(key)) {
      key = key['readUInt32' + this._options.endianness](offset || 0);
    }

    if (isEnumItem(key)) {
      var foundIndex = this.enums.indexOf(key);
      if (foundIndex >= 0) {
        return key;
      }
      if (!this.isFlaggable || (this.isFlaggable && key.key.indexOf(this._options.separator) < 0)) {
        return null;
      }
      return this.get(key.key);
    } else if (isString(key)) {

      var enums = this;
      if (this._options.ignoreCase) {
        enums = this.getLowerCaseEnums();
        key = key.toLowerCase();
      }

      if (key.indexOf(this._options.separator) > 0) {
        var parts = key.split(this._options.separator);

        var value = 0;
        for (var i = 0; i < parts.length; i++) {
          var part = parts[i];

          value |= enums[part].value;
        }

        return new EnumItem(key, value);
      } else {
        return enums[key];
      }
    } else {
      for (var m in this) {
        if (this.hasOwnProperty(m)) {
          if (this[m].value === key) {
            return this[m];
          }
        }
      }

      var result = null;

      if (this.isFlaggable) {
        for (var n in this) {
          if (this.hasOwnProperty(n)) {
            if ((key & this[n].value) !== 0) {
              if (result) {
                result += this._options.separator;
              } else {
                result = '';
              }
              result += n;
            }
          }
        }
      }

      return this.get(result || null);
    }
  },

  /**
   * Sets the Enum "value" onto the give `buffer` at the specified `offset`.
   * Part of the ref "Type interface".
   *
   * @param  {Buffer} buffer The Buffer instance to write to.
   * @param  {Number} offset The offset in the buffer to write to. Default 0.
   * @param  {EnumItem || String || Number} value The EnumItem to write.
   */
  set: function (buffer, offset, value) {
    var item = this.get(value);
    if (item) {
      return buffer['writeUInt32' + this._options.endianness](item.value, offset || 0);
    }
  },

  /**
   * Define freezeEnums() as a property of the prototype.
   * make enumerable items nonconfigurable and deep freeze the properties. Throw Error on property setter.
   */
  freezeEnums: function() {
    function freezer(o) {
      var props = Object.getOwnPropertyNames(o);
      props.forEach( function(p){
        if (!Object.getOwnPropertyDescriptor(o, p).configurable) {
          return;
        }

        Object.defineProperties(o, p, {writable:false, configurable:false});
      })
      return o;
    }

    function getPropertyValue(value) {
      return value;
    }

    function deepFreezeEnums(o) {
      if (typeof o !== 'object' || o === null || Object.isFrozen(o) || Object.isSealed(o) ){
        return;
      }
      for (var key in o) {
        if (o.hasOwnProperty(key)) {
          o.__defineGetter__(key, getPropertyValue.bind(null, o[key]));
          o.__defineSetter__(key, function throwPropertySetError(value){throw TypeError("Cannot redefine property; Enum Type is not extensible.")});
          deepFreezeEnums(o[key]);
        }
      }
      if (Object.freeze) {
        Object.freeze(o);
      } else {
        freezer(o);
      }
    }

    deepFreezeEnums(this);

    return this;
  },
};


/**
 * Registers the Enum Type globally in node.js.
 * @param  {String} key Global variable. [optional]
 */
Enum.register = function(key) {
  key = key || 'Enum';
  if (!global[key]) {
    global[key] = Enum;
  }
};

module.exports = Enum;
