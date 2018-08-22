const data = require('./data');
let have = {};

Object.keys(data).forEach(k => {
  for (let i = 0; i < data[k].length; i++) {
    let word = data[k][i];
    if (have[word]) {
      console.log(word, have[word], k);
    } else {
      have[word] = k;
    }
  }
});

// let arr = data.verbs;
// console.log(arr.length);
// arr = arr.filter((s) => {
//   return !data.infinitives.includes(s);
// });
// console.log(arr.length);
// console.log(JSON.stringify(arr, null, 2));
