import test from 'tape'
import nlp from './_lib.js'
let here = '[fixes] '

test('verb-noun homographs', function (t) {
  let doc = nlp('Wir essen Pizza')
  t.equal(doc.match('#Verb').text(), 'essen', here + 'lowercase essen is a verb')
  doc = nlp('Das Essen ist fertig')
  t.ok(nlp('Das Essen ist fertig').match('Essen').has('#Noun'), here + 'capitalized Essen is a noun')
  t.equal(nlp('Er fragt mich').match('#Verb').text(), 'fragt', here + 'fragen is a verb')
  t.end()
})

test('function words', function (t) {
  t.ok(nlp('Das weiß ich nicht').match('nicht').has('#Negative'), here + 'nicht is negative')
  t.ok(nlp('Ich habe keine Zeit').match('keine').has('#Determiner'), here + 'keine is a determiner')
  t.ok(nlp('Ich habe keine Zeit').match('keine').has('#Negative'), here + 'keine is negative')
  t.ok(nlp('Die Sonne scheint aber es ist kalt').match('aber').has('#Conjunction'), here + 'aber is a conjunction')
  t.ok(nlp('Er bleibt obwohl es regnet').match('obwohl').has('#Conjunction'), here + 'obwohl is a conjunction')
  t.ok(nlp('Ich gehe morgen in die Schule').match('morgen').has('#Adverb'), here + 'morgen is an adverb')
  t.ok(nlp('Ich stehe jeden Morgen auf').match('Morgen').has('#Noun'), here + 'Morgen is a noun')
  t.ok(nlp('Ich sehe dieses Haus').match('dieses').has('#Determiner'), here + 'dieses is a determiner')
  t.ok(nlp('Er kommt jeden Tag').match('jeden').has('#Determiner'), here + 'jeden is a determiner')
  t.end()
})

test('possessive determiners', function (t) {
  let doc = nlp('Mein Bruder arbeitet hier')
  t.ok(doc.match('mein').has('#Determiner'), here + 'prenominal mein is a determiner')
  doc = nlp('von meinem Rücken')
  t.ok(doc.match('meinem').has('#Possessive'), here + 'meinem keeps #Possessive')
  t.ok(doc.match('meinem').has('#Determiner'), here + 'meinem is a determiner')
  t.end()
})

test('german word-order - auxiliaries', function (t) {
  let doc = nlp('Sie hat gestern ein Buch gelesen')
  t.ok(doc.match('hat').has('#Auxiliary'), here + 'hat ... participle is auxiliary')
  t.ok(doc.match('gelesen').has('#Participle'), here + 'gelesen is a participle')
  doc = nlp('Wir werden nächste Woche nach Berlin fahren')
  t.ok(doc.match('werden').has('#Auxiliary'), here + 'werden ... infinitive is future auxiliary')
  doc = nlp('Er ist nach Hause gegangen')
  t.ok(doc.match('ist').has('#Auxiliary'), here + 'ist ... participle is auxiliary')
  doc = nlp('Das Buch wird gelesen')
  t.ok(doc.match('wird').has('#Auxiliary'), here + 'wird ... participle is passive auxiliary')
  doc = nlp('Er hat sein Buch gelesen')
  t.ok(doc.match('sein').has('#Determiner'), here + 'possessive sein is not an auxiliary')
  t.end()
})

test('inflected adjective between determiner and noun', function (t) {
  let doc = nlp('das schnelle Auto')
  t.ok(doc.match('schnelle').has('#Adjective'), here + 'schnelle is an adjective')
  doc = nlp('Das las Peter')
  t.ok(doc.match('las').has('#Verb'), here + 'las stays a verb')
  doc = nlp('Die spielen Fußball')
  t.ok(doc.match('spielen').has('#Verb'), here + 'spielen stays a verb')
  t.end()
})

test('weiß as wissen', function (t) {
  t.ok(nlp('Das weiß ich nicht').match('weiß').has('#Verb'), here + 'weiß beside pronoun is a verb')
  t.ok(nlp('Das Kleid ist weiß').match('weiß').has('#Adjective'), here + 'weiß stays an adjective')
  t.end()
})

