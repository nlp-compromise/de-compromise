const isTitleCase = function (str) {
  return /^[A-ZÄÖÜ][a-zäöü'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
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
      return setTag([term], 'Noun', world, false, `1-titlecase`)// Noun still the safest bet?
    }

    let tag = 'Adjective'
    if (hasNoVerb(terms)) {
      tag = 'Verb'
    }
    setTag([term], tag, world, false, '2-fallback')
  }
}
export default fallback