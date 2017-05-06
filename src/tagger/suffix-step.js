'use strict';
const adjPatterns = require('./patterns/adj');
const verbPatterns = require('./patterns/verbs');
const nounPatterns = require('./patterns/nouns');

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
  ts.terms.forEach((t) => {
    if (Object.keys(t.tags).length > 0) {
      return;
    }
    if (testSuffixes(t, adjPatterns) === true) {
      t.tag('Adjektiv', reason);
      return;
    }
    if (testSuffixes(t, verbPatterns) === true) {
      t.tag('Verb', reason);
      return;
    }
    if (testSuffixes(t, nounPatterns) === true) {
      t.tag('Substantiv', reason);
      return;
    }
  });
  return ts;
};
module.exports = suffixStep;
