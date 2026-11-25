import test from 'tape'
import nlp from '../../_lib.js'
const here = '[imperative] '

test('toImperative:', function (t) {
  const verb = nlp.world().methods.two.transform.verb
  const arr = [
    ['geben', 'gib', 'gebt'],
    ['nehmen', 'nimm', 'nehmt'],
    ['lesen', 'lies', 'lest'],
    ['essen', 'iss', 'esst'],
    ['sehen', 'sieh', 'seht'],
    ['helfen', 'hilf', 'helft'],
    ['sprechen', 'sprich', 'sprecht'],
    ['kommen', 'komm', 'kommt'],
    ['machen', 'mache', 'macht'],
    ['arbeiten', 'arbeite', 'arbeitet'],
    ['öffnen', 'öffne', 'öffnet'],
    ['sammeln', 'sammle', 'sammelt'],
    ['sein', 'sei', 'seid'],
    ['haben', 'hab', 'habt'],
    ['werden', 'werde', 'werdet'],
    ['abfinden', 'abfinde', 'abfindet'],
    ['anwenden', 'anwende', 'anwendet'],
  ]
  arr.forEach(function (a) {
    const [inf, sing, plur] = a
    const res = verb.toImperative(inf)
    t.equal(res.secondSingular, sing, here + `${inf} singular`)
    t.equal(res.secondPlural, plur, here + `${inf} plural`)
  })
  t.end()
})

test('imperative tags + roots:', function (t) {
  const arr = [
    ['Geh nach Hause!', 'gehen'],
    ['Komm her!', 'kommen'],
    ['Gib mir das Buch.', 'geben'],
    ['Iss dein Gemüse!', 'essen'],
    ['Lies das Buch!', 'lesen'],
    ['Nimm das!', 'nehmen'],
    ['Hilf mir!', 'helfen'],
    ['Sei still!', 'sein'],
    ['Vergiss es.', 'vergessen'],
    ['Warte auf mich!', 'warten'],
    ['Lass mich gehen!', 'lassen'],
    ['Sag mir, was du denkst.', 'sagen'],
    ['Trink das Wasser.', 'trinken'],
    // these are nouns, too
    ['Halt den Mund!', 'halten'],
    ['Schlaf gut!', 'schlafen'],
    ['Lauf schnell!', 'laufen'],
    // with its prefix at the end
    ['Ruf mich an!', 'anrufen'],
    ['Mach die Tür zu!', 'zumachen'],
    ['Hör zu!', 'zuhören'],
    // plural
    ['Seid ruhig!', 'sein'],
    ['Kommt herein!', 'kommen'],
    // polite
    ['Gehen Sie nach Hause!', 'gehen'],
    ['Kommen Sie bitte herein.', 'kommen'],
  ]
  arr.forEach(function (a) {
    const [str, root] = a
    const doc = nlp(str).compute('root')
    t.equal(doc.has('^#Imperative'), true, here + `'${str}' is imperative`)
    t.equal(doc.has(`^{${root}}`), true, here + `'${str}' root is ${root}`)
  })
  t.equal(nlp('Bitte warte hier.').has('bitte #Imperative'), true, here + 'after bitte')
  // .. and these are something else
  const not = [
    'Wein ist gut.',
    'Ruf und Ehre sind wichtig.',
    'Gehe ich nach Hause?',
    'Kommt er heute?',
    'Gehen Sie nach Hause?',
    'Kommt Zeit, kommt Rat.',
    'Morgen gehe ich.',
    'Der Hund schläft.',
    'Ich gehe nach Hause.',
    'Macht nichts.',
  ]
  not.forEach(function (str) {
    t.equal(nlp(str).has('#Imperative'), false, here + `'${str}' has no imperative`)
  })
  t.end()
})

test('imperatives keep their tense:', function (t) {
  const arr = ['Geh nach Hause!', 'Gib mir das Buch.', 'Ruf mich an!', 'Lass mich gehen!', 'Kommt herein!', 'Gehen Sie nach Hause!', 'Bitte warte hier.']
  ;['toPastTense', 'toPresentTense', 'toFutureTense'].forEach((fn) => {
    arr.forEach((str) => {
      const doc = nlp(str)
      doc.verbs()[fn]()
      t.equal(doc.text(), str, here + `${fn}: '${str}'`)
    })
  })
  // the clause after it still has one
  const doc = nlp('Sag mir, was du denkst.')
  doc.verbs().toPastTense()
  t.equal(doc.text(), 'Sag mir, was du dachtest.', here + 'clause after a command')
  t.end()
})
