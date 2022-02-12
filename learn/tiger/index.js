const file = '/Users/spencer/data/tiger-de/tiger_release_aug07.corrected.16012013.xml'
import parseXml from './parseXml.js'

const callback = function (sentence) {
  console.log(sentence)
}
parseXml(file, callback)
