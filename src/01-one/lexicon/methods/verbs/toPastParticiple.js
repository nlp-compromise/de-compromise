const seperable = /^(ab|an|auf|bei|ein|her|hin|los|mit|nach|zusammen|vor|weg|zurück|zu|blau|nieder|um|frei|klein|durch|hohn|lieb|hoch|hier|hops|kaputt|krank|lahm|davon|dar|fein|fehl|daher|dahin|dran|fest|fort|weiter|davor|gleich|heim|nahe|rein|schwarz|tot)/
const inseperable = /^(be|emp|ent|er|ge|miss|ver|zer)/
// this one is strange, and doesn't compress well
const toPastParticiple = function (str) {
  if (str.endsWith('innen')) {
    str = str.replace(/innen$/, 'onnen')
    return str
  }
  if (str.endsWith('annen')) {
    str = str.replace(/annen$/, 'annt')
    return str
  }
  if (str.endsWith('inden')) {
    str = str.replace(/inden$/, 'unden')
    return str
  }
  if (str.endsWith('tten')) {
    str = str.replace(/tten$/, 'ttet')
    return str
  }
  // non '-en' suffixes
  str = str.replace(/färben$/, 'färbt')
  str = str.replace(/enken$/, 'acht')
  str = str.replace(/eln$/, 'elt')
  str = str.replace(/ten$/, 'tet')
  str = str.replace(/ern$/, 'ert')
  str = str.replace(/enden$/, 'andt')
  str = str.replace(/ören$/, 'ört')
  str = str.replace(/achen$/, 'acht')

  if (str.endsWith('ten')) {
    str = str.replace(/tet$/, 't')
    return str
  }
  if (str.endsWith('ieren')) {    // always weak
    str = str.replace(/en$/, 't')
    return str //no 'ge-'
  }
  // put a 'ge' somewhere
  if (seperable.test(str)) {
    str = str.replace(seperable, '$1ge')
    str = str.replace(/en$/, 't')
    return str
  }
  if (inseperable.test(str)) {
    str = str.replace(/en$/, 't')
    return str
  }
  // otherwse, add 'ge-'
  if (!str.match(/^(über|unt|v|au|miß)/)) {
    str = 'ge' + str
  }

  // keep -en ending?
  if (/eiben$/.test(str)) {
    return str
  }
  if (/ießen$/.test(str)) {
    return str.replace(/ießen$/, 'ossen')
  }
  if (/ingen$/.test(str)) {
    return str.replace(/ingen$/, 'ungen')
  }
  if (/ehen$/.test(str)) {
    return str.replace(/ehen$/, 'anden')
  }
  if (/echen$/.test(str)) {
    return str.replace(/echen$/, 'ochen')
  }
  str = str.replace(/en$/, 't')

  return str
}
export default toPastParticiple



let bads = []
import pairs from '/Users/spencer/mountain/de-compromise/data/models/verbs/past-participle.js'
let right = 0
pairs.forEach(a => {
  let [inf, prt] = a
  let have = toPastParticiple(inf)
  if (have === prt) {
    right += 1
  } else {
    if (prt.endsWith('en') && !have.endsWith('en')) {
      a.push(have)
      let suff = inf.substring(inf.length - 5, inf.length)
      bads.push(suff)
    }
  }
})


const topk = function (arr) {
  let obj = {}
  arr.forEach(a => {
    obj[a] = obj[a] || 0
    obj[a] += 1
  })
  let res = Object.keys(obj).map(k => [k, obj[k]])
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
}

const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};
console.log(percent(right, pairs.length) + '%')
// ["nachsenden", "nachgesandt"],
// [ 'zurückstutzen', 'zurückgestutzt', 'zugerückstutzt' ]
console.log(toPastParticiple("verfließen"))

console.log(topk(bads))
