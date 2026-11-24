import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-number-sign] '

test('negative numbers to text:', function (t) {
  const arr = [
    ['-5 Grad', 'minus fünf Grad'],
    ['Es hat -5 Grad', 'Es hat minus fünf Grad'],
    ['-21', 'minus einundzwanzig'],
    ['-100', 'minus einhundert'],
    ['Es hat -1.234 Punkte.', 'Es hat minus eintausendzweihundertvierunddreißig Punkte.'],
    ['Minus 5 Grad', 'Minus fünf Grad'],
    ['es sind minus 5 Grad', 'es sind minus fünf Grad'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    doc.numbers().toText()
    t.equal(doc.text(), want, here + 'toText: ' + str)
    t.notOk(/moins/.test(doc.text()), here + 'no french: ' + str)
  })
  t.end()
})

test('negative numbers round-trip:', function (t) {
  const arr = [
    ['-5 Grad', '-5 Grad', -5],
    ['Es hat -5 Grad.', 'Es hat -5 Grad.', -5],
    ['-47', '-47', -47],
    ['Es hat -1.234 Punkte', 'Es hat -1.234 Punkte', -1234],
    ['(-5) Punkte', '(-5) Punkte', -5],
  ]
  arr.forEach(a => {
    const [str, want, num] = a
    // chained
    t.equal(nlp(str).numbers().toText().toNumber().all().text(), want, here + 'chained: ' + str)
    // step by step
    const doc = nlp(str)
    t.deepEqual(doc.numbers().get(), [num], here + 'get: ' + str)
    doc.numbers().toText()
    t.deepEqual(doc.numbers().get(), [num], here + 'get as text: ' + str)
    t.equal(doc.numbers().length, 1, here + 'still one number: ' + str)
    doc.numbers().toNumber()
    t.equal(doc.text(), want, here + 'toNumber: ' + str)
    t.deepEqual(doc.numbers().get(), [num], here + 'get after round-trip: ' + str)
  })
  t.equal(nlp('-5 Grad').numbers().toText().toNumber().text(), '-5', here + 'toText().toNumber() gives -5')
  t.end()
})

test('written-out minus:', function (t) {
  t.deepEqual(nlp('minus fünf Grad').numbers().get(), [-5], here + 'minus fünf')
  t.deepEqual(nlp('Minus fünf Grad').numbers().get(), [-5], here + 'Minus fünf - titlecase')
  t.deepEqual(nlp('es sind minus zwanzig Grad').numbers().get(), [-20], here + 'minus zwanzig')
  t.deepEqual(nlp('es sind minus 5 Grad').numbers().get(), [-5], here + 'minus 5')
  t.deepEqual(nlp('minus einundzwanzig').numbers().get(), [-21], here + 'minus einundzwanzig')
  t.equal(nlp('minus fünf Grad').numbers().text(), 'minus fünf', here + 'the sign is part of the number')
  t.equal(nlp('minus fünf Grad').numbers().length, 1, here + 'one number')
  t.equal(nlp('minus fünf Grad').numbers().toNumber().all().text(), '-5 Grad', here + 'minus fünf → -5')
  t.equal(nlp('minus fünf Grad').numbers().units().text(), 'Grad', here + 'units after a negative')
  t.equal(nlp('minus fünf Grad').numbers().json()[0].number.num, -5, here + 'json num')
  // a subtraction is not a negative number
  t.deepEqual(nlp('zehn minus fünf ist fünf').numbers().get(), [10, 5, 5], here + 'zehn minus fünf')
  t.deepEqual(nlp('10 minus 5').numbers().get(), [10, 5], here + '10 minus 5')
  // the noun
  t.deepEqual(nlp('das Minus war groß').numbers().get(), [], here + 'das Minus is not a number')
  // filters see the sign
  t.equal(nlp('minus fünf Grad und drei Grad').numbers().lessThan(0).text(), 'minus fünf', here + 'lessThan 0')
  t.equal(nlp('minus fünf Grad und drei Grad').numbers().greaterThan(0).text(), 'drei', here + 'greaterThan 0')
  t.equal(nlp('minus fünf Grad').numbers().isEqual(-5).found, true, here + 'isEqual -5')
  t.end()
})

test('arithmetic across zero:', function (t) {
  let doc = nlp('drei Grad')
  doc.numbers().subtract(5)
  t.equal(doc.text(), 'minus zwei Grad', here + 'drei - 5')
  t.deepEqual(doc.numbers().get(), [-2], here + 'get after subtract')
  doc.numbers().add(4)
  t.equal(doc.text(), 'zwei Grad', here + 'minus zwei + 4')
  doc.numbers().subtract(2)
  t.equal(doc.text(), 'null Grad', here + 'zwei - 2')
  t.equal(nlp('minus fünf Grad').numbers().add(1).all().text(), 'minus vier Grad', here + 'minus fünf + 1')
  t.equal(nlp('Minus fünf Grad').numbers().add(1).all().text(), 'Minus vier Grad', here + 'titlecase sign is kept')
  t.equal(nlp('fünf Grad').numbers().set(-3).all().text(), 'minus drei Grad', here + 'set -3 on text')
  t.equal(nlp('5 Grad').numbers().set(-3).all().text(), '-3 Grad', here + 'set -3 on number')
  t.equal(nlp('3 Grad').numbers().subtract(5).all().text(), '-2 Grad', here + '3 - 5')
  t.equal(nlp('-3 Grad').numbers().add(5).all().text(), '2 Grad', here + '-3 + 5')
  t.equal(nlp('es sind minus 5 Grad').numbers().add(2).all().text(), 'es sind -3 Grad', here + 'minus 5 + 2')
  // the sign may sit outside of the term
  t.equal(nlp('Es hat -1.234 Punkte').numbers().add(1).all().text(), 'Es hat -1.233 Punkte', here + '-1.234 + 1')
  t.equal(nlp('Es hat -12,5 Grad').numbers().add(1).all().text(), 'Es hat -11,5 Grad', here + '-12,5 + 1')
  t.equal(nlp('Es hat -12,5 Grad').numbers().add(20).all().text(), 'Es hat 7,5 Grad', here + '-12,5 + 20')
  t.equal(nlp('(-5) Punkte').numbers().add(1).all().text(), '(-4) Punkte', here + '(-5) + 1')
  t.equal(nlp('(-1.234) Punkte').numbers().add(1).all().text(), '(-1.233) Punkte', here + '(-1.234) + 1')
  t.end()
})
