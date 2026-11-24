import methods from './methods/index.js'
import lexicon from './lexicon.js'
import root from './compute/root.js'

// compromise drops the key 'null' when it expands a lexicon,
// which loses the german word for zero
const mutate = function (world) {
  world.model.one.lexicon.null = lexicon.null
}

export default {
  mutate,
  compute: { root: root },
  methods: {
    two: {
      transform: methods
    }
  },
  words: lexicon,
  hooks: ['lexicon']
}
