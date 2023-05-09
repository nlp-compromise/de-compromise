// import models from './new.js'

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

// console.log(inflect('abdruckende').one === 'abdruckenden')