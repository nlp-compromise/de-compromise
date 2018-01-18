'use strict';
const pkg = require('../package.json');
const core = require('compromise-core');
var jsonFn = require('json-fn')
// const core = require('/Users/spencer/nlp/core/src/index.js');
const russian = require('./_data')
const fns = require('./_fns')

//apply our russian plugin..
core.plugin(russian)

//parse our pre/post code back into fns
if (fns.preProcess) {
  core.addPreProcess(jsonFn.parse(fns.preProcess))
}
if (fns.postProcess) {
  core.addPostProcess(jsonFn.parse(fns.postProcess))
}
//the main function
const nlp = function(str, lex) {
  return core(str, lex)
};

//this is handy
nlp.version = pkg.version;

//and then all-the-exports...
if (typeof self !== 'undefined') {
  self.nlp = nlp; // Web Worker
} else if (typeof window !== 'undefined') {
  window.nlp = nlp; // Browser
} else if (typeof global !== 'undefined') {
  global.nlp = nlp; // NodeJS
}
//don't forget amd!
if (typeof define === 'function' && define.amd) {
  define(nlp);
}
//then for some reason, do this too!
if (typeof module !== 'undefined') {
  module.exports = nlp;
}
