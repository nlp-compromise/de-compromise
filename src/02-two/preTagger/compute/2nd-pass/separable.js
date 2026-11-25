// a separable verb is written as one word, at the end of a subordinate clause
// 'weil ich dich anrufe', 'ob er mitkommt'
// - we may only know 'rufe' and 'kommt', so look for the verb behind the prefix
const prefixes = [
  'zusammen', 'zurück', 'weiter', 'vorbei', 'heraus', 'herein', 'hinaus', 'hinein', 'herum', 'fort', 'fest',
  'nach', 'teil', 'weg', 'vor', 'mit', 'los', 'her', 'hin', 'ein', 'bei', 'aus', 'auf', 'ab', 'an', 'zu',
]
const finite = ['PresentTense', 'PastTense']
const persons = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']

const toArray = (tags) => (typeof tags === 'string' ? [tags] : tags || [])

const separable = function (terms, i, world) {
  const term = terms[i]
  const str = term.normal
  // german nouns are capitalized, so a lower-case word is something else
  if (i === 0 || !term.text || term.text[0] !== term.text[0].toLowerCase()) {
    return null
  }
  const lexicon = world.model.one.lexicon
  const known = toArray(lexicon[str])
  // only an unknown word, or one that we know as a noun
  // (an unknown word may have been guessed as a plain verb, already)
  const isGuess = known.length === 0 && term.tags.size === 1
  if ((term.tags.has('Verb') && !isGuess) || known.some((tag) => tag !== 'Plural' && tag !== 'Noun' && !/Noun$/.test(tag))) {
    return null
  }
  for (let k = 0; k < prefixes.length; k += 1) {
    const prefix = prefixes[k]
    if (!str.startsWith(prefix) || str.length < prefix.length + 3) {
      continue
    }
    const tags = toArray(lexicon[str.slice(prefix.length)])
    // an infinitive - 'sie werden mitkommen'
    // or a conjugated verb, with a person - 'rufe', 'kommt'
    const isVerb = tags.includes('Infinitive') || (tags.some((tag) => finite.includes(tag)) && tags.some((tag) => persons.includes(tag)))
    if (isVerb) {
      term.tags.clear()
      world.methods.one.setTag([term], ['Verb'].concat(tags), world, false, '2-separable-verb')
      return true
    }
  }
  return null
}
export default separable
