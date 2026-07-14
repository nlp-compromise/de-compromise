const separablePrefixes = '(ab|an|auf|aus|bei|ein|fest|fort|her|heraus|hervor|hin|hinzu|los|mit|nach|nieder|vor|voraus|weg|weiter|zu|zurecht|zurück|zusammen|zuteil)'

const postTagger = function (doc) {
  // eine as 1 or the
  doc.match('eine #Value').tag('TextValue', 'eine-value')
  // 6.30 Uhr
  doc.match('#Value uhr').tag('Time', 'time-Uhr')
  // a value before a currency is money - '12,5 Euro'
  doc.match('[#Value] #Currency', 0).tag('Money', 'value-currency')

  // prenominal possessive is a determiner - 'mein Bruder', 'seine kleine Schwester'
  doc.match('[(mein|dein|sein|ihr|unser|euer)] #Adjective? #Noun', 0).tag('Determiner', 'possessive-det')
  doc.match('[#Possessive] #Adjective? #Noun', 0).tag('Determiner', 'possessive-det')

  // 'weiß' beside a pronoun is wissen, not white - 'das weiß ich'
  doc.match('[weiß] #Pronoun', 0).tag('PresentTense', 'weiß-pronoun')
  doc.match('#Pronoun [weiß]', 0).tag('PresentTense', 'pronoun-weiß')

  // a verb between a determiner and a noun is an inflected adjective - 'das schnelle Auto'
  doc.match('#Determiner [(#Verb && !#Infinitive && /e[nrsm]?$/)] (#Noun && !#Pronoun)', 0).tag('Adjective', 'det-adj-noun')

  // a determiner with no noun after it is a pronoun - 'das ist gut', 'alle außer ihm'
  doc.match('[#Determiner] (#Verb|#Preposition)', 0).tag('Pronoun', 'det-pronoun')

  // modal verbs - the infinitive goes to the end of the clause:
  // dürfen (may), können (can), mögen (like), müssen (must), sollen (should), wollen (want)
  doc.match('[{dürfen}] * #Infinitive', 0).tag('Modal', 'dürfen-verb')
  doc.match('[{können}] * #Infinitive', 0).tag('Modal', 'können-verb')
  doc.match('[{mögen}] * #Infinitive', 0).tag('Modal', 'mögen-verb')
  doc.match('[{müssen}] * #Infinitive', 0).tag('Modal', 'müssen-verb')
  doc.match('[{sollen}] * #Infinitive', 0).tag('Modal', 'sollen-verb')
  doc.match('[{wollen}] * #Infinitive', 0).tag('Modal', 'wollen-verb')

  // auxiliary + participle at the end of the clause (Satzklammer):
  // 'sie hat gestern ein Buch gelesen', 'er ist nach Hause gegangen'
  doc.match('[{haben}] * #Participle', 0).tag('Auxiliary', 'haben-participle')
  doc.match('[{haben}] * #Infinitive', 0).tag('Auxiliary', 'haben-infinitive')
  doc.match('[{sein}] * #Participle', 0).ifNo('#Determiner').tag('Auxiliary', 'sein-participle')
  // werden + infinitive is the future tense - 'wir werden nach Berlin fahren'
  doc.match('[{werden}] * #Infinitive', 0).tag('Auxiliary', 'werden-future')
  // werden + participle is the passive - 'das Buch wird gelesen'
  doc.match('[{werden}] * #Participle', 0).tag('Auxiliary', 'werden-passive')

  // a separable verb-prefix, at the end of the clause - 'ich stehe um sieben Uhr auf'
  doc.match('#Verb * [#Preposition]$', 0).match(separablePrefixes).tag('Particle', 'separable-prefix')
}
export default postTagger