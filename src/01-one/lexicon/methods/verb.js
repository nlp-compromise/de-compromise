import { convert, reverse, uncompress } from 'suffix-thumb'

import presentModel from './models/toPresent.js'
import pastModel from './models/toPast.js'

let infToPresent = uncompress(presentModel)
let presentToInf = reverse(infToPresent)

let infToPast = uncompress(pastModel)
let pastToInf = reverse(infToPast)


const toPresent = function (str) {
  return convert(str, infToPresent)
}
const fromPresent = function (str) {
  return convert(str, presentToInf)
}

const toPast = function (str) {
  return convert(str, infToPast)
}
const fromPast = function (str) {
  return convert(str, pastToInf)
}

const all = function (str) {
  let arr = [str]
  let past = toPast(str)
  if (past !== str) {
    arr.push(past)
  }
  let present = toPresent(str)
  if (present !== str) {
    arr.push(present)
  }
  return arr
}

export default { toPresent, fromPresent, toPast, fromPast, all }


// console.log(toPresent('zusammenzufuehren'))
// console.log(toPast('gehen'))