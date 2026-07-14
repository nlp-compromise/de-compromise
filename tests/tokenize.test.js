import test from 'tape'
import nlp from './_lib.js'
let here = '[de-tokenize] '

test('match:', function (t) {
  let doc = nlp('Wir kommen am 7. September vorbei. foobar')
  t.equal(doc.length, 2, here + 'ordinal')
  t.end()
})

test('sentence-splitting:', function (t) {
  t.equal(nlp('Ich wohne in Berlin. Er wohnt in Hamburg.').length, 2, here + 'two sentences')
  t.equal(nlp('Eins. Zwei. Drei.').length, 3, here + 'three sentences')
  t.equal(nlp('Kommst du mit? Ja klar!').length, 2, here + 'question then exclamation')
  // abbreviations should not split the sentence
  t.equal(nlp('Es gibt viele Tiere, z.B. Hunde und Katzen.').length, 1, here + 'z.B. abbreviation')
  t.equal(nlp('Dr. Müller ist heute nicht da.').length, 1, here + 'Dr. abbreviation')
  t.end()
})

test('contractions:', function (t) {
  t.equal(nlp('Er geht zum Arzt').has('zu dem'), true, here + 'zum expands to zu dem')
  t.equal(nlp('Wir gehen ins Kino').has('in das'), true, here + 'ins expands to in das')
  t.end()
})

test('umlauts:', function (t) {
  t.equal(nlp('Über müde Straßen').text(), 'Über müde Straßen', here + 'umlauts survive round-trip')
  t.equal(nlp('Ich möchte einen Kaffee').wordCount(), 4, here + 'wordCount with umlauts')
  t.end()
})
