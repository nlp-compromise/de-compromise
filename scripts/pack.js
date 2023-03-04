/* eslint-disable no-console */
import fs from 'fs'
import { pack } from 'efrt'
import { learn, compress } from 'suffix-thumb'
import lexicon from '../data/lexicon/index.js'
import models from '../data/models/index.js'
// import switches from '../lib/switches/index.js'
// import senses from '../lib/senses/index.js'

const steps = [
  {
    label: 'lexicon',
    path: './src/01-one/lexicon/_data.js',
    compress: function () {
      let packed = {}
      //turn them into a series of flat-arrays
      Object.keys(lexicon).forEach(word => {
        let tags = lexicon[word]
        if (typeof tags === 'string') {
          tags = [tags]
        }
        tags.forEach(tag => {
          packed[tag] = packed[tag] || []
          packed[tag].push(word)
        })
      })
      //pack each array into a tiny string
      Object.keys(packed).forEach(tag => {
        packed[tag] = pack(packed[tag])
      })
      return packed
    },
  },
  {
    label: 'models',
    path: './src/01-one/lexicon/methods/_data.js',
    compress: function () {
      let packed = {}
      // let opts = { min: 1 }
      // console.log('verbs')
      // Object.keys(models.verbs).forEach(k => {
      //   packed[k] = {}
      //   Object.keys(models.verbs[k]).forEach(form => {
      //     let pairs = models.verbs[k][form]
      //     console.log('-', k, form)
      //     packed[k][form] = learn(pairs, opts)
      //     packed[k][form] = compress(packed[k][form])
      //   })
      // })
      // console.log('present-participle')
      // let presentParticiple = learn(models.presentParticiple)
      // presentParticiple = compress(presentParticiple)
      // packed.presentParticiple = { presentParticiple }
      // console.log('past-participle')
      console.log(models.pastParticiple)
      let pastParticiple = learn(models.pastParticiple)
      console.log(pastParticiple)
      pastParticiple = compress(pastParticiple)
      packed.pastParticiple = { pastParticiple }
      return packed
    },
  }
]

// run through all our steps
steps.forEach(obj => {
  console.log(`\n 🕑  - packing ${obj.label}..`)
  const packed = obj.compress()

  //write it to a file in ./src
  const banner = `// generated in ./lib/${obj.label}\n`
  fs.writeFileSync(obj.path, banner + 'export default ' + JSON.stringify(packed, null, 2), 'utf8')

  //get filesize
  const stats = fs.statSync(obj.path)
  let size = (stats.size / 1000.0).toFixed(1)
  console.log(`       - ${obj.label} is  ` + size + 'k\n')
})
