module.exports = {
  Substantiv: { //noun
    enemy: ['Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Präposition']
  },
  Männlich: { //masculine noun
    downward: ['substantiv']
  },
  Feminin: { //feminine noun
    downward: ['substantiv']
  },
  Sächlich: { //neuter noun
    downward: ['substantiv']
  },
  Pronomen: { //pronoun
    downward: ['substantiv']
  },

  Verb: { //verb
    enemy: ['Substantiv', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Präposition']
  },
  Adjektiv: { //adjective
    enemy: ['Substantiv', 'Verb', 'Adverb', 'Artikel', 'Bindewort', 'Präposition']
  },
  Adverb: { //adverb
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Artikel', 'Bindewort', 'Präposition']
  },
  Artikel: { //article
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Bindewort', 'Präposition']
  },
  Bindewort: { //conjunction
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Präposition']
  },
  Präposition: { //preposition
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort']
  },
  Url: {},
};
