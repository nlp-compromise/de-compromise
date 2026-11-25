import parseImperative from '../methods/verbs/imperative.js'


// the conjugation models are keyed by these names
const forms = {
  FirstPerson: 'first',
  SecondPerson: 'second',
  ThirdPerson: 'third',
  FirstPersonPlural: 'firstPlural',
  SecondPersonPlural: 'secondPlural',
  ThirdPersonPlural: 'thirdPlural',
}

const verbForm = function (term) {
  const tag = Object.keys(forms).find(k => term.tags.has(k))
  return tag ? forms[tag] : null
}

// the tag of each tense
const tenses = {
  present: 'PresentTense',
  past: 'PastTense',
  subjunctive1: 'Subjunctive1',
  subjunctive2: 'Subjunctive2',
}

const isInfinitive = function (str, lexicon) {
  if (!lexicon.hasOwnProperty(str)) {
    return false
  }
  const tags = lexicon[str]
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

// find the infinitive of a conjugated verb - 'sprichst' -> 'sprechen'
// the tagger's guess at the tense + person is often wrong, so every tense is tried,
// and only an infinitive that conjugates back into our word is kept
const getVerbRoot = function (term, str, world) {
  const verb = world.methods.two.transform.verb
  const lexicon = world.model.one.lexicon
  const form = verbForm(term)
  const found = verb.candidates(str).filter(o => o.root !== str)
  // how well does this one agree with the tagger?
  const score = function (o) {
    const hits = o.hits.filter(h => term.tags.has(tenses[h.tense]))
    return (hits.length > 0 ? 2 : 0) + (hits.some(h => h.person === form) ? 1 : 0)
  }
  // prefer a real verb - 'sagte' is 'sagen', not 'sagten'
  const known = found.filter(o => isInfinitive(o.root, lexicon))
  const list = (known.length > 0 ? known : found).map((o, i) => ({ o, i, score: score(o) }))
  list.sort((a, b) => b.score - a.score || a.i - b.i)
  if (list.length === 0) {
    return null
  }
  // without a tense, the tagger is not sure about this verb - so neither are we
  const hasTense = Object.values(tenses).some(tag => term.tags.has(tag))
  return known.length > 0 || hasTense ? list[0].o.root : null
}

const root = function (view) {

  const { verb, noun, adjective } = view.world.methods.two.transform
  view.docs.forEach(terms => {
    terms.forEach(term => {
      const str = term.implicit || term.normal || term.text
      // get infinitive form of the verb
      if (term.tags.has('Verb')) {
        const lexicon = view.world.model.one.lexicon
        const imp = term.tags.has('Imperative') ? parseImperative(str, (inf) => isInfinitive(inf, lexicon)) : null
        if (imp) {
          // 'Ruf mich [an]!' is 'anrufen'
          const last = terms[terms.length - 1]
          const joined = last !== term && last.tags.has('Particle') ? last.normal + imp.root : null
          term.root = joined && isInfinitive(joined, lexicon) ? joined : imp.root
        } else if (term.tags.has('Participle') && term.tags.has('PresentTense')) {
          // look at past + present participles, first
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