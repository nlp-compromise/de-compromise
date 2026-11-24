import nlp from './_lib.js'

// One Tape assertion per spec line; leave t.end() to the caller.
const assertSpec = (t, txt, here = '') => {
  txt.split('\n').forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      return
    }
    const result = nlp.testSpec(line, false)
    if (result.failures.length === 0) {
      t.pass(`${here}: ${line}`)
      return
    }

    const details = result.failures
      .map(({ word, message: failureMessage }) => (word ? `'${word}'` : failureMessage))
      .join(', ')
    t.fail(`${here}: ${result.out('spec')} - !=${details}`)
  })
}

export default assertSpec
