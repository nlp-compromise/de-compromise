import fromText from './fromText.js'

const fromNumber = function (m) {
  // use the raw text - normalization strips the german decimal-comma
  let str = (m.text() || m.text('normal')).toLowerCase().trim()
  str = str.replace(/(e|er)$/, '')
  // a written-out sign - 'minus 5'
  const isMinus = /^minus\s+/.test(str)
  str = str.replace(/^minus\s+/, '')
  // get prefix/suffix
  // the prefix is everything before the first digit - '(-5)'
  const start = str.search(/[0-9]/)
  let prefix = str
  let num = ''
  let suffix = ''
  if (start !== -1) {
    prefix = str.slice(0, start)
    num = str.slice(start).match(/^[0-9.,]*/)[0]
    suffix = str.slice(start + num.length)
  }
  // german format - '.' groups thousands, ',' marks the decimal
  num = num.replace(/[.,]$/, '')
  const hasComma = /\d\.\d/.test(num)
  num = num.replace(/\./g, '').replace(/,/, '.')
  if (num !== '' && m.length < 2) {
    num = Number(num)
    //ensure that num is an actual number
    if (typeof num !== 'number' || isNaN(num)) {
      num = null
    } else if (/-$/.test(prefix) || isMinus) {
      num = num * -1
    }
    // strip an ordinal off the suffix
    if (suffix === 'e' || suffix === 'er') {
      suffix = ''
    }
  }
  // no digits at all
  if (num === '') {
    num = null
  }
  return {
    hasComma,
    prefix,
    num,
    suffix,
  }
}

const parseNumber = function (m) {
  const terms = m.docs[0]
  let num = null
  let prefix = ''
  let suffix = ''
  let hasComma = false
  const isText = m.has('#TextValue')
  if (isText) {
    // terms made by .replaceWith() haven't been through the splitter yet
    if (terms.some(term => !term.splits)) {
      m.compute('splitter')
    }
    num = fromText(terms)
  } else {
    const res = fromNumber(m)
    prefix = res.prefix
    suffix = res.suffix
    num = res.num
    hasComma = res.hasComma
  }
  // a number that we re-wrote remembers its thousands-grouping - '1.234' → 'eintausend..' → '1.234'
  if (terms.some(term => term.grouped === true)) {
    hasComma = true
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