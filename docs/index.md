# de-compromise

`de-compromise` ist eine JavaScript-Bibliothek zum Analysieren deutscher Texte.

Sie zerlegt deutschen Text in Sätze und Wörter und versieht jedes Wort mit einem Tag für seine Wortart.
Teile des Dokuments lassen sich dann ähnlich wie mit einem regulären Ausdruck auswählen oder umformen.

Die Bibliothek ist klein genug für den Browser, funktioniert offline und hat keine Abhängigkeiten.
Sie ist regelbasiert und konfigurierbar. Sie trifft schnelle Entscheidungen, die „gut genug“ sind, und verwendet kein neuronales Modell.

Dies ist eine deutsche Version der ursprünglichen [englischen Bibliothek](https://github.com/spencermountain/compromise/).

```bash
npm install de-compromise
```

```js
import nlp from 'de-compromise'

const doc = nlp('Sie verkauft Muscheln am Strand.')
doc.match('#Verb').text() // 'verkauft'
```

oder im Browser:

```html
<script src="https://unpkg.com/de-compromise"></script>
```

### Dokumentation

- [Tagset](./tagset.md)
- [Suchmuster-Syntax](./match.md)
- [API](./api.md)
- [Mitmachen](./contributing.md)

### So funktioniert es

Der Text wird in eine Liste von Sätzen zerlegt, und jeder Satz in eine Liste von Termen:

```
Sentence [
  Term { text: 'Sie', pre: '', post: ' ', normal: 'sie', tags: ['Noun', 'Pronoun'] },
  Term { text: 'verkauft', pre: '', post: ' ', normal: 'verkauft', tags: ['Verb', 'PresentTense', 'ThirdPerson'] },
  ...
]
```

- `text` ist das Wort, so wie es geschrieben wurde
- `pre` und `post` sind die Leerzeichen und Satzzeichen davor und danach
- `normal` ist eine bereinigte Form, die für die Suche verwendet wird
- `tags` sind seine [Wortart-Tags](./tagset.md)

Diese Daten liefert `.json()`:

```js
const doc = nlp('Sie verkauft Muscheln am Strand.')
doc.json()
// [{ terms: [{ text: 'Sie', tags: ['Noun', 'Pronoun'], ... }, ...] }]
```

### Suchen

Mit `.match()` lassen sich Teile des Dokuments auswählen:

```js
const doc = nlp('Sie verkauft Muscheln am Strand.')
const m = doc.match('#Pronomen verkauft .')
m.text() // 'Sie verkauft Muscheln'
m.json() // [{ text: 'Sie verkauft Muscheln', terms: [...] }]

doc.has('#Verb #Nomen') // true
doc.match('#Nomen').out('array') // ['Sie', 'Muscheln', 'Strand.']
```

Die [Suchmuster-Syntax](./match.md) beschreibt alles, was ein Suchmuster kann, und das [Tagset](./tagset.md) listet die unterstützten Tags auf.

### Umformen

Teile des Dokuments lassen sich umformen, und die Änderung wirkt auf das ursprüngliche Dokument:

```js
const doc = nlp('Sie verkauft Muscheln am Strand.')
doc.match('Muscheln').replaceWith('Badehosen')
doc.text() // 'Sie verkauft Badehosen am Strand.'
```

Es gibt auch fertige Auswahlen wie `.verbs()`, `.nouns()` und `.numbers()`, die eigene Methoden haben, etwa `.conjugate()` oder `.add()`:

```js
const doc = nlp('Ich habe vierzig Euro.')
doc.numbers().get() // [40]
doc.numbers().add(10)
doc.text() // 'Ich habe fünfzig Euro.'

nlp('Der Hund jagt die Katze.').nouns().conjugate()
// [{ singular: 'hund', plural: 'hunde' }, { singular: 'katze', plural: 'katzen' }]
```

Diese Auswahlen unterscheiden sich von Sprache zu Sprache. Die [API](./api.md) listet diejenigen dieser Bibliothek auf.

### Gut zu wissen

**Jede Methode gibt eine Ansicht zurück.** Eine Ansicht ist eine Auswahl von Termen im Dokument. `nlp(text)` ist eine Ansicht des ganzen Dokuments, und `.match()` gibt eine kleinere zurück. Die meisten Methoden geben eine Ansicht zurück und lassen sich deshalb verketten. Mit `.all()` gelangt man zurück zum ganzen Dokument.

**Umformungen ändern das Dokument selbst.** Die Ansicht, die eine Umformung zurückgibt, enthält nur die Auswahl. Das Ergebnis liest man deshalb aus dem ursprünglichen Dokument:

```js
const doc = nlp('Sie verkauft Muscheln am Strand.')
doc.match('Muscheln').replaceWith('Kieselsteine').text() // 'Kieselsteine' (nur die Auswahl)
doc.text() // 'Sie verkauft Kieselsteine am Strand.'
```

Soll das Original unverändert bleiben, arbeitet man mit `.clone()` auf einer Kopie:

```js
const doc = nlp('Sie verkauft Muscheln am Strand.')
const kopie = doc.clone()
kopie.match('Muscheln').remove()
kopie.text() // 'Sie verkauft am Strand.'
doc.text() // 'Sie verkauft Muscheln am Strand.'
```

**Suchmuster reichen nicht über Satzgrenzen hinweg.**

```js
nlp('Das ist alles. Zurück nach Winnipeg!').has('alles zurück') // false
```

**Ein unbekannter Tag findet nichts, und zwar ohne Fehlermeldung.** Bleibt eine Suche leer, hilft ein Blick ins [Tagset](./tagset.md), und `doc.debug()` zeigt an, wie jedes Wort getaggt wurde.

### Konfiguration

Ist ein Wort falsch getaggt oder fehlt es, lässt es sich selbst angeben:

```js
// für ein einzelnes Dokument
nlp('kermit winkte', { kermit: 'Vorname' }).match('#Vorname').text() // 'kermit'

// für alle Dokumente
nlp.addWords({ kermit: 'Vorname' })
```

Die Tags müssen aus dem [Tagset](./tagset.md) stammen oder mit `nlp.addTags()` hinzugefügt werden.

Ein Plugin kann Wörter, Tags und neue Methoden zusammen hinzufügen:

```js
nlp.plugin({
  words: { kermit: 'Vorname' },
  tags: { Muppet: { isA: 'Person' } },
  api: (View) => {
    View.prototype.ausrufen = function () {
      return this.post('!')
    }
  }
})

const doc = nlp('hallo zusammen')
doc.match('zusammen').ausrufen()
doc.text() // 'hallo zusammen!'
```
