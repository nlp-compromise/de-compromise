import test from 'tape'
import nlp from '../_lib.js'
let here = '[de-splitter] '
import compounds from './data.js'
nlp.verbose(false)

test('splitter:', function (t) {
  // import compounds from './data.js'
  compounds.forEach(a => {
    let [str, parts] = a
    let doc = nlp(str).tag('#Noun').compute('splitter')
    let splits = doc.docs[0][0].splits || []
    // t.ok(splits.length > 1, str)
    // t.equal(splits.length, parts.length, str)
    splits.forEach((splt, i) => {
      splt = splt.toLowerCase()
      let want = parts[i] || ''
      t.equal(splt, want.toLowerCase(), here + ` ${str}`)
    })
  })
  t.end()
})

