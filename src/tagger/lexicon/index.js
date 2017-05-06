'use strict';
const unpack = require('./efrt-unpack');
const data = {
  adverbs: require('./_packed/_adverbs'),
  auxiliaries: require('./_packed/_auxiliaries'),
  conjunctions: require('./_packed/_conjunctions'),
  determiners: require('./_packed/_determiners'),
  infinitives: require('./_packed/_infinitives'),
  pronouns: require('./_packed/_pronouns'),
  adjectives: require('./_packed/_adjectives'),
  verbs: require('./_packed/_verbs'),
};
Object.keys(data).forEach((k) => {
  data[k] = unpack(data[k]);
  data[k].cache();
  data[k] = data[k].toObject();
});
console.log(data);
module.exports = data;
