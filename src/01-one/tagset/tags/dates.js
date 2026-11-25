// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Date: {
    aliases: [null, 'Datum'],
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
    not: undefined,
  },
  Year: {
    aliases: [null, 'Jahr'],
    not: ['RomanNumeral'],
  },
  FinancialQuarter: {
    aliases: [null, 'Quartal'],
    not: 'Fraction',
  },
  Holiday: {
    aliases: [null, 'Feiertag'],
  },
  Season: {
    aliases: [null, 'Jahreszeit'],
    not: undefined,
  },
  Timezone: {
    aliases: [null, 'Zeitzone'],
    is: 'Noun',
    also: ['Date'],
  },
  Time: {
    aliases: [null, 'Uhrzeit'],
    not: ['AtMention'],
  },
  Duration: {
    aliases: [null, 'Dauer'],
    is: 'Noun',
    also: ['Date'],
  },
}
