import { convert } from 'suffix-thumb'
import model from '../models.js'

// fallback rules, when no trained model is available
let rules = [
  ['ein', ''],
  ['cht', 'e'],
  ['ll', 'e'],
  ['is', 'se'],
  ['kt', 'e'],
  ['tt', 'e'],
  ['rt', 'e'],
  ['ur', 'en'],
  ['ck', 'e'],
  ['at', 'e'],
  ['ft', 'en'],
  ['nd', 'e'],
  ['ei', 'en'],
  ['or', 'en'],
  ['ch', 'e'],
  ['it', 'en'],
  ['st', 'en'],
  ['nt', 'en'],
  ['el', ''],
  ['on', 'en'],
  ['en', ''],
  ['ng', 'en'],
  ['in', 'nen'],
  ['er', '']
]

const firstForm = function (str) {
  if (model.nouns && model.nouns.plural) {
    return convert(str, model.nouns.plural)
  }
  for (let i = 0; i < rules.length; i += 1) {
    let [from, to] = rules[i]
    if (str.endsWith(from)) {
      return str + to
    }
  }
  return str + 'n'
}
const toPlural = function (str) {
  return {
    one: firstForm(str)
  }
}
export default toPlural
