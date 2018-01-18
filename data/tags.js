module.exports = {
  Substantiv: { //noun
    enemy: ['Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Praposition']
  },
  MannlichSubst: { //masculine noun
    isA: 'Substantiv',
    enemy: ['Feminin', 'Sachlich']
  },
  FemininSubst: { //feminine noun
    isA: 'Substantiv',
    enemy: ['Mannlich', 'Sachlich']
  },
  SachlichSubst: { //neuter noun
    isA: 'Substantiv',
    enemy: []
  },
  Pronomen: { //pronoun
    isA: 'Substantiv',
    enemy: []
  },
  Determinativ: { //determiner
    enemy: []
  },
  Mensch: { //Person
    isA: 'Substantiv'
  },

  Zahl: { //value
    enemy: ['Substantiv', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Praposition']
  },

  Verb: { //verb
    enemy: ['Substantiv', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Praposition']
  },
  Infinitiv: { //infinitive verb
    isA: 'Verb',
    enemy: []
  },
  Hilfsverb: { //Auxiliary Verb
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
