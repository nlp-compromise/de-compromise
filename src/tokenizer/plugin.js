import unicode from './unicode.js'
import contractions from './contractions.js'
import model from './model/index.js'
import compute from './compute/splitter.js'

export default {
  model,
  compute,
  mutate: (world) => {
    world.model.one.unicode = unicode
    world.model.one.contractions = contractions
  },
}