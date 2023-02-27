import methods from './methods/index.js'
import lexicon from './lexicon.js'
import root from './compute/root.js'

export default {
  compute: { root: root },
  methods: {
    two: {
      transform: methods
    }
  },
  words: lexicon,
  hooks: ['lexicon']
}