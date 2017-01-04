!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Enum=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var os = _interopRequire(_dereq_("os"));

var EnumItem = _interopRequire(_dereq_("./enumItem"));

var _isType = _dereq_("./isType");

var isString = _isType.isString;
var isNumber = _isType.isNumber;

var indexOf = _dereq_("./indexOf").indexOf;

var isBuffer = _interopRequire(_dereq_("is-buffer"));

var endianness = os.endianness();

/**
 * Represents an Enum with enum items.
 * @param {Array || Object}  map     This are the enum items.
 * @param {String || Object} options This are options. [optional]
 */

var Enum = (function () {
  function Enum(map, options) {
    var _this = this;

    _classCallCheck(this, Enum);

    /* implement the "ref type interface", so that Enum types can
     * be used in `node-ffi` function declarations and invokations.
     * In C, these Enums act as `uint32_t` types.
     *
     * https://github.com/TooTallNate/ref#the-type-interface
     */
    this.size = 4;
    this.indirection = 1;

    if (options && isString(options)) {
      options = { name: options };
    }

    this._options = options || {};
    this._options.separator = this._options.separator || " | ";
    this._options.endianness = this._options.endianness || endianness;
    this._options.ignoreCase = this._options.ignoreCase || false;
    this._options.freez = this._options.freez || false;

    this.enums = [];

    if (map.length) {
      this._enumLastIndex = map.length;
      var array = map;
      map = {};

      for (var i = 0; i < array.length; i++) {
        map[array[i]] = Math.pow(2, i);
      }
    }

    for (var member in map) {
      guardReservedKeys(this._options.name, member);
      this[member] = new EnumItem(member, map[member], { ignoreCase: this._options.ignoreCase });
      this.enums.push(this[member]);
    }
    this._enumMap = map;

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

    var isFlaggable = function () {
      for (var i = 0, len = _this.enums.length; i < len; i++) {
        var e = _this.enums[i];

        if (!(e.value !== 0 && !(e.value & e.value - 1))) {
          return false;
        }
      }
      return true;
    };

    this.isFlaggable = isFlaggable();
    if (this._options.freez) {
      this.freezeEnums(); //this will make instances of Enum non-extensible
    }
  }

  /**
   * Returns the appropriate EnumItem key.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {String}                           The get result.
   */

  Enum.prototype.getKey = function getKey(value) {
    var item = this.get(value);
    if (item) {
      return item.key;
    }
  };

  /**
   * Returns the appropriate EnumItem value.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {Number}                           The get result.
   */

  Enum.prototype.getValue = function getValue(key) {
    var item = this.get(key);
    if (item) {
      return item.value;
    }
  };

  /**
   * Returns the appropriate EnumItem.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {EnumItem}                         The get result.
   */

  Enum.prototype.get = function get(key, offset) {
    if (key === null || key === undefined) {
      return;
    } // Buffer instance support, part of the ref Type interface
    if (isBuffer(key)) {
      key = key["readUInt32" + this._options.endianness](offset || 0);
    }

    if (EnumItem.isEnumItem(key)) {
      var foundIndex = indexOf.call(this.enums, key);
      if (foundIndex >= 0) {
        return key;
      }
      if (!this.isFlaggable || this.isFlaggable && key.key.indexOf(this._options.separator) < 0) {
        return;
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
                result = "";
              }
              result += n;
            }
          }
        }
      }

      return this.get(result || null);
    }
  };

  /**
   * Sets the Enum "value" onto the give `buffer` at the specified `offset`.
   * Part of the ref "Type interface".
   *
   * @param  {Buffer} buffer The Buffer instance to write to.
   * @param  {Number} offset The offset in the buffer to write to. Default 0.
   * @param  {EnumItem || String || Number} value The EnumItem to write.
   */

  Enum.prototype.set = function set(buffer, offset, value) {
    var item = this.get(value);
    if (item) {
      return buffer["writeUInt32" + this._options.endianness](item.value, offset || 0);
    }
  };

  /**
   * Define freezeEnums() as a property of the prototype.
   * make enumerable items nonconfigurable and deep freeze the properties. Throw Error on property setter.
   */

  Enum.prototype.freezeEnums = function freezeEnums() {
    function envSupportsFreezing() {
      return Object.isFrozen && Object.isSealed && Object.getOwnPropertyNames && Object.getOwnPropertyDescriptor && Object.defineProperties && Object.__defineGetter__ && Object.__defineSetter__;
    }

    function freezer(o) {
      var props = Object.getOwnPropertyNames(o);
      props.forEach(function (p) {
        if (!Object.getOwnPropertyDescriptor(o, p).configurable) {
          return;
        }

        Object.defineProperties(o, p, { writable: false, configurable: false });
      });
      return o;
    }

    function getPropertyValue(value) {
      return value;
    }

    function deepFreezeEnums(o) {
      if (typeof o !== "object" || o === null || Object.isFrozen(o) || Object.isSealed(o)) {
        return;
      }
      for (var key in o) {
        if (o.hasOwnProperty(key)) {
          o.__defineGetter__(key, getPropertyValue.bind(null, o[key]));
          o.__defineSetter__(key, function throwPropertySetError(value) {
            throw TypeError("Cannot redefine property; Enum Type is not extensible.");
          });
          deepFreezeEnums(o[key]);
        }
      }
      if (Object.freeze) {
        Object.freeze(o);
      } else {
        freezer(o);
      }
    }

    if (envSupportsFreezing()) {
      deepFreezeEnums(this);
    }

    return this;
  };

  /**
   * Return true whether the enumItem parameter passed in is an EnumItem object and 
   * has been included as constant of this Enum   
   * @param  {EnumItem} enumItem
   */

  Enum.prototype.isDefined = function isDefined(enumItem) {
    var condition = function (e) {
      return e === enumItem;
    };
    if (isString(enumItem) || isNumber(enumItem)) {
      condition = function (e) {
        return e.is(enumItem);
      };
    }
    return this.enums.some(condition);
  };

  /**
   * Returns JSON object representation of this Enum.
   * @return {String} JSON object representation of this Enum.
   */

  Enum.prototype.toJSON = function toJSON() {
    return this._enumMap;
  };

  /**
   * Extends the existing Enum with a New Map.
   * @param  {Array}  map  Map to extend from
   */

  Enum.prototype.extend = function extend(map) {
    if (map.length) {
      var array = map;
      map = {};

      for (var i = 0; i < array.length; i++) {
        var exponent = this._enumLastIndex + i;
        map[array[i]] = Math.pow(2, exponent);
      }

      for (var member in map) {
        guardReservedKeys(this._options.name, member);
        this[member] = new EnumItem(member, map[member], { ignoreCase: this._options.ignoreCase });
        this.enums.push(this[member]);
      }

      for (var key in this._enumMap) {
        map[key] = this._enumMap[key];
      }

      this._enumLastIndex += map.length;
      this._enumMap = map;

      if (this._options.freez) {
        this.freezeEnums(); //this will make instances of new Enum non-extensible
      }
    }
  };

  /**
   * Registers the Enum Type globally in node.js.
   * @param  {String} key Global variable. [optional]
   */

  Enum.register = function register() {
    var key = arguments[0] === undefined ? "Enum" : arguments[0];

    if (!global[key]) {
      global[key] = Enum;
    }
  };

  return Enum;
})();

