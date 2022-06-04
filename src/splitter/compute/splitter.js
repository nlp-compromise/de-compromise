// links between words
// https://digital.lib.washington.edu/researchworks/bitstream/handle/1773/44691/Callow_washington_0250O_20779.pdf
// 'er|en|es|s|e|n
const hasLink = /^(e[rns]|s|n)/

const tryLeft = function (str, splits) {
  let char = str.substr(0, 1)
  let list = splits[char] || []
  return list.find(s => str.startsWith(s))
}

const fromLeft = function (str, splits) {
  let found = tryLeft(str, splits)
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
    let res = tryLeft(less, splits)
    if (res) {
      return {
        prefix: link[0] + res,
        words: [link[0], res]
      }
    }
  }
  return {}
}


const findSplits = function (term, splits) {
  let str = term.normal || ''
  let words = []
  while (str.length > 0) {
    let found = fromLeft(str, splits)
    if (found.prefix) {
      words = words.concat(found.words)
      str = str.substr(found.prefix.length)
      // console.log(found)
      // console.log('->', str)
      continue
    } else {
      // nothing found
      words.push(str)
      break
    }
  }
  return words
}

const splitter = function (view) {
  let { nouns, verbs, values, adjectives } = view.model.one.splitter
  view.docs.forEach(terms => {
    terms.forEach(term => {
      // split numbers
      if (term.tags.has('Value')) {
        term.splits = findSplits(term, values)
      }
      // split nouns
      if (term.tags.has('Noun')) {
        term.splits = findSplits(term, nouns)
      }
      // split adjectives
      // if (term.tags.has('Adjective')) {
      //   term.splits = findSplits(term, adjectives)
      // }
    })
  })
}
export default { splitter }