import { europeanNumbers } from 'compromise/shared'
import toText from './toText.js'
import { toOrdinal, bigNumbers } from '../data.js'

const { write } = europeanNumbers.methods.two.europeanNumbers

// 'Millionen' → 'millionste'
const bigOrdinal = {}
bigNumbers.forEach(a => {
  bigOrdinal[a[1]] = a[3]
  bigOrdinal[a[2]] = a[3]
})


// german format - '.' groups thousands, ',' marks the decimal
// .. unless the digits were found some other way - '1 234'
const toNumeric = function (parsed) {
  return write(parsed.num, { hasComma: parsed.hasComma, decimal: parsed.decimal, group: parsed.group })
}

// 'minus' is its own word - 'minus fünf'
// and so are the big ones - 'zwei Millionen dreihunderttausend'
const joinWords = function (words) {
  // nothing to say - don't leave a bare 'minus'
  if (words.length === 1 && words[0] === 'minus') {
    return ''
  }
  let str = ''
  words.forEach(w => {
    if (w === 'minus') {
      str += 'minus '
    } else if (bigOrdinal.hasOwnProperty(w)) {
      str += ' ' + w + ' '
    } else {
      str += w
    }
  })
  return str.trim()
}

// an ordinal is always one word - 'zweimillionste', 'zweimillionenerste'
const toOrdinalWords = function (words) {
  if (words.length === 0) {
    return words
  }
  const last = words.length - 1
  return words.map((w, i) => {
    if (bigOrdinal.hasOwnProperty(w)) {
      return i === last ? bigOrdinal[w] : w.toLowerCase()
    }
    // 'eine Million' → 'einmillionste'
    if (w === 'eine') {
      return 'ein'
    }
    return i === last ? toOrdinal[w] : w
  })
}

const formatNumber = function (parsed, fmt) {
  if (fmt === 'TextOrdinal') {
    return joinWords(toOrdinalWords(toText(parsed.num)))
  }
  if (fmt === 'TextCardinal') {
    return joinWords(toText(parsed.num))
  }
  // numeric formats
  // '55.'
  if (fmt === 'Ordinal') {
    return toNumeric(parsed) + '.'
  }
  if (fmt === 'Cardinal') {
    // german decimals use a comma - '12,5'
    return toNumeric(parsed)
  }
  return String(parsed.num || '').replace('.', ',')
}
export default formatNumber