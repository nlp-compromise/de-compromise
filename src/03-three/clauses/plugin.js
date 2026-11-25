// german word-rules for .clauses() - the method itself comes from compromise/shared
const clauses = {
  // a comma, but not a clause break
  notClause: [
    '@hasComma (und|oder) .', // groß, und stark
  ],
  // split a clause after these
  splitAfter: [
    '^#Pron (sagte|sagt)', // er sagte
  ],
  // split a clause before these
  splitBefore: [
    '(sagte|sagt) #Prop$',
    '. . wenn .{4}', // ... wenn es so wäre
    'und während',
    'jetzt wo',
    'seitdem',
    '(obwohl|obgleich)',
    '(selbst|auch) wenn',
    'wohingegen', // whereas
    'als ob',
    'solange',
  ],
  // split a clause before the [captured] word
  splitBeforeGroup: [
    '#Verb .* [aber] .* #Verb', // es ist gut aber es ist ..
    'wenn .{2,9} [dann] .', // wenn es dies ist dann das
  ],
}

export default {
  model: { three: { clauses } },
}
