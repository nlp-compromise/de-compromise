// re-conjugate each clause into another tense, in-place
// 'ich gehe' -> 'ich ging' -> 'ich werde gehen'
//
// german spreads its verb across the clause - 'ich [habe] einen Apfel [gegessen]'
// so we work on the whole clause that each finite verb belongs to.
//
// - the past-tense is the Präteritum, which is a one-word substitution.
//   (the Perfekt is already in the past, and is left alone)
// - the future-tense is 'werden' + an infinitive at the end of the clause.

const persons = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']

const personTags = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}
const tenseTags = {
  present: 'PresentTense',
  past: 'PastTense',
}

// nominative pronouns, and the persons they may be
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

// these send the finite verb to the end of the clause - 'weil ich nach Hause [gehe]'
const subordinators = new Set([
  'dass', 'daß', 'weil', 'wenn', 'ob', 'als', 'obwohl', 'während', 'bevor', 'nachdem', 'damit', 'falls',
  'sobald', 'solange', 'bis', 'da', 'seit', 'seitdem', 'indem', 'sodass', 'obgleich', 'ehe', 'sofern',
])
// relative pronouns + question-words do too, after a comma - 'der Mann, der hier [wohnt]'
const relatives = new Set([
  'der', 'die', 'das', 'den', 'dem', 'dessen', 'deren', 'denen', 'was', 'wer', 'wen', 'wem', 'wo', 'wie',
  'warum', 'wann', 'wohin', 'woher', 'welche', 'welcher', 'welches', 'welchen', 'welchem',
])
const coordinators = new Set(['und', 'oder', 'aber', 'denn', 'sondern', 'doch'])

// separable prefixes - 'ich rufe dich [an]'
const prefixes = [
  'zusammen', 'zurück', 'weiter', 'vorbei', 'heraus', 'herein', 'hinaus', 'hinein', 'herum', 'empor', 'fort',
  'fest', 'frei', 'hoch', 'nach', 'teil', 'statt', 'weg', 'vor', 'mit', 'los', 'her', 'hin', 'ein', 'bei',
  'aus', 'auf', 'ab', 'an', 'zu', 'um',
]
const isPrefix = new Set(prefixes)

// verbs that build their Perfekt with 'sein' - 'ich bin gegangen'
// (any other participle after 'sein' is a state - 'die Tür ist geschlossen')
const seinVerbs = new Set([
  'sein', 'werden', 'bleiben', 'gehen', 'kommen', 'fahren', 'laufen', 'fliegen', 'fallen', 'steigen', 'sterben',
  'wachsen', 'reisen', 'rennen', 'springen', 'schwimmen', 'passieren', 'geschehen', 'folgen', 'begegnen',
  'gelingen', 'misslingen', 'erscheinen', 'verschwinden', 'entstehen', 'wandern', 'landen', 'fliehen',
  'kriechen', 'klettern', 'sinken', 'stürzen', 'rutschen', 'eilen', 'reiten', 'schleichen', 'gelangen',
  'scheitern', 'erwachen', 'ertrinken', 'verreisen', 'aufstehen', 'einschlafen', 'aufwachen', 'umziehen',
  'einziehen', 'ausziehen', 'aufwachsen', 'auswandern', 'einwandern',
])
// .. and anything built from these - 'ankommen', 'abfahren', 'einsteigen'
const seinBases = new Set(['gehen', 'kommen', 'fahren', 'laufen', 'fliegen', 'fallen', 'steigen', 'reisen', 'rennen', 'springen', 'bleiben'])

