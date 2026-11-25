// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Noun: {
    aliases: [null, 'Nomen', 'Substantiv'],
  },
  Singular: {
    not: ['Plural'],
  },
  ProperNoun: {
    aliases: [null, 'Eigenname'],
  },
  Person: {
  },
  FirstName: {
    aliases: [null, 'Vorname'],
  },
  MaleName: {
    aliases: [null, 'Männername'],
  },
  FemaleName: {
    aliases: [null, 'Frauenname'],
  },
  LastName: {
    aliases: [null, 'Nachname'],
  },
  Honorific: {
    aliases: [null, 'Titel'],
    is: 'Noun',
  },
  Place: {
    aliases: [null, 'Ort'],
  },
  Country: {
    aliases: [null, 'Land'],
  },
  City: {
    aliases: [null, 'Stadt'],
  },
  Region: {
  },
  Address: {
    aliases: [null, 'Adresse'],
  },
  Organization: {
    aliases: [null, 'Organisation'],
  },
  SportsTeam: {
    aliases: [null, 'Mannschaft'],
  },
  School: {
    aliases: [null, 'Schule'],
  },
  Company: {
    aliases: [null, 'Unternehmen'],
  },
  Plural: {
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'Unzählbar'],
  },
  Pronoun: {
    aliases: [null, 'Pronomen'],
  },
  Actor: {
    not: ['Person', 'Place', 'Organization'],
  },
  Activity: {
    aliases: [null, 'Aktivität'],
  },
  Unit: {
    aliases: [null, 'Einheit'],
  },
  Demonym: {
    aliases: [null, 'Einwohnername'],
  },
  Possessive: {
    aliases: [null, 'Possessiv'],
    is: undefined,
  },
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
