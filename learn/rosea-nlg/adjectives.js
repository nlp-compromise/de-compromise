// adjective: the adjective to agree,
//   germanCase: NOMINATIVE ACCUSATIVE DATIVE GENITIVE
// gender gender of the word; M F or N
// number: number of the word; S or P
// det: determiner; DEFINITE INDEFINITE or DEMONSTRATIVE

import fs from 'fs'
let arr = fs.readFileSync('/Users/spencer/mountain/de-compromise/learn/rosea-nlg/dictionary.dump').toString().split('\n')

const prop1 = function (a) {
  if (a[2] === 'PLU') {
    return 'pl'
  }
  let prop = a[3]
  let map = {
    MAS: 'm',
    FEM: 'f',
    NEU: 'n',
  }
  return map[prop] || null
}
const prop2 = function (a) {
  let prop = a[1]
  let map = {
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

let byInf = {}
arr.forEach(str => {
  let [w, inf, meta] = str.split(/\t/)
  byInf[inf] = byInf[inf] || { m: [], f: [], n: [], pl: [] }
  let arr = (meta || '').split(':')
  // if (inf === 'skandalös') {
  //   console.log(str)
  //   console.log(arr)
  // }
  if (arr[4] === 'SUP' || arr[4] === 'KOM') {
    return
  }
  if (arr[0] !== 'ADJ') {
    return
  }
  let one = prop1(arr)
  let two = prop2(arr)
  if (one !== null && two !== null) {
    byInf[inf][one][two] = w
  } else {
    // console.log(meta)
  }

  // byInf[inf][w] = parts
})
// console.log(byInf['schmecken'])

let model = {}
Object.keys(byInf).forEach(inf => {
  let o = byInf[inf]
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