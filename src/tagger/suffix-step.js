'use strict';
//basic POS-tags (gender done afterwards)
const rules = require('./patterns/patterns');
//pivot it by str length
let suffixes = [{}, {}, {}, {}, {}];
Object.keys(rules).forEach((tag) => {
  for(let i = 0; i < rules[tag].length; i++) {
    let str = rules[tag][i];
    suffixes[str.length][str] = tag;
  }
});

//
const suffixStep = (ts) => {
  const reason = 'suffix-match';
  ts.terms.forEach((t) => {
    //skip already-tagged terms
    if (Object.keys(t.tags).length > 0) {
      return;
    }
    let len = t.normal.length;
    //each suffix step
    for(let i = 3; i >= 2; i--) {
      if (len <= i) {
        continue;
      }
      let suffix = t.normal.slice(len - i - 1, len);
      if (suffixes[suffix.length][suffix] !== undefined) {
        t.tag(suffixes[suffix.length][suffix], reason);
        break;
      }
    }
  });
  return ts;
};
module.exports = suffixStep;
