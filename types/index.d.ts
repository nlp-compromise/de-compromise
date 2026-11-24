import type View from 'compromise/view/one'
import type { Lexicon, Plugin, matchOptions, Match, Net } from 'compromise/misc'

/** conjugated forms for each grammatical person */
export interface ConjugationSet {
  /** ich - 'gehe' */
  first: string
  /** du - 'gehst' */
  second: string
  /** er/sie/es - 'geht' */
  third: string
  /** wir - 'gehen' */
  firstPlural: string
  /** ihr - 'geht' */
  secondPlural: string
  /** sie - 'gehen' */
  thirdPlural: string
}

/** the two imperative forms of a verb */
export interface ImperativeSet {
  /** du - 'gehe' */
  secondSingular: string
  /** ihr - 'geht' */
  secondPlural: string
}

/** all conjugations of a verb */
export interface VerbConjugation {
  /** 'gehen' */
  infinitive: string
  /** Präsens - 'gehe' */
  presentTense: ConjugationSet
  /** Präteritum - 'ging' */
  pastTense: ConjugationSet
  /** Konjunktiv I - 'gehe' */
  subjunctive1: ConjugationSet
  /** Konjunktiv II - 'ginge' */
  subjunctive2: ConjugationSet
  /** Imperativ - 'gehe' */
  imperative: ImperativeSet
  /** Partizip II - 'gegangen' */
  pastParticiple: string
  /** Partizip I - 'gehend' */
  presentParticiple: string
}

export interface NounConjugation {
  /** lower-cased singular form - 'haus' */
  singular: string
  /** lower-cased plural form - 'häuser' */
  plural: string
}

/** the declined endings of an adjective */
export interface AdjectiveConjugation {
  /** uninflected root form - 'groß' */
  infinitive: string
  /** '-er' form - 'großer' */
  one: string
  /** '-en' form - 'großen' */
  two: string
  /** '-e' form - 'große' */
  three: string
  /** '-es' form - 'großes' */
  four: string
}

/** a number, as parsed from the text */
export interface ParsedNumber {
  /** was it written with a thousands-separator - '1.234' - a re-written number remembers this, and gets it back as digits */
  hasComma: boolean
  /** leading characters - '-' or '€' */
  prefix: string
  /** the numeric value, or null if it could not be parsed */
  num: number | null
  /** trailing characters - '%' or '€' */
  suffix: string
  /** written-out, like 'vierzig' */
  isText: boolean
  /** an ordinal, like 'dritte' or '3.' */
  isOrdinal: boolean
  isFraction: boolean
  isMoney: boolean
}

export interface Verbs extends View {
  /** get all conjugated forms of these verbs - 'gehe', 'ging', 'gegangen' */
  conjugate(n?: number): VerbConjugation[]
  /** re-write these verbs in the past-tense (Präteritum) - 'sie geht' -> 'sie ging' */
  toPastTense(n?: number): Verbs
  /** re-write these verbs in the present-tense - 'sie ging' -> 'sie geht' */
  toPresentTense(n?: number): Verbs
  /** re-write these verbs in the future-tense - 'sie geht' -> 'sie wird gehen' */
  toFutureTense(n?: number): Verbs
}

export interface Nouns extends View {
  /** get the singular and plural forms of these nouns - 'haus', 'häuser' */
  conjugate(n?: number): NounConjugation[]
  /** return only the plural nouns - 'Häuser' */
  isPlural(n?: number): View
  /** re-write these nouns as plural - 'Haus' → 'Häuser' */
  toPlural(n?: number): View
  /** re-write these nouns as singular - 'Häuser' → 'Haus' */
  toSingular(n?: number): View
}

export interface Adjectives extends View {
  /** get the inflected forms of these adjectives - 'großer', 'großen', 'große', 'großes' */
  conjugate(n?: number): AdjectiveConjugation[]
}

