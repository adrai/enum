(function (root, module, global, define) {

  "use strict";

  /**
   * Represents an Item of an Enum.
   * @param {String} key   The Enum key.
   * @param {Number} value The Enum value.
   */
  function EnumItem(key, value) {
    this.key = key;
    this.value = value;
  }

  EnumItem.prototype = {

    /**
     * Checks if the flagged EnumItem has the passing object.
     * @param  {EnumItem || String || Number} value The object to check with.
     * @return {Boolean}                            The check result.
     */
    has: function(value) {
      if (value instanceof EnumItem || (typeof(value) === 'object' && value.key !== undefined && value.value !== undefined)) {
        return (this.value & value.value) !== 0;
      } else if (typeof(value) === 'string') {
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
      if (key instanceof EnumItem || (typeof(key) === 'object' && key.key !== undefined && key.value !== undefined)) {
        return this.key === key.key;
      } else if (typeof(key) === 'string') {
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
      return this.key;
    }

  };


  /**
   * Represents an Enum with enum items.
   * @param {Array || Object}  map     This are the enum items.
   * @param {String || Object} options This are options. [optional]
   */
  function Enum(map, options) {

    if (options && typeof(options) === 'string') {
      options = { name: options };
    }

    this._options = options || {};
    this._options.separator = this._options.separator || ' | ';

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
      this[member] = new EnumItem(member, map[member]);
      this.enums.push(this[member]);
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
  }

  Enum.prototype = {

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
      } else {
        return null;
      }
    },

    /**
     * Returns the appropriate EnumItem.
     * @param  {EnumItem || String || Number} key The object to get with.
     * @return {EnumItem}                         The get result.
     */
    get: function(key) {
      if (key === null || key === undefined) return null;

      if (key instanceof EnumItem || (typeof(key) === 'object' && key.key !== undefined && key.value !== undefined)) {
        var foundIndex = this.enums.indexOf(key);
        if (foundIndex >= 0) {
          return key;
        }
        if (!this.isFlaggable || (this.isFlaggable && key.key.indexOf(this._options.separator) < 0)) {
          return null;
        }
        return this.get(key.key);
      } else if (typeof(key) === 'string') {
        if (key.indexOf(this._options.separator) > 0) {
          var parts = key.split(this._options.separator);

          var value = 0;
          for(var i = 0; i < parts.length; i++) {
            var part = parts[i];

            value |= this[part].value;
          }

          return new EnumItem(key, value);
        } else {
          return this[key];
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
    }

  };


  if (module && module.exports) {
    module.exports = Enum;
  } else if (define) {
    define(function () {
      return Enum;
    });
  } else {
    root.Enum = Enum;
  }

  if (module && module.exports && global) {

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
  }

}(
  this,
  typeof(module) !== 'undefined' ? module : undefined,
  typeof(global) !== 'undefined' ? global : undefined,
  typeof(define) !== 'undefined' ? define : undefined
));