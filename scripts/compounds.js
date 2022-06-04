import wtf from 'wtf_wikipedia'

let arr = [
  'Worttrennung',
  'Aussprache',
  'Bedeutungen',
  'Abkürzungen',
  'Herkunft',
  'Synonyme',
  'Sinnverwandte Wörter',
  'Gegenwörter',
  'Verkleinerungsformen',
  'Oberbegriffe',
  'Unterbegriffe',
  'Beispiele',
  'Redewendungen',
  'Charakteristische Wortkombinationen',
  'Wortbildungen',
  'Referenzen',
]

wtf.extend((_, templates) => {
  arr.forEach(name => {
    templates[name] = `=== ${name} ===`
  })
})

let doc = wtf(`{{Herkunft}}
:[[Determinativkompositum]], zusammengesetzt aus den Substantiven ''[[Land]]'' und ''[[Kreis]]''
`)
console.log(doc.text())
// wtf.fetch('https://de.wiktionary.org/wiki/Landkreis').then(doc => {

doc.sentences().forEach(s => {
  console.log(s)
  let found = s.links().find(l => l.link === 'Determinativkompositum')
  console.log(found)
})
  // console.log(doc.sections().map(s => s.json()))
// })
