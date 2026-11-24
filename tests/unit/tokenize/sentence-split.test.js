import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-sentence-split] '

test('sentence boundaries:', function (t) {
  const arr = [
    ['Das kostet 1.234,56 Euro. Das ist viel.', 2],
    ['Er kam am 3. Mai an.', 1],
    ['Am 24.12.2020 war Weihnachten. Es schneite.', 2],
    ['Prof. Dr. Schmidt kommt. Er ist nett.', 2],
    ['Was? Wirklich?! Ja...', 3],
    ['Das Treffen ist um 15.30 Uhr. Komm bitte.', 2],
    ['Sie verdient ca. 3.000 Euro.', 1],
    ['Es hat -5 Grad. Es ist kalt.', 2],
    ['Zeile eins\nZeile zwei', 2],
    ['Ein Satz ohne Punkt', 1],
    ['', 0],
  ]
  arr.forEach(a => {
    const [str, n] = a
    t.equal(nlp(str).length, n, here + JSON.stringify(str))
    t.equal(nlp(str).text(), str, here + 'text is unchanged: ' + JSON.stringify(str))
  })
  t.end()
})
