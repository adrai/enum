var Enum = require('../lib/enum.js');

module.exports = function() {
  new Enum(['A', 'B', 'C'], {
    freez: true
  });
};
