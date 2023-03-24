import toRoot from './toRoot.js'
import model from '/Users/spencer/mountain/de-compromise/data/models/nouns.js'

let all = []
let suff = ''


const topk = function (arr) {
  let obj = {}
  arr.forEach(a => {
    obj[a] = obj[a] || 0
    obj[a] += 1
  })
  let res = Object.keys(obj).map(k => [k, obj[k]])
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
}

const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};


let ends = []
let correct = 0
let total = 0
Object.keys(model).forEach(inf => {
  model[inf].s.forEach(str => {
    let have = toRoot(str)
    total += 1
    if (have === inf) {
      correct += 1
    } else {
      ends.push(str.substring(str.length - 4, str.length))
      if (str.endsWith('ist')) {

        console.log(inf, str, have)
      }
    }
  })
})
console.log(percent(correct, total))
console.log(topk(ends))