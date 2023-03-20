const rb = 'Adverb'
const nn = 'Noun'
const vb = 'Verb'
const jj = 'Adjective'
const ord = 'TextOrdinal'
const card = 'TextCardinal'


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
    // en: vb,
    ns: nn,
    ts: nn,
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
    ten: vb,
    eln: vb,
    ern: vb,
    gen: vb,
    fen: vb,
    // ben: vb,
    // ren: vb,
    // fen: vb,
    // men: vb,
    igt: vb,
    tzt: vb,
    det: vb,
    elt: vb,
    ete: vb,
    elf: card,//eleven
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
    llen: vb,
    ngen: vb,
    tzen: vb,
    hren: vb,
    cken: vb,
    ssen: vb,
    eßen: vb,
    hnen: vb,
    ufen: vb,
    lten: vb,
    hten: vb,
    zehn: card,//10s
    eins: card,
    zwei: card,
    drei: card,
    vier: card,
    fünf: card,
    acht: card,
    neun: card,
    zehn: card,
    // lten: vb,
    // ssen: vb
  },
  {
    // five-letter suffixes
    ische: jj,
    zwölf: card,
    sechs: card,
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
    ieren: vb,
  },
  {
    // six-letter suffixes
    ischen: jj,
    sieben: card,
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
    dreißig: card,//30
    vierzig: card,//40
    fünfzig: card,//50
    sechzig: card, //60
    siebzig: card, //70
    achtzig: card, //80
    neunzig: card, //90
    hundert: card,//100
    tausend: card,//1,000
  },
  // eight-letter suffixes
  {
    dreizehn: card,
    vierzehn: card,
    fünfzehn: card,
    sechzehn: card,
    siebzehn: card,
    achtzehn: card,
    neunzehn: card,

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