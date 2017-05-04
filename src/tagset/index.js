module.exports = {
  Substantiv: { //noun
    enemy: ['Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Praposition']
  },
  Mannlich: { //masculine noun
    is: 'Substantiv',
    enemy: ['Feminin', 'Sachlich']
  },
  Feminin: { //feminine noun
    is: 'Substantiv',
    enemy: ['Mannlich', 'Sachlich']
  },
  Sachlich: { //neuter noun
    is: 'Substantiv',
    enemy: []
  },
  Pronomen: { //pronoun
    is: 'Substantiv',
    enemy: []
  },

  Verb: { //verb
    enemy: ['Substantiv', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Praposition']
  },
  Adjektiv: { //adjective
    enemy: ['Substantiv', 'Verb', 'Adverb', 'Artikel', 'Bindewort', 'Praposition']
  },
  Adverb: { //adverb
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Artikel', 'Bindewort', 'Praposition']
  },
  Artikel: { //article
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Bindewort', 'Praposition']
  },
  Bindewort: { //conjunction
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Praposition']
  },
  Praposition: { //preposition
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort']
  },
  Url: {
    enemy: [],
  },
};
