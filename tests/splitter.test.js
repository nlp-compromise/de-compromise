import test from 'tape'
import nlp from './_lib.js'
let here = '[de-splitter] '
nlp.verbose(false)

test('splitter:', function (t) {
  let arr = [
    ['Schneeeule', ['Schnee', 'Eule']], //snowy owl
    ['Fallschirmspringerschule', ['Fallschirm', 'Springer', 'Schule']],//parachute jumper school
    ['Siebentausendzweihundertvierundfünfzig', ['Sieben', 'tausend', 'zwei', 'hundert', 'vier', 'fünfzig']],//7,254
    ['Nahrungsmittelunverträglichkeit', ['Nahrungsmittel', 'Unverträglichkeit']],//food intolerance
    ['Schweinswal', ['Schwein', 'Wal']],//pig, whale (porpoise)
    ['Bananenbrot', ['Banane', 'brot']],//banana, bread
    ['Orangensaft', ['Orange', 'saft']],//orange, juice
    ['Jahreszeit', ['Jahr', 'zeit']],//year, time (season)
    ['Zungenbrecher', ['Zunge', 'Brecher']],//tongue crusher (tongue twister)
    ['Drachenfutter', ['Drach', 'Futter']],//dragon, feeding (peace offering)
    ['Ohrwurm', ['Ohr', 'wurm']],//ear worm
    ['Fremdschämen', ['Fremd', 'schämen']],// Foreign + shame (cringe)
    ['Fernweh', ['Fern', 'weh']],//far, itchy (wanderlust)
    ['Zeitgeist', ['zeit', 'geist']],// time, spirit
    ['Faultier', ['Faul', 'tier']],//lazy animal
    ['Pechvogel', ['Pech', 'vogel']],//unlucky bird
    ['Kühlschrank', ['Kühl', 'chrank']],//refridgerator
    ['Glückspilz', ['Glück', 'pilz']],//lucky mushroom
    ['Regenschirm', ['Regen', 'schirm']],//rain, screen (umbrella)
    ['Kontaktverfolgung', ['Kontakt', 'verfolgung']],//contract tracing
    ['Hausschuh', ['Haus', 'schuh']],//house shoe (flip flop)
    ['Freizeit', ['Frei', 'zeit']],//free, time
    ['Kummerspeck', ['Kummer', 'speck']],//sorrow, bacon (stress eating)
    ['Wasserkocher', ['Wasser', 'kocher']],//water stove
    ['Fernseher', ['Fern', 'seher']],//far observer (tv)
    ['Determinativkompositum', ['Determinativ', 'kompositum']],//compound noun
    ['Hotelzimmer', ['Hotel', 'Zimmer']],//hotel room
    ['Zahnbürste', ['Zahn', 'Bürste']],//tooth brush
    ['Fußballweltmeisterschaft', ['Fußball', 'Weltmeisterschaft']],//world cup
    ['Esszimmer', ['essen ', 'Zimmer']],//dining room
    ['Schreibmaschine', ['schreiben', 'Maschine']],//typewriter
    ['Laufschritt', ['laufen', 'Schritt']],//double quick
    ['Großstadt', ['groß', 'Stadt']],//big city
    ['Rotkohl', ['rot', 'Kohl']],//red cabbage
    ['Gebrauchtwagen', ['gebraucht', 'Wagen']],//used car
    ['Vorort', ['vor', 'Ort']],//suburb
    ['Aberglaube', ['aber', 'Glaube']],//superstition
    ['Staatsexamen', ['Staat', 'Examen']],//state examination
    ['Lieblingsfarbe', ['Liebling', 'Farbe']],//favorite colour
    ['Arbeitskraft', ['Arbeit', 'Kraft']],//worker
    ['Krankenschwester', ['Kranken', 'Schwester']],//nurse
    ['Straßenlampe', ['Straßen', 'Lampe']],//street lamp
    ['Suppelöffel', ['Suppen', 'Löffel']],//tablespoon
    ['Bilderrahmen', ['Bild', 'Rahmen']],//(picture frame)
    ['Schneeweiss', ['Schnee', 'Weiss']],//(snow white)
    ['Arbeitstier', ['Arbeit', 'Tier']],//(workaholic)
    ['Hundemüde', ['Hund', 'Müde']],//(dog tired)
    ['Landesgeld', ['Land', 'Geld']],//currency
    ['Gedankenfreiheit', ['Gedank', 'Freiheit']],//(freedom of thought)
    ['Schreibtischcomputer', ['“Schreibtisch', 'computer']],//
    // ['', ['', '']],//
    // ['', ['', '']],//
    // 


  ]
  arr.forEach(a => {
    let [str, parts] = a
    let doc = nlp(str).compute('splitter')
    let splits = doc.docs[0][0].splitz
    splits.forEach((splt, i) => {
      t.equal(splt, parts[i], here + ` ${str}`)
    })
  })
  t.end()
})






