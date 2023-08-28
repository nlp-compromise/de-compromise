import { addWord } from './trie.js'

const buildIndex = function (world) {
  let words = Object.entries(world.model.one.lexicon)
  let { nouns, values } = world.model.one.splitter
  words.forEach((a) => {
    let [w, tag] = a
    if (tag === 'TextOrdinal' || tag === 'TextCardinal') {
      addWord(w, values)
    }
    if (tag === 'Noun' || tag === 'FemaleNoun' || tag === 'MaleNoun' || tag === 'NeuterNoun') {
      addWord(w, nouns)
    }
  })
  // misc words
  addWord('und', values) //'and'
  addWord('ein', values) //'one'
  addWord('hunderttausend', values)
}
export default buildIndex
