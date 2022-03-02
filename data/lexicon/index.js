import adjectives from './adjectives.js'
import adverbs from './adverbs.js'
import auxiliaries from './auxiliaries.js'
import conjunctions from './conjunctions.js'
import determiners from './determiners.js'
import female from './female-nouns.js'
import infinitives from './infinitives.js'
import male from './male-nouns.js'
import neuter from './neuter-nouns.js'
import nouns from './nouns.js'
import prepositions from './prepositions.js'
import pronouns from './pronouns.js'
import values from './values.js'
import verbs from './verbs.js'


const data = [
  // nouns
  [adjectives, 'Adjective'],
  [adverbs, 'Adverb'],
  [auxiliaries, 'Auxiliarie'],
  [conjunctions, 'Conjunction'],
  [determiners, 'Determiner'],
  [female, 'FemaleNoun'],
  [verbs, 'Verb'],
  [infinitives, 'Infinitive'],
  [male, 'MaleNoun'],
  [neuter, 'NeuterNoun'],
  [nouns, 'Noun'],
  [prepositions, 'Preposition'],
  [pronouns, 'Pronoun'],
  [values, 'Value'],
]

let lex = {}
for (let i = 0; i < data.length; i++) {
  const list = data[i][0]
  for (let o = 0; o < list.length; o++) {
    // log duplicates
    if (lex[list[o]]) {
      console.log(list[o] + '  ' + lex[list[o]] + ' ' + data[i][1])
    }
    lex[list[o]] = data[i][1]
  }
}
// console.log(lex)
export default lex
