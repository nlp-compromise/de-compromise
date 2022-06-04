// links between words
// https://digital.lib.washington.edu/researchworks/bitstream/handle/1773/44691/Callow_washington_0250O_20779.pdf
// 'er|en|es|s|e|n
const hasLink = /^(e[rns]|s|n)/

const tryLeft = function (str, byChar) {
  let char = str.substr(0, 1)
  let list = byChar[char] || []
  return list.find(s => str.startsWith(s))
}

const fromLeft = function (str, byChar) {
  let found = tryLeft(str, byChar)
  if (found) {
    return {
      prefix: str.substr(0, found.length),
      words: [found]
    }
  }
  // look for 'foo|en|bar'
  let link = str.match(hasLink)
  if (link !== null) {
    let less = str.replace(hasLink, '')
    let res = tryLeft(less, byChar)
    if (res) {
      return {
        prefix: link[0] + res,
        words: [link[0], res]
      }
    }
  }
  return {}
}

// look for known suffixes
const fromRight = function (str, byChar) {
  let lists = Object.values(byChar)
  for (let i = 0; i < lists.length; i += 1) {
    let found = lists[i].find(s => str.endsWith(s))
    if (found) {
      return found
    }
  }
  return null
}

const findbyChar = function (term, byChar) {
  let str = term.normal || ''
  let words = []
  while (str.length > 0) {
    let found = fromLeft(str, byChar)
    if (found.prefix) {
      words = words.concat(found.words)
      str = str.substr(found.prefix.length)
      // console.log(found)
      // console.log('->', str)
      continue
    } else {
      // nothing found
      break
    }
  }
  // try from the right
  if (str.length > 5) {
    let found = fromRight(str, byChar)
    if (found) {
      str = str.substr(0, str.length - found.length)
      words = words.concat([str, found])
      str = ''
    }
  }
  if (str) {
    words.push(str)
  }
  return words
}

const splitter = function (view) {
  let { nouns, verbs, values, adjectives } = view.model.one.splitter
  view.docs.forEach(terms => {
    terms.forEach(term => {
      // split numbers
      if (term.tags.has('Value')) {
        term.splits = findbyChar(term, values)
      }
      // split nouns
      if (term.tags.has('Noun')) {
        term.splits = findbyChar(term, nouns)
      }
      // split adjectives
      // if (term.tags.has('Adjective')) {
      //   term.byChar = findbyChar(term, adjectives)
      // }
    })
  })
}
export default { splitter }