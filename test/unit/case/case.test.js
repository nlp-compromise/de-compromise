var test = require('tape');
var nlp = require('../lib/nlp');

test('sanity-check case:', function (t) {
  var str = 'John xoo, John fredman';
  var r = nlp(str);
  str = r.toUpperCase().out('text');
  t.equal(str, 'JOHN XOO, JOHN FREDMAN', 'uppercase');

  str = r.toLowerCase().out('text');
  t.equal(str, 'john xoo, john fredman', 'lowercase');

  // str = r.toCamelCase().out('text');
  // t.equal(str, 'JohnXoo,JohnFredman', 'camelcase');
  t.end();
});
