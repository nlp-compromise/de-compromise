import { prefixes, suffixes } from './rules.js'

const doSuffix = function (str) {
  for (let i = 0; i < suffixes.length; i += 1) {
    let [inf, prt] = suffixes[i]
    if (str.endsWith(prt)) {
      return str.substring(0, str.length - prt.length) + inf
    }
  }
  str = str.replace(/t$/, 'en')
  return str
}

const doPrefix = function (str) {
  // remove 'ge-' off the front
  for (let i = 0; i < prefixes.length; i += 1) {
    if (str.startsWith(prefixes[i] + 'ge')) {
      return prefixes[i] + str.substring(prefixes[i].length + 2)
    }
  }
  str = str.replace(/^ge/, '')
  return str
}

const fromPastParticiple = function (str) {
  // always weak - ieren
  if (str.endsWith('iert')) {
    str = str.replace(/iert$/, 'ieren')
    return str //no 'ge-'
  }
  str = doSuffix(str)
  str = doPrefix(str)
  return str
}
export default fromPastParticiple

// console.log(fromPastParticiple('ereifert'))