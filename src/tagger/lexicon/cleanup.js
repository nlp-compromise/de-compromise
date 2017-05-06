const data = require('./data');
let have = {};

Object.keys(data).forEach((k) => {
  for(let i = 0; i < data[k].length; i++) {
    let word = data[k][i];
    if (have[word]) {
      console.log(word, have[word], k);
    } else {
      have[word] = k;
    }
  }
});
