'use strict';
const lex = require('./lexicon');

const lexStep = (ts) => {
  const reason = 'lexicon-match';
  //each lexicon:
  Object.keys(lex).forEach((k) => {
    //each term
    for(let i = 0; i < ts.terms.length; i++) {
      let t = ts.terms[i];
      if (lex[k].obj[t.normal] !== undefined) {
        t.tag(lex[k].tag, reason);
      }
    }
  });
  return ts;
};
module.exports = lexStep;
