const suffixes = require('./data/suffixes.json');
const mapping = {
  NN: 'Substantiv',
  VB: 'Verb',
  JJ: 'Adjektiv',
  RB: 'Adverb',
};
const suffixStep = function(ts) {
  ts.terms.forEach((t, i) => {
    if (Object.keys(t.tags).length > 0) {
      return;
    }
    //try each suffix-siz
    [5, 4, 3, 2].forEach((num) => {
      let str = ts.terms[i].normal;
      let len = str.length;
      if (len <= num) {
        return;
      }
      let suffix = str.slice(len - num, len);
      if (suffixes[num][suffix]) {
        let tag = mapping[suffixes[num][suffix]];
        console.log(suffix, tag);
        t.tag(tag, 'suffix-' + suffix);
      }
    });
  });
  return ts;
};
module.exports = suffixStep;
