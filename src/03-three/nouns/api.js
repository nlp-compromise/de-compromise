export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of noun
const getRoot = function (m) {
  m = m.eq(0).compute('root')
  return m.text('root')
}

const api = function (View) {
  class Nouns extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Nouns'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.noun
      const { inflect, toRoot } = methods
      return getNth(this, n).map(m => {
        let str = getRoot(m, methods)
        let root = toRoot(str) || str
        return {
          plural: inflect(root).one,
          singular: root
        }
      }, [])
    }
  }

  View.prototype.nouns = function (n) {
    let m = this.match('#Noun+')
    m = getNth(m, n)
    return new Nouns(this.document, m.pointer)
  }
}
export default api