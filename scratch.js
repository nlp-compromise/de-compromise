import nlp from './src/index.js'



let text = 'Die eidgenössischen Landwirte bleiben somit im wahrsten Sinne des Wortes auf ihrem Kuhmist sitzen weil die Vorarlberger'
var dok = nlp(text)
dok.debug()


// proof-of-concept verb-conjugation
// let conjugate = dok.methods.one.transform.conjugate
// console.log(conjugate.toPast('verabschieden'))
// console.log(conjugate.fromPast('verabschiedete'))
// // ["verabschieden", "verabschiedete"]
// console.log(conjugate.toPresent('wissen'))
// console.log(conjugate.fromPresent('weiß'))
// // ["wissen","weiß"]
