import { convert } from 'suffix-thumb'
import model from '../models.js'
let { presentTense, pastTense, subjunctive1, subjunctive2, imperative } = model

const doEach = function (str, m) {
  return {
    first: convert(str, m.first),
    second: convert(str, m.second),
    third: convert(str, m.third),
    firstPlural: convert(str, m.firstPlural),
    secondPlural: convert(str, m.secondPlural),
    thirdPlural: convert(str, m.thirdPlural),
  }
}

const toPresent = (str) => doEach(str, presentTense)
const toPast = (str) => doEach(str, pastTense)
const toSubjunctive1 = (str) => doEach(str, subjunctive1)
const toSubjunctive2 = (str) => doEach(str, subjunctive2)
const toImperative = (str) => doEach(str, imperative)


// an array of every inflection, for '{inf}' syntax
const all = function (str) {
  let res = [str].concat(
    Object.values(toPresent(str)),
    Object.values(toPast(str)),
    Object.values(toSubjunctive1(str)),
    Object.values(toSubjunctive2(str)),
    Object.values(toImperative(str)),
  ).filter(s => s)
  res = new Set(res)
  return Array.from(res)
}

export {
  all,
  toPresent,
  toPast,
  toSubjunctive1,
  toSubjunctive2,
  toImperative,
}

// console.log(toPresent('tanzen'))
// console.log(all('tanzen'))