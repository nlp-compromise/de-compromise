import adjectives from './adjectives.js'
import adverbs from './adverbs.js'
import conjunctions from './conjunctions.js'
import determiners from './determiners.js'
import prepositions from './prepositions.js'

// verbs
import infinitives from './verbs/infinitives.js'
import verbs from './verbs/verbs.js'
import modals from './verbs/modals.js'
// import auxiliary from './verbs/auxiliary.js'

// nouns
import female from './nouns/female-nouns.js'
import male from './nouns/male-nouns.js'
import neuter from './nouns/neuter-nouns.js'
import nouns from './nouns/nouns.js'
import pronouns from './nouns/pronouns.js'

import femaleNames from './people/femaleNames.js'
import maleNames from './people/maleNames.js'
import firstNames from './people/firstNames.js'
import lastNames from './people/lastNames.js'
import people from './people/people.js'

// numbers
import cardinal from './numbers/cardinal.js'
import ordinal from './numbers/ordinal.js'


const data = [
  // nouns
  [adjectives, 'Adjective'],
  [adverbs, 'Adverb'],
  [conjunctions, 'Conjunction'],
  [determiners, 'Determiner'],

  [femaleNames, 'FemaleName'],
  [maleNames, 'MaleName'],
  [firstNames, 'FirstName'],
  [lastNames, 'LastName'],
  [people, 'Person'],

  [verbs, 'Verb'],
  [modals, 'Modal'],
  [infinitives, 'Infinitive'],
  // [auxiliary, 'Auxiliary'],

  [male, 'MaleNoun'],
  [female, 'FemaleNoun'],
  [neuter, 'NeuterNoun'],
  [nouns, 'Noun'],

  [prepositions, 'Preposition'],
  [pronouns, 'Pronoun'],
  [cardinal, 'TextCardinal'],
  [ordinal, 'TextOrdinal'],
]

let lex = {}
for (let i = 0; i < data.length; i++) {
  const list = data[i][0]
  for (let o = 0; o < list.length; o++) {
    // log duplicates
    // if (lex[list[o]]) {
    //   console.log(list[o] + '  ' + lex[list[o]] + ' ' + data[i][1])
    // }
    lex[list[o]] = data[i][1]
  }
}
// console.log(lex)
export default lex
