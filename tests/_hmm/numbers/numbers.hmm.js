import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-number-hmm] '

// toText() only knows the teens for ten-thousands, and nothing past 'hunderttausend'
test('large numbers to text:', function (t) {
  const arr = [
    [20000, 'zwanzigtausend'],
    [21000, 'einundzwanzigtausend'],
    [50000, 'fünfzigtausend'],
    [99999, 'neunundneunzigtausendneunhundertneunundneunzig'],
    [123456, 'einhundertdreiundzwanzigtausendvierhundertsechsundfünfzig'],
    [1000000, 'eine Million'],
    [2000000, 'zwei Millionen'],
    [1234567, 'eine Million zweihundertvierunddreißigtausendfünfhundertsiebenundsechzig'],
  ]
  arr.forEach(a => {
    const [num, str] = a
    t.equal(nlp(String(num)).numbers().toText().text(), str, here + 'toText ' + num)
  })
  t.end()
})

// 'hundert' + tens + 'tausend' is added up wrongly
test('large text to number:', function (t) {
  const str = 'einhundertdreiundzwanzigtausendvierhundertsechsundfünfzig'
  t.deepEqual(nlp(str).numbers().get(), [123456], here + 'get ' + str)
  t.end()
})

// 'Millionen' is titlecased → a Noun, and multi-word numbers only read their first word
test('millions:', function (t) {
  t.deepEqual(nlp('zwei Millionen eins').numbers().get(), [2000001], here + 'zwei Millionen eins')
  t.deepEqual(nlp('zwei millionen eins').numbers().get(), [2000001], here + 'zwei millionen eins - lowercase')
  t.deepEqual(nlp('drei Millionen Menschen').numbers().get(), [3000000], here + 'drei Millionen')
  t.deepEqual(nlp('eine Million Menschen').numbers().get(), [1000000], here + 'eine Million')
  t.deepEqual(nlp('zwei Milliarden Euro').numbers().get(), [2e9], here + 'zwei Milliarden')
  t.end()
})

// only the last word of a compound ordinal is read
test('compound ordinals over 100:', function (t) {
  t.deepEqual(nlp('einhundertzweite').numbers().get(), [102], here + 'einhundertzweite')
  t.deepEqual(nlp('zweihundertelfte').numbers().get(), [211], here + 'zweihundertelfte')
  t.deepEqual(nlp('einhunderterste').numbers().get(), [101], here + 'einhunderterste')
  t.equal(nlp('der einhundertzweite Tag').numbers().toNumber().all().text(), 'der 102. Tag', here + 'einhundertzweite → 102.')
  t.end()
})

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
