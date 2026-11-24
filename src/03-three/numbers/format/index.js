import toText from './toText.js'
import { toOrdinal } from '../data.js'


// german format - '.' groups thousands, ',' marks the decimal
const toNumeric = function (num, grouped) {
  const str = String(num)
  // leave '1e+21' alone
  if (!/^-?[0-9]+(\.[0-9]+)?$/.test(str)) {
    return str
  }
  let [int, decimal] = str.split('.')
  // re-group thousands - '1.234.567'
  if (grouped) {
    int = int.replace(/\B(?=([0-9]{3})+$)/g, '.')
  }
  return decimal ? int + ',' + decimal : int
}

// 'minus' is its own word - 'minus fünf'
const joinWords = function (words) {
  if (words[0] === 'minus') {
    // nothing to say - don't leave a bare 'minus'
    if (words.length === 1) {
      return ''
    }
    return 'minus ' + words.slice(1).join('')
  }
  return words.join('')
}

const formatNumber = function (parsed, fmt) {
  if (fmt === 'TextOrdinal') {
    const words = toText(parsed.num)
    const last = words[words.length - 1]
    words[words.length - 1] = toOrdinal[last]
    return joinWords(words)
  }
  if (fmt === 'TextCardinal') {
    return joinWords(toText(parsed.num))
  }
  // numeric formats
  // '55.'
  if (fmt === 'Ordinal') {
    return toNumeric(parsed.num, parsed.hasComma) + '.'
  }
  if (fmt === 'Cardinal') {
    // german decimals use a comma - '12,5'
    return toNumeric(parsed.num, parsed.hasComma)
  }
  return String(parsed.num || '').replace('.', ',')
}
export default formatNumber