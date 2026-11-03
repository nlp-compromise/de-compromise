import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
import { toInfinitive } from './irregulars.js'
import ppRules from './custom/fromPastParticiple.js'
const { presentTense, pastTense, subjunctive1, subjunctive2, imperative, presentParticiple, pastParticiple } = model

// =-=-
const revAll = function (m) {
  return Object.keys(m).reduce((h, k) => {
    h[k] = reverse(m[k])
    return h
  }, {})
}

const presentRev = revAll(presentTense)
const pastRev = revAll(pastTense)
const subjRev1 = revAll(subjunctive1)
const subjRev2 = revAll(subjunctive2)
const impRev = revAll(imperative)
const presentPartRev = reverse(presentParticiple.presentParticiple)
const pastPartRev = pastParticiple ? reverse(pastParticiple.pastParticiple) : null

const allForms = function (str, form, m) {
  if (toInfinitive.hasOwnProperty(str)) {
    return toInfinitive[str]
  }
  if (m.hasOwnProperty(form)) {
    return convert(str, m[form])
  }
  return str
}

const fromPresent = (str, form) => allForms(str, form, presentRev)
const fromPast = (str, form) => allForms(str, form, pastRev)
const fromSubjunctive1 = (str, form) => allForms(str, form, subjRev1)
const fromSubjunctive2 = (str, form) => allForms(str, form, subjRev2)
const fromImperative = (str, form) => allForms(str, form, impRev)
const fromPresentParticiple = (str) => {
  return toInfinitive[str] || convert(str, presentPartRev)
}
const fromPastParticiple = (str) => {
  if (toInfinitive.hasOwnProperty(str)) {
    return toInfinitive[str]
  }
  if (pastPartRev) {
    return convert(str, pastPartRev)
  }
  return ppRules(str)
}

export {
  fromPresent, fromPast, fromSubjunctive1, fromSubjunctive2, fromImperative, fromPresentParticiple, fromPastParticiple
}

// console.log(fromPresent('tanzt', 'secondPlural'))