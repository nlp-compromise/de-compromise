const file = '/Volumes/5tb/misc/corpus/tiger-de/tiger_release_aug07.corrected.16012013.xml'
import parseXml from '../parseXml.js'
import fs from 'fs'

const append = function (arr) {
  let txt = JSON.stringify(arr) + ',\n'
  fs.writeFileSync('./results.js', txt, { flag: 'a' })
}

const callback = function (sentence) {
  sentence.forEach(term => {
    if (term.tag === 'Verb' && term.tense === 'Past') {
      if (term.w !== term.lemma) {
        console.log(term.w, '\t', term.lemma)
        append([term.lemma, term.w])
      }
    }
  })
}
parseXml(file, callback)
