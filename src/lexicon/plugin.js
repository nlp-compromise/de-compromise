import lexData from './_data.js'
import { unpack } from 'efrt'

let lexicon = {}

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag
  })
})

export default {
  model: {
    one: {
      lexicon
    }
  },
  hooks: ['lexicon']
}