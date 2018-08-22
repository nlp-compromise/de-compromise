const cardinal = {
  ones: {
    null: 0,
    eins: 1,
    zwei: 2,
    drei: 3,
    vier: 4,
    fünf: 5,
    sechs: 6,
    sieben: 7,
    acht: 8,
    neun: 9
  },
  teens: {
    zehn: 10,
    elf: 11,
    zwölf: 12,
    dreizehn: 13,
    vierzehn: 14,
    fünfzehn: 15,
    sechzehn: 16,
    siebzehn: 17,
    achtzehn: 18,
    neunzehn: 19
  },
  tens: {
    zwanzig: 20,
    dreißig: 30,
    vierzig: 40,
    fünfzig: 50,
    sechzig: 60,
    siebzig: 70,
    achtzig: 80,
    neunzig: 90
  },
  multiples: {
    hundert: 1e2,
    tausend: 1e3,
    millionen: 1e6,
    milliarde: 1e9,
    billionen: 1e12
  }
};

// TODO: derive from numbers
const ordinal = {
  ones: {
    nullte: 0,
    erste: 1,
    zweite: 2,
    dritte: 3,
    vierte: 4,
    fünfte: 5,
    sechste: 6,
    siebte: 7,
    achte: 8,
    neunte: 9
  },
  teens: {
    zehnte: 10,
    elfte: 11,
    zwölfte: 12,
    dreizehnte: 13,
    vierzehnte: 14,
    fünfzehnte: 15,
    sechzehnte: 16,
    siebzehnte: 17,
    achtzehnte: 18,
    neunzehte: 19
  },
  tens: {
    zwanzigste: 20,
    dreißigste: 30,
    vierzigste: 40,
    fünfzigste: 50,
    sechzigste: 60,
    ziebzigste: 70,
    achtzigste: 80,
    neunzigste: 90
  },
  multiples: {
    hundertste: 1e2,
    tausendste: 1e3,
    millionste: 1e6,
    milliardste: 1e9,
    billionste: 1e12
  }
};

//used for the units
const prefixes = {
  yotta: 1,
  zetta: 1,
  exa: 1,
  peta: 1,
  tera: 1,
  giga: 1,
  mega: 1,
  kilo: 1,
  hecto: 1,
  deka: 1,
  deci: 1,
  centi: 1,
  milli: 1,
  micro: 1,
  nano: 1,
  pico: 1,
  femto: 1,
  atto: 1,
  zepto: 1,
  yocto: 1,

  square: 1,
  cubic: 1,
  quartic: 1
};

module.exports = {
  cardinal: cardinal,
  ordinal: ordinal,
  prefixes: prefixes
};
