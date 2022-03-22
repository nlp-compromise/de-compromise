(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.deCompromise = factory());
})(this, (function () { 'use strict';

  let methods$l = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  let model$5 = {
    one: {},
    two: {},
    three: {},
  };
  let compute$9 = {};
  let hooks = [];

  var tmpWrld = { methods: methods$l, model: model$5, compute: compute$9, hooks };

  const isArray$7 = input => Object.prototype.toString.call(input) === '[object Array]';

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && compute.hasOwnProperty(input)) {
        compute[input](this);
      }
      // allow a list of methods
      else if (isArray$7(input)) {
        input.forEach(name => world.compute.hasOwnProperty(name) && compute[name](this));
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };
  var compute$8 = fns$4;

  const forEach = function (cb) {
    let ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      let view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    let ptrs = this.fullPointer;
    let res = ptrs.map((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    if (res.length === 0) {
      return empty || this.update([])
    }
    // return an array of values, or View objects?
    // user can return either from their callback
    if (res[0] !== undefined) {
      // array of strings
      if (typeof res[0] === 'string') {
        return res
      }
      // array of objects
      if (typeof res[0] === 'object' && (res[0] === null || !res[0].isView)) {
        return res
      }
    }
    // return a View object
    let all = [];
    res.forEach(ptr => {
      all = all.concat(ptr.fullPointer);
    });
    return this.toView(all)
  };

  const filter = function (cb) {
    let ptrs = this.fullPointer;
    ptrs = ptrs.filter((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update(ptrs)
  };

  const find = function (cb) {
    let ptrs = this.fullPointer;
    let found = ptrs.find((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    let ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    })
  };

  const random = function (n = 1) {
    let ptrs = this.fullPointer;
    let r = Math.floor(Math.random() * ptrs.length);
    //prevent it from going over the end
    if (r + n > this.length) {
      r = this.length - n;
      r = r < 0 ? 0 : r;
    }
    ptrs = ptrs.slice(r, r + n);
    return this.update(ptrs)
  };
  var loops = { forEach, map, filter, find, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** */
    terms: function (n) {
      let m = this.match('.').toView(); //make this faster
      return typeof n === 'number' ? m.eq(n) : m
    },

    /** */
    groups: function (group) {
      if (group || group === 0) {
        return this.update(this._groups[group] || [])
      }
      // return an object of Views
      let res = {};
      Object.keys(this._groups).forEach(k => {
        res[k] = this.update(this._groups[k]);
      });
      // this._groups = null
      return res
    },
    /** */
    eq: function (n) {
      let ptr = this.pointer;
      if (!ptr) {
        ptr = this.docs.map((_doc, i) => [i]);
      }
      if (ptr[n]) {
        return this.update([ptr[n]])
      }
      return this.none()
    },
    /** */
    first: function () {
      return this.eq(0)
    },
    /** */
    last: function () {
      let n = this.fullPointer.length - 1;
      return this.eq(n)
    },

    /** grab term[0] for every match */
    firstTerms: function () {
      return this.match('^.')
    },

    /** grab the last term for every match  */
    lastTerms: function () {
      return this.match('.$')
    },

    /** */
    slice: function (min, max) {
      let pntrs = this.pointer || this.docs.map((_o, n) => [n]);
      pntrs = pntrs.slice(min, max);
      return this.update(pntrs)
    },

    /** return a view of the entire document */
    all: function () {
      return this.update().toView()
    },
    /**  */
    fullSentences: function () {
      let ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
      return this.update(ptrs).toView()
    },
    /** return a view of no parts of the document */
    none: function () {
      return this.update([])
    },

    /** are these two views looking at the same words? */
    isDoc: function (b) {
      if (!b || !b.isView) {
        return false
      }
      let aPtr = this.fullPointer;
      let bPtr = b.fullPointer;
      if (!aPtr.length === bPtr.length) {
        return false
      }
      // ensure pointers are the same
      return aPtr.every((ptr, i) => {
        if (!bPtr[i]) {
          return false
        }
        // ensure [n, start, end] are all the same
        return ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2]
      })
    },

    /** how many seperate terms does the document have? */
    wordCount: function () {
      return this.docs.reduce((count, terms) => {
        count += terms.filter(t => t.text !== '').length;
        return count
      }, 0)
    },

  };
  utils.group = utils.groups;
  utils.fullSentence = utils.fullSentences;
  utils.sentence = utils.fullSentences;
  utils.lastTerm = utils.lastTerms;
  utils.firstTerm = utils.firstTerms;
  var util = utils;

  const methods$k = Object.assign({}, util, compute$8, loops);

  // aliases
  methods$k.get = methods$k.eq;
  var api$9 = methods$k;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View']
      ].forEach(a => {
        Object.defineProperty(this, a[0], {
          value: a[1],
          writable: true,
        });
      });
      this.ptrs = pointer;
    }
    /* getters:  */
    get docs() {
      let docs = this.document;
      if (this.ptrs) {
        docs = tmpWrld.methods.one.getDoc(this.ptrs, this.document);
      }
      return docs
    }
    get pointer() {
      return this.ptrs
    }
    get methods() {
      return this.world.methods
    }
    get model() {
      return this.world.model
    }
    get hooks() {
      return this.world.hooks
    }
    get isView() {
      return true //this comes in handy sometimes
    }
    // is the view not-empty?
    get found() {
      return this.docs.length > 0
    }
    // how many matches we have
    get length() {
      return this.docs.length
    }
    // return a more-hackable pointer
    get fullPointer() {
      let { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      let pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        let [n, start, end, id, endId] = a;
        start = start || 0;
        end = end || (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n] && document[n][start]) {
          id = id || document[n][start].id;
          if (document[n][end - 1]) {
            endId = endId || document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      let m = new View(this.document, pointer);
      // send the cache down, too?
      if (m._cache && pointer && pointer.length > 1) {
        // only if it's full
        let cache = [];
        pointer.forEach(ptr => {
          if (ptr.length === 1) {
            cache.push(m._cache[ptr[0]]);
          }
        });
        m._cache = cache;
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      if (pointer === undefined) {
        pointer = this.pointer;
      }
      let m = new View(this.document, pointer);
      // m._cache = this._cache // share this full thing
      return m
    }
    fromText(input) {
      const { methods } = this;
      //assume ./01-tokenize is installed
      let document = methods.one.tokenize.fromString(input, this.world);
      let doc = new View(document);
      doc.world = this.world;
      // doc.compute(world.hooks)
      doc.compute(['normal', 'lexicon', 'preTagger']);
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0);
      document = document.map(terms => {
        return terms.map(term => {
          term = Object.assign({}, term);
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      let m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, api$9);
  var View$1 = View;

  var version = '13.11.4-rc7';

  const isObject$5 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$5(plugin)) {
      for (const key in plugin) {
        if (isObject$5(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
          // } else if (isArray(plugin[key])) {
          // console.log(key)
          // console.log(model)
        } else {
          Object.assign(model, { [key]: plugin[key] });
        }
      }
    }
    return model
  }
  // const merged = mergeDeep({ a: 1 }, { b: { c: { d: { e: 12345 } } } })
  // console.dir(merged, { depth: 5 })

  // vroom
  function mergeQuick(model, plugin) {
    for (const key in plugin) {
      model[key] = model[key] || {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const extend = function (plugin, world, View, nlp) {
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    // shallow-merge compute
    if (plugin.compute) {
      Object.assign(compute, plugin.compute);
    }
    // append new hooks
    if (hooks) {
      world.hooks = hooks.concat(plugin.hooks || []);
    }
    // assign new class methods
    if (plugin.api) {
      plugin.api(View);
    }
    if (plugin.lib) {
      Object.keys(plugin.lib).forEach(k => nlp[k] = plugin.lib[k]);
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.mutate) {
      plugin.mutate(world);
    }
  };
  var extend$1 = extend;

  /** log the decision-making to console */
  const verbose = function (set) {
    let env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const isArray$6 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (isArray$6(term.tags)) {
          term.tags = new Set(term.tags);
        }
        return term
      })
    })
  };

  // interpret an array-of-arrays
  const preTokenized = function (arr) {
    return arr.map((a) => {
      return a.map(str => {
        return {
          text: str,
          normal: str,//cleanup
          pre: '',
          post: ' ',
          tags: new Set()
        }
      })
    })
  };

  const inputs = function (input, View, world) {
    const { methods } = world;
    let doc = new View([]);
    doc.world = world;
    // support a number
    if (typeof input === 'number') {
      input = String(input);
    }
    // return empty doc
    if (!input) {
      return doc
    }
    // parse a string
    if (typeof input === 'string') {
      let document = methods.one.tokenize.fromString(input, world);
      return new View(document)
    }
    // handle compromise View
    if (isObject$4(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (isArray$6(input)) {
      // pre-tokenized array-of-arrays 
      if (isArray$6(input[0])) {
        let document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      let document = fromJson(input);
      return new View(document)
    }
    return doc
  };
  var handleInputs = inputs;

  let world = Object.assign({}, tmpWrld);

  const nlp = function (input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    let doc = handleInputs(input, View$1, world);
    doc.compute(world.hooks);
    return doc
  };
  Object.defineProperty(nlp, '_world', {
    value: world,
    writable: true,
  });

  /** don't run the POS-tagger */
  nlp.tokenize = function (input, lex) {
    const { compute } = this._world;
    // add user-given words to lexicon
    if (lex) {
      nlp.addWords(lex);
    }
    // run the tokenizer
    let doc = handleInputs(input, View$1, world);
    // give contractions a shot, at least
    if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };


  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend$1(plugin, this._world, View$1, this);
    return this
  };
  nlp.extend = nlp.plugin;


  /** reach-into compromise internals */
  nlp.world = function () {
    return this._world
  };
  nlp.model = function () {
    return this._world.model
  };
  nlp.methods = function () {
    return this._world.methods
  };
  nlp.hooks = function () {
    return this._world.hooks
  };

  /** log the decision-making to console */
  nlp.verbose = verbose;
  /** current library release version */
  nlp.version = version;

  var nlp$1 = nlp;

  var caseFns = {
    /** */
    toLowerCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toLowerCase();
      });
      return this
    },
    /** */
    toUpperCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toUpperCase();
      });
      return this
    },
    /** */
    toTitleCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
      });
      return this
    },
    /** */
    toCamelCase: function () {
      this.docs.forEach(terms => {
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
          }
          if (i !== terms.length - 1) {
            t.post = '';
          }
        });
      });
      return this
    },
  };

  // punctuation we wanna transfer

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      let args = [index, 0].concat(child);
      Array.prototype.splice.apply(parent, args);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    let lastTerm = terms[terms.length - 1];
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)–—'"]/g;
    let wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    let post = wasLast.post;
    if (juicy.test(post)) {
      let punct = post.match(juicy).join(''); //not perfect
      let last = needle[needle.length - 1];
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };

  const isTitleCase$2 = function (str) {
    return /^[A-Z][a-z'\u00C0-\u00FF]/.test(str) || /^[A-Z]$/.test(str)
  };

  const toTitleCase = function (str) {
    str = str.replace(/^[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //TODO: support unicode
    return str
  };

  const moveTitleCase = function (home, start, needle) {
    let from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$2(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase(needle[0].text);
    // should we un-titlecase the old word?
    let old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$2(old.text) && old.text.length > 1) {
      old.text = old.text.replace(/^[A-Z]/, x => x.toLowerCase());
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    let [n, start, end] = ptr;
    // introduce spaces appropriately
    if (start === 0) {
      // at start - need space in insert
      endSpace(needle);
    } else if (end === document[n].length) {
      // at end - need space in home
      endSpace(needle);
    } else {
      // in middle - need space in home and insert
      endSpace(needle);
      endSpace([home[ptr[1]]]);
    }
    moveTitleCase(home, start, needle);
    // movePunct(home, end, needle)
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document) {
    let [n, , end] = ptr;
    let total = (document[n] || []).length;
    if (end < total) {
      // are we in the middle?
      // add trailing space on self
      movePunct(home, end, needle);
      endSpace(needle);
    } else if (total === end) {
      // are we at the end?
      // add a space to predecessor
      endSpace(home);
      // very end, move period
      movePunct(home, end, needle);
      // is there another sentence after?
      if (document[n + 1]) {
        needle[needle.length - 1].post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle[needle.length - 1].id;
  };

  /*
  unique & ordered term ids, based on time & term index

  Base 36 (numbers+ascii)
    3 digit 4,600
    2 digit 1,200
    1 digit 36

    TTT|NNN|II|R

  TTT -> 46 seconds since load
  NNN -> 46 thousand sentences (>1 inf-jest)
  II  -> 1,200 words in a sentence (nuts)
  R   -> 1-36 random number 

  novels: 
    avg 80,000 words
      15 words per sentence
    5,000 sentences

  Infinite Jest:
    36,247 sentences
    https://en.wikipedia.org/wiki/List_of_longest_novels

  collisions are more-likely after
      46 seconds have passed,
    and 
      after 46-thousand sentences

  */
  const start$1 = new Date().getTime();

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    var now = new Date().getTime() - start$1;
    now = parseInt(now, 10);

    //don't overflow time
    now = now > 46655 ? 46655 : now;
    //don't overflow sentences
    n = n > 46655 ? 46655 : n;
    // //don't overflow terms
    i = i > 1294 ? 1294 : i;

    // 3 digits for time
    let id = pad3(now.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    let r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  var uuid = toId;

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$2 = function (m) {
    if (m.has('@hasContraction')) {//&& m.after('^.').has('@hasContraction')
      let more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$5 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  const addIds$2 = function (terms) {
    terms.forEach((term) => {
      term.id = uuid(term);
    });
    return terms
  };

  const getTerms = function (input, world) {
    const { methods } = world;
    // create our terms from a string
    if (typeof input === 'string') {
      return methods.one.tokenize.fromString(input, world)[0] //assume one sentence
    }
    //allow a view object
    if (typeof input === 'object' && input.isView) {
      return input.docs[0] //assume one sentence
    }
    //allow an array of terms, too
    if (isArray$5(input)) {
      return isArray$5(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    // insert words at end of each doc
    let ptrs = view.fullPointer;
    let selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      let ptr = m.fullPointer[0];
      let [n] = ptr;
      // add-in the words
      let home = document[n];
      let terms = getTerms(input, world);
      terms = addIds$2(terms);
      if (prepend) {
        expand$2(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$2(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document);
      }
      // harden the pointer
      if (document[n] && document[n][ptr[1]]) {
        ptr[3] = document[n][ptr[1]].id;
      }
      // change self backwards by len
      selfPtrs[i] = ptr;
      // extend the pointer
      ptr[2] += terms.length;
      ptrs[i] = ptr;
    });
    let doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['index', 'lexicon', 'preTagger']);
    return doc
  };

  const fns$3 = {
    insertAfter: function (input) {
      return insert(input, this, false)
    },
    insertBefore: function (input) {
      return insert(input, this, true)
    },

  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  var insert$1 = fns$3;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  const titleCase$2 = function (str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
  };

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn) {
    main.forEach(m => {
      let out = fn(m);
      m.replaceWith(out);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    let groups = main.groups();
    input = input.replace(dollarStub, (a) => {
      let num = a.replace(/\$/, '');
      if (groups.hasOwnProperty(num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$2.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    let main = this;
    if (typeof input === 'function') {
      return replaceByFn(main, input)
    }
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    let original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    // slide this in
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      let more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.
    // what should we return?
    let m = main.toView(ptrs).compute(['index', 'lexicon', 'preTagger']);
    // replace any old tags
    if (keep.tags) {
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }
    // try to co-erce case, too
    if (keep.case && m.docs[0] && m.docs[0][0] && m.docs[0][0].index[1] === 0) {
      m.docs[0][0].text = titleCase$2(m.docs[0][0].text);
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    let m = this.match(match);
    if (!m.found) {
      return this
    }
    return m.replaceWith(input, keep)
  };
  var replace = fns$2;

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    let last = terms.length - 1;
    let from = terms[last];
    let to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = to.post.replace(/ +([.?!,;:])/, '$1');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = to.post.replace(/[,;:]+([.?!])/, '$1');
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots) {
    nots.forEach(ptr => {
      let [n, start, end] = ptr;
      let len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (end === document[n].length && end > 1) {
        repairPunct(document[n], len);
      }
      document[n].splice(start, len); // replaces len terms at index start
    });
    // remove any now-empty sentences
    // (foreach + splice = 'mutable filter')
    for (let i = document.length - 1; i >= 0; i -= 1) {
      if (document[i].length === 0) {
        document.splice(i, 1);
        // remove any trailing whitespace before our removed sentence
        if (i === document.length && document[i - 1]) {
          let terms = document[i - 1];
          let lastTerm = terms[terms.length - 1];
          if (lastTerm) {
            lastTerm.post = lastTerm.post.trimEnd();
          }
        }
        // repair any downstream indexes
        // for (let k = i; k < document.length; k += 1) {
        //   document[k].forEach(term => term.index[0] -= 1)
        // }
      }
    }
    return document
  };


  const methods$j = {
    /** */
    remove: function (reg) {
      const { indexN } = this.methods.one.pointer;
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a part, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      // is it part of a contraction?
      if (self.has('@hasContraction') && self.contractions) {
        let more = self.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      let nots = not.fullPointer.reverse();
      // remove them from the actual document)
      let document = pluckOut(this.document, nots);
      // repair our pointers
      let gone = indexN(nots);
      ptrs = ptrs.map(ptr => {
        let [n] = ptr;
        if (!gone[n]) {
          return ptr
        }
        gone[n].forEach(no => {
          let len = no[2] - no[1];
          // does it effect our pointer?
          if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
            ptr[2] -= len;
          }
        });
        return ptr
      });

      // remove any now-empty pointers
      ptrs = ptrs.filter((ptr, i) => {
        const len = ptr[2] - ptr[1];
        if (len <= 0) {
          // adjust downstream pointers
          for (let x = i + 1; x < ptrs.length; x += 1) {
            ptrs.filter(a => a[0] === x).forEach(a => {
              a[0] -= 1;
            });
          }
          return false
        }
        return true
      });
      // remove old hard-pointers
      ptrs = ptrs.map((ptr) => {
        ptr[3] = null;
        ptr[4] = null;
        return ptr
      });
      // mutate original
      self.ptrs = ptrs;
      self.document = document;
      self.compute('index');
      if (reg) {
        return self.toView(ptrs) //return new document
      }
      return self.none()
    },
  };
  // aliases
  methods$j.delete = methods$j.remove;
  var remove = methods$j;

  const methods$i = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        let term = terms[0];
        if (concat === true) {
          term.pre += str;
        } else {
          term.pre = str;
        }
      });
      return this
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        let last = this.docs[this.docs.length - 1];
        return last[last.length - 1].post
      }
      this.docs.forEach(terms => {
        let term = terms[terms.length - 1];
        if (concat === true) {
          term.post += str;
        } else {
          term.post = str;
        }
      });
      return this
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      let docs = this.docs;
      let start = docs[0][0];
      start.pre = start.pre.trimStart();
      let last = docs[docs.length - 1];
      let end = last[last.length - 1];
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.pre = '';
          }
          if (terms[i + 1]) {
            t.post = '-';
          }
        });
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach(t => {
          if (hasHyphen.test(t.post)) {
            t.post = ' ';
          }
        });
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      start = start || `"`;
      end = end || `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        let last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start = start || `(`;
      end = end || `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        let last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },
  };
  methods$i.deHyphenate = methods$i.dehyphenate;
  methods$i.toQuotation = methods$i.toQuotations;

  var whitespace$1 = methods$i;

  /** alphabetical order */
  const alpha = (a, b) => {
    if (a.normal < b.normal) {
      return -1
    }
    if (a.normal > b.normal) {
      return 1
    }
    return 0
  };

  /** count the # of characters of each match */
  const length = (a, b) => {
    let left = a.normal.trim().length;
    let right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$2 = (a, b) => {
    if (a.words < b.words) {
      return 1
    }
    if (a.words > b.words) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const sequential = (a, b) => {
    if (a[0] < b[0]) {
      return 1
    }
    if (a[0] > b[0]) {
      return -1
    }
    return a[1] > b[1] ? 1 : -1
  };

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    let counts = {};
    arr.forEach(o => {
      counts[o.normal] = counts[o.normal] || 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      let left = counts[a.normal];
      let right = counts[b.normal];
      if (left < right) {
        return 1
      }
      if (left > right) {
        return -1
      }
      return 0
    });
    return arr
  };

  var methods$h = { alpha, length, wordCount: wordCount$2, sequential, byFreq };

  // aliases
  const seqNames = new Set(['index', 'sequence', 'seq', 'sequential', 'chron', 'chronological']);
  const freqNames = new Set(['freq', 'frequency', 'topk', 'repeats']);
  const alphaNames = new Set(['alpha', 'alphabetical']);

  // support function as parameter
  const customSort = function (view, fn) {
    let ptrs = view.fullPointer;
    ptrs = ptrs.sort((a, b) => {
      a = view.update([a]);
      b = view.update([b]);
      return fn(a, b)
    });
    view.ptrs = ptrs; //mutate original
    return view
  };

  /** re-arrange the order of the matches (in place) */
  const sort = function (input) {
    let { docs, pointer } = this;
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input = input || 'alpha';
    let ptrs = pointer || docs.map((_d, n) => [n]);
    let arr = docs.map((terms, n) => {
      return {
        index: n,
        words: terms.length,
        normal: terms.map(t => t.machine || t.normal || '').join(' '),
        pointer: ptrs[n],
      }
    });
    // 'chronological' sorting
    if (seqNames.has(input)) {
      input = 'sequential';
    }
    // alphabetical sorting
    if (alphaNames.has(input)) {
      input = 'alpha';
    }
    // sort by frequency
    if (freqNames.has(input)) {
      arr = methods$h.byFreq(arr);
      return this.update(arr.map(o => o.pointer))
    }
    // apply sort method on each phrase
    if (typeof methods$h[input] === 'function') {
      arr = arr.sort(methods$h[input]);
      return this.update(arr.map(o => o.pointer))
    }
    return this
  };

  /** reverse the order of the matches, but not the words or index */
  const reverse$2 = function () {
    let ptrs = this.pointer || this.docs.map((_d, n) => [n]);
    ptrs = [].concat(ptrs);
    ptrs = ptrs.reverse();
    return this.update(ptrs)
  };

  /** remove any duplicate matches */
  const unique = function () {
    let already = new Set();
    let res = this.filter(m => {
      let txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$2, sort };

  const isArray$4 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    // add a space
    let end = homeDocs[homeDocs.length - 1];
    let last = end[end.length - 1];
    if (/ /.test(last.post) === false) {
      last.post += ' ';
    }
    homeDocs = homeDocs.concat(inputDocs);
    return homeDocs
  };

  const combineViews = function (home, input) {
    // is it a view from the same document?
    if (home.document === input.document) {
      let ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    let ptrs = input.fullPointer;
    ptrs.forEach(a => {
      a[0] += home.document.length;
    });
    home.document = combineDocs(home.document, input.document);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      const { methods, document, world } = this;
      // parse and splice-in new terms
      if (typeof input === 'string') {
        let json = methods.one.tokenize.fromString(input, world);
        let ptrs = this.fullPointer;
        let lastN = ptrs[ptrs.length - 1][0];
        spliceArr(document, lastN + 1, json);
        return this.compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (isArray$4(input)) {
        let docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  const methods$g = Object.assign({}, caseFns, insert$1, replace, remove, whitespace$1, sort$1, concat);

  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$g);
  };
  var api$8 = addAPI$3;

  const compute$6 = {
    id: function (view) {
      let docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          let term = docs[n][i];
          term.id = term.id || uuid(term);
        }
      }
    }
  };

  var compute$7 = compute$6;

  var change = {
    api: api$8,
    compute: compute$7,
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      let n = ptr[0];
      if (parent[n]) {
        ptr[0] = parent[n][0]; //n
        ptr[1] += parent[n][1]; //start
        ptr[2] += parent[n][1]; //end
      }
    });
    return ptrs
  };

  // make match-result relative to whole document
  const fixPointers = function (res, parent) {
    let { ptrs, byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  // did they pass-in a compromise object?
  const isView = regs => regs && typeof regs === 'object' && regs.isView === true;

  const match$2 = function (regs, group, opts) {
    const one = this.methods.one;
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs, opts);
    }
    let todo = { regs, group };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const matchOne = function (regs, group, opts) {
    const one = this.methods.one;
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs, opts);
    }
    let todo = { regs, group, justOne: true };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    let ptrs;
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs, opts);
      let todo = { regs, group, justOne: true };
      ptrs = one.match(this.docs, todo, this._cache).ptrs;
    } else if (isView(regs)) {
      ptrs = regs.fullPointer; // support a view object as input
    }
    return ptrs.length > 0
  };

  // 'if'
  const ifFn = function (regs, group, opts) {
    const one = this.methods.one;
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs, opts);
      let todo = { regs, group, justOne: true };
      let ptrs = this.fullPointer;
      ptrs = ptrs.filter(ptr => {
        let m = this.update([ptr]);
        let res = one.match(m.docs, todo, this._cache).ptrs;
        return res.length > 0
      });
      return this.update(ptrs)
    }
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found)
    }
    return this.none()
  };

  const ifNo = function (regs, group, opts) {
    const { methods } = this;
    const one = methods.one;
    // support a view object as input
    if (isView(regs)) {
      return this.difference(regs)
    }
    // otherwise parse the match string
    if (typeof regs === 'string') {
      regs = one.parseMatch(regs, opts);
    }
    return this.filter(m => {
      let todo = { regs, group, justOne: true };
      let ptrs = one.match(m.docs, todo, m._cache).ptrs;
      return ptrs.length === 0
    })

  };

  var match$3 = { matchOne, match: match$2, has, if: ifFn, ifNo };

  const before = function (regs, group) {
    const { indexN } = this.methods.one.pointer;
    let pre = [];
    let byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      let first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    let preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group)
  };

  const after = function (regs, group) {
    const { indexN } = this.methods.one.pointer;
    let post = [];
    let byN = indexN(this.fullPointer);
    let document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      let last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      let [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    let postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group)
  };

  const growLeft = function (regs, group, opts) {
    regs = this.world.methods.one.parseMatch(regs, opts);
    regs[regs.length - 1].end = true;// ensure matches are beside us ←
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.before(regs, group);
      if (more.found) {
        let terms = more.terms();
        ptrs[n][1] -= terms.length;
        ptrs[n][3] = terms.docs[0][0].id;
      }
    });
    return this.update(ptrs)
  };

  const growRight = function (regs, group, opts) {
    regs = this.world.methods.one.parseMatch(regs, opts);
    regs[0].start = true;// ensure matches are beside us →
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.after(regs, group);
      if (more.found) {
        let terms = more.terms();
        ptrs[n][2] += terms.length;
        ptrs[n][4] = null; //remove end-id
      }
    });
    return this.update(ptrs)
  };

  const grow = function (regs, group) {
    return this.growRight(regs, group).growLeft(regs, group)
  };

  var lookaround = { before, after, growLeft, growRight, grow };

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const getDoc$3 = (reg, view, group) => {
    let m = reg;
    if (typeof reg === 'string') {
      m = view.match(reg, group);
    }
    return m
  };

  const addIds$1 = function (ptr, view) {
    let [n, start] = ptr;
    if (view.document[n] && view.document[n][start]) {
      ptr[3] = ptr[3] || view.document[n][start].id;
    }
    return ptr
  };

  const methods$f = {};
  // [before], [match], [after]
  methods$f.splitOn = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      res.push(o.match);
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before], [match after]
  methods$f.splitBefore = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      if (o.match && o.after) {
        // console.log(combine(o.match, o.after))
        res.push(combine(o.match, o.after));
      } else {
        res.push(o.match);
        res.push(o.after);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$f.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      if (o.before && o.match) {
        res.push(combine(o.before, o.match));
      } else {
        res.push(o.before);
        res.push(o.match);
      }
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };
  methods$f.split = methods$f.splitAfter;

  var split$1 = methods$f;

  const methods$e = Object.assign({}, match$3, lookaround, split$1);
  // aliases
  methods$e.lookBehind = methods$e.before;
  methods$e.lookBefore = methods$e.before;

  methods$e.lookAhead = methods$e.after;
  methods$e.lookAfter = methods$e.after;

  methods$e.notIf = methods$e.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$e);
  };
  var api$7 = matchAPI;

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
  // match '(yes) but not foo(no)bar'
  const byParentheses = /([!~[^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/;
  // okay
  const byWord = / /g;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?\(/.test(str) && /\)[?\]+*$~]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt) {
    // parse by /regex/ first
    let arr = txt.split(bySlashes);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isReg(str)) {
        res.push(str);
        return
      }
      res = res.concat(str.split(byParentheses));
    });
    res = cleanUp(res);
    // split by spaces, now
    let final = [];
    res.forEach(str => {
      if (isBlock(str)) {
        final.push(str);
      } else if (isReg(str)) {
        final.push(str);
      } else {
        final = final.concat(str.split(byWord));
      }
    });
    final = cleanUp(final);
    return final
  };
  var parseBlocks$1 = parseBlocks;

  const hasMinMax = /\{([0-9]+)(, *[0-9]*)?\}/;
  const andSign = /&&/;
  const captureName = new RegExp(/^<\s*(\S+)\s*>/);
  /* break-down a match expression into this:
  {
    word:'',
    tag:'',
    regex:'',

    start:false,
    end:false,
    negative:false,
    anything:false,
    greedy:false,
    optional:false,

    named:'',
    choices:[],
  }
  */
  const titleCase$1 = str => {
    return str.charAt(0).toUpperCase() + str.substr(1)
  };
  const end = function (str) {
    return str[str.length - 1]
  };
  const start = function (str) {
    return str[0]
  };
  const stripStart = function (str) {
    return str.substr(1)
  };
  const stripEnd = function (str) {
    return str.substr(0, str.length - 1)
  };
  const stripBoth = function (str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str
  };
  //
  const parseToken = function (w, opts) {
    let obj = {};
    //collect any flags (do it twice)
    for (let i = 0; i < 2; i += 1) {
      //end-flag
      if (end(w) === '$') {
        obj.end = true;
        w = stripEnd(w);
      }
      //front-flag
      if (start(w) === '^') {
        obj.start = true;
        w = stripStart(w);
      }
      //capture group (this one can span multiple-terms)
      if (start(w) === '[' || end(w) === ']') {
        obj.group = null;
        if (start(w) === '[') {
          obj.groupStart = true;
        }
        if (end(w) === ']') {
          obj.groupEnd = true;
        }
        w = w.replace(/^\[/, '');
        w = w.replace(/\]$/, '');
        // Use capture group name
        if (start(w) === '<') {
          const res = captureName.exec(w);
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (w !== '*' && end(w) === '*' && w !== '\\*') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (start(w) === '~' && end(w) === '~' && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy || 0.85;
        if (/\(/.test(w) === false) {
          obj.word = w;
          return obj
        }
      }

      //wrapped-flags
      if (start(w) === '(' && end(w) === ')') {
        // support (one && two)
        if (andSign.test(w)) {
          obj.choices = w.split(andSign);
          obj.operator = 'and';
        } else {
          obj.choices = w.split('|');
          obj.operator = 'or';
        }
        //remove '(' and ')'
        obj.choices[0] = stripStart(obj.choices[0]);
        let last = obj.choices.length - 1;
        obj.choices[last] = stripEnd(obj.choices[last]);
        // clean up the results
        obj.choices = obj.choices.map(s => s.trim());
        obj.choices = obj.choices.filter(s => s);
        //recursion alert!
        obj.choices = obj.choices.map(str => {
          return str.split(/ /g).map(s => parseToken(s, opts))
        });
        w = '';
      }
      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      //machine/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        if (/\//.test(w)) {
          obj.sense = w;
          obj.greedy = true;
        } else {
          obj.machine = w;
        }
        return obj
      }
      //chunks
      if (start(w) === '<' && end(w) === '>') {
        w = stripBoth(w);
        obj.chunk = titleCase$1(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    // support #Tag{1,9}
    if (hasMinMax.test(w) === true) {
      w = w.replace(hasMinMax, (_a, b, c) => {
        if (c === undefined) {
          // '{3}'	Exactly three times
          obj.min = Number(b);
          obj.max = Number(b);
        } else {
          c = c.replace(/, */, '');
          // '{2,4}' Two to four times
          // '{3,}' Three or more times
          obj.min = Number(b);
          obj.max = Number(c || 999);
        }
        // use same method as '+'
        obj.greedy = true;
        // 0 as min means the same as '?'
        obj.optional = true;
        return ''
      });
    }
    //do the actual token content
    if (start(w) === '#') {
      obj.tag = stripStart(w);
      obj.tag = titleCase$1(obj.tag);
      return obj
    }
    //dynamic function on a term object
    if (start(w) === '@') {
      obj.method = stripStart(w);
      return obj
    }
    if (w === '.') {
      obj.anything = true;
      return obj
    }
    //support alone-astrix
    if (w === '*') {
      obj.anything = true;
      obj.greedy = true;
      obj.optional = true;
      return obj
    }
    if (w) {
      //somehow handle encoded-chars?
      w = w.replace('\\*', '*');
      w = w.replace('\\.', '.');
      obj.word = w.toLowerCase();
    }
    return obj
  };
  var parseToken$1 = parseToken;

  // name any [unnamed] capture-groups with a number
  const nameGroups = function (regs) {
    let index = 0;
    let inGroup = null;
    //'fill in' capture groups between start-end
    for (let i = 0; i < regs.length; i++) {
      const token = regs[i];
      if (token.groupStart === true) {
        inGroup = token.group;
        if (inGroup === null) {
          inGroup = String(index);
          index += 1;
        }
      }
      if (inGroup !== null) {
        token.group = inGroup;
      }
      if (token.groupEnd === true) {
        inGroup = null;
      }
    }
    return regs
  };

  // optimize an 'or' lookup, when the (a|b|c) list is simple or multi-word
  const doFastOrMode = function (tokens) {
    return tokens.map(token => {
      if (token.choices !== undefined) {
        // make sure it's an OR
        if (token.operator !== 'or') {
          return token
        }
        if (token.fuzzy === true) {
          return token
        }
        // are they all straight-up words? then optimize them.
        let shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          let reg = block[0];
          // ~fuzzy~ words need more care
          if (reg.fuzzy === true) {
            return false
          }
          // ^ and $ get lost in fastOr
          if (reg.start || reg.end) {
            return false
          }
          if (reg.word !== undefined && reg.negative !== true && reg.optional !== true && reg.method !== true) {
            return true //reg is simple-enough
          }
          return false
        });
        if (shouldPack === true) {
          token.fastOr = new Set();
          token.choices.forEach(block => {
            token.fastOr.add(block[0].word);
          });
          delete token.choices;
        }
      }
      return token
    })
  };

  // support ~(a|b|c)~
  const fuzzyOr = function (regs) {
    return regs.map(reg => {
      if (reg.fuzzy && reg.choices) {
        // pass fuzzy-data to each OR choice
        reg.choices.forEach(r => {
          if (r.length === 1 && r[0].word) {
            r[0].fuzzy = true;
            r[0].min = reg.min;
          }
        });
      }
      return reg
    })
  };

  const postProcess = function (regs) {
    // ensure all capture groups names are filled between start and end
    regs = nameGroups(regs);
    // convert 'choices' format to 'fastOr' format
    regs = doFastOrMode(regs);
    // support ~(foo|bar)~
    regs = fuzzyOr(regs);
    return regs
  };
  var postProcess$1 = postProcess;

  /** parse a match-syntax string into json */
  const syntax = function (input, opts = {}) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks$1(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken$1(str, opts));
    //clean up anything weird
    tokens = postProcess$1(tokens, opts);
    // console.log(tokens)
    return tokens
  };
  var parseMatch = syntax;

  const anyIntersection = function (setA, setB) {
    for (let elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      let reg = regs[i];
      if (reg.optional === true || reg.negation === true) {
        continue
      }
      // is the word missing from the cache?
      if (reg.word !== undefined && cache.has(reg.word) === false) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && cache.has('#' + reg.tag) === false) {
        return true
      }
      // perform a speedup for fast-or
      if (reg.fastOr && anyIntersection(reg.fastOr, cache) === false) {
        return false
      }
    }
    return false
  };
  var failFast$1 = failFast;

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    let aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    let limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    let matrix = [];
    for (let i = 0; i < limit; i++) {
      matrix[i] = [i];
      matrix[i].length = limit;
    }
    for (let i = 0; i < limit; i++) {
      matrix[0][i] = i;
    }
    // Calculate matrix.
    let j, a_index, b_index, cost, min, t;
    for (let i = 1; i <= aLength; ++i) {
      a_index = strA[i - 1];
      for (j = 1; j <= bLength; ++j) {
        // Check the jagged distance total so far
        if (i === j && matrix[i][j] > 4) {
          return aLength
        }
        b_index = strB[j - 1];
        cost = a_index === b_index ? 0 : 1; // Step 5
        // Calculate the minimum (much faster than Math.min(...)).
        min = matrix[i - 1][j] + 1; // Deletion.
        if ((t = matrix[i][j - 1] + 1) < min) min = t; // Insertion.
        if ((t = matrix[i - 1][j - 1] + cost) < min) min = t; // Substitution.
        // Update matrix.
        let shouldUpdate =
          i > 1 && j > 1 && a_index === strB[j - 2] && strA[i - 2] === b_index && (t = matrix[i - 2][j - 2] + cost) < min;
        if (shouldUpdate) {
          matrix[i][j] = t;
        } else {
          matrix[i][j] = min;
        }
      }
    }
    // return number of steps
    return matrix[aLength][bLength]
  };
  // score similarity by from 0-1 (steps/length)
  const fuzzyMatch = function (strA, strB, minLength = 3) {
    if (strA === strB) {
      return 1
    }
    //don't even bother on tiny strings
    if (strA.length < minLength || strB.length < minLength) {
      return 0
    }
    const steps = editDistance(strA, strB);
    let length = Math.max(strA.length, strB.length);
    let relative = length === 0 ? 0 : steps / length;
    let similarity = 1 - relative;
    return similarity
  };
  var fuzzy = fuzzyMatch;

  // these methods are called with '@hasComma' in the match syntax
  // various unicode quotation-mark formats
  const startQuote =
    /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;

  const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;

  const hasHyphen$1 = /^[-–—]$/;
  const hasDash = / [-–—] /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1;

  const methods$d = {
    /** does it have a quotation symbol?  */
    hasQuote: term => startQuote.test(term.pre) || endQuote.test(term.post),
    /** does it have a comma?  */
    hasComma: term => hasPost(term, ','),
    /** does it end in a period? */
    hasPeriod: term => hasPost(term, '.') === true && hasPost(term, '...') === false,
    /** does it end in an exclamation */
    hasExclamation: term => hasPost(term, '!'),
    /** does it end with a question mark? */
    hasQuestionMark: term => hasPost(term, '?') || hasPost(term, '¿'),
    /** is there a ... at the end? */
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…') || hasPre(term, '..') || hasPre(term, '…'),
    /** is there a semicolon after term word? */
    hasSemicolon: term => hasPost(term, ';'),
    /** is there a slash '/' in term word? */
    hasSlash: term => /\//.test(term.text),
    /** a hyphen connects two words like-term */
    hasHyphen: term => hasHyphen$1.test(term.post) || hasHyphen$1.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash.test(term.post) || hasDash.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    isKnown: term => term.tags.size > 0,
    isTitleCase: term => /^[A-Z][a-z'\u00C0-\u00FF]/.test(term.text), //|| /^[A-Z]$/.test(term.text)
  };
  // aliases
  methods$d.hasQuotation = methods$d.hasQuote;

  var termMethods = methods$d;

  //declare it up here
  let wrapMatch = function () { };
  /** ignore optional/greedy logic, straight-up term match*/
  const doesMatch$1 = function (term, reg, index, length) {
    // support '.'
    if (reg.anything === true) {
      return true
    }
    // support '^' (in parentheses)
    if (reg.start === true && index !== 0) {
      return false
    }
    // support '$' (in parentheses)
    if (reg.end === true && index !== length - 1) {
      return false
    }
    //support a text match
    if (reg.word !== undefined) {
      //match contractions, machine-form
      if (term.machine !== null && term.machine === reg.word) {
        return true
      }
      // term aliases for slashes and things
      if (term.alias !== undefined && term.alias.hasOwnProperty(reg.word)) {
        return true
      }
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        let score = fuzzy(reg.word, term.normal);
        if (score >= reg.min) {
          return true
        }
      }
      // match slashes and things
      if (term.alias && term.alias.some(str => str === reg.word)) {
        return true
      }
      //match either .normal or .text
      return reg.word === term.text || reg.word === term.normal
    }
    //support #Tag
    if (reg.tag !== undefined) {
      return term.tags.has(reg.tag) === true
    }
    //support @method
    if (reg.method !== undefined) {
      if (typeof termMethods[reg.method] === 'function' && termMethods[reg.method](term) === true) {
        return true
      }
      return false
    }
    //support whitespace/punctuation
    if (reg.pre !== undefined) {
      return term.pre && term.pre.includes(reg.pre)
    }
    if (reg.post !== undefined) {
      return term.post && term.post.includes(reg.post)
    }
    //support /reg/
    if (reg.regex !== undefined) {
      return reg.regex.test(term.normal)
    }
    //support <chunk>
    if (reg.chunk !== undefined) {
      return term.chunk === reg.chunk
    }
    //support %Noun|Verb%
    if (reg.switch !== undefined) {
      return term.switch === reg.switch
    }
    //support {machine}
    if (reg.machine !== undefined) {
      return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine
    }
    //support {word/sense}
    if (reg.sense !== undefined) {
      return term.sense === reg.sense
    }
    // support optimized (one|two)
    if (reg.fastOr !== undefined) {
      if (term.implicit && reg.fastOr.has(term.implicit) === true) {
        return true
      }
      return reg.fastOr.has(term.normal) || reg.fastOr.has(term.text)
    }
    //support slower (one|two)
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r, index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r, index, length))
    }
    return false
  };
  // wrap result for !negative match logic
  wrapMatch = function (t, reg, index, length) {
    let result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };
  var matchTerm = wrapMatch;

  const env = typeof process === 'undefined' ? self.env || {} : process.env;
  const log$1 = msg => {
    if (env.DEBUG_MATCH) {
      console.log(`\n  \x1b[32m ${msg} \x1b[0m`); // eslint-disable-line
    }
  };

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    let reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
    let start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      //stop for next-reg match
      if (endReg && matchTerm(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        return state.t
      }
      let count = state.t - start + 1;
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    return state.t
  };

  const greedyTo = function (state, nextReg) {
    let t = state.t;
    //if there's no next one, just go off the end!
    if (!nextReg) {
      return state.terms.length
    }
    //otherwise, we're looking for the next one
    for (; t < state.terms.length; t += 1) {
      if (matchTerm(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
        log$1(`greedyTo ${state.terms[t].normal}`);
        return t
      }
    }
    //guess it doesn't exist, then.
    return null
  };

  const isEndGreedy = function (reg, state) {
    if (reg.end === true && reg.greedy === true) {
      if (state.start_i + state.t < state.phrase_length - 1) {
        let tmpReg = Object.assign({}, reg, { end: false });
        if (matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          log$1(`endGreedy ${state.terms[state.t].normal}`);
          return true
        }
      }
    }
    return false
  };

  const isArray$3 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock = function (state, skipN = 0) {
    let block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      let regs = block.choices[c];
      if (!isArray$3(regs)) {
        // console.log('=-=-=-= bad -=-=-=-')
        // console.dir(state.regs, { depth: 5 })
        return false
      }// } else {
      //   // console.log('=-=-=-= good -=-=-=-')
      //   // console.dir(state.regs[0], { depth: 5 })
      // }
      wasFound = regs.every((cr, w_index) => {
        let extra = 0;
        let t = state.t + w_index + skipN + extra;
        if (state.terms[t] === undefined) {
          return false
        }
        let foundBlock = matchTerm(state.terms[t], cr, t + state.start_i, state.phrase_length);
        // this can be greedy - '(foo+ bar)'
        if (foundBlock === true && cr.greedy === true) {
          for (let i = 1; i < state.terms.length; i += 1) {
            let term = state.terms[t + i];
            if (term) {
              let keepGoing = matchTerm(term, cr, state.start_i + i, state.phrase_length);
              if (keepGoing === true) {
                extra += 1;
              } else {
                break
              }
            }
          }
        }
        skipN += extra;
        return foundBlock
      });
      if (wasFound) {
        skipN += regs.length;
        break
      }
    }
    // we found a match -  is it greedy though?
    if (wasFound && block.greedy === true) {
      return doOrBlock(state, skipN) // try it again!
    }
    return skipN
  };

  const doAndBlock = function (state) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    let reg = state.regs[state.r];
    let allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      let allWords = block.every((cr, w_index) => {
        let tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return matchTerm(state.terms[tryTerm], cr, tryTerm, state.phrase_length)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      log$1(`doAndBlock ${state.terms[state.t].normal}`);
      return longest
    }
    return false
  };

  const getGroup$2 = function (state, term_index) {
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  // const log = msg => {
  //   const env = typeof process === 'undefined' ? self.env || {} : process.env
  //   if (env.DEBUG_MATCH === true) {
  //     console.log(`\n  \x1b[32m ${msg} \x1b[0m`) // eslint-disable-line
  //   }
  // }

  // i formally apologize for how complicated this is.
  /** tries to match a sequence of terms, starting from here */
  const tryHere = function (terms, regs, start_i, phrase_length) {
    if (terms.length === 0 || regs.length === 0) {
      return null
    }
    // all the variables that matter
    let state = {
      t: 0,
      terms: terms,
      r: 0,
      regs: regs,
      groups: {},
      start_i: start_i,
      phrase_length: phrase_length,
      inGroup: null,
    };
    // log('-> [' + terms.map(t => t.implicit || t.normal).join(', ') + ']')

    // we must satisfy each rule in 'regs'
    for (; state.r < regs.length; state.r += 1) {
      let reg = regs[state.r];
      // Check if this reg has a named capture group
      state.hasGroup = Boolean(reg.group);
      // Reuse previous capture group if same
      if (state.hasGroup === true) {
        state.inGroup = reg.group;
      } else {
        state.inGroup = null;
      }
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const haveNeeds = regs.slice(state.r).some(remain => !remain.optional);
        if (haveNeeds === false) {
          break //done!
        }
        // log(`✗ |terms done|`)
        return null // die
      }
      //support 'unspecific greedy' .* properly
      if (reg.anything === true && reg.greedy === true) {
        let skipto = greedyTo(state, regs[state.r + 1]);
        //maybe we couldn't find it
        if (skipto === null || skipto === 0) {
          return null
        }
        // ensure it's long enough
        if (reg.min !== undefined && skipto - state.t < reg.min) {
          return null
        }
        // reduce it back, if it's too long
        if (reg.max !== undefined && skipto - state.t > reg.max) {
          state.t = state.t + reg.max;
          continue
        }
        // set the group result
        if (state.hasGroup === true) {
          const g = getGroup$2(state, state.t);
          g.length = skipto - state.t;
        }
        state.t = skipto;
        // log(`✓ |greedy|`)
        continue
      }
      // support multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        let skipNum = doOrBlock(state);
        if (skipNum) {
          // handle 'not' logic
          if (reg.negative === true) {
            return null // die
          }
          if (state.hasGroup === true) {
            const g = getGroup$2(state, state.t);
            g.length += skipNum;
          }
          // ensure we're at the end
          if (reg.end === true) {
            let end = state.phrase_length - 1;
            if (state.t + state.start_i !== end) {
              return null
            }
          }
          state.t += skipNum;
          // log(`✓ |found-or|`)
          continue
        } else if (!reg.optional) {
          return null //die
        }
      }
      // support AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        let skipNum = doAndBlock(state);
        if (skipNum) {
          // handle 'not' logic
          if (reg.negative === true) {
            return null // die
          }
          if (state.hasGroup === true) {
            const g = getGroup$2(state, state.t);
            g.length += skipNum;
          }
          // ensure we're at the end
          if (reg.end === true) {
            let end = state.phrase_length - 1;
            if (state.t + state.start_i !== end) {
              return null
            }
          }
          state.t += skipNum;
          // log(`✓ |found-and|`)
          continue
        } else if (!reg.optional) {
          return null //die
        }
      }
      // ok, finally test the term/reg
      let term = state.terms[state.t];
      let hasMatch = matchTerm(term, reg, state.start_i + state.t, state.phrase_length);
      if (reg.anything === true || hasMatch === true || isEndGreedy(reg, state)) {
        let startAt = state.t;
        // if it's a negative optional match... :0
        if (reg.optional && regs[state.r + 1] && reg.negative) {
          continue
        }
        // okay, it was a match, but if it's optional too,
        // we should check the next reg too, to skip it?
        if (reg.optional && regs[state.r + 1]) {
          // does the next reg match it too?
          let nextRegMatched = matchTerm(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
          if (reg.negative || nextRegMatched) {
            // but does the next reg match the next term??
            // only skip if it doesn't
            let nextTerm = state.terms[state.t + 1];
            if (!nextTerm || !matchTerm(nextTerm, regs[state.r + 1], state.start_i + state.t, state.phrase_length)) {
              state.r += 1;
            }
          }
        }
        // log(`✓ |matched '${state.terms[state.t].normal}'|`)
        //advance to the next term!
        state.t += 1;
        //check any ending '$' flags
        if (reg.end === true) {
          //if this isn't the last term, refuse the match
          if (state.t !== state.terms.length && reg.greedy !== true) {
            // log(`✗ |end-flag|`)
            return null //die
          }
        }
        //try keep it going!
        if (reg.greedy === true) {
          state.t = getGreedy(state, regs[state.r + 1]);
          if (state.t === null) {
            // log(`✗ |too-short|`)
            return null //greedy was too short
          }
          if (reg.min && reg.min > state.t) {
            // log(`✗ |too-short2|`)
            return null //greedy was too short
          }
          // if this was also an end-anchor match, check to see we really
          // reached the end
          if (reg.end === true && state.start_i + state.t !== phrase_length) {
            // log(`✗ |not-end|`)
            return null //greedy didn't reach the end
          }
        }
        if (state.hasGroup === true) {
          // Get or create capture group
          const g = getGroup$2(state, startAt);
          // Update group - add greedy or increment length
          if (state.t > 1 && reg.greedy) {
            g.length += state.t - startAt;
          } else {
            g.length++;
          }
        }
        // should we clump-in the 2nd word of a contraction?
        // let lastTerm = state.terms[state.t - 1]
        // let thisTerm = state.terms[state.t]
        // if (lastTerm && thisTerm && lastTerm.implicit && thisTerm.implicit) {
        //   // only if it wouldn't match, organically
        //   let nextReg = regs[state.r + 1]
        //   if (!nextReg || !matchTerm(thisTerm, nextReg, state.start_i + state.t, state.phrase_length)) {
        //     state.t += 1
        //   }
        // }
        continue
      }

      // ok, it doesn't match.
      // did it *actually match* a negative?
      if (reg.negative) {
        let tmpReg = Object.assign({}, reg);
        tmpReg.negative = false; // try removing it
        let foundNeg = matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
        if (foundNeg === true) {
          // log(`✗ |no neg|`)
          return null //bye!
        }
      }
      //bah, who cares, keep going
      if (reg.optional === true) {
        // log(`- |optional reg '${reg.word}'|`)
        continue
      }

      if (Boolean(state.terms[state.t].implicit) && regs[state.r - 1] && state.terms[state.t + 1]) {
        // if the last match was implicit too, we're missing a word.
        if (state.terms[state.t - 1] && state.terms[state.t - 1].implicit === regs[state.r - 1].word) {
          return null
        }
        // does the next one match?
        if (matchTerm(state.terms[state.t + 1], reg, state.start_i + state.t, state.phrase_length)) {
          // log(`✓ |contraction| '${state.terms[state.t + 1].implicit}'`)
          state.t += 2;
          continue
        }
      }
      return null //die
    }
    //return our results, as pointers
    let pntr = [null, start_i, state.t + start_i]; //`${start_i}:${state.t + start_i}`
    if (pntr[1] === pntr[2]) {
      // log(`✗ |found nothing|`)
      return null
    }
    let groups = {};
    Object.keys(state.groups).forEach(k => {
      let o = state.groups[k];
      let start = start_i + o.start;
      groups[k] = [null, start, start + o.length]; //`${start}:${start + o.length}`
    });
    return { pointer: pntr, groups: groups }
  };
  var fromHere = tryHere;

  const getGroup = function (res, group) {
    let ptrs = [];
    let byGroup = {};
    if (res.length === 0) {
      return { ptrs, byGroup }
    }
    if (typeof group === 'number') {
      group = String(group);
    }
    if (group) {
      res.forEach(r => {
        if (r.groups[group]) {
          ptrs.push(r.groups[group]);
        }
      });
    } else {
      res.forEach(r => {
        ptrs.push(r.pointer);
        Object.keys(r.groups).forEach(k => {
          byGroup[k] = byGroup[k] || [];
          byGroup[k].push(r.groups[k]);
        });
      });
    }
    return { ptrs, byGroup }
  };
  var getGroup$1 = getGroup;

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n) {
    let res = fromHere(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch = function (docs, todo, cache) {
    cache = cache || [];
    let { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      let terms = docs[n];
      // can we skip this sentence?
      if (cache[n] && failFast$1(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        let foundStart = handleStart(terms, regs, n);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        let slice = terms.slice(i);
        // ensure it's long-enough
        if (slice.length < minLength) {
          break
        }
        let res = fromHere(slice, regs, i, terms.length);
        // did we find a result?
        if (res) {
          res = addSentence(res, n);
          results.push(res);
          // should we stop here?
          if (justOne === true) {
            break docs
          }
          // skip ahead, over these results
          let end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        let n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    // grab the requested group
    results = getGroup$1(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      let [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  var match$1 = runMatch;

  const methods$b = {
    one: {
      termMethods,
      parseMatch,
      match: match$1,
    },
  };

  var methods$c = methods$b;

  var lib$4 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      return world.methods.one.parseMatch(str, opts)
    }
  };

  var match = {
    api: api$7,
    methods: methods$c,
    lib: lib$4,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = (str) => {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&apos;');
    return str
  };

  // interpret .class, #id, tagName
  const toTag = function (k) {
    let start = '';
    let end = '</span>';
    k = escapeXml(k);
    if (isClass.test(k)) {
      start = `<span class="${k.replace(/^\./, '')}"`;
    } else if (isId.test(k)) {
      start = `<span id="${k.replace(/^#/, '')}"`;
    } else {
      start = `<${k}`;
      end = `</${k}>`;
    }
    start += '>';
    return { start, end }
  };

  const getIndex = function (doc, obj) {
    let starts = {};
    let ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      let tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        let a = terms[0].id;
        starts[a] = starts[a] || [];
        starts[a].push(tag.start);
        let b = terms[terms.length - 1].id;
        ends[b] = ends[b] || [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    let { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '' + t.text || '';
        if (ends.hasOwnProperty(t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  const trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/;
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\u201D\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach(t => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(trimStart, '');
        // replace a hyphen with a space
        if (isHyphen.test(post)) {
          post = ' ';
        }
        post = post.replace(punctToKill, '');
        // cleanup exclamations
        post = post.replace(/\?!+/, '?');
        post = post.replace(/!+/, '!');
        post = post.replace(/\?+/, '?');
        // kill elipses
        post = post.replace(/\.{2,}/, '');
      }
      if (opts.whitespace === 'some') {
        pre = pre.replace(/\s/, ''); //remove pre-whitespace
        post = post.replace(/\s+/, ' '); //replace post-whitespace with a space
      }
      if (!opts.keepPunct) {
        pre = pre.replace(trimStart, '');
        if (post === '-') {
          post = ' ';
        } else {
          post = post.replace(trimEnd, '');
        }
      }
      // grab the correct word format
      let word = t[opts.form || 'text'] || t.normal || '';
      if (opts.form === 'implicit') {
        word = t.implicit || t.text;
      }
      if (opts.form === 'root' && t.implicit) {
        word = t.root || t.implicit || t.normal;
      }
      // add an implicit space, for contractions
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit) {
        if (!post || !hasSpace.test(post)) {
          post += ' ';
        }
      }
      txt += pre + word + post;
    });
    if (keepSpace === false) {
      txt = txt.trim();
    }
    if (opts.lowerCase === true) {
      txt = txt.toLowerCase();
    }
    return txt
  };

  const textFromDoc = function (docs, opts) {
    let text = '';
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepPunct === false) {
      text = text.replace(trimStart, '');
      text = text.replace(trimEnd, '');
    }
    if (opts.cleanWhitespace === true) {
      text = text.trim();
    }
    return text
  };

  const fmts = {
    text: {
      form: 'text',
    },
    normal: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'normal',
    },
    machine: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;
  var fmts$1 = fmts;

  const defaults$1 = {
    text: true,
    terms: true,
  };

  let opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: (terms) => {
      return textFromTerms(terms, { keepPunct: true }, false)
    },
    normal: (terms) => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: (terms) => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

    machine: (terms) => textFromTerms(terms, opts, false),
    root: (terms) => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    offset: (terms) => {
      let len = fns$1.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: (terms) => {
      return terms.map(t => {
        let term = Object.assign({}, t);
        term.tags = Array.from(t.tags);
        return term
      })
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: (terms) => terms.some(t => t.dirty === true)
  };
  fns$1.sentences = fns$1.sentence;
  fns$1.clean = fns$1.normal;
  fns$1.reduced = fns$1.root;

  const toJSON = function (view, option) {
    option = option || {};
    if (typeof option === 'string') {
      option = {};
    }
    option = Object.assign({}, defaults$1, option);
    // run any necessary upfront steps
    if (option.offset) {
      view.compute('offset');
    }
    return view.docs.map((terms, i) => {
      let res = {};
      Object.keys(option).forEach(k => {
        if (option[k] && fns$1[k]) {
          res[k] = fns$1[k](terms, view, i);
        }
      });
      return res
    })
  };


  const methods$a = {
    /** return data */
    json: function (n) {
      let res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$a.data = methods$a.json;
  var json = methods$a;

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      let terms = m.docs[0];
      let out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        let tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };
  var logClientSide$1 = logClientSide;

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
  const reset = '\x1b[0m';

  //cheaper than requiring chalk
  const cli = {
    green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    blue: str => '\x1b[34m' + str + reset,
    magenta: str => '\x1b[35m' + str + reset,
    cyan: str => '\x1b[36m' + str + reset,
    yellow: str => '\x1b[33m' + str + reset,
    black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
    i: str => '\x1b[3m' + str + reset,
  };
  var cli$1 = cli;

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!model.one.tagSet.hasOwnProperty(tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli$1[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    let { docs, model } = view;
    if (docs.length === 0) {
      console.log(cli$1.blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(cli$1.blue('\n  ┌─────────'));
      terms.forEach(t => {
        let tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = '{' + t.sense + '}';
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli$1.yellow(text);
        let word = "'" + text + "'";
        word = word.padEnd(18);
        let str = cli$1.blue('  │ ') + cli$1.i(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
  };
  var showTags$1 = showTags;

  /* eslint-disable no-console */

  const showChunks = function (view) {
    let { docs } = view;
    console.log('');
    docs.forEach(terms => {
      let out = [];
      terms.forEach(term => {
        if (term.chunk === 'Noun') {
          out.push(cli$1.blue(term.implicit || term.normal));
        } else if (term.chunk === 'Verb') {
          out.push(cli$1.green(term.implicit || term.normal));
        } else if (term.chunk === 'Adjective') {
          out.push(cli$1.yellow(term.implicit || term.normal));
        } else if (term.chunk === 'Pivot') {
          out.push(cli$1.red(term.implicit || term.normal));
        } else {
          out.push(term.implicit || term.normal);
        }
      });
      console.log(out.join(' '), '\n');
    });
  };
  var showChunks$1 = showChunks;

  const split = (txt, offset, index) => {
    let buff = index * 9; //there are 9 new chars addded to each highlight
    let start = offset.start + buff;
    let end = start + offset.length;
    let pre = txt.substring(0, start);
    let mid = txt.substring(start, end);
    let post = txt.substring(end, txt.length);
    return [pre, mid, post]
  };

  const spliceIn = function (txt, offset, index) {
    let parts = split(txt, offset, index);
    return `${parts[0]}${cli$1.blue(parts[1])}${parts[2]}`
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    let bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] = bySentence[ptr[0]] || [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      let full = doc.update([[Number(k)]]);
      let txt = full.text();
      let matches = doc.update(bySentence[k]);
      let json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt); // eslint-disable-line
    });
  };
  var showHighlight$1 = showHighlight;

  /* eslint-disable no-console */

  function isClientSide() {
    return typeof window !== 'undefined' && window.document
  }
  //output some helpful stuff to the console
  const debug = function (opts = {}) {
    let view = this;
    if (typeof opts === 'string') {
      let tmp = {};
      tmp[opts] = true; //allow string input
      opts = tmp;
    }
    if (isClientSide()) {
      logClientSide$1(view);
      return view
    }
    if (opts.tags !== false) {
      showTags$1(view);
      console.log('\n');
    }
    // output chunk-view, too
    if (opts.chunks === true) {
      showChunks$1(view);
      console.log('\n');
    }
    // highlight match in sentence
    if (opts.highlight === true) {
      showHighlight$1(view);
      console.log('\n');
    }
    return view
  };
  var debug$1 = debug;

  const toText = function (term) {
    let pre = term.pre || '';
    let post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    let starts = {};
    Object.keys(obj).forEach(reg => {
      let m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    let starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          let { fn, end } = starts[t.id];
          let m = doc.update([[n, i, end]]);
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText(t);
        }
      }
    });
    return text
  };
  var wrap$1 = wrap;

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    let obj = {};
    arr.forEach(a => {
      obj[a] = obj[a] || 0;
      obj[a] += 1;
    });
    let res = Object.keys(obj).map(k => {
      return { normal: k, count: obj[k] }
    });
    return res.sort((a, b) => (a.count > b.count ? -1 : 0))
  };

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$3(method)) {
      return wrap$1(this, method)
    }
    // text out formats
    if (method === 'text') {
      return this.text()
    }
    if (method === 'normal') {
      return this.text('normal')
    }
    if (method === 'machine' || method === 'reduced') {
      return this.text('machine')
    }

    // json data formats
    if (method === 'json') {
      return this.json()
    }
    if (method === 'offset' || method === 'offsets') {
      this.compute('offset');
      return this.json({ offset: true })
    }
    if (method === 'array') {
      let arr = this.docs.map(terms => {
        return terms
          .reduce((str, t) => {
            return str + t.pre + t.text + t.post
          }, '')
          .trim()
      });
      return arr.filter(str => str)
    }
    // return terms sorted by frequency
    if (method === 'freq' || method === 'frequency' || method === 'topk') {
      return topk(this.json({ normal: true }).map(o => o.normal))
    }

    // some handy ad-hoc outputs
    if (method === 'terms') {
      let list = [];
      this.docs.forEach(s => {
        let terms = s.terms.map(t => t.text);
        terms = terms.filter(t => t);
        list = list.concat(terms);
      });
      return list
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    }
    if (method === 'debug') {
      return this.debug() //allow
    }
    return this.text()
  };

  const methods$9 = {
    /** */
    debug: debug$1,
    /** */
    out: out,
  };

  var out$1 = methods$9;

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {
        keepSpace: true,
        keepPunct: true,
      };
      if (fmt && typeof fmt === 'string' && fmts$1.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts$1[fmt]);
      } else if (fmt && isObject$2(fmt)) {
        opts = Object.assign({}, fmt, opts);//todo: fixme
      }
      if (this.pointer) {
        opts.keepSpace = false;
        let ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepPunct = false;
        } else {
          opts.keepPunct = true;
        }
      } else {
        opts.keepPunct = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$8 = Object.assign({}, out$1, text, json, html$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$8);
  };
  var api$6 = addAPI$2;

  var output = {
    api: api$6,
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    let [, startA, endA] = a;
    let [, startB, endB] = b;
    // [a,a,a,-,-,-,]
    // [-,-,b,b,b,-,]
    if (startA <= startB && endA > startB) {
      return true
    }
    // [-,-,-,a,a,-,]
    // [-,-,b,b,b,-,]
    if (startB <= startA && endB > startA) {
      return true
    }
    return false
  };

  // get widest min/max
  const getExtent = function (ptrs) {
    let min = ptrs[0][1];
    let max = ptrs[0][2];
    ptrs.forEach(ptr => {
      if (ptr[1] < min) {
        min = ptr[1];
      }
      if (ptr[2] > max) {
        max = ptr[2];
      }
    });
    return [ptrs[0][0], min, max]
  };

  // collect pointers by sentence number
  const indexN = function (ptrs) {
    let byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] = byN[ref[0]] || [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    let obj = {};
    for (let i = 0; i < arr.length; i += 1) {
      obj[arr[i].join(',')] = arr[i];
    }
    return Object.values(obj)
  };

  // a before b
  // console.log(doesOverlap([0, 0, 4], [0, 2, 5]))
  // // b before a
  // console.log(doesOverlap([0, 3, 4], [0, 1, 5]))
  // // disjoint
  // console.log(doesOverlap([0, 0, 3], [0, 4, 5]))
  // neighbours
  // console.log(doesOverlap([0, 1, 3], [0, 3, 5]))
  // console.log(doesOverlap([0, 3, 5], [0, 1, 3]))

  // console.log(
  //   getExtent([
  //     [0, 3, 4],
  //     [0, 4, 5],
  //     [0, 1, 2],
  //   ])
  // )

  // split a pointer, by match pointer
  const pivotBy = function (full, m) {
    let [n, start] = full;
    let mStart = m[1];
    let mEnd = m[2];
    let res = {};
    // is there space before the match?
    if (start < mStart) {
      let end = mStart < full[2] ? mStart : full[2]; // find closest end-point
      res.before = [n, start, end]; //before segment
    }
    res.match = m;
    // is there space after the match?
    if (full[2] > mEnd) {
      res.after = [n, mEnd, full[2]]; //after segment
    }
    return res
  };

  const doesMatch = function (full, m) {
    return full[1] <= m[1] && m[2] <= full[2]
  };

  const splitAll = function (full, m) {
    let byN = indexN(m);
    let res = [];
    full.forEach(ptr => {
      let [n] = ptr;
      let matches = byN[n] || [];
      matches = matches.filter(p => doesMatch(ptr, p));
      if (matches.length === 0) {
        res.push({ passthrough: ptr });
        return
      }
      // ensure matches are in-order
      matches = matches.sort((a, b) => a[1] - b[1]);
      // start splitting our left-to-right
      let carry = ptr;
      matches.forEach((p, i) => {
        let found = pivotBy(carry, p);
        // last one
        if (!matches[i + 1]) {
          res.push(found);
        } else {
          res.push({ before: found.before, match: found.match });
          if (found.after) {
            carry = found.after;
          }
        }
      });
    });
    return res
  };

  var splitAll$1 = splitAll;

  const max$1 = 4;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        let index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        let index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    let [n, start, , , endId] = ptr;
    let terms = document[n];
    // look for end-id
    let newEnd = terms.findIndex(t => t.id === endId);
    if (newEnd === -1) {
      // if end-term wasn't found, so go all the way to the end
      ptr[2] = document[n].length;
      ptr[4] = terms.length ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd; // repair ending pointer
    }
    return document[n].slice(start, ptr[2] + 1)
  };

  /** return a subset of the document, from a pointer */
  const getDoc$1 = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      let [n, start, end, id, endId] = ptr; //parsePointer(ptr)
      let terms = document[n] || [];
      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = terms.length;
      }
      if (id && (!terms[start] || terms[start].id !== id)) {
        // console.log('  repairing pointer...')
        let wild = blindSweep(id, document, n);
        if (wild !== null) {
          let len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          let startId = terms[0] ? terms[0].id : null;
          ptrs[i] = [wild[0], wild[1], wild[1] + len, startId];
        }
      } else {
        terms = terms.slice(start, end);
      }
      if (terms.length === 0) {
        return
      }
      if (start === end) {
        return
      }
      // test end-id, if it exists
      if (endId && terms[terms.length - 1].id !== endId) {
        terms = repairEnding(ptr, document);
      }
      // otherwise, looks good!
      doc.push(terms);
    });
    return doc
  };
  var getDoc$2 = getDoc$1;

  // flat list of terms from nested document
  const termList = function (docs) {
    let arr = [];
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        arr.push(docs[i][t]);
      }
    }
    return arr
  };

  var methods$7 = {
    one: {
      termList,
      getDoc: getDoc$2,
      pointer: {
        indexN,
        splitAll: splitAll$1,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    let both = a.concat(b);
    let byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      let [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      let hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      let range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };
  var getUnion$1 = getUnion;

  // two disjoint
  // console.log(getUnion([[1, 3, 4]], [[0, 1, 2]]))
  // two disjoint
  // console.log(getUnion([[0, 3, 4]], [[0, 1, 2]]))
  // overlap-plus
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 6]]))
  // overlap
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 3]]))
  // neighbours
  // console.log(getUnion([[0, 1, 3]], [[0, 3, 5]]))

  const subtract = function (refs, not) {
    let res = [];
    let found = splitAll$1(refs, not);
    found.forEach(o => {
      if (o.passthrough) {
        res.push(o.passthrough);
      }
      if (o.before) {
        res.push(o.before);
      }
      if (o.after) {
        res.push(o.after);
      }
    });
    return res
  };
  var getDifference = subtract;

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    let start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    let end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    let byN = indexN(b);
    let res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        let overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };
  var getIntersection$1 = getIntersection;

  // console.log(getIntersection([[0, 1, 3]], [[0, 2, 4]]))

  const getDoc = (m, view) => {
    return typeof m === 'string' ? view.match(m) : m
  };

  // 'harden' our json pointers, again
  const addIds = function (ptrs, docs) {
    return ptrs.map(ptr => {
      let [n, start] = ptr;
      if (docs[n] && docs[n][start]) {
        ptr[3] = docs[n][start].id;
      }
      return ptr
    })
  };

  const methods$6 = {};

  // all parts, minus duplicates
  methods$6.union = function (m) {
    m = getDoc(m, this);
    let ptrs = getUnion$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.and = methods$6.union;

  // only parts they both have
  methods$6.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$6.not = function (m) {
    m = getDoc(m, this);
    let ptrs = getDifference(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.difference = methods$6.not;

  // get opposite of a
  methods$6.complement = function () {
    let doc = this.all();
    let ptrs = getDifference(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$6.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion$1(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };


  const addAPI$1 = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$6);
  };
  var api$5 = addAPI$1;

  var pointers = {
    methods: methods$7,
    api: api$5,
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun') {
      term.chunk = tag;
    }
    if (tag === 'Verb') {
      term.chunk = tag;
    }
  };

  const tagTerm = function (term, tag, tagSet, isSafe) {
    // does it already have this tag?
    if (term.tags.has(tag) === true) {
      return null
    }
    // allow this shorthand in multiple-tag strings
    if (tag === '.') {
      return null
    }
    // for known tags, do logical dependencies first
    let known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known.not && known.not.length > 0) {
        for (let o = 0; o < known.not.length; o += 1) {
          // if we're in tagSafe, skip this term.
          if (isSafe === true && term.tags.has(known.not[o])) {
            return null
          }
          term.tags.delete(known.not[o]);
        }
      }
      // add parent tags
      if (known.parents && known.parents.length > 0) {
        for (let o = 0; o < known.parents.length; o += 1) {
          term.tags.add(known.parents[o]);
          addChunk(term, known.parents[o]);
        }
      }
    }
    // finally, add our tag
    term.tags.add(tag);
    // now it's dirty
    term.dirty = true;
    // add a chunk too, if it's easy
    addChunk(term, tag);
    return true
  };

  // support '#Noun . #Adjective' syntax
  const multiTag = function (terms, tagString, tagSet, isSafe) {
    let tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tagTerm(term, tag, tagSet, isSafe);
      }
    });
  };

  const isArray$2 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // verbose-mode tagger debuging
  const log = (term, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    let word = term.text || '[' + term.implicit + ']';
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(25)}  ${i(reason)}`); // eslint-disable-line
  };

  // add a tag to all these terms
  const setTag = function (terms, tag, world = {}, isSafe, reason) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    // some logging for debugging
    let env = typeof process === 'undefined' ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log(terms[0], tag, reason);
    }
    if (isArray$2(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe));
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, isSafe);
      return
    }
    tag = tag.replace(/^#/, '');
    // let set = false
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe);
    }
  };
  var setTag$1 = setTag;

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet) {
    tag = tag.trim().replace(/^#/, '');
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        continue
      }
      // for known tags, do logical dependencies first
      let known = tagSet[tag];
      // removing #Verb should also remove #PastTense
      if (known && known.children.length > 0) {
        for (let o = 0; o < known.children.length; o += 1) {
          term.tags.delete(known.children[o]);
        }
      }
      term.tags.delete(tag);
    }
  };
  var unTag$1 = unTag;

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s(e);return new g(t)};_.prototype.plugin=function(e){e(this);};

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Preposition: 'cyan',
    Conjunction: 'cyan',
    Determiner: 'cyan',
    Adverb: 'cyan',
  };

  var colors$1 = colors;

  const getColor = function (node) {
    if (colors$1.hasOwnProperty(node.id)) {
      return colors$1[node.id]
    }
    if (colors$1.hasOwnProperty(node.is)) {
      return colors$1[node.is]
    }
    let found = node._cache.parents.find(c => colors$1[c]);
    return colors$1[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      let { not, also, is } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
        also,
        parents,
        children: node._cache.children,
        color: getColor(node)
      };
    });
    // lastly, add all children of all nots
    Object.keys(res).forEach(k => {
      let nots = new Set(res[k].not);
      res[k].not.forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
    });
    return res
  };

  var fmt$1 = fmt;

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input
  };

  const addImplied = function (tags, already) {
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!already.hasOwnProperty(tags[k].is) && !tags.hasOwnProperty(tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // add any implicit 'not' tags
      if (tags[k].not && typeof tags[k].not === 'string' && !tags.hasOwnProperty(tags[k].not)) {
        if (!already.hasOwnProperty(tags[k].not) && !tags.hasOwnProperty(tags[k].not)) {
          tags[tags[k].not] = {};
        }
      }
    });
    return tags
  };


  const validate = function (tags, already) {

    tags = addImplied(tags, already);

    // property validation
    Object.keys(tags).forEach(k => {
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      let nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };
  var validate$1 = validate;

  // 'fill-down' parent logic inference
  const compute$5 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      let o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is };
      return { id: k, parent: o.is, props, children: [] }
    });
    const graph = _(flatList).cache().fillDown();
    return graph.out('array')
  };

  const addTags$1 = function (tags, already) {
    tags = validate$1(tags, already);

    let allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$5(allTags);
    // convert it to our final format
    const res = fmt$1(nodes);
    return res
  };
  var addTags$2 = addTags$1;

  var methods$5 = {
    one: {
      setTag: setTag$1,
      unTag: unTag$1,
      addTags: addTags$2
    },
  };

  /* eslint no-console: 0 */
  const isArray$1 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };
  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      if (!this.found || !input) {
        return this
      }
      let terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, world } = this;
      // logger
      if (verbose === true) {
        console.log(' +  ', input, reason || '');
      }
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.setTag(terms, tag, world, isSafe));
      } else {
        methods.one.setTag(terms, input, world, isSafe);
      }
      // uncache
      this.uncache();
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      if (!this.found || !input) {
        return this
      }
      let terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      let tagSet = model.one.tagSet;
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.unTag(terms, tag, tagSet));
      } else {
        methods.one.unTag(terms, input, tagSet);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      let tagSet = this.model.one.tagSet;
      // everything can be an unknown tag
      if (!tagSet.hasOwnProperty(tag)) {
        return this
      }
      let not = tagSet[tag].not || [];
      let nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          let found = not.find(no => term.tags.has(no));
          if (found) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      let noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };
  var tag$1 = fns;

  const tagAPI = function (View) {
    Object.assign(View.prototype, tag$1);
  };
  var api$4 = tagAPI;

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    let res = fn(tags, tagSet);
    model.one.tagSet = res;
    return this
  };

  var lib$3 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !tagSet.hasOwnProperty(b)) {
        return 1
      }
      if (boringTags.has(b) || !tagSet.hasOwnProperty(a)) {
        return -1
      }
      let kids = tagSet[a].children || [];
      let aKids = kids.length;
      kids = tagSet[b].children || [];
      let bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        let tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };
  var tagRank$1 = tagRank;

  var tag = {
    model: {
      one: { tagSet: {} }
    },
    compute: {
      tagRank: tagRank$1
    },
    methods: methods$5,
    api: api$4,
    lib: lib$3
  };

  const initSplit = /(\S.+?[.!?\u203D\u2E18\u203C\u2047-\u2049])(?=\s|$)/g;
  const newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats
  // Start with a regex:
  const basicSplit = function (text) {
    let all = [];
    //first, split by newline
    let lines = text.split(newLine);
    for (let i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      let arr = lines[i].split(initSplit);
      for (let o = 0; o < arr.length; o++) {
        all.push(arr[o]);
      }
    }
    return all
  };
  var basicSplit$1 = basicSplit;

  const isAcronym$2 = /[ .][A-Z]\.? *$/i;
  const hasEllipse = /(?:\u2026|\.{2,}) *$/;
  const hasLetter$1 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter$1.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$2.test(str) === true) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str) === true) {
      return false
    }
    let txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    let words = txt.split(' ');
    let lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.'
    if (abbrevs.hasOwnProperty(lastWord) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };
  var isSentence$1 = isSentence;

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;
  const hasLetter = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;

  const splitSentences = function (text, model) {
    let abbrevs = model.one.abbreviations || new Set();
    text = text || '';
    text = String(text);
    let sentences = [];
    // First do a greedy-split..
    let chunks = [];
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return sentences
    }
    // cleanup unicode-spaces
    text = text.replace('\xa0', ' ');
    // Start somewhere:
    let splits = basicSplit$1(text);
    // Filter-out the crap ones
    for (let i = 0; i < splits.length; i++) {
      let s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething.test(s) === false || hasLetter.test(s) === false) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          splits[i + 1] = s + splits[i + 1];
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(s);
    }
    //detection of non-sentence chunks:
    //loop through these chunks, and join the non-sentence chunks back together..
    for (let i = 0; i < chunks.length; i++) {
      let c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && isSentence$1(c, abbrevs, hasLetter) === false) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      let ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };
  var sentence = splitSentences;

  const hasHyphen = function (str, model) {
    let parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    //dont split 're-do'
    if (prefixes.hasOwnProperty(parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (suffixes.hasOwnProperty(parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    let reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    let reg2 = /^([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens = function (word) {
    let arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    let found = word.match(/[-–—]/);
    if (found && found[0]) {
      whichDash = found;
    }
    for (let o = 0; o < hyphens.length; o++) {
      if (o === hyphens.length - 1) {
        arr.push(hyphens[o]);
      } else {
        arr.push(hyphens[o] + whichDash);
      }
    }
    return arr
  };

  // combine '2 - 5' like '2-5' is
  // 2-4: 2, 4
  const combineRanges = function (arr) {
    const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
    const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
    for (let i = 0; i < arr.length - 1; i += 1) {
      if (arr[i + 1] && startRange.test(arr[i]) && endRange.test(arr[i + 1])) {
        arr[i] = arr[i] + arr[i + 1];
        arr[i + 1] = null;
      }
    }
    return arr
  };
  var combineRanges$1 = combineRanges;

  const isSlash = /[a-z] ?\/ ?[a-z]+$/;
  // 'he / she' should be one word
  const combineSlashes = function (arr) {
    for (let i = 1; i < arr.length - 1; i++) {
      if (isSlash.test(arr[i])) {
        arr[i - 1] += arr[i] + arr[i + 1];
        arr[i] = null;
        arr[i + 1] = null;
      }
    }
    return arr
  };
  var combineSlashes$1 = combineSlashes;

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  let notWord = ['.', '?', '!', ':', ';', '-', '–', '—', '--', '...', '(', ')', '[', ']', '"', "'", '`'];
  notWord = notWord.reduce((h, c) => {
    h[c] = true;
    return h
  }, {});

  const isArray = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str = str || '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen(words[i], model) === true) {
        arr = arr.concat(splitHyphens(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      let word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) === true && notWord.hasOwnProperty(word) === false && isBoundary.test(word) === false) {
        //put whitespace on end of previous term, if possible
        if (result.length > 0) {
          result[result.length - 1] += carry;
          result.push(word);
        } else {
          //otherwise, but whitespace before
          result.push(carry + word);
        }
        carry = '';
      } else {
        carry += word;
      }
    }
    //handle last one
    if (carry) {
      if (result.length === 0) {
        result[0] = '';
      }
      result[result.length - 1] += carry; //put it on the end
    }
    // combine 'one / two'
    result = combineSlashes$1(result);
    result = combineRanges$1(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };
  var term = splitWords;

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation
  //we have slightly different rules for start/end - like #hashtags.
  const startings =
    /^[ \n\t.[\](){}⟨⟩:,،、‒–—―…!‹›«»‐\-?‘’;/⁄·&*•^†‡°¡¿※№÷×ºª%‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022\uFF02\u0027\u201C\u201F\u201B\u201E\u2E42\u201A\u2035\u2036\u2037\u301D\u0060\u301F]+/;
  const endings =
    /[ \n\t.'[\](){}⟨⟩:,،、‒–—―…!‹›«»‐\-?‘’;/⁄·&*@•^†‡°¡¿※#№÷×ºª‰+−=‱¶′″‴§~|‖¦©℗®℠™¤₳฿\u0022\uFF02\u201D\u00B4\u301E]+$/;
  const hasApostrophe$1 = /['’]/;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const minusNumber = /^[-+.][0-9]/;
  const shortYear = /^'[0-9]{2}/;

  const normalizePunctuation = function (str) {
    let original = str;
    let pre = '';
    let post = '';
    // number cleanups
    str = str.replace(startings, found => {
      pre = found;
      // support '-40'
      if ((pre === '-' || pre === '+' || pre === '.') && minusNumber.test(str)) {
        pre = '';
        return found
      }
      // support years like '97
      if (pre === `'` && shortYear.test(str)) {
        pre = '';
        return found
      }
      return ''
    });
    str = str.replace(endings, found => {
      post = found;
      // keep s-apostrophe - "flanders'" or "chillin'"
      if (hasApostrophe$1.test(found) && /[sn]['’]$/.test(original) && hasApostrophe$1.test(pre) === false) {
        post = post.replace(hasApostrophe$1, '');
        return `'`
      }
      //keep end-period in acronym
      if (hasAcronym.test(str) === true) {
        post = post.replace(/\./, '');
        return '.'
      }
      return ''
    });
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      original = original.replace(/ *$/, after => {
        post = after || '';
        return ''
      });
      str = original;
      pre = '';
    }
    return { str, pre, post }
  };
  var tokenize$2 = normalizePunctuation;

  const parseTerm = txt => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$2(txt);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };
  var whitespace = parseTerm;

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    let original = str;
    //punctuation
    str = str.replace(/[,;.!?]+$/, '');
    //coerce Unicode ellipses
    str = str.replace(/\u2026/g, '...');
    //en-dash
    str = str.replace(/\u2013/g, '-');
    //strip leading & trailing grammatical punctuation
    if (/^[:;]/.test(str) === false) {
      str = str.replace(/\.{3,}$/g, '');
      str = str.replace(/[",.!:;?)]+$/g, '');
      str = str.replace(/^['"(]+/g, '');
    }
    // remove zero-width characters
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
    //do this again..
    str = str.trim();
    //oh shucks,
    if (str === '') {
      str = original;
    }
    //no-commas in numbers
    str = str.replace(/([0-9]),([0-9])/g, '$1$2');
    return str
  };
  var cleanup = clean;

  const periodAcronym$1 = /([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /([a-z]\.)+[a-z]\.?$/;

  const isAcronym$1 = function (str) {
    //like N.D.A
    if (periodAcronym$1.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym$1.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym$1.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym$1.test(str) === true) {
      return true
    }
    return false
  };

  const doAcronym = function (str) {
    if (isAcronym$1(str)) {
      str = str.replace(/\./g, '');
    }
    return str
  };
  var doAcronyms = doAcronym;

  const normalize = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = cleanup(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronyms(str);
    term.normal = str;
  };
  var normal = normalize;

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    let chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };
  var killUnicode$1 = killUnicode;

  // turn a string input into a 'document' json format
  const fromString = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    let sentences = splitSentences(input, model);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(splitWhitespace);
      // add normalized term format, always
      terms.forEach((t) => {
        normal(t, world);
      });
      return terms
    });
    return input
  };

  var methods$4 = {
    one: {
      killUnicode: killUnicode$1,
      tokenize: {
        splitSentences: sentence,
        splitTerms: term,
        splitWhitespace: whitespace,
        fromString,
      },
    },
  };

  const aliases = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
  };
  var aliases$1 = aliases;

  var misc$1 = [
    'approx',
    'apt',
    'bc',
    'cyn',
    'eg',
    'esp',
    'est',
    'etc',
    'ex',
    'exp',
    'prob', //probably
    'pron', // Pronunciation
    'gal', //gallon
    'min',
    'pseud',
    'fig', //figure
    'jd',
    'lat', //latitude
    'lng', //longitude
    'vol', //volume
    'fm', //not am
    'def', //definition
    'misc',
    'plz', //please
    'ea', //each
    'ps',
    'sec', //second
    'pt',
    'pref', //preface
    'pl', //plural
    'pp', //pages
    'qt', //quarter
    'fr', //french
    'sq',
    'nee', //given name at birth
    'ss', //ship, or sections
    'tel',
    'temp',
    'vet',
    'ver', //version
    'fem', //feminine
    'masc', //masculine
    'eng', //engineering/english
    'adj', //adjective
    'vb', //verb
    'rb', //adverb
    'inf', //infinitive
    'situ', // in situ
    'vivo',
    'vitro',
    'wr', //world record
  ];

  var honorifics = [
    'adj',
    'adm',
    'adv',
    'asst',
    'atty',
    'bldg',
    'brig',
    'capt',
    'cmdr',
    'comdr',
    'cpl',
    'det',
    'dr',
    'esq',
    'gen',
    'gov',
    'hon',
    'jr',
    'llb',
    'lt',
    'maj',
    'messrs',
    'mister',
    'mlle',
    'mme',
    'mr',
    'mrs',
    'ms',
    'mstr',
    'phd',
    'prof',
    'pvt',
    'rep',
    'reps',
    'res',
    'rev',
    'sen',
    'sens',
    'sfc',
    'sgt',
    'sir',
    'sr',
    'supt',
    'surg',
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$1 = [
    'ad',
    'al',
    'arc',
    'ba',
    'bl',
    'ca',
    'cca',
    'col',
    'corp',
    'ft',
    'fy',
    'ie',
    'lit',
    'ma',
    'md',
    'pd',
    'tce',
  ];

  var organizations = ['dept', 'univ', 'assn', 'bros', 'inc', 'ltd', 'co'];

  var places = [
    'rd',
    'st',
    'dist',
    'mt',
    'ave',
    'blvd',
    'cl',
    // 'ct',
    'cres',
    'hwy',
    //states
    'ariz',
    'cal',
    'calif',
    'colo',
    'conn',
    'fla',
    'fl',
    'ga',
    'ida',
    'ia',
    'kan',
    'kans',

    'minn',
    'neb',
    'nebr',
    'okla',
    'penna',
    'penn',
    'pa',
    'dak',
    'tenn',
    'tex',
    'ut',
    'vt',
    'va',
    'wis',
    'wisc',
    'wy',
    'wyo',
    'usafa',
    'alta',
    'ont',
    'que',
    'sask',
  ];

  // units that are abbreviations too
  var units = [
    'dl',
    'ml',
    'gal',
    'ft', //ambiguous
    'qt',
    'pt',
    'tbl',
    'tsp',
    'tbsp',
    'km',
    'dm', //decimeter
    'cm',
    'mm',
    'mi',
    'td',
    'hr', //hour
    'hrs', //hour
    'kg',
    'hg',
    'dg', //decigram
    'cg', //centigram
    'mg', //milligram
    'µg', //microgram
    'lb', //pound
    'oz', //ounce
    'sq ft',
    'hz', //hertz
    'mps', //meters per second
    'mph',
    'kmph', //kilometers per hour
    'kb', //kilobyte
    'mb', //megabyte
    'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    'pa', //ambig
    'fl oz', //

    'yb',
  ];

  // add our abbreviation list to our lexicon
  let list = [
    [misc$1],
    [units, 'Unit'],
    [nouns$1, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  let abbreviations = {};
  // add them to a future lexicon
  let lexicon$4 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$4[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$4[w] = [lexicon$4[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history'
  var prefixes = [
    'anti',
    'bi',
    'co',
    'contra',
    'counter',
    'de',
    'extra',
    'infra',
    'inter',
    'intra',
    'macro',
    'micro',
    'mid',
    'mis',
    'mono',
    'multi',
    'non',
    'over',
    'peri',
    'post',
    'pre',
    'pro',
    'proto',
    'pseudo',
    're',
    'semi',
    'sub',
    // 'super', //'super-cool'
    'supra',
    'trans',
    'tri',
    // 'ultra', //'ulta-cool'
    'un',
    'out',
    // 'under',
    // 'whole',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'
  var suffixes = {
    'like': true,
    'ish': true,
    'less': true,
    'able': true,
    'elect': true,
    'type': true,
    'designate': true,
    // 'fold':true,
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E
  let compact$1 = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'µÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰμυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  let unicode$2 = {};
  Object.keys(compact$1).forEach(function (k) {
    compact$1[k].split('').forEach(function (s) {
      unicode$2[s] = k;
    });
  });
  var unicode$3 = unicode$2;

  var model$4 = {
    one: {
      aliases: aliases$1,
      abbreviations,
      prefixes,
      suffixes,
      lexicon: lexicon$4, //give this one forward
      unicode: unicode$3,
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    let str = term.normal || term.text;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (aliases.hasOwnProperty(str)) {
      term.alias = term.alias || [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      let arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 2) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias = term.alias || [];
            term.alias.push(word);
          }
        });
      }
    }
    // aliases for apostrophe-s
    // if (hasApostrophe.test(str)) {
    //   let main = str.replace(hasApostrophe, '').trim()
    //   term.alias = term.alias || []
    //   term.alias.push(main)
    // }
    return term
  };
  var alias = addAliases;

  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (/^(re|un)-?[^aeiou]./.test(str) === true) {
      str = str.replace('-', '');
    }

    //#tags, @mentions
    str = str.replace(/^[#@]/, '');
    if (str !== term.normal) {
      term.machine = str;
    }
  };
  var machine = doMachine;

  // sort words by frequency
  const freq = function (view) {
    let docs = view.docs;
    let counts = {};
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        counts[word] = counts[word] || 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };
  var freq$1 = freq;

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    let docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        term.offset = {
          index: index,
          start: elapsed + term.pre.length,
          length: term.text.length,
        };
        elapsed += term.pre.length + term.text.length + term.post.length;
        index += 1;
      }
    }
  };


  var offset$1 = offset;

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    let document = view.document;
    for (let n = 0; n < document.length; n += 1) {
      for (let i = 0; i < document[n].length; i += 1) {
        document[n][i].index = [n, i];
      }
    }
    // let ptrs = b.fullPointer
    // console.log(ptrs)
    // for (let i = 0; i < docs.length; i += 1) {
    //   const [n, start] = ptrs[i]
    //   for (let t = 0; t < docs[i].length; t += 1) {
    //     let term = docs[i][t]
    //     term.index = [n, start + t]
    //   }
    // }
  };

  var index$1 = index;

  const wordCount = function (view) {
    let n = 0;
    let docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        if (docs[i][t].normal === '') {
          continue //skip implicit words
        }
        n += 1;
        docs[i][t].wordCount = n;
      }
    }
  };

  var wordCount$1 = wordCount;

  // cheat-method for a quick loop
  const termLoop = function (view, fn) {
    let docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$3 = {
    alias: (view) => termLoop(view, alias),
    machine: (view) => termLoop(view, machine),
    normal: (view) => termLoop(view, normal),
    freq: freq$1,
    offset: offset$1,
    index: index$1,
    wordCount: wordCount$1,
  };
  var compute$4 = methods$3;

  var tokenize$1 = {
    compute: compute$4,
    methods: methods$4,
    model: model$4,
    hooks: ['alias', 'machine', 'index', 'id'],
  };

  // const plugin = function (world) {
  //   let { methods, model, parsers } = world
  //   Object.assign({}, methods, _methods)
  //   Object.assign(model, _model)
  //   methods.one.tokenize.fromString = tokenize
  //   parsers.push('normal')
  //   parsers.push('alias')
  //   parsers.push('machine')
  //   // extend View class
  //   // addMethods(View)
  // }
  // export default plugin

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize = function (phrase, world) {
    const { methods, model } = world;
    let terms = methods.one.tokenize.splitTerms(phrase, model).map(methods.one.tokenize.splitWhitespace);
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    let goNext = [{}];
    let endAs = [null];
    let failTo = [0];

    let xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      let words = tokenize(phrase, world);
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (goNext[curr] && goNext[curr].hasOwnProperty(word)) {
          curr = goNext[curr][word];
        } else {
          n++;
          goNext[curr][word] = n;
          goNext[n] = {};
          curr = n;
          endAs[n] = null;
        }
      }
      endAs[curr] = [words.length];
    });
    // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
    for (let word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length) {
      let r = xs.shift();
      // for each symbol a such that g(r, a) = s
      let keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        let word = keys[i];
        let s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !goNext[n].hasOwnProperty(word)) {
          n = failTo[n];
        }
        if (goNext.hasOwnProperty(n)) {
          let fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] = endAs[s] || [];
            endAs[s] = endAs[s].concat(endAs[fs]);
          }
        } else {
          failTo[s] = 0;
        }
      }
    }
    return { goNext, endAs, failTo }
  };
  var build = buildTrie;

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    let results = [];
    for (let i = 0; i < terms.length; i++) {
      let word = terms[i][opts.form] || terms[i].normal;
      // main match-logic loop:
      while (n > 0 && (trie.goNext[n] === undefined || !trie.goNext[n].hasOwnProperty(word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!trie.goNext[n].hasOwnProperty(word)) {
        continue
      }
      n = trie.goNext[n][word];
      if (trie.endAs[n]) {
        let arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          let len = arr[o];
          let term = terms[i - len + 1];
          let [no, start] = term.index;
          results.push([no, start, start + len, term.id]);
        }
      }
    }
    return results
  };

  const cacheMiss = function (words, cache) {
    for (let i = 0; i < words.length; i += 1) {
      if (cache.has(words[i]) === true) {
        return false
      }
    }
    return true
  };

  const scan = function (view, trie, opts) {
    let results = [];
    opts.form = opts.form || 'normal';
    let docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    let firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      let terms = docs[i];
      let found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };
  var scan$1 = scan;

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$3 (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      let trie = isObject$1(input) ? input : build(input, this.world);
      let res = scan$1(this, trie, opts);
      res = res.settle();
      return res
    };
  }

  // chop-off tail of redundant vals at end of array
  const truncate = (list, val) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] !== val) {
        list = list.slice(0, i + 1);
        return list
      }
    }
    return list
  };

  // prune trie a bit
  const compress = function (trie) {
    trie.goNext = trie.goNext.map(o => {
      if (Object.keys(o).length === 0) {
        return undefined
      }
      return o
    });
    // chop-off tail of undefined vals in goNext array
    trie.goNext = truncate(trie.goNext, undefined);
    // chop-off tail of zeros in failTo array
    trie.failTo = truncate(trie.failTo, 0);
    // chop-off tail of nulls in endAs array
    trie.endAs = truncate(trie.endAs, null);
    return trie
  };
  var compress$1 = compress;

  /** pre-compile a list of matches to lookup */
  const lib$2 = {
    /** turn an array or object into a compressed trie*/
    compile: function (input) {
      const trie = build(input, this.world());
      return compress$1(trie)
    }
  };

  var lookup = {
    api: api$3,
    lib: lib$2
  };

  const createCache = function (document) {
    let cache = document.map(terms => {
      let stuff = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          stuff.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          stuff.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          stuff.add(term.implicit);
        }
        let tags = Array.from(term.tags);
        for (let t = 0; t < tags.length; t += 1) {
          stuff.add('#' + tags[t]);
        }
      });
      return stuff
    });
    return cache
  };
  var cacheDoc = createCache;

  const cacheMatch = function (regs) {
    // parse match strings
    let need = new Set();
    regs.forEach(reg => {
      // negatives can't be cached
      if (reg.optional === true || reg.negative === true) {
        return
      }
      if (reg.tag) {
        need.add('#' + reg.tag);
      }
      if (reg.word) {
        need.add(reg.word);
      }
    });
    return need
  };
  var cacheMatch$1 = cacheMatch;

  var methods$2 = {
    one: {
      cacheDoc,
      cacheMatch: cacheMatch$1,
    },
  };

  const methods$1 = {
    /** */
    cache: function () {
      this._cache = this.methods.one.cacheDoc(this.document);
      return this
    },
    /** */
    uncache: function () {
      this._cache = null;
      return this
    },
  };
  const addAPI = function (View) {
    Object.assign(View.prototype, methods$1);
  };
  var api$2 = addAPI;

  var compute$3 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: api$2,
    compute: compute$3,
    methods: methods$2,
  };

  // lookup last word in the type-ahead prefixes
  const typeahead$1 = function (view) {
    const prefixes = view.model.one.typeahead;
    const docs = view.docs;
    if (docs.length === 0 || Object.keys(prefixes).length === 0) {
      return
    }
    let lastPhrase = docs[docs.length - 1] || [];
    let lastTerm = lastPhrase[lastPhrase.length - 1];
    // if we've already put whitespace, end.
    if (lastTerm.post) {
      return
    }
    // if we found something
    if (prefixes.hasOwnProperty(lastTerm.normal)) {
      let found = prefixes[lastTerm.normal];
      // add full-word as an implicit result
      lastTerm.implicit = found;
      lastTerm.machine = found;
      lastTerm.typeahead = true;
      // tag it, as our assumed term
      if (view.compute.preTagger) {
        view.last().unTag('*').compute(['lexicon', 'preTagger']);
      }
    }
  };

  var compute$2 = { typeahead: typeahead$1 };

  // assume any discovered prefixes
  const autoFill = function () {
    const docs = this.docs;
    if (docs.length === 0) {
      return this
    }
    let lastPhrase = docs[docs.length - 1] || [];
    let term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api = function (View) {
    View.prototype.autoFill = autoFill;
  };
  var api$1 = api;

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    let collisions = [];
    let existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        let prefix = str.substr(0, size);
        // ensure prefix is not a word
        if (opts.safe && world.model.one.lexicon.hasOwnProperty(prefix)) {
          continue
        }
        // does it already exist?
        if (existing.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (index.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = Object.assign({}, existing, index);
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  var allPrefixes = getPrefixes;

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    let model = this.model();
    opts = Object.assign({}, defaults, opts);
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    let prefixes = allPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (model.one.typeahead.hasOwnProperty(str)) {
        delete model.one.typeahead[str];
        return
      }
      model.one.typeahead[str] = prefixes[str];
    });
    return this
  };

  var lib$1 = {
    typeahead: prepare
  };

  const model$3 = {
    one: {
      typeahead: {} //set a blank key-val
    }
  };
  var typeahead = {
    model: model$3,
    api: api$1,
    lib: lib$1,
    compute: compute$2,
    hooks: ['typeahead']
  };

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const checkMulti = function (terms, i, lexicon, setTag, world) {
    let max = i + 4 > terms.length ? terms.length - i : 4;
    let str = terms[i].machine || terms[i].normal;
    for (let skip = 1; skip < max; skip += 1) {
      let t = terms[i + skip];
      let word = t.machine || t.normal;
      str += ' ' + word;
      if (lexicon.hasOwnProperty(str) === true) {
        let tag = lexicon[str];
        let ts = terms.slice(i, i + skip + 1);
        setTag(ts, tag, world, false, '1-multi-lexicon');
        return true
      }
    }
    return false
  };

  const multiWord = function (terms, i, world) {
    const { model, methods } = world;
    // const { fastTag } = methods.one
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const lexicon = model.one.lexicon || {};
    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // multi-word lookup
    if (terms[i + 1] !== undefined && multi[word] === true) {
      return checkMulti(terms, i, lexicon, setTag, world)
    }
    return null
  };
  var multiWord$1 = multiWord;

  const prefix$2 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const lexicon = model.one.lexicon;

    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      let tag = lexicon[word];
      setTag([t], tag, world, false, '1-lexicon');
      // fastTag(t, tag, '1-lexicon')
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      let found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        let tag = lexicon[found];
        setTag([t], tag, world, '1-lexicon-alias');
        // fastTag(t, tag, '1-lexicon-alias')
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$2.test(word) === true) {
      let stem = word.replace(prefix$2, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, '1-lexicon-prefix');
          // fastTag(t, lexicon[stem], '1-lexicon-prefix')
          return true
        }
      }
    }
    return null
  };
  var singleWord = checkLexicon;

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const firstPass$1 = function (view) {
    const world = view.world;
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found = found || multiWord$1(terms, i, world);
          // lookup known words
          found = found || singleWord(terms, i, world);
        }
      }
    });
  };

  var compute$1 = {
    lexicon: firstPass$1
  };

  // derive clever things from our lexicon key-value pairs
  const expand$1 = function (words) {
    // const { methods, model } = world
    let lex = {};
    // console.log('start:', Object.keys(lex).length)
    let _multi = {};

    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      let tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      // cache multi-word terms
      let split = word.split(/ /);
      if (split.length > 1) {
        _multi[split[0]] = true;
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };
  var expandLexicon = expand$1;

  var methods = {
    one: {
      expandLexicon,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords = function (words) {
    const world = this.world();
    const { methods, model } = world;
    if (!words) {
      return
    }
    // normalize tag vals
    Object.keys(words).forEach(k => {
      if (typeof words[k] === 'string' && words[k].startsWith('#')) {
        words[k] = words[k].replace(/^#/, '');
      }
    });
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      let { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else if (methods.one.expandLexicon) {
      // do basic ./one version
      let { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else {
      //no fancy-business
      Object.assign(model.one.lexicon, words);
    }
  };

  var lib = { addWords };

  const model$2 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
    }
  };

  var lexicon$3 = {
    model: model$2,
    methods,
    compute: compute$1,
    lib,
    hooks: ['lexicon']
  };

  var contractions$4 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gtg', out: ['got', 'to', 'go'] },
    { word: 'im', out: ['i', 'am'] },
    { word: 'imma', out: ['I', 'will'] },
    { word: 'imo', out: ['in', 'my', 'opinion'] },
    { word: 'irl', out: ['in', 'real', 'life'] },
    { word: 'ive', out: ['i', 'have'] },
    { word: 'rn', out: ['right', 'now'] },
    { word: 'tbh', out: ['to', 'be', 'honest'] },
    { word: 'wanna', out: ['want', 'to'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },

    // { after: `cause`, out: ['because'] },
    { word: "'tis", out: ['it', 'is'] },
    { word: "'twas", out: ['it', 'was'] },
    { word: 'twas', out: ['it', 'was'] },
    { word: 'y\'know', out: ['you', 'know'] },
    { word: "ne'er", out: ['never'] },
    { word: "o'er ", out: ['over'] },
    // contraction-part mappings
    { after: 'll', out: ['will'] },
    { after: 've', out: ['have'] },
    { after: 're', out: ['are'] },
    { after: 'm', out: ['am'] },
    // french contractions
    { before: 'c', out: ['ce'] },
    { before: 'm', out: ['me'] },
    { before: 'n', out: ['ne'] },
    { before: 'qu', out: ['que'] },
    { before: 's', out: ['se'] },
    { before: 't', out: ['tu'] }, // t'aime
    // more-complex ones
    // { after: 's', out: apostropheS }, //spencer's
    // { after: 'd', out: apostropheD }, //i'd
    // { after: 't', out: apostropheT }, //isn't
    // { before: 'l', out: preL }, // l'amour
    // { before: 'd', out: preD }, // d'amerique
  ];

  var model$1 = { one: { contractions: contractions$4 } };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    let [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      return word
    });
    if (words[0]) {
      // move whitespace over
      words[0].pre = document[n][w].pre;
      words[words.length - 1].post = document[n][w].post;
      // add the text/normal to the first term
      words[0].text = document[n][w].text;
      words[0].normal = document[n][w].normal; // move tags too?
    }
    // do the splice
    document[n].splice(w, 1, ...words);
  };
  var splice = insertContraction;

  const hasContraction$2 = /'/;
  //look for a past-tense verb
  // const hasPastTense = (terms, i) => {
  //   let after = terms.slice(i + 1, i + 3)
  //   return after.some(t => t.tags.has('PastTense'))
  // }
  // he'd walked -> had
  // how'd -> did
  // he'd go -> would

  const alwaysDid = new Set([
    'what',
    'how',
    'when',
    'where',
    'why',
  ]);

  // after-words
  const useWould = new Set([
    'be',
    'go',
    'start',
    'think',
    'need',
  ]);

  const useHad = new Set([
    'been',
    'gone'
  ]);
  // they'd gone
  // they'd go


  // he'd been
  //    he had been
  //    he would been

  const _apostropheD = function (terms, i) {
    let before = terms[i].normal.split(hasContraction$2)[0];

    // what'd, how'd
    if (alwaysDid.has(before)) {
      return [before, 'did']
    }
    if (terms[i + 1]) {
      // they'd gone
      if (useHad.has(terms[i + 1].normal)) {
        return [before, 'had']
      }
      // they'd go
      if (useWould.has(terms[i + 1].normal)) {
        return [before, 'would']
      }
    }
    return null
    //   if (hasPastTense(terms, i) === true) {
    //     return [before, 'had']
    //   }
    //   // had/would/did
    //   return [before, 'would']
  };
  var apostropheD = _apostropheD;

  const hasContraction$1 = /'/;

  const isHas = (terms, i) => {
    //look for a past-tense verb
    let after = terms.slice(i + 1, i + 3);
    return after.some(t => t.tags.has('PastTense'))
  };

  // 's -> [possessive, 'has', or 'is']
  const apostropheS = function (terms, i) {
    // possessive, is/has
    let before = terms[i].normal.split(hasContraction$1)[0];
    // spencer's got -> 'has'
    if (isHas(terms, i)) {
      return [before, 'has']
    }
    // let's
    if (before === 'let') {
      return [before, 'us']
    }
    // allow slang "there's" -> there are
    if (before === 'there') {
      let nextTerm = terms[i + 1];
      if (nextTerm && nextTerm.tags.has('Plural')) {
        return [before, 'are']
      }
    }
    return [before, 'is']
  };
  var apostropheS$1 = apostropheS;

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    let before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  var apostropheT$1 = apostropheT;

  const hasContraction = /'/;

  // l'amour
  const preL = (terms, i) => {
    // le/la
    let after = terms[i].normal.split(hasContraction)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    let after = terms[i].normal.split(hasContraction)[1];
    // quick guess for noun-agreement (rough)
    if (after && after.endsWith('e')) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    let after = terms[i].normal.split(hasContraction)[1];
    return ['je', after]
  };

  var french = {
    preJ,
    preL,
    preD,
  };

  const isRange = /^([0-9.]{1,3}[a-z]{0,2}) ?[-–—] ?([0-9]{1,3}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;

  const numberRange = function (terms, i) {
    let term = terms[i];
    if (term.tags.has('PhoneNumber') === true) {
      return null
    }
    let parts = term.text.match(isRange);
    if (parts !== null) {
      return [parts[1], 'to', parts[2]]
    } else {
      parts = term.text.match(timeRange);
      if (parts !== null) {
        return [parts[1], 'to', parts[4]]
      }
    }
    return null
  };
  var numberRange$1 = numberRange;

  // always a contracttion
  const always = new Set([
    'here',
    'there',
    'she',
    'it',
    'he',
    'that',
    'here',
    'there',
    'your',
    'who',
    'what',
    'where',
    'why',
    'when',
    'how',
    'let',
    'else',
    'name', //name's dave
    // 'god', //god's gift
  ]);

  // // spencer's cool
  const afterYes = new Set([
    // adverbs
    'really',
    'very',
    'barely',
    'also',
    'not',
    'just',
    'more',
    'only',
    'often',
    'quite',
    'so',
    'too',
    'well',
  ]);

  const shouldSplit = (terms, i) => {
    let term = terms[i];

    const byApostrophe = /'s/;
    let [before] = term.normal.split(byApostrophe);
    if (always.has(before)) {
      return true
    }

    // gandhi's so cool
    let nextTerm = terms[i + 1];
    if (nextTerm && afterYes.has(nextTerm.normal)) {
      return true
    }

    // default to posessive
    return false
  };
  var shouldSplit$1 = shouldSplit;

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view) {
    let tmp = view.update();
    tmp.document = [terms];
    tmp.compute(['lexicon', 'preTagger', 'index']);
  };

  const byEnd = {
    // ain't
    t: (terms, i) => apostropheT$1(terms, i),
    // how'd
    d: (terms, i) => apostropheD(terms, i),
    // bob's
    s: (terms, i) => {
      // [bob's house] vs [bob's cool]
      if (shouldSplit$1(terms, i) === true) {
        return apostropheS$1(terms, i)
      }
      return null
    },
  };

  const byStart = {
    // j'aime
    j: (terms, i) => french.preJ(terms, i),
    // l'amour
    l: (terms, i) => french.preL(terms, i),
    // d'amerique
    d: (terms, i) => french.preD(terms, i),
  };

  // pull-apart known contractions from model
  const knownOnes = function (list, term, before, after) {
    for (let i = 0; i < list.length; i += 1) {
      let o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs = function (words, view) {
    return view.fromText(words.join(' ')).docs[0]
  };

  //really easy ones
  const contractions$2 = (view) => {
    let { world, document } = view;
    const { model, methods } = world;
    let list = model.one.contractions || [];
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          [before, after] = terms[i].normal.split(byApostrophe);
        }
        // any known-ones, like 'dunno'?
        let words = knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && byEnd.hasOwnProperty(after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && byStart.hasOwnProperty(before)) {
          words = byStart[before](terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          reTag(document[n], view);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange$1(terms, i);
          if (words) {
            words = toDocs(words, view);
            splice(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world);//add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world);
            }
            reTag(document[n], view);
          }
        }
      }
    });
  };
  var contractions$3 = contractions$2;

  var compute = { contractions: contractions$3 };

  const plugin = {
    model: model$1,
    compute: compute,
    hooks: ['contractions'],
  };
  var contractions$1 = plugin;

  nlp$1.extend(change); //0kb
  nlp$1.extend(output); //0kb
  nlp$1.extend(match); //10kb
  nlp$1.extend(pointers); //2kb
  nlp$1.extend(tag); //2kb
  nlp$1.plugin(contractions$1); //~6kb
  nlp$1.extend(tokenize$1); //7kb
  nlp$1.plugin(cache$1); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$3); //1kb

  const prefix$1 = /^.([0-9]+)/;

  // handle compressed form of key-value pair
  const getKeyVal = function (word, model) {
    let val = model.exceptions[word];
    let m = val.match(prefix$1);
    if (m === null) {
      // return not compressed form
      return model.exceptions[word]
    }
    // uncompress it
    let num = Number(m[1]) || 0;
    let pre = word.substr(0, num);
    return pre + val.replace(prefix$1, '')
  };

  // get suffix-rules according to last char of word
  const getRules = function (word, rules = {}) {
    let char = word[word.length - 1];
    let list = rules[char] || [];
    // do we have a generic suffix?
    if (rules['']) {
      list = list.concat(rules['']);
    }
    return list
  };

  const convert = function (word, model, debug) {
    // check list of irregulars
    if (model.exceptions.hasOwnProperty(word)) {
      if (debug) {
        console.log("exception, ", word, model.exceptions[word]);
      }
      return getKeyVal(word, model)
    }
    // if model is reversed, try rev rules
    let rules = model.rules;
    if (model.reversed) {
      rules = model.rev;
    }
    // try suffix rules
    rules = getRules(word, rules);
    for (let i = 0; i < rules.length; i += 1) {
      let suffix = rules[i][0];
      if (word.endsWith(suffix)) {
        if (debug) {
          console.log("rule, ", rules[i]);
        }
        let reg = new RegExp(suffix + '$');
        return word.replace(reg, rules[i][1])
      }
    }
    if (debug) {
      console.log(' x - ' + word);
    }
    // return the original word unchanged
    return word
  };
  var convert$1 = convert;

  // index rules by last-char
  const indexRules = function (rules) {
    let byChar = {};
    rules.forEach((a) => {
      let suff = a[0] || '';
      let char = suff[suff.length - 1] || '';
      byChar[char] = byChar[char] || [];
      byChar[char].push(a);
    });
    return byChar
  };

  const prefix = /^([0-9]+)/;

  const expand = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix);
    if (m === null) {
      return [key, val]
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix, '');
    return [key, full]
  };

  const toArray$1 = function (txt) {
    const pipe = /\|/;
    return txt.split(/,/).map(str => {
      let a = str.split(pipe);
      return expand(a[0], a[1])
    })
  };

  const uncompress = function (model = {}) {
    model = Object.assign({}, model);

    // compress fwd rules
    model.rules = toArray$1(model.rules);
    model.rules = indexRules(model.rules);

    // compress reverse rules
    if (model.rev) {
      model.rev = toArray$1(model.rev);
      model.rev = indexRules(model.rev);
    }

    // compress exceptions
    model.exceptions = toArray$1(model.exceptions);
    model.exceptions = model.exceptions.reduce((h, a) => {
      h[a[0]] = a[1];
      return h
    }, {});
    return model
  };
  var uncompress$1 = uncompress;

  // console.log(expand('fixture', '6ing'))
  // console.log(toArray('heard|4'))

  const reverseObj = function (obj) {
    return Object.entries(obj).reduce((h, a) => {
      h[a[1]] = a[0];
      return h
    }, {})
  };

  const reverse = function (model) {
    let { rules, exceptions, rev } = model;
    exceptions = reverseObj(exceptions);
    return {
      reversed: !Boolean(model.reversed),//toggle this
      rules,
      exceptions,
      rev
    }
  };
  var reverse$1 = reverse;

  // generated in ./learn/tiger/conjugate
  var presentModel = {
    rules: '.5t¦aLbKcHeDfindRgreChaftRiBleiMn9o8r6s4t3u2we1ä0ü0;mmN;ndPrtP;ldGndL;attNeuKriL;peisMt0;ellLi4rebL;eiFs0teilK;etzJt7;niGppE;giFko0st5tiF;mmG;cEndCsiDtiD;ifEnzE;i2r0st1;g0iA;ehB;g7n2;h0ki7;aff8t0;ig7;leib6ring6;c4gi3mm2nd1us0;ch4;eln;ern;er1;ht0;en|.6t¦chaft2eu1hneid2mitteln,r0steuern;a0echn1i0;cht0;en|.2ifft¦treffen|.2icht¦brechen|.2immt¦nnehmen|.4le¦wickeln|.4t¦aVcSdPeLgiKharrYinJkIlFmEnCppeUr9s6t3us7w2z0ündY;ahlXeugXie0;hWlW;eisVirkV;e1i0s3;erTmmT;ilSllS;etzRiDorgRseQte1u0;chQ;hPln;e1gehOi0üH;erNngN;ckMdMifMnnM;de0geKi7;ln,rn;i5meF;angIeibIi0;e0ngH;gGrG;ehrFi1ommF;dEigE;erD;g2i1ndCrtCu0;eAtB;chAdAtA;e5n9;e1ie0;n7r7;ck6;h0ke1;au4e0n4;ln;ft2tt2u0;ch1e0;rn;en|wirbt¦werben|rifft¦reffen|hilft¦helfen|läuft¦laufen|fängt¦fangen|richt¦rechen|.5¦denken|nimmt¦nehmen|.2ßt¦passen|.2itt¦treten|gibt¦geben|.3t¦aNbeMdLeHfGgEhCiAkeMl9ndQo8peMr7s5t3u1ze6ße2ährQöpfQü0;ckPhrPtP;chOe0tO;rn;e0igMtM;hLrn;agKchKe0;ln;dIeuItIufI;mmHtzH;dGegGigG;chFe0mmFn7;gEhElEnErE;auDe0örD;bCrn;e0nB;hAln,rn;e5t9;ck8d8h2i1n0rr8tz8ug8;g7k7n7;b6f6h6l6n6s6ß6;l5n5r5;e0ig4;ln,rn;c1ff2h0mm2nk2rr2ub2;l1n1;h0k0;en|ilft¦elfen|sieht¦sehen|immt¦ehmen|ißt¦issen|ritt¦reten|.4¦ützen|.2t¦a8ch9e7ff9h6i5ll9mm9n4o3pf9r2tz9u1äg9ö0üh9;r8s8;b7g7;g6k6n6r6;b5l5;g4k4n4z4;g3l3n3;l2r2;g1r1u1;n0r0u0;en|gt¦gen|lt¦len|ut¦u0;en,n|xt¦xen|zt¦zen|ßt¦ßen|t¦en',
    exceptions: 'gilt¦gelten|hält¦halten|.8¦aJbeimessUeCfestlegUgefährdUherrüBmiAnachgFpläd9schrOt8v1z0;erse5usP;er0orE;büEdienRfa8helfRl2meidRs1tretRze0;ihQrrQ;pürPtoßPuO;a1e0;tzN;ngMufM;ang0end0;ierK;tteilJßaG;hrI;in5mp3nt0;s0wertG;innFt0;ehE;fi0;ndC;h3planB;b8n5u0;f2s0;blut8h0saug8weit8;alt7;d0werf6;eck5;ri1s0treff4;chau3;cht2;stamm1wei0;ch0;en|.7¦a8b3er2gesellEhingebErut1s0täu1vorsBzulD;chuldDprengDtrotzD;schC;blühBkaufBnä3zeugB;e0illigA;dank9gegn9harr9ke2r0st6wein9;aub8ü0;hr7;hr6nn6;ddier5n3u0;f0slös4;g0hör3;eh2;bahn1halt1p0weis1;ass0;en|.4ät¦ent0ver0;raten|weiß¦wissen|fällt¦fallen|.6¦a9b4ergBg2möchtEr1s0trinkEumg8zusagE;chämDpeisDtr7;auchCechnC;e0renzB;hörAlobA;e1re0;ch8nn8;g1h0;eb6üt6;eb5;b2n0;g0leg3r2;eh2;lös1r0;uf0;en|läßt¦lassen|.4ällt¦au2e1miß3v0z0;er2;in1nt1;f0s0;fallen|.4¦e1r0seh2töt2werd2;ed1uh1;bn0ss0;en|.5¦b8dehnBfü7ha6kaufBl5mü6prägBrü4s3t2w1z0;a6ehrAielA;erb9irk9;arn8rag8;org7par7;ck6hr6;aut5e4ieb5;ss4;hl3;a1e0;rg1ut1;ck0;en|rät¦raten|.9¦aAb6darstellBe4fe3gebrau2ignor7offenlegBrauskommBuntersagBver0überwa2;bleibAste0zi8;ck9ll9;ch8;rnhalt7ststeh7;n0rschöpf6xist2;gag1tfremd5;e1lock0;ier3;oba0schaff2tra0;cht1;nschick0ufbring0;en|.5ieht¦geschehen|.7t¦an9be8e4f2ge9heiratAs1tr0;ill5ockn9;chalt8pötteln;lü0ür0;cht6;nt2r0;inn0öffn4;ern;pupp2zwei2;last1scher1;biet0;en|.4ägt¦betr0schl0;agen|.10¦aBbevor9d7e4hinzu6offen9profitCrekl8unter3v0;er0orankommC;anlassBbrau0glei0schiebB;chA;halt9lieg9;in0rniedrig8xpand7;be0schlag7;zi3;iff0urchlauf5;am3;st0;eh2;bschneid1ppell0;ier0;en|.4ag¦vermögen|.5t¦auf8biet7ernt7g5ha4ko4l3ordn7pu4t1w0ähn2öffn7;alt6eh7idm6;a2e2it0r4;eln;a0i0;st2;enüg1l0;imm0;en;tun|.3ät¦b0g0;eraten|.8t¦au6behaup7ent4gest5sch3ver0;b1m1w0;al5üs5;ie4;immern,ütteln;f0las2;al1;flis0srüs0;ten|führen¦fahren|.4ält¦auf0ent0ver0;halten|.4ßt¦be0er0um0;fassen|.9t¦be1durchquer2ver0;markt1tröst1;fürcht0inhalt0;en|.4te¦freuen|.11¦autoris7be5gleichkomm8komm4präs4registr7unterdrück8v1zurück0;tret7zi5;ers0orbeifahr6;ch0treich5;ling4melz4wend4;ent2;einfluss2kanntgeb2reitst0;eh1;ier0;en|wirft¦werfen|.4icht¦verfechten|.4iehlt¦empfehlen|.7ägt¦au0ver1;f0s0;schlagen|.12¦be3durch2entschuld4kollabor1rechtfert4s0wiedertreff5zusammengeh5;icherstell4tabilis0;ier3;leucht2schlag2;absicht0schleun0;ig0;en|.13¦e0zurückerhalt2übereinstimm2;ntgegen0rwirtschaft1;nehm0steh0;en|.2ßt¦fa0kü0;ssen|.15¦aufrechterhalt0entgegenschlag0;en|.4t¦atm0bad0nütz0wat0;en|.5ält¦festhalten|Melden¦melden|Erteilt¦erteilen|.6ält¦durch0offen0vorbe0;halten|.5ägt¦bei1h0mit1v0;er0;tragen|Greift¦greifen|.3ält¦be0er0;halten|.6st¦anfleh1betteln,sch0wimmern;ick0rei0;en|Weißt¦weißen|Spürst¦spüren|.9ält¦gefangenhalten|.6t¦brü3ermüd4ge1innehab4kundtun,lei3s0wick2;chad3palt3;denk2iß0;eln;st0;en|wächst¦wachsen|.2ößt¦stoßen|.4ißt¦vergessen|.6te¦fertigen|.11t¦veranstalten|.3te¦fax0kos0;en|.4äßt¦aus0ent0ver0;lassen|liest¦lesen|.6ägt¦umschl0übertr0;agen|.3ällt¦ab0ge0um0;fallen|Tauschen¦tauschen|.3arf¦bedürfen|.2äbt¦graben|.3ährt¦an0er0;fahren|.10t¦mit0unterordn1ver0;schwimm0;en|.4illt¦schwellen|.14¦gegenüberstehen|.6irft¦unterwerfen|.4irft¦ent0ver0;werfen|.4irfst¦vorwerfen|.2äst¦blasen|Tagt¦tagen|.4irgt¦verbergen|.4äft¦schlafen|.2hlt¦malen|Gestatten¦gestatten|.5äßt¦überlassen|.6ällt¦unterfallen|.9ächst¦zusammenwachsen|Blüht¦blühen|mißt¦messen|.4ädt¦e0;in0nt0;laden|.3ißt¦zumessen|.3äßt¦belassen|.3ßt¦pressen|.7äßt¦h0;erein0inter0;lassen|.3irft¦abwerfen|.2dtschlägt¦totschlagen|Berücksichtigen¦berücksichtigen|.3ächst¦erwachsen|wäscht¦waschen|Offeriert¦offerieren|.8ßt¦bezuschussen|.3iehlt¦befehlen|.3gen¦folen|.2irbt¦sterben|.4ährt¦entfahren|.2icht¦stechen|.6ßt¦verblassen|.5ißt¦zerfressen|.7ält¦bereithalten|.7äft¦verschlafen|.6äßt¦unterlassen|lädt¦laden|.4ächst¦auswachsen|.4ingen¦auffangen|.2ißt¦fressen|.9ägt¦unterschlagen|.5irbt¦aussterben|.4irbt¦erst0verd0;erben|.7ällt¦hereinfallen|Telefoniert¦telefonieren|.2illt¦quellen|.10ßt¦zusammenfassen|.14t¦zurückvermieten|Bereinigt¦bereinigen|.3iert¦gebären|.5te¦schoten|.4ilzt¦schmelzen|.3äscht¦abwaschen|.5ällt¦überfallen|Wetten¦wetten|.8e¦be0;hi0wu0;ndern|.6e¦hung1koppeln,steu1w0;and0eig0;ern|.5e¦lagern,regeln|.7e¦annäh0bedau0;ern|.7le¦verhandeln|.4le¦wandeln|.9e¦verbessern|Feiert¦feiern|.13t¦herunterleiern|.12e¦verschlimmern|.2t¦tun'
  };

  var pastModel = {
    rules: '.5te¦aGblickIchDe8haftIi6l5n4o3r2st1u0;ti9zi9;ellGi8;leibFrschFseBteilF;ni6rde8;di5ti5zi5;eitCli4;ch0egAll8ni3si3;nAtA;chn9ig2r0ti1;i0leg8;er7;e0n6;rn;t1ä0;tz3;ig2;cht1nd0;eln;en|.2ieb¦treiben|.2af¦treffen|.2iefen¦rlaufen|.3ug¦chlagen|.2ogen¦fliegen|.2ag¦rliegen|.2iegen¦steigen|.2achte¦bringen|.2ang¦pringen|lich¦leichen|.3and¦e0r0;stehen|.3ie¦chreien|.2ienen¦cheinen|.2uhr¦rfahren|.2itt¦treiten|.2oß¦rgießen|.2ossen¦ch0fl0;ießen|.2ab¦rgeben|.4te¦aIchHdiGeFgiGkElBm9n8orDr4s3t0viGziG;e1i0rauJsCteIä9;erImmI;ckHilHllH;etzGiCu9;d2e1iBle0s8änkFü7;bEgE;ckDdD;eBigC;geln,i7;e0i6;rk9;ang8i1o0;ck7;ch6;ehr5i1lag5;dig4gn4ue3;er3;n2t2;st1ue0;rn;en|.4ten¦artAche9deckAed8henkAi7ld6m4n3perrAr1t0;reb9t7;dn8ei0hol8;k7s7;bar6d2ge5s1;a0m3;ch4;e2ig3;nig2st2;eln;rn;en|rieb¦reiben|fand¦finden|warf¦werfen|lang¦lingen|wang¦wingen|ich¦eichen|.2ingen¦n0s0;gehen|.2ing¦rgehen|zog¦ziehen|.2and¦stehen|dachten¦denken|rank¦rinken|fielen¦fallen|nahm¦nehmen|kam¦kommen|fuhr¦fahren|uchs¦achsen|wies¦weisen|.2ßten¦fassen|.2at¦treten|hielten¦halten|riß¦reißen|ruben¦raben|gab¦geben|hob¦heben|.3te¦aHbeGdeFeCfBgAi9l7ntJrtJs6t4u1äumJü0;ckIhrIllI;c1e3mmHt0;en,zG;hFkF;e0igEtEufEörE;rn;agCchC;dBe0igB;bAgA;ck9e4;e5n8;e4t7;ck6d6h1i0ll6tz6;l5m5;n4r4;ln,rn;ln;ff1hn1mm1nk1u0;b0s0;en|arben¦erben|and¦inden|.3ten¦a2eug3g1h1irk3mpf3o0peln,ütz3;ff2lg2rg2;ern;ch0un0;en|arf¦erfen|rief¦rufen|arg¦ergen|og¦iehen|sah¦sehen|ahm¦ehmen|am¦ommen|annte¦ennen|annen¦innen|ies¦eisen|ißte¦issen|riet¦raten|ot¦ieten|rat¦reten|tießen¦toßen|ud¦aden|.2ten¦as0pf0;en|.2te¦a6ck7e4hl7nz7pp7r3tz7u2ä1ös7ü0;g6ß6;h5r5;h4l4;k3m3n3r3;l0r0;en,n;l0u0;en|iet¦aten|ute¦uen|vte¦ven|zte¦zen',
    exceptions: '.4or¦erfr0verl0;ieren|.11ten¦argument3beabsich2demonstr3interess3rechtfer2substitu3unterbreit4ver0zurückreich4;ans0gewal1schleiern;chlag2talt2;tig1;ier0;en|.9ten¦aNbeGdiEeinschäDfCgarantPinsAk8m6provozPre5s2ver1widerseDz0überdau4;erschellPir2;billHdiJköGsiegFteidHweig2;chlumm1pe0;kulL;ern;b1kl9;ißhandAod0;ellH;andidGo0;nsumFrrigF;istEpi0;rDzD;inanzCrühstückD;tzC;ff0skutA;am9;a5f3gün1kräft2schränk9tra4zweif0;eln;st0;ig6;ra0ür0;cht4;rb1uftrag3;bsolv1usbr0;eit1;ier0;en|.10ten¦auszeichnBb9erleicht8favor7konkurrAorgan7pr6v1über0;ford7nachtA;er1or0;a1ber2herrsch8;a0dächtig7einnahm7schlepp7;rb0;eit5;aktiz3otest3äsent3;is2;ern;eeindruck1ombard0;ier0;en|.7ten¦aPbMeIfFhantiZkDlBnahelCoperiZpAs7traHum6ver1wegräum03zus0;piKti01;bu3harr01klär01l2mut01nein01s1t0übC;eil00ief00;pürZu1;angYoQ;chX;pflügWsteL;ch1t0;eigEill3udiQ;uftTweSüttT;assiOolstC;ahml0eerf0;egQ;ampiLling0;eln;l0ür1;imm6ü0;chtL;in1r0;krankJmordJ;reihIse0;tzH;e1lätt0;ern;gegnEkuCruh5schAwertEzwe6;bAn8r6u0;f2s0;de5fü0;llA;heul9mu1ze0;ig8;ck7;beit6gwö0;hn5;imi0last4;er3;sti1we0;nd1;mm0;en|.8ten¦aKbFeBgeAho9i6kumuOm5resi4s3ve0überquP;geBr0;goLhärtOst0weG;eckNärkN;chillAkan0tag4;diK;iterlebKusiziJ;g2n0;itiiHto0;niG;noriF;brauBfährdF;ntzü6r1skaCxis0;tiC;ford0richtC;ern;e0locki9;antrag9flüg2g0hand2rechn9teilig9;leit8rü0;nd7;eln;nstreng5ppe3us0;bi1rei0stell4;ch3;ld2;li0;er0;en|.6ten¦aUbNdiMeIfGgeFkElausOpCrBs9tr8urteil00v5w2z0;e0uwinkZ;itBrlJ;er1i0;c0nzP;keln;er1o0;rwKtiM;eIsJ;au8östR;ch0peI;mähPwebP;egiHiAutsC;oliGred0;igM;apiEerk2;maJwäA;ahBolt0;ern;in1r0;laubGsE;büßFl0;egE;chtD;asi5e1rau0;chB;e2fr1harrAs8wa0;hr9;ag8;nd7;er6;b2n1u0;fhör4slos4;rück3s1wähl3;le1s0;etz1;hn0;en|.12ten¦diskrimin1identifiz1natural0solidar0zurückfordern;is0;ieren|.5or¦einfrieren|Debattierten¦debattieren|.4ten¦bFdrohHfehlHhDkBliCm9nu8pumpHr6s5t4w1z0;eigGierG;a1einFäh0;lErE;lzDrnDtD;anzCeilCrauC;iegBäumB;e0i1ollA;ck9d9if9;tz8;e0u4;hr6rk6;e4l0;eb4;o0äuf3;ck2;lüh1o0uch1;hr0;en|.2or¦frieren|.15ten¦weiter0;debatt0produz0;ieren|Dominierten¦dominieren|.5ten¦anrOblickPdNeJfeHgeGkElBpAr9s3t2verübPweitPz0öffnP;u0üC;hKlM;au9re4;ch4p2t0;ammKo0römK;ckJppJ;a0eisIrühI;nnH;auGürG;ei2ottF;flDok7u4;a1ös0;chC;ndB;nallAo0;st9;h5nüg8;i0u0;ern;ign5mp2r0;hö0tön4;h3r3;ör2;eut1räng1;eg0;en|.3aß¦besitzen|saßen¦sitzen|.10aß¦gegenübersitzen|.7olzen¦verschmelzen|.4olz¦schmelzen|.5aßen¦festsitzen|.4aßen¦einsitzen|.6amen¦h0;eran0inzu0;kommen|.6ämen¦davonkommen|.9amen¦zusammenkommen|.7amen¦zugutekommen|.3amen¦umkommen|.3äme¦zukommen|wusch¦waschen|.3ahmen¦annehmen|.4ähme¦hinnehmen|.4ähmen¦aufnehmen|.4oll¦schwellen|.2oll¦quellen|.2ünden¦stehen|.4ünde¦bestehen|.5anden¦entstehen|.4anden¦anstehen|.7ünden¦unterstehen|.4aben¦aufgeben|.3aben¦begeben|.5aben¦übergeben|.3äben¦ab0er0;geben|.3anden¦befinden|.7anden¦verschwinden|.3ten¦bau0eil0heg0jag0tob0;en|.7ogen¦vorbeiziehen|.2ohen¦fliehen|.6ogen¦einbe0unter0;ziehen|.4ogen¦einziehen|.3ogen¦abziehen|hielte¦halten|.3ielt¦an0be0;halten|.4ielt¦ent0vor0;halten|.9ielte¦zusammenhalten|.7te¦a9be8e6heiratDkremp5mitwirkDp4s1tro2ver0wechs5;hängCka9liebCsorgCwahrC;ch1ta0;mm2;alt9lüpf9;lapp7rang7;eln;inreis6r0;inn4reich5öffn5;reit4straf4;n1ufhä0;uf2;gehör1näh0;ern;en|.4iesen¦hinweisen|Suchte¦suchen|.3ahl¦befehlen|.4ahl¦empfehlen|.9te¦anprang8beschädig7durchpauk7e3prophezei7umkremp6ver0überrei1;br3körp7sic1ursa0;ch5;h5k5;ntw1rarb0;eit2;ick0urz0;eln;en;ern|.6te¦ausholIbEdBer9f8g7k6liefDm5rätsFs1torkFver0zaubD;ebbHhörHtagHwehH;ch2i1p0treifG;altFrengF;ck9edB;adDenkD;ind7utmaßC;anz8leidBü5;lucksAründA;olg4rist9;folg8ob3w0;ach7ähn7ürg7;onn1ä0;mm0;ern;e1reit3umm0;eln;d0frei1;eck0roh0;en|.5te¦anhörDbAer9flachDmündDo7prallDrü6s4t3w1ä0;rg7uß7;a0idmB;b5rtA;e2rimm9;chä0perr8tütz8;l7m7;st6;pf0rdn5;ern;bos3r2;e0rems2;jah1müh1ton1w0;eg0;en|.5annten¦verbrennen|.2annten¦brennen|.3annten¦bekennen|.3iel¦gefallen|.4iele¦entfallen|.4iel¦ausfallen|.2ichen¦gleichen|.4äten¦betreten|.13ten¦erwirtschaften|.14ten¦auskundschaft0veranschaulich0;en|.8te¦aCbe9e6ge5nachfragGsch3ver0;drängFeiEk1w7ä0;ndFußF;nü1äm1ündD;eppDildDrum0ütB;pfB;nehm1st2;ntf1rkund0;ig8;alt7;h1vorzug6z0;aub6iff6;aupt4ind5;blief4n1u0;fspieß2sweit2;kreid1zet0;teln;en;ern|.13te¦beglückwünsch0zusammenknüpf0;en|.5achten¦verbringen|.5ächten¦aufbringen|.4te¦atmFbetFdDendFfChBjäAkaufFleEm8n7p5r4s2t1w0zollF;iDohnE;rübDötD;eBpü0;lBrB;ä4ö5ühmA;lan9r0;äg8üf8;eig7ä2;a0ein6;ch5;hr4;emm3i2;ilm2rag2u1;eck1reh1ü0;nk0;en|bat¦bitten|.4aten¦ver0;bitten,tun|.2ieben¦bl0tr0;eiben|.9ieben¦unterschreiben|rieben¦reiben|.8ieben¦festschreiben|.3arfen¦bewerfen|.7angen¦durchk0versch0;lingen|.2ieg¦steigen|.5ieg¦versteigen|fuhren¦fahren|.7ühre¦weiterfahren|.2afen¦treffen|.5afen¦eintreffen|.4issen¦wegreißen|Schirmte¦schirmen|warb¦werben|.3arb¦bewerben|riefen¦rufen|.4iefe¦aufrufen|.10te¦auf1beanstand2mit1niederkni2unterstütz2ver0;kleinern,wechseln;arbeit0;en|.2angen¦dr0zw0;ingen|.2ßte¦fassen|.4ßte¦anp0erf0;assen|.7inge¦weitergehen|.2itt¦gleiten|.3uf¦schaffen|wußten¦wissen|.3üchse¦erwachsen|.4ing¦auf2e0ver1;in1mp0;fang1;geh0;en|.7ub¦untergraben|hoben¦heben|.11te¦durchforst0entschuldig0;en|.6ief¦durch0unter0;laufen|dachte¦denken|.4ägen¦vorliegen|.6achen¦aus0ent0;sprechen|.4omm¦erklimmen|.3ach¦sprechen|.3te¦ein3h2k1lob3müh3reg3tag3w0;ag2eh2;ur1ür1;ol0ör0;en|ließ¦lassen|.3ieße¦zulassen|.3ießen¦erlassen|.2achen¦brechen|.2ugen¦tragen|gingen¦gehen|.5ied¦bescheiden|.4oß¦schließen|Hätte¦haben|.4iffen¦begreifen|hieß¦heißen|.7ieg¦verschweigen|lief¦laufen|lag¦liegen|galt¦gelten|.2iff¦greifen|.4iefen¦rumlau0schla0;fen|.6oben¦verschieben|litten¦leiden|.4ieß¦e1ver0;heiß2l1;inl0ntl0;ass0;en|.4ug¦betragen|.6ach¦versprechen|.5ah¦geschehen|.2te¦üben|wandte¦wenden|.4iß¦schm0verb0;eißen|.4itten¦sch0;neid0reit0;en|fingen¦fangen|tat¦tun|.3iefen¦belaufen|.6oß¦an0be0er0;schließen|.5ug¦aus0bei0;tragen|sank¦sinken|.5agen¦festliegen|.3itten¦erleiden|.3ang¦bes0err0;ingen|.6ied¦aus0ent0;scheiden|.4anken¦versinken|.5ieß¦überlassen|.8ächen¦widersprechen|.7oß¦e0;inschließ0ntschliess0;en|sang¦singen|.2ßten¦passen|.3ieden¦scheiden|.5chten¦vermögen|aß¦essen|.4test¦sollen|.8itt¦fortschreiten|.9itt¦unterschreiten|.6ing¦herumgehen|.4ieg¦schweigen|.2ank¦stinken|.4andte¦entsenden|mochte¦mögen|.4iff¦ergreifen|hingen¦hängen|.3ingen¦anfang1be0zu0;geh0;en|.4aß¦vergessen|ziehen¦zeihen|.10achen¦zusammenbrechen|.4ieh¦verleihen|.5achen¦aufbrechen|.7ießen¦hinterlassen|.6oren¦beschwören|ward¦werden|.2aßen¦fressen|.5ach¦aus0ein0;brechen|.3andte¦anwenden|.7iefen¦hinauslaufen|half¦helfen|wogen¦wägen|.3og¦erwägen|lasen¦lesen|.3ob¦schieben|.6ug¦übertragen|.3ossen¦gen0spr0;ießen|.5ieb¦ausbleiben|mied¦meiden|.7itten¦einschreiten|.8iedet¦unterscheiden|Unkten¦unken|.9ag¦zugrundeliegen|.4ammen¦schwimmen|wog¦wiegen|.8urde¦bekanntwerden|.7ag¦zurückliegen|maß¦messen|.5ugen¦vortragen|.3ief¦ablaufen|sandte¦senden|.3urfte¦bedürfen|wart¦sein|.5ieben¦verbleiben|.7ossen¦entschließen|.7ach¦unterbrechen|.5ogen¦überwiegen|.4ied¦vermeiden|.3tet¦kosen|.6ang¦durchringen|.4alfen¦verhelfen|.5angen¦eindringen|.8ang¦herausdringen|.5ßten¦verpassen|.6ießen¦übriglassen|.2ochen¦kriechen|.5iffen¦aufgreifen|.7ieb¦unterbleiben|.5ießen¦freilassen|.5ügen¦vertragen|.3aten¦abtun|barsten¦bersten|.9ingen¦zusammenhängen|.6ingen¦draufgehen|.7ing¦zurückgehen|bisse¦beißen|sog¦saugen|.7ief¦zurücklaufen|mußte¦müssen|.4as¦verlesen|rangen¦ringen|.4äte¦auftun|roch¦riechen|.7össen¦ausschließen|.14te¦entgegenrieseln|.12te¦niedermetzeln|.15te¦zusammenbrutzeln'
  };

  let infToPresent = uncompress$1(presentModel);
  let presentToInf = reverse$1(infToPresent);

  let infToPast = uncompress$1(pastModel);
  let pastToInf = reverse$1(infToPast);


  const toPresent = function (str) {
    return convert$1(str, infToPresent)
  };
  const fromPresent = function (str) {
    return convert$1(str, presentToInf)
  };

  const toPast = function (str) {
    return convert$1(str, infToPast)
  };
  const fromPast = function (str) {
    return convert$1(str, pastToInf)
  };


  var conjugate = { toPresent, fromPresent, toPast, fromPast };

  // generated in ./lib/lexicon
  var lexData = {
    "Adjective": "true¦0:67;1:66;2:5L;3:4V;4:61;5:4S;6:4T;7:5H;a5Xb4Td4Je40f3Og32h2Ti2Pj2Nk2Al22m1Vn1Ko1Ip19r15s0Kt0GuYvOwFyork0zCäAöffentli62üb8;er8r6;fül4Kschuld2trieb1;lt4Vrm0ußer8;en,st0;ag5Geitgl42ivil0u9wei8;er,f5Ete5Y;fried1stä1H;aEeBi8;chtig9ederholt0l8;d0lkI;en,s4A;i8ltwei49;ch,t8ße4;e5Pgeh36;chs4Whre4Qr8;m5sch1H;a3IeCo8;ll9r8;der5Hig1;!k8;omm1;heme4Xr8;ein9heiraEmSrü2Rs8zweifAöffentlicht1;pät2tärkt51uc3U;igt1t1z8;elt1T;mMn8;beIeFgChinterfra52kBlaut3t3ver8;fäls3Alet4Fmi9rich8sor51ä9;tet0;nde7;lar,ontroll1M;e8l3A;eign2fährd2heu8löst,nut4Aschor1;er,re4;ingeschrän0Ur8;hö7lau4Gw8;art2ü30;acht2frist2gr9helli4Rk4Fr8schad2waffn2;ec4Büh7;en43ü4M;fass2Ege8stritt1;k8rechn2;eh7;e9ief3Iot,r8;adition51eu1;heran0u8;er,re1U;aRchGeEich3LoDpät2Dt8;aAe9olz1r8uttga2Härk3K;aff0e4E;il,uerfrei1;bil3Ar8;k4Or;genann3Qzi0I;l8par4S;bstbewußt,t1;aHi0lFmEnell0w8;aBe8äch3;iz0r8;!e8;!n,r1;c2Qrz8;e4wä3B;ack3Serz3S;a8echt1Fimme4A;nk0u;de,rf5;arbrü06ub31;as2Ae9icht6o8;h1sto04te4;ge8volutionäre;l1Rs;aEeClaBoAr8ublik;ag0eis8ivat12ofunde;bereini3Qwe7;lit3Wsi0A;tt,usib44;king0r8;feMmane3B;r8ssO;all40is0teiint0H;b3ff8;en,izi3Z;aGeDiedrigCoAä9ü8;cht0Drnbe0N;chs26h3;minLtwe8;nd6;e1Wstem;olibe9tt,u8;!e01t8;rale;c8h1sse;kt;aCehrfa1KiBo8ünchn0;der9natela34sk8;au0;a2In5;ld0ttl3;astric1Pg0ng2Rrod1xim8;al;aCeAu9äng23übe8;ck0;bowitz0xem03;b2Der1gitim,icht8tz2B;!er5;ng9u8x;f2Atstark;!en,sam;aJlHnappe0RoArank,urz9ärntn0öln0ü8;hlFnft6rz3;!em;mAn8stengünst1V;kret0Mserva8trovers;tive;m22pl8;ett9iz8;ie7;!e;arZeine8ug;!n,r5;lt1Cr0K;unge4üng8;er1s14;mmAn8;n3t8;ern;ens1un;aDeut6iCoAärt3ö8;chste8h1B;m,n,r;ch8f0he05;!entwickelX;es6lfr0Gnt3;ag0lbe4m8rt5;bu8;rg0;anze4eDlaCr8uteZ;au0Voß9öß8;er5t1;!e8;!n,r,s;tNub1L;eigneMgLheKlInFplaHrEsAteilMwisse9zielt8;!e13;!r,s;am15chiAp1Eund8;!e8;!s;ckG;eVing05;a8f0;n8u0H;nt1;be,t8;end1C;im,u0;enwärt6ründe8;te;alsReHiGoFr8ühr0U;ankfuDeiBistgeAomm0üh8;!e8;n,r5;reI;!e8;!n,r;rt0;lg0Mrmell;nanzielle4t,x;hler0Ui8st0;ge;cPhemZinMnGr8wig,xpliz0N;bit0TfolgrDhöOklärt0VnBsteAwü8;ns8;cht;n,r,s;eut,st8;er,hR;ei8;ch;gBorm14t8;fer0Gs8;cheid07et04prechende8;n,s;!e8;n,r1;fac9ig,st6wandfreie,z8;el0Yig1;he;ht0;aDeCiBoppeAr8unk0YüstM;esdn0it8;te0Q;lt;ckePverse4;sol0VtmoMuts0L;mAuerh8;aft8;!er;al6;a09eIiBonn0r8udape0E;eit8üssel0;!e8;!r5;elefeDllBsher6tt8;er5;!en;ig1;ig3;er1;ld0;dinXfTgePispiNkLlieKmerkenswe7rGs9waffnete8;!r;oDser07t8;eAimm9ür8;zt;te4;!h8n,r;end1;ndere4rP;eAlin0ü8;c8hmt1;htiM;it;bt;an8;nt;el8;haft;hbarAis8;te7;rt;es;aAreu8;nd2;et;ng1;gt;r8sl0;!ocke;bsolut0däquMkJlFndeDu8;s8tonom1;länd9sichtsreich8;st0;is8;ch0;re8;n,r;lgemei9t8;!e4;ne4;!n;tu9zeptab8;el;ell1;at1;en;er",
    "LastName": "true¦0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Kd2Ae27f22g1Wh1Mi1Hj1Ck16l0Ym0Mn0Ho0Ep03rWsLtGvEwCxBy8zh6;a6ou,u;ng,o;a6eun2Qoshi1Hun;ma6ng;da,guc1Wmo23sh1YzaP;iao,u;a6eb0illi37o4right,u;gn0lk0ng,tanabe;a6ivaldi;ssilj33zqu1;a9h8i2Do7r6sui,urn0;an,ynisI;lst0Prr1Sth;atch0omps2;kah0Unaka,ylor;aDchulz,eChimizu,iBmiAo9t7u6zabo;ar1lliv27zuD;a6ein0;l20rm0;sa,u4;rn3th;lva,mmo21ngh;mjon3rrano;ito,n7sa6to;ki;ch1dLtos,z;amBeag1Xi9o7u6;bio,iz,sD;b6dri1KgIj0SmeQosevelt,ssi,ux;erts,ins2;c6ve0F;ci,hards2;ir1os;aEeAh8ic6ow1X;as6hl0;so;a6illips;m,n1R;ders5et8r7t6;e0Mr3;ez,ry;ers;h1Yrk0t6vl3;el,te0I;baCg0Alivei01r6;t6w1L;ega,iz;a6eils2guy5ix2owak,ym1C;gy,ka7var6;ro;ji6muV;ma;aEeCiBo8u6;ll0n6rr09ssolini,ñ6;oz;lina,oKr6zart;al0Ke6r0R;au,no;hhail3ll0;rci0ssi6y0;!er;eUmmad3r6tsu05;in6tin1;!o;aCe8i6op1uo;!n6u;coln,dholm;fe7n0Nr6w0G;oy;bv6v6;re;mmy,rs5u;aAennedy,imu9le0Io7u6wok;mar,znets3;bay6vacs;asX;ra;hn,rl9to,ur,zl3;ansse0Gen9ha4imen1o6u4;h6nXu4;an6ns2;ss2;ki0Cs5;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a4b0ghNynh;a4ffmann,rvat;mingw7nde6rM;rs2;ay;ns5rrPs7y6;asDes;an3hi6;moI;a9il,o8r7u6;o,tierr1;ayli4ub0;m1nzal1;nd6o,rcia;hi;er9lor8o7uj6;ita;st0urni0;es;nand1;d7insteHsposi6vaL;to;is2wards;aCeBi9omin8u6;bo6rand;is;gu1;az,mitr3;ov;lgado,vi;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u4we;i,ng,u4w,y;!n,on6u4;!g;mpb6rt0;ell;aBe8ha4lanco,oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "Adverb": "true¦0:31;1:2H;2:28;3:30;a2Qb2Fcirca,d21e1Pf1Og1Ch15i0Xj0Rk0Ql0Mm0Dn04o02p01quasi,ru30sStRunOvIwDz6äußer2üb4;er4rig0E;!all,haupt;i9u5w4;ar,eim1Si0W;er2g6let0Om5n25s4t16vor;amm3eh02;ei2inde2;lNrun1Bu2U;em0rka;ahr7e6ieder5o4ähre2Q;a2Chl,mög0;!um;g3it1nig;haft,li2R;er8i6o4;n,r4;!ab,er2gest0Zn,w1M;a,el4;!eror2Pleicht;gebVmut0s1K;bedingt,geacht2Dte4we1N;n,r4;!dess3;eil21oi,rotz;a0FchBe7icher0o4te2J;!eb3fo1Jg4m1In2;ar,l4;ei2D;hr,i5lb4;er,st;ner01t4;!h1;l20on;er,ro;b3ft0Rhne4;!hK;aAe8i6o5u4äm0;n,r;ch0Ntf2A;e0Mrg4;ends;ben4t1Au0;!an;ch4m0Ptür0;!ts;eBit6org5öglich4;er1Est;ens;!einand1saRt4unt1;e4lerweile;ls,n4;!dr4;in;h1Wi2;a02e5i4;eb1nks;dig0id1tzt4;end0li1J;aum,einesf1Qnapp,ürz0;a,e4u2;!d5h1ma1Qt4wO;zt;e4o1E;nf1Lr4;ze0F;mm1n5rgend4;!wie;!des,klusive,nerh0Ys5zwi4;sch3;besondere,ge5o4;fHwe09;h0Esa4;mt;eu7i4;er5n4;geg3sicht0t1;!zulanE;er,t4;e,zut4;age;aEe6leich5rößtent4;ei15;!wohl;genAnauso8r5st4wiß;ern;a5n4;!e;de;!g4;ut;!üb1;nz,r;a2ern1olg0rei0ür;benEheDi7n5rst4twa,xtra;!ma0S;d0t4;lUspreche0B;g7n4;m5s4;c04t;al;en4;s,t0;ma0Jr;!f0Gso;aEe8oBr7urch4;!a5w4;eg;us;auß3in;mn7nno02r4sD;a5weil,ze4;it;rt;äch2;st;h5ma06n4;k,n;eim;ald,e9i5loß,rut4;to;nn3s4;!h1l4;ang;er;i6kannt0rgab,s4wußt;o4tenfU;nders;!nahe,spiels4;weise;beRlMnEu4;ch,fBs7ße4;n,r4;!h4;alb;!gerechn6sc4;hl4;ieß0;et;!gru4;nd;!der8faEgesichAläß0so4;nst3;en;li4;ch;n4s;f9or4;ts;le5s4;!o;in,nf5rdi4;ngs;al5;rma4;ls",
    "Conjunction": "true¦bAd7entwed6falls,in5nach5o3so2und,w0zumal;e0ohingegen;d4il,nn2;lange,ndern,wie;b0d2;!glei3;dem;er;a1enn,o0;ch;ss,ß;e0zw;vor,ziehungsweise",
    "Determiner": "true¦d2ein0;!e0;!m,n,r,s;as,e0ie;m,n,r,s",
    "City": "true¦0:3A;a2Yb28c1Yd1Te1Sf1Qg1Kh1Ci1Ajakar2Jk11l0Um0Gn0Co0ApZquiYrVsLtCuBv8w3y1zuri22;ang1We1okohama;katerin1Krev0;ars4e3i1rocl4;ckl0Yn1;nipeg,terth0Z;llingt1Rxford;aw;a2i1;en2Klni33;lenc2Yncouv0Ir2J;lan bat0Ftrecht;a7bilisi,e6he5i4o3rondheim,u1;nWr1;in,ku;kyo,ronJulouD;anj26l16miso2Mra2D; haKssaloni10;gucigalpa,hr0l av0O;i1llinn,mpe2Engi09rtu;chu25n0pU;a4e3h2kopje,t1ydney;ockholm,uttga15;angh1Ienzh20;o0Nv01;int peters0Xl4n1ppo1I; 1ti1E;jo1salv3;se;v1z0T;adW;eykjavik,i2o1;me,sario,t28;ga,o de janei1A;to;a9e7h6i5o3r1ueb1Tyongya1Q;a1etor28;gue;rt1zn0; elizabe4o;ls1Jrae28;iladelph23nom pe0Aoenix;r1tah tik1C;th;lerLr1tr13;is;dessa,s1ttawa;a1Klo;a3ew 1is;delWtaip1york ci1U;ei;goya,nt0Xpl0Xv0;a7e6i5o2u1;mb0Oni0L;nt2sco1;u,w;evideo,real;l0n03skolc;dellín,lbour0U;drid,l6n4r1;ib2se1;ille;or;chest1dalYi11;er;mo;a6i3o1vCy03;nd1s angel0H;on,r0G;ma1nz,sb00verpo2;!ss1;ol; pla0Jusan0G;a6hark5i4laipeda,o2rak1uala lump3;ow;be,pavog1sice;ur;ev,ng9;iv;b4mpa0Lndy,ohsiu0Ira1un04;c1j;hi;ncheNstanb1̇zmir;ul;a6e4o1; chi mi2ms,u1;stJ;nh;lsin1rakliH;ki;ifa,m1noi,va0B;bu0UiltE;alw5dan4en3hent,iza,othen2raz,ua1;dalaj0Hngzhou;bu0R;eVoa,ève;sk;ay;es,rankfu1;rt;dmont5indhovV;a2ha02oha,u1;blSrb0shanbe;e1kar,masc0HugavpiK;gu,je1;on;a8ebu,h3o1raioKuriti02;lo1nstanKpenhagOrk;gGmbo;enn4i2ristchur1;ch;ang m2c1ttagoM;ago;ai;i1lgary,pe town,rac5;ro;aIeCirminghXogoBr6u1;char4dap4enos air3r1s0;g1sa;as;es;est;a3isba2usse1;ls;ne;silRtisla1;va;ta;i4lgrade,r1;g2l1n;in;en;ji1rut;ng;ku,n4r1sel;celo2ranquil1;la;na;g2ja lu1;ka;alo1kok;re;aDbBhmedabad,l8m5n3qa2sh1thens,uckland;dod,gabat;ba;k1twerp;ara;m0s1;terd1;am;exandr2ma1;ty;ia;idj0u dhabi;an;lbo2rh1;us;rg",
    "Verb": "true¦0:5M;1:5E;2:5L;3:4M;4:4O;5:4D;6:3O;a56b46d41e3Af31g24h1Ri2Lk1Ml1Hm1Cn1Ap18r15s0Ot0Hu09vTwHz9ä8über7;nehm0ras2sp3ZtrVwa2;nd3Juß1N;eDi3Dog0u7ä3Aög0;geBrück8sammen7;geb5Lhä1;ge8zu7;drä1erob3E;ga1wies0;la5Gsp5Hw58;ig16rstö2G;aGeEiBoAu9ä8ü7;nsche4rde4;ch28hl0re4;chs,rd0ß3;l1Ord0;ch0der2Pe8r7s15;d,ke4;derhol0Ms;i7r3C;ch0gere,st,ß;ch10ndt0r7;!en,f,n3;erAor7;ausg1Cge7lR;d3Bga1schl7;ag0;anke1ZbHdGfüg0gFhä1lCmOrat0s9tret0we8öffentlich7;en,t;chs42i1S;ch8pr7ta1Ou2P;e2ic5o2;li1ob0;a8oren7;!g12;ng0u3S;a1e4PliE;eutli2ie1Nrä1;ot0u3Z;mg0Xnter7;brClBs7;t7uc5;r7üS;ei2i7;ch6;ag;i1o2;aBhro1Dr8u3Uä7;t0us2;a8i7ug;n2Rtt;f,ge,t6;pp0u7;ch0s2;aLchFeDiBol0LpAt7uc5;a8e7ieg,reik0ärk0ü3I;c2Li3Jll3;mm3Knd6;iel0ra2;n7tz0;d,g0ke;i7nk3tz04;!d,en;aBeAi1Ql9rie8we2Zü7;tz0;!b;a39epp0;in0nk3;fZue;g7h,nk;e,te;e8ief,uts2ä7üc26;ch0um3;agiOi27;asJlant2Fr7;ophez2Xäg0;a7iedeV;hm6nn3;achAe9i8öch3ü7;sEßM;s2tb1Vßbrau2;in3lde3;e,te4;a9e8ie2Sud,ä7ös0;dt,g0;g3hn3;g6s7;se;aAlett9omme,ri8önne,ü7;mm14nd24;e2tisi7;er3;m6uB;aGerDiBo9ä7;lt,n27t7;te4;f7l3;fe;l2Xn7;blä0Pg0wegtäus2;rsche,vo7;rg7;ega1;be4l3nde8t7;!te4;le;a02e9i8l7;aub0i2änz0;b,lt,ng6;bUdTfSga1hRlQmac5pMrLsDtBw8z7;og0wu1;a8es0o7;nn0rd0;n2Ds2;an,r7;ag0o18;chBp2It9u7;c5n7;g0k0;a7orb0ri2;nd;a12l7;eu7o2B;st;at0u1;a8la7;nt;a7rkt;rt;a0Cu1;alt0t;a02u1E;ac5ru1;eAo9r7;a7o2;c5uc5;r0t0;!t0;b6lt;anEeIiCorderBreigeAuß0ördQü7;h7r13;le4r7;e4te4;sp1R;n,te4;el7ng0;!e4;d,g0;ingeVmpfSntMr7;fJga1hIinnerHklär0BläutGmögli03rDs9wäg0z7örtG;wu1ä7;hl0;ch7to2;i8o1Gü7;ttB;en6;ei7u1;ch7;e,t03;ern;n,t01;ob0öhS;r06ü7;ll0;ga1la15s7;ch8pr7tand6;a2e2ic5o2;ei8ied6;!en;de;a8i7;ng;hl,ng0;d7frVga1;ru1;enAr9urchd8ürf7;e,t0;ri1;a1i1ä1ück0;ke;a04eCiBliebHot,ra7;ch9u7;ch7;e4t;en,te4;e3n;aWdien0fSgQherrs2kam0mängPnötiNrJsCt7wältKzeichne3;on9r7;aVo7;ff0;en,t7;!e;chBitze,p0Et8uc5;ht;ra09ät7;ig7;en,te;ied,lo08w7äft9;or0;ich8ücksicht7;ig0;te3;te;ge4;!n;eln;an7li2onn0rab0;g0n;i9r8ür7;cht0;eit;nd0;bsichti7nspru2;ge;ng0t,u7;e,t;bJnFu7;fCs7;fiel,g7ma2spra2;e7i1;bMg8s7;cJpL;a1li2;ge7ma2;bIfa1ga1hob0zwu1;bot,ge7;bot0fa1ga1spGw7;an7;dt;ge8hä1;ng0;bBs7;c8tra7;ft;hlo7;ss0;ro2;ch0;en",
    "Noun": "true¦0:8H;1:86;2:8G;3:7R;4:7O;5:7X;6:8E;7:7M;8:5R;9:7W;A:7I;B:8F;C:8B;D:5Y;E:4N;a7Mb6Qc6Id6Ae5Xf5Bg4Kh43i3Yj3Uk3Gl34m2Hn2Ao28p1Tr1Es0Mt0Du08vWwLzHäGölFüber2T;!vor5S;gypten51ngs3rz3;aHeGuFwic3N;ge,kä1Jstande5P;c4hn3Zit09l3;c6Ygr73;aNeJiHocheFäEört2ürst2;!nF;!en7S;dersFnt1ssen4M;a58p5X;ge,hrpflichtige,iHlt,n7PrFsen52;n1rat3FtF;!e,papi74;g1se;ff0hl0ige8lF;den49es;aPeLieKoFw;igt,lk,rF;ab1Ug7Tpres2sFwürfe6;chußlorbe6XitzendeGtandsF;sp2YvA;!r;l7Grteljahrhunde6H;ned3YrF;antwortlic5brau4TdGgleic4haFkä0Xlus3teid6P;l5Andlungst1W;acCächtige6;n,rian3;hr,ltent2YmHnFrR;!terF;geb4Zschri41;brü2fr7FsFwelt3K;chuldungs4Utänd0;aKei8hyss0iJoIreGürF;!en;ndFpp2uhanda5X;!w7;dBnn0;e13g1sD;sc5tGuF;be,s7;sac5;a03chZeYiXkand2Uon5MpRtHuGynod2Uz51üF;d0pp2;c4detendeuts2mL;!aMeLimKrHuFädt2;dieFf0nd0;ngebü3Xr7;aGeF;et,ß;t5Mß0;me6;inkohleze2l26;atsFdtrat,rza40;a07di61;arJdHrF;ac4echF;ch73er;! F;frak3Rl50vA;er,te;cCgnalBnn;i6Zuc5;arpings,e0Ein,neid1rGuld0wF;ierig0Qäc5;eibt0SiFöd1;fts2Dtt;chGnFrajewo;!kt;e6sen-an5Z;aSeKiJoItr,uHüF;ckFd5Ehe;s1Bt5Q;f,he;be51l1K;tu1Xv1;chJgierungsTiFst;h0sF;ch,eGighaF;uf0;!n5R;er2tF;e,saF;nwa9;c4hmen3E;aPeMfLhänom3Uioni53oJrF;eGoFä0C; kopf 0Cgrammv1Yjek3tes3;isFsseH;absp65verfal8;lizeiFrE;sp0Z;enn21l0R;itErF;es,sF;onal,pek44;lästinense4RpieHrF;lamentFol0teivA;es,swahl0;re;berfläc4fFliv1ppenheim1rt,stslawonie1G;!f1T;aJeHgo,ieGorFä4;be48drhein westf15;r0tzE;andert0TgativtrFuk27;end;chFme;b5Jr0Bs4It;!aXcdonnWeTiMoLuJäIöglichHüF;lFn2;heim kärliDl1;keit0;d2rk3;lFseum;isD;dellcharakt1nats7rd;chae8eKlJnGtF;gefang2JtwoD;destGisterpräFut0;sident0;ein2E;itär,lia3Y;rt,te;nGrF;kma05rG;achem,em,ge,schenre1F;ell;astrRl1nHrktn48schinenGßF;e,n2J;!pistol0;ge8n;aLeJiIokal2WuFä37;dFft;ew0VwigF;!shaf3S;cCs3;!ch,g7iFu4W;c5pz0R;!ch1fontain2PndFst0teiniE;eGgerF;icC;!sF;e1Bk15vA;aPe3FiNoJrGu33öFüc4;ln,nigBr3;aDiegsFuE;en3WverbF;re1D;h8llekUmmun0nFst0;flik3tF;ak3rolF;le;nFrc5;ke8;bel,mpagn0rGss0tschthFuf;al1;isDt0;ahrHerusalGob,uFürg0;gendliche3Zppé;em;!es7hundertw7tausendw7zehnt;deIg,mperaHnGrFtali31wf;an,e29;ha9itiative6;tiv;al0;aMeIoGundertFäf0Wö4;taus7;eFr0W;ch0Vn0;broHn21rFß;b0Trn,sFzog;tell1;n 0W;ftMlLnJuF;ptGshaltF;!sstreits;urs2QvF;erantwor0D;delsFs jo2;!ab0Q;s,t;!a1T;a0HeLipKläub39mbh,oJrFünt1;oßoffHundGöße,ünF;de6en;ig;ens38;lft24tt;fe8;bWfaUha9lSmeinde6nRrNsHwF;a9erkschaftF;en,svA;chIeFicCpräc5ta9;llFtze;schaF;ft0;iFwor0B;ch3;ichtGäuE;sc4;!eF;!s;era8f;d,senkF;ir2;hr,ngeneF;n,r;ie3üF;hr0;aZdp0JeXiSlNoKrGäll0ührungseF;be0W;!aGeiheiF;tli2;g0kFu0;tion1T;l0BrF;meln,sF;ch1;aIuGäc5üchF;tlin07;cCgangF;st;mm0sc5;liale6schF;!erF;!eiF;abF;komm0;ld,stgenommF;en0;llBmilienangehöriW;bQiKkd,l,nJpoc4rGuF;!ropä1;achGde,folg,ha9löse,wachF;en,sene1U;tens;de,tge9;m1nF;bIheiHnGzelhande8;ls;ahm0;m11t0;rüc4;ene6;am0dr,eLgbKiHm,raDu11örfF;ch0er;ch;enstGnFvid7;ge;e,mäd2;! vA;!fizi3legie15utsc5;duJhGoF;!lt;arakterBef,iF;le,nabesuchF;es;! F;lFvA;ande0K;a04eVilUlutvergieß0oRrNuJvs,üF;ch1hHrgerF;!initiaF;tiv0;ne;ndesFrs2;aGhaus0GläFtagsabgeordne3vA;nder6;nsta9;ancheFief,oschür0öt2;!nF;!kollF;eg0;rcFusquOx0;heF;rt;d,l;am3b0freiungstMhöLrJsHtrF;iFoffR;eb;chäftig0VucheF;r,s;ekFgsteHichtBnd;et;rd0;ig1;dJnkHrriGsf,ueF;rn;er0;darlFen;eh0;en1;a2b0Efp,gab,kb0Dl09mt,nZp,rVsRuF;fIge,sF;lä09sFwei2;ag0chußvAicCprF;ac4;entLsGtF;ritt;ichtsratGtändF;is2;svA;orsiF;tz7;ha9;c4ylsuch7;enF;de;he;beitsHgumen3tenvielF;fa9;te;plätz0we9;geLhKlJsGtwoFwa9zeig0;rt0;icCprüc5ta9;lt;he6;ag0;äng1;hörFklagt0stellR;igeF;!n,r;exaGternatF;ive;nd1;er;ar;endBgeordneJhIsF;icCpF;ra2;ht;ör0;te6;!n;!e;ch0;en",
    "Country": "true¦0:2Q;1:2P;a2Ib23c21d1Se1Lf1Hg19h18i13j10k0Rl0Nm0En05o04pYrVsKtEu7v4weißrusXz3ä2öster1I;quatorial02thiopi0;entralafrik1Type9;anuatu,e2ietnam;nezue2Jreinigte 2;arabische emira1Kstaat0;.6gan2GkraiLn2ruWsbeD;ga4ited 2;arab emirates,kingdom,states2;! of ame1T;rn;k.,s.2; virgin islands,a.;a5ha9o4rinidad und toba1Nsch3u2ürk1U;n0Trkme2Evalu;ad,echi0;go,nga;dschi2nsan0Y;ki2B;aAchwed0e9i7low6omal0Wpa1ri lan0Jt. 5u4was3y26ão tomé und príncipe,üd2;afri0IkNsud2A;il1D;d28riname;kitts und nevis,luc0Svincent und die grenadD;ak1Je1;erra leo2mbabwe,ngapur;ne;negKr03ychell0;lomon0m2n marino,udi-ara02;b0Moa;e15u2;an1Rmä1s2;sl12;a4eGhilipp3o2;l0rtugD;in0;ki1Tl0Cnama,pua-neu3ra2;guay;guin0L;m1Rsttim0O;a8e6i4or2;dk2weg0;or0H;caragua,ederlanRger2;!ia;p2useel0P;al;mib04u2;ru;a4exi7ikronUo2yanmK;ldawi0n2samb0I;aco,gol0Stenegro;dagaskHl5r3ur2zedo1;eta1itius;ok2shallinseln;ko;a2ediv0i,ta;wi,ysU;a0Re4i2uxemburg;b2echtenste0Ttau0;erRy0;sotho,tX;a6enPir5o3roati0u2önigreich großbritan1;ba,wait;lum2mor0;bi0;gisi0ZibaZ;m4na0Rp ver3sach0Yt2;ar;de;bodscha,erI;a2em0;mai2p0U;ka;nd4r3s2ta0H;lVrael;ak,lU;i0on2;esi0;aiMondur0A;a6ha01r5u2;atema0Einea2ya00;!-biss2;au;ena0Aieche8;b3mb2;ia;un;i3rank2;reiX;dschi,n2;nlF;cu6l4ritr3s2;tlD;ea; salv3fenbeinküs2;te;ad2;or;e6omini3schibu2änemark;ti;ca,k2;anische republ2;ik;mokratische re3utschl2;and;publik kon2;go;hi9osta 2;rica;aAe8hutSo6r4u2;lgaMr2;kina faso,undi;asiEun2;ei;livi0snien und herzegowi2tswa2;na;l2n7;gi0ize;h4nglades3rbad2;os;ch;am3ra2;in;as;fghaBl7n4r3serbaidschDustra2;li0;genti1me1;dorra,go3tigua und barbu2;da;la;ba1ge2;ri0;ni0;en;ni2;st2;an",
    "Region": "true¦0:1S;1:20;a1Yb1Rc1Hd1Ces1Bf18g12h0Zi0Wj0Uk0Sl0Rm0GnZoXpSqPrMsDtAut9v6w4y2zacatec20;o05u2;cat17kZ;a2est vi4isconsin,yomi13;rwick0shington dc;er3i2;rgin1R;acruz,mont;ah,tar pradesh;a3e2laxca1DuscaB;nnessee,x1Q;bas0Kmaulip1PsmK;a7i5o3taf0Ou2ylh13;ffWrr02s0Y;me10no1Auth 2;cTdS;ber1Hc2naloa;hu0Sily;n3skatchew0Rxo2;ny; luis potosi,ta catari1;a2hode8;j2ngp04;asth0Mshahi;inghai,u2;e2intana roo;bec,ensYreta0E;ara5e3rince edward2; isW;i,nnsylv2rnambu02;an13;!na;axa0Ndisha,h2klaho1Antar2reg5x04;io;ayarit,eCo4u2;evo le2nav0L;on;r2tt0Rva scot0W;f7mandy,th2; 2ampton0;c4d3yo2;rk0;ako0X;aroli1;olk;bras0Wva01w2; 3foundland2;! and labrador;brunswick,hamp0jers3mexiJyork2;! state;ey;a7i3o2;nta1relos;ch4dlands,n3ss2;issippi,ouri;as geraFneso0K;igPoacP;dhya,harasht03ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca0eiHincoln0ouis7;a2entucky,hul1;ns08rnata0Dshmir;alis2iangxi;co;daho,llino3nd2owa;ia1;is;a3ert2idalFunB;ford0;mp0waii;ansu,eorgWlou6u2;an3erre2izhou,jarat;ro;ajuato,gdo2;ng;cester0;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby0;a9ea8hi7o2umbrH;ahui5l4nnectic3rsi2ventry;ca;ut;iMorado;la;apEhuahua;ra;l8m2;bridge0peche;a5ritish columb7uck2;ingham0;shi2;re;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo1kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "MaleName": "true¦0:CB;1:BL;2:BZ;3:B5;4:9N;5:BW;6:AT;7:9V;8:BD;9:AX;A:AO;aB4bA8c97d87e7Gf6Yg6Hh5Xi5Jj4Mk4Cl3Sm2Qn2Fo29p23qu21r1Bs0Qt06u05v00wNxavi4yGzB;aBor0;cBh8Ine;hCkB;!aB1;ar52eB0;ass2i,oCuB;sDu26;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByaAP;lfgang,odrow;lBn1P;bDey,frBIlB;aA5iB;am,e,s;e89ur;i,nde7sB;!l6t1;de,lCrr5yB;l1ne;lBt4;a92y;aEern1iB;cCha0nceBrg9Bva0;!nt;ente,t5B;lentin4An8Xughn;lyss4Nsm0;aTeOhKiIoErCyB;!l4ro8s1;av9QeBist0oy,um0;nt9Iv55y;bDdd,mBny;!as,mBoharu;aAXie,y;i83y;mBt9;!my,othy;adDeoCia7DomB;!as;!do7M;!de9;dErB;en8GrB;an8FeBy;ll,n8E;!dy;dgh,ic9Tnn4req,ts46;aScotQeOhKiIoGpenc4tBur1Pylve8Gzym1;anEeBua7B;f0phCvBwa7A;e57ie;an,en;!islaw,l6;lom1nA2uB;leyma8ta;dBl7Im1;!n6;aDeB;lBrm0;d1t1;h6Rne,qu0Uun,wn,y8;aBbasti0k1Xl41rg40th,ymo9H;m9n;!tB;!ie,y;lCmBnti21q4Iul;!mAu3;ik,vato6U;aWeShe91iOoFuCyB;an,ou;b6KdCf9pe6PssB;!elAE;ol2Uy;an,bIcHdGel,geFh0landA5mEnDry,sCyB;!ce;coe,s;!a94nA;an,eo;l3Jr;e4Pg4n6olfo,ri67;co,ky;bAer8L;cBl6;ar5Nc5MhCkBo;!ey,ie,y;a84ie;gCid,ub5x,yBza;ansh,nS;g8ViB;na8Rs;ch5Xfa3lDmCndBpha3sh6Sul,ymo6Y;al9Uol2By;i9Eon;f,ph;ent2inB;cy,t1;aFeDhilCier61ol,reB;st1;!ip,lip;d97rcy,tB;ar,e2V;b3Rdra6Dt43ul;ctav2Vm92rFsCtBum8Tw5;is,to;aCc8RvB;al51;ma;i,l48vJ;athJeHiDoB;aBel,l0ma0rm0;h,m;cCg3i3HkB;h6Tola;hol5WkBol5W;!ol5V;al,d,il,ls1vB;il4Z;anBy;!a3i3;aWeTiKoFuCyB;l21r1;hamCr5XstaB;fa,p4F;ed,mF;dibo,e,hamDis1XntCsBussa;es,he;e,y;ad,ed,mB;ad,ed;cGgu3kElDnCtchB;!e7;a77ik;house,o03t1;e,olB;aj;ah,hBk6;a3eB;al,l;hClv2rB;le,ri7v2;di,met;ck,hNlLmOnu3rHs1tDuricCxB;!imilian88we7;e,io;eo,hCi51tB;!eo,hew,ia;eBis;us,w;cDio,ko,lCqu6Fsha7tBv2;i2Gy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMlo2QoIuCyB;le,nd1;cEiDkBth4;aBe;!s;gi,s;as,iaB;no;g0nn6QrenDuBwe7;!iB;e,s;!zo;am,on3;a77evi,la4QnDoBst4vi;!nB;!a5Zel;!ny;mCnBr66ur4Rwr4R;ce,d1;ar,o4L;aIeDhaled,iBrist4Turt5My3A;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5B;e0Yy;a7ri4L;r,th;na67rBthem;im,l;aYeQiOoDuB;an,liBst2;an,o,us;aqu2eJhnInGrEsB;eChBi77ue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4W;!ath4Vie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;a5IemCmai8oBry;me,ni0N;i6Qy;!e57rB;ey,y;cHd5kGmFrDsCvi4yB;!d5s1;on,p4;ed,od,rBv4L;e4Yod;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0i6Bma3sac;ac,iaB;h,s;a,vinBw2;!g;k,nngu51;!r;nacBor;io;im;in,n;aJeFina4UoDuByd55;be24gBmber4BsD;h,o;m4ra31sBwa3W;se2;aDctCitCn4DrB;be1Zm0;or;th;bKlJmza,nIo,rDsCyB;a42d5;an,s0;lEo4ErDuBv6;hi3Zki,tB;a,o;is1y;an,ey;k,s;!im;ib;aPeLiKlenJoHrDuB;illerBstavo;mo;aDegBov4;!g,orB;io,y;dy,h54nt;nzaBrd1;lo;!n;lb4Nno,ovan4O;ne,oDrB;aBry;ld,rd4R;ffr6rge;bri3l5rBv2;la1Yr3Eth,y;aReNiLlJorr0IrB;anDedBitz;!dAeBri23;ri22;cDkB;!ie,lB;in,yn;esJisB;!co,zek;etch4oB;yd;d3lBonn;ip;deriDliCng,rnB;an01;pe,x;co;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym5zra;an,ere2V;gi,iCnBrol,v2w2;est42ie;c07k;och,rique,zo;aGerFiCmB;aFe2P;lCrB;!h0;!io;s1y;nu3;be09d1iEliDmCt1viBwood;n,s;er,o;ot1Ts;!as,j40sB;ha;a2en;!dAg32mEuCwB;a25in;arB;do;o0Ru0R;l,nB;est;aYeOiLoErDuCwByl0;ay8ight;a8dl6nc0st2;ag0ew;minFnDri0ugCyB;le;!l03;!a29nBov0;e7ie,y;go,icB;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt4;ay8ey;en,in;hawn,mo07;ek,ri0E;is,nBv4;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne7rByl;eBin,yl;l2Sn;n,o,us;!e,i3ny;iBon;an,en,on;e,lB;as;a06e04hViar0lKoFrDurtCyrB;il,us;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;fo0Dt1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aGeErisCuB;ck;!tB;i0oph4;st4;er;d,rlBs;eBie;s,y;cBdric,s11;il;lEmer1rB;ey,lCro7y;ll;!os,t1;eb,v2;ar02eUilTlaSoPrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dCndB;en,on;!foBl6y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!r0X;aBie;rd0P;!edict,iCjam2nA;ie,y;to;n6rBt;eBy;tt;ey;ar0Ub0Kd0Ggust2hm0Did5ja0BlZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi3jun,maFnDon,tBy0;hBu03;ur;av,oB;ld;an,nd07;el;ie;ta;aq;dGgel02tB;hoEoB;i8nB;!iZy;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,bLd5eHfEi,l0onDphonGt1vB;aJin;on;so,zo;onCrB;edN;so;c,jaCksandBssaCx;ar,er;ndB;ro;ertH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "MaleNoun": "true¦0:BH;1:BO;2:BB;3:BG;4:AY;5:BN;6:9W;7:AH;8:8E;9:5A;A:BF;B:BE;aA8b91c8Md8De7Rf6Vg67h5Hi5Bj52k48l3Zm3Kn3Ao32p27r1Rs0St0Cu04vVwKxiao1Pyig95zC;aeh6eHiGuCwa1ypri8Z;eg0ga1kae1LsCwae2D;ammenCc0Gt07;ha1sC;chBRto9N;nsBvi6S;do1itCntralraArou8Yug0;g83raB9so9Oungs2A;aKeGiCortla5N;derspATlDrC;kungsgr4AtschaftsB5;lenCs4;!be78;chselBAiEltDrt0stC;-p0en6W;kriAXm70raB1;hnachtsbaB0ne;gChlB1ld;en,goAC;eFiEorC;b8Fga1ha1jahreszeitAVo8Vra1sCwuerf0;cAIi82pK;etnam88ttorio;rCteran0;bEda9Aein5Vh9Qlu2sCt9F;e,tC;o91yn0;ae8raucherpr8W;eberImGnErCs-92;nenAPspCwa94;ru1;-8Zf9Hm50terCwi9I;ga1nehmensgewin6;fa1ga1stCwelt2S;ae8;ga1sch0V;aPeLhKiJoFrCsche5Buerk0;aCes0o3Q;kt9uC;ergae2m;desscEeDn,rCuJ;er7Xnad7X;ne,pf0;huAP;erv9CscAM;e8Bier5orva8Or4;ilErCsAxt0;mi6roC;ri2;en,nehme25;g0milenCnz,rif2M;!rebe8Y;a09chXeUiSk2Ylowak0oQpNtDuedCwi34;en5To2paz1Ewe2;aIeHolGreiEuC;dCehl0;e3ien9C;fenCk,t5P;!w4G;pe,tU;i2Er2E;atCdtt9Be8Ohl,ndo7Quse0;en,sC;b4Ip7Fsekreta9V;d-6Ue3Bi4Bons9rC;it,uC;eng,ng;eh6ld7mmernachtst9KwjeAyin3AzialC;d6Xi2plae6staaA;cherheitsCn6;g4Kk2P;g0kt9nCrb0;atCi9s9;or0s;aLeJiIlachtbu8BmHolz,rGuEwC;aCu1;n7Srzwa7T;es7Nhe,ldC;en5D;e73i61;erz0i5Tol5T;enen6Nl7Am4;rbenhaCwardnad5;uf0;d4Xed0rCtt0;pi1;al,e8Qft,rg,tell58;aQeKiHotGuC;eCmaen0ss0;ckChe;en,ga1schlC;üs5;or0sti42;e77ngDos,sCval0z6J;ikofa2Xse;!o;be7PchtsGfe1XgDh5iCkt9praesenta3ser12xro5D;cht8Rn77z;enDiC;erungsk1Wss67;!wa75;ext4Zs30;hm0ng,tko,um,viv;aZeWhilViUlRoOrDsych6PuC;n7Zts8E;aesidentLeJiIoC;duFfEtCz6T;ago5SestC;a3en;ess9it;ktivitaetszuwäCze3;ch5;m31nzBvat48;i6NsseC;bericht0;en,schaftskand1T;lizDol,rtCst0;illo,ugi5L;eik1Di2;aCeitg0;eCn6D;ne6Mtz0;cass5OerrEl5L;ippe,osoph0;nDrC;ot;!g;es5nHp4rFsEtDzC;if72;ie3riar2Qt0;sagi80t9;kCtei4Z;!pl79;et2Pts2M;berIeGffizi7Wgoni-ZrDsCwe74;t3Iwa66;der7PganisDtC;en,sverein0;at9m0;koClk6F;l5Pnom0;kommandiere8on;aGeEiDordC;en,o2we2;ed2Clako1V;rv0uC;an41ba6O;chEehrbod0m0rr0tionalC;i2sC;o0Yta7;baCfahr0;rs5U;aPeNiLoEuDythC;en,os;enteferi1s6Jt;enc7JnaHrGsC;c7IlemC;-Cs;aktiC;vi2;d0g0ill4;r1Ut30;nisterp4OtgliedsCyazawa;s5Ita7;chanism0nC;g,s1Q;er69n0Tsssta1Otthi1J;aJeHiGoC;bbyi2eDhnC;absch76;hCw0;ne58;ami6ban4efe3Qn3J;bens6MiC;be,tzinsB;ed0fontai6i0stw17;aYinderWn0ZoGrEuCw4;nd0rC;d0on,se51;eCi6Do7;d2Mi4S;eQhlhau3All6BmNnErrCsteng1H;espon46uptionsskC;and41;fIkurHrGsEtDzernC;e4Us;inent2Brahe3;e5NumC;!e3;ad;re3;erenzkClikt26;reis0;mDpC;liz0o3Dromis5;and3Ju3C;pf0;ga3YsC;chuh0o4D;mpfeins5EnGpita0rCtholikB;amira,din3KlCst0;-ChD;hCot5R;ei0S;al,dC;id7;aIeHiGoEuC;d0e09ngsoCri2;zia15;ch0e1RschCurna14;ka;a1g39;ns,ts;cks4hrCns0;esan25ga1;de3Lg-metall-2Nmpul5nErDsC;a1la1T;a4Trt5F;dustries3Zgo,itiat9sa29teCvest9;nCresse3;da3;aKeHiGoDuCwa1;ngerstre4Gt;chschulreCef0;kt9;or0;nw3Dpparc2S;i04lDnCrr0;ni1r4A;dBmI;bermReQf0k0nIrGusC;en,haltC;en,sC;!sC;tre4G;a3EtmC;ut;dlungsspiIg,sC;-Ce7geo0Y;hFjC;oDueC;rg0;ch0e0U;ag0;el4N;f0upt2Q;as;-35aVeLinzbu0PlaKoIrCuld0;ad,enzuebGieFossCue8;bCku8ra4J;etriC;ebe;ch0;er4H;izueCldsto6uvern1W;ta;nz;dank0fange6nIo0FrGsFwiC;nnDssensgC;rue8;e,s;a1ichtspun3Mundheitsschaed0;h0Qichtssa1UstensaC;ft;eraCo0Z;el0lC;!inspe1J;eEmsachurdia,ng,rt0zaC;-sCsC;treif0;rt0st0;a02eZiSlMortschri0PrGuC;eEnCs5;damentaCk0;li2;hrerschei37r2s25;aEeCiedL;iCu8;d13landv2U;geb1UnC;k0zC;!o1Z;e1GuC;echtlingBgC;haClots0;ef0fC;enC;!s;lGnDrmenCsc3U;ku8;anzCn0;e1Bjongl0VmC;aer2R;ipin0XmC;en,s;i8ldCrd0Vtz0;beC;rg;d0eFktEnDvorC;itB;g,s;en,or0;d0ll0;be14g4hrg2QiQlPmNngKrJtIuGwa1IxC;-Epe0ZtC;reC;mi2;kommu08p0N;-Cg0ro;kommissionsp0Ls1G;aAo;b0loe15;elhCpa38;arC;dt;igRpC;fa1;efa3lemann-jens0;dgGnCsr2I;b27dring0Of30gEkla1sCzelvert18;ae28chniC;tt0;a1r28;enoC;ss0;aIeFiDonalds4uC;ft,rch2G;eCplom7s04;n2pg0;al,moCng;kr7nstC;ra3;eChrendorf;mon0n0;astro,hFlint4ommonwealth0Qsu-C;vorsiC;tze8;nd0;aLeHinGrC;istDoC;ni2;dCen;emokr7;es0;fredaDmieC;rie5;ktC;eur;ot0;a0FeXiVluem,oRrKuC;chstab0ll0nDr14ss0trC;os;desDzenthC;al;pCs07;raeC;siC;de3;anFei,iDoCunn0;ck0;efCt0;en,ka2;cheneCdt;xpeC;rt0;d0eCg0rk;d0rsenC;ga1neuC;li1;olC;og0;amt0itSlaRneluxPrIsFtriebDwCzirk;ei5;e,sraC;et0;chluCen;esC;seI;eicheHg,iGtEufsC;soC;ld7;hoC;ld;chA;!n;-sC;ta7;ng0;ra0K;c4hnhoef0lk4rnevTuC;loew0m,stei6t0;ne;b0Werzt0ffront,ge3irporAkt0Nl0Im0Fn03ppet02rWsRtMuC;fIgenzHsEtoC;kCm7r0;onzerV;flu0Cga1nahmefC;aeC;ll0;eug0;schDtraC;eg0gs0C;rei,wu1;em,laEomC;tesAvC;ersuc0L;ntCs;ik;i7peJtC;a,ronC;aCom0;ut0;at0;beitsFchiteEeDtiC;keln;ns;kt0;plC;aeI;it;aLdJfa1grIrHsDtCzuO;eil0;aeEcDpC;ruec03;hlaK;tz0;eiz;iff0;ers4ra1;on;ly2rC;chi2;aDtskollC;eg0;to;!kohol,lEptC;raC;um;einC;ga1;eurBiC;enEonaDvi2;st0;er0;kur5;!en;ts;nt0;en;ga1sC;chDtricC;he;luC;es5;se;ng",
    "FemaleNoun": "true¦0:20;1:28;a23b1Xc1Wd1Pe1If1Cg15h0Xin0Wj0Uk0Ol0Km09n05o04p01rWsItBun9v7w2yoko;a5er4i3oh2to,ut;lf2Anungsnot;edergebu2Artschaft1I;kstatt,leigh;f22llf27nd;e2w-tocA;ag,rmoeg1F;i2s08ternehmenssteuE;!cef;a7elefonnuTim0Yo5r3u2;er,ge0K;auer2euha0J;!fei0;c2des10ec2;ht0;lf1Wt,u1R;a1Ech9ed,ozialh1Pp7s,t2uchocI;a5e3raf2u1P;e,kaKt1F;rbeh1Mu2;ern;dlmay0hm0si;e2ur;rb0zi0K;a6neeb16ul5w2;e2ienbach0;i2st01;nepe1z;d,tZ;er1Du;a5e3ied17u2;eck,ndC;d,g15publi2;ka;f,umf1D;arlamentska3ds,e1hilharmon0Rlo,o1r2;aeamb11opaga1A;mm0;eko0Kno,pPrders;a3e2ot,ummO;tzha10ubau0;bel2to,z5;sch0H;aBeAi6or5u2;e3kakama2tt0;li;ller-mün6tt0;al,genpo1;l4neraloel0Ass,t2;h0Ss2;chuW;ch;hrwert06rk0Ltaph0;ni0rk,tthaeus-mai0uA;as4einwaCpgs,u2;ft2st;f0Rwaf0M;ker-schuel0t;am4l3oerperWprf,u2;er,n1;a03ient0D;eras,m2;er2;!n;ahresfri1uge2;nd;gebo3s07;a5e3il0Bochbu2rk;rg;i2ll0;mZrZ;ftElbins02nd4u2;s2t;haltJtu0;!voll;e3glf,osalNu2;n1s;bu07d4gen3isWld8rvais2werbekapitalH;es;d,wa05;enktafTu2;ld;a6e5inanzhVlUo4r2uessR;au,eiheits2g,i1;straU;lt0rmO;d0i0;hXu1;-mail,g,hefr7inkomm5n3rb2;schaft5;dstuOtwicklung2;shM;en2;steu0;au;-mark,a5hs,oppel-c8pa,r2unkelziff0;ittstaatenkla3ogenmaf2;ia;usB;g2u0;!m2;ar;ds;a4e3gag,ib6lutt2ru1;at;ih8tt0;chmann,erb3rm0yernhypo;er;el;bfAg8n6r2;beitslosenh3m2t;ut;il2;fe;g1two6;st;!e2;nda;ah2;rt",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;gw,hr;ax,cn,ndianG;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "NeuterNoun": "true¦0:D9;1:D7;2:CW;3:CO;4:D0;5:BX;6:BM;7:CZ;8:B2;9:CU;aBSbACcA6d9Ce8Lf7Xg6Lh5Ui5Fj5Bk42l3Pm32n2Po2Ip1Zquart1Yr1Ns0Xt0Gu08vUwHzA;ahl04eEiDuA;eri8gestaend8UsammenA;lB4s2WwA;ac2Qi14;el5mm1t5O;hnt3iAntr0ug;ch0ta7I;aIeDiBoAu9B;chenend0ert1hlwoll0lfenbueCNrt7M;eAsm91;n,sBG;iDrkCsAtt1;en,tA;d26f2Djordan5W;e7Hs;hna7Dssruß5U;hCn2KrschASsBttA;!enme1;hingtAFs4B;lergebC1rzCI;at5JeHiFoAukov8Q;elk7lDrA;bi9SgBFh61jahreAkommBYstandsmitglied6Tur73wo88;n,sA;!niveAK;k2um0;chy-reg15deo,eAg3Esi1;lfach2rt3;hik3rA;bDdi47faBHgnuBYhAkehrsC1moBYn8Es3Nt2J;aBo1uetA;ungsBZ;elt7Zlt0;re9undu6J;eberGf1mEnBrteilAs-repraesentanCD;!en,s;gBhe6QterAwe9Z;haCCn86;ezief1l5W;deAEla6satzA;minC9plC9;e0YlA1maAT;aPeLhHiGoErCschetsche5PuA;chAeb5Qtzi4A;!olsky-zit4K;avnik,e5RiA;bu14eA3;desAr5;opf1urteil5;bBNer5;eAuer5J;aterAm0;!haBXsA;!t5H;am,her2MlArrito34;!eA;fonAkommunikations7L;!e,gesprae8;bBRgebue27iw2Il2uziAF;aXchReQhando3UiPoOpMrinag7NtDuAyst0F;b0MedAjBC;frankr3KosA;seti0taB2;aEeuergeDich3MrBuA;di0eck62;aAeichhoelz1;f45lsu6ssenki7O;heimn8Sld7;atsCbilitaets2OdtAedt9;schloA1weA;rk0;d4Foberhaeupt1t8G;ekt80ielA;!zeug;ftwareBAndierungsg61;bi2Jlve7V;chst3kretari3Ome7U;aDei33iffCkop93lAmier88ott44rJweine4;aAeppt92oss8L;chtpf97g36;!e4;fe,uA;fen7Os0O;arAc0Iig8Mngerhaus0;brueck0la6;aJeFhein3WiDosto7VuA;d1eBhrgA8mae4HndschrAss7I;eib0;g0ssels16;ese7CndAsik0;er4fle5R;chnu8JgCiBnn0praesentantenhaus88sAutl4Evi1;ervo2Vt-62ult38;ch86seu4V;im2;ed1sta8ZtAPu9;e8Yi1;aQeOfMhaenom0ilotproLlJoHrA;aFe7KiEoA;-kopf-eCblBduAf4ZgraAJjeAra,toko9P;kt5;em0;in6W;nziABvile4H;ba2Lg;k1rAsFtsdam;t30zell16;aAus;edoy1kat0;je1Z;arrAAerd5lichAu6;tfa8;acekeepi2Dki2RrsoA;na58;k9Upier5rAss82;adi2ke8Fla96tner5H;bEeDffen81goniChr0pf7rche6QstAxford;dAslawonien31;eutsch2Z;-volk2la6;ko-aud54l,sterreich7H;dachlosen09erAje1Nst;haus4Gschle9E;aHeFiCordA;bos3Fir2Trhein-westfAzype83;al0;eAger-del8Pve7Q;dersacAmands2Q;hs0;st,tz49uA;-del1Hg68see6A;chAhrungs8Pshoern1;barlaBsA;pi3;enAnd;de7S;aQeNiFoDuA;enBsAtt2A;e0ikt6Lt1;ch0st1;dell6Xrsl7AsAtive4v0U;kau6Wt5D;ami,liGnFsstEtA;gliedBleid,telA;!a3Ome1n;!er4sA;!l1N;rau0;is0Hus;e98ta1;cklenburg-vorpomme7DdiBer,gawa7GisAnschenre3Msse1Dta8A;s0ter-baf7H;en,ka85;ed9iEnCrkeBssAteria44;!akPe;nz8Qti16;d7SnAoev1;heim;la6nz;aJeGiFoDuA;dwig3LeBmpur,xA;em6Dor;be5Qn0;b,ch,eA;ch1;c31ed,ssab6C;benBd1e6QnzAtt5AutA;kir8;!s7O;bor,ch0denschlussg24eBgAnd62teinis9;er43;ch4Mnd7;a07er51i02lZnYoKrDuA;erz3pf1rA;distAsbaromet1;an;aDeCiA;egsAteP;g7Overbre9;ditinst0Muz2;f76nkenA;be6LhaA;eus,us;ble35eMllektivs,mLnEpBrA;n,ps;enhBfA;-an-kopf-re7Kki8A;ag0;kurs71sFt0vergenzCzA;eAil;ntrationslag1pt0rt;kriA;teA;ri0;ta2Uul0E;ite2man4R;ln,nigrT;ie;agenfu3Cische2oA;e4FstA;er59;el,gali,nArchenvolksb6Hsangani;dAo;!eA;rAs;!n,z3Z;bine5WiserHlFnin9pitErCsBvaliersdeliA;kt;chmNs3;atscAlsru2Btel4Q;hi;a2Iel;iAku3;b1for0Y;rBslauA;te5K;ei8;aAorda0Uu2M;-BhrAzzfe5B;e1Shundert5tause6zeh6E;wo2Q;mMnBsrae28zmA;ir;dGkrafttret0la6nFsDterBvestmentbankiA;ng;e2JieuAn6R;rs;ekt0tA;itut0;e56sbru3V;iCustrieA;lAu11;ae42;vidu0z;itAmobilie3B;at;aReKiHoAundert0;-chi-minh-3IchFeBf,lOngkoArm4Ct47;ng47;chstCrA;geAn1;ra6B;ma58;lohnIwa1S;lfs67nA;der5RtA;erF;bronFer3Wft,iCkt2FlBrzAss0u;!en,ogenaura8;ler4Bms-burton-28;l5WmAzo3;!atA;la6;!-2O;aHeGlbjahr2m3SnDsch17uA;ptquarti1sA;!e3PhaltsdA;efiz1B;au,dAnov1sa-spar2E;elAtu8;n,sb0Z;us7;g,r;eQiOlNoLrEuA;atemala-2ReteCtA;a0FhA;ab0;r4sieg3;emi0iechische4ossEuA;en,ndA;gBsA;atzur06tueck5;esetz37;britanAuV;ni0;ettArl3J;ing0;ue2J;ft,pfeltreA;ff0;b01de3PfZgenXhVlPmLn,orKpae2GrHsCtrae3PwA;aAerbe30i5N;e0Pnd;amtmeta4LchBetzZicht7praechAtod0undheit38;!e4s;aeftAi2BlOo4O;!en,sA;fe2Fv41;aeBichtAueS;en,s48;t0usc02;gi0;einschaftsuCueA;se,tA;!er;nt0Z;aDdA;eBhaA;e0Zus2H;r4s;ecA;ht1;aeAi35o1;lt1;teA;il;aeng09eAuehl0;cht0;aeudeBet,ietA;!eA;n,s;aSeNi1lIor0rCuA;eAtt1;hrung1Anft3;ankreichs,iedAuehstü1I;ensBrichA;shaf0;ab0XgA;espraecA;he;aggschiff,eDoreCugA;bAzL;la2O;nz;is8;hlverhalt0ld7n0XrnsehDstBuA;er,illet1V;ivaAla6spiel49;ls;due3Ben;ch,ech,hrBss,x,zA;it;waBzA;eug5;ss1;hepaZiSlQnMrFsEu-DxA;-Aemp3il;juA;goslawi0;lae03;chbo23s0;be,dFeigEfuDgebAmittlungs2Sstaun0;niA;sseA;!n,s;rt;nisse4;b1Jgescho2Bo3;d2glCsembl2tA;setz0wicklungslaA;end,nd;a6is8;eAsa26;me2Ond;!er,gentumsv2OnAs0;fDgreif0ko3Fle1MvBwanderungsAzelanli2W;gese1Z;ernA;ehm0;amilienhaeAuehlungsvermo2S;us1;ar;aZeTiQoJrDuA;eBnkAschan1Itze6;eln;ll,sseldorf;ama,eDittA;el,laA;eAnd;nd1;hAieYsd0;bu8;erfFku21ppelBrA;f,tmu6;besteuerungsBzA;imm1;abA;ko2T;ch0er4;amanteAenstmaed9ng5sziplinar1Q;ngA;eschaeft;bEfizit5kr2ElegationDsBtail07utschAzib3;lan0P;aAogestr3s0K;st1;smitglied1;ak3;ch,eCmask2LrAt0yt05;l18mA;stadt;ch7;hDoBreA;do;mebaArps;ck;eAil2;mni0U;a0Ge02iYlaWoTrNuAyt2;chLdg1XeIkare0AndesDrgtCssA;geA;ld1;heat1;aDg1FkriminaClaA;eAndJ;nd7;laA;mt2;ch7ndA;el,nA;iss2;!eE;andenEem0uA;essBttoinlandsproduktA;!es;elA;!s;burgs;nn,rd,sA;ni0tA;on;eAtt;tt1;er,ldA;er4uA;ngA;sw0U;dLiKkanntwJlGrCsAtt5;chaeftigungsverhä0NtrA;eb0;g-karaBnA;au;ba8;ch;faBgraA;ds;st;erd0;ne4spiel5;aueCeAuerf0D;nk0;denGfFgElleDnd,uByeA;rn;gewerAspar0;be;tt;!an;oeg;!-A;bad0;b0Re0Ni0Lk0Fl0Bmt2n05rTsQtLuA;fGgeDktions0TsA;chwiBla6maEsterb0;nd;tz;nAs;!maA;ss;bCsBtragsvA;olum0;eh0;egeH;eli1h0lanDomkrafCtentA;at5;!en;twerks;ta;i0ylA;verfaA;hr0;beitsCchiv0guBzneiA;mittel4;meD;gHlosengeld2vDzeitA;koBmodeA;ll;nt0;erhaeA;ltA;niA;sse;ebiN;daluEgel2liDsBwAzN;es0;eh0iA;nn0;eg0;si0;gi1lheilAt1;miA;tt3;el;tAw;enzCienA;pakA;et;ei9;ch0;ds,r2;es;gypt0mt7thioA;pi0;er4;!n;enEgeordneBhoer0koA;mm0;tenA;haA;us;deBteu1;er;ss0;en",
    "Month": "true¦a6dez4febr3j1m0nov4okto5sept4;ai,ärz;an1u0;li,ni;uar;em0;ber;pril,ugust",
    "WeekDay": "true¦d2freit4mont4s0;am2onn0;abend,t2;ien0onner0;st0;ag",
    "FemaleName": "true¦0:FZ;1:G3;2:FS;3:FE;4:FD;5:FT;6:ES;7:EQ;8:GG;9:F0;A:GC;B:E6;C:G9;D:FP;E:FM;F:EH;aE3bD5cB9dAJe9Hf92g8Ih84i7Tj6Vk61l4Pm39n2Uo2Rp2Gqu2Fr1Ps0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7FeHol1UvG;et7onBA;le0sen3;an9endBOhiB5iG;lInG;if3BniGo0;e,f3A;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9YenG2;kD0tor3;da,l8Wnus,rG;a,nGoniD3;a,iDD;leGnesED;nDMrG;i1y;aSePhNiMoJrGu6y4;acG4iGu0E;c3na,sG;h9Nta;nHrG;a,i;i9Kya;a5JffaCHna,s5;al3eGomasi0;a,l8Ho6Yres1;g7Vo6XrHssG;!a,ie;eFi,ri8;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmCBra;!ka;a,t5;at5it5;a06carlet2Ze04hUiSkye,oQtMuHyG;bFKlvi1;e,sHzG;an2Uet7ie,y;anGi8;!a,e,nG;aEe;aIeG;fGl3EphG;an2;cF9r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobh76;dy;aKeGirlBMo0y6;ba,e0i6lIrG;iGrBQyl;!d71;ia,lBW;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;lGre0;en1i0ma;bMdLi9lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBNome;e,ie;in1ri0;a02eXhViToHuG;by,thBK;bQcPlOnNsHwe0xG;an94ie,y;aHeGie,lC;ann8ll1marBFtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an9;hel53io;bin,erByn;a,cGkki,na,ta;helBZki;ea,iannDXoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cARkaE;chGe,i0mo0n5EquCDvDy0;aCCelGi9;!e,le;een2ia0;aMeLhJoIrG;iGudenAW;scil1Uyamva9;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaBBtHulG;a,et7in1;ricGsy,tA8;a,e,ia;ctav3deHfAWlGphAW;a,ga,iv3;l3t7;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoB2k8BolG;a,eBH;!mh;l7Tna,risF;dIi5PnHo23taG;li1s5;cy,et7;eAiCO;a01ckenz2eViLoIrignayani,uriBGyG;a,rG;a,na,tAS;i4ll9XnG;a,iG;ca,ka,qB4;a,chOkaNlJmi,nIrGtzi;aGiam;!n9;a,dy,erva,h,n2;a,dIi9JlG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi61isFyl;an2iGliF;nGsAM;a,da;!an,han;b08c9Ed06e,g04i03l01nZrKtJuHv6Sx87yGz2;a,bell,ra;de,rG;a,eD;h75il9t2;a,cSgOiJjor2l6In2s5tIyG;!aGbe5QjaAlou;m,n9S;a,ha,i0;!aIbALeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri7;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n9;a,re,s2;daGg2;!l2W;alCd2elGge,isBGon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9SnGsAQ;!a,e9R;a,sAO;aB1cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n9;is,l1GrHtt2uG;el6is1;aIeHi8na,rG;a6Zi8;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket7z2;a,et7;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Ge;!n4F;b7Terty;!n5R;aNda,e0iLla,nKoIslARtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Si6kes5na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5B;a,en,iGy;!e,n48;ri,urtn9A;aMerLl99mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6PiJlInHrG;a,i,ri;d4na;ey,i,l9Qs2y;ra,s5;c8Wi5XlOma6nyakumari,rMss5LtJviByG;!e,lG;a,eG;e,i78;a5EeHhGi3PlCri0y;ar5Cer5Cie,leDr9Fy;!lyn73;a,en,iGl4Uyn;!ma,n31sF;ei72i,l2;a04eVilToMuG;anKdJliGst56;aHeGsF;!nAt0W;!n8X;i2Ry;a,iB;!anLcelCd5Vel71han6IlJni,sHva0yG;a,ce;eGie;fi0lCph4X;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Qsi5Q;i,ri;!a,el6Pif1RnG;a,et7iGy;!e,f1P;a,e72iHnG;a,e71iG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min8;a8eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6U;do4;!belGdo4;!a,e,l2G;e0i0ma;a,di4es,gr5R;el9ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il75lKnJrGtt2yl75z6D;iGmo4Fri4G;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolC;acHetGisel9;a,chD;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov71selG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald35i,m2Stru73;et7i5T;a,eGna;s1Nvieve;briel3Fil,le,rnet,yle;aReOio0loMrG;anHe9iG;da,e9;!cG;esHiGoi0G;n1s3V;!ca;!rG;a,en43;lHrnG;!an9;ec3ic3;rHtiGy8;ma;ah,rah;d0FileDkBl00mUn4ArRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2H;geni1la,ni3R;h52ta;meral9peranJtG;eHhGrel6;er;l2Pr;za;iGma,nest29yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;a,en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoGul2U;lor51miniq3Yn30rGtt2;a,eDis,la,othGthy;ea,y;an09naEonAx2;anPbOde,eNiLja,lImetr3nGsir4U;a,iG;ce,se;a,iHla,orGphiA;es,is;a,l5J;dGrdG;re;!d4Mna;!b2CoraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1WyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et7iG;!ca,el1Aka;arGia;is;a0Qe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1D;aId28iGn28riA;!nG;a,e,n1;!l1S;n2sG;tanGuelo;ce,za;eGleD;en,t7;aIeoHotG;il4B;!pat4;ir8rIudG;et7iG;a,ne;a,e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHiGy;!an1e,n1;!l;lseHrG;!i8yl;a,y;nLrG;isJlHmG;aiA;a,eGot7;n1t7;!sa;d4el1PtG;al,el1O;cHlG;es7i3F;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2GsG;a2Fie;a,iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok8;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t8;an0e,nG;da,na;i8y;bbi8nG;iBn2;ancGossom,ythe;a,he;ca;aRcky,lin9niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy8;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et7iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi8yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t7;an19elG;le;aYdWeUgQiOja,nHtoGya;inet7n3;!aJeHiGmI;e,ka;!mGt7;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t7;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n9;da;aTba,eNiKlIma,ta,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i8y;!e;il;ah",
    "Pronoun": "true¦a09b06d01eXiSjeNkeinMletzteres,mDnichts,paar,s6uns5viele08w0;a3e2i1o0;!bei,geg05mRnach,rin,von;ev5r;l5n00r;nn,rum,s;!er04;eine5i4o0ämtS;l1v0;iele;che0;m,n,r,s;ch,e;!n,r,s;an5e1i0;ch,r;hrere8i0;n0stQ;!e0;!r;!ch0;!e0;!m,n,s;!eL;d1gliche0neN;!n;e0weder;!m,n,r0s;!mann;c3h1nwiewe0;it;m,n0rF;!en;h,k;inige2r,s,t1u0;ch,r8;liche;n,r,s;e3i0u;ch,e0;jen0s6;ig2;n1r1ss1;eide1ißch0;en;!n,r;ll0nderem;!e0;!m,n,r,s",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "Person": "true¦ashton kutchSbRcNdKeIgastMhGinez,jEkDleCmBnettJoAp8r4s3t2v0;a0irgin maG;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uB;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipJ;lmIris hiltC;prah winfrFra;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers7k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt1ick wolf;lt0nte;on;ar0ruz;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Modal": "true¦d9k6m2soll1w0;illColl6;!en,st,t6;agAoch8u1ög7ü0;ss6ßt;ss0ß0;!t2;ann6onn4önn0;en,t0;!e3;arf3urf1ürf0;en,t;te0;!n,st,t;!st",
    "Infinitive": "true¦0:IU;1:IS;2:HX;3:HK;4:HT;5:I3;6:FX;7:IO;8:IL;9:I8;A:IR;B:G5;C:IM;D:HH;E:GV;F:IN;G:GM;H:HA;I:GY;J:D4;K:IJ;aE0bC2dBGe8Wf8Ag81h7Gi78k6Ml6Am5Wn5Ko5Ep56r4Us3Yt3Pu2Yv0Vw09zL;a07e05iEuLwiA;e03f02ho2ko4l6Cma1ne9rRsMzuL;geCGla8mDTrecGPs60trI0weC;ammenMchLti4;au0reEK;arE9bI9fa8hFQko4sMtrHLzuL;fBHsD0treIK;cDYeBteH;echtzu3ZueckL;b3EeTfSgQhPkOne9trHHzL;aG8i3uL;drFKeRfüKgewiIPhAHkLzi3;aIKeKo4;aIJeK;ab0ol0;eLreGR;b0h0wiIK;aEKiC;ro9K;lIKriedenzU;ck0g5;ig0rL;bHSr0sto2;eFVhl0;a01eUiNuL;eLnF;ns1rd6;dOederLss0;aufz34erBQfiChMko4zL;ugHW;ab0erCAol0;erLm0;lJsL;eBpHHt3;cQgPhr0iterMnd0rLtt63;b0d0;arDEeMg3s3zuL;eLfAMma1;ntwiGK;faHne9;hs5k0;cNeFDhrMlt0rLs1;n0t0;ne9z2P;hLk5;en,s0zuEF;er01oL;llZrLti2;anWbeVd8MfABgHDhaDko4lTsRweQzuL;bNd8LfAAgMlJne9sLwePzi3;cA7teH;auk5eh0;eLriA;reEIug0;is0rf0;chLteH;iH5lGFreD4;eLiJ;g0s0;izu9RreEC;b8Ako4t73zuL;ko4t72;b88eCzi3;a13b0Wd0Tei0Rf0Qg0Ph0Mk0Kl0Hm0Fn0Eo0Cp0Br09sWtSuRwMzL;eAJicIoe6P;aOeMiLoeEYunF;rk7Rs1;hr0iLnd0;ge7s0;hr0nd5;nsicGKrsa1;ag0eLi3S;iMuL;e7f5;d6l0;aWchSeRiQoPpi8KtLu1;aMeLrE9;ck0h0ue7;at7FeL;nd6rk0;eEJrg0;cG9l7T;lbstaend6tz0;aNeEOiGElLwe6;echBEiL;e8m4C;eFRff0;eBSnd0;ecEBiL;cIn60;a8fl7Pulve7;eLr8K;d0ffent71;achlaess6icI;arkt0eAAiL;nFsC4tt5;aMeLi2;g0ih0;en5Rge7ngsam0ss0ut0;aG5leine7nLo4raC4uerz0;eEEueE8;aMeLinF;hl0im6Rlf0;nd5rr0;aeHeDIlDHoGGroesEK;aHo6ZuJ;nLt5;b7Zfa1ig0;aMien0opp5rL;aeAeifa1;nk0u0;au0eQiPleBLrNuL;ch0eL;nd0ss0;eLiA;it0nn0;et0nd0;rg0sE7ug0;bschi2TeMnLrB4;ke7la8twoC6;nFusE4;ebZmRnterL;biCdrBRg3maDYr6TsNweDFzL;e8Wi3uL;b6Ig3;ag0chMtLu1;e74ueB;aeBe9DreB5;bRdr3fa8g3kQrPsOzuL;bMg3keKsLwAP;chuFQeBtE6;au0riA;eE6teH;ei8ueCK;eKreEN;eneF9riA;eLrigbleAW;n,rL;bTdeBCfSg3l2JnRprüf0rQsPtNwLze58;aLeCYiC;ch0eEB;reLün1;ff0ib0;chreC0eB;as1ed0;acIe9;liJüK;liG;aeAFeQhema2PoPrLun;aNeMiL;mm0ump30;nn0t0;e9Zg0kEns35u0;et0le35rpe4P;ilLst0;h3Nne9zL;une9;a0Fch06e04i02kiz7Go01pVtLu1;aReQoOrNuL;di2eL;rz0tz0;aE9ei1;er0pLss0;f0p0;ige1Urb0;bi1We9Vrt0tL;io7BtLui2;fiC;aPeOrLu2;eMiL;e8ng0;ch0ng0;icDQrr0;r0zi2;n44rg0;cherLeg0muB5nk0;n,s8Az89;h0in,nLtz0;d0k0;aSeA7iRlPmNnaHrumC1ueMwL;eC6iA;r0tz0;eLi11ueG;ck0i8;aLenFie8uG;f0g0;ck0eb0;eCYff0u0;g0mm5ni2;ae1eOiNuL;eLh0i6N;hr0tt5;cIe1s38;aRchQdPf1ZgNhabiliEkMpa21sLtt0ziE;erD1pekE;laBMonstr3KruE;iLn0;er0st1X;en,u6B;n0tfAW;gi2liBT;aQflJlaPrL;aeNiva17oLu05;bi2du66fiLgnosti66t1Mvo66;li2ti2;g0s67;tz0zi2;ck0rLsBMt65;k0tizipi2;bserCMef6OffeMpe1LrL;ga03i62;nLri2;bMhaDzuL;haDlJ;ar0le8Q;aOeNiederMoEuL;eBtz0;lJsc5Kzul0C;hm0nn0ut0E;chMheL;b3UlJ;ar89de91geA9hPlCOvOweAOzuL;de90g3hOko4lMpruLspi4HvNweAN;ef0;aCOes0;oll55;ol0;aXeWiNoL;bi05derLtiC3;niB0;lFniANssStL;ans3film0hQmPne9rOt2Swi81zuL;bLma1rNt2Rwi80;esLriA;ti4;ed0;a1is1;aDelf0;br1Mh7O;id0ld0;ch0ng5;a8eTiQoL;ckeOes0hn0sL;lMwe96zuL;sc4Twe95;a8eg0;n,rn;beLeBZnF;raL;liAG;ck0gMhr0iLnk0rn0s0uAD;h0st0t0;en,itiA1;a03enn01ipp0lXnVoPriSuL;eLltiBDs1;mMrzeL;n,rtrAM;me7;llabo08mOnMoLrrigi2;pe07rdi4Q;kreLsulEtrol8Szent06;tiA4;bi4NmLpenA3;en,uni4I;aLue9O;ck0ll0;aMet6CingeL;ln,n;er0rL;ma1;enLze4T;!zule94;ndi1Epp0sLuf0;cLsi2;hi2;dentifi46gnoRmQnLso8D;fOteMvL;esE;gOnsiAPrL;es9MpreE;or99;porE;ri2;a02eQiMoL;er0ff0l0;ev0nL;ausg3bla1Dde7gARlJne9wegtae6LzL;i3uL;ko4ne9we8TzufuJ;iVlf0rL;aNbeizuf3LhaDrs1s54uLz53;eber3BmL;sc3Hta6Vzusc3H;bz6YnzuQuL;f38sL;biB5ko4sNzuL;fLhaDko4ne9s4Y;iCueK;p1OteH;f3Cko4zi3;l0rat0;lMndhLu0;ab0;bi2t0;aranEeMleichz6NoeAKrLuG;e8Pue8;bPfaeh7Fgenzus4Zh0lOnNstaDwL;aehrLiAHoe88;en,lei7P;ie8uJ;aAiAt0;en,rL;au1;a05eYiWlToOreMuL;e6Bsio37;iLu0;ma1zube37;erFlOrLtografi2;ci2mu76tL;seBzuL;f2RseB;ge7;anMieL;g0h0;ki2;nLr80xi2;an2Rd0;rPstL;haDlJste1IzuL;haDlJsL;chLteH;re5H;nLt6;haDzu6F;hr0ll0ss0;in16mpfe77nt0PrPtab6PvakOxL;isEpL;anLorE;di2;ui2;a0Jb0If0Fg0Dh0Bk0Al06m03n01oZprYrWsStRwNzL;ae71eLi16wiA;ug0;aNeLirt5B;ck0iLrb0;s0te7;e75rt0;e77r8C;chMeBp1AtL;a8ZiG;ein0ie8l9DuL;et3Z;eLicI;c6Yg0i1;e8ob0;be7eL;f2Lr3U;aeKeL;nn0ue7;oLut6;egLrd0;li1;aNeL;b0iL;ch3Md0;eu3Lng0ub0;e8Ula2;aDeb0oL;eh0l0;aLeh0re6X;e4Pt3G;aMiCoLreu0ueH;lg0;hr0ss0;riA;hn0r3Z;biCdeGfYgeVkUlSm2Sne9rRsOwNzL;auLi3;be7;e7Mi73;chLeCt3;aeLe2Blue15uld6;d6rf0;icI;aLed6oG;rv0st0;o4rae45;genLh0;ne9se72tr6YzuL;ko4seBwi3N;alMeLli3;rn0ss5;l0t0;ar3Hb0Gd0Ff0Dge0Ch0Bk0Al07m4Gne9or06paGquarEr04sZtr7CzL;a5Ki3uL;bWd0DfVgUhTlSm4Ene9rRsLtr6RweC;aGchOeBpiNtL;eLuf0;h0ll0;el0;aLr1R;eBlt0;ae31ei1icI;aZeYo7M;aDol0;eh0re5X;orFue01;e03iC;chNeBpMteL;ck0h0ig0ll0;ar0;aDl7OrL;ae3Qe4J;ae2QeiLicI;h0s0;dn0;aMeLo1;g0it0;d0ss0;a79eKl6C;aDeims0ol0;h0st3;a3Bl7DorFueL;g0hr0;ae4riA;eLiCriA;zi3;a03e00iWrUuL;ld0rchL;bRdr38fQg3lPsNzuL;dr37fPsL;cMeB;cLeBu1;hl5Y;a6UeucI;ueK;liGre1;oLueG;ss5;en0sL;kMtanL;zi2;rediEuE;ck0fiMmL;enE;ni2;em4Mnk0rMst3ue7vonLzuL;ko4;lJs0Qz0P;au0eSiRlQrNuL;ch0eL;nd5ss0;aMeLiA;ch0ms0;ndma1Uu0;as0e21iG;et0ld0tt0;a17de16e14f12g0Vh0Ti0Qjah0k0Nl0Lme1Rn0Kob0Jr0AsYtVuUvorzuTwNzL;a3SeLi3;ic40;aOeMirLunF;k0t21;g0is0rL;b0kstell6t0;elt6fLhr0;fn0;st3;g0rte3V;aReil6rL;aLe1N;cIg0;aen0AchReQiPorg0se7tLu1;aNeMi4rL;af0e2U;ch0h0ig0ll0ue7;et6;cUeg0;it6tz0;aOer0im3QlNneMoen6rLw2;ae1V;id0;eun6ie8;ed6ff0;aSeiOuL;eLh6;cksicLhr0;ht6;s0tL;sMzL;usL;teH;pp0t0;acI;e5BuB;a8eLo31;b0g0;aMl47o4raeL;ft6;em36nntg4V;sMtr44wo2WzuL;be1SlJtr43;te3F;aLeb0;lt0nd5upt0;ePi50lOnuJrL;eLueC;if0nz0;eg0;ei1ueG;gn0h0isL;te7;a8oerFrL;ag0ei0;inLnd0;druGflu8;ut0;cInLr02uftr3N;staCtL;r3Lwo13;b33e30gi2kzepEn1Mppel1Lr1Jtm0uL;f0RsL;b3Ld0Neinander0Lf0Jg0Hh0Fk0Cl0Bprobi2r08s03t01u48wYzL;a20uL;arVbUdTgShRlPma1nuBrNsLta00u46weiY;ag0cLe3Ap3Ut01;hl4I;aeLicIuf0;um0;ad0ie46oL;es0s0;and5;eb0l1Mre08;e1Zr0D;au0i4Jre16;be15;ae1NeiMiL;rk0;s0t0;aLreQ;us1;chNeh0p3EtLu1;a3NeL;ig0ll0;aDl40reLue3L;ib0;eLicI;c1LiL;ch0s0;a3Oie3Mo3L;o4undL;schaL;ft0;aLeb5;lt0nd5;e10l0ZreL;nz0;aHueL;hr0ll0;seBzL;useB;eMrLue3G;ueG;nk0;b09d07faHg06h04k03l02ne9rZsXtVwTzuL;bRfOgNhMkla2lLma1ne9po0CsWtr22zwiA;eg0o34;aDeb0o2;eb0re1F;aMrL;is1;ll0ng0;au0es1Lr3E;aLeL;rt0;e0WreL;ib0t0;tLu1;eHoG;eLoHuf0;chtzuerLg0;haD;a2Ro2O;la2o4;aDeb0oL;er0l0;e05re0X;eGrL;aeA;au0es14i1Er2XueL;rd0;beLtikuM;it0;li2;aly0Wbi19da0Ve0Tf0Sg0Nh0Li0Kk0Hl0Gme0Fn0Ep0Br09s02tr19w00zL;i3uL;bi17e0RfWgThSkRlPn0CpaOr2DsMtreLvertr1JweC;ff0t0;ch04e19ied5p1TtL;e0Qr23;ck0ss0;aLeg0;st0;l19o4u09;aDe0C;eMlL;ei1;b0h0;ert6;ig0;aeLeC;hl0;chQeBpNtL;eLreA;ch0ue7;oLre1;rn0;tz0;au0l1Y;ecLuf0;hn0;a8eMreL;is0;il0;ae17e9;ld0rk0;eg0oG;aemMuL;rb5;pf0;mi2;aDeLo2;b0iz0;eNreMuG;ck0;if0;b0hL;en,o2;aAorFueK;iLrke1A;gn0;ue7;si2;ti2;cInFusL;se7;ht0;b1Af13ge11h0Zl0Une9ruCs0Ct0AverlaAw06zL;i3uL;b02f01g0PhaDjZlXmilFne9rWsRtrQwLzi3;aNeMiL;ck5;i1nd0;eLrt0;hl0lz0;et0;chOeNic0BpaDtL;eHi4;ll0;h0tz0;a0Fi0El0Su0A;at0uts1;eLie0Ho0G;g0hn0s0;ag0;lt0;eFueK;au0;eh0;aMeL;rf0;eLrt0;lz0;au1rLun;ag0et0;ag0chUeTiRolPpOtL;eMi4;mm0;mp5;re1;vi2;er0;cLtz0;he7;gn0tz0;aQiPl03oOreNuL;ett5;eln;ck0ib0;tt0;eb0;ff0;hm0;aOeNieMoL;es0;fe7;g0it0s0;uf0;aLeb0;eAlt0;b0wiL;nn0;eFiClMueK;hr0;ie8;ss0;nd0;de7;rn;au0iOrL;e1iA;ng0;ch0;ld0;en",
    "Preposition": "true¦a7beim,fü6i5u4vo2z0übe6;!u0;m,r;m,r0;m,s;ms,nte1;m,ns;rs;!m,ns,ufs",
    "TextCardinal": "true¦achtBbillioAdrei8e7fünfBhundert,milli6n5s2tausend,vierBz0;eCw0;anz7ei,ölf;ech1ieb0;en,z8;s,z7;eun5ull;arde,o3;ins,lf;!ze4ß0;ig;nen;!z0;e0ig;hn",
    "TextOrdinal": "true¦achtGbillioFdrDeCfünfBhundertsKmilli9n6s3tausenAvierBz0;eIieb1w0;an0eiIölfI;ziF;ech1ieb0;te,zeE;sEzB;eun0ullD;te,z0;ehBi9;ar0o5;ds9;te,z5;lf7rs7;ei0it6;ze4ßi3;ns4;e,z0;e1i0;gs1;hn0;te"
  };

  const BASE = 36;
  const seq = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const cache = seq.split('').reduce(function (h, c, i) {
    h[c] = i;
    return h
  }, {});

  // 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
  const toAlphaCode = function (n) {
    if (seq[n] !== undefined) {
      return seq[n]
    }
    let places = 1;
    let range = BASE;
    let s = '';
    for (; n >= range; n -= range, places++, range *= BASE) {}
    while (places--) {
      const d = n % BASE;
      s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
      n = (n - d) / BASE;
    }
    return s
  };

  const fromAlphaCode = function (s) {
    if (cache[s] !== undefined) {
      return cache[s]
    }
    let n = 0;
    let places = 1;
    let range = BASE;
    let pow = 1;
    for (; places < s.length; n += range, places++, range *= BASE) {}
    for (let i = s.length - 1; i >= 0; i--, pow *= BASE) {
      let d = s.charCodeAt(i) - 48;
      if (d > 10) {
        d -= 7;
      }
      n += d * pow;
    }
    return n
  };

  var encoding = {
    toAlphaCode,
    fromAlphaCode
  };

  const symbols = function (t) {
    //... process these lines
    const reSymbol = new RegExp('([0-9A-Z]+):([0-9A-Z]+)');
    for (let i = 0; i < t.nodes.length; i++) {
      const m = reSymbol.exec(t.nodes[i]);
      if (!m) {
        t.symCount = i;
        break
      }
      t.syms[encoding.fromAlphaCode(m[1])] = encoding.fromAlphaCode(m[2]);
    }
    //remove from main node list
    t.nodes = t.nodes.slice(t.symCount, t.nodes.length);
  };
  var parseSymbols = symbols;

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    if (dnode < trie.symCount) {
      return trie.syms[dnode]
    }
    return index + dnode + 1 - trie.symCount
  };

  const toArray = function (trie) {
    const all = [];
    const crawl = (index, pref) => {
      let node = trie.nodes[index];
      if (node[0] === '!') {
        all.push(pref);
        node = node.slice(1); //ok, we tried. remove it.
      }
      const matches = node.split(/([A-Z0-9,]+)/g);
      for (let i = 0; i < matches.length; i += 2) {
        const str = matches[i];
        const ref = matches[i + 1];
        if (!str) {
          continue
        }
        const have = pref + str;
        //branch's end
        if (ref === ',' || ref === undefined) {
          all.push(have);
          continue
        }
        const newIndex = indexFromRef(trie, ref, index);
        crawl(newIndex, have);
      }
    };
    crawl(0, '');
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$2 = function (str) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0
    };
    //process symbols, if they have them
    if (str.match(':')) {
      parseSymbols(trie);
    }
    return toArray(trie)
  };

  var traverse = unpack$2;

  const unpack = function (str) {
    if (!str) {
      return {}
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      h[arr[0]] = arr[1];
      return h
    }, {});
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      const arr = traverse(obj[cat]);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (all.hasOwnProperty(k) === true) {
          if (Array.isArray(all[k]) === false) {
            all[k] = [all[k], cat];
          } else {
            all[k].push(cat);
          }
        } else {
          all[k] = cat;
        }
      }
    });
    return all
  };

  var unpack$1 = unpack;

  let lexicon$1 = {};

  Object.keys(lexData).forEach(tag => {
    let wordsObj = unpack$1(lexData[tag]);
    Object.keys(wordsObj).forEach(w => {
      lexicon$1[w] = tag;

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        // add present tense
        let pres = conjugate.toPresent(w);
        if (pres && pres !== w) {
          lexicon$1[pres] = 'PresentTense';
        }
        // add past tense
        let past = conjugate.toPast(w);
        if (past && past !== w) {
          lexicon$1[past] = 'PastTense';
        }
      }

    });
  });
  // console.log(lexicon)

  var lexicon$2 = lexicon$1;

  var lexicon = {
    methods: {
      one: {
        transform: {
          conjugate
        }
      }
    },
    model: {
      one: {
        lexicon: lexicon$2
      }
    },
    hooks: ['lexicon']
  };

  const hasApostrophe = /['‘’‛‵′`´]/;

  // normal regexes
  const doRegs = function (str, regs) {
    for (let i = 0; i < regs.length; i += 1) {
      if (regs[i][0].test(str) === true) {
        return regs[i]
      }
    }
    return null
  };

  const checkRegex = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    let { regexText, regexNormal, regexNumbers } = world.model.two;
    let normal = term.machine || term.normal;
    let text = term.text;
    // keep dangling apostrophe?
    if (hasApostrophe.test(term.post) && !hasApostrophe.test(term.pre)) {
      text += term.post.trim();
    }
    let arr = doRegs(text, regexText) || doRegs(normal, regexNormal);
    // hide a bunch of number regexes behind this one
    if (!arr && /[0-9]/.test(normal)) {
      arr = doRegs(normal, regexNumbers);
    }
    if (arr) {
      setTag([term], arr[1], world, false, `1-regex- '${arr[2] || arr[0]}'`);
      term.confidence = 0.6;
      return true
    }
    return null
  };
  var checkRegex$1 = checkRegex;

  const isTitleCase$1 = function (str) {
    return /^[A-ZÄÖÜ][a-zäöü'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  };

  // add a noun to any non-0 index titlecased word, with no existing tag
  const titleCaseNoun = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    // don't over-write any tags
    if (term.tags.size > 0) {
      return
    }
    // skip first-word, for now
    if (i === 0) {
      return
    }
    if (isTitleCase$1(term.text)) {
      setTag([term], 'Noun', world, false, `1-titlecase`);
    }
  };
  var titleCase = titleCaseNoun;

  const min = 1400;
  const max = 2100;

  const dateWords = new Set(['pendant', 'dans', 'avant', 'apres', 'pour', 'en']);

  const seemsGood = function (term) {
    if (!term) {
      return false
    }
    if (dateWords.has(term.normal)) {
      return true
    }
    if (term.tags.has('Date') || term.tags.has('Month') || term.tags.has('WeekDay')) {
      return true
    }
    return false
  };

  const seemsOkay = function (term) {
    if (!term) {
      return false
    }
    if (term.tags.has('Ordinal')) {
      return true
    }
    return false
  };

  // recognize '1993' as a year
  const tagYear = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      let num = Number(term.normal);
      // number between 1400 and 2100
      if (num && !isNaN(num)) {
        if (num > min && num < max) {
          if (seemsGood(terms[i - 1]) || seemsGood(terms[i + 1])) {
            setTag([term], 'Year', world, false, '1-tagYear');
            return true
          }
          // or is it really-close to a year?
          if (num > 1950 && num < 2025) {
            if (seemsOkay(terms[i - 1]) || seemsOkay(terms[i + 1])) {
              setTag([term], 'Year', world, false, '1-tagYear-close');
              return true
            }
          }
        }
      }
    }
    return null
  };
  var checkYear = tagYear;

  const oneLetterAcronym = /^[A-ZÄÖÜ]('s|,)?$/;
  const isUpperCase = /^[A-Z-ÄÖÜ]+$/;
  const periodAcronym = /([A-ZÄÖÜ]\.)+[A-ZÄÖÜ]?,?$/;
  const noPeriodAcronym = /[A-ZÄÖÜ]{2,}('s|,)?$/;
  const lowerCaseAcronym = /([a-zäöü]\.)+[a-zäöü]\.?$/;



  const oneLetterWord = {
    I: true,
    A: true,
  };
  // just uppercase acronyms, no periods - 'UNOCHA'
  const isNoPeriodAcronym = function (term, model) {
    let str = term.text;
    // ensure it's all upper-case
    if (isUpperCase.test(str) === false) {
      return false
    }
    // long capitalized words are not usually either
    if (str.length > 5) {
      return false
    }
    // 'I' is not a acronym
    if (oneLetterWord.hasOwnProperty(str)) {
      return false
    }
    // known-words, like 'PIZZA' is not an acronym.
    if (model.one.lexicon.hasOwnProperty(term.normal)) {
      return false
    }
    //like N.D.A
    if (periodAcronym.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym.test(str) === true) {
      return true
    }
    return false
  };

  const isAcronym = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    //these are not acronyms
    if (term.tags.has('RomanNumeral') || term.tags.has('Acronym')) {
      return null
    }
    //non-period ones are harder
    if (isNoPeriodAcronym(term, world.model)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-no-period-acronym');
      return true
    }
    // one-letter acronyms
    if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-one-letter-acronym');
      return true
    }
    //if it's a very-short organization?
    if (term.tags.has('Organization') && term.text.length <= 3) {
      setTag([term], 'Acronym', world, false, '3-org-acronym');
      return true
    }
    // upper-case org, like UNESCO
    if (term.tags.has('Organization') && isUpperCase.test(term.text) && term.text.length <= 6) {
      setTag([term], 'Acronym', world, false, '3-titlecase-acronym');
      return true
    }
    return null
  };
  var acronym = isAcronym;

  const isTitleCase = function (str) {
    return /^[A-ZÄÖÜ][a-zäöü'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  };

  const hasNoVerb = function (terms) {
    return !terms.find(t => t.tags.has('#Verb'))
  };

  const fallback = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.size === 0) {

      // is it first-word titlecase?
      if (i === 0 && isTitleCase(term.text)) {
        return setTag([term], 'Noun', world, false, `1-titlecase`)// Noun still the safest bet?
      }

      let tag = 'Adjective';
      if (hasNoVerb(terms)) {
        tag = 'Verb';
      }
      setTag([term], tag, world, false, '2-fallback');
    }
  };
  var fallback$1 = fallback;

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      let suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        let tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let suffixes = world.model.two.suffixPatterns;
    let term = terms[i];
    if (term.tags.size === 0) {
      let tag = suffixLoop(term.normal, suffixes);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop(term.implicit, suffixes);
        if (tag !== null) {
          setTag([term], tag, world, false, '2-implicit-suffix');
          term.confidence = 0.7;
          return true
        }
      }
    }
    return null
  };
  var suffixCheck$1 = suffixCheck;

  // 1st pass

  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      let found = titleCase(terms, i, world);
      // try look-like rules
      found = found || checkRegex$1(terms, i, world);
      // turn '1993' into a year
      checkYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = acronym(terms, i, world);
      found = found || suffixCheck$1(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found = found || fallback$1(terms, i, world);
    }
  };


  const tagger$1 = function (view) {
    let world = view.world;
    view.docs.forEach(terms => {
      firstPass(terms, world);
      secondPass(terms, world);
    });
    return view
  };
  var tagger$2 = tagger$1;

  var regexNormal = [
    //web tags
    [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, 'Email'],
    [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, 'Url', 'http..'],
    [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, 'Url', '.com'],

    // timezones
    [/^[PMCE]ST$/, 'Timezone', 'EST'],

    //names
    [/^ma?c'.*/, 'LastName', "mc'neil"],
    [/^o'[drlkn].*/, 'LastName', "o'connor"],
    [/^ma?cd[aeiou]/, 'LastName', 'mcdonald'],

    //slang things
    [/^(lol)+[sz]$/, 'Expression', 'lol'],
    [/^wo{2,}a*h?$/, 'Expression', 'wooah'],
    [/^(hee?){2,}h?$/, 'Expression', 'hehe'],
    [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, 'Verb', 'un-vite'],

    // m/h
    [/^(m|k|cm|km)\/(s|h|hr)$/, 'Unit', '5 k/m'],
    // μg/g
    [/^(ug|ng|mg)\/(l|m3|ft3)$/, 'Unit', 'ug/L'],
  ];

  var regexNumbers = [

    [/^@1?[0-9](am|pm)$/i, 'Time', '3pm'],
    [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, 'Time', '3:30pm'],
    [/^'[0-9]{2}$/, 'Year'],
    // times
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, 'Time', '3:12:31'],
    [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, 'Time', '1:12pm'],
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, 'Time', '1:12:31pm'], //can remove?

    // iso-dates
    [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, 'Date', 'iso-date'],
    [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, 'Date', 'iso-dash'],
    [/^[0-9]{1,4}\/[0-9]{1,2}\/[0-9]{1,4}$/, 'Date', 'iso-slash'],
    [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, 'Date', 'iso-dot'],
    [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, 'Date', '12-dec-2019'],

    // timezones
    [/^utc ?[+-]?[0-9]+$/, 'Timezone', 'utc-9'],
    [/^(gmt|utc)[+-][0-9]{1,2}$/i, 'Timezone', 'gmt-3'],

    //phone numbers
    [/^[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '421-0029'],
    [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '1-800-'],


    //money
    //like $5.30
    [
      /^[-+]?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6][-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?([kmb]|bn)?\+?$/,
      ['Money', 'Value'],
      '$5.30',
    ],
    //like 5.30$
    [
      /^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]\+?$/,
      ['Money', 'Value'],
      '5.30£',
    ],
    //like
    [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value'], '$400usd'],

    //numbers
    // 50 | -50 | 3.23  | 5,999.0  | 10+
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue'], '5,999'],
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th)$/, ['Ordinal', 'NumericValue'], '53rd'],
    // .73th
    [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue'], '.73th'],
    //percent
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue'], '-4%'],
    [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue'], '.3%'],
    //fraction
    [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ['Fraction', 'NumericValue'], '2/3rds'],
    //range
    [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ['Value', 'NumberRange'], '3-4'],
    //time-range
    [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ['Time', 'NumberRange'], '3-4pm'],
    //with unit
    [/^[0-9.]+([a-z]{1,4})$/, 'Value', '9km'],
  ];

  var regexText = [
    // #coolguy
    [/^#[a-zäöü0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

    // @spencermountain
    [/^@\w{2,}$/, 'AtMention'],

    // period-ones acronyms - f.b.i.
    [/^([A-ZÄÖÜ]\.){2}[A-ZÄÖÜ]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

    // ending-apostrophes
    [/.{3}[lkmnp]in['‘’‛‵′`´]$/, 'Gerund', "chillin'"],
    [/.{4}s['‘’‛‵′`´]$/, 'Possessive', "flanders'"],
  ];

  const rb = 'Adverb';
  const nn = 'Noun';
  const vb = 'Verb';
  const jj = 'Adjective';


  var suffixPatterns = [
    null,
    {
      // one-letter suffixes
      s: nn,
      l: nn,
      a: nn,
      k: nn,
      d: nn,
      z: nn,
    },
    {
      // two-letter suffixes
      ig: jj,
      ls: rb,
      // er: nn,
      el: nn,
      et: vb,
      gt: vb,
      lt: vb,
      // ht: vb,
      'ßt': vb
    },
    {
      // three-letter suffixes
      che: jj,
      ige: jj,
      // ger: jj,
      tig: jj,
      end: jj,
      // mal: rb,
      hin: rb,
      ung: nn,
      ion: nn,
      ter: nn,
      ert: vb,
      tet: vb,
      // ben: vb,
      // ren: vb,
      // fen: vb,
      // men: vb,
      igt: vb,
      tzt: vb,
      det: vb,
      elt: vb,
      ete: vb
    },
    {
      // four-letter suffixes
      chen: jj,
      lich: jj,
      igen: jj,
      cher: jj,
      ende: jj,
      isch: jj,
      enen: jj,
      tige: jj,
      tens: rb,
      mals: rb,
      rung: nn,
      iert: vb,
      eben: vb,
      ehen: vb,
      mmen: vb,
      // lten: vb,
      // ssen: vb
    },
    {
      // five-letter suffixes
      ische: jj,
      liche: jj,
      // enden: jj,
      tlich: jj,
      // tigen: jj,
      stens: rb,
      falls: rb,
      weise: rb,
      seits: rb,
      ungen: nn,
      erung: nn,
      ieren: vb
    },
    {
      // six-letter suffixes
      ischen: jj,
      lichen: jj,
      tische: jj,
      nische: jj
    },
    {
      // seven-letter suffixes
      tischen: jj,
      tlichen: jj,
      nischen: jj
    }
  ];

  var model = {
    regexNormal,
    regexNumbers,
    regexText,
    suffixPatterns
  };

  var tagger = {
    compute: {
      tagger: tagger$2
    },
    model: {
      two: model
    },
    hooks: ['tagger']
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns = {
    Noun: {
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      is: 'Noun',
      not: ['Plural'],
    },
    ProperNoun: {
      is: 'Noun',
    },
    Person: {
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      is: 'Person',
    },
    MaleName: {
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      is: 'Person',
      not: ['FirstName'],
    },
    Honorific: {
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    Region: {
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      // is: 'Place',
    },
    Organization: {
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      is: 'Organization',
    },
    School: {
      is: 'Organization',
    },
    Company: {
      is: 'Organization',
    },
    Plural: {
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      is: 'Noun',
    },
    Pronoun: {
      is: 'Noun',
      not: entity,
    },
    Actor: {
      is: 'Noun',
      not: entity,
    },
    Activity: {
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    Unit: {
      is: 'Noun',
      not: entity,
    },
    Demonym: {
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    Possessive: {
      is: 'Noun',
    },
    // german genders
    MaleNoun: {
      is: 'Noun',
      not: ['FemaleNoun', 'NeuterNoun'],
    },
    FemaleNoun: {
      is: 'Noun',
      not: ['MaleNoun', 'NeuterNoun'],
    },
    NeuterNoun: {
      is: 'Noun',
      not: ['MaleNoun', 'FemaleNoun'],
    },
  };

  var verbs = {
    Verb: {
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    PresentTense: {
      is: 'Verb',
      not: ['PastTense'],
    },
    Infinitive: {
      is: 'PresentTense',
      not: ['Gerund'],
    },
    Imperative: {
      is: 'Infinitive',
    },
    Gerund: {
      is: 'PresentTense',
      not: ['Copula'],
    },
    PastTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund'],
    },
    Copula: {
      is: 'Verb',
    },
    Modal: {
      is: 'Verb',
      not: ['Infinitive'],
    },
    PerfectTense: {
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      is: 'Verb',
    },
    Participle: {
      is: 'PastTense',
    },
    PhrasalVerb: {
      is: 'Verb',
    },
    Particle: {
      is: 'PhrasalVerb',
      not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
    },
    Auxiliary: {
      is: 'Verb',
      not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
    },
  };

  var values = {
    Value: {
      not: ['Verb', 'Adjective', 'Adverb'],
    },
    Ordinal: {
      is: 'Value',
      not: ['Cardinal'],
    },
    Cardinal: {
      is: 'Value',
      not: ['Ordinal'],
    },
    Fraction: {
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      is: 'Value',
    },
    RomanNumeral: {
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      is: 'Cardinal',
    },
    Percent: {
      is: 'Value',
    },
  };

  var dates = {
    Date: {
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      is: 'Date',
    },
    Timezone: {
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      is: 'Noun',
      also: ['Date'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc = {
    Adjective: {
      not: ['Noun', 'Verb', 'Adverb', 'Value'],
    },
    Comparable: {
      is: 'Adjective',
    },
    Comparative: {
      is: 'Adjective',
    },
    Superlative: {
      is: 'Adjective',
      not: ['Comparative'],
    },
    NumberRange: {},
    Adverb: {
      not: ['Noun', 'Verb', 'Adjective', 'Value'],
    },

    Determiner: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
    },
    Conjunction: {
      not: anything,
    },
    Preposition: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      not: ['Determiner'],
    },
    Currency: {
      is: 'Noun',
    },
    Expression: {
      not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
    },
    Abbreviation: {},
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {},
    AtMention: {
      is: 'Noun',
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      not: ['Plural', 'RomanNumeral'],
    },
    Negative: {
      not: ['Noun', 'Adjective', 'Value'],
    },
    Condition: {
      not: ['Verb', 'Adjective', 'Noun', 'Value'],
    },
  };

  let tags = Object.assign({}, nouns, verbs, values, dates, misc);

  var tagset = {
    tags
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E


  // geman accented letters
  // ä  | Ä
  // ö  | Ö
  // ü  | Ü
  // ß

  let compact = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÁÃÅáãåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'þƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'Í',
    i: 'íĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÓÕØðóõøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'µÚúŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰμυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  let unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });
  var unicode$1 = unicode;

  // https://www.fluentu.com/blog/german/german-contractions/
  var contractions = [
    { word: 'am', out: ['an', 'dem'] },  //(on the / at the)
    { word: 'ans', out: ['an', 'das'] },  //(on the / at the)
    { word: 'aufs', out: ['auf', 'das'] },  //(on the / at the)
    { word: 'beim', out: ['bei', 'dem'] },  //(at the / in the / with the)
    { word: 'durchs', out: ['durch', 'das'] },  //(through the)
    { word: 'fürs', out: ['für', 'das'] },  //(for the)
    { word: 'hinterm', out: ['hinter', 'dem'] },  //(behind the)
    { word: 'ins', out: ['in', 'das'] },  //(in the / into the / to the)
    { word: 'im', out: ['in', 'dem'] },  //(at / in the)
    { word: 'übers', out: ['über', 'das'] },  //(over the / about the)
    { word: 'ums', out: ['um', 'das'] },  //(at the / around)
    { word: 'unters', out: ['unter', 'das'] },  //(under the)
    { word: 'unterm', out: ['unter', 'dem'] },  //(under the)
    { word: 'vom', out: ['von', 'dem'] },  //(from the)
    { word: 'vors', out: ['vor', 'das'] },  //(in front of the)
    { word: 'vorm', out: ['vor', 'dem'] },  //(in front of the / from)
    { word: 'zum', out: ['zu', 'dem'] },  //(to the / to)
    { word: 'zur', out: ['zu', 'der'] },  //(to the / to)
  ];

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = unicode$1;

      world.model.one.contractions = contractions;
    }
  };

  nlp$1.plugin(tokenizer);
  nlp$1.plugin(tagset);
  nlp$1.plugin(lexicon);
  nlp$1.plugin(tagger);


  const de = function (txt, lex) {
    let dok = nlp$1(txt, lex);
    return dok
  };

  /** log the decision-making to console */
  de.verbose = function (set) {
    let env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  return de;

}));
