export default {
  Verb: {
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    aliases: [null, 'Präsens'],
    is: 'Verb',
    not: ['PastTense'],
  },
  Infinitive: {
    aliases: [null, 'Infinitiv'],
    is: 'PresentTense',
    not: ['Gerund'],
  },
  Imperative: {
    aliases: [null, 'Imperativ'],
    is: 'Infinitive',
  },
  Subjunctive: {
    aliases: [null, 'Konjunktiv'],
    is: 'Verb',
  },
  Participle: {
    aliases: [null, 'Partizip'],
    is: 'Verb',
  },
  Gerund: {
    is: 'PresentTense',
    not: ['Copula'],
  },
  // any past form - 'ging', and also 'gegangen'
  PastTense: {
    aliases: [null, 'Vergangenheit'],
    is: 'Verb',
    not: ['PresentTense', 'Gerund'],
  },
  Copula: {
    aliases: [null, 'Kopula'],
    is: 'Verb',
  },
  Modal: {
    aliases: [null, 'Modalverb'],
    is: 'Verb',
    not: ['Infinitive'],
  },
  PerfectTense: {
    aliases: [null, 'Perfekt'],
    is: 'Verb',
    not: ['Gerund'],
  },
  Pluperfect: {
    aliases: [null, 'Plusquamperfekt'],
    is: 'Verb',
  },
  PhrasalVerb: {
    aliases: [null, 'Partikelverb'],
    is: 'Verb',
  },
  // a separable prefix - the 'an' in 'ich rufe dich an'
  Particle: {
    aliases: [null, 'Verbpartikel'],
    is: 'PhrasalVerb',
    not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
  },
  Auxiliary: {
    aliases: [null, 'Hilfsverb'],
    is: 'Verb',
    not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
  },
  FirstPerson: {
    aliases: [null, 'ErstePerson'],
    is: 'Verb'
  },
  SecondPerson: {
    aliases: [null, 'ZweitePerson'],
    is: 'Verb'
  },
  ThirdPerson: {
    aliases: [null, 'DrittePerson'],
    is: 'Verb'
  },
}
