import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-number-text] '

test('number ↔ text forms:', function (t) {
  const arr = [
    [1, 'eins'],
    [7, 'sieben'],
    [10, 'zehn'],
    [11, 'elf'],
    [12, 'zwölf'],
    [16, 'sechzehn'],
    [17, 'siebzehn'],
    [20, 'zwanzig'],
    [21, 'einundzwanzig'],
    [30, 'dreißig'],
    [99, 'neunundneunzig'],
    [100, 'einhundert'],
    [101, 'einhunderteins'],
    [110, 'einhundertzehn'],
    [111, 'einhundertelf'],
    [200, 'zweihundert'],
    [999, 'neunhundertneunundneunzig'],
    [1000, 'eintausend'],
    [1001, 'eintausendeins'],
    [1100, 'eintausendeinhundert'],
    [1990, 'eintausendneunhundertneunzig'],
    [2000, 'zweitausend'],
    [2020, 'zweitausendzwanzig'],
    [9999, 'neuntausendneunhundertneunundneunzig'],
    [10000, 'zehntausend'],
    [12345, 'zwölftausenddreihundertfünfundvierzig'],
    [100000, 'einhunderttausend'],
  ]
  arr.forEach(a => {
    const [num, str] = a
    t.equal(nlp(String(num)).numbers().toText().text(), str, here + 'toText ' + num)
    t.deepEqual(nlp(str).numbers().get(), [num], here + 'get ' + str)
    t.equal(nlp(str).numbers().toNumber().text(), String(num), here + 'toNumber ' + str)
  })
  t.end()
})

test('larger text numbers:', function (t) {
  const arr = [
    [20000, 'zwanzigtausend'],
    [21000, 'einundzwanzigtausend'],
    [50000, 'fünfzigtausend'],
    [99999, 'neunundneunzigtausendneunhundertneunundneunzig'],
    [200000, 'zweihunderttausend'],
  ]
  arr.forEach(a => {
    const [num, str] = a
    t.deepEqual(nlp(str).numbers().get(), [num], here + 'get ' + str)
    t.equal(nlp(str).numbers().toNumber().text(), String(num), here + 'toNumber ' + str)
  })
  t.equal(nlp('200000').numbers().toText().text(), 'zweihunderttausend', here + 'toText 200000')
  t.end()
})

test('every number survives toText:', function (t) {
  // 0 - 9999, in steps
  const bad = []
  for (let i = 0; i < 10000; i += 7) {
    const str = nlp(String(i)).numbers().toText().text()
    const back = nlp(str).numbers().get()
    if (back.length !== 1 || back[0] !== i) {
      bad.push(i + ' → ' + str + ' → ' + back.join(','))
    }
  }
  t.deepEqual(bad, [], here + 'cardinals round-trip')
  // ...and their negatives
  const neg = []
  for (let i = 1; i < 2000; i += 13) {
    const doc = nlp('-' + i + ' Grad')
    doc.numbers().toText()
    const back = doc.numbers().get()
    doc.numbers().toNumber()
    if (back.length !== 1 || back[0] !== -i || doc.text() !== '-' + i + ' Grad') {
      neg.push(i + ' → ' + back.join(',') + ' → ' + doc.text())
    }
  }
  t.deepEqual(neg, [], here + 'negatives round-trip')
  // ordinals, up to 100
  const ord = []
  for (let i = 1; i <= 100; i += 1) {
    const doc = nlp('der ' + i + '. Tag')
    doc.numbers().toText()
    const back = doc.numbers().get()
    doc.numbers().toNumber()
    if (back.length !== 1 || back[0] !== i || doc.text() !== 'der ' + i + '. Tag') {
      ord.push(i + ' → ' + back.join(',') + ' → ' + doc.text())
    }
  }
  t.deepEqual(ord, [], here + 'ordinals round-trip')
  t.end()
})

