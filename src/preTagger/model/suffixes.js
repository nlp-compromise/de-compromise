const rb = 'Adverb'
const nn = 'Noun'
const vb = 'Verb'
const jj = 'Adjective'
const ord = 'Ordinal'
const card = 'Cardinal'


export default [
  null,
  {
    // one-letter suffixes
    s: nn,
    l: nn,
    a: nn,
    k: nn,
    d: nn,
    z: nn,
  },
  {
    // two-letter suffixes
    ig: jj,
    ls: rb,
    // er: nn,
    el: nn,
    et: vb,
    gt: vb,
    lt: vb,
    // ht: vb,
    'ßt': vb
  },
  {
    // three-letter suffixes
    che: jj,
    ige: jj,
    // ger: jj,
    tig: jj,
    end: jj,
    // mal: rb,
    hin: rb,
    ung: nn,
    ion: nn,
    ter: nn,
    ert: vb,
    tet: vb,
    // ben: vb,
    // ren: vb,
    // fen: vb,
    // men: vb,
    igt: vb,
    tzt: vb,
    det: vb,
    elt: vb,
    ete: vb
  },
  {
    // four-letter suffixes
    chen: jj,
    lich: jj,
    igen: jj,
    cher: jj,
    ende: jj,
    isch: jj,
    enen: jj,
    tige: jj,
    tens: rb,
    mals: rb,
    rung: nn,
    iert: vb,
    eben: vb,
    ehen: vb,
    mmen: vb,
    zehn: card//10s
    // lten: vb,
    // ssen: vb
  },
  {
    // five-letter suffixes
    ische: jj,
    liche: jj,
    // enden: jj,
    tlich: jj,
    // tigen: jj,
    stens: rb,
    falls: rb,
    weise: rb,
    seits: rb,
    ungen: nn,
    erung: nn,
    ieren: vb
  },
  {
    // six-letter suffixes
    ischen: jj,
    lichen: jj,
    tische: jj,
    nische: jj,
    zehnte: ord,
    zigste: ord,
    ßigste: ord,
  },
  {
    // seven-letter suffixes
    tischen: jj,
    tlichen: jj,
    nischen: jj,
    zwanzig: card,//20
    dreiβig: card,//30
    vierzig: card,//40
    fünfzig: card,//50
    sechzig: card, //60
    siebzig: card, //70
    achtzig: card, //80
    neunzig: card, //90
  },
  // eight-letter suffixes
  {

  },
  // nine-letter suffixes
  {
  },
  // ten-letter suffixes
  {
    hundertste: ord,
    tausendste: ord,
    millionste: ord
  },
]