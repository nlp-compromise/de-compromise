'use strict';
const lexStep = require('./lexicon-step');
const suffixStep = require('./suffix-step');

//
const tagger = (ts) => {
  ts = lexStep(ts);
  ts = suffixStep(ts);
  return ts;
};
module.exports = tagger;
