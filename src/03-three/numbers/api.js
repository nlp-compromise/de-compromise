import parse from './parse/index.js'
import format from './format/index.js'
import { toNum, replace, splitValues, asDigits, mutate, tagValue } from './lib.js'

// return the nth elem of a doc
export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

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
      return getNth(this, n)
        .map(parse, [])
        .map((o) => o.num)
    }
    json(n) {
      // a number selects the nth match, anything else is json options
      const opts = typeof n === 'number' ? undefined : n
      const doc = getNth(this, n)
      return doc.map((p) => {
        const json = p.toView().json(opts)[0]
        const parsed = parse(p)
        json.number = {
          prefix: parsed.prefix,
          num: parsed.num,
          suffix: parsed.suffix,
          hasComma: parsed.hasComma
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
      mutate(this, (val) => {
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
      return new Numbers(
        this.document,
        changed.map((val) => val.fullPointer[0])
      )
    }
    /** convert to numeric form like 'eight' or 'eighth' */
    toText() {
      const res = mutate(this, (val) => {
        // already in words - but not '5 Millionen'
        if (val.has('#TextValue') && !val.has('#NumericValue')) {
          return val
        }
        const obj = parse(val)
        // there are no words for '3,5' - leave it in digits
        if (obj.num === null || !Number.isInteger(obj.num)) {
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
      const res = mutate(this, (val) => {
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
      const res = mutate(this, (val) => {
        if (val.has('#Ordinal')) {
          return val
        }
        const obj = parse(val)
        // ... and there is no '3,5.'
        if (obj.num === null || !Number.isInteger(obj.num)) {
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
      const res = mutate(this, (val) => {
        const obj = parse(val)
        obj.num = n
        if (obj.num === null) {
          return val
        }
        let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        const toDigits = val.has('#TextValue') && !Number.isInteger(obj.num)
        if (val.has('#TextValue') && !toDigits) {
          fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        }
        const str = format(obj, fmt)
        if (str) {
          val = val.not('#Currency')
          replace(val, str, obj.hasComma)
          if (toDigits) {
            asDigits(val)
          }
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
      const res = mutate(this, (val) => {
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        obj.num = Number((obj.num + n).toPrecision(15))
        let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        const toDigits = obj.isText && !Number.isInteger(obj.num)
        if (obj.isText && !toDigits) {
          fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        }
        const str = format(obj, fmt)
        if (str) {
          replace(val, str, obj.hasComma)
          if (toDigits) {
            asDigits(val)
          }
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
      m = m.not('minus').map((val) => {
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
