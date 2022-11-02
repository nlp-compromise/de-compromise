import { learn, compress } from 'suffix-thumb'

import pairs from './results/to-present.js'

let model = learn(pairs)
model = compress(model)
console.log(model)