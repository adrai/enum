(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Enum = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _enumItem = _interopRequireDefault(require("./enumItem.js"));

var _isType = require("./isType.js");

var _indexOf = require("./indexOf.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var isBuffer = function isBuffer(obj) {
  return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
};
/**
 * Returns a string identifying the endianness of the CPU for which the Deno
 * binary was compiled. Possible values are 'BE' for big endian and 'LE' for
 * little endian.
 **/


var getEndianess = function getEndianess() {
  // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView#Endianness
  var buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true
  /* littleEndian */
  ); // Int16Array uses the platform's endianness.

  return new Int16Array(buffer)[0] === 256 ? 'LE' : 'BE';
};

var endianness = getEndianess();
/**
 * Represents an Enum with enum items.
 * @param {Array || Object}  map     This are the enum items.
 * @param {String || Object} options This are options. [optional]
 */

var Enum = /*#__PURE__*/function () {
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

    if (options && (0, _isType.isString)(options)) {
      options = {
        name: options
      };
    }

    this._options = options || {};
    this._options.separator = this._options.separator || ' | ';
    this._options.endianness = this._options.endianness || endianness;
    this._options.ignoreCase = this._options.ignoreCase || false;
    this._options.freez = this._options.freez || false; // backword compatability

    this._options.freeze = this._options.freeze || this._options.freez || false;
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
      this[member] = new _enumItem["default"](member, map[member], {
        ignoreCase: this._options.ignoreCase
      });
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

    var isFlaggable = function isFlaggable() {
      for (var i = 0, len = _this.enums.length; i < len; i++) {
        var e = _this.enums[i];

        if (!(e.value !== 0 && !(e.value & e.value - 1))) {
          return false;
        }
      }

      return true;
    };

    this.isFlaggable = isFlaggable();

    if (this._options.freeze) {
      this.freezeEnums(); // this will make instances of Enum non-extensible
    }
  }
  /**
   * Returns the appropriate EnumItem key.
   * @param  {EnumItem || String || Number} key The object to get with.
   * @return {String}                           The get result.
   */


  _createClass(Enum, [{
    key: "getKey",
    value: function getKey(value) {
      var item = this.get(value);

      if (item) {
        return item.key;
      }
    }
    /**
     * Returns the appropriate EnumItem value.
     * @param  {EnumItem || String || Number} key The object to get with.
     * @return {Number}                           The get result.
     */

  }, {
    key: "getValue",
    value: function getValue(key) {
      var item = this.get(key);

      if (item) {
        return item.value;
      }
    }
    /**
     * Returns the appropriate EnumItem.
     * @param  {EnumItem || String || Number} key The object to get with.
     * @return {EnumItem}                         The get result.
     */

  }, {
    key: "get",
    value: function get(key, offset) {
      if (key === null || key === undefined) {
        return;
      } // Buffer instance support, part of the ref Type interface


      if (isBuffer(key)) {
        key = key['readUInt32' + this._options.endianness](offset || 0);
      }

      if (_enumItem["default"].isEnumItem(key)) {
        var foundIndex = _indexOf.indexOf.call(this.enums, key);

        if (foundIndex >= 0) {
          return key;
        }

        if (!this.isFlaggable || this.isFlaggable && key.key.indexOf(this._options.separator) < 0) {
          return;
        }

        return this.get(key.key);
      } else if ((0, _isType.isString)(key)) {
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

          return new _enumItem["default"](key, value);
        } else {
          return enums[key];
        }
      } else {
        for (var m in this) {
          // eslint-disable-next-line no-prototype-builtins
          if (this.hasOwnProperty(m)) {
            if (this[m].value === key) {
              return this[m];
            }
          }
        }

        var result = null;

        if (this.isFlaggable) {
          for (var n in this) {
            // eslint-disable-next-line no-prototype-builtins
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
    }
    /**
     * Sets the Enum "value" onto the give `buffer` at the specified `offset`.
     * Part of the ref "Type interface".
     *
     * @param  {Buffer} buffer The Buffer instance to write to.
     * @param  {Number} offset The offset in the buffer to write to. Default 0.
     * @param  {EnumItem || String || Number} value The EnumItem to write.
     */

  }, {
    key: "set",
    value: function set(buffer, offset, value) {
      var item = this.get(value);

      if (item) {
        return buffer['writeUInt32' + this._options.endianness](item.value, offset || 0);
      }
    }
    /**
     * Define freezeEnums() as a property of the prototype.
     * make enumerable items nonconfigurable and deep freeze the properties. Throw Error on property setter.
     */

  }, {
    key: "freezeEnums",
    value: function freezeEnums() {
      function envSupportsFreezing() {
        return Object.isFrozen && Object.isSealed && Object.getOwnPropertyNames && Object.getOwnPropertyDescriptor && Object.defineProperties && Object.__defineGetter__ && Object.__defineSetter__;
      }

      function freezer(o) {
        var props = Object.getOwnPropertyNames(o);
        props.forEach(function (p) {
          if (!Object.getOwnPropertyDescriptor(o, p).configurable) {
            return;
          }

          Object.defineProperties(o, p, {
            writable: false,
            configurable: false
          });
        });
        return o;
      }

      function getPropertyValue(value) {
        return value;
      }

      function deepFreezeEnums(o) {
        if (_typeof(o) !== 'object' || o === null || Object.isFrozen(o) || Object.isSealed(o)) {
          return;
        }

        for (var key in o) {
          // eslint-disable-next-line no-prototype-builtins
          if (o.hasOwnProperty(key)) {
            o.__defineGetter__(key, getPropertyValue.bind(null, o[key]));

            o.__defineSetter__(key, function throwPropertySetError(value) {
              throw TypeError('Cannot redefine property; Enum Type is not extensible.');
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
    }
    /**
     * Return true whether the enumItem parameter passed in is an EnumItem object and
     * has been included as constant of this Enum
     * @param  {EnumItem} enumItem
     */

  }, {
    key: "isDefined",
    value: function isDefined(enumItem) {
      var condition = function condition(e) {
        return e === enumItem;
      };

      if ((0, _isType.isString)(enumItem) || (0, _isType.isNumber)(enumItem)) {
        condition = function condition(e) {
          return e.is(enumItem);
        };
      }

      return this.enums.some(condition);
    }
    /**
     * Returns JSON object representation of this Enum.
     * @return {String} JSON object representation of this Enum.
     */

  }, {
    key: "toJSON",
    value: function toJSON() {
      return this._enumMap;
    }
    /**
     * Extends the existing Enum with a New Map.
     * @param  {Array}  map  Map to extend from
     */

  }, {
    key: "extend",
    value: function extend(map) {
      if (map.length) {
        var array = map;
        map = {};

        for (var i = 0; i < array.length; i++) {
          var exponent = this._enumLastIndex + i;
          map[array[i]] = Math.pow(2, exponent);
        }

        for (var member in map) {
          guardReservedKeys(this._options.name, member);
          this[member] = new _enumItem["default"](member, map[member], {
            ignoreCase: this._options.ignoreCase
          });
          this.enums.push(this[member]);
        }

        for (var key in this._enumMap) {
          map[key] = this._enumMap[key];
        }

        this._enumLastIndex += map.length;
        this._enumMap = map;

        if (this._options.freeze) {
          this.freezeEnums(); // this will make instances of new Enum non-extensible
        }
      }
    }
  }, {
    key: Symbol.iterator,
    value: function value() {
      var _this2 = this;

      var index = 0;
      return {
        next: function next() {
          return index < _this2.enums.length ? {
            done: false,
            value: _this2.enums[index++]
          } : {
            done: true
          };
        }
      };
    }
  }], [{
    key: "register",

    /**
     * Registers the Enum Type globally in node.js.
     * @param  {String} key Global variable. [optional]
     */
    value: function register() {
      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Enum';

      if (typeof global !== 'undefined' && !global[key]) {
        global[key] = Enum;
      } else if (typeof window !== 'undefined' && !window[key]) {
        window[key] = Enum;
      }
    }
  }]);

  return Enum;
}();

exports["default"] = Enum;
; // private

var reservedKeys = ['_options', 'get', 'getKey', 'getValue', 'enums', 'isFlaggable', '_enumMap', 'toJSON', '_enumLastIndex'];

function guardReservedKeys(customName, key) {
  if (customName && key === 'name' || _indexOf.indexOf.call(reservedKeys, key) >= 0) {
    throw new Error("Enum key ".concat(key, " is a reserved word!"));
  }
}

module.exports = exports.default;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./enumItem.js":2,"./indexOf.js":3,"./isType.js":4}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _isType = require("./isType.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Represents an Item of an Enum.
 * @param {String} key   The Enum key.
 * @param {Number} value The Enum value.
 */
var EnumItem = /*#__PURE__*/function () {
  /* constructor reference so that, this.constructor===EnumItem//=>true */
  function EnumItem(key, value) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

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


  _createClass(EnumItem, [{
    key: "has",
    value: function has(value) {
      if (EnumItem.isEnumItem(value)) {
        return (this.value & value.value) !== 0;
      } else if ((0, _isType.isString)(value)) {
        if (this._options.ignoreCase) {
          return this.key.toLowerCase().indexOf(value.toLowerCase()) >= 0;
        }

        return this.key.indexOf(value) >= 0;
      } else {
        return (this.value & value) !== 0;
      }
    }
    /**
     * Checks if the EnumItem is the same as the passing object.
     * @param  {EnumItem || String || Number} key The object to check with.
     * @return {Boolean}                          The check result.
     */

  }, {
    key: "is",
    value: function is(key) {
      if (EnumItem.isEnumItem(key)) {
        return this.key === key.key;
      } else if ((0, _isType.isString)(key)) {
        if (this._options.ignoreCase) {
          return this.key.toLowerCase() === key.toLowerCase();
        }

        return this.key === key;
      } else {
        return this.value === key;
      }
    }
    /**
     * Returns String representation of this EnumItem.
     * @return {String} String representation of this EnumItem.
     */

  }, {
    key: "toString",
    value: function toString() {
      return this.key;
    }
    /**
     * Returns JSON object representation of this EnumItem.
     * @return {String} JSON object representation of this EnumItem.
     */

  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.key;
    }
    /**
     * Returns the value to compare with.
     * @return {String} The value to compare with.
     */

  }, {
    key: "valueOf",
    value: function valueOf() {
      return this.value;
    }
  }], [{
    key: "isEnumItem",
    value: function isEnumItem(value) {
      return value instanceof EnumItem || (0, _isType.isObject)(value) && value.key !== undefined && value.value !== undefined;
    }
  }]);

  return EnumItem;
}();

exports["default"] = EnumItem;
;
module.exports = exports.default;
},{"./isType.js":4}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.indexOf = void 0;

var indexOf = Array.prototype.indexOf || function (find, i
/* opt */
) {
  if (i === undefined) i = 0;
  if (i < 0) i += this.length;
  if (i < 0) i = 0;

  for (var n = this.length; i < n; i++) {
    if (i in this && this[i] === find) {
      return i;
    }
  }

  return -1;
};

exports.indexOf = indexOf;
},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNumber = exports.isString = exports.isObject = exports.isType = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// eslint-disable-next-line valid-typeof
var isType = function isType(type, value) {
  return _typeof(value) === type;
};

exports.isType = isType;

var isObject = function isObject(value) {
  return isType('object', value);
};

exports.isObject = isObject;

var isString = function isString(value) {
  return isType('string', value);
};

exports.isString = isString;

var isNumber = function isNumber(value) {
  return isType('number', value);
};

exports.isNumber = isNumber;
},{}]},{},[1])(1)
});
