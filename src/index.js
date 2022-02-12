import nlp from 'compromise/one'
import lexicon from './lexicon/plugin.js'
import tagger from './tagger/plugin.js'
nlp.plugin(lexicon)
nlp.plugin(tagger)

const de = function (txt, lex) {
  console.log(nlp.model())
  let dok = nlp(txt, lex)
  return dok
}
export default de