const postTagger = function (doc) {
  // eine as 1 or the
  doc.match('eine #Value').tag('TextValue', 'eine-value')
  // 6.30 Uhr
  doc.match('#Value uhr').tag('Time', 'time-Uhr')
  // auxiliary verbs
  doc.match('[{sein}] #Verb', 0).tag('Auxiliary', 'sein-verb')
}
export default postTagger