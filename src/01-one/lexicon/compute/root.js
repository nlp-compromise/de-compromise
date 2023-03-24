
const verbForm = function (term) {
  let want = [
    'FirstPerson',
    'SecondPerson',
    'ThirdPerson',
    'FirstPersonPlural',
    'SecondPersonPlural',
    'ThirdPersonPlural',
  ]
  return want.find(tag => term.tags.has(tag))
}


const root = function (view) {

  const { verb, noun, adjective } = view.world.methods.two.transform
  view.docs.forEach(terms => {
    terms.forEach(term => {
      let str = term.implicit || term.normal || term.text
      // get infinitive form of the verb
      if (term.tags.has('Verb')) {
        let form = verbForm(term)
        // look at past + present participles, first
        if (term.tags.has('Participle') && term.tags.has('PresentTense')) {
          term.root = verb.fromPresentParticiple(str, form)
        } else if (term.tags.has('Participle') && term.tags.has('PastTense')) {
          term.root = verb.fromPastParticiple(str, form)
        } else if (term.tags.has('PresentTense')) {
          term.root = verb.fromPresent(str, form)
        } else if (term.tags.has('PastTense')) {
          term.root = verb.fromPast(str, form)
        } else if (term.tags.has('Subjunctive1')) {
          term.root = verb.fromSubjunctive1(str, form)
        } else if (term.tags.has('Subjunctive2')) {
          term.root = verb.fromSubjunctive2(str, form)
        } else if (term.tags.has('Imperative')) {
          term.root = verb.fromImperative(str, form)
        } else {
          // term.root = verb.fromPresent(str, form)
        }
      }
      if (term.tags.has('Adjective')) {
        term.root = adjective.toRoot(str)
      }
      if (term.tags.has('Noun')) {
        term.root = noun.toRoot(str)
      }

    })
  })
  return view
}
export default root