import lexData from './_data.js'
import { unpack } from 'efrt'
import { toPresent, toPast, toSubjunctive1, toSubjunctive2, toImperative, toPastParticiple, toPresentParticiple } from './methods/verbs/conjugate.js'
import inflectAdj from './methods/adjectives/inflect.js'
import inflectNoun from './methods/nouns/inflect.js'
import misc from './misc.js'

let lexicon = Object.assign({}, misc)

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
    if (!lex[w] && tagMap[k]) {
      lex[w] = [tag, tagMap[k]]
    }
  })
}

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = lexicon[w] || tag

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // add present tense
      let obj = toPresent(w)
      addWords(obj, 'PresentTense', lexicon)
      // participles
      let str = toPresentParticiple(w)
      lexicon[str] = lexicon[str] || ['Participle', 'PresentTense']
      str = toPastParticiple(w)
      lexicon[str] = lexicon[str] || ['Participle', 'PastTense']
      // add past tense
      obj = toPast(w)
      addWords(obj, 'PastTense', lexicon)
      // add sunjunctives
      obj = toSubjunctive1(w)
      addWords(obj, 'Verb', lexicon)
      obj = toSubjunctive2(w)
      addWords(obj, 'Verb', lexicon)
      // add imperative
      obj = toImperative(w)
      addWords(obj, 'Imperative', lexicon)
    }
    // inflect our adjectives
    if (tag === 'Adjective') {
      let obj = inflectAdj(w)
      addWords(obj, 'Adjective', lexicon)
    }
    if (tag === 'Noun') {
      let obj = inflectNoun(w)
      addWords(obj, 'Noun', lexicon)
    }
    if (tag === 'Possessive') {
      lexicon[w] = ['Pronoun', 'Possessive']
    }
  })
})
// console.log(lexicon['zweite'])
export default lexicon