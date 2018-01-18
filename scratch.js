var nlp = require('./src/index');

let str = 'Ich, ich bin dann König. Und du, du Königin. Werden wir Helden für einen Tag.';
var doc = nlp(str);
doc.debug();
