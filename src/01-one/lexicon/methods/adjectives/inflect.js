import model from './model.js'

const inflectAdj = function (inf) {
  const keys = Object.keys(model)
  for (let i = 0; i < keys.length; i += 1) {
    let suff = keys[i]
    if (inf.endsWith(suff)) {
      return {
        one: inf + model[suff][0],
        two: inf + model[suff][1],
        three: inf + model[suff][2],
        four: inf + model[suff][3],
      }
    }
  }
  return {
    one: inf + 'er',
    two: inf + 'en',
    three: inf + 'e',
    four: inf + 'es',
  }
}
export default inflectAdj

// console.log(inflectAdj('foovativ'))


