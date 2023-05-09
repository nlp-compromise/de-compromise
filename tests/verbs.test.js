import test from 'tape'
import nlp from './_lib.js'
let here = '[verbs] '

test('{werden} #Verb', function (t) {
  let doc = nlp('ich würde schmecken')
  let obj = doc.verbs().conjugate()[0] || {}
  t.equal(obj.imperative.secondSingular, 'schmecke', here + 'imp-singular')
  t.equal(obj.imperative.secondPlural, 'schmeckt', here + 'imp-plural')
  t.end()
})

test('{haben} #Verb', function (t) {
  let doc = nlp('ich habe geschmeckt')
  let obj = doc.verbs().conjugate()[0] || {}
  t.equal(obj.pastParticiple, 'geschmeckt', here + 'past-plural')
  t.end()
})

test('{win} #Verb', function (t) {
  let doc = nlp('Du hättest gewinnen')//you would have won
  let obj = doc.verbs().conjugate()[0] || {}
  t.equal(obj.pastTense.secondPlural, 'gewannt', here + 'second-plural')
  t.end()
})