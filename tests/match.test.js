import test from 'tape'
import nlp from './_lib.js'
let here = '[de-match] '
nlp.verbose(false)

test('match:', function (t) {
  let arr = [
    ['Wir gehen in den Park', '#Pronoun #Verb in #Determiner #Noun'],
    ['Kanada ist sehr kalt', '#Noun #Verb #Adverb #Adjective'],
    ['hinterm', '#Adverb #Determiner'],// contraction
    ['Spencer geht zum Laden ', '#Person #Verb #Determiner #Noun'],
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
