
const convertTo = (inf, pairs, fallback) => {
  for (let i = 0; i < pairs.length; i += 1) {
    let [from, to] = pairs[i]
    if (inf.endsWith(from)) {
      return inf.replace(from, to)
    }
  }
  return inf + fallback
}

const toOne = (inf) => {
  let pairs = [
    ['ich', 'ichster'],
    ['ft', 'ftester'],
    ['ll', 'llster'],
    ['os', 'osester'],
    ['ig', 'igster']
  ]
  return convertTo(inf, pairs, 'er')
}

const toTwo = (inf) => {
  let pairs = [
    ['ich', 'ichsten'],
    ['ft', 'ftesten'],
    ['ll', 'llsten'],
    ['os', 'osesten'],
    ['ig', 'igsten']
  ]
  return convertTo(inf, pairs, 'en')
}
const toThree = (inf) => {
  let pairs = [
    ['ich', 'ichste'],
    ['ft', 'fteste'],
    ['ll', 'llste'],
    ['os', 'oseste'],
    ['ig', 'igste']
  ]
  return convertTo(inf, pairs, 'e')
}
const toFour = (inf) => {
  let pairs = [
    ['ich', 'ichstes'],
    ['ft', 'ftestes'],
    ['ll', 'llstes'],
    ['os', 'osestes'],
    ['ig', 'igstes']
  ]
  return convertTo(inf, pairs, 'es')
}

const inflectAdj = function (inf) {
  return {
    one: toOne(inf),
    two: toTwo(inf),
    three: toThree(inf),
    four: toFour(inf),
  }

}
export default inflectAdj



