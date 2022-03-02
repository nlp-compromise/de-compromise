const file = '/Users/spencer/data/tiger-de/tiger_release_aug07.corrected.16012013.xml'
import parseXml from './parseXml.js'
import nlp from '../../src/index.js'

const normalize = function (str) {
  str = str.toLowerCase().trim()
  return str
}

const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};

let right = 0
let wrong = 0

const callback = function (sentence) {
  let want = {}
  sentence.forEach(t => {
    let str = normalize(t.w)
    want[str] = t.tag
  })
  let txt = sentence.map(t => t.w).join(' ')
  let doc = nlp(txt)
  doc.terms().forEach(t => {
    let str = normalize(t.text())
    let tag = want[str]
    if (tag) {
      if (t.has(`#${tag}`)) {
        right += 1
      } else {
        wrong += 1
        // console.log('\n', str, tag)
        // console.log(txt)
        // t.debug()
      }
    }
  })
}

setInterval(() => {
  console.log(percent(right, right + wrong) + '% right')
  // console.log(percent(wrong, right + wrong) + '% wrong')
}, 2000)

parseXml(file, callback, () => {
  console.log('done')
  console.log(right, wrong)
  console.log(percent(right, right + wrong) + '% right')
})
