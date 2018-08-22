'use strict';
//if we have no tags, make it a noun
const nounFallback = ts => {
  ts.terms.forEach(t => {
    if (Object.keys(t.tags).length === 0) {
      t.tag('Substantiv', 'noun-fallback');
    }
  });
  return ts;
};
module.exports = nounFallback;
