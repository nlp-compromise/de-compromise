import test from 'tape'
import nlp from './_lib.js'
const here = '[verbs] '

test('{werden} #Verb', function (t) {
  const doc = nlp('ich würde schmecken')
  const obj = doc.verbs().conjugate()[0] || {}
  t.equal(obj.imperative.secondSingular, 'schmecke', here + 'imp-singular')
  t.equal(obj.imperative.secondPlural, 'schmeckt', here + 'imp-plural')
  t.end()
})

test('{haben} #Verb', function (t) {
  const doc = nlp('ich habe geschmeckt')
  const obj = doc.verbs().conjugate()[0] || {}
  t.equal(obj.pastParticiple, 'geschmeckt', here + 'past-plural')
  t.end()
})

test('{win} #Verb', function (t) {
  const doc = nlp('Du hättest gewinnen')//you would have won
  const obj = doc.verbs().conjugate()[0] || {}
  t.equal(obj.pastTense.secondPlural, 'gewannt', here + 'second-plural')
  t.end()
})