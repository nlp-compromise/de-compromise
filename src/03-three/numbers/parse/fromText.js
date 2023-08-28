import { toCardinal, toNumber, isMultiple } from '../data.js'

const parseNumbers = function (terms = []) {
  let sum = 0
  let carry = 0
  let minus = false

  let words = terms[0].splits || []
  // console.log(words)
  let tags = terms[0].tags
  for (let i = 0; i < words.length; i += 1) {
    let w = words[i]

    if (w === 'minus') {
      minus = true
      continue
    }
    // ...  [ein][und][zwanzig]
    if (w === 'und') {
      continue
    }
    // 'huitieme'
    if (tags.has('Ordinal')) {
      w = toCardinal[w] || w
    }
    // 'hundert'
    if (isMultiple.has(w)) {
      let mult = toNumber[w] || 1
      if (carry === 0) {
        carry = 1
      }
      sum += mult * carry
      carry = 0
      continue
    }
    // 'fünf'
    if (toNumber.hasOwnProperty(w)) {
      carry += toNumber[w]
      // console.log(w, carry)
    }
  }
  // include any remaining
  if (carry !== 0) {
    sum += carry
  }
  // make it all negative
  if (minus === true) {
    sum *= -1
  }
  return sum
}
export default parseNumbers
