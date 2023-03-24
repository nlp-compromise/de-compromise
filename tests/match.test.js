import test from 'tape'
import nlp from './_lib.js'
let here = '[de-match] '

test('match:', function (t) {
  let arr = [
    ['Wir gehen in den Park', '#Pronoun #Verb in #Determiner #Noun'],
    ['Kanada ist sehr kalt', '#Noun #Verb #Adverb #Adjective'],
    ['hinterm', '#Adverb #Determiner'],// contraction
    ['Spencer geht zum Laden', '#Person #Verb zu #Determiner #Noun'],
    ['Spencer geht zum Laden', '#Person geht zum #Noun'],
    // contractions
    ['zum', 'zum'],
    ['zum', 'zu .'],
    ['zum', 'zu dem'],

    ['juni', '#Month'],
    ['donnerstag', '#WeekDay'],
    ['234', '#Value'],
    ['chicago', '#City'],
    ['Jamaika', '#Country'],
    ['colorado', '#Place'],
    ['tony', '#MaleName'],
    ['64. Hund', '#Ordinal #Noun'],
    ['ho chi minh', '#City+'],
    ['Ignoriere den Tyrann', '#Verb #Determiner #Noun'],
    ['einer [blauen] [Höhle] des Eises', '#Determiner #Adjective #Noun . #Noun'], //the blue cave of ice
    ['Er kocht für die Kinder.', '#Pronoun #Verb #Preposition #Determiner #Noun'],//“He cooks for the children.”
    ['Sie geht durch den Wald.', '#Pronoun #Verb #Preposition #Determiner #Noun'],// “She walks through the forest.”
    ['Wir spielen ohne dich.', '#Pronoun #Verb #Preposition #Noun'],// “We are playing without you.”
    ['Wir laufen um das Haus.', '#Pronoun #Verb #Preposition #Determiner #Noun'],// “We run around the house.”

    ["Ich wohne bei meinem Freund.", '#Pronoun #Verb #Preposition #Pronoun #Noun'],//“I live with my boyfriend.”
    ["Nach dem Unterricht treffen wir.", '#Proposition #Determiner #Noun #Verb #Pronoun'],//“We’re meeting after (the) class.”
    ["Ich habe es von meinem Bruder gehört.", '#Pronoun #Verb #Pronoun #Preposition #Pronoun #Noun #Verb'],//“I heard it from my brother.”
    ["Wir gehen zum Festival.", '#Pronoun #Verb #Preposition #Noun'],//“We’re going to the festival.”
    ["Alle außer ihm gab mir ein Geschenk.", '#Noun . #Pronoun #Verb #Pronoun #Determiner #Noun'],//“Everyone but him gave me a gift.”
    // ['', ''],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})
