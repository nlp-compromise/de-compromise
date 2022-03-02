// import nlp from 'compromise/one'
import nlp from '/Users/spencer/mountain/compromise/src/one.js'
import lexicon from './lexicon/plugin.js'
import tagger from './preTagger/plugin.js'
import tagset from './tagset/plugin.js'
import tokenizer from './tokenizer/plugin.js'
nlp.plugin(tokenizer)
nlp.plugin(tagset)
nlp.plugin(lexicon)
nlp.plugin(tagger)

let world = nlp.world()
// make sure our 'normal' function runs before the tagger
world.hooks = world.hooks.sort((a, b) => {
  if (a === 'normal') {
    return -1
  }
  return 1
})
world.model.one.contractions = []

// enable some helpful logging
// nlp.verbose('tagger')

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

export default de