const postTagger = function (doc) {
  // eine as 1 or the
  doc.match('eine #Value').tag('TextValue', 'eine-value')
  // 6.30 Uhr
  doc.match('#Value uhr').tag('Time', 'time-Uhr')
  // modal verbs
  // dürfen (be allowed to/may), können (be able to/can), mögen (to like/may), müssen (to have to/must), sollen (to ought to/should) and wollen (to want to).

  doc.match('[{dürfen}] #Pronoun?  #Verb', 0).tag('Modal', 'dürfen-verb')
  doc.match('[{können}] #Pronoun?  #Verb', 0).tag('Modal', 'können-verb')
  doc.match('[{mögen}] #Pronoun? #Verb', 0).tag('Modal', 'mögen-verb')
  doc.match('[{müssen}] #Pronoun?  #Verb', 0).tag('Modal', 'müssen-verb')
  doc.match('[{sollen}] #Pronoun?  #Verb', 0).tag('Modal', 'sollen-verb')
  doc.match('[{wollen}] #Pronoun?  #Verb', 0).tag('Modal', 'wollen-verb')

  // auxiliary verbs
  doc.match('[{sein}] #Verb', 0).tag('Auxiliary', 'sein-verb')
  doc.match('[{haben}] #Verb', 0).tag('Auxiliary', 'haben-verb')
  doc.match('[{werden}] #Verb', 0).tag('Auxiliary', 'werden-verb')
}
export default postTagger