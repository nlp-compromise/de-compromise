
//make it a noun if it's title-case
const capitalStep = function(ts) {
  ts.terms.forEach((t, i) => {
    //if it's titlecase, make it a noun
    if (i > 0 && /[A-Z][a-z]/.test(t.text) && Object.keys(t.tags).length === 0) {
      t.tag('Substantiv', 'title-case');
    }
  });
  return ts;
};
module.exports = capitalStep;
