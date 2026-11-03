// npm install papaparse --no-save
import Papa from 'papaparse'
import fs from 'node:fs'
const file = '/Users/spencer/mountain/de-compromise/learn/wiktionary/wiktionary-verbs.csv'
const csv = fs.readFileSync(file).toString()
const data = Papa.parse(csv, { header: true }).data

// names
// Infinitive: 'schmecken',
// 'Präsens_ich': 'schmecke',
// 'Präsens_du': 'schmeckst',
// 'Präsens_er, sie, es': 'schmeckt',
// 'Präteritum_ich': 'schmeckte',
// 'Partizip II': 'geschmeckt',
// 'Konjunktiv II_ich': 'schmeckte',
// 'Imperativ Singular': 'schmecke',
// 'Imperativ Plural': 'schmeckt',
// 'Hilfsverb: 'haben'

const out = {}
data.forEach(o => {
  const inf = o.Infinitive
  out[inf] = []
})

// let r = data.find(o => o.Infinitive === 'schmecken')
// console.log(r)
