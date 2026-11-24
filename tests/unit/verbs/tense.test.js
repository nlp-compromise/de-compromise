import test from 'tape'
import nlp from '../../_lib.js'
const here = '[verb-tense] '

const run = function (t, arr, fn) {
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    doc.verbs()[fn]()
    t.equal(doc.text(), want, here + `${fn}: '${str}' → '${want}'`)
  })
}

test('toPastTense - every person:', function (t) {
  // the past-tense is the Präteritum
  run(t, [
    // weak verbs
    ['ich lerne Deutsch', 'ich lernte Deutsch'],
    ['du lernst Deutsch', 'du lerntest Deutsch'],
    ['er lernt Deutsch', 'er lernte Deutsch'],
    ['wir lernen Deutsch', 'wir lernten Deutsch'],
    ['ihr lernt Deutsch', 'ihr lerntet Deutsch'],
    ['sie lernen Deutsch', 'sie lernten Deutsch'],
    // strong verbs
    ['ich gehe nach Hause', 'ich ging nach Hause'],
    ['du gehst nach Hause', 'du gingst nach Hause'],
    ['er geht nach Hause', 'er ging nach Hause'],
    ['wir gehen nach Hause', 'wir gingen nach Hause'],
    ['ihr geht', 'ihr gingt'],
    ['sie gehen nach Hause', 'sie gingen nach Hause'],
  ], 'toPastTense')
  t.end()
})

test('toPastTense - irregular verbs:', function (t) {
  run(t, [
    ['ich bin müde', 'ich war müde'],
    ['du bist müde', 'du warst müde'],
    ['sie ist groß', 'sie war groß'],
    ['wir sind Freunde', 'wir waren Freunde'],
    ['ihr seid müde', 'ihr wart müde'],
    ['ich habe einen Hund', 'ich hatte einen Hund'],
    ['du hast recht', 'du hattest recht'],
    ['er hat Hunger', 'er hatte Hunger'],
    ['er wird Arzt', 'er wurde Arzt'],
    ['es wird kalt', 'es wurde kalt'],
    ['Sie isst einen Apfel.', 'Sie aß einen Apfel.'],
    ['du sprichst viel', 'du sprachst viel'],
    ['der Hund schläft', 'der Hund schlief'],
    ['er liest ein Buch', 'er las ein Buch'],
    ['es gibt viele Bücher', 'es gab viele Bücher'],
    ['er nimmt den Bus', 'er nahm den Bus'],
    ['sie läuft schnell', 'sie lief schnell'],
    ['ich denke nach', 'ich dachte nach'],
    ['ich bekomme einen Brief', 'ich bekam einen Brief'],
    ['er versteht mich nicht', 'er verstand mich nicht'],
    ['wir besuchen Oma', 'wir besuchten Oma'],
    ['ich arbeite heute nicht', 'ich arbeitete heute nicht'],
    ['es regnet', 'es regnete'],
    ['die Kinder spielen', 'die Kinder spielten'],
    ['sie tanzt gern', 'sie tanzte gern'],
    // modal verbs
    ['ich kann schwimmen', 'ich konnte schwimmen'],
    ['er muss arbeiten', 'er musste arbeiten'],
    ['ich will ein Eis', 'ich wollte ein Eis'],
    ['ich mag dich', 'ich mochte dich'],
    ['ich muss nach Hause gehen', 'ich musste nach Hause gehen'],
  ], 'toPastTense')
  t.end()
})

test('toPastTense - no change:', function (t) {
  run(t, [
    // already in the Präteritum
    ['er ging gestern', 'er ging gestern'],
    ['sie war krank', 'sie war krank'],
    ['wir hatten Hunger', 'wir hatten Hunger'],
    ['wir fuhren nach Berlin', 'wir fuhren nach Berlin'],
    ['wir verstanden alles', 'wir verstanden alles'],
    // the Perfekt is already in the past
    ['ich habe einen Apfel gegessen', 'ich habe einen Apfel gegessen'],
    ['ich bin nach Hause gegangen', 'ich bin nach Hause gegangen'],
    ['er hat mich angerufen', 'er hat mich angerufen'],
    ['Ich habe gegessen.', 'Ich habe gegessen.'],
    // and the Plusquamperfekt
    ['ich hatte gegessen', 'ich hatte gegessen'],
    ['weil er mich angerufen hat', 'weil er mich angerufen hat'],
  ], 'toPastTense')
  t.end()
})

