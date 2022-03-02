import test from 'tape'
import nlp from './_lib.js'
let here = '[de-match] '

test('match:', function (t) {
  let arr = [
    ['Wir gehen in den Park', '#Pronoun #Verb in #Determiner #Noun'],
    ['Kanada ist sehr kalt ', '#Noun #Verb #Adverb #Adjective'],
  ]
  let res = []
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str).compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tagRank[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)

    if (m.text() !== doc.text()) {
      res.push(a[0])
    }
    t.equal(m.text(), doc.text(), here + msg)
  })
  // console.log(JSON.stringify(res, null, 2))
  t.end()
})
