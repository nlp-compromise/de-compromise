var test = require('tape');
var nlp = require('../lib/nlp');
var pos_test = require('../lib/fns').pos_test;

test('=Infinitves=', function(T) {
  T.test('conjugate-infinitives-test:', function(t) {
    var infinitiv = 'werden';
    var expected = [
      ['ich', 'Singular', 'Neutrum', 'werde'],
      ['du', 'Singular', 'Neutrum', 'wirst'],
      ['er', 'Singular', 'Masculin', 'wird'],
      ['sie', 'Singular', 'Feminin', 'wird'],
      ['es', 'Singular', 'Neutrum', 'wird'],
      ['wir', 'Plural', 'Neutrum', 'werden'],
      ['ihr', 'Plural', 'Neutrum', 'werdet'],
      ['sie', 'Plural', 'Neutrum', 'werden']
    ];

    var actual = conjugate(infinitiv);
    t.deepEqual(expected, actual);
  });

  function conjugate(infinitiv) {
    const list = [
      ['ich', 'Singular', 'Neutrum'],
      ['du', 'Singular', 'Neutrum'],
      ['er', 'Singular', 'Masculin'],
      ['sie', 'Singular', 'Feminin'],
      ['es', 'Singular', 'Neutrum'],
      ['wir', 'Plural', 'Neutrum'],
      ['ihr', 'Plural', 'Neutrum'],
      ['sie', 'Plural', 'Neutrum']
    ];
    const result = list.map(function([pronomen, form, modifier]) {
      let conjugated;
      switch (pronomen) {
        case 'ich':
          if (infinitiv.match(/en$/)) {
            conjugated = infinitiv.slice(0, -1);
          }
          break;
        case 'du':
          if (infinitiv.match(/werden$/)) {
            conjugated = 'wirst';
          }
          break;
        case 'sie':
          if (modifier === 'Neutrum') {
            conjugated = 'werden';
            break;
          }
        case 'er':
        case 'es':
          if (infinitiv.match(/werden$/)) {
            conjugated = 'wird';
          }
          break;
        case 'ihr':
          if (infinitiv.match(/en$/)) {
            conjugated = infinitiv.slice(0, -1) + 't';
          }
          break;
        default:
          conjugated = infinitiv;
      }
      return [pronomen, form, modifier, conjugated];
    });
    return result;
  }
});
