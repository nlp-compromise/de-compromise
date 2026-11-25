import test from 'tape'
import nlp from '../../_lib.js'
const here = '[de-sentence-rules] '

// each line is one text - a '|' marks where one sentence ends, and the next begins
const run = function (t, cases) {
  cases
    .split('\n')
    .map(str => str.trim())
    .filter(str => str)
    .forEach(str => {
      const want = str.split('|').map(s => s.trim())
      const text = want.join(' ')
      t.deepEqual(nlp(text).fullSentences().out('array'), want, here + text)
    })
  t.end()
}

test('abbreviations:', function (t) {
  run(
    t,
    `
    Das ist z.B. ein Test. | Er kam an.
    Das ist z. B. ein Test.
    Das kostet ca. 5 Euro. | Gut.
    Siehe S. 5 und Abs. 3 des Vertrags.
    Vgl. dazu Nr. 4. | Das reicht.
    Das kostet 5 Mio. Euro inkl. MwSt. pro Jahr.
    Hr. Schmidt und Fr. Meier kommen.
    Im 19. Jh. n. Chr. war das so.
    Mo. bis Fr. geöffnet.
    Das ist i. d. R. so, m. E. jedenfalls.
    Wir kaufen Äpfel, Birnen usw. und gehen heim.
    Er mag Tee usw. Sie mag Kaffee.
    Das ist gut bzw. schlecht.
    Die Fa. Müller GmbH liefert.
    Ich wohne in der Hauptstr. 5 in Köln.
    Das gilt u.a. für Hunde, evtl. auch für Katzen.
    Er kommt ggf. später, d.h. gegen Abend.
    Prof. Dr. Schmidt kommt. | Er ist nett.
    Dr. med. Weber hat heute keine Sprechstunde.
    Dipl.-Ing. Karl Braun leitet das Projekt.
    Die Kosten betragen rd. 3 Mrd. Euro.
    Bitte lesen Sie Kap. 3 bzw. Anm. 7.
    Die Miete beträgt 800 Euro zzgl. Nebenkosten.
    Das gilt bes. für Kinder unter 6 J. und Senioren.
    Wir liefern Mo., Di. und Fr. aus.
    Tel. 030 123456, Fax 030 654321.
    Sehr geehrter Hr. Dr. Klein, vielen Dank.
    Das Buch erschien im Verlag C. H. Beck.
    Johann W. von Goethe schrieb Faust.
    J. S. Bach wurde 1685 geboren. | Er starb 1750.
    Die Firma Müller & Co. KG ist insolvent.
    Das entspricht ca. 20 % bzw. 4 Std. pro Woche.
    Er verdient mind. 3000 Euro mtl. brutto.
    Das ist o. Ä. gemeint.
    Siehe Abb. 3 und Tab. 2 auf S. 14 ff. des Berichts.
    Frankfurt a. M. liegt in Hessen. | Köln nicht.
    Er wohnt in St. Gallen. | Sie auch.
    Das war 300 v. Chr. in Rom.
    Die Sitzung dauert 2 Std. 30 Min. und endet pünktlich.
    Geöffnet tägl. von 9 bis 18 Uhr.
    Ihr Schreiben v. 3. März liegt uns vor.
    Bitte wenden Sie sich an Fr. Dr. Schulz. | Sie hilft Ihnen.
    Das Haus in der Goethestr. ist alt.
    Er kam lt. Polizei gegen Mitternacht.
    Das sog. Wunder blieb aus.
    Die Preise sind exkl. Versand.
    Wir suchen Mitarbeiter (m/w/d) bzgl. der neuen Stelle.
    Der Hrsg. des Bandes ist unbekannt.
    Im Jan. und Feb. ist es kalt, im Aug. warm.
    Am 3. Okt. ist Feiertag.
  `
  )
})

test('not abbreviations:', function (t) {
  run(
    t,
    `
    Die Straße ist eng. | Wir fahren langsam.
    Das ist ein Gen. | Es mutiert.
    Wie ist deine PLZ? | Ich brauche sie.
    Was sagt der Dr? | Nichts.
    Er spielt im Tor. | Sie im Sturm.
    Das ist eine Art. | Sie gefällt mir.
    Ich weiß, was er mag. | Er mag Kuchen.
    Das ist Max. | Er ist mein Bruder.
    Es ist so. | Glaub mir.
    Sie kam aus dem Bad. | Er wartete.
    Das Auto ist rot. | Der Bus ist blau.
    Wir haben kein Geld. | Trotzdem fahren wir.
    Er hat die Wahl. | Sie nicht.
    Sie trinkt Tee. | Er trinkt Bier.
    Das war ein Fest! | Alle waren da.
    Kommst du mit? | Ich gehe jetzt.
    Er sagte ja. | Sie sagte nein.
    Ich sehe das Tal. | Es ist grün.
    Wir fahren nach Ulm. | Dort wohnt Oma.
    Das ist mir egal. | Mach, was du willst.
    Sie ist die Chefin. | Er ist ihr Assistent.
    Der Zug hat Verspätung. | Wir warten.
    Ich mag den Mai. | Dann blüht alles.
    Er ist im Bett. | Lass ihn schlafen.
    Das ist zu viel. | Nimm weniger.
    Hallo! | Wie geht es dir? | Mir geht es gut.
    Besuchen Sie www.example.de für mehr. | Danke.
    Die Datei heißt test.txt und ist groß.
    Version 2.0 ist da. | Sie ist schneller.
  `
  )
})

