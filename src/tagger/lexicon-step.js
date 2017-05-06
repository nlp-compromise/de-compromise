'use strict';
const lex = require('./lexicon');


const lexStep = (ts) => {
  const reason = 'lexicon-match';
  ts.terms.forEach((t) => {
    if (lex.adverbs[t.normal] !== undefined) {
      t.tag('Adverb', reason);
    }
    if (lex.auxiliaries[t.normal] !== undefined) {
      t.tag('Hilfsverb', reason);
    }
    if (lex.conjunctions[t.normal] !== undefined) {
      t.tag('Bindewort', reason);
    }
    if (lex.determiners[t.normal] !== undefined) {
      t.tag('Determinativ', reason);
    }
    if (lex.infinitives[t.normal] !== undefined) {
      t.tag('Infinitiv', reason);
    }
    if (lex.pronouns[t.normal] !== undefined) {
      t.tag('Pronomen', reason);
    }
    if (lex.verbs[t.normal] !== undefined) {
      t.tag('Verb', reason);
    }
    if (lex.adjectives[t.normal] !== undefined) {
      t.tag('Adjektiv', reason);
    }
  });
  return ts;
};
module.exports = lexStep;
