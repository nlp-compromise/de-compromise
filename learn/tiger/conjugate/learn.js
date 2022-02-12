import { learn, compress } from 'suffix-thumb'

import pairs from './results/to-past.js'

let model = learn(pairs)
model = compress(model)
console.log(model)