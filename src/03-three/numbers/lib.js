import parse from './parse/index.js'
import { scales } from './data.js'

// accept a number, or a german number as a string - 'fünf', '5', '1.234'
// returns null if it's not a number
const toNum = function (view, n) {
  if (typeof n === 'number') {
    return isNaN(n) ? null : n
  }
  if (typeof n !== 'string') {
    return null
  }
  // .fromText() does not run our tagger
  const m = view.fromText(n).compute('tagger').numbers()
  if (!m.found) {
    return null
  }
  const num = parse(m.eq(0)).num
  return typeof num === 'number' && !isNaN(num) ? num : null
}

// swap-in the new form of this number
// 'grouped' remembers that the number was written with thousands-grouping - '1.234'
const replace = function (val, str, grouped) {
  const [n, , end] = val.fullPointer[0]
  const sentence = val.document[n]
  const last = sentence[end - 1]
  // a numeric ordinal owns the period after it - '3.'
  if (/^\./.test(last.post)) {
    const wasNumeric = val.has('#Ordinal') && !val.has('#TextValue')
    if (/[0-9]\.$/.test(str)) {
      str = str.replace(/\.$/, '') // re-use the existing period
    } else if (wasNumeric && end < sentence.length) {
      last.post = last.post.replace(/^\./, '') // 'der 3. Mann' → 'der dritte Mann'
    }
  }
  // a numeric sign can sit in the punctuation before the term - the new text brings its own
  const first = sentence[val.fullPointer[0][1]]
  if (/[-−]$/.test(first.pre) && !val.has('#TextValue')) {
    first.pre = first.pre.replace(/[-−]$/, '')
  }
  // keep an existing sign-word as it is - 'Minus 5 Grad' → 'Minus fünf Grad'
  let target = val
  if (first.normal === 'minus' && /^minus /.test(str) && val.terms().length > 1) {
    target = val.not('^minus')
    str = str.replace(/^minus /, '')
  }
  target.replaceWith(str, { tags: true })
  // ...and make sure that a new sign was not lost with it - '(-1.234)'
  const now = val.docs[0][0]
  if (/^-/.test(str) && !/^-/.test(now.text) && !/-$/.test(now.pre)) {
    now.pre += '-'
  }
  if (grouped) {
    val.docs[0].forEach((term) => {
      // hidden from .json()
      Object.defineProperty(term, 'grouped', {
        value: true,
        enumerable: false,
        writable: true,
        configurable: true
      })
    })
  }
}

// 'millionen', 'milliarde'
const isBig = (term) => scales.hasOwnProperty(term.normal)
// 'zwei' in 'zwei Millionen' - a cardinal in words or digits, or 'eine'
const canMultiply = (term) => !isBig(term) && !term.tags.has('Ordinal')
// 'dreihunderttausend' in 'zwei Millionen dreihunderttausend'
const isTextCardinal = (term) =>
  !isBig(term) && term.tags.has('TextValue') && !term.tags.has('Ordinal')

// thousands may be split-up by a space - '1 000 000', '1 234,5'
const isHead = (term) => /^[0-9]{1,3}$/.test(term.text)
const isGroup = (term) => /^[0-9]{3}(?:,[0-9]+)?$/.test(term.text) && term.pre === ''
const spaceGroups = function (terms, i, end) {
  let j = i + 1
  if (!isHead(terms[i])) {
    return j
  }
  while (
    j < end &&
    isGroup(terms[j]) &&
    /^\s+$/.test(terms[j - 1].post) &&
    /^[0-9]+$/.test(terms[j - 1].text)
  ) {
    j += 1
  }
  return j
}

// most numbers are 1-term
// but very-large numbers are several - 'zwei Millionen dreihunderttausend'
const splitValues = function (m) {
  const ptrs = []
  m.fullPointer.forEach((ptr) => {
    const [n, start, end] = ptr
    const terms = m.document[n]
    let i = start
    while (i < end) {
      let j = i
      let last = Infinity
      // [zwei Milliarden] [drei Millionen]
      while (
        j + 1 < end &&
        canMultiply(terms[j]) &&
        isBig(terms[j + 1]) &&
        scales[terms[j + 1].normal] < last
      ) {
        // only the first multiplier may be digits - '5 Millionen'
        if (j > i && !isTextCardinal(terms[j])) {
          break
        }
        last = scales[terms[j + 1].normal]
        j += 2
      }
      if (j > i) {
        // ... [dreihunderttausend]
        const isNext = j + 1 < end && isBig(terms[j + 1])
        if (j < end && isTextCardinal(terms[j]) && !isNext) {
          j += 1
        }
      } else {
        j = spaceGroups(terms, i, end)
      }
      ptrs.push([n, i, j])
      i = j
    }
  })
  return m.update(ptrs)
}

// tag the number-words, but not the sign - 'minus fünf'
const tagValue = function (val, tag) {
  val.not('minus').tag(tag)
}

// there are no words for 5,5 - so 'fünf' plus a half is written in digits
const asDigits = function (val) {
  val.unTag('TextValue')
  val.unTag('Ordinal')
  tagValue(val, 'NumericValue')
  tagValue(val, 'Cardinal')
}

// run a change on each number, and keep the original view pointing at the new terms
const mutate = function (view, fn) {
  const res = view.map((val) => fn(val) || val)
  if (view.ptrs) {
    view.ptrs = res.ptrs
  }
  return res
}

export { toNum, replace, splitValues, asDigits, mutate, tagValue }
