import test from 'tape'
import nlp from '../_lib.js'
let here = '[de-number-methods] '
nlp.verbose(false)

test('toNumber:', function (t) {
  t.equal(nlp('siebenundvierzig').numbers().toNumber().text(), '47', here + 'siebenundvierzig → 47')
  t.equal(nlp('zwanzigste').numbers().toNumber().text(), '20.', here + 'zwanzigste → 20.')
  t.end()
})

test('toText:', function (t) {
  t.equal(nlp('47').numbers().toText().text(), 'siebenundvierzig', here + '47 → siebenundvierzig')
  t.equal(nlp('100').numbers().toText().text(), 'einhundert', here + '100 → einhundert')
  t.equal(nlp('ich habe 3 Hunde').numbers().toText().text(), 'drei', here + '3 → drei')
  t.end()
})

test('toOrdinal / toCardinal:', function (t) {
  t.equal(nlp('fünf').numbers().toOrdinal().text(), 'fünfte', here + 'fünf → fünfte')
  t.equal(nlp('dritte').numbers().toCardinal().text(), 'drei', here + 'dritte → drei')
  t.end()
})

test('arithmetic:', function (t) {
  t.equal(nlp('sieben').numbers().add(2).text(), 'neun', here + 'sieben plus 2')
  t.equal(nlp('sieben').numbers().subtract(2).text(), 'fünf', here + 'sieben minus 2')
  t.equal(nlp('neun').numbers().increment().text(), 'zehn', here + 'neun increment')
  t.equal(nlp('zehn').numbers().decrement().text(), 'neun', here + 'zehn decrement')
  t.end()
})

test('set:', function (t) {
  t.equal(nlp('fünf Katzen').numbers().set(9).all().text(), 'neun Katzen', here + 'set 9 keeps text-form')
  t.end()
})

test('get compound numbers:', function (t) {
  t.deepEqual(nlp('einundzwanzig').numbers().get(), [21], here + 'einundzwanzig → 21')
  t.deepEqual(nlp('zweihundertdreiundvierzig').numbers().get(), [243], here + 'zweihundertdreiundvierzig → 243')
  t.deepEqual(nlp('tausendneunhundertneunzig').numbers().get(), [1990], here + 'tausendneunhundertneunzig → 1990')
  t.end()
})

test('filters:', function (t) {
  let doc = nlp('drei Hunde und sieben Katzen')
  t.equal(doc.numbers().greaterThan(5).text(), 'sieben', here + 'greaterThan')
  t.equal(doc.numbers().lessThan(5).text(), 'drei', here + 'lessThan')
  t.equal(nlp('zwei vier acht').numbers().between(3, 7).text(), 'vier', here + 'between')
  t.equal(nlp('vier Pferde').numbers().isEqual(4).text(), 'vier', here + 'isEqual')
  let mixed = nlp('der dritte Mann und vier Frauen')
  t.equal(mixed.numbers().isOrdinal().text(), 'dritte', here + 'isOrdinal')
  t.equal(mixed.numbers().isCardinal().text(), 'vier', here + 'isCardinal')
  t.end()
})
