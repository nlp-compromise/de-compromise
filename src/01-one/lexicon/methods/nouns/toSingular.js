import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

let pluralRev = model.nouns && model.nouns.plural ? reverse(model.nouns.plural) : null

// fallback rules, when no trained model is available
const leave = [
  'tion',
  'sion',
  'tent',
  'rant',
  'hine',
  'ppen',
  'ene',
  'nne',
  'zen',
  'in',
  'an',
  'is',
]

const suffixes = [
  'ns',
  'ne',
  'n',
  's',
]

const toSingular = function (str) {
  if (pluralRev) {
    return convert(str, pluralRev)
  }
  for (let i = 0; i < leave.length; i += 1) {
    if (str.endsWith(leave[i])) {
      return str
    }
  }
  for (let i = 0; i < suffixes.length; i += 1) {
    let suff = suffixes[i]
    if (str.endsWith(suff)) {
      return str.substring(0, str.length - suff.length)
    }
  }
  return str
}
export default toSingular
