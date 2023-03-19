
const convertTo = (inf, suffixes, fallback) => {
  let keys = Object.keys(suffixes)
  for (let i = 0; i < keys.length; i += 1) {
    if (inf.endsWith(keys[i])) {
      return inf.replace(keys[i], suffixes[keys[i]])
    }
  }
  return inf + fallback
}

const toOne = (inf) => {
  let pairs = {
    'erisch': 'erischster',
    'chtig': 'chtigster',
    'fähig': 'fähigster',
    'nhaft': 'nhaftester',
    'eitig': 'eitiger',
    'wach': 'wächster',
    'eich': 'eichster',
    'rtig': 'rtiger',
    'htig': 'htiger',
    'haft': 'hafter',
    'tlich': 'tlicher',
    'lich': 'lichster',
    'ert': 'ertester',
    'ig': 'igster',
    'os': 'osester',
    'll': 'llster',
    'ft': 'ftester',
    'nt': 'ntester',
  }
  return convertTo(inf, pairs, 'er')
}

const toTwo = (inf) => {
  let pairs = {
  }
  return convertTo(inf, pairs, 'en')
}
const toThree = (inf) => {
  let pairs = {
  }
  return convertTo(inf, pairs, 'ste')
}
const toFour = (inf) => {
  let pairs = {
    alig: 'aliges',
    llig: 'lliges',
    ilig: 'iliges',
    ig: 'igstes',
    lich: 'liches',
    tisch: 'tisches',
    nisch: 'nisches',
    misch: 'misches',
    lisch: 'lisches',
    disch: 'disches',
    hisch: 'hisches',
    risch: 'risches',
    isch: 'ischstes',
    ich: 'ichstes',
    aft: 'aftestes',
    est: 'estes',
    ert: 'ertestes',
    nt: 'ntestes',
    art: 'artes',
    rt: 'rtetes',
    uell: 'uelles',
    ll: 'llstes',
    bel: 'bles',
    // al: 'alstes',

  }
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



