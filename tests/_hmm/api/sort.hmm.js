import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-sort-hmm] '

// umlauts sort after 'z' - (this is compromise's own .sort(), not german-aware)
test('alphabetical sort with umlauts:', function (t) {
  const doc = nlp('zebra. apfel. Öl. banane. ärger.')
  t.deepEqual(doc.sort('alpha').out('array'), ['apfel.', 'ärger.', 'banane.', 'Öl.', 'zebra.'], here + 'sort alpha')
  t.end()
})
