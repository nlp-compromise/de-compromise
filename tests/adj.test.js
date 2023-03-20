import test from 'tape'
import nlp from './_lib.js'
let here = '[de-adj] '

test('adj-inflection:', function (t) {
  let doc = nlp('konkretes')
  let res = doc.adjectives().conjugate()[0]
  t.equal(res.infinitive, here + 'konkret')
  t.equal(res.two, here + 'konkreten')
  t.end()
})
