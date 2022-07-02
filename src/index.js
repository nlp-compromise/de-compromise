import nlp from 'compromise/one'
// import nlp from '/Users/spencer/mountain/compromise/src/one.js'
import lexicon from './lexicon/plugin.js'
import tagset from './tagset/plugin.js'
import tokenizer from './tokenizer/plugin.js'
import splitter from './splitter/plugin.js'
import tagger from './preTagger/plugin.js'
import postTagger from './postTagger/plugin.js'
import numbers from './numbers/plugin.js'
import version from './_version.js'

nlp.plugin(tokenizer)
nlp.plugin(tagset)
nlp.plugin(lexicon)
nlp.plugin(tagger)
nlp.plugin(postTagger)
nlp.plugin(splitter)
nlp.plugin(numbers)


const de = function (txt, lex) {
  let dok = nlp(txt, lex)
  return dok
}

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