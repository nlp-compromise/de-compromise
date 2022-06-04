import test from 'tape'
import nlp from '../_lib.js'
let here = '[de-number-ordinal] '
nlp.verbose(false)

let arr = [
  [1, 'erste', "eins"],
  [2, 'zweite', "zwei"],
  [3, 'dritte', "drei"],
  [4, 'vierte', "vier"],
  [5, 'fünfte', "fünf"],
  [6, 'sechste', "sechs"],
  [7, 'siebente', "sieben"], //siebte
  [8, 'achte', "acht"],
  [9, 'neunte', "neun"],
  [10, 'zehnte', "zehn"],
  [11, 'elfte', "elf"],
  [12, 'zwölfte', "zwölf"],
  [13, 'dreizehnte', "dreizehn"],
  [14, 'vierzehnte', "vierzehn"],
  [15, 'fünfzehnte', "fünfzehn"],
  [16, 'sechzehnte', "sechzehn"],
  [17, 'siebzehnte', "siebzehn"],
  [18, 'achtzehnte', "achtzehn"],
  [19, 'neunzehnte', "neunzehn"],
  [20, 'zwanzigste', "zwanzig"],
  [21, 'einundzwanzigste', "einundzwanzig"],
  [22, 'zweiundzwanzigste', "zweiundzwanzig"],
  [23, 'dreiundzwanzigste', "dreiundzwanzig"],
  [24, 'vierundzwanzigste', "vierundzwanzig"],
  [25, 'fünfundzwanzigste', "fünfundzwanzig"],
  [26, 'sechsundzwanzigste', "sechsundzwanzig"],
  [27, 'siebenundzwanzigste', "siebenundzwanzig"],
  [28, 'achtundzwanzigste', "achtundzwanzig"],
  [29, 'neunundzwanzigste', "neunundzwanzig"],
  [30, 'dreißigste', "dreiβig"],
  [31, 'einunddreißigste', "einunddreiβig"],
  [32, 'zweiunddreißigste', "zweiunddreiβig"],
  [40, 'vierzigste', "vierzig"],
  [50, 'fünfzigste', "fünfzig"],
  [60, 'sechzigste', "sechzig"],
  [70, 'siebzigste', "siebzig"],
  [80, 'achtzigste', "achtzig"],
  [90, 'neunzigste', "neunzig"],
  [100, 'hundertste', "einhundert"],
  [101, 'hunderterste', 'einhunderteins'],
  [200, 'zweihundertste', 'zweihundert'],
  [300, 'dreihundertste', 'dreihundert'],
  [400, 'vierhundertste', 'vierhundert'],
  [500, 'fünfhundertste', 'fünfhundert'],
  [600, 'sechshundertste', 'sechshundert'],
  [700, 'siebenhundertste', 'siebenhundert'],
  [800, 'achthundertste', 'achthundert'],
  [900, 'neunhundertste', 'neunhundert'],
  [1000, 'tausendste', 'eintausend'],
  [2000, 'zweitausendste', 'zweitausend'],
  [100000, 'hunderttausendste', 'hunderttausend'],
  [1000000, 'millionste', 'million'],
  [2000000, 'zweimillionste', 'zwei millionen'],
]

test('match:', function (t) {
  arr.forEach(a => {
    let [n, card, ord] = a
    t.equal(nlp(ord).has('#Ordinal'), true, here + ' [ordinal-tag] ' + ord)
    t.equal(nlp(card).has('#Cardinal'), true, here + ' [cardinal-tag] ' + card)
  })
  t.end()
})