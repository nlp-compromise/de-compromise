import test from 'tape'
import nlp from '../../_lib.js'
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

test('verb roots:', function (t) {
  const arr = [
    // present-tense, every person
    ['ich gehe', 'gehen'],
    ['du gehst', 'gehen'],
    ['er geht', 'gehen'],
    ['wir gehen', 'gehen'],
    ['ihr geht', 'gehen'],
    ['sie gehen', 'gehen'],
    // weak verbs
    ['ich lerne', 'lernen'],
    ['sie tanzt', 'tanzen'],
    ['ich arbeite', 'arbeiten'],
    ['es regnet', 'regnen'],
    ['er öffnet', 'öffnen'],
    ['ich trinke', 'trinken'],
    ['sie singt', 'singen'],
    ['wir wohnen', 'wohnen'],
    ['wir spielen', 'spielen'],
    // stem-changes
    ['du sprichst', 'sprechen'],
    ['der Hund schläft', 'schlafen'],
    ['sie isst', 'essen'],
    ['er liest', 'lesen'],
    ['du läufst', 'laufen'],
    ['er hilft', 'helfen'],
    ['du weißt', 'wissen'],
    // past-tense
    ['er ging', 'gehen'],
    ['sie gingen', 'gehen'],
    ['er sagte', 'sagen'],
    ['wir fuhren', 'fahren'],
    ['er kam', 'kommen'],
    ['sie gab', 'geben'],
    ['er nahm', 'nehmen'],
    ['sie schrieb', 'schreiben'],
    ['ich dachte', 'denken'],
    ['er brachte', 'bringen'],
    ['ich lernte', 'lernen'],
    ['sie tanzten', 'tanzen'],
    // auxiliaries + modals
    ['ich bin', 'sein'],
    ['er war', 'sein'],
    ['er wird', 'werden'],
    ['ich kann', 'können'],
    ['er muss', 'müssen'],
    ['ich habe einen Hund', 'haben'],
    ['wir hatten Hunger', 'haben'],
  ]
  arr.forEach(function (a) {
    const [str, root] = a
    const doc = nlp(str).compute('root')
    const term = doc.docs[0].find(o => o.tags.has('Verb')) || {}
    t.equal(term.root, root, here + `'${str}' → ${root}`)
    t.equal(doc.has(`{${root}}`), true, here + `'${str}' has {${root}}`)
  })
  t.end()
})

test('verb roots in a phrase:', function (t) {
  let doc = nlp('ich habe einen Apfel gegessen').compute('root')
  t.equal(doc.match('habe').text('root'), 'haben', here + 'auxiliary root')
  t.equal(doc.match('gegessen').text('root'), 'essen', here + 'participle root')
  doc = nlp('er hat mich angerufen').compute('root')
  t.equal(doc.match('angerufen').text('root'), 'anrufen', here + 'separable participle root')
  // the particle has no root of its own
  doc = nlp('ich rufe dich an').compute('root')
  t.equal(doc.match('rufe').text('root'), 'rufen', here + 'separable verb root')
  t.equal(doc.docs[0][3].root, undefined, here + 'particle has no root')
  // the tagger gets the person wrong here - the root must not depend on it
  doc = nlp('ihr geht nach Hause').compute('root')
  t.equal(doc.match('geht').text('root'), 'gehen', here + 'ihr geht')
  doc = nlp('Sie isst einen Apfel').compute('root')
  t.equal(doc.match('isst').text('root'), 'essen', here + 'sie isst')
  // an unknown noun-ish word is not given a made-up infinitive
  doc = nlp('Abdriftendsten').compute('root')
  t.equal(doc.docs[0][0].root === 'abdriftendsen', false, here + 'no invented root')
  t.end()
})

test('conjugate from a conjugated verb:', function (t) {
  const arr = [
    ['ich gehe', 'gehen', 'ging', 'gegangen'],
    ['er ging', 'gehen', 'ging', 'gegangen'],
    ['du sprichst', 'sprechen', 'sprach', 'gesprochen'],
    ['der Hund schläft', 'schlafen', 'schlief', 'geschlafen'],
    ['er sagte', 'sagen', 'sagte', 'gesagt'],
    ['wir fuhren', 'fahren', 'fuhr', 'gefahren'],
    ['ich lerne', 'lernen', 'lernte', 'gelernt'],
    ['sie schrieb', 'schreiben', 'schrieb', 'geschrieben'],
    ['er nahm', 'nehmen', 'nahm', 'genommen'],
    ['ich bin müde', 'sein', 'war', 'gewesen'],
  ]
  arr.forEach(function (a) {
    const [str, inf, past, participle] = a
    const o = nlp(str).verbs().conjugate()[0] || {}
    t.equal(o.infinitive, inf, here + `'${str}' infinitive`)
    t.equal((o.pastTense || {}).first, past, here + `'${str}' past`)
    t.equal(o.pastParticiple, participle, here + `'${str}' participle`)
  })
  t.end()
})

test('joined separable verbs:', function (t) {
  const arr = [
    ['weil ich dich anrufe', 'dich (#Verb && #PresentTense && #FirstPerson)', '{anrufen}'],
    ['ob er mitkommt', 'er (#Verb && #PresentTense)', '{mitkommen}'],
    ['bevor er losfährt', 'er (#Verb && #PresentTense)', '{losfahren}'],
    ['dass er früh aufsteht', 'früh #Verb', '{aufstehen}'],
    ['als er ankam', 'er #PastTense', '{ankommen}'],
    // the infinitive, too
    ['ob sie mitkommen', 'sie #Infinitive', '{mitkommen}'],
    ['sie werden mitkommen', '#Auxiliary #Infinitive', '{mitkommen}'],
    ['wir wollen mitmachen', '#Verb #Infinitive', '{mitmachen}'],
  ]
  arr.forEach(function (a) {
    const [str, match, root] = a
    const doc = nlp(str).compute('root')
    t.equal(doc.has(match), true, here + `'${str}' has ${match}`)
    t.equal(doc.has(root), true, here + `'${str}' has ${root}`)
  })
  // a capitalized word is still a noun
  t.equal(nlp('die Anrufe').has('#Determiner #Noun'), true, here + 'die Anrufe')
  t.equal(nlp('viele Anrufe kommen').match('Anrufe').has('#Noun'), true, here + 'viele Anrufe')
  // .. and known adjectives are not verbs
  t.equal(nlp('er ist einfach').match('einfach').has('#Verb'), false, here + 'einfach')
  t.equal(nlp('sie ist zufrieden').match('zufrieden').has('#Verb'), false, here + 'zufrieden')
  t.equal(nlp('das ist angenehm').match('angenehm').has('#Verb'), false, here + 'angenehm')
  t.end()
})
