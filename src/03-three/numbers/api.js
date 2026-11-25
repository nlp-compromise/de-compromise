import parse from './parse/index.js'
import format from './format/index.js'
import { scales } from './data.js'

// return the nth elem of a doc
export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

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
    val.docs[0].forEach(term => {
      // hidden from .json()
      Object.defineProperty(term, 'grouped', { value: true, enumerable: false, writable: true, configurable: true })
    })
  }
}

// 'millionen', 'milliarde'
const isBig = term => scales.hasOwnProperty(term.normal)
// 'zwei' in 'zwei Millionen' - a cardinal in words or digits, or 'eine'
const canMultiply = term => !isBig(term) && !term.tags.has('Ordinal')
// 'dreihunderttausend' in 'zwei Millionen dreihunderttausend'
const isTextCardinal = term => !isBig(term) && term.tags.has('TextValue') && !term.tags.has('Ordinal')

// thousands may be split-up by a space - '1 000 000', '1 234,5'
const isHead = term => /^[0-9]{1,3}$/.test(term.text)
const isGroup = term => /^[0-9]{3}(?:,[0-9]+)?$/.test(term.text) && term.pre === ''
const spaceGroups = function (terms, i, end) {
  let j = i + 1
  if (!isHead(terms[i])) {
    return j
  }
  while (j < end && isGroup(terms[j]) && /^\s+$/.test(terms[j - 1].post) && /^[0-9]+$/.test(terms[j - 1].text)) {
    j += 1
  }
  return j
}

