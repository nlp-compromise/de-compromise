import list from '/Users/spencer/mountain/de-compromise/data/lexicon/nouns/male-nouns.js'
import suffixes from '/Users/spencer/mountain/de-compromise/src/02-two/preTagger/model/suffixes.js'

//sweep-through all suffixes
const suffixLoop = function (str = '') {
  const len = str.length
  let max = 10
  if (len <= max) {
    max = len - 1
  }
  for (let i = max; i > 1; i -= 1) {
    let suffix = str.substr(len - i, len)
    if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
      // console.log(suffix)
      let tag = suffixes[suffix.length][suffix]
      return tag
    }
  }
  return null
}

// decide tag from the ending of the word


const topk = function (arr) {
  let obj = {}
  arr.forEach(a => {
    obj[a] = obj[a] || 0
    obj[a] += 1
  })
  let res = Object.keys(obj).map(k => [k, obj[k]])
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
}

let arr = []
list.forEach(str => {
  if (suffixLoop(str) === null) {
    arr.push(str.substring(str.length - 3, str.length))
  }
})
console.log(topk(arr))

// console.log(list.length)
// let out = list.filter(str => {
//   if (!suffixLoop(str)) {
//     console.log(str)
//   }
//   return suffixLoop(str) !== 'Verb'
// })
// console.log(out.length)
// console.log(JSON.stringify(out, null, 2))