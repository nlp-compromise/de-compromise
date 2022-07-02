import test from 'tape'
import nlp from './_lib.js'
let here = '[de-tokenize] '

test('match:', function (t) {
  let doc = nlp('Wir kommen am 7. September vorbei. foobar')
  t.equal(doc.length, 2, here + 'ordinal')
  t.end()
})
