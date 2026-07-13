import lexData from './_data.js'
import { unpack } from 'efrt'
import { toPresent, toPast, toSubjunctive1, toSubjunctive2, toImperative, toPastParticiple, toPresentParticiple } from './methods/verbs/conjugate.js'
import inflectAdj from './methods/adjectives/inflect.js'
import inflectNoun from './methods/nouns/toPlural.js'
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

// a generated form may upgrade a bare 'Verb' entry to something richer,
// but never overwrites a more-specific word
const canEnrich = (lex, w) => !lex[w] || lex[w] === 'Verb'

const addWords = function (obj, tag, lex) {
  Object.keys(obj).forEach(k => {
    let w = obj[k]
    if (canEnrich(lex, w) && tagMap[k]) {
      lex[w] = [tag, tagMap[k]]
    }
  })
}

// 1st pass - add all words directly from the lexicon
let unpacked = {}
Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  unpacked[tag] = Object.keys(wordsObj)
  unpacked[tag].forEach(w => {
    lexicon[w] = lexicon[w] || tag
    if (tag === 'Possessive') {
      lexicon[w] = ['Pronoun', 'Possessive']
    }
  })
})

// 2nd pass - generate inflections; never overwrite a real word
Object.keys(unpacked).forEach(tag => {
  unpacked[tag].forEach(w => {

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // add present tense
      let obj = toPresent(w)
      addWords(obj, 'PresentTense', lexicon)
      // participles
      let str = toPresentParticiple(w)
      if (canEnrich(lexicon, str)) {
        lexicon[str] = ['Participle', 'PresentTense']
      }
      str = toPastParticiple(w)
      if (canEnrich(lexicon, str)) {
        lexicon[str] = ['Participle', 'PastTense']
      }
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
    // add plural forms for our nouns
    if (tag === 'Noun' || tag === 'MaleNoun' || tag === 'FemaleNoun' || tag === 'NeuterNoun') {
      let plural = inflectNoun(w).one
      if (plural && plural !== w) {
        if (!lexicon[plural]) {
          lexicon[plural] = 'Plural'
        } else if (typeof lexicon[plural] === 'string' && /Noun$/.test(lexicon[plural])) {
          // 'kinder' is hand-listed as a noun - mark it plural too
          lexicon[plural] = [lexicon[plural], 'Plural']
        }
      }
    }
  })
})
// console.log(lexicon['zweite'])
export default lexicon
