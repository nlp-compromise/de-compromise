import test from 'tape'
import nlp from './_lib.js'
let here = '[conjugation] '

const conj = (w) => nlp(w).verbs().conjugate()[0] || {}

test('weak verbs', function (t) {
  let arr = [
    // [infinitive, present-3rd, present-2nd, past-1st, past-participle]
    ['machen', 'macht', 'machst', 'machte', 'gemacht'],
    ['spielen', 'spielt', 'spielst', 'spielte', 'gespielt'],
    ['kaufen', 'kauft', 'kaufst', 'kaufte', 'gekauft'],
    // -t stem gets epenthetic e
    ['arbeiten', 'arbeitet', 'arbeitest', 'arbeitete', 'gearbeitet'],
  ]
  arr.forEach(a => {
    let [inf, third, second, past, pp] = a
    let c = conj(inf)
    t.equal(c.presentTense.third, third, here + inf + ' → ' + third)
    t.equal(c.presentTense.second, second, here + inf + ' → ' + second)
    t.equal(c.pastTense.first, past, here + inf + ' → ' + past)
    t.equal(c.pastParticiple, pp, here + inf + ' → ' + pp)
  })
  t.end()
})

test('strong verbs', function (t) {
  let arr = [
    // [infinitive, present-3rd, past-1st, past-participle]
    ['kommen', 'kommt', 'kam', 'gekommen'],
    ['fahren', 'fährt', 'fuhr', 'gefahren'],
    ['nehmen', 'nimmt', 'nahm', 'genommen'],
    ['sprechen', 'spricht', 'sprach', 'gesprochen'],
    ['sehen', 'sieht', 'sah', 'gesehen'],
    ['finden', 'findet', 'fand', 'gefunden'],
    ['helfen', 'hilft', 'half', 'geholfen'],
    ['schlafen', 'schläft', 'schlief', 'geschlafen'],
    ['trinken', 'trinkt', 'trank', 'getrunken'],
    ['schreiben', 'schreibt', 'schrieb', 'geschrieben'],
    ['bleiben', 'bleibt', 'blieb', 'geblieben'],
    ['gehen', 'geht', 'ging', 'gegangen'],
  ]
  arr.forEach(a => {
    let [inf, third, past, pp] = a
    let c = conj(inf)
    t.equal(c.presentTense.third, third, here + inf + ' → ' + third)
    t.equal(c.pastTense.first, past, here + inf + ' → ' + past)
    t.equal(c.pastParticiple, pp, here + inf + ' → ' + pp)
  })
  t.end()
})

test('subjunctive-2 with umlaut', function (t) {
  t.equal(conj('kommen').subjunctive2.first, 'käme', here + 'kommen → käme')
  t.equal(conj('gehen').subjunctive2.first, 'ginge', here + 'gehen → ginge')
  t.equal(conj('finden').subjunctive2.first, 'fände', here + 'finden → fände')
  t.equal(conj('trinken').subjunctive2.first, 'tränke', here + 'trinken → tränke')
  t.end()
})

test('present participle', function (t) {
  t.equal(conj('machen').presentParticiple, 'machend', here + 'machen → machend')
  t.equal(conj('schlafen').presentParticiple, 'schlafend', here + 'schlafen → schlafend')
  t.end()
})

test('prefixed verbs', function (t) {
  // inseparable prefixes take no ge-
  t.equal(conj('besuchen').pastParticiple, 'besucht', here + 'besuchen → besucht')
  t.equal(conj('erklären').pastParticiple, 'erklärt', here + 'erklären → erklärt')
  // -ieren verbs take no ge-
  t.equal(conj('studieren').pastParticiple, 'studiert', here + 'studieren → studiert')
  // separable prefix puts ge- inside
  t.equal(conj('einkaufen').pastParticiple, 'eingekauft', here + 'einkaufen → eingekauft')
  t.end()
})

test('imperative with stem change', function (t) {
  t.equal(conj('geben').imperative.secondSingular, 'gib', here + 'geben → gib')
  t.equal(conj('geben').imperative.secondPlural, 'gebt', here + 'geben → gebt')
  t.equal(conj('nehmen').imperative.secondSingular, 'nimm', here + 'nehmen → nimm')
  t.end()
})

test('full present paradigms', function (t) {
  let arr = [
    ['sein', ['bin', 'bist', 'ist', 'sind', 'seid', 'sind']],
    ['haben', ['habe', 'hast', 'hat', 'haben', 'habt', 'haben']],
    ['werden', ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden']],
    ['können', ['kann', 'kannst', 'kann', 'können', 'könnt', 'können']],
  ]
  arr.forEach(a => {
    let [inf, forms] = a
    let p = conj(inf).presentTense
    let got = [p.first, p.second, p.third, p.firstPlural, p.secondPlural, p.thirdPlural]
    t.deepEqual(got, forms, here + inf + ' present paradigm')
  })
  t.end()
})

test('conjugate from inflected form', function (t) {
  let c = conj('Er liest ein Buch')
  t.equal(c.infinitive, 'lesen', here + 'liest → lesen')
  t.equal(c.pastParticiple, 'gelesen', here + 'liest → gelesen')
  t.end()
})
