import lexData from './_data.js'
import { unpack } from 'efrt'
import conjugate from './methods/conjugate.js'


let lexicon = {}

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // add present tense
      let pres = conjugate.toPresent(w)
      if (pres && pres !== w) {
        lexicon[pres] = 'PresentTense'
      }
      // add past tense
      let past = conjugate.toPast(w)
      if (past && past !== w) {
        lexicon[past] = 'PastTense'
      }
    }

  })
})
// console.log(lexicon)

export default lexicon