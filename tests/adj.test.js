import test from 'tape'
import nlp from './_lib.js'
let here = '[de-adj] '

test('adj-inflection:', function (t) {
  let arr = [
    // [inflected-form, infinitive, one, two, three, four]
    ['konkretes', 'konkret', 'konkreter', 'konkreten', 'konkrete', 'konkretes'],
    ['kleines', 'klein', 'kleiner', 'kleinen', 'kleine', 'kleines'],
    ['großes', 'groß', 'großer', 'großen', 'große', 'großes'],
    ['rotes', 'rot', 'roter', 'roten', 'rote', 'rotes'],
    ['altes', 'alt', 'alter', 'alten', 'alte', 'altes'],
  ]
  arr.forEach(a => {
    let [str, inf, one, two, three, four] = a
    let res = nlp(str).adjectives().conjugate()[0] || {}
    t.equal(res.infinitive, inf, here + str + ' → ' + inf)
    t.equal(res.one, one, here + str + ' → ' + one)
    t.equal(res.two, two, here + str + ' → ' + two)
    t.equal(res.three, three, here + str + ' → ' + three)
    t.equal(res.four, four, here + str + ' → ' + four)
  })
  t.end()
})

test('adj-in-sentence:', function (t) {
  let res = nlp('das schnelle Auto').adjectives().conjugate()[0] || {}
  t.equal(res.infinitive, 'schnell', here + 'schnelle → schnell')
  t.end()
})
