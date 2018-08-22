var test = require('tape');
var nlp = require('../lib/nlp');
var pos_test = require('../lib/fns').pos_test;

test('long-tagger:', function(t) {
  [
    [
      'Die Strafverfolger in Hannover sehen das anders',
      [
        'Determinativ',
        'Substantiv',
        'Adverb',
        'Substantiv',
        'Verb',
        'Determinativ',
        'Adverb'
      ]
    ],
    [
      'Die Beweislage sei gar nicht so dünn meint Wolfgang Langmack vom LKA',
      [
        'Determinativ',
        'Substantiv',
        'Verb',
        'Adverb',
        'Hilfsverb',
        'Adverb',
        'Adjektiv',
        'Verb',
        'Substantiv',
        'Substantiv',
        'Praposition',
        'Substantiv'
      ]
    ],
    [
      'Die haben so gut wie nichts in der Hand',
      [
        'Determinativ',
        'Verb',
        'Adverb',
        'Adjektiv',
        'Bindewort',
        'Pronomen',
        'Adverb',
        'Determinativ',
        'Substantiv'
      ]
    ],
    ['MARTIN DAHMS Göttingen', ['Substantiv', 'Substantiv', 'Substantiv']],
    [
      'Für ehrliche Kunden ist es ein Schock',
      [
        'Adverb',
        'Adjektiv',
        'Substantiv',
        'Verb',
        'Pronomen',
        'Determinativ',
        'Substantiv'
      ]
    ],
    [
      'Aber Taschenkontrollen sind häufig nicht rechtens',
      ['Bindewort', 'Substantiv', 'Verb', 'Adjektiv', 'Hilfsverb', 'Adverb']
    ],
    [
      'Würden Sie bitte mal Ihre Tasche öffnen',
      ['Verb', 'Pronomen', 'Adverb', 'Adverb', 'Pronomen', 'Substantiv', 'Verb']
    ],
    [
      'Die Verdächtigung ein Ladendieb zu sein trifft viele wie ein Schlag',
      [
        'Determinativ',
        'Substantiv',
        'Determinativ',
        'Substantiv',
        'Hilfsverb',
        'Verb',
        'Verb',
        'Pronomen',
        'Bindewort',
        'Determinativ',
        'Substantiv'
      ]
    ],
    [
      'Auch nicht die Polizei',
      ['Adverb', 'Hilfsverb', 'Determinativ', 'Substantiv']
    ],
    [
      'Teure Detektive und kostspielige Elektronik kann sich der Supermarkt an der Ecke nicht leisten',
      [
        'Adjektiv',
        'Substantiv',
        'Bindewort',
        'Adjektiv',
        'Substantiv',
        'Verb',
        'Pronomen',
        'Determinativ',
        'Substantiv',
        'Adverb',
        'Determinativ',
        'Substantiv',
        'Hilfsverb',
        'Verb'
      ]
    ],
    [
      'Doch wichtiger als die Aufklärung der eigenen Klientel scheint ihm die Klage über den Zustand der öffentlichen Moral',
      [
        'Bindewort',
        'Adjektiv',
        'Bindewort',
        'Determinativ',
        'Substantiv',
        'Determinativ',
        'Adjektiv',
        'Substantiv',
        'Verb',
        'Pronomen',
        'Determinativ',
        'Substantiv',
        'Adverb',
        'Determinativ',
        'Substantiv',
        'Determinativ',
        'Adjektiv',
        'Substantiv'
      ]
    ],
    [
      'Denn es ist gar nicht so sicher wer tatsächlich die krummeren Finger macht',
      [
        'Bindewort',
        'Pronomen',
        'Verb',
        'Adverb',
        'Hilfsverb',
        'Adverb',
        'Adjektiv',
        'Pronomen',
        'Adjektiv',
        'Determinativ',
        'Adjektiv',
        'Substantiv',
        'Verb'
      ]
    ],
    [
      'Für eine Statistik reicht das nicht',
      [
        'Adverb',
        'Determinativ',
        'Substantiv',
        'Verb',
        'Determinativ',
        'Hilfsverb'
      ]
    ],
    [
      'Ein dicker Brocken immerhin',
      ['Determinativ', 'Adjektiv', 'Substantiv', 'Adverb']
    ],
    [
      'Auch sie sieht in der Kundenkontrolle an der Kasse das eigentlich Schlimme und weiß von Fällen in denen Richter den so Diskriminierten schon Schmerzensgeld zugesprochen haben',
      [
        'Adverb',
        'Pronomen',
        'Verb',
        'Adverb',
        'Determinativ',
        'Substantiv',
        'Adverb',
        'Determinativ',
        'Substantiv',
        'Determinativ',
        'Adverb',
        'Substantiv',
        'Bindewort',
        'Verb',
        'Adverb',
        'Substantiv',
        'Adverb',
        'Pronomen',
        'Substantiv',
        'Determinativ',
        'Adverb',
        'Substantiv',
        'Adverb',
        'Substantiv',
        'Verb',
        'Verb'
      ]
    ],
    ['Meist auf eigenes Risiko', ['Adverb', 'Adverb', 'Adjektiv', 'Substantiv']]
  ].forEach(function(a) {
    var terms = nlp(a[0]).terms();
    pos_test(terms, a[1], t);
  });
  t.end();
});
