// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Value: {
    aliases: [null, 'Zahl'],
  },
  Ordinal: {
    aliases: [null, 'Ordinalzahl'],
  },
  Cardinal: {
    aliases: [null, 'Kardinalzahl'],
  },
  Fraction: {
    aliases: [null, 'Bruchzahl'],
  },
  Multiple: {
    aliases: [null, 'Vielfaches'],
    is: 'Value',
  },
  RomanNumeral: {
    aliases: [null, 'RömischeZahl'],
    not: ['TextValue'],
  },
  TextValue: {
    aliases: [null, 'Zahlwort'],
    not: ['NumericValue'],
  },
  TextOrdinal: {
    is: 'TextValue',
    also: ['Ordinal'],
  },
  TextCardinal: {
    is: 'TextValue',
    also: ['Cardinal'],
  },
  NumericValue: {
    aliases: [null, 'Numerisch'],
    not: ['TextValue'],
  },
  Money: {
    aliases: [null, 'Geld'],
  },
  Percent: {
    aliases: [null, 'Prozent'],
  },
}