test('toPresentTense:', function (t) {
  run(t, [
    ['er ging gestern', 'er geht gestern'],
    ['ich ging nach Hause', 'ich gehe nach Hause'],
    ['du gingst nach Hause', 'du gehst nach Hause'],
    ['wir gingen nach Hause', 'wir gehen nach Hause'],
    ['sie gingen nach Hause', 'sie gehen nach Hause'],
    ['sie war krank', 'sie ist krank'],
    ['ich war müde', 'ich bin müde'],
    ['wir waren Freunde', 'wir sind Freunde'],
    ['wir hatten Hunger', 'wir haben Hunger'],
    ['wir fuhren nach Berlin', 'wir fahren nach Berlin'],
    ['wir verstanden alles', 'wir verstehen alles'],
    ['sie gab ihm das Buch', 'sie gibt ihm das Buch'],
    ['er nahm den Bus', 'er nimmt den Bus'],
    ['sie lief schnell', 'sie läuft schnell'],
    ['ich lernte Deutsch', 'ich lerne Deutsch'],
    ['er konnte schwimmen', 'er kann schwimmen'],
    ['es wurde kalt', 'es wird kalt'],
    ['er rief mich an', 'er ruft mich an'],
    // already present - no change
    ['ich gehe nach Hause', 'ich gehe nach Hause'],
    ['sie ist groß', 'sie ist groß'],
    ['ich kann schwimmen', 'ich kann schwimmen'],
  ], 'toPresentTense')
  t.end()
})

test('toFutureTense - the infinitive goes last:', function (t) {
  run(t, [
    ['ich gehe nach Hause', 'ich werde nach Hause gehen'],
    ['du sprichst viel', 'du wirst viel sprechen'],
    ['Sie isst einen Apfel.', 'Sie wird einen Apfel essen.'],
    ['wir wohnen hier', 'wir werden hier wohnen'],
    ['ihr geht', 'ihr werdet gehen'],
    ['sie gehen nach Hause', 'sie werden nach Hause gehen'],
    ['Ich schlafe.', 'Ich werde schlafen.'],
    ['es regnet', 'es wird regnen'],
    ['der Hund schläft', 'der Hund wird schlafen'],
    ['die Kinder spielen', 'die Kinder werden spielen'],
    ['ich bin müde', 'ich werde müde sein'],
    ['sie ist groß', 'sie wird groß sein'],
    ['ich habe einen Hund', 'ich werde einen Hund haben'],
    ['er wird Arzt', 'er wird Arzt werden'],
    ['ich arbeite heute nicht', 'ich werde heute nicht arbeiten'],
    ['er versteht mich nicht', 'er wird mich nicht verstehen'],
    ['ich esse Brot und Käse', 'ich werde Brot und Käse essen'],
    ['ich kaufe Brot, Käse und Wein', 'ich werde Brot, Käse und Wein kaufen'],
    // from the Präteritum
    ['er ging gestern', 'er wird gestern gehen'],
    ['sie war krank', 'sie wird krank sein'],
    ['wir fuhren nach Berlin', 'wir werden nach Berlin fahren'],
    // modal verbs
    ['ich kann schwimmen', 'ich werde schwimmen können'],
    ['er muss arbeiten', 'er wird arbeiten müssen'],
    ['ich muss nach Hause gehen', 'ich werde nach Hause gehen müssen'],
    // already in the future - no change
    ['ich werde nach Hause gehen', 'ich werde nach Hause gehen'],
    ['er wird morgen kommen', 'er wird morgen kommen'],
    ['wir werden sehen', 'wir werden sehen'],
    ['weil ich gehen werde', 'weil ich gehen werde'],
  ], 'toFutureTense')
  t.end()
})

