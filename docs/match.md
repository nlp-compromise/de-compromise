# Suchmuster-Syntax

Das ist die Mustersprache, mit der compromise Teile eines Dokuments auswählt.
Sie sieht aus wie ein regulärer Ausdruck, arbeitet aber mit ganzen Wörtern (Termen) und nicht mit einzelnen Zeichen.
Sie wird von `.match()`, `.has()`, `.if()`, `.not()`, `.before()`, `.replace()` und ähnlichen Methoden verwendet.

```js
nlp('die Katze schläft').match('#Artikel #Nomen').text()
// 'die Katze'
```

## Kurzübersicht

| Muster         | Bedeutung                                         | Beispiel             | Findet                                |
| -------------- | ------------------------------------------------- | -------------------- | ------------------------------------- |
| `wort`         | genau dieses Wort (ohne Groß-/Kleinschreibung)    | `schläft`            | „schläft“                             |
| `#Tag`         | jeder Term mit diesem [Tag](./tagset.md)          | `#Nomen`             | „Katze“                               |
| `.`            | ein beliebiger Term                               | `die . schläft`      | „die Katze schläft“                   |
| `*`            | null oder mehr beliebige Terme                    | `die * schläft`      | „die schwarze Katze schläft“          |
| `(a\|b)`       | eines von beiden                                  | `(rot\|blau)`        | „rot“ oder „blau“                     |
| `(a && b)`     | ein Term, der beides zugleich ist                 | `(essen && #Verb)`   | „essen“, nur als Verb                 |
| `wort?`        | optional                                          | `das kleine? Auto`   | „das Auto“ und „das kleine Auto“      |
| `wort+`        | eins oder mehr                                    | `#Adjektiv+`         | „kleine rote“                         |
| `wort{m,n}`    | zwischen m und n                                  | `.{2,3}`             | zwei oder drei Terme                  |
| `!wort`        | alles außer diesem                                | `die !#Verb`         | „die Katze“                           |
| `^`            | Satzanfang                                        | `^die`               | ein „die“ am Satzanfang               |
| `$`            | Satzende                                          | `schläft$`           | ein „schläft“ am Satzende             |
| `[wort]`       | Gruppe                                            | `Preis für [.]`      | „Milch“                               |
| `[<name>wort]` | benannte Gruppe                                   | `Preis für [<ding>.]` | „Milch“, unter dem Namen `ding`      |
| `{stamm}`      | jede Form dieses Wortes                           | `{gehen}`            | „gehen“, „geht“, „gingen“             |
| `~wort~`       | unscharfe Suche, für ähnliche Schreibweisen       | `~adresse~`          | „Addresse“                            |
| `/regex/`      | ein regulärer Ausdruck, geprüft an einem Term     | `/(f\|ph)oto/`       | „Foto“, „Photo“                       |
| `@methode`     | ein Test für den Term                             | `@isTitleCase`       | „Hallo“                               |

Die Muster lassen sich kombinieren: `#Nomen+?` ist eine optionale Folge von Nomen, und `^[<erstes>.]` erfasst den ersten Term.

## Wörter

Ein einfaches Wort findet nur genau dieses Wort, ohne Rücksicht auf Groß- und Kleinschreibung. Andere Formen des Wortes findet es nicht:

```js
nlp('wir gingen zur Arbeit').has('gingen') // true
nlp('wir gingen zur Arbeit').has('gehen') // false
```

