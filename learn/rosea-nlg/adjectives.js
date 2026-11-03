// adjective: the adjective to agree,
//   germanCase: NOMINATIVE ACCUSATIVE DATIVE GENITIVE
// gender gender of the word; M F or N
// number: number of the word; S or P
// det: determiner; DEFINITE INDEFINITE or DEMONSTRATIVE

import fs from 'node:fs'
const arr = fs.readFileSync('/Users/spencer/mountain/de-compromise/learn/rosea-nlg/dictionary.dump').toString().split('\n')

const prop1 = function (a) {
  if (a[2] === 'PLU') {
    return 'pl'
  }
  const prop = a[3]
  const map = {
    MAS: 'm',
    FEM: 'f',
    NEU: 'n',
  }
  return map[prop] || null
}
const prop2 = function (a) {
  const prop = a[1]
  const map = {
    NOM: 0,
    GEN: 1,
    DAT: 2,
    AKK: 3,
  }
  if (map[prop] !== undefined) {
    return map[prop]
  }
  return null
}

const byInf = {}
arr.forEach(str => {
  const [w, inf, meta] = str.split(/\t/)
  byInf[inf] = byInf[inf] || { m: [], f: [], n: [], pl: [] }
  const arr = (meta || '').split(':')
  // if (inf === 'skandalös') {
  //   console.log(str)
  //   console.log(arr)
  // }
  if (arr[4] !== 'KOM') {//&& arr[4] !== 'KOM'
    return
  }
  if (arr[0] !== 'ADJ') {
    return
  }
  const one = prop1(arr)
  const two = prop2(arr)
  if (one !== null && two !== null) {
    byInf[inf][one][two] = w
  } else {
    // console.log(meta)
  }

  // byInf[inf][w] = parts
})
// console.log(byInf['schmecken'])

const model = {}
Object.keys(byInf).forEach(inf => {
  const o = byInf[inf]
  if (inf.toLowerCase() !== inf) {
    return
  }
  if (o.m.length === 4 && o.f.length === 4) {
    model[inf] = byInf[inf]
  }
})
fs.writeFileSync('./model.js', JSON.stringify(model, null, 2))
// console.log(all.length)
console.log(model['skandalös'])
// console.log(Object.keys(model).length)