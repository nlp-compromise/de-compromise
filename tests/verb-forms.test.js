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
    ['würde schmecken', 'würdest schmecken', 'würde schmecken', 'würden schmecken', 'würdet schmecken', 'würden schmecken'],
    // Plusquamperfekt
    ['hätte geschmeckt', 'hättest geschmeckt', 'hätte geschmeckt', 'hätten geschmeckt', 'hättet geschmeckt', 'hätten geschmeckt'],
    // Futur II
    ['würde geschmeckt haben', 'würdest geschmeckt haben', 'würde geschmeckt haben', 'würden geschmeckt haben', 'würdet geschmeckt haben', 'würden geschmeckt haben'],
    // IMPERATIV PRÄSENS
    ['schmecke', 'schmecken', 'schmeckt', 'schmecken']
  ]
  forms.forEach(arr => {
    arr.forEach(str => {
      t.equal(nlp(str).has('{schmecken}'), true, here + str)
    })
  })
  t.end()
})


test('schwimmen -swim', function (t) {
  let forms = [
    // INDIKATIV
    // Präsens
    ['schwimme', 'schwimmst', 'schwimmt', 'schwimmen', 'schwimmt', 'schwimmen'],
    // Präteritum
    ['schwamm', 'schwammst', 'schwamm', 'schwammen', 'schwammt', 'schwammen'],
    // Futur I
    ['werde schwimmen', 'wirst schwimmen', 'wird schwimmen', 'werden schwimmen', 'werdet schwimmen', 'werden schwimmen'],
    // Perfekt
    ['bin geschwommen', 'bist geschwommen', 'ist geschwommen', 'sind geschwommen', 'seid geschwommen', 'sind geschwommen'],
    // Plusquamperfekt
    ['war geschwommen', 'warst geschwommen', 'war geschwommen', 'waren geschwommen', 'wart geschwommen', 'waren geschwommen'],
    // Futur II
    ['werde geschwommen sein', 'wirst geschwommen sein', 'wird geschwommen sein', 'werden geschwommen sein', 'werdet geschwommen sein', 'werden geschwommen sein'],
    // KONJUNKTIV IPräsens
    ['schwimme', 'schwimmest', 'schwimme', 'schwimmen', 'schwimmet', 'schwimmen'],
    // Futur I
    ['werde schwimmen', 'werdest schwimmen', 'werde schwimmen', 'werden schwimmen', 'werdet schwimmen', 'werden schwimmen'],
    // Perfekt
    ['sei geschwommen', 'seiest geschwommen', 'sei geschwommen', 'seien geschwommen', 'seiet geschwommen', 'seien geschwommen'],
    // KONJUNKTIV IIFutur II
    ['werde geschwommen sein', 'werdest geschwommen sein', 'werde geschwommen sein', 'werden geschwommen sein', 'werdet geschwommen sein', 'werden geschwommen sein'],
    // Präteritum
    ['schwämme', 'schwämmest', 'schwämme', 'schwämmen', 'schwämmet', 'schwämmen'],
    // ['schwömme', 'schwömmest', 'schwömme', 'schwömmen', 'schwömmet', 'schwömmen'],
    // Futur I
    ['würde schwimmen', 'würdest schwimmen', 'würde schwimmen', 'würden schwimmen', 'würdet schwimmen', 'würden schwimmen'],
    // Plusquamperfekt
    ['wäre geschwommen', 'wärest geschwommen', 'wäre geschwommen', 'wären geschwommen', 'wäret geschwommen', 'wären geschwommen'],
    // Futur II
    ['würde geschwommen sein', 'würdest geschwommen sein', 'würde geschwommen sein', 'würden geschwommen sein', 'würdet geschwommen sein', 'würden geschwommen sein'],
    // IMPERATIV PRÄSENS
    // ['schwimm', 'schwimmen', 'schwimmt', 'schwimmen'],
    ['schwimme', 'schwimmen', 'schwimmt', 'schwimmen'],
  ]
  forms.forEach(arr => {
    arr.forEach(str => {
      t.equal(nlp(str).has('{schwimmen}'), true, here + str)
    })
  })
  t.end()
})