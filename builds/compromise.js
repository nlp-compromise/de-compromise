(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.nlp = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports={
  "author": "Spencer Kelly <spencermountain@gmail.com> (http://spencermounta.in)",
  "name": "kompromiss",
  "description": "Computerlinguistik im browser",
  "version": "0.0.1",
  "main": "./builds/kompromiss.js",
  "repository": {
    "type": "git",
    "url": "git://github.com/nlp-compromise/de-compromise.git"
  },
  "scripts": {
    "test": "node ./scripts/test.js",
    "build": "node ./scripts/build/index.js",
    "demo": "node ./scripts/demo.js",
    "watch": "node ./scripts/watch.js"
  },
  "files": [
    "builds/",
    "docs/"
  ],
  "dependencies": {},
  "devDependencies": {
    "babel-preset-es2015": "^6.24.0",
    "babelify": "7.3.0",
    "babili": "0.0.11",
    "browserify": "13.0.1",
    "browserify-glob": "^0.2.0",
    "bundle-collapser": "^1.2.1",
    "chalk": "^1.1.3",
    "codacy-coverage": "^2.0.0",
    "derequire": "^2.0.3",
    "efrt": "0.0.6",
    "eslint": "^3.1.1",
    "gaze": "^1.1.1",
    "http-server": "0.9.0",
    "nlp-corpus": "latest",
    "nyc": "^8.4.0",
    "shelljs": "^0.7.2",
    "tap-min": "^1.1.0",
    "tap-spec": "4.1.1",
    "tape": "4.6.0",
    "uglify-js": "2.7.0"
  },
  "license": "MIT"
}

},{}],2:[function(_dereq_,module,exports){
//these are common word shortenings used in the lexicon and sentence segmentation methods
//there are all nouns,or at the least, belong beside one.
'use strict';

//common abbreviations

var compact = {
  Noun: ['arc', 'al', 'exp', 'fy', 'pd', 'pl', 'plz', 'tce', 'bl', 'ma', 'ba', 'lit', 'ex', 'eg', 'ie', 'ca', 'cca', 'vs', 'etc', 'esp', 'ft',
  //these are too ambiguous
  'bc', 'ad', 'md', 'corp', 'col'],
  Organization: ['dept', 'univ', 'assn', 'bros', 'inc', 'ltd', 'co',
  //proper nouns with exclamation marks
  'yahoo', 'joomla', 'jeopardy'],

  Place: ['rd', 'st', 'dist', 'mt', 'ave', 'blvd', 'cl', 'ct', 'cres', 'hwy',
  //states
  'ariz', 'cal', 'calif', 'colo', 'conn', 'fla', 'fl', 'ga', 'ida', 'ia', 'kan', 'kans', 'minn', 'neb', 'nebr', 'okla', 'penna', 'penn', 'pa', 'dak', 'tenn', 'tex', 'ut', 'vt', 'va', 'wis', 'wisc', 'wy', 'wyo', 'usafa', 'alta', 'ont', 'que', 'sask'],

  Date: ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec', 'circa'],

  //Honorifics
  Honorific: ['adj', 'adm', 'adv', 'asst', 'atty', 'bldg', 'brig', 'capt', 'cmdr', 'comdr', 'cpl', 'det', 'dr', 'esq', 'gen', 'gov', 'hon', 'jr', 'llb', 'lt', 'maj', 'messrs', 'mister', 'mlle', 'mme', 'mr', 'mrs', 'ms', 'mstr', 'op', 'ord', 'phd', 'prof', 'pvt', 'rep', 'reps', 'res', 'rev', 'sen', 'sens', 'sfc', 'sgt', 'sir', 'sr', 'supt', 'surg'
  //miss
  //misses
  ]

};

//unpack the compact terms into the misc lexicon..
var abbreviations = {};
var keys = Object.keys(compact);
for (var i = 0; i < keys.length; i++) {
  var arr = compact[keys[i]];
  for (var i2 = 0; i2 < arr.length; i2++) {
    abbreviations[arr[i2]] = keys[i];
  }
}
module.exports = abbreviations;

},{}],3:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  abbreviations: _dereq_('./abbreviations')
};

},{"./abbreviations":2}],4:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var tagset = _dereq_('./tagset');

// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
var c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  black: '\x1b[30m'
};
//dont use colors on client-side
if (typeof module === 'undefined') {
  Object.keys(c).forEach(function (k) {
    c[k] = '';
  });
}

//coerce any input into a string
exports.ensureString = function (input) {
  if (typeof input === 'string') {
    return input;
  } else if (typeof input === 'number') {
    return '' + input;
  }
  return '';
};
//coerce any input into a string
exports.ensureObject = function (input) {
  if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) !== 'object') {
    return {};
  }
  if (input === null || input instanceof Array) {
    return {};
  }
  return input;
};

