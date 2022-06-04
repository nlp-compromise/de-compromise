import model from '../splitter/model/index.js'
import compute from '../splitter/compute/splitter.js'
import mutate from './build.js'

export default {
  mutate,
  model,
  compute,
  hooks: ['splitter'],
}