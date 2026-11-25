// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Adjective: {
    aliases: [null, 'Adjektiv'],
  },
  Comparable: {
    aliases: [null, 'Steigerbar'],
  },
  Comparative: {
    aliases: [null, 'Komparativ'],
  },
  Superlative: {
    aliases: [null, 'Superlativ'],
  },
  NumberRange: {
    aliases: [null, 'Zahlenbereich'],
  },
  Adverb: {
  },
  Determiner: {
    aliases: [null, 'Artikel', 'Determinativ'],
  },
  Conjunction: {
    aliases: [null, 'Konjunktion'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'],
  },
  Preposition: {
    aliases: [null, 'Präposition'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    aliases: [null, 'Fragewort'],
  },
  Currency: {
    aliases: [null, 'Währung'],
  },
  Expression: {
    aliases: [null, 'Interjektion'],
  },
  Abbreviation: {
    aliases: [null, 'Abkürzung'],
  },
  Url: {
    not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  PhoneNumber: {
    aliases: [null, 'Telefonnummer'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  HashTag: {
  },
  AtMention: {
    aliases: [null, 'Erwähnung'],
    not: ['HashTag', 'Email'],
  },
  Emoji: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Emoticon: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Email: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Acronym: {
    aliases: [null, 'Akronym'],
    not: ['Plural', 'RomanNumeral'],
  },
  Negative: {
    aliases: [null, 'Negation'],
    not: ['Noun', 'Adjective', 'Value'],
  },
  Condition: {
    aliases: [null, 'Bedingung'],
    is: undefined,
  },
}
