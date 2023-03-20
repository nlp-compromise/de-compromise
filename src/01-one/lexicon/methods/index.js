import { all, toPresent, toPast, toSubjunctive1, toSubjunctive2, toImperative, toPastParticiple, toPresentParticiple } from './verbs/conjugate.js'
import { fromPresent, fromPast, fromSubjunctive1, fromSubjunctive2, fromImperative, fromPresentParticiple, fromPastParticiple } from './verbs/toRoot.js'
import inflectAdj from './adjectives/inflect.js'
import adjToRoot from './adjectives/toRoot.js'


export default {
  verb: {
    all,
    toPresent, toPast, toSubjunctive1, toSubjunctive2, toImperative, toPastParticiple, toPresentParticiple,
    fromPresent, fromPast, fromSubjunctive1, fromSubjunctive2, fromImperative, fromPresentParticiple, fromPastParticiple
  },
  adjective: {
    inflect: inflectAdj, toRoot: adjToRoot
  }
}