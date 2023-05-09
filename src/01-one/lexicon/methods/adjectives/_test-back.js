/* eslint-disable no-console, no-unused-vars */
import toRoot from './toRoot.js'
import model from '/Users/spencer/mountain/de-compromise/data/models/adjectives/adjectives.js'

// let all = []
// let suff = ''


const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};


let correct = 0
let total = 0
Object.keys(model).forEach(inf => {
  model[inf].forEach(str => {
    let have = toRoot(str)
    total += 1
    if (have === inf) {
      correct += 1
    } else {
      console.log(inf, have)
    }
  })
})
console.log(percent(correct, total))