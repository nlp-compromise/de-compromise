import data from '/Users/spencer/mountain/de-compromise/learn/verb-dict/verbs-dict.json' assert { type: "json" };
// console.log(data)
import fs from 'fs'

// {
//   INF: 'schmecken',
//   PA1: 'schmeckend',
//   PA2: [ 'geschmeckt' ],
//   KJ1: {
//     S: { '1': 'schmecke', '2': 'schmeckest', '3': 'schmecke' },
//     P: { '1': 'schmecken', '2': 'schmecket', '3': 'schmecken' }
//   },
//   KJ2: {
//     S: { '1': 'schmeckte', '2': 'schmecktest', '3': 'schmeckte' },
//     P: { '1': 'schmeckten', '2': 'schmecktet', '3': 'schmeckten' }
//   },
//   'PRÄ': {
//     S: { '1': 'schmecke', '2': 'schmeckst', '3': 'schmeckt' },
//     P: { '1': 'schmecken', '2': 'schmeckt', '3': 'schmecken' }
//   },
//   PRT: {
//     S: { '1': 'schmeckte', '2': 'schmecktest', '3': 'schmeckte' },
//     P: { '1': 'schmeckten', '2': 'schmecktet', '3': 'schmeckten' }
//   },
//   IMP: { S: 'schmecke', P: 'schmeckt' }
// }

// console.log((Object.keys(data).length))
// console.dir(data['schmecken'], { depth: 5 })
console.dir(data['tanzen'], { depth: 5 })


let byInf = {}
Object.keys(data).forEach(inf => {
  if (data[inf]) {
    let o = data[inf]['PRT']
    if (o && o.S && o.S['1']) {
      byInf[inf] = [o.S['1'], o.S['2'], o.S['3'], o.P['1'], o.P['2'], o.P['3']]
    }
  }
})

fs.writeFileSync('./model.js', 'export default ' + JSON.stringify(byInf, null, 2))