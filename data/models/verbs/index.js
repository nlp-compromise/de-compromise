import pastTense from './past-tense.js'
import presentTense from './present-tense.js'
import subjunctive1 from './subjunctive-1.js'
import subjunctive2 from './subjunctive-2.js'

const vbOrder = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
const todo = {
  pastTense: { data: pastTense, keys: vbOrder },
  presentTense: { data: presentTense, keys: vbOrder },
  subjunctive1: { data: subjunctive1, keys: vbOrder },
  subjunctive2: { data: subjunctive2, keys: vbOrder },
}

// turn our conjugation data into word-pairs
let model = {}
Object.keys(todo).forEach(k => {
  model[k] = {}
  let { data, keys } = todo[k]
  keys.forEach((form, i) => {
    let pairs = []
    Object.keys(data).forEach(inf => {
      pairs.push([inf, data[inf][i]])
    })
    model[k][form] = pairs
    // console.log(k, form, pairs.length)
  })
})

export default model
