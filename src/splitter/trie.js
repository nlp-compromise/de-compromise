const addWord = function (str, root) {
  let chars = str.split('')
  let node = root
  chars.forEach(c => {
    node.more[c] = node.more[c] || { more: {} }
    node = node.more[c]
  })
  node.end = true
}

const makeTrie = function (arr) {
  let root = {
    more: {}
  }
  arr.forEach(str => addWord(str, root))
  return root
}

const findMatch = function (str, root) {
  let match = null
  let chars = str.split('')
  let node = root
  for (let i = 0; i < chars.length; i += 1) {
    if (!node.more[chars[i]]) {
      // dead end
      return match
    }
    node = node.more[chars[i]]
    if (node.end === true) {
      match = chars.slice(0, i + 1).join('')
    }
  }
  return match
}

export { makeTrie, findMatch, addWord }

// let trie = makeTrie(['car', 'cab', 'stab', 'carbon'])
// console.dir(trie, { depth: 15 })
// console.log(findMatch('carbon', trie))