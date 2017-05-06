'use strict';
const suffixTest = require('./lib/suffixTest');

const patterns = {
  femaleNouns: [require('./patterns/femaleNouns'), 'FemininSubst'],
  maleNouns: [require('./patterns/maleNouns'), 'MannlichSubst'],
  neuterNouns: [require('./patterns/neuterNouns'), 'SachlichSubst'],
};

//
const genderStep = (ts) => {
  const reason = 'suffix-match';
  const keys = Object.keys(patterns);
  ts.terms.forEach((t) => {
    //only try nouns
    if (t.tags.Substantiv !== true) {
      return;
    }
    for(let i = 0; i < keys.length; i++) {
      if (suffixTest(t, patterns[keys[i]][0]) === true) {
        t.tag(patterns[keys[i]][1], reason);
        return;
      }
    }
  });
  return ts;
};
module.exports = genderStep;