test('separable verb prefix', function (t) {
  let doc = nlp('Ich stehe jeden Morgen um sieben Uhr auf')
  t.ok(doc.match('auf').has('#Particle'), here + 'clause-final auf is a particle')
  doc = nlp('Er macht die Tür zu')
  t.ok(doc.match('zu').has('#Particle'), here + 'clause-final zu is a particle')
  doc = nlp('Wir gehen in die Schule')
  t.ok(doc.match('in').has('#Preposition'), here + 'in stays a preposition')
  t.end()
})

test('irregular conjugations', function (t) {
  const conj = (w) => nlp(w).verbs().conjugate()[0] || {}
  t.equal(conj('sein').pastParticiple, 'gewesen', here + 'sein → gewesen')
  t.equal(conj('sein').presentTense.first, 'bin', here + 'sein → bin')
  t.equal(conj('werden').pastParticiple, 'geworden', here + 'werden → geworden')
  t.equal(conj('haben').subjunctive2.first, 'hätte', here + 'haben → hätte')
  t.equal(conj('wissen').pastTense.first, 'wusste', here + 'wissen → wusste')
  t.equal(conj('wissen').pastParticiple, 'gewusst', here + 'wissen → gewusst')
  t.equal(conj('müssen').presentTense.first, 'muss', here + 'müssen → muss')
  t.equal(conj('müssen').pastTense.first, 'musste', here + 'müssen → musste')
  t.equal(conj('mögen').subjunctive2.first, 'möchte', here + 'mögen → möchte')
  t.equal(conj('denken').pastTense.first, 'dachte', here + 'denken → dachte')
  t.equal(conj('bringen').pastParticiple, 'gebracht', here + 'bringen → gebracht')
  t.equal(conj('lesen').pastParticiple, 'gelesen', here + 'lesen → gelesen')
  t.equal(conj('geben').pastParticiple, 'gegeben', here + 'geben → gegeben')
  t.equal(conj('Wir essen Pizza').pastParticiple, 'gegessen', here + 'essen → gegessen')
  // prefixed irregulars
  t.equal(conj('verstehen').pastParticiple, 'verstanden', here + 'verstehen → verstanden')
  t.equal(conj('aufstehen').pastParticiple, 'aufgestanden', here + 'aufstehen → aufgestanden')
  t.equal(conj('vergeben').pastParticiple, 'vergeben', here + 'vergeben → vergeben')
  t.equal(conj('erkennen').pastTense.first, 'erkannte', here + 'erkennen → erkannte')
  t.end()
})

test('modal tagging', function (t) {
  t.ok(nlp('Ich möchte einen Kaffee bestellen').match('möchte').has('#Modal'), here + 'möchte is a modal')
  t.ok(nlp('Kannst du mir helfen?').match('kannst').has('#Modal'), here + 'kannst is a modal')
  t.end()
})

test('noun api', function (t) {
  t.equal(nlp('der Hund').nouns().toPlural().text(), 'Hunde', here + 'toPlural Hund')
  t.equal(nlp('das Haus').nouns().toPlural().text(), 'Häuser', here + 'toPlural Haus (umlaut)')
  t.equal(nlp('der Mann').nouns().toPlural().text(), 'Männer', here + 'toPlural Mann (umlaut)')
  t.equal(nlp('die Hunde').nouns().toSingular().text(), 'Hund', here + 'toSingular Hunde')
  t.equal(nlp('die Männer').nouns().toSingular().text(), 'Mann', here + 'toSingular Männer')
  let obj = nlp('der Hund').nouns().conjugate()[0] || {}
  t.equal(obj.plural, 'hunde', here + 'nouns().conjugate() plural')
  t.equal(obj.singular, 'hund', here + 'nouns().conjugate() singular')
  t.ok(nlp('Die Kinder spielen').match('Kinder').has('#Plural'), here + 'Kinder tagged plural')
  t.end()
})