Mit `{gehen}` findet man alle Formen. Siehe [Grundformen](#grundformen) weiter unten.

## Tags

Ein `#Tag` findet jeden Term mit diesem Tag. Die gültigen Tags stehen im [Tagset](./tagset.md).

Die Tags bilden eine Hierarchie: Ein `#Vorname` ist auch eine `#Person` und ein `#Nomen`.

```js
nlp('die Katze schläft').match('#Nomen').text() // 'Katze'
```

Ein unbekannter Tag findet nichts und löst keinen Fehler aus:

```js
nlp('die Katze schläft').match('#Nomens').found // false
```

Deutsche und englische Tag-Namen lassen sich beliebig austauschen. Auch Formen im Penn-Stil wie `#RB` sind möglich.

```js
nlp('die Katze schläft').match('#Artikel #Nomen').text() // 'die Katze'
nlp('die Katze schläft').match('#Determiner #Noun').text() // 'die Katze'
```

## Platzhalter

`.` ist genau ein Term. `*` ist eine beliebige Anzahl von Termen, auch keiner, und nimmt so viele wie möglich.

```js
nlp('die Katze schläft').match('die . schläft').text() // 'die Katze schläft'
nlp('die schwarze Katze schläft').match('die * schläft').text() // 'die schwarze Katze schläft'
```

## Alternativen

`(a|b)` findet eine der Möglichkeiten. Bei `(a && b)` muss der Term alle erfüllen, was bei einem Wort nützlich ist, das zwei Wortarten haben kann.

```js
nlp('ich mag rot und blau').match('(rot|blau)').out('array') // ['rot', 'blau']
nlp('sie essen das Essen').match('(essen && #Verb)').out('array') // ['essen']
```

Gruppen lassen sich nicht verschachteln. `(großes (rotes|blaues))` wird nicht unterstützt, stattdessen verwendet man zwei Aufrufe von `.match()`.

## Optionale und wiederholte Terme

```js
nlp('das Auto').match('das kleine? Auto').text() // 'das Auto'
nlp('das kleine Auto').match('das kleine? Auto').text() // 'das kleine Auto'

nlp('das kleine rote Auto').match('#Adjektiv+').text() // 'kleine rote'
nlp('a b c d').match('.{2,3}').text() // 'a b c'
```

`{n}` bedeutet genau n, `{m,n}` m bis n, `{m,}` m oder mehr, und `{,n}` bis zu n.

## Verneinung

```js
nlp('die Katze schläft').match('die !#Verb').text() // 'die Katze'
```

## Anfang und Ende

`^` und `$` sind Anfang und Ende eines Satzes, nicht des Dokuments.

```js
nlp('die Katze schläft').match('^die').text() // 'die'
nlp('die Katze schläft').match('schläft$').text() // 'schläft'
```

## Gruppen

Eckige Klammern markieren den Teil eines Treffers, den man behalten möchte. Man erhält ihn mit `.groups()`, oder indem man die Gruppe als zweites Argument übergibt:

```js
const doc = nlp('der Preis für Milch ist hoch')
doc.match('Preis für [<ding>.]').groups('ding').text() // 'Milch'
doc.match('Preis für [.]', 0).text() // 'Milch'
```

Ohne Namen werden Gruppen ab 0 nummeriert. Eine Gruppe kann mehrere Terme enthalten.

## Grundformen

`{stamm}` findet jede gebeugte Form eines Wortes, ausgehend von seiner Grundform im Wörterbuch:

```js
nlp('wir gingen zur Arbeit').match('{gehen}').text() // 'gingen'
nlp('er geht nach Hause').match('{gehen}').text() // 'geht'
```

<!-- Grundformen werden nicht automatisch berechnet. Liefert die Suche nichts, zuerst `doc.compute('root')` aufrufen. -->

## Unscharfe Suche

`~wort~` findet ähnliche Schreibweisen, gemessen am Abstand zwischen Zeichenketten. Der Schwellenwert ist standardmäßig 0,85 und lässt sich in den [Optionen](#suchoptionen) ändern.

```js
nlp('eine Addresse').match('~adresse~').text() // 'Addresse'
```

## Reguläre Ausdrücke

Ein `/regex/` wird jeweils an einem einzelnen Term geprüft und kann deshalb nicht über zwei Wörter reichen.

```js
nlp('Foto Photo').match('/(f|ph)oto/').out('array') // ['Foto', 'Photo']
```

## Tests für Terme

`@methode` wendet einen eingebauten Test auf jeden Term an. Die gängigsten sind `@isTitleCase`, `@isUpperCase`, `@hasComma`, `@hasHyphen`, `@hasContraction` und `@hasQuote`.

```js
nlp('NASA und die Katze').match('@isUpperCase').out('array') // ['NASA']
```

## Suchoptionen

`.match()`, `.matchOne()`, `.has()`, `.if()`, `.ifNo()`, `.before()` und `.after()` nehmen als drittes Argument, nach der Gruppe, ein Objekt mit Optionen entgegen.

| Option          | Standard | Wirkung                                                              |
| --------------- | -------- | -------------------------------------------------------------------- |
| `fuzzy`         | `0.85`   | die nötige Ähnlichkeit für einen `~wort~`-Treffer, von 0 bis 1       |
| `caseSensitive` | `false`  | vergleicht mit dem Originaltext, nicht mit der normalisierten Form   |
| `noRegex`       | `false`  | behandelt `/regex/` als einfaches Wort, sodass er nie ausgeführt wird |

```js
nlp('Essen essen').match('Essen', null, { caseSensitive: true }).out('array') // ['Essen']
```

`{ noRegex: true }` ist sinnvoll, wenn das Muster von einem Benutzer stammt, damit kein langsamer oder fehlerhafter regulärer Ausdruck ausgeführt werden kann.

## Eine Wortliste suchen

Für eine lange Liste einfacher Wörter ist `.lookup()` viel schneller als viele Aufrufe von `.match()`. Die Methode verwendet die Suchmuster-Syntax nicht und ist deshalb auch für Wörter sicher, die ein Benutzer eingegeben hat.

```js
nlp('ich sah maria und hans').lookup(['maria', 'hans']).out('array') // ['maria', 'hans']
```

## Ein Suchmuster wiederverwenden

`nlp.parseMatch(str)` zerlegt ein Muster einmal, sodass es mehrfach verwendet werden kann. `nlp.buildNet([...])` übersetzt viele Muster in eines, das mit `.sweep()` gemeinsam ausgeführt wird. Beides lohnt sich, wenn dieselben Muster auf viel Text angewendet werden.

## Was nicht unterstützt wird

- **Verschachtelte Gruppen.** Stattdessen mehrere Aufrufe von `.match()` verwenden.
- **Suchmuster über Satzgrenzen hinweg.** Jeder Treffer bleibt innerhalb eines Satzes.
- **Ein regulärer Ausdruck über mehrere Wörter.** Ein `/regex/` wird an jeweils einem Term geprüft.

## Wenn eine Suche nichts findet

1. Prüfen, ob der Tag im [Tagset](./tagset.md) steht.
2. Mit `doc.debug()` nachsehen, wie jedes Wort getaggt wurde.
3. Daran denken, dass ein einfaches Wort eine exakte Suche ist. Für alle Formen `{stamm}` verwenden.
4. Daran denken, dass Suchmuster nicht über Satzgrenzen hinweg reichen.
