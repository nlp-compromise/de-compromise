/* eslint-disable no-console, no-unused-vars */
import nlp from './src/index.js'
// nlp.verbose('tagger')

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

console.log(nlp.parseMatch('{erdnuss/noun}'))

let arr = [
  'Ich habe drei Bücher gelesen',
  'skandalös',
  'Wir hatten eine amerikanische Hochzeit',
  'Michaela wird einmal Bäckerin', //Michaela will be a baker one day.
  '„Wir bleiben hier.“', // (We are staying here.)
  '„Sie hält ihn für einen Nichtsnutz.“', // (She thinks he is a loser.)
  `Dass es kein Geld für meine Hochzeit gibt?! `,
  `Ich hatte Spaß bei der ersten Hochzeit. `,
  'Die Aussicht ist schön',

  'und der ganze Rest der skandalösen Sachen.',
  'eine zweite Welle privater skandalöser Publikationen ausgelöst',
  'ebenso Gerüchte über eine skandalöse, inzestuöse Verbindung mit seiner Halbschwester',
  'Kraft',
  'Fuss',
  'anspruchsvoll',
  'schöne'
  // 'ich [muss] hinzufügen dass',
  // '[Mach] [dir] keine [Sorgen] ',//do not worry
]

let str = 'er Hochzeitsfragen ausgewichen war'
// let str = "Die Top 10 der günstigen Hochzeitseinladungen in Toronto"
// let str = "des Wunders des Hochzeitsfestes Jesu"
// let str = "für die Hochzeitsfeier von Königin"
// let doc = nlp.tokenize(str).compute('root')
// let match = nlp.parseMatch('{werkstätten}')
// doc.match(match).debug()
// console.log(doc.has('{hochzeit}'))

// skandalösen

// let doc = nlp(arr[0]).debug()//.tag('Noun')
// console.log(doc.nouns().toSingular().text())
// doc.match('{hochzeit}').debug()
// console.log(nlp.world().methods.two.transform.adjective.all)
// console.log(doc.adjectives().conjugate())
// doc.compute('root')
// console.log(doc.text('root'))
// let net = nlp.buildNet([{ match: '{hochzeit}' }])
// doc.match(net)
// console.log(nlp.parseMatch('{elternteil/Noun}')[0])
