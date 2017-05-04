'use strict';
const lexStep = require('./lexicon-step');

//
const tagger = (ts) => {
  ts = lexStep(ts);
  return ts;
};
module.exports = tagger;
