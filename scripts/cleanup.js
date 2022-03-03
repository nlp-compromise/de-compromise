import keep from '../data/lexicon/verbs/modals.js'
import og from '../data/lexicon/verbs/verbs.js'

// import messy from '../data/lexicon/people/femaleNames.js'
// const unique = function (arr) {
//   let obj = {}
//   for (let i = 0; i < arr.length; i += 1) {
//     obj[arr[i]] = true
//   }
//   return Object.keys(obj)
// }

// console.log(JSON.stringify(unique(messy), null, 2))


let loose = og.filter(str => {
  let found = keep.find(s => s === str)
  if (found) {
    // console.log(str)
    return false
  }
  return true
})

// console.log(og.length)
// console.log(loose.length)
console.log(JSON.stringify(loose, null, 2))