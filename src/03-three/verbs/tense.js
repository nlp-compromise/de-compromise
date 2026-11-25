// re-conjugate each clause into another tense, in-place
// 'ich gehe' -> 'ich ging' -> 'ich werde gehen'
//
// german spreads its verb across the clause - 'ich [habe] einen Apfel [gegessen]'
// so we work on the whole clause that each finite verb belongs to.
//
// - the past-tense is the Präteritum, which is a one-word substitution.
//   (the Perfekt is already in the past, and is left alone)
// - the future-tense is 'werden' + an infinitive at the end of the clause.

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
const oneWord = ['present', 'past']

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
// prefer a real verb - 'sagte' is 'sagen', not 'sagten'
const findRoot = function (str, methods, lexicon) {
  return methods.lookup(str, { isVerb: (inf) => isInfinitive(inf, lexicon), tenses: oneWord })
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
const isOnlyParticiple = function (term, methods, lexicon) {
  const root = fromParticiple(term, methods)
  if (root === null || methods.findHits(term.normal, root, oneWord).length > 0) {
    return false
  }
  // .. and 'gefällt' is the participle of 'fällen', but also 'es gefällt mir'
  return !methods.lookup(term.normal, { isVerb: (inf) => isInfinitive(inf, lexicon), known: true, tenses: oneWord })
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
    if (!isOnlyParticiple(terms[i], methods, lexicon)) {
      const parsed = parseFinite(terms[i], terms[i - 1], methods, lexicon)
      if (parsed) {
        return { index: i, parsed }
      }
    }
  }
  return null
}

// 'weinen und singen' - nothing here but infinitives
const allInfinitives = function (terms, start, end, lexicon) {
  const verbs = terms.slice(start, end).filter((t) => t.tags.has('Verb'))
  // 'Deutsch zu lernen' is a clause of its own
  if (terms.slice(start, end).some((t) => t.normal === 'zu')) {
    return false
  }
  return verbs.length > 0 && verbs.every((t) => isInfinitive(t.normal, lexicon))
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
  // .. and so is 'weil ich [essen] und [trinken] werde'
  const last = parseFinite(terms[end - 1], terms[end - 2], methods, lexicon)
  if (last && takesInfinitive.has(last.root) && left.index === i - 1 && right.index === end - 2) {
    if (isInfinitive(terms[left.index].normal, lexicon) && isInfinitive(terms[right.index].normal, lexicon)) {
      return false
    }
  }
  // .. and 'weil er lachen, weinen und singen wird'
  const head = terms[start].normal
  if (last && takesInfinitive.has(last.root) && (subordinators.has(head) || relatives.has(head))) {
    if (allInfinitives(terms, start, end - 1, lexicon)) {
      return false
    }
  }
  return true
}

// does this part carry on a list of infinitives, that all share one 'werden'?
const isInfinitiveList = function (terms, last, part, methods, lexicon) {
  const [start, end] = part
  const head = terms[start].normal
  if (subordinators.has(head) || relatives.has(head) || subjects.hasOwnProperty(head)) {
    return false
  }
  // 'er wird lachen, [weinen und singen]'
  const found = findFinite(terms, last[0], last[1], methods, lexicon)
  if (found && takesInfinitive.has(found.parsed.root) && found.index < last[1] - 1) {
    return allInfinitives(terms, found.index + 1, last[1], lexicon) && allInfinitives(terms, start, end, lexicon)
  }
  // 'weil er lachen, [weinen und singen wird]'
  if (subordinators.has(terms[last[0]].normal) && end - start > 1 && isInfinitive(terms[last[1] - 1].normal, lexicon)) {
    const final = parseFinite(terms[end - 1], terms[end - 2], methods, lexicon)
    return Boolean(final) && takesInfinitive.has(final.root) && allInfinitives(terms, start, end - 1, lexicon)
  }
  return false
}

const isNoun = (term) => term.tags.has('Noun') && !term.tags.has('Pronoun')

// 'zu' + infinitive is a clause of its own, even without a comma - 'ich fange an | zu verstehen'
// - but only after the end of the verb before it: a prefix, an infinitive, or a participle
const isBeforeZu = function (terms, start, i, methods, lexicon) {
  const term = terms[i]
  const zu = terms[i + 1]
  const verb = terms[i + 2]
  if (!zu || zu.normal !== 'zu' || !verb || !isInfinitive(verb.normal, lexicon) || i <= start) {
    return false
  }
  if (isPrefix.has(term.normal) && !isNoun(term)) {
    return true
  }
  if (isOnlyParticiple(term, methods, lexicon)) {
    return true
  }
  // 'ich werde [anfangen] zu verstehen' - but not 'wir [versuchen] zu lernen'
  return isInfinitive(term.normal, lexicon) && hasVerb(terms, start, i)
}

