const isTitleCase = function (str) {
  return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
}

const hasNoVerb = function (terms) {
  return !terms.find(t => t.tags.has('#Verb'))
}

const fallback = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.size === 0) {

    // is it first-word titlecase?
    if (i === 0 && isTitleCase(term.text)) {
      setTag([term], 'Noun', world, false, `1-titlecase`)// Noun still the safest bet?
      return
    }

    let tag = 'Adjective'
    if (terms.length > 10 && hasNoVerb(terms)) {
      tag = 'Verb'
    }
    setTag([term], tag, world, false, '2-fallback')
  }
}
export default fallback