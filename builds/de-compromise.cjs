(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.deCompromise = factory());
})(this, (function () { 'use strict';

  let methods$n = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  let model$8 = {
    one: {},
    two: {},
    three: {},
  };
  let compute$a = {};
  let hooks = [];

  var tmpWrld = { methods: methods$n, model: model$8, compute: compute$a, hooks };

  const isArray$9 = input => Object.prototype.toString.call(input) === '[object Array]';

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
      else if (isArray$9(input)) {
        input.forEach(name => {
          if (world.compute.hasOwnProperty(name)) {
            compute[name](this);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
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
  var compute$9 = fns$4;

  // wrappers for loops in javascript arrays

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
      let out = cb(view, i);
      // if we returned nothing, return a view
      if (out === undefined) {
        return this.none()
      }
      return out
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
    let res = this.update(ptrs);
    return res
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
    /** return individual terms*/
    terms: function (n) {
      let m = this.match('.');
      // this is a bit faster than .match('.') 
      // let ptrs = []
      // this.docs.forEach((terms) => {
      //   terms.forEach((term) => {
      //     let [y, x] = term.index || []
      //     ptrs.push([y, x, x + 1])
      //   })
      // })
      // let m = this.update(ptrs)
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

    // is the pointer the full sentence?
    isFull: function () {
      let ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      let document = this.document;
      for (let i = 0; i < ptrs.length; i += 1) {
        let [n, start, end] = ptrs[i];
        // it's not the start
        if (n !== i || start !== 0) {
          return false
        }
        // it's too short
        if (document[n].length > end) {
          return false
        }
      }
      return true
    },

    // return the nth elem of a doc
    getNth: function (n) {
      if (typeof n === 'number') {
        return this.eq(n)
      } else if (typeof n === 'string') {
        return this.if(n)
      }
      return this
    }

  };
  utils.group = utils.groups;
  utils.fullSentence = utils.fullSentences;
  utils.sentence = utils.fullSentences;
  utils.lastTerm = utils.lastTerms;
  utils.firstTerm = utils.firstTerms;
  var util = utils;

  const methods$m = Object.assign({}, util, compute$9, loops);

  // aliases
  methods$m.get = methods$m.eq;
  var api$j = methods$m;

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
      if (this._cache && pointer && pointer.length > 0) {
        // only keep cache if it's a full-sentence
        let cache = [];
        pointer.forEach((ptr, i) => {
          let [n, start, end] = ptr;
          if (ptr.length === 1) {
            cache[i] = this._cache[n];
          } else if (start === 0 && this.document[n].length === end) {
            cache[i] = this._cache[n];
          }
        });
        if (cache.length > 0) {
          m._cache = cache;
        }
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      return new View(this.document, pointer || this.pointer)
    }
    fromText(input) {
      const { methods } = this;
      //assume ./01-tokenize is installed
      let document = methods.one.tokenize.fromString(input, this.world);
      let doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0);    //node 17: structuredClone(document);
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
  Object.assign(View.prototype, api$j);
  var View$1 = View;

  var version$1 = '14.9.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        if (isObject$6(plugin[key])) {
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

  const addIrregulars = function (model, conj) {
    let m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      // verb forms
      if (conj[k].pastTense) {
        if (m.toPast) {
          m.toPast.ex[k] = conj[k].pastTense;
        }
        if (m.fromPast) {
          m.fromPast.ex[conj[k].pastTense] = k;
        }
      }
      if (conj[k].presentTense) {
        if (m.toPresent) {
          m.toPresent.ex[k] = conj[k].presentTense;
        }
        if (m.fromPresent) {
          m.fromPresent.ex[conj[k].presentTense] = k;
        }
      }
      if (conj[k].gerund) {
        if (m.toGerund) {
          m.toGerund.ex[k] = conj[k].gerund;
        }
        if (m.fromGerund) {
          m.fromGerund.ex[conj[k].gerund] = k;
        }
      }
      // adjective forms
      if (conj[k].comparative) {
        if (m.toComparative) {
          m.toComparative.ex[k] = conj[k].comparative;
        }
        if (m.fromComparative) {
          m.fromComparative.ex[conj[k].comparative] = k;
        }
      }
      if (conj[k].superlative) {
        if (m.toSuperlative) {
          m.toSuperlative.ex[k] = conj[k].superlative;
        }
        if (m.fromSuperlative) {
          m.fromSuperlative.ex[conj[k].superlative] = k;
        }
      }
    });
  };

  const extend = function (plugin, world, View, nlp) {
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    if (plugin.irregulars) {
      addIrregulars(model, plugin.irregulars);
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
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const isArray$8 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (isArray$8(term.tags)) {
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
    if (isObject$5(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (isArray$8(input)) {
      // pre-tokenized array-of-arrays 
      if (isArray$8(input[0])) {
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
    if (input) {
      doc.compute(world.hooks);
    }
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
  nlp.version = version$1;

  var nlp$1 = nlp;

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
        if (term.machine) {
          stuff.add(term.machine);
        }
        if (term.root) {
          stuff.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => stuff.add(str));
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

  var methods$l = {
    one: {
      cacheDoc,
    },
  };

  const methods$k = {
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
  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$k);
  };
  var api$i = addAPI$3;

  var compute$8 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: api$i,
    compute: compute$8,
    methods: methods$l,
  };

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

  // case logic
  const isTitleCase$2 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

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
      old.text = toLowerCase(old.text);
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

  TTT -> 46 terms since load
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
  let index$2 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$2 += 1;

    //don't overflow index
    index$2 = index$2 > 46655 ? 0 : index$2;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$2.toString(36));
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
  const expand$1 = function (m) {
    if (m.has('@hasContraction') && typeof m.contractions === 'function') {//&& m.after('^.').has('@hasContraction')
      let more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$7 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map((term) => {
      term.id = uuid(term);
      return term
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
      return input.clone().docs[0] || [] //assume one sentence
    }
    //allow an array of terms, too
    if (isArray$7(input)) {
      return isArray$7(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    view.uncache();
    // insert words at end of each doc
    let ptrs = view.fullPointer;
    let selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      let ptr = m.fullPointer[0];
      let [n] = ptr;
      // add-in the words
      let home = document[n];
      let terms = getTerms(input, world);
      // are we inserting nothing?
      if (terms.length === 0) {
        return
      }
      terms = addIds$2(terms);
      if (prepend) {
        expand$1(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$1(view.update([ptr]).lastTerm());
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
    doc.compute(['id', 'index', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
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
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
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
    this.uncache();
    if (typeof input === 'function') {
      return replaceByFn(main, input)
    }
    let terms = main.docs[0];
    let isPossessive = keep.possessives && terms[terms.length - 1].tags.has('Possessive');
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    let original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      let more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.

    // keep "John's"
    if (isPossessive) {
      let tmp = main.docs[0];
      let term = tmp[tmp.length - 1];
      if (!term.tags.has('Possessive')) {
        term.text += '\'s';
        term.normal += '\'s';
        term.tags.add('Possessive');
      }
    }
    // what should we return?
    let m = main.toView(ptrs).compute(['index', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
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

    // try to keep some pre-post punctuation
    // if (m.terms().length === 1 && main.terms().length === 1) {
    //   console.log(original.docs)
    // }

    // console.log(input.docs[0])
    // let regs = input.docs[0].map(t => {
    //   return { id: t.id, optional: true }
    // })
    // m.after('(a|hoy)').debug()
    // m.growRight('(a|hoy)').debug()
    // console.log(m)
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
    this.soften();
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

  var pluckOutTerm = pluckOut;

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      let [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        let len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        }
      });
      return ptr
    });

    // decrement any pointers after a now-empty pointer
    ptrs.forEach((ptr, i) => {
      // is the pointer now empty?
      if (ptr[1] === 0 && ptr[2] == 0) {
        // go down subsequent pointers
        for (let n = i + 1; n < ptrs.length; n += 1) {
          ptrs[n][0] -= 1;
          if (ptrs[n][0] < 0) {
            ptrs[n][0] = 0;
          }
        }
      }
    });
    // remove any now-empty pointers
    ptrs = ptrs.filter(ptr => ptr[2] - ptr[1] > 0);

    // remove old hard-pointers
    ptrs = ptrs.map((ptr) => {
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    return ptrs
  };

  const methods$j = {
    /** */
    remove: function (reg) {
      const { indexN } = this.methods.one.pointer;
      this.uncache();
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      let isFull = !self.ptrs;
      // is it part of a contraction?
      if (not.has('@hasContraction') && not.contractions) {
        let more = not.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      let nots = not.fullPointer.reverse();
      // remove them from the actual document)
      let document = pluckOutTerm(this.document, nots);
      // repair our pointers
      let gonePtrs = indexN(nots);
      ptrs = fixPointers$1(ptrs, gonePtrs);
      // clean up our original inputs
      self.ptrs = ptrs;
      self.document = document;
      self.compute('index');
      // if we started zoomed-out, try to end zoomed-out
      if (isFull) {
        self.ptrs = undefined;
      }
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
      let res = self.toView(ptrs); //return new document
      return res
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

  // aliases
  methods$i.deHyphenate = methods$i.dehyphenate;
  methods$i.toQuotation = methods$i.toQuotations;

  var whitespace = methods$i;

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
    this.uncache();
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
    if (this._cache) {
      this._cache = this._cache.reverse();
    }
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

  const isArray$6 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      let end = homeDocs[homeDocs.length - 1];
      let last = end[end.length - 1];
      if (/ /.test(last.post) === false) {
        last.post += ' ';
      }
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
    home.document = combineDocs(home.document, input.docs);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      // parse and splice-in new terms
      if (typeof input === 'string') {
        let more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          let ptrs = this.fullPointer;
          let at = ptrs[ptrs.length - 1][0];
          this.document.splice(at, 0, ...more.document);
        }
        // put the docs
        return this.all().compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (isArray$6(input)) {
        let docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  // add indexes to pointers
  const harden = function () {
    this.ptrs = this.fullPointer;
    return this
  };
  // remove indexes from pointers
  const soften = function () {
    let ptr = this.ptrs;
    if (!ptr || ptr.length < 1) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$g = Object.assign({}, caseFns, insert$1, replace, remove, whitespace, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };
  var api$h = addAPI$2;

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
    api: api$h,
    compute: compute$7,
  };

  var contractions$4 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'arent', out: ['are', 'not'] },
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
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    // { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
    { word: 'outta', out: ['out', 'of'] },
    { word: 'tryna', out: ['trying', 'to'] },
    { word: 'gtg', out: ['got', 'to', 'go'] },
    { word: 'im', out: ['i', 'am'] },
    { word: 'imma', out: ['I', 'will'] },
    { word: 'imo', out: ['in', 'my', 'opinion'] },
    { word: 'irl', out: ['in', 'real', 'life'] },
    { word: 'ive', out: ['i', 'have'] },
    { word: 'rn', out: ['right', 'now'] },
    { word: 'tbh', out: ['to', 'be', 'honest'] },
    { word: 'wanna', out: ['want', 'to'] },
    { word: `c'mere`, out: ['come', 'here'] },
    { word: `c'mon`, out: ['come', 'on'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },
    // shoulda, coulda
    { word: 'shoulda', out: ['should', 'have'] },
    { word: 'coulda', out: ['coulda', 'have'] },
    { word: 'woulda', out: ['woulda', 'have'] },
    { word: 'musta', out: ['must', 'have'] },

    // { after: `cause`, out: ['because'] },
    { word: "tis", out: ['it', 'is'] },
    { word: "twas", out: ['it', 'was'] },
    { word: `y'know`, out: ['you', 'know'] },
    { word: "ne'er", out: ['never'] },
    { word: "o'er", out: ['over'] },
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
  ];

  // number suffixes that are not units
  const t$1 = true;
  var numberSuffixes = {
    'st': t$1,
    'nd': t$1,
    'rd': t$1,
    'th': t$1,
    'am': t$1,
    'pm': t$1,
    'max': t$1,
    '°': t$1,
    's': t$1, // 1990s
    'e': t$1, // 18e - french/spanish ordinal
    'er': t$1, //french 1er
    'ère': t$1, //''
    'ème': t$1, //french 2ème
  };

  var model$7 = {
    one: {
      contractions: contractions$4,
      numberSuffixes
    }
  };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    let [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word, i) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      word.index = [n, w + i];
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

  const hasContraction$1 = /'/;
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
    let before = terms[i].normal.split(hasContraction$1)[0];

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

  const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
  const phoneNum = /^[0-9]{3}-[0-9]{4}$/;

  const numberRange = function (terms, i) {
    let term = terms[i];
    let parts = term.text.match(isRange);
    if (parts !== null) {
      // 123-1234 is a phone number, not a number-range
      if (term.tags.has('PhoneNumber') === true || phoneNum.test(term.text)) {
        return null
      }
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

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/; //(must be lowercase)

  const numberUnit = function (terms, i, world) {
    const notUnit = world.model.one.numberSuffixes || {};
    let term = terms[i];
    let parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      let unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (notUnit.hasOwnProperty(unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };
  var numberUnit$1 = numberUnit;

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    let tmp = view.update();
    tmp.document = [terms];
    // offer to re-tag neighbours, too
    let end = start + len;
    if (start > 0) {
      start -= 1;
    }
    if (terms[end]) {
      end += 1;
    }
    tmp.ptrs = [[0, start, end]];
  };

  const byEnd = {
    // ain't
    t: (terms, i) => apostropheT$1(terms, i),
    // how'd
    d: (terms, i) => apostropheD(terms, i),
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
    let doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    return doc.docs[0]
  };

  // there's is usually [there, is]
  // but can be 'there has' for 'there has (..) been'
  const thereHas = function (terms, i) {
    for (let k = i + 1; k < 5; k += 1) {
      if (!terms[k]) {
        break
      }
      if (terms[k].normal === 'been') {
        return ['there', 'has']
      }
    }
    return ['there', 'is']
  };

  //really easy ones
  const contractions$2 = (view) => {
    let { world, document } = view;
    const { model, methods } = world;
    let list = model.one.contractions || [];
    // let units = new Set(model.one.units || [])
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
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          reTag(document[n], view, i, words.length);
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
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit$1(terms, i, world);
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
    });
  };
  var contractions$3 = contractions$2;

  var compute$5 = { contractions: contractions$3 };

  const plugin = {
    model: model$7,
    compute: compute$5,
    hooks: ['contractions'],
  };
  var contractions$1 = plugin;

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

        // special case for phrasal-verbs - 2nd word is a #Particle
        if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
          // guard against 'take walks in'
          // if (terms[i + skip - 2] && terms[i + skip - 2].tags.has('Infinitive')) { }
          setTag([ts[1]], 'Particle', world, false, '1-phrasal-particle');
        }
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

  const prefix$1 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
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
        setTag([t], tag, world, false, '1-lexicon-alias');
        // fastTag(t, tag, '1-lexicon-alias')
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$1.test(word) === true) {
      let stem = word.replace(prefix$1, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
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
  const lexicon$5 = function (view) {
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

  var compute$4 = {
    lexicon: lexicon$5
  };

  // derive clever things from our lexicon key-value pairs
  const expand = function (words) {
    // const { methods, model } = world
    let lex = {};
    // console.log('start:', Object.keys(lex).length)
    let _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      let tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
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
  var expandLexicon = expand;

  var methods$f = {
    one: {
      expandLexicon,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords$1 = function (words) {
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

  var lib$5 = { addWords: addWords$1 };

  const model$6 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
    }
  };

  var lexicon$4 = {
    model: model$6,
    methods: methods$f,
    compute: compute$4,
    lib: lib$5,
    hooks: ['lexicon']
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$2 = function (phrase, world) {
    const { methods, model } = world;
    let terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
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
      let words = tokenize$2(phrase, world);
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

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$g (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      let trie = isObject$4(input) ? input : build(input, this.world);
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
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = build(input, this.world());
      return compress$1(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$g,
    lib: lib$4
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

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;


  // is the pointer the full sentence?
  // export const isFull = function (ptr, document) {
  //   let [n, start, end] = ptr
  //   if (start !== 0) {
  //     return false
  //   }
  //   if (document[n] && document[n][end - 1] && !document[n][end]) {
  //     return true
  //   }
  //   return false
  // }

  const parseRegs = function (regs, opts, world) {
    const one = world.methods.one;
    if (typeof regs === 'number') {
      regs = String(regs);
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, world);
      regs = one.parseMatch(regs, opts, world);
    }
    return regs
  };

  const match$2 = function (regs, group, opts) {
    const one = this.methods.one;
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.settle()
    }
    regs = parseRegs(regs, opts, this.world);
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
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      let ptrs = regs.fullPointer; // support a view object as input
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let ptrs = one.match(this.docs, todo, this._cache).ptrs;
    return ptrs.length > 0
  };

  // 'if'
  const ifFn = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m)//recurse with result
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    let cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      let m = this.update([ptr]);
      let res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    let view = this.update(ptrs);
    // try and reconstruct the cache
    if (this._cache) {
      view._cache = ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  const ifNo = function (regs, group, opts) {
    const { methods } = this;
    const one = methods.one;
    // support a view object as input
    if (isView(regs)) {
      return this.filter(m => !m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    let cache = this._cache || [];
    let view = this.filter((m, i) => {
      let todo = { regs, group, justOne: true };
      let ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$3 = { matchOne, match: match$2, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
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
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
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
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
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
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
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

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround = { before, after, growLeft, growRight, grow };

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const isArray$5 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc$3 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$5(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    let [n, start, end] = ptr;
    if (view.document[n] && view.document[n][start]) {
      ptr[3] = ptr[3] || view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] = ptr[4] || view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  const methods$e = {};
  // [before], [match], [after]
  methods$e.splitOn = function (m, group) {
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
  methods$e.splitBefore = function (m, group) {
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
  methods$e.splitAfter = function (m, group) {
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
  methods$e.split = methods$e.splitAfter;

  var split$1 = methods$e;

  const methods$d = Object.assign({}, match$3, lookaround, split$1);
  // aliases
  methods$d.lookBehind = methods$d.before;
  methods$d.lookBefore = methods$d.before;

  methods$d.lookAhead = methods$d.after;
  methods$d.lookAfter = methods$d.after;

  methods$d.notIf = methods$d.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$d);
  };
  var api$f = matchAPI;

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

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
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
  const titleCase$1 = str => str.charAt(0).toUpperCase() + str.substring(1);
  const end = (str) => str.charAt(str.length - 1);
  const start = (str) => str.charAt(0);
  const stripStart = (str) => str.substring(1);
  const stripEnd = (str) => str.substring(0, str.length - 1);

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

      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      // support foo{1,9}
      if (hasMinMax.test(w) === true) {
        w = w.replace(hasMinMax, (_a, b, c) => {
          if (c === undefined) {
            // '{3}'	Exactly three times
            obj.min = Number(b);
            obj.max = Number(b);
          } else {
            c = c.replace(/, */, '');
            if (b === undefined) {
              // '{,9}' implied zero min
              obj.min = 0;
              obj.max = Number(c);
            } else {
              // '{2,4}' Two to four times
              obj.min = Number(b);
              // '{3,}' Three or more times
              obj.max = Number(c || 999);
            }
          }
          // use same method as '+'
          obj.greedy = true;
          // 0 as min means the same as '?'
          if (!obj.min) {
            obj.optional = true;
          }
          return ''
        });
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

      //root/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        // obj.sense = w
        obj.root = w;
        if (/\//.test(w)) {
          let split = obj.root.split(/\//);
          obj.root = split[0];
          obj.pos = split[1];
          if (obj.pos === 'adj') {
            obj.pos = 'Adjective';
          }
          // titlecase
          obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
          // add sense-number too
          if (split[2] !== undefined) {
            obj.sense = split[2];
          }
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
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };
  var parseToken$1 = parseToken;

  const hasDash$2 = /[a-z0-9][-–—][a-z]/i;

  // match 're-do' -> ['re','do']
  const splitHyphens$1 = function (regs, world) {
    let prefixes = world.model.one.prefixes;
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      let reg = regs[i];
      if (reg.word && hasDash$2.test(reg.word)) {
        let words = reg.word.split(/[-–—]/g);
        // don't split 're-cycle', etc
        if (prefixes.hasOwnProperty(words[0])) {
          continue
        }
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          let obj = Object.assign({}, reg);
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };
  var splitHyphens$2 = splitHyphens$1;

  // add all conjugations of this verb
  const addVerbs = function (token, world) {
    let { all } = world.methods.two.transform.verb || {};
    let str = token.root;
    if (!all) {
      return []
    }
    return all(str, world.model)
  };

  // add all inflections of this noun
  const addNoun = function (token, world) {
    let { all } = world.methods.two.transform.noun || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // add all inflections of this adjective
  const addAdjective = function (token, world) {
    let { all } = world.methods.two.transform.adjective || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          // have explicitly set from POS - '{sweet/adjective}'
          if (token.pos) {
            if (token.pos === 'Verb') {
              choices = choices.concat(addVerbs(token, world));
            } else if (token.pos === 'Noun') {
              choices = choices.concat(addNoun(token, world));
            } else if (token.pos === 'Adjective') {
              choices = choices.concat(addAdjective(token, world));
            }
          } else {
            // do verb/noun/adj by default
            choices = choices.concat(addVerbs(token, world));
            choices = choices.concat(addNoun(token, world));
            choices = choices.concat(addAdjective(token, world));
          }
          choices = choices.filter(str => str);
          if (choices.length > 0) {
            token.operator = 'or';
            token.fastOr = new Set(choices);
          }
        } else {
          // if no compromise/two, drop down into 'machine' lookup
          token.machine = token.root;
          delete token.id;
          delete token.root;
        }
      }
      return token
    });

    return regs
  };
  var inflectRoot$1 = inflectRoot;

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
  const syntax = function (input, opts, world) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    opts = opts || {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks$1(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken$1(str, opts));
    // '~re-do~'
    tokens = splitHyphens$2(tokens, world);
    // '{walk}'
    tokens = inflectRoot$1(tokens, world);
    //clean up anything weird
    tokens = postProcess$1(tokens);
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
      if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
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
  const hasDash$1 = / [-–—]{1,3} /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1;

  const methods$c = {
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
    /** is there a colon after term word? */
    hasColon: term => hasPost(term, ':'),
    /** is there a slash '/' in term word? */
    hasSlash: term => /\//.test(term.text),
    /** a hyphen connects two words like-term */
    hasHyphen: term => hasHyphen$1.test(term.post) || hasHyphen$1.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase */
    isTitleCase: term => /^\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
    /** uppercase all letters */
    isUpperCase: term => /^\p{Lu}+$/u.test(term.text),
  };
  // aliases
  methods$c.hasQuotation = methods$c.hasQuote;

  var termMethods = methods$c;

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
    // match an id
    if (reg.id !== undefined && reg.id === term.id) {
      return true
    }
    //support a text match
    if (reg.word !== undefined) {
      // check case-sensitivity, etc
      if (reg.use) {
        return reg.word === term[reg.use]
      }
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
      let str = term.normal;
      if (reg.use) {
        str = term[reg.use];
      }
      return reg.regex.test(str)
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
      // {work/verb} must be a verb
      if (reg.pos && !term.tags.has(reg.pos)) {
        return null
      }
      let str = term.root || term.implicit || term.machine || term.normal;
      return reg.fastOr.has(str) || reg.fastOr.has(term.text)
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
        // console.log(`greedyTo ${state.terms[t].normal}`)
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
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
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

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    let { regs } = state;
    let reg = regs[state.r];

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
      return true
    }
    // set the group result
    if (state.hasGroup === true) {
      const g = getGroup$2(state, state.t);
      g.length = skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };
  var doAstrix$1 = doAstrix;

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock$1 = function (state, skipN = 0) {
    let block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      let regs = block.choices[c];
      if (!isArray$4(regs)) {
        return false
      }
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
      return doOrBlock$1(state, skipN) // try it again!
    }
    return skipN
  };

  const doAndBlock$1 = function (state) {
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
      // console.log(`doAndBlock ${state.terms[state.t].normal}`)
      return longest
    }
    return false
  };

  const orBlock = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let skipNum = doOrBlock$1(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$2(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        let end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-or|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doOrBlock = orBlock;

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    let reg = regs[state.r];

    let skipNum = doAndBlock$1(state);
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
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doAndBlock = andBlock;

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = matchTerm(state.terms[t], reg, state.start_i + state.t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = matchTerm(state.terms[t], nextReg, state.start_i + state.t, state.phrase_length);
        if (found) {
          break
        }
      }
      skip += 1;
      // is it max-length now?
      if (reg.max !== undefined && skip === reg.max) {
        break
      }
    }
    if (skip === 0) {
      return false //dead
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  var negGreedy$1 = negGreedy;

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    let reg = regs[state.r];

    // match *anything* but this term
    let tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    let found = matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (found) {
      return false//bye
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      let nextReg = regs[state.r + 1];
      if (nextReg) {
        let fNext = matchTerm(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
        if (fNext) {
          state.r += 1;
        } else if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          let fNext2 = matchTerm(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
          if (fNext2) {
            state.r += 2;
          }
        }
      }
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      return negGreedy$1(state, tmpReg, regs[state.r + 1])
    }
    state.t += 1;
    return true
  };
  var doNegative$1 = doNegative;

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let term = state.terms[state.t];
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
  };

  var foundOptional$1 = foundOptional;

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    let reg = regs[state.r];
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // foo{2,4} - has a greed-minimum
    if (reg.min && reg.min > state.t) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };
  var greedyMatch$1 = greedyMatch;

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    let term = state.terms[state.t];
    let reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      let nextTerm = state.terms[state.t + 1];
      // ensure next word is implicit
      if (!nextTerm.implicit) {
        return
      }
      // we matched "we've" - skip-over [we, have]
      if (reg.word === term.normal) {
        state.t += 1;
      }
      // also skip for @hasContraction
      if (reg.method === 'hasContraction') {
        state.t += 1;
      }
    }
  };
  var contractionSkip$1 = contractionSkip;

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    let reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$2(state, startAt);
    // Update group - add greedy or increment length
    if (state.t > 1 && reg.greedy) {
      g.length += state.t - startAt;
    } else {
      g.length++;
    }
  };

  // when a reg matches a term
  const simpleMatch = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let term = state.terms[state.t];
    let startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional$1(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip$1(state);
    }
    //advance to the next term!
    state.t += 1;
    //check any ending '$' flags
    //if this isn't the last term, refuse the match
    if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
      return null //die
    }
    // keep 'foo+' going...
    if (reg.greedy === true) {
      let alive = greedyMatch$1(state);
      if (!alive) {
        return null
      }
    }
    // log '[foo]' as a group
    if (state.hasGroup === true) {
      setGroup(state, startAt);
    }
    return true
  };
  var simpleMatch$1 = simpleMatch;

  // i formally apologize for how complicated this is.

  /** 
   * try a sequence of match tokens ('regs') 
   * on a sequence of terms, 
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
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

    // we must satisfy every token in 'regs'
    // if we get to the end, we have a match.
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
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      // support 'unspecific greedy' .* properly
      if (reg.anything === true && reg.greedy === true) {
        let alive = doAstrix$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        let alive = doOrBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        let alive = doAndBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support '.' as any-single
      if (reg.anything === true) {
        // '!.' negative anything should insta-fail
        if (reg.negative && reg.anything) {
          return null
        }
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        // we want *anything* but this term
        let alive = doNegative$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      // console.log('   - ' + state.terms[state.t].text)
      let hasMatch = matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // console.log('=-=-=-= here -=-=-=-')

      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    let pntr = [null, start_i, state.t + start_i];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    let groups = {};
    Object.keys(state.groups).forEach(k => {
      let o = state.groups[k];
      let start = start_i + o.start;
      groups[k] = [null, start, start + o.length];
    });
    return { pointer: pntr, groups: groups }
  };
  var fromHere = tryHere;

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
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

  const notIf = function (results, not, docs) {
    results = results.filter(res => {
      let [n, start, end] = res.pointer;
      let terms = docs[n].slice(start, end);
      for (let i = 0; i < terms.length; i += 1) {
        let slice = terms.slice(i);
        let found = fromHere(slice, not, i, terms.length);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  var notIf$1 = notIf;

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
  const runMatch$2 = function (docs, todo, cache) {
    cache = cache || [];
    let { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      let terms = docs[n];
      // let index = terms[0].index || []
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
          // res = addSentence(res, index[0])
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
    if (todo.notIf) {
      results = notIf$1(results, todo.notIf, docs);
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

  var match$1 = runMatch$2;

  const methods$a = {
    one: {
      termMethods,
      parseMatch,
      match: match$1,
    },
  };

  var methods$b = methods$a;

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      let killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: api$f,
    methods: methods$b,
    lib: lib$3,
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
    terms.forEach((t) => {
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
        // kill abbreviation periods
        if (t.tags.has('Abbreviation')) {
          post = post.replace(/\./, '');
        }
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
    if (!docs || !docs[0] || !docs[0][0]) {
      return text
    }
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      let last = docs[docs.length - 1];
      if (!last[last.length - 1].tags.has('Emoticon')) {
        text = text.replace(trimEnd, '');
      }
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
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
      keepSpace: false,
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

  /* eslint-disable no-bitwise */
  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  let k = [], i$1 = 0;
  for (; i$1 < 64;) {
    k[i$1] = 0 | Math.sin(++i$1 % Math.PI) * 4294967296;
  }

  function md5(s) {
    let b, c, d,
      h = [b = 0x67452301, c = 0xEFCDAB89, ~b, ~c],
      words = [],
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a;) {
      words[a >> 2] |= j.charCodeAt(a) << 8 * a--;
    }

    for (i$1 = j = 0; i$1 < s; i$1 += 16) {
      a = h;

      for (; j < 64;
        a = [
          d = a[3],
          (
            b +
            ((d =
              a[0] +
              [
                b & c | ~b & d,
                d & b | ~d & c,
                b ^ c ^ d,
                c ^ (b | ~d)
              ][a = j >> 4] +
              k[j] +
              ~~words[i$1 | [
                j,
                5 * j + 1,
                3 * j + 5,
                7 * j
              ][a] & 15]
            ) << (a = [
              7, 12, 17, 22,
              5, 9, 14, 20,
              4, 11, 16, 23,
              6, 10, 15, 21
            ][4 * a + j++ % 4]) | d >>> -a)
          ),
          b,
          c
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j;) h[--j] += a[j];
    }

    for (s = ''; j < 32;) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s;
  }

  // console.log(md5('food-safety'))

  const defaults$1 = {
    text: true,
    terms: true,
  };

  let opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: (terms) => textFromTerms(terms, { keepPunct: true }, false),
    normal: (terms) => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: (terms) => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

    machine: (terms) => textFromTerms(terms, opts, false),
    root: (terms) => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: (terms) => md5(textFromTerms(terms, { keepPunct: true }, false)),

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


  const methods$9 = {
    /** return data */
    json: function (n) {
      let res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$9.data = methods$9.json;
  var json = methods$9;

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
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli$1.yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          let str = view.update([t.reference]).text('normal');
          word += ` - ${cli$1.dim(cli$1.i('[' + str + ']'))}`;
        }
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

  const toText$2 = function (term) {
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
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$2(t);
        }
      }
    });
    return text
  };
  var wrap$1 = wrap;

  const isObject$2 = val => {
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
    if (isObject$2(method)) {
      return wrap$1(this, method)
    }
    // text out formats
    if (method === 'text') {
      return this.text()
    }
    if (method === 'normal') {
      return this.text('normal')
    }
    if (method === 'root') {
      return this.text('root')
    }
    if (method === 'machine' || method === 'reduced') {
      return this.text('machine')
    }
    if (method === 'hash' || method === 'md5') {
      return md5(this.text())
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

  const methods$8 = {
    /** */
    debug: debug$1,
    /** */
    out,
    /** */
    wrap: function (obj) {
      return wrap$1(this, obj)
    },
  };

  var out$1 = methods$8;

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && fmts$1.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts$1[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt);//todo: fixme
      }
      if (opts.keepSpace === undefined && this.pointer) {
        opts.keepSpace = false;
      }
      if (opts.keepPunct === undefined && this.pointer) {
        let ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepPunct = false;
        } else {
          opts.keepPunct = true;
        }
      }
      // set defaults
      if (opts.keepPunct === undefined) {
        opts.keepPunct = true;
      }
      if (opts.keepSpace === undefined) {
        opts.keepSpace = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$7 = Object.assign({}, out$1, text, json, html$1);

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$7);
  };
  var api$e = addAPI$1;

  var output = {
    api: api$e,
    methods: {
      one: {
        hash: md5
      }
    }
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

  const max$1 = 20;

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
    doc = doc.filter(a => a.length > 0);
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

  var methods$6 = {
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

  const isArray$3 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc = (m, view) => {
    if (typeof m === 'string' || isArray$3(m)) {
      return view.match(m)
    }
    if (!m) {
      return view.none()
    }
    // support pre-parsed reg object
    return m
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

  const methods$5 = {};

  // all parts, minus duplicates
  methods$5.union = function (m) {
    m = getDoc(m, this);
    let ptrs = getUnion$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.and = methods$5.union;

  // only parts they both have
  methods$5.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$5.not = function (m) {
    m = getDoc(m, this);
    let ptrs = getDifference(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.difference = methods$5.not;

  // get opposite of a
  methods$5.complement = function () {
    let doc = this.all();
    let ptrs = getDifference(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$5.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion$1(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };


  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$5);
  };
  var api$d = addAPI;

  var pointers = {
    methods: methods$6,
    api: api$d,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      let net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$b = function (View) {

    /** speedy match a sequence of matches */
    View.prototype.sweep = function (net, opts = {}) {
      const { world, docs } = this;
      const { methods } = world;
      let found = methods.one.bulkMatch(docs, net, this.methods, opts);

      // apply any changes
      if (opts.tagger !== false) {
        methods.one.bulkTagger(found, docs, this.world);
      }
      // fix the pointers
      // collect all found results into a View
      found = found.map(o => {
        let ptr = o.pointer;
        let term = docs[ptr[0]][ptr[1]];
        let len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      let ptrs = found.map(o => o.pointer);
      // cleanup results a bit
      found = found.map(obj => {
        obj.view = this.update([obj.pointer]);
        delete obj.regs;
        delete obj.needs;
        delete obj.pointer;
        delete obj._expanded;
        return obj
      });
      return {
        view: this.update(ptrs),
        found
      }
    };

  };
  var api$c = api$b;

  // extract the clear needs for an individual match token
  const getTokenNeeds = function (reg) {
    // negatives can't be cached
    if (reg.optional === true || reg.negative === true) {
      return null
    }
    if (reg.tag) {
      return '#' + reg.tag
    }
    if (reg.word) {
      return reg.word
    }
    if (reg.switch) {
      return `%${reg.switch}%`
    }
    return null
  };

  const getNeeds = function (regs) {
    let needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag)
      if (reg.operator === 'and' && reg.choices) {
        reg.choices.forEach(oneSide => {
          oneSide.forEach(r => {
            needs.push(getTokenNeeds(r));
          });
        });
      }
    });
    return needs.filter(str => str)
  };

  const getWants = function (regs) {
    let wants = [];
    let count = 0;
    regs.forEach(reg => {
      if (reg.operator === 'or' && !reg.optional && !reg.negative) {
        // add fast-or terms
        if (reg.fastOr) {
          Array.from(reg.fastOr).forEach(w => {
            wants.push(w);
          });
        }
        // add slow-or
        if (reg.choices) {
          reg.choices.forEach(rs => {
            rs.forEach(r => {
              let n = getTokenNeeds(r);
              if (n) {
                wants.push(n);
              }
            });
          });
        }
        count += 1;
      }
    });
    return { wants, count }
  };

  const parse$2 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      obj.regs = parseMatch(obj.match, {}, world);
      // wrap these ifNo properties into an array
      if (typeof obj.ifNo === 'string') {
        obj.ifNo = [obj.ifNo];
      }
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      let { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
  };

  var parse$3 = parse$2;

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$3(matches, world);

    // collect by wants and needs
    let hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
    });
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      let already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (already[obj.match]) {
          return false
        }
        already[obj.match] = true;
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    let always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      always
    }
  };

  var buildNet$1 = buildNet;

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, hooks) {
    return docCaches.map((set, i) => {
      let maybe = [];
      Object.keys(hooks).forEach(k => {
        if (docCaches[i].has(k)) {
          maybe = maybe.concat(hooks[k]);
        }
      });
      // remove duplicates
      let already = {};
      maybe = maybe.filter(m => {
        if (already[m.match]) {
          return false
        }
        already[m.match] = true;
        return true
      });
      return maybe
    })
  };

  var getHooks$1 = getHooks;

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    return maybeList.map((list, n) => {
      let haves = docCache[n];
      // ensure all stated-needs of the match are met
      list = list.filter(obj => {
        return obj.needs.every(need => haves.has(need))
      });
      // ensure nothing matches in our 'ifNo' property
      list = list.filter(obj => {
        if (obj.ifNo !== undefined && obj.ifNo.some(no => haves.has(no)) === true) {
          return false
        }
        return true
      });
      // ensure atleast one(?) of the wants is found
      list = list.filter(obj => {
        if (obj.wants.length === 0) {
          return true
        }
        // ensure there's one cache-hit
        let found = obj.wants.filter(str => haves.has(str)).length;
        return found >= obj.minWant
      });
      return list
    })
  };
  var trimDown = localTrim;

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    let results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        let m = maybeList[n][i];
        // ok, actually do the work.
        let res = methods.one.match([document[n]], m);
        // found something.
        if (res.ptrs.length > 0) {
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
            // check ifNo
            // if (m.ifNo !== undefined) {
            //   let terms = document[n].slice(ptr[1], ptr[2])
            //   for (let k = 0; k < m.ifNo.length; k += 1) {
            //     const no = m.ifNo[k]
            //     // quick-check cache
            //     if (docCache[n].has(no)) {
            //       if (no.startsWith('#')) {
            //         let tag = no.replace(/^#/, '')
            //         if (terms.find(t => t.tags.has(tag))) {
            //           console.log('+' + tag)
            //           return
            //         }
            //       } else if (terms.find(t => t.normal === no || t.tags.has(no))) {
            //         console.log('+' + no)
            //         return
            //       }
            //     }
            //   }
            // }
            let todo = Object.assign({}, m, { pointer: ptr });
            if (m.unTag !== undefined) {
              todo.unTag = m.unTag;
            }
            results.push(todo);
          });
          //ok cool, can we stop early?
          if (opts.matchOne === true) {
            return [results[0]]
          }
        }
      }
    }
    return results
  };
  var runMatch$1 = runMatch;

  const tooSmall = function (maybeList, document) {
    return maybeList.map((arr, i) => {
      let termCount = document[i].length;
      arr = arr.filter(o => {
        return termCount >= o.minWords
      });
      return arr
    })
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    let docCache = methods.one.cacheDoc(document);
    // collect possible matches for this document
    let maybeList = getHooks$1(docCache, net.hooks);
    // ensure all defined needs are met for each match
    maybeList = trimDown(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);

    // now actually run the matches
    let results = runMatch$1(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };
  var bulkMatch = sweep$1;

  // is this tag consistent with the tags they already have?
  const canBe = function (terms, tag, model) {
    let tagSet = model.one.tagSet;
    if (!tagSet.hasOwnProperty(tag)) {
      return true
    }
    let not = tagSet[tag].not || [];
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      for (let k = 0; k < not.length; k += 1) {
        if (term.tags.has(not[k]) === true) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };
  var canBe$1 = canBe;

  const tagger$3 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    const looksPlural = methods.two.looksPlural;
    if (list.length === 0) {
      return list
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env.DEBUG_TAGS) {
      console.log(`\n\n  \x1b[32m→ ${list.length} post-tagger:\x1b[0m`); //eslint-disable-line
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      let reason = todo.reason || todo.match;
      let terms = getDoc([todo.pointer], document)[0];
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe$1(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`);
        // quick and dirty plural tagger
        if (todo.tag === 'Noun' && looksPlural) {
          let term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
          }
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, world, todo.safe, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => t.chunk = todo.chunk);
      }
    })
  };
  var bulkTagger = tagger$3;

  var methods$4 = {
    buildNet: buildNet$1,
    bulkMatch,
    bulkTagger
  };

  var sweep = {
    lib: lib$2,
    api: api$c,
    methods: {
      one: methods$4,
    }
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
    // now it's dirty?
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
  const log = (terms, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    let word = terms.map(t => {
      return t.text || '[' + t.implicit + ']'
    }).join(' ');
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(22)}  ${i(reason)}`); // eslint-disable-line
  };

  // add a tag to all these terms
  const setTag = function (terms, tag, world = {}, isSafe, reason) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log(terms, tag, reason);
    }
    if (isArray$2(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`);// eslint-disable-line
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

  const e$1=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n$1=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e$1({id:t}))),n}return [e$1({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r$1=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s$1=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n$1(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e$1(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e$1({});return t.forEach((t=>{if((t=e$1(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r$1(s=c).forEach(e$1),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r$1(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r$1(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r$1(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e$1({});return new g(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e$1({id:t,props:n});return this.json.children.push(r),new g(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r$1(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r$1(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r$1(this.json)}fillDown(){var e;return e=this.json,r$1(e,((e,t)=>{t.props=f(t.props,e.props);})),this}depth(){u(this.json);let e=r$1(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s$1(e);return new g(t)};_.prototype.plugin=function(e){e(this);};

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
    Hyphenated: 'cyan',
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
      let { not, also, is, novel } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
        novel,
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
  const compute$3 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      let o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [] }
    });
    const graph = _(flatList).cache().fillDown();
    return graph.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = Object.assign({}, tags[k]);
      tags[k].novel = true;
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate$1(tags, already);

    let allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$3(allTags);
    // convert it to our final format
    const res = fmt$1(nodes);
    return res
  };
  var addTags$2 = addTags$1;

  var methods$3 = {
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
        input.forEach(tag => methods.one.setTag(terms, tag, world, isSafe, reason));
      } else {
        methods.one.setTag(terms, input, world, isSafe, reason);
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
      tag = tag.replace(/^#/, '');
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
  var api$a = tagAPI;

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    let res = fn(tags, tagSet);
    model.one.tagSet = res;
    return this
  };

  var lib$1 = { addTags };

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
    methods: methods$3,
    api: api$a,
    lib: lib$1
  };

  // split by periods, question marks, unicode ⁇, etc
  const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s)/g;
  // merge these back into prev sentence
  const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s$/;
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
        // merge 'foo' + '.'
        if (arr[o + 1] && splitsOnly.test(arr[o + 1]) === true) {
          arr[o] += arr[o + 1];
          arr[o + 1] = '';
        }
        if (arr[o] !== '') {
          all.push(arr[o]);
        }
      }
    }
    return all
  };
  var simpleSplit = basicSplit;

  const hasLetter$2 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    let chunks = [];
    for (let i = 0; i < splits.length; i++) {
      let s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething$1.test(s) === false || hasLetter$2.test(s) === false) {
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
    return chunks
  };
  var simpleMerge = notEmpty;

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    let sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      let c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && isSentence(c, abbrevs) === false) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };
  var smartMerge$1 = smartMerge;

  /* eslint-disable regexp/no-dupe-characters-character-class */

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.' 
  const MAX_QUOTE = 280;// ¯\_(ツ)_/¯

  // don't support single-quotes for multi-sentences
  const pairs = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    // '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    // '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    // '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes'
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    // '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
  };
  const openQuote = RegExp('[' + Object.keys(pairs).join('') + ']', 'g');
  const closeQuote = RegExp('[' + Object.values(pairs).join('') + ']', 'g');

  const closesQuote = function (str) {
    if (!str) {
      return false
    }
    let m = str.match(closeQuote);
    if (m !== null && m.length === 1) {
      return true
    }
    return false
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    let arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let split = splits[i];
      // do we have an open-quote and not a closed one?
      let m = split.match(openQuote);
      if (m !== null && m.length === 1) {

        // look at the next sentence for a closing quote,
        if (closesQuote(splits[i + 1]) && splits[i + 1].length < MAX_QUOTE) {
          splits[i] += splits[i + 1];// merge them
          arr.push(splits[i]);
          splits[i + 1] = '';
          i += 1;
          continue
        }
        // look at n+2 for a closing quote,
        if (closesQuote(splits[i + 2])) {
          let toAdd = splits[i + 1] + splits[i + 2];// merge them all
          //make sure it's not too-long
          if (toAdd.length < MAX_QUOTE) {
            splits[i] += toAdd;
            arr.push(splits[i]);
            splits[i + 1] = '';
            splits[i + 2] = '';
            i += 2;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };
  var quoteMerge$1 = quoteMerge;

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen = /\(/g;
  const hasClosed = /\)/g;
  const mergeParens = function (splits) {
    let arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let split = splits[i];
      let m = split.match(hasOpen);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          let m2 = splits[i + 1].match(hasClosed);
          if (m2 !== null && m.length === 1 && !hasOpen.test(splits[i + 1])) {
            // merge in 2nd sentence
            splits[i] += splits[i + 1];
            arr.push(splits[i]);
            splits[i + 1] = '';
            i += 1;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };
  var parensMerge = mergeParens;

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;

  const splitSentences = function (text, world) {
    text = text || '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return []
    }
    // cleanup unicode-spaces
    text = text.replace('\xa0', ' ');
    // First do a greedy-split..
    let splits = simpleSplit(text);
    // Filter-out the crap ones
    let sentences = simpleMerge(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge$1(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge$1(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = parensMerge(sentences);
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
  var splitSentences$1 = splitSentences;

  const hasHyphen = function (str, model) {
    let parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
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

  const isSlash = /\p{L} ?\/ ?\p{L}+$/u;

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

  let notWord = [
    '.',
    '?',
    '!',
    ':',
    ';',
    '-',
    '–',
    '—',
    '--',
    '...',
    '(',
    ')',
    '[',
    ']',
    '"',
    "'",
    '`',
    '«',
    '»',
    '*',
    '•',
  ];
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
  var splitTerms = splitWords;

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    let { prePunctuation, postPunctuation, emoticons } = model.one;
    let original = str;
    let pre = '';
    let post = '';
    let chars = Array.from(str);

    // punctuation-only words, like '<3'
    if (emoticons.hasOwnProperty(str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // pop any punctuation off of the start
    let len = chars.length;
    for (let i = 0; i < len; i += 1) {
      let c = chars[0];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        continue//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-') && isNumber.test(chars[1])) {
        break//done
      }
      // '97 - year short-form
      if (c === "'" && c.length === 3 && isNumber.test(chars[1])) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // punctuation
      pre += chars.shift();//keep going
    }

    // pop any punctuation off of the end
    len = chars.length;
    for (let i = 0; i < len; i += 1) {
      let c = chars[chars.length - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        continue//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original) === true) {
        continue//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original) === true) {
        continue//keep it
      }
      // punctuation
      post = chars.pop() + post;//keep going
    }

    str = chars.join('');
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
  var tokenize$1 = normalizePunctuation;

  const parseTerm = (txt, model) => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$1(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };
  var splitWhitespace = parseTerm;

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str = str || '';
    let chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };
  var killUnicode$1 = killUnicode;

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

  // do acronyms need to be ASCII?  ... kind of?
  const periodAcronym$1 = /([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /([a-z]\.)+[a-z]\.?$/;

  const isAcronym$3 = function (str) {
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
    if (isAcronym$3(str)) {
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

  // turn a string input into a 'document' json format
  const parse$1 = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    let sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normal(t, world);
      });
      return terms
    });
    return input
  };
  var fromString = parse$1;

  const isAcronym$2 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse$1 = /(?:\u2026|\.{2,}) *$/; // '...'
  const hasLetter$1 = /\p{L}/u;
  const leadInit = /^[A-Z]\. $/; // "W. Kensington"

  /** does this look like a sentence? */
  const isSentence$2 = function (str, abbrevs) {
    // must have a letter
    if (hasLetter$1.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$2.test(str) === true) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
      return false
    }
    //check for '...'
    if (hasEllipse$1.test(str) === true) {
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
  var isSentence$3 = isSentence$2;

  var methods$2 = {
    one: {
      killUnicode: killUnicode$1,
      tokenize: {
        splitSentences: splitSentences$1,
        isSentence: isSentence$3,
        splitTerms,
        splitWhitespace,
        fromString,
      },
    },
  };

  const aliases = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };
  var aliases$1 = aliases;

  var misc$2 = [
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
    'surg'
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$3 = [
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
    // 'ft', //ambiguous
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
    // 'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    // 'pa', //ambig
    'fl oz', //
    'yb',
  ];

  // add our abbreviation list to our lexicon
  let list = [
    [misc$2],
    [units, 'Unit'],
    [nouns$3, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  let abbreviations = {};
  // add them to a future lexicon
  let lexicon$3 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$3[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$3[w] = [lexicon$3[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history'
  var prefixes$1 = [
    'anti',
    'bi',
    'co',
    'contra',
    'de',
    'extra',
    'infra',
    'inter',
    'intra',
    'macro',
    'micro',
    'mis',
    'mono',
    'multi',
    'peri',
    'pre',
    'pro',
    'proto',
    'pseudo',
    're',
    'sub',
    'supra',
    'trans',
    'tri',
    'un',
    'out', //out-lived
    'ex',//ex-wife

    // 'counter',
    // 'mid',
    // 'out',
    // 'non',
    // 'over',
    // 'post',
    // 'semi',
    // 'super', //'super-cool'
    // 'ultra', //'ulta-cool'
    // 'under',
    // 'whole',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'
  var suffixes$3 = {
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
    u: 'ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ',
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

  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7Bpunctuation%7D

  // punctuation to keep at start of word
  const prePunctuation = {
    '#': true, //#hastag
    '@': true, //@atmention
    '_': true,//underscore
    '°': true,
    // '+': true,//+4
    // '\\-',//-4  (escape)
    // '.',//.4
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  // punctuation to keep at end of word
  const postPunctuation = {
    '%': true,//88%
    '_': true,//underscore
    '°': true,//degrees, italian ordinal
    // '\'',// sometimes
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  const emoticons = {
    '<3': true,
    '</3': true,
    '<\\3': true,
    ':^P': true,
    ':^p': true,
    ':^O': true,
    ':^3': true,
  };

  var model$5 = {
    one: {
      aliases: aliases$1,
      abbreviations,
      prefixes: prefixes$1,
      suffixes: suffixes$3,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$3, //give this one forward
      unicode: unicode$3,
      emoticons
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    let str = term.normal || term.text || term.machine;
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

  const hasDash = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (hasDash.test(str)) {
      str = str.replace(/-/g, '');
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

  const methods$1 = {
    alias: (view) => termLoop(view, alias),
    machine: (view) => termLoop(view, machine),
    normal: (view) => termLoop(view, normal),
    freq: freq$1,
    offset: offset$1,
    index: index$1,
    wordCount: wordCount$1,
  };
  var compute$2 = methods$1;

  var tokenize = {
    compute: compute$2,
    methods: methods$2,
    model: model$5,
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

  var compute$1 = { typeahead: typeahead$1 };

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

  const api$8 = function (View) {
    View.prototype.autoFill = autoFill;
  };
  var api$9 = api$8;

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
        let prefix = str.substring(0, size);
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

  var lib = {
    typeahead: prepare
  };

  const model$4 = {
    one: {
      typeahead: {} //set a blank key-val
    }
  };
  var typeahead = {
    model: model$4,
    api: api$9,
    lib,
    compute: compute$1,
    hooks: ['typeahead']
  };

  // order here matters
  nlp$1.extend(change); //0kb
  nlp$1.extend(output); //0kb
  nlp$1.extend(match); //10kb
  nlp$1.extend(pointers); //2kb
  nlp$1.extend(tag); //2kb
  nlp$1.plugin(contractions$1); //~6kb
  nlp$1.extend(tokenize); //7kb
  nlp$1.plugin(cache$1); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$4); //1kb
  nlp$1.extend(sweep); //1kb

  // 01- full-word exceptions
  const checkEx = function (str, ex = {}) {
    if (ex.hasOwnProperty(str)) {
      return ex[str]
    }
    return null
  };

  // 02- suffixes that pass our word through
  const checkSame = function (str, same = []) {
    for (let i = 0; i < same.length; i += 1) {
      if (str.endsWith(same[i])) {
        return str
      }
    }
    return null
  };

  // 03- check rules - longest first
  const checkRules = function (str, fwd, both = {}) {
    fwd = fwd || {};
    let max = str.length - 1;
    // look for a matching suffix
    for (let i = max; i >= 1; i -= 1) {
      let size = str.length - i;
      let suff = str.substring(size, str.length);
      // check fwd rules, first
      if (fwd.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + fwd[suff]
      }
      // check shared rules
      if (both.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + both[suff]
      }
    }
    // try a fallback transform
    if (fwd.hasOwnProperty('')) {
      return str += fwd['']
    }
    if (both.hasOwnProperty('')) {
      return str += both['']
    }
    return null
  };

  //sweep-through all suffixes
  const convert = function (str = '', model = {}) {
    // 01- check exceptions
    let out = checkEx(str, model.ex);
    // 02 - check same
    out = out || checkSame(str, model.same);
    // check forward and both rules
    out = out || checkRules(str, model.fwd, model.both);
    //return unchanged
    out = out || str;
    return out
  };
  var convert$1 = convert;

  const flipObj = function (obj) {
    return Object.entries(obj).reduce((h, a) => {
      h[a[1]] = a[0];
      return h
    }, {})
  };

  const reverse = function (model = {}) {
    return {
      reversed: true,
      // keep these two
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // swap this one in
      fwd: model.rev || {}
    }
  };
  var reverse$1 = reverse;

  const prefix = /^([0-9]+)/;

  const toObject = function (txt) {
    let obj = {};
    txt.split('¦').forEach(str => {
      let [key, vals] = str.split(':');
      vals = (vals || '').split(',');
      vals.forEach(val => {
        obj[val] = key;
      });
    });
    return obj
  };

  const growObject = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix);
    if (m === null) {
      return val
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix, '');
    return full
  };

  const unpackOne = function (str) {
    let obj = toObject(str);
    return Object.keys(obj).reduce((h, k) => {
      h[k] = growObject(k, obj[k]);
      return h
    }, {})
  };

  const uncompress = function (model = {}) {
    if (typeof model === 'string') {
      model = JSON.parse(model);
    }
    model.fwd = unpackOne(model.fwd || '');
    model.both = unpackOne(model.both || '');
    model.rev = unpackOne(model.rev || '');
    model.ex = unpackOne(model.ex || '');
    return model
  };
  var uncompress$1 = uncompress;

  // generated in ./lib/models
  var model$3 = {
    "pastTense": {
      "first": {
        "fwd": "annte:ennen¦ieß:oßen¦og:iehen¦at:un¦1te:ln,rn,re¦1ob:hieben,heben¦1og:wiegen,wegen¦1ief:lafen¦1ßte:issen,ussen¦1erte:i¦2te:elen,aßen¦3te:achen,annen,weren,ueren",
        "both": "5te:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4te:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßte:rblassen,inpassen¦4uf:ischaffen¦3te:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2te:ezen,oren,rsen,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahl:pfehlen¦2aß:eressen,fressen¦2ang:rringen,dringen,pringen¦2osch:rlöschen¦2ag:rliegen,hliegen,nliegen¦2ßte:fassen¦2ieg:hweigen¦2ies:preisen,blasen¦2og:nlügen,fliegen¦2or:frieren¦2achte:bringen¦2ug:tragen,hlagen¦2ich:treichen¦2iff:greifen¦2ub:graben¦1aß:gessen,hessen,sitzen,messen¦1oh:liehen¦1ßte:ässen¦1te:ven,äen,xen,pen,ken,uen¦1ank:sinken,rinken,tinken¦1og:rügen,saugen,biegen¦1ahl:tehlen¦1or:heren,kiesen,wören¦1ieh:leihen¦1och:riechen¦1at:bitten,reten¦1and:winden,tehen,finden,binden¦1oll:uellen,wellen¦1omm:limmen¦1ie:peien,reien¦1amm:wimmen¦1ien:heinen¦1ieß:lassen¦1ing:fangen,gehen¦1achte:denken¦1ot:bieten¦1ang:wingen,singen,lingen¦1arb:werben,terben¦1ies:weisen¦1ich:weichen,leichen¦1usch:waschen¦1ieg:teigen¦1ach:techen,rechen¦1ah:sehen¦1itt:neiden,reiten¦1iff:leifen,feifen,neifen¦1ied:heiden¦1off:saufen¦1as:lesen¦1ief:laufen,rufen¦1ud:laden¦1ielt:halten¦1ab:geben¦1iel:fallen¦urde:erden¦ann:innen¦uchs:achsen¦ocht:echten¦af:effen¦arf:erfen¦olz:elzen¦iet:aten¦ahm:ehmen¦am:ommen¦alf:elfen¦alt:elten¦oß:ießen¦uhr:ahren¦ieb:eiben¦iß:eißen",
        "rev": "ingen:ang¦iegen:ag¦elken:olk¦affen:uf¦ergen:arg¦eiden:ied¦eihen:ieh¦ieden:ott¦ben:tte¦esen:as¦ehen:ah¦erben:arb¦1en:ste,fte,bte,gte,ite,zte¦1ennen:rannte,kannte,nannte¦1n:ete¦1oßen:tieß¦1iehen:zog¦1eschen:rosch¦1eben:wob¦1eißen:hieß¦2n:elte¦2eiten:glitt¦2ieben:chob¦2eben:nhob,shob,rhob¦2en:inte,hrte,hlte,ihte,llte,örte¦2ssen:reßte,pißte,laßte¦2egen:ewog¦3n:terte,derte,uerte,nerte,perte,gerte,herte,merte,ferte,berte,kerte,serte,lerte,verte,ßerte¦3en:schte,ichte,ielte,ennte,echte,eelte,önnte,maßte¦4n:eierte,owerte¦4en:lachte,fachte,pannte,machte,wachte,mannte,querte,hwerte¦4afen:schlief¦5en:krachte",
        "ex": "schwamm brust:brustschwimmen¦schwamm delfin:delfinschwimmen¦schwamm delphin:delphinschwimmen¦fuhr:rad fahren¦fuhr rad:radfahren¦aß:essen¦war:sein¦7te:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen¦3ang:abdingen,abringen¦2aß:abessen,fressen¦6te:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,panzern,schwelen¦4itt:abgleiten,ausleiden,mitleiden¦8te:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9te:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßte:anpassen,stressen¦5ßte:anpressen,aufpassen,erpressen,verpassen,vermissen¦3aß:aufessen,ausessen,mitessen¦4ag:aufliegen,beiliegen¦11ielt:aufrechterhalte¦5osch:ausdreschen,verdreschen¦5itt:ausgleiten,entgleiten¦4olk:ausmelken¦6ßte:auspressen,einpressen,verprassen¦10te:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ang:auswringen¦5te:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3og:belügen,erwägen,abwiegen¦5ag:bloßliegen,festliegen,naheliegen¦3ag:daliegen¦6og:durchlügen¦8ßte:durchpressen,beeinflussen,bezuschussen¦6ang:durchringen¦7och:durchstechen¦6ob:durchweben¦4ob:einweben,aufheben,wegheben,entheben¦11te:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rte:entkommerzialisie¦3itt:erleiden¦5uf:erschaffen¦13te:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ieß:gutheißen,verheißen¦12te:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6uf:herschaffen,hinschaffen¦6ag:herumliegen¦10uf:hierherschaffen¦9uf:hinaufschaffen,zurückschaffen¦13amm:hinterherschwimme¦5or:nachgären¦7uf:nachschaffen¦8itt:niedergleiten¦15te:parallelschalten,weiterentwickel,weiterverbreiten¦8ag:richtigliegen¦7ag:schiefliegen,zurückliegen¦4arg:verbergen¦4ied:vermeiden¦4ieh:verzeihen¦4aß:vollessen¦4og:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14te:wiedervereinige,zurückbegleiten¦4ott:zersieden¦16te:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6tte:achthaben,freihaben,gernhaben¦3te:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1uk:backen¦4te:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,lachen,machen,spaßen,wachen¦1and:binden,finden,winden¦1arg:bergen¦1arst:bersten¦1at:bitten,tun¦3ahl:befehlen¦1og:biegen,lügen,saugen,wiegen,ziehen¦1ot:bieten¦2ies:blasen,preisen¦3ßte:blassen,pressen¦2achte:bringen¦6onnte:dafürkönnen¦1ang:dingen,ringen,singen¦1urfte:dürfen¦2ang:dringen,wringen¦2osch:dreschen¦1mailte:e-mailen¦1iel:fallen¦1ing:fangen,gehen¦2ßte:fassen,hassen,passen,missen,pissen¦2og:fliegen¦2or:frieren¦1ab:geben¦3ar:gebären¦3ieh:gedeihen¦2itt:gleiten¦1or:gären¦2ub:graben¦2iff:greifen¦2tte:haben¦1ielt:halten¦1ieß:heißen,lassen¦1ob:heben,weben¦1onnte:können¦1ud:laden¦1ief:laufen,rufen¦1ag:liegen¦1as:lesen¦1ieh:leihen¦1itt:leiden,reiten¦1olk:melken¦1aß:messen,sitzen¦1ied:meiden¦1ochte:mögen¦3as:genesen¦1och:riechen¦3uf:schaffen¦5ah:geschehen¦4or:schwären,verlieren¦1ah:sehen¦1ott:sieden¦1off:saufen¦2ob:stieben¦1ank:sinken¦2ug:tragen¦2off:triefen¦1hettoisierte:gettoisieren¦1usch:waschen¦1ich:weichen¦1ies:weisen¦1arb:werben¦1ußte:wissen¦2te:ölen,üben¦7ßte:veranlassen¦4arb:verderben¦5ib:vergraben¦4at:vertuen,guttun¦5andte:übersenden¦6onn:überspinnen¦3ob:abheben,beheben¦17erte:herauskristallisi,hinauskomplimenti¦5ob:hochheben¦5og:nachwiegen,überwiegen¦1annte:kennen,nennen,rennen¦4ief:schlafen¦5at:großtun¦18te:institutionalisiere¦7at:schwertun"
      },
      "second": {
        "fwd": "anntest:ennen¦ießt:oßen¦ogst:iehen¦ochtest:echten¦atst:un¦1test:ln,rn,re¦1obst:hieben,heben¦1ogst:wiegen,wegen¦1iest:reien¦1iefst:lafen¦1ßtest:issen,ussen¦1ertest:i¦2test:elen,aßen,rsen¦3test:achen,ochen,annen,weren,ueren",
        "both": "5test:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4test:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßtest:rblassen,inpassen¦4ufst:ischaffen¦3test:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2test:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahlst:pfehlen¦2aßt:eressen,fressen¦2angst:rringen,dringen,pringen¦2oschst:rlöschen¦2agst:rliegen,hliegen,nliegen¦2ßtest:fassen¦2iegst:hweigen¦2iest:preisen,blasen¦2ogst:nlügen,fliegen¦2orst:frieren¦2achtest:bringen¦2ugst:tragen,hlagen¦2ichst:treichen¦2iffst:greifen¦2ubst:graben¦1aßt:gessen,hessen,sitzen,messen¦1ohst:liehen¦1ßtest:ässen¦1test:ven,äen,xen,pen,ken,uen¦1ankst:sinken,rinken,tinken¦1ogst:rügen,saugen,biegen¦1ahlst:tehlen¦1orst:heren,kiesen,wören¦1iehst:leihen¦1ochst:riechen¦1atest:bitten,reten¦1andest:winden,tehen,finden,binden¦1ollst:uellen,wellen¦1ommst:limmen¦1iest:peien,weisen¦1ammst:wimmen¦1ienst:heinen¦1ießt:lassen¦1ingst:fangen,gehen¦1achtest:denken¦1otest:bieten¦1angst:wingen,singen,lingen¦1arbst:werben,terben¦1ichst:weichen,leichen¦1uschst:waschen¦1iegst:teigen¦1achst:techen,rechen¦1ahst:sehen¦1ittest:neiden,reiten¦1iffst:leifen,feifen,neifen¦1iedest:heiden¦1offst:saufen¦1ast:lesen¦1iefst:laufen,rufen¦1udest:laden¦1ieltest:halten¦1altest:gelten¦1abst:geben¦1ielst:fallen¦urdest:erden¦uchst:achsen¦afst:effen¦arfst:erfen¦olzst:elzen¦ietest:aten¦ahmst:ehmen¦amst:ommen¦alfst:elfen¦annst:innen¦oßt:ießen¦uhrst:ahren¦iebst:eiben¦ißt:eißen",
        "rev": "ingen:angst¦iegen:agst¦elken:olkst¦affen:ufst¦ergen:argst¦eiden:iedest¦ieden:ottest¦ehen:andst,ahst¦eihen:iehst¦assen:ießest¦esen:ast¦erben:arbst¦1en:stest,ftest,btest,gtest,itest,ztest¦1ennen:ranntest,kanntest,nanntest¦1oßen:tießt¦1iehen:zogst¦1echten:fochtest,lochtest¦1eschen:roschst¦1eben:wobst¦1eißen:hießt¦1ben:attest¦1un:tatst¦2eiten:glittest¦2n:tetest,detest,netest¦2ieben:chobst¦2eben:nhobst,shobst,rhobst¦2en:intest,hrtest,hltest,ihtest,lltest,örtest¦2ssen:reßtest,pißtest,laßtest¦2eien:hriest¦2egen:ewogst¦3n:teltest,keltest,seltest,dertest,uertest,tertest,peltest,beltest,pertest,gertest,feltest,heltest,hertest,geltest,deltest,meltest,fertest,zeltest,kertest,ßeltest,bertest,sertest,mertest,nertest,lertest,vertest,ßertest,neltest¦3en:schtest,ichtest,enntest,echtest,eeltest,önntest,maßtest¦4n:eiertest,owertest¦4en:kochtest,machtest,pieltest,zieltest,lachtest,tieltest,panntest,wachtest,manntest,quertest,fachtest¦4afen:schliefst¦5en:krachtest,chwertest",
        "ex": "schwammst brust:brustschwimmen¦schwammst delfin:delfinschwimmen¦schwammst delphin:delphinschwimmen¦fuhrst:rad fahren¦fuhrst rad:radfahren¦aßt:essen¦warst:sein¦7test:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,verzeihen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,einlochen,verbannen,recyceln¦3angst:abdingen,abringen¦2aßt:abessen,fressen¦6test:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,freveln,panzern,schielen,schwelen¦4ittest:abgleiten,ausleiden,mitleiden¦8test:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9test:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßtest:anpassen,stressen¦5ßtest:anpressen,aufpassen,erpressen,verpassen,vermissen¦3aßt:aufessen,ausessen,mitessen¦4agst:aufliegen,beiliegen¦11ieltest:aufrechterhalte¦5oschst:ausdreschen,verdreschen¦5ittest:ausgleiten,entgleiten¦4olkst:ausmelken¦6ßtest:auspressen,einpressen,verprassen¦10test:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5angst:auswringen¦5test:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3ogst:belügen,erwägen,abwiegen¦5agst:bloßliegen,festliegen,naheliegen¦3agst:daliegen¦6ogst:durchlügen¦8ßtest:durchpressen,beeinflussen,bezuschussen¦6angst:durchringen¦7ochst:durchstechen¦6obst:durchweben¦4obst:einweben,aufheben,wegheben,entheben¦11test:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rtest:entkommerzialisie¦3ittest:erleiden¦5ufst:erschaffen¦13test:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießt:gutheißen,verheißen¦12test:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6ufst:herschaffen,hinschaffen¦6agst:herumliegen¦10ufst:hierherschaffen¦9ufst:hinaufschaffen,zurückschaffen¦13ammst:hinterherschwimme¦5orst:nachgären¦7ufst:nachschaffen¦8ittest:niedergleiten¦15test:parallelschalten,weiterentwickel,weiterverbreiten¦8agst:richtigliegen¦7agst:schiefliegen,zurückliegen¦4argst:verbergen¦4iedest:vermeiden¦4aßt:vollessen¦4ogst:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14test:wiedervereinige,zurückbegleiten¦4ottest:zersieden¦16test:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6ttest:achthaben,freihaben,gernhaben¦3test:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦8andst:alleinstehen,hintanstehen¦1ukst:backen¦4test:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,kochen,lachen,lochen,machen,pochen,spaßen,wachen,zielen¦1andest:binden,finden,winden¦1argst:bergen¦1arstest:bersten¦1atest:bitten¦3ahlst:befehlen¦1ogst:biegen,lügen,saugen,wiegen,ziehen¦1otest:bieten¦2iest:blasen,preisen¦3ßtest:blassen,pressen¦2achtest:bringen¦6onntest:dafürkönnen¦1angst:dingen,ringen,singen¦1urftest:dürfen¦2angst:dringen,wringen¦2oschst:dreschen¦1mailtest:e-mailen¦1ielst:fallen¦1ingst:fangen,gehen¦2ßtest:fassen,hassen,passen,missen,pissen¦2ogst:fliegen¦2orst:frieren¦1abst:geben¦1altest:gelten¦3arst:gebären¦3iehst:gedeihen¦2ittest:gleiten¦1orst:gären¦2ubst:graben¦2iffst:greifen¦2ttest:haben¦1ieltest:halten¦1ießt:heißen,lassen¦6ießest:gehenlassen¦1obst:heben,weben¦1onntest:können¦1udest:laden¦1iefst:laufen,rufen¦1agst:liegen¦1ast:lesen¦1iehst:leihen¦1ittest:leiden,reiten¦1olkst:melken¦1aßt:messen,sitzen¦1iedest:meiden¦1ochtest:mögen,fechten¦3ast:genesen¦1ochst:riechen¦3ufst:schaffen¦5ahst:geschehen¦4orst:schwären,verlieren¦1ahst:sehen¦1ottest:sieden¦1offst:saufen¦2obst:stieben¦1ankst:sinken¦2ugst:tragen¦2offst:triefen¦1hettoisiertest:gettoisieren¦1uschst:waschen¦1ichst:weichen¦1iest:weisen¦1arbst:werben¦1ußtest:wissen¦2test:ölen,üben¦5ieltst:hochhalten¦7ießest:hängenlassen¦6andst:kopfstehen¦7ßtest:veranlassen¦4atst:verbitten¦4arbst:verderben¦5ibst:vergraben¦4atest:vertuen¦5andtest:übersenden¦6onnst:überspinnen¦3obst:abheben,beheben¦17ertest:herauskristallisi,hinauskomplimenti¦5obst:hochheben¦5ogst:nachwiegen,überwiegen¦1anntest:kennen,nennen,rennen¦4iefst:schlafen¦1atst:tun¦18test:institutionalisiere"
      },
      "third": {
        "fwd": "annte:ennen¦ieß:oßen¦og:iehen¦at:un¦1te:ln,rn,re¦1ob:hieben,heben¦1og:wiegen,wegen¦1ief:lafen¦1ßte:issen,ussen¦1erte:i¦2te:elen,aßen¦3te:achen,annen,weren,ueren",
        "both": "5te:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4te:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßte:rblassen,inpassen¦4uf:ischaffen¦3te:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2te:ezen,oren,rsen,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahl:pfehlen¦2aß:eressen,fressen¦2ang:rringen,dringen,pringen¦2osch:rlöschen¦2ag:rliegen,hliegen,nliegen¦2ßte:fassen¦2ieg:hweigen¦2ies:preisen,blasen¦2og:nlügen,fliegen¦2or:frieren¦2achte:bringen¦2ug:tragen,hlagen¦2ich:treichen¦2iff:greifen¦2ub:graben¦1aß:gessen,hessen,sitzen,messen¦1oh:liehen¦1ßte:ässen¦1te:ven,äen,xen,pen,ken,uen¦1ank:sinken,rinken,tinken¦1og:rügen,saugen,biegen¦1ahl:tehlen¦1or:heren,kiesen,wören¦1ieh:leihen¦1och:riechen¦1at:bitten,reten¦1and:winden,tehen,finden,binden¦1oll:uellen,wellen¦1omm:limmen¦1ie:peien,reien¦1amm:wimmen¦1ien:heinen¦1ieß:lassen¦1ing:fangen,gehen¦1achte:denken¦1ot:bieten¦1ang:wingen,singen,lingen¦1arb:werben,terben¦1ies:weisen¦1ich:weichen,leichen¦1usch:waschen¦1ieg:teigen¦1ach:techen,rechen¦1ah:sehen¦1itt:neiden,reiten¦1iff:leifen,feifen,neifen¦1ied:heiden¦1off:saufen¦1as:lesen¦1ief:laufen,rufen¦1ud:laden¦1ielt:halten¦1ab:geben¦1iel:fallen¦urde:erden¦ann:innen¦uchs:achsen¦ocht:echten¦af:effen¦arf:erfen¦olz:elzen¦iet:aten¦ahm:ehmen¦am:ommen¦alf:elfen¦alt:elten¦oß:ießen¦uhr:ahren¦ieb:eiben¦iß:eißen",
        "rev": "ingen:ang¦iegen:ag¦elken:olk¦affen:uf¦ergen:arg¦eiden:ied¦eihen:ieh¦ieden:ott¦ben:tte¦esen:as¦ehen:ah¦erben:arb¦1en:ste,fte,bte,gte,ite,zte¦1ennen:rannte,kannte,nannte¦1n:ete¦1oßen:tieß¦1iehen:zog¦1eschen:rosch¦1eben:wob¦1eißen:hieß¦2n:elte¦2eiten:glitt¦2ieben:chob¦2eben:nhob,shob,rhob¦2en:inte,hrte,hlte,ihte,llte,örte¦2ssen:reßte,pißte,laßte¦2egen:ewog¦3n:terte,derte,uerte,nerte,perte,gerte,herte,merte,ferte,berte,kerte,serte,lerte,verte,ßerte¦3en:schte,ichte,ielte,ennte,echte,eelte,önnte,maßte¦4n:eierte,owerte¦4en:lachte,fachte,pannte,machte,wachte,mannte,querte,hwerte¦4afen:schlief¦5en:krachte",
        "ex": "schwamm brust:brustschwimmen¦schwamm delfin:delfinschwimmen¦schwamm delphin:delphinschwimmen¦fuhr:rad fahren¦fuhr rad:radfahren¦aß:essen¦war:sein¦7te:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen¦3ang:abdingen,abringen¦2aß:abessen,fressen¦6te:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,panzern,schwelen¦4itt:abgleiten,ausleiden,mitleiden¦8te:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9te:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßte:anpassen,stressen¦5ßte:anpressen,aufpassen,erpressen,verpassen,vermissen¦3aß:aufessen,ausessen,mitessen¦4ag:aufliegen,beiliegen¦11ielt:aufrechterhalte¦5osch:ausdreschen,verdreschen¦5itt:ausgleiten,entgleiten¦4olk:ausmelken¦6ßte:auspressen,einpressen,verprassen¦10te:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ang:auswringen¦5te:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3og:belügen,erwägen,abwiegen¦5ag:bloßliegen,festliegen,naheliegen¦3ag:daliegen¦6og:durchlügen¦8ßte:durchpressen,beeinflussen,bezuschussen¦6ang:durchringen¦7och:durchstechen¦6ob:durchweben¦4ob:einweben,aufheben,wegheben,entheben¦11te:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rte:entkommerzialisie¦3itt:erleiden¦5uf:erschaffen¦13te:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ieß:gutheißen,verheißen¦12te:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6uf:herschaffen,hinschaffen¦6ag:herumliegen¦10uf:hierherschaffen¦9uf:hinaufschaffen,zurückschaffen¦13amm:hinterherschwimme¦5or:nachgären¦7uf:nachschaffen¦8itt:niedergleiten¦15te:parallelschalten,weiterentwickel,weiterverbreiten¦8ag:richtigliegen¦7ag:schiefliegen,zurückliegen¦4arg:verbergen¦4ied:vermeiden¦4ieh:verzeihen¦4aß:vollessen¦4og:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14te:wiedervereinige,zurückbegleiten¦4ott:zersieden¦16te:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6tte:achthaben,freihaben,gernhaben¦3te:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1uk:backen¦4te:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,lachen,machen,spaßen,wachen¦1and:binden,finden,winden¦1arg:bergen¦1arst:bersten¦1at:bitten,tun¦3ahl:befehlen¦1og:biegen,lügen,saugen,wiegen,ziehen¦1ot:bieten¦2ies:blasen,preisen¦3ßte:blassen,pressen¦2achte:bringen¦6onnte:dafürkönnen¦1ang:dingen,ringen,singen¦1urfte:dürfen¦2ang:dringen,wringen¦2osch:dreschen¦1mailte:e-mailen¦1iel:fallen¦1ing:fangen,gehen¦2ßte:fassen,hassen,passen,missen,pissen¦2og:fliegen¦2or:frieren¦1ab:geben¦3ar:gebären¦3ieh:gedeihen¦2itt:gleiten¦1or:gären¦2ub:graben¦2iff:greifen¦2tte:haben¦1ielt:halten¦1ieß:heißen,lassen¦1ob:heben,weben¦1onnte:können¦1ud:laden¦1ief:laufen,rufen¦1ag:liegen¦1as:lesen¦1ieh:leihen¦1itt:leiden,reiten¦1olk:melken¦1aß:messen,sitzen¦1ied:meiden¦1ochte:mögen¦3as:genesen¦1och:riechen¦3uf:schaffen¦5ah:geschehen¦4or:schwären,verlieren¦1ah:sehen¦1ott:sieden¦1off:saufen¦2ob:stieben¦1ank:sinken¦2ug:tragen¦2off:triefen¦1hettoisierte:gettoisieren¦1usch:waschen¦1ich:weichen¦1ies:weisen¦1arb:werben¦1ußte:wissen¦2te:ölen,üben¦7ßte:veranlassen¦4arb:verderben¦5ib:vergraben¦4at:vertuen,guttun¦5andte:übersenden¦6onn:überspinnen¦3ob:abheben,beheben¦17erte:herauskristallisi,hinauskomplimenti¦5ob:hochheben¦5og:nachwiegen,überwiegen¦1annte:kennen,nennen,rennen¦4ief:schlafen¦5at:großtun¦18te:institutionalisiere¦7at:schwertun"
      },
      "firstPlural": {
        "fwd": "annten:ennen¦ießen:oßen¦ogen:iehen¦ochten:echten¦aten:un¦1ten:ln,rn,re¦1oben:hieben,heben¦1ogen:wiegen,wegen¦1iefen:lafen¦1ßten:issen,ussen¦1erten:i¦2ten:elen,aßen,rsen¦3ten:achen,ochen,annen,weren,ueren",
        "both": "5ten:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4ten:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßten:rblassen,inpassen¦4ufen:ischaffen¦3ten:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2ten:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahlen:pfehlen¦2aßen:eressen,fressen¦2angen:rringen,dringen,pringen¦2oschen:rlöschen¦2agen:rliegen,hliegen,nliegen¦2ßten:fassen¦2iegen:hweigen¦2iesen:preisen,blasen¦2ogen:nlügen,fliegen¦2oren:frieren¦2achten:bringen¦2ugen:tragen,hlagen¦2ichen:treichen¦2iffen:greifen¦2uben:graben¦1aßen:gessen,hessen,sitzen,messen¦1ohen:liehen¦1ßten:ässen¦1ten:ven,äen,xen,pen,ken,uen¦1anken:sinken,rinken,tinken¦1ogen:rügen,saugen,biegen¦1ahlen:tehlen¦1oren:heren,kiesen,wören¦1iehen:leihen¦1ochen:riechen¦1aten:bitten,reten¦1anden:winden,tehen,finden,binden¦1ollen:uellen,wellen¦1ommen:limmen¦1ien:peien,reien¦1ammen:wimmen¦1ienen:heinen¦1ießen:lassen¦1ingen:fangen,gehen¦1achten:denken¦1oten:bieten¦1angen:wingen,singen,lingen¦1arben:werben,terben¦1iesen:weisen¦1ichen:weichen,leichen¦1uschen:waschen¦1iegen:teigen¦1achen:techen,rechen¦1ahen:sehen¦1itten:neiden,reiten¦1iffen:leifen,feifen,neifen¦1ieden:heiden¦1offen:saufen¦1asen:lesen¦1iefen:laufen,rufen¦1uden:laden¦1ielten:halten¦1alten:gelten¦1aben:geben¦1ielen:fallen¦urden:erden¦uchsen:achsen¦afen:effen¦arfen:erfen¦olzen:elzen¦ieten:aten¦ahmen:ehmen¦amen:ommen¦alfen:elfen¦annen:innen¦ossen:ießen¦uhren:ahren¦ieben:eiben¦issen:eißen",
        "rev": "ingen:angen¦iegen:agen¦elken:olken¦affen:ufen¦ergen:argen¦eiden:ieden¦eihen:iehen¦ieden:otten¦esen:asen¦ehen:ahen¦erben:arben¦1en:sten,ften,bten,gten,iten,zten¦1ennen:rannten,kannten,nannten¦1oßen:tießen¦1iehen:zogen¦1echten:fochten,lochten¦1eschen:roschen¦1eben:woben¦1eißen:hießen¦1ben:atten¦2eiten:glitten¦2n:teten,deten,neten¦2ieben:choben¦2eben:nhoben,shoben,rhoben¦2en:inten,hrten,hlten,ihten,llten,örten¦2ssen:reßten,pißten,laßten¦2egen:ewogen¦3n:telten,kelten,selten,derten,uerten,terten,pelten,belten,perten,gerten,felten,helten,herten,gelten,delten,melten,ferten,zelten,kerten,ßelten,berten,serten,merten,nerten,lerten,verten,ßerten,nelten¦3en:schten,ichten,ennten,echten,eelten,önnten,maßten¦4n:eierten,owerten¦4en:kochten,machten,pielten,zielten,lachten,tielten,pannten,wachten,mannten,querten,fachten¦4afen:schliefen¦5en:krachten,chwerten",
        "ex": "schwammen brust:brustschwimmen¦schwammen delfin:delfinschwimmen¦schwammen delphin:delphinschwimmen¦fuhren:rad fahren¦fuhren rad:radfahren¦aßen:essen¦waren:sein¦7ten:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,einlochen,verbannen,recyceln¦3angen:abdingen,abringen¦2aßen:abessen,fressen¦6ten:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,freveln,panzern,schielen,schwelen¦4itten:abgleiten,ausleiden,mitleiden¦8ten:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9ten:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßten:anpassen,stressen¦5ßten:anpressen,aufpassen,erpressen,verpassen,vermissen¦3aßen:aufessen,ausessen,mitessen¦4agen:aufliegen,beiliegen¦11ielten:aufrechterhalte¦5oschen:ausdreschen,verdreschen¦5itten:ausgleiten,entgleiten¦4olken:ausmelken¦6ßten:auspressen,einpressen,verprassen¦10ten:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5angen:auswringen¦5ten:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3ogen:belügen,erwägen,abwiegen¦5agen:bloßliegen,festliegen,naheliegen¦3agen:daliegen¦6ogen:durchlügen¦8ßten:durchpressen,beeinflussen,bezuschussen¦6angen:durchringen¦7ochen:durchstechen¦6oben:durchweben¦4oben:einweben,aufheben,wegheben,entheben¦11ten:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rten:entkommerzialisie¦3itten:erleiden¦5ufen:erschaffen¦13ten:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießen:gutheißen,verheißen¦12ten:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6ufen:herschaffen,hinschaffen¦6agen:herumliegen¦10ufen:hierherschaffen¦9ufen:hinaufschaffen,zurückschaffen¦13ammen:hinterherschwimme¦5oren:nachgären¦7ufen:nachschaffen¦8itten:niedergleiten¦15ten:parallelschalten,weiterentwickel,weiterverbreiten¦8agen:richtigliegen¦7agen:schiefliegen,zurückliegen¦4argen:verbergen¦4ieden:vermeiden¦4iehen:verzeihen¦4aßen:vollessen¦4ogen:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14ten:wiedervereinige,zurückbegleiten¦4otten:zersieden¦16ten:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6tten:achthaben,freihaben,gernhaben¦3ten:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1uken:backen¦4ten:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,kochen,lachen,lochen,machen,pochen,spaßen,wachen,zielen¦1anden:binden,finden,winden¦1argen:bergen¦1arsten:bersten¦1aten:bitten,tun¦3ahlen:befehlen¦1ogen:biegen,lügen,saugen,wiegen,ziehen¦1oten:bieten¦2iesen:blasen,preisen¦3ßten:blassen,pressen¦2achten:bringen¦6onnten:dafürkönnen¦1angen:dingen,ringen,singen¦1urften:dürfen¦2angen:dringen,wringen¦2oschen:dreschen¦1mailten:e-mailen¦1ielen:fallen¦1ingen:fangen,gehen¦2ßten:fassen,hassen,passen,missen,pissen¦2ogen:fliegen¦2oren:frieren¦1aben:geben¦1alten:gelten¦3aren:gebären¦3iehen:gedeihen¦2itten:gleiten¦1oren:gären¦2uben:graben¦2iffen:greifen¦2tten:haben¦1ielten:halten¦1ießen:heißen,lassen¦1oben:heben,weben¦1onnten:können¦1uden:laden¦1iefen:laufen,rufen¦1agen:liegen¦1asen:lesen¦1iehen:leihen¦1itten:leiden,reiten¦1olken:melken¦1aßen:messen,sitzen¦1ieden:meiden¦1ochten:mögen,fechten¦3asen:genesen¦1ochen:riechen¦3ufen:schaffen¦5ahen:geschehen¦4oren:schwären,verlieren¦1ahen:sehen¦1otten:sieden¦1offen:saufen¦2oben:stieben¦1anken:sinken¦2ugen:tragen¦2offen:triefen¦1hettoisierten:gettoisieren¦1uschen:waschen¦1ichen:weichen¦1iesen:weisen¦1arben:werben¦1ußten:wissen¦2ten:ölen,üben¦7ßten:veranlassen¦4arben:verderben¦5iben:vergraben¦4aten:vertuen,guttun¦5andten:übersenden¦6onnen:überspinnen¦3oben:abheben,beheben¦17erten:herauskristallisi,hinauskomplimenti¦5oben:hochheben¦5ogen:nachwiegen,überwiegen¦1annten:kennen,nennen,rennen¦4iefen:schlafen¦5aten:großtun¦18ten:institutionalisiere¦7aten:schwertun"
      },
      "secondPlural": {
        "fwd": "anntet:ennen¦ießt:oßen¦ogt:iehen¦ochtet:echten¦atet:un¦1tet:ln,rn,re¦1obt:hieben,heben¦1ogt:wiegen,wegen¦1ieft:lafen¦1ßtet:issen,ussen¦1ertet:i¦2tet:elen,aßen,rsen¦3tet:achen,ochen,annen,weren,ueren",
        "both": "5tet:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4tet:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßtet:rblassen,inpassen¦4uft:ischaffen¦3tet:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2tet:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahlt:pfehlen¦2aßt:eressen,fressen¦2angt:rringen,dringen,pringen¦2oscht:rlöschen¦2agt:rliegen,hliegen,nliegen¦2ßtet:fassen¦2iegt:hweigen¦2iest:preisen,blasen¦2ogt:nlügen,fliegen¦2ort:frieren¦2achtet:bringen¦2ugt:tragen,hlagen¦2icht:treichen¦2ifft:greifen¦2ubt:graben¦1aßt:gessen,hessen,sitzen,messen¦1oht:liehen¦1ßtet:ässen¦1tet:ven,äen,xen,pen,ken,uen¦1ankt:sinken,rinken,tinken¦1ogt:rügen,saugen,biegen¦1ahlt:tehlen¦1ort:heren,kiesen,wören¦1ieht:leihen¦1ocht:riechen¦1atet:bitten,reten¦1andet:winden,tehen,finden,binden¦1ollt:uellen,wellen¦1ommt:limmen¦1iet:peien,reien¦1ammt:wimmen¦1ient:heinen¦1ießt:lassen¦1ingt:fangen,gehen¦1achtet:denken¦1otet:bieten¦1angt:wingen,singen,lingen¦1arbt:werben,terben¦1iest:weisen¦1icht:weichen,leichen¦1uscht:waschen¦1iegt:teigen¦1acht:techen,rechen¦1aht:sehen¦1ittet:neiden,reiten¦1ifft:leifen,feifen,neifen¦1iedet:heiden¦1offt:saufen¦1ast:lesen¦1ieft:laufen,rufen¦1udet:laden¦1ieltet:halten¦1altet:gelten¦1abt:geben¦1ielt:fallen¦urdet:erden¦uchst:achsen¦aft:effen¦arft:erfen¦olzt:elzen¦ietet:aten¦ahmt:ehmen¦amt:ommen¦alft:elfen¦annt:innen¦oßt:ießen¦uhrt:ahren¦iebt:eiben¦ißt:eißen",
        "rev": "ingen:angt¦iegen:agt¦elken:olkt¦affen:uft¦ergen:argt¦eiden:iedet¦ieden:ottet¦eihen:ieht¦esen:ast¦ehen:aht¦erben:arbt¦1en:stet,ftet,btet,gtet,itet,ztet¦1ennen:ranntet,kanntet,nanntet¦1oßen:tießt¦1iehen:zogt¦1echten:fochtet,lochtet¦1eschen:roscht¦1eben:wobt¦1eißen:hießt¦1ben:attet¦2eiten:glittet¦2n:tetet,detet,netet¦2ieben:chobt¦2eben:nhobt,shobt,rhobt¦2en:intet,hrtet,hltet,ihtet,lltet,örtet¦2ssen:reßtet,pißtet,laßtet¦2egen:ewogt¦3n:teltet,keltet,seltet,dertet,uertet,tertet,peltet,beltet,pertet,gertet,feltet,heltet,hertet,geltet,deltet,meltet,fertet,zeltet,kertet,ßeltet,bertet,sertet,mertet,nertet,lertet,vertet,ßertet,neltet¦3en:schtet,ichtet,enntet,echtet,eeltet,önntet,maßtet¦4n:eiertet,owertet¦4en:kochtet,machtet,pieltet,zieltet,lachtet,tieltet,panntet,wachtet,manntet,quertet,fachtet¦4afen:schlieft¦5en:krachtet,chwertet",
        "ex": "schwammt brust:brustschwimmen¦schwammt delfin:delfinschwimmen¦schwammt delphin:delphinschwimmen¦fuhrt:rad fahren¦fuhrt rad:radfahren¦aßt:essen¦wart:sein¦7tet:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,verzeihen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,einlochen,verbannen,recyceln¦3angt:abdingen,abringen¦2aßt:abessen,fressen¦6tet:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,freveln,panzern,schielen,schwelen¦4ittet:abgleiten,ausleiden,mitleiden¦8tet:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9tet:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßtet:anpassen,stressen¦5ßtet:anpressen,aufpassen,erpressen,verpassen,vermissen¦3aßt:aufessen,ausessen,mitessen¦4agt:aufliegen,beiliegen¦11ieltet:aufrechterhalte¦5oscht:ausdreschen,verdreschen¦5ittet:ausgleiten,entgleiten¦4olkt:ausmelken¦6ßtet:auspressen,einpressen,verprassen¦10tet:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5angt:auswringen¦5tet:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3ogt:belügen,erwägen,abwiegen¦5agt:bloßliegen,festliegen,naheliegen¦3agt:daliegen¦6ogt:durchlügen¦8ßtet:durchpressen,beeinflussen,bezuschussen¦6angt:durchringen¦7ocht:durchstechen¦6obt:durchweben¦4obt:einweben,aufheben,wegheben,entheben¦11tet:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rtet:entkommerzialisie¦3ittet:erleiden¦5uft:erschaffen¦13tet:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießt:gutheißen,verheißen¦12tet:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6uft:herschaffen,hinschaffen¦6agt:herumliegen¦10uft:hierherschaffen¦9uft:hinaufschaffen,zurückschaffen¦13ammt:hinterherschwimme¦5ort:nachgären¦7uft:nachschaffen¦8ittet:niedergleiten¦15tet:parallelschalten,weiterentwickel,weiterverbreiten¦8agt:richtigliegen¦7agt:schiefliegen,zurückliegen¦4argt:verbergen¦4iedet:vermeiden¦4aßt:vollessen¦4ogt:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14tet:wiedervereinige,zurückbegleiten¦4ottet:zersieden¦16tet:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6ttet:achthaben,freihaben,gernhaben¦3tet:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1ukt:backen¦4tet:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,kochen,lachen,lochen,machen,pochen,spaßen,wachen,zielen¦1andet:binden,finden,winden¦1argt:bergen¦1arstet:bersten¦1atet:bitten,tun¦3ahlt:befehlen¦1ogt:biegen,lügen,saugen,wiegen,ziehen¦1otet:bieten¦2iest:blasen,preisen¦3ßtet:blassen,pressen¦2achtet:bringen¦6onntet:dafürkönnen¦1angt:dingen,ringen,singen¦1urftet:dürfen¦2angt:dringen,wringen¦2oscht:dreschen¦1mailtet:e-mailen¦1ielt:fallen¦1ingt:fangen,gehen¦2ßtet:fassen,hassen,passen,missen,pissen¦2ogt:fliegen¦2ort:frieren¦1abt:geben¦1altet:gelten¦3art:gebären¦3ieht:gedeihen¦2ittet:gleiten¦1ort:gären¦2ubt:graben¦2ifft:greifen¦2ttet:haben¦1ieltet:halten¦1ießt:heißen,lassen¦1obt:heben,weben¦1onntet:können¦1udet:laden¦1ieft:laufen,rufen¦1agt:liegen¦1ast:lesen¦1ieht:leihen¦1ittet:leiden,reiten¦1olkt:melken¦1aßt:messen,sitzen¦1iedet:meiden¦1ochtet:mögen,fechten¦3ast:genesen¦1ocht:riechen¦3uft:schaffen¦5aht:geschehen¦4ort:schwären,verlieren¦1aht:sehen¦1ottet:sieden¦1offt:saufen¦2obt:stieben¦1ankt:sinken¦2ugt:tragen¦2offt:triefen¦1hettoisiertet:gettoisieren¦1uscht:waschen¦1icht:weichen¦1iest:weisen¦1arbt:werben¦1ußtet:wissen¦2tet:ölen,üben¦7ßtet:veranlassen¦4arbt:verderben¦5ibt:vergraben¦4atet:vertuen,guttun¦5andtet:übersenden¦6onnt:überspinnen¦3obt:abheben,beheben¦17ertet:herauskristallisi,hinauskomplimenti¦5obt:hochheben¦5ogt:nachwiegen,überwiegen¦1anntet:kennen,nennen,rennen¦4ieft:schlafen¦5atet:großtun¦18tet:institutionalisiere¦7atet:schwertun"
      },
      "thirdPlural": {
        "fwd": "annten:ennen¦ießen:oßen¦ogen:iehen¦ochten:echten¦aten:un¦1ten:ln,rn,re¦1oben:hieben,heben¦1ogen:wiegen,wegen¦1iefen:lafen¦1ßten:issen,ussen¦1erten:i¦2ten:elen,aßen,rsen¦3ten:achen,ochen,annen,weren,ueren",
        "both": "5ten:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4ten:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßten:rblassen,inpassen¦4ufen:ischaffen¦3ten:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2ten:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahlen:pfehlen¦2aßen:eressen,fressen¦2angen:rringen,dringen,pringen¦2oschen:rlöschen¦2agen:rliegen,hliegen,nliegen¦2ßten:fassen¦2iegen:hweigen¦2iesen:preisen,blasen¦2ogen:nlügen,fliegen¦2oren:frieren¦2achten:bringen¦2ugen:tragen,hlagen¦2ichen:treichen¦2iffen:greifen¦2uben:graben¦1aßen:gessen,hessen,sitzen,messen¦1ohen:liehen¦1ßten:ässen¦1ten:ven,äen,xen,pen,ken,uen¦1anken:sinken,rinken,tinken¦1ogen:rügen,saugen,biegen¦1ahlen:tehlen¦1oren:heren,kiesen,wören¦1iehen:leihen¦1ochen:riechen¦1aten:bitten,reten¦1anden:winden,tehen,finden,binden¦1ollen:uellen,wellen¦1ommen:limmen¦1ien:peien,reien¦1ammen:wimmen¦1ienen:heinen¦1ießen:lassen¦1ingen:fangen,gehen¦1achten:denken¦1oten:bieten¦1angen:wingen,singen,lingen¦1arben:werben,terben¦1iesen:weisen¦1ichen:weichen,leichen¦1uschen:waschen¦1iegen:teigen¦1achen:techen,rechen¦1ahen:sehen¦1itten:neiden,reiten¦1iffen:leifen,feifen,neifen¦1ieden:heiden¦1offen:saufen¦1asen:lesen¦1iefen:laufen,rufen¦1uden:laden¦1ielten:halten¦1alten:gelten¦1aben:geben¦1ielen:fallen¦urden:erden¦uchsen:achsen¦afen:effen¦arfen:erfen¦olzen:elzen¦ieten:aten¦ahmen:ehmen¦amen:ommen¦alfen:elfen¦annen:innen¦ossen:ießen¦uhren:ahren¦ieben:eiben¦issen:eißen",
        "rev": "ingen:angen¦iegen:agen¦elken:olken¦affen:ufen¦ergen:argen¦eiden:ieden¦eihen:iehen¦ieden:otten¦esen:asen¦ehen:ahen¦erben:arben¦1en:sten,ften,bten,gten,iten,zten¦1ennen:rannten,kannten,nannten¦1oßen:tießen¦1iehen:zogen¦1echten:fochten,lochten¦1eschen:roschen¦1eben:woben¦1eißen:hießen¦1ben:atten¦2eiten:glitten¦2n:teten,deten,neten¦2ieben:choben¦2eben:nhoben,shoben,rhoben¦2en:inten,hrten,hlten,ihten,llten,örten¦2ssen:reßten,pißten,laßten¦2egen:ewogen¦3n:telten,kelten,selten,derten,uerten,terten,pelten,belten,perten,gerten,felten,helten,herten,gelten,delten,melten,ferten,zelten,kerten,ßelten,berten,serten,merten,nerten,lerten,verten,ßerten,nelten¦3en:schten,ichten,ennten,echten,eelten,önnten,maßten¦4n:eierten,owerten¦4en:kochten,machten,pielten,zielten,lachten,tielten,pannten,wachten,mannten,querten,fachten¦4afen:schliefen¦5en:krachten,chwerten",
        "ex": "schwammen brust:brustschwimmen¦schwammen delfin:delfinschwimmen¦schwammen delphin:delphinschwimmen¦fuhren:rad fahren¦fuhren rad:radfahren¦aßen:essen¦waren:sein¦7ten:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,einlochen,verbannen,recyceln¦3angen:abdingen,abringen¦2aßen:abessen,fressen¦6ten:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,freveln,panzern,schielen,schwelen¦4itten:abgleiten,ausleiden,mitleiden¦8ten:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9ten:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßten:anpassen,stressen¦5ßten:anpressen,aufpassen,erpressen,verpassen,vermissen¦3aßen:aufessen,ausessen,mitessen¦4agen:aufliegen,beiliegen¦11ielten:aufrechterhalte¦5oschen:ausdreschen,verdreschen¦5itten:ausgleiten,entgleiten¦4olken:ausmelken¦6ßten:auspressen,einpressen,verprassen¦10ten:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5angen:auswringen¦5ten:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3ogen:belügen,erwägen,abwiegen¦5agen:bloßliegen,festliegen,naheliegen¦3agen:daliegen¦6ogen:durchlügen¦8ßten:durchpressen,beeinflussen,bezuschussen¦6angen:durchringen¦7ochen:durchstechen¦6oben:durchweben¦4oben:einweben,aufheben,wegheben,entheben¦11ten:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rten:entkommerzialisie¦3itten:erleiden¦5ufen:erschaffen¦13ten:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießen:gutheißen,verheißen¦12ten:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6ufen:herschaffen,hinschaffen¦6agen:herumliegen¦10ufen:hierherschaffen¦9ufen:hinaufschaffen,zurückschaffen¦13ammen:hinterherschwimme¦5oren:nachgären¦7ufen:nachschaffen¦8itten:niedergleiten¦15ten:parallelschalten,weiterentwickel,weiterverbreiten¦8agen:richtigliegen¦7agen:schiefliegen,zurückliegen¦4argen:verbergen¦4ieden:vermeiden¦4iehen:verzeihen¦4aßen:vollessen¦4ogen:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14ten:wiedervereinige,zurückbegleiten¦4otten:zersieden¦16ten:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6tten:achthaben,freihaben,gernhaben¦3ten:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1uken:backen¦4ten:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,kochen,lachen,lochen,machen,pochen,spaßen,wachen,zielen¦1anden:binden,finden,winden¦1argen:bergen¦1arsten:bersten¦1aten:bitten,tun¦3ahlen:befehlen¦1ogen:biegen,lügen,saugen,wiegen,ziehen¦1oten:bieten¦2iesen:blasen,preisen¦3ßten:blassen,pressen¦2achten:bringen¦6onnten:dafürkönnen¦1angen:dingen,ringen,singen¦1urften:dürfen¦2angen:dringen,wringen¦2oschen:dreschen¦1mailten:e-mailen¦1ielen:fallen¦1ingen:fangen,gehen¦2ßten:fassen,hassen,passen,missen,pissen¦2ogen:fliegen¦2oren:frieren¦1aben:geben¦1alten:gelten¦3aren:gebären¦3iehen:gedeihen¦2itten:gleiten¦1oren:gären¦2uben:graben¦2iffen:greifen¦2tten:haben¦1ielten:halten¦1ießen:heißen,lassen¦1oben:heben,weben¦1onnten:können¦1uden:laden¦1iefen:laufen,rufen¦1agen:liegen¦1asen:lesen¦1iehen:leihen¦1itten:leiden,reiten¦1olken:melken¦1aßen:messen,sitzen¦1ieden:meiden¦1ochten:mögen,fechten¦3asen:genesen¦1ochen:riechen¦3ufen:schaffen¦5ahen:geschehen¦4oren:schwären,verlieren¦1ahen:sehen¦1otten:sieden¦1offen:saufen¦2oben:stieben¦1anken:sinken¦2ugen:tragen¦2offen:triefen¦1hettoisierten:gettoisieren¦1uschen:waschen¦1ichen:weichen¦1iesen:weisen¦1arben:werben¦1ußten:wissen¦2ten:ölen,üben¦7ßten:veranlassen¦4arben:verderben¦5iben:vergraben¦4aten:vertuen,guttun¦5andten:übersenden¦6onnen:überspinnen¦3oben:abheben,beheben¦17erten:herauskristallisi,hinauskomplimenti¦5oben:hochheben¦5ogen:nachwiegen,überwiegen¦1annten:kennen,nennen,rennen¦4iefen:schlafen¦5aten:großtun¦18ten:institutionalisiere¦7aten:schwertun"
      }
    },
    "presentTense": {
      "first": {
        "fwd": "1:e¦le:eln¦1e:rn,un¦1ere:i",
        "both": ":n",
        "rev": "önnen:ann¦1eln:tle,kle,dle,ble,sle,ple,gle,fle,zle,mle,ßle,nle¦2eln:chle¦3n:tere,bere,nere,gere,fere,dere,mere,sere,kere,pere,lere,vere,ßere¦4n:euere,auere,äuere,owere,ähere¦5n:feiere,ichere,leiere,uchere,achere,öchere",
        "ex": "4:sollen¦15:aufrechterhalte,wiedervereinige¦17:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦19:institutionalisiere¦schwimme brust:brustschwimmen¦schwimme delfin:delfinschwimmen¦schwimme delphin:delphinschwimmen¦fahre:rad fahren¦fahre rad:radfahren¦bin:sein¦schäme:fremdschämen¦17re:entkommerzialisie¦13le:weiterentwickel¦6ann:dafürkönnen¦1arf:dürfen¦1maile:e-mailen¦1ann:können¦1ag:mögen¦1uß:müssen¦1hettoisiere:gettoisieren¦1ill:wollen¦1eiß:wissen¦7e:recyceln,stochern¦11e:abzwitschern¦9e:einäschern,plätschern,zwitschern¦17ere:herauskristallisi,hinauskomplimenti¦6e:bechern,fächern,panzern,reihern,wiehern,äschern,großtun¦4e:eiern¦5e:feiern,leiern,guttun¦4le:freveln¦2e:tun¦8e:schwertun"
      },
      "second": {
        "fwd": "immst:ehmen¦iffst:effen¦ächst:achsen¦st:e¦irst:erden¦1st:len,ln,rn,äen,un¦1ßt:ässen,ussen¦1erst:i¦2st:mmen,eren,emen,eien,anen,oren¦2t:usen,psen,ksen,isen,ißen,msen,nsen,aßen,lsen,ößen,rsen¦3st:ichen,ächen,iehen,iffen,ähren,äufen¦3t:iesen,ilzen",
        "both": "5ägst:mschlagen,kschlagen,lschlagen,rschlagen,hschlagen,tschlagen,sschlagen¦5st:üchten,falten,iraten,rchten,talten,palten,achten,uchten,ichten¦4st:raden,ürden,mschen,ahten,nschen,orden,neten,haden,pschen,peten,naufen,iechen,wahren,rschen,ieten,chnen,tschen,kaufen,lschen,ischen,uschen,beten¦4ßt:rblassen,inpassen¦4ägst:entragen,intragen¦4t:glasen¦3st:nchen,kten,ähmen,ähnen,lehen,üden,lchen,äten,pten,mden,ühnen,uffen,äffen,ühmen,fnen,offen,ärfen,ahmen,öten,bnen,rafen,nien,üten,knen,oden,oten,tmen,ürfen,rchen,öden,wehen,eden,ehnen,uchen,ohren,gehen,ohnen,sten,tufen,tehen,gnen,affen,iden,ahnen,rufen,dnen,uten,ochen,ehren,nten,rten,ften,öhnen,ühren,rehen,achen,nden,tten,lden,iten¦3ägst:htragen,itragen,ttragen,rtragen¦3ällst:infallen,enfallen¦3t:älzen,olzen,alzen,rasen¦2t:ezen,äzen,osen,fzen,hzen,uzen,nzen,ösen,rzen,eßen,üßen,tzen,izen¦2st:ämen,öhen,omen,onen,efen,üfen,inen,amen,ihen,uhen,ähen,rnen,imen,ohen,unen,önen,ömen,aren,üren,rren,umen,ühen,ären,ören,ifen,rmen,lmen,enen,pfen,nnen¦2iehlst:pfehlen¦2ißt:eressen,fressen¦2ischst:rlöschen¦2äßt:rlassen,tlassen,hlassen,slassen¦2ällst:tfallen,hfallen,rfallen,efallen,sfallen,ffallen,mfallen¦2ßt:fassen,pissen¦2irbst:sterben¦2äbst:graben¦2äst:blasen¦1ißt:gessen,hessen,messen¦1st:ven,pen,uen,ken,ben,gen¦1iehlst:tehlen¦1äfst:lafen¦1illst:uellen,wellen¦1t:xen¦1irbst:werben¦1äschst:waschen¦1ittst:reten¦1ichst:techen,rechen¦1iehst:sehen¦1äufst:saufen,laufen¦1iest:lesen¦1ädst:laden¦1ibst:geben¦1ängst:fangen¦1ältst:halten¦ichtst:echten¦irfst:erfen¦ößt:oßen¦ilzt:elzen¦ätst:aten¦ilfst:elfen¦iltst:elten¦ährst:ahren",
        "rev": "allen:ällst¦assen:äßt,ässt¦elken:ilkst¦ergen:irgst¦essen:isst¦erben:irbst¦1ehmen:nimmst¦1en:ht¦1agen:lägst¦1effen:riffst¦1achsen:wächst¦1erden:wirst¦2n:elst,test,dest¦2en:ilst,olst,alst,älst,ulst,ülst,säst,ölst,rlst¦2ecken:hrickst¦2agen:trägst¦2ssen:reßt,näßt,laßt¦2eschen:drischst¦2ben:hast¦3en:eißt,ellst,asst,ämmst,ierst,ipst,ühlst,allst,ollst,ammst,ahlst,ählst,ielst,üllst,ohlst,maßt,emmst,ahrst,ummst,ommst,öhlst,eerst,echst,lößt,ullst,neist,esst,uemst,aufst,lanst,eelst,uhlst,apst,ümmst,morst,iemst¦3n:derst,uerst,terst,perst,berst,gerst,ferst,herst,merst,serst,kerst,lerst,nerst,ßerst,verst¦4en:eichst,öschst,tillst,weist,ziehst,hiffst,wimmst,timmst,leist,kiest,ranst,währst,rillst,liehst,limmst,aschst,rimmst,eschst,hwerst,querst,lichst,rinst,urkst¦4n:owerst¦5en:bremst,preist,ereist,hleust,kreist,treist,rreist,nreist¦5n:feierst,leierst",
        "ex": "schwimmst brust:brustschwimmen¦schwimmst delfin:delfinschwimmen¦schwimmst delphin:delphinschwimmen¦fährst:rad fahren¦fährst rad:radfahren¦isst:essen¦bist:sein¦7t:abblassen,abpressen,kreischen,abbrausen,abspeisen,aufhalsen,aushülsen,ausreisen,entfilzen,zerzausen,entlausen,vermiesen,verwaisen,verzinsen¦2ißt:abessen¦3ällst:abfallen,anfallen,zufallen¦6t:abfassen,abküssen,abpassen,anfassen,vergasen,becircen,rutschen,schubsen,verwesen,abreisen,absausen,enteisen,loseisen,glucksen,klecksen,knacksen,knicksen,plumpsen,schmusen,tricksen¦3äßt:ablassen,anlassen,belassen,dalassen,zulassen¦7st:ablöschen,aufbahren,ausbaden,erhaschen,erkalten,erkälten,gebärden,knechten,schalten,recyclen,veralten,abscheren,ausspeien,bescheren,eincremen,verfehlen,schwächen,verjähren¦8t:abrutschen,zerpressen,anknacksen,aufbrausen,beklecksen,einheimsen,heimreisen,losbrausen,nachreisen,verspeisen,verkorksen¦9st:abschalten,anschalten,begrabschen,durchzechen,umschalten,vorpreschen,beinhalten,downloaden,mähdreschen,verbeamten,überraschen,abschwächen,aufschreien,ausschreien,fortscheren,kahlscheren,verschreien,prophezeien¦6ägst:abschlagen,anschlagen,heimtragen,zuschlagen,beschlagen¦6ickst:abschrecken,erschrecken¦4ägst:abtragen,antragen,betragen,zutragen,schlagen¦4ßt:anpassen,stressen¦5ßt:anpressen,aufpassen,erpressen,verpassen¦3ißt:aufessen,ausessen,mitessen¦4äßt:auflassen,einlassen,hinlassen,weglassen¦11ältst:aufrechterhalte¦7ägst:aufschlagen,davontragen,einschlagen,hinschlagen¦7ickst:aufschrecken¦5ägst:auftragen,austragen,wegtragen¦5ischst:ausdreschen,verdreschen¦8st:auslöschen,vernaschen,verwalten,gefährden,retweeten,verarzten,verblüffen,vergeuden,anschreien,ausscheren,beschreien,einscheren,wegscheren,zerscheren,schwertun,überhäufen¦4ilkst:ausmelken¦6ßt:auspressen,einpressen,verprassen¦9t:ausrutschen,freipressen,verrutschen,austricksen,durchpausen,durchreisen,durchsausen¦10st:ausschalten,einschalten,verschalten¦8ässt:bleibenlassen,blickenlassen¦8ßt:durchpressen,beeinflussen,bezuschussen¦11t:durchrutschen,durchplumpsen,einherbrausen¦17rst:entkommerzialisie¦11ägst:entzweischlagen¦5ässt:freilassen¦13st:gleichschalten,zurückschalten,vervollkommnen¦8ickst:hochschrecken¦4ällst:mißfallen,wegfallen¦6äßt:offenlassen¦15st:parallelschalten,weiterentwickel¦6st:umtaufen,achthaben,begrünen,freihaben,hechten,preschen,gernhaben,wappnen,anspeien,befreien,ernähren,erpichen,panzern,schreien,schwanen,schwelen,großtun¦4irgst:verbergen¦7ilzst:verschmelzen¦4ißt:vollessen¦7äßt:vorbeilassen,zurücklassen¦10äßt:zufriedenlassen¦7ällst:zurückfallen¦10ickst:zurückschrecken¦8ägst:zurücktragen¦9äßt:zusammenlassen¦12t:zusammenpassen¦13t:zusammenpressen¦12st:zusammenraufen,hinausschreien,niederschreien¦12ägst:zusammenschlagen¦12ickst:zusammenschrecken¦5st:achten,bejahen,blechen,falten,haschen,löschen,naschen,texten,walten,widmen,zelten,ächten,chillen,feiern,leiern,scheren,träufen,guttun¦3st:ahmen,ahnen,ehren,gehen,rufen,wehen,äffen,öden,feien¦7ässt:alleinlassen,fallenlassen,hängenlassen¦4st:baden,bahren,beten,erden,golfen,kaufen,raufen,spuren,taufen,tränen,wahren,waten,zechen,cremen,eichen,eiern,fehlen,häufen,kiffen,killen,nähren,rillen,rächen,währen,ziehen¦1irgst:bergen¦1irst:bersten,werden¦3iehlst:befehlen¦2äst:blasen¦3ßt:blassen,pressen¦5t:browsen,genesen,bremsen,fliesen,grausen,heimsen,krausen,kreisen,mucksen,piepsen,preisen,rülpsen,speisen¦6annst:dafürkönnen¦1arfst:dürfen¦2ischst:dreschen¦3t:düsen,fußen,gasen,pesen,rasen,eisen,maßen¦1mailst:e-mailen¦1ällst:fallen¦1ängst:fangen¦2ßt:fassen,hassen,missen,passen,pissen,nässen¦2isst:fressen¦4t:fräsen,glasen,küssen,lotsen,sülzen,bimsen,bumsen,filzen,halsen,hopsen,hülsen,koksen,lausen,mopsen,morsen,niesen,parsen,pausen,reisen,sausen,spaßen,weisen,zausen¦1ibst:geben¦2äbst:graben¦2st:haben,säen,tun,ölen¦1ältst:halten¦6ässt:gehenlassen¦1annst:können¦1ädst:laden¦1äßt:lassen¦1äufst:laufen,saufen¦1iest:lesen¦1ilkst:melken¦1isst:messen¦1agst:mögen¦1ußt:müssen¦5iehst:geschehen¦4ickst:schrecken¦1iehst:sehen¦2irbst:sterben¦2ägst:tragen¦1hettoisierst:gettoisieren¦1äschst:waschen¦1illst:wollen¦1irbst:werben¦1eißt:wissen¦11st:inlineskaten¦7ßt:veranlassen¦4irbst:verderben¦16st:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦10t:durchbrausen,niedersausen¦17erst:herauskristallisi,hinauskomplimenti¦14st:wiedervereinige¦1immst:nehmen¦1ächst:wachsen¦18st:institutionalisiere"
      },
      "third": {
        "fwd": "ilt:elten¦immt:ehmen¦ifft:effen¦icht:echten¦t:e¦1t:len,ln,rn,äen,un¦1ßt:ässen,ussen¦1ert:i¦2t:mmen,eren,ißen,aßen,ößen,rsen¦3t:ichen,iehen,iffen,iesen,ähren,ilzen,äufen¦3st:peien",
        "both": "5ägt:mschlagen,kschlagen,lschlagen,rschlagen,hschlagen,tschlagen,sschlagen¦5t:üchten,falten,iraten,rchten,talten,palten,achten,uchten,ichten¦4t:raden,ürden,mschen,ahten,nschen,orden,glasen,neten,haden,pschen,peten,naufen,iechen,wahren,rschen,ieten,chnen,tschen,kaufen,lschen,ischen,uschen,beten¦4ßt:rblassen,inpassen¦4ägt:entragen,intragen¦3t:nchen,kten,ähmen,ähnen,lehen,üden,lchen,äten,pten,mden,ühnen,uffen,äffen,ühmen,älzen,fnen,offen,ärfen,ahmen,öten,bnen,rafen,nien,üten,knen,oden,olzen,oten,tmen,alzen,ürfen,rchen,öden,wehen,eden,ehnen,uchen,ohren,gehen,ohnen,sten,tufen,tehen,gnen,ächen,affen,iden,ahnen,rufen,dnen,uten,ochen,ehren,nten,rten,ften,rasen,öhnen,ühren,rehen,achen,nden,tten,lden,iten¦3ägt:htragen,itragen,ttragen,rtragen¦3ällt:infallen,enfallen¦2t:ezen,oren,ämen,öhen,omen,äzen,onen,efen,anen,üfen,osen,fzen,hzen,lsen,eien,inen,amen,ihen,uhen,ähen,rnen,imen,uzen,nsen,ohen,msen,emen,unen,önen,nzen,ömen,aren,üren,rren,umen,isen,ühen,ksen,ösen,rzen,psen,ären,ören,ifen,rmen,eßen,lmen,enen,pfen,üßen,nnen,usen,tzen,izen¦2iehlt:pfehlen¦2ißt:eressen,fressen¦2ischt:rlöschen¦2äßt:rlassen,tlassen,hlassen,slassen¦2ällt:tfallen,hfallen,rfallen,efallen,sfallen,ffallen,mfallen¦2ßt:fassen,pissen¦2irbt:sterben¦2äbt:graben¦2äst:blasen¦1ißt:gessen,hessen,messen¦1t:ven,xen,pen,uen,ken,ben,gen¦1iehlt:tehlen¦1äft:lafen¦1illt:uellen,wellen¦1irbt:werben¦1äscht:waschen¦1itt:reten¦1icht:techen,rechen¦1ieht:sehen¦1äuft:saufen,laufen¦1iest:lesen¦1ädt:laden¦1ibt:geben¦1ängt:fangen¦1ält:halten¦ird:erden¦ächst:achsen¦irft:erfen¦ößt:oßen¦ilzt:elzen¦ät:aten¦ilft:elfen¦ährt:ahren",
        "rev": "allen:ällt¦assen:äßt,ässt¦elken:ilkt¦ergen:irgt¦önnen:ann¦essen:isst¦erben:irbt¦1elten:gilt,hilt¦1ehmen:nimmt¦1n:et¦1agen:lägt¦1ecken:rickt¦1effen:rifft¦1echten:ficht¦1ben:at¦1en:nt¦2n:elt¦2en:olt,alt,ult,ült,sät,ölt,ast,rlt¦2agen:trägt¦2ssen:reßt,näßt,laßt¦2eschen:drischt¦2echten:flicht¦3en:eißt,ellt,asst,ämmt,eilt,üllt,allt,ommt,iert,ammt,ahlt,ählt,ielt,ollt,emmt,ahrt,ummt,ühlt,eert,echt,lößt,ullt,esst,auft,ohlt,eelt,uhlt,öhlt,ümmt,maßt,uält¦3n:dert,bert,nert,tert,gert,uert,hert,mert,fert,kert,sert,pert,lert,vert,ßert¦4en:eicht,öscht,chält,timmt,zieht,wimmt,limmt,hifft,währt,rillt,lieht,ascht,rimmt,escht,hwert,quert,kiest,tillt¦4n:owert¦5n:feiert,leiert¦5en:tlicht,rlicht,hlicht",
        "ex": "4:sollen¦schwimmt brust:brustschwimmen¦schwimmt delfin:delfinschwimmen¦schwimmt delphin:delphinschwimmen¦fährt:rad fahren¦fährt rad:radfahren¦isst:essen¦ist:sein¦7t:abblassen,ablöschen,abpressen,aufbahren,ausbaden,erhaschen,erkalten,erkälten,gebärden,knechten,schalten,recyclen,veralten,abscheren,bescheren,entfilzen,verfehlen,ehelichen,verjähren,vermiesen¦2ißt:abessen¦3ällt:abfallen,anfallen,zufallen¦6t:abfassen,abküssen,abpassen,anfassen,umtaufen,vergasen,achthaben,becircen,begrünen,freihaben,hechten,preschen,gernhaben,schubsen,wappnen,verwesen,ernähren,erpichen,panzern,schwelen,großtun¦3äßt:ablassen,anlassen,belassen,dalassen,zulassen¦9t:abschalten,anschalten,begrabschen,durchzechen,freipressen,umschalten,vorpreschen,beinhalten,downloaden,mähdreschen,verbeamten,überraschen,fortscheren,kahlscheren,ermöglichen¦6ägt:abschlagen,anschlagen,heimtragen,zuschlagen,beschlagen¦6ickt:abschrecken,erschrecken¦4ägt:abtragen,antragen,betragen,zutragen,schlagen¦4ßt:anpassen,stressen¦5ßt:anpressen,aufpassen,erpressen,verpassen¦3ißt:aufessen,ausessen,mitessen¦4äßt:auflassen,einlassen,hinlassen,weglassen¦11ält:aufrechterhalte¦7ägt:aufschlagen,davontragen,einschlagen,hinschlagen¦7ickt:aufschrecken¦5ägt:auftragen,austragen,wegtragen¦5ischt:ausdreschen,verdreschen¦8t:auslöschen,vernaschen,verwalten,zerpressen,gefährden,retweeten,verarzten,verblüffen,vergeuden,ausscheren,einscheren,wegscheren,zerscheren,schwertun,überhäufen¦4ilkt:ausmelken¦6ßt:auspressen,einpressen,verprassen¦10t:ausschalten,einschalten,verschalten¦8ässt:bleibenlassen,blickenlassen¦8ßt:durchpressen,beeinflussen,bezuschussen¦17rt:entkommerzialisie¦11ägt:entzweischlagen¦5ässt:freilassen¦13t:gleichschalten,zurückschalten,zusammenpressen,vervollkommnen¦8ickt:hochschrecken¦4ällt:mißfallen,wegfallen¦6äßt:offenlassen¦15t:parallelschalten,weiterentwickel¦4irgt:verbergen¦4ißt:vollessen¦7äßt:vorbeilassen,zurücklassen¦10äßt:zufriedenlassen¦7ällt:zurückfallen¦10ickt:zurückschrecken¦8ägt:zurücktragen¦9äßt:zusammenlassen¦12t:zusammenpassen,zusammenraufen¦12ägt:zusammenschlagen¦12ickt:zusammenschrecken¦5t:achten,bejahen,blechen,browsen,falten,haschen,löschen,genesen,naschen,texten,walten,widmen,zelten,ächten,chillen,feiern,fliesen,leiern,scheren,träufen,guttun¦3t:ahmen,ahnen,düsen,ehren,fußen,gasen,gehen,pesen,rasen,rufen,wehen,äffen,öden,eilen,maßen¦7ässt:alleinlassen,fallenlassen,hängenlassen¦4t:baden,bahren,beten,erden,fräsen,glasen,golfen,kaufen,küssen,lotsen,raufen,spuren,sülzen,taufen,tränen,wahren,waten,zechen,eichen,eiern,fehlen,filzen,häufen,kiffen,killen,morsen,niesen,nähren,parsen,rillen,spaßen,währen,ziehen¦1irgt:bergen¦1irst:bersten¦3iehlt:befehlen¦2äst:blasen¦3ßt:blassen,pressen¦6ann:dafürkönnen¦1arf:dürfen¦2ischt:dreschen¦1mailt:e-mailen¦1ällt:fallen¦1ängt:fangen¦2ßt:fassen,hassen,missen,passen,pissen,nässen¦2isst:fressen¦1ibt:geben¦2äbt:graben¦2t:haben,säen,tun,ölen¦1ält:halten¦6ässt:gehenlassen¦1ann:können¦1ädt:laden¦1äßt:lassen¦1äuft:laufen,saufen¦1iest:lesen¦1ilkt:melken¦1isst:messen¦1ag:mögen¦1uß:müssen¦5ieht:geschehen¦4ickt:schrecken¦1ieht:sehen¦2irbt:sterben¦2ägt:tragen¦1hettoisiert:gettoisieren¦1äscht:waschen¦1ill:wollen¦1irbt:werben¦1eiß:wissen¦11t:inlineskaten,verheimlichen,verniedlichen,verwirklichen¦7ßt:veranlassen¦4irbt:verderben¦5äd:überladen¦6st:anspeien¦16t:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦7st:ausspeien¦17ert:herauskristallisi,hinauskomplimenti¦14t:wiedervereinige,veranschaulichen¦1icht:fechten¦2icht:flechten¦1ilt:gelten¦1immt:nehmen¦18t:institutionalisiere"
      },
      "firstPlural": {
        "fwd": ":¦1n:e¦1eren:i",
        "both": "",
        "rev": ":",
        "ex": "schwimmen brust:brustschwimmen¦schwimmen delfin:delfinschwimmen¦schwimmen delphin:delphinschwimmen¦fahren:rad fahren¦fahren rad:radfahren¦17ren:entkommerzialisie¦15n:weiterentwickel,aufrechterhalte,wiedervereinige¦1ind:sein¦1mailen:e-mailen¦1hettoisieren:gettoisieren¦5n:vertuen¦17n:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦17eren:herauskristallisi,hinauskomplimenti¦19n:institutionalisiere"
      },
      "secondPlural": {
        "fwd": "t:en,e¦1t:ln,rn,un¦1ßt:issen,ussen¦1ert:i",
        "both": "4ßt:rblassen,inpassen¦4t:chnen¦3ßt:rfassen,eressen,rlassen,tlassen,hlassen,slassen,fressen¦3t:fnen,bnen,nien,knen,tmen,gnen,dnen¦2ßt:gessen,hessen,messen¦2t:den,ten¦1ßt:ässen",
        "rev": "1en:gt,zt,mt,st,ht,ft,kt,bt,ut,nt,pt,xt,it,ät,vt¦1ssen:aßt¦2en:ißt,üßt,hrt,ilt,llt,olt,ärt,hlt,alt,ält,rrt,ürt,art,ult,oßt,ört,ült,ößt,ölt,rlt,ort¦2n:elt,net¦2ssen:reßt,pißt¦3n:tert,dert,uert,nert,pert,fert,gert,hert,bert,sert,kert,mert,lert,vert,ßert¦3en:ießt,iert,ielt,eert,eelt,maßt¦4n:owert¦4en:hwert,quert¦5n:feiert,leiert",
        "ex": "schwimmt brust:brustschwimmen¦schwimmt delfin:delfinschwimmen¦schwimmt delphin:delphinschwimmen¦fahrt:rad fahren¦fahrt rad:radfahren¦3ßt:abessen,blassen,pressen¦4ßt:ablassen,anlassen,anpassen,aufessen,ausessen,befassen,belassen,dalassen,mitessen,zufassen,zulassen,stressen,umfassen¦5ßt:anpressen,auffassen,auflassen,aufpassen,einfassen,einlassen,erpressen,hinlassen,verpassen,vollessen,weglassen,vermissen¦15t:aufrechterhalte,weiterentwickel¦6ßt:auspressen,einpressen,nachfassen,verprassen¦8ßt:durchpressen,vorbeilassen,zurücklassen,beeinflussen,bezuschussen¦17rt:entkommerzialisie¦7ßt:offenlassen,veranlassen¦11ßt:zufriedenlassen¦10ßt:zusammenfassen,zusammenlassen¦3d:sein¦1mailt:e-mailen¦4äuft:eislaufen¦2ßt:fassen,hassen,lassen,müssen,passen,missen,pissen,wissen¦1hettoisiert:gettoisieren¦6t:wappnen,becircen,panzern,schwelen,großtun¦5t:widmen,feiern,leiern,scheren,guttun¦7t:recyclen,abscheren,bescheren¦13t:vervollkommnen¦16t:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦8t:ausscheren,einscheren,wegscheren,zerscheren,schwertun¦9t:fortscheren,kahlscheren¦17ert:herauskristallisi,hinauskomplimenti¦14t:wiedervereinige¦4t:eiern,spaßen,spuren¦3t:fußen,maßen¦2t:tun,ölen¦18t:institutionalisiere"
      },
      "thirdPlural": {
        "fwd": ":¦1n:e¦1eren:i",
        "both": "",
        "rev": ":",
        "ex": "schwimmen brust:brustschwimmen¦schwimmen delfin:delfinschwimmen¦schwimmen delphin:delphinschwimmen¦fahren:rad fahren¦fahren rad:radfahren¦17ren:entkommerzialisie¦15n:weiterentwickel,aufrechterhalte,wiedervereinige¦8len:altertümeln¦1ind:sein¦1mailen:e-mailen¦1hettoisieren:gettoisieren¦5n:vertuen¦17n:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦17eren:herauskristallisi,hinauskomplimenti¦19n:institutionalisiere"
      }
    },
    "subjunctive1": {
      "first": {
        "fwd": "1:e¦le:eln¦1e:rn,un¦1ere:i",
        "both": ":n",
        "rev": "1eln:tle,kle,dle,ble,sle,ple,gle,fle,zle,mle,ßle,nle¦2eln:chle¦3n:tere,bere,nere,gere,fere,dere,mere,sere,kere,pere,lere,vere,ßere¦4n:euere,auere,äuere,owere,ähere¦5n:feiere,ichere,leiere,uchere,achere,öchere",
        "ex": "15:aufrechterhalte,wiedervereinige¦17:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦19:institutionalisiere¦schwimme brust:brustschwimmen¦schwimme delfin:delfinschwimmen¦schwimme delphin:delphinschwimmen¦fahre:rad fahren¦fahre rad:radfahren¦17re:entkommerzialisie¦13le:weiterentwickel¦1maile:e-mailen¦1hettoisiere:gettoisieren¦7e:recyceln,stochern¦11e:abzwitschern¦9e:einäschern,plätschern,zwitschern¦17ere:herauskristallisi,hinauskomplimenti¦6e:bechern,fächern,panzern,reihern,wiehern,äschern,großtun¦4e:eiern¦5e:feiern,leiern,guttun¦4le:freveln¦2e:tun¦8e:schwertun"
      },
      "second": {
        "fwd": "1st:e¦1erest:i¦1est:un",
        "both": "st:n",
        "rev": "1eln:glest",
        "ex": "schwimmest brust:brustschwimmen¦schwimmest delfin:delfinschwimmen¦schwimmest delphin:delphinschwimmen¦fahrest:rad fahren¦fahrest rad:radfahren¦17rest:entkommerzialisie¦15st:weiterentwickel,aufrechterhalte,wiedervereinige¦8lest:altertümeln,lustwandeln,glattbügeln¦10lest:bloßstrampeln¦3lest:bügeln¦1mailest:e-mailen¦4lest:googeln¦1hettoisierest:gettoisieren¦17st:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦17erest:herauskristallisi,hinauskomplimenti¦2est:tun¦6est:großtun¦5est:guttun¦19st:institutionalisiere¦8est:schwertun"
      },
      "third": {
        "fwd": "1:e¦le:eln¦1e:rn,un¦1ere:i",
        "both": ":n",
        "rev": "1eln:tle,kle,dle,ble,sle,ple,gle,fle,zle,mle,ßle,nle¦2eln:chle¦3n:tere,bere,nere,gere,fere,dere,mere,sere,kere,pere,lere,vere,ßere¦4n:euere,auere,äuere,owere,ähere¦5n:feiere,ichere,leiere,uchere,achere,öchere",
        "ex": "15:aufrechterhalte,wiedervereinige¦17:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦19:institutionalisiere¦schwimme brust:brustschwimmen¦schwimme delfin:delfinschwimmen¦schwimme delphin:delphinschwimmen¦fahre:rad fahren¦fahre rad:radfahren¦17re:entkommerzialisie¦13le:weiterentwickel¦1maile:e-mailen¦1hettoisiere:gettoisieren¦7e:recyceln,stochern¦11e:abzwitschern¦9e:einäschern,plätschern,zwitschern¦17ere:herauskristallisi,hinauskomplimenti¦6e:bechern,fächern,panzern,reihern,wiehern,äschern,großtun¦4e:eiern¦5e:feiern,leiern,guttun¦4le:freveln¦2e:tun¦8e:schwertun"
      },
      "firstPlural": {
        "fwd": ":¦1n:e¦1eren:i",
        "both": "2en:tun",
        "rev": "2:ln,rn¦3:ten,zen,men,len,den,sen,hen,ßen,ben,gen,ren,fen,pen,nen,ken,ien,xen,äen,ven¦4:auen,euen,äuen",
        "ex": "3:tun¦8:becircen¦schwimmen brust:brustschwimmen¦schwimmen delfin:delfinschwimmen¦schwimmen delphin:delphinschwimmen¦fahren:rad fahren¦fahren rad:radfahren¦17ren:entkommerzialisie¦15n:weiterentwickel,aufrechterhalte,wiedervereinige¦3en:sein¦1mailen:e-mailen¦1hettoisieren:gettoisieren¦5n:vertuen¦17n:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦17eren:herauskristallisi,hinauskomplimenti¦19n:institutionalisiere"
      },
      "secondPlural": {
        "fwd": "1t:e¦1eret:i¦1et:un",
        "both": "t:n",
        "rev": "1eln:glet",
        "ex": "schwimmet brust:brustschwimmen¦schwimmet delfin:delfinschwimmen¦schwimmet delphin:delphinschwimmen¦fahret:rad fahren¦fahret rad:radfahren¦17ret:entkommerzialisie¦15t:weiterentwickel,aufrechterhalte,wiedervereinige¦8let:altertümeln,lustwandeln,glattbügeln¦3et:sein¦10let:bloßstrampeln¦3let:bügeln¦1mailet:e-mailen¦4let:googeln¦1hettoisieret:gettoisieren¦17t:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦17eret:herauskristallisi,hinauskomplimenti¦2et:tun¦6et:großtun¦5et:guttun¦19t:institutionalisiere¦8et:schwertun"
      },
      "thirdPlural": {
        "fwd": ":¦1n:e¦1eren:i",
        "both": "2en:tun",
        "rev": "2:ln,rn¦3:ten,zen,men,len,den,sen,hen,ßen,ben,gen,ren,fen,pen,nen,ken,ien,xen,äen,ven¦4:auen,euen,äuen",
        "ex": "3:tun¦8:becircen¦schwimmen brust:brustschwimmen¦schwimmen delfin:delfinschwimmen¦schwimmen delphin:delphinschwimmen¦fahren:rad fahren¦fahren rad:radfahren¦17ren:entkommerzialisie¦15n:weiterentwickel,aufrechterhalte,wiedervereinige¦3en:sein¦1mailen:e-mailen¦1hettoisieren:gettoisieren¦5n:vertuen¦17n:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦17eren:herauskristallisi,hinauskomplimenti¦19n:institutionalisiere"
      }
    },
    "subjunctive2": {
      "first": {
        "fwd": "ieße:oßen¦öge:iehen¦äte:un¦1te:ln,rn,äen,re¦1öbe:hieben,heben¦1öge:wiegen,wegen¦1iefe:lafen¦1ßte:issen,ussen¦1erte:i¦2te:üßen,älen,elen,aßen,ölen,rsen¦3te:ächen,annen,weren,ueren",
        "both": "4:wören¦5te:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦5ände:verstehen¦4te:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,seifen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßte:rblassen,inpassen¦4ände:gestehen¦4üfe:ischaffen¦3te:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2te:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,msen,ühen,lgen¦2ähle:pfehlen¦2äße:eressen,fressen¦2änge:rringen,dringen,pringen¦2äge:rliegen,hliegen,nliegen¦2ßte:fassen¦2iege:hweigen¦2iese:preisen,blasen¦2öge:nlügen,fliegen¦2öre:frieren¦2ächte:bringen¦2üge:tragen,hlagen¦2iche:treichen¦2iffe:greifen¦2übe:graben¦1äße:gessen,hessen,sitzen,messen¦1öhe:liehen¦1ßte:ässen¦1te:ven,xen,pen,ken,uen¦1änke:sinken,rinken,tinken¦1öge:rügen,saugen,biegen¦1ähle:tehlen¦1annte:nennen,kennen,rennen¦1öre:heren,kiesen¦1ölte:helten¦1iehe:leihen¦1öche:riechen¦1äte:bitten,reten¦1ände:winden,finden,binden¦1ölle:uellen,wellen¦1ömme:limmen¦1iee:peien,reien¦1ämme:wimmen¦1iene:heinen¦1ieße:lassen¦1inge:fangen,gehen¦1ächte:denken¦1öte:bieten¦1änge:wingen,singen,lingen¦1ärbe:werben,terben¦1iese:weisen¦1iche:weichen,leichen¦1üsche:waschen¦1iege:teigen¦1äche:techen,rechen¦1ünde:tehen¦1ähe:sehen¦1itte:neiden,reiten¦1iffe:leifen,feifen,neifen¦1iede:heiden¦1öffe:saufen¦1äse:lesen¦1iefe:laufen,rufen¦1üde:laden¦1ielte:halten¦1älte:gelten¦1äbe:geben¦1iele:fallen¦ürde:erden¦üchse:achsen¦öchte:echten¦äfe:effen¦ärfe:erfen¦ölze:elzen¦iete:aten¦ähme:ehmen¦äme:ommen¦älfe:elfen¦änne:innen¦össe:ießen¦ühre:ahren¦iebe:eiben¦isse:eißen",
        "rev": "ingen:änge¦ecken:äke¦iegen:äge¦elken:ölke¦affen:üfe¦ergen:ärge¦eiden:iede¦eihen:iehe¦ieden:ötte¦aben:ätte¦esen:äse¦ehen:ähe¦innen:önne¦erben:ärbe¦1en:ste,fte,bte,gte,ite,zte¦1oßen:tieße¦1iehen:zöge¦1eschen:rösche¦1eben:wöbe¦1eißen:hieße¦1ehen:tände¦2eiten:glitte¦2n:tete,dete,nete¦2ieben:chöbe¦2eben:nhöbe,shöbe,rhöbe¦2en:inte,säte,hrte,hlte,ihte,llte,örte¦2ssen:reßte,pißte,laßte¦2egen:ewöge¦3n:telte,kelte,selte,derte,uerte,terte,pelte,belte,perte,gerte,felte,helte,herte,delte,melte,berte,zelte,gelte,serte,ferte,merte,ßelte,nerte,kerte,verte,ßerte,lerte,nelte¦3en:schte,ichte,hälte,ennte,uälte,rüßte,echte,büßte,eelte,maßte¦4n:eierte,owerte¦4en:wächte,pielte,zielte,pannte,tielte,mannte,hwerte,querte¦4afen:schliefe",
        "ex": "6:chillen,gebären¦8:erlöschen¦9:verlöschen¦schwömme brust:brustschwimmen¦schwömme delfin:delfinschwimmen¦schwömme delphin:delphinschwimmen¦führe:rad fahren¦führe rad:radfahren¦äße:essen¦wäre:sein¦7te:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3änge:abdingen,abringen¦2äße:abessen,fressen¦6te:abfassen,abküssen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen,versüßen¦4itte:abgleiten,ausleiden,mitleiden¦8te:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9te:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äke:abschrecken,erschrecken¦4ßte:anpassen,stressen¦5ßte:anpressen,aufpassen,erpressen,verpassen,vermissen¦3äße:aufessen,ausessen,mitessen¦4äge:aufliegen,beiliegen¦11ielte:aufrechterhalte¦7äke:aufschrecken¦5ösche:ausdreschen,verdreschen¦5itte:ausgleiten,entgleiten¦4ölke:ausmelken¦6ßte:auspressen,einpressen,verprassen¦10te:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5änge:auswringen¦5te:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3öge:belügen,erwägen,abwiegen¦5äge:bloßliegen,festliegen,naheliegen¦3äge:daliegen¦6öge:durchlügen¦8ßte:durchpressen,beeinflussen,bezuschussen¦6änge:durchringen¦7öche:durchstechen¦6öbe:durchweben¦4öbe:einweben,aufheben,wegheben,entheben¦11te:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rte:entkommerzialisie¦3itte:erleiden¦5üfe:erschaffen¦13te:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ieße:gutheißen,verheißen¦12te:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfe:herschaffen,hinschaffen¦6äge:herumliegen¦10üfe:hierherschaffen¦9üfe:hinaufschaffen,zurückschaffen¦13ämme:hinterherschwimme¦8äke:hochschrecken¦5öre:nachgären¦7üfe:nachschaffen¦8itte:niedergleiten¦15te:parallelschalten,weiterentwickel,weiterverbreiten¦8äge:richtigliegen¦7äge:schiefliegen,zurückliegen¦4ärge:verbergen¦4iede:vermeiden¦4iehe:verzeihen¦4äße:vollessen¦4öge:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14te:wiedervereinige,zurückbegleiten¦4ötte:zersieden¦10äke:zurückschrecken¦12äke:zusammenschrecken¦16te:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦5ätte:achthaben,freihaben,gernhaben¦3te:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,büßen,maßen,nölen,süßen¦1üke:backen¦4te:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,küssen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1ände:binden,finden,winden¦1ärge:bergen¦1ärste:bersten¦1äte:bitten,tun¦3ähle:befehlen¦5osse:beschießen¦1öge:biegen,lügen,saugen,wiegen,ziehen¦1öte:bieten¦2iese:blasen,preisen¦3ßte:blassen,pressen¦2ächte:bringen¦1ächte:denken¦1änge:dingen,ringen,singen¦2änge:dringen,wringen¦2ösche:dreschen¦1mailte:e-mailen¦1iele:fallen¦1inge:fangen,gehen¦2ßte:fassen,hassen,müssen,passen,missen,pissen¦2öge:fliegen¦2öre:frieren¦1äbe:geben¦1älte:gelten¦3achte:gedenken¦3iehe:gedeihen¦2itte:gleiten¦1öre:gären¦2übe:graben¦2iffe:greifen¦1ätte:haben¦1ielte:halten¦1ieße:heißen,lassen¦1öbe:heben,weben¦1üde:laden¦1iefe:laufen,rufen¦1äge:liegen¦1äse:lesen¦1iehe:leihen¦1itte:leiden,reiten¦1ölke:melken¦1äße:messen,sitzen¦1iede:meiden¦2chte:mögen¦1annte:nennen,rennen¦3äse:genesen¦1öche:riechen¦3üfe:schaffen¦5ähe:geschehen¦4äke:schrecken¦4ore:schwären¦1ähe:sehen¦1ötte:sieden¦1öffe:saufen¦4ände:gestehen¦2öbe:stieben¦1änke:sinken¦2üge:tragen¦2öffe:triefen¦1hettoisierte:gettoisieren¦3önne:gewinnen¦1üsche:waschen¦1iche:weichen¦1iese:weisen¦1ärbe:werben¦1üßte:wissen¦2te:ölen,üben,säen¦4öße:umfließen¦7ßte:veranlassen¦4ärbe:verderben¦5ibe:vergraben¦4öre:verlieren¦4äte:vertuen,guttun¦5andte:übersenden¦6önne:überspinnen¦6ände:überstehen¦3öbe:abheben,beheben¦17erte:herauskristallisi,hinauskomplimenti¦5öbe:hochheben¦5öge:nachwiegen,überwiegen¦4iefe:schlafen¦5äte:großtun¦18te:institutionalisiere¦7äte:schwertun"
      },
      "second": {
        "fwd": "ießest:oßen¦ögest:iehen¦ätest:un¦1test:ln,rn,äen,re¦1öbest:hieben,heben¦1ögest:wiegen,wegen¦1iefest:lafen¦1ßtest:issen,ussen¦1ertest:i¦2test:üßen,älen,elen,aßen,ölen,rsen¦3test:ächen,annen,weren,ueren",
        "both": "5test:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦5ändest:verstehen¦4test:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,hnden,vieren,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,seifen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßtest:rblassen,inpassen¦4ändest:gestehen¦4üfest:ischaffen¦4st:wören¦3test:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2test:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,msen,ühen,lgen¦2ählest:pfehlen¦2äßest:eressen,fressen¦2ängest:rringen,dringen,pringen¦2ägest:rliegen,hliegen,nliegen¦2ßtest:fassen¦2iegest:hweigen¦2iesest:preisen,blasen¦2ögest:nlügen,fliegen¦2örest:frieren¦2ächtest:bringen¦2ügest:tragen,hlagen¦2ichest:treichen¦2iffest:greifen¦2übest:graben¦1äßest:gessen,hessen,sitzen,messen¦1öhest:liehen¦1ßtest:ässen¦1test:ven,xen,pen,ken,uen¦1änkest:sinken,rinken,tinken¦1ögest:rügen,saugen,biegen¦1ählest:tehlen¦1anntest:nennen,kennen,rennen¦1örest:heren,kiesen¦1öltest:helten¦1iehest:leihen¦1öchest:riechen¦1ätest:bitten,reten¦1ändest:winden,finden,binden¦1öllest:uellen,wellen¦1ömmest:limmen¦1ieest:peien,reien¦1ämmest:wimmen¦1ienest:heinen¦1ießest:lassen¦1ingest:fangen,gehen¦1ächtest:denken¦1ötest:bieten¦1ängest:wingen,singen,lingen¦1ärbest:werben,terben¦1iesest:weisen¦1ichest:weichen,leichen¦1üschest:waschen¦1iegest:teigen¦1ächest:techen,rechen¦1ündest:tehen¦1ähest:sehen¦1ittest:neiden,reiten¦1iffest:leifen,feifen,neifen¦1iedest:heiden¦1öffest:saufen¦1äsest:lesen¦1iefest:laufen,rufen¦1üdest:laden¦1ieltest:halten¦1ältest:gelten¦1äbest:geben¦1ielest:fallen¦ürdest:erden¦üchsest:achsen¦öchtest:echten¦äfest:effen¦ärfest:erfen¦ölzest:elzen¦ietest:aten¦ähmest:ehmen¦ämest:ommen¦älfest:elfen¦ännest:innen¦össest:ießen¦ührest:ahren¦iebest:eiben¦issest:eißen",
        "rev": "ingen:ängest¦ecken:äkest¦iegen:ägest¦elken:ölkest¦affen:üfest¦ergen:ärgest¦eiden:iedest¦eihen:iehest¦ieden:öttest¦ommen:ämst¦aben:ättest¦ehmen:ähmst¦esen:äsest¦ehen:ähest¦erben:ärbest¦1en:stest,ftest,btest,gtest,itest,ztest¦1oßen:tießest¦1iehen:zögest¦1eschen:röschest¦1eben:wöbest¦1eißen:hießest¦1ehen:tändest¦2eiten:glittest¦2n:tetest,detest,netest¦2ieben:chöbest¦2eben:nhöbest,shöbest,rhöbest¦2en:intest,sätest,hrtest,hltest,ihtest,lltest,örtest¦2ssen:reßtest,pißtest,laßtest¦2egen:ewögest¦3n:teltest,keltest,seltest,dertest,uertest,tertest,peltest,beltest,pertest,gertest,feltest,heltest,hertest,deltest,meltest,bertest,zeltest,geltest,sertest,fertest,mertest,ßeltest,nertest,kertest,vertest,ßertest,lertest,neltest¦3en:schtest,ichtest,hältest,enntest,uältest,rüßtest,echtest,büßtest,eeltest,maßtest¦4n:eiertest,owertest¦4en:wächtest,pieltest,zieltest,panntest,tieltest,manntest,hwertest,quertest¦4afen:schliefest",
        "ex": "schwömmst brust:brustschwimmen¦schwömmst delfin:delfinschwimmen¦schwömmst delphin:delphinschwimmen¦führest:rad fahren¦führest rad:radfahren¦äßest:essen¦wärst:sein¦7test:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3ängest:abdingen,abringen¦2äßest:abessen,fressen¦6test:abfassen,abküssen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen,versüßen¦4ittest:abgleiten,ausleiden,mitleiden¦8test:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9test:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äkest:abschrecken,erschrecken¦4ßtest:anpassen,stressen¦5ßtest:anpressen,aufpassen,erpressen,verpassen,vermissen¦3äßest:aufessen,ausessen,mitessen¦4ägest:aufliegen,beiliegen¦11ieltest:aufrechterhalte¦7äkest:aufschrecken¦5öschest:ausdreschen,verdreschen¦5ittest:ausgleiten,entgleiten¦4ölkest:ausmelken¦6ßtest:auspressen,einpressen,verprassen¦10test:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ängest:auswringen¦5test:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3ögest:belügen,erwägen,abwiegen¦5ägest:bloßliegen,festliegen,naheliegen¦3ägest:daliegen¦6ögest:durchlügen¦8ßtest:durchpressen,beeinflussen,bezuschussen¦6ängest:durchringen¦7öchest:durchstechen¦6öbest:durchweben¦4öbest:einweben,aufheben,wegheben,entheben¦11test:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rtest:entkommerzialisie¦3ittest:erleiden¦8st:erlöschen¦5üfest:erschaffen¦13test:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießest:gutheißen,verheißen¦12test:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfest:herschaffen,hinschaffen¦6ägest:herumliegen¦10üfest:hierherschaffen¦9üfest:hinaufschaffen,zurückschaffen¦13ämmest:hinterherschwimme¦8äkest:hochschrecken¦5örest:nachgären¦7üfest:nachschaffen¦8ittest:niedergleiten¦15test:parallelschalten,weiterentwickel,weiterverbreiten¦8ägest:richtigliegen¦7ägest:schiefliegen,zurückliegen¦4ärgest:verbergen¦9st:verlöschen¦4iedest:vermeiden¦4iehest:verzeihen¦4äßest:vollessen¦4ögest:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14test:wiedervereinige,zurückbegleiten¦4öttest:zersieden¦10äkest:zurückschrecken¦12äkest:zusammenschrecken¦16test:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦9ämst:abhandenkommen¦5ättest:achthaben,freihaben,gernhaben¦3test:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,büßen,maßen,nölen,süßen¦1ükst:backen¦4test:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,küssen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1ändest:binden,finden,winden¦1ärgest:bergen¦1ärstest:bersten¦1ätest:bitten,tun¦3ählest:befehlen¦11öbst:beiseiteschieben¦5ossest:beschießen¦1ögest:biegen,lügen,saugen,wiegen,ziehen¦1ötest:bieten¦2iesest:blasen,preisen¦3ßtest:blassen,pressen¦2ächtest:bringen¦1ächtest:denken¦1ängest:dingen,ringen,singen¦2ängest:dringen,wringen¦2öschest:dreschen¦1mailtest:e-mailen¦1ielest:fallen¦1ingest:fangen,gehen¦2ßtest:fassen,hassen,müssen,passen,missen,pissen¦2ögest:fliegen¦7ämst:freibekommen¦5ähmst:freinehmen¦2örest:frieren¦1äbest:geben¦1ältest:gelten¦6st:gebären¦3achtest:gedenken¦3iehest:gedeihen¦2ittest:gleiten¦1örest:gären¦2übest:graben¦2iffest:greifen¦1ättest:haben¦1ieltest:halten¦1ießest:heißen,lassen¦1öbest:heben,weben¦1üdest:laden¦1iefest:laufen,rufen¦1ägest:liegen¦1äsest:lesen¦1iehest:leihen¦1ittest:leiden,reiten¦1ölkest:melken¦1äßest:messen,sitzen¦1iedest:meiden¦2chtest:mögen¦1anntest:nennen,rennen¦3äsest:genesen¦1öchest:riechen¦3üfest:schaffen¦5ähest:geschehen¦4äkest:schrecken¦4orest:schwären¦1ähest:sehen¦1öttest:sieden¦1öffest:saufen¦4ändest:gestehen¦2öbest:stieben¦1änkest:sinken¦2ügest:tragen¦2öffest:triefen¦1hettoisiertest:gettoisieren¦3önnst:gewinnen¦1üschest:waschen¦1ichest:weichen¦1iesest:weisen¦1ärbest:werben¦1üßtest:wissen¦2test:ölen,üben,säen¦5ähst:sattsehen¦4ößest:umfließen¦7ßtest:veranlassen¦4ärbest:verderben¦5ibest:vergraben¦4örest:verlieren¦4ätest:vertuen,guttun¦8ähmst:vorliebnehmen¦5andtest:übersenden¦6önnest:überspinnen¦6ändest:überstehen¦3öbest:abheben,beheben¦17ertest:herauskristallisi,hinauskomplimenti¦5öbest:hochheben¦5ögest:nachwiegen,überwiegen¦4iefest:schlafen¦5ätest:großtun¦18test:institutionalisiere¦7ätest:schwertun"
      },
      "third": {
        "fwd": "ieße:oßen¦öge:iehen¦äte:un¦1te:ln,rn,äen,re¦1öbe:hieben,heben¦1öge:wiegen,wegen¦1iefe:lafen¦1ßte:issen,ussen¦1erte:i¦2te:üßen,älen,elen,aßen,ölen,rsen¦3te:ächen,annen,weren,ueren",
        "both": "4:wören¦5te:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦5ände:verstehen¦4te:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,seifen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßte:rblassen,inpassen¦4ände:gestehen¦4üfe:ischaffen¦3te:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2te:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,msen,ühen,lgen¦2ähle:pfehlen¦2äße:eressen,fressen¦2änge:rringen,dringen,pringen¦2äge:rliegen,hliegen,nliegen¦2ßte:fassen¦2iege:hweigen¦2iese:preisen,blasen¦2öge:nlügen,fliegen¦2öre:frieren¦2ächte:bringen¦2üge:tragen,hlagen¦2iche:treichen¦2iffe:greifen¦2übe:graben¦1äße:gessen,hessen,sitzen,messen¦1öhe:liehen¦1ßte:ässen¦1te:ven,xen,pen,ken,uen¦1änke:sinken,rinken,tinken¦1öge:rügen,saugen,biegen¦1ähle:tehlen¦1annte:nennen,kennen,rennen¦1öre:heren,kiesen¦1ölte:helten¦1iehe:leihen¦1öche:riechen¦1äte:bitten,reten¦1ände:winden,finden,binden¦1ölle:uellen,wellen¦1ömme:limmen¦1iee:peien,reien¦1ämme:wimmen¦1iene:heinen¦1ieße:lassen¦1inge:fangen,gehen¦1ächte:denken¦1öte:bieten¦1änge:wingen,singen,lingen¦1ärbe:werben,terben¦1iese:weisen¦1iche:weichen,leichen¦1üsche:waschen¦1iege:teigen¦1äche:techen,rechen¦1ünde:tehen¦1ähe:sehen¦1itte:neiden,reiten¦1iffe:leifen,feifen,neifen¦1iede:heiden¦1öffe:saufen¦1äse:lesen¦1iefe:laufen,rufen¦1üde:laden¦1ielte:halten¦1älte:gelten¦1äbe:geben¦1iele:fallen¦ürde:erden¦üchse:achsen¦öchte:echten¦äfe:effen¦ärfe:erfen¦ölze:elzen¦iete:aten¦ähme:ehmen¦äme:ommen¦älfe:elfen¦änne:innen¦össe:ießen¦ühre:ahren¦iebe:eiben¦isse:eißen",
        "rev": "ingen:änge¦ecken:äke¦iegen:äge¦elken:ölke¦affen:üfe¦ergen:ärge¦eiden:iede¦eihen:iehe¦ieden:ötte¦aben:ätte¦esen:äse¦ehen:ähe¦innen:önne¦erben:ärbe¦1en:ste,fte,bte,gte,ite,zte¦1oßen:tieße¦1iehen:zöge¦1eschen:rösche¦1eben:wöbe¦1eißen:hieße¦1ehen:tände¦2eiten:glitte¦2n:tete,dete,nete¦2ieben:chöbe¦2eben:nhöbe,shöbe,rhöbe¦2en:inte,säte,hrte,hlte,ihte,llte,örte¦2ssen:reßte,pißte,laßte¦2egen:ewöge¦3n:telte,kelte,selte,derte,uerte,terte,pelte,belte,perte,gerte,felte,helte,herte,delte,melte,berte,zelte,gelte,serte,ferte,merte,ßelte,nerte,kerte,verte,ßerte,lerte,nelte¦3en:schte,ichte,hälte,ennte,uälte,rüßte,echte,büßte,eelte,maßte¦4n:eierte,owerte¦4en:wächte,pielte,zielte,pannte,tielte,mannte,hwerte,querte¦4afen:schliefe",
        "ex": "6:gebären¦8:erlöschen¦9:verlöschen¦schwömme brust:brustschwimmen¦schwömme delfin:delfinschwimmen¦schwömme delphin:delphinschwimmen¦führe:rad fahren¦führe rad:radfahren¦äße:essen¦wäre:sein¦7te:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3änge:abdingen,abringen¦2äße:abessen,fressen¦6te:abfassen,abküssen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen,versüßen¦4itte:abgleiten,ausleiden,mitleiden¦8te:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9te:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äke:abschrecken,erschrecken¦4ßte:anpassen,stressen¦5ßte:anpressen,aufpassen,erpressen,verpassen,vermissen¦3äße:aufessen,ausessen,mitessen¦4äge:aufliegen,beiliegen¦11ielte:aufrechterhalte¦7äke:aufschrecken¦5ösche:ausdreschen,verdreschen¦5itte:ausgleiten,entgleiten¦4ölke:ausmelken¦6ßte:auspressen,einpressen,verprassen¦10te:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5änge:auswringen¦5te:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3öge:belügen,erwägen,abwiegen¦5äge:bloßliegen,festliegen,naheliegen¦3äge:daliegen¦6öge:durchlügen¦8ßte:durchpressen,beeinflussen,bezuschussen¦6änge:durchringen¦7öche:durchstechen¦6öbe:durchweben¦4öbe:einweben,aufheben,wegheben,entheben¦11te:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rte:entkommerzialisie¦3itte:erleiden¦5üfe:erschaffen¦13te:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ieße:gutheißen,verheißen¦12te:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfe:herschaffen,hinschaffen¦6äge:herumliegen¦10üfe:hierherschaffen¦9üfe:hinaufschaffen,zurückschaffen¦13ämme:hinterherschwimme¦8äke:hochschrecken¦5öre:nachgären¦7üfe:nachschaffen¦8itte:niedergleiten¦15te:parallelschalten,weiterentwickel,weiterverbreiten¦8äge:richtigliegen¦7äge:schiefliegen,zurückliegen¦4ärge:verbergen¦4iede:vermeiden¦4iehe:verzeihen¦4äße:vollessen¦4öge:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14te:wiedervereinige,zurückbegleiten¦4ötte:zersieden¦10äke:zurückschrecken¦12äke:zusammenschrecken¦16te:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦5ätte:achthaben,freihaben,gernhaben¦3te:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,büßen,maßen,nölen,süßen¦1üke:backen¦4te:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,küssen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1ände:binden,finden,winden¦1ärge:bergen¦1ärste:bersten¦1äte:bitten,tun¦3ähle:befehlen¦5osse:beschießen¦1öge:biegen,lügen,saugen,wiegen,ziehen¦1öte:bieten¦2iese:blasen,preisen¦3ßte:blassen,pressen¦2ächte:bringen¦1ächte:denken¦1änge:dingen,ringen,singen¦2änge:dringen,wringen¦2ösche:dreschen¦1mailte:e-mailen¦1iele:fallen¦1inge:fangen,gehen¦2ßte:fassen,hassen,müssen,passen,missen,pissen¦2öge:fliegen¦2öre:frieren¦1äbe:geben¦1älte:gelten¦3achte:gedenken¦3iehe:gedeihen¦2itte:gleiten¦1öre:gären¦2übe:graben¦2iffe:greifen¦1ätte:haben¦1ielte:halten¦1ieße:heißen,lassen¦1öbe:heben,weben¦1üde:laden¦1iefe:laufen,rufen¦1äge:liegen¦1äse:lesen¦1iehe:leihen¦1itte:leiden,reiten¦1ölke:melken¦1äße:messen,sitzen¦1iede:meiden¦2chte:mögen¦1annte:nennen,rennen¦3äse:genesen¦1öche:riechen¦3üfe:schaffen¦5ähe:geschehen¦4äke:schrecken¦4ore:schwären¦1ähe:sehen¦1ötte:sieden¦1öffe:saufen¦4ände:gestehen¦2öbe:stieben¦1änke:sinken¦2üge:tragen¦2öffe:triefen¦1hettoisierte:gettoisieren¦3önne:gewinnen¦1üsche:waschen¦1iche:weichen¦1iese:weisen¦1ärbe:werben¦1üßte:wissen¦2te:ölen,üben,säen¦4öße:umfließen¦7ßte:veranlassen¦4ärbe:verderben¦5ibe:vergraben¦4öre:verlieren¦4äte:vertuen,guttun¦5andte:übersenden¦6önne:überspinnen¦6ände:überstehen¦3öbe:abheben,beheben¦17erte:herauskristallisi,hinauskomplimenti¦5öbe:hochheben¦5öge:nachwiegen,überwiegen¦4iefe:schlafen¦5äte:großtun¦18te:institutionalisiere¦7äte:schwertun"
      },
      "firstPlural": {
        "fwd": "ießen:oßen¦ögen:iehen¦äten:un¦1ten:ln,rn,äen,re¦1öben:hieben,heben¦1ögen:wiegen,wegen¦1iefen:lafen¦1ßten:issen,ussen¦1erten:i¦2ten:üßen,älen,elen,aßen,ölen,rsen¦3ten:ächen,annen,weren,ueren",
        "both": "5:wören¦5ten:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,palten,nreisen,mieten,reiden,einden,weiden,treifen,hinden,uchten,ichten,beiten¦5änden:verstehen¦4ten:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,seifen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßten:rblassen,inpassen¦4änden:gestehen¦4üfen:ischaffen¦3ten:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2ten:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,msen,ühen,lgen¦2ählen:pfehlen¦2äßen:eressen,fressen¦2ängen:rringen,dringen,pringen¦2ägen:rliegen,hliegen,nliegen¦2ßten:fassen¦2iegen:hweigen¦2iesen:preisen,blasen¦2ögen:nlügen,fliegen¦2ören:frieren¦2ächten:bringen¦2ügen:tragen,hlagen¦2ichen:treichen¦2iffen:greifen¦2üben:graben¦1äßen:gessen,hessen,sitzen,messen¦1öhen:liehen¦1ßten:ässen¦1ten:ven,xen,pen,ken,uen¦1änken:sinken,rinken,tinken¦1ögen:rügen,saugen,biegen¦1ählen:tehlen¦1annten:nennen,kennen,rennen¦1ören:heren,kiesen¦1ölten:helten¦1iehen:leihen¦1öchen:riechen¦1äten:bitten,reten¦1änden:winden,finden,binden¦1öllen:uellen,wellen¦1ömmen:limmen¦1ieen:peien,reien¦1ämmen:wimmen¦1ienen:heinen¦1ießen:lassen¦1ingen:fangen,gehen¦1ächten:denken¦1öten:bieten¦1ängen:wingen,singen,lingen¦1ärben:werben,terben¦1iesen:weisen¦1ichen:weichen,leichen¦1üschen:waschen¦1iegen:teigen¦1ächen:techen,rechen¦1ünden:tehen¦1ähen:sehen¦1itten:neiden,reiten¦1iffen:leifen,feifen,neifen¦1ieden:heiden¦1öffen:saufen¦1äsen:lesen¦1iefen:laufen,rufen¦1üden:laden¦1ielten:halten¦1älten:gelten¦1äben:geben¦1ielen:fallen¦ürden:erden¦üchsen:achsen¦öchten:echten¦äfen:effen¦ärfen:erfen¦ölzen:elzen¦ieten:aten¦ähmen:ehmen¦ämen:ommen¦älfen:elfen¦ännen:innen¦össen:ießen¦ühren:ahren¦ieben:eiben¦issen:eißen",
        "rev": "ingen:ängen¦ecken:äken¦iegen:ägen¦elken:ölken¦affen:üfen¦ergen:ärgen¦eiden:ieden¦eihen:iehen¦ieden:ötten¦aben:ätten¦esen:äsen¦ehen:ähen¦innen:önnen¦erben:ärben¦1en:sten,ften,bten,gten,iten,zten¦1oßen:tießen¦1iehen:zögen¦1eschen:röschen¦1eben:wöben¦1eißen:hießen¦1ehen:tänden¦2eiten:glitten¦2n:teten,deten,neten¦2ieben:chöben¦2eben:nhöben,shöben,rhöben¦2en:inten,säten,hrten,hlten,ihten,llten,örten¦2ssen:reßten,pißten,laßten¦2egen:ewögen¦3n:telten,kelten,selten,derten,uerten,terten,pelten,belten,perten,gerten,felten,helten,herten,delten,melten,berten,zelten,gelten,serten,ferten,merten,ßelten,nerten,kerten,verten,ßerten,lerten,nelten¦3en:schten,ichten,hälten,ennten,uälten,rüßten,echten,büßten,eelten,maßten¦4n:eierten,owerten¦4en:wächten,pielten,zielten,pannten,tielten,mannten,hwerten,querten¦4afen:schliefen",
        "ex": "7:gebären¦9:erlöschen¦10:verlöschen¦schwömmen brust:brustschwimmen¦schwömmen delfin:delfinschwimmen¦schwömmen delphin:delphinschwimmen¦führen:rad fahren¦führen rad:radfahren¦äßen:essen¦wären:sein¦7ten:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3ängen:abdingen,abringen¦2äßen:abessen,fressen¦6ten:abfassen,abküssen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen,versüßen¦4itten:abgleiten,ausleiden,mitleiden¦8ten:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9ten:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äken:abschrecken,erschrecken¦4ßten:anpassen,stressen¦5ßten:anpressen,aufpassen,erpressen,verpassen,vermissen¦3äßen:aufessen,ausessen,mitessen¦4ägen:aufliegen,beiliegen¦11ielten:aufrechterhalte¦7äken:aufschrecken¦5öschen:ausdreschen,verdreschen¦5itten:ausgleiten,entgleiten¦4ölken:ausmelken¦6ßten:auspressen,einpressen,verprassen¦10ten:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ängen:auswringen¦5ten:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3ögen:belügen,erwägen,abwiegen¦5ägen:bloßliegen,festliegen,naheliegen¦3ägen:daliegen¦6ögen:durchlügen¦8ßten:durchpressen,beeinflussen,bezuschussen¦6ängen:durchringen¦7öchen:durchstechen¦6öben:durchweben¦4öben:einweben,aufheben,wegheben,entheben¦11ten:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rten:entkommerzialisie¦3itten:erleiden¦5üfen:erschaffen¦13ten:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießen:gutheißen,verheißen¦12ten:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfen:herschaffen,hinschaffen¦6ägen:herumliegen¦10üfen:hierherschaffen¦9üfen:hinaufschaffen,zurückschaffen¦13ämmen:hinterherschwimme¦8äken:hochschrecken¦5ören:nachgären¦7üfen:nachschaffen¦8itten:niedergleiten¦15ten:parallelschalten,weiterentwickel,weiterverbreiten¦8ägen:richtigliegen¦7ägen:schiefliegen,zurückliegen¦4ärgen:verbergen¦4ieden:vermeiden¦4iehen:verzeihen¦4äßen:vollessen¦4ögen:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14ten:wiedervereinige,zurückbegleiten¦4ötten:zersieden¦10äken:zurückschrecken¦12äken:zusammenschrecken¦16ten:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦5ätten:achthaben,freihaben,gernhaben¦3ten:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,büßen,maßen,nölen,süßen¦1üken:backen¦4ten:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,küssen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1änden:binden,finden,winden¦1ärgen:bergen¦1ärsten:bersten¦1äten:bitten,tun¦3ählen:befehlen¦5ossen:beschießen¦1ögen:biegen,lügen,saugen,wiegen,ziehen¦1öten:bieten¦2iesen:blasen,preisen¦3ßten:blassen,pressen¦2ächten:bringen¦1ächten:denken¦1ängen:dingen,ringen,singen¦2ängen:dringen,wringen¦2öschen:dreschen¦1mailten:e-mailen¦1ielen:fallen¦1ingen:fangen,gehen¦2ßten:fassen,hassen,müssen,passen,missen,pissen¦2ögen:fliegen¦2ören:frieren¦1äben:geben¦1älten:gelten¦3achten:gedenken¦3iehen:gedeihen¦2itten:gleiten¦1ören:gären¦2üben:graben¦2iffen:greifen¦1ätten:haben¦1ielten:halten¦1ießen:heißen,lassen¦1öben:heben,weben¦1üden:laden¦1iefen:laufen,rufen¦1ägen:liegen¦1äsen:lesen¦1iehen:leihen¦1itten:leiden,reiten¦1ölken:melken¦1äßen:messen,sitzen¦1ieden:meiden¦2chten:mögen¦1annten:nennen,rennen¦3äsen:genesen¦1öchen:riechen¦3üfen:schaffen¦5ähen:geschehen¦4äken:schrecken¦4oren:schwären¦1ähen:sehen¦1ötten:sieden¦1öffen:saufen¦4änden:gestehen¦2öben:stieben¦1änken:sinken¦2ügen:tragen¦2öffen:triefen¦1hettoisierten:gettoisieren¦3önnen:gewinnen¦1üschen:waschen¦1ichen:weichen¦1iesen:weisen¦1ärben:werben¦1üßten:wissen¦2ten:ölen,üben,säen¦4ößen:umfließen¦7ßten:veranlassen¦4ärben:verderben¦5iben:vergraben¦4ören:verlieren¦4äten:vertuen,guttun¦5andten:übersenden¦6önnen:überspinnen¦6änden:überstehen¦3öben:abheben,beheben¦17erten:herauskristallisi,hinauskomplimenti¦5öben:hochheben¦5ögen:nachwiegen,überwiegen¦4iefen:schlafen¦5äten:großtun¦18ten:institutionalisiere¦7äten:schwertun"
      },
      "secondPlural": {
        "fwd": "ießet:oßen¦öget:iehen¦ätet:un¦1tet:ln,rn,äen,re¦1öbet:hieben,heben¦1öget:wiegen,wegen¦1iefet:lafen¦1ßtet:issen,ussen¦1ertet:i¦2tet:üßen,älen,elen,aßen,ölen,rsen¦3tet:ächen,annen,weren,ueren",
        "both": "5tet:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦5ändet:verstehen¦4tet:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,hnden,vieren,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,seifen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßtet:rblassen,inpassen¦4ändet:gestehen¦4üfet:ischaffen¦4t:wören¦3tet:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2tet:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,msen,ühen,lgen¦2ählet:pfehlen¦2äßet:eressen,fressen¦2änget:rringen,dringen,pringen¦2äget:rliegen,hliegen,nliegen¦2ßtet:fassen¦2ieget:hweigen¦2ieset:preisen,blasen¦2öget:nlügen,fliegen¦2öret:frieren¦2ächtet:bringen¦2üget:tragen,hlagen¦2ichet:treichen¦2iffet:greifen¦2übet:graben¦1äßet:gessen,hessen,sitzen,messen¦1öhet:liehen¦1ßtet:ässen¦1tet:ven,xen,pen,ken,uen¦1änket:sinken,rinken,tinken¦1öget:rügen,saugen,biegen¦1ählet:tehlen¦1anntet:nennen,kennen,rennen¦1öret:heren,kiesen¦1öltet:helten¦1iehet:leihen¦1öchet:riechen¦1ätet:bitten,reten¦1ändet:winden,finden,binden¦1öllet:uellen,wellen¦1ömmet:limmen¦1ieet:peien,reien¦1ämmet:wimmen¦1ienet:heinen¦1ießet:lassen¦1inget:fangen,gehen¦1ächtet:denken¦1ötet:bieten¦1änget:wingen,singen,lingen¦1ärbet:werben,terben¦1ieset:weisen¦1ichet:weichen,leichen¦1üschet:waschen¦1ieget:teigen¦1ächet:techen,rechen¦1ündet:tehen¦1ähet:sehen¦1ittet:neiden,reiten¦1iffet:leifen,feifen,neifen¦1iedet:heiden¦1öffet:saufen¦1äset:lesen¦1iefet:laufen,rufen¦1üdet:laden¦1ieltet:halten¦1ältet:gelten¦1äbet:geben¦1ielet:fallen¦ürdet:erden¦üchset:achsen¦öchtet:echten¦äfet:effen¦ärfet:erfen¦ölzet:elzen¦ietet:aten¦ähmet:ehmen¦ämet:ommen¦älfet:elfen¦ännet:innen¦össet:ießen¦ühret:ahren¦iebet:eiben¦isset:eißen",
        "rev": "ingen:änget¦ecken:äket¦iegen:äget¦elken:ölket¦affen:üfet¦ergen:ärget¦eiden:iedet¦eihen:iehet¦ieden:öttet¦ommen:ämt¦aben:ättet¦ehmen:ähmt¦esen:äset¦ehen:ähet¦erben:ärbet¦1en:stet,ftet,btet,gtet,itet,ztet¦1oßen:tießet¦1iehen:zöget¦1eschen:röschet¦1eben:wöbet¦1eißen:hießet¦1ehen:tändet¦2eiten:glittet¦2n:tetet,detet,netet¦2ieben:chöbet¦2eben:nhöbet,shöbet,rhöbet¦2en:intet,sätet,hrtet,hltet,ihtet,lltet,örtet¦2ssen:reßtet,pißtet,laßtet¦2egen:ewöget¦3n:teltet,keltet,seltet,dertet,uertet,tertet,peltet,beltet,pertet,gertet,feltet,heltet,hertet,deltet,meltet,bertet,zeltet,geltet,sertet,fertet,mertet,ßeltet,nertet,kertet,vertet,ßertet,lertet,neltet¦3en:schtet,ichtet,hältet,enntet,uältet,rüßtet,echtet,büßtet,eeltet,maßtet¦4n:eiertet,owertet¦4en:wächtet,pieltet,zieltet,panntet,tieltet,manntet,hwertet,quertet¦4afen:schliefet",
        "ex": "schwömmt brust:brustschwimmen¦schwömmt delfin:delfinschwimmen¦schwömmt delphin:delphinschwimmen¦führet:rad fahren¦führet rad:radfahren¦äßet:essen¦wärt:sein¦7tet:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3änget:abdingen,abringen¦2äßet:abessen,fressen¦6tet:abfassen,abküssen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen,versüßen¦4ittet:abgleiten,ausleiden,mitleiden¦8tet:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9tet:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äket:abschrecken,erschrecken¦4ßtet:anpassen,stressen¦5ßtet:anpressen,aufpassen,erpressen,verpassen,vermissen¦3äßet:aufessen,ausessen,mitessen¦4äget:aufliegen,beiliegen¦11ieltet:aufrechterhalte¦7äket:aufschrecken¦5öschet:ausdreschen,verdreschen¦5ittet:ausgleiten,entgleiten¦4ölket:ausmelken¦6ßtet:auspressen,einpressen,verprassen¦10tet:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5änget:auswringen¦5tet:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3öget:belügen,erwägen,abwiegen¦5äget:bloßliegen,festliegen,naheliegen¦3äget:daliegen¦6öget:durchlügen¦8ßtet:durchpressen,beeinflussen,bezuschussen¦6änget:durchringen¦7öchet:durchstechen¦6öbet:durchweben¦4öbet:einweben,aufheben,wegheben,entheben¦11tet:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rtet:entkommerzialisie¦3ittet:erleiden¦8t:erlöschen¦5üfet:erschaffen¦13tet:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießet:gutheißen,verheißen¦12tet:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfet:herschaffen,hinschaffen¦6äget:herumliegen¦10üfet:hierherschaffen¦9üfet:hinaufschaffen,zurückschaffen¦13ämmet:hinterherschwimme¦8äket:hochschrecken¦5öret:nachgären¦7üfet:nachschaffen¦8ittet:niedergleiten¦15tet:parallelschalten,weiterentwickel,weiterverbreiten¦8äget:richtigliegen¦7äget:schiefliegen,zurückliegen¦4ärget:verbergen¦9t:verlöschen¦4iedet:vermeiden¦4iehet:verzeihen¦4äßet:vollessen¦4öget:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14tet:wiedervereinige,zurückbegleiten¦4öttet:zersieden¦10äket:zurückschrecken¦12äket:zusammenschrecken¦16tet:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦9ämt:abhandenkommen¦5ättet:achthaben,freihaben,gernhaben¦3tet:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,büßen,maßen,nölen,süßen¦1ükt:backen¦4tet:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,küssen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1ändet:binden,finden,winden¦1ärget:bergen¦1ärstet:bersten¦1ätet:bitten,tun¦3ählet:befehlen¦11öbt:beiseiteschieben¦5osset:beschießen¦1öget:biegen,lügen,saugen,wiegen,ziehen¦1ötet:bieten¦2ieset:blasen,preisen¦3ßtet:blassen,pressen¦2ächtet:bringen¦1ächtet:denken¦1änget:dingen,ringen,singen¦2änget:dringen,wringen¦2öschet:dreschen¦1mailtet:e-mailen¦1ielet:fallen¦1inget:fangen,gehen¦2ßtet:fassen,hassen,müssen,passen,missen,pissen¦2öget:fliegen¦7ämt:freibekommen¦5ähmt:freinehmen¦2öret:frieren¦1äbet:geben¦1ältet:gelten¦6t:gebären¦3achtet:gedenken¦3iehet:gedeihen¦2ittet:gleiten¦1öret:gären¦2übet:graben¦2iffet:greifen¦1ättet:haben¦1ieltet:halten¦1ießet:heißen,lassen¦1öbet:heben,weben¦1üdet:laden¦1iefet:laufen,rufen¦1äget:liegen¦1äset:lesen¦1iehet:leihen¦1ittet:leiden,reiten¦1ölket:melken¦1äßet:messen,sitzen¦1iedet:meiden¦2chtet:mögen¦1anntet:nennen,rennen¦3äset:genesen¦1öchet:riechen¦3üfet:schaffen¦5ähet:geschehen¦4äket:schrecken¦4oret:schwären¦1ähet:sehen¦1öttet:sieden¦1öffet:saufen¦4ändet:gestehen¦2öbet:stieben¦1änket:sinken¦2üget:tragen¦2öffet:triefen¦1hettoisiertet:gettoisieren¦3önnt:gewinnen¦1üschet:waschen¦1ichet:weichen¦1ieset:weisen¦1ärbet:werben¦1üßtet:wissen¦2tet:ölen,üben,säen¦5äht:sattsehen¦4ößet:umfließen¦7ßtet:veranlassen¦4ärbet:verderben¦5ibet:vergraben¦4öret:verlieren¦4ätet:vertuen,guttun¦8ähmt:vorliebnehmen¦5andtet:übersenden¦6önnet:überspinnen¦6ändet:überstehen¦3öbet:abheben,beheben¦17ertet:herauskristallisi,hinauskomplimenti¦5öbet:hochheben¦5öget:nachwiegen,überwiegen¦4iefet:schlafen¦5ätet:großtun¦18tet:institutionalisiere¦7ätet:schwertun"
      },
      "thirdPlural": {
        "fwd": "ießen:oßen¦ögen:iehen¦äten:un¦1ten:ln,rn,äen,re¦1öben:hieben,heben¦1ögen:wiegen,wegen¦1iefen:lafen¦1ßten:issen,ussen¦1erten:i¦2ten:üßen,älen,elen,aßen,ölen,rsen¦3ten:ächen,annen,weren,ueren",
        "both": "5:wören¦5ten:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,palten,nreisen,mieten,reiden,einden,weiden,treifen,hinden,uchten,ichten,beiten¦5änden:verstehen¦4ten:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,seifen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßten:rblassen,inpassen¦4änden:gestehen¦4üfen:ischaffen¦3ten:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2ten:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,msen,ühen,lgen¦2ählen:pfehlen¦2äßen:eressen,fressen¦2ängen:rringen,dringen,pringen¦2ägen:rliegen,hliegen,nliegen¦2ßten:fassen¦2iegen:hweigen¦2iesen:preisen,blasen¦2ögen:nlügen,fliegen¦2ören:frieren¦2ächten:bringen¦2ügen:tragen,hlagen¦2ichen:treichen¦2iffen:greifen¦2üben:graben¦1äßen:gessen,hessen,sitzen,messen¦1öhen:liehen¦1ßten:ässen¦1ten:ven,xen,pen,ken,uen¦1änken:sinken,rinken,tinken¦1ögen:rügen,saugen,biegen¦1ählen:tehlen¦1annten:nennen,kennen,rennen¦1ören:heren,kiesen¦1ölten:helten¦1iehen:leihen¦1öchen:riechen¦1äten:bitten,reten¦1änden:winden,finden,binden¦1öllen:uellen,wellen¦1ömmen:limmen¦1ieen:peien,reien¦1ämmen:wimmen¦1ienen:heinen¦1ießen:lassen¦1ingen:fangen,gehen¦1ächten:denken¦1öten:bieten¦1ängen:wingen,singen,lingen¦1ärben:werben,terben¦1iesen:weisen¦1ichen:weichen,leichen¦1üschen:waschen¦1iegen:teigen¦1ächen:techen,rechen¦1ünden:tehen¦1ähen:sehen¦1itten:neiden,reiten¦1iffen:leifen,feifen,neifen¦1ieden:heiden¦1öffen:saufen¦1äsen:lesen¦1iefen:laufen,rufen¦1üden:laden¦1ielten:halten¦1älten:gelten¦1äben:geben¦1ielen:fallen¦ürden:erden¦üchsen:achsen¦öchten:echten¦äfen:effen¦ärfen:erfen¦ölzen:elzen¦ieten:aten¦ähmen:ehmen¦ämen:ommen¦älfen:elfen¦ännen:innen¦össen:ießen¦ühren:ahren¦ieben:eiben¦issen:eißen",
        "rev": "ingen:ängen¦ecken:äken¦iegen:ägen¦elken:ölken¦affen:üfen¦ergen:ärgen¦eiden:ieden¦eihen:iehen¦ieden:ötten¦aben:ätten¦esen:äsen¦ehen:ähen¦innen:önnen¦erben:ärben¦1en:sten,ften,bten,gten,iten,zten¦1oßen:tießen¦1iehen:zögen¦1eschen:röschen¦1eben:wöben¦1eißen:hießen¦1ehen:tänden¦2eiten:glitten¦2n:teten,deten,neten¦2ieben:chöben¦2eben:nhöben,shöben,rhöben¦2en:inten,säten,hrten,hlten,ihten,llten,örten¦2ssen:reßten,pißten,laßten¦2egen:ewögen¦3n:telten,kelten,selten,derten,uerten,terten,pelten,belten,perten,gerten,felten,helten,herten,delten,melten,berten,zelten,gelten,serten,ferten,merten,ßelten,nerten,kerten,verten,ßerten,lerten,nelten¦3en:schten,ichten,hälten,ennten,uälten,rüßten,echten,büßten,eelten,maßten¦4n:eierten,owerten¦4en:wächten,pielten,zielten,pannten,tielten,mannten,hwerten,querten¦4afen:schliefen",
        "ex": "7:gebären¦9:erlöschen¦10:verlöschen¦schwömmen brust:brustschwimmen¦schwömmen delfin:delfinschwimmen¦schwömmen delphin:delphinschwimmen¦führen:rad fahren¦führen rad:radfahren¦äßen:essen¦wären:sein¦7ten:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3ängen:abdingen,abringen¦2äßen:abessen,fressen¦6ten:abfassen,abküssen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen,versüßen¦4itten:abgleiten,ausleiden,mitleiden¦8ten:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9ten:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äken:abschrecken,erschrecken¦4ßten:anpassen,stressen¦5ßten:anpressen,aufpassen,erpressen,verpassen,vermissen¦3äßen:aufessen,ausessen,mitessen¦4ägen:aufliegen,beiliegen¦11ielten:aufrechterhalte¦7äken:aufschrecken¦5öschen:ausdreschen,verdreschen¦5itten:ausgleiten,entgleiten¦4ölken:ausmelken¦6ßten:auspressen,einpressen,verprassen¦10ten:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ängen:auswringen¦5ten:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3ögen:belügen,erwägen,abwiegen¦5ägen:bloßliegen,festliegen,naheliegen¦3ägen:daliegen¦6ögen:durchlügen¦8ßten:durchpressen,beeinflussen,bezuschussen¦6ängen:durchringen¦7öchen:durchstechen¦6öben:durchweben¦4öben:einweben,aufheben,wegheben,entheben¦11ten:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rten:entkommerzialisie¦3itten:erleiden¦5üfen:erschaffen¦13ten:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießen:gutheißen,verheißen¦12ten:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfen:herschaffen,hinschaffen¦6ägen:herumliegen¦10üfen:hierherschaffen¦9üfen:hinaufschaffen,zurückschaffen¦13ämmen:hinterherschwimme¦8äken:hochschrecken¦5ören:nachgären¦7üfen:nachschaffen¦8itten:niedergleiten¦15ten:parallelschalten,weiterentwickel,weiterverbreiten¦8ägen:richtigliegen¦7ägen:schiefliegen,zurückliegen¦4ärgen:verbergen¦4ieden:vermeiden¦4iehen:verzeihen¦4äßen:vollessen¦4ögen:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14ten:wiedervereinige,zurückbegleiten¦4ötten:zersieden¦10äken:zurückschrecken¦12äken:zusammenschrecken¦16ten:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦5ätten:achthaben,freihaben,gernhaben¦3ten:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,büßen,maßen,nölen,süßen¦1üken:backen¦4ten:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,küssen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1änden:binden,finden,winden¦1ärgen:bergen¦1ärsten:bersten¦1äten:bitten,tun¦3ählen:befehlen¦5ossen:beschießen¦1ögen:biegen,lügen,saugen,wiegen,ziehen¦1öten:bieten¦2iesen:blasen,preisen¦3ßten:blassen,pressen¦2ächten:bringen¦1ächten:denken¦1ängen:dingen,ringen,singen¦2ängen:dringen,wringen¦2öschen:dreschen¦15achten:durcheinanderbringen¦1mailten:e-mailen¦1ielen:fallen¦1ingen:fangen,gehen¦2ßten:fassen,hassen,müssen,passen,missen,pissen¦2ögen:fliegen¦2ören:frieren¦1äben:geben¦1älten:gelten¦3achten:gedenken¦3iehen:gedeihen¦2itten:gleiten¦1ören:gären¦2üben:graben¦2iffen:greifen¦1ätten:haben¦1ielten:halten¦1ießen:heißen,lassen¦1öben:heben,weben¦1üden:laden¦1iefen:laufen,rufen¦1ägen:liegen¦1äsen:lesen¦1iehen:leihen¦1itten:leiden,reiten¦1ölken:melken¦1äßen:messen,sitzen¦1ieden:meiden¦2chten:mögen¦1annten:nennen,rennen¦3äsen:genesen¦1öchen:riechen¦3üfen:schaffen¦5ähen:geschehen¦4äken:schrecken¦4oren:schwären¦1ähen:sehen¦1ötten:sieden¦1öffen:saufen¦4änden:gestehen¦2öben:stieben¦1änken:sinken¦2ügen:tragen¦2öffen:triefen¦1hettoisierten:gettoisieren¦3önnen:gewinnen¦1üschen:waschen¦1ichen:weichen¦1iesen:weisen¦1ärben:werben¦1üßten:wissen¦2ten:ölen,üben,säen¦4ößen:umfließen¦7ßten:veranlassen¦4ärben:verderben¦5iben:vergraben¦4ören:verlieren¦4äten:vertuen,guttun¦5andten:übersenden¦6önnen:überspinnen¦6änden:überstehen¦3öben:abheben,beheben¦17erten:herauskristallisi,hinauskomplimenti¦5öben:hochheben¦5ögen:nachwiegen,überwiegen¦4iefen:schlafen¦5äten:großtun¦18ten:institutionalisiere¦7äten:schwertun"
      }
    },
    "imperative": {
      "singular": {
        "fwd": "1:e¦2:ren¦le:eln¦1e:rn,un",
        "both": "2:xen,ven,pen,ien,ßen,ken,uen,den,nen,gen¦3:omen,kten,ülen,ezen,lben,älen,üfen,rsen,hzen,lsen,ölen,psen,ämen,öten,nten,öhen,äten,bben,ohen,osen,mben,uhen,amen,emen,pten,tmen,rlen,ähen,efen,imen,oten,ulen,asen,nsen,lmen,msen,rmen,umen,aten,ösen,olen,ühen,ömen,afen,oben,lten,isen,uzen,hsen,üben,rzen,tten,elen,iben,pfen,iten,uben,nzen,alen,ihen,ufen,mmen,ksen,üten,usen,ften,ifen,aben,ffen,sten,ilen,uten,rten,llen,tzen,izen¦4:arben,nchen,ürfen,ächen,ähmen,rchen,iesen,lchen,rehen,uhlen,olzen,ahmen,ussen,ochen,ahlen,ohlen,alzen,ieben,neten,ahten,ieten,ählen,reben,heben,ärfen,ässen,ärben,ilzen,ühlen,iehen,achen,uchen,tehen,leben,ichen,gehen,üssen¦5:ßmachen,mschen,iechen,rchten,üchten,nschen,passen,pissen,aschen,lschen,ischen,tschen,achten,ichten,rschen,pschen,uchten,uschen,fassen¦5ß:terlassen¦2iß:fressen¦2ich:flechten¦2ieh:rsehen¦1iehl:tehlen¦1ies:lesen¦1isch:löschen¦1irb:werben¦1itt:reten¦1ich:techen,rechen¦1ib:geben¦ilz:elzen¦irf:erfen¦imm:ehmen¦ilf:elfen",
        "rev": "fallen:gefallen¦effen:iff¦ecken:ick¦ergen:irg¦erben:irb¦ehlen:iehl¦echten:icht¦essen:iss¦ellen:ill¦ehen:ieh¦1eln:mle,dle,ble,sle,zle,fle,gle,kle,ple,tle,ßle,nle¦1ssen:aß¦1eschen:risch¦2n:se,be,he,te,me,ze¦2eln:chle¦2en:tz¦3n:nere,hre,dere,rre,uere,pere,here,bere,tere,mere,öre,äre,gere,kere,sere,fere,üre,lere,are,vere,ore,ßere¦3en:ach,ass¦4n:iere,eere,ehle,owere¦5n:hwere,quere",
        "ex": "3:sein,säen,ölen,üben¦4:ahmen,beben,beten,düsen,erben,gehen,heben,leben,pesen,sitzen,weben,wehen¦5:achten,fassen,fehlen,flehen,fläzen,fräsen,gerben,golfen,hassen,höhlen,kerben,lotsen,passen,pissen,rühmen,sülzen,texten,widmen,wissen,wälzen,zechen,ächten,relaxen,spuren¦6:beerben,besitzen,erbeben,erbeten,bejahen,blechen,browsen,hechten,löschen,genesen,pressen,gerieren,seufzen,scheren¦7:enterben,vererben,verwehen,becircen,eislaufen,knechten,preschen,schubsen,schweben,stressen,recyclen,verwesen¦8:abblassen,abpressen,erpressen,verfehlen,erblassen,ganzmachen,hartkochen,retweeten,trompeten,verarzten,zermürben,bescheren¦9:freilassen,zerpressen,gehenlassen,verbeamten,verblassen,verprassen,übertreten,überlassen,zerscheren¦10:begrabschen,durchzechen,freipressen,frischmachen,mähdreschen,gesundmachen,hängenlassen,kaputtmachen,veranlassen,kahlscheren¦11:alleinlassen,fallenlassen,flüssigmachen¦12:bleibenlassen,blickenlassen¦14:zusammenpressen¦17:entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦18:auseinanderschreiben¦19:institutionalisiere¦schwimm brust:brustschwimmen¦schwimm delfin:delfinschwimmen¦schwimm delphin:delphinschwimmen¦fahre:rad fahren¦fahre rad:radfahren¦iss:essen¦2gefallen:befallen¦4ß:belassen,erlassen¦4iff:betreffen¦3gefallen:entfallen,mißfallen,verfallen,zerfallen¦17re:entkommerzialisie¦5ß:entlassen,verlassen¦6ick:erschrecken¦4irg:verbergen¦5isch:verdreschen¦4iß:vermessen,vergessen¦5irb:versterben¦1irg:bergen¦3iehl:befehlen¦3ß:blassen¦2isch:dreschen¦1maile:e-mailen¦4iehl:empfehlen¦1icht:fechten¦2icht:flechten¦2iss:fressen¦1ib:geben¦2ß:lassen,missen¦1ies:lesen¦10e:lustwandeln,glattbügeln¦1ilk:melken¦1iss:messen¦2ill:quellen¦5ieh:geschehen¦3ilt:schelten¦4ick:schrecken¦4ill:schwellen¦1ieh:sehen¦2irb:sterben¦2iff:treffen¦1hettoisiere:gettoisieren¦1irb:werben¦7e:recyceln¦5iehe:sattsehen¦4irb:verderben¦4ich:verfechten¦4e:eiern¦5e:feiern,leiern,guttun¦4le:freveln¦6e:panzern,großtun¦2e:tun¦8e:schwertun¦11e:verschleiern"
      },
      "plural": {
        "fwd": "t:en,e¦1t:rn,ln,un¦1ßt:issen,ussen",
        "both": "5t:talten,palten,einden,hinden,winden,lenden,senden,binden¦4ßt:rblassen¦4t:upten,unden,anden,hnden,änden,elten,chnen,ünden¦3ßt:fressen,rfassen,rlassen¦3t:öden,knen,kten,üden,äten,mden,tmen,iden,gnen,dnen,öten,oten,nten,fnen,rden,eten,lden,aden,uten,rten,tten,eden,aten,nien,üten,ften,sten,iten,hten¦1ßt:ässen",
        "rev": "1en:gt,zt,st,dt,ht,ut,kt,ft,bt,nt,mt,it,pt,vt,xt¦1n:et¦2en:llt,hrt,üßt,rrt,alt,ört,hlt,ilt,olt,art,ult,rlt,ürt,oßt,ärt,ößt,ölt,ält,ort,ült¦2ssen:faßt,laßt,pißt,reßt¦2n:elt¦3n:nert,uert,dert,fert,sert,tert,mert,gert,bert,pert,ßert,kert,hert,lert,vert¦3en:ießt,ielt,iert,eert,eißt,eelt¦4n:owert¦4en:hwert,quert",
        "ex": "schwimmt brust:brustschwimmen¦schwimmt delfin:delfinschwimmen¦schwimmt delphin:delphinschwimmen¦fahrt:rad fahren¦fahrt rad:radfahren¦6t:beenden,spenden,wappnen,becircen,mutmaßen,panzern,schwelen,großtun¦4ßt:befassen,belassen,stressen,umfassen¦7t:befinden,behalten,bewenden,erfinden,erhalten,verenden,erkalten,erkälten,schalten,recyclen,veralten,bescheren¦8t:entfalten,enthalten,entwenden,verhalten,verwalten,verwenden,empfinden,erblinden,verarzten,vergeuden,freihalten,zerscheren,schwertun¦17rt:entkommerzialisie¦5ßt:entlassen,erpressen,vermessen,verpassen,vergessen,vermissen¦10t:verschalten,unterhalten¦5t:binden,falten,finden,halten,rinden,senden,texten,walten,wenden,widmen,winden,feiern,leiern,scheren,guttun¦9t:beinhalten,hochhalten,verbeamten,kahlscheren¦3d:sein¦3ßt:blassen,pressen¦1mailt:e-mailen¦4t:ebnen,enden,roden,eiern,spaßen,spuren¦2ßt:fassen,hassen,lassen,passen,missen,pissen,wissen¦1hettoisiert:gettoisieren¦3t:öden,fußen,maßen¦7ßt:veranlassen¦6ßt:verprassen¦11t:verschwenden,verschleiern¦13t:vervollkommnen¦16t:entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦8ßt:beeinflussen,bezuschussen¦2t:säen,tun,ölen¦18t:institutionalisiere"
      }
    },
    "presentParticiple": {
      "presentParticiple": {
        "fwd": "d:¦1nd:e¦1erend:i¦1end:in,un¦2nd:el",
        "both": "4 schwimmend:phinschwimmen¦3 schwimmend:finschwimmen¦2 schwimmend:stschwimmen¦hettoisierend:ettoisieren¦mailend:-mailen",
        "rev": "2:lnd,rnd¦3:tend,uend,ßend,fend,gend,send,dend,nend,hend,kend,bend,zend,pend,xend,iend,äend,vend,cend¦4:llend,hrend,lmend,olend,ärend,hlend,hmend,älend,umend,rmend,ürend,örend,rrend,elend,emend,ulend,imend,amend,arend,tmend,alend,ülend,ömend,rlend,omend,ämend,ölend,orend,urend,dmend,clend¦5:ommend,eilend,emmend,ämmend,herend,ammend,ummend,eerend,werend,uerend,ümmend¦3n:ßtuend,ttuend¦5n:wertuend",
        "ex": "sackend:absacken¦schämend:fremdschämen¦9d:abfrieren,abstimmen,anfrieren,anstimmen,auszieren,bestimmen,erklimmen,umstimmen,verzieren,zufrieren,zustimmen,amüsieren,animieren,avisieren,barbieren,blamieren,bugsieren,campieren,diktieren,fingieren,flanieren,florieren,forcieren,formieren,frisieren,fritieren,fundieren,fungieren,furnieren,garnieren,gastieren,gefrieren,schmieren,schwimmen,glasieren,gradieren,gummieren,halbieren,hantieren,hausieren,hydrieren,imitieren,isolieren,justieren,kandieren,kassieren,krepieren,kursieren,lackieren,laktieren,markieren,maskieren,massieren,migrieren,montieren,möblieren,normieren,onanieren,operieren,oxidieren,passieren,pausieren,planieren,plazieren,plädieren,portieren,postieren,probieren,prämieren,pulsieren,quotieren,rangieren,reagieren,rentieren,riskieren,rochieren,ruinieren,servieren,sinnieren,sondieren,sortieren,spazieren,studieren,summieren,tabuieren,taktieren,tangieren,tendieren,testieren,tradieren,urinieren,variieren,verlieren,zensieren¦11d:abkassieren,abmontieren,abreagieren,abschmieren,anprobieren,anschmieren,anschwimmen,aufpolieren,auskurieren,ausradieren,ausrasieren,austarieren,beschmieren,deformieren,dejustieren,deplazieren,nachstimmen,vordatieren,wegradieren,zudiktieren,abaissieren,ablaktieren,absentieren,absolvieren,absorbieren,adjustieren,adressieren,adsorbieren,affektieren,affirmieren,akklamieren,akquirieren,akzeptieren,alternieren,analysieren,annektieren,annullieren,appellieren,apportieren,appretieren,arrangieren,assistieren,assoziieren,atomisieren,attackieren,attestieren,balancieren,balsamieren,bilanzieren,debattieren,degradieren,deklarieren,deklinieren,demaskieren,dementieren,demontieren,denunzieren,deplacieren,deportieren,deprimieren,desertieren,dialysieren,diffamieren,differieren,diplomieren,diskutieren,disponieren,dissidieren,doktorieren,egalisieren,ejakulieren,elaborieren,eliminieren,emeritieren,erotisieren,eskortieren,exekutieren,expandieren,explanieren,explizieren,explodieren,explorieren,exportieren,extrahieren,fakturieren,faszinieren,finanzieren,fluktuieren,fokussieren,formatieren,formulieren,fusionieren,galoppieren,garantieren,gratinieren,gratulieren,harmonieren,harpunieren,heroisieren,hospitieren,implizieren,importieren,informieren,inhaftieren,inspirieren,inspizieren,instruieren,inszenieren,integrieren,intendieren,internieren,intrigieren,investieren,involvieren,kalkulieren,kandidieren,kartonieren,kasernieren,kokettieren,kollabieren,kollidieren,kombinieren,komparieren,kompilieren,komponieren,konferieren,kongruieren,konjugieren,konsumieren,konzipieren,kooperieren,korrelieren,korrigieren,kostümieren,kritisieren,kultivieren,kutschieren,lamentieren,lektorieren,liquidieren,marmorieren,marschieren,modellieren,nummerieren,okkludieren,oktroyieren,orientieren,oszillieren,ozonisieren,parfümieren,patentieren,perforieren,permutieren,plakatieren,poetisieren,postulieren,potenzieren,produzieren,profilieren,profitieren,prohibieren,projizieren,promenieren,promovieren,propagieren,provozieren,präfigieren,präparieren,präzisieren,pubertieren,publizieren,rabattieren,raffinieren,ramponieren,randalieren,rationieren,realisieren,rebellieren,reformieren,refundieren,reklamieren,rekrutieren,rekurrieren,remontieren,requirieren,reservieren,resignieren,resistieren,resorbieren,resultieren,retardieren,rezensieren,rezyklieren,schattieren,sekretieren,selektieren,spekulieren,stilisieren,stimulieren,subsumieren,suffigieren,suggerieren,tabellieren,tamponieren,temperieren,terminieren,therapieren,torpedieren,unifizieren,utilisieren,zementieren,zirkulieren,überstimmen¦14d:abkommandieren,abtelefonieren,aufgaloppieren,aufmarschieren,ausdiskutieren,ausformulieren,durchprobieren,durchschwimmen,einbalsamieren,einkalkulieren,einmarschieren,herbeizitieren,losmarschieren,umorganisieren,verkalkulieren,verkonsumieren,verspekulieren,vorfinanzieren,vorformulieren,zurückdatieren,alkoholisieren,aufoktroyieren,authentisieren,automatisieren,axiomatisieren,dekartellieren,dekrementieren,demissionieren,demoralisieren,denazifizieren,dezimalisieren,differenzieren,dimensionieren,diskreditieren,diskriminieren,fetischisieren,fraternisieren,föderalisieren,generalisieren,homogenisieren,identifizieren,ideologisieren,idiomatisieren,inkrementieren,interpretieren,inthronisieren,kapitalisieren,katalogisieren,kategorisieren,klassifizieren,konditionieren,konkretisieren,lexikalisieren,liberalisieren,literalisieren,literarisieren,militarisieren,minimalisieren,monopolisieren,naturalisieren,neutralisieren,nominalisieren,parabolisieren,paragraphieren,paraphrasieren,philosophieren,popularisieren,propagandieren,protokollieren,prädestinieren,quantifizieren,radikalisieren,rehabilitieren,rekapitulieren,rekonstruieren,reorganisieren,repräsentieren,schematisieren,solidarisieren,spezialisieren,stigmatisieren,sympathisieren,synthetisieren,säkularisieren,theoretisieren,transformieren,transportieren,verdünnisieren,zentralisieren,zentrifugieren,übereinstimmen¦13d:abmarschieren,andiskutieren,angaloppieren,anmarschieren,ausbetonieren,ausquartieren,ausspionieren,ausstaffieren,einbetonieren,eingruppieren,einquartieren,fortschwimmen,freischwimmen,gleichstimmen,nachschwimmen,umdisponieren,vollschmieren,agglomerieren,agglutinieren,akkommodieren,akkreditieren,aktualisieren,akupunktieren,animalisieren,argumentieren,aromatisieren,balkanisieren,barrikadieren,biologisieren,blankpolieren,buchstabieren,carbonisieren,dekreditieren,demonstrieren,desinfizieren,determinieren,dialogisieren,dogmatisieren,dokumentieren,domestizieren,dramatisieren,drangsalieren,elektrisieren,europäisieren,extrapolieren,falsifizieren,formalisieren,fotografieren,fraktionieren,frequentieren,funktionieren,germanisieren,gestikulieren,glorifizieren,gratifizieren,halluzinieren,harmonisieren,hypnotisieren,improvisieren,interessieren,interpolieren,intervenieren,justifizieren,karamellieren,katapultieren,katholisieren,klimatisieren,kollaborieren,kommunizieren,komplettieren,komplottieren,konfigurieren,konfrontieren,konföderieren,konsolidieren,konsternieren,konstituieren,kontaminieren,kontrastieren,kontrollieren,konzentrieren,lemmatisieren,manifestieren,metallisieren,methodisieren,modernisieren,mortifizieren,mystifizieren,narkotisieren,neurotisieren,normalisieren,objektivieren,paragrafieren,partizipieren,pauschalieren,periodisieren,petitionieren,positionieren,privatisieren,programmieren,qualifizieren,refinanzieren,rektifizieren,reproduzieren,ritualisieren,sanktionieren,schamponieren,signalisieren,sozialisieren,spezifizieren,stabilisieren,sterilisieren,strangulieren,strukturieren,substituieren,symbolisieren,terrorisieren,thematisieren,transferieren,transponieren,tyrannisieren,überreagieren¦15d:abqualifizieren,durchnumerieren,entkomplizieren,entkomprimieren,entpolitisieren,enttechnisieren,fortmarschieren,hochstilisieren,umfunktionieren,umprogrammieren,umstrukturieren,zurückschwimmen,zusammenstimmen,akklimatisieren,alphabetisieren,amerikanisieren,bagatellisieren,bürokratisieren,choreografieren,demokratisieren,diagnostizieren,diplomatisieren,elektrifizieren,entnazifizieren,experimentieren,fehlinvestieren,instrumentieren,internalisieren,interpunktieren,karamellisieren,kartographieren,kolonialisieren,kommunalisieren,komplementieren,komplimentieren,konfektionieren,kriminalisieren,kristallisieren,materialisieren,mathematisieren,miniaturisieren,nationalisieren,pauschalisieren,perfektionieren,personalisieren,personifizieren,photographieren,proletarisieren,rationalisieren,resozialisieren,restrukturieren,revolutionieren,sensibilisieren,standardisieren,systematisieren,tabellarisieren,transplantieren,verabsolutieren¦10d:abrasieren,aufglimmen,ausfrieren,ausglimmen,beistimmen,einfrieren,einstimmen,verglimmen,verstimmen,vertrimmen,abdizieren,abduzieren,abonnieren,aktivieren,alarmieren,alterieren,amputieren,avancieren,betonieren,blockieren,blondieren,brillieren,brüskieren,debütieren,decodieren,deduzieren,definieren,dekorieren,delegieren,demolieren,deponieren,deputieren,detonieren,dezidieren,dezimieren,dirigieren,dominieren,dressieren,duellieren,emulgieren,engagieren,eskalieren,etablieren,evakuieren,exerzieren,exhibieren,exhumieren,existieren,exponieren,filetieren,flambieren,flankieren,flektieren,frankieren,frappieren,frittieren,föderieren,generieren,graduieren,grassieren,gruppieren,haussieren,honorieren,ignorieren,imponieren,indexieren,indizieren,induzieren,infizieren,inhalieren,injizieren,inserieren,intonieren,ionisieren,irritieren,jubilieren,kanonieren,karikieren,kaschieren,klassieren,kumulieren,laborieren,laminieren,limitieren,marinieren,maximieren,meditieren,memorieren,minimieren,moderieren,modulieren,motivieren,musizieren,nasalieren,nominieren,numerieren,obduzieren,offerieren,okkupieren,omittieren,opponieren,optimieren,ordinieren,platzieren,plombieren,pressieren,punktieren,quadrieren,quartieren,quittieren,reduzieren,referieren,regulieren,renovieren,reparieren,residieren,resümieren,rezipieren,rezitieren,sabotieren,salutieren,saturieren,separieren,simulieren,skalpieren,skandieren,skizzieren,spendieren,spionieren,staffieren,stagnieren,stolzieren,stornieren,tapezieren,tolerieren,trainieren,traktieren,trassieren,tuschieren,typisieren,tätowieren,zentrieren¦16d:abtransportieren,dezentralisieren,disqualifizieren,durchdiskutieren,durchkomponieren,durchmarschieren,einprogrammieren,entbalkanisieren,entcarbonisieren,entformalisieren,entmetallisieren,entmystifizieren,uminterpretieren,verbarrikadieren,vorprogrammieren,authentifizieren,bibliographieren,charakterisieren,choreographieren,demilitarisieren,desillusionieren,emotionalisieren,problematisieren,remilitarisieren,überkompensieren,überstrapazieren¦12d:aufprobieren,ausprobieren,ausrangieren,ausschmieren,aussortieren,durchfrieren,durchstimmen,einkassieren,einoperieren,einschmieren,einschwimmen,einsortieren,einstudieren,enttabuieren,hinschmieren,hinschwimmen,mitbestimmen,nachdatieren,rückdatieren,umgruppieren,umquartieren,verschwimmen,zubetonieren,akkumulieren,akzentuieren,alkalisieren,amortisieren,antizipieren,applaudieren,artikulieren,asphaltieren,assimilieren,auktionieren,autorisieren,banalisieren,bombardieren,bonifizieren,botanisieren,deeskalieren,deklassieren,demodulieren,deplatzieren,diffundieren,dissertieren,distanzieren,dynamisieren,emanzipieren,etikettieren,fotokopieren,habilitieren,humanisieren,humifizieren,idealisieren,illuminieren,illustrieren,immunisieren,infiltrieren,installieren,islamisieren,kanalisieren,kanonisieren,kapitulieren,kartellieren,katalysieren,kolonisieren,kommandieren,kommentieren,kompensieren,komplizieren,kompostieren,komprimieren,kondensieren,konfirmieren,konfiszieren,konfligieren,konkurrieren,konspirieren,konstatieren,konstruieren,konsultieren,kontaktieren,kontrahieren,konvertieren,koordinieren,korrumpieren,legalisieren,legitimieren,lokalisieren,lombardieren,manipulieren,masturbieren,missionieren,mobilisieren,modifizieren,moralisieren,motorisieren,mumifizieren,nomadisieren,organisieren,paralysieren,parkettieren,parzellieren,pensionieren,pervertieren,phantasieren,pigmentieren,polarisieren,polemisieren,politisieren,portionieren,porträtieren,praktizieren,projektieren,proklamieren,prosperieren,protestieren,prozessieren,präsentieren,ratifizieren,reetablieren,reflektieren,regenerieren,registrieren,renaturieren,renumerieren,respektieren,retuschieren,schikanieren,schraffieren,segmentieren,skelettieren,stationieren,strapazieren,subtrahieren,suspendieren,technisieren,telefonieren,thesaurieren,totalisieren,transchieren,triumphieren,uniformieren,urbanisieren,verschmieren,überdosieren¦15nd:aufrechterhalte,weiterentwickel,wiedervereinige¦17d:ausdifferenzieren,demathematisieren,durchorganisieren,entalkoholisieren,entautomatisieren,entliberalisieren,entmonopolisieren,entnaturalisieren,hineinprojizieren,mißinterpretieren,nachkontrollieren,vorbeimarschieren,weitermarschieren,zurückmarschieren,entmilitarisieren,funktionalisieren,industrialisieren,kommerzialisieren¦17nd:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦17erend:herauskristallisi,hinauskomplimenti¦8d:addieren,amtieren,basieren,codieren,datieren,dinieren,dosieren,dotieren,dozieren,düpieren,eruieren,fixieren,genieren,gerieren,hofieren,jurieren,kapieren,karieren,kopieren,kreieren,kurieren,linieren,lädieren,monieren,mutieren,negieren,notieren,panieren,parieren,polieren,posieren,pürieren,radieren,rasieren,regieren,rotieren,sanieren,sezieren,tarieren,taxieren,visieren,zitieren¦7d:agieren,frieren,glimmen,klimmen,stieren,stimmen,trimmen¦3end:sein¦5d:eilen¦18d:fehlinterpretieren¦6d:gieren,zieren¦2end:tun¦4d:ölen¦19d:instrumentalisieren,professionalisieren"
      }
    }
  };

  // uncompress them
  Object.keys(model$3).forEach(k => {
    Object.keys(model$3[k]).forEach(form => {
      model$3[k][form] = uncompress$1(model$3[k][form]);
    });
  });

  let prefixes = [
    'dazwischen',
    'zusammen',
    'entgegen',
    'zwangsum',
    'daneben',
    'dagegen',
    'schwarz',
    'hierher',
    'kaputt',
    'hinein',
    'zurück',
    'weiter',
    'gleich',
    'allein',
    'wieder',
    'schief',
    'fertig',
    'hinter',
    'hängen',
    'kleben',
    'nieder',
    'herbei',
    'hervor',
    'falsch',
    'gesund',
    'wider',
    'breit',
    'krumm',
    'heran',
    'herab',
    'herum',
    'unter',
    'offen',
    'drauf',
    'dahin',
    'klein',
    'durch',
    'davon',
    'daher',
    'dahin',
    'dahin',
    'flach',
    'dabei',
    'drein',
    'davor',
    'krank',
    'knapp',
    'dafür',
    'glatt',
    'nach',
    'rück',
    'dazu',
    'bloß',
    'wahr',
    'weis',
    'hohn',
    'lieb',
    'acht',
    'groß',
    'wach',
    'drin',
    'hoch',
    'voll',
    'hier',
    'hops',
    'lahm',
    'quer',
    'klar',
    'fern',
    'fein',
    'fehl',
    'nach',
    'blau',
    'dran',
    'fest',
    'fort',
    'heim',
    'nahe',
    'rein',
    'leer',
    'hops',
    'kurz',
    'kahl',
    'frei',
    'dar',
    'auf',
    'bei',
    'ein',
    'her',
    'tot',
    'alt',
    'eis',
    'aus',
    'hin',
    'los',
    'mit',
    'vor',
    'weg',
    'zu',
    'um',
    'ab',
    'an'
  ];

  let suffixes$2 = [
    'bringen|bracht',
    'leichen|lichen',
    'riechen|rochen',
    'lassen|lassen',
    'teigen|tiegen',
    'chauen|chaut',
    'fahren|fahren',
    'färben|färbt',
    'hängen|hangen',
    'sitzen|sessen',
    'riegen|riegt',
    'laufen|laufen',
    'neiden|nitten',
    'fallen|fallen',
    'tragen|tragen',
    'saufen|soffen',
    'braten|braten',
    'auchen|aucht',
    'mieren|miert',
    'reiten|ritten',
    'gehen|gangen',
    'alten|alten',
    'raten|raten',
    'ennen|annt',
    'eißen|issen',
    'ulden|uldet',
    'chnen|chnet',
    'chsen|chsen',
    'chten|chtet',
    'echen|ochen',
    'immen|ommen',
    'ehmen|ommen',
    'eiben|ieben',
    'eißen|issen',
    'elzen|olzen',
    'elfen|olfen',
    'rufen|rufen',
    'erben|orben',
    'hauen|hauen',
    'ießen|ossen',
    'ilden|ildet',
    'inden|unden',
    'ingen|ungen',
    'inken|unken',
    'innen|onnen',
    'lagen|lagen',
    'ommen|ommen',
    'achen|acht',
    'annen|annt',
    'assen|asst',
    'mühen|müht',
    'reien|rien',
    'ählen|ählt',
    'enden|andt',
    'tehen|tanden',
    'enken|acht',
    'iegen|ogen',
    'iehen|ogen',
    'reden|redet',
    'rehen|reht',
    'reten|reten',
    'schen|scht',
    'sehen|sehen',
    'toßen|toßen',
    'ünden|ündet',
    'ssen|ssen',
    'tten|ttet',
    'ören|ört',
    'ehen|anden',
    'dnen|dnet',
    'eln|elt',
    'ten|tet',
    'ern|ert',
  ].map(s => s.split('|'));

  const inseperable = /^(be|emp|ent|er|ge|miss|ver|zer|wiederer)/;

  const doPrefix$1 = function (str) {
    if (/^auss/.test(str)) {
      str = str.replace(/^auss/, 'ausges');
      return str
    }
    if (/^ansch/.test(str)) {
      str = str.replace(/^ansch/, 'angesch');
      return str
    }
    // put a 'ge' somewhere
    for (let i = 0; i < prefixes.length; i += 1) {
      if (str.startsWith(prefixes[i])) {
        return prefixes[i] + 'ge' + str.substring(prefixes[i].length)
      }
    }
    if (inseperable.test(str)) {
      // str = str.replace(/en$/, 't')
      return str
    }
    // otherwse, add 'ge-'
    if (!str.match(/^(über|unt|v|au|miß)/)) {
      str = 'ge' + str;
    }
    return str
  };

  const doSuffix$1 = function (str) {
    for (let i = 0; i < suffixes$2.length; i += 1) {
      let [from, to] = suffixes$2[i];
      if (str.endsWith(from)) {
        return str.substring(0, str.length - from.length) + to
      }
    }
    str = str.replace(/en$/, 't');
    return str
  };

  // this one is strange, and doesn't compress well
  const toPastParticiple = function (str) {
    // always weak
    if (str.endsWith('ieren')) {
      str = str.replace(/en$/, 't');
      return str //no 'ge-'
    }
    str = doSuffix$1(str);
    str = doPrefix$1(str);
    return str
  };
  var toPastParticiple$1 = toPastParticiple;

  // console.log( toPastParticiple("schwimmen"), "geschwommen")

  let { presentTense: presentTense$1, pastTense: pastTense$1, subjunctive1: subjunctive1$1, subjunctive2: subjunctive2$1, imperative: imperative$1, presentParticiple: presentParticiple$1 } = model$3;

  const doEach = function (str, m) {
    return {
      first: convert$1(str, m.first),
      second: convert$1(str, m.second),
      third: convert$1(str, m.third),
      firstPlural: convert$1(str, m.firstPlural),
      secondPlural: convert$1(str, m.secondPlural),
      thirdPlural: convert$1(str, m.thirdPlural),
    }
  };

  const toPresent = (str) => doEach(str, presentTense$1);
  const toPast = (str) => doEach(str, pastTense$1);
  const toSubjunctive1 = (str) => doEach(str, subjunctive1$1);
  const toSubjunctive2 = (str) => doEach(str, subjunctive2$1);

  const toPresentParticiple = (str) => convert$1(str, presentParticiple$1.presentParticiple);
  // const toPastParticiple = (str) => convert(str, pastParticiple.pastParticiple)
  const toImperative = (str) => {
    return {
      secondSingular: convert$1(str, imperative$1.singular),
      secondPlural: convert$1(str, imperative$1.plural),
    }
  };

  // an array of every inflection, for '{inf}' syntax
  const all = function (str) {
    let res = [str].concat(
      Object.values(toPresent(str)),
      Object.values(toPast(str)),
      Object.values(toSubjunctive1(str)),
      Object.values(toSubjunctive2(str)),
      Object.values(toImperative(str)),
      toPresentParticiple(str),
      toPastParticiple$1(str),
    ).filter(s => s);
    res = new Set(res);
    return Array.from(res)
  };

  // console.log(toImperative('schwimmen'))
  // console.log(all('tanzen'))

  const doSuffix = function (str) {
    for (let i = 0; i < suffixes$2.length; i += 1) {
      let [inf, prt] = suffixes$2[i];
      if (str.endsWith(prt)) {
        return str.substring(0, str.length - prt.length) + inf
      }
    }
    str = str.replace(/t$/, 'en');
    return str
  };

  const doPrefix = function (str) {
    // remove 'ge-' off the front
    for (let i = 0; i < prefixes.length; i += 1) {
      if (str.startsWith(prefixes[i] + 'ge')) {
        return prefixes[i] + str.substring(prefixes[i].length + 2)
      }
    }
    str = str.replace(/^ge/, '');
    return str
  };

  const fromPastParticiple = function (str) {
    // always weak - ieren
    if (str.endsWith('iert')) {
      str = str.replace(/iert$/, 'ieren');
      return str //no 'ge-'
    }
    str = doSuffix(str);
    str = doPrefix(str);
    return str
  };
  var fromPastParticiple$1 = fromPastParticiple;

  // console.log(fromPastParticiple('ereifert'))

  let { presentTense, pastTense, subjunctive1, subjunctive2, imperative, presentParticiple } = model$3;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse$1(m[k]);
      return h
    }, {})
  };

  let presentRev = revAll(presentTense);
  let pastRev = revAll(pastTense);
  let subjRev1 = revAll(subjunctive1);
  let subjRev2 = revAll(subjunctive2);
  let impRev = revAll(imperative);
  let presentPartRev = reverse$1(presentParticiple.presentParticiple);
  // let pastPartRev = reverse(pastParticiple.pastParticiple)

  const allForms = function (str, form, m) {
    if (m.hasOwnProperty(form)) {
      return convert$1(str, m[form])
    }
    return str
  };

  const fromPresent = (str, form) => allForms(str, form, presentRev);
  const fromPast = (str, form) => allForms(str, form, pastRev);
  const fromSubjunctive1 = (str, form) => allForms(str, form, subjRev1);
  const fromSubjunctive2 = (str, form) => allForms(str, form, subjRev2);
  const fromImperative = (str, form) => allForms(str, form, impRev);
  const fromPresentParticiple = (str) => convert$1(str, presentPartRev);

  // console.log(fromPresent('tanzt', 'secondPlural'))

  // greedy adjective suffixes 
  // learned from spencermountain/suffix-thumb @ March 2023
  const r = 'ster';
  const n = 'sten';
  const e = 'ste';
  const s = 'stes';

  var model$2 = {
    'böse': [r, n, e, s],
    chener: ['erer', 'eren', 'ere', 'eres'],
    agisch: [r, n, e, s],
    ppisch: [r, n, e, s],
    ragend: [r, n, e, s],
    idisch: [r, n, e, s],
    ichbar: [r, n, e, s],
    eladen: [r, n, e, s],
    ietend: [r, n, e, s],
    orativ: [r, n, e, s],
    ankbar: [r, n, e, s],
    'übisch': [r, n, e, s],
    lgisch: [r, n, e, s],
    fangen: [r, n, e, s],
    yrisch: [r, n, e, s],
    nkisch: [r, n, e, s],
    rrisch: [r, n, e, s],
    llisch: [r, n, e, s],
    ichend: [r, n, e, s],
    gerade: ['r', 'n', '', 's'],
    ragbar: [r, n, e, s],
    ellbar: [r, n, e, s],
    assend: [r, n, e, s],
    ypisch: [r, n, e, s],
    otisch: [r, n, e, s],
    thisch: [r, n, e, s],
    iebend: [r, n, e, s],
    tional: [r, n, e, s],
    regend: [r, n, e, s],
    erisch: [r, n, e, s],
    hener: ['erer', 'eren', 'ere', 'eres'],
    ocken: [r, n, e, s],
    iisch: [r, n, e, s],
    htern: [r, n, e, s],
    stern: [r, n, e, s],
    egial: [r, n, e, s],
    abend: [r, n, e, s],
    ifend: [r, n, e, s],
    efend: [r, n, e, s],
    nitiv: [r, n, e, s],
    nnend: [r, n, e, s],
    vativ: [r, n, e, s],
    erade: ['r', 'n', '', 's'],
    igend: [r, n, e, s],
    iden: [r, n, e, s],
    stiv: [r, n, e, s],
    mein: [r, n, e, s],
    ubar: [r, n, e, s],
    ikal: [r, n, e, s],
    zend: [r, n, e, s],
    rade: ['r', 'n', '', 's'],
    gnet: [r, n, e, s],
    tral: [r, n, e, s],
    fbar: [r, n, e, s],
    rmal: [r, n, e, s],
    eden: [r, n, e, s],
    hren: [r, n, e, s],
    'ßbar': [r, n, e, s],
    zbar: [r, n, e, s],
    chen: [r, n, e, s],
    ogen: [r, n, e, s],
    nbar: [r, n, e, s],
    egen: [r, n, e, s],
    rsch: [r, n, e, s],
    tbar: [r, n, e, s],
    rbar: [r, n, e, s],
    ktiv: [r, n, e, s],
    'öse': [r, n, e, s],
    eal: [r, n, e, s],
    ade: ['r', 'n', '', 's'],
    men: [r, n, e, s],
    ten: [r, n, e, s],
    sen: [r, n, e, s],
    siv: [r, n, e, s],
    ich: [r, n, e, s],
    'üm': [r, n, e, s],
    'än': [r, n, e, s],
    xy: [r, n, e, s],
    'ül': [r, n, e, s],
    uh: [r, n, e, s],
    be: [r, n, e, s],
    pf: [r, n, e, s],
    of: [r, n, e, s],
    ic: [r, n, e, s],
    he: ['r', 'n', '', 's'],
    om: [r, n, e, s],
    ik: [r, n, e, s],
    ym: [r, n, e, s],
    ff: [r, n, e, s],
    'üb': [r, n, e, s],
    hn: [r, n, e, s],
    pp: [r, n, e, s],
    ir: [r, n, e, s],
    av: [r, n, e, s],
    im: [r, n, e, s],
    rb: [r, n, e, s],
    ge: [r, n, e, s],
    ul: [r, n, e, s],
    rr: [r, n, e, s],
    em: [r, n, e, s],
    ck: [r, n, e, s],
    'ön': [r, n, e, s],
    hm: [r, n, e, s],
    te: ['r', 'n', '', 's'],
    hl: [r, n, e, s],
    mm: [r, n, e, s],
    au: [r, n, e, s],
    if: [r, n, e, s],
    eu: [r, n, e, s],
    de: [r, n, e, s],
    il: [r, n, e, s],
    se: ['r', 'n', '', 's'],
    'är': [r, n, e, s],
    am: [r, n, e, s],
    er: [r, n, e, s],
    ll: [r, n, e, s],
    ig: [r, n, e, s]
  };

  const inflectAdj = function (inf) {
    const keys = Object.keys(model$2);
    for (let i = 0; i < keys.length; i += 1) {
      let suff = keys[i];
      if (inf.endsWith(suff)) {
        return {
          one: inf + model$2[suff][0],
          two: inf + model$2[suff][1],
          three: inf + model$2[suff][2],
          four: inf + model$2[suff][3],
        }
      }
    }
    return {
      one: inf + 'er',
      two: inf + 'en',
      three: inf + 'e',
      four: inf + 'es',
    }
  };
  var inflectAdj$1 = inflectAdj;

  // console.log(inflectAdj('skandalös'))

  const abel = /able[rns]$/;
  const auer = /aure[rns]$/;
  const usst = /sste[rns]$/;
  const wisse = /wisse[rns]$/;
  const weise = /weise[rns]$/;

  const suffixes$1 = [
    'ester',
    'esten',
    'estes',
    'este',
    'ster',
    'sten',
    'stes',
    'ste',
    'er',
    'en',
    'es',
    'e',
  ];

  const toRoot$1 = function (str) {
    if (abel.test(str)) {
      return str.replace(abel, 'abel')
    }
    if (auer.test(str)) {
      return str.replace(auer, 'auer')
    }
    if (usst.test(str)) {
      return str.replace(usst, 'usst')
    }
    if (wisse.test(str)) {
      return str.replace(wisse, 'wiß')
    }
    if (weise.test(str)) {
      return str.replace(weise, 'weise')
    }
    for (let i = 0; i < suffixes$1.length; i += 1) {
      let suff = suffixes$1[i];
      if (str.endsWith(suff)) {
        return str.substring(0, str.length - suff.length)
      }
    }
    return str
  };
  var adjToRoot = toRoot$1;
  // console.log(toRoot('saurerer'))

  // import models from './new.js'

  let rules = [
    ['ein', ''],
    ['cht', 'e'],
    ['ll', 'e'],
    ['is', 'se'],
    ['kt', 'e'],
    ['tt', 'e'],
    ['rt', 'e'],
    ['ur', 'en'],
    ['ck', 'e'],
    ['at', 'e'],
    ['ft', 'en'],
    ['nd', 'e'],
    ['ei', 'en'],
    ['or', 'en'],
    ['ch', 'e'],
    ['it', 'en'],
    ['st', 'en'],
    ['nt', 'en'],
    ['el', ''],
    ['on', 'en'],
    ['en', ''],
    ['ng', 'en'],
    ['in', 'nen'],
    ['er', '']
  ];

  const firstForm = function (str) {
    for (let i = 0; i < rules.length; i += 1) {
      let [from, to] = rules[i];
      if (str.endsWith(from)) {
        return str + to
      }
    }
    return str + 'n'
  };
  const inflect = function (str) {
    return {
      one: firstForm(str)
    }
  };
  var inflectNoun = inflect;

  // console.log(inflect('abdruckende').one === 'abdruckenden')

  const leave = [
    'tion',
    'sion',
    'tent',
    'rant',
    'hine',
    'ppen',
    'ene',
    'nne',
    'zen',
    'in',
    'an',
    'is',
  ];


  const suffixes = [
    'ns',
    'ne',
    'n',
    's',
  ];

  const toRoot = function (str) {
    for (let i = 0; i < leave.length; i += 1) {
      if (str.endsWith(leave[i])) {
        return str
      }
    }
    for (let i = 0; i < suffixes.length; i += 1) {
      let suff = suffixes[i];
      if (str.endsWith(suff)) {
        return str.substring(0, str.length - suff.length)
      }
    }
    return str
  };
  var nounToRoot = toRoot;
  // console.log(toRoot('Gasen'))

  const allAdj = (inf) => Object.values(inflectAdj$1(inf));
  const allNoun = (inf) => Object.values(inflectNoun(inf));

  var methods = {
    verb: {
      all,
      toPresent, toPast, toSubjunctive1, toSubjunctive2, toImperative, toPastParticiple: toPastParticiple$1, toPresentParticiple,
      fromPresent, fromPast, fromSubjunctive1, fromSubjunctive2, fromImperative, fromPresentParticiple, fromPastParticiple: fromPastParticiple$1
    },
    adjective: {
      inflect: inflectAdj$1, toRoot: adjToRoot, all: allAdj
    },
    noun: {
      inflect: inflectNoun, toRoot: nounToRoot, all: allNoun
    }
  };

  // generated in ./lib/lexicon
  var lexData = {};

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

  var misc$1 = {
    'wo': 'QuestionWord',// where
    'woher': 'QuestionWord',//where  from
    'wohin': 'QuestionWord',//where  to
    'wann': 'QuestionWord',// when
    'was': 'QuestionWord',// what
    'wer': 'QuestionWord',// who
    'wie': 'QuestionWord',// how
    'warum': 'QuestionWord',// why
    'achte': 'TextOrdinal'
  };

  let lexicon$1 = Object.assign({}, misc$1);

  const tagMap = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };

  const addWords = function (obj, tag, lex) {
    Object.keys(obj).forEach(k => {
      let w = obj[k];
      if (!lex[w] && tagMap[k]) {
        lex[w] = [tag, tagMap[k]];
      }
    });
  };

  Object.keys(lexData).forEach(tag => {
    let wordsObj = unpack$1(lexData[tag]);
    Object.keys(wordsObj).forEach(w => {
      lexicon$1[w] = lexicon$1[w] || tag;

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        // add present tense
        let obj = toPresent(w);
        addWords(obj, 'PresentTense', lexicon$1);
        // participles
        let str = toPresentParticiple(w);
        lexicon$1[str] = lexicon$1[str] || ['Participle', 'PresentTense'];
        str = toPastParticiple$1(w);
        lexicon$1[str] = lexicon$1[str] || ['Participle', 'PastTense'];
        // add past tense
        obj = toPast(w);
        addWords(obj, 'PastTense', lexicon$1);
        // add sunjunctives
        obj = toSubjunctive1(w);
        addWords(obj, 'Verb', lexicon$1);
        obj = toSubjunctive2(w);
        addWords(obj, 'Verb', lexicon$1);
        // add imperative
        obj = toImperative(w);
        addWords(obj, 'Imperative', lexicon$1);
      }
      // inflect our adjectives
      if (tag === 'Adjective') {
        let obj = inflectAdj$1(w);
        addWords(obj, 'Adjective', lexicon$1);
      }
      if (tag === 'Noun') {
        let obj = inflectNoun(w);
        addWords(obj, 'Noun', lexicon$1);
      }
      if (tag === 'Possessive') {
        lexicon$1[w] = ['Pronoun', 'Possessive'];
      }
    });
  });
  // console.log(lexicon['zweite'])
  var lexicon$2 = lexicon$1;

  const verbForm = function (term) {
    let want = [
      'FirstPerson',
      'SecondPerson',
      'ThirdPerson',
      'FirstPersonPlural',
      'SecondPersonPlural',
      'ThirdPersonPlural',
    ];
    return want.find(tag => term.tags.has(tag))
  };


  const root = function (view) {

    const { verb, noun, adjective } = view.world.methods.two.transform;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        let str = term.implicit || term.normal || term.text;
        // get infinitive form of the verb
        if (term.tags.has('Verb')) {
          let form = verbForm(term);
          // look at past + present participles, first
          if (term.tags.has('Participle') && term.tags.has('PresentTense')) {
            term.root = verb.fromPresentParticiple(str, form);
          } else if (term.tags.has('Participle') && term.tags.has('PastTense')) {
            term.root = verb.fromPastParticiple(str, form);
          } else if (term.tags.has('PresentTense')) {
            term.root = verb.fromPresent(str, form);
          } else if (term.tags.has('PastTense')) {
            term.root = verb.fromPast(str, form);
          } else if (term.tags.has('Subjunctive1')) {
            term.root = verb.fromSubjunctive1(str, form);
          } else if (term.tags.has('Subjunctive2')) {
            term.root = verb.fromSubjunctive2(str, form);
          } else if (term.tags.has('Imperative')) {
            term.root = verb.fromImperative(str, form);
          } else ;
        }
        if (term.tags.has('Adjective')) {
          term.root = adjective.toRoot(str);
        }
        if (term.tags.has('Noun')) {
          term.root = noun.toRoot(str);
        }

      });
    });
    return view
  };
  var root$1 = root;

  var lexicon = {
    compute: { root: root$1 },
    methods: {
      two: {
        transform: methods
      }
    },
    words: lexicon$2,
    hooks: ['lexicon']
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns$2 = {
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

  var verbs$2 = {
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
    Subjunctive: {
      is: 'Verb',
    },
    Participle: {
      is: 'Verb',
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
    FirstPerson: {
      is: 'Verb'
    },
    SecondPerson: {
      is: 'Verb'
    },
    ThirdPerson: {
      is: 'Verb'
    },
  };

  var values$1 = {
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
    TextOrdinal: {
      is: 'TextValue',
      also: ['Ordinal']
    },
    TextCardinal: {
      is: 'TextValue',
      also: ['Cardinal']
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

  let tags = Object.assign({}, nouns$2, verbs$2, values$1, dates, misc);

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
    b: 'þƀƁƂƃƄƅɃϦБВЪЬвъьѢѣҌҍ',
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
    ß: 'β' //greek beta to german Eszett surrogate
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

    // { word: "n", out: ['das', 'ans'] },
    // { word: "an", out: ['dem', 'am'] },
    // { word: "auf", out: ['das', 'aufs'] },
    // { word: "bei", out: ['dem', 'beim'] },
    // { word: "durch", out: ['das', 'durchs'] },
    // { word: "für", out: ['das', 'fürs'] },
    // { word: "in", out: ['das', 'ins'] },
    // { word: "in", out: ['dem', 'im'] },
    // { word: "über", out: ['das', 'übers'] },
    // { word: "um", out: ['das', 'ums'] },
    // { word: "unter", out: ['das', 'unters'] },
    // { word: "von", out: ['dem', 'vom'] },
    // { word: "vor", out: ['das', 'vors'] },
    // { word: "vor", out: ['dem', 'vorm'] },
    // { word: "zu", out: ['dem', 'zum'] },
    // { word: "zu", out: ['der', 'zur'] },
  ];

  const isAcronym$1 = /[ .][A-Z]\.? *$/i;
  const hasEllipse = /(?:\u2026|\.{2,}) *$/;
  const hasLetter = /\p{L}/u;
  const isOrdinal = /[0-9]\. *$/;

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) === true) {
      return false
    }
    // german ordinals like '4.'
    if (isOrdinal.test(str) === true) {
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

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = unicode$1;
      world.model.one.contractions = contractions;
      world.methods.one.tokenize.isSentence = isSentence$1;
    },
  };

  // import values from './splitter/values.js'
  // import nouns from './splitter/nouns.js'
  // import verbs from './splitter/verbs.js'
  // import adjectives from './splitter/adjectives.js'

  let values = { more: [] };
  let nouns$1 = { more: [] };
  let verbs$1 = { more: [] };
  let adjectives$1 = { more: [] };

  var model$1 = {
    one: {
      splitter: {
        values,
        nouns: nouns$1,
        verbs: verbs$1,
        adjectives: adjectives$1
      }
    }
  };

  const addWord = function (str, root) {
    let chars = str.split('');
    let node = root;
    chars.forEach(c => {
      node.more[c] = node.more[c] || { more: {} };
      node = node.more[c];
    });
    node.end = true;
  };

  const findMatch = function (str, root) {
    let match = null;
    let chars = str.split('');
    let node = root;
    for (let i = 0; i < chars.length; i += 1) {
      if (!node.more[chars[i]]) {
        // dead end
        return match
      }
      node = node.more[chars[i]];
      if (node.end === true) {
        match = chars.slice(0, i + 1).join('');
      }
    }
    return match
  };

  // let trie = makeTrie(['car', 'cab', 'stab', 'carbon'])
  // console.dir(trie, { depth: 15 })
  // console.log(findMatch('carbon', trie))

  // links between words
  // https://digital.lib.washington.edu/researchworks/bitstream/handle/1773/44691/Callow_washington_0250O_20779.pdf
  // 'er|en|es|s|e|n
  const hasLink = /^(e[rns]|s|n)/;

  const findSplits = function (str, root) {
    let found = [];
    while (str.length > 0) {
      let match = findMatch(str, root);
      if (!match) {//we done
        // allow a connector - [foo, en, bar]
        if (found.length > 0 && hasLink.test(str)) {
          let tmp = str.replace(hasLink, '');
          match = findMatch(tmp, root);
          if (match) {
            let link = str.match(hasLink)[0];
            found.push(link);
            str = str.substr(link.length);
          }
        }
      }
      if (!match) {
        found.push(str);
        break
      }
      // found a prefix
      found.push(match);
      str = str.substr(match.length);
    }
    return found
  };

  const splitter$1 = function (view) {
    let { nouns, values } = view.model.one.splitter;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        // split numbers
        if (term.tags.has('Value')) {
          term.splits = findSplits(term.normal, values);
        }
        // split nouns
        if (term.tags.has('Noun')) {
          term.splits = findSplits(term.normal, nouns);
        }
        // split adjectives
        // if (term.tags.has('Adjective')) {
        //   term.byChar = findbyChar(term, adjectives)
        // }
      });
    });
  };
  var compute = { splitter: splitter$1 };

  const buildIndex = function (world) {
    let words = Object.entries(world.model.one.lexicon);
    let { nouns, values } = world.model.one.splitter;
    words.forEach(a => {
      let [w, tag] = a;
      if (tag === 'TextOrdinal' || tag === 'TextCardinal') {
        addWord(w, values);
      }
      if (tag === 'Noun' || tag === 'FemaleNoun' || tag === 'MaleNoun' || tag === 'NeuterNoun') {
        addWord(w, nouns);
      }
    });
    // misc words
    addWord('und', values);//'and'
    addWord('ein', values);//'one'
    addWord('hunderttausend', values);
  };
  var mutate = buildIndex;

  var splitter = {
    mutate,
    model: model$1,
    compute,
    // hooks: ['splitter'],
  };

  const hasApostrophe = /['‘’‛‵′`´]/;
  const hasPeriod = /\./;
  const isNum = /^[0-9+\-,]+$/;

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
    // keep period in number ordinals?
    if (hasPeriod.test(term.post) && isNum.test(text)) {
      setTag([term], ['Ordinal', 'NumericValue'], world, false, `1-regex-ordinal`);
      term.confidence = 0.6;
      return true
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
    return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  };

  // add a noun to any non-0 index titlecased word, with no existing tag
  const titleCaseNoun = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    // don't over-write any tags
    // if (term.tags.size > 0) {
    //   return
    // }
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
    return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
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
        setTag([term], 'Noun', world, false, `1-titlecase`);// Noun still the safest bet?
        return
      }

      let tag = 'Adjective';
      if (terms.length > 10 && hasNoVerb(terms)) {
        tag = 'Verb';
      }
      setTag([term], tag, world, false, '2-fallback');
    }
  };
  var fallback$1 = fallback;

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 10;
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

  //sweep-through all prefixes
  const prefixLoop = function (str = '', prefixes = []) {
    const len = str.length;
    let max = 10;
    if (max > len - 3) {
      max = len - 3;
    }
    for (let i = max; i > 2; i -= 1) {
      let prefix = str.substring(0, i);
      if (prefixes[prefix.length].hasOwnProperty(prefix) === true) {
        let tag = prefixes[prefix.length][prefix];
        return tag
      }
    }
    return null
  };

  // give 'overwork' the same tag as 'work'
  const checkPrefix = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.size === 0) {
      let tag = prefixLoop(term.normal, world.model.two.prefixPatterns);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-prefix');
        term.confidence = 0.5;
        return true
      }
    }
    return null
  };
  var prefixCheck = checkPrefix;

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
      found = found || prefixCheck(terms, i, world);
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
    [/^[0-9]{2}[:.][0-9]{2}(am|pm)?$/i, 'Time', '13.30pm'],
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
    [/^#[a-z0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

    // @spencermountain
    [/^@\w{2,}$/, 'AtMention'],

    // period-ones acronyms - f.b.i.
    [/^([A-ZÄÖÜ]\.){2}[A-ZÄÖÜ]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

    // ending-apostrophes
    [/.{3}[lkmnp]in['‘’‛‵′`´]$/, 'Gerund', "chillin'"],
    [/.{4}s['‘’‛‵′`´]$/, 'Possessive', "flanders'"],

    // german ordinals '4.'
    // [/^[0-9]+\.$/, 'Ordinal'],
  ];

  const rb = 'Adverb';
  const nn = 'Noun';
  const vb = 'Verb';
  const jj = 'Adjective';
  const ord = 'TextOrdinal';
  const card = 'TextCardinal';


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
      // en: vb,
      ns: nn,
      ts: nn,
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
      ten: vb,
      eln: vb,
      ern: vb,
      gen: vb,
      fen: vb,
      // ben: vb,
      // ren: vb,
      // fen: vb,
      // men: vb,
      igt: vb,
      tzt: vb,
      det: vb,
      elt: vb,
      ete: vb,
      elf: card,//eleven
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
      llen: vb,
      ngen: vb,
      tzen: vb,
      hren: vb,
      cken: vb,
      ssen: vb,
      eßen: vb,
      hnen: vb,
      ufen: vb,
      lten: vb,
      hten: vb,
      zehn: card,//10s
      eins: card,
      zwei: card,
      drei: card,
      vier: card,
      fünf: card,
      acht: card,
      neun: card,
      // zehn: card,
      // lten: vb,
      // ssen: vb
    },
    {
      // five-letter suffixes
      ische: jj,
      zwölf: card,
      sechs: card,
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
      ieren: vb,
    },
    {
      // six-letter suffixes
      igsten: jj,
      ischen: jj,
      sieben: card,
      lichen: jj,
      tische: jj,
      nische: jj,
      zehnte: ord,
      zigste: ord,
      ßigste: ord,
    },
    {
      // seven-letter suffixes
      zigsten: ord,
      tischen: jj,
      tlichen: jj,
      nischen: jj,
      zwanzig: card,//20
      dreißig: card,//30
      vierzig: card,//40
      fünfzig: card,//50
      sechzig: card, //60
      siebzig: card, //70
      achtzig: card, //80
      neunzig: card, //90
      hundert: card,//100
      tausend: card,//1,000
    },
    // eight-letter suffixes
    {
      dreizehn: card,
      vierzehn: card,
      fünfzehn: card,
      sechzehn: card,
      siebzehn: card,
      achtzehn: card,
      neunzehn: card,

    },
    // nine-letter suffixes
    {
    },
    // ten-letter suffixes
    {
      hundertste: ord,
      tausendste: ord,
      millionste: ord
    },
  ];

  const val = 'TextValue';

  var prefixPatterns = [
    null,
    {
      // one-letter prefixes
    },
    {
      // two-letter prefixes
    },
    {
      // three-letter prefixes
    },
    {
      // four-letter prefixes
      "eins": val,
      "zwei": val,
      "drei": val,
      "vier": val,
      "fünf": val,
      "acht": val,
      "neun": val,
    },
    {
      // five-letter prefixes
      "sechs": val,
      "sieben": val,
    },
    {
      // six-letter prefixes
    },
    {
      // seven-letter prefixes
    },
    {
      // eight-letter prefixes
    },
    {
      // nine-letter prefixes
      einhunder: val
    },
    {
      // ten-letter prefixes
      zweihunder: val
    },
  ];

  var model = {
    regexNormal,
    regexNumbers,
    regexText,
    suffixPatterns,
    prefixPatterns
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

  const postTagger$1 = function (doc) {
    // eine as 1 or the
    doc.match('eine #Value').tag('TextValue', 'eine-value');
    // 6.30 Uhr
    doc.match('#Value uhr').tag('Time', 'time-Uhr');
    // modal verbs
    // dürfen (be allowed to/may), können (be able to/can), mögen (to like/may), müssen (to have to/must), sollen (to ought to/should) and wollen (to want to).

    doc.match('[{dürfen}] #Pronoun?  #Verb', 0).tag('Modal', 'dürfen-verb');
    doc.match('[{können}] #Pronoun?  #Verb', 0).tag('Modal', 'können-verb');
    doc.match('[{mögen}] #Pronoun? #Verb', 0).tag('Modal', 'mögen-verb');
    doc.match('[{müssen}] #Pronoun?  #Verb', 0).tag('Modal', 'müssen-verb');
    doc.match('[{sollen}] #Pronoun?  #Verb', 0).tag('Modal', 'sollen-verb');
    doc.match('[{wollen}] #Pronoun?  #Verb', 0).tag('Modal', 'wollen-verb');

    // auxiliary verbs
    doc.match('[{sein}] #Verb', 0).tag('Auxiliary', 'sein-verb');
    doc.match('[{haben}] #Verb', 0).tag('Auxiliary', 'haben-verb');
    doc.match('[{werden}] #Verb', 0).tag('Auxiliary', 'werden-verb');
  };
  var postTagger$2 = postTagger$1;

  var postTagger = {
    compute: {
      postTagger: postTagger$2
    },
    hooks: ['postTagger']
  };

  let data = {
    ones: [
      [1, 'eins', 'erste'],
      [2, 'zwei', 'zweite'],
      [3, 'drei', 'dritte'],
      [4, 'vier', 'vierte'],
      [5, 'fünf', 'fünfte'],
      [6, 'sechs', 'sechste'],
      [7, 'sieben', 'siebente'], //siebte
      [8, 'acht', 'achte'],
      [9, 'neun', 'neunte'],
    ],
    teens: [
      [10, 'zehn', 'zehnte'],
      [11, 'elf', 'elfte'],
      [12, 'zwölf', 'zwölfte'],
      [13, 'dreizehn', 'dreizehnte'],
      [14, 'vierzehn', 'vierzehnte'],
      [15, 'fünfzehn', 'fünfzehnte'],
      [16, 'sechzehn', 'sechzehnte'],
      [17, 'siebzehn', 'siebzehnte'],
      [18, 'achtzehn', 'achtzehnte'],
      [19, 'neunzehn', 'neunzehnte'],
    ],
    tens: [
      [20, 'zwanzig', 'zwanzigste'],
      [30, 'dreißig', 'dreißigste'],
      [40, 'vierzig', 'vierzigste'],
      [50, 'fünfzig', 'fünfzigste'],
      [60, 'sechzig', 'sechzigste'],
      [70, 'siebzig', 'siebzigste'],
      [80, 'achtzig', 'achtzigste'],
      [90, 'neunzig', 'neunzigste'],
    ],
    hundreds: [
      [100, 'einhundert', 'hundertste'],
      // [101, 'einhunderteins', 'hunderterste'],
      [200, 'zweihundert', 'zweihundertste'],
      [300, 'dreihundert', 'dreihundertste'],
      [400, 'vierhundert', 'vierhundertste'],
      [500, 'fünfhundert', 'fünfhundertste'],
      [600, 'sechshundert', 'sechshundertste'],
      [700, 'siebenhundert', 'siebenhundertste'],
      [800, 'achthundert', 'achthundertste'],
      [900, 'neunhundert', 'neunhundertste'],
    ],
    multiples: [
      [100, 'hundert', 'hundertste'],
      [1000, 'tausend', 'tausendste'],
      [100000, 'hunderttausend', 'hunderttausendste'],
      [1000000, 'million', 'millionste'],
    ]
  };
  const toCardinal = {};
  const toOrdinal = {};
  const toNumber = {};

  Object.keys(data).forEach(k => {
    data[k].forEach(a => {
      let [num, w, ord] = a;
      toCardinal[ord] = w;
      toOrdinal[w] = ord;
      toNumber[w] = num;
    });
  });

  const isMultiple = new Set(data.multiples.map(a => a[1]));

  // misc
  toNumber.ein = 1; // eins - ein
  toNumber.hunderteins = 101;
  toCardinal.siebte = 'sieben';
  toCardinal.hunderterste = 'hunderteins';
  toOrdinal.hunderteins = 'hunderterste';

  const parseNumbers = function (terms = []) {
    let sum = 0;
    let carry = 0;
    let minus = false;

    let words = terms[0].splits || [];
    // console.log(words)
    let tags = terms[0].tags;
    for (let i = 0; i < words.length; i += 1) {
      let w = words[i];

      if (w === 'minus') {
        minus = true;
        continue
      }
      // ...  [ein][und][zwanzig]   
      if (w === 'und') {
        continue
      }
      // 'huitieme'
      if (tags.has('Ordinal')) {
        w = toCardinal[w] || w;
      }
      // 'hundert'
      if (isMultiple.has(w)) {
        let mult = toNumber[w] || 1;
        if (carry === 0) {
          carry = 1;
        }
        sum += mult * carry;
        carry = 0;
        continue
      }
      // 'fünf'
      if (toNumber.hasOwnProperty(w)) {
        carry += toNumber[w];
        // console.log(w, carry)
      }

    }
    // include any remaining
    if (carry !== 0) {
      sum += carry;
    }
    // make it all negative
    if (minus === true) {
      sum *= -1;
    }
    return sum
  };
  var fromText = parseNumbers;

  const fromNumber = function (m) {
    let str = m.text('normal').toLowerCase();
    str = str.replace(/(e|er)$/, '');
    let hasComma = false;
    if (/,/.test(str)) {
      hasComma = true;
      str = str.replace(/,/g, '');
    }
    // get prefix/suffix
    let arr = str.split(/([0-9.,]*)/);
    let [prefix, num] = arr;
    let suffix = arr.slice(2).join('');
    if (num !== '' && m.length < 2) {
      num = Number(num || str);
      //ensure that num is an actual number
      if (typeof num !== 'number') {
        num = null;
      }
      // strip an ordinal off the suffix
      if (suffix === 'e' || suffix === 'er') {
        suffix = '';
      }
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
    }
  };

  const parseNumber = function (m) {
    let terms = m.docs[0];
    let num = null;
    let prefix = '';
    let suffix = '';
    let hasComma = false;
    let isText = m.has('#TextValue');
    if (isText) {
      num = fromText(terms);
    } else {
      let res = fromNumber(m);
      prefix = res.prefix;
      suffix = res.suffix;
      num = res.num;
      hasComma = res.hasComma;
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
      isText,
      isOrdinal: m.has('#Ordinal'),
      isFraction: m.has('#Fraction'),
      isMoney: m.has('#Money'),
    }
  };
  var parse = parseNumber;

  let tens = data.tens.reverse();
  let teens = data.teens.reverse();
  let ones = data.ones.reverse();
  let hundreds = data.hundreds.reverse();


  const doThousands = function (num) {
    let words = [];
    // hunderttausend
    if (num >= 100000) {
      for (let i = 0; i < ones.length; i += 1) {
        if (num >= ones[i][0] * 100000) {
          let found = ones[i][0] === 1 ? 'ein' : ones[i][1];
          words.push(found);
          words.push('hunderttausend');
          num -= teens[i][0] * 100000;
        }
      }
    }
    // eleven-thousand...
    if (num >= 10000) {
      for (let i = 0; i < teens.length; i += 1) {
        if (num >= teens[i][0] * 1000) {
          words.push(teens[i][1]);
          words.push('tausend');
          num -= teens[i][0] * 1000;
        }
      }
    }
    // dreitausend, viertausend...
    for (let i = 0; i < ones.length; i += 1) {
      if (num >= ones[i][0] * 1000) {
        let found = ones[i][0] === 1 ? 'ein' : ones[i][1];
        return [found, 'tausend']
      }
    }
    return words
  };

  const doHundreds = function (num) {
    let words = [];
    for (let i = 0; i < hundreds.length; i += 1) {
      if (num >= hundreds[i][0]) {
        words.push(hundreds[i][1]);
        num -= hundreds[i][0];
        break
      }
    }
    return words
  };

  // 23 -> '[drei][und][zwanzig]'
  const twoDigit = function (num) {
    let words = [];
    // ninety, eighty ...
    for (let i = 0; i < tens.length; i += 1) {
      if (num >= tens[i][0]) {
        words.push(tens[i][1]);
        num -= tens[i][0];
      }
    }
    // found nothing? look for teens
    if (words.length === 0) {
      for (let i = 0; i < teens.length; i += 1) {
        if (num === teens[i][0]) {
          return [teens[i][1]] //these don't combine
        }
      }
    }
    // look for ones to add on
    for (let i = 0; i < ones.length; i += 1) {
      if (num === ones[i][0]) {
        // drei und zwanzig
        if (words.length === 1) {
          // use '[ein][und][zwanzig]', not 'eins..'
          let found = ones[i][0] === 1 ? 'ein' : ones[i][1];
          return [found, 'und', words[0]]
        }
        // just 'drei'
        if (words.length === 0) {
          return [ones[i][1]]
        }
      }
    }
    return words
  };


  // turn 130 into '[ein][hundert][dreißig]'
  const toText = function (num) {
    let words = [];
    if (num === 0) {
      return ['null']
    }
    if (num < 0) {
      words.push('moins');
      num = Math.abs(num);
    }
    // do '[sieben][tausend]'
    if (num >= 1000) {
      let res = doThousands(num);
      words = words.concat(res);
      num %= 1000;
    }
    // do '[zwei][hundert]'
    if (num >= 100) {
      let res = doHundreds(num);
      words = words.concat(res);
      num %= 100;
    }
    // do '[drei][und][zwanzig]'
    if (num > 0) {
      words = words.concat(twoDigit(num));
    }
    return words
  };
  var toText$1 = toText;

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      let words = toText$1(parsed.num);
      let last = words[words.length - 1];
      words[words.length - 1] = toOrdinal[last];
      return words.join('')
    }
    if (fmt === 'TextCardinal') {
      return toText$1(parsed.num).join('')
    }
    // numeric formats
    // '55e'
    if (fmt === 'Ordinal') {
      let str = String(parsed.num);
      return str += '.'
    }
    if (fmt === 'Cardinal') {
      return String(parsed.num)
    }
    return String(parsed.num || '')
  };
  var format = formatNumber;

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$6 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parse)
      }
      get(n) {
        return getNth$3(this, n).map(parse).map(o => o.num)
      }
      json(n) {
        let doc = getNth$3(this, n);
        return doc.map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parse(p);
          json.number = {
            prefix: parsed.prefix,
            num: parsed.num,
            suffix: parsed.suffix,
            hasComma: parsed.hasComma,
          };
          return json
        }, [])
      }
      /** any known measurement unit, for the number */
      units() {
        return this.growRight('#Unit').match('#Unit$')
      }
      /** return only ordinal numbers */
      isOrdinal() {
        return this.if('#Ordinal')
      }
      /** return only cardinal numbers*/
      isCardinal() {
        return this.if('#Cardinal')
      }

      /** convert to numeric form like '8' or '8th' */
      toNumber() {
        let m = this.if('#TextValue');
        let res = m.map(val => {
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('NumericValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert to numeric form like 'eight' or 'eighth' */
      toText() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('TextValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert ordinal to cardinal form, like 'eight', or '8' */
      toCardinal() {
        let m = this;
        let res = m.map(val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Cardinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert cardinal to ordinal form, like 'eighth', or '8th' */
      toOrdinal() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#Ordinal')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Ordinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }

      /** return only numbers that are == n */
      isEqual(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parse(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format(obj, fmt);
          // add commas to number
          if (obj.hasComma && fmt === 'Cardinal') {
            str = Number(str).toLocaleString();
          }
          if (str) {
            val = val.not('#Currency');
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      add(n) {
        if (!n) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parse(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** decrease each number by n*/
      subtract(n, agree) {
        return this.add(n * -1, agree)
      }
      /** increase each number by 1 */
      increment(agree) {
        return this.add(1, agree)
      }
      /** decrease each number by 1 */
      decrement(agree) {
        return this.add(-1, agree)
      }
      // overloaded - keep Numbers class
      update(pointer) {
        let m = new Numbers(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    // aliases
    Numbers.prototype.isBetween = Numbers.prototype.between;
    Numbers.prototype.minus = Numbers.prototype.subtract;
    Numbers.prototype.plus = Numbers.prototype.add;
    Numbers.prototype.equals = Numbers.prototype.isEqual;

    View.prototype.numbers = function (n) {
      let m = this.match('#Value+');
      // most numbers are 1-term
      // but very-large numbers get broken up 'zwei Millionen eins'
      if (!m.has('(million|millionen|milliarde)')) {
        m = m.terms();
      }
      // make sure splitter has run
      m.compute('splitter');
      m = getNth$3(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };
  var api$7 = api$6;

  var numbers = {
    api: api$7
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$2 = function (m) {
    let r = m.not('(#Adverb|#Auxiliary|#Modal)');
    r = r.eq(0).compute('root');
    return r.text('root')
  };

  const api$4 = function (View) {
    class Verbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Verbs';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.verb;
        const { toPresent, toPast, toSubjunctive1, toSubjunctive2, toImperative, toPastParticiple, toPresentParticiple } = methods;
        return getNth$2(this, n).map(m => {
          let str = getRoot$2(m);
          return {
            infinitive: str,
            presentTense: toPresent(str),
            pastTense: toPast(str),
            subjunctive1: toSubjunctive1(str),
            subjunctive2: toSubjunctive2(str),
            imperative: toImperative(str),
            pastParticiple: toPastParticiple(str),
            presentParticiple: toPresentParticiple(str)
          }
        }, [])
      }
    }

    View.prototype.verbs = function (n) {
      let m = this.match('#Verb+');
      m = getNth$2(m, n);
      return new Verbs(this.document, m.pointer)
    };
  };
  var api$5 = api$4;

  var verbs = {
    api: api$5,
  };

  const getNth$1 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$1 = function (m) {
    m = m.eq(0).compute('root');
    return m.text('root')
  };

  const api$2 = function (View) {
    class Adjectives extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Adjectives';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.adjective;
        const { inflect, toRoot } = methods;
        return getNth$1(this, n).map(m => {
          let str = getRoot$1(m);
          let root = toRoot(str) || str;
          let res = inflect(root);
          res.infinitive = root;
          return res
        }, [])
      }
    }

    View.prototype.adjectives = function (n) {
      let m = this.match('#Adjective');
      m = getNth$1(m, n);
      return new Adjectives(this.document, m.pointer)
    };
  };
  var api$3 = api$2;

  var adjectives = {
    api: api$3,
  };

  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of noun
  const getRoot = function (m) {
    m = m.eq(0).compute('root');
    return m.text('root')
  };

  const api = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.noun;
        const { inflect, toRoot } = methods;
        return getNth(this, n).map(m => {
          let str = getRoot(m);
          let root = toRoot(str) || str;
          return {
            plural: inflect(root).one,
            singular: root
          }
        }, [])
      }
    }

    View.prototype.nouns = function (n) {
      let m = this.match('#Noun+');
      m = getNth(m, n);
      return new Nouns(this.document, m.pointer)
    };
  };
  var api$1 = api;

  var nouns = {
    api: api$1,
  };

  var version = '0.0.10';

  nlp$1.plugin(tokenizer);
  nlp$1.plugin(tagset);
  nlp$1.plugin(lexicon);
  nlp$1.plugin(tagger);
  nlp$1.plugin(postTagger);
  nlp$1.plugin(splitter);
  nlp$1.plugin(numbers);
  nlp$1.plugin(verbs);
  nlp$1.plugin(adjectives);
  nlp$1.plugin(nouns);

  const de = function (txt, lex) {
    let dok = nlp$1(txt, lex);
    return dok
  };

  // copy constructor methods over
  Object.keys(nlp$1).forEach(k => {
    if (nlp$1.hasOwnProperty(k)) {
      de[k] = nlp$1[k];
    }
  });

  // this one is hidden
  Object.defineProperty(de, '_world', {
    value: nlp$1._world,
    writable: true,
  });
  /** log the decision-making to console */
  de.verbose = function (set) {
    let env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  de.version = version;

  return de;

}));
