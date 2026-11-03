import test from 'tape'
import nlp from './_lib.js'
const here = '[de-aliases] '

// every german alias, and the tag it stands for
const aliases = {
  // nouns
  Nomen: 'Noun',
  Substantiv: 'Noun',
  Eigenname: 'ProperNoun',
  Vorname: 'FirstName',
  Männername: 'MaleName',
  Frauenname: 'FemaleName',
  Nachname: 'LastName',
  Titel: 'Honorific',
  Ort: 'Place',
  Land: 'Country',
  Stadt: 'City',
  Adresse: 'Address',
  Organisation: 'Organization',
  Mannschaft: 'SportsTeam',
  Schule: 'School',
  Unternehmen: 'Company',
  Unzählbar: 'Uncountable',
  Pronomen: 'Pronoun',
  Aktivität: 'Activity',
  Einheit: 'Unit',
  Einwohnername: 'Demonym',
  Possessiv: 'Possessive',
  Maskulinum: 'MaleNoun',
  Femininum: 'FemaleNoun',
  Neutrum: 'NeuterNoun',
  // verbs
  Präsens: 'PresentTense',
  Infinitiv: 'Infinitive',
  Imperativ: 'Imperative',
  Konjunktiv: 'Subjunctive',
  Partizip: 'Participle',
  Vergangenheit: 'PastTense',
  Kopula: 'Copula',
  Modalverb: 'Modal',
  Perfekt: 'PerfectTense',
  Plusquamperfekt: 'Pluperfect',
  Partikelverb: 'PhrasalVerb',
  Verbpartikel: 'Particle',
  Hilfsverb: 'Auxiliary',
  ErstePerson: 'FirstPerson',
  ZweitePerson: 'SecondPerson',
  DrittePerson: 'ThirdPerson',
  ErstePersonPlural: 'FirstPersonPlural',
  ZweitePersonPlural: 'SecondPersonPlural',
  DrittePersonPlural: 'ThirdPersonPlural',
  // values
  Zahl: 'Value',
  Ordinalzahl: 'Ordinal',
  Kardinalzahl: 'Cardinal',
  Bruchzahl: 'Fraction',
  Vielfaches: 'Multiple',
  RömischeZahl: 'RomanNumeral',
  Zahlwort: 'TextValue',
  Numerisch: 'NumericValue',
  Geld: 'Money',
  Prozent: 'Percent',
  // dates
  Datum: 'Date',
  Monat: 'Month',
  Wochentag: 'WeekDay',
  Jahr: 'Year',
  Quartal: 'FinancialQuarter',
  Feiertag: 'Holiday',
  Jahreszeit: 'Season',
  Zeitzone: 'Timezone',
  Uhrzeit: 'Time',
  Dauer: 'Duration',
  // misc
  Adjektiv: 'Adjective',
  Steigerbar: 'Comparable',
  Komparativ: 'Comparative',
  Superlativ: 'Superlative',
  Zahlenbereich: 'NumberRange',
  Artikel: 'Determiner',
  Determinativ: 'Determiner',
  Konjunktion: 'Conjunction',
  Präposition: 'Preposition',
  Fragewort: 'QuestionWord',
  Währung: 'Currency',
  Interjektion: 'Expression',
  Abkürzung: 'Abbreviation',
  Telefonnummer: 'PhoneNumber',
  Erwähnung: 'AtMention',
  Akronym: 'Acronym',
  Negation: 'Negative',
  Bedingung: 'Condition',
}

test('aliases point to the right tag:', function (t) {
  const { tagAliases } = nlp.world().model.one
  Object.keys(aliases).forEach(alias => {
    t.equal(tagAliases[alias], aliases[alias], here + `#${alias} is #${aliases[alias]}`)
  })
  t.end()
})

test('aliases match a tagged term:', function (t) {
  Object.keys(aliases).forEach(alias => {
    const doc = nlp('wort').tag(aliases[alias])
    t.ok(doc.has(`#${alias}`), here + `#${alias} finds a #${aliases[alias]}`)
  })
  t.end()
})

test('every alias in the tagset is tested, and titlecase:', function (t) {
  const { tagSet } = nlp.world().model.one
  Object.keys(tagSet).forEach(tag => {
    const names = (tagSet[tag].aliases || []).filter(name => name !== null)
    names.forEach(name => {
      t.equal(aliases[name], tag, here + `#${name} is listed for #${tag}`)
      t.ok(/^\p{Lu}/u.test(name), here + `#${name} is titlecase`)
    })
  })
  t.end()
})

