// compile-time smoke-test for types/index.d.ts
// checked by `pnpm run test:types` - never executed
import nlp from 'de-compromise'
import type {
  DeView, Verbs, Nouns, Adjectives, Numbers,
  VerbConjugation, NounConjugation, AdjectiveConjugation,
  ConjugationSet, ImperativeSet, ParsedNumber, SpecFailure, SpecOptions,
} from 'de-compromise'
import type View from 'compromise/view/one'

const doc: DeView = nlp('Die Kunden kauften fünfundzwanzig große Häuser')
const empty: DeView = nlp()

// core compromise/one methods are inherited
const txt: string = doc.text()
const found: boolean = doc.has('#Verb')
doc.match('#Noun').tag('Checked').out('array')

// verbs
const verbs: Verbs = doc.verbs()
const conj: VerbConjugation[] = verbs.conjugate()
const infinitive: string = conj[0].infinitive
const past: ConjugationSet = conj[0].pastTense
const firstPerson: string = past.first
const present: string = conj[0].presentTense.thirdPlural
const subj: ConjugationSet = conj[0].subjunctive2
const konjunktiv: string = conj[0].subjunctive1.second
const imperative: ImperativeSet = conj[0].imperative
const command: string = imperative.secondSingular
const participles: string[] = [conj[0].pastParticiple, conj[0].presentParticiple]
doc.verbs(0).conjugate(0)
// @ts-expect-error there are no tense-transforms in german, yet
verbs.toPastTense()

// nouns
const nouns: Nouns = doc.nouns()
const nounConj: NounConjugation[] = nouns.conjugate()
const plural: string = nounConj[0].plural
const singular: string = nounConj[0].singular
const plurals: View = nouns.isPlural()
const asPlural: View = nouns.toPlural()
const asSingular: string = nouns.toSingular(0).text()
// @ts-expect-error inflection methods return a plain view
nouns.toPlural().conjugate()

// adjectives
const adjs: Adjectives = doc.adjectives()
const adjConj: AdjectiveConjugation[] = adjs.conjugate()
const adjForms: string[] = [adjConj[0].infinitive, adjConj[0].one, adjConj[0].two, adjConj[0].three, adjConj[0].four]
doc.adjectives(0).conjugate(0)

// numbers
const nums: Numbers = nlp('fünfundzwanzig Kilo').numbers()
const values: Numbers = doc.values(0)
const nth: Numbers = doc.numbers(0)
const amounts: (number | null)[] = nums.get()
const parsed: ParsedNumber[] = nums.parse(0)
const num: number | null = parsed[0].num
const isText: boolean = parsed[0].isText
const suffix: string = parsed[0].suffix
const units: View = nums.units()
nums.json()
nums.toNumber().toText().toOrdinal().toCardinal()
nums.add(5).subtract(2).increment().decrement()
nums.plus(5).minus(2)
nums.greaterThan(1).lessThan(100).between(1, 100).isBetween(1, 100)
nums.isEqual(25).equals(25).set(60)
nums.isOrdinal().isCardinal()
nums.add('zwei').subtract('eins').plus('2').minus('1').set('fünf')
nums.json(0)
nums.json({ offset: true })
nums.json('offset')
// @ts-expect-error math needs a number or a string
nums.add(true)

// constructor methods
const tokens: DeView = nlp.tokenize('ein kurzer Text')
const ver: string = nlp.version
const hooks: string[] = nlp.hooks()
nlp.verbose(true)
nlp.verbose('tagger')
nlp.addWords({ 'skaten': 'Verb' })
nlp.addWords({ 'skaten': 'Verb' }, true)
nlp.addTags({ Checked: { is: 'Noun' } })
nlp.buildTrie(['a', 'b'])
nlp.compile(['a', 'b'])
nlp.buildNet([{ match: '#Noun' }])
nlp.typeahead({ 'hallo': 'Expression' })
nlp.parseMatch('#Noun')
nlp.plugin({})
nlp.extend({})
nlp.world()
nlp.model()
nlp.methods()
const opts: SpecOptions = { tags: 'use', failures: 'retain' }
const failures: SpecFailure[] = nlp.fromSpec('Der Hund läuft', opts).failures
const specDoc: DeView = nlp.testSpec('Der Hund läuft')

// @ts-expect-error input text must be a string
nlp(25)

// silence noUnusedLocals
export {
  empty, txt, found, infinitive, firstPerson, present, subj, konjunktiv, command, participles,
  plural, singular, plurals, asPlural, asSingular, adjForms,
  values, nth, amounts, num, isText, suffix, units,
  tokens, ver, hooks, failures, specDoc,
}
