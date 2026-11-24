import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-sentences-hmm] '

// german abbreviations that should not end a sentence
test('abbreviations:', function (t) {
  const arr = [
    ['Wir kaufen Äpfel, Birnen usw. und gehen heim.', 1],
    ['Das ist gut bzw. schlecht.', 1],
    ['Die Fa. Müller GmbH liefert.', 1],
    ['Ich wohne in der Hauptstr. 5 in Köln.', 1],
    ['Das gilt u.a. für Hunde, evtl. auch für Katzen.', 1],
    ['Er kommt ggf. später, d.h. gegen Abend.', 1],
  ]
  arr.forEach(a => {
    const [str, n] = a
    t.equal(nlp(str).length, n, here + str)
  })
  t.end()
})

// a closing quotation mark after the period
test('quotations:', function (t) {
  t.equal(nlp('Er sagte: „Ich komme.“ Dann ging er.').length, 2, here + 'german quotes')
  t.equal(nlp('Er sagte: »Ich komme.« Dann ging er.').length, 2, here + 'guillemets')
  t.end()
})
