// find a conjugated verb in the conjugation table of its infinitive.
//
// the reverse-models (fromPresent, fromPast..) each guess at an infinitive,
// and they need to be told the tense + person, which we often do not know.
// so try them all, and only keep an infinitive that conjugates back into our word.
//
// (this file is the same in each of the *-compromise libraries - the list of tenses is not)

const persons = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']

// tenses is a list of { name, to(infinitive), from(word, person) }
// opts.extra(word) may give more infinitives to try
const makeLookup = function (tenses, opts = {}) {
  // what an infinitive looks like - 'hablar', 'parlare', 'sprechen'
  const shape = opts.shape || /./
  const pick = (only) => (only ? tenses.filter((o) => only.includes(o.name)) : tenses)

  // every form of this verb, by tense, and then person
  const table = function (inf, only) {
    const res = {}
    pick(only).forEach((o) => {
      res[o.name] = o.to(inf) || {}
    })
    return res
  }

  // where is this word, in the conjugations of this infinitive?
  const findHits = function (str, inf, only) {
    const forms = table(inf, only)
    const hits = []
    Object.keys(forms).forEach((tense) => {
      persons.forEach((person) => {
        if (forms[tense][person] === str) {
          hits.push({ tense, person })
        }
      })
    })
    return hits
  }

  // every infinitive that has this word as one of its forms
  const candidates = function (str, only) {
    // the word itself may be one - 'wir gehen'
    let roots = shape.test(str) ? [str] : []
    // any irregular verbs, that the models do not reverse
    if (opts.extra) {
      roots = roots.concat(opts.extra(str) || [])
    }
    pick(only).forEach((o) => {
      persons.forEach((person) => {
        // 'rad fahren' -> 'fahren'
        const inf = (o.from(str, person) || '').split(' ').pop()
        if (inf && inf !== str && shape.test(inf)) {
          roots.push(inf)
        }
      })
    })
    roots = roots.filter((s, i) => roots.indexOf(s) === i)
    const found = []
    roots.forEach((root) => {
      const hits = findHits(str, root, only)
      if (hits.length > 0) {
        found.push({ root, hits })
      }
    })
    return found
  }

  // the best of them - or null
  // - isVerb(infinitive) says if this is a verb that we know. these are preferred.
  // - known: only accept a verb that we know
  // - tenses: only look in these tenses
  const lookup = function (str, options = {}) {
    const isVerb = options.isVerb || (() => false)
    let found = candidates(str, options.tenses)
    found = found.map((o, i) => ({ o, i, known: isVerb(o.root) }))
    if (options.known) {
      found = found.filter((a) => a.known)
    }
    // prefer a real verb - 'pude' is 'poder', not 'pudir'
    found.sort((a, b) => {
      const diff = Number(b.known) - Number(a.known)
      if (diff !== 0) {
        return diff
      }
      // then the shortest - 'sagte' is 'sagen', not 'sagten'
      return a.o.root.length - b.o.root.length || a.i - b.i
    })
    return found.length > 0 ? found[0].o : null
  }

  return { table, findHits, candidates, lookup }
}

export default makeLookup
