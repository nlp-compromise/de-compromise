
// the conjugation models are keyed by these names
const forms = {
  FirstPerson: 'first',
  SecondPerson: 'second',
  ThirdPerson: 'third',
  FirstPersonPlural: 'firstPlural',
  SecondPersonPlural: 'secondPlural',
  ThirdPersonPlural: 'thirdPlural',
}
const persons = Object.values(forms)

const verbForm = function (term) {
  const tag = Object.keys(forms).find(k => term.tags.has(k))
  return tag ? forms[tag] : null
}

// each tense, and how to get to + from it
const tenses = [
  { tag: 'PresentTense', from: 'fromPresent', to: 'toPresent' },
  { tag: 'PastTense', from: 'fromPast', to: 'toPast' },
  { tag: 'Subjunctive1', from: 'fromSubjunctive1', to: 'toSubjunctive1' },
  { tag: 'Subjunctive2', from: 'fromSubjunctive2', to: 'toSubjunctive2' },
]

const isInfinitive = function (str, lexicon) {
  if (!lexicon.hasOwnProperty(str)) {
    return false
  }
  const tags = lexicon[str]
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

// find the infinitive of a conjugated verb - 'sprichst' -> 'sprechen'
// the tagger's guess at the tense + person is often wrong, so try them all,
// and only keep an infinitive that conjugates back into our word
const getVerbRoot = function (term, str, world) {
  const verb = world.methods.two.transform.verb
  const lexicon = world.model.one.lexicon
  const form = verbForm(term)
  // the tagged tense + person go first
  const order = tenses.filter(o => term.tags.has(o.tag)).concat(tenses.filter(o => !term.tags.has(o.tag)))
  const people = persons.filter(p => p === form).concat(persons.filter(p => p !== form))
  let guess = null
  for (let i = 0; i < order.length; i += 1) {
    for (let k = 0; k < people.length; k += 1) {
      // 'rad fahren' -> 'fahren'
      const inf = (verb[order[i].from](str, people[k]) || '').split(' ').pop()
      if (!inf || inf === str || verb[order[i].to](inf)[people[k]] !== str) {
        continue
      }
      // prefer a real verb - 'sagte' is 'sagen', not 'sagten'
      if (isInfinitive(inf, lexicon)) {
        return inf
      }
      guess = guess || inf
    }
  }
  // without a tense, the tagger is not sure about this verb - so neither are we
  const hasTense = tenses.some(o => term.tags.has(o.tag))
  return hasTense ? guess : null
}

const root = function (view) {

  const { verb, noun, adjective } = view.world.methods.two.transform
  view.docs.forEach(terms => {
    terms.forEach(term => {
      const str = term.implicit || term.normal || term.text
      // get infinitive form of the verb
      if (term.tags.has('Verb')) {
        // look at past + present participles, first
        if (term.tags.has('Participle') && term.tags.has('PresentTense')) {
          term.root = verb.fromPresentParticiple(str)
        } else if (term.tags.has('Participle') && term.tags.has('PastTense')) {
          term.root = verb.fromPastParticiple(str)
        } else if (term.tags.has('Particle')) {
          // 'ich rufe dich [an]'
        } else if (isInfinitive(str, view.world.model.one.lexicon)) {
          // 'wir [wohnen] hier'
          term.root = str
        } else {
          const inf = getVerbRoot(term, str, view.world)
          if (inf) {
            term.root = inf
          } else if (term.tags.has('Imperative')) {
            term.root = verb.fromImperative(str, verbForm(term))
          } else if (term.tags.has('PresentTense') || term.tags.has('PastTense')) {
            // no luck
            term.root = str
          }
        }
      }
      if (term.tags.has('Adjective')) {
        term.root = adjective.toRoot(str)
      }
      if (term.tags.has('Noun')) {
        // only de-pluralize known plurals - the reverse-model mangles singulars
        term.root = term.tags.has('Plural') ? noun.toSingular(str) : str
      }

    })
  })
  return view
}
export default root