export default {
  Verb: {
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    is: 'Verb',
    not: ['PastTense'],
  },
  Infinitive: {
    is: 'PresentTense',
    not: ['Gerund'],
  },
  Imperative: {
    is: 'Infinitive',
  },
  Subjunctive: {
    is: 'Verb',
  },
  Participle: {
    is: 'Verb',
  },
  Gerund: {
    is: 'PresentTense',
    not: ['Copula'],
  },
  PastTense: {
    is: 'Verb',
    not: ['PresentTense', 'Gerund'],
  },
  Copula: {
    is: 'Verb',
  },
  Modal: {
    is: 'Verb',
    not: ['Infinitive'],
  },
  PerfectTense: {
    is: 'Verb',
    not: ['Gerund'],
  },
  Pluperfect: {
    is: 'Verb',
  },
  PhrasalVerb: {
    is: 'Verb',
  },
  Particle: {
    is: 'PhrasalVerb',
    not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
  },
  Auxiliary: {
    is: 'Verb',
    not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
  },
  FirstPerson: {
    is: 'Verb'
  },
  SecondPerson: {
    is: 'Verb'
  },
  ThirdPerson: {
    is: 'Verb'
  },
}