test('from the future-tense:', function (t) {
  run(t, [
    ['ich werde nach Hause gehen', 'ich ging nach Hause'],
    ['er wird morgen kommen', 'er kam morgen'],
    ['wir werden sehen', 'wir sahen'],
    ['ich werde dich anrufen', 'ich rief dich an'],
    ['weil ich gehen werde', 'weil ich ging'],
  ], 'toPastTense')
  run(t, [
    ['ich werde nach Hause gehen', 'ich gehe nach Hause'],
    ['er wird morgen kommen', 'er kommt morgen'],
    ['wir werden sehen', 'wir sehen'],
    ['ich werde dich anrufen', 'ich rufe dich an'],
    ['weil ich gehen werde', 'weil ich gehe'],
    ['Du wirst viel sprechen.', 'Du sprichst viel.'],
  ], 'toPresentTense')
  t.end()
})

test('separable verbs:', function (t) {
  run(t, [
    ['ich rufe dich an', 'ich rief dich an'],
    ['er steht früh auf', 'er stand früh auf'],
    ['er kommt morgen an', 'er kam morgen an'],
    ['ich kaufe im Supermarkt ein', 'ich kaufte im Supermarkt ein'],
    ['sie zieht nach Berlin um', 'sie zog nach Berlin um'],
    ['er bringt das Buch mit', 'er brachte das Buch mit'],
    ['er ruft an', 'er rief an'],
  ], 'toPastTense')
  // the prefix re-joins its verb
  run(t, [
    ['ich rufe dich an', 'ich werde dich anrufen'],
    ['er steht früh auf', 'er wird früh aufstehen'],
    ['er kommt morgen an', 'er wird morgen ankommen'],
    ['ich kaufe im Supermarkt ein', 'ich werde im Supermarkt einkaufen'],
    ['ich stehe um sieben auf', 'ich werde um sieben aufstehen'],
    ['sie zieht nach Berlin um', 'sie wird nach Berlin umziehen'],
    ['er bringt das Buch mit', 'er wird das Buch mitbringen'],
    ['er ruft an', 'er wird anrufen'],
    ['er rief mich an', 'er wird mich anrufen'],
  ], 'toFutureTense')
  // .. and splits off again
  run(t, [
    ['er hat mich angerufen', 'er ruft mich an'],
    ['Er ist gestern angekommen.', 'Er kommt gestern an.'],
    ['wir sind früh aufgestanden', 'wir stehen früh auf'],
    ['sie ist eingeschlafen', 'sie schläft ein'],
    ['ich werde dich anrufen', 'ich rufe dich an'],
  ], 'toPresentTense')
  t.end()
})

test('Perfekt:', function (t) {
  // 'habe gegessen' collapses into one verb
  run(t, [
    ['ich habe einen Apfel gegessen', 'ich esse einen Apfel'],
    ['Ich habe gegessen.', 'Ich esse.'],
    ['ich hatte gegessen', 'ich esse'],
    ['ich bin nach Hause gegangen', 'ich gehe nach Hause'],
    ['sie sind gegangen', 'sie gehen'],
    ['ich habe es nicht gewusst', 'ich weiß es nicht'],
    ['er hat nichts gesagt', 'er sagt nichts'],
    ['das Kind hat gut geschlafen', 'das Kind schläft gut'],
    ['wir haben viel gelernt', 'wir lernen viel'],
    ['Die Kinder haben im Garten gespielt.', 'Die Kinder spielen im Garten.'],
    ['er hat das Buch gelesen, und sie hat geschlafen', 'er liest das Buch, und sie schläft'],
  ], 'toPresentTense')
  // the participle becomes the infinitive
  run(t, [
    ['ich habe einen Apfel gegessen', 'ich werde einen Apfel essen'],
    ['Ich habe gegessen.', 'Ich werde essen.'],
    ['ich hatte gegessen', 'ich werde essen'],
    ['ich bin nach Hause gegangen', 'ich werde nach Hause gehen'],
    ['er hat mich angerufen', 'er wird mich anrufen'],
    ['wir sind früh aufgestanden', 'wir werden früh aufstehen'],
    ['er hat nichts gesagt', 'er wird nichts sagen'],
    ['Die Kinder haben im Garten gespielt.', 'Die Kinder werden im Garten spielen.'],
    ['er hat das Buch gelesen, und sie hat geschlafen', 'er wird das Buch lesen, und sie wird schlafen'],
  ], 'toFutureTense')
  t.end()
})

