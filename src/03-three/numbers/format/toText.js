import { data } from '../data.js'
const tens = data.tens.reverse()
const teens = data.teens.reverse()
const ones = data.ones.reverse()
const hundreds = data.hundreds.reverse()


const doThousands = function (num) {
  const words = []
  // hunderttausend
  if (num >= 100000) {
    for (let i = 0; i < ones.length; i += 1) {
      if (num >= ones[i][0] * 100000) {
        const found = ones[i][0] === 1 ? 'ein' : ones[i][1]
        words.push(found)
        words.push('hunderttausend')
        num -= teens[i][0] * 100000
      }
    }
  }
  // eleven-thousand...
  if (num >= 10000) {
    for (let i = 0; i < teens.length; i += 1) {
      if (num >= teens[i][0] * 1000) {
        words.push(teens[i][1])
        words.push('tausend')
        num -= teens[i][0] * 1000
      }
    }
  }
  // dreitausend, viertausend...
  for (let i = 0; i < ones.length; i += 1) {
    if (num >= ones[i][0] * 1000) {
      const found = ones[i][0] === 1 ? 'ein' : ones[i][1]
      return [found, 'tausend']
    }
  }
  return words
}

const doHundreds = function (num) {
  const words = []
  for (let i = 0; i < hundreds.length; i += 1) {
    if (num >= hundreds[i][0]) {
      words.push(hundreds[i][1])
      num -= hundreds[i][0]
      break
    }
  }
  return words
}

// 23 -> '[drei][und][zwanzig]'
const twoDigit = function (num) {
  const words = []
  // ninety, eighty ...
  for (let i = 0; i < tens.length; i += 1) {
    if (num >= tens[i][0]) {
      words.push(tens[i][1])
      num -= tens[i][0]
    }
  }
  // found nothing? look for teens
  if (words.length === 0) {
    for (let i = 0; i < teens.length; i += 1) {
      if (num === teens[i][0]) {
        return [teens[i][1]] //these don't combine
      }
    }
  }
  // look for ones to add on
  for (let i = 0; i < ones.length; i += 1) {
    if (num === ones[i][0]) {
      // drei und zwanzig
      if (words.length === 1) {
        // use '[ein][und][zwanzig]', not 'eins..'
        const found = ones[i][0] === 1 ? 'ein' : ones[i][1]
        return [found, 'und', words[0]]
      }
      // just 'drei'
      if (words.length === 0) {
        return [ones[i][1]]
      }
    }
  }
  return words
}


// turn 130 into '[ein][hundert][dreißig]'
const toText = function (num) {
  let words = []
  if (num === 0) {
    return ['null']
  }
  if (num < 0) {
    words.push('moins')
    num = Math.abs(num)
  }
  // do '[sieben][tausend]'
  if (num >= 1000) {
    const res = doThousands(num)
    words = words.concat(res)
    num %= 1000
  }
  // do '[zwei][hundert]'
  if (num >= 100) {
    const res = doHundreds(num)
    words = words.concat(res)
    num %= 100
  }
  // do '[drei][und][zwanzig]'
  if (num > 0) {
    words = words.concat(twoDigit(num))
  }
  return words
}
export default toText