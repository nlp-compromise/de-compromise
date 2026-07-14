import test from 'tape'
import nlp from '../_lib.js'
let here = '[adj-splitter] '

test('adjectives:', function (t) {
  let arr = [

    'schnell|laufend',
    'hoch|intelligent',
    'tief|entspannt',
    'kurz|fristig',
    'groß|artig',
    'lang|anhaltend',
    'leicht|verständlich',
    'hoch|qualifiziert',
    'stark|gefragt',
    'sauer|süß',
    'hoch|technologisch',
    'gut|ausgebildet',
    'weit|verbreitet',
    'dunkel|haarig',
    'warm|herzig',
    'erfolgs|versprechend',
    'stur|mfrei',
    'frei|willig',
    'alt|bekannt',
    'kalt|herzig',
    'selbst|bewusst',
    'neu|wertig',
    'hoch|gelobt',
    'scharf|gewürzt',
    'klar|verständlich',
    'eng|verbunden',
    'groß|flächig',
    'schnell|wirkend',
    'falsch|informiert',
    'hoch|gestellt',
    'stark|befahren',
    'schwer|erreichbar',
    'gut|gelaunt',
    'leicht|vergänglich',
    'stur|mhart',
    'tief|gründig',
    'herz|ergreifend',
    'fein|abgestimmt',
    'dünn|gesät',
    'laut|stark',
    'stark|bewaffnet',
    'kurz|gesagt',
    'weit|gereist',
    'gut|aussehend',
    'hoch|erfreut',
    'hell|leuchtend',
    'sauer|verdient',
    'hoch|geladen',
    'trocken|humorvoll',
    'schwer|gewichtig',
    'süß|duftend',
    'kalt|er Kaffee',
    'groß|herzig',
    'lang|anhaltend',
    'hoch|wertig',
    'frei|fliegend',
    'gut|aussehend',
    'stark|besucht',
    'klar|verständlich',
    'schnell|trocknend',
    'tief|entspannt',
    'hoch|motiviert',
    'alt|bekannt',
    'sauer|verdient',

    // 
    'hoch|qualifizierter',// (highly qualified)
    'alt|bewährter',// (tried and tested)
    'tief|gründiger',// (profound)
    'gut|gemeinter',// (well-meant)
    'lang|anhaltender',// (long-lasting)
    'hoch|wertiger',// (high-quality)
    'leicht|verständlicher',// (easy to understand)
    'groß|zügiger',// (generous)
    'weit|verbreiteter',// (widely spread)
    'stark|gefragter',// (in high demand)
    'eng|verbundener',// (closely connected)
    'kurz|fristiger',// (short-term)
    'klar|strukturierter',// (clearly structured)
    'schnell|wachsender',// (fast-growing)
    'breit|gefächerter',// (broad-based)
  ]
  arr.forEach(str => {
    let parts = str.split('|')
    let word = str.replace(/\|/, '')
    let doc = nlp(word).compute('splitter')
    t.ok(doc.has('#Adjective'), word)
    let splits = doc.docs[0][0].splits || []
    t.deepEqual(parts, splits, str)
  })
  t.end()
})