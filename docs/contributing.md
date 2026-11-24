# Mitmachen

Diese Bibliothek ist noch in Arbeit und auf die Hilfe von Entwicklern ebenso wie von Deutschsprachigen angewiesen.

Programmierkenntnisse sind dafür nicht nötig. Schon der Hinweis auf ein falsch getaggtes Wort, in einem [Issue](https://github.com/nlp-compromise/de-compromise/issues), ist ein nützlicher Beitrag. Er kann auf Deutsch oder auf Englisch geschrieben sein.

Alle Pull-Requests sind willkommen und werden zeitnah geprüft. Diese Bibliothek ist Open Source und steht unter der MIT-Lizenz.

### Einrichtung

Zuerst auf GitHub einen eigenen Fork des Repositorys anlegen, dann:

```bash
git clone git@github.com:{DEIN_BENUTZERNAME}/de-compromise.git
cd de-compromise
pnpm install
pnpm test
```

Dieses Projekt verwendet [pnpm](https://pnpm.io/). `npm install` und `npm test` funktionieren ebenfalls.

### Etwas ändern

- `./src` enthält den Code. Er ist aufgeteilt in `01-one` (Zerlegen in Wörter), `02-two` (Tagging) und `03-three` (Auswahlen wie `.verbs()`).
- `./data` enthält die Wortlisten und Modelle. Sie sind komprimiert, deshalb nach einer Änderung `pnpm run pack` ausführen, um das Ergebnis zu sehen.
- `./tests` enthält die Tests. Bitte zu jeder Änderung einen Test hinzufügen.
- `./scratch.js` ist eine Datei zum Ausprobieren. `pnpm run watch` führt sie bei jedem Speichern erneut aus.

Wie ein Satz getaggt wurde, zeigt `.debug()`:

```js
nlp('Sie verkauft Muscheln am Strand.').debug()
```

### Einen Pull-Request senden

Bitte vom Branch `dev` aus arbeiten und den Pull-Request dorthin senden.

Bei einer größeren Änderung bitte zuerst ein Issue anlegen, damit wir darüber sprechen können.
