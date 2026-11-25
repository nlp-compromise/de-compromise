import unicode from './unicode.js'
import contractions from './contractions.js'
import abbreviations from './abbreviations.js'
import ordinals from './ordinals.js'

export default {
  mutate: (world) => {
    world.model.one.unicode = unicode
    world.model.one.contractions = contractions
    // our own abbreviations, for the sentence-parser
    world.model.one.abbreviations = { ...abbreviations }
    // '3.' is an ordinal - 'am 3. Mai'
    world.methods.one.tokenize.splitSentences = ordinals(world.methods.one.tokenize.splitSentences)
  },
}