import { toCardinal, toNumber, scales } from '../data.js'

// words that the splitter leaves in one piece
const expand = {
  hunderttausend: ['hundert', 'tausend'],
  hunderteins: ['hundert', 'eins'],
  hunderterste: ['hundert', 'erste'],
}

// a multiplier in digits - '2,5 Millionen'
const fromDigits = function (str) {
  str = str.replace(/\./g, '').replace(/,/, '.')
  return /^[0-9]+(\.[0-9]+)?$/.test(str) ? Number(str) : 0
}

// avoid float-noise - 1,1 Millionen
const round = n => Math.round(n * 1000) / 1000

// a number is built in three levels -
// [zwei Millionen] [einhundertdreiundzwanzig tausend] [vierhundertsechsundfünfzig]
const parseNumbers = function (terms = []) {
  let total = 0 // millions, and up
  let thousands = 0
  let carry = 0 // under one-thousand
  let minus = false

  const addWord = function (w) {
    if (expand.hasOwnProperty(w)) {
      expand[w].forEach(addWord)
      return
    }
    if (w === 'minus') {
      minus = true
      return
    }
    // ...  [ein][und][zwanzig]
    if (w === 'und') {
      return
    }
    // 'zweite' → 'zwei'
    if (!toNumber.hasOwnProperty(w) && toCardinal.hasOwnProperty(w)) {
      w = toCardinal[w]
    }
    // 'millionen' multiplies everything said so far
    if (scales.hasOwnProperty(w)) {
      total += round((thousands + carry || 1) * scales[w])
      thousands = 0
      carry = 0
      return
    }
    // 'tausend' multiplies the hundreds - [einhundertdreiundzwanzig][tausend]
    if (w === 'tausend') {
      thousands += (carry || 1) * 1000
      carry = 0
      return
    }
    // 'hundert' multiplies the one before it - [zwei][hundert]
    if (w === 'hundert') {
      carry = (carry || 1) * 100
      return
    }
    // 'fünf'
    if (toNumber.hasOwnProperty(w)) {
      carry += toNumber[w]
    }
  }

  // very-large numbers are several terms - 'zwei Millionen dreihunderttausend'
  terms.forEach(term => {
    if (term.tags.has('NumericValue')) {
      carry += fromDigits(term.text)
      return
    }
    const words = term.splits || [term.normal]
    words.forEach(addWord)
  })

  let sum = total + thousands + carry
  // make it all negative
  if (minus === true) {
    sum *= -1
  }
  return sum
}
export default parseNumbers
