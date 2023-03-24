import fs from 'fs'
let arr = fs.readFileSync('/Users/spencer/mountain/de-compromise/learn/rosea-nlg/dictionary.dump').toString().split('\n')

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
  let arr = (meta || '').split(':')
  if (arr[0] !== 'SUB') {
    return
  }
  inf = inf.toLowerCase()
  byInf[inf] = byInf[inf] || { p: [], s: [] }
  let prop = 's'
  if (arr[2] === 'PLU') {
    prop = 'p'
  }
  let n = prop2(arr)
  byInf[inf][prop][n] = w.toLowerCase()
})
// console.log(byInf)

let model = {}
Object.keys(byInf).forEach(inf => {
  let o = byInf[inf]
  if (o.s.length === 4 && o.p.length === 4) {
    model[inf] = byInf[inf]
  }
})
// console.log(model)
// console.log(Object.keys(model))
fs.writeFileSync('./model.js', 'export default ' + JSON.stringify(model, null, 2))
// // console.log(all.length)
// console.log(model)
// console.log(Object.keys(model).length)