### Unreleased

- **[breaking]** - `nlp.TypedPlugin` type is removed
- **[change]** - typescript types rewritten from the real api - core `View` types now come from `compromise`, and the document type is `DeView`
- **[new]** - types for `nlp.fromSpec()`, `nlp.testSpec()` and `nlp.compile()`
- **[change]** - remove `nlp.lazy()` from types and docs - it lives in a plugin now
- **[fix]** - `.numbers().set()`, `.add()` and `.subtract()` accept a written number - `.add('zwei')` - and ignore a string that isn't one
- **[fix]** - `.numbers().json(n)` returns the nth number, instead of throwing
- **[fix]** - `.numbers().get()` and `.parse()` return `[]` when there are no numbers
- **[fix]** - `.numbers().toText()` then `.toNumber()` round-trips, on the same view or chained - '25 Kilo', 'der 3. Mann'
- **[fix]** - negative numbers are written 'minus fünf' (was 'moinsfünf'), and 'minus fünf Grad' / 'minus 5' parse as -5
- **[fix]** - negative numbers with the sign outside the term - '-1.234', '-12,5', '(-5)' - keep it through `.add()` and `.toText()`
- **[fix]** - thousands grouping '1.234' is kept by `.add()`, `.subtract()`, `.toOrdinal()`, `.toCardinal()` and restored after `.toText()` → `.toNumber()`
- **[fix]** - 'null' is the number 0 - `.get()`, `.set('null')`, 'nullte'
- **[change]** - minimum node version is 18
- **[update]** - tests moved to `tests/unit`, `tests/types`, `tests/_hmm` and `tests/_backlog`
- **[update]** - suffix-thumb 6.1.0

### 0.1.2 [Nov 2026]

- **[update]** - smaller suffix-thumb format
- **[new]** - support localized tag names
- **[update]** - dependencies

### 0.1.0 [July 2026]

- **[fix]** - german number format - '12,5' parses as 12.5, '1.000' as 1000
- **[fix]** - past participle of prefixed kommen - 'mitgekommen'
- **[fix]** - toPlural/toSingular no longer mangle untagged forms - 'die Hunde', 'der Kunde'
- **[fix]** - negative numbers keep their sign
- **[new]** - #Unit and #Currency lexicon entries - numbers().units(), '#Money' matches
- **[new]** - more tests
- **[update]** - dependencies

### 0.0.11 [May 2023]

- **[fix]** - linting
- **[update]** - deps

### 0.0.9 [Mar 2023]

- **[new]** - adjective + noun inflections
- **[change]** - tagger fixes

### 0.0.8 [Nov 2022]

- **[new]** - more verb conjugations
- **[change]** - update dependencies

### 0.0.6 [Nov 2022]

- **[new]** - support some verb root matches

### 0.0.5 [July 2022]

- **[fix]** - support for ordinal numbers like '4.'

### 0.0.4 [July 2022]

- **[new]** - support for number parsing
- **[new]** - support 12.02 time format
- **[new]** - add types
