import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-european-numbers] '

// digits are read by the europeanNumbers plugin, from compromise/shared
test('decimal-comma numbers', function (t) {
  const arr = [
    ['3,50', 3.5],
    ['1.000', 1000],
    ['1.234,56', 1234.56],
    ['1.234.567', 1234567],
    ['1,234', 1.234],
    // a period that can't be grouping thousands
    ['3.5', 3.5],
    // thousands split-up by a space, or an apostrophe
    ['1 000', 1000],
    ['1 234 567,89', 1234567.89],
    ["1'000", 1000],
    ['-5', -5],
    ['−5', -5],
    ['(-5)', -5],
    ['-3,5', -3.5],
    ['minus 5', -5],
    ['3,5%', 3.5],
    ['5,30€', 5.3],
    ['€5,30', 5.3],
    ['1/2', 0.5],
  ]
  arr.forEach(a => {
    t.deepEqual(nlp(a[0]).numbers().get(), [a[1]], here + a[0])
  })
  t.deepEqual(nlp('Es kostet 1.000.').numbers().get(), [1000], here + 'sentence-final period')
  t.deepEqual(nlp('Preis: 3,50, danach 4,20.').numbers().get(), [3.5, 4.2], here + 'trailing commas')
  t.deepEqual(nlp('im Jahr 2020 100 Leute').numbers().get(), [2020, 100], here + 'two numbers, not one')
  t.deepEqual(nlp('12 34').numbers().get(), [12, 34], here + 'not a thousands-group')
  t.end()
})

test('decimal-comma tags', function (t) {
  t.ok(nlp("1'000").has('#Cardinal'), here + 'apostrophe-grouped is a number')
  t.ok(nlp('der 3. Mann').has('#Ordinal'), here + 'ordinals are left alone')
  t.ok(nlp('15.30 Uhr').has('#Time'), here + 'times are left alone')
  t.end()
})

test('decimal-comma output', function (t) {
  const arr = [
    // [text, add, result]
    ['3,50', 1, '4,5'],
    ['1.234,5', 1, '1.235,5'],
    ['1 000', 1, '1 001'],
    ['1 234,5 kg', 1, '1 235,5 kg'],
    ["1'000", 1, "1'001"],
    ['999', 1, '1000'],
    ['−5', 1, '-4'],
    ['(-5)', 1, '(-4)'],
    ['der 3. Mann', 1, 'der 4. Mann'],
  ]
  arr.forEach(a => {
    const doc = nlp(a[0])
    doc.numbers().add(a[1])
    t.equal(doc.text(), a[2], here + `${a[0]} + ${a[1]}`)
  })
  t.end()
})

// the number takes its tag from the word beside it
test('spaced money and percent', function (t) {
  const money = ["5,30 €", "€ 5,30", "1.000 Euro", "12,50 EUR", "CHF 12", "hundert Euro", "5 Franken"]
  const percent = ["3,5 %", "50 Prozent", "fünfzig Prozent"]
  const values = [["50 Prozent", 50]]
  const neither = ["fünf Katzen"]
  money.forEach(str => {
    const doc = nlp(str)
    t.ok(doc.has('#Money'), here + 'money: ' + str)
    t.ok(doc.has('#Currency'), here + 'currency: ' + str)
    t.equal(doc.numbers().length, 1, here + 'one number: ' + str)
  })
  percent.forEach(str => {
    const doc = nlp(str)
    t.ok(doc.has('#Percent'), here + 'percent: ' + str)
    t.equal(doc.numbers().length, 1, here + 'one number: ' + str)
  })
  values.forEach(a => {
    t.deepEqual(nlp(a[0]).numbers().get(), [a[1]], here + 'value: ' + a[0])
  })
  neither.forEach(str => {
    t.equal(nlp(str).has('(#Money|#Percent)'), false, here + 'neither: ' + str)
  })
  t.end()
})

test('no words for a decimal', function (t) {
  const arr = ['3,5', '1.234,5', '-3,5', '12,5 kg', '3,5 %']
  arr.forEach(str => {
    let doc = nlp(str)
    doc.numbers().toText()
    t.equal(doc.text(), str, here + 'toText ' + str)
    doc = nlp(str)
    doc.numbers().toOrdinal()
    t.equal(doc.text(), str, here + 'toOrdinal ' + str)
  })
  let doc = nlp('3')
  doc.numbers().toText()
  t.equal(doc.text(), 'drei', here + 'integers still have words')
  // a written number that stops being whole is written in digits
  doc = nlp('fünf Euro')
  doc.numbers().add(2.25)
  t.equal(doc.text(), '7,25 Euro', here + 'add a decimal to words')
  t.deepEqual(doc.numbers().get(), [7.25], here + '... and read it back')
  doc = nlp('fünf')
  doc.numbers().set(0.5)
  t.equal(doc.text(), '0,5', here + 'set a decimal on words')
  doc = nlp('drei')
  doc.numbers().add(1)
  t.equal(doc.text(), 'vier', here + 'whole numbers stay in words')
  t.end()
})
