import { prefixes, suffixes } from './rules.js'
const inseperable = /^(be|emp|ent|er|ge|miss|ver|zer)/

const doPrefix = function (str) {
  if (/^auss/.test(str)) {
    str = str.replace(/^auss/, 'ausges')
    return str
  }
  // put a 'ge' somewhere
  for (let i = 0; i < prefixes.length; i += 1) {
    if (str.startsWith(prefixes[i])) {
      return prefixes[i] + 'ge' + str.substring(prefixes[i].length)
    }
  }
  if (inseperable.test(str)) {
    // str = str.replace(/en$/, 't')
    return str
  }
  // otherwse, add 'ge-'
  if (!str.match(/^(über|unt|v|au|miß)/)) {
    str = 'ge' + str
  }
  return str
}

const doSuffix = function (str) {
  for (let i = 0; i < suffixes.length; i += 1) {
    let [from, to] = suffixes[i]
    if (str.endsWith(from)) {
      return str.substring(0, str.length - from.length) + to
    }
  }
  str = str.replace(/en$/, 't')
  return str
}

// this one is strange, and doesn't compress well
const toPastParticiple = function (str) {
  // always weak
  if (str.endsWith('ieren')) {
    str = str.replace(/en$/, 't')
    return str //no 'ge-'
  }
  str = doSuffix(str)
  str = doPrefix(str)
  return str
}
export default toPastParticiple

// console.log('\n\n', toPastParticiple("sinnen"))
