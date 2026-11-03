import fs from 'node:fs'
const arr = fs.readFileSync('/Users/spencer/mountain/de-compromise/learn/rosea-nlg/dictionary.dump').toString().split('\n')
const byInf = {}
arr.forEach(str => {
  const [w, inf, parts] = str.split(/\t/)
  byInf[inf] = byInf[inf] || {}
  byInf[inf][parts] = w
})
// console.log(byInf['schmecken'])

const all = {}
Object.keys(byInf).forEach(inf => {
  const o = byInf[inf]
  let a = [o['VER:1:SIN:PRÄ:SFT'], o['VER:2:SIN:PRÄ:SFT'], o['VER:3:SIN:PRÄ:SFT'], o['VER:1:PLU:PRÄ:SFT'], o['VER:2:PLU:PRÄ:SFT'], o['VER:3:PLU:PRÄ:SFT']]
  a=a.filter(s=>s)
  if(a.length===6){
    all[inf] = a
  }
})
fs.writeFileSync('./model.js', JSON.stringify(all, null, 2))
console.log(model.length)