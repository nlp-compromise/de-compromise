export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of adjective
const getRoot = function (m, methods) {
  m = m.eq(0).compute('root')
  return m.text('root')
}

const api = function (View) {
  class Adjectives extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Adjectives'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.adjective
      const { inflect, toRoot } = methods
      return getNth(this, n).map(m => {
        let str = getRoot(m, methods)
        let root = toRoot(str) || str
        let res = inflect(root)
        res.infinitive = root
        return res
      }, [])
    }
  }

  View.prototype.adjectives = function (n) {
    let m = this.match('#Adjective')
    m = getNth(m, n)
    return new Adjectives(this.document, m.pointer)
  }
}
export default api