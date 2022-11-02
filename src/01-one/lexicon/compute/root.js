
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

//relajarse -> relajar
const stripReflexive = function (str) {
  str = str.replace(/se$/, '')
  str = str.replace(/te$/, '')
  str = str.replace(/me$/, '')
  return str
}

const root = function (view) {

  const { verb, noun, adjective } = view.world.methods.two.transform
  view.docs.forEach(terms => {
    terms.forEach(term => {
      let str = term.implicit || term.normal || term.text

      if (term.tags.has('Reflexive')) {
        str = stripReflexive(str)
      }
      // get infinitive form of the verb
      if (term.tags.has('Verb')) {
        let form = verbForm(term)
        if (term.tags.has('Gerund')) {
          term.root = verb.fromGerund(str, form)
        } else if (term.tags.has('PresentTense')) {
          term.root = verb.fromPresent(str, form)
        } else if (term.tags.has('PastTense')) {
          term.root = verb.fromPast(str, form)
        } else if (term.tags.has('FutureTense')) {
          term.root = verb.fromFuture(str, form)
        } else if (term.tags.has('Conditional')) {
          term.root = verb.fromConditional(str, form)
        } else {
          // term.root = verb.fromPresent(str, form)
        }
      }

      // nouns -> singular masculine form
      // if (term.tags.has('Noun')) {
      //   if (term.tags.has('Plural')) {
      //     str = noun.toSingular(str)
      //   }
      //   if (term.tags.has('FemaleNoun')) {
      //     // not sure about this
      //     // str = noun.toMasculine(str)
      //   }
      //   term.root = str
      // }

      // // nouns -> singular masculine form
      // if (term.tags.has('Adjective')) {
      //   if (term.tags.has('PluralAdjective')) {
      //     if (term.tags.has('FemaleAdjective')) {
      //       str = adjective.fromFemalePlural(str)
      //     } else {
      //       str = adjective.toSingular(str)
      //     }
      //   }
      //   if (term.tags.has('FemaleAdjective')) {
      //     str = adjective.fromFemale(str)
      //   }
      //   term.root = str
      // }
    })
  })
  return view
}
export default root