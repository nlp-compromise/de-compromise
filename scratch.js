import nlp from './src/index.js'
nlp.verbose('tagger')


// können (can, to be able to), 
// müssen (must, to have to), 
// wollen (will, to want to), 
// sollen (should, am to, ought to, to be supposed to), 
// dürfen (may, to be allowed to), 
// mögen (to like, to like to).

// [`kulturell`, `{kulturell}`],
// [`kultureller`, `{kulturell}`],
// [`kulturelle`, `{kulturell}`],
// [`kulturellen`, `{kulturell}`],
// [`kulturelles`, `{kulturell}`],

// let doc = nlp('kultureller').debug()

let arr = [
  'skandalös',
  'und der ganze Rest der skandalösen Sachen.',
  'eine zweite Welle privater skandalöser Publikationen ausgelöst',
  'ebenso Gerüchte über eine skandalöse, inzestuöse Verbindung mit seiner Halbschwester',
  'Kraft',
  'Fuss',
  'anspruchsvoll',
  'schöne',
  // 'ich [muss] hinzufügen dass',
  // '[Mach] [dir] keine [Sorgen] ',//do not worry
]
let doc = nlp(arr[0]).debug()//.tag('Noun')
// console.log(nlp.world().methods.two.transform.adjective.all)
// console.log(doc.nouns().conjugate())
// doc.compute('root')
// console.log(doc.text('root'))
// console.log(nlp.buildNet([{ match: '{skandalös}' }]))
// console.log(nlp.parseMatch('{skandalös}')[0])



