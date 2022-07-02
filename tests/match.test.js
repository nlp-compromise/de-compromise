import test from 'tape'
import nlp from './_lib.js'
let here = '[de-match] '

test('match:', function (t) {
  let arr = [
    ['Wir gehen in den Park', '#Pronoun #Verb in #Determiner #Noun'],
    ['Kanada ist sehr kalt', '#Noun #Verb #Adverb #Adjective'],
    ['hinterm', '#Adverb #Determiner'],// contraction
    ['Spencer geht zum Laden', '#Person #Verb zu #Determiner #Noun'],
    ['Spencer geht zum Laden', '#Person geht zum #Noun'],
    // contractions
    ['zum', 'zum'],
    ['zum', 'zu .'],
    ['zum', 'zu dem'],

    ['juni', '#Month'],
    ['donnerstag', '#WeekDay'],
    ['234', '#Value'],
    ['chicago', '#City'],
    ['Jamaika', '#Country'],
    ['colorado', '#Place'],
    ['tony', '#MaleName'],
    ['64. Hund', '#Ordinal #Noun'],
    // ['', ''],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})
