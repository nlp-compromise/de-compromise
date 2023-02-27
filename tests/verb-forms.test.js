import test from 'tape'
import nlp from './_lib.js'
let here = '[verb-forms] '

test('schmecken-taste', function (t) {
  let forms = [
    // INDIKATIV
    // Präsens
    ['schmecke', 'schmeckst', 'schmeckt', 'schmecken', 'schmeckt', 'schmecken'],
    // Präteritum
    ['schmeckte', 'schmecktest', 'schmeckte', 'schmeckten', 'schmecktet', 'schmeckten'],
    // Futur I
    ['werde schmecken', 'wirst schmecken', ' wird schmecken', 'werden schmecken', 'werdet schmecken', 'werden schmecken'],
    // Perfekt
    ['habe geschmeckt', 'hast geschmeckt', 'hat geschmeckt', 'haben geschmeckt', 'habt geschmeckt', 'haben geschmeckt'],
    // Plusquamperfekt
    ['hatte geschmeckt', 'hattest geschmeckt', 'hatte geschmeckt', 'hatten geschmeckt', 'hattet geschmeckt', 'hatten geschmeckt'],
    // Futur II
    ['werde geschmeckt haben', 'wirst geschmeckt haben', 'wird geschmeckt haben', 'werden geschmeckt haben', 'werdet geschmeckt haben', 'werden geschmeckt haben'],
    // KONJUNKTIV I
    // Präsens
    ['schmecke', 'schmeckest', 'schmecke', 'schmecken', 'schmecket', 'schmecken'],
    // Futur I
    ['werde schmecken', 'werdest schmecken', 'werde schmecken', 'werden schmecken', 'werdet schmecken', 'werden schmecken'],
    // Perfekt
    ['habe geschmeckt', 'habest geschmeckt', 'habe geschmeckt', 'haben geschmeckt', 'habet geschmeckt', 'haben geschmeckt'],
    // KONJUNKTIV II
    // Futur II
    ['werde geschmeckt haben', 'werdest geschmeckt haben', 'werde geschmeckt haben', 'werden geschmeckt haben', 'werdet geschmeckt haben', 'werden geschmeckt haben'],
    // Präteritum
    ['schmeckte', 'schmecktest', 'schmeckte', 'schmeckten', 'schmecktet', 'schmeckten'],
    // Futur I
    ['würde', 'schmecken würdest', 'schmecken würde', 'schmecken würden', 'schmecken', 'würdet', 'schmecken', 'würden', 'schmecken'],
    // Plusquamperfekt
    ['hätte geschmeckt', 'hättest geschmeckt', 'hätte geschmeckt', 'hätten geschmeckt', 'hättet geschmeckt', 'hätten geschmeckt'],
    // Futur II
    ['würde geschmeckt haben', 'würdest geschmeckt haben', 'würde geschmeckt haben', 'würden geschmeckt haben', 'würdet geschmeckt haben', 'würden geschmeckt haben'],
    // IMPERATIV PRÄSENS
    ['schmecke', 'schmecken', 'schmeckt', 'schmecken']
  ]
  forms.forEach(arr => {
    console.log(arr.length)
    arr.forEach(str => {
      t.equal(nlp(str).has('{schmecken}'), true, here + str)
    })
  })
  t.end()
})