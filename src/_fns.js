module.exports={
  "preProcess": "\"function (ts) {\\n    // console.log('running preProcess')\\n    ts.terms.forEach((t, i) => {\\n      //if it's titlecase, make it a noun\\n      if (i > 0 && /[А-ЯЁ][а-яё]/.test(t.text) && Object.keys(t.tags).length === 0) {\\n        t.tag('Существительные', 'title-case')\\n      }\\n    })\\n    return ts\\n  }\"",
  "postProcess": "\"function (ts) {\\n    // console.log('running postProcess')\\n    return ts\\n  }\""
}