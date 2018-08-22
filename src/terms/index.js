'use strict';
const build = require('./build');
const getters = require('./getters');
const tagger = require('../tagger');

//Terms is an array of Term objects, and methods that wrap around them
const Terms = function(arr, lexicon, refText, refTerms) {
  this.terms = arr;
  this.lexicon = lexicon;
  this.refText = refText;
  this._refTerms = refTerms;
  this.count = undefined;
  this.get = n => {
    return this.terms[n];
  };
  //apply getters
  let keys = Object.keys(getters);
  for (let i = 0; i < keys.length; i++) {
    Object.defineProperty(this, keys[i], getters[keys[i]]);
  }
};

Terms.prototype.tagger = function() {
  return tagger(this);
};

require('./methods/misc')(Terms);
require('./methods/out')(Terms);
require('./methods/loops')(Terms);

Terms.fromString = function(str, lexicon) {
  let termArr = build(str);
  let ts = new Terms(termArr, lexicon, null);
  //give each term a reference to this ts
  ts.terms.forEach(t => {
    t.parentTerms = ts;
  });
  return ts;
};
module.exports = Terms;
