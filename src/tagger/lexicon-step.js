'use strict';
const adverbs = require('./lexicon/adverbs');
const auxiliaries = require('./lexicon/auxiliaries');
const conjunctions = require('./lexicon/conjunctions');
const determiners = require('./lexicon/determiners');
const infinitives = require('./lexicon/infinitives');
const pronouns = require('./lexicon/pronouns');
const verbs = require('./lexicon/verb-exceptions');
const adjectives = require('./lexicon/adj-exceptions');

const lexStep = (ts) => {
  const reason = 'lexicon-match';
  ts.terms.forEach((t) => {
    if (adverbs[t.normal] !== undefined) {
      t.tag('Adverb', reason);
    }
    if (auxiliaries[t.normal] !== undefined) {
      t.tag('Hilfsverb', reason);
    }
    if (conjunctions[t.normal] !== undefined) {
      t.tag('Bindewort', reason);
    }
    if (determiners[t.normal] !== undefined) {
      t.tag('Determinativ', reason);
    }
    if (infinitives[t.normal] !== undefined) {
      t.tag('Infinitiv', reason);
    }
    if (pronouns[t.normal] !== undefined) {
      t.tag('Pronomen', reason);
    }
    if (verbs[t.normal] !== undefined) {
      t.tag('Verb', reason);
    }
    if (adjectives[t.normal] !== undefined) {
      t.tag('Adjektiv', reason);
    }
  });
  return ts;
};
module.exports = lexStep;
