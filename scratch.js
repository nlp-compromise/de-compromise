import nlp from './src/index.js'

// nlp.verbose('tagger')


// können (can, to be able to), 
// müssen (must, to have to), 
// wollen (will, to want to), 
// sollen (should, am to, ought to, to be supposed to), 
// dürfen (may, to be allowed to), 
// mögen (to like, to like to).

let txt = ''
txt = ''
txt = 'fünf'
txt = 'fünfhundert'
txt = 'sechshundert'
txt = 'sechsundzwanzig'
// txt = '30'
txt = '22'
txt = 'hunderterste'
// txt = 'hunderteins'
// txt = 'Wir kommen am 7. September vorbei.'
// txt = 'Am 5. Mai um 20.20 Uhr feiern wir mit 20.000 Margaritas.'
// txt = 'hunderterste'
// txt = 'zweiundzwanzig'
// txt = 'zweihunderteins'
// txt = 'dreiunddreiβig'
// txt = 'einhunderteinunddreißig'
// txt = 'eine million'

let text = `Du, könntest du schwimmen.
Wie Delphine, Delphine es tun.
Niemand gibt uns eine Chance.
Doch können wir siegen für immer und immer.
Und wir sind dann Helden für einen Tag.
Ich, ich bin dann König.
Und du, du Königin.
Obwohl sie unschlagbar scheinen.
Werden wir Helden für einen Tag.
Wir sind dann wir an diesem Tag.
Ich, ich glaubte zu träumen (zu träumen).
Die Mauer im Rücken war kalt (so kalt).
Schüsse reißen die Luft (reißen die Luft).
Doch wir küssen, als ob nichts geschieht (nichts geschieht).
Und die Scham fiel auf ihrer Seite.
Oh, wir können sie schlagen für alle Zeiten.
Dann sind wir Helden für diesen Tag.
Dann sind wir Helden.
      `
let html = ''
const onchange = function (txt) {
  let doc = nlp(txt)
  html = doc.html({
    '.nouns': '#Noun+',
    '.verbs': '#Verb+',
    '.adjectives': '#Adjective',
  })
  console.log(html)
}
onchange(text)


// let doc = nlp('Spencer geht zum Laden').debug()
// doc.match('#Person geht zum #Noun').debug()

// let doc = nlp('Ich habe einhunderteinundzwanzig Euro')
// doc.numbers().minus(10)
// doc.text()
// 'Ich habe einhundertelf Euro'

// let doc = nlp(txt).debug()
// let num = doc.numbers()
// num.toText()
// num.debug()
// num.toOrdinal()
// num.debug()
// console.log(doc.docs)
// console.log(num.json())
// doc.debug()
// console.log(JSON.stringify(doc.json(), null, 2))

// proof-of-concept verb-conjugation
// let conjugate = dok.methods.one.transform.conjugate
// console.log(conjugate.toPast('verabschieden'))
// console.log(conjugate.fromPast('verabschiedete'))
// // ["verabschieden", "verabschiedete"]
// console.log(conjugate.toPresent('wissen'))
// console.log(conjugate.fromPresent('weiß'))
// // ["wissen","weiß"]
