'use strict';
const capitalStep = require('./capital-step');
const lexStep = require('./lexicon-step');
const suffixStep = require('./suffix-step');
const nounFallback = require('./noun-fallback');

//
const tagger = (ts) => {
  ts = capitalStep(ts);
  ts = lexStep(ts);
  ts = suffixStep(ts);
  ts = nounFallback(ts);
  return ts;
};
module.exports = tagger;
