module.exports = {
  Substantiv: {
    //noun
    is: [],
    enemy: ['Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Praposition']
  },
  MannlichSubst: {
    //masculine noun
    is: ['Substantiv'],
    enemy: ['Feminin', 'Sachlich']
  },
  FemininSubst: {
    //feminine noun
    is: ['Substantiv'],
    enemy: ['Mannlich', 'Sachlich']
  },
  SachlichSubst: {
    //neuter noun
    is: ['Substantiv'],
    enemy: []
  },

  Pronomen: {
    //pronoun
    is: ['Substantiv'],
    enemy: []
  },
  Determinativ: {
    //determiner
    is: [],
    enemy: []
  },

  Zahl: {
    //value
    is: [],
    enemy: [
      'Substantiv',
      'Adjektiv',
      'Adverb',
      'Artikel',
      'Bindewort',
      'Praposition'
    ]
  },

  Verb: {
    //verb
    is: [],
    enemy: [
      'Substantiv',
      'Adjektiv',
      'Adverb',
      'Artikel',
      'Bindewort',
      'Praposition'
    ]
  },
  Infinitiv: {
    //infinitive verb
    is: ['Verb'],
    enemy: []
  },
  Hilfsverb: {
    //Auxiliary Verb
    is: [],
    enemy: [
      'Substantiv',
      'Adjektiv',
      'Adverb',
      'Artikel',
      'Bindewort',
      'Praposition'
    ]
  },

  Adjektiv: {
    //adjective
    is: [],
    enemy: [
      'Substantiv',
      'Verb',
      'Adverb',
      'Artikel',
      'Bindewort',
      'Praposition'
    ]
  },
  Adverb: {
    //adverb
    is: [],
    enemy: [
      'Substantiv',
      'Verb',
      'Adjektiv',
      'Artikel',
      'Bindewort',
      'Praposition'
    ]
  },
  Artikel: {
    //article
    is: [],
    enemy: [
      'Substantiv',
      'Verb',
      'Adjektiv',
      'Adverb',
      'Bindewort',
      'Praposition'
    ]
  },
  Bindewort: {
    //conjunction
    is: [],
    enemy: [
      'Substantiv',
      'Verb',
      'Adjektiv',
      'Adverb',
      'Artikel',
      'Praposition'
    ]
  },
  Praposition: {
    //preposition
    is: [],
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort']
  },
  Url: {
    is: [],
    enemy: []
  }
};
