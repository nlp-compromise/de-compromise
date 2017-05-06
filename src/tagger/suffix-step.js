'use strict';
//basic POS-tags (gender done afterwards)
const patterns = {
  adjectives: [require('./patterns/adjectives'), 'Adjektiv'],
  nouns: [require('./patterns/nouns'), 'Substantiv'],
  verbs: [require('./patterns/verbs'), 'Verb'],
};

const testSuffixes = (t, list) => {
  let len = t.normal.length;
  for(let i = 1; i < list.length; i++) {
    if (t.normal.length <= i) {
      return false;
    }
    let str = t.normal.substr(len - i, len - 1);
    if (list[i][str] !== undefined) {
      return true;
    }
  }
  return false;
};
//
const suffixStep = (ts) => {
  const reason = 'suffix-match';
  const keys = Object.keys(patterns);
  ts.terms.forEach((t) => {
    //skip already-tagged terms
    if (Object.keys(t.tags).length > 0) {
      return;
    }
    for(let i = 0; i < keys.length; i++) {
      if (testSuffixes(t, patterns[keys[i]][0]) === true) {
        t.tag(patterns[keys[i]][1], reason);
        return;
      }
    }
  });
  return ts;
};
module.exports = suffixStep;
