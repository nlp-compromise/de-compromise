// in german, '3.' is 'third' - so 'am 3. Mai' is not the end of a sentence.
// this runs after the sentence-splitter, and puts those back together.
// (and street-names too - 'in der Hauptstr. 5')
const endsNumber = /(?:(\S+)\s+)?(?:\d+|[IVX]{2,})\.\s*$/
const endsStreet = /\p{L}str\.\s*$/u
const endsNewline = /\n\s*$/
const startsLower = /^\p{Ll}/u
const firstWord = /^\p{L}+/u
const toSet = str => new Set(str.split(/\s+/))

// an ordinal comes after one of these - 'der 3. Mann'
const before = toSet(`am im vom zum beim zur der die das den dem des ein eine einen einem einer
  jeder jede jedes jeden mein meine meinen sein seine seinen ihr ihre ihren unser unsere unseren
  und bis oder ab seit nach v.`)
// .. or before one of these - '3. Mai'
const months = toSet(`Januar Jänner Februar März April Mai Juni Juli August September Oktober November Dezember
  Jan Feb Mär Apr Jun Jul Aug Sep Sept Okt Nov Dez`)
// .. but these begin a new sentence - 'Sie wohnt im 4. Das ist hoch.'
const starters = toSet(`Der Die Das Er Sie Es Ich Du Wir Ihr Man Wer Was Wie Wo Wann Warum
  Und Aber Doch Oder Denn Da Dort Hier Dann Danach Nun Also Auch Heute Morgen Jetzt Später`)

// does the sentence carry on, after this period?
const isOrdinal = function (last, str) {
  if (endsNewline.test(last)) {
    return false
  }
  const next = (str.match(firstWord) || [])[0]
  if (endsStreet.test(last)) {
    return !starters.has(next)
  }
  const m = last.match(endsNumber)
  if (m === null) {
    return false
  }
  // 'Heinrich VIII. war König'
  if (startsLower.test(str)) {
    return true
  }
  if (months.has(next)) {
    return true
  }
  // a number at the very start - '1. FC Köln'
  if (m[1] === undefined) {
    return !starters.has(next)
  }
  return before.has(m[1].toLowerCase()) && !starters.has(next)
}

const mergeOrdinals = function (arr) {
  const out = []
  arr.forEach(str => {
    const last = out[out.length - 1]
    if (last !== undefined && isOrdinal(last, str)) {
      out[out.length - 1] += str
      return
    }
    out.push(str)
  })
  return out
}

/** add a german step to the end of the english sentence-splitter */
const wrap = function (splitSentences) {
  return (text, world) => mergeOrdinals(splitSentences(text, world))
}
export default wrap