test('passive, and states:', function (t) {
  // 'sein' + participle is only a Perfekt for some verbs
  run(t, [
    ['die Tür ist geschlossen', 'die Tür war geschlossen'],
    ['das Haus wird gebaut', 'das Haus wurde gebaut'],
  ], 'toPastTense')
  run(t, [
    ['die Tür war geschlossen', 'die Tür ist geschlossen'],
    ['Das Buch wurde gelesen.', 'Das Buch wird gelesen.'],
  ], 'toPresentTense')
  run(t, [
    ['die Tür ist geschlossen', 'die Tür wird geschlossen sein'],
    ['das Haus wird gebaut', 'das Haus wird gebaut werden'],
    ['Das Buch wurde gelesen.', 'Das Buch wird gelesen werden.'],
  ], 'toFutureTense')
  t.end()
})

test('subordinate clauses:', function (t) {
  // the finite verb is at the end
  run(t, [
    ['weil ich nach Hause gehe', 'weil ich nach Hause ging'],
    ['ich weiß, dass er kommt', 'ich wusste, dass er kam'],
    ['ich weiß nicht, wo er wohnt', 'ich wusste nicht, wo er wohnte'],
    ['der Mann, der hier wohnt, ist nett', 'der Mann, der hier wohnte, war nett'],
    ['Wenn es regnet, bleibe ich zu Hause.', 'Wenn es regnete, blieb ich zu Hause.'],
    ['ich komme, wenn ich kann', 'ich kam, wenn ich konnte'],
    ['dass er früh aufsteht', 'dass er früh aufstand'],
  ], 'toPastTense')
  // .. and 'werden' goes after the infinitive
  run(t, [
    ['weil ich nach Hause gehe', 'weil ich nach Hause gehen werde'],
    ['ich weiß, dass er kommt', 'ich werde wissen, dass er kommen wird'],
    ['ich weiß nicht, wo er wohnt', 'ich werde nicht wissen, wo er wohnen wird'],
    ['der Mann, der hier wohnt, ist nett', 'der Mann, der hier wohnen wird, wird nett sein'],
    ['Wenn es regnet, bleibe ich zu Hause.', 'Wenn es regnen wird, werde ich zu Hause bleiben.'],
    ['weil er mich angerufen hat', 'weil er mich anrufen wird'],
    ['dass er früh aufsteht', 'dass er früh aufstehen wird'],
  ], 'toFutureTense')
  run(t, [
    ['weil ich nach Hause ging', 'weil ich nach Hause gehe'],
    ['weil er mich angerufen hat', 'weil er mich anruft'],
    ['ich wusste, dass er kam', 'ich weiß, dass er kommt'],
    ['weil ich gehen werde', 'weil ich gehe'],
  ], 'toPresentTense')
  t.end()
})

