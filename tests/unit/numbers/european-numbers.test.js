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
