var ldv;
if (typeof window !== undefined) {
  ldv = require('../../../src/index');
// nlp = require('../../../builds/compromise');
// nlp = require('../../../builds/compromise.min');
} else {
  ldv = window.ldv;
  alert('browser');
}

module.exports = ldv;
