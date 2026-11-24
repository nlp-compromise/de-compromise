import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-number-grouping] '

test('grouping survives toText → toNumber:', function (t) {
  const arr = [
    ['1.234 Euro', '1.234 Euro'],
    ['ich habe 1.234 Euro', 'ich habe 1.234 Euro'],
    ['12.345 Leute', '12.345 Leute'],
    ['-1.234 Punkte', '-1.234 Punkte'],
    // never invented
    ['1234 Euro', '1234 Euro'],
    ['12345 Leute', '12345 Leute'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).numbers().toText().toNumber().all().text(), want, here + 'chained: ' + str)
    const doc = nlp(str)
    doc.numbers().toText()
    doc.numbers().toNumber()
    t.equal(doc.text(), want, here + 'two steps: ' + str)
  })
  t.equal(nlp('1.234 Euro').numbers().toText().toNumber().text(), '1.234', here + '1.234 round-trip')
  // a number that was only ever text has no grouping
  t.equal(nlp('eintausendzweihundertvierunddreißig').numbers().toNumber().text(), '1234', here + 'text has no grouping')
  t.end()
})

test('grouping survives arithmetic:', function (t) {
  t.equal(nlp('1.234').numbers().add(2).text(), '1.236', here + 'add')
  t.equal(nlp('1.234').numbers().subtract(4).text(), '1.230', here + 'subtract')
  t.equal(nlp('1.234').numbers().increment().text(), '1.235', here + 'increment')
  t.equal(nlp('1.234').numbers().decrement().text(), '1.233', here + 'decrement')
  t.equal(nlp('1.234').numbers().add('fünf').text(), '1.239', here + 'add a string')
  t.equal(nlp('999.999').numbers().add(1).text(), '1.000.000', here + 'grows a group')
  t.equal(nlp('1.234.567').numbers().add(1).text(), '1.234.568', here + 'two separators')
  t.equal(nlp('1.234,56').numbers().add(1).text(), '1.235,56', here + 'with decimals')
  t.equal(nlp('9.999,5').numbers().add(1).text(), '10.000,5', here + 'decimal grows a group')
  t.equal(nlp('ich habe 1.234 Euro').numbers().add(2).all().text(), 'ich habe 1.236 Euro', here + 'in a sentence')
  // un-grouped numbers stay that way
  t.equal(nlp('1234').numbers().add(2).text(), '1236', here + 'no grouping to keep')
  t.equal(nlp('999').numbers().add(1).text(), '1000', here + 'no grouping invented')
  t.equal(nlp('1234,5').numbers().add(1).text(), '1235,5', here + 'decimal, no grouping')
  // below a thousand and back again
  const doc = nlp('1.000 Leute')
  doc.numbers().subtract(1)
  t.equal(doc.text(), '999 Leute', here + '1.000 - 1')
  doc.numbers().add(1)
  t.equal(doc.text(), '1.000 Leute', here + '999 + 1 remembers')
  t.end()
})

test('grouping survives ordinal/cardinal:', function (t) {
  t.equal(nlp('1.234').numbers().toOrdinal().text(), '1.234.', here + 'toOrdinal')
  t.equal(nlp('der 1.234 Besucher').numbers().toOrdinal().all().text(), 'der 1.234. Besucher', here + 'toOrdinal in a sentence')
  t.equal(nlp('der 1.234 Besucher').numbers().toOrdinal().toCardinal().all().text(), 'der 1.234 Besucher', here + 'toOrdinal → toCardinal')
  t.equal(nlp('1234').numbers().toOrdinal().text(), '1234.', here + 'toOrdinal without grouping')
  t.deepEqual(nlp('1.234').numbers().toOrdinal().get(), [1234], here + 'ordinal value')
  t.end()
})

test('grouping and set:', function (t) {
  t.equal(nlp('1.000').numbers().set(1234567).text(), '1.234.567', here + 'set re-groups')
  t.equal(nlp('1.000').numbers().set(12).text(), '12', here + 'set a small number')
  t.equal(nlp('1.000').numbers().set(1234.5).text(), '1.234,5', here + 'set a decimal')
  t.equal(nlp('1.000').numbers().set(1234.5678).text(), '1.234,5678', here + 'set keeps every decimal')
  t.equal(nlp('1000').numbers().set(1234567).text(), '1234567', here + 'set without grouping')
  const doc = nlp('1.234 Leute')
  doc.numbers().toText()
  doc.numbers().set(5000)
  t.equal(doc.text(), 'fünftausend Leute', here + 'set on text')
  doc.numbers().toNumber()
  t.equal(doc.text(), '5.000 Leute', here + 'text remembers through set')
  t.end()
})

test('grouping in json:', function (t) {
  t.equal(nlp('1.234').numbers().json()[0].number.hasComma, true, here + 'hasComma')
  t.equal(nlp('1234').numbers().json()[0].number.hasComma, false, here + 'no hasComma')
  t.equal(nlp('12,5').numbers().json()[0].number.hasComma, false, here + 'decimal is not grouping')
  const json = nlp('1.234').numbers().toText().json()[0]
  t.equal(json.number.hasComma, true, here + 'text remembers hasComma')
  t.equal(json.number.num, 1234, here + 'text num')
  t.deepEqual(Object.keys(json.terms[0]).filter(k => k === 'grouped'), [], here + 'nothing extra in term json')
  t.end()
})
