import test from 'tape'
import nlp from '../_lib.js'
let here = '[adj-noun-splitter] '
nlp.verbose(false)

// can you please create 50 examples of compound nouns in german ? Return results tokenized with a '|', like 'schnee|eule'.

test('splitter:', function (t) {
  let arr = [

    // adj-noun
    'kalt|blütig',// (cold-blooded)
    'hoch|gebildet',// (highly educated)
    'stark|alkoholhaltig',// (strongly alcoholic)
    'klein|bürgerlich',// (petty bourgeois)
    'tief|schwarz',// (deep black)
    'leicht|verdaulich',// (easily digestible)
    'sauer|stoffreich',// (oxygen-rich)
    'groß|zügig',// (generous)
    'schnell|trocknend',// (quick-drying)
    'weich|gespült',// (soft-rinsed)
    'hoch|technisiert',// (highly technologized)
    'tief|gefroren',// (deep-frozen)
    'eng|verwandt',// (closely related)
    'schnell|lernend',// (quick-learning)
    'warm|herzig',// (warm-hearted)
    'lang|anhaltend',// (long-lasting)
    'fein|maschig',// (finely meshed)
    'weit|reichend',// (far-reaching)
    'schwer|verdaulich',// (difficult to digest)
    'frisch|gebacken',// (freshly baked)
    'breit|gefächert',// (broadly diversified)
    'klar|definiert',// (clearly defined)
    'glatt|poliert',// (smooth-polished)
    'jung|geblieben',// (young at heart)
    'hell|leuchtend',// (brightly shining)
    'dicht|besiedelt',// (densely populated)
    'spät|geboren',// (late-born)
    'sauber|gepflegt',// (clean and well-maintained)
    'weit|gereist',// (well-traveled)
    'wild|romantisch',// (wildly romantic)
    'ruhig|gelegen',// (quietly located)
    'hoch|gebirgig',// (high-mountainous)
    'schön|geformt',// (beautifully shaped)
    'eng|verbunden',// (closely connected)
    'warm|gekocht',// (warm-cooked)
    'frisch|gepresst',// (freshly squeezed)
    'klar|strukturiert',// (clearly structured)
    'weit|verbreitet',// (widely spread)
    'dick|schichtig',// (thick-layered)
    'tief|gehend',// (profound)
    'leicht|verständlich',// (easily understandable)
    'glatt|gebügelt',// (smoothly ironed)
    'jung|verheiratet',// (young married)
    'hell|klingend',// (bright-sounding)
    'breit|gefächert',// (broadly diversified)
    'sanft|fließend',// (soft-flowing)
    'fein|abgestimmt',// (finely tuned)
    'sauber|gewaschen',// (clean-washed)
    'weit|entfernt',// (far-off)
    'wild|wachsend',// (wildly growing)
    'ruhig|atmend',// (calm-breathing)
    'hoch|dotiert',// (highly endowed)
    'schön|gelegen',// (beautifully situated)
    'eng|verwoben',// (closely interwoven)
    'warm|gehalten',// (kept warm)
    'frisch|gepflückt',// (freshly picked)
    'klar|definiert',// (clearly defined)
    'weit|verzweigt',// (widely branched)
    'dick|schichtend',// (thick-layering)
    'tief|empfunden',// (deeply felt)


  ]
  arr.forEach(str => {
    let parts = str.split('|')
    let word = str.replace(/\|/, '')
    let doc = nlp(word).compute('splitter')
    // t.ok(doc.has('#Adjective #Noun'), word)
    let splits = doc.docs[0][0].splits || []
    t.deepEqual(parts, splits, str)
  })
  t.end()
})




