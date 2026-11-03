export default {
  Date: {
    aliases: [null, 'Datum'],
    not: ['Verb', 'Adverb', 'Adjective'],
  },
  Month: {
    aliases: [null, 'Monat'],
    is: 'Singular',
    also: ['Date'],
    not: ['Year', 'WeekDay', 'Time'],
  },
  WeekDay: {
    aliases: [null, 'Wochentag'],
    is: 'Noun',
    also: ['Date'],
  },
  Year: {
    aliases: [null, 'Jahr'],
    is: 'Date',
    not: ['RomanNumeral'],
  },
  FinancialQuarter: {
    aliases: [null, 'Quartal'],
    is: 'Date',
    not: 'Fraction',
  },
  // 'easter'
  Holiday: {
    aliases: [null, 'Feiertag'],
    is: 'Date',
    also: ['Noun'],
  },
  // 'summer'
  Season: {
    aliases: [null, 'Jahreszeit'],
    is: 'Date',
  },
  Timezone: {
    aliases: [null, 'Zeitzone'],
    is: 'Noun',
    also: ['Date'],
    not: ['ProperNoun'],
  },
  Time: {
    aliases: [null, 'Uhrzeit'],
    is: 'Date',
    not: ['AtMention'],
  },
  // 'months'
  Duration: {
    aliases: [null, 'Dauer'],
    is: 'Noun',
    also: ['Date'],
  },
}
