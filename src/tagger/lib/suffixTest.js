'use strict';

const suffixTest = (t, list) => {
  let len = t.normal.length;
  for(let i = 1; i < list.length; i++) {
    if (t.normal.length <= i) {
      return false;
    }
    let str = t.normal.substr(len - i, len - 1);
    if (list[i][str] !== undefined) {
      return true;
    }
  }
  return false;
};
module.exports = suffixTest;
