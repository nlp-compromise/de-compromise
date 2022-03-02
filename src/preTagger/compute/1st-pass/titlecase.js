const isTitleCase = function (str) {
  return /^[A-Z][a-z'\u00C0-\u00FF]/.test(str) || /^[A-Z]$/.test(str)
}

// add a noun to any non-0 index titlecased word, with no existing tag
const titleCaseNoun = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.size > 0) {
    return
  }
  if (isTitleCase(term.text)) {
    setTag([term], 'Noun', world)
    setTag([term], 'Noun', world, false, `1-titlecase`)
  }

}
export default titleCaseNoun