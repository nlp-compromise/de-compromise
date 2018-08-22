'use strict';

//thanks germany!
const capitalStep = ts => {
  const reason = 'titlecase-noun';
  ts.terms.forEach((t, i) => {
    if (i === 0) {
      return;
    }
    //is titleCase?
    if (/^[A-Z][a-z-]+$/.test(t.text) === true) {
      t.tag('Substantiv', reason);
    }
  });
  return ts;
};
module.exports = capitalStep;
