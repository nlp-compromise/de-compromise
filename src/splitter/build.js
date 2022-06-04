const longestFirst = function (obj) {
  Object.keys(obj).forEach(k => {
    obj[k] = obj[k].sort((a, b) => {
      if (a.length > b.length) {
        return -1
      } else if (a.length < b.length) {
        return 1
      }
      return 0
    })
  })
}

const buildIndex = function (world) {
  let words = Object.entries(world.model.one.lexicon)
  let { nouns, verbs, values, adjectives } = world.model.one.splitter
  words.forEach(a => {
    let [w, tag] = a
    if (tag === 'TextOrdinal' || tag === 'TextCardinal') {
      let char = w.substring(0, 1)
      values[char] = values[char] || []
      values[char].push(w)
    }
    if (tag === 'Noun' || tag === 'FemaleNoun' || tag === 'MaleNoun' || tag === 'NeuterNoun') {
      let char = w.substring(0, 1)
      nouns[char] = nouns[char] || []
      nouns[char].push(w)
    }
    // if (tag === 'Adjective') {
    //   let char = w.substring(0, 1)
    //   adjectives[char] = adjectives[char] || []
    //   adjectives[char].push(w)
    // }
    // if (tag === 'Verb') {
    //   let char = w.substring(0, 1)
    //   verbs[char] = verbs[char] || []
    //   verbs[char].push(w)
    // }
  })
  // lastly, sort words by length
  longestFirst(nouns)
  longestFirst(values)


}
export default buildIndex