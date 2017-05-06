'use strict';
const unpack = require('./efrt-unpack');

//order doesn't (shouldn't) matter here
const data = {
  adverbs: [require('./_packed/_adverbs'), 'Adverb'],
  auxiliaries: [require('./_packed/_auxiliaries'), 'Hilfsverb'],
  conjunctions: [require('./_packed/_conjunctions'), 'Bindewort'],
  determiners: [require('./_packed/_determiners'), 'Determinativ'],
  infinitives: [require('./_packed/_infinitives'), 'Infinitiv'],
  pronouns: [require('./_packed/_pronouns'), 'Pronomen'],

  adjectives: [require('./_packed/_adjectives'), 'Adjektiv'],
  verbs: [require('./_packed/_verbs'), 'Verb'],

  maleNouns: [require('./_packed/_maleNouns'), 'MannlichSubst'],
  femaleNouns: [require('./_packed/_femaleNouns'), 'FemininSubst'],
  neuterNouns: [require('./_packed/_neuterNouns'), 'SachlichSubst'],
};
Object.keys(data).forEach((k) => {
  let tag = data[k][1];
  data[k] = {
    obj: unpack(data[k][0]).toObject(),
    tag: tag
  };
});

module.exports = data;