test('aliases match real sentences:', function (t) {
  const arr = [
    // nouns
    ['Wir gehen in den Park', '#Pronomen #Verb in #Artikel #Nomen'],
    ['Wir gehen in den Park', '#Pronomen #Verb #Präposition #Determinativ #Substantiv'],
    ['Kanada ist sehr kalt', '#Nomen #Verb #Adverb #Adjektiv'],
    ['Spencer geht zum Laden', '#Person #Verb zu #Artikel #Nomen'],
    ['über ihre Erfolge und Misserfolge', '#Präposition #Possessiv #Nomen #Konjunktion #Nomen'],
    ['ein Lehrer', '#Artikel #Maskulinum'],
    ['das Haus', '#Artikel #Neutrum'],
    ['chicago', '#Stadt'],
    ['ho chi minh', '#Stadt+'],
    ['Jamaika', '#Land'],
    ['colorado', '#Ort'],
    ['tony', '#Männername'],
    ['tony', '#Vorname'],
    ['Dr. Müller', '#Titel #Nomen'],
    ['etc', '#Abkürzung'],
    // verbs
    ['Ich laufe schnell', '#Pronomen #Präsens #Adjektiv'],
    ['Ich ging gestern', '#Pronomen #Vergangenheit #Adverb'],
    ['Ich bin gegangen', '#Pronomen #Hilfsverb #Partizip'],
    ['Ich bin gegangen', '#Pronomen #ErstePerson #Vergangenheit'],
    ['Er hat gesungen', '#Pronomen #DrittePerson #Partizip'],
    ['Er würde gehen', '#Pronomen #Hilfsverb #Infinitiv'],
    ['Ich kann gehen', '#Pronomen #Modalverb #Infinitiv'],
    ['ich rufe dich an', '#Pronomen #Verb #Pronomen #Verbpartikel'],
    ['ich rufe dich an', '#Pronomen #Verb #Pronomen #Partikelverb'],
    // values
    ['234', '#Zahl'],
    ['234', '#Numerisch'],
    ['64. Hund', '#Ordinalzahl #Nomen'],
    ['zehn Euro', '#Zahlwort #Währung'],
    ['zehn Euro', '#Kardinalzahl #Währung'],
    ['zehn Euro', '#Geld #Nomen'],
    // dates
    ['juni', '#Monat'],
    ['juni', '#Datum'],
    ['donnerstag', '#Wochentag'],
    // misc
    ['nicht', '#Negation'],
    ['nein', '#Interjektion'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    const doc = nlp(str)
    const tags = doc.json()[0].terms.map(term => term.tags[0])
    const msg = `'${(str + "' ").padEnd(20, ' ')}  - '${match}' - '${tags.join(', ')}'`
    t.equal(doc.match(match).text(), doc.text(), here + msg)
  })
  t.end()
})

test('aliases work in match syntax:', function (t) {
  const doc = nlp('der Hund')
  // lowercase is title-cased, as with any tag
  t.ok(doc.has('#nomen'), here + 'lowercase')
  t.ok(nlp('in der Stille').has('#präposition'), here + 'lowercase umlaut')
  t.equal(doc.match('!#Nomen').text(), 'der', here + 'negative')
  t.equal(doc.match('(#Hilfsverb|#Artikel) #Nomen').text(), 'der Hund', here + 'or-block')
  t.equal(doc.match('#Artikel [#Nomen]', 0).text(), 'Hund', here + 'capture')
  t.equal(nlp('der kleine Hund').match('#Adjektiv? #Nomen$').text(), 'kleine Hund', here + 'optional')
  t.equal(doc.not('#Artikel').text(), 'Hund', here + 'not()')
  t.equal(doc.if('#Nomen').length, 1, here + 'if()')
  t.end()
})

test('aliases do not over-match:', function (t) {
  const doc = nlp('der Hund')
  t.notOk(doc.has('#Verb'), here + 'no #Verb')
  t.notOk(doc.has('#Hilfsverb'), here + 'no #Hilfsverb')
  t.notOk(doc.has('#Präposition'), here + 'no #Präposition')
  t.notOk(doc.has('#Quatsch'), here + 'an unknown tag finds nothing')
  // 'Konjunktiv' and 'Konjunktion' are easily confused
  t.notOk(nlp('und').has('#Konjunktiv'), here + 'und is no #Konjunktiv')
  t.ok(nlp('und').has('#Konjunktion'), here + 'und is #Konjunktion')
  t.end()
})

test('aliases can also set tags:', function (t) {
  const doc = nlp('wort').tag('Hilfsverb')
  t.ok(doc.has('#Auxiliary'), here + 'tag() with an alias')
  doc.unTag('Hilfsverb')
  t.notOk(doc.has('#Auxiliary'), here + 'unTag() with an alias')
  t.end()
})

test('english tag names are unchanged:', function (t) {
  const doc = nlp('der Hund')
  t.ok(doc.has('#Determiner #Noun'), here + 'canonical names still match')
  t.equal(doc.out('spec'), 'der Hund {Determiner,Noun}', here + 'spec output is canonical')
  const tags = doc.json()[0].terms[1].tags
  t.ok(tags.includes('Noun'), here + 'json has #Noun')
  t.notOk(tags.includes('Nomen'), here + 'json has no #Nomen')
  t.end()
})

test('every tag in the lexicon is registered:', function (t) {
  const { lexicon, tagSet } = nlp.world().model.one
  const tags = new Set(Object.values(lexicon).flat())
  const missing = [...tags].filter(tag => !tagSet[tag])
  t.deepEqual(missing, [], here + 'no unregistered tags')
  t.end()
})

test('plural persons are verbs, with aliases:', function (t) {
  const doc = nlp('sangen')
  t.ok(doc.has('#FirstPersonPlural'), here + 'sangen is #FirstPersonPlural')
  t.ok(doc.has('#ErstePersonPlural'), here + 'sangen is #ErstePersonPlural')
  t.notOk(doc.has('#ErstePerson'), here + 'sangen is not #ErstePerson')
  t.ok(nlp('wort').tag('ZweitePersonPlural').has('#Verb'), here + 'plural person implies #Verb')
  t.end()
})