export interface Numbers extends View {
  /** get the parsed details of each number */
  parse(n?: number): ParsedNumber[]
  /** get the numeric value of each number - 'vierzig' → 40, 'minus fünf' → -5, 'null' → 0 */
  get(n?: number): (number | null)[]
  /** json output, with parsed number data on each match - a number returns only the nth match */
  json(n?: number | string | object): any
  /** return the unit following each number - 'Kilo' in '25 Kilo' */
  units(): View
  /** return only ordinal numbers - 'dritte' */
  isOrdinal(): Numbers
  /** return only cardinal numbers - 'drei' */
  isCardinal(): Numbers
  /** re-write these numbers as digits - '40', '-5' - and returns only the numbers that changed */
  toNumber(): Numbers
  /** re-write these numbers as words - 'vierzig', 'minus fünf' */
  toText(): Numbers
  /** re-write these numbers as cardinal - 'vierzig' */
  toCardinal(): Numbers
  /** re-write these numbers as ordinal - 'vierzigste' */
  toOrdinal(): Numbers
  /** return numbers with this value */
  isEqual(n: number): Numbers
  /** alias for .isEqual() */
  equals(n: number): Numbers
  /** return numbers larger than n */
  greaterThan(n: number): Numbers
  /** return numbers smaller than n */
  lessThan(n: number): Numbers
  /** return numbers between min and max */
  between(min: number, max: number): Numbers
  /** alias for .between() */
  isBetween(min: number, max: number): Numbers
  /** set these numbers to n - 'vierzig' → 'sieben'. A string may be a written number, like 'null' */
  set(n: number | string): Numbers
  /** add n to these numbers - 'vierzig' → 'zweiundvierzig' */
  add(n: number | string): Numbers
  /** alias for .add() */
  plus(n: number | string): Numbers
  /** subtract n from these numbers - 'vierzig' → 'achtunddreißig' */
  subtract(n: number | string): Numbers
  /** alias for .subtract() */
  minus(n: number | string): Numbers
  /** add 1 to these numbers - 'vierzig' → 'einundvierzig' */
  increment(): Numbers
  /** subtract 1 from these numbers - 'vierzig' → 'neununddreißig' */
  decrement(): Numbers
}

/** options for nlp.fromSpec() */
export interface SpecOptions {
  tags?: 'ignore' | 'use'
  failures?: 'ignore' | 'throw' | 'retain' | 'log'
  verbose?: boolean
}

/** a failed line in a tagging spec */
export interface SpecFailure {
  code: 'length' | 'tags' | 'syntax' | 'match'
  line: number
  text: string
  message: string
  term?: number
  word?: string
  expected?: string[] | number
  actual?: string[] | number
}

/** a compromise document, with german-specific methods */
export interface DeView extends View {
  /** return any verbs, with conjugation methods - 'läuft' */
  verbs(n?: number): Verbs
  /** return any nouns, with inflection methods - 'Hund' */
  nouns(n?: number): Nouns
  /** return any adjectives, with inflection methods - 'große' */
  adjectives(n?: number): Adjectives
  /** return any numbers, with parsing and math methods - 'fünfundzwanzig' */
  numbers(n?: number): Numbers
  /** alias for .numbers() */
  values(n?: number): Numbers
}

/** parse the given german text */
declare function nlp(text?: string, lexicon?: Lexicon): DeView

declare namespace nlp {
  /** interpret text without tagging */
  export function tokenize(text: string, lexicon?: Lexicon): DeView
  /** mix in a compromise-plugin */
  export function plugin(plugin: Plugin): any
  /** mix in a compromise-plugin - alias for nlp.plugin() */
  export function extend(plugin: Plugin): any
  /** turn a match-string into json */
  export function parseMatch(match: string, opts?: matchOptions): object[]
  /** grab library internals */
  export function world(): object
  /** grab library metadata */
  export function model(): object
  /** grab exposed library methods */
  export function methods(): object
  /** which compute functions run automatically */
  export function hooks(): string[]
  /** log our decision-making for debugging - true, 'tagger', 'match' or 'chunker' */
  export function verbose(toLog?: boolean | string): any
  /** current semver version of the library */
  export const version: string
  /** connect new tags to tagset graph */
  export function addTags(tags: object): any
  /** add new words to internal lexicon */
  export function addWords(words: Lexicon, isFrozen?: boolean): any
  /** turn a list of words into a searchable graph */
  export function buildTrie(words: string[]): object
  /** alias for nlp.buildTrie() */
  export function compile(words: string[]): object
  /** compile a set of match objects to a more optimized form */
  export function buildNet(matches: Match[]): Net
  /** add words to the autoFill dictionary */
  export function typeahead(words: Lexicon): any
  /** parse spec text, optionally applying tags or validating its constraints */
  export function fromSpec(spec: string, options?: SpecOptions): DeView & { failures: SpecFailure[] }
  /** returns untagged sentences and failing tagged lines, with validation failures */
  export function testSpec(spec: string, verbose?: boolean, throwError?: boolean): DeView & { failures: SpecFailure[] }
}

export default nlp
