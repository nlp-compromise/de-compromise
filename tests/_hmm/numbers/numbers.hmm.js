import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-number-hmm] '

// decimals are dropped (or left alone) by toText()
test('decimals to text:', function (t) {
  t.equal(nlp('21,5').numbers().toText().text(), 'einundzwanzig Komma fünf', here + '21,5')
  t.equal(nlp('12,5 Grad').numbers().toText().all().text(), 'zwölf Komma fünf Grad', here + '12,5')
  t.equal(nlp('-12,5 Grad').numbers().toText().all().text(), 'minus zwölf Komma fünf Grad', here + '-12,5')
  t.deepEqual(nlp('zwölf Komma fünf Grad').numbers().get(), [12.5], here + 'zwölf Komma fünf')
  t.end()
})

// a prefix or suffix in the same term is lost when the number changes
test('prefix/suffix kept on change:', function (t) {
  t.equal(nlp('50%').numbers().add(1).text(), '51%', here + '50% + 1')
  t.equal(nlp('5€').numbers().add(1).text(), '6€', here + '5€ + 1')
  t.equal(nlp('€5').numbers().set(7).text(), '€7', here + '€5 set 7')
  t.end()
})

// the capital at the start of a sentence is lost
test('titlecase kept on change:', function (t) {
  t.equal(nlp('Fünf Hunde bellen').numbers().add(1).all().text(), 'Sechs Hunde bellen', here + 'Fünf + 1')
  t.equal(nlp('Fünf Hunde bellen').numbers().toOrdinal().all().text(), 'Fünfte Hunde bellen', here + 'Fünf → Fünfte')
  t.equal(nlp('Minus fünf Grad').numbers().add(10).all().text(), 'Fünf Grad', here + 'Minus fünf + 10')
  t.end()
})
