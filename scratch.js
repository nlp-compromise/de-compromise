import nlp from './src/index.js'
nlp.verbose('tagger')


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
// txt = 'Am 5. Mai um 20.20 Uhr feiern wir mit 20.000 Margaritas.'
// txt = 'hunderterste'
// txt = 'zweiundzwanzig'
// txt = 'zweihunderteins'
// txt = 'dreiunddreiβig'
// txt = 'einhunderteinunddreißig'
// txt = 'eine million'

// verbs
// txt = 'zusammenzufuehren'
txt = 'Wir gingen in den Park'
txt = 'tanzten'
txt = 'schwimmen'

txt = 'geschwommen'
txt = 'schmecken'
// txt = 'schwimmend'
txt = 'schwimmen'
let doc = nlp(txt).debug()
console.log(doc.verbs().conjugate())


// let doc = nlp('null').debug()
// doc.numbers().toNumber().toOrdinal()
// console.log(doc.text())