import test from 'tape'
import nlp from '../_lib.js'
let here = '[de-splitter] '
nlp.verbose(false)

// can you please create 50 examples of compound nouns in german ? Return results tokenized with a '|', like 'schnee|eule'.

test('splitter:', function (t) {
  let arr = [
    'Haus|dach',
    'Taschen|lampe',
    'Auto|fahrer',
    'Zeit|plan',
    'Wasser|hahn',
    'Stadt|zentrum',
    'Schnee|eule',
    'Hoch|haus',
    'Feuer|wehr',
    'Fuß|ball',
    'Handy|kamera',
    'Straßen|bahn',
    'Luft|matratze',
    'Buch|regal',
    'Tür|schloss',
    'Schreib|tisch',
    'Haupt|stadt',
    'Müll|tonne',
    'Fenster|bank',
    'Fern|seher',
    'Küchen|herd',
    'Strom|kabel',
    'Bade|zimmer',
    'Himmel|bett',
    'Wand|uhr',
    'Kaffee|tasse',
    'Bett|decke',
    'Brief|umschlag',
    'Schul|bus',
    'Haus|schuhe',
    'Kinder|zimmer',
    'Ess|tisch',
    'Nacht|hemd',
    'Hosen|tasche',
    'Schul|heft',
    'Fahrrad|ständer',
    'Küchen|messer',
    'Müll|beutel',
    'Blumen|topf',
    'Fern|bedienung',
    'Wasser|glas',
    'Kopf|hörer',
    'Park|platz',
    'Hals|kette',
    'Hand|tuch',
    'Bade|anzug',
    'Wetter|bericht',
    'Zeit|schrift',
    'Hoch|zeit',
    'Garten|zaun',
    'Bett|laken',
    'Hof|einfahrt',
    'Keller|fenster',
    'Küchen|schrank',
    'Arbeits|platz',
    'Bücher|regal',
    'Fenster|bank',
    'Nacht|lampe',
    'Auto|werkstatt',
    'Schul|uniform',
    'Garten|schlauch',
    'Kleider|schrank',
    'Schul|ranzen',
    'Spiel|platz',
    'Bade|hose',
    'Schul|tasche',
    'Wohn|zimmer',
    'Staub|sauger',
    'Auto|bahn',
    'Wasser|kocher',
    'Handy|vertrag',
    'Kaffee|maschine',
    'Tee|tasse',
    'Schul|hof',
    'Buch|laden',
    'Fuß|weg',
    'Kopf|kissen',
    'Schul|bank',
    'Feuer|zeug',
    'Haus|tür',
    'Garten|möbel',
    'Bett|gestell',
    'Stadt|teil',
    'Küchen|maschine',
    'Bade|zimmerschrank',
    'Arbeits|zeit',
    'Wasser|flasche',
    'Fern|sehen',
    'Wohn|zimmer|tisch',
    'Auto|reifen',
    'Schul|stunde',
    'Bett|zeug',
    'Garten|werkzeug',
    'Dach|fenster',
    'Kopf|hörer|anschluss',
    'Hoch|zeits|kleid',
    'Bade|wanne',
    'Arbeits|kleidung',
    'Bett|gitter',
    'Schul|ferien',
    'Garten|party|planung',
    'Hoch|zeits|einladung',
    'Auto|reifen|wechsel',
    'Schul|bus|fahrer',
    'Wasser|flaschen|öffner',
    'Arbeits|platz|organisation',
    'Bade|zimmer|spiegel',
    'Küchen|schrank|tür',
    'Bett|zeug|lagerung',
    'Garten|möbel|pflege',
    'Buch|laden|inhaber',
    'Stadt|teil|entwicklung',
    'Handy|vertrag|kündigung',
    'Kaffee|tasse|halter',
    'Schul|hof|aufsicht',
    'Feuer|zeug|benutzung',
    'Haus|tür|schloss',
    'Fuß|ball|spieler',
    'Kopf|kissen|bezug',
    'Schul|ranzen|träger',
    'Bade|hose|größe',

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
    // ['Schneeeule', ['Schnee', 'Eule']], //snowy owl
    // ['hochqualifiziert', ['hoch', 'qualifiziert']],
    // ['Fallschirmspringerschule', ['Fallschirm', 'Springer', 'Schule']],//parachute jumper school
    // ['Siebentausendzweihundertvierundfünfzig', ['Sieben', 'tausend', 'zwei', 'hundert', 'vier', 'und', 'fünfzig']],//7,254
    // ['Nahrungsmittelunverträglichkeit', ['Nahrungsmittel', 'Unverträglichkeit']],//food intolerance
    // ['Schweinswal', ['Schwein', 's', 'Wal']],//pig, whale (porpoise)
    // ['Bananenbrot', ['Bananen', 'brot']],//banana, bread
    // ['Orangensaft', ['Orange', 'n', 'saft']],//orange, juice
    // ['Jahreszeit', ['Jahres', 'zeit']],//year, time (season)
    // ['Zungenbrecher', ['Zunge', 'n', 'Brecher']],//tongue crusher (tongue twister)
    // ['Drachenfutter', ['Drach', 'en', 'Futter']],//dragon, feeding (peace offering)
    // ['Ohrwurm', ['Ohr', 'wurm']],//ear worm
    // ['Fremdschämen', ['Fremd', 'schämen']],// Foreign + shame (cringe)
    // ['Fernweh', ['Fern', 'weh']],//far, itchy (wanderlust)
    // ['Zeitgeist', ['zeit', 'geist']],// time, spirit
    // ['Faultier', ['Faul', 'tier']],//lazy animal
    // ['Pechvogel', ['Pech', 'vogel']],//unlucky bird
    // ['Kühlschrank', ['Kühl', 's', 'chrank']],//refridgerator
    // ['Glückspilz', ['Glück', 's', 'pilz']],//lucky mushroom
    // ['Regenschirm', ['Regen', 'schirm']],//rain, screen (umbrella)
    // ['Kontaktverfolgung', ['Kontakt', 'verfolgung']],//contract tracing
    // ['Hausschuh', ['Haus', 'schuh']],//house shoe (flip flop)
    // ['Freizeit', ['Frei', 'zeit']],//free, time
    // ['Kummerspeck', ['Kummer', 'speck']],//sorrow, bacon (stress eating)
    // ['Wasserkocher', ['Wasser', 'kocher']],//water stove
    // ['Fernseher', ['Fern', 'seher']],//far observer (tv)
    // ['Determinativkompositum', ['Determinativ', 'kompositum']],//compound noun
    // ['Hotelzimmer', ['Hotel', 'Zimmer']],//hotel room
    // ['Zahnbürste', ['Zahn', 'Bürste']],//tooth brush
    // // ['Fußballweltmeisterschaft', ['Fußball', 'Weltmeisterschaft']],//world cup
    // ['Esszimmer', ['essen ', 'Zimmer']],//dining room
    // ['Schreibmaschine', ['schreiben', 'Maschine']],//typewriter
    // ['Laufschritt', ['laufen', 'Schritt']],//double quick
    // ['Großstadt', ['groß', 'Stadt']],//big city
    // ['Rotkohl', ['rot', 'Kohl']],//red cabbage
    // ['Gebrauchtwagen', ['gebraucht', 'Wagen']],//used car
    // ['Vorort', ['vor', 'Ort']],//suburb
    // ['Aberglaube', ['aber', 'Glaube']],//superstition
    // ['Staatsexamen', ['Staat', 's', 'Examen']],//state examination
    // ['Lieblingsfarbe', ['Liebling', 's', 'Farbe']],//favorite colour
    // ['Arbeitskraft', ['Arbeit', 's', 'Kraft']],//worker
    // ['Krankenschwester', ['Kranken', 'Schwester']],//nurse
    // ['Straßenlampe', ['Straßen', 'Lampe']],//street lamp
    // ['Suppelöffel', ['Suppe', 'Löffel']],//tablespoon
    // ['Bilderrahmen', ['Bild', 'er', 'Rahmen']],//(picture frame)
    // ['Schneeweiss', ['Schnee', 'Weiss']],//(snow white)
    // ['Arbeitstier', ['Arbeit', 's', 'Tier']],//(workaholic)
    // ['Hundemüde', ['Hund', 'e', 'Müde']],//(dog tired)
    // ['Landesgeld', ['Land', 'es', 'Geld']],//currency
    // ['Gedankenfreiheit', ['Gedanken', 'Freiheit']],//(freedom of thought)
    // ['Schreibtischcomputer', ['Schreibtisch', 'computer']],//
    // ['', ['', '']],//
    // ['', ['', '']],//
    // 


  ]
  arr.forEach(str => {
    let parts = str.split('|')
    let word = str.replace(/\|/, '')
    let doc = nlp(word).compute('splitter')
    t.ok(doc.has('#Noun'), word)
    let splits = doc.docs[0][0].splits || []
    t.deepEqual(parts, splits, str)
  })
  t.end()
})




