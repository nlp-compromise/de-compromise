const isTitleCase = function (str) {
  return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
}

// add a noun to any non-0 index titlecased word, with no existing tag
const titleCaseNoun = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  // don't over-write any tags
  // if (term.tags.size > 0) {
  //   return
  // }
  // skip first-word, for now
  if (i === 0) {
    return
  }
  if (isTitleCase(term.text)) {
    setTag([term], 'Noun', world, false, `1-titlecase`)
  }
}
export default titleCaseNoun