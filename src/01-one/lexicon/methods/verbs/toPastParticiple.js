const seperable = /^(ab|an|auf|bei|ein|her|hin|los|mit|nach|vor|weg|zu|zurück)/
const inseperable = /^(be|emp|ent|er|ge|miss|ver|zer)/
// this one is strange, and doesn't compress well
const toPastParticiple = function (str) {
  // weak verbs - “ge-” and “-t”
  // if (str.endsWith('über')) {
  //   return str
  // }
  if (str.endsWith('ieren')) {    // always weak
    str = str.replace(/en$/, 't')
    return str //no 'ge-'
  }
  if (inseperable.test(str)) {
    str = str.replace(/en$/, 't')
    return str
  }
  // put a 'ge' somewhere
  if (seperable.test(str)) {
    str = str.replace(seperable, '$1ge')
    str = str.replace(/en$/, 't')
    return str
  }
  str = 'ge' + str
  str = str.replace(/en$/, 't')
  return str
}
export default toPastParticiple



// import pairs from '/Users/spencer/mountain/de-compromise/data/models/verbs/past-participle.js'
// let right = 0
// pairs.forEach(a => {
//   let [inf, prt] = a
//   if (toPastParticiple(inf) === prt) {
//     right += 1
//   } else {
//     console.log(inf)
//   }
// })

// const percent = (part, total) => {
//   let num = (part / total) * 100;
//   num = Math.round(num * 10) / 10;
//   return num;
// };
// console.log(percent(right, pairs.length) + '%')

// console.log(toPastParticiple("abfeuern"))
