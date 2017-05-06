'use strict';
const unpack = require('./efrt-unpack');

//order doesn't (shouldn't) matter here
const data = {
  adjectives: [require('./_packed/_adjectives'), 'Adjektiv'],
  adverbs: [require('./_packed/_adverbs'), 'Adverb'],
  auxiliaries: [require('./_packed/_auxiliaries'), 'Hilfsverb'],
  conjunctions: [require('./_packed/_conjunctions'), 'Bindewort'],
  determiners: [require('./_packed/_determiners'), 'Determinativ'],
  femaleNouns: [require('./_packed/_femaleNouns'), 'FemininSubst'],
  infinitives: [require('./_packed/_infinitives'), 'Infinitiv'],
  maleNouns: [require('./_packed/_maleNouns'), 'MannlichSubst'],
  neuterNouns: [require('./_packed/_neuterNouns'), 'SachlichSubst'],
  nouns: [require('./_packed/_nouns'), 'Substantiv'],
  prepositions: [require('./_packed/_prepositions'), 'Praposition'],
  pronouns: [require('./_packed/_pronouns'), 'Pronomen'],
  values: [require('./_packed/_values'), 'Zahl'],
  verbs: [require('./_packed/_verbs'), 'Verb'],
};
Object.keys(data).forEach((k) => {
  let tag = data[k][1];
  data[k] = {
    obj: unpack(data[k][0]).toObject(),
    tag: tag
  };
});

module.exports = data;
