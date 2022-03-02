const file = '/Users/spencer/data/tiger-de/tiger_release_aug07.corrected.16012013.xml'
import parseXml from '../parseXml.js'
import fs from 'fs'

const normalize = function (str) {
  str = str.toLowerCase().trim()
  return str
}


let byTag = {
  Verb: {},
  Noun: {},
  Adjective: {},
  Adverb: {},
}

const callback = function (sentence) {
  sentence.forEach(t => {
    let tag = t.tag
    if (byTag[tag]) {
      let str = normalize(t.w)
      byTag[tag][str] = byTag[tag][str] || 0
      byTag[tag][str] += 1
    }
  })
}

const doTag = function (tag, max = 6) {
  let all = Object.entries(byTag[tag])
  all = all.filter(a => a[1] > max)
  all = all.sort((a, b) => {
    if (a[1] > b[1]) {
      return -1
    } else if (a[1] < b[1]) {
      return 1
    }
    return 0
  })
  all = all.map(a => a[0])
  fs.writeFileSync(`./${tag}.js`, 'export default ' + JSON.stringify(all, null, 2))
  return all
}

parseXml(file, callback, () => {
  console.log('done')
  doTag('Adverb')
  doTag('Verb')
  doTag('Noun')
  doTag('Adjective')
})
