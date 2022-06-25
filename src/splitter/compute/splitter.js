// links between words
// https://digital.lib.washington.edu/researchworks/bitstream/handle/1773/44691/Callow_washington_0250O_20779.pdf
// 'er|en|es|s|e|n
const hasLink = /^(e[rns]|s|n)/
import { findMatch } from '../trie.js'

const findSplits = function (str, root) {
  let found = []
  while (str.length > 0) {
    let match = findMatch(str, root)
    if (!match) {//we done
      // allow a connector - [foo, en, bar]
      if (found.length > 0 && hasLink.test(str)) {
        let tmp = str.replace(hasLink, '')
        match = findMatch(tmp, root)
        if (match) {
          let link = str.match(hasLink)[0]
          found.push(link)
          str = str.substr(link.length)
        }
      }
    }
    if (!match) {
      found.push(str)
      break
    }
    // found a prefix
    found.push(match)
    str = str.substr(match.length)
  }
  return found
}

const splitter = function (view) {
  let { nouns, verbs, values, adjectives } = view.model.one.splitter
  view.docs.forEach(terms => {
    terms.forEach(term => {
      // split numbers
      if (term.tags.has('Value')) {
        term.splits = findSplits(term.normal, values)
      }
      // split nouns
      if (term.tags.has('Noun')) {
        term.splits = findSplits(term.normal, nouns)
      }
      // split adjectives
      // if (term.tags.has('Adjective')) {
      //   term.byChar = findbyChar(term, adjectives)
      // }
    })
  })
}
export default { splitter }