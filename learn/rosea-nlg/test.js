import model from './model.js'

const res = {}
Object.keys(model).forEach(inf => {
  const all = new Set()
  Object.keys(model[inf]).forEach(k => {
    model[inf][k].forEach(str => {
      all.add(str)
    })
  })
  if (all.size === 4) {

    res[inf] = Array.from(all)
  }
  // console.log(Array.from(all))
})
console.log(JSON.stringify(res, null, 2))
