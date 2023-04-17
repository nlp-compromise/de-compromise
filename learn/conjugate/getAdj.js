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
  return 'm'
  // console.log(term)
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
  return 0
}

let all = {}

const callback = function (sentence) {
  sentence.forEach(term => {
    if (term.tag === 'Adjective') {
      all[term.lemma] = all[term.lemma] || { m: [], f: [], n: [], pl: [] }
      let prop = getProp1(term)
      let prop2 = getProp2(term)

      // console.log(prop, all[term.lemma][prop])
      // all[term.lemma] = all[term.lemma] || {}
      if (!all[term.lemma] || !all[term.lemma][prop]) {
        console.log(term.lemma, prop, prop2)
      } else {
        all[term.lemma][prop][prop2] = term.w
      }
    }
  })
}

// setTimeout(() => {
//   console.log(JSON.stringify(all, null, 2))
// }, 15000);
parseXml(file, callback, () => {
  console.log('done')

  Object.keys(all).forEach(k => {
    if (!all[k].m.length || !all[k].f.length || !all[k].n.length || !all[k].n.length) {
      delete all[k]
    }
  })
  console.log(JSON.stringify(all, null, 2))
  fs.writeFileSync('./out.json', JSON.stringify(all, null, 2))

})
