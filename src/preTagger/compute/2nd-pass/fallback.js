const hasNoVerb = function (terms) {
  return terms.find(t => t.tags.has('Verb')) === null
}

const fallback = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.size === 0) {
    let tag = 'Adjective'
    if (hasNoVerb(terms)) {
      tag = 'Verb'
    }
    setTag([term], tag, world, false, '2-fallback')
  }
}
export default fallback