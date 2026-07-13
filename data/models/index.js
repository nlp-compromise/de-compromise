import pastParticiple from './verbs/past-participle.js'
import adjectives from './adjectives/index.js'
import presentParticiple from './verbs/present-participle.js'
import verbs from './verbs/index.js'
import nouns from './nouns.js'

// singular → plural pairs, from the declension paradigms
let nounPlurals = []
Object.keys(nouns).forEach(w => {
  let { s, p } = nouns[w]
  if (s && p && s[0] && p[0]) {
    nounPlurals.push([s[0], p[0]])
  }
})

export default {
  adjectives,
  presentParticiple,
  pastParticiple,
  verbs,
  nounPlurals
}