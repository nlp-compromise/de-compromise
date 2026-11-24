import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-number-zero] '

test('null is zero:', function (t) {
  t.deepEqual(nlp('null Fehler').numbers().get(), [0], here + 'null')
  t.deepEqual(nlp('Null Fehler').numbers().get(), [0], here + 'Null')
  t.deepEqual(nlp('NULL Fehler').numbers().get(), [0], here + 'NULL')
  t.deepEqual(nlp('es gab null Fehler').numbers().get(), [0], here + 'mid-sentence')
  t.deepEqual(nlp('0 Fehler').numbers().get(), [0], here + '0')
  t.deepEqual(nlp('null Fehler und drei Warnungen').numbers().get(), [0, 3], here + 'null and drei')
  t.equal(nlp('es gab null Fehler').numbers().text(), 'null', here + 'text')
  t.equal(nlp('null').has('#TextValue'), true, here + 'null is a TextValue')
  t.equal(nlp('null').has('#Cardinal'), true, here + 'null is a Cardinal')
  t.equal(nlp('null Fehler').numbers().json()[0].number.num, 0, here + 'json')
  t.equal(nlp('null Fehler').numbers().isEqual(0).found, true, here + 'isEqual 0')
  t.equal(nlp('null Fehler').numbers().lessThan(1).found, true, here + 'lessThan 1')
  t.end()
})

test('set null:', function (t) {
  t.equal(nlp('fünf Fehler').numbers().set('null').all().text(), 'null Fehler', here + 'set null on text')
  t.equal(nlp('fünf Fehler').numbers().set('Null').all().text(), 'null Fehler', here + 'set Null on text')
  t.equal(nlp('5 Fehler').numbers().set('null').all().text(), '0 Fehler', here + 'set null on number')
  t.equal(nlp('5 Fehler').numbers().set('Null').all().text(), '0 Fehler', here + 'set Null on number')
  t.equal(nlp('5 Fehler').numbers().set(0).all().text(), '0 Fehler', here + 'set 0')
  t.equal(nlp('5 Fehler').numbers().set('0').all().text(), '0 Fehler', here + "set '0'")
  t.equal(nlp('fünf Fehler').numbers().set(0).all().text(), 'null Fehler', here + 'set 0 on text')
  // the js value null is still not a number
  t.equal(nlp('fünf Fehler').numbers().set(null).all().text(), 'fünf Fehler', here + 'set(null) is a no-op')
  t.end()
})

test('zero conversions:', function (t) {
  t.equal(nlp('null Fehler').numbers().toNumber().all().text(), '0 Fehler', here + 'null → 0')
  t.equal(nlp('0 Fehler').numbers().toText().all().text(), 'null Fehler', here + '0 → null')
  t.equal(nlp('0 Fehler').numbers().toText().toNumber().all().text(), '0 Fehler', here + '0 round-trip')
  t.equal(nlp('null').numbers().toOrdinal().text(), 'nullte', here + 'null → nullte')
  t.equal(nlp('nullte').numbers().toCardinal().text(), 'null', here + 'nullte → null')
  t.deepEqual(nlp('nullte').numbers().get(), [0], here + 'nullte is 0')
  t.end()
})

test('zero arithmetic:', function (t) {
  t.equal(nlp('null').numbers().add(3).text(), 'drei', here + 'null + 3')
  t.equal(nlp('null').numbers().increment().text(), 'eins', here + 'null increment')
  t.equal(nlp('drei').numbers().subtract(3).text(), 'null', here + 'drei - 3')
  t.equal(nlp('eins').numbers().decrement().text(), 'null', here + 'eins decrement')
  t.equal(nlp('1').numbers().decrement().text(), '0', here + '1 decrement')
  t.equal(nlp('drei').numbers().add('null').text(), 'drei', here + 'add null changes nothing')
  t.equal(nlp('null').numbers().decrement().text(), 'minus eins', here + 'null decrement')
  t.end()
})
