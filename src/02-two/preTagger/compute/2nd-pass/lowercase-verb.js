// german nouns are capitalized, so a lower-case word that we only know as a noun is something else
// 'sie [schloss] die Tür' is 'schließen', not 'das Schloss'
const tenses = { present: 'PresentTense', past: 'PastTense' }
const persons = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}
const toArray = (tags) => (typeof tags === 'string' ? [tags] : tags || [])

const lowercaseVerb = function (terms, i, world) {
  const term = terms[i]
  const str = term.normal
  if (i === 0 || !term.text || term.text[0] !== term.text[0].toLowerCase()) {
    return null
  }
  const lexicon = world.model.one.lexicon
  const known = toArray(lexicon[str])
  if (known.length === 0 || !known.every((tag) => tag === 'Plural' || /Noun$/.test(tag))) {
    return null
  }
  // is it a form of a verb that we know?
  const isVerb = (inf) => toArray(lexicon[inf]).includes('Infinitive')
  const found = world.methods.two.transform.verb.lookup(str, { isVerb, known: true, tenses: Object.keys(tenses) })
  if (!found) {
    return null
  }
  const { tense, person } = found.hits[0]
  term.tags.clear()
  world.methods.one.setTag([term], ['Verb', tenses[tense], persons[person]], world, false, '2-lowercase-verb')
  return true
}
export default lowercaseVerb
