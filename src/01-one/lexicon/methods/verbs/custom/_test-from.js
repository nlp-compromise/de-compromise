import pairs from '/Users/spencer/mountain/de-compromise/data/models/verbs/past-participle.js'
import fromPastParticiple from './fromPastParticiple.js'
import fs from 'fs'

const inspect = ''

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

// collect errors to look at
let right = 0
let bads = []
pairs.forEach(a => {
  let [inf, prt] = a
  let have = fromPastParticiple(prt)
  if (have === inf) {
    right += 1
  } else {
    // if (prt.endsWith(inspect)) {
    bads.push([a[0], a[1], have])
    // }
  }
})

// let suffs = bads.map(a => a[1].substring(a[1].length - inspect.length, a[1].length))
let suffs = bads.map(a => a[1].substring(a[1].length - inspect.length - 4, a[1].length))
// bads = bads.filter(a => a[2].startsWith('ge') && !a[1].startsWith('ge'))
// let suffs = bads.map(a => a[0].substring(0, 3))
console.log(topk(suffs))
// console.log(bads.filter(a => a[0].startsWith('au')))
// console.log(bads.filter(a => a[0].endsWith('ren')))
// console.log(bads.filter(a => a[1].endsWith('gen')))
// fs.writeFileSync('./tmp.json', JSON.stringify(bads, null, 2))

console.log(bads.length, 'errors')
console.log(percent(right, pairs.length) + '%')
// console.log('\n\n', toPastParticiple("enthalten"))
// console.log(bads)
// 67%