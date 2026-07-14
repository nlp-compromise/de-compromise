import fromText from './fromText.js'

const fromNumber = function (m) {
  // use the raw text - normalization strips the german decimal-comma
  let str = (m.text() || m.text('normal')).toLowerCase().trim()
  str = str.replace(/(e|er)$/, '')
  // get prefix/suffix
  let arr = str.split(/([0-9.,]*)/)
  let [prefix, num] = arr
  let suffix = arr.slice(2).join('')
  // german format - '.' groups thousands, ',' marks the decimal
  num = num.replace(/[.,]$/, '')
  let hasComma = /\d\.\d/.test(num)
  num = num.replace(/\./g, '').replace(/,/, '.')
  if (num !== '' && m.length < 2) {
    num = Number(num)
    //ensure that num is an actual number
    if (typeof num !== 'number' || isNaN(num)) {
      num = null
    } else if (/-$/.test(prefix)) {
      num = num * -1
    }
    // strip an ordinal off the suffix
    if (suffix === 'e' || suffix === 'er') {
      suffix = ''
    }
  }
  return {
    hasComma,
    prefix,
    num,
    suffix,
  }
}

const parseNumber = function (m) {
  let terms = m.docs[0]
  let num = null
  let prefix = ''
  let suffix = ''
  let hasComma = false
  let isText = m.has('#TextValue')
  if (isText) {
    num = fromText(terms)
  } else {
    let res = fromNumber(m)
    prefix = res.prefix
    suffix = res.suffix
    num = res.num
    hasComma = res.hasComma
  }
  return {
    hasComma,
    prefix,
    num,
    suffix,
    isText,
    isOrdinal: m.has('#Ordinal'),
    isFraction: m.has('#Fraction'),
    isMoney: m.has('#Money'),
  }
}
export default parseNumber