// split the sentence into clauses - each has (up to) one finite verb
const getClauses = function (terms, methods, lexicon) {
  // first, split on punctuation
  let parts = []
  let start = 0
  terms.forEach((term, i) => {
    if (/[,;:–—]/.test(term.post) || i === terms.length - 1 || isBeforeZu(terms, start, i, methods, lexicon)) {
      parts.push([start, i + 1])
      start = i + 1
    }
  })
  // a part without a verb is not a clause - 'Brot, Käse und Wein'
  const merged = []
  parts.forEach((part) => {
    const last = merged[merged.length - 1]
    // .. nor is a part with only participles - 'er hat gelacht, geweint und gesungen'
    const isList = last && !terms.slice(part[0], part[1]).some((t) => t.tags.has('Verb') && !isOnlyParticiple(t, methods, lexicon))
    // .. or only infinitives, after 'werden' - 'er wird lachen, weinen und singen'
    const isInfList = last && isInfinitiveList(terms, last, part, methods, lexicon)
    // .. but leave it, before a relative clause - 'der Mann, der hier wohnt, ..'
    const head = terms[part[0]].normal
    const isStart = last && !hasVerb(terms, last[0], last[1]) && !subordinators.has(head) && !relatives.has(head)
    if (isList || isInfList || isStart) {
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
  // a command has no tense - 'Gib mir das Buch!', 'Lass mich gehen!'
  if (terms.slice(start, end).some((t) => t.tags.has('Imperative'))) {
    return null
  }
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
    if (isOnlyParticiple(terms[i], methods, lexicon)) {
      continue
    }
    const parsed = parseFinite(terms[i], terms[i - 1], methods, lexicon)
    if (parsed) {
      return { start, end, index: i, isSub: false, parsed }
    }
  }
  return null
}


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

// the verbs that share one auxiliary - 'ich habe gegessen und getrunken'
// returns null if the clause is not one that we can re-arrange
const getShared = function (terms, clause, other, toRoot) {
  const { start, index, isSub } = clause
  const verbs = []
  // they are all before the auxiliary, in a subordinate clause - 'weil ich gegessen und getrunken habe'
  for (let i = isSub ? start : index + 1; i < other; i += 1) {
    const term = terms[i]
    const next = terms[i + 1]
    // an adjective, misread as a verb - 'einen [langen] Brief'
    if (!term.tags.has('Verb') || (next && isNoun(next) && !/,/.test(term.post))) {
      continue
    }
    const root = toRoot(term)
    // each one ends its own part - 'gegessen, getrunken und gelacht'
    const isJoined = /,/.test(term.post) || coordinators.has(next.normal)
    // a word that is not one of these verbs - 'ich werde [lange] schlafen'
    if (!root && !isJoined) {
      continue
    }
    // the last two make one verb - 'wir werden [einkaufen] gehen'
    if (root && !isJoined && i === other - 1) {
      continue
    }
    if (!root || !isJoined) {
      return null
    }
    verbs.push({ at: i, root, str: term.normal })
  }
  verbs.push({ at: other, root: toRoot(terms[other]), str: terms[other].normal })
  // where each part begins - 'und [Wasser] getrunken'
  verbs.forEach((o, k) => {
    if (k > 0) {
      const from = verbs[k - 1].at + 1
      o.start = coordinators.has(terms[from].normal) ? from + 1 : from
    }
  })
  return verbs
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
  // 'ich habe einen Apfel gegessen', 'ich bin nach Hause gegangen'
  if (root === 'haben' || root === 'sein') {
    const toRoot = (t) => {
      const inf = fromParticiple(t, methods)
      return inf && (root === 'haben' || usesSein(inf, lexicon)) ? inf : null
    }
    if (toRoot(term)) {
      const verbs = getShared(terms, clause, other, toRoot)
      if (!verbs) {
        return null
      }
      // the one whose place the new verb takes
      const first = isSub ? verbs.pop() : verbs.shift()
      return { kind: 'perfect', root: first.root, other: first.at, participle: first.str, extras: verbs }
    }
  }
  // 'ich werde nach Hause gehen'
  if (root === 'werden' && isPresent && term.tags.has('Verb') && !isOnlyParticiple(term, methods, lexicon)) {
    const toRoot = (t) => {
      const isInf = isInfinitive(t.normal, lexicon) || (t.tags.has('Infinitive') && /n$/.test(t.normal))
      return isInf && !isOnlyParticiple(t, methods, lexicon) ? t.normal : null
    }
    if (toRoot(term)) {
      // a modal has all of the others - 'ich werde lesen und schreiben können'
      if (takesInfinitive.has(str)) {
        return { kind: 'future', root: str, other, participle: null, extras: [] }
      }
      const verbs = getShared(terms, clause, other, toRoot)
      if (!verbs) {
        return null
      }
      const first = isSub ? verbs.pop() : verbs.shift()
      return { kind: 'future', root: first.root, other: first.at, participle: null, extras: verbs }
    }
  }
  // 'ich rufe dich an'
  if (!isSub && isPrefix.has(str) && !isNoun(term) && (term.tags.has('Particle') || isInfinitive(str + root, lexicon))) {
    res.other = other
    res.particle = str
  }
  return res
}

// a clause that begins with its verb takes the subject of the one before it - 'er lacht und [singt] ein Lied'
const hasNoSubject = function (terms, clause) {
  const { start, end, index, isSub } = clause
  if (isSub || start === 0) {
    return false
  }
  const first = ['und', 'oder'].includes(terms[start].normal) ? start + 1 : start
  if (index !== first) {
    return false
  }
  // 'und dann lacht [er]'
  return !terms.slice(start, end).some((t) => ['ich', 'du', 'er', 'wir', 'ihr', 'man'].includes(t.normal))
}

// the last clause has a 'werden' already, so this one only needs its infinitive
// 'er wird lachen und [singt ein Lied]' -> 'er wird lachen und [ein Lied singen]'
const shareFuture = function (view, n, clause, shape) {
  const { end, index } = clause
  const at = (i) => view.update([[n, i, i + 1]])
  const str = shape.particle + shape.root
  let where = index
  if (index === end - 1) {
    at(index).replaceWith(str)
  } else {
    if (shape.particle) {
      // 'und ruft mich an' -> 'und mich anrufen'
      at(shape.other).replaceWith(str)
    } else {
      at(end - 1).insertAfter(str)
    }
    at(index).remove()
    where = shape.particle ? shape.other - 1 : end - 1
  }
  at(where).tag(['Verb', 'Infinitive'], 'to-future')
  return [view.document[n][where]]
}

// a verb-final part, after a subordinate clause, is more of the same clause - 'weil er lacht und [ein Lied singt]'
const isContinued = function (terms, clause) {
  const { start, end, index, isSub } = clause
  if (isSub || start === 0 || index !== end - 1) {
    return false
  }
  return !terms.slice(start, end).some((t) => subjects.hasOwnProperty(t.normal) && t.normal !== 'sie' && t.normal !== 'es')
}

// 'werden' goes to the very end of a subordinate clause
// 'weil er lachen wird und [singt]' -> 'weil er lachen und [singen wird]'
const moveWerden = function (view, n, clause, werden, root) {
  const at = (i) => view.update([[n, i, i + 1]])
  at(clause.index).replaceWith(root + ' ' + werden.normal)
  at(clause.index).tag(['Verb', 'Infinitive'], 'to-future')
  at(clause.index + 1).tag(['Verb', 'Auxiliary'].concat(Object.values(personTags).filter((tag) => werden.tags.has(tag))), 'to-future')
  const found = view.document[n][clause.index + 1]
  // drop the old one, but keep its punctuation
  const i = view.document[n].indexOf(werden)
  if (i > 0) {
    const post = werden.post
    at(i).remove()
    view.document[n][i - 1].post = post
  }
  return found
}

// change one clause, and return its new finite verbs
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
  // is it one more verb for the 'werden' of the last clause? - 'er wird lachen und [singt]'
  const isShared = want === 'future' && state.lastFuture && state.lastPerson === person && hasNoSubject(terms, clause)
  // a later clause may share this subject - 'er kam, sah und siegte'
  state.lastPerson = isSub ? null : person
  state.lastFuture = false
  if (isShared && shape.kind === 'simple') {
    state.lastFuture = true
    return shareFuture(view, n, clause, shape)
  }
  // .. or of a subordinate clause? - 'weil er lachen wird und [singt]'
  const last = state.subWerden
  state.subWerden = null
  if (want === 'future' && last && last.person === person && shape.kind === 'simple' && isContinued(terms, clause)) {
    const found = moveWerden(view, n, clause, last.term, shape.root)
    state.subWerden = { term: found, person }
    return [found]
  }
  const werden = methods.toPresent('werden')[person]
  const at = (i, len) => view.update([[n, i, i + (len || 1)]])
  // each edit, as [index, 'replace' | 'remove' | 'after' | 'before', text]
  let edits = []
  let tags = null
  if (want === 'future') {
    tags = ['Verb', 'Auxiliary', personTags[person]]
    state.lastFuture = !isSub
    if (shape.kind === 'future') {
      return null
    }
    if (shape.kind === 'perfect') {
      // 'ich habe gegessen' -> 'ich werde essen'
      edits = [[index, 'replace', werden], [shape.other, 'replace', shape.root]]
      // 'ich habe gegessen und getrunken' -> 'ich werde essen und trinken'
      shape.extras.forEach((o) => edits.push([o.at, 'replace', o.root]))
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
    edits = [[index, 'replace', methods.table(shape.root, [want])[want][person]]]
    tags = ['Verb', tenseTags[want], personTags[person]]
  } else {
    // the Perfekt is already in the past - 'ich habe gegessen'
    if (shape.kind === 'perfect' && want === 'past') {
      return null
    }
    // collapse it to one verb - 'ich habe gegessen' -> 'ich esse', 'ich werde gehen' -> 'ich ging'
    const [prefix, base] = splitPrefix(shape.root, shape.participle, lexicon)
    const str = methods.table(base, [want])[want][person]
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
    // each of the other verbs leads its own part - 'ich esse Brot und [trinke] Wasser'
    shape.extras.forEach((o) => {
      const [pre, inf] = splitPrefix(o.root, shape.kind === 'perfect' ? o.str : null, lexicon)
      const form = methods.table(inf, [want])[want][person]
      if (isSub) {
        // 'weil ich gegessen und getrunken habe' -> 'weil ich esse und trinke'
        edits.push([o.at, 'replace', pre + form, true])
      } else if (o.start === o.at) {
        edits.push([o.at, 'replace', pre ? form + ' ' + pre : form, true])
      } else {
        edits.push([o.at, pre ? 'replace' : 'remove', pre])
        edits.push([o.start, 'before', form])
      }
    })
  }
  if (edits.some((e) => e[1] !== 'remove' && !e[2])) {
    return null
  }
  // go right-to-left, so that each index stays true
  edits = edits.sort((a, b) => b[0] - a[0] || (a[1] === 'before' ? 1 : -1))
  let where = index
  // any other finite verbs that we make
  const made = []
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
    } else if (action === 'before') {
      at(i).insertBefore(str)
      at(i).tag(tags, 'to-' + want)
      made.push(view.document[n][i])
    } else if (i === index) {
      at(i).replaceWith(matchCase(str, term))
    } else {
      at(i).replaceWith(str)
      // a second finite verb - 'und [trinke]'
      if (edit[3]) {
        at(i).tag(tags, 'to-' + want)
        made.push(view.document[n][i])
      }
    }
  })
  // 'gehen [werde]'
  if (want === 'future' && isSub && shape.kind !== 'perfect') {
    where += 1
  }
  at(where).tag(tags, 'to-' + want)
  // more verbs may follow it - 'weil er lachen [wird], weint und singt'
  if (want === 'future' && isSub && shape.kind === 'simple') {
    state.subWerden = { term: view.document[n][where], person }
  }
  return [view.document[n][where]].concat(made.reverse())
}

const convertTo = function (view, want) {
  const state = {
    methods: view.methods.two.transform.verb,
    lexicon: view.model.one.lexicon,
    lastPerson: null,
    // did the last clause get a 'werden'?
    lastFuture: false,
    // the 'werden' at the end of the last subordinate clause
    subWerden: null,
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
      state.lastFuture = false
      state.subWerden = null
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
        phrase.terms.splice(phrase.terms.indexOf(term), 1, ...res)
      }
    })
  })
  // return what is left of each verb-phrase
  const ptrs = []
  phrases.forEach((phrase) => {
    const terms = view.document[phrase.n]
    const found = phrase.terms.map((term) => terms.indexOf(term)).filter((i) => i !== -1)
    // one match for each run of words - 'ich [esse] Brot und [trinke] Wasser'
    found.sort((x, y) => x - y).forEach((i, k) => {
      if (k > 0 && found[k - 1] === i - 1) {
        ptrs[ptrs.length - 1][2] = i + 1
      } else {
        ptrs.push([phrase.n, i, i + 1])
      }
    })
  })
  return view.update(ptrs)
}

export default convertTo