module.exports = Enum;

// private

var reservedKeys = ["_options", "get", "getKey", "getValue", "enums", "isFlaggable", "_enumMap", "toJSON", "_enumLastIndex"];

function guardReservedKeys(customName, key) {
  if (customName && key === "name" || indexOf.call(reservedKeys, key) >= 0) {
    throw new Error("Enum key " + key + " is a reserved word!");
  }
}
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./enumItem":2,"./indexOf":3,"./isType":4,"is-buffer":6,"os":7}],2:[function(_dereq_,module,exports){
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _isType = _dereq_("./isType");

var isObject = _isType.isObject;
var isString = _isType.isString;

/**
 * Represents an Item of an Enum.
 * @param {String} key   The Enum key.
 * @param {Number} value The Enum value.
 */

var EnumItem = (function () {

  /*constructor reference so that, this.constructor===EnumItem//=>true */

  function EnumItem(key, value) {
    var options = arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, EnumItem);

    this.key = key;
    this.value = value;

    this._options = options;
    this._options.ignoreCase = this._options.ignoreCase || false;
  }

  /**
   * Checks if the flagged EnumItem has the passing object.
   * @param  {EnumItem || String || Number} value The object to check with.
   * @return {Boolean}                            The check result.
   */

  EnumItem.prototype.has = function has(value) {
    if (EnumItem.isEnumItem(value)) {
      return (this.value & value.value) !== 0;
    } else if (isString(value)) {
      if (this._options.ignoreCase) {
        return this.key.toLowerCase().indexOf(value.toLowerCase()) >= 0;
      }
      return this.key.indexOf(value) >= 0;
    } else {
      return (this.value & value) !== 0;
    }
  };

  /**
   * Checks if the EnumItem is the same as the passing object.
   * @param  {EnumItem || String || Number} key The object to check with.
   * @return {Boolean}                          The check result.
   */

  EnumItem.prototype.is = function is(key) {
    if (EnumItem.isEnumItem(key)) {
      return this.key === key.key;
    } else if (isString(key)) {
      if (this._options.ignoreCase) {
        return this.key.toLowerCase() === key.toLowerCase();
      }
      return this.key === key;
    } else {
      return this.value === key;
    }
  };

  /**
   * Returns String representation of this EnumItem.
   * @return {String} String representation of this EnumItem.
   */

  EnumItem.prototype.toString = function toString() {
    return this.key;
  };

  /**
   * Returns JSON object representation of this EnumItem.
   * @return {String} JSON object representation of this EnumItem.
   */

  EnumItem.prototype.toJSON = function toJSON() {
    return this.key;
  };

  /**
   * Returns the value to compare with.
   * @return {String} The value to compare with.
   */

  EnumItem.prototype.valueOf = function valueOf() {
    return this.value;
  };

  EnumItem.isEnumItem = function isEnumItem(value) {
    return value instanceof EnumItem || isObject(value) && value.key !== undefined && value.value !== undefined;
  };

  return EnumItem;
})();

