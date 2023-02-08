import verb from './methods/verb.js'
import lexicon from './lexicon.js'
import root from './compute/root.js'

export default {
  compute: { root: root },
  methods: {
    two: {
      transform: {
        verb: verb
      }
    }
  },
  words: lexicon,
  hooks: ['lexicon']
}