const isInfinitive = function (str, lexicon) {
  if (!lexicon.hasOwnProperty(str)) {
    return false
  }
  const tags = lexicon[str]
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

// the two indicative tenses that are one word
const getForms = function (root, methods) {
  return {
    present: methods.toPresent(root),
    past: methods.toPast(root),
  }
}

// find the word in the conjugation table of this infinitive
const findHits = function (str, root, methods) {
  const forms = getForms(root, methods)
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

// the infinitive of 'gegessen', if it is one
const fromParticiple = function (term, methods) {
  const str = term.normal
  if (!str || !term.tags.has('Verb')) {
    return null
  }
  const root = (methods.fromPastParticiple(str) || '').split(' ').pop()
  if (root && root !== str && methods.toPastParticiple(root) === str) {
    return root
  }
  return null
}

// the Konjunktiv of the auxiliary + modal verbs is a mood, not a tense - 'würde', 'wäre', 'könnte'
let subjunctives = null
const isSubjunctive = function (str, methods) {
  if (subjunctives === null) {
    subjunctives = new Set(['möchte', 'möchtest', 'möchten', 'möchtet'])
    const roots = ['sein', 'haben', 'werden', 'können', 'müssen', 'dürfen', 'mögen', 'wissen', 'sollen', 'wollen']
    roots.forEach((root) => {
      const indicative = new Set(Object.values(methods.toPresent(root)).concat(Object.values(methods.toPast(root))))
      const forms = Object.values(methods.toSubjunctive1(root)).concat(Object.values(methods.toSubjunctive2(root)))
      forms.filter((w) => w && !indicative.has(w)).forEach((w) => subjunctives.add(w))
    })
  }
  return subjunctives.has(str)
}

// find an infinitive that conjugates back into our word
const findRoot = function (str, methods, lexicon) {
  let roots = [str]
  persons.forEach((person) => {
    roots.push(methods.fromPresent(str, person))
    roots.push(methods.fromPast(str, person))
  })
  // 'rad fahren' -> 'fahren'
  roots = roots.filter((s) => s).map((s) => s.split(' ').pop())
  roots = roots.filter((s, i) => roots.indexOf(s) === i)
  let found = []
  roots.forEach((root) => {
    const hits = findHits(str, root, methods)
    if (hits.length > 0) {
      found.push({ root, hits })
    }
  })
  // prefer a real verb - 'sagte' is 'sagen', not 'sagten'
  found = found.sort((a, b) => {
    const known = Number(isInfinitive(b.root, lexicon)) - Number(isInfinitive(a.root, lexicon))
    return known || a.root.length - b.root.length
  })
  return found[0] || null
}

// is this a conjugated verb? - which one, and in which tense + person?
// every tense is tried, to find an infinitive that conjugates back into our word
const parseFinite = function (term, prev, methods, lexicon) {
  const str = term.normal
  if (!str || !term.text || !term.tags.has('Verb') || term.tags.has('Particle')) {
    return null
  }
  // 'um zu [gehen]'
  if (prev && prev.normal === 'zu') {
    return null
  }
  if (isSubjunctive(str, methods)) {
    return null
  }
  const found = findRoot(str, methods, lexicon)
  if (found && isInfinitive(found.root, lexicon)) {
    return found
  }
  // a separable verb, joined in a subordinate clause - 'weil ich dich [anrufe]'
  for (let k = 0; k < prefixes.length; k += 1) {
    const prefix = prefixes[k]
    if (str.startsWith(prefix) && str.length > prefix.length + 2) {
      const rest = findRoot(str.slice(prefix.length), methods, lexicon)
      if (rest && isInfinitive(rest.root, lexicon)) {
        return { root: prefix + rest.root, hits: rest.hits }
      }
    }
  }
  return found
}

// 'gegessen' is never a conjugated verb, but 'verstanden' may be - 'wir verstanden'
const isOnlyParticiple = function (term, methods) {
  const root = fromParticiple(term, methods)
  return root !== null && findHits(term.normal, root, methods).length === 0
}

const hasVerb = (terms, start, end) => {
  for (let i = start; i < end; i += 1) {
    if (terms[i].tags.has('Verb')) {
      return true
    }
  }
  return false
}

// the first conjugated verb in this span
const findFinite = function (terms, start, end, methods, lexicon) {
  for (let i = start; i < end; i += 1) {
    if (!isOnlyParticiple(terms[i], methods)) {
      const parsed = parseFinite(terms[i], terms[i - 1], methods, lexicon)
      if (parsed) {
        return { index: i, parsed }
      }
    }
  }
  return null
}

// these verbs take an infinitive, at the end of the clause
const takesInfinitive = new Set(['werden', 'können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen'])

// is there a clause on both sides of this conjunction?
const isTwoClauses = function (terms, span, methods, lexicon) {
  const [start, i, end] = span
  const left = findFinite(terms, start, i, methods, lexicon)
  const right = findFinite(terms, i + 1, end, methods, lexicon)
  if (!left || !right) {
    return false
  }
  // 'ich werde Brot und Käse [essen]' is one clause, and 'ich werde lesen und [schreiben können]'
  if (takesInfinitive.has(left.parsed.root) && terms.slice(right.index, end).every((t) => isInfinitive(t.normal, lexicon))) {
    return false
  }
  return true
}

// split the sentence into clauses - each has (up to) one finite verb
const getClauses = function (terms, methods, lexicon) {
  // first, split on punctuation
  let parts = []
  let start = 0
  terms.forEach((term, i) => {
    if (/[,;:–—]/.test(term.post) || i === terms.length - 1) {
      parts.push([start, i + 1])
      start = i + 1
    }
  })
  // a part without a verb is not a clause - 'Brot, Käse und Wein'
  const merged = []
  parts.forEach((part) => {
    const last = merged[merged.length - 1]
    const isList = last && !hasVerb(terms, part[0], part[1])
    // .. but leave it, before a relative clause - 'der Mann, der hier wohnt, ..'
    const head = terms[part[0]].normal
    const isStart = last && !hasVerb(terms, last[0], last[1]) && !subordinators.has(head) && !relatives.has(head)
    if (isList || isStart) {
      last[1] = part[1]
    } else {
      merged.push(part)
    }
  })
  // then split on a conjunction, when there is a verb on both sides - 'ich esse und er trinkt'
  parts = []
  merged.forEach((part) => {
    let from = part[0]
    for (let i = part[0] + 1; i < part[1] - 1; i += 1) {
      if (coordinators.has(terms[i].normal) && isTwoClauses(terms, [from, i, part[1]], methods, lexicon)) {
        parts.push([from, i])
        from = i
      }
    }
    parts.push([from, part[1]])
  })
  return parts
}

// find the finite verb of this clause
const parseClause = function (terms, part, methods, lexicon) {
  const [start, end] = part
  // skip a leading conjunction - 'und [weil] ..'
  let first = start
  if (coordinators.has(terms[first].normal) && first + 1 < end) {
    first += 1
  }
  const head = terms[first].normal
  const isSub = subordinators.has(head) || (start > 0 && relatives.has(head))
  // in a subordinate clause, the finite verb is the last word
  if (isSub && end - 1 > first) {
    const parsed = parseFinite(terms[end - 1], terms[end - 2], methods, lexicon)
    if (parsed) {
      return { start, end, index: end - 1, isSub: true, parsed }
    }
  }
  // otherwise, it is the first verb
  for (let i = start; i < end; i += 1) {
    // the Konjunktiv is not a tense - 'ich würde gehen'
    if (terms[i].tags.has('Verb') && isSubjunctive(terms[i].normal, methods)) {
      return null
    }
    if (isOnlyParticiple(terms[i], methods)) {
      continue
    }
    const parsed = parseFinite(terms[i], terms[i - 1], methods, lexicon)
    if (parsed) {
      return { start, end, index: i, isSub: false, parsed }
    }
  }
  return null
}

const isNoun = (term) => term.tags.has('Noun') && !term.tags.has('Pronoun')

// 'ging' is both first and third person - so look for the subject
const choosePerson = function (hits, terms, clause, lastPerson) {
  const found = hits.map((o) => o.person).filter((p, k, arr) => arr.indexOf(p) === k)
  if (found.length === 1) {
    return found[0]
  }
  const { start, end, index } = clause
  // nearest-first, looking backward and then forward
  const order = []
  for (let i = index - 1; i >= start; i -= 1) {
    order.push(terms[i])
  }
  for (let i = index + 1; i < end; i += 1) {
    order.push(terms[i])
  }
  // a subject-pronoun - 'heute gehe [ich]'
  for (let i = 0; i < order.length; i += 1) {
    const list = subjects[order[i].normal] || []
    const person = list.find((p) => found.includes(p))
    if (person) {
      return person
    }
  }
  // any other subject is in the third person - 'der Hund schläft'
  const third = ['third', 'thirdPlural'].find((p) => found.includes(p))
  if (third && terms.slice(start, index).some(isNoun)) {
    return third
  }
  // the subject of the last clause - 'er kam, sah und [siegte]'
  if (lastPerson && found.includes(lastPerson)) {
    return lastPerson
  }
  return third || found[0]
}

// 'anrufen' -> ['an', 'rufen']
const splitPrefix = function (root, participle, lexicon) {
  for (let i = 0; i < prefixes.length; i += 1) {
    const prefix = prefixes[i]
    if (!root.startsWith(prefix) || root.length < prefix.length + 3) {
      continue
    }
    const rest = root.slice(prefix.length)
    // 'an-ge-rufen' can only be a separable verb
    if (participle && participle.startsWith(prefix + 'ge') && !rest.startsWith('ge')) {
      return [prefix, rest]
    }
    // 'um' is often inseparable - 'umarmen', 'umgeben'
    if (prefix !== 'um' && isInfinitive(rest, lexicon)) {
      return [prefix, rest]
    }
  }
  return ['', root]
}

const usesSein = function (root, lexicon) {
  return seinVerbs.has(root) || seinBases.has(splitPrefix(root, null, lexicon)[1])
}

// 'Gehe' -> 'Ging'
const matchCase = function (str, term) {
  const orig = term.text || ''
  if (orig.length > 1 && orig === orig.toUpperCase() && orig !== orig.toLowerCase()) {
    return str.toUpperCase()
  }
  if (orig && orig[0] !== orig[0].toLowerCase()) {
    return str[0].toUpperCase() + str.slice(1)
  }
  return str
}

// what sort of verb-phrase is this clause?
const getShape = function (terms, clause, methods, lexicon) {
  const { start, end, index, isSub, parsed } = clause
  const root = parsed.root
  const isPresent = parsed.hits.some((o) => o.tense === 'present')
  // where the rest of the verb is found
  const other = isSub ? index - 1 : end - 1
  const res = { kind: 'simple', root, other: null, particle: '' }
  if (other < start || other === index) {
    return res
  }
  const term = terms[other]
  const str = term.normal
  // two verbs share this auxiliary - 'ich habe gegessen und getrunken'
  const between = terms.slice(Math.min(index, other) + 1, Math.max(index, other))
  const isShared = between.some((t) => coordinators.has(t.normal)) && between.some((t) => t.tags.has('Verb'))
  // 'ich habe einen Apfel gegessen', 'ich bin nach Hause gegangen'
  if (root === 'haben' || root === 'sein') {
    const main = fromParticiple(term, methods)
    if (main && (root === 'haben' || usesSein(main, lexicon))) {
      if (isShared) {
        return null
      }
      return { kind: 'perfect', root: main, other, participle: str }
    }
  }
  // 'ich werde nach Hause gehen'
  if (root === 'werden' && isPresent && term.tags.has('Verb') && !isOnlyParticiple(term, methods)) {
    if (isInfinitive(str, lexicon) || (term.tags.has('Infinitive') && /n$/.test(str))) {
      // .. but a modal has both of them - 'ich werde lesen und schreiben können'
      if (isShared && !takesInfinitive.has(str)) {
        return null
      }
      return { kind: 'future', root: str, other, participle: null }
    }
  }
  // 'ich rufe dich an'
  if (!isSub && isPrefix.has(str) && !isNoun(term) && (term.tags.has('Particle') || isInfinitive(str + root, lexicon))) {
    res.other = other
    res.particle = str
  }
  return res
}

// change one clause, and return its new finite verb
const convertClause = function (view, n, clause, want, state) {
  const { methods, lexicon } = state
  const terms = view.document[n]
  const { end, index, isSub, parsed } = clause
  const shape = getShape(terms, clause, methods, lexicon)
  if (!shape) {
    return null
  }
  const term = terms[index]
  const tenses = parsed.hits.map((o) => o.tense)
  const person = choosePerson(parsed.hits, terms, clause, state.lastPerson)
  // a later clause may share this subject - 'er kam, sah und siegte'
  state.lastPerson = isSub ? null : person
  const werden = methods.toPresent('werden')[person]
  const at = (i, len) => view.update([[n, i, i + (len || 1)]])
  // each edit, as [index, 'replace' | 'remove' | 'after', text]
  let edits = []
  let tags = null
  if (want === 'future') {
    tags = ['Verb', 'Auxiliary', personTags[person]]
    if (shape.kind === 'future') {
      return null
    }
    if (shape.kind === 'perfect') {
      // 'ich habe gegessen' -> 'ich werde essen'
      edits = [[index, 'replace', werden], [shape.other, 'replace', shape.root]]
    } else if (isSub) {
      // 'weil ich gehe' -> 'weil ich gehen werde'
      edits = [[index, 'replace', shape.root + ' ' + werden]]
    } else if (shape.particle) {
      // 'ich rufe dich an' -> 'ich werde dich anrufen'
      edits = [[index, 'replace', werden], [shape.other, 'replace', shape.particle + shape.root]]
    } else if (index === end - 1) {
      // 'ich schlafe' -> 'ich werde schlafen'
      edits = [[index, 'replace', werden + ' ' + shape.root]]
    } else {
      // 'ich gehe nach Hause' -> 'ich werde nach Hause gehen'
      edits = [[index, 'replace', werden], [end - 1, 'after', shape.root]]
    }
  } else if (shape.kind === 'simple') {
    // 'ich gehe' <-> 'ich ging'
    if (tenses.includes(want)) {
      return null
    }
    edits = [[index, 'replace', getForms(shape.root, methods)[want][person]]]
    tags = ['Verb', tenseTags[want], personTags[person]]
  } else {
    // the Perfekt is already in the past - 'ich habe gegessen'
    if (shape.kind === 'perfect' && want === 'past') {
      return null
    }
    // collapse it to one verb - 'ich habe gegessen' -> 'ich esse', 'ich werde gehen' -> 'ich ging'
    const [prefix, base] = splitPrefix(shape.root, shape.participle, lexicon)
    const str = getForms(base, methods)[want][person]
    tags = ['Verb', tenseTags[want], personTags[person]]
    if (isSub) {
      // 'weil er mich angerufen hat' -> 'weil er mich anruft'
      edits = [[index, 'replace', prefix + str], [shape.other, 'remove']]
    } else if (prefix) {
      // 'er hat mich angerufen' -> 'er ruft mich an'
      edits = [[index, 'replace', str], [shape.other, 'replace', prefix]]
    } else {
      edits = [[index, 'replace', str], [shape.other, 'remove']]
    }
  }
  if (edits.some((e) => e[1] !== 'remove' && !e[2])) {
    return null
  }
  // go right-to-left, so that each index stays true
  edits = edits.sort((a, b) => b[0] - a[0])
  let where = index
  edits.forEach((edit) => {
    const [i, action, str] = edit
    if (action === 'remove') {
      // keep any punctuation after it - 'ich habe gegessen, und ..'
      const post = view.document[n][i].post
      at(i).remove()
      if (i > 0) {
        view.document[n][i - 1].post = post
      }
      where -= i < index ? 1 : 0
    } else if (action === 'after') {
      at(i).insertAfter(str)
      at(i + 1).tag(['Verb', 'Infinitive'], 'to-' + want)
    } else if (i === index) {
      at(i).replaceWith(matchCase(str, term))
    } else {
      at(i).replaceWith(str)
    }
  })
  // 'gehen [werde]'
  if (want === 'future' && isSub && shape.kind !== 'perfect') {
    where += 1
  }
  at(where).tag(tags, 'to-' + want)
  return view.document[n][where]
}

const convertTo = function (view, want) {
  const state = {
    methods: view.methods.two.transform.verb,
    lexicon: view.model.one.lexicon,
    lastPerson: null,
    // every word of the clauses we have looked at
    seen: new Set(),
  }
  // pointers go stale as we add + remove words, so hold onto the terms themselves
  const phrases = []
  view.forEach((vb) => {
    const ptr = vb.fullPointer[0]
    if (ptr) {
      phrases.push({ n: ptr[0], terms: (vb.docs[0] || []).slice() })
    }
  })
  let sentence = null
  phrases.forEach((phrase) => {
    const { n } = phrase
    if (n !== sentence) {
      state.lastPerson = null
      sentence = n
    }
    phrase.terms.slice().forEach((term) => {
      const terms = view.document[n]
      const i = terms.indexOf(term)
      // was it removed already?
      if (i === -1) {
        return
      }
      const part = getClauses(terms, state.methods, state.lexicon).find((p) => p[0] <= i && i < p[1])
      const clause = part ? parseClause(terms, part, state.methods, state.lexicon) : null
      // only change a clause when its finite verb was selected
      if (!clause || terms[clause.index] !== term || state.seen.has(term)) {
        return
      }
      // .. and only once - a new infinitive can look like a second clause
      terms.slice(part[0], part[1]).forEach((t) => state.seen.add(t))
      const res = convertClause(view, n, clause, want, state)
      if (res) {
        phrase.terms[phrase.terms.indexOf(term)] = res
      }
    })
  })
  // return what is left of each verb-phrase
  const ptrs = []
  phrases.forEach((phrase) => {
    const terms = view.document[phrase.n]
    const found = phrase.terms.map((term) => terms.indexOf(term)).filter((i) => i !== -1)
    if (found.length > 0) {
      ptrs.push([phrase.n, Math.min(...found), Math.max(...found) + 1])
    }
  })
  return view.update(ptrs)
}

export default convertTo
