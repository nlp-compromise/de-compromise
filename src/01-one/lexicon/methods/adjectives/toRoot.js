const abel = /able[rns]$/
const auer = /aure[rns]$/
const usst = /sste[rns]$/
const wisse = /wisse[rns]$/
const weise = /weise[rns]$/

const suffixes = [
  'ester',
  'esten',
  'estes',
  'este',
  'ster',
  'sten',
  'stes',
  'ste',
  'er',
  'en',
  'es',
  'e',
]

const toRoot = function (str) {
  if (abel.test(str)) {
    return str.replace(abel, 'abel')
  }
  if (auer.test(str)) {
    return str.replace(auer, 'auer')
  }
  if (usst.test(str)) {
    return str.replace(usst, 'usst')
  }
  if (wisse.test(str)) {
    return str.replace(wisse, 'wiß')
  }
  if (weise.test(str)) {
    return str.replace(weise, 'weise')
  }
  for (let i = 0; i < suffixes.length; i += 1) {
    let suff = suffixes[i]
    if (str.endsWith(suff)) {
      return str.substring(0, str.length - suff.length)
    }
  }
  return str
}
export default toRoot
// console.log(toRoot('saurerer'))