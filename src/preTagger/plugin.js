import tagger from './compute/index.js'
import model from './model/index.js'

export default {
  compute: {
    tagger
  },
  model: {
    two: model
  },
  hooks: ['tagger']
}