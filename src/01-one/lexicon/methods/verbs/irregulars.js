import { prefixes } from './custom/rules.js'

// hand-curated conjugations for the highest-frequency irregular verbs.
// the trained models lose some of these to compression, and they are
// too important to get wrong.
// person order: [ich, du, er/sie/es, wir, ihr, sie]
const irregulars = {
  sein: {
    present: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
    past: ['war', 'warst', 'war', 'waren', 'wart', 'waren'],
    subj1: ['sei', 'seist', 'sei', 'seien', 'seiet', 'seien'],
    subj2: ['wäre', 'wärst', 'wäre', 'wären', 'wärt', 'wären'],
    imperative: ['sei', 'seid'],
    pastParticiple: 'gewesen',
    presentParticiple: 'seiend',
  },
  haben: {
    present: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
    past: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'],
    subj2: ['hätte', 'hättest', 'hätte', 'hätten', 'hättet', 'hätten'],
    imperative: ['hab', 'habt'],
    pastParticiple: 'gehabt',
  },
  werden: {
    present: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
    past: ['wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden'],
    subj2: ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden'],
    imperative: ['werde', 'werdet'],
    pastParticiple: 'geworden',
  },
  tun: {
    present: ['tue', 'tust', 'tut', 'tun', 'tut', 'tun'],
    past: ['tat', 'tatest', 'tat', 'taten', 'tatet', 'taten'],
    subj2: ['täte', 'tätest', 'täte', 'täten', 'tätet', 'täten'],
    pastParticiple: 'getan',
    presentParticiple: 'tuend',
  },
  wissen: {
    present: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'],
    past: ['wusste', 'wusstest', 'wusste', 'wussten', 'wusstet', 'wussten'],
    subj2: ['wüsste', 'wüsstest', 'wüsste', 'wüssten', 'wüsstet', 'wüssten'],
    pastParticiple: 'gewusst',
  },
  essen: {
    present: ['esse', 'isst', 'isst', 'essen', 'esst', 'essen'],
    past: ['aß', 'aßest', 'aß', 'aßen', 'aßt', 'aßen'],
    subj2: ['äße', 'äßest', 'äße', 'äßen', 'äßet', 'äßen'],
    imperative: ['iss', 'esst'],
    pastParticiple: 'gegessen',
  },
  lesen: {
    present: ['lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'],
    past: ['las', 'lasest', 'las', 'lasen', 'last', 'lasen'],
    imperative: ['lies', 'lest'],
    pastParticiple: 'gelesen',
  },
  geben: {
    present: ['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'geben'],
    past: ['gab', 'gabst', 'gab', 'gaben', 'gabt', 'gaben'],
    subj2: ['gäbe', 'gäbest', 'gäbe', 'gäben', 'gäbet', 'gäben'],
    imperative: ['gib', 'gebt'],
    pastParticiple: 'gegeben',
  },
  heißen: {
    pastParticiple: 'geheißen',
  },
  // modal verbs
  können: {
    present: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'],
    past: ['konnte', 'konntest', 'konnte', 'konnten', 'konntet', 'konnten'],
    subj2: ['könnte', 'könntest', 'könnte', 'könnten', 'könntet', 'könnten'],
    pastParticiple: 'gekonnt',
  },
  müssen: {
    present: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'],
    past: ['musste', 'musstest', 'musste', 'mussten', 'musstet', 'mussten'],
    subj2: ['müsste', 'müsstest', 'müsste', 'müssten', 'müsstet', 'müssten'],
    pastParticiple: 'gemusst',
  },
  dürfen: {
    present: ['darf', 'darfst', 'darf', 'dürfen', 'dürft', 'dürfen'],
    past: ['durfte', 'durftest', 'durfte', 'durften', 'durftet', 'durften'],
    subj2: ['dürfte', 'dürftest', 'dürfte', 'dürften', 'dürftet', 'dürften'],
    pastParticiple: 'gedurft',
  },
  mögen: {
    present: ['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'],
    past: ['mochte', 'mochtest', 'mochte', 'mochten', 'mochtet', 'mochten'],
    subj2: ['möchte', 'möchtest', 'möchte', 'möchten', 'möchtet', 'möchten'],
    pastParticiple: 'gemocht',
  },
  wollen: {
    present: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'],
    past: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
    subj2: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
    pastParticiple: 'gewollt',
  },
  sollen: {
    present: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'],
    past: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
    subj2: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
    pastParticiple: 'gesollt',
  },
  // mixed verbs — weak endings, strong vowel change
  denken: {
    past: ['dachte', 'dachtest', 'dachte', 'dachten', 'dachtet', 'dachten'],
    subj2: ['dächte', 'dächtest', 'dächte', 'dächten', 'dächtet', 'dächten'],
    pastParticiple: 'gedacht',
  },
  bringen: {
    past: ['brachte', 'brachtest', 'brachte', 'brachten', 'brachtet', 'brachten'],
    subj2: ['brächte', 'brächtest', 'brächte', 'brächten', 'brächtet', 'brächten'],
    pastParticiple: 'gebracht',
  },
  kennen: {
    past: ['kannte', 'kanntest', 'kannte', 'kannten', 'kanntet', 'kannten'],
    pastParticiple: 'gekannt',
  },
  nennen: {
    past: ['nannte', 'nanntest', 'nannte', 'nannten', 'nanntet', 'nannten'],
    pastParticiple: 'genannt',
  },
  rennen: {
    past: ['rannte', 'ranntest', 'rannte', 'rannten', 'ranntet', 'rannten'],
    pastParticiple: 'gerannt',
  },
  brennen: {
    past: ['brannte', 'branntest', 'brannte', 'brannten', 'branntet', 'brannten'],
    pastParticiple: 'gebrannt',
  },
  senden: {
    past: ['sandte', 'sandtest', 'sandte', 'sandten', 'sandtet', 'sandten'],
    pastParticiple: 'gesandt',
  },
  wenden: {
    past: ['wandte', 'wandtest', 'wandte', 'wandten', 'wandtet', 'wandten'],
    pastParticiple: 'gewandt',
  },
}

const inseparable = /^(be|emp|ent|er|ge|miss|ver|zer|wiederer)/

// 'verstehen' → ver + stehen,  'aufstehen' → auf + stehen
const find = function (str) {
  if (irregulars.hasOwnProperty(str)) {
    return { base: irregulars[str], prefix: '', separable: false }
  }
  let m = str.match(inseparable)
  if (m && irregulars.hasOwnProperty(str.substring(m[0].length))) {
    return { base: irregulars[str.substring(m[0].length)], prefix: m[0], separable: false }
  }
  for (let i = 0; i < prefixes.length; i += 1) {
    let p = prefixes[i]
    if (str.startsWith(p) && irregulars.hasOwnProperty(str.substring(p.length))) {
      return { base: irregulars[str.substring(p.length)], prefix: p, separable: true }
    }
  }
  return null
}

// returns conjugated forms for one tense, or null.
// tense: present | past | subj1 | subj2 | imperative | pastParticiple | presentParticiple
const getIrregular = function (str, tense) {
  let found = find(str)
  if (!found || !found.base[tense]) {
    return null
  }
  let { base, prefix, separable } = found
  let forms = base[tense]
  if (typeof forms === 'string') {
    // participles - 'auf' + 'gestanden', but 'ver' + 'standen'
    if (tense === 'pastParticiple' && separable === false && prefix) {
      return prefix + forms.replace(/^ge/, '')
    }
    return prefix + forms
  }
  return forms.map(f => prefix + f)
}

// form → infinitive, for root-recovery
let toInfinitive = {}
Object.keys(irregulars).forEach(inf => {
  Object.keys(irregulars[inf]).forEach(tense => {
    let forms = irregulars[inf][tense]
    forms = typeof forms === 'string' ? [forms] : forms
    forms.forEach(w => {
      if (!toInfinitive.hasOwnProperty(w)) {
        toInfinitive[w] = inf
      }
    })
  })
})

export default getIrregular
export { toInfinitive }
