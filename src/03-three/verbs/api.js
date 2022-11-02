export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of adjective
const getRoot = function (m, methods) {
  m.compute('root')
  let str = m.text('root')
  return str
}

const api = function (View) {
  class Verbs extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Verbs'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.verb
      const { toPresent, toPast, toFuture, toConditional, toGerund } = methods
      return getNth(this, n).map(m => {
        let str = getRoot(m, methods)
        return {
          presentTense: toPresent(str),
          pastTense: toPast(str),
          futureTense: toFuture(str),
          conditional: toConditional(str),
          gerund: toGerund(str),
        }
      }, [])
    }
  }

  View.prototype.verbs = function (n) {
    let m = this.match('#Verb+')
    m = getNth(m, n)
    return new Verbs(this.document, m.pointer)
  }
}
export default api