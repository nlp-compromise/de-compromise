// hand-set tags for core function words.
// these win over the packed lexicon and the conjugation expansion.
export default {
  // question words
  'wo': 'QuestionWord',// where
  'woher': 'QuestionWord',//where  from
  'wohin': 'QuestionWord',//where  to
  'wann': 'QuestionWord',// when
  'was': 'QuestionWord',// what
  'wer': 'QuestionWord',// who
  'wie': 'QuestionWord',// how
  'warum': 'QuestionWord',// why
  'achte': 'TextOrdinal',

  // negation
  'nicht': ['Adverb', 'Negative'],
  'nein': ['Negative', 'Expression'],
  'kein': ['Determiner', 'Negative'],
  'keine': ['Determiner', 'Negative'],
  'keinem': ['Determiner', 'Negative'],
  'keinen': ['Determiner', 'Negative'],
  'keiner': ['Determiner', 'Negative'],
  'keines': ['Determiner', 'Negative'],

  // demonstrative determiners
  'dieser': 'Determiner',
  'diese': 'Determiner',
  'dieses': 'Determiner',
  'diesem': 'Determiner',
  'diesen': 'Determiner',
  'jener': 'Determiner',
  'jene': 'Determiner',
  'jenes': 'Determiner',
  'jenem': 'Determiner',
  'jenen': 'Determiner',

  // quantifier determiners
  'jeder': 'Determiner',
  'jede': 'Determiner',
  'jedes': 'Determiner',
  'jedem': 'Determiner',
  'jeden': 'Determiner',
  'mancher': 'Determiner',
  'manche': 'Determiner',
  'manches': 'Determiner',
  'manchem': 'Determiner',
  'manchen': 'Determiner',
  'solcher': 'Determiner',
  'solche': 'Determiner',
  'solches': 'Determiner',
  'solchem': 'Determiner',
  'solchen': 'Determiner',
  'welcher': 'Determiner',
  'welche': 'Determiner',
  'welches': 'Determiner',
  'welchem': 'Determiner',
  'welchen': 'Determiner',
  'alle': 'Determiner',
  'allen': 'Determiner',
  'aller': 'Determiner',
  'beide': 'Determiner',
  'beiden': 'Determiner',
  'viele': 'Determiner',
  'vielen': 'Determiner',
  'vieler': 'Determiner',
  'mehrere': 'Determiner',
  'mehreren': 'Determiner',
  'wenige': 'Determiner',
  'wenigen': 'Determiner',
  'einige': 'Determiner',
  'einigen': 'Determiner',
  'einiger': 'Determiner',

  // common adverbs/particles the lexicon mis-tags
  'morgen': 'Adverb',// tomorrow — 'Morgen' (morning) is caught by the titlecase pass
  'bitte': 'Adverb',// please — far more common than 'ich bitte'
  'etwas': 'Pronoun',// something
}
