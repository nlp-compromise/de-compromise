import adjectives from './adjectives.js'

let all = {
  one: [],
  two: [],
  three: [],
  four: [],
}
Object.keys(adjectives).forEach(inf => {
  let [one, two, three, four] = adjectives[inf]
  all.one.push([inf, one])
  all.two.push([inf, two])
  all.three.push([inf, three])
  all.four.push([inf, four])
})
export default all