import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-contractions] '

test('preposition + article:', function (t) {
  const arr = [
    ['Er geht zum Arzt', 'zu dem'],
    ['Sie geht zur Schule', 'zu der'],
    ['Wir sind im Garten', 'in dem'],
    ['Wir gehen ins Kino', 'in das'],
    ['Er kommt vom Arzt', 'von dem'],
    ['Er ist beim Arzt', 'bei dem'],
    ['Wir treffen uns am Bahnhof', 'an dem'],
    ['Er geht ans Fenster', 'an das'],
    ['Sie geht aufs Dach', 'auf das'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    t.equal(doc.has(want), true, here + str + ' has ' + want)
    t.equal(doc.text(), str, here + 'text is unchanged: ' + str)
    t.equal(doc.wordCount(), str.split(' ').length, here + 'wordCount: ' + str)
  })
  t.equal(nlp('Er geht zum Arzt').match('zum').text(), 'zum', here + 'the contraction still matches')
  t.equal(nlp('Er geht zum Arzt').match('zum arzt').text(), 'zum Arzt', here + 'in a longer match')
  t.end()
})
