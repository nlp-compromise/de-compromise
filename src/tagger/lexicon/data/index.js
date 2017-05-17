module.exports = {
  adjectives: require('./adjectives'),
  adverbs: require('./adverbs'),
  auxiliaries: require('./auxiliaries'),
  conjunctions: require('./conjunctions'),
  determiners: require('./determiners'),
  infinitives: require('./infinitives'),
  nouns: require('./nouns'),
  prepositions: require('./prepositions'),
  pronouns: require('./pronouns'),
  values: require('./values'),
  verbs: require('./verbs'),

  femaleNouns: require('./female-nouns'),
  maleNouns: require('./male-nouns'),
  neuterNouns: require('./neuter-nouns'),
};


// function uniq(a) {
//   var seen = {};
//   return a.filter(function(item) {
//     return seen.hasOwnProperty(item) ? false : (seen[item] = true);
//   });
// }
//
// Object.keys(module.exports).forEach((k) => {
//   let arr = module.exports[k];
//   let before = arr.length;
//   arr = uniq(arr);
//   if (before !== arr.length) {
//     console.log(k);
//   }
// });
//
// let k = 'pronouns';
// let arr = module.exports[k];
// arr = uniq(arr);
// console.log(JSON.stringify(arr, null, 2));
