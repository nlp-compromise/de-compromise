import { findSplits } from '../../../../01-one/splitter/compute/splitter.js'

// these join number-words together
const glue = new Set(['und', 'ein', 'minus'])
// an inflected ordinal - 'einhundertzweiten'
const isEnding = /^[nrsm]$/

const getTag = function (str, lex) {
  if (str === 'hunderttausend') {
    return 'TextCardinal'
  }
  const tag = lex.hasOwnProperty(str) ? lex[str] : null
  return tag === 'TextCardinal' || tag === 'TextOrdinal' ? tag : null
}

// a word made only of number-words is a number - 'einhundertzweite', 'dreitausendvier'
const numberWord = function (terms, i, world) {
  const term = terms[i]
  if (term.tags.size !== 0) {
    return null
  }
  const lex = world.model.one.lexicon
  const values = world.model.one.splitter.values
  const parts = findSplits(term.normal, values)
  if (parts.length < 2) {
    return null
  }
  let hasEnding = false
  if (parts.length > 2 && isEnding.test(parts[parts.length - 1])) {
    parts.pop()
    hasEnding = true
  }
  if (!parts.every(str => glue.has(str) || getTag(str, lex))) {
    return null
  }
  // the last word decides it - 'einhundert[zweite]'
  const tag = getTag(parts[parts.length - 1], lex)
  if (!tag || (hasEnding && tag !== 'TextOrdinal')) {
    return null
  }
  world.methods.one.setTag([term], tag, world, false, '2-number-word')
  term.confidence = 0.8
  return true
}
export default numberWord
