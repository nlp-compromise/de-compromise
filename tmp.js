import infs from '/Users/spencer/mountain/de-compromise/data/lexicon/verbs/infinitives.js'
import verbs from '/Users/spencer/mountain/de-compromise/data/lexicon/verbs/verbs.js'

let hasVerb = new Set(verbs)
import conj from '/Users/spencer/mountain/de-compromise/src/01-one/lexicon/methods/conjugate.js'

let dupes = new Set([])
infs.forEach(inf => {
  let pres = conj.toPresent(inf)
  if (hasVerb.has(pres)) {
    console.log(inf, pres)
    dupes.add(pres)
  }
  let past = conj.toPast(inf)
  if (hasVerb.has(past)) {
    // console.log(inf, past)
    dupes.add(past)
  }
})


console.log(verbs.length)
let less = verbs.filter(str => !dupes.has(str))
console.log(less.length)
console.log(JSON.stringify(less, null, 2))