module.exports = EnumItem;
},{"./isType":4}],3:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
var indexOf = Array.prototype.indexOf || function (find, i /*opt*/) {
  if (i === undefined) i = 0;
  if (i < 0) i += this.length;
  if (i < 0) i = 0;
  for (var n = this.length; i < n; i++) if (i in this && this[i] === find) return i;
  return -1;
};
exports.indexOf = indexOf;
},{}],4:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
var isType = function (type, value) {
  return typeof value === type;
};
exports.isType = isType;
var isObject = function (value) {
  return isType("object", value);
};
exports.isObject = isObject;
var isString = function (value) {
  return isType("string", value);
};
exports.isString = isString;
var isNumber = function (value) {
  return isType("number", value);
};
exports.isNumber = isNumber;
},{}],5:[function(_dereq_,module,exports){
module.exports = _dereq_('./dist/enum');

},{"./dist/enum":1}],6:[function(_dereq_,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],7:[function(_dereq_,module,exports){
exports.endianness = function () { return 'LE' };

exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

exports.loadavg = function () { return [] };

exports.uptime = function () { return 0 };

exports.freemem = function () {
    return Number.MAX_VALUE;
};

exports.totalmem = function () {
    return Number.MAX_VALUE;
};

exports.cpus = function () { return [] };

exports.type = function () { return 'Browser' };

exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

exports.networkInterfaces
= exports.getNetworkInterfaces
= function () { return {} };

exports.arch = function () { return 'javascript' };

exports.platform = function () { return 'browser' };

exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

exports.EOL = '\n';

},{}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hZHJhaS9Qcm9qZWN0cy9lbnVtL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYWRyYWkvUHJvamVjdHMvZW51bS9kaXN0L2VudW0uanMiLCIvVXNlcnMvYWRyYWkvUHJvamVjdHMvZW51bS9kaXN0L2VudW1JdGVtLmpzIiwiL1VzZXJzL2FkcmFpL1Byb2plY3RzL2VudW0vZGlzdC9pbmRleE9mLmpzIiwiL1VzZXJzL2FkcmFpL1Byb2plY3RzL2VudW0vZGlzdC9pc1R5cGUuanMiLCIvVXNlcnMvYWRyYWkvUHJvamVjdHMvZW51bS9mYWtlX2VhODA0YjU1LmpzIiwiL1VzZXJzL2FkcmFpL1Byb2plY3RzL2VudW0vbm9kZV9tb2R1bGVzL2lzLWJ1ZmZlci9pbmRleC5qcyIsIi9Vc2Vycy9hZHJhaS9Qcm9qZWN0cy9lbnVtL25vZGVfbW9kdWxlcy9vcy1icm93c2VyaWZ5L2Jyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIF9pbnRlcm9wUmVxdWlyZSA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9ialtcImRlZmF1bHRcIl0gOiBvYmo7IH07XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSBmdW5jdGlvbiAoaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfTtcblxudmFyIG9zID0gX2ludGVyb3BSZXF1aXJlKHJlcXVpcmUoXCJvc1wiKSk7XG5cbnZhciBFbnVtSXRlbSA9IF9pbnRlcm9wUmVxdWlyZShyZXF1aXJlKFwiLi9lbnVtSXRlbVwiKSk7XG5cbnZhciBfaXNUeXBlID0gcmVxdWlyZShcIi4vaXNUeXBlXCIpO1xuXG52YXIgaXNTdHJpbmcgPSBfaXNUeXBlLmlzU3RyaW5nO1xudmFyIGlzTnVtYmVyID0gX2lzVHlwZS5pc051bWJlcjtcblxudmFyIGluZGV4T2YgPSByZXF1aXJlKFwiLi9pbmRleE9mXCIpLmluZGV4T2Y7XG5cbnZhciBpc0J1ZmZlciA9IF9pbnRlcm9wUmVxdWlyZShyZXF1aXJlKFwiaXMtYnVmZmVyXCIpKTtcblxudmFyIGVuZGlhbm5lc3MgPSBvcy5lbmRpYW5uZXNzKCk7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBFbnVtIHdpdGggZW51bSBpdGVtcy5cbiAqIEBwYXJhbSB7QXJyYXkgfHwgT2JqZWN0fSAgbWFwICAgICBUaGlzIGFyZSB0aGUgZW51bSBpdGVtcy5cbiAqIEBwYXJhbSB7U3RyaW5nIHx8IE9iamVjdH0gb3B0aW9ucyBUaGlzIGFyZSBvcHRpb25zLiBbb3B0aW9uYWxdXG4gKi9cblxudmFyIEVudW0gPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFbnVtKG1hcCwgb3B0aW9ucykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRW51bSk7XG5cbiAgICAvKiBpbXBsZW1lbnQgdGhlIFwicmVmIHR5cGUgaW50ZXJmYWNlXCIsIHNvIHRoYXQgRW51bSB0eXBlcyBjYW5cbiAgICAgKiBiZSB1c2VkIGluIGBub2RlLWZmaWAgZnVuY3Rpb24gZGVjbGFyYXRpb25zIGFuZCBpbnZva2F0aW9ucy5cbiAgICAgKiBJbiBDLCB0aGVzZSBFbnVtcyBhY3QgYXMgYHVpbnQzMl90YCB0eXBlcy5cbiAgICAgKlxuICAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9Ub29UYWxsTmF0ZS9yZWYjdGhlLXR5cGUtaW50ZXJmYWNlXG4gICAgICovXG4gICAgdGhpcy5zaXplID0gNDtcbiAgICB0aGlzLmluZGlyZWN0aW9uID0gMTtcblxuICAgIGlmIChvcHRpb25zICYmIGlzU3RyaW5nKG9wdGlvbnMpKSB7XG4gICAgICBvcHRpb25zID0geyBuYW1lOiBvcHRpb25zIH07XG4gICAgfVxuXG4gICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5fb3B0aW9ucy5zZXBhcmF0b3IgPSB0aGlzLl9vcHRpb25zLnNlcGFyYXRvciB8fCBcIiB8IFwiO1xuICAgIHRoaXMuX29wdGlvbnMuZW5kaWFubmVzcyA9IHRoaXMuX29wdGlvbnMuZW5kaWFubmVzcyB8fCBlbmRpYW5uZXNzO1xuICAgIHRoaXMuX29wdGlvbnMuaWdub3JlQ2FzZSA9IHRoaXMuX29wdGlvbnMuaWdub3JlQ2FzZSB8fCBmYWxzZTtcbiAgICB0aGlzLl9vcHRpb25zLmZyZWV6ID0gdGhpcy5fb3B0aW9ucy5mcmVleiB8fCBmYWxzZTtcblxuICAgIHRoaXMuZW51bXMgPSBbXTtcblxuICAgIGlmIChtYXAubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9lbnVtTGFzdEluZGV4ID0gbWFwLmxlbmd0aDtcbiAgICAgIHZhciBhcnJheSA9IG1hcDtcbiAgICAgIG1hcCA9IHt9O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG1hcFthcnJheVtpXV0gPSBNYXRoLnBvdygyLCBpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBtZW1iZXIgaW4gbWFwKSB7XG4gICAgICBndWFyZFJlc2VydmVkS2V5cyh0aGlzLl9vcHRpb25zLm5hbWUsIG1lbWJlcik7XG4gICAgICB0aGlzW21lbWJlcl0gPSBuZXcgRW51bUl0ZW0obWVtYmVyLCBtYXBbbWVtYmVyXSwgeyBpZ25vcmVDYXNlOiB0aGlzLl9vcHRpb25zLmlnbm9yZUNhc2UgfSk7XG4gICAgICB0aGlzLmVudW1zLnB1c2godGhpc1ttZW1iZXJdKTtcbiAgICB9XG4gICAgdGhpcy5fZW51bU1hcCA9IG1hcDtcblxuICAgIGlmICh0aGlzLl9vcHRpb25zLmlnbm9yZUNhc2UpIHtcbiAgICAgIHRoaXMuZ2V0TG93ZXJDYXNlRW51bXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXMgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuZW51bXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICByZXNbdGhpcy5lbnVtc1tpXS5rZXkudG9Mb3dlckNhc2UoKV0gPSB0aGlzLmVudW1zW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vcHRpb25zLm5hbWUpIHtcbiAgICAgIHRoaXMubmFtZSA9IHRoaXMuX29wdGlvbnMubmFtZTtcbiAgICB9XG5cbiAgICB2YXIgaXNGbGFnZ2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gX3RoaXMuZW51bXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGUgPSBfdGhpcy5lbnVtc1tpXTtcblxuICAgICAgICBpZiAoIShlLnZhbHVlICE9PSAwICYmICEoZS52YWx1ZSAmIGUudmFsdWUgLSAxKSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICB0aGlzLmlzRmxhZ2dhYmxlID0gaXNGbGFnZ2FibGUoKTtcbiAgICBpZiAodGhpcy5fb3B0aW9ucy5mcmVleikge1xuICAgICAgdGhpcy5mcmVlemVFbnVtcygpOyAvL3RoaXMgd2lsbCBtYWtlIGluc3RhbmNlcyBvZiBFbnVtIG5vbi1leHRlbnNpYmxlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIEVudW1JdGVtIGtleS5cbiAgICogQHBhcmFtICB7RW51bUl0ZW0gfHwgU3RyaW5nIHx8IE51bWJlcn0ga2V5IFRoZSBvYmplY3QgdG8gZ2V0IHdpdGguXG4gICAqIEByZXR1cm4ge1N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgZ2V0IHJlc3VsdC5cbiAgICovXG5cbiAgRW51bS5wcm90b3R5cGUuZ2V0S2V5ID0gZnVuY3Rpb24gZ2V0S2V5KHZhbHVlKSB7XG4gICAgdmFyIGl0ZW0gPSB0aGlzLmdldCh2YWx1ZSk7XG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLmtleTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIEVudW1JdGVtIHZhbHVlLlxuICAgKiBAcGFyYW0gIHtFbnVtSXRlbSB8fCBTdHJpbmcgfHwgTnVtYmVyfSBrZXkgVGhlIG9iamVjdCB0byBnZXQgd2l0aC5cbiAgICogQHJldHVybiB7TnVtYmVyfSAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBnZXQgcmVzdWx0LlxuICAgKi9cblxuICBFbnVtLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uIGdldFZhbHVlKGtleSkge1xuICAgIHZhciBpdGVtID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0udmFsdWU7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcHByb3ByaWF0ZSBFbnVtSXRlbS5cbiAgICogQHBhcmFtICB7RW51bUl0ZW0gfHwgU3RyaW5nIHx8IE51bWJlcn0ga2V5IFRoZSBvYmplY3QgdG8gZ2V0IHdpdGguXG4gICAqIEByZXR1cm4ge0VudW1JdGVtfSAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgZ2V0IHJlc3VsdC5cbiAgICovXG5cbiAgRW51bS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KGtleSwgb2Zmc2V0KSB7XG4gICAgaWYgKGtleSA9PT0gbnVsbCB8fCBrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gQnVmZmVyIGluc3RhbmNlIHN1cHBvcnQsIHBhcnQgb2YgdGhlIHJlZiBUeXBlIGludGVyZmFjZVxuICAgIGlmIChpc0J1ZmZlcihrZXkpKSB7XG4gICAgICBrZXkgPSBrZXlbXCJyZWFkVUludDMyXCIgKyB0aGlzLl9vcHRpb25zLmVuZGlhbm5lc3NdKG9mZnNldCB8fCAwKTtcbiAgICB9XG5cbiAgICBpZiAoRW51bUl0ZW0uaXNFbnVtSXRlbShrZXkpKSB7XG4gICAgICB2YXIgZm91bmRJbmRleCA9IGluZGV4T2YuY2FsbCh0aGlzLmVudW1zLCBrZXkpO1xuICAgICAgaWYgKGZvdW5kSW5kZXggPj0gMCkge1xuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmlzRmxhZ2dhYmxlIHx8IHRoaXMuaXNGbGFnZ2FibGUgJiYga2V5LmtleS5pbmRleE9mKHRoaXMuX29wdGlvbnMuc2VwYXJhdG9yKSA8IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZ2V0KGtleS5rZXkpO1xuICAgIH0gZWxzZSBpZiAoaXNTdHJpbmcoa2V5KSkge1xuXG4gICAgICB2YXIgZW51bXMgPSB0aGlzO1xuICAgICAgaWYgKHRoaXMuX29wdGlvbnMuaWdub3JlQ2FzZSkge1xuICAgICAgICBlbnVtcyA9IHRoaXMuZ2V0TG93ZXJDYXNlRW51bXMoKTtcbiAgICAgICAga2V5ID0ga2V5LnRvTG93ZXJDYXNlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXkuaW5kZXhPZih0aGlzLl9vcHRpb25zLnNlcGFyYXRvcikgPiAwKSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IGtleS5zcGxpdCh0aGlzLl9vcHRpb25zLnNlcGFyYXRvcik7XG5cbiAgICAgICAgdmFyIHZhbHVlID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBwYXJ0ID0gcGFydHNbaV07XG5cbiAgICAgICAgICB2YWx1ZSB8PSBlbnVtc1twYXJ0XS52YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgRW51bUl0ZW0oa2V5LCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW51bXNba2V5XTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgbSBpbiB0aGlzKSB7XG4gICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KG0pKSB7XG4gICAgICAgICAgaWYgKHRoaXNbbV0udmFsdWUgPT09IGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbbV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciByZXN1bHQgPSBudWxsO1xuXG4gICAgICBpZiAodGhpcy5pc0ZsYWdnYWJsZSkge1xuICAgICAgICBmb3IgKHZhciBuIGluIHRoaXMpIHtcbiAgICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShuKSkge1xuICAgICAgICAgICAgaWYgKChrZXkgJiB0aGlzW25dLnZhbHVlKSAhPT0gMCkge1xuICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHRoaXMuX29wdGlvbnMuc2VwYXJhdG9yO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFwiXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVzdWx0ICs9IG47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldChyZXN1bHQgfHwgbnVsbCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBFbnVtIFwidmFsdWVcIiBvbnRvIHRoZSBnaXZlIGBidWZmZXJgIGF0IHRoZSBzcGVjaWZpZWQgYG9mZnNldGAuXG4gICAqIFBhcnQgb2YgdGhlIHJlZiBcIlR5cGUgaW50ZXJmYWNlXCIuXG4gICAqXG4gICAqIEBwYXJhbSAge0J1ZmZlcn0gYnVmZmVyIFRoZSBCdWZmZXIgaW5zdGFuY2UgdG8gd3JpdGUgdG8uXG4gICAqIEBwYXJhbSAge051bWJlcn0gb2Zmc2V0IFRoZSBvZmZzZXQgaW4gdGhlIGJ1ZmZlciB0byB3cml0ZSB0by4gRGVmYXVsdCAwLlxuICAgKiBAcGFyYW0gIHtFbnVtSXRlbSB8fCBTdHJpbmcgfHwgTnVtYmVyfSB2YWx1ZSBUaGUgRW51bUl0ZW0gdG8gd3JpdGUuXG4gICAqL1xuXG4gIEVudW0ucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldChidWZmZXIsIG9mZnNldCwgdmFsdWUpIHtcbiAgICB2YXIgaXRlbSA9IHRoaXMuZ2V0KHZhbHVlKTtcbiAgICBpZiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGJ1ZmZlcltcIndyaXRlVUludDMyXCIgKyB0aGlzLl9vcHRpb25zLmVuZGlhbm5lc3NdKGl0ZW0udmFsdWUsIG9mZnNldCB8fCAwKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIERlZmluZSBmcmVlemVFbnVtcygpIGFzIGEgcHJvcGVydHkgb2YgdGhlIHByb3RvdHlwZS5cbiAgICogbWFrZSBlbnVtZXJhYmxlIGl0ZW1zIG5vbmNvbmZpZ3VyYWJsZSBhbmQgZGVlcCBmcmVlemUgdGhlIHByb3BlcnRpZXMuIFRocm93IEVycm9yIG9uIHByb3BlcnR5IHNldHRlci5cbiAgICovXG5cbiAgRW51bS5wcm90b3R5cGUuZnJlZXplRW51bXMgPSBmdW5jdGlvbiBmcmVlemVFbnVtcygpIHtcbiAgICBmdW5jdGlvbiBlbnZTdXBwb3J0c0ZyZWV6aW5nKCkge1xuICAgICAgcmV0dXJuIE9iamVjdC5pc0Zyb3plbiAmJiBPYmplY3QuaXNTZWFsZWQgJiYgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgJiYgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydGllcyAmJiBPYmplY3QuX19kZWZpbmVHZXR0ZXJfXyAmJiBPYmplY3QuX19kZWZpbmVTZXR0ZXJfXztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmcmVlemVyKG8pIHtcbiAgICAgIHZhciBwcm9wcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG8pO1xuICAgICAgcHJvcHMuZm9yRWFjaChmdW5jdGlvbiAocCkge1xuICAgICAgICBpZiAoIU9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobywgcCkuY29uZmlndXJhYmxlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMobywgcCwgeyB3cml0YWJsZTogZmFsc2UsIGNvbmZpZ3VyYWJsZTogZmFsc2UgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBvO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFByb3BlcnR5VmFsdWUodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWVwRnJlZXplRW51bXMobykge1xuICAgICAgaWYgKHR5cGVvZiBvICE9PSBcIm9iamVjdFwiIHx8IG8gPT09IG51bGwgfHwgT2JqZWN0LmlzRnJvemVuKG8pIHx8IE9iamVjdC5pc1NlYWxlZChvKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBrZXkgaW4gbykge1xuICAgICAgICBpZiAoby5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgby5fX2RlZmluZUdldHRlcl9fKGtleSwgZ2V0UHJvcGVydHlWYWx1ZS5iaW5kKG51bGwsIG9ba2V5XSkpO1xuICAgICAgICAgIG8uX19kZWZpbmVTZXR0ZXJfXyhrZXksIGZ1bmN0aW9uIHRocm93UHJvcGVydHlTZXRFcnJvcih2YWx1ZSkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiQ2Fubm90IHJlZGVmaW5lIHByb3BlcnR5OyBFbnVtIFR5cGUgaXMgbm90IGV4dGVuc2libGUuXCIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGRlZXBGcmVlemVFbnVtcyhvW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoT2JqZWN0LmZyZWV6ZSkge1xuICAgICAgICBPYmplY3QuZnJlZXplKG8pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnJlZXplcihvKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW52U3VwcG9ydHNGcmVlemluZygpKSB7XG4gICAgICBkZWVwRnJlZXplRW51bXModGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybiB0cnVlIHdoZXRoZXIgdGhlIGVudW1JdGVtIHBhcmFtZXRlciBwYXNzZWQgaW4gaXMgYW4gRW51bUl0ZW0gb2JqZWN0IGFuZCBcbiAgICogaGFzIGJlZW4gaW5jbHVkZWQgYXMgY29uc3RhbnQgb2YgdGhpcyBFbnVtICAgXG4gICAqIEBwYXJhbSAge0VudW1JdGVtfSBlbnVtSXRlbVxuICAgKi9cblxuICBFbnVtLnByb3RvdHlwZS5pc0RlZmluZWQgPSBmdW5jdGlvbiBpc0RlZmluZWQoZW51bUl0ZW0pIHtcbiAgICB2YXIgY29uZGl0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHJldHVybiBlID09PSBlbnVtSXRlbTtcbiAgICB9O1xuICAgIGlmIChpc1N0cmluZyhlbnVtSXRlbSkgfHwgaXNOdW1iZXIoZW51bUl0ZW0pKSB7XG4gICAgICBjb25kaXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gZS5pcyhlbnVtSXRlbSk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5lbnVtcy5zb21lKGNvbmRpdGlvbik7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgSlNPTiBvYmplY3QgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBFbnVtLlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9IEpTT04gb2JqZWN0IHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgRW51bS5cbiAgICovXG5cbiAgRW51bS5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICAgIHJldHVybiB0aGlzLl9lbnVtTWFwO1xuICB9O1xuXG4gIC8qKlxuICAgKiBFeHRlbmRzIHRoZSBleGlzdGluZyBFbnVtIHdpdGggYSBOZXcgTWFwLlxuICAgKiBAcGFyYW0gIHtBcnJheX0gIG1hcCAgTWFwIHRvIGV4dGVuZCBmcm9tXG4gICAqL1xuXG4gIEVudW0ucHJvdG90eXBlLmV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChtYXApIHtcbiAgICBpZiAobWFwLmxlbmd0aCkge1xuICAgICAgdmFyIGFycmF5ID0gbWFwO1xuICAgICAgbWFwID0ge307XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGV4cG9uZW50ID0gdGhpcy5fZW51bUxhc3RJbmRleCArIGk7XG4gICAgICAgIG1hcFthcnJheVtpXV0gPSBNYXRoLnBvdygyLCBleHBvbmVudCk7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIG1lbWJlciBpbiBtYXApIHtcbiAgICAgICAgZ3VhcmRSZXNlcnZlZEtleXModGhpcy5fb3B0aW9ucy5uYW1lLCBtZW1iZXIpO1xuICAgICAgICB0aGlzW21lbWJlcl0gPSBuZXcgRW51bUl0ZW0obWVtYmVyLCBtYXBbbWVtYmVyXSwgeyBpZ25vcmVDYXNlOiB0aGlzLl9vcHRpb25zLmlnbm9yZUNhc2UgfSk7XG4gICAgICAgIHRoaXMuZW51bXMucHVzaCh0aGlzW21lbWJlcl0pO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fZW51bU1hcCkge1xuICAgICAgICBtYXBba2V5XSA9IHRoaXMuX2VudW1NYXBba2V5XTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fZW51bUxhc3RJbmRleCArPSBtYXAubGVuZ3RoO1xuICAgICAgdGhpcy5fZW51bU1hcCA9IG1hcDtcblxuICAgICAgaWYgKHRoaXMuX29wdGlvbnMuZnJlZXopIHtcbiAgICAgICAgdGhpcy5mcmVlemVFbnVtcygpOyAvL3RoaXMgd2lsbCBtYWtlIGluc3RhbmNlcyBvZiBuZXcgRW51bSBub24tZXh0ZW5zaWJsZVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSBFbnVtIFR5cGUgZ2xvYmFsbHkgaW4gbm9kZS5qcy5cbiAgICogQHBhcmFtICB7U3RyaW5nfSBrZXkgR2xvYmFsIHZhcmlhYmxlLiBbb3B0aW9uYWxdXG4gICAqL1xuXG4gIEVudW0ucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3RlcigpIHtcbiAgICB2YXIga2V5ID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyBcIkVudW1cIiA6IGFyZ3VtZW50c1swXTtcblxuICAgIGlmICghZ2xvYmFsW2tleV0pIHtcbiAgICAgIGdsb2JhbFtrZXldID0gRW51bTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIEVudW07XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVudW07XG5cbi8vIHByaXZhdGVcblxudmFyIHJlc2VydmVkS2V5cyA9IFtcIl9vcHRpb25zXCIsIFwiZ2V0XCIsIFwiZ2V0S2V5XCIsIFwiZ2V0VmFsdWVcIiwgXCJlbnVtc1wiLCBcImlzRmxhZ2dhYmxlXCIsIFwiX2VudW1NYXBcIiwgXCJ0b0pTT05cIiwgXCJfZW51bUxhc3RJbmRleFwiXTtcblxuZnVuY3Rpb24gZ3VhcmRSZXNlcnZlZEtleXMoY3VzdG9tTmFtZSwga2V5KSB7XG4gIGlmIChjdXN0b21OYW1lICYmIGtleSA9PT0gXCJuYW1lXCIgfHwgaW5kZXhPZi5jYWxsKHJlc2VydmVkS2V5cywga2V5KSA+PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRW51bSBrZXkgXCIgKyBrZXkgKyBcIiBpcyBhIHJlc2VydmVkIHdvcmQhXCIpO1xuICB9XG59XG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH07XG5cbnZhciBfaXNUeXBlID0gcmVxdWlyZShcIi4vaXNUeXBlXCIpO1xuXG52YXIgaXNPYmplY3QgPSBfaXNUeXBlLmlzT2JqZWN0O1xudmFyIGlzU3RyaW5nID0gX2lzVHlwZS5pc1N0cmluZztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIEl0ZW0gb2YgYW4gRW51bS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgICBUaGUgRW51bSBrZXkuXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgVGhlIEVudW0gdmFsdWUuXG4gKi9cblxudmFyIEVudW1JdGVtID0gKGZ1bmN0aW9uICgpIHtcblxuICAvKmNvbnN0cnVjdG9yIHJlZmVyZW5jZSBzbyB0aGF0LCB0aGlzLmNvbnN0cnVjdG9yPT09RW51bUl0ZW0vLz0+dHJ1ZSAqL1xuXG4gIGZ1bmN0aW9uIEVudW1JdGVtKGtleSwgdmFsdWUpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMl07XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRW51bUl0ZW0pO1xuXG4gICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuXG4gICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5fb3B0aW9ucy5pZ25vcmVDYXNlID0gdGhpcy5fb3B0aW9ucy5pZ25vcmVDYXNlIHx8IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgZmxhZ2dlZCBFbnVtSXRlbSBoYXMgdGhlIHBhc3Npbmcgb2JqZWN0LlxuICAgKiBAcGFyYW0gIHtFbnVtSXRlbSB8fCBTdHJpbmcgfHwgTnVtYmVyfSB2YWx1ZSBUaGUgb2JqZWN0IHRvIGNoZWNrIHdpdGguXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBjaGVjayByZXN1bHQuXG4gICAqL1xuXG4gIEVudW1JdGVtLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiBoYXModmFsdWUpIHtcbiAgICBpZiAoRW51bUl0ZW0uaXNFbnVtSXRlbSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiAodGhpcy52YWx1ZSAmIHZhbHVlLnZhbHVlKSAhPT0gMDtcbiAgICB9IGVsc2UgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgaWYgKHRoaXMuX29wdGlvbnMuaWdub3JlQ2FzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5rZXkudG9Mb3dlckNhc2UoKS5pbmRleE9mKHZhbHVlLnRvTG93ZXJDYXNlKCkpID49IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5rZXkuaW5kZXhPZih2YWx1ZSkgPj0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICh0aGlzLnZhbHVlICYgdmFsdWUpICE9PSAwO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBFbnVtSXRlbSBpcyB0aGUgc2FtZSBhcyB0aGUgcGFzc2luZyBvYmplY3QuXG4gICAqIEBwYXJhbSAge0VudW1JdGVtIHx8IFN0cmluZyB8fCBOdW1iZXJ9IGtleSBUaGUgb2JqZWN0IHRvIGNoZWNrIHdpdGguXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgY2hlY2sgcmVzdWx0LlxuICAgKi9cblxuICBFbnVtSXRlbS5wcm90b3R5cGUuaXMgPSBmdW5jdGlvbiBpcyhrZXkpIHtcbiAgICBpZiAoRW51bUl0ZW0uaXNFbnVtSXRlbShrZXkpKSB7XG4gICAgICByZXR1cm4gdGhpcy5rZXkgPT09IGtleS5rZXk7XG4gICAgfSBlbHNlIGlmIChpc1N0cmluZyhrZXkpKSB7XG4gICAgICBpZiAodGhpcy5fb3B0aW9ucy5pZ25vcmVDYXNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmtleS50b0xvd2VyQ2FzZSgpID09PSBrZXkudG9Mb3dlckNhc2UoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmtleSA9PT0ga2V5O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZSA9PT0ga2V5O1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBFbnVtSXRlbS5cbiAgICogQHJldHVybiB7U3RyaW5nfSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBFbnVtSXRlbS5cbiAgICovXG5cbiAgRW51bUl0ZW0ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMua2V5O1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIEpTT04gb2JqZWN0IHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgRW51bUl0ZW0uXG4gICAqIEByZXR1cm4ge1N0cmluZ30gSlNPTiBvYmplY3QgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBFbnVtSXRlbS5cbiAgICovXG5cbiAgRW51bUl0ZW0ucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgICByZXR1cm4gdGhpcy5rZXk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIHRvIGNvbXBhcmUgd2l0aC5cbiAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdmFsdWUgdG8gY29tcGFyZSB3aXRoLlxuICAgKi9cblxuICBFbnVtSXRlbS5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uIHZhbHVlT2YoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gIH07XG5cbiAgRW51bUl0ZW0uaXNFbnVtSXRlbSA9IGZ1bmN0aW9uIGlzRW51bUl0ZW0odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBFbnVtSXRlbSB8fCBpc09iamVjdCh2YWx1ZSkgJiYgdmFsdWUua2V5ICE9PSB1bmRlZmluZWQgJiYgdmFsdWUudmFsdWUgIT09IHVuZGVmaW5lZDtcbiAgfTtcblxuICByZXR1cm4gRW51bUl0ZW07XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVudW1JdGVtOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xudmFyIGluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB8fCBmdW5jdGlvbiAoZmluZCwgaSAvKm9wdCovKSB7XG4gIGlmIChpID09PSB1bmRlZmluZWQpIGkgPSAwO1xuICBpZiAoaSA8IDApIGkgKz0gdGhpcy5sZW5ndGg7XG4gIGlmIChpIDwgMCkgaSA9IDA7XG4gIGZvciAodmFyIG4gPSB0aGlzLmxlbmd0aDsgaSA8IG47IGkrKykgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBmaW5kKSByZXR1cm4gaTtcbiAgcmV0dXJuIC0xO1xufTtcbmV4cG9ydHMuaW5kZXhPZiA9IGluZGV4T2Y7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG52YXIgaXNUeXBlID0gZnVuY3Rpb24gKHR5cGUsIHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IHR5cGU7XG59O1xuZXhwb3J0cy5pc1R5cGUgPSBpc1R5cGU7XG52YXIgaXNPYmplY3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIGlzVHlwZShcIm9iamVjdFwiLCB2YWx1ZSk7XG59O1xuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xudmFyIGlzU3RyaW5nID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBpc1R5cGUoXCJzdHJpbmdcIiwgdmFsdWUpO1xufTtcbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcbnZhciBpc051bWJlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gaXNUeXBlKFwibnVtYmVyXCIsIHZhbHVlKTtcbn07XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2Rpc3QvZW51bScpO1xuIiwiLyohXG4gKiBEZXRlcm1pbmUgaWYgYW4gb2JqZWN0IGlzIGEgQnVmZmVyXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxuLy8gVGhlIF9pc0J1ZmZlciBjaGVjayBpcyBmb3IgU2FmYXJpIDUtNyBzdXBwb3J0LCBiZWNhdXNlIGl0J3MgbWlzc2luZ1xuLy8gT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3Rvci4gUmVtb3ZlIHRoaXMgZXZlbnR1YWxseVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogIT0gbnVsbCAmJiAoaXNCdWZmZXIob2JqKSB8fCBpc1Nsb3dCdWZmZXIob2JqKSB8fCAhIW9iai5faXNCdWZmZXIpXG59XG5cbmZ1bmN0aW9uIGlzQnVmZmVyIChvYmopIHtcbiAgcmV0dXJuICEhb2JqLmNvbnN0cnVjdG9yICYmIHR5cGVvZiBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicgJiYgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyKG9iailcbn1cblxuLy8gRm9yIE5vZGUgdjAuMTAgc3VwcG9ydC4gUmVtb3ZlIHRoaXMgZXZlbnR1YWxseS5cbmZ1bmN0aW9uIGlzU2xvd0J1ZmZlciAob2JqKSB7XG4gIHJldHVybiB0eXBlb2Ygb2JqLnJlYWRGbG9hdExFID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBvYmouc2xpY2UgPT09ICdmdW5jdGlvbicgJiYgaXNCdWZmZXIob2JqLnNsaWNlKDAsIDApKVxufVxuIiwiZXhwb3J0cy5lbmRpYW5uZXNzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJ0xFJyB9O1xuXG5leHBvcnRzLmhvc3RuYW1lID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgbG9jYXRpb24gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBsb2NhdGlvbi5ob3N0bmFtZVxuICAgIH1cbiAgICBlbHNlIHJldHVybiAnJztcbn07XG5cbmV4cG9ydHMubG9hZGF2ZyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIFtdIH07XG5cbmV4cG9ydHMudXB0aW1lID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gMCB9O1xuXG5leHBvcnRzLmZyZWVtZW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIE51bWJlci5NQVhfVkFMVUU7XG59O1xuXG5leHBvcnRzLnRvdGFsbWVtID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBOdW1iZXIuTUFYX1ZBTFVFO1xufTtcblxuZXhwb3J0cy5jcHVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gW10gfTtcblxuZXhwb3J0cy50eXBlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJ0Jyb3dzZXInIH07XG5cbmV4cG9ydHMucmVsZWFzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIG5hdmlnYXRvci5hcHBWZXJzaW9uO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59O1xuXG5leHBvcnRzLm5ldHdvcmtJbnRlcmZhY2VzXG49IGV4cG9ydHMuZ2V0TmV0d29ya0ludGVyZmFjZXNcbj0gZnVuY3Rpb24gKCkgeyByZXR1cm4ge30gfTtcblxuZXhwb3J0cy5hcmNoID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJ2phdmFzY3JpcHQnIH07XG5cbmV4cG9ydHMucGxhdGZvcm0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnYnJvd3NlcicgfTtcblxuZXhwb3J0cy50bXBkaXIgPSBleHBvcnRzLnRtcERpciA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJy90bXAnO1xufTtcblxuZXhwb3J0cy5FT0wgPSAnXFxuJztcbiJdfQ==
(5)
});
