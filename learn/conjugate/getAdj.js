const file = '/Users/spencer/data/tiger-de/tiger_release_aug07.corrected.16012013.xml'
import parseXml from '../parseXml.js'
import fs from 'fs'

// const append = function (arr) {
//   let txt = JSON.stringify(arr) + ',\n'
//   fs.writeFileSync('./results.js', txt, { flag: 'a' })
// }

const getProp1 = (term) => {
  if (term.plural === true) {
    return 'pl'
  }
  if (term.g === 'Masc') {
    return 'm'
  }
  if (term.g === 'Fem') {
    return 'f'
  }
  if (term.g === 'Neut') {
    return 'n'
  }
}
const getProp2 = (term) => {
  if (term.case === 'Nom') {
    return 0
  }
  if (term.g === 'Gen') {
    return 1
  }
  if (term.g === 'Dat') {
    return 2
  }
  if (term.g === 'Acc') {
    return 3
  }
}

let all = {}

const callback = function (sentence) {
  sentence.forEach(term => {
    if (term.tag === 'Adjective') {
      all[term.lemma] = all[term.lemma] || { m: [], f: [], n: [], pl: [] }
      let prop = getProp1(term)
      let prop2 = getProp2(term)
      all[term.lemma][prop][prop2] = term.w
    }
  })
}

setTimeout(() => {
  console.log(JSON.stringify(all, null, 2))
}, 15000);
parseXml(file, callback, () => {
  console.log('done')
  console.log(JSON.stringify(all, null, 2))

})
