var test = require('tape');
var nlp = require('../lib/nlp');
var pos_test = require('../lib/fns').pos_test;

test('=Tagger=', function(T) {
  T.test('lexicon-test:', function(t) {
    [
      ['die Muenchen', ['Determinativ', 'SachlichSubst']],
      ['alten', ['Adjektiv']],
      ['zwischen', ['Adverb']],
      ['und', ['Bindewort']],
      [
        'claudia und wohnungsnot',
        ['FemininSubst', 'Bindewort', 'FemininSubst']
      ],
      ['dresden', ['SachlichSubst']],
      ['konzerns', ['MannlichSubst']],
      ['spreche', ['Verb']],
      ['uebernehmen', ['Verb']],
      ['seiner', ['Pronomen']]
    ].forEach(function(a) {
      var terms = nlp(a[0]).terms();
      pos_test(terms, a[1], t);
    });
    t.end();
  });

  T.test('rules-test:', function(t) {
    [
      ['footem', ['Adjektiv']],
      ['foong', ['FemininSubst']],
      ['footz', ['MannlichSubst']],
      ['fooms', ['SachlichSubst']],
      ['fooie', ['Substantiv']],
      ['foogab', ['Verb']]
    ].forEach(function(a) {
      var terms = nlp(a[0]).terms();
      pos_test(terms, a[1], t);
    });
    t.end();
  });

  T.test('titlecase-test:', function(t) {
    [
      ['Bevorstehe', ['Verb']],
      ['Esse die Kuh', ['Verb', 'Determinativ', 'Substantiv']],
      ['Esse die Bevorstehe', ['Verb', 'Determinativ', 'Substantiv']]
    ].forEach(function(a) {
      var terms = nlp(a[0]).terms();
      pos_test(terms, a[1], t);
    });
    t.end();
  });
});