test('selecting numbers:', function (t) {
  const str = 'drei Hunde, 4 Katzen und fünf Vögel'
  t.equal(nlp(str).numbers().length, 3, here + 'three numbers')
  t.equal(nlp(str).values().length, 3, here + 'values() alias')
  t.equal(nlp(str).numbers(1).text(), '4', here + 'numbers(n)')
  t.deepEqual(nlp(str).numbers().get(), [3, 4, 5], here + 'get')
  t.deepEqual(nlp(str).numbers().get(1), [4], here + 'get(n)')
  t.equal(nlp(str).numbers().parse(2)[0].num, 5, here + 'parse(n)')
  t.equal(nlp(str).numbers().parse()[0].isText, true, here + 'parse isText')
  t.equal(nlp(str).numbers().parse()[1].isText, false, here + 'parse not isText')
  t.equal(nlp(str).numbers().toNumber().length, 2, here + 'toNumber returns only the changed numbers')
  t.equal(nlp(str).numbers().toNumber().all().text(), '3 Hunde, 4 Katzen und 5 Vögel', here + 'toNumber on all')
  t.equal(nlp(str).numbers().toText().all().text(), 'drei Hunde, vier Katzen und fünf Vögel', here + 'toText on all')
  t.equal(nlp(str).numbers().add(1).all().text(), 'vier Hunde, 5 Katzen und sechs Vögel', here + 'add on all')
  t.equal(nlp(str).numbers().set(2).all().text(), 'zwei Hunde, 2 Katzen und zwei Vögel', here + 'set on all')
  // articles are not numbers
  t.deepEqual(nlp('ich habe einen Hund und zwei Katzen').numbers().get(), [2], here + 'einen is an article')
  t.deepEqual(nlp('ein Hund').numbers().get(), [], here + 'ein is an article')
  t.end()
})

test('number aliases:', function (t) {
  t.equal(nlp('zwei vier acht').numbers().isBetween(3, 7).text(), 'vier', here + 'isBetween')
  t.equal(nlp('zwei vier acht').numbers().between(2, 8).text(), 'vier', here + 'between is exclusive')
  t.equal(nlp('zwei vier acht').numbers().equals(8).text(), 'acht', here + 'equals')
  t.equal(nlp('zwei').numbers().plus(2).text(), 'vier', here + 'plus')
  t.equal(nlp('vier').numbers().minus(2).text(), 'zwei', here + 'minus')
  t.end()
})

test('number formats:', function (t) {
  t.deepEqual(nlp('3,14').numbers().get(), [3.14], here + '3,14')
  t.deepEqual(nlp('0,5 Liter').numbers().get(), [0.5], here + '0,5')
  t.deepEqual(nlp('50%').numbers().get(), [50], here + '50%')
  t.equal(nlp('50%').numbers().json()[0].number.suffix, '%', here + 'suffix')
  t.deepEqual(nlp('5€').numbers().get(), [5], here + '5€')
  t.deepEqual(nlp('€5').numbers().get(), [5], here + '€5')
  t.equal(nlp('€5').numbers().json()[0].number.prefix, '€', here + 'prefix')
  t.deepEqual(nlp('(5) Punkte').numbers().get(), [5], here + '(5)')
  t.deepEqual(nlp('(-5) Punkte').numbers().get(), [-5], here + '(-5)')
  t.deepEqual(nlp('+5 Grad').numbers().get(), [5], here + '+5')
  t.deepEqual(nlp('im Jahr 1990 war es').numbers().get(), [1990], here + 'a year')
  t.deepEqual(nlp('der 1.234. Besucher kam').numbers().get(), [1234], here + 'grouped, with a period')
  t.equal(nlp('3 kg Mehl und 2 Liter Milch').numbers().units().out('array').join('|'), 'kg|Liter', here + 'units')
  // ordinals
  t.deepEqual(nlp('siebte').numbers().get(), [7], here + 'siebte')
  t.deepEqual(nlp('siebente').numbers().get(), [7], here + 'siebente')
  t.deepEqual(nlp('hundertste').numbers().get(), [100], here + 'hundertste')
  t.deepEqual(nlp('einundzwanzigste').numbers().get(), [21], here + 'einundzwanzigste')
  t.equal(nlp('drei').numbers().toOrdinal().toCardinal().text(), 'drei', here + 'drei → dritte → drei')
  t.equal(nlp('der dritte Mann').numbers().toNumber().all().text(), 'der 3. Mann', here + 'dritte → 3.')
  t.equal(nlp('der 21. Tag').numbers().toText().all().text(), 'der einundzwanzigste Tag', here + '21. → einundzwanzigste')
  t.end()
})
