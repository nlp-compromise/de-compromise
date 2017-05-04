'use strict';
const lexicon = require('../data/lexicon');

const lexStep = (ts) => {
  ts.terms.forEach((t) => {
    if (lexicon[t.normal] !== undefined) {
      t.tag(lexicon[t.normal], 'lexicon-match');
    }
  });
  return ts;
};
module.exports = lexStep;
