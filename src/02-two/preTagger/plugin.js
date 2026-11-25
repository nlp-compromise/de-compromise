import preTagger from './compute/index.js'
import model from './model/index.js'

export default {
  compute: {
    preTagger
  },
  model: {
    two: model
  },
  hooks: ['preTagger']
}