exports.titleCase = function (str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

//shallow-clone an object
exports.copy = function (o) {
  var o2 = {};
  o = exports.ensureObject(o);
  Object.keys(o).forEach(function (k) {
    o2[k] = o[k];
  });
  return o2;
};
exports.extend = function (obj, a) {
  obj = exports.copy(obj);
  var keys = Object.keys(a);
  for (var i = 0; i < keys.length; i++) {
    obj[keys[i]] = a[keys[i]];
  }
  return obj;
};

//colorization
exports.green = function (str) {
  return c.green + str + c.reset;
};
exports.red = function (str) {
  return c.red + str + c.reset;
};
exports.blue = function (str) {
  return c.blue + str + c.reset;
};
exports.magenta = function (str) {
  return c.magenta + str + c.reset;
};
exports.cyan = function (str) {
  return c.cyan + str + c.reset;
};
exports.yellow = function (str) {
  return c.yellow + str + c.reset;
};
exports.black = function (str) {
  return c.black + str + c.reset;
};
exports.printTag = function (tag) {
  if (tagset[tag]) {
    var color = tagset[tag].color || 'black';
    return exports[color](tag);
  }
  return tag;
};
exports.printTerm = function (t) {
  var tags = Object.keys(t.tags);
  for (var i = 0; i < tags.length; i++) {
    if (tagset[tags[i]]) {
      var color = tagset[tags[i]].color || 'black';
      return exports[color](t.out('text'));
    }
  }
  return c.reset + t.plaintext + c.reset;
};

exports.leftPad = function (str, width, char) {
  char = char || ' ';
  str = str.toString();
  while (str.length < width) {
    str += char;
  }
  return str;
};

exports.isArray = function (arr) {
  return Object.prototype.toString.call(arr) === '[object Array]';
};

},{"./tagset":20}],5:[function(_dereq_,module,exports){
(function (global){
'use strict';

var buildResult = _dereq_('./result/build');
var pkg = _dereq_('../package.json');
var log = _dereq_('./log');

//the main thing
var nlp = function nlp(str, lexicon) {
  // this.tagset = tagset;
  var r = buildResult(str, lexicon);
  r.tagger();
  return r;
};

//same as main method, except with no POS-tagging.
nlp.tokenize = function (str) {
  return buildResult(str);
};

//this is useful
nlp.version = pkg.version;

//turn-on some debugging
nlp.verbose = function (str) {
  log.enable(str);
};

//and then all-the-exports...
if (typeof self !== 'undefined') {
  self.nlp = nlp; // Web Worker
} else if (typeof window !== 'undefined') {
  window.nlp = nlp; // Browser
} else if (typeof global !== 'undefined') {
  global.nlp = nlp; // NodeJS
}
//don't forget amd!
if (typeof define === 'function' && define.amd) {
  define(nlp);
}
//then for some reason, do this too!
if (typeof module !== 'undefined') {
  module.exports = nlp;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../package.json":1,"./log":7,"./result/build":9}],6:[function(_dereq_,module,exports){
'use strict';

var fns = _dereq_('../fns');

// const colors = {
//   'Person': '#6393b9',
//   'Pronoun': '#81acce',
//   'Noun': 'steelblue',
//   'Verb': 'palevioletred',
//   'Adverb': '#f39c73',
//   'Adjective': '#b3d3c6',
//   'Determiner': '#d3c0b3',
//   'Preposition': '#9794a8',
//   'Conjunction': '#c8c9cf',
//   'Value': 'palegoldenrod',
//   'Expression': '#b3d3c6'
// };

var tag = function tag(t, pos, reason) {
  var title = t.normal || '[' + t.silent_term + ']';
  title = fns.leftPad('\'' + title + '\'', 12);
  title += '  ->   ' + pos;
  title += fns.leftPad(reason || '', 15);
  console.log('%c' + title, ' color: #a2c99c');
};
var untag = function untag(t, pos, reason) {
  var title = t.normal || '[' + t.silent_term + ']';
  title = fns.leftPad('\'' + title + '\'', 12);
  title += '  ~*   ' + pos;
  title += '    ' + (reason || '');
  console.log('%c' + title, ' color: #b66a6a');
};
module.exports = {
  tag: tag,
  untag: untag
};

},{"../fns":4}],7:[function(_dereq_,module,exports){
'use strict';

var client = _dereq_('./client');
var server = _dereq_('./server');

var _enable = false;

module.exports = {
  enable: function enable(str) {
    if (str === undefined) {
      str = true;
    }
    _enable = str;
  },
  tag: function tag(t, pos, reason) {
    if (_enable === true || _enable === 'tagger') {
      if (typeof window !== 'undefined') {
        client.tag(t, pos, reason);
      } else {
        server.tag(t, pos, reason);
      }
    }
  },
  unTag: function unTag(t, pos, reason) {
    if (_enable === true || _enable === 'tagger') {
      if (typeof window !== 'undefined') {
        client.untag(t, pos, reason);
      } else {
        server.untag(t, pos, reason);
      }
    }
  }
};

},{"./client":6,"./server":8}],8:[function(_dereq_,module,exports){
'use strict';

var fns = _dereq_('../fns');

//use weird bash escape things for some colors
var tag = function tag(t, pos, reason) {
  var title = t.normal || '[' + t.silent_term + ']';
  title = fns.yellow(title);
  title = fns.leftPad('\'' + title + '\'', 20);
  title += '  ->   ' + fns.printTag(pos);
  title = fns.leftPad(title, 54);
  console.log('       ' + title + '(' + fns.cyan(reason || '') + ')');
};

var untag = function untag(t, pos, reason) {
  var title = '-' + t.normal + '-';
  title = fns.red(title);
  title = fns.leftPad(title, 20);
  title += '  ~*   ' + fns.red(pos);
  title = fns.leftPad(title, 54);
  console.log('       ' + title + '(' + fns.red(reason || '') + ')');
};

module.exports = {
  tag: tag,
  untag: untag
};

},{"../fns":4}],9:[function(_dereq_,module,exports){
'use strict';

var Text = _dereq_('./index');
var tokenize = _dereq_('./tokenize');
var p = _dereq_('./paths');
var Terms = p.Terms;
var fns = p.fns;
var normalize = _dereq_('../term/normalize');

//basically really dirty and stupid.
var normalizeLex = function normalizeLex(lex) {
  lex = lex || {};
  return Object.keys(lex).reduce(function (h, k) {
    //add natural form
    h[k] = lex[k];
    var normal = normalize(k);
    //remove periods
    //normalize whitesace
    normal = normal.replace(/\s+/, ' ');
    //remove sentence-punctuaion too
    normal = normal.replace(/[.\?\!]/g, '');
    if (k !== normal) {
      //add it too
      h[normal] = lex[k];
    }
    return h;
  }, {});
};

var fromString = function fromString(str, lexicon) {
  var sentences = [];
  //allow pre-tokenized input
  if (fns.isArray(str)) {
    sentences = str;
  } else {
    str = fns.ensureString(str);
    sentences = tokenize(str);
  }
  //make sure lexicon obeys standards
  lexicon = normalizeLex(lexicon);
  var list = sentences.map(function (s) {
    return Terms.fromString(s, lexicon);
  });

  var r = new Text(list, lexicon);
  //give each ts a ref to the result
  r.list.forEach(function (ts) {
    ts.refText = r;
  });
  return r;
};
module.exports = fromString;

},{"../term/normalize":26,"./index":11,"./paths":17,"./tokenize":18}],10:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  /** did it find anything? */
  found: function found() {
    return this.list.length > 0;
  },
  /** just a handy wrap*/
  parent: function parent() {
    return this.reference || this;
  },
  /** how many Texts are there?*/
  length: function length() {
    return this.list.length;
  },
  /** nicer than constructor.call.name or whatever*/
  isA: function isA() {
    return 'Text';
  },
  /** the whitespace before and after this match*/
  whitespace: function whitespace() {
    var _this = this;

    return {
      before: function before(str) {
        _this.list.forEach(function (ts) {
          ts.whitespace.before(str);
        });
        return _this;
      },
      after: function after(str) {
        _this.list.forEach(function (ts) {
          ts.whitespace.after(str);
        });
        return _this;
      }
    };
  }

};

},{}],11:[function(_dereq_,module,exports){
'use strict';
//a Text is an array of termLists

var getters = _dereq_('./getters');

function Text(arr, lexicon, reference) {
  this.list = arr || [];
  this.lexicon = lexicon;
  this.reference = reference;
  //apply getters
  var keys = Object.keys(getters);
  for (var i = 0; i < keys.length; i++) {
    Object.defineProperty(this, keys[i], {
      get: getters[keys[i]]
    });
  }
}
_dereq_('./methods/loops')(Text);
_dereq_('./methods/out')(Text);

module.exports = Text;

},{"./getters":10,"./methods/loops":12,"./methods/out":13}],12:[function(_dereq_,module,exports){
'use strict';
//this methods are simply loops around each termList object.

var methods = [
// 'toTitleCase',
// 'toUpperCase',
// 'toLowerCase',
// 'toCamelCase',
//
// 'hyphenate',
// 'dehyphenate',
// 'trim',
// 
// 'insertBefore',
// 'insertAfter',
// 'insertAt',
//
// 'replace',
// 'replaceWith',
//
// 'delete',
// 'lump',

'tagger'];

var addMethods = function addMethods(Text) {
  methods.forEach(function (k) {
    Text.prototype[k] = function () {
      for (var i = 0; i < this.list.length; i++) {
        this.list[i][k].apply(this.list[i], arguments);
      }
      return this;
    };
  });

  //add an extra optimisation for tag method
  Text.prototype.tag = function () {
    //fail-fast optimisation
    if (this.list.length === 0) {
      return this;
    }
    for (var i = 0; i < this.list.length; i++) {
      this.list[i].tag.apply(this.list[i], arguments);
    }
    return this;
  };
};

module.exports = addMethods;

},{}],13:[function(_dereq_,module,exports){
'use strict';

var _topk = _dereq_('./topk');
var offset = _dereq_('./offset');
var termIndex = _dereq_('./indexes');

var methods = {
  text: function text(r) {
    return r.list.reduce(function (str, ts) {
      str += ts.out('text');
      return str;
    }, '');
  },
  normal: function normal(r) {
    return r.list.map(function (ts) {
      var str = ts.out('normal');
      var last = ts.last();
      if (last) {
        var punct = last.endPunctuation();
        if (punct === '.' || punct === '!' || punct === '?') {
          str += punct;
        }
      }
      return str;
    }).join(' ');
  },
  root: function root(r) {
    return r.list.map(function (ts) {
      return ts.out('root');
    }).join(' ');
  },
  /** output where in the original output string they are*/
  offsets: function offsets(r) {
    return offset(r);
  },
  /** output the tokenized location of this match*/
  index: function index(r) {
    return termIndex(r);
  },
  grid: function grid(r) {
    return r.list.reduce(function (str, ts) {
      str += ts.out('grid');
      return str;
    }, '');
  },
  color: function color(r) {
    return r.list.reduce(function (str, ts) {
      str += ts.out('color');
      return str;
    }, '');
  },
  array: function array(r) {
    return r.list.map(function (ts) {
      return ts.out('normal');
    });
  },
  csv: function csv(r) {
    return r.list.map(function (ts) {
      return ts.out('csv');
    }).join('\n');
  },
  newlines: function newlines(r) {
    return r.list.map(function (ts) {
      return ts.out('newlines');
    }).join('\n');
  },
  json: function json(r) {
    return r.list.reduce(function (arr, ts) {
      var terms = ts.terms.map(function (t) {
        return {
          text: t.text,
          normal: t.normal,
          tags: t.tag
        };
      });
      arr.push(terms);
      return arr;
    }, []);
  },
  html: function html(r) {
    var html = r.list.reduce(function (str, ts) {
      var sentence = ts.terms.reduce(function (sen, t) {
        sen += '\n    ' + t.out('html');
        return sen;
      }, '');
      return str += '\n  <span>' + sentence + '\n  </span>';
    }, '');
    return '<span> ' + html + '\n</span>';
  },
  terms: function terms(r) {
    var arr = [];
    r.list.forEach(function (ts) {
      ts.terms.forEach(function (t) {
        arr.push({
          text: t.text,
          normal: t.normal,
          tags: Object.keys(t.tags)
        });
      });
    });
    return arr;
  },
  debug: function debug(r) {
    console.log('====');
    r.list.forEach(function (ts) {
      console.log('   --');
      ts.debug();
    });
    return r;
  },
  topk: function topk(r) {
    return _topk(r);
  }
};
methods.plaintext = methods.text;
methods.normalized = methods.normal;
methods.colors = methods.color;
methods.tags = methods.terms;
methods.offset = methods.offsets;
methods.idexes = methods.index;
methods.frequency = methods.topk;
methods.freq = methods.topk;
methods.arr = methods.array;

var addMethods = function addMethods(Text) {
  Text.prototype.out = function (fn) {
    if (methods[fn]) {
      return methods[fn](this);
    }
    return methods.text(this);
  };
  Text.prototype.debug = function () {
    return methods.debug(this);
  };
  return Text;
};

module.exports = addMethods;

},{"./indexes":14,"./offset":15,"./topk":16}],14:[function(_dereq_,module,exports){
'use strict';
//find where in the original text this match is found, by term-counts

var termIndex = function termIndex(r) {
  var result = [];
  //find the ones we want
  var want = {};
  r.terms().list.forEach(function (ts) {
    want[ts.terms[0].uid] = true;
  });

  //find their counts
  var sum = 0;
  var parent = r.all();
  parent.list.forEach(function (ts, s) {
    ts.terms.forEach(function (t, i) {
      if (want[t.uid] !== undefined) {
        result.push({
          text: t.text,
          normal: t.normal,
          term: sum,
          sentence: s,
          sentenceTerm: i
        });
      }
      sum += 1;
    });
  });

  return result;
};
module.exports = termIndex;

},{}],15:[function(_dereq_,module,exports){
'use strict';
/** say where in the original output string they are found*/

var findOffset = function findOffset(parent, term) {
  var sum = 0;
  for (var i = 0; i < parent.list.length; i++) {
    for (var o = 0; o < parent.list[i].terms.length; o++) {
      var t = parent.list[i].terms[o];
      if (t.uid === term.uid) {
        return sum;
      } else {
        sum += t.whitespace.before.length + t._text.length + t.whitespace.after.length;
      }
    }
  }
  return null;
};

//like 'text' for the middle, and 'normal' for the start+ends
//used for highlighting the actual words, without whitespace+punctuation
var trimEnds = function trimEnds(ts) {
  var terms = ts.terms;
  if (terms.length <= 2) {
    return ts.out('normal');
  }
  //the start
  var str = terms[0].normal;
  //the middle
  for (var i = 1; i < terms.length - 1; i++) {
    var t = terms[i];
    str += t.whitespace.before + t.text + t.whitespace.after;
  }
  //the end
  str += ' ' + terms[ts.terms.length - 1].normal;
  return str;
};

//map over all-dem-results
var allOffset = function allOffset(r) {
  var parent = r.all();
  return r.list.map(function (ts) {
    var words = [];
    for (var i = 0; i < ts.terms.length; i++) {
      words.push(ts.terms[i].normal);
    }
    var nrml = trimEnds(ts);
    var txt = ts.out('text');
    var startAt = findOffset(parent, ts.terms[0]);
    var beforeWord = ts.terms[0].whitespace.before;
    var wordStart = startAt + beforeWord.length;
    return {
      text: txt,
      normal: ts.out('normal'),
      //where we begin
      offset: startAt,
      length: txt.length,
      wordStart: wordStart,
      wordEnd: wordStart + nrml.length
    };
  });
};
module.exports = allOffset;

},{}],16:[function(_dereq_,module,exports){
'use strict';
//

var topk = function topk(r, n) {
  //count occurance
  var count = {};
  r.list.forEach(function (ts) {
    var str = ts.out('root');
    count[str] = count[str] || 0;
    count[str] += 1;
  });
  //turn into an array
  var all = [];
  Object.keys(count).forEach(function (k) {
    all.push({
      normal: k,
      count: count[k]
    });
  });
  //add percentage
  all.forEach(function (o) {
    o.percent = parseFloat((o.count / r.list.length * 100).toFixed(2));
  });
  //sort by freq
  all = all.sort(function (a, b) {
    if (a.count > b.count) {
      return -1;
    }
    return 1;
  });
  if (n) {
    all = all.splice(0, n);
  }
  return all;
};

module.exports = topk;

},{}],17:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  fns: _dereq_('../fns'),
  data: _dereq_('../data'),
  Terms: _dereq_('../terms'),
  tags: _dereq_('../tagset')
};

},{"../data":3,"../fns":4,"../tagset":20,"../terms":31}],18:[function(_dereq_,module,exports){
//(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
// Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
// @spencermountain 2017 MIT
'use strict';

var data = _dereq_('../data');
var abbreviations = Object.keys(data.abbreviations);
//regs-
var abbrev_reg = new RegExp('\\b(' + abbreviations.join('|') + ')[.!?] ?$', 'i');
var acronym_reg = new RegExp('[ |\.][A-Z]\.?( *)?$', 'i');
var elipses_reg = new RegExp('\\.\\.+( +)?$');

//start with a regex:
var naiive_split = function naiive_split(text) {
  var all = [];
  //first, split by newline
  var lines = text.split(/(\n+)/);
  for (var i = 0; i < lines.length; i++) {
    //split by period, question-mark, and exclamation-mark
    var arr = lines[i].split(/(\S.+?[.!?])(?=\s+|$)/g);
    for (var o = 0; o < arr.length; o++) {
      all.push(arr[o]);
    }
  }
  return all;
};

var sentence_parser = function sentence_parser(text) {
  text = text || '';
  text = '' + text;
  var sentences = [];
  //first do a greedy-split..
  var chunks = [];
  //ensure it 'smells like' a sentence
  if (!text || typeof text !== 'string' || /\S/.test(text) === false) {
    return sentences;
  }
  //start somewhere:
  var splits = naiive_split(text);
  //filter-out the grap ones
  for (var i = 0; i < splits.length; i++) {
    var s = splits[i];
    if (s === undefined || s === '') {
      continue;
    }
    //this is meaningful whitespace
    if (/\S/.test(s) === false) {
      //add it to the last one
      if (chunks[chunks.length - 1]) {
        chunks[chunks.length - 1] += s;
        continue;
      } else if (splits[i + 1]) {
        //add it to the next one
        splits[i + 1] = s + splits[i + 1];
        continue;
      }
    }
    //else, only whitespace, no terms, no sentence
    chunks.push(s);
  }

  //detection of non-sentence chunks:
  //loop through these chunks, and join the non-sentence chunks back together..
  for (var _i = 0; _i < chunks.length; _i++) {
    var c = chunks[_i];
    //should this chunk be combined with the next one?
    if (chunks[_i + 1] !== undefined && (abbrev_reg.test(c) || acronym_reg.test(c) || elipses_reg.test(c))) {
      chunks[_i + 1] = c + (chunks[_i + 1] || '');
    } else if (c && c.length > 0) {
      //this chunk is a proper sentence..
      sentences.push(c);
      chunks[_i] = '';
    }
  }
  //if we never got a sentence, return the given text
  if (sentences.length === 0) {
    return [text];
  }
  return sentences;
};

module.exports = sentence_parser;
// console.log(sentence_parser('john f. kennedy'));

},{"../data":3}],19:[function(_dereq_,module,exports){
'use strict';
//

var tagger = function tagger(ts) {

  return ts;
};
module.exports = tagger;

},{}],20:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  Substantiv: { //noun
    enemy: ['Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Präposition']
  },
  Männlich: { //masculine noun
    downward: ['substantiv']
  },
  Feminin: { //feminine noun
    downward: ['substantiv']
  },
  Sächlich: { //neuter noun
    downward: ['substantiv']
  },
  Pronomen: { //pronoun
    downward: ['substantiv']
  },

  Verb: { //verb
    enemy: ['Substantiv', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort', 'Präposition']
  },
  Adjektiv: { //adjective
    enemy: ['Substantiv', 'Verb', 'Adverb', 'Artikel', 'Bindewort', 'Präposition']
  },
  Adverb: { //adverb
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Artikel', 'Bindewort', 'Präposition']
  },
  Artikel: { //article
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Bindewort', 'Präposition']
  },
  Bindewort: { //conjunction
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Präposition']
  },
  Präposition: { //preposition
    enemy: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb', 'Artikel', 'Bindewort']
  },
  Url: {}
};

},{}],21:[function(_dereq_,module,exports){
'use strict';

var fns = _dereq_('./paths').fns;
var build_whitespace = _dereq_('./whitespace');
var makeUID = _dereq_('./makeUID');
//normalization
var normalize = _dereq_('./normalize');

var Term = function Term(str) {
  this._text = fns.ensureString(str);
  this.tags = {};
  //seperate whitespace from the text
  var parsed = build_whitespace(this._text);
  this.whitespace = parsed.whitespace;
  this._text = parsed.text;
  this.parent = null;
  this.silent_term = '';
  this.lumped = false;
  //normalize the _text
  this.normal = normalize(this._text);
  //has this term been modified
  this.dirty = false;
  //make a unique id for this term
  this.uid = makeUID(this.normal);

  //getters/setters
  Object.defineProperty(this, 'text', {
    get: function get() {
      return this._text;
    },
    set: function set(txt) {
      txt = txt || '';
      this._text = txt.trim();
      this.dirty = true;
      if (this._text !== txt) {
        this.whitespace = build_whitespace(txt);
      }
      this.normalize();
    }
  });
  //bit faster than .constructor.name or w/e
  Object.defineProperty(this, 'isA', {
    get: function get() {
      return 'Term';
    }
  });
};

_dereq_('./methods/out')(Term);
module.exports = Term;

},{"./makeUID":22,"./methods/out":24,"./normalize":26,"./paths":27,"./whitespace":28}],22:[function(_dereq_,module,exports){
'use strict';
//this is a not-well-thought-out way to reduce our dependence on `object===object` reference stuff
//generates a unique id for this term
//may need to change when the term really-transforms? not sure.

var uid = function uid(str) {
  var nums = '';
  for (var i = 0; i < 5; i++) {
    nums += parseInt(Math.random() * 9, 10);
  }
  return str + '-' + nums;
};
module.exports = uid;

},{}],23:[function(_dereq_,module,exports){
'use strict';

var fns = _dereq_('../../paths').fns;
var colors = {
  'Person': '#6393b9',
  'Pronoun': '#81acce',
  'Noun': 'steelblue',
  'Verb': 'palevioletred',
  'Adverb': '#f39c73',
  'Adjective': '#b3d3c6',
  'Determiner': '#d3c0b3',
  'Preposition': '#9794a8',
  'Conjunction': '#c8c9cf',
  'Value': 'palegoldenrod',
  'Expression': '#b3d3c6'
};

//a nicer logger for the client-side
var clientSide = function clientSide(t) {
  var color = 'silver';
  var tags = Object.keys(t.tags);
  for (var i = 0; i < tags.length; i++) {
    if (colors[tags[i]]) {
      color = colors[tags[i]];
      break;
    }
  }
  var word = fns.leftPad(t.text, 12);
  word += ' ' + tags;
  console.log('%c ' + word, 'color: ' + color);
};
module.exports = clientSide;

},{"../../paths":27}],24:[function(_dereq_,module,exports){
'use strict';

var renderHtml = _dereq_('./renderHtml');
var fns = _dereq_('../../paths').fns;
var clientDebug = _dereq_('./client');

var serverDebug = function serverDebug(t) {
  var tags = Object.keys(t.tags).map(function (tag) {
    return fns.printTag(tag);
  }).join(', ');
  var word = t.text;
  word = '\'' + fns.yellow(word || '-') + '\'';
  var silent = '';
  if (t.silent_term) {
    silent = '[' + t.silent_term + ']';
  }
  word = fns.leftPad(word, 25);
  word += fns.leftPad(silent, 5);
  console.log('   ' + word + '   ' + '     - ' + tags);
};

var methods = {
  /** a pixel-perfect reproduction of the input, with whitespace preserved */
  text: function text(r) {
    return r.whitespace.before + r._text + r.whitespace.after;
  },
  /** a lowercased, punctuation-cleaned, whitespace-trimmed version of the word */
  normal: function normal(r) {
    return r.normal;
  },
  /** even-more normalized than normal */
  root: function root(r) {
    return r.root || r.normal;
  },
  /** the &encoded term in a span element, with POS as classNames */
  html: function html(r) {
    return renderHtml(r);
  },
  /** a simplified response for Part-of-Speech tagging*/
  tags: function tags(r) {
    return {
      text: r.text,
      normal: r.normal,
      tags: Object.keys(r.tags)
    };
  },
  /** check-print information for the console */
  debug: function debug(t) {
    if (typeof window !== 'undefined') {
      clientDebug(t);
    } else {
      serverDebug(t);
    }
  }
};

var addMethods = function addMethods(Term) {
  //hook them into result.proto
  Term.prototype.out = function (fn) {
    if (!methods[fn]) {
      fn = 'text';
    }
    return methods[fn](this);
  };
  return Term;
};

module.exports = addMethods;

},{"../../paths":27,"./client":23,"./renderHtml":25}],25:[function(_dereq_,module,exports){
'use strict';
//turn xml special characters into apersand-encoding.
//i'm not sure this is perfectly safe.

var escapeHtml = function escapeHtml(s) {
  var HTML_CHAR_MAP = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    '\'': '&#39;',
    ' ': '&nbsp;'
  };
  return s.replace(/[<>&"' ]/g, function (ch) {
    return HTML_CHAR_MAP[ch];
  });
};

//remove html elements already in the text
//not tested!
//http://stackoverflow.com/questions/295566/sanitize-rewrite-html-on-the-client-side
var sanitize = function sanitize(html) {
  var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
  var tagOrComment = new RegExp('<(?:'
  // Comment body.
  + '!--(?:(?:-*[^->])*--+|-?)'
  // Special "raw text" elements whose content should be elided.
  + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*' + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
  // Regular name
  + '|/?[a-z]' + tagBody + ')>', 'gi');
  var oldHtml = void 0;
  do {
    oldHtml = html;
    html = html.replace(tagOrComment, '');
  } while (html !== oldHtml);
  return html.replace(/</g, '&lt;');
};

//turn the term into ~properly~ formatted html
var renderHtml = function renderHtml(t) {
  var classes = Object.keys(t.tags).filter(function (tag) {
    return tag !== 'Term';
  });
  classes = classes.map(function (c) {
    return 'nl-' + c;
  });
  classes = classes.join(' ');
  var text = sanitize(t.text);
  text = escapeHtml(text);
  var el = '<span class="' + classes + '">' + text + '</span>';
  return escapeHtml(t.whitespace.before) + el + escapeHtml(t.whitespace.after);
};

module.exports = renderHtml;

},{}],26:[function(_dereq_,module,exports){
'use strict';
//

var normalize = function normalize(str) {
  return str;
};
module.exports = normalize;

},{}],27:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  fns: _dereq_('../fns'),
  log: _dereq_('../log'),
  tags: _dereq_('../tagset')
};

},{"../fns":4,"../log":7,"../tagset":20}],28:[function(_dereq_,module,exports){
'use strict';
//punctuation regs-

var before = /^(\s|-+|\.\.+)+/;
var minusNumber = /^( *)-(\$|€|¥|£)?([0-9])/;
var after = /(\s+|-+|\.\.+)$/;

//seperate the 'meat' from the trailing/leading whitespace.
//works in concert with ./src/result/tokenize.js
var build_whitespace = function build_whitespace(str) {
  var whitespace = {
    before: '',
    after: ''
  };
  //get before punctuation/whitespace
  //mangle 'far - fetched', but don't mangle '-2'
  var m = str.match(minusNumber);
  if (m !== null) {
    whitespace.before = m[1];
    str = str.replace(/^ */, '');
  } else {
    m = str.match(before);
    if (m !== null) {
      whitespace.before = str.match(before)[0];
      str = str.replace(before, '');
    }
  }
  //get after punctuation/whitespace
  m = str.match(after);
  if (m !== null) {
    str = str.replace(after, '');
    whitespace.after = m[0];
  }
  return {
    whitespace: whitespace,
    text: str
  };
};
module.exports = build_whitespace;

},{}],29:[function(_dereq_,module,exports){
'use strict';

var Term = _dereq_('../term');
var hasHyphen = /^([a-z]+)(-)([a-z0-9].*)/i;
var wordlike = /\S/;

var notWord = {
  '-': true,
  '–': true,
  '--': true,
  '...': true
};

//turn a string into an array of terms (naiive for now, lumped later)
var fromString = function fromString(str) {
  var result = [];
  var arr = [];
  //start with a naiive split
  str = str || '';
  if (typeof str === 'number') {
    str = '' + str;
  }
  var firstSplit = str.split(/(\S+)/);
  for (var i = 0; i < firstSplit.length; i++) {
    var word = firstSplit[i];
    if (hasHyphen.test(word) === true) {
      //support multiple-hyphenated-terms
      var hyphens = word.split('-');
      for (var o = 0; o < hyphens.length; o++) {
        if (o === hyphens.length - 1) {
          arr.push(hyphens[o]);
        } else {
          arr.push(hyphens[o] + '-');
        }
      }
    } else {
      arr.push(word);
    }
  }
  //greedy merge whitespace+arr to the right
  var carry = '';
  for (var _i = 0; _i < arr.length; _i++) {
    //if it's more than a whitespace
    if (wordlike.test(arr[_i]) === true && notWord[arr[_i]] === undefined) {
      result.push(carry + arr[_i]);
      carry = '';
    } else {
      carry += arr[_i];
    }
  }
  //handle last one
  if (carry && result.length > 0) {
    result[result.length - 1] += carry; //put it on the end
  }
  return result.map(function (t) {
    return new Term(t);
  });
};
module.exports = fromString;

},{"../term":21}],30:[function(_dereq_,module,exports){
'use strict';

//getters/setters for the Terms class

module.exports = {

  parent: {
    get: function get() {
      return this.refText || this;
    },
    set: function set(r) {
      this.refText = r;
      return this;
    }
  },

  parentTerms: {
    get: function get() {
      return this.refTerms || this;
    },
    set: function set(r) {
      this.refTerms = r;
      return this;
    }
  },

  dirty: {
    get: function get() {
      for (var i = 0; i < this.terms.length; i++) {
        if (this.terms[i].dirty === true) {
          return true;
        }
      }
      return false;
    },
    set: function set(dirt) {
      this.terms.forEach(function (t) {
        t.dirty = dirt;
      });
    }
  },

  refTerms: {
    get: function get() {
      return this._refTerms || this;
    },
    set: function set(ts) {
      this._refTerms = ts;
      return this;
    }
  },
  found: {
    get: function get() {
      return this.terms.length > 0;
    }
  },
  length: {
    get: function get() {
      return this.terms.length;
    }
  },
  isA: {
    get: function get() {
      return 'Terms';
    }
  },
  whitespace: {
    get: function get() {
      var _this = this;

      return {
        before: function before(str) {
          _this.firstTerm().whitespace.before = str;
          return _this;
        },
        after: function after(str) {
          _this.lastTerm().whitespace.after = str;
          return _this;
        }
      };
    }
  }

};

},{}],31:[function(_dereq_,module,exports){
'use strict';

var build = _dereq_('./build');
var getters = _dereq_('./getters');
var tagger = _dereq_('../tagger');

//Terms is an array of Term objects, and methods that wrap around them
var Terms = function Terms(arr, lexicon, refText, refTerms) {
  var _this = this;

  this.terms = arr;
  this.lexicon = lexicon;
  this.refText = refText;
  this._refTerms = refTerms;
  this.count = undefined;
  this.get = function (n) {
    return _this.terms[n];
  };
  //apply getters
  var keys = Object.keys(getters);
  for (var i = 0; i < keys.length; i++) {
    Object.defineProperty(this, keys[i], getters[keys[i]]);
  }
};

Terms.prototype.tagger = function () {
  return tagger(this);
};

_dereq_('./methods/out')(Terms);

Terms.fromString = function (str, lexicon) {
  var termArr = build(str);
  var ts = new Terms(termArr, lexicon, null);
  //give each term a reference to this ts
  ts.terms.forEach(function (t) {
    t.parentTerms = ts;
  });
  return ts;
};
module.exports = Terms;

},{"../tagger":19,"./build":29,"./getters":30,"./methods/out":32}],32:[function(_dereq_,module,exports){
'use strict';

var fns = _dereq_('../paths').fns;

var methods = {
  text: function text(ts) {
    return ts.terms.reduce(function (str, t) {
      str += t.out('text');
      return str;
    }, '');
  },

  normal: function normal(ts) {
    var terms = ts.terms.filter(function (t) {
      return t.text;
    });
    terms = terms.map(function (t) {
      return t.normal; //+ punct;
    });
    return terms.join(' ');
  },

  grid: function grid(ts) {
    var str = '  ';
    str += ts.terms.reduce(function (s, t) {
      s += fns.leftPad(t.text, 11);
      return s;
    }, '');
    return str + '\n\n';
  },

  color: function color(ts) {
    return ts.terms.reduce(function (s, t) {
      s += fns.printTerm(t);
      return s;
    }, '');
  },
  csv: function csv(ts) {
    return ts.terms.map(function (t) {
      return t.normal.replace(/,/g, '');
    }).join(',');
  },

  newlines: function newlines(ts) {
    return ts.terms.reduce(function (str, t) {
      str += t.out('text').replace(/\n/g, ' ');
      return str;
    }, '').replace(/^\s/, '');
  },
  /** no punctuation, fancy business **/
  root: function root(ts) {
    return ts.terms.filter(function (t) {
      return t.text;
    }).map(function (t) {
      return t.root;
    }).join(' ').toLowerCase();
  },

  html: function html(ts) {
    return ts.terms.map(function (t) {
      return t.render.html();
    }).join(' ');
  },
  debug: function debug(ts) {
    ts.terms.forEach(function (t) {
      t.out('debug');
    });
  }
};
methods.plaintext = methods.text;
methods.normalize = methods.normal;
methods.normalized = methods.normal;
methods.colors = methods.color;
methods.tags = methods.terms;

var renderMethods = function renderMethods(Terms) {
  Terms.prototype.out = function (str) {
    if (methods[str]) {
      return methods[str](this);
    }
    return methods.text(this);
  };
  //check method
  Terms.prototype.debug = function () {
    return methods.debug(this);
  };
  return Terms;
};

module.exports = renderMethods;

},{"../paths":33}],33:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  data: _dereq_('../data'),
  lexicon: _dereq_('../data'),
  fns: _dereq_('../fns'),
  Term: _dereq_('../term')
};

},{"../data":3,"../fns":4,"../term":21}]},{},[5])(5)
});