test('many clauses:', function (t) {
  run(t, [
    ['ich esse Brot und trinke Wasser', 'ich aß Brot und trank Wasser'],
    ['ich sehe ihn und er sieht mich', 'ich sah ihn und er sah mich'],
    ['er hat Hunger und sie hat Durst', 'er hatte Hunger und sie hatte Durst'],
    ['sie singt und tanzt', 'sie sang und tanzte'],
    ['ich denke, also bin ich', 'ich dachte, also war ich'],
    ['Ich gehe nach Hause. Er kommt, und sie bleibt.', 'Ich ging nach Hause. Er kam, und sie blieb.'],
    ['Er sagt: "Ich komme."', 'Er sagte: "Ich kam."'],
    ['ich versuche, das Buch zu lesen', 'ich versuchte, das Buch zu lesen'],
  ], 'toPastTense')
  run(t, [
    ['er kam, sah und siegte', 'er kommt, sieht und siegt'],
    ['ich aß Brot und trank Wasser', 'ich esse Brot und trinke Wasser'],
  ], 'toPresentTense')
  run(t, [
    ['ich esse Brot und trinke Wasser', 'ich werde Brot essen und werde Wasser trinken'],
    ['ich sehe ihn und er sieht mich', 'ich werde ihn sehen und er wird mich sehen'],
    ['er hat Hunger und sie hat Durst', 'er wird Hunger haben und sie wird Durst haben'],
    ['Ich gehe nach Hause. Er kommt, und sie bleibt.', 'Ich werde nach Hause gehen. Er wird kommen, und sie wird bleiben.'],
    ['ich versuche, das Buch zu lesen', 'ich werde versuchen, das Buch zu lesen'],
    ['Er sagt: "Ich komme."', 'Er wird sagen: "Ich werde kommen."'],
    ['ich kann lesen und schreiben', 'ich werde lesen und schreiben können'],
    ['er muss kommen oder sie geht', 'er wird kommen müssen oder sie wird gehen'],
    ['Wir gehen ins Kino, weil wir Zeit haben.', 'Wir werden ins Kino gehen, weil wir Zeit haben werden.'],
    ['Er hat gesagt, dass er kommt.', 'Er wird sagen, dass er kommen wird.'],
  ], 'toFutureTense')
  // the subject of each clause
  run(t, [
    ['ich aß Brot und der Hund trank Wasser', 'ich esse Brot und der Hund trinkt Wasser'],
    ['Der Hund, den ich sah, schlief.', 'Der Hund, den ich sehe, schläft.'],
    ['Heute schlief der Hund', 'Heute schläft der Hund'],
    ['Ich glaube, dass sie das Buch gelesen hat.', 'Ich glaube, dass sie das Buch liest.'],
    ['Er hat gesagt, dass er kommt.', 'Er sagt, dass er kommt.'],
  ], 'toPresentTense')
  // two verbs that share an auxiliary are left alone
  run(t, [
    ['ich habe gegessen und getrunken', 'ich habe gegessen und getrunken'],
    ['ich werde Brot essen und Wasser trinken', 'ich werde Brot essen und Wasser trinken'],
  ], 'toPresentTense')
  run(t, [
    ['ich habe gegessen und getrunken', 'ich habe gegessen und getrunken'],
    ['ich kann lesen und schreiben', 'ich konnte lesen und schreiben'],
  ], 'toPastTense')
  t.end()
})

test('finds the subject:', function (t) {
  // 'ging' is both first and third person, 'gehen' is both 'wir' and 'sie'
  run(t, [
    ['ich ging nach Hause', 'ich gehe nach Hause'],
    ['er ging nach Hause', 'er geht nach Hause'],
    ['sie ging nach Hause', 'sie geht nach Hause'],
    ['der Mann ging nach Hause', 'der Mann geht nach Hause'],
    ['wir gingen nach Hause', 'wir gehen nach Hause'],
    ['die Kinder gingen nach Hause', 'die Kinder gehen nach Hause'],
    ['ich war müde', 'ich bin müde'],
    ['das Kind war müde', 'das Kind ist müde'],
    // the subject may follow the verb
    ['Gestern ging ich nach Hause.', 'Gestern gehe ich nach Hause.'],
    ['Gestern ging er nach Hause.', 'Gestern geht er nach Hause.'],
    ['Dann war ich müde.', 'Dann bin ich müde.'],
  ], 'toPresentTense')
  run(t, [
    // 'sie' is 'she', or 'they'
    ['sie geht', 'sie ging'],
    ['sie gehen', 'sie gingen'],
    ['sie ist müde', 'sie war müde'],
    ['sie sind müde', 'sie waren müde'],
    // 'ihr geht' vs 'er geht'
    ['ihr geht', 'ihr gingt'],
    ['er geht', 'er ging'],
    ['ihr arbeitet viel', 'ihr arbeitetet viel'],
    ['er arbeitet viel', 'er arbeitete viel'],
    ['Heute gehe ich ins Kino.', 'Heute ging ich ins Kino.'],
    ['Morgen fahren wir nach Berlin.', 'Morgen fuhren wir nach Berlin.'],
  ], 'toPastTense')
  run(t, [
    ['ich ging nach Hause', 'ich werde nach Hause gehen'],
    ['er ging nach Hause', 'er wird nach Hause gehen'],
    ['sie gehen', 'sie werden gehen'],
    ['sie geht', 'sie wird gehen'],
    ['Heute gehe ich ins Kino.', 'Heute werde ich ins Kino gehen.'],
    ['Morgen fahren wir nach Berlin.', 'Morgen werden wir nach Berlin fahren.'],
  ], 'toFutureTense')
  t.end()
})

