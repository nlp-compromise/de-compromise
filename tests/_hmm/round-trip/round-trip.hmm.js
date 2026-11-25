import test from 'tape'
import nlp from '../../_lib.js'
import sentences, { identical } from './_sentences.js'
const here = '[de-round-trip-hmm] '

// how well do the tense methods hold-up on ordinary sentences?
// each present-tense sentence is sent to another tense, and then back again.
// it should (1) change, and (2) come back as it was.
//
// these are not unit tests - they are a rough measure of how bad things are.
// run them with 'npm run test:hmm'

const convert = function (str, fn) {
  const doc = nlp(str)
  doc.verbs()[fn]()
  return doc.text()
}

const score = { }
const count = function (key, isOk) {
  score[key] = score[key] || { ok: 0, total: 0 }
  score[key].total += 1
  score[key].ok += isOk ? 1 : 0
}

const trips = [
  ['past', 'toPastTense'],
  ['future', 'toFutureTense'],
]

Object.keys(sentences).forEach(function (group) {
  trips.forEach(function (trip) {
    const [name, fn] = trip
    test(`${name} round-trip - ${group}:`, function (t) {
      sentences[group].forEach(function (str) {
        const there = convert(str, fn)
        // a few sentences are the same in both tenses
        if ((identical[name] || []).includes(str)) {
          t.equal(there, str, here + `${name}: '${str}' is the same`)
          return
        }
        // was a verb found, and changed?
        const didChange = there !== str
        count(name + ' - changed', didChange)
        if (!didChange) {
          count(name + ' - round-trip', false)
          t.fail(here + `${fn} did nothing: '${str}'`)
          return
        }
        // .. and does it come back?
        const back = convert(there, 'toPresentTense')
        count(name + ' - round-trip', back === str)
        t.equal(back, str, here + `${name}: '${str}' → '${there}'`)
      })
      t.end()
    })
  })
})

test('round-trip summary:', function (t) {
  Object.keys(score).forEach(function (key) {
    const { ok, total } = score[key]
    const percent = Math.round((ok / total) * 100)
    t.comment(`${key}: ${ok}/${total} (${percent}%)`)
  })
  t.end()
})
