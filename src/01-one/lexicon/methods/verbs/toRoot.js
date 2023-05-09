import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
import fromPastParticiple from './custom/fromPastParticiple.js'
let { presentTense, pastTense, subjunctive1, subjunctive2, imperative, presentParticiple } = model

// =-=-
const revAll = function (m) {
  return Object.keys(m).reduce((h, k) => {
    h[k] = reverse(m[k])
    return h
  }, {})
}

let presentRev = revAll(presentTense)
let pastRev = revAll(pastTense)
let subjRev1 = revAll(subjunctive1)
let subjRev2 = revAll(subjunctive2)
let impRev = revAll(imperative)
let presentPartRev = reverse(presentParticiple.presentParticiple)
// let pastPartRev = reverse(pastParticiple.pastParticiple)

const allForms = function (str, form, m) {
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
const fromPresentParticiple = (str) => convert(str, presentPartRev)
// const fromPastParticiple = (str) => convert(str, pastPartRev)

export {
  fromPresent, fromPast, fromSubjunctive1, fromSubjunctive2, fromImperative, fromPresentParticiple, fromPastParticiple
}

// console.log(fromPresent('tanzt', 'secondPlural'))