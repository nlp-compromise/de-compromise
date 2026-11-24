import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-number-fixes] '
nlp.verbose(false)

test('set/add with a string:', function (t) {
  t.equal(nlp('ich habe 4 Euro').numbers().set('fünf').all().text(), 'ich habe 5 Euro', here + 'set a number-word')
  t.equal(nlp('ich habe 4 Euro').numbers().set('5').all().text(), 'ich habe 5 Euro', here + 'set a digit-string')
  t.equal(nlp('ich habe 4 Euro').numbers().set('1.234').all().text(), 'ich habe 1234 Euro', here + 'set a german-formatted string')
  t.equal(nlp('ich habe vier Euro').numbers().set('5').all().text(), 'ich habe fünf Euro', here + 'set keeps text-form')
  t.equal(nlp('ich habe 4 Euro').numbers().add('zwei').all().text(), 'ich habe 6 Euro', here + 'add a number-word')
  t.equal(nlp('ich habe 4 Euro').numbers().plus('2').all().text(), 'ich habe 6 Euro', here + 'plus a digit-string')
  t.equal(nlp('ich habe 4 Euro').numbers().subtract('zwei').all().text(), 'ich habe 2 Euro', here + 'subtract a number-word')
  t.equal(nlp('ich habe 4 Euro').numbers().minus('eins').all().text(), 'ich habe 3 Euro', here + 'minus a number-word')
  t.end()
})

test('set/add with a non-number:', function (t) {
  const str = 'ich habe 4 Euro'
  t.equal(nlp(str).numbers().set('hund').all().text(), str, here + 'set non-number')
  t.equal(nlp(str).numbers().set('').all().text(), str, here + 'set empty string')
  t.equal(nlp(str).numbers().set(null).all().text(), str, here + 'set null')
  t.equal(nlp(str).numbers().add('hund').all().text(), str, here + 'add non-number')
  t.equal(nlp(str).numbers().subtract('hund').all().text(), str, here + 'subtract non-number')
  t.equal(nlp(str).numbers().set('hund').viewType, 'Numbers', here + 'still a Numbers view')
  t.end()
})

test('increment/decrement:', function (t) {
  t.equal(nlp('4 Euro').numbers().increment().all().text(), '5 Euro', here + 'increment')
  t.equal(nlp('vier Euro').numbers().decrement().all().text(), 'drei Euro', here + 'decrement')
  t.equal(nlp('4 Euro').numbers().subtract(3).all().text(), '1 Euro', here + 'subtract')
  t.end()
})

test('numbers json:', function (t) {
  const str = 'ich habe 4 Euro und sieben Hunde'
  let json = nlp(str).numbers().json()
  t.equal(json.length, 2, here + 'json all')
  t.equal(json[1].number.num, 7, here + 'json has number')
  json = nlp(str).numbers().json(0)
  t.equal(json.length, 1, here + 'json(0) length')
  t.equal(json[0].text, '4', here + 'json(0) text')
  t.equal(json[0].number.num, 4, here + 'json(0) number')
  json = nlp(str).numbers().json(1)
  t.equal(json[0].number.num, 7, here + 'json(1) number')
  t.deepEqual(nlp(str).numbers().json(9), [], here + 'json(n) out of range')
  json = nlp(str).numbers().json({ offset: true })
  t.equal(json.length, 2, here + 'json(opts) length')
  t.equal(json[0].offset.start, 9, here + 'json(opts) passes options')
  t.equal(json[0].number.num, 4, here + 'json(opts) number')
  t.deepEqual(nlp('kein Hund').numbers().json(), [], here + 'json no numbers')
  t.end()
})

test('no numbers:', function (t) {
  const doc = nlp('kein Hund hier')
  t.deepEqual(doc.numbers().get(), [], here + 'get is an empty array')
  t.deepEqual(doc.numbers().parse(), [], here + 'parse is an empty array')
  t.deepEqual(doc.numbers().get(0), [], here + 'get(0) is an empty array')
  t.ok(Array.isArray(nlp('').numbers().get()), here + 'get on empty doc')
  t.deepEqual(nlp('4 Euro und sieben Hunde').numbers().get(), [4, 7], here + 'get still works')
  t.end()
})

test('toText → toNumber round-trip:', function (t) {
  const arr = [
    ['25 Kilo', 'fünfundzwanzig Kilo', '25 Kilo'],
    ['ich habe 1.234 Euro', 'ich habe eintausendzweihundertvierunddreißig Euro', 'ich habe 1.234 Euro'], // grouping is remembered
    ['25 Kilo und 30 Hunde und 7 Katzen', 'fünfundzwanzig Kilo und dreißig Hunde und sieben Katzen', '25 Kilo und 30 Hunde und 7 Katzen'],
    ['der 3. Mann', 'der dritte Mann', 'der 3. Mann'],
    ['Er war der 3.', 'Er war der dritte.', 'Er war der 3.'],
  ]
  arr.forEach(a => {
    const [str, text, num] = a
    // chained
    let doc = nlp(str)
    t.equal(doc.numbers().toText().all().text(), text, here + 'toText: ' + str)
    t.equal(doc.numbers().toNumber().all().text(), num, here + 'toNumber: ' + str)
    t.equal(nlp(str).numbers().toText().toNumber().all().text(), num, here + 'chained: ' + str)
    // on the same view
    doc = nlp(str)
    const m = doc.numbers()
    const vals = m.get()
    m.toText()
    t.equal(doc.text(), text, here + 'same-view toText: ' + str)
    t.deepEqual(m.get(), vals, here + 'same-view values after toText: ' + str)
    m.toNumber()
    t.equal(doc.text(), num, here + 'same-view toNumber: ' + str)
    t.deepEqual(m.get(), vals, here + 'same-view values after toNumber: ' + str)
  })
  t.end()
})

test('repeated changes on one view:', function (t) {
  const doc = nlp('ich habe vier Euro')
  const m = doc.numbers()
  m.add(5)
  m.add(1)
  t.equal(doc.text(), 'ich habe zehn Euro', here + 'add twice')
  m.toNumber()
  m.set(3)
  t.equal(doc.text(), 'ich habe 3 Euro', here + 'toNumber then set')
  t.equal(nlp('vier Euro').numbers().add(5).add(1).all().text(), 'zehn Euro', here + 'chained add')
  t.equal(nlp('der 3. Mann').numbers().add(1).all().text(), 'der 4. Mann', here + 'ordinal keeps one period')
  t.end()
})
