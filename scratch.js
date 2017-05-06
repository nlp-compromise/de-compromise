'use strict';
var nlp = require('./src/index');
// nlp.verbose(true);
nlp.verbose('tagger');
// const corpus = require('nlp-corpus');
// let text = corpus.sotu.parsed()[0];
// const fresh = require('./test/unit/lib/freshPrince.js');

// console.log(nlp('I\'m going to the shops').sentences().toPastTense().out());



// var r = nlp('Zwar so argumentierten die Richter könnten diese Regeln unmittelbar nur auf den organisierten Verbandssport angewandt werden.');
var r = nlp('das anders ');
// console.log(r.terms().out('array'));
r.debug();
