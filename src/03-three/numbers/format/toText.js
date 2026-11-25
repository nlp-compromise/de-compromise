import { data, bigNumbers } from '../data.js'

// 7 → 'sieben', 30 → 'dreißig'
const byNum = {}
data.ones.concat(data.teens, data.tens).forEach(a => {
  byNum[a[0]] = a[1]
})
// largest first
const bigFirst = bigNumbers.slice().reverse()

// 23 -> '[drei][und][zwanzig]'
// 'eins' is only said at the very end - 'einhunderteins', but 'eintausend'
const twoDigit = function (num, isLast) {
  if (num === 0) {
    return []
  }
  if (num === 1) {
    return [isLast ? 'eins' : 'ein']
  }
  // these don't combine
  if (num < 20) {
    return [byNum[num]]
  }
  const one = num % 10
  const ten = byNum[num - one]
  if (one === 0) {
    return [ten]
  }
  // use '[ein][und][zwanzig]', not 'eins..'
  return [one === 1 ? 'ein' : byNum[one], 'und', ten]
}

// 230 -> '[zweihundert][dreißig]'
const threeDigit = function (num, isLast) {
  const words = []
  const hundred = Math.floor(num / 100)
  if (hundred > 0) {
    words.push((hundred === 1 ? 'ein' : byNum[hundred]) + 'hundert')
  }
  return words.concat(twoDigit(num % 100, isLast))
}

// everything under a million is one word - '[einhundert][drei][und][zwanzig][tausend][vierhundert]..'
const sixDigit = function (num, isLast) {
  let words = []
  const thousand = Math.floor(num / 1000)
  if (thousand > 0) {
    words = threeDigit(thousand, false)
    words.push('tausend')
  }
  return words.concat(threeDigit(num % 1000, isLast))
}

// turn 130 into '[einhundert][dreißig]'
// and 2300000 into '[zwei][Millionen][dreihundert][tausend]'
const toText = function (num) {
  const words = []
  if (num === 0) {
    return ['null']
  }
  if (num < 0) {
    words.push('minus')
    num = Math.abs(num)
  }
  // no decimals
  num = Math.floor(num)
  // too big to count
  if (!Number.isSafeInteger(num)) {
    return []
  }
  // do '[zwei][Millionen]'
  bigFirst.forEach(a => {
    const [scale, singular, plural] = a
    const n = Math.floor(num / scale)
    if (n === 0) {
      return
    }
    // 'eine Million', 'zwei Millionen'
    if (n === 1) {
      words.push('eine', singular)
    } else {
      words.push(...sixDigit(n, true), plural)
    }
    num %= scale
  })
  // do '[sieben][tausend][zweihundert][drei][und][zwanzig]'
  return words.concat(sixDigit(num, true))
}
export default toText
