import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-number-large] '

test('large numbers to text:', function (t) {
  const arr = [
    [20000, 'zwanzigtausend'],
    [21000, 'einundzwanzigtausend'],
    [50000, 'fünfzigtausend'],
    [99999, 'neunundneunzigtausendneunhundertneunundneunzig'],
    [123456, 'einhundertdreiundzwanzigtausendvierhundertsechsundfünfzig'],
    [300000, 'dreihunderttausend'],
    [999999, 'neunhundertneunundneunzigtausendneunhundertneunundneunzig'],
    [1000000, 'eine Million'],
    [1000001, 'eine Million eins'],
    [2000000, 'zwei Millionen'],
    [2300000, 'zwei Millionen dreihunderttausend'],
    [1234567, 'eine Million zweihundertvierunddreißigtausendfünfhundertsiebenundsechzig'],
    [21000000, 'einundzwanzig Millionen'],
    [1000000000, 'eine Milliarde'],
    [2000000000, 'zwei Milliarden'],
    [1002003004, 'eine Milliarde zwei Millionen dreitausendvier'],
    [999999999999, 'neunhundertneunundneunzig Milliarden neunhundertneunundneunzig Millionen neunhundertneunundneunzigtausendneunhundertneunundneunzig'],
    [1000000000000, 'eine Billion'],
  ]
  arr.forEach(a => {
    const [num, str] = a
    t.equal(nlp(String(num)).numbers().toText().text(), str, here + 'toText ' + num)
    t.deepEqual(nlp(str).numbers().get(), [num], here + 'get ' + str)
    t.equal(nlp(str).numbers().toNumber().text(), String(num), here + 'toNumber ' + str)
  })
  t.equal(nlp('es kostet 2300000 Euro').numbers().toText().all().text(), 'es kostet zwei Millionen dreihunderttausend Euro', here + 'in a sentence')
  t.equal(nlp('-2000000').numbers().toText().text(), 'minus zwei Millionen', here + 'negative')
  t.equal(nlp('1.234.567').numbers().toText().toNumber().text(), '1.234.567', here + 'grouping is restored')
  t.end()
})

test('large text to number:', function (t) {
  const str = 'einhundertdreiundzwanzigtausendvierhundertsechsundfünfzig'
  t.deepEqual(nlp(str).numbers().get(), [123456], here + 'get ' + str)
  t.deepEqual(nlp('dreihunderttausend').numbers().get(), [300000], here + 'dreihunderttausend')
  t.deepEqual(nlp('zweihunderteinundzwanzigtausendelf').numbers().get(), [221011], here + '221011')
  t.end()
})

test('millions:', function (t) {
  t.deepEqual(nlp('zwei Millionen eins').numbers().get(), [2000001], here + 'zwei Millionen eins')
  t.deepEqual(nlp('zwei millionen eins').numbers().get(), [2000001], here + 'zwei millionen eins - lowercase')
  t.deepEqual(nlp('drei Millionen Menschen').numbers().get(), [3000000], here + 'drei Millionen')
  t.deepEqual(nlp('eine Million Menschen').numbers().get(), [1000000], here + 'eine Million')
  t.deepEqual(nlp('mit einer Million Menschen').numbers().get(), [1000000], here + 'einer Million')
  t.deepEqual(nlp('zwei Milliarden Euro').numbers().get(), [2e9], here + 'zwei Milliarden')
  t.deepEqual(nlp('minus zwei Millionen').numbers().get(), [-2000000], here + 'minus zwei Millionen')
  t.deepEqual(nlp('5 Millionen Euro').numbers().get(), [5000000], here + '5 Millionen')
  t.deepEqual(nlp('2,5 Millionen Euro').numbers().get(), [2500000], here + '2,5 Millionen')
  t.end()
})

