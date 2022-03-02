import keep from '../data/lexicon/infinitives.js'
import og from '../data/lexicon/verbs.js'

let loose = og.filter(str => {
  let found = keep.find(s => s === str)
  if (found) {
    return false
  }
  return true
})

// console.log(og.length)
// console.log(loose.length)
console.log(JSON.stringify(loose, null, 2))