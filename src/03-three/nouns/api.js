export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get (lower-cased) singular form of noun
const getRoot = function (m) {
  m = m.eq(0).compute('root')
  return m.text('root')
}

// german nouns are capitalized - keep the casing of the original word
const matchCase = function (m, str) {
  if (/^[A-ZÄÖÜ]/.test(m.text().trim())) {
    return str.charAt(0).toUpperCase() + str.substring(1)
  }
  return str
}

// 'hunde' → 'hund' → 'hunde' round-trips, so it is already a plural,
// even when the tagger could not tell - 'die Hunde' vs 'der Kunde'
const isPluralForm = function (methods, str) {
  let single = methods.toSingular(str)
  return single !== str && methods.toPlural(single).one === str
}

const api = function (View) {
  class Nouns extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Nouns'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.noun
      return getNth(this, n).map(m => {
        let root = getRoot(m)
        return {
          singular: root,
          plural: methods.toPlural(root).one,
        }
      }, [])
    }

    isPlural(n) {
      return getNth(this, n).if('#Plural')
    }
    toPlural(n) {
      const methods = this.methods.two.transform.noun
      return getNth(this, n).not('#Plural').map(m => {
        if (isPluralForm(methods, m.text('normal'))) {
          return m
        }
        let str = getRoot(m)
        let plural = methods.toPlural(str).one
        return m.replaceWith(matchCase(m, plural))
      })
    }
    toSingular(n) {
      const methods = this.methods.two.transform.noun
      return getNth(this, n).not('#Singular').map(m => {
        let str = m.text('normal')
        if (!m.has('#Plural') && !isPluralForm(methods, str)) {
          return m
        }
        let singular = methods.toSingular(str)
        return m.replaceWith(matchCase(m, singular))
      })
    }
  }

  View.prototype.nouns = function (n) {
    let m = this.match('#Noun+')
    m = getNth(m, n)
    return new Nouns(this.document, m.pointer)
  }
}
export default api