test('a multi-word number is one number:', function (t) {
  let m = nlp('zwei Millionen dreihunderttausend Menschen').numbers()
  t.equal(m.length, 1, here + 'one number')
  t.equal(m.text(), 'zwei Millionen dreihunderttausend', here + 'all three words')
  t.deepEqual(m.get(), [2300000], here + 'get')
  t.equal(m.toNumber().all().text(), '2300000 Menschen', here + 'toNumber')

  m = nlp('eine Milliarde zwei Millionen dreitausendvier Leute').numbers()
  t.deepEqual(m.get(), [1002003004], here + 'Milliarde + Millionen + rest')

  // but a list of numbers is still a list
  t.deepEqual(nlp('drei vier fünf').numbers().get(), [3, 4, 5], here + 'drei vier fünf')
  t.deepEqual(nlp('drei vier zwei Millionen fünf sechs').numbers().get(), [3, 4, 2000005, 6], here + 'list around a million')
  t.deepEqual(nlp('zwei Millionen drei Millionen').numbers().get(), [2000000, 3000000], here + 'two millions')
  t.deepEqual(nlp('zwei Millionen Menschen und drei Hunde').numbers().get(), [2000000, 3], here + 'two numbers in a sentence')

  t.equal(nlp('zwei Millionen').numbers().add(1).text(), 'zwei Millionen eins', here + 'add')
  t.equal(nlp('5').numbers().set('eine Million').text(), '1000000', here + 'set with a written million')
  t.end()
})

test('compound ordinals over 100:', function (t) {
  t.deepEqual(nlp('einhundertzweite').numbers().get(), [102], here + 'einhundertzweite')
  t.deepEqual(nlp('zweihundertelfte').numbers().get(), [211], here + 'zweihundertelfte')
  t.deepEqual(nlp('einhunderterste').numbers().get(), [101], here + 'einhunderterste')
  t.deepEqual(nlp('zweitausenderste').numbers().get(), [2001], here + 'zweitausenderste')
  t.ok(nlp('einhundertzweite').has('#Ordinal'), here + 'einhundertzweite is an ordinal')
  t.ok(nlp('dreitausendvier').has('#Cardinal'), here + 'dreitausendvier is a cardinal')
  t.equal(nlp('der einhundertzweite Tag').numbers().toNumber().all().text(), 'der 102. Tag', here + 'einhundertzweite → 102.')
  t.equal(nlp('am einhundertzweiten Tag').numbers().toNumber().all().text(), 'am 102. Tag', here + 'einhundertzweiten → 102.')
  t.equal(nlp('der 102. Tag').numbers().toText().all().text(), 'der einhundertzweite Tag', here + '102. → einhundertzweite')
  // an ordinal is one word
  t.equal(nlp('der 2000000. Besucher').numbers().toText().all().text(), 'der zweimillionste Besucher', here + '2000000. → zweimillionste')
  t.deepEqual(nlp('zweimillionste').numbers().get(), [2000000], here + 'zweimillionste')
  t.end()
})

test('toText → toNumber round-trip, across the range:', function (t) {
  const nums = [0, 1, 19, 20, 21, 100, 101, 999, 1000, 1001, 19999, 20000, 100000, 100001, 999999]
  // every power of ten, and its neighbours
  for (let e = 6; e <= 12; e += 1) {
    const n = Math.pow(10, e)
    nums.push(n - 1, n, n + 1, 2 * n, n + 1000, 21 * n + 1)
  }
  // a repeatable sample, spread evenly over the orders of magnitude
  let seed = 1234567
  const rand = function () {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let i = 0; i < 400; i += 1) {
    nums.push(Math.floor(Math.pow(10, rand() * 12)))
  }
  // ...and some round ones, which leave words out
  for (let i = 0; i < 60; i += 1) {
    const n = Math.floor(Math.pow(10, 3 + rand() * 9))
    const size = Math.pow(10, String(n).length - 1 - Math.floor(rand() * 3))
    nums.push(n - (n % size))
  }
  let bad = 0
  nums.forEach(num => {
    const doc = nlp(String(num))
    const m = doc.numbers().toText()
    const str = doc.text()
    const res = nlp(str).numbers()
    const back = nlp(str).numbers().toNumber().all().text()
    const ok = /^[a-zäöüß ]+$/i.test(str) && res.length === 1 && res.get()[0] === num && m.get()[0] === num && back === String(num)
    if (!ok) {
      bad += 1
      t.fail(here + `round-trip ${num} → '${str}' → ${back}`)
    }
  })
  t.equal(bad, 0, here + `${nums.length} numbers round-trip`)
  t.end()
})
