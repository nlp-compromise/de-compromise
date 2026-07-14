import test from 'tape'
import nlp from './_lib.js'
let here = '[nouns] '

test('toPlural', function (t) {
  let arr = [
    // -en / -n plurals
    ['die Frau', 'Frauen'],
    ['die Katze', 'Katzen'],
    ['die Blume', 'Blumen'],
    // -er plurals with umlaut
    ['das Kind', 'Kinder'],
    ['das Buch', 'Bücher'],
    // -e plurals, with and without umlaut
    ['der Baum', 'Bäume'],
    ['die Stadt', 'Städte'],
    ['das Jahr', 'Jahre'],
    // umlaut-only plurals
    ['der Apfel', 'Äpfel'],
    ['der Vater', 'Väter'],
    ['die Mutter', 'Mütter'],
    // -s plural
    ['das Auto', 'Autos'],
    // unchanged plural
    ['der Lehrer', 'Lehrer'],
  ]
  arr.forEach(a => {
    let [str, want] = a
    t.equal(nlp(str).nouns().toPlural().text(), want, here + str + ' → ' + want)
  })
  t.end()
})

test('toSingular', function (t) {
  let arr = [
    ['die Frauen', 'Frau'],
    ['die Bücher', 'Buch'],
    ['die Städte', 'Stadt'],
    ['die Kinder', 'Kind'],
    ['die Äpfel', 'Apfel'],
  ]
  arr.forEach(a => {
    let [str, want] = a
    t.equal(nlp(str).nouns().toSingular().text(), want, here + str + ' → ' + want)
  })
  t.end()
})

test('noun conjugate', function (t) {
  let obj = nlp('das Buch').nouns().conjugate()[0] || {}
  t.equal(obj.singular, 'buch', here + 'Buch singular')
  t.equal(obj.plural, 'bücher', here + 'Buch plural')
  t.end()
})

test('plural casing kept', function (t) {
  // german nouns stay capitalized after inflection
  t.equal(nlp('der Hund').nouns().toPlural().text(), 'Hunde', here + 'Hund keeps capital')
  t.equal(nlp('die Bücher').nouns().toSingular().text(), 'Buch', here + 'Buch keeps capital')
  t.end()
})

test('toSingular is noop on singular', function (t) {
  t.equal(nlp('der Hund').nouns().toSingular().all().text(), 'der Hund', here + 'singular Hund unchanged')
  // singular nouns ending in -e must not get clipped - 'der Kunde' is not a plural
  t.equal(nlp('der Kunde').nouns().toSingular().all().text(), 'der Kunde', here + 'singular Kunde unchanged')
  t.equal(nlp('die Kunden').nouns().toSingular().all().text(), 'die Kunde', here + 'Kunden → Kunde')
  t.end()
})

test('toPlural is noop on plural', function (t) {
  // 'Hunde' is already plural, even though the tagger cannot prove it
  t.equal(nlp('die Hunde').nouns().toPlural().all().text(), 'die Hunde', here + 'plural Hunde unchanged')
  t.equal(nlp('die Bücher').nouns().toPlural().all().text(), 'die Bücher', here + 'plural Bücher unchanged')
  t.end()
})

test('isPlural', function (t) {
  t.equal(nlp('die Bücher').nouns().isPlural().text(), 'Bücher', here + 'Bücher is plural')
  t.ok(nlp('Die Kinder spielen').match('Kinder').has('#Plural'), here + 'Kinder tagged plural')
  t.end()
})
