import {
  all,
  toPresent,
  toPast,
  toSubjunctive1,
  toSubjunctive2,
  toImperative,
  toPastParticiple,
  toPresentParticiple
} from './verbs/conjugate.js'
import {
  fromPresent,
  fromPast,
  fromSubjunctive1,
  fromSubjunctive2,
  fromImperative,
  fromPresentParticiple,
  fromPastParticiple
} from './verbs/toRoot.js'
import inflectAdj from './adjectives/inflect.js'
import adjToRoot from './adjectives/toRoot.js'
import toPlural from './nouns/toPlural.js'
import toSingular from './nouns/toSingular.js'

const allAdj = (inf) => Object.values(inflectAdj(inf))
const allNoun = (sing) => [sing, toPlural(sing).one]

export default {
  verb: {
    all,
    toPresent,
    toPast,
    toSubjunctive1,
    toSubjunctive2,
    toImperative,
    toPastParticiple,
    toPresentParticiple,
    fromPresent,
    fromPast,
    fromSubjunctive1,
    fromSubjunctive2,
    fromImperative,
    fromPresentParticiple,
    fromPastParticiple
  },
  adjective: {
    inflect: inflectAdj,
    toRoot: adjToRoot,
    all: allAdj
  },
  noun: {
    toPlural,
    toSingular,
    all: allNoun
  }
}
