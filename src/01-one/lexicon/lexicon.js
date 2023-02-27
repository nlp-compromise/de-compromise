import lexData from './_data.js'
import { unpack } from 'efrt'
import { toPresent, toPast, toSubjunctive1, toSubjunctive2, toImperative, } from './methods/verbs/conjugate.js'


let lexicon = {}
const tagMap = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}

const addWords = function (obj, tag, lex) {
  Object.keys(obj).forEach(k => {
    let w = obj[k]
    if (!lex[w]) {
      lex[w] = [tag, tagMap[k]]
    }
  })
}


Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // add present tense
      let obj = toPresent(w)
      addWords(obj, 'PresentTense', lexicon)
      // add past tense
      obj = toPast(w)
      addWords(obj, 'PastTense', lexicon)
      // add sunjunctives
      obj = toSubjunctive1(w)
      addWords(obj, 'Subjunctive1', lexicon)
      obj = toSubjunctive2(w)
      addWords(obj, 'Subjunctive2', lexicon)
      // add imperative
      obj = toImperative(w)
      addWords(obj, 'Imperative', lexicon)
    }

  })
})
export default lexicon