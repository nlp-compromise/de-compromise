import nlp from './_lib.js'
import lexicon from './01-one/lexicon/plugin.js'
import tagset from './01-one/tagset/plugin.js'
import tokenizer from './01-one/tokenizer/plugin.js'
import splitter from './01-one/splitter/plugin.js'
import tagger from './02-two/preTagger/plugin.js'
import postTagger from './02-two/postTagger/plugin.js'
import numbers from './03-three/numbers/plugin.js'
import verbs from './03-three/verbs/plugin.js'
import version from './_version.js'

nlp.plugin(tokenizer)
nlp.plugin(tagset)
nlp.plugin(lexicon)
nlp.plugin(tagger)
nlp.plugin(postTagger)
nlp.plugin(splitter)
nlp.plugin(numbers)
nlp.plugin(verbs)

const de = function (txt, lex) {
  let dok = nlp(txt, lex)
  return dok
}

// copy constructor methods over
Object.keys(nlp).forEach(k => {
  if (nlp.hasOwnProperty(k)) {
    de[k] = nlp[k]
  }
})

// this one is hidden
Object.defineProperty(de, '_world', {
  value: nlp._world,
  writable: true,
})
/** log the decision-making to console */
de.verbose = function (set) {
  let env = typeof process === 'undefined' ? self.env || {} : process.env //use window, in browser
  env.DEBUG_TAGS = set === 'tagger' || set === true ? true : ''
  env.DEBUG_MATCH = set === 'match' || set === true ? true : ''
  env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : ''
  return this
}

de.version = version

export default de