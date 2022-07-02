import unicode from './unicode.js'
import contractions from './contractions.js'
import isSentence from './is-sentence.js'

export default {
  mutate: (world) => {
    world.model.one.unicode = unicode
    world.model.one.contractions = contractions
    world.methods.one.tokenize.isSentence = isSentence
  },
}