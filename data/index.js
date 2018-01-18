
//this is our german-language data in the same form as a compromise-plugin
// to apply changes, run `npm run pack` and then `npm run watch`
module.exports = {

  //the german tagset
  tags: require('./tags'),

  //our given lexicon of known russian words
  words: require('./lexicon'),

  //regular-expressions on particular terms
  regex: {},

  //run arbitrary code during tagging..
  preProcess: function(ts) {
    return ts;
  },
  //and afterwards...
  postProcess: function(ts) {
    // console.log('running postProcess')
    return ts;
  },

  //word-sequence matches to tag...
  patterns: {
    'dr #Substantiv': 'Mensch', //Person
    'sir #Substantiv': 'Mensch', //Person
  }

// other plugin stuff (not implimented yet)
// conjugations: {},
// plurals: {},
};
