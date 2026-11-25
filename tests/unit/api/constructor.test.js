import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-constructor] '
const txt = 'Der Hund läuft über die Straße. Die Katze schläft.'

test('constructor methods:', function (t) {
  t.ok(/^[0-9]+\.[0-9]+\.[0-9]+/.test(nlp.version), here + 'version is semver')
  t.equal(typeof nlp.world(), 'object', here + 'world')
  t.equal(typeof nlp.model().one.lexicon, 'object', here + 'model')
  t.equal(typeof nlp.methods().one.tokenize, 'object', here + 'methods')
  t.ok(nlp.hooks().includes('preTagger'), here + 'hooks')
  t.equal(nlp.verbose(false), nlp, here + 'verbose is chainable')
  t.equal(typeof nlp.extend, 'function', here + 'extend')
  t.end()
})

test('tokenize:', function (t) {
  const doc = nlp.tokenize(txt)
  t.equal(doc.length, 2, here + 'tokenize splits sentences')
  t.equal(doc.text(), txt, here + 'tokenize keeps the text')
  t.equal(doc.wordCount(), 9, here + 'tokenize splits words')
  t.equal(doc.has('#Noun'), false, here + 'tokenize does not tag')
  t.equal(doc.match('straße').found, true, here + 'tokenize can match words')
  t.equal(doc.compute('tagger').has('#Noun'), true, here + 'the tagger can run later')
  t.end()
})

test('parseMatch, buildNet, buildTrie:', function (t) {
  const json = nlp.parseMatch('der #Noun+ [schläft]')
  t.equal(json.length, 3, here + 'parseMatch')
  t.equal(json[0].word, 'der', here + 'parseMatch word')
  t.equal(json[1].tag, 'Noun', here + 'parseMatch tag')
  t.equal(nlp('der Hund schläft').match(nlp.parseMatch('der . schläft')).text(), 'der Hund schläft', here + 'match with parsed json')
  // net
  const net = nlp.buildNet([
    { match: 'der hund', tag: 'Rüde' },
    { match: 'die katze', tag: 'Mieze' },
    { match: 'das pferd', tag: 'Gaul' },
  ])
  const doc = nlp(txt)
  const res = doc.sweep(net)
  t.equal(res.view.length, 2, here + 'sweep finds both')
  t.equal(doc.match('#Rüde+').text(), 'Der Hund', here + 'sweep tags')
  t.equal(doc.match('#Mieze+').text(), 'Die Katze', here + 'sweep tags the second sentence')
  t.equal(doc.has('#Gaul'), false, here + 'sweep skips a miss')
  // trie
  const trie = nlp.buildTrie(['der hund', 'straße', 'pferd'])
  t.deepEqual(nlp(txt).lookup(trie).out('array'), ['Der Hund', 'Straße.'], here + 'lookup with a trie')
  t.deepEqual(nlp(txt).lookup(['die katze', 'über']).out('array'), ['über', 'Die Katze'], here + 'lookup with an array')
  t.end()
})

test('plugins:', function (t) {
  nlp.plugin({
    api: function (View) {
      View.prototype.fabeltiere = function () {
        return this.match('#Fabeltier+')
      }
    },
    tags: { Fabeltier: { is: 'Noun' } },
    words: { wolpertinger: 'Fabeltier' },
    compute: {
      wortlänge: function (view) {
        view.docs.forEach(terms => {
          terms.forEach(term => {
            term.len = term.normal.length
          })
        })
      },
    },
  })
  const doc = nlp('der Wolpertinger schläft')
  t.equal(doc.fabeltiere().text(), 'Wolpertinger', here + 'plugin api + words')
  t.equal(doc.match('wolpertinger').has('#Noun'), true, here + 'plugin tag is a Noun')
  t.equal(doc.compute('wortlänge').docs[0][1].len, 12, here + 'plugin compute')
  nlp.addWords({ rasselbock: 'Fabeltier', 'weiße gams': 'Fabeltier' })
  t.equal(nlp('der Rasselbock kommt').fabeltiere().text(), 'Rasselbock', here + 'addWords')
  t.equal(nlp('die weiße Gams kommt').fabeltiere().text(), 'weiße Gams', here + 'addWords multi-word')
  nlp.addTags({ Drache: { is: 'Fabeltier' } })
  nlp.addWords({ tatzelwurm: 'Drache' })
  t.equal(nlp('der Tatzelwurm kommt').fabeltiere().text(), 'Tatzelwurm', here + 'addTags')
  t.equal(nlp('der Tatzelwurm kommt').match('tatzelwurm').has('#Noun'), true, here + 'addTags inherits')
  t.equal(nlp('der Elwetritsch kommt', { elwetritsch: 'Fabeltier' }).fabeltiere().text(), 'Elwetritsch', here + 'lexicon as 2nd param')
  // adding words does not lose the numbers
  t.deepEqual(nlp('null Wolpertinger und drei Hunde').numbers().get(), [0, 3], here + 'numbers after addWords')
  t.end()
})

test('typeahead:', function (t) {
  nlp.typeahead(['Wolpertinger', 'Tatzelwurm', 'Tatzelwürmer'])
  // only the last word is filled-in
  const doc = nlp('der wolpert')
  t.equal(doc.match('wolpertinger').found, true, here + 'a prefix matches the full word')
  t.equal(doc.text(), 'der wolpert', here + 'text is unchanged')
  t.equal(doc.autoFill().text(), 'der wolpertinger', here + 'autoFill')
  t.equal(nlp('der tatzel').match('tatzelwurm').found, false, here + 'an ambiguous prefix')
  t.equal(nlp('der wolpert schläft').match('wolpertinger').found, false, here + 'not in the middle')
  t.end()
})
