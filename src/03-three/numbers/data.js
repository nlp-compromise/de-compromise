const data = {
  ones: [
    [1, 'eins', 'erste'],
    [2, 'zwei', 'zweite'],
    [3, 'drei', 'dritte'],
    [4, 'vier', 'vierte'],
    [5, 'fünf', 'fünfte'],
    [6, 'sechs', 'sechste'],
    [7, 'sieben', 'siebente'], //siebte
    [8, 'acht', 'achte'],
    [9, 'neun', 'neunte'],
  ],
  teens: [
    [10, 'zehn', 'zehnte'],
    [11, 'elf', 'elfte'],
    [12, 'zwölf', 'zwölfte'],
    [13, 'dreizehn', 'dreizehnte'],
    [14, 'vierzehn', 'vierzehnte'],
    [15, 'fünfzehn', 'fünfzehnte'],
    [16, 'sechzehn', 'sechzehnte'],
    [17, 'siebzehn', 'siebzehnte'],
    [18, 'achtzehn', 'achtzehnte'],
    [19, 'neunzehn', 'neunzehnte'],
  ],
  tens: [
    [20, 'zwanzig', 'zwanzigste'],
    [30, 'dreißig', 'dreißigste'],
    [40, 'vierzig', 'vierzigste'],
    [50, 'fünfzig', 'fünfzigste'],
    [60, 'sechzig', 'sechzigste'],
    [70, 'siebzig', 'siebzigste'],
    [80, 'achtzig', 'achtzigste'],
    [90, 'neunzig', 'neunzigste'],
  ],
  hundreds: [
    [100, 'einhundert', 'hundertste'],
    // [101, 'einhunderteins', 'hunderterste'],
    [200, 'zweihundert', 'zweihundertste'],
    [300, 'dreihundert', 'dreihundertste'],
    [400, 'vierhundert', 'vierhundertste'],
    [500, 'fünfhundert', 'fünfhundertste'],
    [600, 'sechshundert', 'sechshundertste'],
    [700, 'siebenhundert', 'siebenhundertste'],
    [800, 'achthundert', 'achthundertste'],
    [900, 'neunhundert', 'neunhundertste'],
  ],
  multiples: [
    [100, 'hundert', 'hundertste'],
    [1000, 'tausend', 'tausendste'],
    [100000, 'hunderttausend', 'hunderttausendste'],
    [1000000, 'million', 'millionste'],
  ]
}
// these are their own, capitalised nouns - 'zwei Millionen dreihunderttausend'
// [value, singular, plural, ordinal]
const bigNumbers = [
  [1e6, 'Million', 'Millionen', 'millionste'],
  [1e9, 'Milliarde', 'Milliarden', 'milliardste'],
  [1e12, 'Billion', 'Billionen', 'billionste'],
  [1e15, 'Billiarde', 'Billiarden', 'billiardste'],
]
// 'millionen' → 1000000
const scales = {}

const toCardinal = {}
const toOrdinal = {}
const toNumber = {}

Object.keys(data).forEach(k => {
  data[k].forEach(a => {
    const [num, w, ord] = a
    toCardinal[ord] = w
    toOrdinal[w] = ord
    toNumber[w] = num
  })
})

bigNumbers.forEach(a => {
  const [num, sing, plur, ord] = a
  scales[sing.toLowerCase()] = num
  scales[plur.toLowerCase()] = num
  toCardinal[ord] = sing.toLowerCase()
})

const isMultiple = new Set(data.multiples.map(a => a[1]))

// misc
toNumber.null = 0
toOrdinal.null = 'nullte'
toCardinal.nullte = 'null'
toNumber.ein = 1 // eins - ein
toNumber.hunderteins = 101
toCardinal.siebte = 'sieben'
toCardinal.hunderterste = 'hunderteins'
toOrdinal.hunderteins = 'hunderterste'


export { data, bigNumbers, scales, toCardinal, toOrdinal, toNumber, isMultiple }
