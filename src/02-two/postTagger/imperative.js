import parseImperative from '../../01-one/lexicon/methods/verbs/imperative.js'

// a command begins with its verb - 'Geh nach Hause!', 'Gib mir das Buch.', 'Kommen Sie herein!'
// - so does a question, and german capitalizes both nouns and first words ('Ruf mich an' / 'Ruf und Ehre')

const subjects = new Set(['ich', 'du', 'er', 'wir', 'ihr', 'man'])
const politeWords = new Set(['bitte', 'also', 'nun', 'los'])
const toArray = (tags) => (typeof tags === 'string' ? [tags] : tags || [])

const isInfinitive = function (str, lexicon) {
  return Object.prototype.hasOwnProperty.call(lexicon, str) && toArray(lexicon[str]).includes('Infinitive')
}

// a conjugated verb, that is not at the end of an infinitive-phrase
const isFinite = function (term, lexicon) {
  if (!term.tags.has('Verb') || term.tags.has('Participle') || term.tags.has('Particle')) {
    return false
  }
  if (isInfinitive(term.normal, lexicon)) {
    return false
  }
  return term.tags.has('PresentTense') || term.tags.has('PastTense') || term.tags.has('Modal') || term.tags.has('Auxiliary')
}

const tagImperatives = function (doc) {
  const world = doc.world
  const lexicon = world.model.one.lexicon
  const isVerb = (inf) => isInfinitive(inf, lexicon)
  const tag = function (term, reason) {
    term.tags.clear()
    world.methods.one.setTag([term], 'Imperative', world, false, reason)
  }
  doc.docs.forEach((terms) => {
    const last = terms[terms.length - 1]
    if (!last || /\?/.test(last.post)) {
      return
    }
    // 'Bitte [warte] hier'
    let i = 0
    if (terms.length > 1 && terms[0].normal === 'bitte' && !/[,!]/.test(terms[0].post)) {
      i = 1
    }
    const term = terms[i]
    const next = terms[i + 1]
    const str = term.normal
    if (!str || term.tags.has('Imperative') || politeWords.has(str)) {
      return
    }
    // 'Gehen [Sie] nach Hause!'
    if (next && next.text === 'Sie' && isVerb(str)) {
      tag(term, 'sie-imperative')
      return
    }
    // a subject right after it is something else - 'Gehe ich ..', 'Kommt er ..'
    if (next && subjects.has(next.normal)) {
      return
    }
    // words that we know as something else - 'Bitte', 'Morgen'
    const known = toArray(lexicon[str])
    const isNoun = known.some((t) => t === 'Noun' || /Noun$/.test(t))
    const verbTags = ['Verb', 'PresentTense', 'FirstPerson', 'SecondPersonPlural', 'ThirdPerson', 'Imperative', 'Infinitive']
    if (known.length > 0 && !isNoun && !known.some((t) => verbTags.includes(t))) {
      return
    }
    const found = parseImperative(str, isVerb)
    if (!found) {
      return
    }
    // the first clause has no other conjugated verb - 'Wein ist gut'
    let end = terms.findIndex((t, k) => k >= i && /[,;:]/.test(t.post))
    end = end === -1 ? terms.length : end + 1
    const rest = terms.slice(i + 1, end)
    if (rest.some((t) => isFinite(t, lexicon))) {
      return
    }
    const isCommand = /!/.test(last.post)
    if (found.form === 'singular') {
      // 'Gehe ich nach Hause, ..'
      if (/e$/.test(str) && terms.some((t) => t.normal === 'ich')) {
        return
      }
      // 'Ruf mich an' - but 'Ruf und Ehre'
      if (isNoun && !isCommand && !(next && next.tags.has('Pronoun'))) {
        return
      }
      tag(term, 'singular-imperative')
      return
    }
    // 'Kommt herein!' - also 'er kommt', so only in a command
    if (isCommand || str === 'seid') {
      tag(term, 'plural-imperative')
    }
  })
}
export default tagImperatives
