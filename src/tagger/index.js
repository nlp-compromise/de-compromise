const suffixStep = require('./suffix-step');
const capitalStep = require('./capital-step');

//
const tagger = function(ts) {
  ts = suffixStep(ts);
  ts = capitalStep(ts);
  return ts;
};
module.exports = tagger;
