'use strict';
let lexicon = require('./misc');


//add-in the arrays
require('./maleNouns').forEach((str) => lexicon[str] = 'Mannlich');
require('./femaleNouns').forEach((str) => lexicon[str] = 'Feminin');
require('./pronouns').forEach((str) => lexicon[str] = 'Pronomen');

module.exports = lexicon;
