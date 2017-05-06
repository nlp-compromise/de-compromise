'use strict';
const Terms = require('../paths').Terms;


const miscMethods = (Text) => {

  const methods = {

    terms: function() {
      let list = [];
      //make a Terms Object for every Term
      this.list.forEach((ts) => {
        ts.terms.forEach((t) => {
          list.push(new Terms([t], ts.lexicon, this));
        });
      });
      let r = new Text(list, this.lexicon, this.parent);
      return r;
    },

  };

  //hook them into result.proto
  Object.keys(methods).forEach((k) => {
    Text.prototype[k] = methods[k];
  });
  return Text;
};

module.exports = miscMethods;