test('questions:', function (t) {
  run(t, [
    ['Sprichst du Deutsch?', 'Sprachst du Deutsch?'],
    ['Wann kommst du?', 'Wann kamst du?'],
    ['Wo wohnst du?', 'Wo wohntest du?'],
  ], 'toPastTense')
  run(t, [
    ['Sprichst du Deutsch?', 'Wirst du Deutsch sprechen?'],
    ['Wann kommst du?', 'Wann wirst du kommen?'],
    ['Wo wohnst du?', 'Wo wirst du wohnen?'],
  ], 'toFutureTense')
  run(t, [
    ['Sprachst du Deutsch?', 'Sprichst du Deutsch?'],
    ['Wirst du Deutsch sprechen?', 'Sprichst du Deutsch?'],
  ], 'toPresentTense')
  t.end()
})

test('leaves the other moods alone:', function (t) {
  const arr = [
    'ich würde gehen', // Konjunktiv II
    'er wäre gern hier',
    'sie könnte kommen',
    'ich möchte ein Eis',
    'ich hätte gern einen Kaffee',
    'mach das!', // imperative
    'der schwarze Hund', // no verb
    '',
  ]
  arr.forEach(str => {
    ;['toPastTense', 'toPresentTense', 'toFutureTense'].forEach(fn => {
      const doc = nlp(str)
      doc.verbs()[fn]()
      t.equal(doc.text(), str, here + `${fn}: no-change '${str}'`)
    })
  })
  // only the indicative clause changes
  run(t, [['er sagt, er sei krank', 'er sagte, er sei krank']], 'toPastTense')
  run(t, [['er sagt, er sei krank', 'er wird sagen, er sei krank']], 'toFutureTense')
  t.end()
})

test('punctuation and case:', function (t) {
  run(t, [
    ['Ich gehe nach Hause.', 'Ich ging nach Hause.'],
    ['Gehst du nach Hause?', 'Gingst du nach Hause?'],
    ['Er schläft!', 'Er schlief!'],
    ['ICH GEHE', 'ICH GING'],
    ['Er isst Brot, trinkt Wasser, und schläft.', 'Er aß Brot, trank Wasser, und schlief.'],
  ], 'toPastTense')
  run(t, [
    ['Ich gehe nach Hause.', 'Ich werde nach Hause gehen.'],
    ['Gehst du nach Hause?', 'Wirst du nach Hause gehen?'],
    ['Er schläft!', 'Er wird schlafen!'],
    ['Ich rufe dich an!', 'Ich werde dich anrufen!'],
    ['Er kommt, und sie bleibt.', 'Er wird kommen, und sie wird bleiben.'],
  ], 'toFutureTense')
  run(t, [
    ['Ich habe einen Apfel gegessen.', 'Ich esse einen Apfel.'],
    ['Hast du gut geschlafen?', 'Schläfst du gut?'],
    ['Er hat mich angerufen!', 'Er ruft mich an!'],
    ['Ich werde nach Hause gehen.', 'Ich gehe nach Hause.'],
  ], 'toPresentTense')
  t.end()
})

test('tags of the new verb:', function (t) {
  let doc = nlp('ich gehe nach Hause')
  doc.verbs().toPastTense()
  t.equal(doc.has('ging'), true, here + 'new word is matchable')
  t.equal(doc.match('ging').has('#PastTense'), true, here + 'past #PastTense')
  t.equal(doc.match('ging').has('#FirstPerson'), true, here + 'past #FirstPerson')
  t.equal(doc.match('ging').has('#PresentTense'), false, here + 'past not #PresentTense')

  doc = nlp('sie gingen nach Hause')
  doc.verbs().toPresentTense()
  t.equal(doc.match('gehen').has('#PresentTense'), true, here + 'present #PresentTense')
  t.equal(doc.match('gehen').has('#ThirdPersonPlural'), true, here + 'present #ThirdPersonPlural')
  t.equal(doc.match('gehen').has('#PastTense'), false, here + 'present not #PastTense')

  doc = nlp('du gehst nach Hause')
  doc.verbs().toFutureTense()
  t.equal(doc.match('wirst').has('#Auxiliary'), true, here + 'future #Auxiliary')
  t.equal(doc.match('wirst').has('#SecondPerson'), true, here + 'future #SecondPerson')
  t.equal(doc.match('gehen').has('#Infinitive'), true, here + 'future #Infinitive')
  t.equal(doc.has('wirst nach Hause gehen'), true, here + 'future is matchable')
  t.end()
})

