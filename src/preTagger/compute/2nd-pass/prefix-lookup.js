
//sweep-through all prefixes
const prefixLoop = function (str = '', prefixes = []) {
  const len = str.length
  let max = 10
  if (max > len - 3) {
    max = len - 3
  }
  for (let i = max; i > 2; i -= 1) {
    let prefix = str.substring(0, i)
    if (prefixes[prefix.length].hasOwnProperty(prefix) === true) {
      let tag = prefixes[prefix.length][prefix]
      return tag
    }
  }
  return null
}

// give 'overwork' the same tag as 'work'
const checkPrefix = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.size === 0) {
    let tag = prefixLoop(term.normal, world.model.two.prefixPatterns)
    if (tag !== null) {
      setTag([term], tag, world, false, '2-prefix')
      term.confidence = 0.5
      return true
    }
  }
  return null
}
export default checkPrefix
