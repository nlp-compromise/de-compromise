import makeLookup from './_lookup.js'
import { toPresent, toPast, toSubjunctive1, toSubjunctive2 } from './conjugate.js'
import { fromPresent, fromPast, fromSubjunctive1, fromSubjunctive2 } from './toRoot.js'

// the tenses that are one word
const tenses = [
  { name: 'present', to: toPresent, from: fromPresent },
  { name: 'past', to: toPast, from: fromPast },
  { name: 'subjunctive1', to: toSubjunctive1, from: fromSubjunctive1 },
  { name: 'subjunctive2', to: toSubjunctive2, from: fromSubjunctive2 },
]

const { table, findHits, candidates, lookup } = makeLookup(tenses, { shape: /n$/ })

export { table, findHits, candidates, lookup }
