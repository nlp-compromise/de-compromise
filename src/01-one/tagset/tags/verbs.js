// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Verb: {
  },
  PresentTense: {
    aliases: [null, 'Präsens'],
    not: ['PastTense'],
  },
  Infinitive: {
    aliases: [null, 'Infinitiv'],
  },
  Imperative: {
    aliases: [null, 'Imperativ'],
    is: 'Infinitive',
    not: undefined,
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
  },
  PastTense: {
    aliases: [null, 'Vergangenheit'],
    not: ['PresentTense', 'Gerund'],
  },
  Copula: {
    aliases: [null, 'Kopula'],
  },
  Modal: {
    aliases: [null, 'Modalverb'],
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
  },
  Particle: {
    aliases: [null, 'Verbpartikel'],
  },
  Auxiliary: {
    aliases: [null, 'Hilfsverb'],
  },
  FirstPerson: {
    aliases: [null, 'ErstePerson'],
    is: 'Verb',
  },
  SecondPerson: {
    aliases: [null, 'ZweitePerson'],
    is: 'Verb',
  },
  ThirdPerson: {
    aliases: [null, 'DrittePerson'],
    is: 'Verb',
  },
  FirstPersonPlural: {
    aliases: [null, 'ErstePersonPlural'],
    is: 'Verb',
  },
  SecondPersonPlural: {
    aliases: [null, 'ZweitePersonPlural'],
    is: 'Verb',
  },
  ThirdPersonPlural: {
    aliases: [null, 'DrittePersonPlural'],
    is: 'Verb',
  },
}
