'use strict';
const buildResult = require('./result/build');
const pkg = require('../package.json');
const log = require('./log');

//the main thing
const ldv = function(str, lexicon) {
  // this.tagset = tagset;
  let r = buildResult(str, lexicon);
  r.tagger();
  return r;
};

//same as main method, except with no POS-tagging.
ldv.tokenize = function(str) {
  return buildResult(str);
};

//this is useful
ldv.version = pkg.version;

//turn-on some debugging
ldv.verbose = function(str) {
  log.enable(str);
};

//and then all-the-exports...
if (typeof self !== 'undefined') {
  self.ldv = ldv; // Web Worker
} else if (typeof window !== 'undefined') {
  window.ldv = ldv; // Browser
} else if (typeof global !== 'undefined') {
  global.ldv = ldv; // NodeJS
}
//don't forget amd!
if (typeof define === 'function' && define.amd) {
  define(ldv);
}
//then for some reason, do this too!
if (typeof module !== 'undefined') {
  module.exports = ldv;
}
