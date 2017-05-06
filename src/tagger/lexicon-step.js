'use strict';
const lex = require('./lexicon');

const lexStep = (ts) => {
  const reason = 'lexicon-match';
  const keys = Object.keys(lex);
  //each term
  for(let i = 0; i < ts.terms.length; i++) {
    let t = ts.terms[i];
    //each lexicon:
    for(let o = 0; o < keys.length; o++) {
      let k = keys[o];
      if (lex[k].obj[t.normal] !== undefined) {
        t.tag(lex[k].tag, reason);
        break;
      }
    }
  }
  return ts;
};
module.exports = lexStep;
