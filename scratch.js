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
txt = 'dreiunddreiβig'
txt = 'einhunderteinunddreißig'
txt = 'eine million'

let doc = nlp(txt).debug()
// doc.compute('splitter')
console.log(doc.docs)
let num = doc.numbers().debug()
console.log(num.json())
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
