const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord']

export default {
  Adjective: {
    aliases: [null, 'Adjektiv'],
    not: ['Noun', 'Verb', 'Adverb', 'Value'],
  },
  Comparable: {
    aliases: [null, 'Steigerbar'],
    is: 'Adjective',
  },
  Comparative: {
    aliases: [null, 'Komparativ'],
    is: 'Adjective',
  },
  Superlative: {
    aliases: [null, 'Superlativ'],
    is: 'Adjective',
    not: ['Comparative'],
  },
  NumberRange: {
    aliases: [null, 'Zahlenbereich'],
  },
  Adverb: {
    not: ['Noun', 'Verb', 'Adjective', 'Value'],
  },

  Determiner: {
    aliases: [null, 'Artikel', 'Determinativ'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
  },
  Conjunction: {
    aliases: [null, 'Konjunktion'],
    not: anything,
  },
  Preposition: {
    aliases: [null, 'Präposition'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    aliases: [null, 'Fragewort'],
    not: ['Determiner'],
  },
  Currency: {
    aliases: [null, 'Währung'],
    is: 'Noun',
  },
  Expression: {
    aliases: [null, 'Interjektion'],
    not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
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
  HashTag: {},
  AtMention: {
    aliases: [null, 'Erwähnung'],
    is: 'Noun',
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
    not: ['Verb', 'Adjective', 'Noun', 'Value'],
  },
}
