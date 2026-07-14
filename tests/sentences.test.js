import test from 'tape'
import nlp from './_lib.js'
let here = '[sentences] '

test('questions', function (t) {
  let doc = nlp('Wo ist der Bahnhof?')
  t.ok(doc.match('wo').has('#QuestionWord'), here + 'wo is a question-word')
  t.ok(doc.match('ist').has('#Verb'), here + 'verb-first ist is a verb')
  t.ok(doc.match('bahnhof').has('#Noun'), here + 'Bahnhof is a noun')
  doc = nlp('Warum lernst du Deutsch?')
  t.ok(doc.match('warum').has('#QuestionWord'), here + 'warum is a question-word')
  t.ok(doc.match('lernst').has('#Verb'), here + 'lernst is a verb')
  t.ok(doc.match('du').has('#Pronoun'), here + 'du is a pronoun')
  t.end()
})

test('perfect-tense bracket', function (t) {
  // Satzklammer - auxiliary and clause-final participle
  let doc = nlp('Wir haben gestern einen Film gesehen')
  t.ok(doc.match('haben').has('#Auxiliary'), here + 'haben is auxiliary')
  t.ok(doc.match('gesehen').has('#Participle'), here + 'clause-final gesehen is a participle')
  t.ok(doc.match('gestern').has('#Adverb'), here + 'gestern is an adverb')
  doc = nlp('Hast du meine Schlüssel gesehen?')
  t.ok(doc.match('hast').has('#Verb'), here + 'verb-first hast is a verb')
  t.ok(doc.match('gesehen').has('#Verb'), here + 'question-final gesehen is a verb')
  t.end()
})

test('subordinate clauses', function (t) {
  // verb-final word order after the conjunction
  let doc = nlp('Ich weiß dass er heute kommt')
  t.ok(doc.match('dass').has('#Conjunction'), here + 'dass is a conjunction')
  t.ok(doc.match('kommt').has('#Verb'), here + 'clause-final kommt is a verb')
  doc = nlp('Wenn es regnet bleiben wir zu Hause')
  t.ok(doc.match('wenn').has('#Conjunction'), here + 'wenn is a conjunction')
  t.ok(doc.match('regnet').has('#Verb'), here + 'regnet is a verb')
  t.ok(doc.match('bleiben').has('#Verb'), here + 'bleiben is a verb')
  t.end()
})

test('verb-second word order', function (t) {
  // fronted adverb pushes the subject after the verb
  let doc = nlp('Morgen fahren wir nach München')
  t.ok(doc.match('morgen').has('#Adverb'), here + 'fronted morgen is an adverb')
  t.ok(doc.match('fahren').has('#Verb'), here + 'fahren is a verb')
  t.ok(doc.match('wir').has('#Pronoun'), here + 'postverbal wir is a pronoun')
  t.end()
})

test('predicate adjectives', function (t) {
  let doc = nlp('Das Wetter ist heute sehr schön')
  t.ok(doc.match('sehr').has('#Adverb'), here + 'sehr is an adverb')
  t.ok(doc.match('schön').has('#Adjective'), here + 'predicate schön is an adjective')
  doc = nlp('Der alte Mann liest eine Zeitung')
  t.ok(doc.match('alte').has('#Adjective'), here + 'attributive alte is an adjective')
  t.ok(doc.match('liest').has('#Verb'), here + 'liest is a verb')
  t.end()
})

test('modal + infinitive', function (t) {
  let doc = nlp('Sie möchte Ärztin werden')
  t.ok(doc.match('möchte').has('#Verb'), here + 'möchte is a verb')
  t.ok(doc.match('werden').has('#Verb'), here + 'clause-final werden is a verb')
  t.ok(doc.match('ärztin').has('#Noun'), here + 'Ärztin is a noun')
  t.end()
})
