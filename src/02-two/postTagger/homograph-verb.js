// some verb-forms are also an adjective or an adverb - 'er [brach] sein Versprechen', 'ich [bitte] dich'
// right after a subject-pronoun, in a clause with no other verb, a form that agrees with it is the verb.

const subjects = {
  ich: ['first'],
  du: ['second'],
  er: ['third'],
  es: ['third'],
  man: ['third'],
  sie: ['third', 'thirdPlural'],
  wir: ['firstPlural'],
  ihr: ['secondPlural'],
}
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

const homographVerbs = function (doc) {
  const world = doc.world
  const lexicon = world.model.one.lexicon
  const verb = world.methods.two.transform.verb
  const isVerb = (inf) => toArray(lexicon[inf]).includes('Infinitive')
  doc.docs.forEach((terms) => {
    terms.forEach((term, i) => {
      const prev = terms[i - 1]
      if (!prev || !subjects.hasOwnProperty(prev.normal) || !(term.tags.has('Adjective') || term.tags.has('Adverb'))) {
        return
      }
      // the clause already has its verb - 'er ist brach', 'ich habe bitte ..'
      let start = i
      while (start > 0 && !/[,;:]/.test(terms[start - 1].post)) {
        start -= 1
      }
      let end = i
      while (end < terms.length - 1 && !/[,;:]/.test(terms[end].post)) {
        end += 1
      }
      if (terms.slice(start, end + 1).some((t) => t.tags.has('Verb'))) {
        return
      }
      const found = verb.lookup(term.normal, { isVerb, known: true, tenses: Object.keys(tenses) })
      const hit = found ? found.hits.find((o) => subjects[prev.normal].includes(o.person)) : null
      if (hit) {
        term.tags.clear()
        world.methods.one.setTag([term], ['Verb', tenses[hit.tense], persons[hit.person]], world, false, 'homograph-verb')
      }
    })
  })
}
export default homographVerbs
