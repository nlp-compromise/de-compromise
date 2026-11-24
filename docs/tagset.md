# Tagset

Die Tags von de-compromise. Jeder Tag kann in Suchmustern mit seinem englischen Namen oder mit dem deutschen Alias verwendet werden:

```js
const doc = nlp('Wir gehen in den Park')
doc.match('#Pronomen #Verb #Präposition #Artikel #Nomen')
doc.match('#Pronoun #Verb #Preposition #Determiner #Noun') // gleichwertig
```

`—` bedeutet: kein eigener Alias, weil das Wort im Deutschen gleich lautet oder es keine gute Übersetzung gibt. Der englische Name funktioniert trotzdem.

`*` bedeutet: Der Tagger vergibt diesen Tag für das Beispiel derzeit nicht automatisch. Mit `.tag()` lässt er sich selbst setzen.

## Nomen

| Englisch | Deutsch | Beispiel |
|---|---|---|
| `#Noun` | `#Nomen`, `#Substantiv` | `Hund` |
| `#Singular` | — | `Hund` * |
| `#ProperNoun` | `#Eigenname` | `Kanada` |
| `#Person` | — | `Tony` |
| `#FirstName` | `#Vorname` | `Tony` |
| `#MaleName` | `#Männername` | `Tony` |
| `#FemaleName` | `#Frauenname` | `Maria` |
| `#LastName` | `#Nachname` | `Ruiz` |
| `#Honorific` | `#Titel` | `Dr.` |
| `#Place` | `#Ort` | `Colorado` |
| `#Country` | `#Land` | `Jamaika` |
| `#City` | `#Stadt` | `Berlin` |
| `#Region` | — | `Alaska` |
| `#Address` | `#Adresse` | `Hauptstraße 5` * |
| `#Organization` | `#Organisation` | `Siemens` * |
| `#SportsTeam` | `#Mannschaft` | `Bayern München` * |
| `#School` | `#Schule` | `Universität Hamburg` * |
| `#Company` | `#Unternehmen` | `Siemens` * |
| `#Plural` | — | `Zeiten` |
| `#Uncountable` | `#Unzählbar` | `Wasser` * |
| `#Pronoun` | `#Pronomen` | `ich` |
| `#Actor` | — | `Lehrer` * |
| `#Activity` | `#Aktivität` | `Schwimmen` * |
| `#Unit` | `#Einheit` | `km` |
| `#Demonym` | `#Einwohnername` | `Deutscher` * |
| `#Possessive` | `#Possessiv` | `meinem` |
| `#MaleNoun` | `#Maskulinum` | `Lehrer` |
| `#FemaleNoun` | `#Femininum` | `Tat` |
| `#NeuterNoun` | `#Neutrum` | `Haus` |

## Verben

| Englisch | Deutsch | Beispiel |
|---|---|---|
| `#Verb` | — | `gehen` |
| `#PresentTense` | `#Präsens` | `laufe` |
| `#Infinitive` | `#Infinitiv` | `gehen` |
| `#Imperative` | `#Imperativ` | `geh` * |
| `#Subjunctive` | `#Konjunktiv` | `ginge` * |
| `#Participle` | `#Partizip` | `gegangen` |
| `#Gerund` | — | `singend` * |
| `#PastTense` | `#Vergangenheit` | `ging` |
| `#Copula` | `#Kopula` | `ist` * |
| `#Modal` | `#Modalverb` | `kann` |
| `#PerfectTense` | `#Perfekt` | `hat gesungen` * |
| `#Pluperfect` | `#Plusquamperfekt` | `hatte gesungen` * |
| `#PhrasalVerb` | `#Partikelverb` | `ich rufe dich an` |
| `#Particle` | `#Verbpartikel` | `ich rufe dich an` |
| `#Auxiliary` | `#Hilfsverb` | `er hat gesungen` |
| `#FirstPerson` | `#ErstePerson` | `laufe` |
| `#SecondPerson` | `#ZweitePerson` | `läufst` |
| `#ThirdPerson` | `#DrittePerson` | `läuft` |
| `#FirstPersonPlural` | `#ErstePersonPlural` | `sangen` |
| `#SecondPersonPlural` | `#ZweitePersonPlural` | `seid` |
| `#ThirdPersonPlural` | `#DrittePersonPlural` | `sie sangen` * |

## Zahlen

| Englisch | Deutsch | Beispiel |
|---|---|---|
| `#Value` | `#Zahl` | `234` |
| `#Ordinal` | `#Ordinalzahl` | `64.` |
| `#Cardinal` | `#Kardinalzahl` | `zehn` |
| `#Fraction` | `#Bruchzahl` | `1/2` |
| `#Multiple` | `#Vielfaches` | `hundert` * |
| `#RomanNumeral` | `#RömischeZahl` | `XIV` * |
| `#TextValue` | `#Zahlwort` | `zehn` |
| `#TextOrdinal` | — | `erste` |
| `#TextCardinal` | — | `zehn` |
| `#NumericValue` | `#Numerisch` | `234` |
| `#Money` | `#Geld` | `zehn Euro` |
| `#Percent` | `#Prozent` | `50%` |

## Datum und Zeit

| Englisch | Deutsch | Beispiel |
|---|---|---|
| `#Date` | `#Datum` | `3. Mai` |
| `#Month` | `#Monat` | `Juni` |
| `#WeekDay` | `#Wochentag` | `Donnerstag` |
| `#Year` | `#Jahr` | `2026` * |
| `#FinancialQuarter` | `#Quartal` | `Q3` * |
| `#Holiday` | `#Feiertag` | `Ostern` * |
| `#Season` | `#Jahreszeit` | `Sommer` * |
| `#Timezone` | `#Zeitzone` | `MEZ` * |
| `#Time` | `#Uhrzeit` | `16:30` |
| `#Duration` | `#Dauer` | `Monate` * |

## Sonstiges

| Englisch | Deutsch | Beispiel |
|---|---|---|
| `#Adjective` | `#Adjektiv` | `kalt` |
| `#Comparable` | `#Steigerbar` | `schnell` * |
| `#Comparative` | `#Komparativ` | `größer` * |
| `#Superlative` | `#Superlativ` | `schönste` * |
| `#NumberRange` | `#Zahlenbereich` | `5-10` |
| `#Adverb` | — | `sehr` |
| `#Determiner` | `#Artikel`, `#Determinativ` | `der` |
| `#Conjunction` | `#Konjunktion` | `und` |
| `#Preposition` | `#Präposition` | `in` |
| `#QuestionWord` | `#Fragewort` | `warum` |
| `#Currency` | `#Währung` | `Euro` |
| `#Expression` | `#Interjektion` | `nein` |
| `#Abbreviation` | `#Abkürzung` | `kg` |
| `#Url` | — | `www.example.com` |
| `#PhoneNumber` | `#Telefonnummer` | `555-123-4567` |
| `#HashTag` | — | `#nlp` |
| `#AtMention` | `#Erwähnung` | `@spencer` |
| `#Emoji` | — | `😀` * |
| `#Emoticon` | — | `:-)` * |
| `#Email` | — | `info@example.com` |
| `#Acronym` | `#Akronym` | `FBI` |
| `#Negative` | `#Negation` | `nicht` |
| `#Condition` | `#Bedingung` | `wenn` * |
