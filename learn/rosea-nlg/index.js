import fs from 'fs'
let arr = fs.readFileSync('/Users/spencer/mountain/de-compromise/learn/rosea-nlg/dictionary.dump').toString().split('\n')
let byInf = {}
arr.forEach(str => {
  let [w, inf, parts] = str.split(/\t/)
  byInf[inf] = byInf[inf] || {}
  byInf[inf][parts] = w
})
// console.log(byInf['schmecken'])

let all = {}
Object.keys(byInf).forEach(inf => {
  let o = byInf[inf]
  let a = [o['VER:1:SIN:PRÄ:SFT'], o['VER:2:SIN:PRÄ:SFT'], o['VER:3:SIN:PRÄ:SFT'], o['VER:1:PLU:PRÄ:SFT'], o['VER:2:PLU:PRÄ:SFT'], o['VER:3:PLU:PRÄ:SFT']]
  a=a.filter(s=>s)
  if(a.length===6){
    all[inf] = a
  }
})
fs.writeFileSync('./model.js', JSON.stringify(all, null, 2))
console.log(model.length)