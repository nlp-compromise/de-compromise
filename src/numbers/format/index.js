import toText from './toText.js'
import { toOrdinal } from '../data.js'


const formatNumber = function (parsed, fmt) {
  if (fmt === 'TextOrdinal') {
    let words = toText(parsed.num)
    let last = words[words.length - 1]
    words[words.length - 1] = toOrdinal[last]
    return words.join('')
  }
  if (fmt === 'TextCardinal') {
    return toText(parsed.num).join('')
  }
  // numeric formats
  // '55e'
  if (fmt === 'Ordinal') {
    let str = String(parsed.num)
    return str += '.'
  }
  if (fmt === 'Cardinal') {
    return String(parsed.num)
  }
  return String(parsed.num || '')
}
export default formatNumber