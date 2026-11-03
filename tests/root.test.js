import test from 'tape'
import nlp from './_lib.js'
const here = '[root-match] '
nlp.verbose(false)

test('root-match:', function (t) {
  const arr = [
    // ===verbs===
    // past-tense
    ['wir gingen', 'wir {gehen}'],
    // present-tense
    ['Spencer geht langsam', '#Person {gehen} .'],

    [`das schöne Lied`, `#Determiner {schöne} #Noun`],//the beautiful song
    // [`das schönere Lied`, `#Determiner {schöne} #Noun`],//the more beautiful song
    // [`am schönsten`, `am {schöne}`],
    // [`Dieses Haus ist das schönste`, `#Determiner #Noun #Copula das {schöne}`],//This house is the most beautiful
    // adjectives
    // ['konkreter', '{konkret}'],
    // ['konkreten', '{konkret}'],
    // ['konkrete', '{konkret}'],
    // ['konkretes', '{konkret}'],
    // nouns
    [`Abdriftendste`, `{abdriftendste}`],
    [`Abdriftendsten`, `{abdriftendste}`],
    [`Gasen`, `{gase}`],
    [`Lampen`, `{lampe}`],
    [`Kunden`, `{kunde}`],
    // [``, ``],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    const doc = nlp(str).compute('root')
    const tags = doc.json()[0].terms.map(term => term.tags[0])
    const msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    t.equal(doc.has(match), true, here + msg)
  })
  t.end()
})
