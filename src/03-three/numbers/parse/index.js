import fromText from './fromText.js'

// read digits with the shared european-numbers plugin - '1.234,56', '-5', '3,5%'
const fromNumber = function (m) {
  const { read } = m.methods.two.europeanNumbers
  const locale = m.model.two.europeanNumbers
  let terms = m.docs[0]
  // a written-out sign - 'minus 5'
  const isMinus = terms.length > 1 && terms[0].normal === 'minus'
  if (isMinus) {
    terms = terms.slice(1)
  }
  const pre = terms[0].pre
  // thousands may be split-up by a space - '1 000'
  let res = read(terms.map(t => t.text).join(' '), pre, locale)
  if (res.num === null && terms.length > 1) {
    res = read(terms[0].text, pre, locale)
  }
  let num = res.num
  if (isMinus && num !== null) {
    num *= -1
  }
  // strip an ordinal off the suffix
  let suffix = res.suffix.toLowerCase()
  if (suffix === 'e' || suffix === 'er') {
    suffix = ''
  }
  return {
    hasComma: res.hasComma,
    prefix: res.prefix.toLowerCase(),
    num,
    suffix,
    // how the digits were written
    decimal: res.decimal,
    group: res.group,
  }
}

const parseNumber = function (m) {
  const terms = m.docs[0]
  let num = null
  let prefix = ''
  let suffix = ''
  let hasComma = false
  let decimal = null
  let group = null
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
    decimal = res.decimal
    group = res.group
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
    decimal,
    group,
    isText,
    isOrdinal: m.has('#Ordinal'),
    isFraction: m.has('#Fraction'),
    isMoney: m.has('#Money'),
  }
}
export default parseNumber