// most numbers are 1-term
// but very-large numbers are several - 'zwei Millionen dreihunderttausend'
const splitValues = function (m) {
  const ptrs = []
  m.fullPointer.forEach(ptr => {
    const [n, start, end] = ptr
    const terms = m.document[n]
    let i = start
    while (i < end) {
      let j = i
      let last = Infinity
      // [zwei Milliarden] [drei Millionen]
      while (j + 1 < end && canMultiply(terms[j]) && isBig(terms[j + 1]) && scales[terms[j + 1].normal] < last) {
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

// run a change on each number, and keep the original view pointing at the new terms
const mutate = function (view, fn) {
  const res = view.map(val => fn(val) || val)
  if (view.ptrs) {
    view.ptrs = res.ptrs
  }
  return res
}

const api = function (View) {
  /**   */
  class Numbers extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Numbers'
    }
    parse(n) {
      return getNth(this, n).map(parse, [])
    }
    get(n) {
      return getNth(this, n).map(parse, []).map(o => o.num)
    }
    json(n) {
      // a number selects the nth match, anything else is json options
      const opts = typeof n === 'number' ? undefined : n
      const doc = getNth(this, n)
      return doc.map(p => {
        const json = p.toView().json(opts)[0]
        const parsed = parse(p)
        json.number = {
          prefix: parsed.prefix,
          num: parsed.num,
          suffix: parsed.suffix,
          hasComma: parsed.hasComma,
        }
        return json
      }, [])
    }
    /** any known measurement unit, for the number */
    units() {
      return this.growRight('#Unit').match('#Unit$')
    }
    /** return only ordinal numbers */
    isOrdinal() {
      return this.if('#Ordinal')
    }
    /** return only cardinal numbers*/
    isCardinal() {
      return this.if('#Cardinal')
    }

    /** convert to numeric form like '8' or '8th' */
    toNumber() {
      const changed = []
      mutate(this, val => {
        if (!val.has('#TextValue')) {
          return val
        }
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        changed.push(val)
        const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        const str = format(obj, fmt)
        if (str) {
          replace(val, str, obj.hasComma)
          val.tag('NumericValue')
        }
        return val
      })
      // return only the numbers that were text
      return new Numbers(this.document, changed.map(val => val.fullPointer[0]))
    }
    /** convert to numeric form like 'eight' or 'eighth' */
    toText() {
      const res = mutate(this, val => {
        // already in words - but not '5 Millionen'
        if (val.has('#TextValue') && !val.has('#NumericValue')) {
          return val
        }
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        const str = format(obj, fmt)
        if (str) {
          replace(val, str, obj.hasComma)
          tagValue(val, 'TextValue')
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }
    /** convert ordinal to cardinal form, like 'eight', or '8' */
    toCardinal() {
      const res = mutate(this, val => {
        if (!val.has('#Ordinal')) {
          return val
        }
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        const fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal'
        const str = format(obj, fmt)
        if (str) {
          replace(val, str, obj.hasComma)
          tagValue(val, 'Cardinal')
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }
    /** convert cardinal to ordinal form, like 'eighth', or '8th' */
    toOrdinal() {
      const res = mutate(this, val => {
        if (val.has('#Ordinal')) {
          return val
        }
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal'
        const str = format(obj, fmt)
        if (str) {
          replace(val, str, obj.hasComma)
          tagValue(val, 'Ordinal')
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }

    /** return only numbers that are == n */
    isEqual(n) {
      return this.filter((val) => {
        const num = parse(val).num
        return num === n
      })
    }
    /** return only numbers that are > n*/
    greaterThan(n) {
      return this.filter((val) => {
        const num = parse(val).num
        return num > n
      })
    }
    /** return only numbers that are < n*/
    lessThan(n) {
      return this.filter((val) => {
        const num = parse(val).num
        return num < n
      })
    }
    /** return only numbers > min and < max */
    between(min, max) {
      return this.filter((val) => {
        const num = parse(val).num
        return num > min && num < max
      })
    }
    /** set these number to n */
    set(n) {
      if (n === undefined) {
        return this // don't bother
      }
      n = toNum(this, n)
      if (n === null) {
        return this // not a number
      }
      const res = mutate(this, val => {
        const obj = parse(val)
        obj.num = n
        if (obj.num === null) {
          return val
        }
        let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        if (val.has('#TextValue')) {
          fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        }
        const str = format(obj, fmt)
        if (str) {
          val = val.not('#Currency')
          replace(val, str, obj.hasComma)
          // handle plural/singular unit
          // agreeUnits(agree, val, obj)
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }
    add(n) {
      n = toNum(this, n)
      if (!n) {
        return this // don't bother
      }
      const res = mutate(this, val => {
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        obj.num += n
        let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        if (obj.isText) {
          fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        }
        const str = format(obj, fmt)
        if (str) {
          replace(val, str, obj.hasComma)
          // handle plural/singular unit
          // agreeUnits(agree, val, obj)
        }
        return val
      })
      return new Numbers(res.document, res.pointer)
    }
    /** decrease each number by n*/
    subtract(n) {
      n = toNum(this, n)
      if (!n) {
        return this // don't bother
      }
      return this.add(n * -1)
    }
    /** increase each number by 1 */
    increment() {
      return this.add(1)
    }
    /** decrease each number by 1 */
    decrement() {
      return this.add(-1)
    }
    // overloaded - keep Numbers class
    update(pointer) {
      const m = new Numbers(this.document, pointer)
      m._cache = this._cache // share this full thing
      return m
    }
  }
  // aliases
  Numbers.prototype.isBetween = Numbers.prototype.between
  Numbers.prototype.minus = Numbers.prototype.subtract
  Numbers.prototype.plus = Numbers.prototype.add
  Numbers.prototype.equals = Numbers.prototype.isEqual

  View.prototype.numbers = function (n) {
    let m = splitValues(this.match('#Value+'))
    // a written-out sign belongs to its number - 'minus fünf Grad'
    // (but 'zehn minus fünf' is a subtraction)
    if (this.has('minus')) {
      m = m.not('minus').map(val => {
        const sign = val.lookBehind('minus$')
        if (sign.found && !sign.lookBehind('#Value$').found) {
          return val.growLeft('minus')
        }
        return val
      })
    }
    // make sure splitter has run
    m.compute('splitter')
    m = getNth(m, n)
    return new Numbers(this.document, m.pointer)
  }
  // alias
  View.prototype.values = View.prototype.numbers
}
export default api
