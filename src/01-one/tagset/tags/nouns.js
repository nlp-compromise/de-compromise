const entity = ['Person', 'Place', 'Organization']

export default {
  Noun: {
    aliases: [null, 'Nomen', 'Substantiv'],
    not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
  },
  Singular: {
    is: 'Noun',
    not: ['Plural'],
  },
  ProperNoun: {
    aliases: [null, 'Eigenname'],
    is: 'Noun',
  },
  Person: {
    is: 'Singular',
    also: ['ProperNoun'],
    not: ['Place', 'Organization', 'Date'],
  },
  FirstName: {
    aliases: [null, 'Vorname'],
    is: 'Person',
  },
  MaleName: {
    aliases: [null, 'Männername'],
    is: 'FirstName',
    not: ['FemaleName', 'LastName'],
  },
  FemaleName: {
    aliases: [null, 'Frauenname'],
    is: 'FirstName',
    not: ['MaleName', 'LastName'],
  },
  LastName: {
    aliases: [null, 'Nachname'],
    is: 'Person',
    not: ['FirstName'],
  },
  Honorific: {
    aliases: [null, 'Titel'],
    is: 'Noun',
    not: ['FirstName', 'LastName', 'Value'],
  },
  Place: {
    aliases: [null, 'Ort'],
    is: 'Singular',
    not: ['Person', 'Organization'],
  },
  Country: {
    aliases: [null, 'Land'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['City'],
  },
  City: {
    aliases: [null, 'Stadt'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['Country'],
  },
  Region: {
    is: 'Place',
    also: ['ProperNoun'],
  },
  Address: {
    aliases: [null, 'Adresse'],
    // is: 'Place',
  },
  Organization: {
    aliases: [null, 'Organisation'],
    is: 'ProperNoun',
    not: ['Person', 'Place'],
  },
  SportsTeam: {
    aliases: [null, 'Mannschaft'],
    is: 'Organization',
  },
  School: {
    aliases: [null, 'Schule'],
    is: 'Organization',
  },
  Company: {
    aliases: [null, 'Unternehmen'],
    is: 'Organization',
  },
  Plural: {
    is: 'Noun',
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'Unzählbar'],
    is: 'Noun',
  },
  Pronoun: {
    aliases: [null, 'Pronomen'],
    is: 'Noun',
    not: entity,
  },
  Actor: {
    is: 'Noun',
    not: entity,
  },
  Activity: {
    aliases: [null, 'Aktivität'],
    is: 'Noun',
    not: ['Person', 'Place'],
  },
  Unit: {
    aliases: [null, 'Einheit'],
    is: 'Noun',
    not: entity,
  },
  Demonym: {
    aliases: [null, 'Einwohnername'],
    is: 'Noun',
    also: ['ProperNoun'],
    not: entity,
  },
  // standalone — 'meinem' is #Possessive as both a determiner ('meinem Freund')
  // and a pronoun ('das ist meins')
  Possessive: {
    aliases: [null, 'Possessiv'],
  },
  // german genders
  MaleNoun: {
    aliases: [null, 'Maskulinum'],
    is: 'Noun',
    not: ['FemaleNoun', 'NeuterNoun'],
  },
  FemaleNoun: {
    aliases: [null, 'Femininum'],
    is: 'Noun',
    not: ['MaleNoun', 'NeuterNoun'],
  },
  NeuterNoun: {
    aliases: [null, 'Neutrum'],
    is: 'Noun',
    not: ['MaleNoun', 'FemaleNoun'],
  },
}
