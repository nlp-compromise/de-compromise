# API

`de-compromise` baut auf der englischen Bibliothek [compromise](https://github.com/spencermountain/compromise/) auf und teilt deren Grundmethoden. Sie funktionieren in jeder Sprache gleich.

Die meisten Methoden geben eine neue **Ansicht** zurück (eine Auswahl aus dem Dokument) und lassen sich deshalb verketten:

```js
nlp(text).match('#Nomen').first().text()
```

Methoden, die ein `match` entgegennehmen, verwenden die [Suchmuster-Syntax](./match.md).

## Grundmethoden

_(in jeder Ansicht verfügbar)_

### Hilfsmittel

- **`.found`** _[getter]_ — enthält diese Ansicht etwas?
- **`.docs`** _[getter]_ — die Liste der Term-Objekte dieser Ansicht
- **`.document`** _[getter]_ — der gesamte analysierte Text
- **`.pointer`** _[getter]_ — die Indizes der aktuellen Ansicht
- **`.fullPointer`** _[getter]_ — die ausgeschriebenen Indizes der aktuellen Ansicht
- **`.methods`** _[getter]_ — Zugriff auf die internen Methoden der Bibliothek
- **`.model`** _[getter]_ — Zugriff auf die internen Daten der Bibliothek
- **`.hooks`** _[getter]_ — welche compute-Methoden standardmäßig laufen
- **`.isView`** _[getter]_ — erkennt ein compromise-Objekt
- **`.length`** _[getter]_ — die Anzahl der Treffer in der Ansicht
- **`.update(pointer)`** — erzeugt eine neue Ansicht aus diesem Dokument
- **`.toView(pointer)`** — macht aus einer Verb- oder Noun-Ansicht eine normale
- **`.fromText(text)`** — erzeugt ein neues Dokument
- **`.termList()`** — Alias für .docs
- **`.compute(method)`** — führt eine benannte Operation auf dem Dokument aus
- **`.clone(shallow?)`** — kopiert das Dokument vollständig, sodass keine Referenzen bleiben

### Schleifen

- **`.forEach(fn)`** — führt eine Funktion für jeden Treffer aus, als eigenes Dokument
- **`.map(fn, emptyResult?)`** — schickt jeden Treffer durch eine Funktion und erzeugt ein neues Dokument
- **`.filter(fn)`** — behält nur die Treffer, für die die Funktion true zurückgibt
- **`.find(fn)`** — gibt ein Dokument mit nur dem ersten passenden Treffer zurück
- **`.some(fn)`** — gibt true zurück, wenn mindestens ein Treffer passt
- **`.random(n?)`** — wählt zufällig einen Teil der Treffer aus

### Zugriff

- **`.terms(n?)`** — zerlegt die Treffer in einzelne Terme
- **`.groups(name?)`** — holt eine benannte Gruppe
- **`.eq(n)`** — verwendet nur den n-ten Treffer
- **`.first(n?)`** — verwendet nur den oder die ersten Treffer
- **`.last(n?)`** — verwendet nur den oder die letzten Treffer
- **`.firstTerms()`** — das erste Wort jedes Treffers
- **`.lastTerms()`** — das letzte Wort jedes Treffers
- **`.slice(start, end?)`** — nimmt einen Teil der Treffer
- **`.all()`** — gibt das ganze ursprüngliche Dokument zurück („herauszoomen“)
- **`.fullSentences()`** — gibt zu jedem Treffer den ganzen ursprünglichen Satz zurück
- **`.none()`** — gibt eine leere Ansicht zurück
- **`.isDoc(view?)`** — gehören diese beiden Ansichten zum selben Dokument?
- **`.wordCount()`** — zählt die Terme

### Suche

- **`.match(match, group?, options?)`** — gibt die Stellen im Dokument zurück, die zum Muster passen
- **`.matchOne(match, group?, options?)`** — gibt nur den ersten Treffer zurück
- **`.has(match, group?, options?)`** — gibt true oder false zurück: kommt dieses Muster vor?
- **`.if(match, group?, options?)`** — behält nur die Treffer, die dieses Muster enthalten
- **`.ifNo(match, group?, options?)`** — entfernt die Treffer, die dieses Muster enthalten
- **`.before(match, group?, options?)`** — gibt die Terme vor jedem Treffer zurück
- **`.after(match, group?, options?)`** — gibt die Terme nach jedem Treffer zurück
- **`.lookBehind(match, group?, options?)`** — Alias für .before()
- **`.lookBefore(match, group?, options?)`** — Alias für .before()
- **`.lookAhead(match, group?, options?)`** — Alias für .after()
- **`.lookAfter(match, group?, options?)`** — Alias für .after()
- **`.growLeft(match, group?, options?)`** — nimmt passende Terme direkt davor in die Ansicht auf
- **`.growRight(match, group?, options?)`** — nimmt passende Terme direkt danach in die Ansicht auf
- **`.grow(match, group?, options?)`** — erweitert die Ansicht um passende Terme links oder rechts
- **`.sweep(match, opts?)`** — wendet eine Reihe vorbereiteter Muster auf das Dokument an
- **`.splitOn(match?, group?)`** — teilt den Treffer in drei Teile: davor, das Muster, danach
- **`.splitBefore(match?, group?)`** — trennt direkt vor jedem gefundenen Muster
- **`.splitAfter(match?, group?)`** — trennt direkt nach jedem gefundenen Muster
- **`.split(match?, group?)`** — Alias für .splitAfter()

### Groß- und Kleinschreibung

- **`.toLowerCase()`** — schreibt alle Buchstaben klein
- **`.toUpperCase()`** — schreibt alle Buchstaben groß
- **`.toTitleCase()`** — schreibt den ersten Buchstaben jedes Terms groß
- **`.toCamelCase()`** — entfernt die Leerzeichen und schreibt jeden Term groß

### Einfügen

- **`.concat(input)`** — hängt diese Inhalte am Ende an
- **`.insertBefore(input)`** — fügt diese Wörter vor jedem Treffer ein
- **`.prepend(input)`** — Alias für .insertBefore()
- **`.insertAfter(text)`** — fügt diese Wörter nach jedem Treffer ein
- **`.append(text)`** — Alias für .insertAfter()
- **`.insert(text)`** — Alias für .insertAfter()
- **`.remove(match)`** — entfernt diese Terme vollständig aus dem Dokument
- **`.delete(match)`** — Alias für .remove()
- **`.replace(from, to?, keep?)`** — sucht ein Muster und ersetzt es durch neuen Inhalt
- **`.replaceWith(to, keep?)`** — ersetzt die Auswahl durch neuen Inhalt
- **`.unique()`** — entfernt doppelte Treffer
- **`.reverse()`** — kehrt die Reihenfolge der Treffer um, aber nicht die der Wörter
- **`.sort(method?)`** — ordnet die Treffer neu (an Ort und Stelle)
<!-- - **`.normalize(options?)`** — bereinigt verschiedene Eigenschaften der Wörter -->

### Leerzeichen und Satzzeichen

- **`.pre(str?, concat?)`** — setzt dieses Satz- oder Leerzeichen vor jeden Treffer
- **`.post(str?, concat?)`** — setzt dieses Satz- oder Leerzeichen hinter jeden Treffer
- **`.trim()`** — entfernt Leerzeichen am Anfang und am Ende
- **`.hyphenate()`** — verbindet die Wörter mit Bindestrichen und entfernt die Leerzeichen
- **`.dehyphenate()`** — entfernt die Bindestriche zwischen den Wörtern und setzt Leerzeichen
- **`.deHyphenate()`** — Alias für .dehyphenate()
- **`.toQuotations(start?, end?)`** — setzt die Auswahl in Anführungszeichen
- **`.toQuotation(start?, end?)`** — Alias für .toQuotations()
- **`.toParentheses(start?, end?)`** — setzt die Auswahl in Klammern

### Ausgabe

- **`.text(options?)`** — gibt das Dokument als Text zurück
- **`.json(options?)`** — gibt die gewünschten Metadaten des Dokuments zurück
- **`.debug()`** — gibt das aktuelle Dokument und seine Tags übersichtlich aus
- **`.out(format?)`** — einige benannte Ausgabeformate
- **`.html(toHighlight)`** — erzeugt einen HTML-String, mit Tags um die gefundenen Muster
- **`.wrap(matches)`** — erzeugt eine eigene Ausgabe um die gefundenen Muster

### Zeiger

- **`.union(match)`** — gibt alle Treffer ohne Duplikate zurück
- **`.and(match)`** — Alias für .union()
- **`.intersection(match)`** — gibt nur die gemeinsamen Treffer zurück
- **`.not(match, options?)`** — gibt alle Treffer außer diesem zurück
- **`.difference(match, options?)`** — Alias für .not()
- **`.complement(match)`** — gibt alles zurück, was kein Treffer ist
- **`.settle(match)`** — entfernt Überschneidungen zwischen Treffern

### Tags

- **`.tag(tag, reason?)`** — gibt allen Termen diesen Tag
- **`.tagSafe(tag, reason?)`** — setzt den Tag nur, wenn er zu den vorhandenen Tags passt
- **`.unTag(tag, reason?)`** — entfernt diesen Tag von den Termen
- **`.canBe(tag)`** — gibt nur die Terme zurück, die diesen Tag tragen können

### Cache

- **`.cache(options?)`** — friert den aktuellen Zustand des Dokuments ein, um Zeit zu sparen
- **`.uncache(options?)`** — gibt den Zustand des Dokuments wieder frei, damit es umgeformt werden kann
- **`.freeze()`** — verhindert, dass die aktuellen Tags entfernt werden
- **`.unfreeze()`** — erlaubt, die aktuellen Tags zu ändern [Standard]

### Wortlisten

- **`.lookup(trie, opts?)`** — schnelle Suche nach einer Liste von Wörtern
- **`.autoFill()`** — ergänzt Wortanfänge anhand des Wörterbuchs für die Autovervollständigung

<!--
## Methoden des Taggers

- **`.confidence()`** — durchschnittliches Maß für die Sicherheit der Tags
- **`.swap(fromLemma, toLemma, guardTag?)`** — ersetzt die Formen einer Grundform intelligent
-->

## Auswahlen

Auswahlen sind fertige Suchen wie `.verbs()` oder `.numbers()`, die eine Ansicht mit zusätzlichen eigenen Methoden zurückgeben.
Sie werden für jede Sprache eigens geschrieben. Die hier verfügbaren sind deshalb nicht dieselben wie im Englischen.

### `.nouns()`

- **`.nouns()`** — gibt die Nomen des Dokuments zurück
- **`.nouns().conjugate()`** — gibt Singular und Plural jedes Nomens an
- **`.nouns().isPlural()`** — gibt nur die Nomen im Plural zurück
- **`.nouns().toPlural()`** — setzt die Nomen in den Plural
- **`.nouns().toSingular()`** — setzt die Nomen in den Singular

### `.verbs()`

- **`.verbs()`** — gibt die Verben des Dokuments zurück
- **`.verbs().conjugate()`** — gibt alle Konjugationsformen jedes Verbs an

### `.adjectives()`

- **`.adjectives()`** — gibt die Adjektive des Dokuments zurück
- **`.adjectives().conjugate()`** — gibt die gebeugten Formen jedes Adjektivs an

### `.numbers()`

- **`.numbers()`** — gibt die Zahlen zurück, in Ziffern oder in Worten geschrieben; ein ausgeschriebenes Vorzeichen gehört zur Zahl (`minus fünf`)
- **`.values()`** — Alias für .numbers()
- **`.numbers().get()`** — gibt den Zahlenwert jeder Zahl als Array zurück (`[]`, wenn es keine Zahlen gibt); `null` ist 0, `minus fünf` ist -5
- **`.numbers().parse()`** — gibt die geparsten Angaben jeder Zahl als Array zurück
- **`.numbers().json(n?)`** — gibt JSON mit den geparsten Zahlendaten zurück; eine Zahl n wählt nur den n-ten Treffer, ein Objekt oder String wird als Option weitergereicht
- **`.numbers().units()`** — gibt die Einheit zurück, die auf jede Zahl folgt
- **`.numbers().toNumber()`** — schreibt die Zahlen in Ziffern (`40`, `-5`)
- **`.numbers().toText()`** — schreibt die Zahlen in Worten (`vierzig`, `minus fünf`)
- **`.numbers().toCardinal()`** — macht daraus eine Kardinalzahl (`vierzig`)
- **`.numbers().toOrdinal()`** — macht daraus eine Ordinalzahl (`vierzigste`)
- **`.numbers().isCardinal()`** — gibt nur die Kardinalzahlen zurück
- **`.numbers().isOrdinal()`** — gibt nur die Ordinalzahlen zurück
- **`.numbers().isEqual(n)`** — gibt nur die Zahlen zurück, die gleich n sind
- **`.numbers().greaterThan(n)`** — gibt nur die Zahlen zurück, die größer als n sind
- **`.numbers().lessThan(n)`** — gibt nur die Zahlen zurück, die kleiner als n sind
- **`.numbers().between(min, max)`** — gibt nur die Zahlen zwischen min und max zurück
- **`.numbers().set(n)`** — ersetzt jede Zahl durch n – eine Zahl oder ein Zahl-String (`5`, `'fünf'`, `'null'`)
- **`.numbers().add(n)`** — addiert n zu jeder Zahl (Zahl oder Zahl-String); Alias `.plus(n)`
- **`.numbers().subtract(n)`** — subtrahiert n von jeder Zahl (Zahl oder Zahl-String); Alias `.minus(n)`
- **`.numbers().increment()`** — addiert 1 zu jeder Zahl
- **`.numbers().decrement()`** — subtrahiert 1 von jeder Zahl

Tausenderpunkte bleiben erhalten: Eine Zahl, die mit Punkten gruppiert war (`1.234`), behält sie bei `.add()`, `.subtract()`, `.set()`, `.toOrdinal()` und `.toCardinal()` und bekommt sie nach `.toText()` und `.toNumber()` zurück. Eine Zahl ohne Punkte (`1234`) bekommt keine.

## Methoden des Konstruktors

_(werden auf dem importierten `nlp`-Objekt aufgerufen, nicht auf einer Ansicht)_

- **`nlp.tokenize(text, lexicon?)`** — analysiert den Text, ohne den Tagger zu starten
- **`nlp.plugin(plugin)`** — bindet ein compromise-Plugin ein
- **`nlp.extend(plugin)`** — Alias für nlp.plugin()
- **`nlp.addWords(words, isFrozen?)`** — fügt dem internen Lexikon neue Wörter hinzu
- **`nlp.addTags(tags)`** — fügt dem Tagset neue Tags hinzu
- **`nlp.parseMatch(match, opts?)`** — wandelt ein Suchmuster in JSON um
- **`nlp.buildNet(matches)`** — übersetzt eine Reihe von Suchmustern in eine schnellere Form, für .sweep()
- **`nlp.buildTrie(words)`** — übersetzt eine Wortliste in eine schnellere Form, für .lookup()
- **`nlp.typeahead(words)`** — fügt dem Wörterbuch für die Autovervollständigung Wörter hinzu
- **`nlp.world()`** — Zugriff auf die internen Daten der Bibliothek
- **`nlp.model()`** — Zugriff auf die sprachlichen Daten der Bibliothek
- **`nlp.methods()`** — Zugriff auf die internen Methoden der Bibliothek
- **`nlp.hooks()`** — welche compute-Funktionen automatisch laufen
- **`nlp.verbose(toLog?)`** — gibt die Entscheidungen des Taggers aus, zur Fehlersuche
- **`nlp.version`** — die aktuelle semver-Version der Bibliothek
