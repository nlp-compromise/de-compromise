import lexData from './_data.js'
import { unpack } from 'efrt'
import conjugate from './methods/conjugate.js'


let lexicon = {}

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag
  })
})

export default {
  methods: {
    one: {
      transform: {
        conjugate
      }
    }
  },
  model: {
    one: {
      lexicon
    }
  },
  hooks: ['lexicon']
}