test('ordinals and numbers:', function (t) {
  run(
    t,
    `
    Er kam am 3. Mai an.
    Er wurde 1990 geboren, sie 1995. | Beide leben in Köln.
    Ich habe 5. | Du hast 3.
    Das Treffen ist am 12.03.2024. Bitte kommen Sie.
    Er wohnt im 3. Stock. | Sie im 4. | Das ist hoch.
    Heinrich VIII. war König. | Er starb.
    Er kam um 15.30 Uhr. | Sie nicht.
    Das kostet 1.234,56 Euro. | Das ist viel.
    Am 24.12.2020 war Weihnachten. | Es schneite.
    Der 1. FC Köln gewann 3:1.
    Sie belegte den 2. Platz. | Er wurde Letzter.
    Am 1. Januar beginnt das neue Jahr.
    Das 20. Jahrhundert war turbulent.
    Ludwig XIV. regierte lange. | Er baute Versailles.
    Wir treffen uns am 15. um 10 Uhr.
    Der 102. Tag des Jahres ist im April.
    Heute ist der 3.10. und wir feiern.
    Die Zahl liegt bei 3,5 Prozent. | Das ist wenig.
    Er ist 30. | Sie ist 28.
    Das war im Jahr 2020. | Es war hart.
    Sie wurde 1985 in Wien geboren. | Dort lebt sie noch.
    Papst Benedikt XVI. trat 2013 zurück.
    Im 2. Weltkrieg starben Millionen.
    Es sind 20. | Wir brauchen 30.
    Am 3. und 4. Juni ist geschlossen.
    Vom 1. bis 5. August sind wir im Urlaub. | Danach geht es weiter.
    Die 3. Auflage erschien 2019. | Sie ist vergriffen.
    Er lief die 100 Meter in 10,5 Sekunden. | Das war Rekord.
  `
  )
})

test('quotations and dialogue:', function (t) {
  run(
    t,
    `
    Er sagte: „Nein. Ich gehe nicht.“ Dann ging er.
    Er sagte: »Nein. Ich gehe.« Dann ging er.
    Er sagte: „Ich komme.“ Dann ging er.
    „Komm her!“, rief sie. | Er kam.
    Sie sagte: "Nein." Dann ging sie.
    Er hat (wie immer. Leider.) verloren. | Schade.
    „Wo bist du?“, fragte sie. | „Hier“, antwortete er.
    „Das ist schön!“ Sie lachte.
    „Ich weiß nicht. Vielleicht morgen. Mal sehen.“ Er zuckte mit den Schultern.
    »Komm!«, rief er. | »Nein!«, rief sie.
    Sie fragte: „Warum?“ Er schwieg.
    „Hilfe!“ schrie er.
    Er dachte (ganz kurz) nach. | Dann sprach er.
    Das Schild sagte „Stop“. | Wir hielten an.
    „Nein“, sagte sie. | „Doch“, sagte er.
    Was?! | Das kann nicht sein!
    Er rief: „Achtung!“ Alle sprangen zur Seite.
    Ich weiß nicht... vielleicht morgen.
    Was? | Wirklich?! | Ja...
    „Geh nicht. Bleib hier. Bitte.“ Sie blieb.
    Sie flüsterte: »Leise. Er schläft.« Wir schlichen hinaus.
  `
  )
})

