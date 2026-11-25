import api from './api.js'

export default {
  api,
  // the words beside a number, for the shared european-numbers plugin - '50 Prozent', '5 Franken'
  model: {
    two: {
      europeanNumbers: {
        percent: ['prozent'],
        currencies: ['euro', 'franken', 'dollar', 'pfund'],
      },
    },
  },
}