test('return value:', function (t) {
  let doc = nlp('Ich habe einen Apfel gegessen und sie trinkt Wasser. Sie gehen.')
  let m = doc.verbs().toFutureTense()
  t.equal(m.viewType, 'Verbs', here + 'returns a Verbs view')
  t.deepEqual(m.out('array'), ['werde', 'wird', 'werden'], here + 'returns the finite verbs')
  t.equal(doc.text(), 'Ich werde einen Apfel essen und sie wird Wasser trinken. Sie werden gehen.', here + 'changes the document')

  m = nlp('ich gehe und er kommt').verbs().toPastTense()
  t.deepEqual(m.out('array'), ['ging', 'kam'], here + 'past result')

  // chainable
  doc = nlp('ich gehe und er kommt')
  m = doc.verbs().toPastTense().toPresentTense().toPastTense()
  t.equal(doc.text(), 'ich ging und er kam', here + 'chained')
  t.deepEqual(m.out('array'), ['ging', 'kam'], here + 'chained result')

  // round-trips
  const arr = [
    'ich gehe nach Hause',
    'Sie isst einen Apfel.',
    'wir wohnen hier',
    'ich rufe dich an',
    'er steht früh auf',
    'ich bin müde',
    'ich kann schwimmen',
    'weil ich nach Hause gehe',
    'ich weiß, dass er kommt',
    'Sprichst du Deutsch?',
    'ich esse Brot und Käse',
    'Heute gehe ich ins Kino.',
    'ich kann lesen und schreiben',
    'Wir gehen ins Kino, weil wir Zeit haben.',
  ]
  arr.forEach(str => {
    doc = nlp(str)
    doc.verbs().toPastTense()
    doc.verbs().toPresentTense()
    t.equal(doc.text(), str, here + `past round-trip '${str}'`)
    doc.verbs().toFutureTense()
    doc.verbs().toPresentTense()
    t.equal(doc.text(), str, here + `future round-trip '${str}'`)
    doc.verbs().toFutureTense()
    doc.verbs().toPastTense()
    doc.verbs().toPresentTense()
    t.equal(doc.text(), str, here + `future-past round-trip '${str}'`)
  })
  t.end()
})

test('nth verb only:', function (t) {
  let doc = nlp('ich gehe und er kommt')
  doc.verbs().toPastTense(1)
  t.equal(doc.text(), 'ich gehe und er kam', here + 'toPastTense(1)')
  doc = nlp('ich gehe und er kommt')
  doc.verbs(0).toFutureTense()
  t.equal(doc.text(), 'ich werde gehen und er kommt', here + 'verbs(0)')
  doc = nlp('ich gehe und er kommt')
  doc.verbs().toPastTense(5)
  t.equal(doc.text(), 'ich gehe und er kommt', here + 'out-of-range')
  // only the matched part of the document
  doc = nlp('ich gehe. er kommt.')
  doc.eq(1).verbs().toPastTense()
  t.equal(doc.text(), 'ich gehe. er kam.', here + 'second sentence only')
  // the participle on its own does nothing
  doc = nlp('ich habe einen Apfel gegessen')
  doc.match('gegessen').verbs().toPresentTense()
  t.equal(doc.text(), 'ich habe einen Apfel gegessen', here + 'participle only')
  doc.match('habe').verbs().toPresentTense()
  t.equal(doc.text(), 'ich esse einen Apfel', here + 'auxiliary only')
  // an empty match
  const none = nlp('das rote Haus').match('foo').verbs()
  t.equal(none.toPastTense().found, false, here + 'empty toPastTense')
  t.equal(none.toFutureTense().length, 0, here + 'empty toFutureTense')
  t.end()
})
