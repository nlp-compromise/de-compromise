export default [
  // #coolguy
  [/^#[a-zäöü0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

  // @spencermountain
  [/^@\w{2,}$/, 'AtMention'],

  // period-ones acronyms - f.b.i.
  [/^([A-ZÄÖÜ]\.){2}[A-ZÄÖÜ]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

  // ending-apostrophes
  [/.{3}[lkmnp]in['‘’‛‵′`´]$/, 'Gerund', "chillin'"],
  [/.{4}s['‘’‛‵′`´]$/, 'Possessive', "flanders'"],
]
