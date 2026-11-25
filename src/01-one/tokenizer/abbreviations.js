// abbreviations, and the other language-specific parts of the sentence-parser
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default {
  // these end a sentence, when one of the 'starters' comes next
  abbreviations: toObj(`
    dr prof dipl ing med jur rer nat phil hr fr fa hrsg inh univ hbf bhf
    bzw ggf evtl inkl exkl zzgl ca vgl sog bzgl bspw bsp ggü lt gem allg bes
    einschl ausschl entspr ehem geb gest verh gegr mind zus zw od
    nr abs kap anm abb tab bd aufl ebd ff resp tel st co ltd vs
    mio mrd tsd mwst jh jhd chr min std rd mtl
    tägl monatl jährl nördl südl östl westl
    mo di sa usw usf etc
    jan feb mär apr jun jul aug sep sept okt nov dez
  `),
  // 'mi', 'do' and 'so' are real words - 'es ist so.'
  conditional: /(?:\s(?:am|bis|und|von|ab|jeden) |, )(?:Mi|Do|So)\. *$/,
  // these end a sentence, when any capital comes next
  enders: ['usw', 'usf', 'etc'],
  // 'Hauptstr.'
  suffix: /str$/,
  // german has no one-letter words - 'z. B.', 'i. d. R.'
  singleLetters: true,
  // '3.' is often 'third' - 'am 3. Mai'
  ordinals: true,
  // .. when it follows one of these - 'der 3. Mann'
  ordinalAfter: `am im vom zum beim zur der die das den dem des ein eine einen einem einer
    jeder jede jedes jeden mein meine meinen sein seine seinen ihr ihre ihren unser unsere unseren
    und bis oder ab seit nach v.`.split(/\s+/),
  // .. or comes before one of these - '3. Mai'
  months: `Januar Jänner Februar März April Mai Juni Juli August September Oktober November Dezember
    Jan Feb Mär Apr Jun Jul Aug Sep Sept Okt Nov Dez`.split(/\s+/),
  // nouns are capitalised, so a capital letter does not mean a new sentence
  nounCaps: true,
  // .. but these words do -
  starters: `Der Die Das Den Dem Ein Eine Einer Kein Keine Er Sie Es Ich Du Wir Ihr Man
    Wer Was Wie Wo Wann Warum Und Aber Doch Oder Denn Da Dort Hier Dann Danach Nun Also Auch
    Heute Morgen Jetzt Später Damals Seitdem Trotzdem Deshalb Außerdem Leider Vielleicht
    Im In Am Ab Seit Mit Für Von Nach Auf Aus Bei Um Zum Zur Wenn Weil Als Ob
    Beide Bitte Alle Alles Viele Niemand Jemand Nichts Etwas Zwei Drei Ja Nein
    Diese Dieser Dieses Mein Meine Dein Deine Sein Seine Ihre Unser Unsere`.split(/\s+/),
  quotes: [['„', '“'], ['»', '«'], ['"', '"'], ['(', ')']],
  // .. and a capital after '...' says nothing
  ellipsis: false,
}
