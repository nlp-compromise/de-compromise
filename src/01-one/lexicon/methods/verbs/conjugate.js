import { convert } from 'suffix-thumb'
import model from '../models.js'
import getIrregular from './irregulars.js'
import ppRules from './custom/toPastParticiple.js'
let { presentTense, pastTense, subjunctive1, subjunctive2, imperative, presentParticiple, pastParticiple } = model

const doEach = function (str, m, tense) {
  let irr = getIrregular(str, tense)
  if (irr) {
    return {
      first: irr[0],
      second: irr[1],
      third: irr[2],
      firstPlural: irr[3],
      secondPlural: irr[4],
      thirdPlural: irr[5],
    }
  }
  return {
    first: convert(str, m.first),
    second: convert(str, m.second),
    third: convert(str, m.third),
    firstPlural: convert(str, m.firstPlural),
    secondPlural: convert(str, m.secondPlural),
    thirdPlural: convert(str, m.thirdPlural),
  }
}

const toPresent = (str) => doEach(str, presentTense, 'present')
const toPast = (str) => doEach(str, pastTense, 'past')
const toSubjunctive1 = (str) => doEach(str, subjunctive1, 'subj1')
const toSubjunctive2 = (str) => doEach(str, subjunctive2, 'subj2')

const toPresentParticiple = (str) => {
  return getIrregular(str, 'presentParticiple') || convert(str, presentParticiple.presentParticiple)
}
const toPastParticiple = (str) => {
  let irr = getIrregular(str, 'pastParticiple')
  if (irr) {
    return irr
  }
  if (pastParticiple) {
    return convert(str, pastParticiple.pastParticiple)
  }
  return ppRules(str)
}
const toImperative = (str) => {
  let irr = getIrregular(str, 'imperative')
  if (irr) {
    return { secondSingular: irr[0], secondPlural: irr[1] }
  }
  return {
    secondSingular: convert(str, imperative.singular),
    secondPlural: convert(str, imperative.plural),
  }
}

// an array of every inflection, for '{inf}' syntax
const all = function (str) {
  let res = [str].concat(
    Object.values(toPresent(str)),
    Object.values(toPast(str)),
    Object.values(toSubjunctive1(str)),
    Object.values(toSubjunctive2(str)),
    Object.values(toImperative(str)),
    toPresentParticiple(str),
    toPastParticiple(str),
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
  toPresentParticiple,
  toPastParticiple
}

// console.log(toImperative('schwimmen'))
// console.log(all('tanzen'))