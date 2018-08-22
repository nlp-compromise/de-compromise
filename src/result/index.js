'use strict';
//a Text is an array of termLists
const getters = require('./getters');

function Text(arr, lexicon, reference) {
  this.list = arr || [];
  this.lexicon = lexicon;
  this.reference = reference;
  //apply getters
  let keys = Object.keys(getters);
  for (let i = 0; i < keys.length; i++) {
    Object.defineProperty(this, keys[i], {
      get: getters[keys[i]]
    });
  }
}
require('./methods/loops')(Text);
require('./methods/out')(Text);
require('./methods/misc')(Text);

module.exports = Text;
