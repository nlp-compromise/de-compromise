import { uncompress } from 'suffix-thumb'
import model from './_data.js'

// uncompress them
Object.keys(model).forEach(k => {
  Object.keys(model[k]).forEach(form => {
    model[k][form] = uncompress(model[k][form])
  })
})
export default model
