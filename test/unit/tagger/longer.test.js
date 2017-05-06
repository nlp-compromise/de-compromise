var test = require('tape');
var nlp = require('../lib/nlp');
var pos_test = require('../lib/fns').pos_test;


test('long-tagger:', function(t) {
  [
    // ['Die Strafverfolger in Hannover sehen das anders', ['Determinativ', 'Substantiv', 'Adverb', 'Substantiv', 'Verb', 'Pronomen', 'Adverb']],
    // ['Die Beweislage sei gar nicht so dünn meint Wolfgang Langmack vom LKA', ['Determinativ', 'Substantiv', 'Verb', 'Adverb', 'Hilfsverb', 'Adverb', 'Adjektiv', 'Verb', 'Substantiv', 'Substantiv', 'Praposition', 'Substantiv']],
    ['Der Anwalt eines 17jährigen Jungen der als bisher einziger Verdächtiger von LKA-Beamten vernommen wurde sieht das anders', ['Determinativ', 'Substantiv', 'Determinativ', 'Adjektiv', 'Substantiv', 'Pronomen', 'Adverb', 'Adverb', 'Adjektiv', 'Substantiv', 'Adverb', 'Substantiv', 'Verb', 'Verb', 'Verb', 'Pronomen', 'Adverb']],
    // ['Die haben so gut wie nichts in der Hand', ['Pronomen', 'Verb', 'Adverb', 'Adjektiv', 'Bindewort', 'Pronomen', 'Adverb', 'Determinativ', 'Substantiv']],
    // ['MARTIN DAHMS Göttingen', ['Substantiv', 'Substantiv', 'Substantiv']],
    //
    // ['JOACHIM THOMMES', ['Substantiv', 'Substantiv']],
    // ['Hobby-Kicker', ['Substantiv']],
    // ['Meist auf eigenes Risiko', ['Adverb', 'Adverb', 'Adjektiv', 'Substantiv']],
    // ['Der Anwalt', ['Determinativ', 'Substantiv']]


  ].forEach(function (a) {
    var terms = nlp(a[0]).terms();
    pos_test(terms, a[1], t);
  });
  t.end();
});
