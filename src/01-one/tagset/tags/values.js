export default {
  Value: {
    aliases: [null, 'Zahl'],
    not: ['Verb', 'Adjective', 'Adverb'],
  },
  Ordinal: {
    aliases: [null, 'Ordinalzahl'],
    is: 'Value',
    not: ['Cardinal'],
  },
  Cardinal: {
    aliases: [null, 'Kardinalzahl'],
    is: 'Value',
    not: ['Ordinal'],
  },
  Fraction: {
    aliases: [null, 'Bruchzahl'],
    is: 'Value',
    not: ['Noun'],
  },
  Multiple: {
    aliases: [null, 'Vielfaches'],
    is: 'Value',
  },
  RomanNumeral: {
    aliases: [null, 'RömischeZahl'],
    is: 'Cardinal',
    not: ['TextValue'],
  },
  TextValue: {
    aliases: [null, 'Zahlwort'],
    is: 'Value',
    not: ['NumericValue'],
  },
  TextOrdinal: {
    is: 'TextValue',
    also: ['Ordinal']
  },
  TextCardinal: {
    is: 'TextValue',
    also: ['Cardinal']
  },

  NumericValue: {
    aliases: [null, 'Numerisch'],
    is: 'Value',
    not: ['TextValue'],
  },
  Money: {
    aliases: [null, 'Geld'],
    is: 'Cardinal',
  },
  Percent: {
    aliases: [null, 'Prozent'],
    is: 'Value',
  },
}
