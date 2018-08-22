'use strict';
const capitalStep = require('./capital-step');
const lexStep = require('./lexicon-step');
const suffixStep = require('./suffix-step');
const nounFallback = require('./noun-fallback');
const genderStep = require('./gender-step');
//
const tagger = ts => {
  // look against known-words
  ts = lexStep(ts);
  // look at titlecase terms
  ts = capitalStep(ts);
  // look at known-suffixes
  ts = suffixStep(ts);
  // assume nouns, otherwise
  ts = nounFallback(ts);
  // guess gender for nouns, adjectives
  ts = genderStep(ts);
  return ts;
};
module.exports = tagger;
