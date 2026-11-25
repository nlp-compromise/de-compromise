import { toImperative, toPresent } from './conjugate.js'
import { fromImperative, fromPresent } from './toRoot.js'

// find the infinitive of an imperative - 'gib' -> 'geben', 'geh' -> 'gehen', 'kommt' -> 'kommen'
// the singular is often cut short - 'geh!' for 'gehe!'

// old + new spelling - 'laß' and 'lass'
const norm = (str) => (str || '').replace(/ß$/, 'ss')

// is this word the singular imperative of this verb?
const isSingular = function (str, inf) {
  const want = norm(toImperative(inf).secondSingular)
  return Boolean(want) && (want === norm(str) || want === str + 'e' || want + 'e' === str)
}

// is it the plural? - this is also the present-tense 'ihr' form
const isPlural = function (str, inf) {
  return norm(toImperative(inf).secondPlural) === norm(str) || toPresent(inf).secondPlural === str
}

// returns { root, form } or null
// - 'isVerb' is a function that says if an infinitive is one that we know
const parseImperative = function (str, isVerb) {
  const guesses = [
    fromImperative(str, 'singular'),
    fromImperative(str + 'e', 'singular'),
    // 'geh' -> 'gehen', 'tu' -> 'tun', 'sammle' -> 'sammeln'
    str + 'en',
    str + 'n',
    str.replace(/le$/, 'eln'),
    str.replace(/re$/, 'ern'),
  ]
  let found = guesses.find((inf) => inf && inf !== str && isVerb(inf) && isSingular(str, inf))
  if (found) {
    return { root: found, form: 'singular' }
  }
  found = [fromImperative(str, 'plural'), fromPresent(str, 'secondPlural')].find((inf) => {
    return inf && inf !== str && isVerb(inf) && isPlural(str, inf)
  })
  return found ? { root: found, form: 'plural' } : null
}

export default parseImperative
