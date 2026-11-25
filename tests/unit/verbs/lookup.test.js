import test from 'tape'
import nlp from '../../_lib.js'
const here = '[verb-lookup] '

const world = nlp.world()
const verb = world.methods.two.transform.verb
const lexicon = world.model.one.lexicon
const isVerb = (inf) => lexicon.hasOwnProperty(inf) && [].concat(lexicon[inf]).includes('Infinitive')

test('lookup - find the infinitive of any conjugation:', function (t) {
  const arr = [
    ['gehe', 'gehen', 'present', 'first'],
    ['ging', 'gehen', 'past', 'first'],
    ['sprichst', 'sprechen', 'present', 'second'],
    ['sagte', 'sagen', 'past', 'third'],
    ['kamen', 'kommen', 'past', 'thirdPlural'],
    ['weiß', 'wissen', 'present', 'first'],
    ['aß', 'essen', 'past', 'third'],
    ['fährt', 'fahren', 'present', 'third'],
    ['hatten', 'haben', 'past', 'firstPlural'],
    ['wäre', 'sein', 'subjunctive2', 'first'],
  ]
  arr.forEach(function (a) {
    const [str, root, tense, person] = a
    const res = verb.lookup(str, { isVerb })
    t.equal(res && res.root, root, here + `'${str}' is ${root}`)
    const hit = res ? res.hits.find((o) => o.tense === tense && o.person === person) : null
    t.ok(hit, here + `'${str}' is ${tense} ${person}`)
  })
  t.end()
})

test('lookup - options:', function (t) {
  // a word that is no verb
  t.equal(verb.lookup('tisch', { isVerb, known: true }), null, here + 'not a known verb')
  // only some tenses
  const [str, root] = ['sah', 'sehen']
  t.equal(verb.lookup(str, { isVerb, known: true, tenses: ['present'] }), null, here + 'not in this tense')
  t.equal(verb.lookup(str, { isVerb, tenses: ['past'] }).root, root, here + 'in this tense')
  t.end()
})

test('table + findHits:', function (t) {
  const [inf, tense, person, str] = ['gehen', 'past', 'first', 'ging']
  t.equal(verb.table(inf)[tense][person], str, here + 'table')
  t.deepEqual(Object.keys(verb.table(inf, [tense])), [tense], here + 'table of one tense')
  t.equal(verb.findHits(str, inf).some((o) => o.tense === tense && o.person === person), true, here + 'findHits')
  t.deepEqual(verb.findHits('xyz', inf), [], here + 'no hits')
  // every candidate conjugates back
  verb.candidates(str).forEach((o) => {
    const { tense: tns, person: p } = o.hits[0]
    t.equal(verb.table(o.root)[tns][p], str, here + `candidate ${o.root}`)
  })
  t.end()
})
