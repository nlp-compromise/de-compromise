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

test('german number format:', function (t) {
  // ',' is the decimal separator
  t.deepEqual(nlp('es kostet 12,5 Euro').numbers().get(), [12.5], here + '12,5 → 12.5')
  t.deepEqual(nlp('1.234,56').numbers().get(), [1234.56], here + '1.234,56 → 1234.56')
  t.equal(nlp('12,5').numbers().add(1).text(), '13,5', here + 'decimal comma survives arithmetic')
  // '.' groups thousands
  t.deepEqual(nlp('1.000 Menschen').numbers().get(), [1000], here + '1.000 → 1000')
  t.deepEqual(nlp('1.234.567').numbers().get(), [1234567], here + '1.234.567 → 1234567')
  t.equal(nlp('1.000').numbers().set(1234567).text(), '1.234.567', here + 'thousands re-grouped on set')
  // negatives
  t.deepEqual(nlp('-8').numbers().get(), [-8], here + '-8 keeps its sign')
  // dates and ordinals unaffected
  t.deepEqual(nlp('am 7. September').numbers().get(), [7], here + 'ordinal 7. still parses')
  t.ok(nlp('am 01.05.2020').has('#Date'), here + 'dotted date is not a number')
  t.end()
})

test('units and money:', function (t) {
  t.equal(nlp('Wir fuhren 50 Kilometer').numbers().units().text(), 'Kilometer', here + 'units() finds Kilometer')
  t.ok(nlp('zwei Liter Wasser').match('liter').has('#Unit'), here + 'Liter is a unit')
  t.ok(nlp('es kostet zwanzig Euro').match('euro').has('#Currency'), here + 'Euro is a currency')
  t.ok(nlp('es kostet 12,5 Euro').match('12,5').has('#Money'), here + 'value before currency is money')
  t.equal(nlp('es kostet 12,5 Euro').numbers().parse()[0].isMoney, true, here + 'parse() sees isMoney')
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
