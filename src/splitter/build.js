import { addWord } from './trie.js'

const buildIndex = function (world) {
  let words = Object.entries(world.model.one.lexicon)
  let { nouns, verbs, values, adjectives } = world.model.one.splitter
  words.forEach(a => {
    let [w, tag] = a
    if (tag === 'TextOrdinal' || tag === 'TextCardinal') {
      addWord(w, values)
    }
    if (tag === 'Noun' || tag === 'FemaleNoun' || tag === 'MaleNoun' || tag === 'NeuterNoun') {
      addWord(w, nouns)
    }
  })
  // misc word
  addWord('und', values)//'and'
}
export default buildIndex