/* eslint-disable no-console, no-unused-vars */
import model from '/Users/spencer/mountain/de-compromise/data/models/adjectives/adjectives.js'
import convert from './inflect.js'

let all = []
let suff = ''


const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};

// const topk = function (arr) {
//   let obj = {}
//   arr.forEach(a => {
//     obj[a] = obj[a] || 0
//     obj[a] += 1
//   })
//   let res = Object.keys(obj).map(k => [k, obj[k]])
//   return res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
// }



let tests = [
  { prop: 'one', n: 0 },
  { prop: 'two', n: 1 },
  { prop: 'three', n: 2 },
  { prop: 'four', n: 3 },
]
tests.forEach(obj => {
  let good = 0
  Object.keys(model).forEach(inf => {
    let have = convert(inf)[obj.prop]
    if (have === model[inf][obj.n]) {
      good += 1
    } else {
      if (inf.endsWith(suff)) {
        all.push(inf.substring(inf.length - (suff.length + 1)))
        // console.log(inf.padEnd(12), model[inf][n])
        //   console.log(inf, model[inf][0], have,)
      }
    }
  })
  console.log(obj.prop, percent(good, Object.keys(model).length))
})
// console.log(topk(all))