test('harder cases:', function (t) {
  run(
    t,
    `
    Er ist jetzt 30. | Köln gefällt ihm.
    Wir waren zu 4. | Niemand fehlte.
    Berlin, 3. Mai 2020.
    Montag, 3. März, ist frei.
    Unsere 2. Mannschaft spielt morgen.
    Jeder 3. Deutsche hat ein Auto.
    Es regierte Ludwig XIV. | Er war mächtig.
    Wähle Plan B. Dann geht es.
    Er hat Vitamin C. Das hilft.
    Sie wohnt in Haus A. Er in Haus B.
    Das ist Punkt 1. | Punkt 2 folgt.
    Ich war bei Dr. Müller. | Er ist nett.
    Frag den Dr. Er weiß es.
    Er kam um 8 Uhr. | Um 9 ging er.
    Das kostet 5 Euro pro Std. Das ist fair.
    „Nein!“ „Doch!“
    ‚Ja‘, sagte er. | ‚Nein‘, sagte sie.
    Er sagte: „Komm.“ „Nein“, sagte ich.
    Das war’s. | Mehr gibt es nicht.
    Er rief: „Halt! Stehen bleiben! Polizei!“ Niemand blieb stehen.
    Sie kommt aus den USA. | Er aus der EU.
    Ich arbeite bei der Fa. Bosch. | Sie bei VW.
    Er hat einen Dr. phil. und einen Dr. rer. nat. erworben.
    Das Spiel endete 2:1 n. V. für Bayern.
    Treffpunkt: Hbf. Köln, Gleis 5.
    Er studiert an der Univ. Wien.
    Der Betrag i. H. v. 500 Euro ist fällig.
    Das Gerät kostet 99,- Euro. | Es ist neu.
    Er ist am 5.5. geboren. | Sie am 6.6.
    Um 8 Uhr 30. | Dann beginnt der Film.
    Sie sind zu 3. | Wir sind zu 5.
    Das steht auf S. 12. | Lies es nach.
    Siehe Kap. 3. | Dort steht alles.
    Am 3. kommt er. | Am 5. geht er.
    Heute ist der 1. | Morgen ist der 2.
    Die Nr. 1 der Welt ist er.
    Platz 1. | Platz 2. | Platz 3.
    Das Konzert ist am 12.03. | Wir gehen hin.
    Der Preis liegt bei 3,5. | Das ist niedrig.
    Im Jahr 2020. | Köln war leer.
    Er wurde 80. | Seine Frau wurde 79.
    Sie hat 3. | Peter hat 5.
    Am 24. Dezember ist Heiligabend. | Am 25. ist Weihnachten.
    Das 3. Kapitel ist lang. | Das 4. ist kurz.
    Die Antwort ist 42. | Niemand weiß warum.
    Es waren ca. 50. | Später kamen mehr.
    Er bekam die Note 1. | Seine Eltern freuten sich.
    Wir sehen uns am Mo. Dann reden wir.
    Der Umsatz stieg um 5 Mio. Das ist ein Rekord.
    Äpfel, Birnen usw. Alles war frisch.
    Ich komme evtl. später. | Warte nicht.
    Er arbeitet bei Siemens. | Sie bei Bosch.
    Geh zu Hr. Meier. | Er hilft dir.
    Karl V. herrschte über ein Weltreich.
    Friedrich II. von Preußen starb 1786. | Er war König.
    Das ist die 1. Hilfe.
    Er ist Dr. Sie ist Prof.
    Komm bitte um 5. | Früher geht es nicht.
  `
  )
})

test('longer texts:', function (t) {
  run(
    t,
    `
    Siehe Abb. A und Tab. B im Anhang.
    Das steht in Bd. II der Ausgabe.
    Am Mo. Abend ist geschlossen.
    Hr. Dr. Weber, Fr. Prof. Lang und Dipl.-Ing. Kurz nahmen teil.
    Am 3. Oktober 1990 wurde Deutschland wiedervereinigt. | Seitdem ist der 3. Oktober ein Feiertag. | Viele Menschen feiern in Berlin.
    Die Firma wurde 1950 gegründet. | Heute hat sie ca. 500 Mitarbeiter. | Der Umsatz lag 2023 bei 80 Mio. Euro.
    Er kam um 7 Uhr an. | Niemand war da. | Also wartete er bis ca. 8 Uhr. | Dann ging er.
    „Wie spät ist es?“, fragte sie. | „Es ist kurz nach 3“, sagte er. | Sie nickte.
    Der 2. Platz ging an Anna. | Der 3. an Ben.
    Wir brauchen Mehl, Eier, Zucker usw. Hast du alles?
    Die Wohnung liegt im 4. OG. | Einen Aufzug gibt es nicht.
    Sie verdient ca. 4.000 Euro brutto, d. h. etwa 2.500 netto. | Das reicht ihr.
    Im 1. Halbjahr 2024 stieg der Gewinn. | Im 2. sank er wieder.
    Vgl. hierzu Kap. 2, S. 14 f. Dort wird das erklärt.
    Er ist 1,80 m groß. | Sie ist 1,65 m.
    Das Paket wiegt 2 kg. | Der Versand kostet 5 Euro.
    Goethe wurde am 28. August 1749 in Frankfurt a. M. geboren. | Er starb 1832 in Weimar.
  `
  )
})
