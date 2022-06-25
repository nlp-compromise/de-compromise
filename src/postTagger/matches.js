const postTagger = function (doc) {
  // eine as 1 or the
  doc.match('eine #Value').tag('TextValue', 'eine-value')
}
export default postTagger