### unreleased
- **[fix]** - german number format - '12,5' parses as 12.5, '1.000' as 1000
- **[fix]** - past participle of prefixed kommen - 'mitgekommen'
- **[fix]** - toPlural/toSingular no longer mangle untagged forms - 'die Hunde', 'der Kunde'
- **[fix]** - negative numbers keep their sign
- **[new]** - #Unit and #Currency lexicon entries - numbers().units(), '#Money' matches
- **[new]** - more tests

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