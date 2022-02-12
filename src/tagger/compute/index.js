import titleCase from './titlecase-noun.js'

const tagger = function (view,) {
  let world = view.world
  // add noun to anything titlecased
  titleCase(view, world)
  // random ad-hoc stuff
  view.match('konig').tag('Noun')
  return view
}
export default tagger