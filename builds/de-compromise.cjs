(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.deCompromise = factory());
})(this, (function () { 'use strict';

  const methods$n = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  const model$8 = {
    one: {},
    two: {},
    three: {},
  };
  const compute$8 = {};
  const hooks = [];

  var tmpWrld = { methods: methods$n, model: model$8, compute: compute$8, hooks };

  const isArray$a = input => Object.prototype.toString.call(input) === '[object Array]';

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
      else if (isArray$a(input)) {
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

  // wrappers for loops in javascript arrays

  const forEach = function (cb) {
    const ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      const view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    const ptrs = this.fullPointer;
    const res = ptrs.map((ptr, i) => {
      const view = this.update([ptr]);
      const out = cb(view, i);
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
      const view = this.update([ptr]);
      return cb(view, i)
    });
    const res = this.update(ptrs);
    return res
  };

  const find$1 = function (cb) {
    const ptrs = this.fullPointer;
    const found = ptrs.find((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    const ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      const view = this.update([ptr]);
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
  var loops = { forEach, map, filter, find: find$1, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      const m = this.match('.');
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
      const res = {};
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
      const n = this.fullPointer.length - 1;
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
      const ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
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
      const aPtr = this.fullPointer;
      const bPtr = b.fullPointer;
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
      const ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      // must start at beginning
      if (ptrs.length === 0 || ptrs[0][0] !== 0) {
        return false
      }
      let wantTerms = 0;
      let haveTerms = 0;
      this.document.forEach(terms => wantTerms += terms.length);
      this.docs.forEach(terms => haveTerms += terms.length);
      return wantTerms === haveTerms
      // for (let i = 0; i < ptrs.length; i += 1) {
      //   let [n, start, end] = ptrs[i]
      //   // it's not the start
      //   if (n !== i || start !== 0) {
      //     return false
      //   }
      //   // it's too short
      //   if (document[n].length > end) {
      //     return false
      //   }
      // }
      // return true
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

  const methods$m = Object.assign({}, utils, fns$4, loops);

  // aliases
  methods$m.get = methods$m.eq;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      const props = [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View'],
      ];
      props.forEach(a => {
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
      const { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      const pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        // eslint-disable-next-line prefer-const
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
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer && pointer.length > 0) {
        // only keep cache if it's a full-sentence
        const cache = [];
        pointer.forEach((ptr, i) => {
          const [n, start, end] = ptr;
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
      const document = methods.one.tokenize.fromString(input, this.world);
      const doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'freeze', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      doc.compute('unfreeze');
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0); //node 17: structuredClone(document);
      document = document.map(terms => {
        return terms.map(term => {
          term = Object.assign({}, term);
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      const m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, methods$m);

  var version$1 = '14.16.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isArray$9 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const isUnsafeKey = key => key === '__proto__' || key === 'constructor' || key === 'prototype';

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        // prevent prototype pollution
        if (isUnsafeKey(key)) {
          continue
        }
        if (isObject$6(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
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
      if (isUnsafeKey(key)) continue
      model[key] = model[key] || {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const addIrregulars = function (model, conj) {
    const m = model.two.models || {};
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
    // support array of plugins
    if (isArray$9(plugin)) {
      plugin.forEach(p => extend(p, world, View, nlp));
      return
    }
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
      Object.keys(plugin.lib).forEach(k => (nlp[k] = plugin.lib[k]));
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.frozen) {
      nlp.addWords(plugin.frozen, true);
    }
    if (plugin.mutate) {
      plugin.mutate(world, nlp);
    }
  };

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
    const doc = new View([]);
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
      const document = methods.one.tokenize.fromString(input, world);
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
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = Object.assign({}, tmpWrld);

  const nlp = function (input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
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
    const doc = inputs(input, View, world);
    // give contractions a shot, at least
    if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend(plugin, this._world, View, this);
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

  const createCache = function (document) {
    const cache = document.map(terms => {
      const items = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          items.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          items.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          items.add(term.implicit);
        }
        if (term.machine) {
          items.add(term.machine);
        }
        if (term.root) {
          items.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => items.add(str));
        }
        const tags = Array.from(term.tags);
        for (let t = 0; t < tags.length; t += 1) {
          items.add('#' + tags[t]);
        }
      });
      return items
    });
    return cache
  };

  var methods$l = {
    one: {
      cacheDoc: createCache,
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

  var compute$7 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: addAPI$3,
    compute: compute$7,
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
  const isTitleCase$3 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase$1 = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase$1 = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      const args = [index, 0].concat(child);
      Array.prototype.splice.apply(parent, args);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms[terms.length - 1];
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)–—'"]/g;
    const wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    const post = wasLast.post;
    if (juicy.test(post)) {
      const punct = post.match(juicy).join(''); //not perfect
      const last = needle[needle.length - 1];
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };


  const moveTitleCase = function (home, start, needle) {
    const from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$3(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase$1(needle[0].text);
    // should we un-titlecase the old word?
    const old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$3(old.text) && old.text.length > 1) {
      old.text = toLowerCase$1(old.text);
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    const [n, start, end] = ptr;
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
    const [n, , end] = ptr;
    const total = (document[n] || []).length;
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
  let index$1 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$1 += 1;

    //don't overflow index
    index$1 = index$1 > 46655 ? 0 : index$1;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$1.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    const r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$1 = function (m) {
    if (m.has('@hasContraction') && typeof m.contractions === 'function') {
      //&& m.after('^.').has('@hasContraction')
      const more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$7 = arr => Object.prototype.toString.call(arr) === '[object Array]';

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map(term => {
      term.id = toId(term);
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
    const ptrs = view.fullPointer;
    const selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      const ptr = m.fullPointer[0];
      const [n] = ptr;
      // add-in the words
      const home = document[n];
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
    const doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['id', 'index', 'freeze', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
    doc.compute('unfreeze');
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

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  // case logic
  const isTitleCase$2 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn, keep) {
    main.forEach(m => {
      const out = fn(m);
      m.replaceWith(out, keep);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    const groups = main.groups();
    input = input.replace(dollarStub, a => {
      const num = a.replace(/\$/, '');
      if (groups.hasOwnProperty(num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$2.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    // support keep-all option
    if (keep === true) {
      keep = {
        tags: true,
        case: true,
        possessives: true,
      };
    }
    const main = this;
    this.uncache();
    if (typeof input === 'function') {
      return replaceByFn(main, input, keep)
    }
    const terms = main.docs[0];
    if (!terms) return main
    const isOriginalPossessive = keep.possessives && terms[terms.length - 1].tags.has('Possessive');
    const isOriginalTitleCase = keep.case && isTitleCase$2(terms[0].text);
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    const original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    const originalPre = original.docs[0][0].pre;
    const originalPost = original.docs[0][original.docs[0].length - 1].post;
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      const more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.

    // keep "John's"
    if (isOriginalPossessive) {
      const tmp = main.docs[0];
      const term = tmp[tmp.length - 1];
      if (!term.tags.has('Possessive')) {
        term.text += "'s";
        term.normal += "'s";
        term.tags.add('Possessive');
      }
    }

    // try to keep some pre-punctuation
    if (originalPre && main.docs[0]) {
      main.docs[0][0].pre = originalPre;
    }
    // try to keep any post-punctuation
    if (originalPost && main.docs[0]) {
      const lastOne = main.docs[0][main.docs[0].length - 1];
      if (!lastOne.post.trim()) {
        lastOne.post = originalPost;
      }
    }
    // what should we return?
    const m = main.toView(ptrs).compute(['index', 'freeze', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
    m.compute('unfreeze');
    // replace any old tags
    if (keep.tags) {
      // truncate old tags to only touch new terms
      oldTags = oldTags.slice(0, input.wordCount());
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }

    if (!m.docs[0] || !m.docs[0][0]) return m

    // try to co-erce case, too
    if (keep.case) {
      const transformCase = isOriginalTitleCase ? toTitleCase : toLowerCase;
      m.docs[0][0].text = transformCase(m.docs[0][0].text);
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    const m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
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
      const [n, start, end] = ptr;
      const len = end - start;
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
          const terms = document[i - 1];
          const lastTerm = terms[terms.length - 1];
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

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      const [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        const len = no[2] - no[1];
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
      const isFull = !self.ptrs;
      // is it part of a contraction?
      if (not.has('@hasContraction') && not.contractions) {
        const more = not.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      const nots = not.fullPointer.reverse();
      // remove them from the actual document)
      const document = pluckOut(this.document, nots);
      // repair our pointers
      const gonePtrs = indexN(nots);
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
      const res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$j.delete = methods$j.remove;

  const methods$i = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        const term = terms[0];
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
        const last = this.docs[this.docs.length - 1];
        return last[last.length - 1].post
      }
      this.docs.forEach(terms => {
        const term = terms[terms.length - 1];
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
      const docs = this.docs;
      const start = docs[0][0];
      start.pre = start.pre.trimStart();
      const last = docs[docs.length - 1];
      const end = last[last.length - 1];
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
        const last = terms[terms.length - 1];
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
        const last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },
  };

  // aliases
  methods$i.deHyphenate = methods$i.dehyphenate;
  methods$i.toQuotation = methods$i.toQuotations;

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
    const left = a.normal.trim().length;
    const right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$1 = (a, b) => {
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
    const counts = {};
    arr.forEach(o => {
      counts[o.normal] = counts[o.normal] || 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      const left = counts[a.normal];
      const right = counts[b.normal];
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

  var methods$h = { alpha, length, wordCount: wordCount$1, sequential, byFreq };

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
    const { docs, pointer } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input = input || 'alpha';
    const ptrs = pointer || docs.map((_d, n) => [n]);
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
  const reverse$1 = function () {
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
    const already = new Set();
    const res = this.filter(m => {
      const txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$1, sort };

  const isArray$6 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs[homeDocs.length - 1];
      const last = end[end.length - 1];
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
      const ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    const ptrs = input.fullPointer;
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
        const more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          const ptrs = this.fullPointer;
          const at = ptrs[ptrs.length - 1][0];
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
        const docs = combineDocs(this.document, input);
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

  const methods$g = Object.assign({}, caseFns, fns$3, fns$2, methods$j, methods$i, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };

  const compute$6 = {
    id: function (view) {
      const docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          const term = docs[n][i];
          term.id = term.id || toId(term);
        }
      }
    }
  };

  var change = {
    api: addAPI$2,
    compute: compute$6,
  };

  var contractions$2 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'arent', out: ['are', 'not'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
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
    // shoulda, coulda
    { word: 'shoulda', out: ['should', 'have'] },
    { word: 'coulda', out: ['coulda', 'have'] },
    { word: 'woulda', out: ['woulda', 'have'] },
    { word: 'musta', out: ['must', 'have'] },

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

    // missing apostrophes
    { word: 'shouldnt', out: ['should', 'not'] },
    { word: 'couldnt', out: ['could', 'not'] },
    { word: 'wouldnt', out: ['would', 'not'] },
    { word: 'hasnt', out: ['has', 'not'] },
    { word: 'wasnt', out: ['was', 'not'] },
    { word: 'isnt', out: ['is', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },
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
      contractions: contractions$2,
      numberSuffixes
    }
  };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    const [n, w] = point;
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
    const before = terms[i].normal.split(hasContraction$1)[0];

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

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    const before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  const hasContraction = /'/;
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
  // l'amour
  const preL = (terms, i) => {
    // le/la
    const after = terms[i].normal.split(hasContraction)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
    // quick guess for noun-agreement (rough)
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
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
    const term = terms[i];
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

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/; //(must be lowercase)

  const numberUnit = function (terms, i, world) {
    const notUnit = world.model.one.numberSuffixes || {};
    const term = terms[i];
    const parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      const unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (notUnit.hasOwnProperty(unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    const tmp = view.update();
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
    t: (terms, i) => apostropheT(terms, i),
    // how'd
    d: (terms, i) => _apostropheD(terms, i),
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
      const o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before && after && after.length > 2) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs = function (words, view) {
    const doc = view.fromText(words.join(' '));
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
  const contractions$1 = view => {
    const { world, document } = view;
    const { model, methods } = world;
    const list = model.one.contractions || [];
    // let units = new Set(model.one.units || [])
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          const res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
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
          insertContraction(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = toDocs(words, view);
            insertContraction(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit(terms, i, world);
        if (words) {
          words = toDocs(words, view);
          insertContraction(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
    });
  };

  var compute$5 = { contractions: contractions$1 };

  const plugin = {
    model: model$7,
    compute: compute$5,
    hooks: ['contractions'],
  };

  const freeze$1 = function (view) {
    const world = view.world;
    const { model, methods } = view.world;
    const setTag = methods.one.setTag;
    const { frozenLex } = model.one;
    const multi = model.one._multiCache || {};

    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        // basic lexicon lookup
        const t = terms[i];
        const word = t.machine || t.normal;

        // test a multi-word
        if (multi[word] !== undefined && terms[i + 1]) {
          const end = i + multi[word] - 1;
          for (let k = end; k > i; k -= 1) {
            const words = terms.slice(i, k + 1);
            const str = words.map(term => term.machine || term.normal).join(' ');
            // lookup frozen lexicon
            if (frozenLex.hasOwnProperty(str) === true) {
              setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
              words.forEach(term => (term.frozen = true));
              continue
            }
          }
        }
        // test single word
        if (frozenLex[word] !== undefined && frozenLex.hasOwnProperty(word)) {
          setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
          t.frozen = true;
          continue
        }
      }
    });
  };

  const unfreeze = function (view) {
    view.docs.forEach(ts => {
      ts.forEach(term => {
        delete term.frozen;
      });
    });
    return view
  };
  var compute$4 = { frozen: freeze$1, freeze: freeze$1, unfreeze };

  /* eslint-disable no-console */
  const blue = str => '\x1b[34m' + str + '\x1b[0m';
  const dim = str => '\x1b[3m\x1b[2m' + str + '\x1b[0m';

  const debug$2 = function (view) {
    view.docs.forEach(terms => {
      console.log(blue('\n  ┌─────────'));
      terms.forEach(t => {
        let str = `  ${dim('│')}  `;
        const txt = t.implicit || t.text || '-';
        if (t.frozen === true) {
          str += `${blue(txt)} ❄️`;
        } else {
          str += dim(txt);
        }
        console.log(str);
      });
    });
  };

  var freeze = {
    // add .compute('freeze')
    compute: compute$4,

    mutate: world => {
      const methods = world.methods.one;
      // add @isFrozen method
      methods.termMethods.isFrozen = term => term.frozen === true;
      // adds `.debug('frozen')`
      methods.debug.freeze = debug$2;
      methods.debug.frozen = debug$2;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        this.docs.forEach(ts => {
          ts.forEach(term => {
            term.frozen = true;
          });
        });
        return this
      };
      // reset all terms to allow  any desctructive tags
      View.prototype.unfreeze = function () {
        this.compute('unfreeze');
      };
      // return all frozen terms
      View.prototype.isFrozen = function () {
        return this.match('@isFrozen+')
      };
    },
    // run it in init
    hooks: ['freeze'],
  };

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const multiWord = function (terms, start_i, world) {
    const { model, methods } = world;
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const { lexicon } = model.one || {};
    const t = terms[start_i];
    const word = t.machine || t.normal;

    // found a word to scan-ahead on
    if (multi[word] !== undefined && terms[start_i + 1]) {
      const end = start_i + multi[word] - 1;
      for (let i = end; i > start_i; i -= 1) {
        const words = terms.slice(start_i, i + 1);
        if (words.length <= 1) {
          return false
        }
        const str = words.map(term => term.machine || term.normal).join(' ');
        // lookup regular lexicon
        if (lexicon.hasOwnProperty(str) === true) {
          const tag = lexicon[str];
          setTag(words, tag, world, false, '1-multi-lexicon');
          // special case for phrasal-verbs - 2nd word is a #Particle
          if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
            setTag([words[1]], 'Particle', world, false, '1-phrasal-particle');
          }
          return true
        }
      }
      return false
    }
    return null
  };

  const prefix$1 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const { lexicon } = model.one;

    // basic lexicon lookup
    const t = terms[i];
    const word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$1.test(word) === true) {
      const stem = word.replace(prefix$1, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          return true
        }
      }
    }
    return null
  };

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const lexicon$4 = function (view) {
    const world = view.world;
    // loop through our terms
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found = found || multiWord(terms, i, world);
          // lookup known words
          found = found || checkLexicon(terms, i, world);
        }
      }
    });
  };

  var compute$3 = {
    lexicon: lexicon$4,
  };

  // derive clever things from our lexicon key-value pairs
  const expand = function (words) {
    // const { methods, model } = world
    const lex = {};
    // console.log('start:', Object.keys(lex).length)
    const _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      const tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      const split = word.split(/ /);
      if (split.length > 1) {
        // prefer longer ones
        if (_multi[split[0]] === undefined || split.length > _multi[split[0]]) {
          _multi[split[0]] = split.length;
        }
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };

  var methods$f = {
    one: {
      expandLexicon: expand,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords$1 = function (words, isFrozen = false) {
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
    // these words go into a seperate lexicon
    if (isFrozen === true) {
      const { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one._multiCache, _multi);
      Object.assign(model.one.frozenLex, lex);
      return
    }
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      const { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    }
    // do basic ./one version
    const { lex, _multi } = methods.one.expandLexicon(words, world);
    Object.assign(model.one.lexicon, lex);
    Object.assign(model.one._multiCache, _multi);
  };

  var lib$5 = { addWords: addWords$1 };

  const model$6 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
      frozenLex: {}, //2nd lexicon
    },
  };

  var lexicon$3 = {
    model: model$6,
    methods: methods$f,
    compute: compute$3,
    lib: lib$5,
    hooks: ['lexicon'],
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$1 = function (phrase, world) {
    const { methods, model } = world;
    const terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    const goNext = [{}];
    const endAs = [null];
    const failTo = [0];

    const xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      const words = tokenize$1(phrase, world);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
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
    for (const word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !goNext[n].hasOwnProperty(word)) {
          n = failTo[n];
        }
        if (goNext.hasOwnProperty(n)) {
          const fs = goNext[n][word];
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

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    const results = [];
    for (let i = 0; i < terms.length; i++) {
      const word = terms[i][opts.form] || terms[i].normal;
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
        const arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          const len = arr[o];
          const term = terms[i - len + 1];
          const [no, start] = term.index;
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
    const docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    const firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      const terms = docs[i];
      const found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$6 (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      const trie = isObject$4(input) ? input : buildTrie(input, this.world);
      let res = scan(this, trie, opts);
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

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = buildTrie(input, this.world());
      return compress(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$6,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      const n = ptr[0];
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
    let { ptrs } = res;
    const { byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  // turn any matchable input intp a list of matches
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

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;

  const match$1 = function (regs, group, opts) {
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
    const todo = { regs, group };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
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
    const todo = { regs, group, justOne: true };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      const ptrs = this.intersection(regs).fullPointer;
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const ptrs = one.match(this.docs, todo, this._cache).ptrs;
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
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m) //recurse with result
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    const cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      const m = this.update([ptr]);
      const res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    const view = this.update(ptrs);
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
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    const cache = this._cache || [];
    const view = this.filter((m, i) => {
      const todo = { regs, group, justOne: true };
      const ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$2 = { matchOne, match: match$1, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const pre = [];
    const byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      const first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    const preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const post = [];
    const byN = indexN(this.fullPointer);
    const document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      const last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      const [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    const postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[regs.length - 1].end = true; // ensure matches are beside us ←
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.before(regs, group);
      if (more.found) {
        const terms = more.terms();
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
    regs[0].start = true; // ensure matches are beside us →
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.after(regs, group);
      if (more.found) {
        const terms = more.terms();
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

  const getDoc$2 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$5(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
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
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
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
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    // repair matches to favor [match, after]
    // - instead of [before, match]
    for (let i = 0; i < all.length; i += 1) {
      // move a before to a preceding after
      if (!all[i].after && all[i + 1] && all[i + 1].before) {
        // ensure it's from the same original sentence
        if (all[i].match && all[i].match[0] === all[i + 1].before[0]) {
          all[i].after = all[i + 1].before;
          delete all[i + 1].before;
        }
      }
    }

    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      // a, [x, b]
      if (o.match && o.after) {
        res.push(combine(o.match, o.after));
      } else {
        // a, [x], b
        res.push(o.match);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$e.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
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

  // check if two pointers are perfectly consecutive
  const isNeighbour = function (ptrL, ptrR) {
    // validate
    if (!ptrL || !ptrR) {
      return false
    }
    // same sentence
    if (ptrL[0] !== ptrR[0]) {
      return false
    }
    // ensure R starts where L ends
    return ptrL[2] === ptrR[1]
  };

  // join two neighbouring words, if they both match
  const mergeIf = function (doc, lMatch, rMatch) {
    const world = doc.world;
    const parseMatch = world.methods.one.parseMatch;
    lMatch = lMatch || '.$'; //defaults
    rMatch = rMatch || '^.';
    const leftMatch = parseMatch(lMatch, {}, world);
    const rightMatch = parseMatch(rMatch, {}, world);
    // ensure end-requirement to left-match, start-requiremnts to right match
    leftMatch[leftMatch.length - 1].end = true;
    rightMatch[0].start = true;
    // let's get going.
    const ptrs = doc.fullPointer;
    const res = [ptrs[0]];
    for (let i = 1; i < ptrs.length; i += 1) {
      const ptrL = res[res.length - 1];
      const ptrR = ptrs[i];
      const left = doc.update([ptrL]);
      const right = doc.update([ptrR]);
      // should we marge left+right?
      if (isNeighbour(ptrL, ptrR) && left.has(leftMatch) && right.has(rightMatch)) {
        // merge right ptr into existing result
        res[res.length - 1] = [ptrL[0], ptrL[1], ptrR[2], ptrL[3], ptrR[4]];
      } else {
        res.push(ptrR);
      }
    }
    // return new pointers
    return doc.update(res)
  };

  const methods$d = {
    //  merge only if conditions are met
    joinIf: function (lMatch, rMatch) {
      return mergeIf(this, lMatch, rMatch)
    },
    // merge all neighbouring matches
    join: function () {
      return mergeIf(this)
    },
  };

  const methods$c = Object.assign({}, match$2, lookaround, methods$e, methods$d);
  // aliases
  methods$c.lookBehind = methods$c.before;
  methods$c.lookBefore = methods$c.before;

  methods$c.lookAhead = methods$c.after;
  methods$c.lookAfter = methods$c.after;

  methods$c.notIf = methods$c.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$c);
  };

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
    const arr = txt.split(bySlashes);
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
  const titleCase = str => str.charAt(0).toUpperCase() + str.substring(1);
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
    const obj = {};
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
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
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
        const last = obj.choices.length - 1;
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
          const split = obj.root.split(/\//);
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
        obj.chunk = titleCase(w);
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
      obj.tag = titleCase(obj.tag);
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

  const hasDash$2 = /[a-z0-9][-–—][a-z]/i;

  // match 're-do' -> ['re','do']
  const splitHyphens$1 = function (regs, world) {
    const prefixes = world.model.one.prefixes;
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasDash$2.test(reg.word)) {
        let words = reg.word.split(/[-–—]/g);
        // don't split 're-cycle', etc
        if (prefixes.hasOwnProperty(words[0])) {
          continue
        }
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = Object.assign({}, reg);
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };

  // add all conjugations of this verb
  const addVerbs = function (token, world) {
    const { all } = world.methods.two.transform.verb || {};
    const str = token.root;
    if (!all) {
      return []
    }
    return all(str, world.model)
  };

  // add all inflections of this noun
  const addNoun = function (token, world) {
    const { all } = world.methods.two.transform.noun || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // add all inflections of this adjective
  const addAdjective = function (token, world) {
    const { all } = world.methods.two.transform.adjective || {};
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
        const shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          const reg = block[0];
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
    let tokens = parseBlocks(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts));
    // '~re-do~'
    tokens = splitHyphens$1(tokens, world);
    // '{walk}'
    tokens = inflectRoot(tokens, world);
    //clean up anything weird
    tokens = postProcess(tokens);
    // console.log(tokens)
    return tokens
  };

  const anyIntersection = function (setA, setB) {
    for (const elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      const reg = regs[i];
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

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    const aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    const limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    const matrix = [];
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
        const shouldUpdate =
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
    const length = Math.max(strA.length, strB.length);
    const relative = length === 0 ? 0 : steps / length;
    const similarity = 1 - relative;
    return similarity
  };

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
  // const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1

  const methods$b = {
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
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…'),
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
  methods$b.hasQuotation = methods$b.hasQuote;

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
        const score = fuzzyMatch(reg.word, term.normal);
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
      if (typeof methods$b[reg.method] === 'function' && methods$b[reg.method](term) === true) {
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
      const str = term.root || term.implicit || term.machine || term.normal;
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
    const result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    const reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      //stop for next-reg match
      if (endReg && wrapMatch(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        return state.t
      }
      const count = state.t - start + 1;
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
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
      if (wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
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
        const tmpReg = Object.assign({}, reg, { end: false });
        if (wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$1 = function (state, term_index) {
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
    const { regs } = state;
    const reg = regs[state.r];

    const skipto = greedyTo(state, regs[state.r + 1]);
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
      const g = getGroup$1(state, state.t);
      g.length = skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock = function (state, skipN = 0) {
    const block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      const regs = block.choices[c];
      if (!isArray$4(regs)) {
        return false
      }
      wasFound = regs.every((cr, w_index) => {
        let extra = 0;
        const t = state.t + w_index + skipN + extra;
        if (state.terms[t] === undefined) {
          return false
        }
        const foundBlock = wrapMatch(state.terms[t], cr, t + state.start_i, state.phrase_length);
        // this can be greedy - '(foo+ bar)'
        if (foundBlock === true && cr.greedy === true) {
          for (let i = 1; i < state.terms.length; i += 1) {
            const term = state.terms[t + i];
            if (term) {
              const keepGoing = wrapMatch(term, cr, state.start_i + i, state.phrase_length);
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
    const reg = state.regs[state.r];
    const allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      const allWords = block.every((cr, w_index) => {
        const tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return wrapMatch(state.terms[tryTerm], cr, tryTerm, state.phrase_length)
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
    const reg = regs[state.r];
    const skipNum = doOrBlock(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
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

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipNum = doAndBlock(state);
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length - 1;
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

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = wrapMatch(state.terms[t], reg, state.start_i + state.t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = wrapMatch(state.terms[t], nextReg, state.start_i + state.t, state.phrase_length);
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

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    // match *anything* but this term
    const tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    const found = wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (found) {
      return false//bye
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      const nextReg = regs[state.r + 1];
      if (nextReg) {
        const fNext = wrapMatch(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
        if (fNext) {
          state.r += 1;
        } else if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          const fNext2 = wrapMatch(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
          if (fNext2) {
            state.r += 2;
          }
        }
      }
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      return negGreedy(state, tmpReg, regs[state.r + 1])
    }
    state.t += 1;
    return true
  };

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const term = state.terms[state.t];
    // does the next reg match it too?
    const nextRegMatched = wrapMatch(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
    if (reg.negative || nextRegMatched) {
      // but does the next reg match the next term??
      // only skip if it doesn't
      const nextTerm = state.terms[state.t + 1];
      if (!nextTerm || !wrapMatch(nextTerm, regs[state.r + 1], state.start_i + state.t, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    const reg = regs[state.r];
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

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    const term = state.terms[state.t];
    const reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      const nextTerm = state.terms[state.t + 1];
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

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    const reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$1(state, startAt);
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
    const reg = regs[state.r];
    const term = state.terms[state.t];
    const startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip(state);
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
      const alive = greedyMatch(state);
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
    const state = {
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
      const reg = regs[state.r];
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
        const alive = doAstrix(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        const alive = orBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        const alive = andBlock(state);
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
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        // we want *anything* but this term
        const alive = doNegative(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      const hasMatch = wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    const pntr = [null, start_i, state.t + start_i];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    Object.keys(state.groups).forEach(k => {
      const o = state.groups[k];
      const start = start_i + o.start;
      groups[k] = [null, start, start + o.length];
    });
    return { pointer: pntr, groups: groups }
  };

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    const ptrs = [];
    const byGroup = {};
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

  const notIf = function (results, not, docs) {
    results = results.filter(res => {
      const [n, start, end] = res.pointer;
      const terms = docs[n].slice(start, end);
      for (let i = 0; i < terms.length; i += 1) {
        const slice = terms.slice(i);
        const found = tryHere(slice, not, i, terms.length);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n) {
    let res = tryHere(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache = cache || [];
    const { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        const slice = terms.slice(i);
        // ensure it's long-enough
        if (slice.length < minLength) {
          break
        }
        let res = tryHere(slice, regs, i, terms.length);
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
          const end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        const n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    if (todo.notIf) {
      results = notIf(results, todo.notIf, docs);
    }
    // grab the requested group
    results = getGroup(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      const [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  const methods$a = {
    one: {
      termMethods: methods$b,
      parseMatch: syntax,
      match: runMatch$1,
    },
  };

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      const killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: matchAPI,
    methods: methods$a,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = str => {
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
    const starts = {};
    const ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      const tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        const a = terms[0].id;
        starts[a] = starts[a] || [];
        starts[a].push(tag.start);
        const b = terms[terms.length - 1].id;
        ends[b] = ends[b] || [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    const { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '';
        out += t.text || '';
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
    if (opts.keepEndPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      // remove ending periods
      const last = docs[docs.length - 1];
      if (!last[last.length - 1].tags.has('Emoticon')) {
        text = text.replace(trimEnd, '');
      }
      // kill end quotations
      if (text.endsWith(`'`) && !text.endsWith(`s'`)) {
        text = text.replace(/'/, '');
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

  /* eslint-disable no-bitwise */
  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i$1 = 0;
  for (; i$1 < 64; ) {
    k[i$1] = 0 | (Math.sin(++i$1 % Math.PI) * 4294967296);
  }

  const md5 = function (s) {
    let b,
      c,
      d,
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    const h = [(b = 0x67452301), (c = 0xefcdab89), ~b, ~c],
      words = [];

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a; ) {
      words[a >> 2] |= j.charCodeAt(a) << (8 * a--);
    }

    for (i$1 = j = 0; i$1 < s; i$1 += 16) {
      a = h;

      for (
        ;
        j < 64;
        a = [
          (d = a[3]),
          b +
            (((d =
              a[0] +
              [(b & c) | (~b & d), (d & b) | (~d & c), b ^ c ^ d, c ^ (b | ~d)][(a = j >> 4)] +
              k[j] +
              ~~words[i$1 | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
              (a = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + (j++ % 4)])) |
              (d >>> -a)),
          b,
          c,
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j; ) h[--j] += a[j];
    }

    for (s = ''; j < 32; ) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s
  };
  // console.log(md5('food-safety'))

  const defaults$1 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: terms => textFromTerms(terms, { keepPunct: true }, false),
    normal: terms => textFromTerms(terms, merge(fmts.normal, { keepPunct: true }), false),
    implicit: terms => textFromTerms(terms, merge(fmts.implicit, { keepPunct: true }), false),

    machine: terms => textFromTerms(terms, opts, false),
    root: terms => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: terms => md5(textFromTerms(terms, { keepPunct: true }, false)),

    offset: terms => {
      const len = fns$1.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: terms => {
      return terms.map(t => {
        const term = Object.assign({}, t);
        term.tags = Array.from(t.tags);
        return term
      })
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: terms => terms.some(t => t.dirty === true),
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
      const res = {};
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
      const res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$9.data = methods$9.json;

  const isClientSide = () => typeof window !== 'undefined' && window.document;

  //output some helpful stuff to the console
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    // see if method name exists
    if (fmt && debugMethods.hasOwnProperty(fmt)) {
      debugMethods[fmt](this);
      return this
    }
    // log default client-side view
    if (isClientSide()) {
      debugMethods.clientSide(this);
      return this
    }
    // else, show regular server-side tags view
    debugMethods.tags(this);
    return this
  };

  const toText$1 = function (term) {
    const pre = term.pre || '';
    const post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    const starts = {};
    Object.keys(obj).forEach(reg => {
      const m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    const starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          const { fn, end } = starts[t.id];
          const m = doc.update([[n, i, end]]);
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$1(t);
        }
      }
    });
    return text
  };

  // the 'spec' output format - a clean sentence + an ordered list of top-level tags
  // designed to round-trip between compromise and LLMs (see docs/spec-format.md)

  // roots that describe a token's shape, not its part-of-speech - never picked over a real POS
  const attributeTags = new Set(['Hyphenated', 'Prefix', 'SlashedTerm']);

  // walk a tag up to its top-level (root) ancestor
  const rootOf = function (tag, tagSet) {
    const entry = tagSet[tag];
    if (!entry || !entry.parents || entry.parents.length === 0) {
      return tag
    }
    for (let i = 0; i < entry.parents.length; i += 1) {
      const p = entry.parents[i];
      if (tagSet[p] && (!tagSet[p].parents || tagSet[p].parents.length === 0)) {
        return p
      }
    }
    return entry.parents[entry.parents.length - 1]
  };

  // reduce a term's tag-set to a single top-level tag (or '-' when untagged)
  const slotForTerm = function (term, tagSet) {
    const tags = Array.from(term.tags || []);
    if (tags.length === 0) {
      return '-'
    }
    const primary = tags.find(t => !attributeTags.has(rootOf(t, tagSet))) || tags[0];
    return rootOf(primary, tagSet)
  };

  const makeAliases = function (tagSet) {
    const aliases = {};
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      if (entry.alias) {
        aliases[tag] = entry.alias;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet);
    return doc.docs.map(terms => {
      const text = terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();
      const tags = terms.map(t => {
        let tag = slotForTerm(t, tagSet);
        return aliases[tag] || tag
      }).join(',');
      return `${text} {${tags}}`
    }).join('\n')
  };

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    const obj = {};
    arr.forEach(a => {
      obj[a] = obj[a] || 0;
      obj[a] += 1;
    });
    const res = Object.keys(obj).map(k => {
      return { normal: k, count: obj[k] }
    });
    return res.sort((a, b) => (a.count > b.count ? -1 : 0))
  };

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$2(method)) {
      return wrap(this, method)
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
    // tagged-sentence format for LLMs (see docs/spec-format.md)
    if (method === 'spec') {
      return toSpec(this, this.world)
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
      const arr = this.docs.map(terms => {
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
      this.docs.forEach(terms => {
        let words = terms.map(t => t.text);
        words = words.filter(t => t);
        list = list.concat(words);
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
      return wrap(this, obj)
    },
  };

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && fmts.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt); //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepEndPunct = false;
        } else {
          opts.keepEndPunct = true;
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

  const methods$7 = Object.assign({}, methods$8, text, methods$9, html$1);

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$7);
  };

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      const terms = m.docs[0];
      const out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        const tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };

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

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!model.one.tagSet.hasOwnProperty(tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(cli.blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(cli.blue('\n  ┌─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli.yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${cli.dim(cli.i('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = cli.blue('  │ ') + cli.i(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const showChunks = function (view) {
    const { docs } = view;
    console.log('');
    docs.forEach(terms => {
      const out = [];
      terms.forEach(term => {
        if (term.chunk === 'Noun') {
          out.push(cli.blue(term.implicit || term.normal));
        } else if (term.chunk === 'Verb') {
          out.push(cli.green(term.implicit || term.normal));
        } else if (term.chunk === 'Adjective') {
          out.push(cli.yellow(term.implicit || term.normal));
        } else if (term.chunk === 'Pivot') {
          out.push(cli.red(term.implicit || term.normal));
        } else {
          out.push(term.implicit || term.normal);
        }
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const split = (txt, offset, index) => {
    const buff = index * 9; //there are 9 new chars addded to each highlight
    const start = offset.start + buff;
    const end = start + offset.length;
    const pre = txt.substring(0, start);
    const mid = txt.substring(start, end);
    const post = txt.substring(end, txt.length);
    return [pre, mid, post]
  };

  const spliceIn = function (txt, offset, index) {
    const parts = split(txt, offset, index);
    return `${parts[0]}${cli.blue(parts[1])}${parts[2]}`
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    const bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] = bySentence[ptr[0]] || [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      const full = doc.update([[Number(k)]]);
      let txt = full.text();
      const matches = doc.update(bySentence[k]);
      const json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt);
    });
    console.log('\n');
  };

  const debug = {
    tags: showTags,
    clientSide: logClientSide,
    chunks: showChunks,
    highlight: showHighlight,
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only

  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace);
    if (tags === undefined) {
      return { text, tags: [] } // no {tags} block on this line
    }
    tags = tags.split(',').map(tag => tag.trim());
    let lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    tags = tags.filter(arr => arr.some(t => t !== '')); // drop empty '{}'
    return { text, tags }
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    return tags.map(arr => {
      arr = arr.map(str => {
        return '#' + (aliases[str] || str)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // parse the adhoc output of out('spec')
  // note: this(text), not this.tokenize().compute(hooks) - tokenize already
  // splits contractions, so re-running hooks would split them twice
  const fromSpec = function (spec) {
    let cleanText = spec.split('\n').filter(line => line.trim()).map(line => {
      return parseLine(line).text
    }).join('\n');
    return this(cleanText)
  };

  // rebuild spec-formatted tag list
  const toTagList = function (tags) {
    return tags.map(arr => arr.join('|')).join(',')
  };

  // compare the tagged text output of out('spec')
  const testSpec = function (spec, verbose = true, throwError = false) {
    let world = this.world();
    let aliases = {};
    // expand tag aliases
    let tagSet = world.model.one.tagSet;
    Object.keys(tagSet).forEach(k => {
      if (tagSet[k].alias) {
        aliases[tagSet[k].alias] = k;
      }
    });
    let failingLines = spec.split('\n').filter(line => line.trim()).map(line => {
      let { text, tags } = parseLine(line);
      // parse it
      let doc = this(text);
      // make compromise-compatible match string
      let matchStr = toMatchString(tags, aliases);
      let didMatch = doc.has(matchStr);
      if (verbose !== false) {
        let char = didMatch ? '✅' : '❌';
        console.log(`${char} ${text} {${toTagList(tags)}}`); //eslint-disable-line no-console
      }
      if (didMatch === false && throwError === true) {
        throw new Error(`❌ ${text} {${toTagList(tags)}}`)
      }
      return didMatch ? null : text
    }).filter(Boolean).join('\n');
    // return a doc of only the failing lines - empty means everything passed
    return this(failingLines)
  };

  var output = {
    lib: {
      fromSpec,
      testSpec,
    },
    api: addAPI$1,
    methods: {
      one: {
        hash: md5,
        debug,
      },
    },
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    const [, startA, endA] = a;
    const [, startB, endB] = b;
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
    const byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] = byN[ref[0]] || [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    const obj = {};
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
    const [n, start] = full;
    const mStart = m[1];
    const mEnd = m[2];
    const res = {};
    // is there space before the match?
    if (start < mStart) {
      const end = mStart < full[2] ? mStart : full[2]; // find closest end-point
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
    const byN = indexN(m);
    const res = [];
    full.forEach(ptr => {
      const [n] = ptr;
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
        const found = pivotBy(carry, p);
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

  const max$1 = 20;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        const index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        const index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    const [n, start, , , endId] = ptr;
    const terms = document[n];
    // look for end-id
    const newEnd = terms.findIndex(t => t.id === endId);
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
      // eslint-disable-next-line prefer-const
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
        const wild = blindSweep(id, document, n);
        if (wild !== null) {
          const len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          const startId = terms[0] ? terms[0].id : null;
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

  // flat list of terms from nested document
  const termList = function (docs) {
    const arr = [];
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
      getDoc: getDoc$1,
      pointer: {
        indexN,
        splitAll,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    const both = a.concat(b);
    const byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      const [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      const hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      const range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };

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
    const res = [];
    const found = splitAll(refs, not);
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

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    const start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    const end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    const byN = indexN(b);
    const res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        const overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };

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
      const [n, start] = ptr;
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
    let ptrs = getUnion(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.and = methods$5.union;

  // only parts they both have
  methods$5.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$5.not = function (m) {
    m = getDoc(m, this);
    let ptrs = subtract(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.difference = methods$5.not;

  // get opposite of a match
  methods$5.complement = function () {
    const doc = this.all();
    let ptrs = subtract(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$5.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };

  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$5);
  };

  var pointers = {
    methods: methods$6,
    api: addAPI,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      const net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$5 = function (View) {

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
        const ptr = o.pointer;
        const term = docs[ptr[0]][ptr[1]];
        const len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      const ptrs = found.map(o => o.pointer);
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
    const needs = [];
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
    const wants = [];
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
              const n = getTokenNeeds(r);
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

  const parse$1 = function (matches, world) {
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
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
  };

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$1(matches, world);

    // collect by wants and needs
    const hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
    });
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      const already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (typeof already[obj.match] === 'boolean') {
          return false
        }
        already[obj.match] = true;
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      always
    }
  };

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
      const already = {};
      maybe = maybe.filter(m => {
        if (typeof already[m.match] === 'boolean') {
          return false
        }
        already[m.match] = true;
        return true
      });
      return maybe
    })
  };

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    return maybeList.map((list, n) => {
      const haves = docCache[n];
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
        const found = obj.wants.filter(str => haves.has(str)).length;
        return found >= obj.minWant
      });
      return list
    })
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match([document[n]], m);
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
            const todo = Object.assign({}, m, { pointer: ptr });
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

  const tooSmall = function (maybeList, document) {
    return maybeList.map((arr, i) => {
      const termCount = document[i].length;
      arr = arr.filter(o => {
        return termCount >= o.minWords
      });
      return arr
    })
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // collect possible matches for this document
    let maybeList = getHooks(docCache, net.hooks);
    // ensure all defined needs are met for each match
    maybeList = localTrim(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  // is this tag consistent with the tags they already have?
  const canBe$1 = function (terms, tag, model) {
    const tagSet = model.one.tagSet;
    if (!tagSet.hasOwnProperty(tag)) {
      return true
    }
    const not = tagSet[tag].not || [];
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      for (let k = 0; k < not.length; k += 1) {
        if (term.tags.has(not[k]) === true) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };

  const tagger$2 = function (list, document, world) {
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
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
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
        // quick and dirty plural tagger 😕
        if (todo.tag === 'Noun' && looksPlural) {
          const term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
          }
        }
        // allow freezing this match, too
        if (todo.freeze === true) {
          terms.forEach(term => (term.frozen = true));
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, world, todo.safe, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => (t.chunk = todo.chunk));
      }
    })
  };

  var methods$4 = {
    buildNet,
    bulkMatch: sweep$1,
    bulkTagger: tagger$2
  };

  var sweep = {
    lib: lib$2,
    api: api$5,
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
    // don't overwrite any tags, if term is frozen
    if (term.frozen === true) {
      isSafe = true;
    }
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
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
    const tags = tagString.split(isMulti);
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
    const word = terms
      .map(t => {
        return t.text || '[' + t.implicit + ']'
      })
      .join(' ');
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
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
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

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet) {
    tag = tag.trim().replace(/^#/, '');
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        continue
      }
      // for known tags, do logical dependencies first
      const known = tagSet[tag];
      // removing #Verb should also remove #PastTense
      if (known && known.children.length > 0) {
        for (let o = 0; o < known.children.length; o += 1) {
          term.tags.delete(known.children[o]);
        }
      }
      term.tags.delete(tag);
    }
  };

  // quick check if this tag will require any untagging
  const canBe = function (term, tag, tagSet) {
    if (!tagSet.hasOwnProperty(tag)) {
      return true // everything can be an unknown tag
    }
    const not = tagSet[tag].not || [];
    for (let i = 0; i < not.length; i += 1) {
      if (term.tags.has(not[i])) {
        return false
      }
    }
    return true
  };

  const e$1=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n$1=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e$1({id:t}))),n}return [e$1({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r$1=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s$1=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n$1(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e$1(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e$1({});return t.forEach((t=>{if((t=e$1(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r$1(s=c).forEach(e$1),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r$1(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r$1(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,true)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r$1(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g{constructor(e={}){Object.defineProperty(this,"json",{enumerable:false,value:e,writable:true});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=true),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e$1({});return new g(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e$1({id:t,props:n});return this.json.children.push(r),new g(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r$1(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r$1(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r$1(this.json)}fillDown(){var e;return e=this.json,r$1(e,((e,t)=>{t.props=f(t.props,e.props);})),this}depth(){u(this.json);let e=r$1(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s$1(e);return new g(t)};_.prototype.plugin=function(e){e(this);};

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

  const getColor = function (node) {
    if (colors.hasOwnProperty(node.id)) {
      return colors[node.id]
    }
    if (colors.hasOwnProperty(node.is)) {
      return colors[node.is]
    }
    const found = node._cache.parents.find(c => colors[c]);
    return colors[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      const { not, also, is, novel } = node.props;
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
        color: getColor(node),
        alias: node.alias,
      };
    });
    // lastly, add all children of all nots
    Object.keys(res).forEach(k => {
      const nots = new Set(res[k].not);
      res[k].not.forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
    });
    return res
  };

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
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };

  // 'fill-down' parent logic inference
  const compute$2 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      const o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [], alias: o.alias }
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
    tags = validate(tags, already);

    const allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$2(allTags);
    // convert it to our final format
    const res = fmt(nodes);
    return res
  };

  var methods$3 = {
    one: {
      setTag,
      unTag,
      addTags: addTags$1,
      canBe,
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
      const terms = this.termList();
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
      const terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      const tagSet = model.one.tagSet;
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
      const tagSet = this.model.one.tagSet;
      const canBe = this.methods.one.canBe;
      const nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          if (!canBe(term, tag, tagSet)) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      const noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };

  const tagAPI = function (View) {
    Object.assign(View.prototype, fns);
  };

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
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
      const aKids = kids.length;
      kids = tagSet[b].children || [];
      const bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        const tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };

  var tag = {
    model: {
      one: { tagSet: {} }
    },
    compute: {
      tagRank
    },
    methods: methods$3,
    api: tagAPI,
    lib: lib$1
  };

  // split by periods, question marks, unicode ⁇, etc
  const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s)/g;
  // merge these back into prev sentence
  const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s$/;
  const newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats

  // Start with a regex:
  const basicSplit = function (text) {
    const all = [];
    //first, split by newline
    const lines = text.split(newLine);
    for (let i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      const arr = lines[i].split(initSplit);
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

  const hasLetter$2 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    const chunks = [];
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
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

  const hasNewline = function (c) {
    return Boolean(c.match(/\n$/))
  };

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    const sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && !isSentence(c, abbrevs) && !hasNewline(c)) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };

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
    const m = str.match(closeQuote);
    if (m !== null && m.length === 1) {
      return true
    }
    return false
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      // do we have an open-quote and not a closed one?
      const m = split.match(openQuote);
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
          const toAdd = splits[i + 1] + splits[i + 2];// merge them all
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

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen = /\(/g;
  const hasClosed = /\)/g;
  const mergeParens = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      const m = split.match(hasOpen);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          const m2 = splits[i + 1].match(hasClosed);
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
    const splits = basicSplit(text);
    // Filter-out the crap ones
    let sentences = notEmpty(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = mergeParens(sentences);
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      const ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };

  const hasHyphen = function (str, model) {
    const parts = str.split(/[-–—]/);
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
    const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens = function (word) {
    const arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    const found = word.match(/[-–—]/);
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
      const word = arr[i];
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
    result = combineSlashes(result);
    result = combineRanges(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;
  const isFullNumber = /^[(+\-]?\d+(th|st|nd|rd)?[)+\-]?$/;

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    let original = str;
    let pre = '';
    let post = '';
    const chars = Array.from(str);

    // punctuation-only words, like '<3'
    if (emoticons.hasOwnProperty(str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // pop any punctuation off of the start
    let len = chars.length;
    for (let i = 0; i < len; i += 1) {
      const c = chars[0];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        continue//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(str.trim())) {
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
      const c = chars[chars.length - 1];
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
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(str.trim())) {
        break//done
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

  const parseTerm = (txt, model) => {
    // cleanup any punctuation as whitespace
    const { str, pre, post } = normalizePunctuation(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str = str || '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
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

  const normalize = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = clean(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronym(str);
    term.normal = str;
  };

  // turn a string input into a 'document' json format
  const parse = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    const sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normalize(t, world);
      });
      return terms
    });
    return input
  };

  const isAcronym$2 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse$1 = /(?:\u2026|\.{2,}) *$/; // '...'
  const hasLetter$1 = /\p{L}/u;
  const hasPeriod$1 = /\. *$/;
  const leadInit = /^[A-Z]\. $/; // "W. Kensington"

  /** does this look like a sentence? */
  const isSentence$1 = function (str, abbrevs) {
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
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.' (and not mr?)
    if (abbrevs.hasOwnProperty(lastWord) === true && hasPeriod$1.test(str) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };

  var methods$2 = {
    one: {
      killUnicode,
      tokenize: {
        splitSentences,
        isSentence: isSentence$1,
        splitTerms: splitWords,
        splitWhitespace: parseTerm,
        fromString: parse,
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
  const list = [
    [misc$2],
    [units, 'Unit'],
    [nouns$3, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  const abbreviations = {};
  // add them to a future lexicon
  const lexicon$2 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$2[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$2[w] = [lexicon$2[w], a[1]];
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
  const compact$1 = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗễ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇіїi̇',
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
  const unicode$1 = {};
  Object.keys(compact$1).forEach(function (k) {
    compact$1[k].split('').forEach(function (s) {
      unicode$1[s] = k;
    });
  });

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
      aliases,
      abbreviations,
      prefixes: prefixes$1,
      suffixes: suffixes$3,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$2, //give this one forward
      unicode: unicode$1,
      emoticons
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    const str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (aliases.hasOwnProperty(str)) {
      term.alias = term.alias || [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      const arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 3) {
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

  // sort words by frequency
  const freq = function (view) {
    const docs = view.docs;
    const counts = {};
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        counts[word] = counts[word] || 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    const docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
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

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    const document = view.document;
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

  const wordCount = function (view) {
    let n = 0;
    const docs = view.docs;
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

  // cheat-method for a quick loop
  const termLoop = function (view, fn) {
    const docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$1 = {
    alias: (view) => termLoop(view, addAliases),
    machine: (view) => termLoop(view, doMachine),
    normal: (view) => termLoop(view, normalize),
    freq,
    offset,
    index,
    wordCount,
  };

  var tokenize = {
    compute: methods$1,
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
    const lastPhrase = docs[docs.length - 1] || [];
    const lastTerm = lastPhrase[lastPhrase.length - 1];
    // if we've already put whitespace, end.
    if (lastTerm.post) {
      return
    }
    // if we found something
    if (prefixes.hasOwnProperty(lastTerm.normal)) {
      const found = prefixes[lastTerm.normal];
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
    const lastPhrase = docs[docs.length - 1] || [];
    const term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$4 = function (View) {
    View.prototype.autoFill = autoFill;
  };

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    const collisions = [];
    const existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        const prefix = str.substring(0, size);
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

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = Object.assign({}, defaults, opts);
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
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
    api: api$4,
    lib,
    compute: compute$1,
    hooks: ['typeahead']
  };

  // order here matters
  nlp.extend(change); //0kb
  nlp.extend(output); //0kb
  nlp.extend(match); //10kb
  nlp.extend(pointers); //2kb
  nlp.extend(tag); //2kb
  nlp.plugin(plugin); //~6kb
  nlp.extend(tokenize); //7kb
  nlp.extend(freeze); //
  nlp.plugin(cache$1); //~1kb
  nlp.extend(lookup); //7kb
  nlp.extend(typeahead); //1kb
  nlp.extend(lexicon$3); //1kb
  nlp.extend(sweep); //1kb

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

  // generated in ./lib/models
  var model$3 = {
    "pastTense": {
      "first": {
        "fwd": "annte:ennen¦ieß:oßen¦og:iehen¦at:un¦1te:ln,rn,re¦1ob:hieben,heben¦1og:wiegen,wegen¦1ief:lafen¦1erte:i¦2te:elen,aßen¦3te:achen,annen,ussen,weren,ueren",
        "both": "5te:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4te:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßte:rblassen,inpassen¦4uf:ischaffen¦3te:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2te:ezen,oren,rsen,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahl:pfehlen¦2aß:eressen,fressen¦2ang:rringen,dringen,pringen¦2osch:rlöschen¦2ag:rliegen,hliegen,nliegen¦2ßte:fassen¦2ieg:hweigen¦2ies:preisen,blasen¦2og:nlügen,fliegen¦2or:frieren¦2achte:bringen¦2ug:tragen,hlagen¦2ich:treichen¦2iff:greifen¦2ub:graben¦1aß:gessen,hessen,sitzen,messen¦1oh:liehen¦1ßte:ässen¦1te:ven,äen,xen,pen,ken,uen¦1ank:sinken,rinken,tinken¦1og:rügen,saugen,biegen¦1ahl:tehlen¦1or:heren,kiesen,wören¦1ieh:leihen¦1och:riechen¦1at:bitten,reten¦1and:winden,tehen,finden,binden¦1oll:uellen,wellen¦1omm:limmen¦1ie:peien,reien¦1amm:wimmen¦1ien:heinen¦1ieß:lassen¦1ing:fangen,gehen¦1achte:denken¦1ot:bieten¦1ang:wingen,singen,lingen¦1arb:werben,terben¦1ies:weisen¦1ich:weichen,leichen¦1usch:waschen¦1ieg:teigen¦1ach:techen,rechen¦1ah:sehen¦1itt:neiden,reiten¦1iff:leifen,feifen,neifen¦1ied:heiden¦1off:saufen¦1iet:raten¦1as:lesen¦1ief:laufen,rufen¦1ud:laden¦1ielt:halten¦1ab:geben¦1iel:fallen¦urde:erden¦ann:innen¦uchs:achsen¦ocht:echten¦af:effen¦arf:erfen¦olz:elzen¦ahm:ehmen¦am:ommen¦alf:elfen¦alt:elten¦oss:ießen¦uhr:ahren¦ieb:eiben¦iss:eißen",
        "rev": "ingen:ang¦iegen:ag¦elken:olk¦affen:uf¦ergen:arg¦eiden:ied¦eihen:ieh¦ieden:ott¦ben:tte¦esen:as¦ehen:ah¦erben:arb¦1en:ste,fte,bte,gte,ite,zte¦1ennen:rannte,kannte,nannte¦1n:ete¦1oßen:tieß¦1iehen:zog¦1eschen:rosch¦1eben:wob¦1eißen:hieß¦2n:elte¦2eiten:glitt¦2ieben:chob¦2eben:nhob,shob,rhob¦2en:inte,hrte,hlte,ihte,llte,örte¦2ssen:reßte,laßte¦2egen:ewog¦3n:terte,derte,uerte,nerte,perte,gerte,herte,merte,ferte,berte,kerte,serte,lerte,verte,ßerte¦3en:schte,ichte,ielte,ennte,echte,eelte,önnte,maßte¦4n:eierte,owerte¦4en:lachte,fachte,pannte,machte,wachte,mannte,querte,hwerte¦4afen:schlief¦5en:krachte",
        "ex": "schwamm brust:brustschwimmen¦schwamm delfin:delfinschwimmen¦schwamm delphin:delphinschwimmen¦fuhr:rad fahren¦fuhr rad:radfahren¦aß:essen¦war:sein¦7te:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen¦3ang:abdingen,abringen¦2aß:abessen,fressen¦6te:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,panzern,schwelen¦4itt:abgleiten,ausleiden,mitleiden¦8te:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9te:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßte:anpassen,stressen¦5ßte:anpressen,aufpassen,erpressen,verpassen¦3aß:aufessen,ausessen,mitessen¦4ag:aufliegen,beiliegen¦11ielt:aufrechterhalte¦5osch:ausdreschen,verdreschen¦5itt:ausgleiten,entgleiten¦4olk:ausmelken¦6ßte:auspressen,einpressen,verprassen¦10te:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ang:auswringen¦5te:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3og:belügen,erwägen,abwiegen¦5ag:bloßliegen,festliegen,naheliegen¦3ag:daliegen¦6og:durchlügen¦8ßte:durchpressen¦6ang:durchringen¦7och:durchstechen¦6ob:durchweben¦4ob:einweben,aufheben,wegheben,entheben¦11te:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rte:entkommerzialisie¦3itt:erleiden¦5uf:erschaffen¦13te:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ieß:gutheißen,verheißen¦12te:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6uf:herschaffen,hinschaffen¦6ag:herumliegen¦10uf:hierherschaffen¦9uf:hinaufschaffen,zurückschaffen¦13amm:hinterherschwimme¦5or:nachgären¦7uf:nachschaffen¦8itt:niedergleiten¦15te:parallelschalten,weiterentwickel,weiterverbreiten¦8ag:richtigliegen¦7ag:schiefliegen,zurückliegen¦4arg:verbergen¦4ied:vermeiden¦4ieh:verzeihen¦4aß:vollessen¦4og:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14te:wiedervereinige,zurückbegleiten¦4ott:zersieden¦16te:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6tte:achthaben,freihaben,gernhaben¦3te:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1uk:backen¦4te:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,lachen,machen,spaßen,wachen¦1and:binden,finden,winden¦1arg:bergen¦1arst:bersten¦1at:bitten,tun¦3ahl:befehlen¦1og:biegen,lügen,saugen,wiegen,ziehen¦1ot:bieten¦2ies:blasen,preisen¦3ßte:blassen,pressen¦2achte:bringen¦6onnte:dafürkönnen¦1ang:dingen,ringen,singen¦1urfte:dürfen¦2ang:dringen,wringen¦2osch:dreschen¦1mailte:e-mailen¦1iel:fallen¦1ing:fangen,gehen¦2ßte:fassen,hassen,passen¦2og:fliegen¦2or:frieren¦1ab:geben¦3ar:gebären¦3ieh:gedeihen¦2itt:gleiten¦1or:gären¦2ub:graben¦2iff:greifen¦2tte:haben¦1ielt:halten¦1ieß:heißen,lassen¦1ob:heben,weben¦1onnte:können¦1ud:laden¦1ief:laufen,rufen¦1ag:liegen¦1as:lesen¦1ieh:leihen¦1itt:leiden,reiten¦1olk:melken¦1aß:messen,sitzen¦1ied:meiden¦1ochte:mögen¦3as:genesen¦1iet:raten¦1och:riechen¦3uf:schaffen¦5ah:geschehen¦4or:schwären,verlieren¦1ah:sehen¦1ott:sieden¦1off:saufen¦2ob:stieben¦1ank:sinken¦2ug:tragen¦2off:triefen¦1hettoisierte:gettoisieren¦1usch:waschen¦1ich:weichen¦1ies:weisen¦1arb:werben¦1usste:wissen¦2te:ölen,üben¦7ßte:veranlassen¦4arb:verderben¦5ib:vergraben¦4at:vertuen,guttun¦5andte:übersenden¦6onn:überspinnen¦3ob:abheben,beheben¦17erte:herauskristallisi,hinauskomplimenti¦5ob:hochheben¦5og:nachwiegen,überwiegen¦1annte:kennen,nennen,rennen¦4ief:schlafen¦5at:großtun¦18te:institutionalisiere¦7at:schwertun"
      },
      "second": {
        "fwd": "anntest:ennen¦ießt:oßen¦ogst:iehen¦ochtest:echten¦atst:un¦1test:ln,rn,re¦1obst:hieben,heben¦1ogst:wiegen,wegen¦1iest:reien¦1iefst:lafen¦1ertest:i¦2test:elen,aßen,rsen¦3test:achen,ochen,annen,ussen,weren,ueren",
        "both": "5test:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4test:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßtest:rblassen,inpassen¦4ufst:ischaffen¦3test:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2test:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahlst:pfehlen¦2aßt:eressen,fressen¦2angst:rringen,dringen,pringen¦2oschst:rlöschen¦2agst:rliegen,hliegen,nliegen¦2ßtest:fassen¦2iegst:hweigen¦2iest:preisen,blasen¦2ogst:nlügen,fliegen¦2orst:frieren¦2achtest:bringen¦2ugst:tragen,hlagen¦2ichst:treichen¦2iffst:greifen¦2ubst:graben¦1aßt:gessen,hessen,sitzen,messen¦1ohst:liehen¦1ßtest:ässen¦1test:ven,äen,xen,pen,ken,uen¦1ankst:sinken,rinken,tinken¦1ogst:rügen,saugen,biegen¦1ahlst:tehlen¦1orst:heren,kiesen,wören¦1iehst:leihen¦1ochst:riechen¦1atest:bitten,reten¦1andest:winden,tehen,finden,binden¦1ollst:uellen,wellen¦1ommst:limmen¦1iest:peien,weisen¦1ammst:wimmen¦1ienst:heinen¦1ießt:lassen¦1ingst:fangen,gehen¦1achtest:denken¦1otest:bieten¦1angst:wingen,singen,lingen¦1arbst:werben,terben¦1ichst:weichen,leichen¦1uschst:waschen¦1iegst:teigen¦1achst:techen,rechen¦1ahst:sehen¦1ittest:neiden,reiten¦1iffst:leifen,feifen,neifen¦1iedest:heiden¦1offst:saufen¦1ietest:raten¦1ast:lesen¦1iefst:laufen,rufen¦1udest:laden¦1ieltest:halten¦1altest:gelten¦1abst:geben¦1ielst:fallen¦urdest:erden¦uchst:achsen¦afst:effen¦arfst:erfen¦olzst:elzen¦ahmst:ehmen¦amst:ommen¦alfst:elfen¦annst:innen¦osst:ießen¦uhrst:ahren¦iebst:eiben¦isst:eißen",
        "rev": "ingen:angst¦iegen:agst¦elken:olkst¦affen:ufst¦ergen:argst¦eiden:iedest¦ieden:ottest¦ehen:andst,ahst¦eihen:iehst¦assen:ießest¦esen:ast¦erben:arbst¦1en:stest,ftest,btest,gtest,itest,ztest¦1ennen:ranntest,kanntest,nanntest¦1oßen:tießt¦1iehen:zogst¦1echten:fochtest,lochtest¦1eschen:roschst¦1eben:wobst¦1eißen:hießt¦1ben:attest¦1un:tatst¦2eiten:glittest¦2n:tetest,detest,netest¦2ieben:chobst¦2eben:nhobst,shobst,rhobst¦2en:intest,hrtest,hltest,ihtest,lltest,örtest¦2ssen:reßtest,laßtest¦2eien:hriest¦2egen:ewogst¦3n:teltest,keltest,seltest,dertest,uertest,tertest,peltest,beltest,pertest,gertest,feltest,heltest,hertest,geltest,deltest,meltest,fertest,zeltest,kertest,ßeltest,bertest,sertest,mertest,nertest,lertest,vertest,ßertest,neltest¦3en:schtest,ichtest,enntest,echtest,eeltest,önntest,maßtest¦4n:eiertest,owertest¦4en:kochtest,machtest,pieltest,zieltest,lachtest,tieltest,panntest,wachtest,manntest,quertest,fachtest¦4afen:schliefst¦5en:krachtest,chwertest",
        "ex": "schwammst brust:brustschwimmen¦schwammst delfin:delfinschwimmen¦schwammst delphin:delphinschwimmen¦fuhrst:rad fahren¦fuhrst rad:radfahren¦aßt:essen¦warst:sein¦7test:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,verzeihen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,einlochen,verbannen,recyceln¦3angst:abdingen,abringen¦2aßt:abessen,fressen¦6test:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,freveln,panzern,schielen,schwelen¦4ittest:abgleiten,ausleiden,mitleiden¦8test:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9test:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßtest:anpassen,stressen¦5ßtest:anpressen,aufpassen,erpressen,verpassen¦3aßt:aufessen,ausessen,mitessen¦4agst:aufliegen,beiliegen¦11ieltest:aufrechterhalte¦5oschst:ausdreschen,verdreschen¦5ittest:ausgleiten,entgleiten¦4olkst:ausmelken¦6ßtest:auspressen,einpressen,verprassen¦10test:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5angst:auswringen¦5test:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3ogst:belügen,erwägen,abwiegen¦5agst:bloßliegen,festliegen,naheliegen¦3agst:daliegen¦6ogst:durchlügen¦8ßtest:durchpressen¦6angst:durchringen¦7ochst:durchstechen¦6obst:durchweben¦4obst:einweben,aufheben,wegheben,entheben¦11test:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rtest:entkommerzialisie¦3ittest:erleiden¦5ufst:erschaffen¦13test:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießt:gutheißen,verheißen¦12test:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6ufst:herschaffen,hinschaffen¦6agst:herumliegen¦10ufst:hierherschaffen¦9ufst:hinaufschaffen,zurückschaffen¦13ammst:hinterherschwimme¦5orst:nachgären¦7ufst:nachschaffen¦8ittest:niedergleiten¦15test:parallelschalten,weiterentwickel,weiterverbreiten¦8agst:richtigliegen¦7agst:schiefliegen,zurückliegen¦4argst:verbergen¦4iedest:vermeiden¦4aßt:vollessen¦4ogst:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14test:wiedervereinige,zurückbegleiten¦4ottest:zersieden¦16test:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6ttest:achthaben,freihaben,gernhaben¦3test:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦8andst:alleinstehen,hintanstehen¦1ukst:backen¦4test:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,kochen,lachen,lochen,machen,pochen,spaßen,wachen,zielen¦1andest:binden,finden,winden¦1argst:bergen¦1arstest:bersten¦1atest:bitten¦3ahlst:befehlen¦1ogst:biegen,lügen,saugen,wiegen,ziehen¦1otest:bieten¦2iest:blasen,preisen¦3ßtest:blassen,pressen¦2achtest:bringen¦6onntest:dafürkönnen¦1angst:dingen,ringen,singen¦1urftest:dürfen¦2angst:dringen,wringen¦2oschst:dreschen¦1mailtest:e-mailen¦1ielst:fallen¦1ingst:fangen,gehen¦2ßtest:fassen,hassen,passen¦2ogst:fliegen¦2orst:frieren¦1abst:geben¦1altest:gelten¦3arst:gebären¦3iehst:gedeihen¦2ittest:gleiten¦1orst:gären¦2ubst:graben¦2iffst:greifen¦2ttest:haben¦1ieltest:halten¦1ießt:heißen,lassen¦6ießest:gehenlassen¦1obst:heben,weben¦1onntest:können¦1udest:laden¦1iefst:laufen,rufen¦1agst:liegen¦1ast:lesen¦1iehst:leihen¦1ittest:leiden,reiten¦1olkst:melken¦1aßt:messen,sitzen¦1iedest:meiden¦1ochtest:mögen,fechten¦3ast:genesen¦1ietest:raten¦1ochst:riechen¦3ufst:schaffen¦5ahst:geschehen¦4orst:schwären,verlieren¦1ahst:sehen¦1ottest:sieden¦1offst:saufen¦2obst:stieben¦1ankst:sinken¦2ugst:tragen¦2offst:triefen¦1hettoisiertest:gettoisieren¦1uschst:waschen¦1ichst:weichen¦1iest:weisen¦1arbst:werben¦1usstest:wissen¦2test:ölen,üben¦5ieltst:hochhalten¦7ießest:hängenlassen¦6andst:kopfstehen¦7ßtest:veranlassen¦4atst:verbitten¦4arbst:verderben¦5ibst:vergraben¦4atest:vertuen¦5andtest:übersenden¦6onnst:überspinnen¦3obst:abheben,beheben¦17ertest:herauskristallisi,hinauskomplimenti¦5obst:hochheben¦5ogst:nachwiegen,überwiegen¦1anntest:kennen,nennen,rennen¦4iefst:schlafen¦1atst:tun¦18test:institutionalisiere"
      },
      "third": {
        "fwd": "annte:ennen¦ieß:oßen¦og:iehen¦at:un¦1te:ln,rn,re¦1ob:hieben,heben¦1og:wiegen,wegen¦1ief:lafen¦1erte:i¦2te:elen,aßen¦3te:achen,annen,ussen,weren,ueren",
        "both": "5te:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4te:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßte:rblassen,inpassen¦4uf:ischaffen¦3te:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2te:ezen,oren,rsen,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahl:pfehlen¦2aß:eressen,fressen¦2ang:rringen,dringen,pringen¦2osch:rlöschen¦2ag:rliegen,hliegen,nliegen¦2ßte:fassen¦2ieg:hweigen¦2ies:preisen,blasen¦2og:nlügen,fliegen¦2or:frieren¦2achte:bringen¦2ug:tragen,hlagen¦2ich:treichen¦2iff:greifen¦2ub:graben¦1aß:gessen,hessen,sitzen,messen¦1oh:liehen¦1ßte:ässen¦1te:ven,äen,xen,pen,ken,uen¦1ank:sinken,rinken,tinken¦1og:rügen,saugen,biegen¦1ahl:tehlen¦1or:heren,kiesen,wören¦1ieh:leihen¦1och:riechen¦1at:bitten,reten¦1and:winden,tehen,finden,binden¦1oll:uellen,wellen¦1omm:limmen¦1ie:peien,reien¦1amm:wimmen¦1ien:heinen¦1ieß:lassen¦1ing:fangen,gehen¦1achte:denken¦1ot:bieten¦1ang:wingen,singen,lingen¦1arb:werben,terben¦1ies:weisen¦1ich:weichen,leichen¦1usch:waschen¦1ieg:teigen¦1ach:techen,rechen¦1ah:sehen¦1itt:neiden,reiten¦1iff:leifen,feifen,neifen¦1ied:heiden¦1off:saufen¦1iet:raten¦1as:lesen¦1ief:laufen,rufen¦1ud:laden¦1ielt:halten¦1ab:geben¦1iel:fallen¦urde:erden¦ann:innen¦uchs:achsen¦ocht:echten¦af:effen¦arf:erfen¦olz:elzen¦ahm:ehmen¦am:ommen¦alf:elfen¦alt:elten¦oss:ießen¦uhr:ahren¦ieb:eiben¦iss:eißen",
        "rev": "ingen:ang¦iegen:ag¦elken:olk¦affen:uf¦ergen:arg¦eiden:ied¦eihen:ieh¦ieden:ott¦ben:tte¦esen:as¦ehen:ah¦erben:arb¦1en:ste,fte,bte,gte,ite,zte¦1ennen:rannte,kannte,nannte¦1n:ete¦1oßen:tieß¦1iehen:zog¦1eschen:rosch¦1eben:wob¦1eißen:hieß¦2n:elte¦2eiten:glitt¦2ieben:chob¦2eben:nhob,shob,rhob¦2en:inte,hrte,hlte,ihte,llte,örte¦2ssen:reßte,laßte¦2egen:ewog¦3n:terte,derte,uerte,nerte,perte,gerte,herte,merte,ferte,berte,kerte,serte,lerte,verte,ßerte¦3en:schte,ichte,ielte,ennte,echte,eelte,önnte,maßte¦4n:eierte,owerte¦4en:lachte,fachte,pannte,machte,wachte,mannte,querte,hwerte¦4afen:schlief¦5en:krachte",
        "ex": "schwamm brust:brustschwimmen¦schwamm delfin:delfinschwimmen¦schwamm delphin:delphinschwimmen¦fuhr:rad fahren¦fuhr rad:radfahren¦aß:essen¦war:sein¦7te:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen¦3ang:abdingen,abringen¦2aß:abessen,fressen¦6te:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,panzern,schwelen¦4itt:abgleiten,ausleiden,mitleiden¦8te:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9te:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßte:anpassen,stressen¦5ßte:anpressen,aufpassen,erpressen,verpassen¦3aß:aufessen,ausessen,mitessen¦4ag:aufliegen,beiliegen¦11ielt:aufrechterhalte¦5osch:ausdreschen,verdreschen¦5itt:ausgleiten,entgleiten¦4olk:ausmelken¦6ßte:auspressen,einpressen,verprassen¦10te:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ang:auswringen¦5te:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3og:belügen,erwägen,abwiegen¦5ag:bloßliegen,festliegen,naheliegen¦3ag:daliegen¦6og:durchlügen¦8ßte:durchpressen¦6ang:durchringen¦7och:durchstechen¦6ob:durchweben¦4ob:einweben,aufheben,wegheben,entheben¦11te:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rte:entkommerzialisie¦3itt:erleiden¦5uf:erschaffen¦13te:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ieß:gutheißen,verheißen¦12te:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6uf:herschaffen,hinschaffen¦6ag:herumliegen¦10uf:hierherschaffen¦9uf:hinaufschaffen,zurückschaffen¦13amm:hinterherschwimme¦5or:nachgären¦7uf:nachschaffen¦8itt:niedergleiten¦15te:parallelschalten,weiterentwickel,weiterverbreiten¦8ag:richtigliegen¦7ag:schiefliegen,zurückliegen¦4arg:verbergen¦4ied:vermeiden¦4ieh:verzeihen¦4aß:vollessen¦4og:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14te:wiedervereinige,zurückbegleiten¦4ott:zersieden¦16te:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6tte:achthaben,freihaben,gernhaben¦3te:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1uk:backen¦4te:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,lachen,machen,spaßen,wachen¦1and:binden,finden,winden¦1arg:bergen¦1arst:bersten¦1at:bitten,tun¦3ahl:befehlen¦1og:biegen,lügen,saugen,wiegen,ziehen¦1ot:bieten¦2ies:blasen,preisen¦3ßte:blassen,pressen¦2achte:bringen¦6onnte:dafürkönnen¦1ang:dingen,ringen,singen¦1urfte:dürfen¦2ang:dringen,wringen¦2osch:dreschen¦1mailte:e-mailen¦1iel:fallen¦1ing:fangen,gehen¦2ßte:fassen,hassen,passen¦2og:fliegen¦2or:frieren¦1ab:geben¦3ar:gebären¦3ieh:gedeihen¦2itt:gleiten¦1or:gären¦2ub:graben¦2iff:greifen¦2tte:haben¦1ielt:halten¦1ieß:heißen,lassen¦1ob:heben,weben¦1onnte:können¦1ud:laden¦1ief:laufen,rufen¦1ag:liegen¦1as:lesen¦1ieh:leihen¦1itt:leiden,reiten¦1olk:melken¦1aß:messen,sitzen¦1ied:meiden¦1ochte:mögen¦3as:genesen¦1iet:raten¦1och:riechen¦3uf:schaffen¦5ah:geschehen¦4or:schwären,verlieren¦1ah:sehen¦1ott:sieden¦1off:saufen¦2ob:stieben¦1ank:sinken¦2ug:tragen¦2off:triefen¦1hettoisierte:gettoisieren¦1usch:waschen¦1ich:weichen¦1ies:weisen¦1arb:werben¦1usste:wissen¦2te:ölen,üben¦7ßte:veranlassen¦4arb:verderben¦5ib:vergraben¦4at:vertuen,guttun¦5andte:übersenden¦6onn:überspinnen¦3ob:abheben,beheben¦17erte:herauskristallisi,hinauskomplimenti¦5ob:hochheben¦5og:nachwiegen,überwiegen¦1annte:kennen,nennen,rennen¦4ief:schlafen¦5at:großtun¦18te:institutionalisiere¦7at:schwertun"
      },
      "firstPlural": {
        "fwd": "annten:ennen¦ießen:oßen¦ogen:iehen¦ochten:echten¦aten:un¦1ten:ln,rn,re¦1oben:hieben,heben¦1ogen:wiegen,wegen¦1iefen:lafen¦1erten:i¦2ten:elen,aßen,rsen¦3ten:achen,ochen,annen,ussen,weren,ueren",
        "both": "5ten:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4ten:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßten:rblassen,inpassen¦4ufen:ischaffen¦3ten:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2ten:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahlen:pfehlen¦2aßen:eressen,fressen¦2angen:rringen,dringen,pringen¦2oschen:rlöschen¦2agen:rliegen,hliegen,nliegen¦2ßten:fassen¦2iegen:hweigen¦2iesen:preisen,blasen¦2ogen:nlügen,fliegen¦2oren:frieren¦2achten:bringen¦2ugen:tragen,hlagen¦2ichen:treichen¦2iffen:greifen¦2uben:graben¦1aßen:gessen,hessen,sitzen,messen¦1ohen:liehen¦1ßten:ässen¦1ten:ven,äen,xen,pen,ken,uen¦1anken:sinken,rinken,tinken¦1ogen:rügen,saugen,biegen¦1ahlen:tehlen¦1oren:heren,kiesen,wören¦1iehen:leihen¦1ochen:riechen¦1aten:bitten,reten¦1anden:winden,tehen,finden,binden¦1ollen:uellen,wellen¦1ommen:limmen¦1ien:peien,reien¦1ammen:wimmen¦1ienen:heinen¦1ießen:lassen¦1ingen:fangen,gehen¦1achten:denken¦1oten:bieten¦1angen:wingen,singen,lingen¦1arben:werben,terben¦1iesen:weisen¦1ichen:weichen,leichen¦1uschen:waschen¦1iegen:teigen¦1achen:techen,rechen¦1ahen:sehen¦1itten:neiden,reiten¦1iffen:leifen,feifen,neifen¦1ieden:heiden¦1offen:saufen¦1ieten:raten¦1asen:lesen¦1iefen:laufen,rufen¦1uden:laden¦1ielten:halten¦1alten:gelten¦1aben:geben¦1ielen:fallen¦urden:erden¦uchsen:achsen¦afen:effen¦arfen:erfen¦olzen:elzen¦ahmen:ehmen¦amen:ommen¦alfen:elfen¦annen:innen¦ossen:ießen¦uhren:ahren¦ieben:eiben¦issen:eißen",
        "rev": "ingen:angen¦iegen:agen¦elken:olken¦affen:ufen¦ergen:argen¦eiden:ieden¦eihen:iehen¦ieden:otten¦esen:asen¦ehen:ahen¦erben:arben¦1en:sten,ften,bten,gten,iten,zten¦1ennen:rannten,kannten,nannten¦1oßen:tießen¦1iehen:zogen¦1echten:fochten,lochten¦1eschen:roschen¦1eben:woben¦1eißen:hießen¦1ben:atten¦2eiten:glitten¦2n:teten,deten,neten¦2ieben:choben¦2eben:nhoben,shoben,rhoben¦2en:inten,hrten,hlten,ihten,llten,örten¦2ssen:reßten,laßten¦2egen:ewogen¦3n:telten,kelten,selten,derten,uerten,terten,pelten,belten,perten,gerten,felten,helten,herten,gelten,delten,melten,ferten,zelten,kerten,ßelten,berten,serten,merten,nerten,lerten,verten,ßerten,nelten¦3en:schten,ichten,ennten,echten,eelten,önnten,maßten¦4n:eierten,owerten¦4en:kochten,machten,pielten,zielten,lachten,tielten,pannten,wachten,mannten,querten,fachten¦4afen:schliefen¦5en:krachten,chwerten",
        "ex": "schwammen brust:brustschwimmen¦schwammen delfin:delfinschwimmen¦schwammen delphin:delphinschwimmen¦fuhren:rad fahren¦fuhren rad:radfahren¦aßen:essen¦waren:sein¦7ten:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,einlochen,verbannen,recyceln¦3angen:abdingen,abringen¦2aßen:abessen,fressen¦6ten:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,freveln,panzern,schielen,schwelen¦4itten:abgleiten,ausleiden,mitleiden¦8ten:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9ten:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßten:anpassen,stressen¦5ßten:anpressen,aufpassen,erpressen,verpassen¦3aßen:aufessen,ausessen,mitessen¦4agen:aufliegen,beiliegen¦11ielten:aufrechterhalte¦5oschen:ausdreschen,verdreschen¦5itten:ausgleiten,entgleiten¦4olken:ausmelken¦6ßten:auspressen,einpressen,verprassen¦10ten:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5angen:auswringen¦5ten:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3ogen:belügen,erwägen,abwiegen¦5agen:bloßliegen,festliegen,naheliegen¦3agen:daliegen¦6ogen:durchlügen¦8ßten:durchpressen¦6angen:durchringen¦7ochen:durchstechen¦6oben:durchweben¦4oben:einweben,aufheben,wegheben,entheben¦11ten:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rten:entkommerzialisie¦3itten:erleiden¦5ufen:erschaffen¦13ten:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießen:gutheißen,verheißen¦12ten:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6ufen:herschaffen,hinschaffen¦6agen:herumliegen¦10ufen:hierherschaffen¦9ufen:hinaufschaffen,zurückschaffen¦13ammen:hinterherschwimme¦5oren:nachgären¦7ufen:nachschaffen¦8itten:niedergleiten¦15ten:parallelschalten,weiterentwickel,weiterverbreiten¦8agen:richtigliegen¦7agen:schiefliegen,zurückliegen¦4argen:verbergen¦4ieden:vermeiden¦4iehen:verzeihen¦4aßen:vollessen¦4ogen:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14ten:wiedervereinige,zurückbegleiten¦4otten:zersieden¦16ten:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6tten:achthaben,freihaben,gernhaben¦3ten:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1uken:backen¦4ten:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,kochen,lachen,lochen,machen,pochen,spaßen,wachen,zielen¦1anden:binden,finden,winden¦1argen:bergen¦1arsten:bersten¦1aten:bitten,tun¦3ahlen:befehlen¦1ogen:biegen,lügen,saugen,wiegen,ziehen¦1oten:bieten¦2iesen:blasen,preisen¦3ßten:blassen,pressen¦2achten:bringen¦6onnten:dafürkönnen¦1angen:dingen,ringen,singen¦1urften:dürfen¦2angen:dringen,wringen¦2oschen:dreschen¦1mailten:e-mailen¦1ielen:fallen¦1ingen:fangen,gehen¦2ßten:fassen,hassen,passen¦2ogen:fliegen¦2oren:frieren¦1aben:geben¦1alten:gelten¦3aren:gebären¦3iehen:gedeihen¦2itten:gleiten¦1oren:gären¦2uben:graben¦2iffen:greifen¦2tten:haben¦1ielten:halten¦1ießen:heißen,lassen¦1oben:heben,weben¦1onnten:können¦1uden:laden¦1iefen:laufen,rufen¦1agen:liegen¦1asen:lesen¦1iehen:leihen¦1itten:leiden,reiten¦1olken:melken¦1aßen:messen,sitzen¦1ieden:meiden¦1ochten:mögen,fechten¦3asen:genesen¦1ieten:raten¦1ochen:riechen¦3ufen:schaffen¦5ahen:geschehen¦4oren:schwären,verlieren¦1ahen:sehen¦1otten:sieden¦1offen:saufen¦2oben:stieben¦1anken:sinken¦2ugen:tragen¦2offen:triefen¦1hettoisierten:gettoisieren¦1uschen:waschen¦1ichen:weichen¦1iesen:weisen¦1arben:werben¦1ussten:wissen¦2ten:ölen,üben¦7ßten:veranlassen¦4arben:verderben¦5iben:vergraben¦4aten:vertuen,guttun¦5andten:übersenden¦6onnen:überspinnen¦3oben:abheben,beheben¦17erten:herauskristallisi,hinauskomplimenti¦5oben:hochheben¦5ogen:nachwiegen,überwiegen¦1annten:kennen,nennen,rennen¦4iefen:schlafen¦5aten:großtun¦18ten:institutionalisiere¦7aten:schwertun"
      },
      "secondPlural": {
        "fwd": "anntet:ennen¦ießt:oßen¦ogt:iehen¦ochtet:echten¦atet:un¦1tet:ln,rn,re¦1obt:hieben,heben¦1ogt:wiegen,wegen¦1ieft:lafen¦1ertet:i¦2tet:elen,aßen,rsen¦3tet:achen,ochen,annen,ussen,weren,ueren",
        "both": "5tet:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4tet:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßtet:rblassen,inpassen¦4uft:ischaffen¦3tet:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2tet:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahlt:pfehlen¦2aßt:eressen,fressen¦2angt:rringen,dringen,pringen¦2oscht:rlöschen¦2agt:rliegen,hliegen,nliegen¦2ßtet:fassen¦2iegt:hweigen¦2iest:preisen,blasen¦2ogt:nlügen,fliegen¦2ort:frieren¦2achtet:bringen¦2ugt:tragen,hlagen¦2icht:treichen¦2ifft:greifen¦2ubt:graben¦1aßt:gessen,hessen,sitzen,messen¦1oht:liehen¦1ßtet:ässen¦1tet:ven,äen,xen,pen,ken,uen¦1ankt:sinken,rinken,tinken¦1ogt:rügen,saugen,biegen¦1ahlt:tehlen¦1ort:heren,kiesen,wören¦1ieht:leihen¦1ocht:riechen¦1atet:bitten,reten¦1andet:winden,tehen,finden,binden¦1ollt:uellen,wellen¦1ommt:limmen¦1iet:peien,reien¦1ammt:wimmen¦1ient:heinen¦1ießt:lassen¦1ingt:fangen,gehen¦1achtet:denken¦1otet:bieten¦1angt:wingen,singen,lingen¦1arbt:werben,terben¦1iest:weisen¦1icht:weichen,leichen¦1uscht:waschen¦1iegt:teigen¦1acht:techen,rechen¦1aht:sehen¦1ittet:neiden,reiten¦1ifft:leifen,feifen,neifen¦1iedet:heiden¦1offt:saufen¦1ietet:raten¦1ast:lesen¦1ieft:laufen,rufen¦1udet:laden¦1ieltet:halten¦1altet:gelten¦1abt:geben¦1ielt:fallen¦urdet:erden¦uchst:achsen¦aft:effen¦arft:erfen¦olzt:elzen¦ahmt:ehmen¦amt:ommen¦alft:elfen¦annt:innen¦osst:ießen¦uhrt:ahren¦iebt:eiben¦isst:eißen",
        "rev": "ingen:angt¦iegen:agt¦elken:olkt¦affen:uft¦ergen:argt¦eiden:iedet¦ieden:ottet¦eihen:ieht¦esen:ast¦ehen:aht¦erben:arbt¦1en:stet,ftet,btet,gtet,itet,ztet¦1ennen:ranntet,kanntet,nanntet¦1oßen:tießt¦1iehen:zogt¦1echten:fochtet,lochtet¦1eschen:roscht¦1eben:wobt¦1eißen:hießt¦1ben:attet¦2eiten:glittet¦2n:tetet,detet,netet¦2ieben:chobt¦2eben:nhobt,shobt,rhobt¦2en:intet,hrtet,hltet,ihtet,lltet,örtet¦2ssen:reßtet,laßtet¦2egen:ewogt¦3n:teltet,keltet,seltet,dertet,uertet,tertet,peltet,beltet,pertet,gertet,feltet,heltet,hertet,geltet,deltet,meltet,fertet,zeltet,kertet,ßeltet,bertet,sertet,mertet,nertet,lertet,vertet,ßertet,neltet¦3en:schtet,ichtet,enntet,echtet,eeltet,önntet,maßtet¦4n:eiertet,owertet¦4en:kochtet,machtet,pieltet,zieltet,lachtet,tieltet,panntet,wachtet,manntet,quertet,fachtet¦4afen:schlieft¦5en:krachtet,chwertet",
        "ex": "schwammt brust:brustschwimmen¦schwammt delfin:delfinschwimmen¦schwammt delphin:delphinschwimmen¦fuhrt:rad fahren¦fuhrt rad:radfahren¦aßt:essen¦wart:sein¦7tet:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,verzeihen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,einlochen,verbannen,recyceln¦3angt:abdingen,abringen¦2aßt:abessen,fressen¦6tet:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,freveln,panzern,schielen,schwelen¦4ittet:abgleiten,ausleiden,mitleiden¦8tet:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9tet:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßtet:anpassen,stressen¦5ßtet:anpressen,aufpassen,erpressen,verpassen¦3aßt:aufessen,ausessen,mitessen¦4agt:aufliegen,beiliegen¦11ieltet:aufrechterhalte¦5oscht:ausdreschen,verdreschen¦5ittet:ausgleiten,entgleiten¦4olkt:ausmelken¦6ßtet:auspressen,einpressen,verprassen¦10tet:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5angt:auswringen¦5tet:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3ogt:belügen,erwägen,abwiegen¦5agt:bloßliegen,festliegen,naheliegen¦3agt:daliegen¦6ogt:durchlügen¦8ßtet:durchpressen¦6angt:durchringen¦7ocht:durchstechen¦6obt:durchweben¦4obt:einweben,aufheben,wegheben,entheben¦11tet:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rtet:entkommerzialisie¦3ittet:erleiden¦5uft:erschaffen¦13tet:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießt:gutheißen,verheißen¦12tet:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6uft:herschaffen,hinschaffen¦6agt:herumliegen¦10uft:hierherschaffen¦9uft:hinaufschaffen,zurückschaffen¦13ammt:hinterherschwimme¦5ort:nachgären¦7uft:nachschaffen¦8ittet:niedergleiten¦15tet:parallelschalten,weiterentwickel,weiterverbreiten¦8agt:richtigliegen¦7agt:schiefliegen,zurückliegen¦4argt:verbergen¦4iedet:vermeiden¦4aßt:vollessen¦4ogt:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14tet:wiedervereinige,zurückbegleiten¦4ottet:zersieden¦16tet:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6ttet:achthaben,freihaben,gernhaben¦3tet:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1ukt:backen¦4tet:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,kochen,lachen,lochen,machen,pochen,spaßen,wachen,zielen¦1andet:binden,finden,winden¦1argt:bergen¦1arstet:bersten¦1atet:bitten,tun¦3ahlt:befehlen¦1ogt:biegen,lügen,saugen,wiegen,ziehen¦1otet:bieten¦2iest:blasen,preisen¦3ßtet:blassen,pressen¦2achtet:bringen¦6onntet:dafürkönnen¦1angt:dingen,ringen,singen¦1urftet:dürfen¦2angt:dringen,wringen¦2oscht:dreschen¦1mailtet:e-mailen¦1ielt:fallen¦1ingt:fangen,gehen¦2ßtet:fassen,hassen,passen¦2ogt:fliegen¦2ort:frieren¦1abt:geben¦1altet:gelten¦3art:gebären¦3ieht:gedeihen¦2ittet:gleiten¦1ort:gären¦2ubt:graben¦2ifft:greifen¦2ttet:haben¦1ieltet:halten¦1ießt:heißen,lassen¦1obt:heben,weben¦1onntet:können¦1udet:laden¦1ieft:laufen,rufen¦1agt:liegen¦1ast:lesen¦1ieht:leihen¦1ittet:leiden,reiten¦1olkt:melken¦1aßt:messen,sitzen¦1iedet:meiden¦1ochtet:mögen,fechten¦3ast:genesen¦1ietet:raten¦1ocht:riechen¦3uft:schaffen¦5aht:geschehen¦4ort:schwären,verlieren¦1aht:sehen¦1ottet:sieden¦1offt:saufen¦2obt:stieben¦1ankt:sinken¦2ugt:tragen¦2offt:triefen¦1hettoisiertet:gettoisieren¦1uscht:waschen¦1icht:weichen¦1iest:weisen¦1arbt:werben¦1usstet:wissen¦2tet:ölen,üben¦7ßtet:veranlassen¦4arbt:verderben¦5ibt:vergraben¦4atet:vertuen,guttun¦5andtet:übersenden¦6onnt:überspinnen¦3obt:abheben,beheben¦17ertet:herauskristallisi,hinauskomplimenti¦5obt:hochheben¦5ogt:nachwiegen,überwiegen¦1anntet:kennen,nennen,rennen¦4ieft:schlafen¦5atet:großtun¦18tet:institutionalisiere¦7atet:schwertun"
      },
      "thirdPlural": {
        "fwd": "annten:ennen¦ießen:oßen¦ogen:iehen¦ochten:echten¦aten:un¦1ten:ln,rn,re¦1oben:hieben,heben¦1ogen:wiegen,wegen¦1iefen:lafen¦1erten:i¦2ten:elen,aßen,rsen¦3ten:achen,ochen,annen,ussen,weren,ueren",
        "both": "5ten:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4ten:sieben,peten,raden,weifen,rellen,orden,ätten,fieren,xieren,hitzen,leisen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,beten,uieren,rragen,seifen,nitzen,klagen,glasen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,ütten,mieren,otten,sieren,tieren,wallen,pießen,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßten:rblassen,inpassen¦4ufen:ischaffen¦3ten:ümmen,sigen,nchen,kten,ähmen,üssen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,uhlen,higen,pten,nügen,mden,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,ätzen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,fügen,lehen,gnen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,ürfen,ächen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,uchen,ahlen¦2ten:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,ölen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,nzen,ohen,emen,unen,rgen,önen,ägen,ömen,ulen,aren,üren,rren,usen,umen,älen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ahlen:pfehlen¦2aßen:eressen,fressen¦2angen:rringen,dringen,pringen¦2oschen:rlöschen¦2agen:rliegen,hliegen,nliegen¦2ßten:fassen¦2iegen:hweigen¦2iesen:preisen,blasen¦2ogen:nlügen,fliegen¦2oren:frieren¦2achten:bringen¦2ugen:tragen,hlagen¦2ichen:treichen¦2iffen:greifen¦2uben:graben¦1aßen:gessen,hessen,sitzen,messen¦1ohen:liehen¦1ßten:ässen¦1ten:ven,äen,xen,pen,ken,uen¦1anken:sinken,rinken,tinken¦1ogen:rügen,saugen,biegen¦1ahlen:tehlen¦1oren:heren,kiesen,wören¦1iehen:leihen¦1ochen:riechen¦1aten:bitten,reten¦1anden:winden,tehen,finden,binden¦1ollen:uellen,wellen¦1ommen:limmen¦1ien:peien,reien¦1ammen:wimmen¦1ienen:heinen¦1ießen:lassen¦1ingen:fangen,gehen¦1achten:denken¦1oten:bieten¦1angen:wingen,singen,lingen¦1arben:werben,terben¦1iesen:weisen¦1ichen:weichen,leichen¦1uschen:waschen¦1iegen:teigen¦1achen:techen,rechen¦1ahen:sehen¦1itten:neiden,reiten¦1iffen:leifen,feifen,neifen¦1ieden:heiden¦1offen:saufen¦1ieten:raten¦1asen:lesen¦1iefen:laufen,rufen¦1uden:laden¦1ielten:halten¦1alten:gelten¦1aben:geben¦1ielen:fallen¦urden:erden¦uchsen:achsen¦afen:effen¦arfen:erfen¦olzen:elzen¦ahmen:ehmen¦amen:ommen¦alfen:elfen¦annen:innen¦ossen:ießen¦uhren:ahren¦ieben:eiben¦issen:eißen",
        "rev": "ingen:angen¦iegen:agen¦elken:olken¦affen:ufen¦ergen:argen¦eiden:ieden¦eihen:iehen¦ieden:otten¦esen:asen¦ehen:ahen¦erben:arben¦1en:sten,ften,bten,gten,iten,zten¦1ennen:rannten,kannten,nannten¦1oßen:tießen¦1iehen:zogen¦1echten:fochten,lochten¦1eschen:roschen¦1eben:woben¦1eißen:hießen¦1ben:atten¦2eiten:glitten¦2n:teten,deten,neten¦2ieben:choben¦2eben:nhoben,shoben,rhoben¦2en:inten,hrten,hlten,ihten,llten,örten¦2ssen:reßten,laßten¦2egen:ewogen¦3n:telten,kelten,selten,derten,uerten,terten,pelten,belten,perten,gerten,felten,helten,herten,gelten,delten,melten,ferten,zelten,kerten,ßelten,berten,serten,merten,nerten,lerten,verten,ßerten,nelten¦3en:schten,ichten,ennten,echten,eelten,önnten,maßten¦4n:eierten,owerten¦4en:kochten,machten,pielten,zielten,lachten,tielten,pannten,wachten,mannten,querten,fachten¦4afen:schliefen¦5en:krachten,chwerten",
        "ex": "schwammen brust:brustschwimmen¦schwammen delfin:delfinschwimmen¦schwammen delphin:delphinschwimmen¦fuhren:rad fahren¦fuhren rad:radfahren¦aßen:essen¦waren:sein¦7ten:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einkerben,einweihen,erreichen,umleiten,verfehlen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vergönnen,vermiesen,verneinen,verpennen,verwaisen,zermürben,einlochen,verbannen,recyceln¦3angen:abdingen,abringen¦2aßen:abessen,fressen¦6ten:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,abdachen,freveln,panzern,schielen,schwelen¦4itten:abgleiten,ausleiden,mitleiden¦8ten:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9ten:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen,verursachen¦4ßten:anpassen,stressen¦5ßten:anpressen,aufpassen,erpressen,verpassen¦3aßen:aufessen,ausessen,mitessen¦4agen:aufliegen,beiliegen¦11ielten:aufrechterhalte¦5oschen:ausdreschen,verdreschen¦5itten:ausgleiten,entgleiten¦4olken:ausmelken¦6ßten:auspressen,einpressen,verprassen¦10ten:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5angen:auswringen¦5ten:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,krachen¦3ogen:belügen,erwägen,abwiegen¦5agen:bloßliegen,festliegen,naheliegen¦3agen:daliegen¦6ogen:durchlügen¦8ßten:durchpressen¦6angen:durchringen¦7ochen:durchstechen¦6oben:durchweben¦4oben:einweben,aufheben,wegheben,entheben¦11ten:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rten:entkommerzialisie¦3itten:erleiden¦5ufen:erschaffen¦13ten:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießen:gutheißen,verheißen¦12ten:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6ufen:herschaffen,hinschaffen¦6agen:herumliegen¦10ufen:hierherschaffen¦9ufen:hinaufschaffen,zurückschaffen¦13ammen:hinterherschwimme¦5oren:nachgären¦7ufen:nachschaffen¦8itten:niedergleiten¦15ten:parallelschalten,weiterentwickel,weiterverbreiten¦8agen:richtigliegen¦7agen:schiefliegen,zurückliegen¦4argen:verbergen¦4ieden:vermeiden¦4iehen:verzeihen¦4aßen:vollessen¦4ogen:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14ten:wiedervereinige,zurückbegleiten¦4otten:zersieden¦16ten:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦6tten:achthaben,freihaben,gernhaben¦3ten:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen¦1uken:backen¦4ten:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,gönnen,hallen,hellen,höhlen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,dachen,eiern,fachen,kochen,lachen,lochen,machen,pochen,spaßen,wachen,zielen¦1anden:binden,finden,winden¦1argen:bergen¦1arsten:bersten¦1aten:bitten,tun¦3ahlen:befehlen¦1ogen:biegen,lügen,saugen,wiegen,ziehen¦1oten:bieten¦2iesen:blasen,preisen¦3ßten:blassen,pressen¦2achten:bringen¦6onnten:dafürkönnen¦1angen:dingen,ringen,singen¦1urften:dürfen¦2angen:dringen,wringen¦2oschen:dreschen¦1mailten:e-mailen¦1ielen:fallen¦1ingen:fangen,gehen¦2ßten:fassen,hassen,passen¦2ogen:fliegen¦2oren:frieren¦1aben:geben¦1alten:gelten¦3aren:gebären¦3iehen:gedeihen¦2itten:gleiten¦1oren:gären¦2uben:graben¦2iffen:greifen¦2tten:haben¦1ielten:halten¦1ießen:heißen,lassen¦1oben:heben,weben¦1onnten:können¦1uden:laden¦1iefen:laufen,rufen¦1agen:liegen¦1asen:lesen¦1iehen:leihen¦1itten:leiden,reiten¦1olken:melken¦1aßen:messen,sitzen¦1ieden:meiden¦1ochten:mögen,fechten¦3asen:genesen¦1ieten:raten¦1ochen:riechen¦3ufen:schaffen¦5ahen:geschehen¦4oren:schwären,verlieren¦1ahen:sehen¦1otten:sieden¦1offen:saufen¦2oben:stieben¦1anken:sinken¦2ugen:tragen¦2offen:triefen¦1hettoisierten:gettoisieren¦1uschen:waschen¦1ichen:weichen¦1iesen:weisen¦1arben:werben¦1ussten:wissen¦2ten:ölen,üben¦7ßten:veranlassen¦4arben:verderben¦5iben:vergraben¦4aten:vertuen,guttun¦5andten:übersenden¦6onnen:überspinnen¦3oben:abheben,beheben¦17erten:herauskristallisi,hinauskomplimenti¦5oben:hochheben¦5ogen:nachwiegen,überwiegen¦1annten:kennen,nennen,rennen¦4iefen:schlafen¦5aten:großtun¦18ten:institutionalisiere¦7aten:schwertun"
      }
    },
    "presentTense": {
      "first": {
        "fwd": "1:e¦le:eln¦1e:rn,un¦1ere:i",
        "both": ":n",
        "rev": "önnen:ann¦1eln:tle,kle,dle,ble,sle,ple,gle,fle,zle,mle,ßle,nle¦2eln:chle¦3n:tere,bere,nere,gere,fere,dere,mere,sere,kere,pere,lere,vere,ßere¦4n:euere,auere,äuere,owere,ähere¦5n:feiere,ichere,leiere,uchere,achere,öchere",
        "ex": "4:sollen¦15:aufrechterhalte,wiedervereinige¦17:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦19:institutionalisiere¦schwimme brust:brustschwimmen¦schwimme delfin:delfinschwimmen¦schwimme delphin:delphinschwimmen¦fahre:rad fahren¦fahre rad:radfahren¦bin:sein¦schäme:fremdschämen¦17re:entkommerzialisie¦13le:weiterentwickel¦6ann:dafürkönnen¦1arf:dürfen¦1maile:e-mailen¦1ann:können¦1ag:mögen¦1uss:müssen¦1hettoisiere:gettoisieren¦1ill:wollen¦1eiß:wissen¦7e:recyceln,stochern¦11e:abzwitschern¦9e:einäschern,plätschern,zwitschern¦17ere:herauskristallisi,hinauskomplimenti¦6e:bechern,fächern,panzern,reihern,wiehern,äschern,großtun¦4e:eiern¦5e:feiern,leiern,guttun¦4le:freveln¦2e:tun¦8e:schwertun"
      },
      "second": {
        "fwd": "immst:ehmen¦iffst:effen¦ächst:achsen¦st:e¦irst:erden¦1st:len,ln,rn,äen,un¦1ßt:ässen¦1erst:i¦2st:mmen,eren,emen,eien,anen,oren¦2t:usen,psen,ksen,isen,msen,nsen,aßen,lsen,ößen,rsen¦3st:ichen,ächen,iehen,iffen,ähren,äufen¦3t:iesen,ilzen,ussen",
        "both": "5ägst:mschlagen,kschlagen,lschlagen,rschlagen,hschlagen,tschlagen,sschlagen¦5st:üchten,falten,iraten,rchten,talten,palten,achten,uchten,ichten¦4st:raden,ürden,mschen,ahten,nschen,orden,neten,haden,pschen,peten,naufen,iechen,wahren,rschen,ieten,chnen,tschen,kaufen,lschen,ischen,uschen,beten¦4ßt:rblassen,inpassen¦4ägst:entragen,intragen¦4t:glasen,pissen¦3st:nchen,kten,ähmen,ähnen,lehen,üden,lchen,äten,pten,mden,ühnen,uffen,äffen,ühmen,fnen,offen,ärfen,ahmen,öten,bnen,rafen,nien,üten,knen,oden,oten,tmen,ürfen,rchen,öden,wehen,eden,ehnen,uchen,ohren,gehen,ohnen,sten,tufen,tehen,gnen,affen,iden,ahnen,rufen,dnen,uten,ochen,ehren,nten,rten,ften,öhnen,ühren,rehen,achen,nden,tten,lden,iten¦3ägst:htragen,itragen,ttragen,rtragen¦3ällst:infallen,enfallen¦3t:älzen,olzen,alzen,rasen¦2t:ezen,äzen,osen,fzen,hzen,uzen,nzen,ißen,ösen,rzen,eßen,üßen,tzen,izen¦2st:ämen,öhen,omen,onen,efen,üfen,inen,amen,ihen,uhen,ähen,rnen,imen,ohen,unen,önen,ömen,aren,üren,rren,umen,ühen,ären,ören,ifen,rmen,lmen,enen,pfen,nnen¦2iehlst:pfehlen¦2isst:eressen,fressen¦2ischst:rlöschen¦2äßt:rlassen,tlassen,hlassen,slassen¦2ällst:tfallen,hfallen,rfallen,efallen,sfallen,ffallen,mfallen¦2ßt:fassen¦2irbst:sterben¦2äbst:graben¦2äst:blasen¦1isst:gessen,hessen,messen¦1st:ven,pen,uen,ken,ben,gen¦1iehlst:tehlen¦1äfst:lafen¦1illst:uellen,wellen¦1t:xen¦1irbst:werben¦1äschst:waschen¦1ittst:reten¦1ichst:techen,rechen¦1iehst:sehen¦1äufst:saufen,laufen¦1ätst:raten¦1iest:lesen¦1ädst:laden¦1ibst:geben¦1ängst:fangen¦1ältst:halten¦ichtst:echten¦irfst:erfen¦ößt:oßen¦ilzt:elzen¦ilfst:elfen¦iltst:elten¦ährst:ahren",
        "rev": "allen:ällst¦assen:äßt,ässt¦elken:ilkst¦ergen:irgst¦erben:irbst¦1ehmen:nimmst¦1en:ht¦1agen:lägst¦1effen:riffst¦1achsen:wächst¦1erden:wirst¦2n:elst,test,dest¦2en:ilst,olst,alst,älst,ulst,ülst,säst,ölst,rlst¦2ecken:hrickst¦2agen:trägst¦2ssen:reßt,näßt,laßt¦2eschen:drischst¦2ben:hast¦3en:ommst,ahlst,ämmst,asst,ierst,ipst,üsst,allst,ollst,ielst,ellst,ählst,uemst,ummst,ühlst,ohlst,emmst,ammst,ahrst,üllst,öhlst,eerst,echst,lößt,ullst,neist,esst,aufst,lanst,eelst,uhlst,apst,ümmst,maßt,morst,iemst¦3n:terst,uerst,derst,nerst,berst,ferst,gerst,herst,merst,serst,perst,kerst,lerst,ßerst,verst¦4en:eichst,urkst,tillst,weist,ziehst,hiffst,wimmst,timmst,leist,kiest,ranst,öschst,währst,rillst,liehst,limmst,aschst,rimmst,eschst,hwerst,querst,lichst,rinst¦4n:owerst¦5en:bremst,preist,ereist,hleust,kreist,treist,rreist,nreist¦5n:feierst,leierst",
        "ex": "schwimmst brust:brustschwimmen¦schwimmst delfin:delfinschwimmen¦schwimmst delphin:delphinschwimmen¦fährst:rad fahren¦fährst rad:radfahren¦isst:essen¦bist:sein¦7t:abblassen,abpressen,kreischen,abbrausen,abspeisen,aufhalsen,aushülsen,ausreisen,entfilzen,zerzausen,entlausen,vermiesen,verwaisen,verzinsen¦2isst:abessen,fressen¦3ällst:abfallen,anfallen,zufallen¦6t:abfassen,abküssen,abpassen,anfassen,vergasen,becircen,rutschen,schubsen,verwesen,abreisen,absausen,enteisen,loseisen,glucksen,klecksen,knacksen,knicksen,plumpsen,schmusen,tricksen¦3äßt:ablassen,anlassen,belassen,dalassen,zulassen¦7st:ablöschen,aufbahren,ausbaden,erhaschen,erkalten,erkälten,gebärden,knechten,schalten,recyclen,veralten,abscheren,ausspeien,bescheren,eincremen,verfehlen,schwächen,verjähren¦8t:abrutschen,zerpressen,anknacksen,aufbrausen,beklecksen,einheimsen,heimreisen,losbrausen,nachreisen,verspeisen,verkorksen¦9st:abschalten,anschalten,begrabschen,durchzechen,umschalten,vorpreschen,beinhalten,downloaden,mähdreschen,verbeamten,überraschen,abschwächen,aufschreien,ausschreien,fortscheren,kahlscheren,verschreien,prophezeien¦6ägst:abschlagen,anschlagen,heimtragen,zuschlagen,beschlagen¦6ickst:abschrecken,erschrecken¦4ägst:abtragen,antragen,betragen,zutragen,schlagen¦4ßt:anpassen,stressen¦5ßt:anpressen,aufpassen,erpressen,verpassen¦3isst:aufessen,ausessen,mitessen¦4äßt:auflassen,einlassen,hinlassen,weglassen¦11ältst:aufrechterhalte¦7ägst:aufschlagen,davontragen,einschlagen,hinschlagen¦7ickst:aufschrecken¦5ägst:auftragen,austragen,wegtragen¦5ischst:ausdreschen,verdreschen¦8st:auslöschen,vernaschen,verwalten,gefährden,retweeten,verarzten,verblüffen,vergeuden,anschreien,ausscheren,beschreien,einscheren,wegscheren,zerscheren,schwertun,überhäufen¦4ilkst:ausmelken¦6ßt:auspressen,einpressen,verprassen¦9t:ausrutschen,freipressen,verrutschen,austricksen,durchpausen,durchreisen,durchsausen¦10st:ausschalten,einschalten,verschalten¦8ässt:bleibenlassen,blickenlassen¦8ßt:durchpressen¦11t:durchrutschen,durchplumpsen,einherbrausen¦17rst:entkommerzialisie¦11ägst:entzweischlagen¦5ässt:freilassen¦13st:gleichschalten,zurückschalten,vervollkommnen¦8ickst:hochschrecken¦6äßt:offenlassen¦15st:parallelschalten,weiterentwickel¦6st:umtaufen,achthaben,begrünen,freihaben,hechten,preschen,gernhaben,wappnen,anspeien,befreien,ernähren,erpichen,panzern,schreien,schwanen,schwelen,großtun¦4irgst:verbergen¦7ilzst:verschmelzen¦4isst:vollessen¦7äßt:vorbeilassen,zurücklassen¦4ällst:wegfallen¦10äßt:zufriedenlassen¦7ällst:zurückfallen¦10ickst:zurückschrecken¦8ägst:zurücktragen¦9äßt:zusammenlassen¦12t:zusammenpassen¦13t:zusammenpressen¦12st:zusammenraufen,hinausschreien,niederschreien¦12ägst:zusammenschlagen¦12ickst:zusammenschrecken¦5st:achten,bejahen,blechen,falten,haschen,löschen,naschen,texten,walten,widmen,zelten,ächten,chillen,feiern,leiern,scheren,träufen,guttun¦3st:ahmen,ahnen,ehren,gehen,rufen,wehen,äffen,öden,feien¦7ässt:alleinlassen,fallenlassen,hängenlassen¦4st:baden,bahren,beten,erden,golfen,kaufen,raufen,spuren,taufen,tränen,wahren,waten,zechen,cremen,eichen,eiern,fehlen,häufen,kiffen,killen,nähren,rillen,rächen,währen,ziehen¦1irgst:bergen¦1irst:bersten,werden¦3iehlst:befehlen¦2äst:blasen¦3ßt:blassen,pressen¦5t:browsen,genesen,bremsen,fliesen,grausen,heimsen,krausen,kreisen,mucksen,piepsen,preisen,rülpsen,speisen¦6annst:dafürkönnen¦1arfst:dürfen¦2ischst:dreschen¦3t:düsen,fußen,gasen,pesen,rasen,eisen,maßen¦1mailst:e-mailen¦1ällst:fallen¦1ängst:fangen¦2ßt:fassen,hassen,passen,nässen¦4t:fräsen,glasen,küssen,lotsen,pissen,sülzen,bimsen,bumsen,filzen,halsen,hopsen,hülsen,koksen,lausen,mopsen,morsen,niesen,parsen,pausen,reisen,sausen,spaßen,weisen,zausen¦1ibst:geben¦2äbst:graben¦2st:haben,säen,tun,ölen¦1ältst:halten¦6ässt:gehenlassen¦1annst:können¦1ädst:laden¦1äßt:lassen¦1äufst:laufen,saufen¦1iest:lesen¦1ilkst:melken¦1isst:messen¦1agst:mögen¦1usst:müssen¦1ätst:raten¦5iehst:geschehen¦4ickst:schrecken¦1iehst:sehen¦2irbst:sterben¦2ägst:tragen¦1hettoisierst:gettoisieren¦1äschst:waschen¦1illst:wollen¦1irbst:werben¦1eißt:wissen¦11st:inlineskaten¦7ßt:veranlassen¦4irbst:verderben¦16st:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦10t:durchbrausen,niedersausen,beeinflussen,bezuschussen¦17erst:herauskristallisi,hinauskomplimenti¦14st:wiedervereinige¦1immst:nehmen¦1ächst:wachsen¦18st:institutionalisiere"
      },
      "third": {
        "fwd": "ilt:elten¦immt:ehmen¦ifft:effen¦icht:echten¦t:e¦1t:len,ln,rn,äen,un¦1ßt:ässen¦1ert:i¦2t:mmen,eren,aßen,ößen,rsen¦3t:ichen,iehen,iffen,iesen,ähren,ilzen,äufen¦3st:peien",
        "both": "5ägt:mschlagen,kschlagen,lschlagen,rschlagen,hschlagen,tschlagen,sschlagen¦5t:üchten,falten,iraten,rchten,talten,palten,achten,uchten,ichten¦4t:raden,ürden,mschen,ahten,nschen,orden,glasen,neten,haden,pissen,pschen,peten,naufen,iechen,wahren,rschen,ieten,chnen,tschen,kaufen,lschen,ischen,uschen,beten¦4ßt:rblassen,inpassen¦4ägt:entragen,intragen¦3t:nchen,kten,ähmen,ähnen,lehen,üden,lchen,äten,pten,mden,ussen,ühnen,uffen,äffen,ühmen,älzen,fnen,offen,ärfen,ahmen,öten,bnen,rafen,nien,üten,knen,oden,olzen,oten,tmen,alzen,ürfen,rchen,öden,wehen,eden,ehnen,uchen,ohren,gehen,ohnen,sten,tufen,tehen,gnen,ächen,affen,iden,ahnen,rufen,dnen,uten,ochen,ehren,nten,rten,ften,rasen,öhnen,ühren,rehen,achen,nden,tten,lden,iten¦3ägt:htragen,itragen,ttragen,rtragen¦3ällt:infallen,enfallen¦2t:ezen,oren,ämen,öhen,omen,äzen,onen,efen,anen,üfen,osen,fzen,hzen,lsen,eien,inen,amen,ihen,uhen,ähen,rnen,imen,uzen,nsen,ohen,msen,emen,unen,önen,nzen,ömen,aren,üren,rren,umen,ißen,isen,ühen,ksen,ösen,rzen,psen,ären,ören,ifen,rmen,eßen,lmen,enen,pfen,üßen,nnen,usen,tzen,izen¦2iehlt:pfehlen¦2isst:eressen,fressen¦2ischt:rlöschen¦2äßt:rlassen,tlassen,hlassen,slassen¦2ällt:tfallen,hfallen,rfallen,efallen,sfallen,ffallen,mfallen¦2ßt:fassen¦2irbt:sterben¦2äbt:graben¦2äst:blasen¦1isst:gessen,hessen,messen¦1t:ven,xen,pen,uen,ken,ben,gen¦1iehlt:tehlen¦1äft:lafen¦1illt:uellen,wellen¦1irbt:werben¦1äscht:waschen¦1itt:reten¦1icht:techen,rechen¦1ieht:sehen¦1äuft:saufen,laufen¦1ät:raten¦1iest:lesen¦1ädt:laden¦1ibt:geben¦1ängt:fangen¦1ält:halten¦ird:erden¦ächst:achsen¦irft:erfen¦ößt:oßen¦ilzt:elzen¦ilft:elfen¦ährt:ahren",
        "rev": "allen:ällt¦assen:äßt,ässt¦elken:ilkt¦ergen:irgt¦önnen:ann¦erben:irbt¦1elten:gilt,hilt¦1ehmen:nimmt¦1n:et¦1agen:lägt¦1ecken:rickt¦1effen:rifft¦1echten:ficht¦1ben:at¦1en:nt¦2n:elt¦2en:olt,alt,ult,ült,sät,ölt,ast,rlt¦2agen:trägt¦2ssen:reßt,näßt,laßt¦2eschen:drischt¦2echten:flicht¦3en:ommt,ahlt,asst,eilt,iert,allt,ühlt,ollt,ammt,ielt,ählt,ummt,üllt,ohlt,uält,ämmt,emmt,ahrt,ellt,öhlt,eert,echt,lößt,ullt,esst,auft,eelt,uhlt,ümmt,maßt¦3n:tert,bert,nert,pert,gert,fert,dert,uert,hert,sert,kert,mert,lert,vert,ßert¦4en:eicht,öscht,chält,timmt,zieht,wimmt,limmt,hifft,währt,rillt,lieht,ascht,rimmt,escht,hwert,quert,kiest,tillt¦4n:owert¦5n:feiert,leiert¦5en:tlicht,rlicht,hlicht",
        "ex": "4:sollen¦schwimmt brust:brustschwimmen¦schwimmt delfin:delfinschwimmen¦schwimmt delphin:delphinschwimmen¦fährt:rad fahren¦fährt rad:radfahren¦isst:essen¦ist:sein¦7t:abblassen,ablöschen,abpressen,aufbahren,ausbaden,erhaschen,erkalten,erkälten,gebärden,knechten,schalten,recyclen,veralten,abscheren,bescheren,entfilzen,verfehlen,ehelichen,verjähren,vermiesen¦2isst:abessen,fressen¦3ällt:abfallen,anfallen,zufallen¦6t:abfassen,abküssen,abpassen,anfassen,umtaufen,vergasen,achthaben,becircen,begrünen,freihaben,hechten,preschen,gernhaben,schubsen,wappnen,verwesen,ernähren,erpichen,panzern,schwelen,großtun¦3äßt:ablassen,anlassen,belassen,dalassen,zulassen¦9t:abschalten,anschalten,begrabschen,durchzechen,freipressen,umschalten,vorpreschen,beinhalten,downloaden,mähdreschen,verbeamten,überraschen,fortscheren,kahlscheren,ermöglichen¦6ägt:abschlagen,anschlagen,heimtragen,zuschlagen,beschlagen¦6ickt:abschrecken,erschrecken¦4ägt:abtragen,antragen,betragen,zutragen,schlagen¦4ßt:anpassen,stressen¦5ßt:anpressen,aufpassen,erpressen,verpassen¦3isst:aufessen,ausessen,mitessen¦4äßt:auflassen,einlassen,hinlassen,weglassen¦11ält:aufrechterhalte¦7ägt:aufschlagen,davontragen,einschlagen,hinschlagen¦7ickt:aufschrecken¦5ägt:auftragen,austragen,wegtragen¦5ischt:ausdreschen,verdreschen¦8t:auslöschen,vernaschen,verwalten,zerpressen,gefährden,retweeten,verarzten,verblüffen,vergeuden,ausscheren,einscheren,wegscheren,zerscheren,schwertun,überhäufen¦4ilkt:ausmelken¦6ßt:auspressen,einpressen,verprassen¦10t:ausschalten,einschalten,verschalten¦8ässt:bleibenlassen,blickenlassen¦8ßt:durchpressen¦17rt:entkommerzialisie¦11ägt:entzweischlagen¦5ässt:freilassen¦13t:gleichschalten,zurückschalten,zusammenpressen,vervollkommnen¦8ickt:hochschrecken¦6äßt:offenlassen¦15t:parallelschalten,weiterentwickel¦4irgt:verbergen¦4isst:vollessen¦7äßt:vorbeilassen,zurücklassen¦4ällt:wegfallen¦10äßt:zufriedenlassen¦7ällt:zurückfallen¦10ickt:zurückschrecken¦8ägt:zurücktragen¦9äßt:zusammenlassen¦12t:zusammenpassen,zusammenraufen¦12ägt:zusammenschlagen¦12ickt:zusammenschrecken¦5t:achten,bejahen,blechen,browsen,falten,haschen,löschen,genesen,naschen,texten,walten,widmen,zelten,ächten,chillen,feiern,fliesen,leiern,scheren,träufen,guttun¦3t:ahmen,ahnen,düsen,ehren,fußen,gasen,gehen,pesen,rasen,rufen,wehen,äffen,öden,eilen,maßen¦7ässt:alleinlassen,fallenlassen,hängenlassen¦4t:baden,bahren,beten,erden,fräsen,glasen,golfen,kaufen,küssen,lotsen,pissen,raufen,spuren,sülzen,taufen,tränen,wahren,waten,zechen,eichen,eiern,fehlen,filzen,häufen,kiffen,killen,morsen,niesen,nähren,parsen,rillen,spaßen,währen,ziehen¦1irgt:bergen¦1irst:bersten¦3iehlt:befehlen¦2äst:blasen¦3ßt:blassen,pressen¦6ann:dafürkönnen¦1arf:dürfen¦2ischt:dreschen¦1mailt:e-mailen¦1ällt:fallen¦1ängt:fangen¦2ßt:fassen,hassen,passen,nässen¦1ibt:geben¦2äbt:graben¦2t:haben,säen,tun,ölen¦1ält:halten¦6ässt:gehenlassen¦1ann:können¦1ädt:laden¦1äßt:lassen¦1äuft:laufen,saufen¦1iest:lesen¦1ilkt:melken¦1isst:messen¦1ag:mögen¦1uss:müssen¦1ät:raten¦5ieht:geschehen¦4ickt:schrecken¦1ieht:sehen¦2irbt:sterben¦2ägt:tragen¦1hettoisiert:gettoisieren¦1äscht:waschen¦1ill:wollen¦1irbt:werben¦1eiß:wissen¦11t:inlineskaten,verheimlichen,verniedlichen,verwirklichen¦7ßt:veranlassen¦4irbt:verderben¦5äd:überladen¦6st:anspeien¦16t:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦7st:ausspeien¦17ert:herauskristallisi,hinauskomplimenti¦14t:wiedervereinige,veranschaulichen¦1icht:fechten¦2icht:flechten¦1ilt:gelten¦1immt:nehmen¦18t:institutionalisiere"
      },
      "firstPlural": {
        "fwd": ":¦1n:e¦1eren:i",
        "both": "",
        "rev": ":",
        "ex": "schwimmen brust:brustschwimmen¦schwimmen delfin:delfinschwimmen¦schwimmen delphin:delphinschwimmen¦fahren:rad fahren¦fahren rad:radfahren¦17ren:entkommerzialisie¦15n:weiterentwickel,aufrechterhalte,wiedervereinige¦1ind:sein¦1mailen:e-mailen¦1hettoisieren:gettoisieren¦5n:vertuen¦17n:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦17eren:herauskristallisi,hinauskomplimenti¦19n:institutionalisiere"
      },
      "secondPlural": {
        "fwd": "t:en,e¦1t:ln,rn,un¦1ert:i",
        "both": "4ßt:rblassen,inpassen¦4t:chnen¦3ßt:rfassen,eressen,rlassen,tlassen,hlassen,slassen,fressen¦3t:fnen,bnen,nien,knen,tmen,gnen,dnen¦2ßt:gessen,hessen,messen¦2t:den,ten¦1ßt:ässen",
        "rev": "1en:gt,zt,mt,st,ht,ft,kt,bt,ut,nt,pt,xt,it,ät,vt¦1ssen:aßt¦2en:ißt,üßt,hrt,ilt,llt,olt,ärt,hlt,alt,ält,rrt,ürt,art,ult,oßt,ört,ült,ößt,ölt,rlt,ort¦2n:elt,net¦2ssen:reßt¦3n:tert,dert,uert,nert,pert,fert,gert,hert,bert,sert,kert,mert,lert,vert,ßert¦3en:ießt,iert,ielt,eert,eelt,maßt¦4n:owert¦4en:hwert,quert¦5n:feiert,leiert",
        "ex": "schwimmt brust:brustschwimmen¦schwimmt delfin:delfinschwimmen¦schwimmt delphin:delphinschwimmen¦fahrt:rad fahren¦fahrt rad:radfahren¦3ßt:abessen,blassen,pressen¦4ßt:ablassen,anlassen,anpassen,aufessen,ausessen,befassen,belassen,dalassen,mitessen,zufassen,zulassen,stressen,umfassen¦5ßt:anpressen,auffassen,auflassen,aufpassen,einfassen,einlassen,erpressen,hinlassen,verpassen,vollessen,weglassen¦15t:aufrechterhalte,weiterentwickel¦6ßt:auspressen,einpressen,nachfassen,verprassen¦8ßt:durchpressen,vorbeilassen,zurücklassen¦17rt:entkommerzialisie¦7ßt:offenlassen,veranlassen¦11ßt:zufriedenlassen¦10ßt:zusammenfassen,zusammenlassen¦3d:sein¦1mailt:e-mailen¦4äuft:eislaufen¦2ßt:fassen,hassen,lassen,passen¦1hettoisiert:gettoisieren¦6t:wappnen,becircen,panzern,schwelen,großtun¦5t:widmen,feiern,leiern,scheren,guttun¦7t:recyclen,abscheren,bescheren¦13t:vervollkommnen¦16t:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦8t:ausscheren,einscheren,wegscheren,zerscheren,schwertun¦9t:fortscheren,kahlscheren¦17ert:herauskristallisi,hinauskomplimenti¦14t:wiedervereinige¦4t:eiern,spaßen,spuren¦3t:fußen,maßen¦2t:tun,ölen¦18t:institutionalisiere"
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
        "fwd": "ieße:oßen¦öge:iehen¦äte:un¦1te:ln,rn,äen,re¦1öbe:hieben,heben¦1öge:wiegen,wegen¦1iefe:lafen¦1erte:i¦2te:älen,elen,aßen,ölen,rsen¦3te:ächen,annen,weren,ueren,üssen",
        "both": "4:wören¦5te:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4te:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,seifen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßte:rblassen,inpassen¦4ände:gestehen¦4üfe:ischaffen¦3te:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,ussen,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2te:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ähle:pfehlen¦2äße:eressen,fressen¦2änge:rringen,dringen,pringen¦2äge:rliegen,hliegen,nliegen¦2ßte:fassen¦2iege:hweigen¦2iese:preisen,blasen¦2öge:nlügen,fliegen¦2öre:frieren¦2ächte:bringen¦2üge:tragen,hlagen¦2iche:treichen¦2iffe:greifen¦2übe:graben¦1äße:gessen,hessen,sitzen,messen¦1öhe:liehen¦1ßte:ässen¦1te:ven,xen,pen,ken,uen¦1änke:sinken,rinken,tinken¦1öge:rügen,saugen,biegen¦1ähle:tehlen¦1annte:nennen,kennen,rennen¦1öre:heren,kiesen¦1ölte:helten¦1iehe:leihen¦1öche:riechen¦1äte:bitten,reten¦1ände:winden,finden,binden¦1ölle:uellen,wellen¦1ömme:limmen¦1iee:peien,reien¦1ämme:wimmen¦1iene:heinen¦1ieße:lassen¦1inge:fangen,gehen¦1ächte:denken¦1öte:bieten¦1änge:wingen,singen,lingen¦1ärbe:werben,terben¦1iese:weisen¦1iche:weichen,leichen¦1üsche:waschen¦1iege:teigen¦1äche:techen,rechen¦1ünde:tehen¦1ähe:sehen¦1itte:neiden,reiten¦1iffe:leifen,feifen,neifen¦1iede:heiden¦1öffe:saufen¦1iete:raten¦1äse:lesen¦1iefe:laufen,rufen¦1üde:laden¦1ielte:halten¦1älte:gelten¦1äbe:geben¦1iele:fallen¦ürde:erden¦üchse:achsen¦öchte:echten¦äfe:effen¦ärfe:erfen¦ölze:elzen¦ähme:ehmen¦äme:ommen¦älfe:elfen¦änne:innen¦össe:ießen¦ühre:ahren¦iebe:eiben¦isse:eißen",
        "rev": "ingen:änge¦ecken:äke¦iegen:äge¦elken:ölke¦affen:üfe¦ergen:ärge¦eiden:iede¦eihen:iehe¦ieden:ötte¦aben:ätte¦esen:äse¦ehen:ähe¦innen:önne¦erben:ärbe¦1en:ste,fte,bte,gte,ite,zte¦1oßen:tieße¦1iehen:zöge¦1eschen:rösche¦1eben:wöbe¦1eißen:hieße¦1ehen:tände¦2eiten:glitte¦2n:tete,dete,nete¦2ieben:chöbe¦2eben:nhöbe,shöbe,rhöbe¦2en:inte,säte,hrte,hlte,ihte,llte,örte¦2ssen:reßte,laßte¦2egen:ewöge¦3n:telte,kelte,derte,uerte,terte,pelte,belte,selte,gerte,felte,helte,herte,delte,melte,berte,zelte,gelte,serte,ferte,kerte,perte,merte,ßelte,nerte,lerte,verte,ßerte,nelte¦3en:schte,ichte,hälte,ennte,uälte,echte,eelte,maßte¦4n:eierte,owerte¦4en:wächte,pielte,zielte,pannte,tielte,mannte,hwerte,querte¦4afen:schliefe",
        "ex": "6:chillen,gebären¦8:erlöschen¦9:verlöschen¦schwömme brust:brustschwimmen¦schwömme delfin:delfinschwimmen¦schwömme delphin:delphinschwimmen¦führe:rad fahren¦führe rad:radfahren¦äße:essen¦wäre:sein¦7te:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3änge:abdingen,abringen¦2äße:abessen,fressen¦6te:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen¦4itte:abgleiten,ausleiden,mitleiden¦8te:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9te:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äke:abschrecken,erschrecken¦4ßte:anpassen,stressen¦5ßte:anpressen,aufpassen,erpressen,verpassen¦3äße:aufessen,ausessen,mitessen¦4äge:aufliegen,beiliegen¦11ielte:aufrechterhalte¦7äke:aufschrecken¦5ösche:ausdreschen,verdreschen¦5itte:ausgleiten,entgleiten¦4ölke:ausmelken¦6ßte:auspressen,einpressen,verprassen¦10te:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5änge:auswringen¦5te:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3öge:belügen,erwägen,abwiegen¦5äge:bloßliegen,festliegen,naheliegen¦3äge:daliegen¦6öge:durchlügen¦8ßte:durchpressen¦6änge:durchringen¦7öche:durchstechen¦6öbe:durchweben¦4öbe:einweben,aufheben,wegheben,entheben¦11te:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rte:entkommerzialisie¦3itte:erleiden¦5üfe:erschaffen¦13te:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ieße:gutheißen,verheißen¦12te:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfe:herschaffen,hinschaffen¦6äge:herumliegen¦10üfe:hierherschaffen¦9üfe:hinaufschaffen,zurückschaffen¦13ämme:hinterherschwimme¦8äke:hochschrecken¦9ände:missverstehen¦5öre:nachgären¦7üfe:nachschaffen¦8itte:niedergleiten¦15te:parallelschalten,weiterentwickel,weiterverbreiten¦8äge:richtigliegen¦7äge:schiefliegen,zurückliegen¦4ärge:verbergen¦4iede:vermeiden¦4iehe:verzeihen¦4äße:vollessen¦4öge:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14te:wiedervereinige,zurückbegleiten¦4ötte:zersieden¦10äke:zurückschrecken¦12äke:zusammenschrecken¦16te:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦5ätte:achthaben,freihaben,gernhaben¦3te:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen,nölen¦1üke:backen¦4te:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1ände:binden,finden,winden¦1ärge:bergen¦1ärste:bersten¦1äte:bitten,tun¦3ähle:befehlen¦5osse:beschießen¦1öge:biegen,lügen,saugen,wiegen,ziehen¦1öte:bieten¦2iese:blasen,preisen¦3ßte:blassen,pressen¦2ächte:bringen¦1ächte:denken¦1änge:dingen,ringen,singen¦2änge:dringen,wringen¦2ösche:dreschen¦1mailte:e-mailen¦1iele:fallen¦1inge:fangen,gehen¦2ßte:fassen,hassen,passen¦2öge:fliegen¦2öre:frieren¦1äbe:geben¦1älte:gelten¦3achte:gedenken¦3iehe:gedeihen¦2itte:gleiten¦1öre:gären¦2übe:graben¦2iffe:greifen¦1ätte:haben¦1ielte:halten¦1ieße:heißen,lassen¦1öbe:heben,weben¦1üde:laden¦1iefe:laufen,rufen¦1äge:liegen¦1äse:lesen¦1iehe:leihen¦1itte:leiden,reiten¦1ölke:melken¦1äße:messen,sitzen¦1iede:meiden¦2chte:mögen¦1annte:nennen,rennen¦3äse:genesen¦1iete:raten¦1öche:riechen¦3üfe:schaffen¦5ähe:geschehen¦4äke:schrecken¦4ore:schwären¦1ähe:sehen¦1ötte:sieden¦1öffe:saufen¦4ände:gestehen¦2öbe:stieben¦1änke:sinken¦2üge:tragen¦2öffe:triefen¦1hettoisierte:gettoisieren¦3önne:gewinnen¦1üsche:waschen¦1iche:weichen¦1iese:weisen¦1ärbe:werben¦1üsste:wissen¦2te:ölen,üben,säen¦4öße:umfließen¦7ßte:veranlassen¦4ärbe:verderben¦5ibe:vergraben¦4öre:verlieren¦4äte:vertuen,guttun¦5andte:übersenden¦6önne:überspinnen¦6ände:überstehen¦3öbe:abheben,beheben¦17erte:herauskristallisi,hinauskomplimenti¦5öbe:hochheben¦5öge:nachwiegen,überwiegen¦4iefe:schlafen¦5äte:großtun¦18te:institutionalisiere¦7äte:schwertun"
      },
      "second": {
        "fwd": "ießest:oßen¦ögest:iehen¦ätest:un¦1test:ln,rn,äen,re¦1öbest:hieben,heben¦1ögest:wiegen,wegen¦1iefest:lafen¦1ertest:i¦2test:älen,elen,aßen,ölen,rsen¦3test:ächen,annen,weren,ueren,üssen",
        "both": "5test:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4test:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,hnden,vieren,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,seifen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßtest:rblassen,inpassen¦4ändest:gestehen¦4üfest:ischaffen¦4st:wören¦3test:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,ussen,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2test:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ählest:pfehlen¦2äßest:eressen,fressen¦2ängest:rringen,dringen,pringen¦2ägest:rliegen,hliegen,nliegen¦2ßtest:fassen¦2iegest:hweigen¦2iesest:preisen,blasen¦2ögest:nlügen,fliegen¦2örest:frieren¦2ächtest:bringen¦2ügest:tragen,hlagen¦2ichest:treichen¦2iffest:greifen¦2übest:graben¦1äßest:gessen,hessen,sitzen,messen¦1öhest:liehen¦1ßtest:ässen¦1test:ven,xen,pen,ken,uen¦1änkest:sinken,rinken,tinken¦1ögest:rügen,saugen,biegen¦1ählest:tehlen¦1anntest:nennen,kennen,rennen¦1örest:heren,kiesen¦1öltest:helten¦1iehest:leihen¦1öchest:riechen¦1ätest:bitten,reten¦1ändest:winden,finden,binden¦1öllest:uellen,wellen¦1ömmest:limmen¦1ieest:peien,reien¦1ämmest:wimmen¦1ienest:heinen¦1ießest:lassen¦1ingest:fangen,gehen¦1ächtest:denken¦1ötest:bieten¦1ängest:wingen,singen,lingen¦1ärbest:werben,terben¦1iesest:weisen¦1ichest:weichen,leichen¦1üschest:waschen¦1iegest:teigen¦1ächest:techen,rechen¦1ündest:tehen¦1ähest:sehen¦1ittest:neiden,reiten¦1iffest:leifen,feifen,neifen¦1iedest:heiden¦1öffest:saufen¦1ietest:raten¦1äsest:lesen¦1iefest:laufen,rufen¦1üdest:laden¦1ieltest:halten¦1ältest:gelten¦1äbest:geben¦1ielest:fallen¦ürdest:erden¦üchsest:achsen¦öchtest:echten¦äfest:effen¦ärfest:erfen¦ölzest:elzen¦ähmest:ehmen¦ämest:ommen¦älfest:elfen¦ännest:innen¦össest:ießen¦ührest:ahren¦iebest:eiben¦issest:eißen",
        "rev": "ingen:ängest¦ecken:äkest¦iegen:ägest¦elken:ölkest¦affen:üfest¦ergen:ärgest¦eiden:iedest¦eihen:iehest¦ieden:öttest¦ommen:ämst¦aben:ättest¦ehmen:ähmst¦esen:äsest¦ehen:ähest¦erben:ärbest¦1en:stest,ftest,btest,gtest,itest,ztest¦1oßen:tießest¦1iehen:zögest¦1eschen:röschest¦1eben:wöbest¦1eißen:hießest¦1ehen:tändest¦2eiten:glittest¦2n:tetest,detest,netest¦2ieben:chöbest¦2eben:nhöbest,shöbest,rhöbest¦2en:intest,sätest,hrtest,hltest,ihtest,lltest,örtest¦2ssen:reßtest,laßtest¦2egen:ewögest¦3n:teltest,keltest,dertest,uertest,tertest,peltest,beltest,seltest,gertest,feltest,heltest,hertest,deltest,meltest,bertest,zeltest,geltest,sertest,fertest,kertest,pertest,mertest,ßeltest,nertest,lertest,vertest,ßertest,neltest¦3en:schtest,ichtest,hältest,enntest,uältest,echtest,eeltest,maßtest¦4n:eiertest,owertest¦4en:wächtest,pieltest,zieltest,panntest,tieltest,manntest,hwertest,quertest¦4afen:schliefest",
        "ex": "schwömmst brust:brustschwimmen¦schwömmst delfin:delfinschwimmen¦schwömmst delphin:delphinschwimmen¦führest:rad fahren¦führest rad:radfahren¦äßest:essen¦wärst:sein¦7test:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3ängest:abdingen,abringen¦2äßest:abessen,fressen¦6test:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen¦4ittest:abgleiten,ausleiden,mitleiden¦8test:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9test:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äkest:abschrecken,erschrecken¦4ßtest:anpassen,stressen¦5ßtest:anpressen,aufpassen,erpressen,verpassen¦3äßest:aufessen,ausessen,mitessen¦4ägest:aufliegen,beiliegen¦11ieltest:aufrechterhalte¦7äkest:aufschrecken¦5öschest:ausdreschen,verdreschen¦5ittest:ausgleiten,entgleiten¦4ölkest:ausmelken¦6ßtest:auspressen,einpressen,verprassen¦10test:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ängest:auswringen¦5test:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3ögest:belügen,erwägen,abwiegen¦5ägest:bloßliegen,festliegen,naheliegen¦3ägest:daliegen¦6ögest:durchlügen¦8ßtest:durchpressen¦6ängest:durchringen¦7öchest:durchstechen¦6öbest:durchweben¦4öbest:einweben,aufheben,wegheben,entheben¦11test:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rtest:entkommerzialisie¦3ittest:erleiden¦8st:erlöschen¦5üfest:erschaffen¦13test:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießest:gutheißen,verheißen¦12test:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfest:herschaffen,hinschaffen¦6ägest:herumliegen¦10üfest:hierherschaffen¦9üfest:hinaufschaffen,zurückschaffen¦13ämmest:hinterherschwimme¦8äkest:hochschrecken¦9ändest:missverstehen¦5örest:nachgären¦7üfest:nachschaffen¦8ittest:niedergleiten¦15test:parallelschalten,weiterentwickel,weiterverbreiten¦8ägest:richtigliegen¦7ägest:schiefliegen,zurückliegen¦4ärgest:verbergen¦9st:verlöschen¦4iedest:vermeiden¦4iehest:verzeihen¦4äßest:vollessen¦4ögest:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14test:wiedervereinige,zurückbegleiten¦4öttest:zersieden¦10äkest:zurückschrecken¦12äkest:zusammenschrecken¦16test:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦9ämst:abhandenkommen¦5ättest:achthaben,freihaben,gernhaben¦3test:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen,nölen¦1ükst:backen¦4test:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1ändest:binden,finden,winden¦1ärgest:bergen¦1ärstest:bersten¦1ätest:bitten,tun¦3ählest:befehlen¦11öbst:beiseiteschieben¦5ossest:beschießen¦1ögest:biegen,lügen,saugen,wiegen,ziehen¦1ötest:bieten¦2iesest:blasen,preisen¦3ßtest:blassen,pressen¦2ächtest:bringen¦1ächtest:denken¦1ängest:dingen,ringen,singen¦2ängest:dringen,wringen¦2öschest:dreschen¦1mailtest:e-mailen¦1ielest:fallen¦1ingest:fangen,gehen¦2ßtest:fassen,hassen,passen¦2ögest:fliegen¦7ämst:freibekommen¦5ähmst:freinehmen¦2örest:frieren¦1äbest:geben¦1ältest:gelten¦6st:gebären¦3achtest:gedenken¦3iehest:gedeihen¦2ittest:gleiten¦1örest:gären¦2übest:graben¦2iffest:greifen¦1ättest:haben¦1ieltest:halten¦1ießest:heißen,lassen¦1öbest:heben,weben¦1üdest:laden¦1iefest:laufen,rufen¦1ägest:liegen¦1äsest:lesen¦1iehest:leihen¦1ittest:leiden,reiten¦1ölkest:melken¦1äßest:messen,sitzen¦1iedest:meiden¦2chtest:mögen¦1anntest:nennen,rennen¦3äsest:genesen¦1ietest:raten¦1öchest:riechen¦3üfest:schaffen¦5ähest:geschehen¦4äkest:schrecken¦4orest:schwären¦1ähest:sehen¦1öttest:sieden¦1öffest:saufen¦4ändest:gestehen¦2öbest:stieben¦1änkest:sinken¦2ügest:tragen¦2öffest:triefen¦1hettoisiertest:gettoisieren¦3önnst:gewinnen¦1üschest:waschen¦1ichest:weichen¦1iesest:weisen¦1ärbest:werben¦1üsstest:wissen¦2test:ölen,üben,säen¦5ähst:sattsehen¦4ößest:umfließen¦7ßtest:veranlassen¦4ärbest:verderben¦5ibest:vergraben¦4örest:verlieren¦4ätest:vertuen,guttun¦8ähmst:vorliebnehmen¦5andtest:übersenden¦6önnest:überspinnen¦6ändest:überstehen¦3öbest:abheben,beheben¦17ertest:herauskristallisi,hinauskomplimenti¦5öbest:hochheben¦5ögest:nachwiegen,überwiegen¦4iefest:schlafen¦5ätest:großtun¦18test:institutionalisiere¦7ätest:schwertun"
      },
      "third": {
        "fwd": "ieße:oßen¦öge:iehen¦äte:un¦1te:ln,rn,äen,re¦1öbe:hieben,heben¦1öge:wiegen,wegen¦1iefe:lafen¦1erte:i¦2te:älen,elen,aßen,ölen,rsen¦3te:ächen,annen,weren,ueren,üssen",
        "both": "4:wören¦5te:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4te:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,seifen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßte:rblassen,inpassen¦4ände:gestehen¦4üfe:ischaffen¦3te:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,ussen,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2te:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ähle:pfehlen¦2äße:eressen,fressen¦2änge:rringen,dringen,pringen¦2äge:rliegen,hliegen,nliegen¦2ßte:fassen¦2iege:hweigen¦2iese:preisen,blasen¦2öge:nlügen,fliegen¦2öre:frieren¦2ächte:bringen¦2üge:tragen,hlagen¦2iche:treichen¦2iffe:greifen¦2übe:graben¦1äße:gessen,hessen,sitzen,messen¦1öhe:liehen¦1ßte:ässen¦1te:ven,xen,pen,ken,uen¦1änke:sinken,rinken,tinken¦1öge:rügen,saugen,biegen¦1ähle:tehlen¦1annte:nennen,kennen,rennen¦1öre:heren,kiesen¦1ölte:helten¦1iehe:leihen¦1öche:riechen¦1äte:bitten,reten¦1ände:winden,finden,binden¦1ölle:uellen,wellen¦1ömme:limmen¦1iee:peien,reien¦1ämme:wimmen¦1iene:heinen¦1ieße:lassen¦1inge:fangen,gehen¦1ächte:denken¦1öte:bieten¦1änge:wingen,singen,lingen¦1ärbe:werben,terben¦1iese:weisen¦1iche:weichen,leichen¦1üsche:waschen¦1iege:teigen¦1äche:techen,rechen¦1ünde:tehen¦1ähe:sehen¦1itte:neiden,reiten¦1iffe:leifen,feifen,neifen¦1iede:heiden¦1öffe:saufen¦1iete:raten¦1äse:lesen¦1iefe:laufen,rufen¦1üde:laden¦1ielte:halten¦1älte:gelten¦1äbe:geben¦1iele:fallen¦ürde:erden¦üchse:achsen¦öchte:echten¦äfe:effen¦ärfe:erfen¦ölze:elzen¦ähme:ehmen¦äme:ommen¦älfe:elfen¦änne:innen¦össe:ießen¦ühre:ahren¦iebe:eiben¦isse:eißen",
        "rev": "ingen:änge¦ecken:äke¦iegen:äge¦elken:ölke¦affen:üfe¦ergen:ärge¦eiden:iede¦eihen:iehe¦ieden:ötte¦aben:ätte¦esen:äse¦ehen:ähe¦innen:önne¦erben:ärbe¦1en:ste,fte,bte,gte,ite,zte¦1oßen:tieße¦1iehen:zöge¦1eschen:rösche¦1eben:wöbe¦1eißen:hieße¦1ehen:tände¦2eiten:glitte¦2n:tete,dete,nete¦2ieben:chöbe¦2eben:nhöbe,shöbe,rhöbe¦2en:inte,säte,hrte,hlte,ihte,llte,örte¦2ssen:reßte,laßte¦2egen:ewöge¦3n:telte,kelte,derte,uerte,terte,pelte,belte,selte,gerte,felte,helte,herte,delte,melte,berte,zelte,gelte,serte,ferte,kerte,perte,merte,ßelte,nerte,lerte,verte,ßerte,nelte¦3en:schte,ichte,hälte,ennte,uälte,echte,eelte,maßte¦4n:eierte,owerte¦4en:wächte,pielte,zielte,pannte,tielte,mannte,hwerte,querte¦4afen:schliefe",
        "ex": "6:gebären¦8:erlöschen¦9:verlöschen¦schwömme brust:brustschwimmen¦schwömme delfin:delfinschwimmen¦schwömme delphin:delphinschwimmen¦führe:rad fahren¦führe rad:radfahren¦äße:essen¦wäre:sein¦7te:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3änge:abdingen,abringen¦2äße:abessen,fressen¦6te:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen¦4itte:abgleiten,ausleiden,mitleiden¦8te:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9te:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äke:abschrecken,erschrecken¦4ßte:anpassen,stressen¦5ßte:anpressen,aufpassen,erpressen,verpassen¦3äße:aufessen,ausessen,mitessen¦4äge:aufliegen,beiliegen¦11ielte:aufrechterhalte¦7äke:aufschrecken¦5ösche:ausdreschen,verdreschen¦5itte:ausgleiten,entgleiten¦4ölke:ausmelken¦6ßte:auspressen,einpressen,verprassen¦10te:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5änge:auswringen¦5te:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3öge:belügen,erwägen,abwiegen¦5äge:bloßliegen,festliegen,naheliegen¦3äge:daliegen¦6öge:durchlügen¦8ßte:durchpressen¦6änge:durchringen¦7öche:durchstechen¦6öbe:durchweben¦4öbe:einweben,aufheben,wegheben,entheben¦11te:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rte:entkommerzialisie¦3itte:erleiden¦5üfe:erschaffen¦13te:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ieße:gutheißen,verheißen¦12te:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfe:herschaffen,hinschaffen¦6äge:herumliegen¦10üfe:hierherschaffen¦9üfe:hinaufschaffen,zurückschaffen¦13ämme:hinterherschwimme¦8äke:hochschrecken¦9ände:missverstehen¦5öre:nachgären¦7üfe:nachschaffen¦8itte:niedergleiten¦15te:parallelschalten,weiterentwickel,weiterverbreiten¦8äge:richtigliegen¦7äge:schiefliegen,zurückliegen¦4ärge:verbergen¦4iede:vermeiden¦4iehe:verzeihen¦4äße:vollessen¦4öge:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14te:wiedervereinige,zurückbegleiten¦4ötte:zersieden¦10äke:zurückschrecken¦12äke:zusammenschrecken¦16te:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦5ätte:achthaben,freihaben,gernhaben¦3te:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen,nölen¦1üke:backen¦4te:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1ände:binden,finden,winden¦1ärge:bergen¦1ärste:bersten¦1äte:bitten,tun¦3ähle:befehlen¦5osse:beschießen¦1öge:biegen,lügen,saugen,wiegen,ziehen¦1öte:bieten¦2iese:blasen,preisen¦3ßte:blassen,pressen¦2ächte:bringen¦1ächte:denken¦1änge:dingen,ringen,singen¦2änge:dringen,wringen¦2ösche:dreschen¦1mailte:e-mailen¦1iele:fallen¦1inge:fangen,gehen¦2ßte:fassen,hassen,passen¦2öge:fliegen¦2öre:frieren¦1äbe:geben¦1älte:gelten¦3achte:gedenken¦3iehe:gedeihen¦2itte:gleiten¦1öre:gären¦2übe:graben¦2iffe:greifen¦1ätte:haben¦1ielte:halten¦1ieße:heißen,lassen¦1öbe:heben,weben¦1üde:laden¦1iefe:laufen,rufen¦1äge:liegen¦1äse:lesen¦1iehe:leihen¦1itte:leiden,reiten¦1ölke:melken¦1äße:messen,sitzen¦1iede:meiden¦2chte:mögen¦1annte:nennen,rennen¦3äse:genesen¦1iete:raten¦1öche:riechen¦3üfe:schaffen¦5ähe:geschehen¦4äke:schrecken¦4ore:schwären¦1ähe:sehen¦1ötte:sieden¦1öffe:saufen¦4ände:gestehen¦2öbe:stieben¦1änke:sinken¦2üge:tragen¦2öffe:triefen¦1hettoisierte:gettoisieren¦3önne:gewinnen¦1üsche:waschen¦1iche:weichen¦1iese:weisen¦1ärbe:werben¦1üsste:wissen¦2te:ölen,üben,säen¦4öße:umfließen¦7ßte:veranlassen¦4ärbe:verderben¦5ibe:vergraben¦4öre:verlieren¦4äte:vertuen,guttun¦5andte:übersenden¦6önne:überspinnen¦6ände:überstehen¦3öbe:abheben,beheben¦17erte:herauskristallisi,hinauskomplimenti¦5öbe:hochheben¦5öge:nachwiegen,überwiegen¦4iefe:schlafen¦5äte:großtun¦18te:institutionalisiere¦7äte:schwertun"
      },
      "firstPlural": {
        "fwd": "ießen:oßen¦ögen:iehen¦äten:un¦1ten:ln,rn,äen,re¦1öben:hieben,heben¦1ögen:wiegen,wegen¦1iefen:lafen¦1erten:i¦2ten:älen,elen,aßen,ölen,rsen¦3ten:ächen,annen,weren,ueren,üssen",
        "both": "5:wören¦5ten:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,palten,nreisen,mieten,reiden,einden,weiden,treifen,hinden,uchten,ichten,beiten¦4ten:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,seifen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßten:rblassen,inpassen¦4änden:gestehen¦4üfen:ischaffen¦3ten:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,ussen,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2ten:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ählen:pfehlen¦2äßen:eressen,fressen¦2ängen:rringen,dringen,pringen¦2ägen:rliegen,hliegen,nliegen¦2ßten:fassen¦2iegen:hweigen¦2iesen:preisen,blasen¦2ögen:nlügen,fliegen¦2ören:frieren¦2ächten:bringen¦2ügen:tragen,hlagen¦2ichen:treichen¦2iffen:greifen¦2üben:graben¦1äßen:gessen,hessen,sitzen,messen¦1öhen:liehen¦1ßten:ässen¦1ten:ven,xen,pen,ken,uen¦1änken:sinken,rinken,tinken¦1ögen:rügen,saugen,biegen¦1ählen:tehlen¦1annten:nennen,kennen,rennen¦1ören:heren,kiesen¦1ölten:helten¦1iehen:leihen¦1öchen:riechen¦1äten:bitten,reten¦1änden:winden,finden,binden¦1öllen:uellen,wellen¦1ömmen:limmen¦1ieen:peien,reien¦1ämmen:wimmen¦1ienen:heinen¦1ießen:lassen¦1ingen:fangen,gehen¦1ächten:denken¦1öten:bieten¦1ängen:wingen,singen,lingen¦1ärben:werben,terben¦1iesen:weisen¦1ichen:weichen,leichen¦1üschen:waschen¦1iegen:teigen¦1ächen:techen,rechen¦1ünden:tehen¦1ähen:sehen¦1itten:neiden,reiten¦1iffen:leifen,feifen,neifen¦1ieden:heiden¦1öffen:saufen¦1ieten:raten¦1äsen:lesen¦1iefen:laufen,rufen¦1üden:laden¦1ielten:halten¦1älten:gelten¦1äben:geben¦1ielen:fallen¦ürden:erden¦üchsen:achsen¦öchten:echten¦äfen:effen¦ärfen:erfen¦ölzen:elzen¦ähmen:ehmen¦ämen:ommen¦älfen:elfen¦ännen:innen¦össen:ießen¦ühren:ahren¦ieben:eiben¦issen:eißen",
        "rev": "ingen:ängen¦ecken:äken¦iegen:ägen¦elken:ölken¦affen:üfen¦ergen:ärgen¦eiden:ieden¦eihen:iehen¦ieden:ötten¦aben:ätten¦esen:äsen¦ehen:ähen¦innen:önnen¦erben:ärben¦1en:sten,ften,bten,gten,iten,zten¦1oßen:tießen¦1iehen:zögen¦1eschen:röschen¦1eben:wöben¦1eißen:hießen¦1ehen:tänden¦2eiten:glitten¦2n:teten,deten,neten¦2ieben:chöben¦2eben:nhöben,shöben,rhöben¦2en:inten,säten,hrten,hlten,ihten,llten,örten¦2ssen:reßten,laßten¦2egen:ewögen¦3n:telten,kelten,derten,uerten,terten,pelten,belten,selten,gerten,felten,helten,herten,delten,melten,berten,zelten,gelten,serten,ferten,kerten,perten,merten,ßelten,nerten,lerten,verten,ßerten,nelten¦3en:schten,ichten,hälten,ennten,uälten,echten,eelten,maßten¦4n:eierten,owerten¦4en:wächten,pielten,zielten,pannten,tielten,mannten,hwerten,querten¦4afen:schliefen",
        "ex": "7:gebären¦9:erlöschen¦10:verlöschen¦schwömmen brust:brustschwimmen¦schwömmen delfin:delfinschwimmen¦schwömmen delphin:delphinschwimmen¦führen:rad fahren¦führen rad:radfahren¦äßen:essen¦wären:sein¦7ten:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3ängen:abdingen,abringen¦2äßen:abessen,fressen¦6ten:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen¦4itten:abgleiten,ausleiden,mitleiden¦8ten:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9ten:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äken:abschrecken,erschrecken¦4ßten:anpassen,stressen¦5ßten:anpressen,aufpassen,erpressen,verpassen¦3äßen:aufessen,ausessen,mitessen¦4ägen:aufliegen,beiliegen¦11ielten:aufrechterhalte¦7äken:aufschrecken¦5öschen:ausdreschen,verdreschen¦5itten:ausgleiten,entgleiten¦4ölken:ausmelken¦6ßten:auspressen,einpressen,verprassen¦10ten:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ängen:auswringen¦5ten:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3ögen:belügen,erwägen,abwiegen¦5ägen:bloßliegen,festliegen,naheliegen¦3ägen:daliegen¦6ögen:durchlügen¦8ßten:durchpressen¦6ängen:durchringen¦7öchen:durchstechen¦6öben:durchweben¦4öben:einweben,aufheben,wegheben,entheben¦11ten:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rten:entkommerzialisie¦3itten:erleiden¦5üfen:erschaffen¦13ten:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießen:gutheißen,verheißen¦12ten:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfen:herschaffen,hinschaffen¦6ägen:herumliegen¦10üfen:hierherschaffen¦9üfen:hinaufschaffen,zurückschaffen¦13ämmen:hinterherschwimme¦8äken:hochschrecken¦9änden:missverstehen¦5ören:nachgären¦7üfen:nachschaffen¦8itten:niedergleiten¦15ten:parallelschalten,weiterentwickel,weiterverbreiten¦8ägen:richtigliegen¦7ägen:schiefliegen,zurückliegen¦4ärgen:verbergen¦4ieden:vermeiden¦4iehen:verzeihen¦4äßen:vollessen¦4ögen:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14ten:wiedervereinige,zurückbegleiten¦4ötten:zersieden¦10äken:zurückschrecken¦12äken:zusammenschrecken¦16ten:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦5ätten:achthaben,freihaben,gernhaben¦3ten:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen,nölen¦1üken:backen¦4ten:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1änden:binden,finden,winden¦1ärgen:bergen¦1ärsten:bersten¦1äten:bitten,tun¦3ählen:befehlen¦5ossen:beschießen¦1ögen:biegen,lügen,saugen,wiegen,ziehen¦1öten:bieten¦2iesen:blasen,preisen¦3ßten:blassen,pressen¦2ächten:bringen¦1ächten:denken¦1ängen:dingen,ringen,singen¦2ängen:dringen,wringen¦2öschen:dreschen¦1mailten:e-mailen¦1ielen:fallen¦1ingen:fangen,gehen¦2ßten:fassen,hassen,passen¦2ögen:fliegen¦2ören:frieren¦1äben:geben¦1älten:gelten¦3achten:gedenken¦3iehen:gedeihen¦2itten:gleiten¦1ören:gären¦2üben:graben¦2iffen:greifen¦1ätten:haben¦1ielten:halten¦1ießen:heißen,lassen¦1öben:heben,weben¦1üden:laden¦1iefen:laufen,rufen¦1ägen:liegen¦1äsen:lesen¦1iehen:leihen¦1itten:leiden,reiten¦1ölken:melken¦1äßen:messen,sitzen¦1ieden:meiden¦2chten:mögen¦1annten:nennen,rennen¦3äsen:genesen¦1ieten:raten¦1öchen:riechen¦3üfen:schaffen¦5ähen:geschehen¦4äken:schrecken¦4oren:schwären¦1ähen:sehen¦1ötten:sieden¦1öffen:saufen¦4änden:gestehen¦2öben:stieben¦1änken:sinken¦2ügen:tragen¦2öffen:triefen¦1hettoisierten:gettoisieren¦3önnen:gewinnen¦1üschen:waschen¦1ichen:weichen¦1iesen:weisen¦1ärben:werben¦1üssten:wissen¦2ten:ölen,üben,säen¦4ößen:umfließen¦7ßten:veranlassen¦4ärben:verderben¦5iben:vergraben¦4ören:verlieren¦4äten:vertuen,guttun¦5andten:übersenden¦6önnen:überspinnen¦6änden:überstehen¦3öben:abheben,beheben¦17erten:herauskristallisi,hinauskomplimenti¦5öben:hochheben¦5ögen:nachwiegen,überwiegen¦4iefen:schlafen¦5äten:großtun¦18ten:institutionalisiere¦7äten:schwertun"
      },
      "secondPlural": {
        "fwd": "ießet:oßen¦öget:iehen¦ätet:un¦1tet:ln,rn,äen,re¦1öbet:hieben,heben¦1öget:wiegen,wegen¦1iefet:lafen¦1ertet:i¦2tet:älen,elen,aßen,ölen,rsen¦3tet:ächen,annen,weren,ueren,üssen",
        "both": "5tet:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,treifen,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,nreisen,mieten,reiden,einden,weiden,palten,hinden,uchten,ichten,beiten¦4tet:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,hnden,vieren,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,seifen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßtet:rblassen,inpassen¦4ändet:gestehen¦4üfet:ischaffen¦4t:wören¦3tet:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,ussen,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2tet:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ählet:pfehlen¦2äßet:eressen,fressen¦2änget:rringen,dringen,pringen¦2äget:rliegen,hliegen,nliegen¦2ßtet:fassen¦2ieget:hweigen¦2ieset:preisen,blasen¦2öget:nlügen,fliegen¦2öret:frieren¦2ächtet:bringen¦2üget:tragen,hlagen¦2ichet:treichen¦2iffet:greifen¦2übet:graben¦1äßet:gessen,hessen,sitzen,messen¦1öhet:liehen¦1ßtet:ässen¦1tet:ven,xen,pen,ken,uen¦1änket:sinken,rinken,tinken¦1öget:rügen,saugen,biegen¦1ählet:tehlen¦1anntet:nennen,kennen,rennen¦1öret:heren,kiesen¦1öltet:helten¦1iehet:leihen¦1öchet:riechen¦1ätet:bitten,reten¦1ändet:winden,finden,binden¦1öllet:uellen,wellen¦1ömmet:limmen¦1ieet:peien,reien¦1ämmet:wimmen¦1ienet:heinen¦1ießet:lassen¦1inget:fangen,gehen¦1ächtet:denken¦1ötet:bieten¦1änget:wingen,singen,lingen¦1ärbet:werben,terben¦1ieset:weisen¦1ichet:weichen,leichen¦1üschet:waschen¦1ieget:teigen¦1ächet:techen,rechen¦1ündet:tehen¦1ähet:sehen¦1ittet:neiden,reiten¦1iffet:leifen,feifen,neifen¦1iedet:heiden¦1öffet:saufen¦1ietet:raten¦1äset:lesen¦1iefet:laufen,rufen¦1üdet:laden¦1ieltet:halten¦1ältet:gelten¦1äbet:geben¦1ielet:fallen¦ürdet:erden¦üchset:achsen¦öchtet:echten¦äfet:effen¦ärfet:erfen¦ölzet:elzen¦ähmet:ehmen¦ämet:ommen¦älfet:elfen¦ännet:innen¦össet:ießen¦ühret:ahren¦iebet:eiben¦isset:eißen",
        "rev": "ingen:änget¦ecken:äket¦iegen:äget¦elken:ölket¦affen:üfet¦ergen:ärget¦eiden:iedet¦eihen:iehet¦ieden:öttet¦ommen:ämt¦aben:ättet¦ehmen:ähmt¦esen:äset¦ehen:ähet¦erben:ärbet¦1en:stet,ftet,btet,gtet,itet,ztet¦1oßen:tießet¦1iehen:zöget¦1eschen:röschet¦1eben:wöbet¦1eißen:hießet¦1ehen:tändet¦2eiten:glittet¦2n:tetet,detet,netet¦2ieben:chöbet¦2eben:nhöbet,shöbet,rhöbet¦2en:intet,sätet,hrtet,hltet,ihtet,lltet,örtet¦2ssen:reßtet,laßtet¦2egen:ewöget¦3n:teltet,keltet,dertet,uertet,tertet,peltet,beltet,seltet,gertet,feltet,heltet,hertet,deltet,meltet,bertet,zeltet,geltet,sertet,fertet,kertet,pertet,mertet,ßeltet,nertet,lertet,vertet,ßertet,neltet¦3en:schtet,ichtet,hältet,enntet,uältet,echtet,eeltet,maßtet¦4n:eiertet,owertet¦4en:wächtet,pieltet,zieltet,panntet,tieltet,manntet,hwertet,quertet¦4afen:schliefet",
        "ex": "schwömmt brust:brustschwimmen¦schwömmt delfin:delfinschwimmen¦schwömmt delphin:delphinschwimmen¦führet:rad fahren¦führet rad:radfahren¦äßet:essen¦wärt:sein¦7tet:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3änget:abdingen,abringen¦2äßet:abessen,fressen¦6tet:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen¦4ittet:abgleiten,ausleiden,mitleiden¦8tet:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9tet:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äket:abschrecken,erschrecken¦4ßtet:anpassen,stressen¦5ßtet:anpressen,aufpassen,erpressen,verpassen¦3äßet:aufessen,ausessen,mitessen¦4äget:aufliegen,beiliegen¦11ieltet:aufrechterhalte¦7äket:aufschrecken¦5öschet:ausdreschen,verdreschen¦5ittet:ausgleiten,entgleiten¦4ölket:ausmelken¦6ßtet:auspressen,einpressen,verprassen¦10tet:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5änget:auswringen¦5tet:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3öget:belügen,erwägen,abwiegen¦5äget:bloßliegen,festliegen,naheliegen¦3äget:daliegen¦6öget:durchlügen¦8ßtet:durchpressen¦6änget:durchringen¦7öchet:durchstechen¦6öbet:durchweben¦4öbet:einweben,aufheben,wegheben,entheben¦11tet:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rtet:entkommerzialisie¦3ittet:erleiden¦8t:erlöschen¦5üfet:erschaffen¦13tet:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießet:gutheißen,verheißen¦12tet:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfet:herschaffen,hinschaffen¦6äget:herumliegen¦10üfet:hierherschaffen¦9üfet:hinaufschaffen,zurückschaffen¦13ämmet:hinterherschwimme¦8äket:hochschrecken¦9ändet:missverstehen¦5öret:nachgären¦7üfet:nachschaffen¦8ittet:niedergleiten¦15tet:parallelschalten,weiterentwickel,weiterverbreiten¦8äget:richtigliegen¦7äget:schiefliegen,zurückliegen¦4ärget:verbergen¦9t:verlöschen¦4iedet:vermeiden¦4iehet:verzeihen¦4äßet:vollessen¦4öget:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14tet:wiedervereinige,zurückbegleiten¦4öttet:zersieden¦10äket:zurückschrecken¦12äket:zusammenschrecken¦16tet:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦9ämt:abhandenkommen¦5ättet:achthaben,freihaben,gernhaben¦3tet:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen,nölen¦1ükt:backen¦4tet:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1ändet:binden,finden,winden¦1ärget:bergen¦1ärstet:bersten¦1ätet:bitten,tun¦3ählet:befehlen¦11öbt:beiseiteschieben¦5osset:beschießen¦1öget:biegen,lügen,saugen,wiegen,ziehen¦1ötet:bieten¦2ieset:blasen,preisen¦3ßtet:blassen,pressen¦2ächtet:bringen¦1ächtet:denken¦1änget:dingen,ringen,singen¦2änget:dringen,wringen¦2öschet:dreschen¦1mailtet:e-mailen¦1ielet:fallen¦1inget:fangen,gehen¦2ßtet:fassen,hassen,passen¦2öget:fliegen¦7ämt:freibekommen¦5ähmt:freinehmen¦2öret:frieren¦1äbet:geben¦1ältet:gelten¦6t:gebären¦3achtet:gedenken¦3iehet:gedeihen¦2ittet:gleiten¦1öret:gären¦2übet:graben¦2iffet:greifen¦1ättet:haben¦1ieltet:halten¦1ießet:heißen,lassen¦1öbet:heben,weben¦1üdet:laden¦1iefet:laufen,rufen¦1äget:liegen¦1äset:lesen¦1iehet:leihen¦1ittet:leiden,reiten¦1ölket:melken¦1äßet:messen,sitzen¦1iedet:meiden¦2chtet:mögen¦1anntet:nennen,rennen¦3äset:genesen¦1ietet:raten¦1öchet:riechen¦3üfet:schaffen¦5ähet:geschehen¦4äket:schrecken¦4oret:schwären¦1ähet:sehen¦1öttet:sieden¦1öffet:saufen¦4ändet:gestehen¦2öbet:stieben¦1änket:sinken¦2üget:tragen¦2öffet:triefen¦1hettoisiertet:gettoisieren¦3önnt:gewinnen¦1üschet:waschen¦1ichet:weichen¦1ieset:weisen¦1ärbet:werben¦1üsstet:wissen¦2tet:ölen,üben,säen¦5äht:sattsehen¦4ößet:umfließen¦7ßtet:veranlassen¦4ärbet:verderben¦5ibet:vergraben¦4öret:verlieren¦4ätet:vertuen,guttun¦8ähmt:vorliebnehmen¦5andtet:übersenden¦6önnet:überspinnen¦6ändet:überstehen¦3öbet:abheben,beheben¦17ertet:herauskristallisi,hinauskomplimenti¦5öbet:hochheben¦5öget:nachwiegen,überwiegen¦4iefet:schlafen¦5ätet:großtun¦18tet:institutionalisiere¦7ätet:schwertun"
      },
      "thirdPlural": {
        "fwd": "ießen:oßen¦ögen:iehen¦äten:un¦1ten:ln,rn,äen,re¦1öben:hieben,heben¦1ögen:wiegen,wegen¦1iefen:lafen¦1erten:i¦2ten:älen,elen,aßen,ölen,rsen¦3ten:ächen,annen,weren,ueren,üssen",
        "both": "5:wören¦5ten:rrieren,grieren,drieren,orieren,trieren,arieren,irieren,zweigen,nieten,rreisen,üchten,treisen,falten,rleiben,kreisen,kitten,iraten,hwitzen,hreisen,erieren,siechen,ereisen,rchten,achten,urieren,talten,palten,nreisen,mieten,reiden,einden,weiden,treifen,hinden,uchten,ichten,beiten¦4ten:peten,raden,weifen,rellen,ätten,fieren,xieren,hitzen,lichen,ürden,kieren,anden,cieren,yieren,iieren,vieren,hnden,pitzen,hellen,rimmen,naufen,mschen,änden,lieben,lschen,ahten,flügen,zeigen,geigen,nschen,orden,beten,uieren,rragen,nitzen,klagen,leisen,dellen,chaben,neten,raffen,siegen,hallen,haden,sellen,pschen,weinen,teifen,sieben,mieren,otten,sieren,tieren,wallen,pießen,ütten,nellen,lieren,riegen,pieren,wahren,ünden,ritzen,weißen,miegen,reihen,bieren,rschen,rallen,etten,gaffen,litzen,chnen,langen,nieren,timmen,atten,peisen,seifen,nallen,laffen,unden,gieren,zieren,pellen,neigen,hieren,dieren,kaufen,tschen,fragen,ischen,uschen,enden,tellen¦4ßten:rblassen,inpassen¦4änden:gestehen¦4üfen:ischaffen¦3ten:ümmen,sigen,nchen,kten,ähmen,zigen,äufen,ällen,ähnen,üden,lchen,äten,üngen,arben,önnen,uhlen,higen,pten,nügen,mden,ussen,wehen,ühnen,uffen,nten,ünnen,äffen,ühmen,wagen,fnen,offen,tören,ilzen,ligen,ärfen,neien,ahmen,ullen,bnen,eugen,ähren,nigen,issen,nien,dnen,ahnen,öhnen,eeren,olzen,fugen,fegen,alzen,ützen,ürfen,sagen,ehnen,oten,ummen,tmen,öden,ohnen,reben,emmen,iffen,ollen,eden,nagen,öten,digen,ohlen,hören,lehen,fügen,üten,ohren,ählen,älzen,etzen,knen,tufen,rafen,illen,ammen,engen,gnen,ätzen,ühren,oden,regen,atzen,utzen,lden,sten,legen,ühlen,otzen,ochen,lären,leben,ehren,rten,jagen,uten,rchen,ften,rasen,üllen,ärben,tigen,ämmen,ängen,rehen,achen,uchen,ahlen¦2ten:ezen,oren,ämen,öhen,omen,rlen,äzen,onen,efen,lben,anen,ößen,üfen,üben,oben,osen,ggen,mben,fzen,hzen,lsen,ülen,amen,uhen,rnen,imen,uzen,izen,nsen,ohen,emen,unen,rgen,önen,nzen,ömen,ulen,aren,ägen,üren,rren,usen,umen,ähen,ksen,alen,ösen,rzen,psen,uben,olen,rmen,lmen,ilen,bben,enen,pfen,üßen,msen,ühen,lgen¦2ählen:pfehlen¦2äßen:eressen,fressen¦2ängen:rringen,dringen,pringen¦2ägen:rliegen,hliegen,nliegen¦2ßten:fassen¦2iegen:hweigen¦2iesen:preisen,blasen¦2ögen:nlügen,fliegen¦2ören:frieren¦2ächten:bringen¦2ügen:tragen,hlagen¦2ichen:treichen¦2iffen:greifen¦2üben:graben¦1äßen:gessen,hessen,sitzen,messen¦1öhen:liehen¦1ßten:ässen¦1ten:ven,xen,pen,ken,uen¦1änken:sinken,rinken,tinken¦1ögen:rügen,saugen,biegen¦1ählen:tehlen¦1annten:nennen,kennen,rennen¦1ören:heren,kiesen¦1ölten:helten¦1iehen:leihen¦1öchen:riechen¦1äten:bitten,reten¦1änden:winden,finden,binden¦1öllen:uellen,wellen¦1ömmen:limmen¦1ieen:peien,reien¦1ämmen:wimmen¦1ienen:heinen¦1ießen:lassen¦1ingen:fangen,gehen¦1ächten:denken¦1öten:bieten¦1ängen:wingen,singen,lingen¦1ärben:werben,terben¦1iesen:weisen¦1ichen:weichen,leichen¦1üschen:waschen¦1iegen:teigen¦1ächen:techen,rechen¦1ünden:tehen¦1ähen:sehen¦1itten:neiden,reiten¦1iffen:leifen,feifen,neifen¦1ieden:heiden¦1öffen:saufen¦1ieten:raten¦1äsen:lesen¦1iefen:laufen,rufen¦1üden:laden¦1ielten:halten¦1älten:gelten¦1äben:geben¦1ielen:fallen¦ürden:erden¦üchsen:achsen¦öchten:echten¦äfen:effen¦ärfen:erfen¦ölzen:elzen¦ähmen:ehmen¦ämen:ommen¦älfen:elfen¦ännen:innen¦össen:ießen¦ühren:ahren¦ieben:eiben¦issen:eißen",
        "rev": "ingen:ängen¦ecken:äken¦iegen:ägen¦elken:ölken¦affen:üfen¦ergen:ärgen¦eiden:ieden¦eihen:iehen¦ieden:ötten¦aben:ätten¦esen:äsen¦ehen:ähen¦innen:önnen¦erben:ärben¦1en:sten,ften,bten,gten,iten,zten¦1oßen:tießen¦1iehen:zögen¦1eschen:röschen¦1eben:wöben¦1eißen:hießen¦1ehen:tänden¦2eiten:glitten¦2n:teten,deten,neten¦2ieben:chöben¦2eben:nhöben,shöben,rhöben¦2en:inten,säten,hrten,hlten,ihten,llten,örten¦2ssen:reßten,laßten¦2egen:ewögen¦3n:telten,kelten,derten,uerten,terten,pelten,belten,selten,gerten,felten,helten,herten,delten,melten,berten,zelten,gelten,serten,ferten,kerten,perten,merten,ßelten,nerten,lerten,verten,ßerten,nelten¦3en:schten,ichten,hälten,ennten,uälten,echten,eelten,maßten¦4n:eierten,owerten¦4en:wächten,pielten,zielten,pannten,tielten,mannten,hwerten,querten¦4afen:schliefen",
        "ex": "7:gebären¦9:erlöschen¦10:verlöschen¦schwömmen brust:brustschwimmen¦schwömmen delfin:delfinschwimmen¦schwömmen delphin:delphinschwimmen¦führen:rad fahren¦führen rad:radfahren¦äßen:essen¦wären:sein¦7ten:abblassen,ableiten,ablöschen,abpressen,abreichen,abrinden,abtrennen,anleiten,anreichen,aufbahren,ausbaden,aushöhlen,auslaugen,ausreifen,ausreisen,bescheren,beswingen,einglasen,einkerben,einweihen,erreichen,umleiten,verfehlen,verglasen,zuleiten,zureichen,beneiden,besaiten,erhaschen,erkalten,erkälten,erübrigen,gebärden,handhaben,knechten,geleiten,ohrfeigen,gereichen,schalten,recyclen,stibitzen,veralten,verdingen,verewigen,vermiesen,verneinen,verpennen,verwaisen,zermürben,verbannen,recyceln¦3ängen:abdingen,abringen¦2äßen:abessen,fressen¦6ten:abfassen,abpassen,abreisen,anfassen,anleinen,antraben,bereifen,enteisen,enterben,loseisen,umtaufen,vereinen,vererben,vergasen,vertagen,becircen,befreien,begrünen,breiten,erpichen,hechten,kleiden,preschen,schubsen,schweben,wappnen,kreieren,pürieren,verminen,verwesen,verzagen,freveln,panzern,schielen,schwelen¦4itten:abgleiten,ausleiden,mitleiden¦8ten:abschaffen,ankleiden,anschaffen,auftrennen,auslöschen,ausreichen,ausweiten,bekleiden,beschaffen,darreichen,eindeichen,einleiten,einreichen,einweichen,heimreisen,herleiten,herreichen,hinreichen,lostrennen,nachreifen,umkleiden,verleiten,vernaschen,verwalten,zerpressen,zertrennen,beantragen,begleiten,bevorzugen,entsteinen,erblinden,gefährden,genehmigen,retweeten,tätowieren,veranlagen,verarzten,verblüffen,vergeuden¦9ten:abschalten,anschalten,ausbreiten,auskleiden,begrabschen,durchzechen,einkleiden,einschweben,entkleiden,fehlleiten,freipressen,heranreifen,herauslugen,irreleiten,nachreichen,staubsaugen,umschalten,verkleiden,verschaffen,vorpreschen,vorschweben,wegschaffen,beauftragen,beglaubigen,beinhalten,downloaden,erniedrigen,mähdreschen,prophezeien,verausgaben,verbeamten,verbreiten,verunfallen,überleiten,überraschen,überreichen¦6äken:abschrecken,erschrecken¦4ßten:anpassen,stressen¦5ßten:anpressen,aufpassen,erpressen,verpassen¦3äßen:aufessen,ausessen,mitessen¦4ägen:aufliegen,beiliegen¦11ielten:aufrechterhalte¦7äken:aufschrecken¦5öschen:ausdreschen,verdreschen¦5itten:ausgleiten,entgleiten¦4ölken:ausmelken¦6ßten:auspressen,einpressen,verprassen¦10ten:ausschalten,durchreichen,durchtrennen,einschalten,herumreichen,verschalten,bemitleiden,verabreichen¦5ängen:auswringen¦5ten:beerben,erbeben,achten,bejahen,beäugen,blechen,browsen,deichen,empören,falten,flennen,fliesen,haschen,kitten,kreisen,leiten,löschen,mieten,mäßigen,naschen,neiden,nieten,prangen,putten,reichen,rinden,röntgen,siechen,swingen,texten,trennen,walten,weiden,weiten,widmen,zelten,zweigen,ächten,einölen¦3ögen:belügen,erwägen,abwiegen¦5ägen:bloßliegen,festliegen,naheliegen¦3ägen:daliegen¦6ögen:durchlügen¦8ßten:durchpressen¦6ängen:durchringen¦7öchen:durchstechen¦6öben:durchweben¦4öben:einweben,aufheben,wegheben,entheben¦11ten:emporschweben,heraufreichen,herausreichen,herbegleiten,hereinreichen,hinaufreichen,hinausreichen,hinbegleiten,hineinreichen,weiterleiten,inlineskaten,unterbreiten,veranschlagen¦17rten:entkommerzialisie¦3itten:erleiden¦5üfen:erschaffen¦13ten:gleichschalten,herunterreichen,zurückschalten,zusammenpressen,vervollkommnen¦4ießen:gutheißen,verheißen¦12ten:heimbegleiten,herüberreichen,hinüberreichen,zusammenballen,zusammenpassen,zusammenraufen¦6üfen:herschaffen,hinschaffen¦6ägen:herumliegen¦10üfen:hierherschaffen¦9üfen:hinaufschaffen,zurückschaffen¦13ämmen:hinterherschwimme¦8äken:hochschrecken¦9änden:missverstehen¦5ören:nachgären¦7üfen:nachschaffen¦8itten:niedergleiten¦15ten:parallelschalten,weiterentwickel,weiterverbreiten¦8ägen:richtigliegen¦7ägen:schiefliegen,zurückliegen¦4ärgen:verbergen¦4ieden:vermeiden¦4iehen:verzeihen¦4äßen:vollessen¦4ögen:vorlügen,aufwiegen,auswiegen,einwiegen,vorwiegen¦14ten:wiedervereinige,zurückbegleiten¦4ötten:zersieden¦10äken:zurückschrecken¦12äken:zusammenschrecken¦16ten:zusammenschrumpfe,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦5ätten:achthaben,freihaben,gernhaben¦3ten:ahmen,ahnen,beben,düsen,ehren,einen,eisen,engen,erben,fegen,feien,fugen,fußen,fügen,gasen,hegen,hören,jagen,laben,leben,legen,lugen,nagen,pesen,ragen,rasen,regen,rügen,sagen,tagen,wagen,wehen,zagen,äffen,ätzen,öden,maßen,nölen¦1üken:backen¦4ten:baden,bahren,ballen,bangen,bellen,beten,dellen,eichen,enden,erden,fehlen,fragen,fräsen,gaffen,geigen,gerben,gieren,glasen,golfen,gongen,hallen,hellen,höhlen,kennen,kaufen,keifen,kerben,klagen,lallen,langen,laugen,leiben,leinen,lieben,lotsen,meinen,neigen,niesen,paffen,pellen,pennen,pinnen,plagen,raffen,raufen,reifen,reihen,reisen,ritzen,seifen,sieben,siegen,sonnen,spuren,sülzen,taufen,taugen,traben,tränen,wahren,wallen,waten,weihen,weinen,wellen,zechen,zeigen,zieren,bannen,eiern,grölen,rächen,spaßen,zielen¦1änden:binden,finden,winden¦1ärgen:bergen¦1ärsten:bersten¦1äten:bitten,tun¦3ählen:befehlen¦5ossen:beschießen¦1ögen:biegen,lügen,saugen,wiegen,ziehen¦1öten:bieten¦2iesen:blasen,preisen¦3ßten:blassen,pressen¦2ächten:bringen¦1ächten:denken¦1ängen:dingen,ringen,singen¦2ängen:dringen,wringen¦2öschen:dreschen¦15achten:durcheinanderbringen¦1mailten:e-mailen¦1ielen:fallen¦1ingen:fangen,gehen¦2ßten:fassen,hassen,passen¦2ögen:fliegen¦2ören:frieren¦1äben:geben¦1älten:gelten¦3achten:gedenken¦3iehen:gedeihen¦2itten:gleiten¦1ören:gären¦2üben:graben¦2iffen:greifen¦1ätten:haben¦1ielten:halten¦1ießen:heißen,lassen¦1öben:heben,weben¦1üden:laden¦1iefen:laufen,rufen¦1ägen:liegen¦1äsen:lesen¦1iehen:leihen¦1itten:leiden,reiten¦1ölken:melken¦1äßen:messen,sitzen¦1ieden:meiden¦2chten:mögen¦1annten:nennen,rennen¦3äsen:genesen¦1ieten:raten¦1öchen:riechen¦3üfen:schaffen¦5ähen:geschehen¦4äken:schrecken¦4oren:schwären¦1ähen:sehen¦1ötten:sieden¦1öffen:saufen¦4änden:gestehen¦2öben:stieben¦1änken:sinken¦2ügen:tragen¦2öffen:triefen¦1hettoisierten:gettoisieren¦3önnen:gewinnen¦1üschen:waschen¦1ichen:weichen¦1iesen:weisen¦1ärben:werben¦1üssten:wissen¦2ten:ölen,üben,säen¦4ößen:umfließen¦7ßten:veranlassen¦4ärben:verderben¦5iben:vergraben¦4ören:verlieren¦4äten:vertuen,guttun¦5andten:übersenden¦6önnen:überspinnen¦6änden:überstehen¦3öben:abheben,beheben¦17erten:herauskristallisi,hinauskomplimenti¦5öben:hochheben¦5ögen:nachwiegen,überwiegen¦4iefen:schlafen¦5äten:großtun¦18ten:institutionalisiere¦7äten:schwertun"
      }
    },
    "imperative": {
      "singular": {
        "fwd": "1:e¦2:ren¦le:eln¦1e:rn,un",
        "both": "2:xen,ven,pen,ien,ßen,ken,uen,den,nen,gen¦3:omen,kten,ülen,ezen,lben,älen,üfen,rsen,hzen,lsen,ölen,psen,ämen,öten,nten,öhen,äten,bben,ohen,osen,mben,uhen,amen,emen,pten,tmen,rlen,ähen,efen,imen,oten,ulen,asen,nsen,lmen,msen,rmen,umen,aten,ösen,olen,ühen,ömen,afen,oben,lten,isen,uzen,hsen,üben,rzen,tten,elen,iben,pfen,iten,uben,nzen,alen,ihen,ufen,mmen,ksen,üten,usen,ften,ifen,aben,ffen,sten,ilen,uten,rten,llen,tzen,izen¦4:arben,nchen,ürfen,ächen,ähmen,rchen,iesen,lchen,rehen,uhlen,olzen,ahmen,ussen,ochen,ahlen,ohlen,alzen,ieben,neten,ahten,ieten,ählen,reben,heben,ärfen,ässen,ärben,ilzen,ühlen,iehen,achen,uchen,tehen,issen,leben,ichen,gehen,üssen¦5:ßmachen,iechen,rchten,üchten,nschen,passen,mschen,aschen,lschen,ischen,tschen,achten,ichten,rschen,pschen,uchten,uschen,fassen¦5ß:terlassen¦2iss:fressen¦2ich:flechten¦2ieh:rsehen¦1iehl:tehlen¦1ies:lesen¦1isch:löschen¦1irb:werben¦1itt:reten¦1ich:techen,rechen¦1ib:geben¦ilz:elzen¦irf:erfen¦imm:ehmen¦ilf:elfen",
        "rev": "fallen:gefallen¦ssen:ß¦effen:iff¦ecken:ick¦ergen:irg¦essen:iss¦erben:irb¦ehlen:iehl¦echten:icht¦ellen:ill¦ehen:ieh¦1eln:mle,dle,ble,sle,zle,fle,gle,kle,ple,tle,ßle,nle¦1eschen:risch¦2n:se,be,he,te,me,ze¦2eln:chle¦2en:tz¦3n:nere,hre,dere,rre,uere,pere,here,bere,tere,mere,öre,äre,gere,kere,sere,fere,üre,lere,are,vere,ore,ßere¦3en:ach,ass¦4n:iere,eere,ehle,owere¦5n:hwere,quere",
        "ex": "3:sein,säen,ölen,üben¦4:ahmen,beben,beten,düsen,erben,gehen,heben,leben,pesen,sitzen,weben,wehen¦5:achten,fassen,fehlen,flehen,fläzen,fräsen,gerben,golfen,hassen,höhlen,kerben,lotsen,passen,rühmen,sülzen,texten,widmen,wälzen,zechen,ächten,relaxen,spuren¦6:beerben,besitzen,erbeben,erbeten,bejahen,blechen,browsen,hechten,löschen,genesen,pressen,gerieren,seufzen,scheren¦7:enterben,vererben,verwehen,becircen,eislaufen,knechten,preschen,schubsen,schweben,stressen,recyclen,verwesen¦8:abblassen,abpressen,erpressen,verfehlen,erblassen,ganzmachen,hartkochen,retweeten,trompeten,verarzten,zermürben,bescheren¦9:freilassen,zerpressen,gehenlassen,verbeamten,verblassen,verprassen,übertreten,überlassen,zerscheren¦10:begrabschen,durchzechen,freipressen,frischmachen,mähdreschen,gesundmachen,hängenlassen,kaputtmachen,veranlassen,kahlscheren¦11:alleinlassen,fallenlassen,flüssigmachen¦12:bleibenlassen,blickenlassen¦14:zusammenpressen¦17:entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦18:auseinanderschreiben¦19:institutionalisiere¦schwimm brust:brustschwimmen¦schwimm delfin:delfinschwimmen¦schwimm delphin:delphinschwimmen¦fahre:rad fahren¦fahre rad:radfahren¦iss:essen¦2gefallen:befallen¦4ß:belassen,erlassen¦4iff:betreffen¦3gefallen:entfallen,verfallen,zerfallen¦17re:entkommerzialisie¦5ß:entlassen,verlassen¦6ick:erschrecken¦4gefallen:missfallen¦4irg:verbergen¦5isch:verdreschen¦4iss:vermessen,vergessen¦5irb:versterben¦1irg:bergen¦3iehl:befehlen¦3ß:blassen¦2isch:dreschen¦1maile:e-mailen¦4iehl:empfehlen¦1icht:fechten¦2icht:flechten¦2iss:fressen¦1ib:geben¦2ß:lassen¦1ies:lesen¦10e:lustwandeln,glattbügeln¦1ilk:melken¦1iss:messen¦2ill:quellen¦5ieh:geschehen¦3ilt:schelten¦4ick:schrecken¦4ill:schwellen¦1ieh:sehen¦2irb:sterben¦2iff:treffen¦1hettoisiere:gettoisieren¦1irb:werben¦7e:recyceln¦5iehe:sattsehen¦4irb:verderben¦4ich:verfechten¦4e:eiern¦5e:feiern,leiern,guttun¦4le:freveln¦6e:panzern,großtun¦2e:tun¦8e:schwertun¦11e:verschleiern"
      },
      "plural": {
        "fwd": "t:en,e¦1t:rn,ln,un",
        "both": "5t:talten,palten,einden,hinden,winden,lenden,senden,binden¦4ßt:rblassen¦4t:upten,unden,anden,hnden,änden,elten,chnen,ünden¦3ßt:fressen,rfassen,rlassen¦3t:öden,knen,kten,üden,äten,mden,tmen,iden,gnen,dnen,öten,oten,nten,fnen,rden,eten,lden,aden,uten,rten,tten,eden,aten,nien,üten,ften,sten,iten,hten¦1ßt:ässen",
        "rev": "1en:gt,zt,st,dt,ht,ut,kt,ft,bt,nt,mt,it,pt,vt,xt¦1n:et¦2en:llt,hrt,üßt,rrt,alt,ört,hlt,ilt,ißt,olt,art,ult,rlt,ürt,oßt,ärt,ößt,ölt,ält,ort,ült¦2ssen:faßt,laßt,reßt¦2n:elt¦3n:nert,uert,dert,fert,sert,tert,hert,gert,lert,pert,bert,mert,kert,vert,ßert¦3en:ießt,ielt,iert,eert,eelt¦4n:owert¦4en:hwert,quert",
        "ex": "schwimmt brust:brustschwimmen¦schwimmt delfin:delfinschwimmen¦schwimmt delphin:delphinschwimmen¦fahrt:rad fahren¦fahrt rad:radfahren¦6t:beenden,spenden,wappnen,becircen,mutmaßen,panzern,schwelen,großtun¦4ßt:befassen,belassen,stressen,umfassen¦7t:befinden,behalten,bewenden,erfinden,erhalten,verenden,erkalten,erkälten,schalten,recyclen,veralten,bescheren¦8t:entfalten,enthalten,entwenden,verhalten,verwalten,verwenden,empfinden,erblinden,verarzten,vergeuden,freihalten,zerscheren,schwertun¦17rt:entkommerzialisie¦5ßt:entlassen,erpressen,vermessen,verpassen,vergessen¦10t:verschalten,unterhalten¦5t:binden,falten,finden,halten,rinden,senden,texten,walten,wenden,widmen,winden,feiern,leiern,scheren,guttun¦9t:beinhalten,hochhalten,verbeamten,kahlscheren¦3d:sein¦3ßt:blassen,pressen¦1mailt:e-mailen¦4t:ebnen,enden,roden,eiern,spaßen,spuren¦2ßt:fassen,hassen,lassen,passen¦1hettoisiert:gettoisieren¦3t:öden,fußen,maßen¦7ßt:veranlassen¦6ßt:verprassen¦11t:verschwenden,verschleiern¦13t:vervollkommnen¦16t:entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦2t:säen,tun,ölen¦18t:institutionalisiere"
      }
    },
    "presentParticiple": {
      "presentParticiple": {
        "fwd": "d:¦1nd:e¦1erend:i¦1end:in,un¦2nd:el",
        "both": "4 schwimmend:phinschwimmen¦3 schwimmend:finschwimmen¦2 schwimmend:stschwimmen¦hettoisierend:ettoisieren¦mailend:-mailen",
        "rev": "2:lnd,rnd¦3:tend,uend,ßend,fend,gend,send,dend,nend,hend,kend,bend,zend,pend,xend,iend,äend,vend,cend¦4:llend,hrend,lmend,olend,ärend,hlend,hmend,älend,umend,rmend,ürend,örend,rrend,elend,emend,ulend,imend,amend,arend,tmend,alend,ülend,ömend,rlend,omend,ämend,ölend,orend,urend,dmend,clend¦5:ommend,eilend,emmend,ämmend,herend,ammend,ummend,eerend,werend,uerend,ümmend¦3n:ßtuend,ttuend¦5n:wertuend",
        "ex": "sackend:absacken¦schämend:fremdschämen¦9d:abfrieren,abstimmen,anfrieren,anstimmen,auszieren,bestimmen,erklimmen,umstimmen,verzieren,zufrieren,zustimmen,amüsieren,animieren,avisieren,barbieren,blamieren,bugsieren,campieren,diktieren,fingieren,flanieren,florieren,forcieren,formieren,frisieren,fritieren,fundieren,fungieren,furnieren,garnieren,gastieren,gefrieren,schmieren,schwimmen,glasieren,gradieren,gummieren,halbieren,hantieren,hausieren,hydrieren,imitieren,isolieren,justieren,kandieren,kassieren,krepieren,kursieren,lackieren,laktieren,markieren,maskieren,massieren,migrieren,montieren,möblieren,normieren,onanieren,operieren,oxidieren,passieren,pausieren,planieren,plazieren,plädieren,portieren,postieren,probieren,prämieren,pulsieren,quotieren,rangieren,reagieren,rentieren,riskieren,rochieren,ruinieren,servieren,sinnieren,sondieren,sortieren,spazieren,studieren,summieren,tabuieren,taktieren,tangieren,tendieren,testieren,tradieren,urinieren,variieren,verlieren,zensieren¦11d:abkassieren,abmontieren,abreagieren,abschmieren,anprobieren,anschmieren,anschwimmen,aufpolieren,auskurieren,ausradieren,ausrasieren,austarieren,beschmieren,deformieren,dejustieren,deplazieren,nachstimmen,vordatieren,wegradieren,zudiktieren,abaissieren,ablaktieren,absentieren,absolvieren,absorbieren,adjustieren,adressieren,adsorbieren,affektieren,affirmieren,akklamieren,akquirieren,akzeptieren,alternieren,analysieren,annektieren,annullieren,appellieren,apportieren,appretieren,arrangieren,assistieren,assoziieren,atomisieren,attackieren,attestieren,balancieren,balsamieren,bilanzieren,debattieren,degradieren,deklarieren,deklinieren,demaskieren,dementieren,demontieren,denunzieren,deplacieren,deportieren,deprimieren,desertieren,dialysieren,diffamieren,differieren,diplomieren,diskutieren,disponieren,dissidieren,doktorieren,egalisieren,ejakulieren,elaborieren,eliminieren,emeritieren,erotisieren,eskortieren,exekutieren,expandieren,explanieren,explizieren,explodieren,explorieren,exportieren,extrahieren,fakturieren,faszinieren,finanzieren,fluktuieren,fokussieren,formatieren,formulieren,fusionieren,galoppieren,garantieren,gratinieren,gratulieren,harmonieren,harpunieren,heroisieren,hospitieren,implizieren,importieren,informieren,inhaftieren,inspirieren,inspizieren,instruieren,inszenieren,integrieren,intendieren,internieren,intrigieren,investieren,involvieren,kalkulieren,kandidieren,kartonieren,kasernieren,kokettieren,kollabieren,kollidieren,kombinieren,komparieren,kompilieren,komponieren,konferieren,kongruieren,konjugieren,konsumieren,konzipieren,kooperieren,korrelieren,korrigieren,kostümieren,kritisieren,kultivieren,kutschieren,lamentieren,lektorieren,liquidieren,marmorieren,marschieren,modellieren,nummerieren,okkludieren,oktroyieren,orientieren,oszillieren,ozonisieren,parfümieren,patentieren,perforieren,permutieren,plakatieren,poetisieren,postulieren,potenzieren,produzieren,profilieren,profitieren,prohibieren,projizieren,promenieren,promovieren,propagieren,provozieren,präfigieren,präparieren,präzisieren,pubertieren,publizieren,rabattieren,raffinieren,ramponieren,randalieren,rationieren,realisieren,rebellieren,reformieren,refundieren,reklamieren,rekrutieren,rekurrieren,remontieren,requirieren,reservieren,resignieren,resistieren,resorbieren,resultieren,retardieren,rezensieren,rezyklieren,schattieren,sekretieren,selektieren,spekulieren,stilisieren,stimulieren,subsumieren,suffigieren,suggerieren,tabellieren,tamponieren,temperieren,terminieren,therapieren,torpedieren,unifizieren,utilisieren,zementieren,zirkulieren,überstimmen¦14d:abkommandieren,abtelefonieren,aufgaloppieren,aufmarschieren,ausdiskutieren,ausformulieren,durchprobieren,durchschwimmen,einbalsamieren,einkalkulieren,einmarschieren,herbeizitieren,losmarschieren,umorganisieren,verkalkulieren,verkonsumieren,verspekulieren,vorfinanzieren,vorformulieren,zurückdatieren,alkoholisieren,aufoktroyieren,authentisieren,automatisieren,axiomatisieren,dekartellieren,dekrementieren,demissionieren,demoralisieren,denazifizieren,dezimalisieren,differenzieren,dimensionieren,diskreditieren,diskriminieren,fetischisieren,fraternisieren,föderalisieren,generalisieren,homogenisieren,identifizieren,ideologisieren,idiomatisieren,inkrementieren,interpretieren,inthronisieren,kapitalisieren,katalogisieren,kategorisieren,klassifizieren,konditionieren,konkretisieren,lexikalisieren,liberalisieren,literalisieren,literarisieren,militarisieren,minimalisieren,monopolisieren,naturalisieren,neutralisieren,nominalisieren,parabolisieren,paragraphieren,paraphrasieren,philosophieren,popularisieren,propagandieren,protokollieren,prädestinieren,quantifizieren,radikalisieren,rehabilitieren,rekapitulieren,rekonstruieren,reorganisieren,repräsentieren,schematisieren,solidarisieren,spezialisieren,stigmatisieren,sympathisieren,synthetisieren,säkularisieren,theoretisieren,transformieren,transportieren,verdünnisieren,zentralisieren,zentrifugieren,übereinstimmen¦13d:abmarschieren,andiskutieren,angaloppieren,anmarschieren,ausbetonieren,ausquartieren,ausspionieren,ausstaffieren,einbetonieren,eingruppieren,einquartieren,fortschwimmen,freischwimmen,gleichstimmen,nachschwimmen,umdisponieren,vollschmieren,agglomerieren,agglutinieren,akkommodieren,akkreditieren,aktualisieren,akupunktieren,animalisieren,argumentieren,aromatisieren,balkanisieren,barrikadieren,biologisieren,blankpolieren,buchstabieren,carbonisieren,dekreditieren,demonstrieren,desinfizieren,determinieren,dialogisieren,dogmatisieren,dokumentieren,domestizieren,dramatisieren,drangsalieren,elektrisieren,europäisieren,extrapolieren,falsifizieren,formalisieren,fotografieren,fraktionieren,frequentieren,funktionieren,germanisieren,gestikulieren,glorifizieren,gratifizieren,halluzinieren,harmonisieren,hypnotisieren,improvisieren,interessieren,interpolieren,intervenieren,justifizieren,karamellieren,katapultieren,katholisieren,klimatisieren,kollaborieren,kommunizieren,komplettieren,komplottieren,konfigurieren,konfrontieren,konföderieren,konsolidieren,konsternieren,konstituieren,kontaminieren,kontrastieren,kontrollieren,konzentrieren,lemmatisieren,manifestieren,metallisieren,methodisieren,modernisieren,mortifizieren,mystifizieren,narkotisieren,neurotisieren,normalisieren,objektivieren,paragrafieren,partizipieren,pauschalieren,periodisieren,petitionieren,positionieren,privatisieren,programmieren,qualifizieren,refinanzieren,rektifizieren,reproduzieren,ritualisieren,sanktionieren,schamponieren,signalisieren,sozialisieren,spezifizieren,stabilisieren,sterilisieren,strangulieren,strukturieren,substituieren,symbolisieren,terrorisieren,thematisieren,transferieren,transponieren,tyrannisieren,überreagieren¦15d:abqualifizieren,durchnumerieren,entkomplizieren,entkomprimieren,entpolitisieren,enttechnisieren,fortmarschieren,hochstilisieren,umfunktionieren,umprogrammieren,umstrukturieren,zurückschwimmen,zusammenstimmen,akklimatisieren,alphabetisieren,amerikanisieren,bagatellisieren,bürokratisieren,choreografieren,demokratisieren,diagnostizieren,diplomatisieren,elektrifizieren,entnazifizieren,experimentieren,fehlinvestieren,instrumentieren,internalisieren,interpunktieren,karamellisieren,kartographieren,kolonialisieren,kommunalisieren,komplementieren,komplimentieren,konfektionieren,kriminalisieren,kristallisieren,materialisieren,mathematisieren,miniaturisieren,nationalisieren,pauschalisieren,perfektionieren,personalisieren,personifizieren,photographieren,proletarisieren,rationalisieren,resozialisieren,restrukturieren,revolutionieren,sensibilisieren,standardisieren,systematisieren,tabellarisieren,transplantieren,verabsolutieren¦10d:abrasieren,aufglimmen,ausfrieren,ausglimmen,beistimmen,einfrieren,einstimmen,verglimmen,verstimmen,vertrimmen,abdizieren,abduzieren,abonnieren,aktivieren,alarmieren,alterieren,amputieren,avancieren,betonieren,blockieren,blondieren,brillieren,brüskieren,debütieren,decodieren,deduzieren,definieren,dekorieren,delegieren,demolieren,deponieren,deputieren,detonieren,dezidieren,dezimieren,dirigieren,dominieren,dressieren,duellieren,emulgieren,engagieren,eskalieren,etablieren,evakuieren,exerzieren,exhibieren,exhumieren,existieren,exponieren,filetieren,flambieren,flankieren,flektieren,frankieren,frappieren,frittieren,föderieren,generieren,graduieren,grassieren,gruppieren,haussieren,honorieren,ignorieren,imponieren,indexieren,indizieren,induzieren,infizieren,inhalieren,injizieren,inserieren,intonieren,ionisieren,irritieren,jubilieren,kanonieren,karikieren,kaschieren,klassieren,kumulieren,laborieren,laminieren,limitieren,marinieren,maximieren,meditieren,memorieren,minimieren,moderieren,modulieren,motivieren,musizieren,nasalieren,nominieren,numerieren,obduzieren,offerieren,okkupieren,omittieren,opponieren,optimieren,ordinieren,platzieren,plombieren,pressieren,punktieren,quadrieren,quartieren,quittieren,reduzieren,referieren,regulieren,renovieren,reparieren,residieren,resümieren,rezipieren,rezitieren,sabotieren,salutieren,saturieren,separieren,simulieren,skalpieren,skandieren,skizzieren,spendieren,spionieren,staffieren,stagnieren,stolzieren,stornieren,tapezieren,tolerieren,trainieren,traktieren,trassieren,tuschieren,typisieren,tätowieren,zentrieren¦16d:abtransportieren,dezentralisieren,disqualifizieren,durchdiskutieren,durchkomponieren,durchmarschieren,einprogrammieren,entbalkanisieren,entcarbonisieren,entformalisieren,entmetallisieren,entmystifizieren,uminterpretieren,verbarrikadieren,vorprogrammieren,authentifizieren,bibliographieren,charakterisieren,choreographieren,demilitarisieren,desillusionieren,emotionalisieren,problematisieren,remilitarisieren,überkompensieren,überstrapazieren¦12d:aufprobieren,ausprobieren,ausrangieren,ausschmieren,aussortieren,durchfrieren,durchstimmen,einkassieren,einoperieren,einschmieren,einschwimmen,einsortieren,einstudieren,enttabuieren,hinschmieren,hinschwimmen,mitbestimmen,nachdatieren,rückdatieren,umgruppieren,umquartieren,verschwimmen,zubetonieren,akkumulieren,akzentuieren,alkalisieren,amortisieren,antizipieren,applaudieren,artikulieren,asphaltieren,assimilieren,auktionieren,autorisieren,banalisieren,bombardieren,bonifizieren,botanisieren,deeskalieren,deklassieren,demodulieren,deplatzieren,diffundieren,dissertieren,distanzieren,dynamisieren,emanzipieren,etikettieren,fotokopieren,habilitieren,humanisieren,humifizieren,idealisieren,illuminieren,illustrieren,immunisieren,infiltrieren,installieren,islamisieren,kanalisieren,kanonisieren,kapitulieren,kartellieren,katalysieren,kolonisieren,kommandieren,kommentieren,kompensieren,komplizieren,kompostieren,komprimieren,kondensieren,konfirmieren,konfiszieren,konfligieren,konkurrieren,konspirieren,konstatieren,konstruieren,konsultieren,kontaktieren,kontrahieren,konvertieren,koordinieren,korrumpieren,legalisieren,legitimieren,lokalisieren,lombardieren,manipulieren,masturbieren,missionieren,mobilisieren,modifizieren,moralisieren,motorisieren,mumifizieren,nomadisieren,organisieren,paralysieren,parkettieren,parzellieren,pensionieren,pervertieren,phantasieren,pigmentieren,polarisieren,polemisieren,politisieren,portionieren,porträtieren,praktizieren,projektieren,proklamieren,prosperieren,protestieren,prozessieren,präsentieren,ratifizieren,reetablieren,reflektieren,regenerieren,registrieren,renaturieren,renumerieren,respektieren,retuschieren,schikanieren,schraffieren,segmentieren,skelettieren,stationieren,strapazieren,subtrahieren,suspendieren,technisieren,telefonieren,thesaurieren,totalisieren,transchieren,triumphieren,uniformieren,urbanisieren,verschmieren,überdosieren¦15nd:aufrechterhalte,weiterentwickel,wiedervereinige¦17d:ausdifferenzieren,demathematisieren,durchorganisieren,entalkoholisieren,entautomatisieren,entliberalisieren,entmonopolisieren,entnaturalisieren,hineinprojizieren,mißinterpretieren,nachkontrollieren,vorbeimarschieren,weitermarschieren,zurückmarschieren,entmilitarisieren,funktionalisieren,industrialisieren,kommerzialisieren¦17nd:auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere,hinterherschwimme,zusammenschrumpfe¦17erend:herauskristallisi,hinauskomplimenti¦8d:addieren,amtieren,basieren,codieren,datieren,dinieren,dosieren,dotieren,dozieren,düpieren,eruieren,fixieren,genieren,gerieren,hofieren,jurieren,kapieren,karieren,kopieren,kreieren,kurieren,linieren,lädieren,monieren,mutieren,negieren,notieren,panieren,parieren,polieren,posieren,pürieren,radieren,rasieren,regieren,rotieren,sanieren,sezieren,tarieren,taxieren,visieren,zitieren¦7d:agieren,frieren,glimmen,klimmen,stieren,stimmen,trimmen¦3end:sein¦5d:eilen¦18d:fehlinterpretieren¦6d:gieren,zieren¦2end:tun¦4d:ölen¦19d:instrumentalisieren,professionalisieren"
      }
    },
    "pastParticiple": {
      "pastParticiple": {
        "fwd": "geschrumpft:schrumpfen¦1t:re¦1ert:i¦2ommen:enehmen¦2orben:ewerben¦2ogen:eziehen¦3offen:etreffen¦3anden:estehen¦3t:weren,ueren¦4t:gehren,gucken,eleben,ehören,rachen¦5t:ezahlen,elangen,glücken,enutzen,ereisen¦5oren:eschwören",
        "both": "5t:ludern,rusten,rkühlen,ümieren,grieren,rrieren,trieren,drieren,seuchen,fluten,orieren,rlauben,kunden,elligen,gegnen,irieren,innern,hageln,rbeulen,ückeln,umpeln,ümmern,umieren,rkleben,rheizen,ursten,rdrehen,erbauen,erleben,rwachen,itteln,rlernen,rklären,rfüllen,rfragen,rblühen,imieren,rleiben,mmieren,amieren,erieren,rmieren,undern,rteilen,segeln,indern,rkaufen,arieren,urieren,talten,dowern,rtrauen¦5ochen:ersprechen¦5olzen:rschmelzen¦5ossen:rschließen¦4t:ruchen,mutzen,narben,rlosen,inern,xieren,lichen,hitzen,utigen,kieren,ltigen,iteln,olden,ldigen,nahmen,netzen,iligen,mannen,idigen,adigen,edigen,htigen,cieren,iieren,vieren,obern,ieden,rtern,ddern,igern,ffern,rmalen,nacken,lbern,taunen,ranken,uieren,ümeln,lumpen,zeugen,ätigen,atten,sorgen,siegen,ädigen,lohnen,ftigen,sellen,stigen,orten,peten,fieren,saunen,üsern,lieren,wahren,bieren,pieren,raumen,nieren,gieren,zieren,tieren,hieren,dieren,sieren¦4ichen:rstreichen¦4ieden:rscheiden¦4gezogen:überziehen¦4gereicht:überreichen¦4gestanden:überstehen¦3t:sigen,kten,rigen,üden,armen,uppen,äten,äuben,eelen,pten,nügen,higen,mden,ussen,ßern,almen,alken,wegen,fnen,tören,loben,ähren,ärken,nigen,issen,mühen,zigen,uemen,öhnen¦3unden:erwinden,erbinden¦3iffen:rpfeifen,rkneifen¦3oten:erbieten¦3gestellt:terstellen,herstellen¦3gereist:herreisen¦3gerückt:berrücken¦3geben:hgeben,igeben,sgeben,fgeben,ngeben,tgeben¦3gefallen:terfallen¦3geflogen:herfliegen¦2t:öhen,onen,rven,efen,iken¦2orben:rwerben¦2issen:rbeißen¦2ohlen:pfehlen¦2gerichtet:orrichten¦2gelegen:orliegen¦2ieben:rreiben¦2ogen:lziehen¦2unden:pfinden¦2gegessen:eressen¦2gezaubert:orzaubern¦2gefunden:erfinden¦2iesen:rweisen¦2offen:rsaufen¦2oschen:rlöschen¦2geragt:orragen¦2gehoben:orheben¦2geschlagen:inschlagen¦2geschwommen:chschwimmen¦2gestellt:orstellen,arstellen¦2gelegt:orlegen,uflegen¦2gestanden:orstehen¦2gehalten:ithalten¦2egriffen:ngreifen¦2egliedert:ngliedern¦2gangen:gehen¦1gezählt:uzählen,hzählen,nzählen¦1gezahlt:uzahlen,nzahlen¦1gelogen:nlügen¦1gekoppelt:nkoppeln¦1geklungen:nklingen,hklingen¦1geflochten:nflechten¦1gehalten:mhalten,hhalten,shalten,nhalten¦1geschritten:sschreiten¦1gespiegelt:rspiegeln¦1gerannt:irennen,hrennen,nrennen¦1issen:leißen¦1gesiedelt:msiedeln¦1gestreift:rstreifen¦1gefunden:tfinden,nfinden¦1geblickt:kblicken¦1gezogen:hziehen,mziehen,sziehen,fziehen,nziehen¦1gesprochen:hsprechen,gsprechen,ssprechen,nsprechen¦1geschlichen:hschleichen,nschleichen¦1gereist:hreisen,treisen,nreisen¦1gegessen:hessen¦1geschlagen:kschlagen,mschlagen,lschlagen,hschlagen,sschlagen¦1gelegt:mlegen,tlegen,ilegen,nlegen¦1gestrebt:hstreben¦1gestellt:ustellen,hstellen,gstellen,nstellen,sstellen,fstellen,mstellen¦1gekommen:gkommen,mkommen,hkommen,ukommen,rkommen,ikommen,skommen,nkommen¦1geschwunden:nschwinden¦1geschieden:nscheiden¦1gelangt:nlangen¦1geritten:nreiten,rreiten¦1getaucht:rtauchen,ftauchen¦1geflogen:ifliegen,nfliegen¦1gespritzt:sspritzen¦1gehoben:sheben,nheben¦1gereicht:freichen,nreichen,hreichen,sreichen¦1gerückt:nrücken,srücken¦1gezeichnet:nzeichnen,hzeichnen¦1gestanden:istehen,hstehen,sstehen,fstehen,nstehen¦1gelassen:ilassen,hlassen,slassen,nlassen¦1gesteuert:nsteuern,ssteuern¦1gewurzelt:nwurzeln¦1gewandt:nwenden¦1getrocknet:ntrocknen¦1gesäuert:nsäuern¦1gespielt:nspielen,hspielen,sspielen¦1geschlossen:nschließen¦1gescharrt:nscharren¦1geräumt:nräumen¦1gerichtet:nrichten¦1gelagert:nlagern¦1gekratzt:nkratzen¦1gekniffen:nkneifen¦1gekittet:nkitten¦1gekeilt:nkeilen¦1geheizt:nheizen¦1geheilt:nheilen¦1gefordert:nfordern¦1geflossen:nfließen,bfließen¦1gefangen:nfangen¦1gesucht:hsuchen,ssuchen,nsuchen¦1gestimmt:hstimmen,nstimmen¦1geschnitten:hschneiden,nschneiden¦1gerüttelt:hrütteln¦1gerufen:hrufen,nrufen¦1gerechnet:hrechnen,nrechnen¦1geprüft:hprüfen¦1geladen:hladen¦1geholfen:hhelfen¦1gefragt:hfragen¦1gefallen:hfallen,ffallen,mfallen,nfallen¦1gedrückt:hdrücken¦1geklebt:nkleben¦1geredet:nreden¦1gehauen:nhauen,shauen¦1gewelkt:nwelken¦1gekniet:rknien¦1gesiecht:nsiechen¦1geschmolzen:nschmelzen¦1gelebt:nleben¦1geeilt:neilen¦1gehandelt:nhandeln¦1gelegen:hliegen,nliegen¦1annt:nennen,kennen¦1geschaffen:ischaffen¦1geschrien:sschreien¦1oren:kiesen¦1gebrochen:sbrechen,nbrechen¦1gewunden:fwinden¦1gezaubert:nzaubern¦1gewohnt:nwohnen¦1gewiesen:nweisen¦1gewachsen:nwachsen¦1getroffen:ntreffen¦1gestrichen:nstreichen¦1gestrahlt:nstrahlen¦1gestaubt:nstauben¦1gesprüht:nsprühen¦1gespannt:nspannen¦1geschweißt:nschweißen¦1geschmiert:nschmieren¦1geschifft:nschiffen¦1gesammelt:nsammeln¦1gerührt:nrühren¦1gerieben:nreiben¦1gepflanzt:npflanzen¦1gepackt:npacken¦1gemietet:nmieten¦1gemahnt:nmahnen¦1gelötet:nlöten¦1geleitet:nleiten¦1gekuppelt:nkuppeln¦1geknüpft:nknüpfen¦1gekleidet:nkleiden¦1geklammert:nklammern¦1gekettet:nketten¦1gekauft:nkaufen¦1gefüllt:nfüllen¦1gefeuert:nfeuern¦1gefasst:nfassen¦1gedeutet:ndeuten¦1gebrannt:nbrennen¦1gebohrt:nbohren¦1gebunden:nbinden¦1gebettelt:nbetteln¦1gebaut:nbauen¦1egossen:gießen¦getan:tun¦egurtet:urten¦geworden:werden¦geborgt:borgen¦gestutzt:stutzen¦geschustert:schustern¦gewimmelt:wimmeln¦egrätscht:rätschen¦gebeugt:beugen¦gekartet:karten¦geklappt:klappen¦gekippt:kippen¦geklotzt:klotzen¦geblättert:blättern¦gewagt:wagen¦gequellt:quellen¦gesprudelt:sprudeln¦gefiltert:filtern¦gehobelt:hobeln¦geschnellt:schnellen¦gestuft:stufen¦gespeichert:speichern¦geschwebt:schweben¦gepfercht:pferchen¦geschlendert:schlendern¦geflüstert:flüstern¦gezwängt:zwängen¦gesehen:sehen¦geschmuggelt:schmuggeln¦geschleust:schleusen¦geschimmert:schimmern¦gesaust:sausen¦gepeitscht:peitschen¦gepaukt:pauken¦gefeiert:feiern¦gebläut:bläuen¦gebleut:bleuen¦gefunkt:funken¦gesunken:sinken¦geschleppt:schleppen¦gedämmert:dämmern¦gezischt:zischen¦gewirkt:wirken¦gewalzt:walzen¦geschüttet:schütten¦geschult:schulen¦geschlachtet:schlachten¦geschaufelt:schaufeln¦gerastet:rasten¦gependelt:pendeln¦geparkt:parken¦gemündet:münden¦gekrochen:kriechen¦gekramt:kramen¦gehändigt:händigen¦gehaucht:hauchen¦eglitscht:litschen¦geführt:führen¦geflippt:flippen¦gefegt:fegen¦gedacht:denken¦gecheckt:checken¦gebürgert:bürgern¦gebuchtet:buchten¦gebootet:booten¦gebildet:bilden¦gebeutelt:beuteln¦gebaggert:baggern¦gewallt:wallen¦getakelt:takeln¦gestülpt:stülpen¦gestiftet:stiften¦gestapelt:stapeln¦gesessen:sitzen¦geschüttelt:schütteln¦geschnappt:schnappen¦gerafft:raffen¦gepäppelt:päppeln¦geprägt:prägen¦gepolstert:polstern¦gepfropft:pfropfen¦gemeißelt:meißeln¦gelesen:lesen¦gekrempelt:krempeln¦geklinkt:klinken¦gekeimt:keimen¦gejauchzt:jauchzen¦gefädelt:fädeln¦geforstet:forsten¦gebügelt:bügeln¦geblendet:blenden¦gebettet:betten¦gezeigt:zeigen¦getestet:testen¦gesät:säen¦gestürmt:stürmen¦gestemmt:stemmen¦gesteckt:stecken¦gespült:spülen¦gesprungen:springen¦gespien:speien¦geseilt:seilen¦geschwärzt:schwärzen¦geschwellt:schwellen¦geschraubt:schrauben¦geschmissen:schmeißen¦geschaut:schauen¦gerollt:rollen¦gereiht:reihen¦gerauht:rauhen¦geputzt:putzen¦gepriesen:preisen¦geordnet:ordnen¦genagelt:nageln¦gemotzt:motzen¦gemessen:messen¦gemacht:machen¦geläutet:läuten¦gelernt:lernen¦gekreuzt:kreuzen¦geknipst:knipsen¦geklingelt:klingeln¦gehalftert:halftern¦egrinst:rinsen¦gefühlt:fühlen¦gefroren:frieren¦gefertigt:fertigen¦gefaxt:faxen¦gefügt:fügen¦gedrungen:dringen¦gebrütet:brüten¦gebrummt:brummen¦geblinzelt:blinzeln¦gebacken:backen¦gezäumt:zäumen¦gezirkelt:zirkeln¦gewälzt:wälzen¦gewinkt:winken¦gewogen:wiegen¦gewetzt:wetzen¦geworfen:werfen¦geweicht:weichen¦gewaschen:waschen¦gewandert:wandern¦getrudelt:trudeln¦getreten:treten¦getrieben:treiben¦getragen:tragen¦getanzt:tanzen¦gesägt:sägen¦gestürzt:stürzen¦geströmt:strömen¦gestrampelt:strampeln¦gestoßen:stoßen¦gestielt:stielen¦gestempelt:stempeln¦gestiegen:steigen¦gestochen:stechen¦gespult:spulen¦gesprengt:sprengen¦gesperrt:sperren¦gespart:sparen¦gesondert:sondern¦gesungen:singen¦gesetzt:setzen¦gesengt:sengen¦geseift:seifen¦gesegnet:segnen¦geschürft:schürfen¦geschäumt:schäumen¦geschält:schälen¦geschwungen:schwingen¦geschwenkt:schwenken¦geschweift:schweifen¦geschrägt:schrägen¦geschrieben:schreiben¦geschnürt:schnüren¦geschnallt:schnallen¦geschmeichelt:schmeicheln¦geschlämmt:schlämmen¦geschleift:schleifen¦geschirrt:schirren¦geschossen:schießen¦geschoben:schieben¦geschaltet:schalten¦geschabt:schaben¦gesaugt:saugen¦gesattelt:satteln¦gesagt:sagen¦gerudert:rudern¦gerodet:roden¦gerissen:reißen¦gequält:quälen¦gepumpt:pumpen¦geprallt:prallen¦genäht:nähen¦genommen:nehmen¦gemustert:mustern¦gemeldet:melden¦gelöst:lösen¦geleuchtet:leuchten¦gelenkt:lenken¦gelehnt:lehnen¦gelaufen:laufen¦gelacht:lachen¦gekämmt:kämmen¦gekriegt:kriegen¦gekotzt:kotzen¦geknöpft:knöpfen¦geknickt:knicken¦geknabbert:knabbern¦geklopft:klopfen¦geklaubt:klauben¦gekehrt:kehren¦gekapselt:kapseln¦gejagt:jagen¦gehangen:hängen¦geholt:holen¦gehetzt:hetzen¦geheftet:heften¦gehakt:haken¦egrenzt:renzen¦onnen:innen¦gefärbt:färben¦gefressen:fressen¦gefischt:fischen¦gefiebert:fiebern¦gefeilt:feilen¦gefedert:federn¦gefahren:fahren¦gedämmt:dämmen¦gedrängt:drängen¦gedreht:drehen¦gebürstet:bürsten¦gebracht:bringen¦geblitzt:blitzen¦geblieben:bleiben¦geblasen:blasen¦gebogen:biegen¦gebetet:beten¦gebissen:beißen¦gearbeitet:arbeiten",
        "rev": "bauen:gebaut¦betteln:gebettelt¦binden:gebunden¦blühen:geblüht¦brechen:gebrochen¦brennen:gebrannt¦brühen:gebrüht¦büßen:gebüßt¦dampfen:gedampft¦decken:gedeckt¦dienen:gedient¦drucken:gedruckt¦dunkeln:gedunkelt¦essen:gegessen¦fangen:gefangen¦filmen:gefilmt¦fliegen:geflogen¦fordern:gefordert¦fragen:gefragt¦füllen:gefüllt¦aunern:egaunert¦leiten:eglitten,geleitet¦rasen:egrast,gerast¦halten:gehalten¦hauen:gehauen¦heilen:geheilt¦holzen:geholzt¦härten:gehärtet¦kaufen:gekauft¦kleben:geklebt¦klingen:geklungen¦knallen:geknallt¦kneifen:gekniffen¦kochen:gekocht¦koppeln:gekoppelt¦kuppeln:gekuppelt¦kühlen:gekühlt¦laden:geladen¦lassen:gelassen¦lauten:gelautet¦legen:gelegt¦liefern:geliefert¦malen:gemalt¦mähen:gemäht¦nagen:genagt¦nutzen:genutzt¦pfeifen:gepfiffen¦pressen:gepresst,gepreßt¦rauschen:gerauscht¦regen:geregt¦reichen:gereicht¦reiten:geritten¦riegeln:geriegelt¦ringen:gerungen¦runden:gerundet¦rutschen:gerutscht¦rücken:gerückt¦rüsten:gerüstet¦saufen:gesoffen¦scheiden:geschieden¦scheuern:gescheuert¦schinden:geschunden¦schlagen:geschlagen¦schmelzen:geschmolzen¦schmieren:geschmiert¦schneiden:geschnitten¦schreiten:geschritten¦schwatzen:geschwatzt¦schwören:geschworen¦schöpfen:geschöpft¦sichern:gesichert¦spannen:gespannt¦spielen:gespielt¦sprechen:gesprochen¦spritzen:gespritzt¦stammen:gestammt¦statten:gestattet¦steifen:gesteift¦sterben:gestorben¦stimmen:gestimmt¦strahlen:gestrahlt¦streichen:gestrichen¦stützen:gestützt¦tasten:getastet¦tauen:getaut¦tippen:getippt¦trinken:getrunken¦träufeln:geträufelt¦tönen:getönt¦wandeln:gewandelt¦wechseln:gewechselt¦weiden:geweidet¦wenden:gewandt¦werten:gewertet¦winden:gewunden¦wischen:gewischt¦wählen:gewählt¦zahlen:gezahlt¦zeichnen:gezeichnet¦zupfen:gezupft¦zwingen:gezwungen¦zählen:gezählt¦ändern:geändert¦bieten:geboten¦blicken:geblickt¦bremsen:gebremst¦dichten:gedichtet¦fechten:gefochten¦iften:egiftet¦klagen:geklagt¦kämpfen:gekämpft¦lasten:gelastet¦lächeln:gelächelt¦merken:gemerkt¦passen:gepasst¦reizen:gereizt¦schaffen:geschafft,geschaffen¦schreien:geschrien¦schwemmen:geschwemmt¦schwindeln:geschwindelt¦spitzen:gespitzt¦stacheln:gestachelt¦stauen:gestaut¦streben:gestrebt¦trauen:getraut¦wehen:geweht¦wärmen:gewärmt¦atmen:geatmet¦bessern:gebessert¦braten:gebraten¦donnern:gedonnert¦drücken:gedrückt¦fassen:gefasst,gefaßt¦abeln:egabelt¦leisen:egleist¦limmen:eglommen¦reifen:egriffen,gereift¦horchen:gehorcht¦klären:geklärt¦kommen:gekommen¦liegen:gelegen¦leben:gelebt¦pflanzen:gepflanzt¦rauchen:geraucht¦rechnen:gerechnet¦richten:gerichtet¦rühren:gerührt¦schaukeln:geschaukelt¦scheuchen:gescheucht¦schließen:geschlossen¦schrecken:geschreckt¦spalten:gespalten¦spüren:gespürt¦suchen:gesucht¦treffen:getroffen¦wachsen:gewachsen¦weisen:gewiesen¦wühlen:gewühlt¦bitten:gebeten¦bohren:gebohrt¦buchen:gebucht¦dauern:gedauert¦fallen:gefallen¦fließen:geflossen¦folgen:gefolgt¦füttern:gefüttert¦liedern:egliedert¦handeln:gehandelt¦keilen:gekeilt¦klammern:geklammert¦kosten:gekostet¦lagern:gelagert¦leiden:gelitten¦leihen:geliehen¦löschen:geloschen¦packen:gepackt¦quatschen:gequatscht¦reden:geredet¦reiben:gerieben¦rotten:gerottet¦rupfen:gerupft¦salzen:gesalzen¦schenken:geschenkt¦schlafen:geschlafen¦schlüpfen:geschlüpft¦schwefeln:geschwefelt¦schwitzen:geschwitzt¦senden:gesandt¦sprühen:gesprüht¦stopfen:gestopft¦tauschen:getauscht¦trocknen:getrocknet¦weinen:geweint¦wickeln:gewickelt¦üben:geübt¦mengen:gemengt¦wohnen:gewohnt¦stehen:gestanden¦stellen:gestellt¦heben:gehoben¦finden:gefunden¦formen:geformt¦hungern:gehungert¦langen:gelangt¦regnen:geregnet¦schallen:geschallt¦schlingen:geschlungen¦sieben:gesiebt¦trennen:getrennt¦buddeln:gebuddelt¦ipsen:egipst¦lasen:eglast¦helfen:geholfen¦impfen:geimpft¦klemmen:geklemmt¦mauern:gemauert¦renken:gerenkt¦räuchern:geräuchert¦schachteln:geschachtelt¦schneien:geschneit¦schätzen:geschätzt¦streuen:gestreut¦teilen:geteilt¦weben:gewebt¦zäunen:gezäunt¦eilen:geeilt¦räumen:geräumt¦sehnen:gesehnt¦wünschen:gewünscht¦achten:geachtet¦ziehen:gezogen¦reisen:gereist¦rufen:gerufen¦leiern:geleiert¦wirbeln:gewirbelt¦zaubern:gezaubert¦neigen:geneigt¦kauen:gekaut¦jubeln:gejubelt¦scheren:geschert¦platzen:geplatzt¦mischen:gemischt¦bleichen:geblichen¦rübeln:egrübelt¦hallen:gehallt¦schmettern:geschmettert¦würgen:gewürgt¦schweigen:geschwiegen¦deuten:gedeutet¦raben:egraben¦kleiden:gekleidet¦pflügen:gepflügt¦rennen:gerannt¦topfen:getopft¦tanken:getankt¦aukeln:egaukelt¦lügen:gelogen¦täuschen:getäuscht¦kratzen:gekratzt¦spinnen:gesponnen¦scheinen:geschienen¦eignen:geeignet¦löten:gelötet¦streifen:gestreift¦leimen:geleimt¦haben:gehabt¦mahlen:gemahlen¦ilen:geilt¦ittern:egittert¦lühen:eglüht¦ären:egoren¦1lten:egolten¦1leichen:geglichen¦1schwimmen:ngeschwommen,n geschwommen¦1izen:egeizt¦1igen:egeigt¦2ben:gegeben¦2iehen:rzogen¦2itten:rbeten¦2ießen:rgossen¦2eben:rhoben¦2iegen:rlegen,rbogen¦2ehen:rgangen¦2ehmen:rnommen¦2ennen:rrannt¦2eißen:rrissen¦2enden:rsandt¦2erfen:rworfen¦2en:est¦3ehen:rstanden¦3en:ingt¦3ehmen:benommen¦3eichen:rblichen¦3ingen:rbracht,rklungen¦3eifen:rgriffen¦3eiben:rblieben,rtrieben¦3echen:rbrochen¦3iegen:rflogen¦3ießen:rflossen¦4en:rlegt,hängt,rholt,rhört,ascht,rsagt,tragt,hwert,quert¦4ießen:rschossen¦4ehen:bestanden¦4ingen:rsprungen¦5en:rlangt,rwählt,rfasst,rfolgt,rhallt,rsetzt,rsucht,rzählt,rführt,kracht¦5n:reitet,wendet,rredet¦5eiden:rschnitten¦5eiben:rschrieben¦5eiten:rschritten",
        "ex": "7:begeben,behauen,beladen,beraten,berufen,ergeben,erraten,ersehen,genesen,geraten,umgeben¦8:befahren,befallen,begraben,behalten,bekommen,belassen,belaufen,betragen,betreten,entladen,erfahren,erhalten,erlassen,erlaufen,ertragen,umfahren,vergeben,verhauen,verladen,verlesen,verraten,versehen,zerhauen¦9:abberufen,bewachsen,entfallen,enthalten,entkommen,entlassen,entlaufen,missraten,verbraten,verfahren,verfallen,verfangen,verhalten,verheißen,verkommen,verlassen,verlaufen,vermessen,versalzen,verstoßen,vertragen,vertreten,zerblasen,zerfallen,zerlaufen,zermahlen,zersalzen,zertreten,empfangen,erwachsen,geschehen,vergessen,vergraben,übergeben,überladen,überlesen,übersehen¦10:abbehalten,abbekommen,anbehalten,ausersehen,dabehalten,einberufen,erschaffen,erschlagen,hingeraten,missfallen,umbehalten,verwachsen,zerfressen,zerspalten,zubekommen,beschlagen,widerrufen,überfahren,überfallen,überkommen,überlassen,überlaufen,übertragen¦11:aufbehalten,aufbekommen,beibehalten,durchfahren,einbehalten,entschlafen,fortbegeben,heimbegeben,herbekommen,losbekommen,mitbekommen,nachgeraten,verschlafen,verschlagen,vorbehalten,wegbekommen,zerschlagen,untergraben,unterhalten,unterlassen,unterlaufen,widerfahren,überfressen¦12:hierbehalten,liebbehalten,vorenthalten,freibekommen,hinterlassen,überbehalten,überbekommen,überschlafen¦13:durchbekommen,flottbekommen,spitzbekommen,zurückbegeben,beratschlagen,übrigbehalten¦14:fertigbekommen,wiederbekommen,wiedererhalten,zurückbehalten,zurückbekommen,zurückerhalten¦15:zusammengeraten¦17:aneinandergeraten¦gestaubsaugt:staubsaugen¦geaalt:aalen¦gesackt:absacken¦geachtet:achten¦geadelt:adeln¦geahmt:ahmen¦geahndet:ahnden¦geahnt:ahnen¦gealbert:albern¦gealtert:altern¦gealtertümelt:altertümeln¦geangelt:angeln¦geankert:ankern¦geantwortet:antworten¦gearbeitet:arbeiten¦geargwöhnt:argwöhnen¦geartet:arten¦geatmet:atmen¦oktroyiert:aufoktroyieren¦gegessen:essen¦gebacken:backen¦gebadet:baden¦gebaggert:baggern¦gebahnt:bahnen¦gebahrt:bahren¦gebalgt:balgen¦geballt:ballen¦geballert:ballern¦gebalzt:balzen¦gebunden:binden¦gebandelt:bandeln¦gebangt:bangen¦gebannt:bannen¦geborgen:bergen¦gebarrt:barren¦geborsten:bersten¦gebastelt:basteln¦gebeten:bitten¦gebaucht:bauchen¦gebauchredet:bauchreden¦gebaut:bauen¦gebaumelt:baumeln¦gebauscht:bauschen¦gebauspart:bausparen¦gebebt:beben¦gebechert:bechern¦gebeichtet:beichten¦gebeizt:beizen¦gebissen:beißen¦gebellt:bellen¦gebessert:bessern¦gebetet:beten¦gebettet:betten¦gebettelt:betteln¦gebeugt:beugen¦gebeult:beulen¦gebeutet:beuten¦gebeutelt:beuteln¦gebibbert:bibbern¦gebiedert:biedern¦gebogen:biegen¦geboten:bieten¦gebildet:bilden¦gebildhauert:bildhauern¦gebilligt:billigen¦gebimmelt:bimmeln¦gebimst:bimsen¦gewesen:sein¦geblafft:blaffen¦geblasen:blasen¦geblaßt:blassen¦geblecht:blechen¦geblieben:bleiben¦geblichen:bleichen¦geblendet:blenden¦gebleut:bleuen¦geblickt:blicken¦geblinkt:blinken¦geblinzelt:blinzeln¦geblitzt:blitzen¦geblubbert:blubbern¦geblutet:bluten¦gebläht:blähen¦geblättert:blättern¦gebläut:bläuen¦geblödelt:blödeln¦geblökt:blöken¦geblüht:blühen¦gebohnert:bohnern¦gebohrt:bohren¦gebolzt:bolzen¦gebombt:bomben¦geboomt:boomen¦gebootet:booten¦geborgt:borgen¦geboxt:boxen¦gebrabbelt:brabbeln¦gebrochen:brechen¦gebracht:bringen¦gebrandet:branden¦gebrandmarkt:brandmarken¦gebrannt:brennen¦gebraten:braten¦gebraucht:brauchen¦gebraut:brauen¦gebraust:brausen¦gebreitet:breiten¦gebremst:bremsen¦gebrodelt:brodeln¦gebrowst:browsen¦gebrummt:brummen¦gebrutzelt:brutzeln¦gebröckelt:bröckeln¦gebrüht:brühen¦gebrüllt:brüllen¦gebrüstet:brüsten¦gebrütet:brüten¦gebucht:buchen¦gebuchtet:buchten¦gebuddelt:buddeln¦gebuht:buhen¦gebuhlt:buhlen¦gebullert:bullern¦gebummelt:bummeln¦gebumst:bumsen¦gebunkert:bunkern¦gebuttert:buttern¦gebändigt:bändigen¦gebäumt:bäumen¦gebölkt:bölken¦geböllert:böllern¦gebückt:bücken¦gebüffelt:büffeln¦gebügelt:bügeln¦gebündelt:bündeln¦gebürdet:bürden¦gebürgt:bürgen¦gebürgert:bürgern¦gebürstet:bürsten¦gebüxt:büxen¦gebüßt:büßen¦gecheckt:checken¦gechillt:chillen¦geclont:clonen¦gecremt:cremen¦gedacht:dachen¦gedamelt:dameln¦gedampft:dampfen¦gedungen:dingen¦gedankt:danken¦gedarbt:darben¦gedurft:dürfen¦gedauert:dauern¦gedeckt:decken¦gedehnt:dehnen¦gedeicht:deichen¦gedeichselt:deichseln¦gedellt:dellen¦gedemütigt:demütigen¦gedeucht:dünken¦gedeutet:deuten¦gedeutelt:deuteln¦gedichtet:dichten¦gedient:dienen¦gedippt:dippen¦gedockt:docken¦gedoktert:doktern¦gedolmetscht:dolmetschen¦gedonnert:donnern¦gedopt:dopen¦gedoppelt:doppeln¦gedost:dosen¦gedoubelt:doubeln¦gedrahtet:drahten¦gedrungen:dringen¦gedreht:drehen¦gedroschen:dreschen¦gedribbelt:dribbeln¦gedriftet:driften¦gedrillt:drillen¦gedrittelt:dritteln¦gedroht:drohen¦gedrosselt:drosseln¦gedruckt:drucken¦gedruckst:drucksen¦gedrängt:drängen¦gedrängelt:drängeln¦gedröhnt:dröhnen¦gedröselt:dröseln¦gedrückt:drücken¦geduckt:ducken¦gedudelt:dudeln¦geduftet:duften¦geduldet:dulden¦gedunkelt:dunkeln¦gedunstet:dunsten¦gedurstet:dursten¦geduscht:duschen¦geduselt:duseln¦geduzt:duzen¦gedämmt:dämmen¦gedämmert:dämmern¦gedämpft:dämpfen¦gedörrt:dörren¦gedöst:dösen¦gedübelt:dübeln¦gedümpelt:dümpeln¦gedüngt:düngen¦gedünnt:dünnen¦gedünstet:dünsten¦gedürstet:dürsten¦gedüst:düsen¦geemailt:e-mailen¦geebbt:ebben¦geebnet:ebnen¦geehelicht:ehelichen¦geehrt:ehren¦geeicht:eichen¦geeiert:eiern¦geeifert:eifern¦geeignet:eignen¦geeilt:eilen¦geeint:einen¦geeinigt:einigen¦geeist:eisen¦geeitert:eitern¦geekelt:ekeln¦geendet:enden¦geengt:engen¦geentert:entern¦geerbt:erben¦geerdet:erden¦geerntet:ernten¦gefacht:fachen¦gefahndet:fahnden¦gefahren:fahren¦gefallen:fallen¦gefaltet:falten¦gefalzt:falzen¦gefunden:finden¦gefangen:fangen¦gefaselt:faseln¦gefasert:fasern¦gefasst:fassen¦gefastet:fasten¦gefaucht:fauchen¦gefault:faulen¦gefaulenzt:faulenzen¦gefaustet:fausten¦gefaxt:faxen¦gefochten:fechten¦gefedert:federn¦gefegt:fegen¦gefehlt:fehlen¦gefeit:feien¦gefeiert:feiern¦gefeilt:feilen¦gefeilscht:feilschen¦gefeindet:feinden¦geferkelt:ferkeln¦gefertigt:fertigen¦gefesselt:fesseln¦gefestigt:festigen¦gefettet:fetten¦gefetzt:fetzen¦gefeuchtet:feuchten¦gefeuert:feuern¦gefiebert:fiebern¦gefiedelt:fiedeln¦gefiedert:fiedern¦gefilmt:filmen¦gefiltert:filtern¦gefilzt:filzen¦gefirmt:firmen¦gefischt:fischen¦gefixt:fixen¦geflacht:flachen¦geflackert:flackern¦geflaggt:flaggen¦geflammt:flammen¦geflankt:flanken¦geflanscht:flanschen¦geflattert:flattern¦geflaut:flauen¦geflochten:flechten¦gefleckt:flecken¦gefleddert:fleddern¦geflegelt:flegeln¦gefleht:flehen¦geflennt:flennen¦gefletscht:fletschen¦geflogen:fliegen¦geflohen:fliehen¦gefliest:fliesen¦geflossen:fließen¦geflimmert:flimmern¦geflippt:flippen¦geflippert:flippern¦geflittert:flittern¦geflitzt:flitzen¦geflockt:flocken¦gefloppt:floppen¦geflucht:fluchen¦gefluchtet:fluchten¦geflunkert:flunkern¦gefluppt:fluppen¦geflutet:fluten¦geflutscht:flutschen¦geflämmt:flämmen¦gefläzt:fläzen¦geflötet:flöten¦geflößt:flößen¦geflüchtet:flüchten¦geflüstert:flüstern¦gefolgt:folgen¦gefolgert:folgern¦gefoltert:foltern¦gefoppt:foppen¦gefordert:fordern¦geformt:formen¦geforscht:forschen¦geforstet:forsten¦gefoult:foulen¦gefrachtet:frachten¦gefragt:fragen¦gefranst:fransen¦gefranzt:franzen¦gefressen:fressen¦gefremdelt:fremdeln¦geschämt:fremdschämen¦gefreut:freuen¦gefreundet:freunden¦gefrevelt:freveln¦gefroren:frieren¦gefrischt:frischen¦gefristet:fristen¦gefrotzelt:frotzeln¦gefruchtet:fruchten¦gefrustet:frusten¦gefräst:fräsen¦gefröstelt:frösteln¦gefuchtelt:fuchteln¦gefugt:fugen¦gefummelt:fummeln¦gefunkt:funken¦gefunkelt:funkeln¦gefurzt:furzen¦gefusselt:fusseln¦gefuttert:futtern¦gefußt:fußen¦gefächelt:fächeln¦gefächert:fächern¦gefädelt:fädeln¦gefällt:fällen¦gefälscht:fälschen¦gefärbt:färben¦geföhnt:föhnen¦gefönt:fönen¦gefördert:fördern¦gefügt:fügen¦gefühlt:fühlen¦geführt:führen¦gefüllt:füllen¦gefürchtet:fürchten¦gefüttert:füttern¦gehaart:haaren¦gehabt:haben¦gehackt:hacken¦gehadert:hadern¦gehaftet:haften¦gehagelt:hageln¦gehakt:haken¦gehalftert:halftern¦gehallt:hallen¦gehalst:halsen¦gehalten:halten¦gehampelt:hampeln¦gehamstert:hamstern¦gehandelt:handeln¦gehandhabt:handhaben¦gehangelt:hangeln¦gehangen:hängen¦gehapert:hapern¦geharrt:harren¦geharzt:harzen¦gehascht:haschen¦gehaspelt:haspeln¦gehasst:hassen¦gehastet:hasten¦gehaucht:hauchen¦gehauen:hauen¦gehaust:hausen¦gehechelt:hecheln¦gehechtet:hechten¦geheftet:heften¦gehegt:hegen¦geheilt:heilen¦geheimelt:heimeln¦geheimst:heimsen¦geheiratet:heiraten¦geheitert:heitern¦geheizt:heizen¦geheißen:heißen¦gehellt:hellen¦gehemmt:hemmen¦geherrscht:herrschen¦geherzt:herzen¦gehetzt:hetzen¦geheuchelt:heucheln¦geheuert:heuern¦geheult:heulen¦gehext:hexen¦gehievt:hieven¦gehimmelt:himmeln¦gehindert:hindern¦gehinkt:hinken¦gehobelt:hobeln¦gehoben:heben¦gehockt:hocken¦gehofft:hoffen¦gehohnlacht:hohnlachen¦geholfen:helfen¦geholpert:holpern¦geholt:holen¦geholzt:holzen¦gehoppelt:hoppeln¦gehoppt:hoppen¦gehopst:hopsen¦gehortet:horten¦gehuldigt:huldigen¦gehungert:hungern¦gehupt:hupen¦gehuscht:huschen¦gehustet:husten¦gehäckselt:häckseln¦gehäkelt:häkeln¦gehämmert:hämmern¦gehändigt:händigen¦gehänselt:hänseln¦gehärtet:härten¦gehätschelt:hätscheln¦gehäuft:häufen¦gehäutet:häuten¦gehöhlt:höhlen¦gehüllt:hüllen¦gehülst:hülsen¦gehüpft:hüpfen¦gehütet:hüten¦geigelt:igeln¦geimkert:imkern¦geimpft:impfen¦geirrt:irren¦gejagt:jagen¦gejammert:jammern¦gejapst:japsen¦gejauchzt:jauchzen¦gejault:jaulen¦gejobbt:jobben¦gejodelt:jodeln¦gejoggt:joggen¦gejohlt:johlen¦gejubelt:jubeln¦gejuchzt:juchzen¦gejätet:jäten¦gekachelt:kacheln¦gekakelt:kakeln¦gekalbt:kalben¦gekalkt:kalken¦gekannt:kennen¦gekantet:kanten¦gekanzelt:kanzeln¦gekapert:kapern¦gekappt:kappen¦gekapselt:kapseln¦gekarrt:karren¦gekartet:karten¦gekaspert:kaspern¦gekauert:kauern¦gekauft:kaufen¦gekaut:kauen¦gekegelt:kegeln¦gekehrt:kehren¦gekeift:keifen¦gekeilt:keilen¦gekeimt:keimen¦gekellert:kellern¦gekellnert:kellnern¦gekeltert:keltern¦gekennzeichnet:kennzeichnen¦gekentert:kentern¦gekerbt:kerben¦gekerkert:kerkern¦gekernt:kernen¦gekesselt:kesseln¦gekettet:ketten¦gekeucht:keuchen¦gekichert:kichern¦gekickt:kicken¦gekiekt:kieken¦gekifft:kiffen¦gekillt:killen¦gekippt:kippen¦gekittet:kitten¦gekitzelt:kitzeln¦geklackert:klackern¦geklafft:klaffen¦geklagt:klagen¦geklammert:klammern¦geklappert:klappern¦geklappt:klappen¦geklart:klaren¦geklatscht:klatschen¦geklaubt:klauben¦geklaut:klauen¦geklebt:kleben¦gekleckert:kleckern¦gekleckst:klecksen¦gekleidet:kleiden¦gekleistert:kleistern¦geklemmt:klemmen¦geklempnert:klempnern¦geklettert:klettern¦geklimpert:klimpern¦geklingelt:klingeln¦geklinkt:klinken¦geklirrt:klirren¦geklommen:klimmen¦geklont:klonen¦geklopft:klopfen¦gekloppt:kloppen¦geklotzt:klotzen¦geklumpt:klumpen¦geklungen:klingen¦gekläfft:kläffen¦geklärt:klären¦geklöhnt:klöhnen¦geklönt:klönen¦geklügelt:klügeln¦geklüngelt:klüngeln¦geknabbert:knabbern¦geknackst:knacksen¦geknackt:knacken¦geknallt:knallen¦geknapst:knapsen¦geknarrt:knarren¦geknarzt:knarzen¦geknattert:knattern¦geknausert:knausern¦geknautscht:knautschen¦geknebelt:knebeln¦geknechtet:knechten¦geknetet:kneten¦geknickst:knicksen¦geknickt:knicken¦gekniet:knien¦gekniffen:kneifen¦geknipst:knipsen¦geknirscht:knirschen¦geknistert:knistern¦geknittert:knittern¦geknobelt:knobeln¦geknotet:knoten¦geknufft:knuffen¦geknurrt:knurren¦geknuspert:knuspern¦geknutscht:knutschen¦geknöpft:knöpfen¦geknüllt:knüllen¦geknüpft:knüpfen¦geknüppelt:knüppeln¦gekocht:kochen¦gekohlt:kohlen¦gekokelt:kokeln¦gekokst:koksen¦gekommen:kommen¦gekonnt:können¦gekontert:kontern¦gekoppelt:koppeln¦gekorkt:korken¦gekostet:kosten¦gekotzt:kotzen¦gekrabbelt:krabbeln¦gekracht:krachen¦gekrallt:krallen¦gekrampft:krampfen¦gekramt:kramen¦gekrankt:kranken¦gekratzt:kratzen¦gekrault:kraulen¦gekraust:krausen¦gekreidet:kreiden¦gekreischt:kreischen¦gekreist:kreisen¦gekrempelt:krempeln¦gekreuzigt:kreuzigen¦gekreuzt:kreuzen¦gekribbelt:kribbeln¦gekriegt:kriegen¦gekringelt:kringeln¦gekriselt:kriseln¦gekritzelt:kritzeln¦gekrochen:kriechen¦gekrächzt:krächzen¦gekräftigt:kräftigen¦gekräht:krähen¦gekränzt:kränzen¦gekräuselt:kräuseln¦gekrönt:krönen¦gekrümelt:krümeln¦gekrümmt:krümmen¦gekuckt:kucken¦gekugelt:kugeln¦gekundschaftet:kundschaften¦gekungelt:kungeln¦gekuppelt:kuppeln¦gekurbelt:kurbeln¦gekurvt:kurven¦gekuschelt:kuscheln¦gekuscht:kuschen¦gekämmt:kämmen¦gekämpft:kämpfen¦gekäut:käuen¦geködert:ködern¦geköpft:köpfen¦gekübelt:kübeln¦gekühlt:kühlen¦gekümmert:kümmern¦gekündigt:kündigen¦gekürt:küren¦gekürzt:kürzen¦geküsst:küssen¦gelabbert:labbern¦gelabert:labern¦gelabt:laben¦gelacht:lachen¦geladen:laden¦gelagert:lagern¦gelahmt:lahmen¦gelallt:lallen¦gelandet:landen¦gelangt:langen¦gelangweilt:langweilen¦gelappt:lappen¦gelassen:lassen¦gelastet:lasten¦gelatscht:latschen¦gelauert:lauern¦gelaufen:laufen¦gelaugt:laugen¦gelauscht:lauschen¦gelaust:lausen¦gelautet:lauten¦gelebt:leben¦geledert:ledern¦geleert:leeren¦gelegen:liegen¦gelegt:legen¦gelehnt:lehnen¦gelehrt:lehren¦geleibt:leiben¦geleiert:leiern¦geleimt:leimen¦geleint:leinen¦geleistet:leisten¦gelenkt:lenken¦gelernt:lernen¦gelesen:lesen¦geleuchtet:leuchten¦geleugnet:leugnen¦gelichtet:lichten¦geliebt:lieben¦geliebäugelt:liebäugeln¦geliefert:liefern¦geliehen:leihen¦geliftet:liften¦gelikt:liken¦gelindert:lindern¦gelispelt:lispeln¦gelistet:listen¦gelitten:leiden¦gelocht:lochen¦gelockert:lockern¦gelockt:locken¦gelodert:lodern¦gelogen:lügen¦geloggt:loggen¦gelohnt:lohnen¦geloschen:löschen¦gelost:losen¦gelotet:loten¦gelotst:lotsen¦gelottert:lottern¦gelugt:lugen¦gelullt:lullen¦gelungert:lungern¦gelupft:lupfen¦gelustwandelt:lustwandeln¦gelutscht:lutschen¦gelächelt:lächeln¦gelähmt:lähmen¦geläppert:läppern¦gelärmt:lärmen¦gelästert:lästern¦geläutet:läuten¦gelöchert:löchern¦gelöffelt:löffeln¦gelöhnt:löhnen¦gelöst:lösen¦gelötet:löten¦gelüftet:lüften¦gelümmelt:lümmeln¦gemacht:machen¦gemagert:magern¦gemahlen:mahlen¦gemahnt:mahnen¦gemalt:malen¦gemampft:mampfen¦gemanagt:managen¦gemangelt:mangeln¦gemartert:martern¦gemasert:masern¦gemauert:mauern¦gemault:maulen¦gemauschelt:mauscheln¦gemausert:mausern¦gemaßt:maßen¦gemeckert:meckern¦gemehrt:mehren¦gemeint:meinen¦gemeistert:meistern¦gemeißelt:meißeln¦gemeldet:melden¦gemelkt:melken¦gemengt:mengen¦gemerkt:merken¦gemerzt:merzen¦gemessen:messen¦gemetzelt:metzeln¦gemeutert:meutern¦gemieden:meiden¦gemieft:miefen¦gemietet:mieten¦gemildert:mildern¦gemimt:mimen¦gemindert:mindern¦gemischt:mischen¦gemisst:missen¦gemistet:misten¦gemittelt:mitteln¦gemixt:mixen¦gemocht:mögen¦gemodelt:modeln¦gemogelt:mogeln¦gemopst:mopsen¦gemordet:morden¦gemorst:morsen¦gemosert:mosern¦gemottet:motten¦gemotzt:motzen¦gemuckst:mucksen¦gemuffelt:muffeln¦gemufft:muffen¦gemundet:munden¦gemunkelt:munkeln¦gemuntert:muntern¦gemurkst:murksen¦gemurmelt:murmeln¦gemurrt:murren¦gemusst:müssen¦gemustert:mustern¦gemutet:muten¦gemutmaßt:mutmaßen¦gemähdrescht:mähdreschen¦gemäht:mähen¦gemäkelt:mäkeln¦gemästet:mästen¦gemäßigt:mäßigen¦gemöbelt:möbeln¦gemörtelt:mörteln¦gemüht:mühen¦gemümmelt:mümmeln¦gemündet:münden¦gemünzt:münzen¦genabelt:nabeln¦genagelt:nageln¦genagt:nagen¦genannt:nennen¦genarrt:narren¦genascht:naschen¦genebelt:nebeln¦geneidet:neiden¦geneigt:neigen¦geneppt:neppen¦genervt:nerven¦genestelt:nesteln¦genickt:nicken¦genieselt:nieseln¦geniest:niesen¦genietet:nieten¦genippt:nippen¦genistet:nisten¦genommen:nehmen¦genordet:norden¦genormt:normen¦genudelt:nudeln¦genullt:nullen¦genuschelt:nuscheln¦genutzt:nutzen¦genächtigt:nächtigen¦genähert:nähern¦genährt:nähren¦genäht:nähen¦genäselt:näseln¦genässelt:nässeln¦genäßt:nässen¦genölt:nölen¦genörgelt:nörgeln¦genötigt:nötigen¦genützt:nützen¦geohrfeigt:ohrfeigen¦geopfert:opfern¦geordert:ordern¦geordnet:ordnen¦georgelt:orgeln¦geortet:orten¦gepaart:paaren¦gepachtet:pachten¦gepackt:packen¦gepaddelt:paddeln¦gepafft:paffen¦gepanscht:panschen¦gepantscht:pantschen¦gepanzert:panzern¦gepappt:pappen¦geparkt:parken¦geparst:parsen¦gepasst:passen¦gepatscht:patschen¦gepatzt:patzen¦gepaukt:pauken¦gepaust:pausen¦gepeilt:peilen¦gepeinigt:peinigen¦gepeitscht:peitschen¦gepellt:pellen¦gependelt:pendeln¦gepennt:pennen¦geperlt:perlen¦gepest:pesen¦gepetzt:petzen¦gepfeffert:pfeffern¦gepfercht:pferchen¦gepfiffen:pfeifen¦gepflanzt:pflanzen¦gepflaumt:pflaumen¦gepflegt:pflegen¦gepflichtet:pflichten¦gepflückt:pflücken¦gepflügt:pflügen¦gepfropft:pfropfen¦gepfuscht:pfuschen¦gepfändet:pfänden¦gepichelt:picheln¦gepickt:picken¦gepiepst:piepsen¦gepiept:piepen¦gepieselt:pieseln¦gepilgert:pilgern¦gepinkelt:pinkeln¦gepinnt:pinnen¦gepinselt:pinseln¦gepirscht:pirschen¦gepisst:pissen¦geplagt:plagen¦geplanscht:planschen¦geplant:planen¦geplappert:plappern¦geplatscht:platschen¦geplatzt:platzen¦geplaudert:plaudern¦geplauscht:plauschen¦geplempert:plempern¦geplottet:plotten¦geplumpst:plumpsen¦geplustert:plustern¦geplätschert:plätschern¦geplättet:plätten¦geplündert:plündern¦gepocht:pochen¦gepokert:pokern¦gepolstert:polstern¦gepolt:polen¦gepoltert:poltern¦gepopelt:popeln¦gepoppt:poppen¦gepostet:posten¦gepowert:powern¦geprahlt:prahlen¦geprallt:prallen¦geprangert:prangern¦geprangt:prangen¦geprasselt:prasseln¦gepredigt:predigen¦geprellt:prellen¦geprescht:preschen¦gepresst:pressen¦gepriesen:preisen¦gepritscht:pritschen¦geprobt:proben¦geprostet:prosten¦geprotzt:protzen¦geprustet:prusten¦geprägt:prägen¦geprüft:prüfen¦geprügelt:prügeln¦gepudert:pudern¦gepufft:puffen¦gepult:pulen¦gepulvert:pulvern¦gepumpt:pumpen¦gepunktet:punkten¦gepupt:pupen¦gepurzelt:purzeln¦gepuscht:puschen¦gepustet:pusten¦geputscht:putschen¦geputtet:putten¦geputzt:putzen¦gepäppelt:päppeln¦gepöbelt:pöbeln¦gepökelt:pökeln¦gequakt:quaken¦gequalmt:qualmen¦gequarzt:quarzen¦gequasselt:quasseln¦gequatscht:quatschen¦gequellt:quellen¦gequengelt:quengeln¦gequetscht:quetschen¦gequieckt:quiecken¦gequietscht:quietschen¦gequirlt:quirlen¦gequält:quälen¦geradelt:radeln¦gerafft:raffen¦geragt:ragen¦gerahmt:rahmen¦gerammelt:rammeln¦gerammt:rammen¦geramscht:ramschen¦gerankt:ranken¦gerannt:rennen¦geranzt:ranzen¦gerappelt:rappeln¦geraschelt:rascheln¦geraspelt:raspeln¦gerasselt:rasseln¦gerast:rasen¦gerastert:rastern¦gerastet:rasten¦gerattert:rattern¦geratzt:ratzen¦geraubt:rauben¦geraucht:rauchen¦gerauft:raufen¦gerauht:rauhen¦geraunt:raunen¦gerauscht:rauschen¦geraut:rauen¦gerechnet:rechnen¦gerechtfertigt:rechtfertigen¦geredet:reden¦geregelt:regeln¦geregnet:regnen¦geregt:regen¦gereichert:reichern¦gereift:reifen¦gereihert:reihern¦gereiht:reihen¦gereimt:reimen¦gereinigt:reinigen¦gereist:reisen¦gereizt:reizen¦gerempelt:rempeln¦gerenkt:renken¦gerettet:retten¦geribbelt:ribbeln¦gerichtet:richten¦gerieben:reiben¦geriegelt:riegeln¦gerieselt:rieseln¦geriffelt:riffeln¦gerillt:rillen¦gerindet:rinden¦geringelt:ringeln¦gerippt:rippen¦gerissen:reißen¦geritten:reiten¦geritzt:ritzen¦gerobbt:robben¦gerochen:riechen¦gerodelt:rodeln¦gerodet:roden¦gerollt:rollen¦gerostet:rosten¦gerottet:rotten¦gerotzt:rotzen¦gerubbelt:rubbeln¦geruckelt:ruckeln¦gerudert:rudern¦gerufen:rufen¦geruht:ruhen¦gerundet:runden¦gerungen:ringen¦gerunzelt:runzeln¦gerupft:rupfen¦gerutscht:rutschen¦gerächt:rächen¦gerädert:rädern¦geräkelt:räkeln¦gerätselt:rätseln¦geräuchert:räuchern¦geräumt:räumen¦geräuspert:räuspern¦geröchelt:röcheln¦geröntgt:röntgen¦geröstet:rösten¦gerötet:röten¦gerückt:rücken¦gerügt:rügen¦gerühmt:rühmen¦gerührt:rühren¦gerülpst:rülpsen¦gerümpft:rümpfen¦gerüstet:rüsten¦gerüttelt:rütteln¦gesabbelt:sabbeln¦gesabbert:sabbern¦gesaftet:saften¦gesagt:sagen¦gesahnt:sahnen¦gesalbt:salben¦gesalzen:salzen¦gesammelt:sammeln¦gesamt:samen¦gesandt:senden¦gesargt:sargen¦gesattelt:satteln¦gesauert:sauern¦gesaugbohnert:saugbohnern¦gesaugt:saugen¦gesaunt:saunen¦gesaust:sausen¦gesaut:sauen¦geschabt:schaben¦geschachert:schachern¦geschachtelt:schachteln¦geschachtet:schachten¦geschadet:schaden¦geschaffen:schaffen¦geschallt:schallen¦geschalt:schalen¦geschaltet:schalten¦geschanzt:schanzen¦gescharrt:scharren¦geschart:scharen¦geschaudert:schaudern¦geschaufelt:schaufeln¦geschaukelt:schaukeln¦geschauspielert:schauspielern¦geschaut:schauen¦gescheffelt:scheffeln¦gescheitert:scheitern¦geschellt:schellen¦geschenkt:schenken¦gescheppert:scheppern¦geschert:scheren¦gescherzt:scherzen¦gescheucht:scheuchen¦gescheuert:scheuern¦gescheut:scheuen¦geschichtet:schichten¦geschickt:schicken¦geschieden:scheiden¦geschiefert:schiefern¦geschielt:schielen¦geschienen:scheinen¦geschifft:schiffen¦geschildert:schildern¦geschillert:schillern¦geschimmelt:schimmeln¦geschimmert:schimmern¦geschimpft:schimpfen¦geschirmt:schirmen¦geschirrt:schirren¦geschissen:scheißen¦geschlabbert:schlabbern¦geschlachtet:schlachten¦geschlafen:schlafen¦geschlafft:schlaffen¦geschlafwandelt:schlafwandeln¦geschlagen:schlagen¦geschlampt:schlampen¦geschlappt:schlappen¦geschlaucht:schlauchen¦geschleckert:schleckern¦geschleift:schleifen¦geschleimt:schleimen¦geschleißt:schleißen¦geschlemmt:schlemmen¦geschlendert:schlendern¦geschlenkert:schlenkern¦geschlenzt:schlenzen¦geschleppt:schleppen¦geschleudert:schleudern¦geschleust:schleusen¦geschlichen:schleichen¦geschlingert:schlingern¦geschlittert:schlittern¦geschlitzt:schlitzen¦geschlossen:schließen¦geschlossert:schlossern¦geschlottert:schlottern¦geschluchzt:schluchzen¦geschluckt:schlucken¦geschludert:schludern¦geschlummert:schlummern¦geschlungen:schlingen¦geschläfert:schläfern¦geschlämmt:schlämmen¦geschlängelt:schlängeln¦geschlüpft:schlüpfen¦geschlürft:schlürfen¦geschlüsselt:schlüsseln¦geschmachtet:schmachten¦geschmatzt:schmatzen¦geschmeckt:schmecken¦geschmeichelt:schmeicheln¦geschmerzt:schmerzen¦geschmettert:schmettern¦geschmiedet:schmieden¦geschmiegt:schmiegen¦geschmiert:schmieren¦geschminkt:schminken¦geschmirgelt:schmirgeln¦geschmissen:schmeißen¦geschmollt:schmollen¦geschmolzen:schmelzen¦geschmort:schmoren¦geschmuddelt:schmuddeln¦geschmuggelt:schmuggeln¦geschmunzelt:schmunzeln¦geschmust:schmusen¦geschmälert:schmälern¦geschmökert:schmökern¦geschmückt:schmücken¦geschnallt:schnallen¦geschnalzt:schnalzen¦geschnappt:schnappen¦geschnarcht:schnarchen¦geschnattert:schnattern¦geschnaubt:schnauben¦geschnauft:schnaufen¦geschnauzt:schnauzen¦geschneidert:schneidern¦geschneit:schneien¦geschnellt:schnellen¦geschneuzt:schneuzen¦geschnieft:schniefen¦geschnippt:schnippen¦geschnipselt:schnipseln¦geschnitten:schneiden¦geschnitzt:schnitzen¦geschnorchelt:schnorcheln¦geschnorrt:schnorren¦geschnuppert:schnuppern¦geschnurrt:schnurren¦geschnäuzt:schnäuzen¦geschnüffelt:schnüffeln¦geschnürt:schnüren¦geschoben:schieben¦geschockt:schocken¦gescholten:schelten¦geschont:schonen¦geschoppt:schoppen¦geschossen:schießen¦geschottert:schottern¦geschrammt:schrammen¦geschraubt:schrauben¦geschreckt:schrecken¦geschreinert:schreinern¦geschrieben:schreiben¦geschrien:schreien¦geschritten:schreiten¦geschrubbt:schrubben¦geschrumpelt:schrumpeln¦geschrumpft:schrumpfen¦geschrägt:schrägen¦geschränkt:schränken¦geschröpft:schröpfen¦geschubst:schubsen¦geschuckelt:schuckeln¦geschuftet:schuften¦geschuldet:schulden¦geschult:schulen¦geschultert:schultern¦geschummelt:schummeln¦geschunden:schinden¦geschunkelt:schunkeln¦geschustert:schustern¦geschwabbelt:schwabbeln¦geschwafelt:schwafeln¦geschwankt:schwanken¦geschwant:schwanen¦geschwappt:schwappen¦geschwatzt:schwatzen¦geschwebt:schweben¦geschwefelt:schwefeln¦geschweift:schweifen¦geschweißt:schweißen¦geschwelgt:schwelgen¦geschwellt:schwellen¦geschwelt:schwelen¦geschwemmt:schwemmen¦geschwenkt:schwenken¦geschwiegen:schweigen¦geschwindelt:schwindeln¦geschwirrt:schwirren¦geschwitzt:schwitzen¦geschwommen:schwimmen¦geschworen:schwären¦geschwunden:schwinden¦geschwungen:schwingen¦geschwäbelt:schwäbeln¦geschwächt:schwächen¦geschwängert:schwängern¦geschwänzt:schwänzen¦geschwärmt:schwärmen¦geschwärzt:schwärzen¦geschädigt:schädigen¦geschält:schälen¦geschändet:schänden¦geschärft:schärfen¦geschätzt:schätzen¦geschäumt:schäumen¦geschöpft:schöpfen¦geschürft:schürfen¦geschürt:schüren¦geschüttelt:schütteln¦geschüttert:schüttern¦geschüttet:schütten¦geschützt:schützen¦gesegelt:segeln¦gesegnet:segnen¦gesehen:sehen¦gesehnt:sehnen¦geseift:seifen¦geseilt:seilen¦gesengt:sengen¦gesenkt:senken¦gesessen:sitzen¦gesetzt:setzen¦geseufzt:seufzen¦gesichert:sichern¦gesichtet:sichten¦gesiebt:sieben¦gesiecht:siechen¦gesiedelt:siedeln¦gesiedet:sieden¦gesiegelt:siegeln¦gesiegt:siegen¦gesiezt:siezen¦geskypt:skypen¦gesoffen:saufen¦gesohlt:sohlen¦gesollt:sollen¦gesondert:sondern¦gesonnen:sinnen¦gesonnt:sonnen¦gesorgt:sorgen¦gespachtelt:spachteln¦gespalten:spalten¦gespannt:spannen¦gespart:sparen¦gespaßt:spaßen¦gespeichert:speichern¦gespeist:speisen¦gespendet:spenden¦gesperrt:sperren¦gespickt:spicken¦gespiegelt:spiegeln¦gespielt:spielen¦gespien:speien¦gespießt:spießen¦gespitzelt:spitzeln¦gespitzt:spitzen¦gesplissen:spleißen¦gesplittert:splittern¦gesponnen:spinnen¦gesponsert:sponsern¦gespornt:spornen¦gespottet:spotten¦gespreizt:spreizen¦gesprengt:sprengen¦gesprenkelt:sprenkeln¦gesprintet:sprinten¦gespritzt:spritzen¦gesprochen:sprechen¦gesprossen:sprießen¦gesprudelt:sprudeln¦gesprungen:springen¦gesprüht:sprühen¦gespuckt:spucken¦gespukt:spuken¦gespult:spulen¦gespurt:spuren¦gespurtet:spurten¦gesputet:sputen¦gespäht:spähen¦gespült:spülen¦gespürt:spüren¦gestachelt:stacheln¦gestaffelt:staffeln¦gestalkt:stalken¦gestammelt:stammeln¦gestammt:stammen¦gestampft:stampfen¦gestanzt:stanzen¦gestapelt:stapeln¦gestapft:stapfen¦gestarrt:starren¦gestartet:starten¦gestaubt:stauben¦gestaucht:stauchen¦gestaunt:staunen¦gestaut:stauen¦gesteckt:stecken¦gesteift:steifen¦gesteigert:steigern¦gesteinigt:steinigen¦gestellt:stellen¦gestemmt:stemmen¦gestempelt:stempeln¦gesteppt:steppen¦gesteuert:steuern¦gestichelt:sticheln¦gestiefelt:stiefeln¦gestiegen:steigen¦gestielt:stielen¦gestiert:stieren¦gestiftet:stiften¦gestillt:stillen¦gestimmt:stimmen¦gestippt:stippen¦gestoben:stieben¦gestochen:stechen¦gestochert:stochern¦gestockt:stocken¦gestohlen:stehlen¦gestolpert:stolpern¦gestopft:stopfen¦gestoppelt:stoppeln¦gestoppt:stoppen¦gestorben:sterben¦gestottert:stottern¦gestoßen:stoßen¦gestraft:strafen¦gestrahlt:strahlen¦gestrampelt:strampeln¦gestrandet:stranden¦gestrauchelt:straucheln¦gestrebt:streben¦gestreckt:strecken¦gestreichelt:streicheln¦gestreift:streifen¦gestreikt:streiken¦gestrengt:strengen¦gestresst:stressen¦gestreunt:streunen¦gestreuselt:streuseln¦gestreut:streuen¦gestrichen:streichen¦gestriegelt:striegeln¦gestrippt:strippen¦gestritten:streiten¦gestrolcht:strolchen¦gestromert:stromern¦gestrotzt:strotzen¦gestrudelt:strudeln¦gestrullt:strullen¦gesträubt:sträuben¦geströmt:strömen¦gestuft:stufen¦gestumpft:stumpfen¦gestundet:stunden¦gestunken:stinken¦gestutzt:stutzen¦gestänkert:stänkern¦gestärkt:stärken¦gestöbert:stöbern¦gestöhnt:stöhnen¦gestöpselt:stöpseln¦gestört:stören¦gestückelt:stückeln¦gestülpt:stülpen¦gestümmelt:stümmeln¦gestümpert:stümpern¦gestürmt:stürmen¦gestürzt:stürzen¦gestützt:stützen¦gesucht:suchen¦gesudelt:sudeln¦gesuhlt:suhlen¦gesumpft:sumpfen¦gesungen:singen¦gesunken:sinken¦gesurrt:surren¦geswingt:swingen¦gesäbelt:säbeln¦gesägt:sägen¦gesäht:sähen¦gesänftigt:sänftigen¦gesät:säen¦gesättigt:sättigen¦gesäubert:säubern¦gesäuert:säuern¦gesäumt:säumen¦gesäuselt:säuseln¦gesöhnt:söhnen¦gesüffelt:süffeln¦gesühnt:sühnen¦gesülzt:sülzen¦gesündigt:sündigen¦gesüßt:süßen¦getadelt:tadeln¦getagt:tagen¦getakelt:takeln¦getan:tun¦getankt:tanken¦getanzt:tanzen¦getapert:tapern¦getappt:tappen¦getapst:tapsen¦getarnt:tarnen¦getastet:tasten¦getatscht:tatschen¦getaucht:tauchen¦getauft:taufen¦getaugt:taugen¦getaumelt:taumeln¦getauscht:tauschen¦getaut:tauen¦geteert:teeren¦geteilt:teilen¦getestet:testen¦getextet:texten¦gethront:thronen¦getigert:tigern¦getilgt:tilgen¦getingelt:tingeln¦getippelt:tippeln¦getippt:tippen¦getischlert:tischlern¦getischt:tischen¦getitscht:titschen¦getoastet:toasten¦getobt:toben¦getollt:tollen¦getopft:topfen¦getoppt:toppen¦getorkelt:torkeln¦getost:tosen¦getrabt:traben¦getrachtet:trachten¦getradet:traden¦getragen:tragen¦getrampelt:trampeln¦getrappt:trappen¦getrapst:trapsen¦getrauert:trauern¦getraumwandelt:traumwandeln¦getraut:trauen¦getrennt:trennen¦getreten:treten¦getrichtert:trichtern¦getrickst:tricksen¦getrieben:treiben¦getrieft:triefen¦getriezt:triezen¦getrillert:trillern¦getrimmt:trimmen¦getrippelt:trippeln¦getrocknet:trocknen¦getroffen:treffen¦getrogen:trügen¦getrollt:trollen¦getrommelt:trommeln¦getropft:tropfen¦getrottet:trotten¦getrotzt:trotzen¦getrudelt:trudeln¦getrumpft:trumpfen¦getrunken:trinken¦geträllert:trällern¦getränt:tränen¦geträufelt:träufeln¦geträuft:träufen¦geträumt:träumen¦getrödelt:trödeln¦getröpfelt:tröpfeln¦getröstet:trösten¦getrübt:trüben¦getummelt:tummeln¦getunkt:tunken¦getupft:tupfen¦geturnt:turnen¦geturtelt:turteln¦getuschelt:tuscheln¦getutet:tuten¦getwittert:twittern¦getäfelt:täfeln¦getändelt:tändeln¦getänzelt:tänzeln¦getätigt:tätigen¦getätschelt:tätscheln¦getäuscht:täuschen¦getönt:tönen¦getöpfert:töpfern¦getörnt:törnen¦getötet:töten¦getüftelt:tüfteln¦getüncht:tünchen¦getürkt:türken¦getürmt:türmen¦getütet:tüten¦geufert:ufern¦geulkt:ulken¦geunkt:unken¦geurteilt:urteilen¦gevierteilt:vierteilen¦geviertelt:vierteln¦gevögelt:vögeln¦gewabbelt:wabbeln¦gewachsen:wachsen¦gewacht:wachen¦gewaffnet:waffnen¦gewagt:wagen¦gewahrt:wahren¦gewallt:wallen¦gewaltet:walten¦gewalzt:walzen¦gewandelt:wandeln¦gewandert:wandern¦gewandt:wenden¦gewankt:wanken¦gewappnet:wappnen¦gewarnt:warnen¦gewartet:warten¦gewaschen:waschen¦gewatet:waten¦gewatschelt:watscheln¦gewebt:weben¦gewechselt:wechseln¦geweckt:wecken¦gewedelt:wedeln¦gewehrt:wehren¦geweht:wehen¦geweicht:weichen¦geweidet:weiden¦geweigert:weigern¦geweihnachtet:weihnachten¦geweiht:weihen¦geweilt:weilen¦geweint:weinen¦geweitet:weiten¦gewelkt:welken¦gewellt:wellen¦gewerkelt:werkeln¦gewerkt:werken¦gewertet:werten¦gewettert:wettern¦gewettet:wetten¦gewetzt:wetzen¦gewichtelt:wichteln¦gewickelt:wickeln¦gewidert:widern¦gewidmet:widmen¦gewiegelt:wiegeln¦gewiehert:wiehern¦gewienert:wienern¦gewiesen:weisen¦gewildert:wildern¦gewilligt:willigen¦gewimmelt:wimmeln¦gewimmert:wimmern¦gewinkelt:winkeln¦gewinkt:winken¦gewinselt:winseln¦gewippt:wippen¦gewirbelt:wirbeln¦gewirkt:wirken¦gewirtet:wirten¦gewirtschaftet:wirtschaften¦gewischt:wischen¦gewispert:wispern¦gewitzelt:witzeln¦gewogen:wiegen¦gewohnt:wohnen¦gewollt:wollen¦geworben:werben¦geworden:werden¦geworfen:werfen¦gewrungen:wringen¦gewuchert:wuchern¦gewuchtet:wuchten¦gewunden:winden¦gewundert:wundern¦gewurmt:wurmen¦gewurstelt:wursteln¦gewurstet:wursten¦gewurzelt:wurzeln¦gewuselt:wuseln¦gewusst:wissen¦gewählt:wählen¦gewähnt:wähnen¦gewälzt:wälzen¦gewärmt:wärmen¦gewässert:wässern¦gewölbt:wölben¦gewühlt:wühlen¦gewünscht:wünschen¦gewürdigt:würdigen¦gewürfelt:würfeln¦gewürgt:würgen¦gewürzt:würzen¦gewütet:wüten¦gezagt:zagen¦gezahlt:zahlen¦gezahnt:zahnen¦gezankt:zanken¦gezapft:zapfen¦gezappelt:zappeln¦gezaubert:zaubern¦gezaudert:zaudern¦gezaust:zausen¦gezecht:zechen¦gezehrt:zehren¦gezeichnet:zeichnen¦gezeigt:zeigen¦gezeltet:zelten¦gezerrt:zerren¦gezettelt:zetteln¦gezeugt:zeugen¦gezielt:zielen¦geziert:zieren¦gezimmert:zimmern¦gezinkt:zinken¦gezirkelt:zirkeln¦gezischt:zischen¦gezittert:zittern¦gezogen:ziehen¦gezollt:zollen¦gezuckt:zucken¦gezupft:zupfen¦gezurrt:zurren¦gezweifelt:zweifeln¦gezweigt:zweigen¦gezwiebelt:zwiebeln¦gezwinkert:zwinkern¦gezwirbelt:zwirbeln¦gezwitschert:zwitschern¦gezwungen:zwingen¦gezwängt:zwängen¦gezählt:zählen¦gezähmt:zähmen¦gezäumt:zäumen¦gezäunt:zäunen¦gezögert:zögern¦gezüchtet:züchten¦gezüchtigt:züchtigen¦gezügelt:zügeln¦gezündelt:zündeln¦gezündet:zünden¦gezüngelt:züngeln¦gezürnt:zürnen¦geächtet:ächten¦geächzt:ächzen¦geäfft:äffen¦geähnelt:ähneln¦geändert:ändern¦geängstigt:ängstigen¦geärgert:ärgern¦geäschert:äschern¦geästet:ästen¦geätzt:ätzen¦geäußert:äußern¦geödet:öden¦geöffnet:öffnen¦geölt:ölen¦geübt:üben¦2gebalgt:abbalgen¦2gebaut:abbauen,umbauen,zubauen¦2gebeizt:abbeizen¦9t:abbestellen,abverlangen,auserwählen,bearbeiten,befeuchten,befruchten,befürchten,beglupschen,begrabschen,beherrschen,beklatschen,bekleckern,beleuchten,beschimpfen,beschmieren,beschränken,bespitzeln,betrachten,beträufeln,bezeichnen,bezweifeln,durchbohren,entfesseln,entkleiden,entkoppeln,entkuppeln,entrauschen,entrichten,entriegeln,enträtseln,entschärfen,entsichern,entwickeln,entwurzeln,entzaubern,erarbeiten,erdrosseln,erschrecken,missachten,missbilden,verballern,verbessern,verblenden,verbrauchen,verbuddeln,verböllern,verdichten,verdonnern,verdrahten,verdunkeln,verdunsten,verdünsten,verfummeln,verfuttern,verfälschen,verfüttern,vergammeln,verhandeln,verhaspeln,verhungern,verkacheln,verkleiden,verkuppeln,verkündigen,verleugnen,verlottern,verpachten,verpflanzen,verpfuschen,verpfänden,verprügeln,verpulvern,verrammeln,verramschen,verrauschen,verrechnen,verrichten,verrutschen,versammeln,verschaffen,verschanzen,verschenken,verscherzen,verschicken,verschiffen,verschneien,verschnüren,verschärfen,verschätzen,versichern,versiegeln,verspotten,verspritzen,verstauchen,versteuern,verstrahlen,vertauschen,vertrödeln,vertrösten,vertändeln,verwandeln,verwickeln,verwinkeln,verwuchern,verwurzeln,verzaubern,vorerzählen,vorverlegen,zerdonnern,zerdröseln,zerlatschen,zermetzeln,zerpflücken,zerrütteln,zerschellen,zersiedeln,zersprengen,zerstampfen,zubereiten,beauftragen,begeistern,beglaubigen,beherbergen,beinhalten,beobachten,bereichern,diplomieren,entfrosten,entkrampfen,entkräften,entmachten,entmündigen,entrümpeln,enttäuschen,erdreisten,erschlaffen,hinterlegen,klabastern,prophezeien,schmarotzen,umklammern,umschwärmen,unterspülen,untersuchen,verabreden,veranlassen,verausgaben,verbeamten,verbilligen,verbittern,verbreiten,verbrüdern,verbummeln,verdoppeln,vereinsamen,vereinzeln,verelenden,verfeinden,vergittern,vergröbern,vergöttern,verknacksen,verkraften,verkrampfen,verkörpern,verlängern,vermasseln,vernichten,verriegeln,verringern,verscharren,verschmähen,versündigen,verteufeln,verunfallen,veruntreuen,verursachen,verwünschen,verzetteln,verzichten,widersetzen,wiederholen,zernichten,überblicken,überbrücken,überdauern,übereignen,überlagern,überlasten,überlisten,überraschen,überreichen,überrunden,überschauen,überspannen,überspielen,überspitzen,überstellen,überstimmen,überstürzen,übersäuern,übertünchen,aufbegehren,ausbezahlen,missglücken,mitbenutzen¦2gebettelt:abbetteln¦2gebunden:abbinden,umbinden,zubinden¦2gebeten:abbitten¦2geblasst:abblassen¦2geblüht:abblühen¦2gebraust:abbrausen¦2gebrochen:abbrechen,umbrechen¦2gebremst:abbremsen,anbremsen¦2gebrannt:abbrennen¦2gebröckelt:abbröckeln¦2gebrüht:abbrühen¦2gebucht:abbuchen,umbuchen¦2gebüßt:abbüßen¦2gedacht:abdachen¦2gedampft:abdampfen¦2gedankt:abdanken¦2gedarbt:abdarben¦2gedeckt:abdecken¦2gedichtet:abdichten,andichten,umdichten¦2gedient:abdienen,andienen,zudienen¦2gedungen:abdingen¦2gedriftet:abdriften¦2gedrosselt:abdrosseln¦2gedruckt:abdrucken¦2gedrückt:abdrücken,zudrücken¦2gedunkelt:abdunkeln¦2geduscht:abduschen¦2geebbt:abebben¦2gegessen:abessen¦2gefallen:abfallen,zufallen¦2gefangen:abfangen¦2gefasst:abfassen,zufassen¦2gefeuert:abfeuern¦2gefilmt:abfilmen¦2gefunden:abfinden¦2geflacht:abflachen¦2geflaut:abflauen¦2geflogen:abfliegen,zufliegen¦2gefluchtet:abfluchten¦2gefordert:abfordern¦2geformt:abformen,umformen¦2gefragt:abfragen,anfragen,umfragen¦2gefälscht:abfälschen¦2gefüllt:abfüllen,umfüllen¦2gefüttert:abfüttern¦4geben:abgeben,zugeben¦3egaunert:abgaunern¦4golten:abgelten¦3eglichen:abgleichen,angleichen¦3eglitten:abgleiten¦3egraben:abgraben,umgraben¦3egrast:abgrasen¦3egriffen:abgreifen,zugreifen¦2gehackt:abhacken¦2gehalten:abhalten,zuhalten¦2gehandelt:abhandeln¦2gehaspelt:abhaspeln¦2gehauen:abhauen,umhauen,zuhauen¦2gehoben:abheben¦2geheilt:abheilen,zuheilen¦2geholfen:abhelfen¦2geholzt:abholzen¦2gehorcht:abhorchen¦2gehärtet:abhärten,anhärten¦2gehäutet:abhäuten¦2gehört:abhören,umhören¦2gekantet:abkanten¦2gekanzelt:abkanzeln¦2gekappt:abkappen¦2gekauft:abkaufen¦2geklappert:abklappern¦2geklatscht:abklatschen¦2geklebt:abkleben,zukleben¦2geklemmt:abklemmen¦2geklungen:abklingen¦2geklärt:abklären¦2geknallt:abknallen,zuknallen¦2geknapst:abknapsen¦2gekniffen:abkneifen¦2geknutscht:abknutschen¦2gekocht:abkochen¦2gekommen:abkommen¦2gekoppelt:abkoppeln¦2gekratzt:abkratzen¦2gekuppelt:abkuppeln¦2gekämpft:abkämpfen,ankämpfen¦2gekühlt:abkühlen¦2gekürzt:abkürzen¦2geküsst:abküssen¦2geladen:abladen,umladen,zuladen¦2gelagert:ablagern,umlagern¦2gelassen:ablassen,dalassen,zulassen¦2gelatscht:ablatschen¦2gelautet:ablauten,anlauten,umlauten¦2gelebt:ableben¦2geledert:abledern¦2gelegt:ablegen,zulegen¦2geleistet:ableisten¦2geleitet:ableiten,umleiten,zuleiten¦2gelichtet:ablichten¦2geliefert:abliefern,anliefern¦2geloschen:ablöschen¦2gemagert:abmagern¦2gemalt:abmalen,anmalen¦2gemildert:abmildern¦2gemurkst:abmurksen¦2gemäht:abmähen¦2gemüht:abmühen¦2genabelt:abnabeln¦2genagt:abnagen,annagen¦2geneigt:abneigen,zuneigen¦2genutzt:abnutzen¦2gepasst:abpassen,anpassen¦2gepellt:abpellen¦2gepfiffen:abpfeifen,anpfeifen¦2geplatzt:abplatzen¦2gepresst:abpressen¦2gequetscht:abquetschen¦2geraten:abraten,anraten,zuraten¦2gerauscht:abrauschen¦2gerechnet:abrechnen,umrechnen,zurechnen¦2geregt:abregen,anregen¦2gerieben:abreiben¦2gereicht:abreichen,zureichen¦2gereist:abreisen¦2geritten:abreiten,umreiten,zureiten¦2gerichtet:abrichten,zurichten¦2geriegelt:abriegeln,zuriegeln¦2geriffelt:abriffeln¦2gerindet:abrinden¦2gerungen:abringen¦2gerufen:abrufen,zurufen¦2gerundet:abrunden¦2gerupft:abrupfen¦2gerutscht:abrutschen¦2geräumt:abräumen,umräumen¦2gerückt:abrücken¦2gerührt:abrühren,umrühren¦2gerüstet:abrüsten,umrüsten,zurüsten¦2gesahnt:absahnen¦2gesoffen:absaufen,ansaufen¦2geschafft:abschaffen,anschaffen¦2geschieden:abscheiden¦2geschert:abscheren¦2gescheuert:abscheuern¦2geschiefert:abschiefern¦2geschunden:abschinden¦2geschirmt:abschirmen¦2geschlafft:abschlaffen¦2geschlagen:abschlagen,anschlagen,zuschlagen¦2geschlossen:abschließen,zuschließen¦2geschmatzt:abschmatzen¦2geschmolzen:abschmelzen¦2geschmettert:abschmettern¦2geschmiert:abschmieren¦2geschminkt:abschminken¦2geschnitten:abschneiden,zuschneiden¦2geschreckt:abschrecken¦2geschritten:abschreiten¦2geschröpft:abschröpfen¦2geschuftet:abschuften¦2geschwatzt:abschwatzen¦2geschwindelt:abschwindeln,anschwindeln¦2geschwirrt:abschwirren¦2geschwächt:abschwächen¦2geschworen:abschwören¦2geschätzt:abschätzen¦2geschöpft:abschöpfen¦2gesandt:absenden,zusenden¦2gesenkt:absenken¦2gesichert:absichern,zusichern¦2gespalten:abspalten¦2gespannt:abspannen,umspannen¦2gespeist:abspeisen¦2gespiegelt:abspiegeln¦2gespielt:abspielen,zuspielen¦2gesplittert:absplittern¦2gesprochen:absprechen,zusprechen¦2gespreizt:abspreizen¦2gespritzt:abspritzen,anspritzen¦2gesprüht:absprühen¦2gestammt:abstammen,anstammen¦2gestanden:abstehen,dastehen¦2gestattet:abstatten¦2gestaubt:abstauben¦2gesteift:absteifen¦2gestellt:abstellen¦2gesteppt:absteppen¦2gestorben:absterben¦2gestillt:abstillen¦2gestimmt:abstimmen,umstimmen,zustimmen¦2gestoppt:abstoppen¦2gestottert:abstottern¦2gestraft:abstrafen¦2gestrahlt:abstrahlen¦2gestrebt:abstreben,anstreben,zustreben¦2gestrichen:abstreichen¦2gestreift:abstreifen¦2gestritten:abstreiten¦2gestumpft:abstumpfen¦2gestützt:abstützen¦2gesucht:absuchen¦2gesäbelt:absäbeln¦2getastet:abtasten,antasten¦2getaucht:abtauchen¦2getaut:abtauen¦2geteilt:abteilen,zuteilen¦2getippt:abtippen,antippen¦2getrennt:abtrennen¦2getrunken:abtrinken,antrinken,zutrinken¦2getrocknet:abtrocknen¦2getropft:abtropfen¦2getrotzt:abtrotzen¦2geträufelt:abträufeln¦2getupft:abtupfen¦2getönt:abtönen,antönen¦2getötet:abtöten¦2geurteilt:aburteilen¦2gewandelt:abwandeln,anwandeln,umwandeln¦2gewartet:abwarten¦2gewechselt:abwechseln¦2gewehrt:abwehren¦2geweidet:abweiden¦2gewiesen:abweisen,zuweisen¦2gewandt:abwenden,umwenden,zuwenden¦2geworben:abwerben,anwerben¦2gewertet:abwerten,umwerten¦2gewickelt:abwickeln¦2gewunden:abwinden¦2gewirtschaftet:abwirtschaften¦2gewischt:abwischen¦2gewohnt:abwohnen¦2gewählt:abwählen,anwählen¦2gewürgt:abwürgen¦2gezahlt:abzahlen¦2gezapft:abzapfen,anzapfen¦2gezappelt:abzappeln¦2gezeichnet:abzeichnen,umzeichnen¦2gezogen:abziehen,zuziehen¦2gezielt:abzielen¦2gezittert:abzittern¦2gezupft:abzupfen¦2gezweigt:abzweigen¦2gezwungen:abzwingen¦2gezwitschert:abzwitschern¦2gezählt:abzählen¦2gezäunt:abzäunen¦2geändert:abändern,umändern¦2geästet:abästen¦2gebahnt:anbahnen¦2gebandelt:anbandeln¦2gebiedert:anbiedern¦2geboten:anbieten¦2geblafft:anblaffen¦2geblickt:anblicken¦2gebraten:anbraten¦2gebrüllt:anbrüllen¦2gedauert:andauern¦2gedroht:androhen¦2geeignet:aneignen,zueignen¦2geekelt:anekeln¦5ogen:anerziehen,entfliegen,umerziehen,verfliegen,überwiegen,überziehen¦2gefacht:anfachen¦2gefaucht:anfauchen¦2gefault:anfaulen¦2gefochten:anfechten¦2gefeindet:anfeinden¦2gefeuchtet:anfeuchten¦2gefixt:anfixen¦2gefleht:anflehen¦2gefreundet:anfreunden¦2gefunkelt:anfunkeln¦3egafft:angaffen¦3egiftet:angiften¦3eglotzt:anglotzen¦2gehaftet:anhaften¦2geheimelt:anheimeln¦8geben:anheimgeben,weitergeben,wiedergeben,zurückgeben¦2geheuert:anheuern¦2gehimmelt:anhimmeln¦2geklagt:anklagen¦2geknackst:anknacksen¦2gekohlt:ankohlen¦2gekrallt:ankrallen¦2gekreidet:ankreiden¦2gekurbelt:ankurbeln¦2geködert:anködern¦2gekündigt:ankündigen¦2gelastet:anlasten¦2geleimt:anleimen¦2geleint:anleinen¦2gelächelt:anlächeln,zulächeln¦2gemaßt:anmaßen¦2gemerkt:anmerken¦2gemutet:anmuten,zumuten¦2genietet:annieten¦2genähert:annähern¦2gepaddelt:anpaddeln¦2gepeilt:anpeilen¦2gepflaumt:anpflaumen¦2gepirscht:anpirschen¦2geprangert:anprangern¦2gepreßt:anpressen¦2gepöbelt:anpöbeln¦2geranzt:anranzen¦2gereichert:anreichern¦2gereizt:anreizen¦2gerempelt:anrempeln¦2gesamt:ansamen¦2geschienen:anscheinen¦2geschissen:anscheißen¦2geschmiegt:anschmiegen¦2geschnauzt:anschnauzen¦2geschrien:anschreien¦2geschwiegen:anschweigen¦2geschwemmt:anschwemmen¦2geschwommen:anschwimmen¦2gesiedelt:ansiedeln¦2gesohlt:ansohlen¦2gespitzt:anspitzen,zuspitzen¦2gespornt:anspornen¦2gestachelt:anstacheln¦2gestarrt:anstarren¦2gestaut:anstauen¦2gestunken:anstinken¦2gestrengt:anstrengen¦2gesäuselt:ansäuseln¦2getrabt:antraben¦2getraut:antrauen,zutrauen¦2getörnt:antörnen¦2geweht:anwehen,zuwehen¦2gewidert:anwidern¦2gewinkelt:anwinkeln¦2gewärmt:anwärmen¦2gezettelt:anzetteln¦2gezweifelt:anzweifeln¦2gezündet:anzünden¦2geödet:anöden¦3geatmet:aufatmen,ausatmen,einatmen¦3gebahrt:aufbahren¦3gebaut:aufbauen,ausbauen,vorbauen¦3gebauscht:aufbauschen¦10t:aufbereiten,beschichten,beschildern,besprenkeln,durchbrausen,einbestellen,entblättern,entflattern,entflutschen,entfrachten,entklammern,entschleimen,entschlüpfen,entschulden,entschwirren,entspiegeln,entstacheln,herbeordern,herbestellen,hinbestellen,missbilligen,missbrauchen,misshandeln,mitbestimmen,nacherzählen,verarbeiten,verdribbeln,verheiraten,verklammern,verklüngeln,verknittern,verplappern,verplaudern,verplempern,verquatschen,verschalten,verscheuchen,verscheuern,verschlampen,verschleimen,verschleppen,verschlucken,verschmerzen,verschnaufen,verschrammen,verschrauben,verschrecken,verschränken,verschulden,verschwatzen,verschweißen,verschwitzen,verschütten,verstümmeln,vertrocknen,verwechseln,verzeichnen,verzweifeln,vorbereiten,vorbestellen,zerbröckeln,zerflattern,zergliedern,zerhäckseln,zerknirschen,zerknittern,zerkräuseln,zerquetschen,zerscheuern,zerstümmeln,zertrampeln,beanstanden,beeindrucken,begutachten,bemitleiden,beschriften,bevormunden,durchbluten,durchschauen,durchströmen,entjungfern,erleichtern,erschüttern,unterdrücken,untermauern,unterstützen,verabreichen,verabscheuen,verbreitern,vereinfachen,verfrachten,verharmlosen,verklauseln,verknorpeln,verkrüppeln,verlangsamen,verräuchern,verschlammen,verschmieren,verschnupfen,verschönern,verständigen,verstänkern,verwursteln,widerstreben,zerfleischen,überflügeln,überfordern,überfüttern,überliefern,übernachten,überschätzen,überstrahlen,übersättigen,übertrumpfen,übertölpeln,überwintern,überwuchern,überzüchten,verunglücken¦3gebessert:aufbessern,ausbessern¦3geboten:aufbieten,ausbieten,darbieten¦3gebunden:aufbinden,losbinden,vorbinden¦3gebläht:aufblähen¦3geblüht:aufblühen¦3gebraten:aufbraten,ausbraten¦3gebraucht:aufbrauchen¦3gebraust:aufbrausen,losbrausen¦3gebrochen:aufbrechen¦3gebrannt:aufbrennen,ausbrennen,wegbrennen¦3gebrüht:aufbrühen¦3gebäumt:aufbäumen¦3gebürdet:aufbürden¦3gedampft:aufdampfen,eindampfen¦3gedeckt:aufdecken¦3gedonnert:aufdonnern,losdonnern¦3gedröselt:aufdröseln¦3gedrückt:aufdrücken,ausdrücken,eindrücken,wegdrücken¦8t:auferlegen,befristen,befummeln,befördern,begründen,behandeln,beklecksen,bekleiden,belauschen,belichten,beliefern,belächeln,bepflanzen,bepieseln,bepinseln,berechnen,berichten,besabbern,beschaden,beschaffen,beschallen,beschenken,beschirmen,beschützen,besiedeln,bespritzen,besteuern,bestrahlen,bewuchern,bewässern,bezaubern,entfalten,entflaggen,entflammen,entgiften,enthäuten,entlasten,entlüften,entmisten,entpudern,entrosten,entrüsten,entsaften,entspannen,entstammen,entstauben,entstellen,entströmen,entwerten,entzünden,erfordern,erforschen,ergründen,errechnen,errichten,erschöpfen,erstrecken,misstrauen,umbesetzen,verachten,veraltern,verankern,verbluten,verbremsen,verdampfen,verdrängen,verdrücken,verduften,verfeuern,verfluchen,verfransen,vergiften,vergraulen,verhaften,verhärten,verjubeln,verkanten,verketten,verklemmen,verkloppen,verknallen,verkneten,verknoten,verknüpfen,verkokeln,verkosten,verkratzen,verlagern,verlauten,verleiten,vermampfen,vermelden,vermieten,vermischen,vernageln,vernaschen,vernebeln,vernieten,verordnen,verpflegen,verpokern,verprellen,verquirlen,verregnen,verrosten,versauern,versiechen,verspannen,verspeisen,versperren,verspielen,versprühen,verstauben,verstecken,versteifen,verstellen,verstimmen,verstopfen,verstreuen,versumpfen,versäbeln,vertrimmen,vertäfeln,verwalten,verwerten,verwischen,verzweigen,verzögern,verändern,verärgern,zerdampfen,zerdrücken,zerfasern,zerfransen,zerknallen,zerknüllen,zerkratzen,zerpflügen,zerplatzen,zerpressen,zerstreuen,zertrennen,beantragen,bebildern,befehligen,beflügeln,begleiten,belemmern,belämmern,bemuttern,bemängeln,bemänteln,beseitigen,besiegeln,betatschen,bevorzugen,bevölkern,bewilligen,durcheilen,durchleben,enteignen,entfetten,entgleisen,enthärten,entsteinen,entwischen,erbetteln,erblinden,erfrischen,ergaunern,erheitern,erkundigen,erläutern,erschallen,erweitern,gefährden,gemeinden,genehmigen,gewichten,gewittern,offenbaren,retweeten,tätowieren,umschiffen,umzingeln,untersagen,veranlagen,verarschen,verarzten,verblassen,verblöden,verblüffen,verbünden,verdrecken,vereitern,verflachen,verfranzen,vergeuden,verhökern,verkabeln,verkitten,verknappen,verkorksen,verkrümmen,verkünden,vermurksen,vermöbeln,verpesten,verplomben,verprassen,versanden,verschalen,versklaven,verstromen,verstummen,verteuern,verträumen,vertuschen,verwetten,verwüsten,veräppeln,verästeln,vollenden,vollführen,widerlegen,zerrütten,zigeunern,überdachen,überdehnen,überführen,überhäufen,überlappen,überprüfen,überreden,überreizen,überrollen,überzahlen,abbezahlen,anbelangen,hingehören¦7anden:auferstehen,unterstehen,widerstehen,eingestehen¦3gegessen:aufessen,ausessen,mitessen,wegessen¦3gefangen:auffangen,wegfangen¦3gefasst:auffassen¦3gefunden:auffinden,vorfinden¦3geflammt:aufflammen¦3geflogen:auffliegen,ausfliegen,herfliegen,mitfliegen,wegfliegen¦3gefordert:auffordern¦3gefrischt:auffrischen¦3gefüllt:auffüllen,ausfüllen¦4egabelt:aufgabeln¦5geilt:aufgeilen¦4egleist:aufgleisen,eingleisen¦4egliedert:aufgliedern,ausgliedern¦4eglommen:aufglimmen,ausglimmen¦4eglüht:aufglühen,ausglühen¦4egriffen:aufgreifen,ausgreifen,vorgreifen¦3gehalst:aufhalsen¦3gehalten:aufhalten,herhalten,maßhalten,vorhalten,weghalten¦3gehauen:aufhauen¦3gehoben:aufheben,wegheben¦3geheitert:aufheitern¦3gehellt:aufhellen¦3gehorcht:aufhorchen,aushorchen,hinhorchen¦3gehärtet:aufhärten,aushärten¦3gehört:aufhören,herhören,mithören¦3gekauft:aufkaufen,loskaufen¦3geklart:aufklaren¦3geklebt:aufkleben,auskleben¦3geklärt:aufklären¦3geknotet:aufknoten,einknoten¦3geknüpft:aufknüpfen¦3gekocht:aufkochen,auskochen,einkochen,garkochen¦3gekommen:aufkommen¦3gekratzt:aufkratzen,auskratzen,wegkratzen¦3gekündigt:aufkündigen¦3geladen:aufladen,ausladen,beiladen,einladen,vorladen¦3gelegen:aufliegen,beiliegen¦3gelassen:auflassen,mitlassen,weglassen¦3gelastet:auflasten,auslasten¦3gelauert:auflauern¦3gelebt:aufleben,ausleben,vorleben¦3geleimt:aufleimen¦3gelichtet:auflichten,auslichten¦3geliefert:aufliefern,ausliefern,einliefern¦3gelistet:auflisten¦3gelockert:auflockern¦3gelodert:auflodern¦3gemerkt:aufmerken,vormerken¦3gemuntert:aufmuntern¦3gemöbelt:aufmöbeln¦3geopfert:aufopfern¦3gepasst:aufpassen,einpassen¦3gepflanzt:aufpflanzen,auspflanzen¦3geplatzt:aufplatzen,losplatzen¦3geplustert:aufplustern¦3gepoppt:aufpoppen¦3geputscht:aufputschen¦3geragt:aufragen¦3gerappelt:aufrappeln¦3geraucht:aufrauchen,ausrauchen¦3geraut:aufrauen¦3gerechnet:aufrechnen,ausrechnen,mitrechnen,vorrechnen¦15n:aufrechterhalte¦3geregt:aufregen¦3gerieben:aufreiben,ausreiben¦3geritten:aufreiten,ausreiten¦3gereizt:aufreizen,ausreizen¦3geribbelt:aufribbeln¦3gerichtet:aufrichten,ausrichten,herrichten¦3gerufen:aufrufen,ausrufen,herrufen,wegrufen¦3gerundet:aufrunden¦3geräumt:aufräumen,ausräumen,wegräumen¦3gerührt:aufrühren,herrühren¦3gerüstet:aufrüsten,ausrüsten,einrüsten¦3gerüttelt:aufrütteln¦3gesammelt:aufsammeln¦3geschaukelt:aufschaukeln¦3geschienen:aufscheinen¦3gescheucht:aufscheuchen¦3gescheuert:aufscheuern¦3geschichtet:aufschichten¦3geschunden:aufschinden¦3geschlagen:aufschlagen,totschlagen,vorschlagen¦3geschlossen:aufschließen,ausschließen,wegschließen¦3geschlitzt:aufschlitzen¦3geschluchzt:aufschluchzen¦3geschlüsselt:aufschlüsseln¦3geschnitten:aufschneiden,ausschneiden,mitschneiden,vorschneiden,wegschneiden¦3geschreckt:aufschrecken¦3geschrien:aufschreien¦3geschwatzt:aufschwatzen¦3geschwemmt:aufschwemmen,ausschwemmen¦3geseufzt:aufseufzen¦3gespalten:aufspalten¦3gespielt:aufspielen,mitspielen,vorspielen,wegspielen¦3gespießt:aufspießen¦3gesponnen:aufspinnen¦3gespritzt:aufspritzen,einspritzen¦3gespürt:aufspüren¦3gestachelt:aufstacheln¦3gestampft:aufstampfen,einstampfen¦3gestaut:aufstauen¦3gestockt:aufstocken¦3gestrebt:aufstreben,hinstreben¦3gestrichen:aufstreichen,ausstreichen,wegstreichen¦3gestöbert:aufstöbern¦3gestützt:aufstützen¦3gesucht:aufsuchen¦3getankt:auftanken¦3getaut:auftauen¦3geteilt:aufteilen,austeilen,einteilen,mitteilen¦3getischt:auftischen¦3getroffen:auftreffen¦3getrennt:auftrennen,lostrennen¦3getrumpft:auftrumpfen¦3getürmt:auftürmen¦3gewacht:aufwachen¦3gewachsen:aufwachsen,auswachsen¦3gewartet:aufwarten¦3geweckt:aufwecken¦3gewiesen:aufweisen,ausweisen,vorweisen¦3gewandt:aufwenden,wegwenden¦3gewertet:aufwerten,auswerten¦3gewiegelt:aufwiegeln¦3gewirbelt:aufwirbeln¦3gewischt:aufwischen,auswischen,wegwischen¦3gewärmt:aufwärmen,auswärmen,vorwärmen¦3gewühlt:aufwühlen¦3gezehrt:aufzehren¦3gezeichnet:aufzeichnen,auszeichnen,vorzeichnen¦3gezwungen:aufzwingen¦3gezwirbelt:aufzwirbeln¦3gezählt:aufzählen,auszählen,herzählen,mitzählen,vorzählen¦3geartet:ausarten¦3gebadet:ausbaden¦3gebaucht:ausbauchen¦3gebeult:ausbeulen¦3gebeutet:ausbeuten¦3gebeten:ausbitten,herbitten¦3geblichen:ausbleichen,vorbleichen¦3geblutet:ausbluten¦3gebohrt:ausbohren,vorbohren¦3gebombt:ausbomben¦3gebreitet:ausbreiten¦3gebremst:ausbremsen¦3gebucht:ausbuchen¦3gebuddelt:ausbuddeln,einbuddeln¦3gebüxt:ausbüxen¦3gedauert:ausdauern¦3gedehnt:ausdehnen¦3gedeutet:ausdeuten¦3gedient:ausdienen¦3gedroschen:ausdreschen¦3gedruckt:ausdrucken¦3gedunstet:ausdunsten¦3gedörrt:ausdörren¦3gefallen:ausfallen,herfallen,vorfallen,wegfallen¦3gefasert:ausfasern¦3gefochten:ausfechten¦3geflaggt:ausflaggen¦3geflossen:ausfließen,wegfließen¦3geflockt:ausflocken¦3gefolgt:ausfolgen,beifolgen¦3geforscht:ausforschen¦3gefragt:ausfragen¦3gefranst:ausfransen¦3gefugt:ausfugen¦3gefällt:ausfällen¦3gefüttert:ausfüttern¦5geizt:ausgeizen¦4eglichen:ausgleichen¦4eglitten:ausgleiten¦4egraben:ausgraben,eingraben¦3gehandelt:aushandeln¦3geheilt:ausheilen¦3geholfen:aushelfen,einhelfen,mithelfen¦3geholzt:ausholzen¦3gehungert:aushungern¦3gehustet:aushusten¦3gehöhlt:aushöhlen¦3gehülst:aushülsen¦3gekegelt:auskegeln¦3gekeilt:auskeilen¦3gekeltert:auskeltern¦3gekannt:auskennen¦3gekernt:auskernen¦3geklammert:ausklammern¦3geklungen:ausklingen¦3gekleidet:auskleiden¦3geklügelt:ausklügeln¦3gekniffen:auskneifen¦3geknobelt:ausknobeln¦3gekostet:auskosten¦3gekugelt:auskugeln¦3gekundschaftet:auskundschaften¦3gekuppelt:auskuppeln¦3gekämpft:auskämpfen,mitkämpfen¦3gekühlt:auskühlen¦3gelagert:auslagern¦3gelangt:auslangen,herlangen¦3gelatscht:auslatschen¦3gelaugt:auslaugen¦3gelautet:auslauten¦3geleert:ausleeren¦3gelegt:auslegen,darlegen,herlegen,weglegen¦3gelitten:ausleiden,mitleiden¦3geleiert:ausleiern,herleiern¦3geliehen:ausleihen,herleihen¦3gelost:auslosen¦3gelotet:ausloten¦3gelöffelt:auslöffeln¦3geloschen:auslöschen¦3gelüftet:auslüften¦3gemahlen:ausmahlen¦3gemalt:ausmalen¦3gemelkt:ausmelken¦3gemerzt:ausmerzen¦3gemistet:ausmisten¦3genutzt:ausnutzen¦3gepackt:auspacken¦3gepfiffen:auspfeifen¦3geplappert:ausplappern¦3geplaudert:ausplaudern¦3geplündert:ausplündern¦3gepowert:auspowern¦3gepresst:auspressen¦3gepustet:auspusten¦3gequatscht:ausquatschen¦3gequetscht:ausquetschen¦3geraubt:ausrauben¦3geredet:ausreden,mitreden,vorreden¦3geregnet:ausregnen,einregnen¦3gereift:ausreifen¦3gereist:ausreisen¦3gerenkt:ausrenken,einrenken¦3gerottet:ausrotten¦3geruht:ausruhen¦3gerupft:ausrupfen¦3gerutscht:ausrutschen¦3geräuchert:ausräuchern,einräuchern¦3gesalzen:aussalzen,einsalzen¦3gesoffen:aussaufen,mitsaufen,wegsaufen¦3geschachtelt:ausschachteln,einschachteln¦3geschalt:ausschalen¦3gescholten:ausschelten¦3gescharrt:ausscharren¦3geschieden:ausscheiden¦3geschenkt:ausschenken,einschenken,wegschenken¦3geschert:ausscheren,einscheren,wegscheren¦3geschifft:ausschiffen¦3geschildert:ausschildern¦3geschimpft:ausschimpfen¦3geschlafen:ausschlafen,einschlafen¦3geschleimt:ausschleimen,einschleimen¦3geschlüpft:ausschlüpfen¦3geschlürft:ausschlürfen¦3geschmolzen:ausschmelzen,wegschmelzen¦3geschmiert:ausschmieren¦3geschnaubt:ausschnauben¦3geschnauft:ausschnaufen¦3geschneuzt:ausschneuzen¦3geschnäuzt:ausschnäuzen¦3geschwefelt:ausschwefeln,einschwefeln¦3geschwiegen:ausschweigen,totschweigen¦3geschwitzt:ausschwitzen¦3geschwärmt:ausschwärmen,vorschwärmen¦3geschöpft:ausschöpfen¦3gesandt:aussenden,einsenden¦3gesiebt:aussieben¦3gesiedelt:aussiedeln¦3gespannt:ausspannen,vorspannen¦3gesprüht:aussprühen¦3gespuckt:ausspucken¦3gespäht:ausspähen¦3gestanzt:ausstanzen¦3gestattet:ausstatten¦3gesteift:aussteifen¦3gestorben:aussterben,hinsterben,wegsterben¦3gestopft:ausstopfen¦3gestrahlt:ausstrahlen¦3gestreut:ausstreuen,einstreuen¦3gesöhnt:aussöhnen¦3getauscht:austauschen,eintauschen¦3getilgt:austilgen¦3getobt:austoben¦3getrickst:austricksen¦3getrunken:austrinken,mittrinken¦3getrocknet:austrocknen¦3geträumt:austräumen¦3getupft:austupfen¦3getüftelt:austüfteln¦3geufert:ausufern¦3gewechselt:auswechseln,einwechseln¦3geweidet:ausweiden¦3geweint:ausweinen¦3geweitet:ausweiten¦3gewickelt:auswickeln,einwickeln¦3gewunden:auswinden¦3gewrungen:auswringen¦3gewuchtet:auswuchten¦3gewählt:auswählen,vorwählen¦3gezahlt:auszahlen¦3gezahnt:auszahnen¦3gezankt:auszanken¦3geziert:auszieren¦3gezupft:auszupfen¦3geübt:ausüben,einüben¦7t:beachten,bedauern,bedeuten,bedrucken,bedrängen,bedrücken,befeuern,beflaggen,beglotzen,begrenzen,behaften,bejubeln,bekakeln,beklemmen,bekriegen,bekämpfen,belagern,belasten,belauern,belüften,benebeln,benötigen,beordern,bereiten,berüsten,beschauen,bescheren,bespannen,bespielen,besprühen,bespucken,bestellen,bestimmen,bestrafen,bestreuen,bestürzen,beswingen,bewenden,bewerten,entarten,entdecken,entfilzen,entfärben,entführen,entholzen,enthüllen,entleeren,entpacken,entpellen,entrücken,enttarnen,entwarnen,entzerren,erachten,erbeuten,erblicken,erdulden,erhärten,erkämpfen,ermorden,erpressen,erreichen,erspielen,erstarren,erstellen,erstreben,ertasten,erträumen,erwarten,erwischen,verbannen,verbohren,verbuchen,verbürgen,verdanken,verdecken,verdienen,verdünnen,verenden,verfassen,verfehlen,verfilmen,verfolgen,verformen,verfärben,verführen,vergeigen,verglasen,verglühen,verhallen,verharren,verhängen,verhüllen,verhüten,verkehren,verklagen,verkürzen,verlangen,verleimen,verlieben,verlocken,verlöten,vermachen,vermehren,vermengen,vermerken,vermuten,vernarren,verneigen,verpacken,verpassen,verpatzen,verpetzen,verplanen,verpuffen,verputzen,verreisen,verrenken,verrücken,verrühren,versenken,versetzen,versohlen,verspüren,verstauen,versuchen,versäumen,versühnen,vertilgen,vertippen,verwarnen,verwehren,verwählen,verzapfen,verzehren,verzerren,verzinken,verzählen,zerdellen,zerhacken,zerkochen,zerpicken,zerreden,zerrupfen,zersetzen,zerwühlen,zerzausen,zerzupfen,beduseln,beerdigen,beflecken,begütern,beneiden,besaiten,beschuhen,bestuhlen,besudeln,beteuern,bewirten,bezwecken,entbehren,entblößen,entfachen,entfernen,enthaaren,enthemmen,entkernen,entkorken,entlausen,entwirren,erblassen,erdolchen,ereifern,ereignen,erhaschen,erkalten,erkälten,erneuern,erstarken,erwidern,gebärden,gehorchen,geleiten,gelüsten,gereichen,gesunden,kredenzen,liebkosen,pediküren,promoten,prämieren,recyceln,recyclen,stibitzen,umranden,umspielen,veralten,verbrühen,verdammen,verdingen,verdummen,veredeln,vereiden,verewigen,verfaulen,verfrühen,vergilben,vergrämen,vergönnen,vergüten,verheeren,verheilen,verhunzen,verjüngen,verkappen,verkeilen,verkohlen,verletzen,vermiesen,vermummen,vermählen,verneinen,verpennen,versehren,versieben,verwaisen,verweilen,verwelken,verwirren,verwohnen,verzahnen,verzinsen,verzollen,verübeln,zerbomben,zerfetzen,zermürben,überholen,überhören,überlegen,überragen,übertönen,angehören,beglücken,vergucken,zugehören¦5t:bebauen,beehren,beeilen,beerben,beirren,belegen,bemalen,beruhen,besagen,erahnen,erbauen,erbeben,erholen,erhören,erleben,erlegen,erlösen,verüben,behagen,bejahen,bereuen,besamen,beäugen,empören,ereilen,erregen,relaxen,rumoren,beleben,gehören¦3acht:bedenken,erdenken¦6t:bedanken,bedecken,bedienen,bedrohen,beenden,befassen,befolgen,befragen,begaffen,begrüßen,beharren,behausen,beheizen,behängen,behüten,bekehren,beklagen,beklauen,bekleben,beknien,bekochen,bekürzen,belehren,bemerken,bepacken,berauben,bereden,bereifen,berühren,besetzen,besuchen,betanken,betrauen,betrüben,betupfen,bewachen,beweinen,bewirken,bewohnen,entehren,enteilen,enteisen,enterben,entfugen,entsagen,erbeten,erfassen,erfolgen,erfreuen,erhallen,erhellen,erhoffen,erhängen,erlahmen,erlangen,ermahnen,erproben,ersehnen,ersetzen,ersparen,ersuchen,erwecken,erwirken,erwählen,erwärmen,erwürgen,erzielen,erzählen,verbüßen,verehren,vereinen,vererben,verfugen,verfügen,vergasen,verhexen,verhören,verirren,verjagen,verlegen,vermimen,vernähen,versagen,versauen,vertagen,verulken,verwehen,zerkauen,zerlegen,zernagen,zersägen,beatmen,becircen,befreien,begrünen,belieben,benoten,benützen,berappen,besohlen,betreuen,bewölken,bezirzen,ergänzen,erpichen,erröten,erspähen,ertappen,erwähnen,erzürnen,gebühren,geziemen,kreieren,pürieren,tuckern,umfassen,umgarnen,umhüllen,umrahmen,umzäunen,verdauen,verebben,verengen,verminen,verpönen,versüßen,verwesen,verzagen,veröden,begucken,belangen,benutzen,bereisen,bezahlen,begehren,vereisen¦3unden:befinden,erfinden¦3angen:begehen¦3ossen:begießen,ergießen,genießen¦4ichen:begleichen,entweichen,erbleichen¦4iffen:begreifen,ergreifen¦3olfen:behelfen¦3gemengt:beimengen,einmengen¦3gemischt:beimischen,einmischen,mitmischen¦3gepflichtet:beipflichten¦3gestimmt:beistimmen¦3gewohnt:beiwohnen¦3iehen:beleihen,gedeihen¦3ogen:belügen,erwägen,erziehen,beziehen¦6gestanden:bereitstehen,strammstehen,zurückstehen¦6gestellt:bereitstellen,zurückstellen¦3offen:besaufen¦5ienen:bescheinen,erscheinen¦6ichen:beschleichen,erschleichen¦6ossen:beschließen,zerschießen,verschießen¦11t:beschmunzeln,beschnuppern,beschnüffeln,eingemeinden,erschwindeln,herbegleiten,hinbegleiten,nachbereiten,nachbestellen,verhätscheln,verpflichten,verschachern,verschimmeln,vorbehandeln,zerknautschen,zersplittern,durchlöchern,durchstreifen,durchstöbern,scharmützeln,unterbreiten,unterkellern,unterrichten,unterschätzen,untertunneln,unterwandern,veranschlagen,verdreifachen,vergewissern,verkleistern,verschandeln,verschaukeln,verscherbeln,verschleiern,verschrotten,verschwenden,verschwägern,verspachteln,verunglimpfen,verunsichern,vervielfachen,überarbeiten,überbewerten,überfrachten,überschwemmen,wiederbeleben¦6ieben:beschreiben,übertreiben¦6ien:beschreien¦6itten:beschreiten,zerstreiten,beschneiden¦3ungen:besingen,erringen,gelingen¦3essen:besitzen¦5ochen:besprechen,verbrechen,verkriechen,zerbrechen,zerstechen¦4ochen:bestechen,erbrechen¦4ohlen:bestehlen¦4iegen:besteigen¦5itten:bestreiten,entgleiten¦4ieben:betreiben¦4unken:betrinken,entsinken,erstinken,ertrinken,versinken¦4ogen:betrügen,entziehen,umfliegen,verbiegen,verziehen,zerbiegen¦3iesen:beweisen¦3orfen:bewerfen¦13t:bewirtschaften,erwirtschaften,nachversichern,untervermieten,weiterverfolgen,zurückerwarten,zurückverfolgen,zurückverlangen,zurückversetzen,beglückwünschen,beweihräuchern,instandbesetzen,rückversichern,verschlechtern,vervollkommnen,überversichern,zusammengehören¦5geflogen:blindfliegen,emporfliegen,herumfliegen¦4gelegt:bloßlegen,nachlegen,nahelegen,querlegen¦4gelegen:bloßliegen,festliegen,naheliegen,überliegen¦4gestellt:bloßstellen,feststellen,freistellen,kaltstellen¦5geschlagen:breitschlagen,unterschlagen¦5 geschwommen:brustschwimmen¦5gehalten:dafürhalten,knapphalten,standhalten¦5gestanden:dafürstehen¦5geredet:daherreden¦8geklemmt:dahinterklemmen¦8gestanden:dahinterstehen¦2gelegen:daliegen¦3gereicht:darreichen,herreichen¦8gehoben:darunterheben¦7gelegt:darüberlegen,hierherlegen¦5gestohlen:davonstehlen¦6 geschwommen:delfinschwimmen¦7 geschwommen:delphinschwimmen¦5gezahlt:draufzahlen¦5geatmet:durchatmen¦5gebettelt:durchbetteln¦5geboxt:durchboxen¦5gebraten:durchbraten¦7ochen:durchbrechen,unterbrechen¦5gebrannt:durchbrennen¦7ungen:durchdringen,verschlingen¦5gefochten:durchfechten¦5gefunden:durchfinden¦7ogen:durchfliegen,hinterziehen¦7ossen:durchfließen,entschließen¦5geflutscht:durchflutschen¦5geformt:durchformen¦5gefuttert:durchfuttern¦5gefüttert:durchfüttern¦6egliedert:durchgliedern¦6eglüht:durchglühen¦6egriffen:durchgreifen¦5gehauen:durchhauen¦5gehechelt:durchhecheln¦5geheizt:durchheizen¦5gehungert:durchhungern¦5gehört:durchhören¦5gekaut:durchkauen¦5gekniffen:durchkneifen¦5geknetet:durchkneten¦5gekostet:durchkosten¦5gekämpft:durchkämpfen¦5gelangt:durchlangen¦5gelüftet:durchlüften¦5gelogen:durchlügen¦5genagt:durchnagen¦5gepaust:durchpausen¦5geplumpst:durchplumpsen¦5gepreßt:durchpressen¦5geprobt:durchproben¦5geprügelt:durchprügeln¦5gerast:durchrasen¦5gerasselt:durchrasseln¦5gerauscht:durchrauschen¦5geregnet:durchregnen,herabregnen¦5gerieben:durchreiben¦5geritten:durchreiten¦5gerieselt:durchrieseln¦5gerungen:durchringen¦5gerostet:durchrosten¦5gerutscht:durchrutschen¦5gerührt:durchrühren¦5gesoffen:durchsaufen¦5geschallt:durchschallen¦5geschienen:durchscheinen,widerscheinen¦5gescheuert:durchscheuern¦5geschlafen:durchschlafen¦5geschlungen:durchschlingen¦5geschlängelt:durchschlängeln¦5geschlüpft:durchschlüpfen,unterschlüpfen¦5geschmolzen:durchschmelzen¦5geschwindelt:durchschwindeln¦5geschwitzt:durchschwitzen¦5gesiebt:durchsieben¦5gestartet:durchstarten¦5gestrichen:durchstreichen,glattstreichen¦5getrennt:durchtrennen¦5gewebt:durchweben¦5gewunden:durchwinden,emporwinden¦5gewischt:durchwischen¦5gewurstelt:durchwursteln¦5gewählt:durchwählen¦5gewärmt:durchwärmen¦5gewühlt:durchwühlen¦5gezecht:durchzechen¦3gebunkert:einbunkern¦3gebüßt:einbüßen¦3gecremt:eincremen¦3gedeicht:eindeichen¦3gedellt:eindellen¦3gedeutscht:eindeutschen¦3gedost:eindosen¦3gedrillt:eindrillen¦3geebnet:einebnen¦3geengt:einengen¦3geerntet:einernten¦3gefettet:einfetten¦3geflößt:einflößen¦4egipst:eingipsen¦4egittert:eingittern¦4eglast:einglasen¦3geheimst:einheimsen¦3geheiratet:einheiraten¦6gebraust:einherbrausen¦6geschritten:einherschreiten¦3gehievt:einhieven¦3gehüllt:einhüllen¦3gehütet:einhüten¦3geigelt:einigeln¦3geimpft:einimpfen¦3gekachelt:einkacheln¦3gekellert:einkellern¦3gekerbt:einkerben¦3gekerkert:einkerkern¦3gekesselt:einkesseln¦3geklagt:einklagen¦3geklemmt:einklemmen¦3gekreist:einkreisen¦3gelocht:einlochen¦3gelullt:einlullen¦3gemauert:einmauern¦3gemottet:einmotten¦3gemümmelt:einmümmeln¦3genebelt:einnebeln¦3genistet:einnisten¦3genäßt:einnässen¦3gepinselt:einpinseln¦3geplant:einplanen¦3gepreßt:einpressen¦3gepudert:einpudern¦3gepökelt:einpökeln¦3gerahmt:einrahmen¦3gerammt:einrammen¦3geriegelt:einriegeln¦3geritzt:einritzen¦3gerostet:einrosten¦3gesalbt:einsalben¦3gesargt:einsargen¦3gesaut:einsauen¦3geschlummert:einschlummern¦3geschläfert:einschläfern¦3geschneit:einschneien¦3geschnitzt:einschnitzen¦3geschritten:einschreiten,vorschreiten¦3geschränkt:einschränken¦3geschwommen:einschwimmen,hinschwimmen¦3geschworen:einschwören¦3geschärft:einschärfen¦3geschätzt:einschätzen¦3gestippt:einstippen¦3gesäumt:einsäumen¦3getaucht:eintauchen,wegtauchen¦3getopft:eintopfen¦3getrichtert:eintrichtern¦3geträufelt:einträufeln¦3getrübt:eintrüben¦3getunkt:eintunken¦3getütet:eintüten¦3gewebt:einweben¦3geweiht:einweihen¦3gewilligt:einwilligen¦3gezäunt:einzäunen¦3geäschert:einäschern¦3geölt:einölen¦5geholfen:emporhelfen¦5gestrebt:emporstreben¦4unden:entbinden¦5ohen:entfliehen¦8geschallt:entgegenschallen¦4angen:entgehen,vergehen,zergehen¦17rt:entkommerzialisie¦4iehen:entleihen,verleihen,verzeihen¦4ommen:entnehmen,erklimmen,vernehmen¦5ßt:entnässen¦4issen:entreißen,verreißen,zerreißen¦4andt:entsenden,entwenden,versenden,verwenden¦6ieden:entscheiden¦7ichen:entschleichen¦12t:entschlummern,heimbegleiten,nachberechnen,verschachteln,verschleudern,weitererzählen,wiedererlangen,wiedererzählen,zerschmettern,zurückerlangen,zurückverlegen,entschlüsseln,gewährleisten,unterbewerten,untergliedern,unterzeichnen,verschlimmern,verschlüsseln,verschnörkeln,verschüchtern,überanstrengen,überbelichten,hierhergehören¦7unden:entschwinden,verschwinden¦6ochen:entsprechen¦6ungen:entspringen,verspringen,zerspringen¦5anden:entstehen,verstehen¦5iegen:entsteigen¦7gebrochen:entzweibrechen¦7gehauen:entzweihauen¦7geschlagen:entzweischlagen¦7geschnitten:entzweischneiden¦3eten:erbitten¦4acht:erbringen,verdenken¦3oben:erheben,beheben¦4ungen:erklingen,erzwingen¦3egen:erliegen¦3itten:erleiden¦5ossen:erschießen,zerfließen,beschießen,verdrießen,verfließen¦4anden:erstehen,bestehen,gestehen¦4gebeten:fehlbitten¦5egriffen:fehlgreifen,übergreifen¦4geleitet:fehlleiten,irreleiten,überleiten¦4geboten:feilbieten¦6gekocht:fertigkochen¦4gehalten:festhalten,freihalten,innehalten,kurzhalten¦4gekeilt:festkeilen¦4geklammert:festklammern¦4geklebt:festkleben¦4geklemmt:festklemmen¦4gestanden:feststehen,leerstehen,nahestehen¦4gewurzelt:festwurzeln¦4gedauert:fortdauern¦4geeilt:forteilen,nacheilen¦4gefallen:fortfallen¦4geflogen:fortfliegen¦4gekommen:fortkommen,nahekommen¦4gelassen:fortlassen¦4gelebt:fortleben,hochleben,nachleben¦4gepflanzt:fortpflanzen¦4geritten:fortreiten¦4gerannt:fortrennen¦4geräumt:forträumen¦4geschert:fortscheren,kahlscheren¦4gescheucht:fortscheuchen¦4geschlichen:fortschleichen¦4geschleudert:fortschleudern¦4geschritten:fortschreiten¦4geschwommen:fortschwimmen,freischwimmen¦4gesehnt:fortsehnen¦4gestohlen:fortstehlen¦4gewischt:fortwischen¦4gewährt:fortwähren¦4gewünscht:fortwünschen¦4gezahlt:fortzahlen,heimzahlen,nachzahlen¦4gezerrt:fortzerren¦4gekauft:freikaufen,nachkaufen¦4gepresst:freipressen¦4gespielt:freispielen¦4gesprochen:freisprechen¦5gebucht:gegenbuchen¦9gestellt:gegenüberstellen¦6gerichtet:geraderichten¦6geachtet:geringachten¦6geschätzt:geringschätzen¦6gepflegt:gesundpflegen¦5gezogen:glattziehen,umherziehen¦3geheißen:gutheißen¦4gelötet:hartlöten¦4gefunden:heimfinden¦6geigt:heimgeigen¦4gereist:heimreisen¦4gesucht:heimsuchen¦5gereift:heranreifen¦5gezüchtet:heranzüchten¦6geflossen:herauffließen,vorbeifließen,zurückfließen¦6gelugt:herauslugen¦6geschunden:herausschinden¦6gesprossen:heraussprießen¦6geeilt:herbeieilen,zurückeilen¦6gerufen:herbeirufen,hervorrufen,zurückrufen¦6geschworen:herbeischwören¦6gesehnt:herbeisehnen,zurücksehnen¦6gewünscht:herbeiwünschen,zurückwünschen¦5geben:hergeben,vorgeben,weggeben¦3geleitet:herleiten¦3gerückt:herrücken,vorrücken¦3geschaffen:herschaffen,hinschaffen¦3gesehnt:hersehnen¦3gestammt:herstammen¦3gestellt:herstellen,totstellen¦5gelegen:herumliegen¦5gelungert:herumlungern¦5gereicht:herumreichen¦5gesprochen:herumsprechen¦5gespritzt:herumspritzen¦5getönt:herumtönen¦5gewirbelt:herumwirbeln¦8gedrückt:herunterdrücken¦8gerasselt:herunterrasseln¦8gereicht:herunterreichen¦8gerannt:herunterrennen¦6gebrochen:hervorbrechen,niederbrechen¦6gesucht:hervorsuchen¦3gezaubert:herzaubern,wegzaubern¦3gezogen:herziehen,mitziehen,vorziehen,wegziehen¦5geeilt:herzueilen¦7gelangt:herüberlangen¦7gebeten:hierherbitten¦7geeilt:hierhereilen¦7geschaffen:hierherschaffen¦6geschaffen:hinaufschaffen,zurückschaffen¦8geflossen:hindurchfließen,hinunterfließen¦6gepaßt:hineinpassen¦6geschlungen:hineinschlingen¦3geflegelt:hinflegeln¦3gefläzt:hinfläzen¦3gekauert:hinkauern¦3gekniet:hinknien¦3gelümmelt:hinlümmeln¦3geneigt:hinneigen,vorneigen¦3gepurzelt:hinpurzeln¦10gefallen:hintenüberfallen¦9geräumt:hinterherräumen¦9geschwommen:hinterherschwimme¦9gesandt:hinterhersenden¦6gekaut:hinterkauen¦8gezogen:hinunterziehen¦6getröstet:hinwegtrösten¦6getäuscht:hinwegtäuschen¦7gelappt:hinüberlappen¦4geachtet:hochachten¦4gebunden:hochbinden¦4gedient:hochdienen¦4gehoben:hochheben¦4gejubelt:hochjubeln¦4geschaukelt:hochschaukeln¦4geschreckt:hochschrecken¦4geschätzt:hochschätzen,wertschätzen¦4gezüchtet:hochzüchten¦11egriffen:ineinandergreifen¦4gewohnt:innewohnen¦6geben:kundgeben¦4geschlossen:kurzschließen¦3geeist:loseisen¦3gekettet:losketten¦3gekoppelt:loskoppeln¦3gerast:losrasen¦3gerannt:losrennen¦9anden:missverstehen¦3gefreut:mitfreuen¦3gesprochen:mitsprechen,vorsprechen¦15t:misswirtschaften,weiterentwickel,weiterverbreiten¦4geahmt:nachahmen¦4gebaut:nachbauen¦4geblichen:nachbleichen¦4geblickt:nachblicken¦4geblutet:nachbluten¦4gebohrt:nachbohren¦4gedichtet:nachdichten¦4gedruckt:nachdrucken¦4gedunkelt:nachdunkeln¦4geeifert:nacheifern¦4gefaßt:nachfassen¦4gefilmt:nachfilmen¦4gefolgt:nachfolgen¦4gefordert:nachfordern¦4geforscht:nachforschen¦4gefüllt:nachfüllen,vollfüllen¦5egrübelt:nachgrübeln¦5egoren:nachgären¦4gehallt:nachhallen¦4gehinkt:nachhinken¦4geimpft:nachimpfen¦4geliefert:nachliefern¦4gemalt:nachmalen,vollmalen¦4gepfiffen:nachpfeifen¦4geredet:nachreden¦4gereift:nachreifen¦4gerühmt:nachrühmen¦4gerüstet:nachrüsten¦4geschaffen:nachschaffen¦4gesandt:nachsenden¦4gesonnen:nachsinnen¦4gespürt:nachspüren¦4getankt:nachtanken,volltanken¦4getrauert:nachtrauern¦4getönt:nachtönen¦4gewachsen:nachwachsen¦4geweint:nachweinen¦4gewiesen:nachweisen¦4geäfft:nachäffen¦6gebrannt:niederbrennen¦6gefallen:niederfallen,schwerfallen,zurückfallen¦7eglitten:niedergleiten¦6gehalten:niederhalten,sauberhalten,zurückhalten¦6gehauen:niederhauen¦6geknüppelt:niederknüppeln¦6gekämpft:niederkämpfen¦6gelassen:niederlassen,zurücklassen¦6gelegt:niederlegen¦6gemetzelt:niedermetzeln¦6gemäht:niedermähen¦6geprasselt:niederprasseln¦6gerungen:niederringen¦6geschlagen:niederschlagen¦6geschmettert:niederschmettern¦6geschrien:niederschreien¦6gestampft:niederstampfen¦6gestreckt:niederstrecken¦6getrampelt:niedertrampeln¦6gezwungen:niederzwingen¦4gerochen:reinriechen¦4gewürgt:reinwürgen¦7gelegen:richtigliegen¦6gelegen:schiefliegen,zurückliegen¦7gehört:schwarzhören¦7gemalt:schwarzmalen¦5gelegt:stilllegen¦5geschwiegen:stillschweigen¦3geärgert:totärgern¦2gedeutet:umdeuten¦5geflattert:umherflattern¦5geirrt:umherirren¦5geschlichen:umherschleichen¦5getappt:umhertappen¦5getastet:umhertasten¦2gekleidet:umkleiden¦2gekreist:umkreisen¦2gemodelt:ummodeln¦2gepflanzt:umpflanzen¦2gepflügt:umpflügen¦2gepolt:umpolen¦2gerannt:umrennen¦2geschichtet:umschichten¦2geschuldet:umschulden¦2gesäumt:umsäumen¦2getauft:umtaufen¦2getauscht:umtauschen¦2getopft:umtopfen¦2gewühlt:umwühlen¦5gefaßt:unterfassen¦5gejubelt:unterjubeln¦5gemengt:untermengen¦5gemischt:untermischen¦5gepflügt:unterpflügen¦5gestreut:unterstreuen¦4orgen:verbergen¦5ieben:verbleiben,vertreiben¦5ichen:verbleichen,vergleichen¦5acht:verbringen¦5annt:verbrennen,entbrennen,überrennen¦5oschen:verdreschen¦5ochten:verflechten¦4olten:vergelten¦5ommen:verglimmen,übernehmen¦4olfen:verhelfen¦5ungen:verklingen,misslingen¦4ieden:vermeiden¦4annt:verrennen¦6oben:verschieben¦7itten:verschneiden,zerschneiden¦7ieben:verschreiben,unterbleiben,untertreiben¦7ien:verschreien¦7iegen:verschweigen¦7ommen:verschwimmen¦7oren:verschwören¦5orben:versterben¦4orfen:verwerfen,entwerfen¦4gegessen:vollessen¦4gekritzelt:vollkritzeln¦4gelabert:volllabern¦4gequatscht:vollquatschen¦4geschmiert:vollschmieren¦4gespritzt:vollspritzen¦4gestopft:vollstopfen¦6geblickt:vorausblicken¦6geredet:vorbeireden¦6getroffen:vorbeitreffen¦3geflunkert:vorflunkern¦3geformt:vorformen¦4egaukelt:vorgaukeln¦3geherrscht:vorherrschen¦3geheuchelt:vorheucheln¦3geheult:vorheulen¦3gejammert:vorjammern¦3gekaut:vorkauen¦3gelogen:vorlügen¦3geprescht:vorpreschen¦3geschwindelt:vorschwindeln¦3geschützt:vorschützen¦3gesorgt:vorsorgen¦3geturnt:vorturnen¦3getäuscht:vortäuschen¦3gewarnt:vorwarnen¦3gewölbt:vorwölben¦3geblickt:wegblicken¦3geschafft:wegschaffen¦3geschickt:wegschicken¦3geschlichen:wegschleichen¦3gestohlen:wegstehlen¦6geflogen:weiterfliegen,zurückfliegen¦6geholfen:weiterhelfen¦6geleitet:weiterleiten¦6gereist:weiterreisen,zurückreisen¦6gesponnen:weiterspinnen¦14t:weitervermieten,wiedervereinige,zurückbegleiten,zurückübersetzen,unterversichern,vergegenwärtigen,verhohnepiepeln,verselbständigen,vervollständigen¦5gehallt:widerhallen¦5geklungen:widerklingen¦10iffen:wiederergreifen¦6geimpft:wiederimpfen,schutzimpfen¦6gekäut:wiederkäuen¦6geliebt:wiederlieben¦6oren:zerscheren,beschwören¦6unden:zerschinden¦7issen:zerschmeißen¦2geballert:zuballern¦2gebilligt:zubilligen¦2gebuttert:zubuttern¦2geflossen:zufließen¦2gefächelt:zufächeln¦2gejubelt:zujubeln¦2gekorkt:zukorken¦2gelangt:zulangen¦2gelötet:zulöten¦2gemauert:zumauern¦2gepackt:zupacken¦2geprostet:zuprosten¦2geraunt:zuraunen¦7gekommen:zurechtkommen¦7gewiesen:zurechtweisen¦7gezimmert:zurechtzimmern¦2geredet:zureden¦9eten:zurückerbitten¦6gefunden:zurückfinden¦6gefordert:zurückfordern¦6gefragt:zurückfragen¦7egriffen:zurückgreifen¦6gekauft:zurückkaufen¦6gekommen:zurückkommen¦6geritten:zurückreiten¦6geschallt:zurückschallen¦6geschaudert:zurückschaudern¦6gescheucht:zurückscheuchen¦6gescheut:zurückscheuen¦6geschreckt:zurückschrecken¦6geschwommen:zurückschwimmen¦6gesandt:zurücksenden¦6gestrahlt:zurückstrahlen¦6gestrichen:zurückstreichen¦6gestreift:zurückstreifen¦6getaumelt:zurücktaumeln¦6gewiesen:zurückweisen¦6gezahlt:zurückzahlen¦6gezogen:zurückziehen¦8geballt:zusammenballen¦8gebraut:zusammenbrauen¦8gefaltet:zusammenfalten¦8gekleistert:zusammenkleistern¦8geknüllt:zusammenknüllen¦8gekrampft:zusammenkrampfen¦8geleimt:zusammenleimen¦8geläppert:zusammenläppern¦8gepasst:zusammenpassen¦8gepresst:zusammenpressen¦8gerauft:zusammenraufen¦8gereimt:zusammenreimen¦8geringelt:zusammenringeln¦8gerottet:zusammenrotten¦8geschart:zusammenscharen¦8geschlagen:zusammenschlagen¦8geschreckt:zusammenschrecken¦8geschrumpft:zusammenschrumpfe¦8gestaucht:zusammenstauchen¦8getrommelt:zusammentrommeln¦2geschanzt:zuschanzen¦2geschneit:zuschneien¦8gekommen:zustandekommen¦2gesteuert:zusteuern¦2gestopft:zustopfen¦2gestöpselt:zustöpseln¦2getroffen:zutreffen¦7gehandelt:zuwiderhandeln¦2gezwinkert:zuzwinkern¦8gelandet:zwischenlanden¦2getankt:abtanken¦4gehabt:achthaben,freihaben,gernhaben¦2geraut:anrauen¦11gefolgt:aufeinanderfolgen¦3ohlen:befehlen¦8gelegt:beiseitelegen¦5issen:bescheißen¦5gepoliert:blankpolieren¦5gekonnt:dafürkönnen¦4geloadet:downloaden¦7ochten:durchflechten¦9itten:durchschreiten,unterschreiten¦4oben:entheben,verheben¦4gemahlen:feinmahlen¦2geben:geben¦1egabelt:gabeln¦1egafft:gaffen¦2golten:gelten¦1egammelt:gammeln¦1egart:garen¦1egast:gasen¦1egaukelt:gaukeln¦1egaunert:gaunern¦3oren:gebären¦2gangen:gehen¦2gehrt:gehren¦2geigt:geigen¦2geilt:geilen¦2geistert:geistern¦2geizt:geizen¦2geißelt:geißeln¦2gerbt:gerben¦1egiert:gieren¦1egiftet:giften¦1egipfelt:gipfeln¦1egipst:gipsen¦1egittert:gittern¦1eglast:glasen¦1eglaubt:glauben¦1egleist:gleisen¦1eglibbert:glibbern¦1eglichen:gleichen¦1egliedert:gliedern¦1eglimmert:glimmern¦1eglitten:gleiten¦1eglommen:glimmen¦1eglotzt:glotzen¦1egluckert:gluckern¦1egluckst:glucksen¦1eglupscht:glupschen¦1eglänzt:glänzen¦1eglättet:glätten¦1eglückt:glücken¦1eglüht:glühen¦1egolft:golfen¦1egondelt:gondeln¦1egongt:gongen¦1egoogelt:googeln¦1egoren:gären¦1egossen:gießen¦1egraben:graben¦1egrabscht:grapschen¦1egrast:grasen¦1egrault:graulen¦1egraupelt:graupeln¦1egraust:grausen¦1egriffen:greifen¦1egrillt:grillen¦1egrummelt:grummeln¦1egrunzt:grunzen¦1egruselt:gruseln¦1egrämt:grämen¦1egrölt:grölen¦1egrübelt:grübeln¦1egründet:gründen¦1egrüßt:grüßen¦1eguckt:gucken¦1egurgelt:gurgeln¦1egurrt:gurren¦1egähnt:gähnen¦1egängelt:gängeln¦1egärtnert:gärtnern¦1egönnt:gönnen¦4gekocht:hartkochen,überkochen¦7angen:hintergehen¦6geskatet:inlineskaten¦4ossen:umfließen,vergießen¦3orben:umwerben,bewerben¦6egen:unterliegen¦6ommen:unternehmen¦9ieben:unterschreiben¦6orfen:unterwerfen¦6ogen:unterziehen,überfliegen,einbeziehen¦3egradet:upgraden¦4eten:verbitten¦4orben:verderben¦4ochten:verfechten¦5iffen:vergreifen¦4oren:verlieren¦16t:verschlimmbessern,verselbstständigen,auskristallisiere,durchstrukturiere,entbürokratisiere,entkolonialisiere,entkommunalisiere,entkriminalisiere¦4an:vertuen¦6acht:vollbringen,überbringen¦3geharrt:vorharren¦4gebraten:überbraten¦4geflossen:überfließen¦4geschlagen:überschlagen¦4geschwappt:überschwappen¦4gezählt:überzählen¦5angen:übergehen¦5andt:übersenden¦8itten:überschneiden,überschreiten¦8ieben:überschreiben¦6anden:überstehen,zugestehen¦6iegen:übersteigen¦6offen:übertreffen,anbetreffen¦9oren:aufbeschwören¦3geschrumpft:aufschrumpfen,einschrumpfen¦3ommen:benehmen¦4offen:betreffen¦6geschrumpft:gesundschrumpfen¦17ert:herauskristallisi,hinauskomplimenti¦6orben:mitbewerben¦18t:institutionalisiere"
      }
    },
    "nouns": {
      "plural": {
        "fwd": "3:hen,ser,men,vis,ken,sen,gen,ben,len,ren,zen,nen,pen¦4:nder,oten,rter,uter,tter,üter,rden,lder,äter,ider,lten,rmer,eden,pfen,hten,ufen,ifen,tten,aten¦5:ieder,hänge,riebe,ängel,osten¦üsse:uss,uß¦ürze:urz¦öden:oden¦ühle:uhl¦ärten:arten¦1en:mus,ium,rum,sum,uum¦1änder:land¦1äuser:haus¦1a:mum¦1sse:eß¦1änke:rank¦2en:it,nt,ei,nz,ek,ph,md,iga,seum¦2e:eb¦2s:si,nu,ri¦2er:ib¦3ten:bau¦3en:hrt,orm,raf,ins,err,uld,tür,net,het,hema¦3e:rät,äft,ück,äck,äch,ühl,üst¦4en:haft,ürst,fahr,gend¦4e:wind,werb,üsch¦4er:leid,iech¦5en:ronom,racht,hicht¦5e:äusch",
        "both": "3:uel,ßel,äer,xer,wer,ßer,per,kel,zer,rer,fer,ber,ker,ler,ger,her,ner¦4:xter,esel,dder,umer,oter,öbel,gsel,över,ödel,utel,tzel,itel,obel,pter,tuer,herl,efel,rtel,dter,ölbe,ämer,äude,irge,käse,müse,hege,lver,übel,lmer,ädel,ubel,oder,nter,rder,ügel,äuer,lein,egel,ader,ttel,imer,iter,fter,lter,sier,amer,hmer,rier,ster,eter¦5:eufel,rudel,impel,hntel,lauge,ommer,nstel,assel,ümmel,dauer,üppel,kater,dstel,endel,ipfel,elage,ündel,eater,immel,lauer,uffel,webel,empel,öffel,üssel,feuer,oppel,aeder,immer,tänge,hauer,reuer,engel,reier,ammel,rater,gstel¦5n:orgel,feier,affel,feder,nadel,urbel,urzel,apsel,achel,faser,uppel,nudel,mauer,ormel,ossel,regel,istel,teuer¦5e:nding,dicht,inent,irsch,ewehr,ament,iment,entor,oment,engst,wicht,ering,richt,arett,nkett,gment,nhalt¦5en:konom,ensch,eltat,ewalt,örung,rrung,ärung,ostat,twort,arung,sicht,erung,hrung¦5s:chall,aison,tnant,olett,rilla¦5er:cheit,brett,geist,licht¦4e:loid,hund,pann,hied,rmin,pion,rlag,tett,fund,aket,rgan,rarm,mord,tsch,rast,mied,amin,itat,mond,jahr,ulat,hick,ieck,hirn,gift,rein,beet,eund,orst,rmat,trat,tift,tier,rakt,blem,hoss,pier,fest,bein,laut,orat,ndat,tein,kret,tarr,orid,drom,enst,wein,wart,lech,edit,such,hein,heid,nzin,nett,isch,takt,hrei,rest,arat,riat,echt,ling,lick,phon,tall,kord,erat,rief,bend¦4s:kode,code,ogan,rain,rend,thon,mmee,itee,lleg,sett,rree,otel,ppie,deck,krem,oyer,hart,lief,tart,ting,heck,rink,pack,ping,back,ning,gnon,bert,unch,date,llon,have¦4n:afel,ugel,skel,ibel¦4en:peut,idat,sekt,flut,verb,vung,plin,mand,bett,iung,uung,ilot,omat,burt,krat,naut,talt,ßung,mast,bahn,lung,mung,rift,bung,fung,nung,sung,hung,zung,tung,gung,kung,dung¦4er:rlid,kind,lied¦4ände:verband¦3s:vre,eam,eik,eau,mba,bor,bon,ota,gon,dog,hop,ama,int,fet,bab,ill,pot,pon,ail,lub,yte,get,eak,out,ark,rak,eon¦3e:haf,fad,dal,hat,bst,sal,där,kal,fix,tüm,lex,bak,ult,kom,alk,kop,mon,old,erd,zid,aar,fon,ips,ohl,ept,enk,inn,eug,iet,irm,ohr,arn,lar,irr,ian,ert,lob,kat,man,lch,etz,ial,tem,nar,ikt,kan,fat,xid,nat,rot,huh,oot,itz,erg,eft,ehl,sar,iom,maß,tär,nkt,tom,eal,när,ukt,ell,log,xin,eiz,bot,aub,eur,ekt,tag,ich,eis,iel,itt,ruf,gas¦3en:our,kur,har,els,san,pur,ühr,hau,urg,bär,isk,rau,aat,sur,tur,tät,ahl,ist,uhr¦3ien:zip¦3öne:enton,erton¦3er:eld,ild¦3ta:mma¦3a:tikum¦3örter:ürwort¦3se:bus,nis¦2s:hu,fa,pi,ep,wi,pa,di,sh,ok,ja,ti,ca,wn,ip,ap,ha,li,zi,da,ka,up,pp,mi,ra,bi¦2örter:pwort,lwort,dwort,ewort¦2änder:hband,ewand¦2übe:chub¦2ächte:rnacht¦2e:yl,xt,ih,ig,bs,lg,lm,rs,hm,ül,rk,il,ff,mm,öl,ol,ym,im,eg¦2i:oso¦2äte:lrat¦2äuter:kraut¦2ümer:rtum,stum¦2äne:plan¦2en:yt,yp,ik,th,on,or¦2öme:trom¦2üder:bruder¦2ände:nwand¦2älte:nwalt¦2äre:ltar¦2ünge:prung¦2ötter:bgott¦2nen:in¦1ices:tex¦1ärte:bart¦1älle:ball,fall¦1ämmer:hammer¦1äuse:laus,maus¦1ägel:nagel¦1ünder:mund¦1äbel:nabel¦1ände:hand,tand¦1äuler:maul¦1örner:korn,horn¦1üchte:rucht,sucht¦1äbe:tab¦1äter:vater¦1äder:bad,rad¦1äcke:sack¦1ürmer:wurm¦1s:c,é,y,w,ü,o¦1öhne:lohn¦1öcher:loch¦1ärme:darm¦1ölle:zoll¦1ücher:tuch,buch¦1üge:rug,lug,zug¦1äcker:mack¦1ätter:latt¦1leute:fmann¦1äute:haut¦1äfte:raft¦1ürme:turm¦1öße:toß¦1ässe:laß¦1üter:gut¦1äge:rag,lag¦1ünge:wung¦1e:v¦1ünde:rund¦1üche:ruch¦1n:e¦ölfe:olf¦ünsche:unsch¦öchter:ochter¦ümpfe:umpf¦iatantum:etantum¦äpfe:apf¦ögel:ogel¦älder:ald¦älse:als¦ästen:asten¦äpste:apst¦änse:ans¦ösche:osch¦äuste:aust¦örbe:orb¦üfte:uft¦ähte:aht¦äntel:antel¦ölzer:olz¦ächer:ach¦ürste:urst¦ühner:uhn¦öpfe:opf¦öcke:ock¦ärkte:arkt¦üchse:uchs¦äuche:auch¦öfe:of¦äden:aden¦öfen:ofen¦äfen:afen¦äpfel:apfel¦ünfte:unft¦änner:ann¦ädte:adt¦ärzte:arzt¦ürfe:urf¦äume:aum¦ätze:atz¦ärsche:arsch¦äufe:auf¦änge:ang¦ämter:amt¦ämpfe:ampf",
        "rev": "1:as,rs,ts,ln,rn,ns,fs,ls,ms,is,ie,gs,bs,ds,ps,hs,ks,vs,ata¦2:ale,nte,ate,nes,phe,ene,are,ine,ite,or,hre,one,tes,ere,tte,ies,rde,ome,aus,usse,ues,ane,ees,kes,mes,eme,oma,les,res,ore,ure,rne,ele,gden,rle,ame,ose,ehe,aue,rl,ife¦3:uer,orte,teien,ier,arme,bete,iebe,ucke,elden,akte,este,alte,aphen,leten,alle,unde,ecke,lute,oste,sel,hel,odes,inge,ornen,mel,zel,elte,eer,äse,icke,ifte,urte,pel,irte,neien,olle,rosse¦4:keiten,venten,wehren,häfte,tanzen,ereien,sser,nbauten,ovis,emiten,stel,beiten,tenzen,denzen,ienzen,eleien,öser,grafen,hemden,eräte,tücke,ffel,banken,achse,danzen,nanzen,ngel,kter,nser,nenzen,adel,senzen,lenzen,bäcke,räche,udel,zenzen,päcke,herren,uenzen,ater,fühle,uder,webe,ebel,aser,lücke,ichte,asiten,iraten,leiber,eliten,abel,iser,kser,oliten,eser,rgel,panten,ddel,rser,sophen,lliten,auge,hulden,htel¦5:fahrten,ender,agenten,utanten,mögen,nheiten,umenten,chaften,tienten,theiten,udenten,nzeiten,wesen,granten,ylanten,ärter,dchen,euter,ausche,lände,itter,orter,hüter,atter,rheiten,under,ilanzen,ßchen,sichter,tchen,mchen,utter,wagen,sheiten,ummer,räter,nsenten,täter,kchen,bchen,hchen,lehen,ozenten,erenzen,hzeiten,otter,bogen,llanten,lheiten,punkten,haken,beben,szeiten,ander,ahenten,hnder,rzeiten,arter,uzenten,ormer,oranten,hheiten,dheiten,zchen,apfen,ndanten,erüste,ßformen,baueren,pchen,haben,upfen,fchen,ssenten,iganten,ammer,ärmer,lüter,ttanten,dianten,ndenten,regen,fürsten,older,lzeiten,twinde,edanten,fronten,rnenten,tzeiten,leben,kleider¦and:ände¦ad:äder¦ank:änke¦aß:ässe¦ort:örter¦unst:ünste¦uch:ücher¦amm:ämme¦a:ä¦ahn:ähne¦uß:üße¦und:ünde¦acht:ächte¦utter:ütter¦andel:ändel¦og:öge¦orn:örner¦an:äne¦anz:änze¦uh:ühe¦agd:ägde¦en:ina¦1uck:rücke¦1urz:türze¦1ucht:lüchte¦1uß:hüsse¦1al:mäler,täler,näle¦1uhl:tühle¦1and:bänder¦1on:töne¦1arten:gärten¦1oden:böden¦1all:tälle¦1us:pora¦1ust:lüste¦2uß:hlüsse¦2a:gmen¦2aus:rhäuser¦2um:ima¦2us:smen¦3us:thmen¦3um:arien,useen,ktren¦3ß:ozesse¦4um:torien¦5um:sterien",
        "ex": "2:mb¦3:fax,sms¦4:adel,egel,esel,igel,iris,knie,käse,moll,opel,pils,plus,quiz,sims,vize,volt,übel,amen¦5:corps,dusel,dämel,engel,feuer,fokus,geier,gyros,hagel,hauer,hebel,hoden,kabel,kasus,kater,köder,köter,leder,luder,minus,nabel,nebel,pasta,pater,pixel,popel,pudel,puder,remis,rudel,ruder,rumor,römer,säbel,tadel,ärmel,beben,besen,bogen,busen,degen,eisen,essen,euter,haken,hüter,inder,küken,leben,orden,otter,rasen,regen,samen,täter,wagen,wesen¦6:ampere,ananas,bembel,bremer,büffel,kuskus,dussel,einzel,feudel,fladen,fummel,gefege,gefüge,gelege,gewebe,giebel,gulden,hektar,hummer,jammer,kessel,knebel,kummer,kürzel,libyer,magier,mergel,michel,nessel,nippel,nubier,ostern,paddel,palais,pinsel,pummel,rappel,reeder,regime,rummel,rätsel,rüffel,sessel,sherry,stapel,status,tripel,tümpel,tüpfel,wandel,wirbel,würfel,zweier,balken,ballen,becken,binder,bissen,bläser,bolzen,braten,daumen,examen,farmer,finder,fohlen,galgen,gaumen,giemen,happen,haufen,humpen,kissen,knoten,korken,kragen,kuchen,mieder,morgen,neider,pollen,posten,rachen,rahmen,ranzen,rechen,reigen,rennen,retter,riemen,rücken,spaten,sünder,tresen,türmer,wappen,weizen,willen,winder,zacken,zinken¦7:apostel,belgier,bosnier,brummer,büschel,celsius,chassis,csárdás,dessous,dichter,erbadel,erbauer,fauxpas,fechter,galater,gallier,gebilde,gebläse,gefälle,gehäuse,gehölze,gelände,gelübde,gemälde,gestade,gewerbe,gewinde,gewürze,griffel,klüngel,knorpel,kreisel,neuntel,pächter,richter,schemel,siebtel,skrupel,spanier,spargel,stoffel,stummel,taliban,trampel,vorende,wechsel,wächter,zweifel,züchter,bremser,brocken,browser,brunnen,döschen,flieder,frieden,gehänge,gründer,härchen,häschen,insider,karpfen,klumpen,knochen,märchen,näschen,pfosten,piepser,proppen,puschen,pärchen,röschen,spötter,stumpen,stutzen,ständer,stürmer,tropfen,zeichen¦8:arkadier,armenier,bolivier,einakter,frachter,georgier,getreide,gewächse,kanadier,katheder,klientel,leuchter,liptauer,mercedes,moskauer,namibier,plebejer,pullover,rodgauer,scheffel,schleier,schussel,somalier,spachtel,speichel,triangel,trichter,zucchini,andenken,anliegen,bedenken,begehren,bienchen,bierchen,bisschen,composer,computer,erfinder,erretter,ersuchen,frauchen,fässchen,gefallen,gefieder,geländer,getriebe,groschen,gräschen,gänschen,haudegen,herrchen,hähnchen,hälschen,häuschen,hörnchen,hühnchen,inländer,irländer,isländer,jungchen,kerlchen,krönchen,kännchen,körnchen,küsschen,layouter,männchen,männeken,mäulchen,mäuschen,nönnchen,nüsschen,pronomen,röhrchen,schatten,schinken,schänder,springen,spänchen,säulchen,tränchen,tännchen,tässchen,unwetter,veilchen,vergehen,wännchen,zylinder,zäunchen¦9:abenteuer,abrichter,angebinde,dschungel,epikureer,gelächter,gutachter,jordanier,leitfaden,lip gloss,moldawier,oldesloer,pantoffel,patrizier,presbyter,procedere,querruder,schichter,schlummer,schmirgel,schmuggel,schnipsel,schwindel,springerl,triefauge,ungeheuer,vergeuder,verächter,zurichter,äthiopier,abzeichen,anzeichen,ausbilder,ausländer,begründer,brünnchen,einkommen,engelchen,engländer,estländer,fangeisen,figürchen,fäserchen,gebrechen,gutachten,gäbelchen,holländer,jütländer,kaninchen,knäulchen,lebkuchen,lötkolben,mörfelder,nädelchen,reibeisen,schlitten,schneider,schrecken,schreiben,spielchen,steinchen,sternchen,ställchen,südländer,unfrieden,verfahren,vergnügen,vorfluter,vorkommen,vorposten,vorrennen,väterchen,wägelchen¦10:aktivruder,ausrichter,australier,beleuchter,beobachter,betrachter,bierbrauer,bredouille,drehsessel,eigentümer,eingeweide,einrichter,erbpächter,gegenruder,halbfinale,hilfsruder,hüftleiden,katalonier,kraftmeier,lehnsessel,makedonier,mazedonier,neuguineer,nidderauer,psychiater,schlichter,schmankerl,schnorchel,schwammerl,semifinale,torwächter,verbündeter,verfechter,verleumder,viertakter,wetterauer,windjammer,zweitakter,abscheider,aussterben,beidhänder,beißerchen,breiteisen,brummeisen,buchbinder,dachbalken,dickhäuter,duckmäuser,dummerchen,dächelchen,farbkissen,finnländer,fitzelchen,flacheisen,gelnhäuser,grönländer,handballen,heizkissen,hämmerchen,kabäuschen,kratzeisen,käpselchen,lappländer,malzeichen,mitgründer,müllsünder,mütterchen,nachtessen,nordländer,ohrgehänge,parksünder,persönchen,pfadfinder,preßkuchen,radieschen,rüstbalken,saarländer,schwänchen,spätzünder,stehkragen,steigeisen,sättelchen,thailänder,treuhänder,tüpfelchen,urtierchen,verbrechen,wachposten,wettrennen,wässerchen,würzelchen,zeitfahren,züngelchen¦11:argentinier,artdirector,caffè latte,cinemascope,geigenbauer,gerüstbauer,hundertstel,kalifornier,keuchhusten,leibwächter,oberrichter,schlitzauge,stechpaddel,stützgewebe,verfrachter,waschkessel,wohnzimmmer,achtpfünder,anschreiben,bettelorden,bielefelder,bäuchelchen,büschelchen,eßverhalten,flachrennen,frankfurter,frischeisen,grenzposten,hüftknochen,kennzeichen,lesezeichen,linkshänder,lymphknoten,merkzeichen,münzzeichen,müschelchen,pfannkuchen,presskuchen,reibekuchen,rheinländer,schulranzen,schürfeisen,stickrahmen,strafrahmen,tauchkolben,tauchsieder,temposünder,transponder,töchterchen,unterfangen,unternehmen,versprechen,waschbecken,weihnachten,wiedersehen,wischlappen,zuschneider¦12:agrarpionier,außengelände,bestellliste,brummkreisel,flachgewinde,hilfsrichter,kronleuchter,maastrichter,nummerierung,skandinavier,spitzzüchter,sportfechter,wanderzirkus,überbleibsel,achtzylinder,antiteilchen,aufschneider,außenstürmer,blinkzeichen,eichhörnchen,einschreiben,essverhalten,frühschoppen,galopprennen,goldhähnchen,grabschänder,grauhörnchen,grenzzeichen,halbschatten,hungerleider,jammerlappen,kaffeesieder,kochschinken,kronenkorken,leckerbissen,lenkgetriebe,mehrzylinder,minuszeichen,mitbegründer,niederländer,pflästerchen,radialreifen,rechtshänder,ruderzeichen,satansbraten,schlagwetter,schmorbraten,schnürriemen,sendezeichen,spritzkuchen,strichelchen,vierzylinder,vorverfahren,wonneproppen,zweizylinder¦13:anglokanadier,beaglezüchter,diabetrachter,ehrenamtlicher,kostverächter,linienrichter,nationalismus,pflanzgelände,scharfrichter,tugendwächter,viertelfinale,alpenveilchen,alphateilchen,andruckkissen,bittschreiben,flügelstürmer,gesundbrunnen,gräuelmärchen,hintertürchen,klebestreifen,komposthaufen,mahnverfahren,pantöffelchen,parteigründer,querschreiben,schaltzeichen,schleifriemen,schlüsselchen,schwebebalken,schwimmbecken,schächtelchen,sendschreiben,spitzmäuschen,springbrunnen,übereinkommen¦14:bürgerschießen,einfaltspinsel,schiedsrichter,schnellrichter,techtelmechtel,ausrufezeichen,besetztzeichen,dämmerschoppen,ehrabschneider,einzelabkommen,flickschneider,infrarotmelder,jungpfadfinder,kinderschänder,klostergründer,nettoeinkommen,rodelschlitten,schifferknoten,schrägstreifen,vereinsgründer,verkehrssünder,vorderschinken¦15:gesamtinteresse,labradorzüchter,pinscherzüchter,zusammentreffen,altweiberknoten,geschwisterchen,großunternehmen,halsabschneider,heinzelmännchen,kondensstreifen,leichenschänder,nationalstürmer,relativpronomen,schwitzbläschen,seitenschneider,stiefmütterchen¦16:dobermannzüchter,pekinesenzüchter,pferdeschlachter,retrieverzüchter,schiffsgutachter,begleitschreiben,hula-hoop-reifen,nachwuchsstürmer,nominaleinkommen,paragraphzeichen,personalpronomen,schnellverfahren,usambaraveilchen¦17:prozessbeobachter,rottweilerzüchter,anführungszeichen,ausrufungszeichen,elementarteilchen¦18:oberschiedsrichter,firmenmitbegründer¦20:neufundländerzüchter,rauhaardackelzüchter,disziplinarverfahren,interrogativpronomen¦21:langhaardackelzüchter¦23:hals-nasen-ohren-ärztin¦äbte:abt¦äcker:acker¦ämter:amt¦ängste:angst¦äpfel:apfel¦ärsche:arsch¦ärzte:arzt¦äste:ast¦äxte:axt¦öfen:ofen¦4s:asta,aber,akku,alba,blau,blog,boom,camp,chef,clou,code,coke,cola,cord,deut,diva,dock,drob,duma,etat,etui,fakt,fiat,flop,fond,foul,game,gelb,girl,gmbh,grau,grog,heck,hoch,iglu,item,kaff,kick,king,kita,klan,klee,kode,koma,kord,leck,lord,pack,patt,pier,pool,puck,puma,punk,putt,quad,roma,safe,saga,skin,smog,snob,song,spam,star,stau,stop,tabu,tank,task,taxi,test,tick,tief,tram,törn,vamp,wlan,zivi,ipad,ipod,kanu¦3e:aal,arm,dom,eid,fön,gas,gel,gen,hai,huf,lob,los,mal,maß,mus,ort,reh,ruf,sog,tod,wal,weh¦6se:abakus,campus,circus,exodus,kaktus,korpus,kürbis,turnus,zirkus¦4ücke:abdruck¦10s:abonnement,binnentief,chansonier,charleston,chinchilla,cross-over,dankeschön,dekolletee,engagement,fencheltee,feuilleton,kommunikee,kommunique,konzertina,management,methusalem,mortadella,möchtegern,necessaire,newsletter,orang-utan,psychotest,repertoire,restaurant,schluckauf,smartphone,sozialfond,sponsoring,sweetheart,waschbeton,waschsalon¦5e:abort,alarm,baron,bazar,binom,butan,dachs,docht,drall,dreck,druck,duett,ekzem,erlös,feind,first,fjord,fleck,frust,gebet,gefäß,geäst,halon,kamel,kiosk,knall,knick,kreuz,lachs,lauch,lexem,likör,lurch,modem,monom,mäzen,mönch,notar,ozean,pimpf,quirl,regal,rubin,salat,salut,schal,skalp,spalt,speck,speer,spind,sprit,stern,stirn,tarif,thron,troll,tusch,wachs,wulst,zenit,zweck,zwist¦11en:abschnürung,commerzbank,denkerstirn,durchlaucht,schwerpunkt,zentnerlast,zentralbank,demonstrant,manifestant,oberschicht,spätschicht,substituent,transvestit,öllieferant¦8s:abstract,aperitif,baguette,boutique,bulletin,cervelat,concorde,decoding,dressing,einerlei,emoticon,ensemble,festival,firewall,flatrate,fräulein,happyend,heliport,hurrikan,klischee,känguruh,limerick,maharani,milchbar,mokassin,negligee,oldtimer,picknick,pipeline,portrait,raclette,research,scheriff,skinhead,smoothie,souvenir,standard,standart,terminal,transfer,wearable¦8a:abstraktum,curriculum,kompositum¦7e:abszess,admiral,andruck,antigen,appetit,arsenal,asphalt,aufruhr,balbier,ballett,barbier,bariton,bastard,besteck,billard,boykott,bussard,ceresin,chlorit,defizit,delphin,denotat,deputat,dirigat,dutzend,element,entgelt,etikett,florett,fraktal,furnier,gerücht,gespött,getränk,graphit,gulasch,habicht,halogen,heiland,infarkt,kapitän,karotin,klavier,kompass,kompost,kompott,konsens,konzern,krawall,kuckuck,lateral,lemming,magazin,mahnmal,meineid,merkmal,miethai,morphem,parkett,pinguin,pionier,plagiat,plausch,polynom,protest,prozent,präsent,quadrat,quartal,schluck,schreck,schrott,schwall,schweif,silikon,skelett,smaragd,spalier,support,terzett,theorem,triumph,turnier,verdeck,verlust,viereck,vorwort,wallach,wirsing,zierrat,äthylen,aufwind,gebüsch¦3ässer:abwasser¦6en:abwehr,athlet,barbar,eunuch,gewähr,heirat,jubiläum,madonna,manier,prolet,prälat,rebell,skriptum,soldat,syntax,tartar,tyrann,zyklop,bandit,demenz,fracht,gefahr,gegend,gracht,hoheit,jesuit,karenz,klient,magnet,planet,reform,regent,schiit,tracht,tugend,urform,ästhet¦6n:achsel,auster,beamter,bimmel,brezel,buddel,bummel,buttel,dattel,eichel,fackel,fessel,fiedel,folter,fussel,geisel,gondel,kammer,kandel,kanzel,kiefer,konsul,leiter,mandel,murmel,natter,nummer,pappel,primel,riffel,semmel,sichel,trauer,vesper,vetter,windel,ziffer,zimbel,zither¦4en:acht,arena,bahn,bett,dirn,diät,dogma,dorn,drama,faktum,farm,fink,firma,flut,furt,gams,held,herz,jagd,konto,last,leid,lump,magma,maid,mark,mast,mensa,narr,nerv,neun,null,pfau,pizza,plenum,poet,praxis,qual,radius,rast,reif,sauna,skala,verb,villa,wehr,welt,zyklus,eins,form,graf,hemd,herr,medium,norm,podium,thema,vakuum,zeit,zins¦4n:ader,lohn,oper¦8en:adressat,antiheld,asteroid,cafeteria,decklast,dividend,endpunkt,missetat,nutzlast,ohnmacht,paradigma,phantast,prozedur,schlacht,schlucht,straftat,unterart,vagabund,zuflucht,ambulanz,artothek,astronom,backform,debütant,deponent,dirigent,dummheit,exponent,fabulant,figurant,freiheit,freizeit,grobheit,halbzeit,hypothek,individuum,konsortium,musikant,nachfahr,nebentür,nennform,quadrant,referent,requisit,simulant,stipendium,toleranz,untugend,verbform¦6e:advent,akzent,aorist,asbest,attest,august,aushub,auslug,azeton,balsam,barsch,basalt,begehr,behelf,biotop,cocain,delfin,diadem,diktat,disput,emirat,export,extrem,frisör,gebräu,gehörn,geläut,genick,gepard,geröll,gespür,gestüt,grafit,granit,import,impuls,inzest,jawort,kanton,knirps,kobalt,kondom,kontor,kurier,lactat,leguan,meteor,monsun,patent,phonem,plural,podest,polier,portal,profit,rabatt,rektor,report,revier,ritual,scherz,schilf,schlot,signal,sketch,sopran,sphinx,streit,stress,strick,sulfid,talent,tausch,testat,tresor,türkis,urinal,vampir,verhau,verhör,visier,vorort,zement,zyklon,erwerb,plüsch¦5en:agenda,armada,asiat,bolid,bucht,enigma,figur,gunst,jacht,juwel,kalif,komet,lexikon,loggia,miliz,notiz,pacht,pirat,protz,psalm,punkt,spatz,stadion,stigma,streu,trauma,untat,werft,wucht,yacht,zutat,zwölf,agent,fahrt,front,fürst,gremium,prinz,schema,zentrum¦5s provocateurs:agent provocateur¦8e:aggregat,alphabet,antiquar,argument,artefakt,attentat,attribut,aufdruck,aufprall,bockbier,bratrost,dokument,dromedar,geschwür,gestrüpp,granulit,harlekin,haushalt,horizont,institut,integral,juwelier,kanonier,kraftarm,landwirt,lecithin,leichnam,marzipan,monument,nachhall,nadelöhr,offizier,original,paradies,phänomen,rechteck,resultat,rückgrat,schafott,sphäroid,standort,stauwehr,tamburin,tribunal,versteck,verzicht,vordruck,warmbier,zeppelin,zwölfeck,geräusch¦13s:air-condition,establishment,joint venture¦12s:aircondition,boogiewoogie,dreikäsehoch,portemonnaie¦7s:airline,atelier,bankier,biotest,biskuit,bricket,brikett,kanapee,caravan,carport,cartoon,chanson,charter,cockpit,darling,dessert,epsilon,exposee,feature,hashtag,hearing,holding,interim,joghurt,komfort,känguru,lametta,mobbing,musical,mustang,omelett,overall,persona,plissee,porträt,positiv,premier,pudding,release,requiem,ressort,service,sintiza,smoking,spaniel,starlet,süßklee,terrine,topspin,topstar,tsantsa,ukulele,upgrade,voucher,website¦7en:akrobat,analyst,andacht,delegat,denkart,festakt,gangart,hostess,kamerad,mailbox,minuend,nachhut,operand,pflicht,predigt,proband,präfekt,schluff,schmerz,wildsau,agronom,allianz,ammonit,diamant,elefant,favorit,gymnasium,impressum,islamit,kanzlei,kriterium,neuheit,papagei,passant,pfarrei,prophet,provinz,präsidium,schicht,symposium,universum,vorfahr¦3en:akt,album,alm,alp,art,aula,aura,box,bub,bär,datum,elf,gör,kur,kür,lava,ohr,tat,tuba,tür,uhr,virus,vita,zar,zeh,forum,liga,visum¦8se:albatros¦5ücke:albdruck,alpdruck,ausdruck,eindruck¦5se:alias,atlas,bonus¦5s:alien,audit,beton,bison,bluff,cloud,coach,conga,coupe,crack,creme,debüt,deern,dekor,delta,diner,drive,emoji,event,fazit,filet,flirt,gelee,genie,genre,glace,harem,heini,input,kajak,kanna,kanon,klick,level,limit,mafia,massa,match,menue,minna,model,moped,mädel,nicki,nylon,oldie,orbit,paper,profi,püree,queue,radar,salon,scene,sesam,shirt,sigma,slang,snack,speed,stick,store,swing,toast,token,treck,treff,trick,tweet,uroma¦9e:allomorph,apostolat,apostroph,austausch,bergfried,braunbier,charakter,erstdruck,fehldruck,fischwehr,grenadier,grießbrei,heißsporn,hängegurt,immergrün,inkrement,intervall,jahrzehnt,justitiar,kommentar,konkordat,labyrinth,liederjan,linksruck,nachdruck,pannacotta,passagier,protokoll,scharnier,segeltuch,sprechakt,stereotyp,stichwort,terpentin,trampolin,transport,vorbehalt,widerwort,zitteraal,überdruck,solarwind¦3s:alt,bar,bob,bot,dia,don,eck,fan,gag,gig,gin,hit,ich,jva,yak,jet,job,kat,kid,mp3,nva,oma,pdf,pin,pak,pop,pub,rot,rum,suv,set,sir,tag,tau,ted,tee,top,url,usp,uni,gnu¦5i:alumnus,papyrus,storno¦4sse:amboß,gebiße,imbiß,umriß¦5n:ammer,ampel,amsel,angel,assel,bauer,bayer,fabel,faser,feder,feier,fidel,gabel,insel,leber,leier,mauer,modul,nadel,nudel,order,orgel,regel¦10en:analphabet,autodidakt,enthusiast,freischütz,habilitand,kleinbauer,nachtigall,pharmazeut,richtpunkt,schlitzohr,stipendiat,streifjagd,wanderhirt,abiturient,assekuranz,bedenkzeit,bibliothek,delinquent,denunziant,diskrepanz,inspizient,konditorei,konkurrent,konkurrenz,konzipient,lexikothek,praktikant,protestant,rückfracht,springform¦13ümer:analphabetentum¦6ände:anbauwand,breitwand,fehlbrand¦12n:anerkenntnis,dunkelkammer,dunkelziffer,geheimnummer,hangelleiter,leuchtziffer,silberpappel,sondernummer,sprengkammer,steckmuschel,steckzwiebel,süßkartoffel¦14en:anmeldepflicht,grundrechenart,armeelieferant,büropraktikant,datenlieferant,forstassistent,hauptlieferant,hilfsassistent,ideenlieferant,laborassistent,pfarrassistent,pharmareferent,pressereferent,punktlieferant,regieassistent,sekundärtugend,stammlieferant,stofflieferant,stromlieferant,thronassistent,unterassistent,unterlieferant,warenlieferant,werbeassistent,wärmelieferant¦10e:apomorphin,aufenthalt,binnenmeer,fingerring,flachdruck,instrument,komplement,konkrement,manuskript,nimmersatt,penicillin,pensioniär,prägedruck,referendar,schandkerl,scharlatan,schlepptau,supplement,vorabdruck,waldschrat,wettbewerb¦7zes:appendix¦9en:architekt,dreckfink,feuerwehr,gegenlast,großbauer,integrand,interpret,kollegiat,kreuzdorn,mißheirat,nachricht,parkbucht,planetoid,solarfarm,substitut,vollmacht,wochenend,abgasnorm,adressant,akzeptant,assistent,brilliant,bummelant,bundesliga,discothek,diskothek,disponent,dissident,fabrikant,geheimtür,gewißheit,grundform,grundnorm,hintertür,informant,konfident,konsonant,krankheit,lieferant,liegezeit,mediothek,mikrothek,phonothek,plattform,präsident,querulant,spekulant,stalagmit,stimulanz,tragezeit,vordertür,wartezeit¦8ien:archivale,material,privileg¦11s:arrangement,association,chansonnier,fulltimejob¦2se:as¦14e:aschermittwoch,blasinstrument,separatabdruck¦6s:asthma,balkon,barbie,barrel,bassin,bikini,boccia,bonsai,busuki,cancan,charta,cinema,collie,cousin,design,dessin,dinner,dollar,double,dragée,faible,fixing,fondue,gospel,gratin,hangar,jogurt,junkie,kabuff,kaffee,karton,kumpel,laptop,lolita,metier,milieu,mokick,moslem,mousse,muschi,outfit,output,parfum,parfüm,piefke,plazet,puzzle,pythia,rallye,reling,schock,selfie,siesta,single,skript,slalom,sowjet,tablet,tandem,trikot,zaziki,tunnel,weblog,zombie¦2en:au¦4ände:aufwand,einband,verband,vorwand¦5üchte:ausflucht¦13n:ausziehleiter,bestellnummer,bratkartoffel,halbschwester,handelskammer,pellkartoffel,schwarzpappel,silberzwiebel,wandermuschel¦4e:bund,beet,bein,bier,blei,blut,bord,brei,cyan,ding,dutt,fest,fett,flor,flur,fund,föhn,gift,grad,gurt,hall,halt,harz,heer,hirn,hort,hund,jahr,keks,kerl,kern,klon,lack,laut,lift,mahl,meer,mohn,mond,moor,moos,mord,pakt,pech,pelz,pilz,raps,rest,ring,rost,salz,senf,takt,teer,tier,urin,wart,watt,wein,weiß,wind,wirt,zelt,zimt¦1äche:bach¦1äder:bad,rad¦1älger:balg¦1älle:ball,fall¦1änder:band,land,rand¦1änke:bank¦1ärte:bart¦9s:basilikum,boulevard,cabriolet,croissant,crossover,dekollete,evergreen,frikassee,greencard,hardcover,karussell,kommodore,konterfei,lifestyle,mannequin,monocoque,paparazza,petroleum,portmonee,privatier,reservoir,semikolon,sommelier,statement¦1ässe:baß,naß,paß¦3ten:bau¦1äusche:bausch,rausch¦4äte:beirat,vorrat¦4örter:beiwort,neuwort,paßwort¦7ümer:besitztum,herzogtum¦12e:bibliothekar,brennelement,durchschlupf,halluzinogen,kontrafagott,separatdruck,tausendschön¦5er:biest,brett,geist,gemüt,licht,kleid,viech¦11n:binärziffer,bohrspindel,brennnessel,drehspindel,gegenmutter,miesmuschel,strafkammer,trittleiter,wanderleber,wundklammer¦8es:blackbox,lipgloss,sandwich¦13er:bleichgesicht¦9n:bohrinsel,drehleier,endziffer,halbinsel,hemmgabel,kartoffel,schachtel,schleuder,schwester¦10i:bolschewik¦2sse:boß,riß¦2ände:brand¦2äute:braut¦10n:brennessel,heißmangel,kennziffer,lachnummer,seifenoper,stehleiter¦7n:bretzel,grandel,graupel,halfter,jungfer,klammer,klingel,krempel,morchel,muschel,nachbar,parabel,plunder,quaddel,trommel,trüffel,zwiebel¦2üder:bruder¦2ünste:brunst¦2üste:brust¦9älter:bruttogehalt¦1ücher:buch,tuch¦3se:bus¦1üsche:busch¦9er:bösewicht,gesträuch¦2s:cd,dj,fu,im,iq,ja,kz,lp,ob,pi,tu,wm,xi¦4s au lait:café au lait¦4s complets:café complet¦4s crème:café crème¦9den:zellulitis¦2öre:chor¦3ices:codex¦4ora delicti:corpus delicti¦8a vitae:curriculum vitae¦1ämme:damm,kamm¦1ärme:darm¦1äuser:daus,haus¦5äler:denkmal,grabmal,hochtal,quertal¦6a:diplom,internum,oxymoron,oxytonon,extremum¦14s:direct mailing¦17n:disziplinarkammer¦6anden:doktor¦8n:dollerei,hyperbel,karunkel,matrikel,metapher,partikel,präambel,schaufel,schulter,schüssel¦5ä:domina¦1örfer:dorf¦17ässer:dreiviertelliterfaß¦1ünste:dunst,kunst¦4änke:eckbank¦2er:ei¦13e:einblattdruck,nitroglycerin,schlüsselbund,unteroffizier,zentralabitur,nebengeräusch,pfeifgeräusch¦7ähne:einweghahn¦7ände:erzählband¦5äste:fahrgast¦5ünste:fahrkunst¦5änder:farbband,messband,hochland¦1ässer:faß,wasser¦2öhe:floh¦2üche:fluch¦2üchte:flucht¦6ögen:fragebogen¦2öste:frost¦1üße:fuß¦7änder:förderband,sammelband,schnürband,binnenland¦18n:fünfprozentklausel¦5öne:ganzton,halbton,hochton,misston,summton¦1äste:gast¦1äule:gaul¦3älter:gehalt¦7ünde:geheimbund,städtebund¦7äte:geheimrat¦3era:genus¦5äle:general¦10er:geschlecht¦6ülste:geschwulst¦7er:gesicht,schwert,urviech¦8er:gespenst,regiment¦2äser:glas,gras¦1ötter:gott¦2äber:grab¦2äben:graben¦7i:graffito,peperone¦6äche:grenzbach¦5ächte:großmacht¦5ägde:großmagd¦5ütter:großmutter¦2üße:gruß¦1üter:gut¦1ähne:hahn,kahn,zahn¦1ämmer:hammer,lamm¦1ände:hand,wand¦1ändel:handel¦1äupter:haupt¦1äute:haut¦4öge:herzog¦17a:hochfrequenzlexikon¦9es:homedress,nessessär¦10se:homunkulus,rhinozeros¦1örner:horn,korn¦6äler:hospital,längstal,nebental¦1übe:hub¦1üte:hut¦4äle:hörsaal¦4ines:imago¦7ien:immobil,kleinod,mineral,utensil¦3izes:index,kodex¦5ien:indiz¦16en:inkassovollmacht,spezialvollmacht,anwaltsassistent,arbeitsassistent,energielieferant,ferienpraktikant,fleischlieferant,handelsassistent,kanzleiassistent,motorenlieferant,pflichtassistent,projektassistent,quellenlieferant,röntgenassistent,schiffsassistent,schmucklieferant,schnittassistent,spezialassistent,trainerassistent,traubenlieferant,zeichenassistent¦3it:inuk¦8änder:isolierband,ausfuhrland¦11e:jahrtausend,nieselpriem,reitturnier,sachverhalt,schlepplift,schmierfett¦4s fixes:jour fixe¦1älber:kalb¦1ämpe:kamp¦3äle:kanal¦6äle:kardinal¦4er:kind,lied,nest,rind,leib,weib¦6sen:kirmes¦6änder:klebeband,grenzland¦5te:klima¦2öster:kloster¦2ötze:klotz¦1öche:koch¦9ächte:kolonialmacht¦8sse:kompromiß¦18e:kontrollinstrument¦2äne:kran,plan,span¦2änze:kranz¦2äuter:kraut¦1ühe:kuh¦5örter:kurzwort,lehnwort,passwort,reimwort¦6äne:ladekran,sägespan¦1äuse:laus,maus¦3er:lid,ski¦3ites:limes¦1öcher:loch¦1üste:lust¦1ächte:macht,nacht¦1ägde:magd¦1ägen:magen¦1ängel:mangel¦5zes:matrix¦1äuler:maul¦5ühe:melkkuh¦4änder:meßband¦4öne:mißton¦3i:modus¦1ünder:mund¦4zi:musikus¦1ütter:mutter¦1ägel:nagel¦17e:nichtangriffspakt¦3ina:nomen¦1öte:not¦3ä:nova¦3a:novum,rom¦1s:o¦12äte:oberstudienrat¦7se:oktopus¦15s:one-night-stand¦2era:opus¦3äste:palast¦8i:paparazzo¦10ände:pergamentband¦9 mobiles:perpetuum mobile¦2ähle:pfahl¦2änder:pfand¦7a:pharmakon¦8änke:planierbank¦6üße:plattfuß¦1ötte:pott¦6zien:präsens¦1äte:rat¦5ändel:raufhandel¦6ümer:reichtum¦6älle:reitstall¦6ien:reptil¦5ja:romni¦1össer:ross¦4n beten:rote bete¦4n-bete-salate:rote-bete-salat¦5änke:rundbank¦5ände:rückwand¦1äle:saal¦8äuser:sachsenhauser¦1äcke:sack¦1äfte:saft¦1ärge:sarg¦7ta:sarkoma¦1ättel:sattel¦1äue:sau¦3ächte:schacht¦9änke:schlachtbank¦4össer:schloß¦4äpse:schnaps¦4üre:schnur,schwur¦5ängste:schulangst¦6änke:schulbank¦4ämme:schwamm¦4äne:schwan¦4änze:schwanz¦6im:seraph¦4i:sinto,topos¦1öhne:sohn¦2äße:spaß¦7örter:sprichwort¦2älle:stall¦2ämme:stamm¦6i:stimulus,terminus¦2örche:storch¦4ies:story¦3ände:strand¦3äuße:strauß¦7ächte:streitmacht¦1üchte:sucht¦4ömeter:tachometer¦1äler:tal¦1änze:tanz¦1uareg:targi¦4ora:tempus¦3öre:tenor¦8ora:textkorpus¦1öne:ton¦17s:transchierbesteck¦2öge:trog¦1ürme:turm¦2zera:ulkus¦3üste:unlust¦1äter:vater¦4ünde:verbund¦15e:vierfarbendruck¦1ölker:volk¦5ina:volumen¦13se:vorkenntnisse¦10ächte:walpurgisnacht¦3chnachten:weihnacht¦6ätten:werkstatt¦6er:wiking¦4üste:wollust¦1örter:wort¦1ürmer:wurm¦1äune:zaun¦5äufte:zeitlauf¦6ta:zeugma¦1ölle:zoll¦1üge:zug¦3ächse:zuwachs¦2e:öl¦5ten:abbau,umbau¦4üsse:abfluss,erdnuss,rohguß¦6üsse:abschluss,haselnuss,kokosnuss,überfluß¦15en:aktienspekulant,archivassistent,berufsdissident,bundespräsident,bühnenassistent,eiweißlieferant,firmenlieferant,gemüselieferant,grafikassistent,heereslieferant,kameraassistent,kassenassistent,kopierassistent,kostümassistent,kriegslieferant,kriminalpolizei,kupferlieferant,lebensassistent,lehrerassistent,markenlieferant,papierlieferant,pflegeassistent,privatassistent,punktelieferant,reichspräsident,reifenlieferant,sexualassistent,silberlieferant,sonderassistent,sozialassistent,systemlieferant,wasserlieferant,zementlieferant,zuckerlieferant¦12en:altassistent,chordirigent,gaslieferant,hoflieferant,repräsentant,sperrschicht,sympathisant,tonassistent,unterschicht¦19en:animationsassistent,baugruppenlieferant,binomialkoeffizient,braunkohlelieferant,bühnenbildassistent,direktionsassistent,ersatzteillieferant,forschungsassistent,immobilienassistent,kraftstofflieferant,kühlmittellieferant,regierungsassistent,sauerstofflieferant,treibstofflieferant¦18en:apothekenassistent,apothekerassistent,fraktionsassistent,funktionsassistent,hauptfettlieferant,hochschulassistent,ingenieurassistent,lehramtspraktikant,maschinenassistent,vertriebsassistent,vorstandsassistent¦6ten:aufbau,ausbau,neubau¦5üsse:ausfluß,einfluß¦17en:auslandslieferant,betriebsassistent,einkaufsassistent,exklusivlieferant,gerichtsassistent,getreidelieferant,getränkelieferant,kriminalassistent,lehramtsassistent,materialassistent,nahrungslieferant,nutzholzlieferant,programmassistent,prüfungsassistent,rettungsassistent,rohstofflieferant,vertragsassistent¦21en:ausstattungsassistent,außenhandelsassistent,einstellungsassistent,entwicklungsassistent,hauptenergielieferant,informationsassistent,lebensmittellieferant,lehrrettungsassistent,luftrettungsassistent,postbetriebsassistent,universitätsassistent¦20en:bibliotheksassistent,hauptmetalllieferant,hauptzuckerlieferant,kohlenstofflieferant,nachrichtenlieferant,produktionsassistent,trinkwasserlieferant,unterrichtsassistent,verwaltungsassistent,wasserkraftlieferant,wirtschaftsassistent,zahlmeisterassistent¦13en:bierlieferant,büroassistent,chefassistent,diätassistent,eierlieferant,fachassistent,filmassistent,großlieferant,hauslieferant,holzlieferant,jungassistent,lehrassistent,modeassistent,oberassistent,pelzlieferant,postassistent,prüfassistent,rohrlieferant,salzlieferant,sonderschicht,sozialschicht,vizepräsident,weltlieferant,wolllieferant,zollassistent¦1öden:boden¦23en:dokumentationsassistent,feldforschungsassistent,nahrungsmittellieferant¦7üsse:durchfluß¦12äuser:einfamilienhaus¦24en:filmproduktionsassistent¦2üsse:fluss¦22en:fremdsprachenassistent,hauptbaumwolllieferant,staatsanwaltsassistent¦1ärten:garten¦3üsse:genuß¦1üsse:guß,kuß,nuss¦5äuser:hochhaus,kühlhaus,wohnhaus¦29en:justizvollstreckungsassistent¦6sse:kongreß¦28en:steueruntersuchungsassistent¦6äuser:treibhaus¦3änder:umland¦8ten:unterbau"
      }
    }
  };

  // uncompress them
  Object.keys(model$3).forEach(k => {
    Object.keys(model$3[k]).forEach(form => {
      model$3[k][form] = uncompress(model$3[k][form]);
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

  // hand-curated conjugations for the highest-frequency irregular verbs.
  // the trained models lose some of these to compression, and they are
  // too important to get wrong.
  // person order: [ich, du, er/sie/es, wir, ihr, sie]
  const irregulars = {
    sein: {
      present: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
      past: ['war', 'warst', 'war', 'waren', 'wart', 'waren'],
      subj1: ['sei', 'seist', 'sei', 'seien', 'seiet', 'seien'],
      subj2: ['wäre', 'wärst', 'wäre', 'wären', 'wärt', 'wären'],
      imperative: ['sei', 'seid'],
      pastParticiple: 'gewesen',
      presentParticiple: 'seiend',
    },
    haben: {
      present: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
      past: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'],
      subj2: ['hätte', 'hättest', 'hätte', 'hätten', 'hättet', 'hätten'],
      imperative: ['hab', 'habt'],
      pastParticiple: 'gehabt',
    },
    werden: {
      present: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
      past: ['wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden'],
      subj2: ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden'],
      imperative: ['werde', 'werdet'],
      pastParticiple: 'geworden',
    },
    tun: {
      present: ['tue', 'tust', 'tut', 'tun', 'tut', 'tun'],
      past: ['tat', 'tatest', 'tat', 'taten', 'tatet', 'taten'],
      subj2: ['täte', 'tätest', 'täte', 'täten', 'tätet', 'täten'],
      pastParticiple: 'getan',
      presentParticiple: 'tuend',
    },
    wissen: {
      present: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'],
      past: ['wusste', 'wusstest', 'wusste', 'wussten', 'wusstet', 'wussten'],
      subj2: ['wüsste', 'wüsstest', 'wüsste', 'wüssten', 'wüsstet', 'wüssten'],
      pastParticiple: 'gewusst',
    },
    essen: {
      present: ['esse', 'isst', 'isst', 'essen', 'esst', 'essen'],
      past: ['aß', 'aßest', 'aß', 'aßen', 'aßt', 'aßen'],
      subj2: ['äße', 'äßest', 'äße', 'äßen', 'äßet', 'äßen'],
      imperative: ['iss', 'esst'],
      pastParticiple: 'gegessen',
    },
    lesen: {
      present: ['lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'],
      past: ['las', 'lasest', 'las', 'lasen', 'last', 'lasen'],
      imperative: ['lies', 'lest'],
      pastParticiple: 'gelesen',
    },
    geben: {
      present: ['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'geben'],
      past: ['gab', 'gabst', 'gab', 'gaben', 'gabt', 'gaben'],
      subj2: ['gäbe', 'gäbest', 'gäbe', 'gäben', 'gäbet', 'gäben'],
      imperative: ['gib', 'gebt'],
      pastParticiple: 'gegeben',
    },
    kommen: {
      present: ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kommen'],
      past: ['kam', 'kamst', 'kam', 'kamen', 'kamt', 'kamen'],
      subj2: ['käme', 'kämest', 'käme', 'kämen', 'kämet', 'kämen'],
      imperative: ['komm', 'kommt'],
      pastParticiple: 'gekommen',
    },
    heißen: {
      pastParticiple: 'geheißen',
    },
    // modal verbs
    können: {
      present: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'],
      past: ['konnte', 'konntest', 'konnte', 'konnten', 'konntet', 'konnten'],
      subj2: ['könnte', 'könntest', 'könnte', 'könnten', 'könntet', 'könnten'],
      pastParticiple: 'gekonnt',
    },
    müssen: {
      present: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'],
      past: ['musste', 'musstest', 'musste', 'mussten', 'musstet', 'mussten'],
      subj2: ['müsste', 'müsstest', 'müsste', 'müssten', 'müsstet', 'müssten'],
      pastParticiple: 'gemusst',
    },
    dürfen: {
      present: ['darf', 'darfst', 'darf', 'dürfen', 'dürft', 'dürfen'],
      past: ['durfte', 'durftest', 'durfte', 'durften', 'durftet', 'durften'],
      subj2: ['dürfte', 'dürftest', 'dürfte', 'dürften', 'dürftet', 'dürften'],
      pastParticiple: 'gedurft',
    },
    mögen: {
      present: ['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'],
      past: ['mochte', 'mochtest', 'mochte', 'mochten', 'mochtet', 'mochten'],
      subj2: ['möchte', 'möchtest', 'möchte', 'möchten', 'möchtet', 'möchten'],
      pastParticiple: 'gemocht',
    },
    wollen: {
      present: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'],
      past: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
      subj2: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
      pastParticiple: 'gewollt',
    },
    sollen: {
      present: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'],
      past: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
      subj2: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
      pastParticiple: 'gesollt',
    },
    // mixed verbs — weak endings, strong vowel change
    denken: {
      past: ['dachte', 'dachtest', 'dachte', 'dachten', 'dachtet', 'dachten'],
      subj2: ['dächte', 'dächtest', 'dächte', 'dächten', 'dächtet', 'dächten'],
      pastParticiple: 'gedacht',
    },
    bringen: {
      past: ['brachte', 'brachtest', 'brachte', 'brachten', 'brachtet', 'brachten'],
      subj2: ['brächte', 'brächtest', 'brächte', 'brächten', 'brächtet', 'brächten'],
      pastParticiple: 'gebracht',
    },
    kennen: {
      past: ['kannte', 'kanntest', 'kannte', 'kannten', 'kanntet', 'kannten'],
      pastParticiple: 'gekannt',
    },
    nennen: {
      past: ['nannte', 'nanntest', 'nannte', 'nannten', 'nanntet', 'nannten'],
      pastParticiple: 'genannt',
    },
    rennen: {
      past: ['rannte', 'ranntest', 'rannte', 'rannten', 'ranntet', 'rannten'],
      pastParticiple: 'gerannt',
    },
    brennen: {
      past: ['brannte', 'branntest', 'brannte', 'brannten', 'branntet', 'brannten'],
      pastParticiple: 'gebrannt',
    },
    senden: {
      past: ['sandte', 'sandtest', 'sandte', 'sandten', 'sandtet', 'sandten'],
      pastParticiple: 'gesandt',
    },
    wenden: {
      past: ['wandte', 'wandtest', 'wandte', 'wandten', 'wandtet', 'wandten'],
      pastParticiple: 'gewandt',
    },
  };

  const inseparable = /^(be|emp|ent|er|ge|miss|ver|zer|wiederer)/;

  // 'verstehen' → ver + stehen,  'aufstehen' → auf + stehen
  const find = function (str) {
    if (irregulars.hasOwnProperty(str)) {
      return { base: irregulars[str], prefix: '', separable: false }
    }
    let m = str.match(inseparable);
    if (m && irregulars.hasOwnProperty(str.substring(m[0].length))) {
      return { base: irregulars[str.substring(m[0].length)], prefix: m[0], separable: false }
    }
    for (let i = 0; i < prefixes.length; i += 1) {
      let p = prefixes[i];
      if (str.startsWith(p) && irregulars.hasOwnProperty(str.substring(p.length))) {
        return { base: irregulars[str.substring(p.length)], prefix: p, separable: true }
      }
    }
    return null
  };

  // returns conjugated forms for one tense, or null.
  // tense: present | past | subj1 | subj2 | imperative | pastParticiple | presentParticiple
  const getIrregular = function (str, tense) {
    let found = find(str);
    if (!found || !found.base[tense]) {
      return null
    }
    let { base, prefix, separable } = found;
    let forms = base[tense];
    if (typeof forms === 'string') {
      // participles - 'auf' + 'gestanden', but 'ver' + 'standen'
      if (tense === 'pastParticiple' && separable === false && prefix) {
        return prefix + forms.replace(/^ge/, '')
      }
      return prefix + forms
    }
    return forms.map(f => prefix + f)
  };

  // form → infinitive, for root-recovery
  let toInfinitive = {};
  Object.keys(irregulars).forEach(inf => {
    Object.keys(irregulars[inf]).forEach(tense => {
      let forms = irregulars[inf][tense];
      forms = typeof forms === 'string' ? [forms] : forms;
      forms.forEach(w => {
        if (!toInfinitive.hasOwnProperty(w)) {
          toInfinitive[w] = inf;
        }
      });
    });
  });

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
  const toPastParticiple$1 = function (str) {
    // always weak
    if (str.endsWith('ieren')) {
      str = str.replace(/en$/, 't');
      return str //no 'ge-'
    }
    str = doSuffix$1(str);
    str = doPrefix$1(str);
    return str
  };

  // console.log( toPastParticiple("schwimmen"), "geschwommen")

  let { presentTense: presentTense$1, pastTense: pastTense$1, subjunctive1: subjunctive1$1, subjunctive2: subjunctive2$1, imperative: imperative$1, presentParticiple: presentParticiple$1, pastParticiple: pastParticiple$1 } = model$3;

  const doEach = function (str, m, tense) {
    let irr = getIrregular(str, tense);
    if (irr) {
      return {
        first: irr[0],
        second: irr[1],
        third: irr[2],
        firstPlural: irr[3],
        secondPlural: irr[4],
        thirdPlural: irr[5],
      }
    }
    return {
      first: convert(str, m.first),
      second: convert(str, m.second),
      third: convert(str, m.third),
      firstPlural: convert(str, m.firstPlural),
      secondPlural: convert(str, m.secondPlural),
      thirdPlural: convert(str, m.thirdPlural),
    }
  };

  const toPresent = (str) => doEach(str, presentTense$1, 'present');
  const toPast = (str) => doEach(str, pastTense$1, 'past');
  const toSubjunctive1 = (str) => doEach(str, subjunctive1$1, 'subj1');
  const toSubjunctive2 = (str) => doEach(str, subjunctive2$1, 'subj2');

  const toPresentParticiple = (str) => {
    return getIrregular(str, 'presentParticiple') || convert(str, presentParticiple$1.presentParticiple)
  };
  const toPastParticiple = (str) => {
    let irr = getIrregular(str, 'pastParticiple');
    if (irr) {
      return irr
    }
    if (pastParticiple$1) {
      return convert(str, pastParticiple$1.pastParticiple)
    }
    return toPastParticiple$1(str)
  };
  const toImperative = (str) => {
    let irr = getIrregular(str, 'imperative');
    if (irr) {
      return { secondSingular: irr[0], secondPlural: irr[1] }
    }
    return {
      secondSingular: convert(str, imperative$1.singular),
      secondPlural: convert(str, imperative$1.plural),
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
      toPastParticiple(str),
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

  const fromPastParticiple$1 = function (str) {
    // always weak - ieren
    if (str.endsWith('iert')) {
      str = str.replace(/iert$/, 'ieren');
      return str //no 'ge-'
    }
    str = doSuffix(str);
    str = doPrefix(str);
    return str
  };

  // console.log(fromPastParticiple('ereifert'))

  let { presentTense, pastTense, subjunctive1, subjunctive2, imperative, presentParticiple, pastParticiple } = model$3;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse(m[k]);
      return h
    }, {})
  };

  let presentRev = revAll(presentTense);
  let pastRev = revAll(pastTense);
  let subjRev1 = revAll(subjunctive1);
  let subjRev2 = revAll(subjunctive2);
  let impRev = revAll(imperative);
  let presentPartRev = reverse(presentParticiple.presentParticiple);
  let pastPartRev = pastParticiple ? reverse(pastParticiple.pastParticiple) : null;

  const allForms = function (str, form, m) {
    if (toInfinitive.hasOwnProperty(str)) {
      return toInfinitive[str]
    }
    if (m.hasOwnProperty(form)) {
      return convert(str, m[form])
    }
    return str
  };

  const fromPresent = (str, form) => allForms(str, form, presentRev);
  const fromPast = (str, form) => allForms(str, form, pastRev);
  const fromSubjunctive1 = (str, form) => allForms(str, form, subjRev1);
  const fromSubjunctive2 = (str, form) => allForms(str, form, subjRev2);
  const fromImperative = (str, form) => allForms(str, form, impRev);
  const fromPresentParticiple = (str) => {
    return toInfinitive[str] || convert(str, presentPartRev)
  };
  const fromPastParticiple = (str) => {
    if (toInfinitive.hasOwnProperty(str)) {
      return toInfinitive[str]
    }
    if (pastPartRev) {
      return convert(str, pastPartRev)
    }
    return fromPastParticiple$1(str)
  };

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

  const toRoot = function (str) {
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
  // console.log(toRoot('saurerer'))

  // fallback rules, when no trained model is available
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
    if (model$3.nouns && model$3.nouns.plural) {
      return convert(str, model$3.nouns.plural)
    }
    for (let i = 0; i < rules.length; i += 1) {
      let [from, to] = rules[i];
      if (str.endsWith(from)) {
        return str + to
      }
    }
    return str + 'n'
  };
  const toPlural = function (str) {
    return {
      one: firstForm(str)
    }
  };

  let pluralRev = model$3.nouns && model$3.nouns.plural ? reverse(model$3.nouns.plural) : null;

  // fallback rules, when no trained model is available
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

  const toSingular = function (str) {
    if (pluralRev) {
      return convert(str, pluralRev)
    }
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

  const allAdj = (inf) => Object.values(inflectAdj(inf));
  const allNoun = (sing) => [sing, toPlural(sing).one];

  var methods = {
    verb: {
      all,
      toPresent,
      toPast,
      toSubjunctive1,
      toSubjunctive2,
      toImperative,
      toPastParticiple,
      toPresentParticiple,
      fromPresent,
      fromPast,
      fromSubjunctive1,
      fromSubjunctive2,
      fromImperative,
      fromPresentParticiple,
      fromPastParticiple
    },
    adjective: {
      inflect: inflectAdj,
      toRoot: toRoot,
      all: allAdj
    },
    noun: {
      toPlural,
      toSingular,
      all: allNoun
    }
  };

  // generated in ./lib/lexicon
  var lexData = {
    "Adjective": "true¦0:07R;1:093;2:08Q;3:07N;4:07J;5:072;6:08L;7:06E;8:03M;9:08A;A:07X;B:08T;C:078;D:033;E:08O;F:07Q;G:07Y;H:01G;I:077;J:08X;K:032;a03ObZYcZQdY1eV5fSQgQ8hO0iM6jLXkJ1lHPmG7nFGoEWpD3quCWrBFs74t62u30v1Uw0IzUäTödip3übL;eLriggM1;l,rL;alWMdimensDCf05VgPhöBlebensGXnä042regiYYsNtLwin08Bzeu06Q;eJTrL;a01Xi046;chLe08H;aQ0uSH;a02YrIJ;quatV8rmeHEußH;a06e00iZollJuTwMähLügeHD;!lb1mb1;angQeL;ckOiLrgK;dY0fLgetRRt;aGelL;ha8l0sJ;entfremdEgeVYl0;ha8l0sw086;ch04Xf8YgOsammenL;geMhangLklappb1;l0sl0;s03Owürfe7;eLriffsWX;knöp8rei085;eGYg07Kn053rkZ2v075;itOllZ1ntMrL;faA7knirWVreiR7schli068;nersSXrL;al,ifug3;gLl0;e0NlA;gDhLrt,ubT2;l032m,nl0;a0Ne0Bi00oTuNähMüL;nsch059rde06Mst;lb1rscD;nLtentZF;dMschL;gV8l0;!erL;b1hü00DsLvo5;am,c00A;chW0hNlkenMnneYQrtL;geHYkarg,l0;l0verhaED;lMnL;bVOsitQ3;beLgen05Qtemper9verdWK;d058hütE;derTedergebUKlQnOrLss04UtQ0;kLr,sG;lichkeitsLsFu064;fr03LgeHP;dLtS;elwAschief;dMlenL;l0ss031;!fr03G;le00FsL;pruch044t043;hViQltOrNsMttL;er072;ensH8td059;beBEt72;beLfr039ge03Qk04PoPOwe004;k05Grüh07C;chOsungsgeNtLß;!hergeho7verL;brO5zwei04W;buVImUE;!gSF;muMIrl0;ag01CcShPrOsL;chMserL;dSJfe06Qs036;b1ecB;m,tHC;lMrL;!hOZn03O;bURfr07Al0w06G;hsFkH;a0Pe01iWoL;g7KlSrL;bePdHe12hOlNne03QsLt11urteilsJwurfsXL;chLtXC;ne5riftTW;a067etz04S;aV0erse067;hal02Zla3FstL;im06Ora8;ksMlLumFR;!bUFe00HkM1sP8t8A;d04Ffr02H;eMole073sLt3;iWVue5;lLrt;beLfaG;acM7fa88suCW;getationsa06Oheme4rL;a05b03d02ein045f00gl01AhYkUlSmRsOtrMwLzwN9ände056;anYDer065itwEorr2un05L;aLe064;c06HgTFuensX2;chMe043if8tL;e05QoRMre05Pändnis04O;oll2ä068;ei05FögensA7;etV7ie049oL;bt,g2;aMehrsLoh7raf05W;beruhi03QrAsc03O;te6ufsL;fT9oOC;aCGeiLängnP6;r02XßuTF;rSQügL;b1uTP;atTFutXW;al,iLlü05V;esTDss2tTD;bscheu02Vc002ltEntwortungsL;bIFl0vo5;ri04LteX8;feX7lt01Zm2KnNrL;a7bDUcool,d03JinLlaubG6;al,ös;a29be1Od1Me1Hf1Dg0QheilWEiversW1k0Nl0Lm0Kn0JorthodBJp0HqL5r0Es0Bt05umsM6vRwOzMüberL;brüc00Wle039se053;eitgSQuL;f5VstW3;ahr,e026iLohl;lKWrL;ksFsG;erPoL;lKTrL;berMAeMherO1stVXtL;eilD;ingenKR;blü05BdSfRge034hQkraLVlSWmOr8PsMwec000zLänOPöffentlQR;i02Aol7;chä059tLucB;aTIeFZ;ei04FiLutEäh7;nOKtO6;eI0of8ül7;rRWälTK;a04Jie4oY8ün4;alEFerMrL;aXXeu;beNeMg005haltsLrepräsEDschei048;am,bSS;ntwicke7rn02U;le02KwuHLzM4;aMchLi01Wo00O;aLWei048laXRön;chgRZgb1n8ubH;as9eLu02C;cBflekt9iLnt03M;f,n;opI0rL;ak9CoFPäz8T;a045o2Aütz;itteZDoJN;autHiL;ebNGm02X;lMoL;llG6mfoG3nK5rrF7;ar,ug;eLlAut;b05dW1eNVf03h00kZleYnWo04HpfLWrTsQtOwNzL;og2wuAVähLüNS;lt,mt;eiBiß,ol7;ei7rL;ö11ü02E;chMittEtLu01T;ra8ö6üm;ic04Emin04Eor2ütW8;a01EeL;chtLge7i046;!ferX6;au,ieLutW4;rt,ßb1;g2r4;lä6ürW1;a0TeMinNEoLö6;be7rsF;iVYm03YuH;ra01KährL;!dE;et2iNDor2raucBuS5;aNeMrL;oDNu00T;hYIin;ir,llJ;b2cBhrKingeschrän03WntschOrL;fMhö6k01TleJSschroNVwL;a00SünS4;a5Fül7;iKYlo01FulJP;anYVenYVicBurchL;fYLscha040;a03f01gZhWkVlUmTnVIquWQrRsOteiYwMzahlL;b1t;aLoh4uG5;cBf4B;chMonn2pie7tL;im03EäWF;eid2o06we6äJG;eR6üL;ckWh6;an4er03G;aZie01C;an4lKEümWU;eLolf2;lLrrRM;li00S;a017lK0rL;enV3üWY;a9IlUNriL;eJ4stE;bLcIR;siQT;bQchWLngeNuL;fLsgegPP;geforMAhQDmeY8;br00AfocNVmeMneZRtaL;stE;ldEss2;dVBgegoLse029;lt2;fangrAkLnacIHsJ9weltbFD;eh01HäJ9;a0Ie0Bhe0Ai06oZrOuMöL;lpQQneUIrO3;gendLrbuOQ;ha8sF;aQeOiNoMäLüb;ge,neU5;ck2sYS;ebDnk023st,umES;nnLu004;b1sJF;ditionNgb1nsLumD;alp00CitCkontiG0pL;a018oDW;e5sL;bEXrA;dQlOtL;!alHFenblMgeL;bOZglau00A;aß,eiG;eGYlL;!kühn;geweiBkrTUmüZAschiWI;efLlUY;!beMgeLschwarz;frOSkQ6;trü002weZM;rm3;ilQl020mpOnNrLuH;minLrO6tiU2;al,gP0;denziKNor3;erament008orL;al,är;b1erBKnWLwe5V;deA7kY0lB3nNpfHteVUuL;bLsend00S;!stuBI;genti3zbegeisP6;a3Mch26e1Pi1Gk1Ema6o16p0OtUuQystemPäNüL;ddZFffiYRndDßL;!sauH;kS4urefL;e015r01U;konfo01Ql0;bNchtMgW1kzeZYpLrjeX5;erb,plemCS;ha8krT5;atom1jeX2stanRIt001;a07e03iYoVrOuMähleT7örBNüL;ckw00TmpM3;bA1feVEmm,ndPBpMVrL;!mJ;aOeNiMohduB2ukturL;e5scYS;kt,nGU;bsFng;fLpaDJ;b1fLmildWA;!r01E;ckLlz,ß00N;nü7BsL;auHt01E;lNmmMnkL;fR0rA;bOPuOC;ecBgV2lLvo5;!os;iMrLuCL;bensB6eotyp,il;l,nL;a7eSLrA;ateUTbZDdtbekYThlU8mmvX1ndPrNtMuL;bJnXQ;iQZtD;k,r,tL;beTBkl1;esLfe007ha8ortAD;bB5gNO;a01eXiUlitterSoRrNuMät,üL;lmaschinRWrb1;kDrl0;achNuLöXM;c00SngL;beT3ha8;geWPl0un84;nt8GrtC;fLn006;aseLTr00L;eLnd3WrituK1tz;gelLlJ;blRXg00O;iAOkNndYZrMs00FziL;alW3e5;mE2rangG7;takDCulI;lZTrsF;g97lRnPrgNuverän,ziL;alLokuDJ;!l8V;enLl0sF;fr008l0vo5;deYNnenL;a003gebräu4kl1;ch,iX0;aLizzKrupe89urrYG;l1ndalLP;chRegQgnifika4lOJmPnNtL;tLuI;eTSsF;gCXnL;bildDgMRl0vo5;pYGult7Q;esgewQWrA;erheitsLtb1;bC5rele2F;eZgenYRhYiVkundUlPnMparXSquLYriIAssDxLßD;ue5y;il,krTNsLtiJA;ationLi5F;e5slüs7Y;bstMeV1tL;en,sF;bBXgeMl0zufL;riGL;mWNrTGsUC;enTJär;cBdenMtenL;laTIverkGI;!maZN;enW6nsuchEF;krQTlenL;l0vVD;a0We0Ui0Ql0Im0Dn0Ao09r04uYwMätzSBön,üL;ch7KlJRttH;aUeOindNuLül;l,ngL;ha8l0vo5;elJ;iVHrL;!beNeMkrQKrAverL;lMDwuSN;l0rF2;hHXsESwafL;fnE;ch,nLrz,tzD;gHzwedW5;bwY4lMssLtGUßL;beRBfeY8;dMfrYWrYZterL;frYVlaSW;beLenJl0;lMFwuB5;anSJeNiMoLullK;ff,t04;ll,ttwXW;ckDibL;fOFgeUP;kolM9nuSB;eLöd;eLll;frYKwePK;aNeLieUUuckVV;ichM9lN7rzL;enXFfrYHha8l0vo5;cLl;hOUkD;aNeMiL;cBmm;cBiIS;chOfMgb1nLu;gKk;l0tL;runk2;trYA;ckNer,kanJSzoL;id,pL;hr2;!salD;el,inLmKrzD;b1tBY;dNlMmR6rLttKudIG;f,ma4;kDldJ2;enfJAha8stoffaXU;chSfTUgKkraRlQmtwAnPtNuL;bLdu7DerDT;er,löd;tLzKK;!elX2;dQJft,itPL;buKUopp,zl0;l,meH9;gKHte;a0TeWiSoQuOätsLEüL;ckLde,pLD;geLsichtsVO;biGQkML;dim8KhLinJ5st0JtschWT;el0mrA;buWSh,stJtL;!zfreG;chtuR3esenNgMsL;ikorAka4;id,or0;gr6Lha8;a0Echt09d08e5flexCg02i00kYlUnTpRsNueNQvoluNAzL;eptLiprok;frX9iv;iMolWCpektLtl0;abVQl0vo5;dLsAZ;e4u3;arVMetA0rLuBE;eV9o7RäsSS;iAVomm9tVK;aNeMigiL;onTAös;va4;tCxt;t3urL;re4sC;buQJf,n,zLßW5;b1l0vo5;eNiMl0reUZuL;lR2ngT2;erun6Eon3strV6;lMnL;erIrA;l0rQK;a9ZegeSOuzH0;!sL;extrPGgeMl56radL;ik3;lDKrL;icBX;ktiMlL;!isUV;onO9v;biUDdiRffin9pPsOtNuL;!cEMh,schL;aW9ha8;iFRl0sF;a4ch,tl0;id,pL;eldüNY;al,k3oaRK;aNeLietschvergnüTH;er,rL;gestrei8schnittsgelähVS;droph33lLntitI;iLvo5;fB8tL;atCäB0;a11e0Vf0Sh0Ri0Ql0Mo0BrPsychoOuL;blikumsMdelnaLnMZppKr,tzmuntH;cVRß;wiQW;g2soRB;a04e01iZoPunkM9äLüSP;dikImienNseMzL;is;nt,rvI;begünsOFfrVQ;bSduR2fQgrOletKmNnom3QpLvinzRWzentu3;ortLpenM3;ionEX;iJ9pt;ammgeLeTR;mIEs5Y;an,essLitU1;ioRNor3;at,lemL;gJ1l0o4G;mLnzipRMvTE;itCär;isLkN7ziGZ;geLwe6;buJ9krö4;chtLPkLxi5F;tikTR;lSmpGUp86rRsNtenL;tLzRE;!ie5;itCsKtL;hDHlagPZmoMnatLopLF;al,iKM;deMLrt3;toJös;ar,ivaGSyL;gLm7Oph1Z;am,on3;aLump;kInMtLusF9zeEG;inbloS2t8L;gHNl0vo5;ekGOka4;antasieSVrasKänomen3;eilschQWlLänTN;egeFTichtL;b70gHI;da4jorInPrL;fNiphHmMplex,sLv58zeJU;is8FoQR;aI8utT3;eUEid;et90ibT2;aALpVrRsOtMusL;ch3eO9;e4schL;en64n64;sLtor3;abSWiL;eSSon9v;aNeDVtL;eiLikKJ;in2Il0;dSnoFHsKAt;i7Ap0E;b02ff00kYll,mWnkHXpTrMstL;dRNmitteldRN;bJDdQiginPnaDNtL;hoMsfL;eTDrPM;dLgJK;ox;al,e5är;inLSnGP;eraMferHZpoLt7XuFP;rtXsitQ0;bSEtC;inFGnipL;o7MräH3;kLul1;asPVlFVu7;enLizPX;!sC;dacBXerLjeP1seRU;!lehrE3;aZeUiSoOuMymphom1FäO9üL;ch1U;kle1tzD7ßbraL;un;bS1m3FrNtL;arPOgedruL;ng2;ddQXmaDJ;edHkotinaTBmmerL;saTK;gInnQ2rvOtt,uL;!geMhoQDnmalkQBrLtr3vermäh7;eiGon3;bFPschaB8;en3Aös;cUgCPhTiv,mSrrIsQtLßR;iNurL;e5geLintereDDreQStrüb;gNXmFYtrOW;onalLv;!b5Dl1N;al,chDsL;!forsGka7;eMRha8;!egelSPrDtl0;hLkt;ahmPMprüPDvoll8VweiNY;a0Pe0FiZoQuNyste18ärchKüL;de,hLrbe;eQWsF;ltiMndgMNskulLtl0;är,ös;d63funk5Wku5YliKMmedi3;bR1dQl5Oment0InNrMtL;iv9orOB;bDWsG;oLt0FuC5;kaus3tL;on;al,eLul1;b4TrL;at,n;eZlXmosKnSsPtLßQ;glieder0QtL;eLlH;iGJlL;b1gr1LhoPEl0;erQTsL;geL;biBFstimRX;derOiNuL;tLziDT;enM6iDS;m3steriBM;begaPV;d,iE6limeterL;gr1B;s,tJ;diRhrQiNlodiDMnMrMYssLterM0ßb1;b1ers8N;schensNPt3;len3RstL;erDgeL;flKMnPN;dGQfaG;al,kamentDFtL;atCerrL;an;chWgHkUli3TnSrPsMtNWx5QßL;geschneiARl0stabge1Dvo5;chineMkKsL;enDiv;ll,nleMO;gMit0RkLoOG;a4ie6tgLF;in3;gF9ipulPXnLue5;ha8igQ8;abHeL;ll0;b1tl0;a0Ne06iVoUuPöNüL;gKsLtt;teIU;sb1wenL;stME;ftOkrIngen1ApNstMxuL;riCT;bA6l0vo5;enMK;dC8leH;bNTckHk3se,trKZ;bTchtReOnL;e1gu3kL;!slL;ibJ0;bLfePE;!eLl0;nNNvo5;durchflutEsL;ch1KtLZ;er3idL;inCE;bYckHer,gVhrUiOnLPrnbNsNHtztL;!er,gL;enOH;ar,eh9J;chPdH2sL;e,tungsL;oLstLQ;riL;ent9;enbl27t;ha8rA;al,endIAiL;slItL;im;ensLha8l0;ecBfBPgrLlaKDmüN7;oß;bOMchDiKmmfroSnPpid1sOteNuLx;nKtLwaQ6;l0stLD;nt,r3;ch,tAM;dMgL;!sFzeitarbeitME;frLN;mm;a1Ye1Wi1Rl1Jn1Eo07rVuQöNüL;hLnOW;l,n;lsGniL;gsL;trLO;gelOlNnstMrLssJRß17;i0sCz;gJOvo5;a4t31;feP2ruMY;aTeOiL;mMsenLti77;feOZgeschüt8C;in94;atCbsOiMuzL;ungsJ;deblAsL;frPJruMQ;krGX;ftNKmpfDnkLss,ß;!enhauLha8;srPI;axi3ch0QedukIffeinJgn2AhäNYkePLl0Nm0AnUopFPpfRrPstMtzL;übNW;b1enL;bLfrPBiL4l0;ewußt;puB1rL;eP2uOH;gesLl0schüttMD;teL;ue6;di2AfZgrEZjunkt2DkYsVtNventL8zeL;ptL7rtLssC;ie6rP5;aktQi2CrL;aMovLär;ers;proMstL;iv,rA;duK9;aOSschL;eu,waG;eMis2MpirItL;a4it2DruK5;qEMrvI;av,orda4rEurren6M;essionKZoOMus;foWmSpL;aQetPlMromiL;ss0Sß0S;an1eLiz9;mLtt,x;entGD;e4itC;kt,t8U;eNuL;nLtI;al,ikI;ntaFIrzKK;rtMU;lMoL;ni3ss3;egi3;ecBfeNJ;aOiMöcFPüppelL;diI9ha6;eJttL;erJ;bKllHA;aPeiNiLopfNCug;scheeDtL;schnPzekleLN;dsFnL;g8Rkar9laN2;g7Kmm,ngM0r,tschL;ha8nL;aß;lometerOndL;erLgAMha8;lLrA;e8Vi3Oos;laHRweG5;ck,imJrLusGß;nl0zengeraKJ;fka4Shl00lUmpfTpPrNtLus3;astroLeg9L;ph3;g,iL;kat84tIös;iMriLuNP;zi93;ll1tL;aliJ8elMP;beFSl0;orienNtL;!geLlächKI;preNschleu6D;aN7bL;ewuL;sMJßt;!geL;freKNsch9M;aQeH8uLäh;geB1ngMstiL;tiLLziLL;enDgMverheL;irJN;ebliHT;gdbAGhrLmmDD;eGYhunderteLzehnteGY;a7laGY;de6Dgno1Dll1Bm14nOrrMsomLtD7;orph;a00eL;al,duz76gRparLBvers76;ak0Zbegri4Rd0UeffeI5f0Oh0MjeI5ko0Jn0Ho0Gs09tL;aMLeRim,ole18rLuN;aLiIC;liELmMnsLzellCY;itC;olMuskL;ulEG;ekCU;g00llZnYrL;aHWdWesJDfraVkQnOpNrogIsLterr8H;exHRteL;ll1;lanet1retI;!aL;tiBX;onNuL;ltL;ure5;fessIEtiL;ne5T;ktIC;isziplinE1;sCtiBP;eD6i1H;er,rI;ektQtLuffizAH;aOiMruL;ktCment5I;nHDtL;utI3;bKAnd96;iz76;ffizI3p0O;erLovI;!dJC;mpat66nsL;eqBNisL;te4;altsLäKA;leHrAs5W;aPekti7AinitNlaBNormMrarL;ot;atCe5;!esL;im3;m,ntJV;iMuL;ktCstrHO;ffeK0reLAsLvidGP;kLpIC;rEutJW;tCzeptJV;aginFMmQpL;erOoMreJHuL;lsC;sLte4;a4s5L;i3ti8U;a8Ti8Tun;eg3usL;iB4tH;ra4;a1De0Wi0PoYuRyOöMüL;bsGlleETnK;lzeCJrL;b1enHQg0OneCI;br67perL;korreKRmoLsens5A;deCF;mPndL;eNsL;gIFmisL;erJA;ka7rtJI;anLorIT;!itCJ;chPffIPhNlMmoLnorJ6rizo48;g2sCG;d,zJ;eiLl;tsAZ;!a05b02d01eZfreqAEgeWintelliVkoSmoRqPsOverNwilL;lkL;omm2;d8Ueh6;chwangHpezialG2;ualifL;iz9;deBVtiv9;mplMnL;zentr9;ex,iz9;ge4;acMbi3Deh6loHYsL;chätBUtBF;htE;rLxplosC;freJ7hitBR;euHLot9;eLriGV;gLtaHBz0V;aHQlücJT;chtu72ktF7n29ufgeschoHF;ebJ7lfQmmPngebu71rnLtzegeplaH8;gLl0verAU;esL;chäL;diH4;elweC7;l0rAs7T;iUktaTlQmmuDErLterCH;ausObNreDHzL;allerliLensgISha8l0;eb;!sBE;zieIQ;dKlL;!lLwaG;icBodED;rwIN;kHZlQmaFEsHtHzb1ßL;!beg0Gerseh4gelOumL;käMsL;tri4D;mp8;aAJieH2;b1f4Nl0sF;arWfIPgHlUndQrNsseFOuLßeFO;chLsgemGBteD9;dünn,za6;ml0sGtL;!geL;fr5KkDQso44;bBHfeIEgeLwaJ0;arbMbu70näBstrLweGT;icIV;eitE;bLog2sfeAIt2M;!feJ5leHnIIvo5waG;genau,l0sL;chaL;rf;a21e0Gl0Anad4Bo08rRuLymnasi3önn3Aü7C;ssPtLßP;!bezNgeLsiGO;klLl2Hm5B;eidE;ah7;ei07;aXeUiToPundLün;falsGl0schlCIverL;kMschiL;ed2;eh6;b,tNßL;!angeLdFZ;leFR;esk;ff6GmmsGpp3;iLll,nzeC5;fb1sL;!enD;dDJmNndi0uMziL;l,ös;!enDmel9sF;eEMvo5;ldeLtE4;maill9n;aPeichOob3äNüL;cLhendhe93;kl0;se9K;b5Hgesin4;nzG2tt,ubDzi3;b13d12e11f0Vh0Qist0Nküns0Ml0Imein0Hn0Cpols55r04sPtau8wL;altNiMohnhL;eit4O;e8l7ssenB1t9J;l0sF;aWchQeOiMpa6tLuF0;alDQe92;nnungsLttE;l0trDI;gnEndEtL;zl0;ePiOlLmackFQnie0Ou7wiEUät9B;echtsMiL;ff2;kr8ZrHN;cHDed2;it,nHC;lz2mL;me7tL;!dEXha8;aRecBiQnPtensOuMäL;de6uschFG;cLhsF;hl0;chl8P;gesU;ng,ss2;um;aOerNiLuC5üDH;al,eLt3;ßb1;e5ös;nt,u;!sF;aMb,iL;eh2;ckme9ngwLu4;ei7;te7;eLl0rA;rDsL;g2Ikr88scE2;aObehNeimLorsFör4;!nL;is75;inR;lt73ndicaFX;ahrEQechts4PiePlüOühlL;l0sLvo5;bLka7;eto4;ge7;de6;ignE;anA7iG7uBNächtnisscDP;iLlüG3urtBIührGD;ldE;la4n8X;a1He11i0Ul0Lo0CrXuNäk3öderMüL;hAPn8;al,ie6;lmi5FnNrLßJ;chtLi0;b1l0sF;daPkL;elnagNtiL;onL;al,e5;elnBU;meL;nt3;aXeUiQoNuchtMühL;!rG1;b1l0;hLmm,nt3;!gelL;au4;e4Lg12sL;chgebaMtL;g9Ml0;ck2;ch,i,mdMq5KudLv3G;sGvo5;!wortJ;chtJgLkt3tzKuK;il,l0;kuSlgPrLssDWt8B;mLsG;aMb1elLl0sc7Gvolle91;ha8l;l,tC;enLsF;l0sL;chwH;ss9;aQeNiMoFIügL;ellaBUge;eder81nk;ischMktDNxL;ibDQ;e6Pfa7Zl0;ch,mbMttLumwA;erD;ie6oya4;cQeOgNkDPnLschrAt,x;aLit,stH;l,nzB7;ur3;berLs;frEXha8;ht2;derYhlerXinTls5YminCIrQstPttNuL;chtLd3erE4;!waEQ;!aEPgLrA;edrEK;an77umriC7verwC4;nsehMtiggL;ek9A;g8ImüBI;!geL;maMschniL;tt2;hl2;frEIha8l0;leL;icB;b00chYd,hXir,kultIlVmTrbPsMt3uLßb1;l,stdi8H;chistoMeLs6N;rnDW;id;eLl0;cBnL;bliBFfLrA;roh;iliLos;eng80är;sGtL;en8K;l,rb3E;fr9LgeL;m0Ur7W;elDulL;ös;cht2DdCGff2Ah26i1Pk1Ol1Lm19n0Xr04ss03tabl9vent96xNßL;b1gL;estö6;aDOek96istZklYorbiXpUquis69tNzeL;lLssC;le4;eNrL;aLem;feBC;nsCrL;n,rL;itL;ori3;a9EeMlLonent9RreBQ;iz5YosC;nsCrimente5;ta4;usC;en38;b1en37;b0Bd08eignis7Uf02geb6Zho1Jk01lYnVog2reUsQtrOwLzä0Sört77;artungsMerb9MäLün1G;gA1hnA1;g03vo5;agLäuCO;b1l0rA;atz4Set1WtL;geLreb9W;bLnAX;or2;gb1icC8;eC6stL;!gemLha8;ei4;auMeL;rBZs2;bt,cB;enBXläBC;ahrMindBSolgL;l0rAsverwöh4;ungL;sgL;emL;äß;fa5IverMölfL;örd7J;bu0L;armLb03;en9CuAN;dl0ergierAgVoCHtL;eiTgePhOlCAsMworf2zL;iffeAYünBE;aguLchulBDet45;ngs2V;al5Q;genMisL;te6;gesL;et3Z;se4;!befr5R;bry1RiVotionRpfL;aNeMindL;sFu5U;hl8V;ngsbL;ereL;ch4R;al,e5sL;frC0gL;elL;ad2;ne4;eMit3QlLoq1Rter5O;en5V;ga4ment1;elD;dottergelb,nOsLtAB;eMfrBRgekLig7Cka7;üh7;n4Wrn;dWfTgefleiSkRprä7ZsNtreibb1verstaMwaLzeln;ndJ;nd2;aMteL;insGl5Y;m,tzL;be3W;la41ommenss6L;scB;aMlu6EühL;lsF;ch,lls5U;im0Kr66;eNrL;b1enLl0;ha8vo5we6;l0s6Z;ektMizL;ie4;iv,vo5;!goMsilL;be2M;ld2;a16e0Li03o00rUuOämonKüL;nnLrr,stH;!beLgesät;siede7v0E;al,bi0lPmOnk9GrchL;fMsetL;zb1;ormul9üh9A;m,pf;dsF;aPeLiAYuckrAUöge;hNiL;dLfaGst;imW;b1zah2Z;h6Kng11;ll,miRof,ppeltL;!gemL;oppe7;aZcVenstbUffSgRmQrekt0LsMverL;ge4s;krEruNsoMtingu9ziplinL;ie6l0är;na4;ptC;ensiV;it3;erenLiz8Mus;t6Gz8O;ar,e2M;htLk;!beLgedrän7H;vLwöl9Z;ölke6;gMlektJmL;ant2etr3;on3;du5DfYgXh91kWliUmSnPpNrb,sol7Zu7JzL;entLim3;!r3;laLre83;c9tz9z9;kLt3;b1fLsc73;aul;enLin54onstrI;t5Yz5Y;k7PnqL;ue4;ade4lin86orI;enYre7T;eQiNlaL;tiL;on1E;nitMzL;it1C;!iv;kt,nsC;gew46nk2ErstMt7UuL;erDmenb1S;el3R;hOlevHooMurricL;ul1;l,pL;erI;arLic;aktLma4;erL;vo5;a32e19i0Tl08o06rSuOö8BüL;g17hnenMndLrgera4GschL;elw88;r94wi41;bKkk3nLtterwA;dLt0A;esLw84;d6Fwe1C;aRePi5QoOuMüL;hwa8Sne92;chLt3;fe84l0stückD;nz2tl0;itLn7S;!gefäche6;ch,ndOuLv;c7TnL;!geL;br6E;aMheLn4D;iß;kt3S;de2AmbLrn9sD;en7R;a00eWiSondRuMätteLöd,üteQ;rl0;meOtL;a8AbeflMju2Esv4DunterlaL;uf2;ec85;nrA;!gefär60;nd,tzL;blMgesche0MsL;aubHch4B;ank;cMiL;eMfr83;heL;rn;m6InkMs9ttLu,ß;l0w75;!gepLpol9;utL;zt;bZeXlQnPrk2sOtterMzaL;rr;!bö70sL;üß;ex30;är;atQdMiL;ngu3;e69hMscL;hön;a8üL;bsG;er3;dHgLrern6T;b1sF;el6Q;ac1Cd10f0Wg0Uh0Ni0Kjamm19k0Il0Fm0Cn0Bqu0Ar02sVtQwNzL;ah1SwL;inX;egMoh6DuL;nd15sst4Nß39;b1u0Y;a4KriebsMteLucB;la75;am,beL;reL;it;chPen2JiNondHserLtim6J;gestel7;er;eLnnu0P;gb1;eLlußr72w49äftigu0N;id2ue6;eRnsteinPufsbeNüL;chLh6K;ti46;d44zL;og2;faL;rb2;che5Rit;em;achba6eM;erkMitleL;id3C;b1en3C;aMeLie4BämU;i4AmTs2;ng4Ls5Y;an4lLn61ümR;ag36op5P;nMspielL;ha8l0;ha6;aa6eOuNäL;mLnd;me6;tsF;iMrL;r0Mzt;m2Szb1;ehLierdel0rüß2V;b1r2U;aNrL;euL;ndE;h4Gng2;aSeOingMürfL;ni28;t,uL;ng26;nMppe6utL;sFu3W;keL;nl0;rfsgMuL;ern2H;erL;ecB;ht2D;kt1SlladKn3rOuL;mLr5O;laL;ng;!geldl0oLsGtl0;ck;enD;ha8;alg5Kb48cht44d3Sff3Lg3Jh3Fk38l2Cm27n1Dp19r0Ws0St0OuL;di0Lf09genzwink08sOtoLßerd2V;fr5Cg2nom,ritMsugL;gestC;atCär;dr03eZfYgSlandsd2RnRsPtauOweL;cLgl0ndiggeler4;hseL;lb1;sc4A;ichtsLprec49;l0rA;ahm1C;eMlL;eic45;buf8fuMkL;ocB;ch48;ft;üh3B;inandergesMrlL;es2;chriL;eb2;ucks2T;er1W;geUlPmeOsL;chluMtecL;kb1;s3JßrA;rksF;agMöL;sb1;ensL;c1PtL;ark;duLregt2;ns2;ovisLtC;ue5;eml0om1trL;aMibL;utC;ktC;chblNoMphalt9soziItL;re1S;zi3;eiGo1A;beitsSgQomatProOschNtL;frLglAv01;emd;ka7;ga4;is9;!l0umL;entI;am,iNl0sL;chL;eu;nteL;nsC;felgrün,pL;arIetiMroxL;imI;tl0;alog,dersgea0Derk0Afe09gZnYoXsTtiNvLwen2H;erL;wandt;baktOkLqu9;!onzeptL;ioL;ne5;erL;ie5;chmieNpruchs1FtL;andL;sl0;gsF;m3nym;eh2M;eOreiNsteL;rfL;ül7;fb1;bPgra26heiNjah6me0JneMrauLstam2Q;ht,t;hm;rLte6;atE;or2r0P;ch2C;an4ennL;enL;swe6;rtE;bNput9tsmüMüL;sa4;de;itiLula4;on9;arm9e6kohol0Fl07p09tL;!bew05d03ePhMkLüberliefe6;lug;ergebrMoL;chd00;acB;ingeTrL;nativRsNtümL;elL;nd;bedMscL;hwaG;inL;gt;!l0;seOwL;urL;ze7;lt;ss2;euL;tsG;äh6;bePerNgL;emeL;in;besLersL;te;kMlieL;bt;an4;fr1Ris9;kOtNut,zeL;nLpt07;tu9;iv,ue5;redMurL;at;it9;nuL;ngsL;l0vo5;ll;greLil;ssC;eOiL;n,rmI;atC;iv;ktiMngeL;il;on9v;diTeShäQoNsorbL;ieL;rb1;lesze4rL;abL;el;re4;nt;rrA;tiL;on3v;al;b1faGl0sFzigL;faG;am;os;b0Rg07lei06n03onn9rYsStrenRweL;chslMnL;db1;ungL;srA;eiG;ch;nb1;atzwOeNolMtLurd;iegsgefährdEra0B;ut;hb1;eiL;se;iebMuL;pt;feL;st;ie6;ehMormL;!al;mb1;tb1;aZeL;brüBfVlToRsNwL;irtschaftErL;acU;chirNpL;act,er6;rt;mt;rdnE;et;eg2;en;ucL;kt;ht;bMsaL;rm;enJ;frL;ei;aNrucL;hrL;eif;ub1;ar;laL;tt",
    "MaleNoun": "true¦0:BX;1:C4;2:BR;3:BW;4:C3;5:BE;6:8P;7:A7;8:BU;9:AT;A:5L;B:BV;C:AW;D:96;aAMb9Ec8Xd8Me81f77g6Jh5Ti5Mj5Dk4Hl48m3Qn3Io3Bp2Fr1Ys0Vt0Gu08vZwPxiao1WyigDzE;aeh7eLiKuEwa1ypri9C;ck6eg0gIkae1SsEwae2L;ammenFchEt0B;au6uCB;ha1sE;chC8to9Z;!a1;ns8vi73;do1iEntralraBrouD;g6tE;g89raBOso9Zungs2F;aMeIiEortla5Wuns0G;derspB7lFnd,rE;kungsgr4GtschaftsBK;lenEs5;!be7F;chselBPiGltFstE;-p0en73;kriBCm77raBG;hnachtsbaBFn04;ggoChlBGld;at6eHiGorE;b8Qga1ha1jahreszeitBBo96ra1sEwuerf0;cAXi8BpM;etnam8Jttorio;rEteran0;bGda9Mein65hA2lu2sEt9Q;e,tE;o9Cyn0;ae86raucherpr97;eberKmInGrEs-9E;laub,nenB5spEwa9G;ru1;-9Bf9Tm5AterEwi9U;ga1nehmensgewin7;fa1ga1stEwelt2W;ae7Z;ga1sch10;aQeNhMiKoHrEsche5Luerk0;aEes0;ktAuE;ergae2m;desschuB8eFn,rEurist8;er88nad88;ne,pf0;erv9PschE;!e;e4Gier4orva90r5;e,ilnehme2CppiFrEst68;mi7rori2;ch;g,milenEnz,rif2U;!rebe9B;a0Fch01eYiWk36low3KoTpQtGuEwi3C;edEpermarkt;en61o2paz1Kwe2;aKeJolIrGuE;dEehl0hl;e3ien9O;eiEumpf;fenw4Qk,t5W;pe,tX;i2Lr2L;atEdtt9Qe90hl,ndo81r,use0;en,sE;b4Sp7RsekretaAB;d-73e3Ki4LonsArE;it,uE;eng0ng;eh7ld9mmerFwjeByin3JzialE;d78i2plae7staaB;!nachtst9Y;cherheitsEn7;g4Tk2W;g0ktAnErb0ss9C;atEiAsA;or0s;aPeNiMlLmKnJolz,rIuGwE;aEu1;n83rz04;es7Xhe,ldE;en5K;ank,i67;aps,ee;i5Yol5Y;achtbu8Eüss91;enen6Vl7Im5nk0;rbenhaEwardnad4;uf0;deCed0rEtt0;pi1;al,e92ft,rg,tell5D;aTeNiKoIuE;eEmaen0ss0;ckEhe;en,ga1schlE;üs4;ck,tE;or0sti48;e7EngFos,sEval0zD;ikofa34se;!o;be7XchtsIfe20gFh4iEktApraesenta3ser12xro5G;cht93n7Fz;enFiE;erungsk20ss6E;wa7D;ext53s36;diergummi,ng,tko,um,viv;a01eYhilXiWlToQrFsych2QuE;llov6ts8Q;aesidentNeLiKoE;duHfGjek0VtEz70;ago5ZestE;a3en;essAit;ktivitaetszuwäEze3;ch4;m37nz8vat4C;i4sseE;bericht0;en,schaftskand1Y;lizFol,rtE;illo,ugi5S;eik1Hi2;aEeitg0;eEn6Ktz;ne6Utz0;cass5VerrGl5S;ippe,osoph0;nFrE;ot;!g;es4net31p5rJsGtFzE;if7A;ie3riar2Wt0;sEtA;!aE;gi8Ant;kEtei52;!pl7F;berJeHffizi87goni-Ypa,rFsEweC;t3Lwa6D;der80ganisEtsverein0;atAm0;koElk6N;l5Wnom0;kommandiere4Won;aHeuGiFordE;o2we2;ed2Ilako21;an45ba6X;chbaGehrb31me65tionalE;i2sE;o14ta9;rs64;aTeRiPoGuFythE;en,os;enteferi1s6Tt;enc7XnJrIsE;c7WlemE;-Es;aktiE;vi2;g0ill5;aFiE;tor;r20t09;nisterp4WtgliedsEyazawa;s5Qta9;chanism0nE;g,s1W;er6Hn0YrktEsssta1Utthi1P;!platz;aLeJiIoEöff6K;bbyi2ch6eFhnE;absch7H;hEw0;ne5F;ami7ban5efe3Un3L;bens6Xhr6iE;be,tzins8;ed0fontai7i0stw1C;a02ell01inderZleiderhYn14oIrGuEw5;ch0gelschreib6nde59rE;d0on,se58;eEo9;d2Pi4;ch,epf0gnak,hlhau3Cll6MmQnGrrEsteng1M;espon4DuptionsskE;andD;fKkurJrIsGtFzernE;e51s;inentJrahe3;eCumE;!e3;ad;re3;erenzkFliktE;en,s;reis0;mFpE;liz0o3Iromis4;and3Ou3H;ak0;ga43sE;chuh0o4J;er,n6;ffee,kao,mpfeins5JnIpita0rEtholik8;amira,dinDlEst0;-EhF;hEot60;ei0V;al,dE;id9;aKeJiIoGuE;d0e0CngsoEri2;zia19;ch0e1SschEurna18;ka;a1gD;ns,ts;cks5hrEns0;esan25ga1;deJg-metall-2Pmpul4nGrFsE;a1la1U;aCrt5O;dustries44go,itiatAsa29teEvestA;nEresse3;da3;ol3K;aNeKiJoGuEwa1;ngerEt;!stre4J;chschulreEef0;ktA;or0;mm4Tnw3Fpparc2U;i05lFnErr8;ni1r4D;d8mJ;bermSeRf0mburg6nJrHushaltE;en,sE;!sE;tre4L;a3ItmE;ut;dlungsspiKg,sE;-Ee9geo0Y;hHjE;oFueE;rg0;ch0e0U;ag0;el4V;f0upt2T;as;-39aXeNinzbu0PlaMoKrEuld0;enzuebIieHossEue1T;bEku1Sra4R;etriE;ebe;ch0;er4P;izueEldsto7uvern1Z;ta;nz;burtstag,dank0fange7nKo0FrIsHwiE;nnFssensgE;rue1I;e,s;a1ichtspun3Qundheitsschaed0;h0PichtssaDstensaE;ft;eraEo0Y;el0lE;!inspe1M;eGmsachurdia,ng,rt0zaE;-sEsE;treif0;rt0st0;a02eYiSluNortschri0OrJuEüll6;eHndamentaGs4ßE;!bE;od0;li2;hrerscheiCr2s27;aFeiEiedKüh1X;d16landv2Y;geb1XnzE;!o23;echtling8gEr;haElots0;ef0fE;enE;!s;lInFrmenEsc44;ku0Q;anzEg6n0;e1Gjongl10mE;aer2X;ipin12ms;ldFrE;d10nseh6;beE;rg;d0eHhrschein,ktGnFvorE;it8;g,s;en,or0;d0ll0;be19g5hrge30iRlQmOngLrloe1ItKuIwa1OxE;-Gpe14tE;reE;mi2;kommu0Dp0T;-Eg0;kommissionsp0Rs1M;aBo;elhEpa3J;arE;dt;igVpE;fa1;efa3lemann-jens0;dgInEsr2T;b2Hdring0Uf3BgGkla1sEtrittskarte,wohn6zelvert1E;ae2IchniE;tt0;a1r2J;enoE;ss0;aMeJiGonalds5ruck6uE;ft,rE;ch2Qst;eEplom9s0A;nstEpg0;ag,en;al,moEng;kr9nstE;ra3;eEhrendorf;mon0n0;astro,hJlint5omHsu-E;vorsiE;tzeE;nd0;monwealth0Rput6;er;aNeJinIrE;istFoE;ni2;dEen;emokr9;es0;fredaFmieE;rie4;ktE;eur;ot0;a0HeZiXluem,oTrNuE;chstab0ll0nGrCsFtrE;os;!s0;desFzenthD;al;pEs09;raeE;siE;de3;anGei,iEock0unn0;efEt0;en,ka2;cheneEdt;xpeE;rt0;d0eEg0rk;d0rsenE;ga1neuE;li1;ldschirm,olE;og0;amt0itUneluxSrKsHtriebFwEzirk;ei4;e,sraE;et0;chluEen;esE;seL;eicheKg,iJtHufE;!sE;soE;ld9;hoE;ld;chB;!n;-sE;ta9;ra0R;c5hnhoGlk5rnevWuE;loew0m,stei7t0;ne;ef0f;b12erzt0ffront,ge3irporBkt0Tl0Om0Ln07p04rYsTtOuE;fKgenzJsGtoE;kEm9r0;onzerC;flu0Iga1nahmefEweis;aeE;ll0;eug0;schFtraE;eg0gs0I;rei,wu1;em,laGomE;tesBvE;ersuc0R;ntEs;ik;i9peLtE;a,ronE;aEom0;ut0;at0;beitsHchiteGeCm,tiEzt;keln;ns;kt0;plE;aeN;fFpetE;it;el;aPdNfa1grMrKsGtFzuE;eg0g;eil0;aeGcFpE;ruec06;hlaN;tz0;eEuf;iz;iff0;ers5ra1;on;ly2rE;chi2;aFtskollE;eg0;to;!kohol,lGptE;raE;um;einE;ga1;eur8iE;enGonaFvi2;st0;er0;kur4;!en;ts;nt0;en;ga1sE;chFtricE;he;luE;es4;se;ng",
    "Adverb": "true¦0:2N;1:25;2:1Y;3:2M;a2Eb24circa,d1Re1Gf1Fg15h0Yi0Rj0Lk0Kl0Gm07n00oZpYquasi,ru2MsQtPunNvIwDz6äußer2üb4;er4rig08;all,haupt;i9u5w4;ar,eim1I;er2g6let0Im5n1Vs4t0Zvor;amm3ehY;ei2inde2;lLrun14u2G;em0rka;ahr7e6ieder5o4;a20hl,mög0;!um;g3it1nig;haft,li2D;er7i5or4;ab,er2gest0Tn,w1D;a,el4;!eror2Cleicht;gebQmut0s1B;bedingt,geacht21te4we1E;n,rdess3;eil1Roi,rotz;a0AchAe7icher0o4te27;!eb3fo1Bg4m1An2;ar,l4;ei21;hr,i5lb4;er,st;nerXth1;l1Qon;er,ro;b3ft0LhnehI;a9e8i6o5u4äm0;n,r;ch0Itf1Z;e0Hrg4;ends;benan,t13u0;ch1Rm0Ktür0;eBit6org5öglich4;er18st;ens;einand1saQt4unt1;e4lerweile;ls,n4;!dr4;in;h1Ni2;e5i4;eb1nks;dig0id1tzt4;end0li1B;aum,einesf1Hnapp,ürz0;a,e4u2;!d5h1ma1Ht4wN;zt;e4o16;nf1Cr4;ze0B;mm1n5rgend4;!wie;des,klusive,ner0Rs4zwisch3;besondere,ge5o4;fHwe06;h0Asa4;mt;eu7i4;er5n4;geg3sicht0;!zulanE;er,t4;e,zut4;age;aCe6leich5rößtent4;ei0X;!wohl;nauso8r5st4wiß;ern;a5n4;!e;de;!gut;nz,r;a2ern1olg0rei0;benDheCi6n5rst4twa,xtra;!ma0M;d0tspreche07;g7n4;m5s4;c01t;al;en4;s,t0;ma0Er;!f0Bso;aEe8oBr7urch4;a5w4;eg;us;auß3in;mn7nnoYr4sC;a5weil,ze4;it;rt;äch2;st;h4ma01nn;eim;ald,e8i5loß,rut4;to;nn3s4;h1lang;er;i6kannt0rgab,s4wußt;o4tenfR;nders;nahe,spiels4;weise;beOlKnCu4;ch,fgruAs6ße4;n,r4;halb;gerechn6sc4;hl4;ieß0;et;nd;der8faDgesichAläß0so4;nst3;en;li4;ch;n4s;f8or4;ts;le4so;in,nf5rdi4;ngs;al5;rma4;ls",
    "Infinitive": "true¦0:1OY;1:1O5;2:1OD;3:1OL;4:1OX;5:1O8;6:1M2;7:1JZ;8:1OC;9:1OE;A:1OP;B:1NM;C:1NY;D:1NC;E:1ON;F:1O1;G:1M7;H:1NZ;I:1H2;J:1OJ;K:1LH;L:1OW;M:1LO;N:1GR;O:1MM;P:1IW;Q:1N7;R:1FE;a12Db0UPc0UHd0P5e0GCf0CQg0AKh04Hi03Nj03Gk004lYVmWRnUAoTYpRXquRPrPXsLAtJVuHBv97w6Qz1Aä18ö17übS;eSrigb079;l0TXn,rS;a13b10d0Ye0Vf0Rg0Qh0Pk0Ll0Hm0GnJRor1M4prVZqueONr0Bs00tXvWwTzS;aJe0GMi7äJücC;aKKeHDiSuc1KGä0WU;eg0nS;d0te2;ePSo1J6;rTöSün1;l1NAn0;ag0e1CHumF;chYe13LpWtTäS;ttBue2;eVEiArSü1D3;aSei1DEöm0;hl0pa1LM;a1O1iSr076;el0nn0tz0;aUla1JNn7Zr0PGwTäS;tz0um0;a1J5eA;tt0u0;aVeToEuS;m1MWnd0;a1L8d0iSnn0;ch0z0;g0s1;a0YKit1KTüd0;aUeTiS;e1DVst0;b0g0it0s0;d0ge2pp0s1DXuf0;i1ITl1HUoTrS;iGu1NX;ch0mS;m0penL;and0SYeiz0i9ol0ä07Fö121;e1B7i1MTre1M2;a19JlUorMrSü1MY;a051eS;md0ss0;ie1CEut0ü1KO;iSss0;gn0nS;koAsWY;a39eSoLr7;hn0nk0;au0eTi1H4liHrS;at0i5üH;ansp10Hha1O4koAl0YUt0T4we1BC;nstre5r1O6;d0f0VIl0;chIUff0hG4n9Hr1FIsStz0u9G;c1J3t0;a55e3Ui3QoEuZwVäUö1FGüS;c0X3ge3nSrn0;de1EDge3;h143u1GL;angsumsie1HXei9DiSä5;e1D9nTr1D9schenSt1GM;bleRlaR;g0ke2;ar1NUb3Eck0d3Be3Af35g32h30j2Zk2Vl2Tm2Rn2Qor1KGp2Or1Cs00tYvor1LVwUzS;aJi7uSwin183äJ;ge1IWla1MCm13DrecQsWEtr1H0weR;anMeUiS;derSnk0;h10Zla1NJ;h0is0nd0rf0;e1HHrS;a9WeHRiP;a00chWe11XiVpUtS;ande1LLeSiAo11Lr03Wu9öp1MLü1BG;c1B3h0ig0ll0ue2;e14Li1B8r15Q;c1IHtz0;aUie1BQlTme1BMnSr0D9us8ü1IX;a1IZei1FIür0;ag0i1LO;nz0u125;g0mmenS;ar1NBb0Pd06Mf0Mg043h0Jk0Cl0An17Ep09r04sXtrVwUzS;i7uSäJ;f0N6s1N1t87;ac1A9e0BEi0WY;ag0e1AEoS;c1H7m1GS;chVe9iUpTtSu1;au1e0CWiAoß0r0GMü1B0;a1AUe146;nk0tz0;ar0YHie1BBlTme1GTnR4rSwe1B7ü1II;a1IGe1IFumpfe;ag0ie1IP;aVeTin1J7oSuf0ä1J1üH;ll0tt0;cQiS;h0m0ß0;ff0uf0;a1LDfer1r1JD;aV2eSiGäp1KGüg0;b0g0im0s0;a1MKeXi1I7lVnToWJraSup1KP;mXYtz0;e1K7üS;ll0pf0;aG0eSi5;b0is8;hr0tt0;aTeSä5;ft0il0;e5lt0u0;aTeg0iRlSü0LC;ecCi1KP;hr0l0HNss0;aUeTiRle13Eo1FSrS;au0e1i5;iß0t1IB;ll0u0;a12e0Xi0WoEr0u0LüS;ckSst0;b0Gd0Ee0Bf0Ag0Qh0IFjOk09l08m07ne1FApraEr06sYtXverVwTzSübMV;aJi7;anMeSi0VVü0XH;i17Mrf0;fo17ClSse9we170;a5eg0;au1FNr0GY;chWeViPpUtS;e0V8oß0rSu9;aJei1A6öm0;ri5ul0;hn0nd0tz0;aTeu1IVi1F1lOneErSwiA;a1HAe1H9;ff0l0H2uAK;ei0A8oEuf0;ar1IOe0Z6;aU0eQiG;a1LJeDla1FUoAäA;a16PiRlFGorMrOüD;il0rS;bi1H3ha1LJin1K0la5o1KCsM3wS;a18Qe0S1;a6ePrS;eh0ä5;eTi0NDlSri5;e12IiH;g05Wha1LDkoAug0wG;eckSf0;bLWe00fZgXhWkVne1EHtr1E9zS;aJi7uS;drae5eYfüDgVHh0HKkSzi7;a1L5eDoA;a1L4eD;ab0ol0;eSre1IR;b0h0wi1K4;a167iR;ro1JV;cCe1HD;chSd0i1JC;n0tS;biGfiRk03XlGma1sTwe15YzS;im1ANuTJ;chus8e9tu9;t0un0;aHfSro1K7;en,roF;a1H4e1HKäh0;aSe1JEut0;ch0ue2;aSe0GYäc1GGöt0;ch0d0ng0ss0uf0;eDlUnToSriG;mm0rk0;aEöF;a1ESeb0iP;auc15Bu19Y;aSe1EFo4ä5ör0;k0lt0u0;eSi1ITre1I2;b0h01CsS;eEt7;aVlUrieSäc1G4ü0JC;denSr0;g1DKla1IYs1K6z21;ie1J0üs8;ll0ss0x0;ck0ge3i172r1J7;ePiTrS;eh0üH;en0k6;aUeTiSlin1BDri5ut8;llBnd0;iß0koAre1K6toK;l0PHu0;eUgeu1IHm19Qnk0rkTs1tS;i4te2;e3uN;h0l0m0r0;ch0hr0i16Slt0m165n0ZrSt1FZug0;b0Vd0Tf0Og0Nh0Lk0Dl0Bm09n07p05que1I3r03sVtTwüJzS;a1JDuF;e1DQrS;am1HUeTFüm19I;a1DMchWe9iede1A7pUtSäg0;amFe1o4reSä1F9ör0ü6E;it0u0;a1JOl1EIrS;e5i5;eTi03BlOmeSne1F8;iß0lz0t8;ll0r0ue2;eSi1IJuFüt12P;d0i17Vn;fSiHla9re1I4;e1H2lüNC;aSicC;g0rb0;aSet1AMü0PW;hl0lm0r8;aSeg0;ts1uf0;au0lXnUo1rS;aSäu1ICü1CX;ch0tz0;aTe1GSiSüE;rs1t8;ck0ll0u1HC;eSu0DU;b0i1HJ;aSäck1I5;ck0ge3u0;eh0lBC;aVe9lTrS;a191e1HK;at8eSi1H9;dMis1;ll0se2;amFeEon1HArS;ö1HWüH;eTiGlOCo72rS;e1öc1I6;iß0ul0;si4trS;a1AKiS;er0fu1F1;eJg0h0W7nk0p1C1uS;be2de2s0;a1Ze0Ri01o00ri5uWäUö2IüS;hl0ns1rSt0;dBfe3g0z0;g0hSlz0rm0s1AV;l0n0r0;chUeTnMrSse3;m0s11Jze3;ns1rdB;e2t0;hn0ll0;c0Gd0BeXlWmme1C3nVpp0rUsTtS;te2ze3;ch0pe2s0;be3k0t0PF;d0ke18Lse3;de2lB;derSge18Jhe2ne2;auf03b01erZfiRgeYhWimFkVli1BBsUverTzS;ug1BA;einige,ka1HX;ag0eh0;eDoAriGäu0;ab0erSol0;s1HRz0R6;b0wi1GV;g08Fha1HUke1GUla5stSzäJ;a1DDeh0;eSri5;koAl1B0;t04Uzu0M7;erSm0;faDhaEkYRlGn,r1HLsS;che09Le9pTtS;eh0r1AV;ie1DXre1;h1DNke3;b0c0Yde3g09h0T2iXlWnd0rUtS;tSz0;e16Fma1;b0d0f0ke17WtS;en,s03Y;k0l0;ch0d0ge2h02l0n0s01teS;n,rS;ar1HEbYdePeWf000ge142hePRkoAlVma11Lre12BsUtrOverTzuS;entwic1GQf0HAma1;bBJfo12Lka1H6mi1A7;ag0eh0pi1G8;a1H4e1HB;mpfeJntwickelSrO6;!n;e1CBi0UMri5;en,sO;en,n0SA;b0Dd0Ce1FOf0Age13Sh09jOk08l07ma1ne1A7r05sWtVwTzS;au1FTi7;eSis1;nd0rf0;au1r0BX;a1GTchVe19XpUtS;eSoß0r13L;ck0hl0ll0rb0;i0H5re5ül0;aVe0EAiUlTmeXCnSü1CC;a1AZe1CD;ei1i1F3;ck0eb0;ff0u0VJ;aSe14WoEuf0ä1CT;di4ff0;aOYeg0;eDoAra9;a1GJeb0ol0ä5;aSeg0lADre1F5üD;hr0ll0ng0;ePrüH;e1EJlTrS;e1FEi5;as0e0XHiH;h1FGk0;b15QcXeJf0NRg0hrWlVnUppn0rTs1tS;en,sc1C1;m101n0t0;de1A2k0;l0t0z0;en,ne19CsOzu0KN;hSke3;en,ha1G4rSs0zu0ZW;uf0üt1C6;ar124er1Fi1EoSö1CE;ll1ArSti4;a14b0Xd0We0Vf0Tg0Sh0Mjam15Qk0Ll0Hm0Gne1CSor1CPpr0Fq0ZVr0Ds07t06ver05wYzSüberg7;au1ESei12Vi7uSäJ;bUd0QKf0FYgTlGne194sSwe7Yzi7;c0PFteE;au1FCeh0;eSri5;re1FYug0;aXeWiGäTöS;lb0;hl0rS;m0tsS;g7koA;g0K5is0rf0;g0rn0;lGu19I;a16Gr0ALu13Dä0SR;ag0chVe18Li1ACo192pUtS;e0OVoß0üS;lp0rm0;a1EHie1ACr0XSul0;ie13TlOne1B2re0WKwSü9;eb0in19Hä12X;eSicCüH;cQd0it0;es1o0D9;a1e0P4;aUeTieSüg0;b0JQg0;b0g0s0;d0uf0;au0eXGnöFoA;aWeSä5;rTuS;c1AUl0;faDrs1sS;ag0p0PN;lt0rr0;au1EFe11Qre1CL;a102e11QinSlun0ZBormSUueDüh15C;an1BHd0;nt0YOrLW;a6ePrX6;au0eTiSl11KoDri5;ld0nd0;ha0JMiSre1EWs1ENt0ug0;be0J8fUg7koAlaN4mar1BRreTs0J6tSzu0B7;re17U;d0nn0;aDl8JüD;nUr1EQusS;bF7g7sS;ag0ch17We17M;b0P6g7koAt0VNzuS;koAt0VM;b0P4e5Nfü0ZMgi1CVkrit15Rla1DBma157pfroFqua1CQsStaPzi7;chSpri9toF;lOmi4re0VK;erteMKsi4;a5Vb5Gd54e50f4Og4Ch45i44j43k3Ml3Dm35n2Yo2Wp2Lqu2Jr2Cs0Xt0Nu0Iv0Fw02zVäSö2Xübe14U;nTp1CFr15Us1AGuS;ße2;de2g0PH;aXeViUoTweiSäJö15R;fe3g0;e15Pll0;cCe0RRn0F6;hr0iSrr0t1A9;cQh0;g0hn0pf0u1CX;a02eZiWoVuTäh14HöQüS;ns1st0;c194nMrS;s0X6ze3;eQhn0;c1DEnTrSs1;k0DIr0;d0ke3;ch1CZh0PEiTlSnd0r1B5s0tt0;k0t0DF;ch0DEge2l0s0;c10WhrSis0lt0n17Urn0;en,lNY;ielfTollS;kommn0s0V;a1ä0L5;lk0nTrS;sa1te17J;faEglTreinBsStrM4;ic18Nta1DK;imFüH;a00eXiWon0rTu0ZCäS;fe3n17J;aTe0RDiAoc17Kä19MöS;de3st0;g0u0;ef0lg0pp0;iTuS;e2fe3;dBl0;g0us1;a15ch0Fe0Ci0Aklav0o09p05tVuUäTöQüS;hn0ndBß0;be3um0;ch0mF;aYeWiAo0R8rVuAäTüS;c1CJm16S;nSrk0;dBke2;aJe0R3om0;ck0h0iSll0rb0ue2;f0ge2ne2;at0CIeTuS;b0ch0en;ndBrk0;aUeTi0D6o18ErSät0ür0;e1i17Lüh0;is0kuNrr0;ch18Unn0;eQhl0rg0;c17SeSl1BInk0tt0CA;b0ch0ge134;ge3h0O6lbstSn16Btz0u1;ae11ZsSä11Z;tä11Y;a0Ee0Bi0Al02m00nZon0rXu0Q2wUä09Oö1B1üS;ch8ttS;en,g7;a9eTiSä13Yör0;mm0nd0tz0;i10Hnd0;aSe0VNo17Yum1AGäP;mm0ub0;a1C9ei14IuFör1BSür0;eSi4u9äh0;lz0rz0;aXeViTuSüs1BD;ck0de2;e180mmSng0;b29e2;ch8iSpp0uM;e2m0ß0;f0g0mS;m0p0;ck0e10Eff0m15Q;iTnk0rSu0VG;be3z0;d0ße2;chTe006ff0l0TFnSrr0u1BD;de3z0;e2te3;ch0BFe180g0lz0m15Jnd0uPA;aWeUiSo1B6u1A1ä0J7ü10C;cCe184nS;ge2n0;cQgn0iSn09G;b0s0ß0;mSt0us1;me3s1;aSirl0;lm0ts1;a01e00fXi1A7lUo0VXrTuSön0;ff0lve2pp0tz0;a1A5eEü17U;aTem198oS;mb0;n0p196uM;eTlSus1äR;a128eg0icC;f18Iif0;nn0st0tz0;c00Lss0tz0;eSr17Y;d0ffent0AT;aVeUiSäh0;cCeS;d0AQt0;be3hm0i0JKtz0;chlSge3r05s1;aeSäS;ssB;aYeWiTuSäJö10F;mm0r17Vt0;eTm0nSs0WJt171;de2en;f0s0t0;hr0id0ld0nSrk0ss0;g0sch0AF;ch0l0mFrkt0s19X;aYeVieUoTuMän129öS;s1t0;b0ck0s0t8;b0r0;b0g0iTrn0s0tz0uS;gn0md0;b0h0m0t0;d0en122ge2ngSss0u17V;en,s19;a07e06i163l02nZoYrVuUöTüS;hl0m108nd0MCrz0;r188stB;e0YFp18I;aTie1u19SüS;mLEp18G;ch0ft0mFtz0;hl0ke3mm0nsu12Pr178st0;aTe0BNit8oSueFüF;r18Ct0;ck19Yll0pp0;aUeSi5o14Gu04Zär0ün16K;b0iSmm0;d0ne2s8;g0m0ZVu199;hr0il0nn0tt0;be3c15UlkNZnt0pp0uf0;ag0u0ZHäDü5;nner09Mrr0;aWeUinMohnepie182un8BäTöSü116;hn0ke2r0;ng0rt0tP2;b0dMer0hl0iSlf0rr09Ix0;l0m09Hr10Sz0ß0;ft0ge3l057n13XrSs17Xu0;mlK1r0;a02e00iZlYn10Qo0NBrUuHöTüS;n0KYt0;nn0t8;aUe17CoTäm0öS;be2ße2;es123;b0ul0;as0ei1iAüh0;eß0ft0lb0t8;b0genwä0WCh0ig0lt0ss0ud0wS;a0H0is11Y;eEm137s0;a02e00iI1lYoXrUuTä181üS;g0hr0t8;eg0g0m134t8;aSe04Küh0;cCnS;s0z0;lg0rm0;a1ecCie0XCu1üS;c0LOssB;cChl0inSstBue2;d0e2;hr0ll0ng0ss0ul0;bb0de3hr0iSleRn15Frb0wB;d0KYnSs0te12Y;b0LMen,fa1heit08Oig0na129sSze3;am0;a02e01i00oZrVuUäc0LGünS;nSst0;en,iL;ft0mm0n0AYr18B;aUeTiSä5üH;b0YBeß0;ck0h0ifa1s1;e5ht0;n17Ap16V;cCen0ng0;ck0nk0rb0ut08C;m164nk0u0;a05e03i01lZoDrVuTöl0E5üS;nd0rg0ß0;ch0d12PeSm12C;nd0ss0;aUeTi5üS;de2h0;ch0iWms0nn0;t0u1;a174e0Q4ut0öd0üS;ff0h0;e0U4llBnd0tS;te0XC;amt0iß0rg0s10SuS;g0l0;l0DRnn0rri0L0u0;bZcCeYlXnTrSusg10U;be18Dm0s1zt0;ke2laUsStwo0VG;chSta187;au07RlO;g0ss0;be2lgemei16Lte0X2;nMus10I;reUsS;chSolu6;eu0i0KL;d0i1;eb20fe2lk0m0InTpgr0AHrSti0ZV;ba0ZHiKte11U;if0Fk0terS;b0Adr09fa16Ig07haXYju0XAk06l05m03ne111or14Kpfl0YSqu4r0ILsZtXverWwUzS;e118i7uS;b0IFg7;anMeS;is0rf0;mi10OsDV;au1e11Mre0LMunS;ne3;ag0chTe9iPpül0tSu1;e0GYre0LPue9ü9;ae9e137i10UlSr082ä9;ag0üF;aSe5is1;l0ue2;aFUiG;el0CWoArie08OüJ;eh0lSr0ZZ;ieM;ueHüH;ewe0UKiUle0OGrS;eSi5;ch0it0;et0nd0;i13Sor0ZL;ar18b15d13er03Nf11g0Yh0PiF2k0Ll0Im0Hnäh0o087p0Fq050r0As01tZwXzSänM;e10KiVuSä0MI;bTg7keDsSw0KI;chu0KMe9t104;au0ri5;eh0n13E;an113eSä10WüJ;nd0r10R;auSoFre0O3;f0s1;at130chXe07BiWo10FpVtSä133;eTiAoß0r82üS;lp0rz0;ch0ig0ll0;a15Ti075ri5ul0;e10Unk0;aCAiTlOme0V0naEre0NVul0YXwSü12B;ePä0U8;cCff0;aVeTue161ä12UüS;hr0st0;cQiSnn0;ss0t0ß0;hm0n108;flSol0ro04G;a0XDüg0;e0JZo10J;aTeS;g0it0nk0rn0;d0ge2u13O;eDi10LlTniHoAreS;is0m14E;aSe11X;m0W0pp0;au0erSä5ör0üE;fXi0NEjOkrUUr0JDsUtTwSzi7;anMim0ZW;aXOre0NA;chStWQ;au0leS;i1nM;aDlS;at8iG;a0TSeTi14DrS;ab0up0WAä147;b0h0s0MI;a0HSlSo0TFrOunA0ä0CGüE;ie0TY;e0WXiSr7;cCs5Y;au0eTi059lSr0O4u1;as0ät8;ha15Rne14Rse9tt0;be15Um0;eSrigb0DX;n,rS;b68dePfP0g7lTJnZprC7rYsWtUwSzeWV;aSe0QMiR;ch0e0ZG;reSün1;ff0ib0;chSe9;re15L;as1ed0;acCe0YL;a0Xe0Uh0Si0Qo0Ir01uZw108yYäVöUüS;f11Gn1rSt0;k0m0;n0p12Hrn0t0;fe3nTtSus1;ig0owi4sc110;de3ze3;piLran0WR;c0PJm0YVnY5pf0rSsch29t0;n0te3;a02e0NQiZoWuVäTöSü0CV;de3p11Est0;l0AIn0uS;fe0VHm0;de3mF;c0Z3ll0mTpf0tS;t0z0;me3p0XV;cTeSl0ACmm0nk0p12Yump11X;f0z0;h8ks0;b0cCd0CNe10Zg0iKk6m12VnsUpTsLuS;e0TQmw0I5;p0s0;c11RfTpS;lan6o082;eIor0X1;a140b0et0lYpHGrXs0tS;aVla1sStr0XKär0W3;ag0chTteS;ch0ll0;lOweB;liLr14L;ke3pe120;eIl0;ge2lg0n10Rppe0UVschSts1;en,le2;eSr09D;ma0WGore0WGra0UNsauI;ch0VVer0ilTl0YLmpeIn11UrSst0C5xt0;miKro09E;en,h0WTne0XFzu08Q;bYde3e0HEg0kXm4CnWpUrTst0ts1uSxi4;ch0en,f0g0me3s1;i4n0;eSp0s0;rn,zi4;gi4k0z0;e3ti4;ellSui4;a094i4;a46ch20e1Ui1Pk1No1Jp13t01uXwi5yVäTöQüS;f109hn0lz0ndBß0;be3en,g0h0ku7Bn0E3ttBuS;be2e2m0se3;mSnthe0VZste0VY;bo0VRpatTI;bTch0de3ffi108ggeIhl0mSrr0spen11C;mi4pf0;sStra10S;tit0VKu0W3;a0Je0Fi0Ao07rXuWäVöUüS;c134lp0mSr00Jtz0;me3pe2;be2hn0p12Qr0;n0NYrk0;di4e0XZf0mFnd0tz0;aYeViUoTuSä0Z2öm0;de3kUAll0;l1me2tz0;e0ZSpp0;b0ck0iTng0ss0uS;en,n0se3;cE4f0k0t0;f1Hhl0mTnSpa0ZWuc0Z3;d0guN;m0YHpe3;cGEer0lTpSrKss0t8ß0;f0pe0TO;pe2zi4;bi9c0YXeVft0g0V9lTmSnk0pp0;m0uN;iLlS;en,lGschweB;b0fe3l0r0;c0QOh0B7iUll0mTpp0rSue2;b0i0UX;m0pe3;f0ge0RWnB;bi0UUc0YOe0CQff00gKlk0mZnXp1PrWtUuS;bSch0en,n0;en,saU3;ioKtSui4;en,fiRg0W2;r0t0;dSz0;arBRha12Q;me0T5pf0;e3i4;a05e02iZlYoXrTuSäh0ü0T1;ck0er0k0l0r0K4t0;eTiSu0WNüh0;e0YDn0O9tz0;ch0iz0nS;g0ke3;n0UWrn0tt0;e0QPit8;ck0eTnn0oKtzS;be10Ie0SUkRJ;ge3l0ß0;iTkuNnd0A6rr0ziS;a0U8fi0YV;c0XDen,s0;ch0YClt0nn0r0zierenSß0;!füDg7;hl0lUnTrSzGZ;g0ti4;di4n0;ida078l0;aSelT6iz0YNyp0;l0SDn0ZL;chUeTgXWmuNnStz0;g0k0n09U;ch0de0SFge0SFz0;erSt0;n,s11Sz0B7;gWhTOiVkSGlTnSpaIr0WXtz0u0KZzi4;d0g0k0sibi0TS;ek6igS;pre0MTsp0OA;f0l0n;e3m0O0n0;a1Re1Oi1Il14m0Wn0No0Mr0Fu0CwYäXöWüS;rUtS;teSz0;ln,n,rn;en,f0;n070pf0;dBl0m0nd0rf0tz0um0;a01eXiVäSör0;be3ch0nTrS;en,m0z0;ge2z0;mm0nSrr0tz0;de0RUg0;b0fe3iUlTmm0nk0rS;faEtMQ;en,g0l0;f0g0ß0;b0QOfe3nUpp0rzStz0;ar11Bh0N0mal0sS;chl0CFeh0;en,k0;bs0c10LeTft0lSm0UUn10Ls8tzimF;d0en,te2;r0tz0;aXeVuTäSöF;g0nk0;bb0mpS;e3f0;ck0iS;b0en,ne2;f0F3mm0ub0;ck0n0pp0t8;aYeWiVorUuTä0FGüS;f0X4r0;p0YJrr0;c0WIr0;ef0p0YJtz0;iSll0uz0;de0PMen;l0J6pp0r1t8uS;b0f0z0;aYeWiUoTuSä061ö0KYüH;d0UMeHg0WWn0RTs0;ll0r0;eSnk0r0WU;d0g0r0;ck0iSlz0rz0t8;c0W6ss0ß0;cCro9tz0;a03eYiXoWuUäTüS;pf0rf0s0ZG;fe2mm0n0WN;cSde2m0Q0;hz0k0;s0SNt8;e0W0n3CtPE;cViUmm0nTpp0uS;de2s0;de2ke2z0;ch0f0m0ß0;hters0ZXke2;b0YUcCfSg0mp0pp030u1;en,f0w0DD;cPAeUff0kaKlTmSnd0r0VW;me0TSpf0;de2le2;b0fSl0ß0;e2g7lS;a1iG;f0W4iTlV5ma0RXnk0p0XKr0XSuS;ch0e0OQ;d0n0te2ß0;b0chWd0eNZff0lVmUnz0rTt6uS;de2en,fe3ke3spie055;en,fs0ZJmüt0QXr0;poK;en,l0t0;e2te0Q1;bYft0g0hn0lXm0O1nWrg0tUuS;b0JAe0OHf0gSn0s0;boh0XZen;tSuI;e3s7;i4kt0HB;b0u6z0;be0T7o6;a17e0Di07o05u01äZöYüS;ckSg0h0V8l0OVmFst0t0VE;bVda6eTveSwärt0HP;rs5E;n,rsS;ta0UR;liH;c0UWntg0st0t0;ch0de2ke3t0Y8uS;c0U6m0s0WU;b0OHc0YIde2eZTf0h0iKmUnSpf0ts1;d0tSze3;er0G1;hä5or0;bb0c0VZde0PEll0st0tS;fä05Gi4t0z0;b0OBchtVeUf0V7ll0nTpp0s0KUtS;ua0QSz0;d0ge0PAn0;ch0ge3se3;en,igS;liGs0YM;a0Kb02Ic0Hd0GetabNf0Eg0AhabiJRi04k03lax0m02n01oZQpZq0QOsVtUvolut0GMzS;enLiSykN;pi4ti4;ar0W6t0u0VNwe0RL;er0TNiUoTp0BtrSul6ü0QZ;ukPD;r0TKzDC;di4gKs6;aIrS;odu0V1äs0KQ;aP8k0n0o0THti4u0QQ;ili01Zon6pe3;apituNla0QRonstr0Q8ru6ti0UXurI;b0c0NAf0he0NBm0nSs0t0z0ß0;faEig0rTwS;as1ü0RT;eSie1;d0iS;t0ß0;eTiSn0uN;er0stI;ln,nS;!eI;eIin00TlSor0QGun0VM;ek6;en,u0UL;hTycS;e3l0;n0tfe0KQ;gi4liL;bat6d01e1ff00g0hm0mZnXp0VYsWtUuS;b0ch0en,f0h0n0sS;ch0la0XR;en,iSte2z0;fi0UCon0NL;c0TIen,i4pe3se3te0MP;daNgi4kSschme0LZz0;en,lo9riG;me0O4poKs1;en,iK; faDe3faDiS;er0ka0PI;aWeUiSo6äl0;eSrl0t6;ck0ts1;ll0n0TTrSts1;dePlGs01V;dIk0lTnRMrSs0WJts1;ti4z0;i0TWm0;a1Je1Af16h15i11l0Uo0JrXuTäp0VEöSüI;be3ke3;bUde2ff0lTmp0nkt054p0r0OJs0VMtS;s1t0z0;en,si4ve2;er6li0TR;a0Ae07i06oUuTäSüY4;des0PEfi0TKg0mi4paIs0JEziL;ef0st0;b02du0TNf00gZhi0S3jYkla0PGle00NmWpUsTtSvo0TNz0PK;es6ok3Tz0;peIt0;agShezEJ;an0UIi4;eKoS;t0vi4;ek6i0TG;nZXrUT;essSOiS;li4ti4;en,i4le0OV;ts1va0OV;dBisTll0sS;ch0s04J;en,g0PX;eThl0kZQll0nSs0VR;ge0LK;g0s0IU;ch0e0OOke2lZpXrtVsSt0DWwe2;a0BViTtS;en,i4uN;er0t0ED;iSrä6;er0oK;e3p0uS;la01H;a01GeTiSs8te2;er0tiL;miLn;aWem0U0oVuUäSünM;di4tS;sc0RAt0;m0LQs8;m0R5tt0;g0ka6nSp0TVt0G2uOYzi4;en,i4s1;cUeTgm0IBl0NJnSrs1ss0;ke3n0se3;p0VPse3;he3k0;antaLilosop0SZot02R;eUlSroFus1äR;a0KQeg0icCüS;ck0g0;f0T0if0r1;dikZiYll0nXrTs0tS;it0DOz0;fTio4Sl0mu6sonSv7C;a0NNi0S9;eSoI;kt0DK;de3n0s0DJ;l0nBts1;ür0;ar0cKVd0PMff0nZpp0rVss03EtUuS;k0sS;chaliGBen,i4;en6s1z0;aTfü0NTi4keSs0tiRCzZ8;n,t6;bo0NBg00GlSphraL;lelsc0F5yL;i4s1ts1ze2;b02ef02RffeYhrfeBkWmit6naKpVrSszilNxi0SUzo0MV;dTgSi0HJt0;a0MTe3;e2iKn0;eIfe2poKti0NK;kSt0FB;lu0SOu0LG;nSri4;bTha0V3lIZzuS;ha0V2lG;ar0le0C5;du0RKjek5Wser0Q1;a0Oe0Li04o00uYäTöSü9;l0r0RAtB;c07ChTsS;e3se0LC;eSr0;n,rS;b05Fn;de3e9ll0mSsc0QJtz0;eImeI;mUrSti4;d0mS;a0MLen,i4;a3Oin0KG;ck0eSpp0st0;derSse0L1t0;b04faEgDZh02k00lIGmZpras0TOrYsUtrTweITzS;ulIFwi5;am0SKet0;a0U0chUe9iPtS;amFeSoß0reH;ch0ig0;i0SRlOmM9rei0II;e0IMi5;a1et0LLäh0;nSämF;i0üp0SC;aSol0;lt0u0;eLFiGlSrTKü0QJ;as0;beTgi4hm0i0QFnn0pp0rv0s0Q8uS;ma1ro0M8tXB;ln,nor0QS;be3chWge0KIheVrUsTtS;ioPWuX8;aNch0;ko0M3r0;b04Kg7koAl006st7tr0MW;a15b11d0Ze0Wf0Ug0Sh0QimFjOk0Ml0Jm0Ine0N3p0Gr0Cs05t03vZwVzSä0N1;aJe0NAi7uSäJ;dePg7h04PkoAlSpruef0spiU7voYwe0EV;a0TRes0;ac0GXeTiS;eg0nk0rk0;iSrf0;n0s0;erToS;llQ4;sStYN;ic0OP;aPraSön0;g0ue2;ag0chWe07YiVpUtSu1;eSiAr0MRü0HH;h0ig0ll0;iTSr0BRü0JU;n01Vtz0;aC7lSme0HNne0P0re0AIwiAü0OY;ag0e9Z;eTuf0üS;hm0st0;cQd0iSnn0;ch0f0s0;fe0QUrS;üf0;a0JVe0Q4;aTeSie0QBös0;b0g0rn0s0;d0ss0uf0;aUli5oS;mm0ntrS;olN;rt0uf0;aSe1EiPol0ä5;k0ll0;eSi0R9rü0IBär0;b0h0r0JR;aLPe45i1EoLNrOüS;hl0ll0;iTmp1ErSss0;zäJ;fe2l0;a6ePicCrSun0S5;i5uHä5;au0eTi065lSoDri5;ei0AAiHut0;reSs0SGt0;cQit0;hm0r0SM;a1Le1Hi0Bo03uYysMPäWöUüS;h0m0M6nSss0;d0z0;bSg0r0OI;e3li4;hSke3st0ßB;dres1en;c0P7ffe0IRmi0OUnVrUsTtS;en,i4maß0;i0OTte2;ks0me3r0;d0ke3te2;bi0K3dVge3nUps0rTse2tS;i0N6oX9t0z0;a0K1d0s0ti0ON;i4oMBti4;eSi0OLuN;lTrS;i4niL;li4n;e0P8gIl0Wm0n0Us0PtWx0ßS;acCbTfaEg0Rh05AiSli5r0ITtr0L8v0Qwir0LJ;ntIF;ilSrEZ;d0lB;a0Jb0GdePe0Ef0Bge0Ah08k07l04m03ne0KZre01sZtWwi01MzS;i7uSäJ;bTma1r04CtSwi01K;e0LNrO;es0Eri5;a0IJeTrS;ag0iP;il0ln;a0RIchSi5pFF;le0NEne0N6re08Owi5;cQd0iS;s0ß0;a1is1;aTeS;id0rn0;ss0uf0;riGämF;a0RCeSör0;lf0;b0s07U;aDiTliGrSüJ;eu0;lm0;mpSrl0KFss0;fiR;eSri5;koAnu9sSweXM;tiA;ns7r0R4;ch0sSt0;acCbUen,faEgTh04CioKli5r0HVtr0KAvS;er0M5;lüH;iY8rE0;de2iS;atuVYm0GN;de2iUD;c0B5di6hr0iUl0KGmoIng0r0L4ss0tSu8;al0IOhoSze3;diL;d0s8ße3;ch0ge2h04Al00mFnYrXsWtVuTxi0J1ßS;en,ha0QN;e2l0sS;c0MCe2;er5Che0IN;e2ki4si4tur0LJ;iKki4moIsc0NJte2;ag0ge3iS;fGYpuN;en,ne0JL;a0Se0Ni0FoWuVäUöTüS;ft0g0m0K2;c0LFf0MNhn0s0NFt0;c0M2di4hm0p0O2rm0s8ut0;g0ll0n0HRpf0stw03Nts1;b0c09de2es0gg0hn0ka0I6mbar0NSsTtS;en,s0te2;ar0QAb05don0OOe04ge0CYhUNk02l00ma0AHpla9rYsVtreUwe0BOzS;i7uS;scZNwe0BM;nn0t0;ag0chTpr08EtS;e0H5ü0DK;i0OElOra0LK;as0eS;iß0nn0;aSeg0ös0;ch0ss0uf0;a0PTe0LGoS;mm0p0NX;is0n;e0NXiRrS;a0PBe1i5;h0ke0EP;beSXcCeVft0k0mi6nUqui0N9sTteraS;liLriL;pe3t0;de2i4;bSfe2gAL;be09Den,gTkSäu0LX;os0;ewi0OJ;b0ckYZde2erVgUh02AiTktoIm0HLnk0rn0s0uSxika0HF;cCgn0;b0d0e2h0m0n0st0t0;a0HCen,iti0HS;en,st7;bYcXd0ge2hmWk6ll0mVnTpp0s0EOts1uS;e2f0g0s0MFt0;d0gS;dr7en,we0J7;en6iK;en,lG;h0ki4;be2e0E4oI;a2Ke2Bi29l1Tn1Jo0Ir04uVäUöTüS;be3hl0m0EUndBr0N3ss0;de2nn0pf0;m0MGu0;ck0eYge3lXmuNnVp0N3rTscSt0M1;he0FG;be3i4si4v0zS;ar0P1ha0OYsch98tr0HW;dSge3;g0I5s0IJ;ti0JW;m0EKrzeS;n,rtr0HR;a01eZiWummUäTön0ümS;e3m0;c09IftBh0nz0u0NU;biGlSne0HV;a1eg0;b0E2ePVmiKIn0KZsTtS;iLze3;e3tIV;de0FFiSm0MMpi4uz00E;d0er0s0LM;b0DXch0keOUll0mUnkStz0u3J;en,feSla1s9W;ie2;en,pf0;ch0hl0k0Ql0Mm0CnXoWpVrTstStz0;en,ü0GQ;k0rS;eNi0KQum0EM;f0JHi4pe3;peIrdiK;d05f02gr0G2ju0KNk01sYtUvTzS;entIi0EI;er6;aUe2rS;aSolN;hi4s6;ktVWmiK;oli0LKpiItTuS;l6mi4;a6erKit0FTr0FT;re0G2urI;eTiSli0KCron6ödeI;guIr0G9s0KG;kt05Rri4;enLit05Q;biKmXpS;aIenLiNlToSri0G5;ni4s6;eTiSot6;m09Yzi4;m09Xt6;an0L6eTunS;a0FJi0K6;nSrz2D;!ti4;lToniS;a0FFsi4;abSi0L0;i4oI;eSs0;ln,t6;aXeWiVoUuTöFüS;ll0p0GS;eFff0rr0s0L2ts1;be3t0;ck0MYen,ps0rs1s8t8;be3cCif0t0;b0M0ck0MWll0pUrTt8uS;se2ts1;r0z0;p06Ws0;a04e00iXoVuHUäUöTüS;ge3n0JE;hn0n0;ff0r0;n0pStz0;f0p0;mTnSrr0;ge0DCk0;a0EZm0pe2;b7TckX3iTmSt8;m0p0LA;d0nSs8;kBWschne0ID;bas8c073er0ff0g0m02VpBYrSssi0Qts1u0AU;en,k5Oma1sS;eh0teE;cSek0ff0ll0pp0t0KH;he2k0;ge3hr0iZlXnTrSs0LPtt0u1;b0ke2n0;nSte2;enSze0FW;! Sle0A9zuS;le0A8;lSte2;e2ne2;f0l0m0;c0I3hl09ke3l07n05p01rWsVtTuS;e0B9f0;aSegoREho0E7;lPApul6;c0J9erKpe2si4;amZ1iVr0tS;eToS;gSZni4;lNn;er0ki4;e2iTp0se3uttS;g7kB6la1ma1;er0tS;a0DWuN;a0DVdiSo6Qt0ze3;di4er0;b0kSts0LR;en,uN;f9Psch4;aWoVuSät0;bTc06Kri4stiS;er0fi0IB;e3iN;bb0de3gg0hl0;g0m0BEps0uS;c06Fl0;d0Jg0Illu0Hm0FnVo0D6rrTsS;la07KoN;eSi6;füDle0LNn;d08einander07f05ha04ji0I2krem07Rlinesk0CEne03sYtTvS;es6ol0GI;eShro0D0oKri0HV;gInUrS;esLn0B7pSveK;oNre6u0D8;di4si0GD;eIpiVtSzeK;aTitutionFZruS;i4ment0B2;lNndbe029;ri4zi4;ha0L6woQ;f6li4;iSor0DH;ltIzi4;f0BZgBN;exi4i0HLuS;strSzi4;ia0CW;i6ke2mu0CIpS;f0li0HHoOAroviL;miKstI;e3noI;eSio0CX;a0CQnF0oRF;a5Ee2Li0Ko02u00yZäVöUüS;lSpf0t0;l0s0;hl0r0;ck0JSke3m0AEnTrt0tSu0HY;sc0GE;dBgenSse3;!bSTla0J8;dIpno0CO;ldBmSn0C0p0s0IV;a0C2i0H1;be3cXer0fWhnVlUmoge0C1noIpSr0ITspi6;pe0AWsS;en,g7ne0DL;en,pe2z0;la1sp06U;f0i4;hSk0;a01b00diWDfaDg7h42jZkYl0DJne0DGpäp0ICreXsTtr8KzS;i7ücC;chUe0D9pTtS;a0I9eXGi0C4r0DG;iKIül0;au0JLneEreHä9;cQiß0nn0;la0EBäA;ag0u09H;iRri5;cCr0K3;e1Mm0DOnS;a1Cb18d15ei0Yf0Wg0Th0Sk0Rl0Pma1ne0GQp9Rr0Ms0Bt02unter00wWzTüberS;b3VfüDla0E5r3NsM7zi7;au0IPeBi7uSäJ;dePf0ASgeseEkoAne0D1se9tr0CTwe04VzS;ufuGäJ;eSiTM;gSis0lk0nd0rf0;koAse0CStS;aeWWrö0J3äWW;b3NfSstü07Ozi7;li0I1üD;an0EUeSrEN;nXrS;e0I8frOgVhSk0CWl7Hzi7;ak0erS;faDrä0FPsS;chwimme,eRpU4;eh0i0HU;ansSRüberS;faEki0DN;ag0chVe0CFiO3tS;eTrSü07C;eb0öm0;ll0rb0ue2;a23e0EWi0CJlVmTre00EwiSü0EU;mm0nd0;eSi4;iß0lz0;aTeS;i1pp0;cCg0;a0C7eSicC;iSnn0;b0ch0s0ß0;aSeg0üm0CP;ng0ss0uf0;a0A1en,lo9ni0oAriG;aKCor1ä5ör0;eSi0H9;b0hSr09R;en,ör0;a03XiRlSüD;e0F4ie06Uäz0;l0nS;bWfVhä5l0FUpUr0H1sSzi7;chStü06O;li5;a0HAroji0F7;re0H9üD;em2KoD;eTrä5urchSäm08A;ar0IMf2Tkr75zwä5;nk0rn,ut0;eUiGlTrS;i5üt0;aAAät8;g1Tm2Ds0I9;bsZr0IGuS;fWsS;g7komplimenti,r051sS;chStü069;i0GMrS;ei0;b25r04XsSwiRzi7;cSVteE;eh0iP;rSv0;bVherS;bTe0BZfüDgeh03UhSWkoAlGre032sStr6CwO;ch0Te9teE;em1Zi0DKri5;e01RleZ3;b0ch2Jft0g0i2Al29mm0rTtz0uSx0;c0DOe2l0;a1Cb10dePein0Yf0Xg0B5h0WjOk0Vl0Rma1ne0B2oiLr0Qs0Mtr66u08vorXwWzTüberS;b1TfüDla5r1LtrOzi7;au0GNeTi7uSäJ;e0BQs0HO;ig0n;e60iP;br001dr01g7h0AZkZl25q01LrYsSt4UwOzau0GJ;chVprUtSu1;eSoß0ü05N;ch0h0;i5u0BO;au0iS;eß0m07A;ag0uf0;eSoA;hr0im0;i5ä5;eberDVmYnterS;bWd6VfaEkoAma1ne0AKrTsStrO;c1Le9;as0GGeSoE;iSnn0;ch0ß0;em18ri5;fXhä5lWr03YsUtTwir06NzS;i7uscQP;a081ön0;cQNprS;e1i9;iGun08K;aDliGüD;ag0chTe8SpRNtS;aAeE;aSi0A8le0B7;ff0u0;ei1icCs1uf0ü05G;aUeS;g0iS;e2h0t0;ng0uf0;oAriG;a0GRol0ör0;aEiRliGüD;faErS;ei1uf0;eSi0C7ri5;g01iSkoAm0LorMqu081s0GHt0;bR7dZe0AIfYhRFla0GIrXsUtrOwTzS;i6ufGK;iPüRY;chTeQpR4tS;rA2ü04G;a09Kle0AOw028;e0FFuf0;liGüD;rä5;le0GG;b0Hn0BuS;f05sS;ar0GCb03f02g09Ih01k00l7Hpu9rZsUwe4IzuS;fSha0G8koAne09Es0G3;iRueD;chiVpSteEu1;iGHrS;e5iSu0A6;eß0ng0tz0;eß0nd0;ei1üH;oAristallisi;a0FZeb0;il8üD;e046iTFre1;bUfTrSse9zi7;ei1oE;aEli0E7üD;emS;üh0;g7kr4Dma1rWsUwac02VzS;uSücC;fFPkoAzi7;chSpiG0;l02Dme03W;e0D8üH;fVreUsSzuWM;cSe9iP;hie03W;gn0iß0;li0DU;f0l0;lZmSr06Bte2z0ßIE;bWe3fVgeBhQ8kUlTne08Kre00EsStrOzaJ;en,u1;eucC;eDoA;aEiRüD;egSri5;eb0le0FC;en,igsp01O;e3t0;ar0b05ck0de2ft04ge3k0l02m01nZpe2rVsUuS;ch0en,sS;en,i4si4;ch0pe3s0t0;moTpuKr0tSz0;ko1löt0;niS;er0si4;dSge3ti4;e3h07G;pe3s8;bi4f8lSs0tHT;en,uziK;enMZ;en,iS;li6;a1Ue0Ti0Ql0Do0CrXuUäSö0DP;hn0n0B0rS;en,t0D4;ck0m06ZrTtS;he02UtZ;ge3r0t0;a00e0CSiZoßWuVäUöl0üS;be3nSß0;d0fäL0;m0ts1;e0D2m084nz0p04Qse3;ma1sTtS;un;chVF;ll0ns0;b0dWps1sVtTuS;l0pe3s0;iSuN;fi0ARni4;en,si4;i4ui4;e0D4lf0n09Io0AG;a02eiXiWoVuUäTüS;ck0h0;nz0tt0;ckO9ps1;ri0AItz0;b0CReMmme02Wts1;chSs0t0;en,la0DTsTzS;i7uUW;cXMe9tS;eN5iA;sLMttSub0;bü0A3g7ho036str00Hzi7;eTft0pSt8;fe3s0;r0ß0;b0Qd0Of0Mgen0Hh0Fi0El0DmCKn0Ar02sWttoiLwSzi052;aeTiSoeQäTöQ;cCnn0t8;hrS;en,lei0CW;ch7eEtVundS;b06Fen,ma1pflGsS;chrStoß0;eUJumF;aSeh0iZK;lt0tt0;aWb0ei1iSma04Wnh05W;er0nS;gSn0;acCsS;chä9;deSt0;biGrNWsS;e9i9;eTieSuGüg0;r0ss0ß0;hmBr02Vs0;a5e0D5i5ob0t0ü0CE;g0l0s8z0ße3;eSor1r0ör0;imWQnJE;bu1leVsUzTüberS;sM7tr05U;e069usS;te03X;nk0s0;aSri4ähY9;ehY8ll0ngenWJ;eSuQ8;ih0nk0;en,i05MrSär04UüD;au1;be3ff0l02Wm06BnzYTrTs6uS;ke3ne2;an6en,ko1ni4;a35e25i21l1Fo0Jr02uXäVöUüS;g0h02Wll0rSt8;cCliebGY;der029hn0n0rM;che069de3lSrb0;l0s1;ch08GeXHg0m062nUrTsSt8ß0;ioKse3;ni4z0;di4gi4kS;e02Ption022;a06eWiTot03HuSäs0ös08B;cCst0;er0sTtS;i4ti4;chF3i4t0;iUmdTquYCss0uSve3;en,nd0;e3g7schäm0;be0A4g059haXka0BXlWma1ne056pVsSzube0A4;cHOe9pTteS;h0ll0m0A0;iC9re1;re0AJ;a0AIeg0;b0lt0;cCg0ktTPnSp024ter03D;ki4s0z0;erMkusLl0Mpp0rTtoSul0;graPXko021;ci4de2m0Is0A1tS;b0Ed0De05Lf0Cg0BjOk09l08maVYne04UpfL9r05sZtrYwUzS;aJeSTuS;fBMse9;eUiTäSüN0;hr0lz0;rk0s1;rf0;ag0eSL;chUeTpM2tS;eJür8A;hn0tz0;eTi04MleSneEreSHwiA;i1pp0uM;r0u1;eSä07G;iSnn0;s0t0ß0;a09Ueb0;oArS;ie1;eb0i09H;aEliGüD;a025ePrä5;eTiOJlSri5;as0eS4;g048st7wG;aSen,i4uN;liLti4;geZUte2;a07e05i01oYuXäWöUüS;cCsS;sigX0te2;tenSß0;!g7;mm0z0;chS7kt02JnV2pp0tWJ;ck0pp0ri4ttS;be08RkS;riG;eUm00BpTtS;te2z0;peZH;g0h0s0ß0;cSdMge3h0k6nn0ts1;ht0k0;cUgg0mTnSt8u0;i4kI8s1;bi4m0;hSke2;dSen,faE;rüH;eUlTnSrmI3s1xI3;an06Sd0gi4;e6m0te2z0;be2de040;cCde2g0hl0Ki0Fr0AsUtSu00R;iscSt0z0;hiL;se3tS;beYAf05h03ig0k01lZma1nYsVtr02ZwUzuS;ha0A0lGsS;chR2teE;ur017;chrTe9i9teS;ck0h0ll0;a05EeQZ;a066e030;a09QeSiG;g0s0;e03OlS;amZGe07FoF;aSe08U;k0lt0;aDre08A;ke3nUtigS;bSen,ko1ma1s09GweV2;e07Ori5;bHRha09JlePsSzuTB;eh0pVZte00L;eYFlVnS;d0maTschS;le071ne051;ch0hl0;bi02Ben,s1;bi04Wen,gXinTle09GschS;i07OlO;tTvS;es6;erpS;re6;re06S;ch0hYkXlVng0sUuSx0;ch0lenSst0;!z0;e02Ws0t0ziK;lFGsSt0z0;chFCi05J;tuI;nd0r0;-ma02Ub8Jga00Uh8Hi4VjaV3ke3l4Um4Hn23r03s01tZuropäiLvak00RxS;eXhWis6pTtraS;hi4poN;an06DerimV3lSoC7;aKi05DoS;di4ri4;i03Ru014;ku6r05A;abNikS;et6;kSs0;aNor6;a1Qb1Ld1Iei1Hf1Cg19h15in072k11l0Xm0Un0So0Qp0Or0Ls04t01ui4wUzSö0RübrB;aeJeSie01Xwi5äJüWC;ug0;aXeViTäSü020;g0hM3rm0;de2rSs1;k0ts022;ck0iSrb0;s0te2;ch081eQrt0;aTe028rS;ag0iPä04G;pp0st0;a085ch01eZi078pYtSu1;aVeUiTreS;b0ck0ik0;ck0nk0;h0iZLll0;rStt0un0;k0r0;ar0i8Däh0;hStz0;en,n0;aXeWie03RlUreHuTwSöFüt8;er0in01Z;et8;aSei1ie03O;ff0g0;in0;ff0ll0;at0eTiSöt0;cCng0;cQg0i1;i1rS;e06Aob0;be2eStiL;fF1r8;aeDeSiedrBt0äD;nn0ue2;aTit03LoSutBäcJXög73üd0;eg72rd0;hn0tt0;aUeSiGäu8ös04I;b0dBg0iSrn0;ch8d0;eu8hm0ng0ss0uUE;aUe06Bi04FlTraPundJ5äS;lt0mF;a4i4Fär0;lt0uf0;aUeTi9oSäX2öKR;eh0ff0l0;b0i8ll0;l2Gs1;aTeTUi05GrSäXY;e04OüR;eXWt8u05I;aViRoTrSueEüE;ag0eu0is1;lg0rS;de2s1;hr0ss0;fe2gn0l0;enTol1rSuKC;ei066os05X;!k0;aVeUi02BlSrP2;a05Dei1iSüh0;ck0nd0;b0n,t06Hut0;rm0u0;cChn0r06P;d0g24tS;a22b20carBQdeHe1Xf1Og1Fh1Cjung03Qk11l0Vm0Qn0Np0Lr0Is03t01wXzS;au05CeNPiVweiSüR;bThAYma1reURschS;lOne023;eUPre1;eh0f03L;aUeTiSurXNöQ;c05Trr0s1;i1nd0r03M;fDRrn0;aSechXUhrBAäJG;bY3rn0;aG4chZeYiXoZQpWtS;aUeTrSör0;öm0;h0iELll0;c01Vmm0ub0;a053ie02FrOE;c015n3S;nd0u1;aeXe01MlTuldHUwiSäX;nd0rr0;af0eiUi04BuTüS;pf0s051;es050mVM;ch0m0;dBrf0;aIZeU2iTo056ät04XüS;ck0m03Ust0;cCe023nn0;aHeEoliXUuS;de2pp0;aTeSä04B;hm0rv0;tu8Tzi025;acCetViUonoTutBysSüUY;ti023;poXG;ef0li92st0;alXE;aUeTibe8NoSü04L;b0ck0hn0;dBer0ih0;d0ngTrv0sUOuS;f0s0;faDg7la058;aCDeT2l00oUrSup03C;aSiminYä04EüYY;e04DmF;loniWmSp039rk0;mTpS;li01PriXI;eSunT;n,rzialisie;alL0;amURe00NuS;mp0;aTe02OoYUäSüE;rt0ut0;ar0lt0upt0;eSi041lI1rät0;gSh0;enSn0;ar04WbFFeYQfWha9NkoAla04QneXZsUtrTwiEMzuS;koAse9wiEL;ag0eIO;chaEeXRtS;eE1üSO;aDie03HüD;aYeXiYIlUormaWKrSug0äB6üD;acCeSo03Z;md0;aTieSu02S;g0h0;gg0mm0t8;rn0s03Ltt0;ch0lS;l0t0;hr0iTrS;b0n;gn0l0s0;alVUeDiRlSre03BürokratK9;ät8öß0;lkoW0rt0utoWC;a00Nen,se9;an03eri6ot01pSul00M;fZorSör0;ar048dERfAHheXrWsSwiR;chTpEQtS;eBrXC;au0neEwS;eb0i5;ag0icC;b0lf0;a5eJiR;ioS;naVT;ziU6;aboIektriGVi73;ch0e2fe2gn0l0nTsSte2;en,la03P;aPMb31c30d2We2Vf2Pg2Jh2Ei2DjOk24l21m1Wn1To1Sp1Lq1Kr1Ds0Ht0DverBZw08zSäWJöl0üb0;aJeX4i7uSwä5äJ2;b04d03f02g01h00lXmLXneWVrWsStrWNweR;aHchTe9pi40tS;eCZuf0;aSraeP;e9lt0;aeZQei1icC;aTeSo00N;g0it0;d0ss0;a03Gol0;eh0re011;orMue2D;aeAri5;eSiR;zi7;aVeTiSoQurUJ;c02Peg0llBnk0rk0;b0ch02CiSnd0rf0;ch0h0s0;cQAnM;aTeX2oFrSuPüt0;ag0eQEich8ocX8uX6äuZFüb0;nz0uS;ch0s1;a0Lch04e03i02or6p01tUäS;g0uS;e2m0;aXeWiVrH0uUüS;lp0rS;m0z0;di4f0;mm0pp0;cQGh0ig0ll0;mFub0;aQLeLRi33rQH;nIUtz0;gn0h0if0nYZtz0;a07e06i05l02mZnYrWul0wTäSüY8;rf0tz0;eTiSäQLör0;mm0ng0;b0fe3nk0;aSei31umFäP;ePub0;aWPeiUNi9ür0;eSi4ugYS;iSlz0;cY5ß0;aX1eSieY6umS3äZJ;iSpp0us0;ch0f0m0;eQNff0;nk0r0;chYBlt0rr0;g0lSmVWrg0uG7;b0z0;aXeUiToSäuH4üYA;ll0st0;cCeYFtz0;cQd0gn0iTnS;k0n0;b0ch0h0s0t0ß0;eY5hm0mm0st0;uar6;aXenVZfWin011lan0rTuSö01D;de2mp0;e00IoSäg0;grS;amU6;er1laSNroF;ck0rk0ss0uk0;peIrYF;eTi012äS;h0ss0;be3hm0;aVeUiToX6üS;mVAnd0;et0s1;iLSng0;ch0hn0rYIue2;aTeSieQOo1uEäH5öQS;b0g0it0nk0rn0s0ucC;d0ge2ng0ss0uf0;aZeXiWYlVnUo1rS;a9eSiG;is0uz0;eYXiHot0öFüF;aQZeSiPoF;b0id0mm0;hr0il0l6OrSs00C;b0ke2;cWXlNCp00AsLuf0;ge3mF;aVeSiev0ol0änHEüSA;b0ft0iTlf0rS;bra00Lg7jOre016schlenM;l0ms0rRXz0;k0lt0nV2u0;eViUlTrS;ab0eZ7upR9;as0eLXieM;eß0ps0t8;b0h0mSst7wöQ;eiR;aZQeWiRlUorMrTueSäLYüR6;g0hr0;eZEi4;ecCiSöß0üs8;eZFpp0;tt0ue2;bn0ng0rnt0;aUeTos0rSäA;eh0iIUüH;i1ll0uYS;eAmF;heHrRX;a00eYiXlVoot0rUuTüS;rRXß0;cCdUHnKS;eLXi5;as0eSäu0;nd0u0;eg0ld0nd0;ha00AkeZAr007s005tSzi7;oKt0;lsaSLu0;eSr0;li1;b0n0;a41e38i2So2Mr25uXynaM3ämWöVüS;be3mY5nTpi4rSs0;f0st0;g0k0n0st0;rr0s0;meOXpf0;ck0de3elNft0ld0n1YrTsSz0;ch0e3;chSst0;aLQb1Nd1Le1Jf1Dg1Bh18jOk11l0Ym0Xn0Wo0Vp0Rqu4r0Ls02t01wXzS;eVi7uSwä5äJ;drD9fTsS;c9Ae9;ueD;ch0icQ;aUeTiSursVSäMOüJ;nd0rk0s1;b0i1tz0;nMs1;aQGeYYreTR;a09chZeYiXpVtSu1äg0;aMReTiAoß0rSöYCüN1;eiNTukturFHöm0;ch0h0ig0ll0;iSrHRül0;el0;eb0nFItz0;ge3h0tz0;a00eZiYlWmVneUYrTwiSütVF;mm0nTDtz0;eiS;b0t0;eT3ugVK;aTVeSi5änVJüF;i1pp0us0;eNImOV;in0ue2;b0ll0u0;g0uV4;aWeViUoYEuTüS;hr0tV3;f0ts1;eY2ng0;cQgn0iVBnn0;s2Pus1;auUeiX3lumOFrS;eXHob6OüS;f0ge3;k0s0;rgaQB;ag0eRWuR0;aIZeXC;aTeSiGöcTRü8K;b0s0ucC;d0ng0ss0uf0;au0li5nWoUrSämVZ;eD6ieS;ch0g0;mSst0;m0poK;eSöF;if0t0;aTeSol0unPVä5ör0;cU4iz0lf0;lt0uVF;eL2lSreVX;ieMüh0;aJDeWiRlVorUrWVuTüS;hOMt8;eDt8;m0st0;ecCieM7utJZ;cCde2iX0;iSss0;l0nanderb8O;ePisP2rS;eh0i5ueHä5üH;eYiXlVoUrSürXC;aSeJHi5;t0us0;hr0x0;as0eu0iHut0äS;t8u0;eg0ld0;iß0koAtTVuTV;ke3st0;a01eXiVoUuTänNDöSüH;hn0se3;ckXDeH;h0sWR;bN1ft0ll0nStTP;b5Tg0si9;h0inTsS;ch0si4;fiRrA3sS;chQS;ht0maPKnVufS;gQOlSma1zaJ;eg0osS;arXGlaXA;b5KgTkSma1neQIse9;lQKoAriG;eb0saN;ck0gPCkVlmeVHmUnVQpTs53ti4uMOwnloSzi4;ad0;en,pe3;es09iK;tSumJE;e2oI;a03cht02en0ff00k6mensEZnZpXriTIsS;kUpoKquaTKsTtS;anTL;er6iUJ;rSu6;eOZi07;lomSp0;aP0i4;g0i4;aP7erSunUD;enTDi4;en,ma1;gnTlS;o3DyL;osS;tiT8;b0Jc0IduT7eskaNf0HgraU6hn0ich0GjP5k0Bl09m03n02pZsXtVuFTzS;entTiS;di4mME;raOH;erSoK;miK;er6iS;llusECnSZ;laToSriOSu6;ni4r6;ci4tSXzi4;aziSVk0unSW;aWen6iUoSütB;duNk1Kli4nSraO7;stIti4;liSssE4;ta1B;sI4theO9;eSKfSl0phS;in1S;artVlToIreS;di6mIB;aSiK;ri4sL;elN;en,se3;iKorOA;k0oTF;at6ü6;b0Qch0emFfür0Pgegen0Nh0El0Dm0Cn07r01s00ti4ue2voXzS;uVwischenS;fTrSst7trOQ;ed0uf0;aDuP;koAleJHsCRzaJ;nTrS;l1Vs4Y;b3UePJf0DkoAlaVJma1steJtrOzi7;i9t7;anWbVinsi9lGrIAsVFunterUz4UüberS;faDlGsS;chCLt7;b3PfaEhOQsCJ;en,iOEri5;klOOse9;ebenSk0;beUfaEhTliGsS;chiTP;auSE;neOG;e3pf0;aTViG;erZinS;dämKWeP3fXgeHXlOFraOAsUterSwe29;kSst7;leAni0oA;chTiSteE;e1nk0;eQNleP9meOWwiR;aDliG;f1BkoAlaUWr7K;haSwi4R;lt0nOZ;haUWköTWst7;eSleBZ;haUUiS;b31si9;aXhTlSoSBrM7;on0;arakteUeHiEoreogS;raS;fi4pRP;riL;mKXrS;boM5;a70e1Fi15l0Lo0Hr04uXäWölVüS;ck0fQUge3nOLrSx0ß0;d0geJGokSst0;raML;k0le2;ndBum0;chXdOGeWgLhVlUm12nSt8;ke2tS;fä0V;le2;en,l0;nOBss0;en,staP8t0;a01eZiYoXuUöcTNüS;h0ll0sSt0;ki4t0;mm0stStLD;scS;hwiA;de3ws0;lNng0;ch0itSms0nn0;en,ma1sc3GtrMW;bJCch09ndTt0uS;ch0en,s0;en,ma3O;hUlz0mbTniQDoSrg0taLEx0;m0t0;arRBen;ne2r0;a07e03i00oVuUäTöSüh0;de3k0;h0t8u0;bSGt0;cFKndVßS;lTstS;eEramRM;eg0iG;fä01i4;ckWnStz0;dfSk0ze3;liG;ch0iSnd0u0;bSch0;enS;!laRY;ff0mi4nkpUsSZuS;fäSma1;rb0;oNu9;bYeXlVmUnd0oStt0;loS;giL;me3s0;anPMdSlB;en,haK4;de2g0t0;be2liS;ogS;rapPY;a54b53c52d4Xe4Sf4Hg40h3Ui3Bj3Ak30l2Rm2Mn2Jo2Ip2FquKBr1Ws0Tt0Ku0Iv0EwYzTäS;ng41ug0;aVeUiTuschuRHweS;ck0iP4;c57eh0fPYrz0;icQug0;hl0uRJ;a04eZiWoQuUäTöS;lk0;hr0ltBsL2;cNPnMsstS;ma1weE2;llBrS;k0tS;en,sM5;g0iUnd0rS;b0f0ksteSt0;llB;hräSn0s0;ucNG;chS1eTfShr0;fn0;ltB;oSölCM;llm48rS;muRst7teM4zuS;g0st7;g0l0nruhBrSteIL;kuRlaNNteM1;aZeYiO6onXrTteIJuFäSör0;tBub0;aUeTiPäuOCüS;b0g0;ff0ib0t0u0;cCg0u0;en,i4;ilBn,ue2;etBnk0ts1;a0Tch0De0Ci09o08p04se2tTuSwi5än20;ch0de3;a01eXiArTuJäSöQüFR;rk0tBub0;aUeS;iSu0;k0t0;f0hl0;ch0hSig0ll0ue2;enSl0;!bS;le8N;etBtt0un0;aQHiUrSuH;eSi9üh0;ch0nQV;el0tIN;hl0ld0rg0;c3ReTnStz0;g0n0;de3geHQ;el0ge3itBtz0;a06e04i03l00mYnXoenBrVuUwTäSönBü9;dBftB;er0ic3Lör0;h0ldB;aePeiSiQ9äP;b0en,t0;eMOupOTüfND;i4uS;nI9tz0;agTeSieMS;i1unB;en,naK3;cCeß0lMmFrm0;iSnk0r0;n2Oß0;d0edBff0ll0tt0u0;bPLen0Yg0it0m0uf0;a06eYgXicWst0uTüS;cUhr0st0;eSf0h2J;cShr0;ks31;ht2G;en,steB;chYd0iSu0;cLMf0nBs0tS;eVhaQIma1sTzS;usQC;teS;h0ll0;n,rklär0;n0tB;pp0tTuS;b0m0;en,scS;hlO;aHfTiS;ePBnPBss0;laH1;b1DrM;achTeSot0u9ötBü9;be3hm0id0nn0tz0;r2GteilB;aVeUitleLNut8äSüh0;c2FnS;ge3te3;rk0;l0nn0;aYeWiUl0oQu12äTüS;ft0g0;cLLmFKstB;cCeS;b0fe2;b0g0hr0iSmFHucC;dBh0;d0ge2ng0sF0uS;e2f0s1;aZeYlUni0oA8rSuRämFö0TüDM;aeSeuzBiGäSüJB;ftB;aUeS;b0ckSid0mm0;e2s0;g0ts1u0;hr0nn0;emFke3nntS;gINma1weAV;ah0uES;b09cCdr7f08ge07h06koAl05m03n94orM1pfl02rr0sVtrUwoQzSß0;en,uS;be92lGtrO;ag0et0;cXeVi9pUtS;eSiA;h0ue2;ri5;iteStz0;lGschiIC;haI6;icC;eSis1;ng0ss0;ad0eg0iG;ol0;b0seE;oA7üg0;e8MiGri5;aVeSinMä5üt0;b0iz0lTrS;beI9rs1zB;f0lB;ft0lt0nIRrr0uS;en,pt0s0;a07e05i04l00nZrWuUüS;nSte2;stB;ck0tS;acC;aTeMRueRüS;nGNß0;bAAdB;adBuGüg0;aubBeiMQo9uUückS;en,wüS;ns1;eHps1;eß0nn0;b0gn0hSis8;en,r0;ff0tt0;a01eZiRlXoWrTumHVähBörMürS;cCsoHNwoBD;ag0eTiSucC;edBst0;i0md0;erMlg0;a4UeSüKC;ck0iß0;hlSstBuEK;en,ig0;hr0ll0ss0;hr0iTnd0rS;b0dB;l0nS;druHfluMFtrS;äc06;aVeUiTrSuMU;oh0uHä5üH;en0;ck0nk0ut0;nk0ue2;he2irc0;au0en,ilM;bsXcCnTrNMtm0ufS;sWtrO;sTtS;rOwoAO;pStaR;ru1;icS;htB;ck0d0g04h03l02n01rYsXuS;chUen,me3sS;ch0pS;ar0;en,rS;ed0;i4te3;bi4rS;en,iS;kaKL;aEYde3g0krottg7n0;aXd4Tg0kaEKleBYsaFDz0;n0r0;atSge2;elEU;al0bFHchtFFdFCeFAffF8gF3hF1kEOlEHmEEn97pp96r90s8Wt8SuUvSxioEZ;aSiL;nci4;f4Qkt4PsVtS;hentiToS;maEVriL;fiJAsi4;a4Jb43cheHd3Ue3Nf3Ag34h2Xk2Jl2Bm28n27p1Xqu1Vr1Ms0Ot0Iu0HverkaMMw0CzSüb0;a09eG2i07uSäJ;arMQb04d02g01h00lYma1nu9pf0rXsUtaTuFWwS;eiBX;us1;ag0chlFNeFLp91tS;aI3eS;ig0ll0;aeINicCuf0;ad0ieJMoS;es0s0;anGG;eb0l93reD8;eQrS;ueH;au0iSreME;ld0;eSrLOs1;h0r0;hSnk0;l0n0;aVeTiSri5ucCä93;cLJeg0nd0rk0s1;chL6iSrJCtz0;ch0d0n0s0t0;c94eJlz0nMs1;eb0fe2;aWeFVi7Aob0rSuFüfI1;ag0eUiToSäI3;cG0mpEU;cIRnk0;ib0t0;ri4us1;a0Och08e07i05o04p00tTu1äSöQ;en,g0;aWeVoUrSülp0;aJeSöm0;i1u0;pf0ß0;ch0h0iGAll0rb0ue2;fSnz0tt0;fi4;a9DeUiTrSuHäh0ül0;e99i9üh0;el0oK;i0rr0;nMr6;eStz0;b0de3;h0nd0tz0;a05e04i03l00mZnWrVuUwSäl0öFüt4H;eSiG2ä8S;fe3iFXmm0nk0;eGSl0;aGQei9B;aTeANäS;uz0;pp0u86;eEYi4;aTe5SieGVäAüS;pf0rf0;cCf0g0;eß0ff0lMmFrr0;id0lt0nk0r0;b0chH0l2Frr0uS;en,fe3;g0lz0uFJ;aYeWicCoVuUäuTüS;ck0st0;cFVm0;f0h0pf0ts1;d0ll0tt0;cQd0gn0iSnk0;b0ch0f0s0t0z0ß0;di4nH2sSu2B;i4t0;aSeIT;r6ts1;a00eZfYlWoUrTuS;mp0st0tz0;eJ4oFHäg0;ls8saSwe2;un0;aSünM;pI4uM;eHYlaB7;iIJnED;ck0rk0;eDFu9;aTeSiJLus8üR;i4Glk0rz0ss0;ch0hl0l0;aXeViHAoUäTöSüJA;fGFsH7;ut0;es0s0t0;b0er0g0iSrn0s0ucC;d0e2h0;ch0d0ge2ng0s9Ats1uS;f0g0t0;e03l00nZoYrTuSämHBüJ;ge3ndsDJpHYri4;aViS;e1stallS;isS;iere;m0tz0;ch0mm0st0;eHBi99o94;amTe9CinSoFüG0;g0k0;me2üC1;ge3hr0iSl8nn0rn0;l0m0;aXeWoVuUäSöJüls0;nSrt0;dBg0;nAXst0;lHEr1;be9Uil0lf0;k0lt0nDFuGG;eViHPlTrS;ab0eHK;eiHMiSüh0;eMmm0ts1;b0h0iz0sS;taJ7;a03e02i01lYoWrUuTäSüHP;de3ll0;e48g0;aSeHQi4;g0ns0;lg0rS;muNs1;aTiSoH;e70pp0;gg0;l8s1;cCg0il0rtB;hr0ll0se2;inanderTrSss0;kiFWs7wäJ;g7sTzuS;se9;chSe9;reS;ib0;a9PeZiXrUuTöS;rr0;eHKnHX;eTi5uSüH;ck0eH;h0s1;en0fferSs9H;enEZ;hn0nk0ut0;a05e03i02lZoYrWuUüS;ge3rSx0;ge2st0;chSdCC;en,t0;at0eSi5üt0;ch0it0ms0nn0;hr0mb0ot0rg0;as0eSut0;iSnd0;b0ch0;e3Rld0tt0;iß0sAGtoKuSzaJ;l0te8G;d0g9GldSuF2;owe2;rStm0;beI0t0;ioK;a3Pb39d37e34f2Xg2Rh2Nja2Lk2Cl25m21n20o1Yp1Qq1Pr1Ds0It0Ew07zS;e05i7uUwiTäS;hl0um0;ng0r76;b00fXgWhVkla4lUma1neAWpoNsStrAOzwi5;tSu1;eEoH;eg0oER;aHMeb0o4;eb0reF7;aTrS;is1;ll0ng0;au0es9WrS;e1i5;hr0i4B;aWeViUärSüJ;m0tS;sg7;e6Ynd0r6Qs1;ck0i2Vnd0rEK;chGYlSrt0s1;l0z0;aUeB4is1rSü4P;ag0eSumF;ff0ib0nn0t0;ke3nk0uE7;a0Lch07e05i9pZtSu1;aXeWiVoUreTöFVüS;lp0tz0;b0i1;ck0ß0;el0ft0;c4Kh0ig0ll0mm0;cCNmFpe3u0;aWeViTrSul0ür0;e5iBM;eSnn0;l0ß0;icBUrr0;lt0r0;h0tz0uS;fz0;au04e02i01lZme4WnXrVwUüS;rf0tS;te71;a9eAi5;aC2eSumF;ck0i4M;aC4eSür0;id0ll0;ag0iSuc17äAüsFJ;eß0tz0;cCe4Qnd0;in0uS;ch0e2;en,ke3;g0m9Yug0;a01eViUoEuTäCEüS;hr0st0tCA;f0nd0;b5KcC;chTg0iS;b0h0t0z0ß0;n0tS;erhalte,zuS;erS;haFZ;ff0g0pE0uS;ch0en,h0;ueE;aEIfYlXoVrUuSäpDX;mp0tS;s1z0;aEoASäg0;lSpp0;i4s8;a9us8;la6JroF;ktSpCT;royi4;aBXe8Räh0;aUeSo9un8ö4Z;iSrk0;ße3;ch0rCH;aWeViUoSös0;cSde2es0;ke2;cCe4Kst0;b0g0hn0im0s0ucC;ch0d0s4MuS;e2f0;aF6eZlWnVoUrSäAü4M;a9eSiG;mD9uz0;ch0mm0;ot0öFüF;aTeb0inSär0;ge3k0;er0pp0r0ub0;im0;g0ucS;hz0;aUeToSä4Tör0;er0l0r1;b0i8ll0tz0;k0l46u0;aWeViD7lSreCG;eTiSüh0;eMmm0;is0;b0h0il0;be3l4Z;aDLiXlWorVrUäTüS;hr0ll0;de3rb0;eD8is1;de2st0;aAiG;nd0s1;inanderfoTrSss0;lGst7;lg0;amFeHonCVrSäA;ae5eh0ä5öDHüH;a05e02i00lYrUueTäAIüS;ge3rd0;rd0;aTeSi5uAüh0;ch0nn0;t0uS;ch0s0;as0eDTi9äSüh0;h0t8;eSnd0;g0t0;geDhaE1iß0koAreE5sStt0waD;chwSse2;ör0;ck0hr0uS;en,s1;rDZtm0;m0oUtS;acSes6;ki4;miL;phal6sS;iTozS;ii4;miNs6;beDRgVmUo5QranA2tS;en,iS;kuN;ma1;umSwöQ;en6;elNlauB0or6re6;alyLb4Kd4Ee46f3Sg3Hh3Aim39jOk2Sl2Lm2Hn2CorA5p25quäl0r1Ys0Ut0Mv0Lw0EzSöd0;a0Ce0Ai7uSwei9QäJüR;bi6Ce07fe06g03h01k00lZnYpaXrDBsTtreSv0JweR;ff0t0;chUe6Die7EpTtS;e4Er6K;re1;au0l6C;ck0ss0;ae8Ae6D;aCJeg0;lOoAur2K;aD4eS;b0iz0;eTlS;ei1;b0h0;rtB;iSrBX;gn0;iSt8Z;cQg0;hl0pf0uBN;aWeUiToQur42äS;hl0rm0;de2nC7;h0is0nd0rS;b0f0;cSeJn6Q;hs0;ertr5X;aYeBYiXrUwoTöS;n0rn0;rt0;aTeSiP;ff0ib0t0;b0g0u0;pp0zi2Q;nz0st0;a0Tch0Ae09i08oJp02tUu1äS;en,g0uS;e2se3;aYeWiVoß0rTüS;rm0;aJeS;b0i1ng0;ft0mm0nk0;cSh0ig0ll0mm0ue2;h0k0;c7Umm0rr0u07;aWei0iVoUrSül0;eSi6Tüh0;ch0ng0;rn0;el0tz0;nn0r0;e5Yng0tz0;h0il0ng0tz0;a09ei08i06l04m01nZrXwS;eUiTäS;rz0;mm0n5T;iSll0mm0;g0ß0;a77eiSäg0;b0en;aSe78;ll0uz0;eTieS;g0r0;iß0;ag0eiSie7AäA;ch0f0;eSff0rr0;b0ß0;n0ß0;ff0lt0u0;g0mSu5Z;en,me3;aWeUicCoEuTüS;ck0hr0;de2f0;cQd0g0iSm98nn0;b0c02h0s0t0z0ß0;nz0t0uS;en,h0;aXe4ZfVirs1rSu7Oö0H;aTeSo61;is0ss0;ll0n2G;e8KlaS;nz0um0;ck0d4Yss0;aVeUi3TulNäS;heS;n,rn;hm0k6;e5Uge17;aUeTi3Oo9uS;s8t0;ld0rk0ss0;ch0hn0l0r7Nß0;aWeUieToHäSöt0üg0;c6Cut0;fe2g0;g0hn0iSrn0s0ucC;m0n0t0;ch0ge2sSu7R;s0t0;a07e06l01nYoXrVuTämFöMüS;ndB;p8FrS;be3;aEeS;id0uz0;hl0mm0p8Btz0;aTiSöFüF;ps0;b8Zc72;aUeTinSoF;ge0K;b0id0;g0mS;me2;il0rn,tt0;emFuf0;a1Vi4;aXeUim3MoTäSör0;ng0rt0;er0l0;b0ft0iSue2;mSz0;e3faEg31s9N;ft0k0l7Wu6U;aZeXiWlVrTuS;ck0rt0;e7XiS;ns0;ei1ieMo9;eß0ft0;b0hSln,wöQ;en,o4ör0;ff0lS;opS;pi4;a03e00iZlYorMrWuUüS;g0hSll0;l0r0;eDnkeS;ln,n;ag0eSi4;ss0uR;eh0iG;nd0x0;cCiRrtBuS;cCe2;nd0;ch0hr0ll0ng0ss0uSx0;ch0l0;iTke3rS;ke80zi7;gn0nanderS;fVgShä5;erTreS;nz0;at0;üg0;aWeViTrS;eh0i5oh0ä5;cCen0sS;ku6;nk0ut0;ue2;a03e00iYlUoDrS;at0e84i5uAüS;ll0t0;aUiS;ck0nStz0;ze3;ff0s0;eSnd0;de2t0;ha8Eiß0la5quTra4KtS;en,re1Hte3;em0;ck0gShn0n2Du0;ge2;eriSor0Dpu6ti4üL;kaS;niL;ar0Jbe2kWleinVphabe0AtS;erSma1;i4nStü1T;!i4;la6Pst7;aYoS;hoX;kYqXtVupuUzeS;ntSp6;ui4;nk6;i2WuaS;liL;uiI;lUommo5BreTumuN;li4;di6;a02iS;maS;tiL;m0nS;d0en;glSi4;oTuS;tiK;meI;ri4;ek6irS;mi4;cCnMusS;se2;di4e3jTrSsor2B;esL;us6;en,g0HhS;ab0;a78b6Hd67e64f5Og5Ch52jOk4Il48m40n3Xo3Up3Rqu3Nr3As1Jt14u12verla5w0NzTäS;nMst0;a0Je0Ii0GuXwUäS;hl0uS;m0n0;eBiS;ng0tS;sc22;b09f08g07ha6YjOl05milMne04pf0r03sXtrWwSzi7;aTeSic6D;i1nd0;eSrt0;hl0lz0;et0;chUeTic1Vpa6StS;eEiA;h0tz0;aTiYlSuet2S;ie5B;ff0;at0u4U;hm0;eSie3Qo3O;g0hn0s0;eb0;eMueD;au0;eSr5Vs1t8;h0l0;icQ;hl0pS;f0pe3;a03e00iVoQäTüS;rg0;g0hl0lz0rtsS;faDg7;c5Meg0mVnUrSs1;tsS;cha59;d0k0;me3;ch55hr0iTnd0rStz0;b0f0t0;ch0d0s0;eTndeSrt0s1;ln,rn;lz0;rteS;il0;a04e02i01rUuTöS;n0t0;n,pf0;aXeWiPoTuSäu21;de3;cSpf0tz0;kn0;nk0;ib0nn0t0;g0nspor6;pp0;il0lS;efoK;ke3nSst0u2J;k0z0;a1Fch0Ne0Ii0Go0Dp04tSu1ä27;a02e00iZoYrUuTüS;rz0tz0;f0mF;aUeSöm0;b0iS;ch0f0t0;f0hl0m39;pp0t8ß0;el0ll0mm0;ch0h0iSll0m36pp0rb0;f0g0;mm0tt0ub0;aZeXieWlVrSul0ül0;eTiSüh0;ng0tz0;ch0iz0ng0;it8;ge3l0;iSrr0;cXs0;lt0nn0r0;lTnMrS;bi4;vi4;cSng0tz0;he2;gn0h0iTnStz0;d0g0k0ti4;f0l0tsS;st7;eh0;a0Ie0Hi0El0Am06n03o02rZuYwUäTöFüS;rf0t0K;l0tz0um0;a9eUiSä1ör0;nSrr0;de3g0;if0ll0nk0;et0Eft0;aTeSäg0öF;ck0ib0;ub0;tt0;aTeSür0;id0;ll0pp0;a9eTiS;er0nk0;icSlz0t8;he3;aUeTieSäA;ss0ß0;if0pp0;cCff0g0;eTnd0rS;m0r0;b0fe2ß0;id0r0ue2;b0ff0lt0u0;ck0g0hn0tTuS;f0g0s0;te3;a03e00iWoVuUäTüS;ck0hr0st0;um0;de2f0nd0pf0ts1;d0ll0;cCeUfTnS;d0g0;fe3;ge3;aTcQg0iS;b0ch0s0t0ß0;gi4;si4t0us1;aSe1Iäl0;liS;fiS;zi4;a1TeEfe0Sla9rTuS;mp0tz0;aEe1R;nKrS;dn0;ni4;aTeSu9äh0;hm0ig0;be3g0;aWeVilMon6uSäh0üh0;rSs8;ks0;de2;ld0ss0;ch0ge2l0rS;scS;hi4;aYeWiUoTösS;ch0en;es0;cCeS;fe2;b0de2g0hn0iSnk0s0ucC;st0t0;ch0d0ge2k6ss0ts1uS;f0t0;ti4;a07eDl03nZoWrUup0HämTüS;hl0rz0ss0;m0pf0;a9iG;eg0;ch0mmSp0Ctz0;anSen;di4;aUeTiSu0FöF;ck0ps0;if0;b0Xll0ps0;aTeSi5oFär0;b0mm0;pSts1ub0;pe2;nTpSrt0sLuf0;p0se3;t0ze3;ag0;aWeVoTäSör0;ng0rt0ut0;be3lSr1;en,z0;b0ft0il0lf0tz0;ck0e5k0lVndeTsSu0;pe3;ln,nS;koA;f8t0;au02eZiYlWrS;aUeTäS;ts1;if0nz0;b0s0;eiS;ch0t0;eß0;b0h0lt0wS;i0CöQ;hn0;ne2;a06e03i01lYorXrVueDäTüS;hr0ll0t8;ls1rb0;hr0;ag0eSi4;ss0;de2m0;aTieSucC;g0ss0ß0;ch0u0;eSlm0nd0s1;be2;de2iTrtBue2;ig0;e2l0;hr0ll0ng0ss0;bb0rSss0;keS;nn0;aZeHiWrTuSäA;n05s1zi4;eh0iTosSuHä5üH;se3;ft0;cCen0ng0zi4;ht0;ck0;ch0mFnk0rb0;pf0;a0He07i06l00rVu1üS;rSß0;st0;ch0;aVeUi5öcSüh0;ke3;ng0;ch0ms0nn0;us0;asWeVi9ät8üh0;te2;rn;tz0;ib0nd0;en,s0;eg0ld0nd0tt0;ha00iZkoArXsVtTzaJ;hl0;en,te3;ln;teE;ll0;uf0;mm0;z0ß0;lt0;lg0u0;isLrS;beS;it0;si4;er0;en",
    "FemaleName": "true¦0:FZ;1:G3;2:FS;3:FE;4:FD;5:FT;6:ES;7:EQ;8:GG;9:F0;A:GC;B:E6;C:G9;D:FP;E:FM;F:EH;aE3bD5cB9dAJe9Hf92g8Ih84i7Tj6Vk61l4Pm39n2Uo2Rp2Gqu2Fr1Ps0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7FeHol1UvG;et7onBA;le0sen3;an9endBOhiB5iG;lInG;if3BniGo0;e,f3A;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9YenG2;kD0tor3;da,l8Wnus,rG;a,nGoniD3;a,iDD;leGnesED;nDMrG;i1y;aSePhNiMoJrGu6y4;acG4iGu0E;c3na,sG;h9Nta;nHrG;a,i;i9Kya;a5JffaCHna,s5;al3eGomasi0;a,l8Ho6Yres1;g7Vo6XrHssG;!a,ie;eFi,ri8;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmCBra;!ka;a,t5;at5it5;a06carlet2Ze04hUiSkye,oQtMuHyG;bFKlvi1;e,sHzG;an2Uet7ie,y;anGi8;!a,e,nG;aEe;aIeG;fGl3EphG;an2;cF9r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobh76;dy;aKeGirlBMo0y6;ba,e0i6lIrG;iGrBQyl;!d71;ia,lBW;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;lGre0;en1i0ma;bMdLi9lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBNome;e,ie;in1ri0;a02eXhViToHuG;by,thBK;bQcPlOnNsHwe0xG;an94ie,y;aHeGie,lC;ann8ll1marBFtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an9;hel53io;bin,erByn;a,cGkki,na,ta;helBZki;ea,iannDXoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cARkaE;chGe,i0mo0n5EquCDvDy0;aCCelGi9;!e,le;een2ia0;aMeLhJoIrG;iGudenAW;scil1Uyamva9;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaBBtHulG;a,et7in1;ricGsy,tA8;a,e,ia;ctav3deHfAWlGphAW;a,ga,iv3;l3t7;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoB2k8BolG;a,eBH;!mh;l7Tna,risF;dIi5PnHo23taG;li1s5;cy,et7;eAiCO;a01ckenz2eViLoIrignayani,uriBGyG;a,rG;a,na,tAS;i4ll9XnG;a,iG;ca,ka,qB4;a,chOkaNlJmi,nIrGtzi;aGiam;!n9;a,dy,erva,h,n2;a,dIi9JlG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi61isFyl;an2iGliF;nGsAM;a,da;!an,han;b08c9Ed06e,g04i03l01nZrKtJuHv6Sx87yGz2;a,bell,ra;de,rG;a,eD;h75il9t2;a,cSgOiJjor2l6In2s5tIyG;!aGbe5QjaAlou;m,n9S;a,ha,i0;!aIbALeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri7;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n9;a,re,s2;daGg2;!l2W;alCd2elGge,isBGon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9SnGsAQ;!a,e9R;a,sAO;aB1cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n9;is,l1GrHtt2uG;el6is1;aIeHi8na,rG;a6Zi8;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket7z2;a,et7;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Ge;!n4F;b7Terty;!n5R;aNda,e0iLla,nKoIslARtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Si6kes5na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5B;a,en,iGy;!e,n48;ri,urtn9A;aMerLl99mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6PiJlInHrG;a,i,ri;d4na;ey,i,l9Qs2y;ra,s5;c8Wi5XlOma6nyakumari,rMss5LtJviByG;!e,lG;a,eG;e,i78;a5EeHhGi3PlCri0y;ar5Cer5Cie,leDr9Fy;!lyn73;a,en,iGl4Uyn;!ma,n31sF;ei72i,l2;a04eVilToMuG;anKdJliGst56;aHeGsF;!nAt0W;!n8X;i2Ry;a,iB;!anLcelCd5Vel71han6IlJni,sHva0yG;a,ce;eGie;fi0lCph4X;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Qsi5Q;i,ri;!a,el6Pif1RnG;a,et7iGy;!e,f1P;a,e72iHnG;a,e71iG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min8;a8eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6U;do4;!belGdo4;!a,e,l2G;e0i0ma;a,di4es,gr5R;el9ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il75lKnJrGtt2yl75z6D;iGmo4Fri4G;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolC;acHetGisel9;a,chD;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov71selG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald35i,m2Stru73;et7i5T;a,eGna;s1Nvieve;briel3Fil,le,rnet,yle;aReOio0loMrG;anHe9iG;da,e9;!cG;esHiGoi0G;n1s3V;!ca;!rG;a,en43;lHrnG;!an9;ec3ic3;rHtiGy8;ma;ah,rah;d0FileDkBl00mUn4ArRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2H;geni1la,ni3R;h52ta;meral9peranJtG;eHhGrel6;er;l2Pr;za;iGma,nest29yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;a,en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoGul2U;lor51miniq3Yn30rGtt2;a,eDis,la,othGthy;ea,y;an09naEonAx2;anPbOde,eNiLja,lImetr3nGsir4U;a,iG;ce,se;a,iHla,orGphiA;es,is;a,l5J;dGrdG;re;!d4Mna;!b2CoraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1WyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et7iG;!ca,el1Aka;arGia;is;a0Qe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1D;aId28iGn28riA;!nG;a,e,n1;!l1S;n2sG;tanGuelo;ce,za;eGleD;en,t7;aIeoHotG;il4B;!pat4;ir8rIudG;et7iG;a,ne;a,e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHiGy;!an1e,n1;!l;lseHrG;!i8yl;a,y;nLrG;isJlHmG;aiA;a,eGot7;n1t7;!sa;d4el1PtG;al,el1O;cHlG;es7i3F;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2GsG;a2Fie;a,iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok8;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t8;an0e,nG;da,na;i8y;bbi8nG;iBn2;ancGossom,ythe;a,he;ca;aRcky,lin9niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy8;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et7iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi8yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t7;an19elG;le;aYdWeUgQiOja,nHtoGya;inet7n3;!aJeHiGmI;e,ka;!mGt7;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t7;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n9;da;aTba,eNiKlIma,ta,yG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i8y;!e;il;ah",
    "NeuterNoun": "true¦0:CU;1:CS;2:CI;3:CA;4:BD;5:CM;6:BL;7:AW;8:CL;9:9U;A:CE;aBKbA7cA1d94e8Df7Ng6Ch5Li57j53k3Vl3Km2Xn2Lo2Ep1Vquart1Ur1Js0St0Au04vSwGzB;ahl02eDiCuB;eri7gestaend8Lsammens2T;el,mm1t5H;hnt3iBntr0ug;ch0ta7B;aIeEiCoBu94;chenend0ert1hlwoll0lfenbueCCrt6Q;eBsm8V;n,sBA;issruß5SrkDsBtt1;en,tB;d24f2Bjordan5Q;es,s;hDrCsBttenme1;hingtAEs47;enCJschAO;lergebBTrzC8;at5EeIiGoBukov8L;elk8lErB;bi9Qh5VjahreBkommBQstandsmitglied6Nur6Xwo82;n,sB;!niveAI;k2um0;chy-regim2deo,eBg3Asi1;lfach2rt3;hik3rB;bundu6Hdi43gnu8AhBkehrsBRmo8A;aelt7Vo1uetB;ungsBP;eberFf1mDnBrte8Xs-repraesentanC4;gBhe6NterC4weA0;ezief1lQ;la4satzB;minC2plC2;e11lA3maAS;aReNhIiHoFrDschetsche5NuB;chBeb5Otzi49;!olsky-zit4I;avnik,iB;bu17eA5;desBnbandgerät,r6;opf1urteil6;bAckAer6;eBuer5H;aterBm0;!haBQsB;!tB;ue9;am,her2LlBrrito32;!eB;fonBkommunikations7I;!e,gesprae7;bBJgebue28iw2Hl2uzi8Ixi;aZchTeShando3SiRoPpNrinag7LtEuByst0H;b0OedBjA;frankr3IosB;seti0taAV;aGeEich3KrCuBü9;di0eck5A;aBeichhoelz1;f43lsu4ssenki7L;ak,uergeB;heimn8Sld8;atsCbilitaets2LdtBedtAY;schlo9Ywerk0;d4Doberhaeupt1t8H;ekt80ielB;!zeug;fBndierungsg5Y;a,twareB1;bi2Glve7U;chst3kretari3Kme7T;aEiffDkop93lBmier88nitz3ott41weine5;aBeppt92oss8L;chtpferd0g33;!e;fe,uB;fen7Ns0P;arBc0Jig8Mngerhaus0;brueck0la4;aKeFhein3TiDosto9uB;d1eBhrgA2mae4Dndschreib0ss7G;g0ssels17;ese7AndBsik0;er5fle5P;chnu8KgEiDpraesentantenhaus89sButl4Bvi1;ervo2TtBult35;-5Zaurant;ch86seu4R;al,im2;dio,ed1sta8WtAG;e8Vi1;aRePfNhaenom0ilotproMlKoIrB;aGe7KiFoB;-kopf-eDblCduBf4Vgra6WjeBra,toko9J;kt6;em0;in6S;nziA3vile4D;ba2Ig;k1rBsGtsdam;t2Xzell14;aBus;edoy1kat0;je1X;arrA1erd6lichBu4;tfa7;acekeepi2Aki2OrsoB;na55;kApier6rBss82;adi2ke8Cla90tner5E;bFeEffen81goniDhr0pf1rche6PstBxford;dBslawonien2Y;eutsch2W;-volk2la4;ko-aud50l,sterreich7H;dachlosen09erBje1Lst;haus3Nschle96;aIeGiDordB;bos3Bir2Qrhein-westfBzype81;al0;eBger-del8Jve7Q;dersacBmands2N;hs0;st,tz3GuB;-del1Fg65see68;chBhrungs8Jshoern1;barlaCsB;pi3;ende7Rnd;aReOiHoEuB;enCsBtt28;e0ikt6Mt1;ch0st1;dell6Yrsl7BsCtBv0S;ive5orr4K;kau6Wt5A;ami,liGnFtB;gliedCle0StelB;!a3Kme1;!er5sB;!l1J;is0Fus;e90ta1;cklenburg-vorpomme7CdiCer,isBnschenre3Jsser,ta85;s0ter-baf7F;en,ka80;ed8MiFnDrkeCssBteria42;!aker4Ge;nz8Jti14;d7NnBoev1;heim;la4nz;aJeHiGoEuB;dwig3IeCmpur,xB;em6Eor;be9n0;b,ch,eB;ch1;c2Yed,ssab6D;bens7Ld1e6RnzBtt59utB;kir7;bor,denschlussg22eBg03nd64teinis87;cheln,nd8;a08er51i03lZnYoLrEuBänn85;erz3pf1rB;distBsbaromet1;an;aEeDiB;egsBteP;g7Lverbre7Z;ditinst0Luz2;f73nkenB;be6LhaB;eus,us;ble35eMllektivs,mLnEpCrB;n,ps;enhag0fB;-an-kopf-re7Gki84;kurs6ZsGt0vergenzDzB;eBil;ntrationslag1pt0rt;kriB;teB;ri0;ta2Vul0E;ite2man4V;ln,nigrU;ie;agenfu3CeDische2oB;!e4IstB;er5D;id;el,gali,nBrchenvolksbege6Msangani;dBo;!eB;rBs;!n,z3Y;bine5WiserIlGnin77pitFrDsCvaliersdeliB;kt;chmNs3;atscBlsru2Atel4T;hi;a2Iel;iBku3;b1for0X;rBslaute5M;ei7;aBorda0Uu2N;-ChrBzzfe5F;e1Rhundert6tause4zeh6C;wo2Q;mMnCsrae29zmB;ir;dGkrafttret0la4nFsDterCvestmentbankiB;ng;e2Jieurs,nA;ekt0tB;itut0;e59sbru9;iDustrieB;lBu12;ae47;vidu0z;itBmobilie3D;at;aTeMiJoCuB;hn,ndert0;-chi-minh-3LchGeCf,lPngkoBrm4Gt4B;ng4B;chstDrB;geBn1;raA;ma59;lohnJwa1S;lfs63nB;der5PtB;erG;bronGer40ft,iDlCmd,rzBss0u;!ogenaura7;ler4Fms-burton-28;l5SmBzo3;!atB;la4;!-2O;aHeGlbjahr2m3WnEsch18uB;ptquarti1sB;!e3ThaltsdB;efiz1B;au,dBnov1sa-spar2E;elsb11tu7y;us8;g,r;eQiPlOoMrFuB;atemala-2VeteDtB;a0GhB;ab0;r5sieg3;emi0iechische5ossFuB;en,ndB;gCsB;atzur07tueck6;esetz3C;britanBuW;ni0;ettBrl3O;ing0;as,eis,ue9;ft,pfeltreff0;b03f01genZhXlRmNn,orMpae9rJsDtraenk0wB;aBerbe36i5K;e0Rnd;amtmeta4LchDetzCicht8praechBtod0undheit3E;!e5s;!eZ;aeftBi9lPos4Nä20;!en,sB;fe2Kv42;aeCichtBueT;en,s47;t0usc03;gi0;einschaftsuDueBü4G;se,tB;!er;nt10;aEdB;eChaB;e11us2M;r5s;ecB;ht1;aeBi38o1;lt1;teB;il;aeng0AeBuehl0ühl;cht0;aeudeBet,iet2C;n,s;aUeQi1lLoKrDuB;eBtt1;hrung1Fnft3;ankreichs,iedCueBäulein,üB;hstü9;ensCrichB;shaf0;ab0YgB;espraecB;he;r0to;aggschiff,eEoreDugB;bBzL;la2P;nz;is7;hlverhalt0ld8n10rnsehdue3DstCuB;er,illet1Z;!ivaBla4spiel44;ls;ch,ech,hrCss,x,zB;it;rDwaCzB;eug6;ss1;ad;hepa00iSlQnMrFschbo2Au-ExB;-Bemp3il;juB;goslawi0;lae03;be,dGeigFfuEgebBmittlungs2R;niB;sseB;!n,s;rt;nisse5;b1Ogescho2Do3;d2glDsembl2tB;setz0wicklungslaB;end,nd;a4is7;eBsa28;me2Nnd;!er,gentumsv2NnB;fEkDvCwanderungsBzelanliF;gese21;ernehm0;aufszentrum,oU;amilienhaeCuehlungsvermoB;eg0;us1;ar;a02eViRoJrDuB;eBschan1Jtze4;ll,sseldorf;ama,eEittB;el,laB;eBnd;nd1;hBie9sd0;bu7;erfHku20ppelCrB;f,tmu4;besteuerungsCzB;imm1;abB;koB;mm0;ch0er5;amanteBenstmaed2Fng,sziplinar1O;ngB;eschaeB;ft;bGfizit6krAlegationFsDtaCutschBzib3;lan0S;il08;aBogestr3s0M;st1;smitglied1;ak3;ch,eEmask2ErBt0yt07;lCmB;stadt;eh0;ch8;afé,hEoCreB;do;meba9rps;ck;eBil2;mni0S;a0Fe03iZlaXoUrOuByt2;chMdgAeJkare0BndesErgtDssB;geB;ld1;heat1;aEg1AkriminaDlaB;eBndK;nd8;laB;mt2;ch8ndB;el,nB;iss2;!eF;andenFem0uB;essCttoinlandsproduktB;!es;elB;!s;burgs;nn,rd,sB;ni0tB;on;eBtt;tt1;er,ldB;er5uB;ngB;sw0P;duerf0KiKlHrDsBtt;chaeftigungsverhä0ItrB;eb0;g-karaCnB;au;ba7;ch;faCgraB;ds;st;nBspiel6;!e5;dGfFgElleDnd,ugewerCyeB;rn;be;tt;!an;oeg;!en-B;bad0;b0Ne0Ji0Hk0Bl07mt2n03rRsOtJuB;ftragsvHgeEktions0OsBto;chwiCla4maF;nd;tz;nBs;!maB;ss;olum0;eli1h0lanEomkrafDtentB;at6;!en;twerks;ta;i0ylB;verfaB;hr0;beitsDchiv0guCzneiB;mittel5;meE;gIlosengeld2vEzeitB;koCmodeB;ll;nt0;erhaeB;ltB;nisB;se;ebiA;daluDgel2siCwBzM;es0;nn0;si0;gi1lheilBt1;miB;tt3;el;tBw;enzDienB;pakA;et;eiB;ch0;ds,r2;es;gypt0mt8thioB;pi0;er5;!n;enEgeordneBhoer0;tenB;haB;us;deCteu1;er;ss0;en",
    "Verb": "true¦0:3A;1:33;2:39;3:2O;a2Wb2Cd29e1Sf1Lg0Uh0Li19k0Kl0Fm0Dn0Cp0Br0As00tXuUvMwBz4äußer3übersp28;e9og0u4ög0;ge7rück4sammengeb39;ge5zu4;drä1erobern;ga1wies0;la34sp35w2Y;igArstö16;aCeAi7o6u5äre1Iü4;ns1Orde1H;rd0ß3;l0Ird0;ch0der1Ce4rSs06;derhol4s;e,te;i4r1R;gere,st;ch01ndt0r4;!en,f,n3;er6or4;ausg06ge4lC;d1Nga1schlag0;b7die0Pg2Eloren6mAs4öffentlic1I;pr4ucht1Z;ic1Go2;!g01;ot0u0O;mgZnter4;b2Jl4strichR;ag;hro0Hr4ue,ät0;a4in1Gug;f,t0;a1YchAe8in7olWpra2t4;a5e4ü0G;c1Ci1Wll3;mm1FndJ;d,ke;i4tzt0;!d,en;a5ienFla1Rrie4;!b;fHue;ei17ief,äum3üc14;asAla1Drophezeit;ahm0iedeG;ach10ein3ü4;s7ß0E;a5ehn3ie1Jud,ä4;dt,g0;g5s4;se;!en;am0omme,önne,ünd17;a9er6i1of5ä4;n1Ct06;fe;rs0Cvo4;rg4;ega1;be,l3nde5t4;!te01;le;ab0e5i4li2;b,ng;bNdMfuLga1halt0lu1mac0BpHru1sAt8w5z4;og0wu1;a5es0o4;nn0rd0;n18s2;an,r4;ag0o0L;ch7p1Bt6u4;c03n4;g0k0;aZorb0ri2;a0Gl4;eu4o15;st;a5la4;nt;a4rkt;rt;nd0;acSru1;e7o6r4;a4o2;cPucP;r0t0;!t0;i9order7reige6üh4;le,r4;e,te6;sp0Q;te4;!n;elYng0;ingeImpfing,ntBr4;fr00ga1h9inne8klä8mögliOr6s4z0C;ch4to2;i0o0I;ei4u1;che;rtR;ob0öhJ;ga1s4;ch7pr5ta4;nd;a2ic4o2;ht;ei4ied0;de;d4frMga1;ru1;en5ra1ürf4;e,t0;ke;aue,e8i7liebDra4;cht0u4;ch4;e,t;e3n;absichGgEkam0nöGrichte3s9t4;o6r4;aFo4;ff0;nt4;!e;ch5itze,pRtät4;ig3;ied,loOw4;or0;te;an4li2onn0;g0n;ti4;ge;bgeEngeAu4;fge7sge4;bGg5s4;cDpF;a1li2;bDfa1ga1hob0z4;wu1;bot0fa1ga1spBw4;an4;dt;ng0;b7s4;c4traft;hlo4;ss0;ro2;ch0;en",
    "Preposition": "true¦aHbFdDentBfürKge9hintJi8laut,m7n6ohne,se7u4vo2z0üb5;!u0wischB;!folge,m,r;m,n,r0;!m,s;mFnt0;erE;a7eb5;it;m,nB;gen0mäß;!üb8;geg0lang;en;ank,ur0;ch;ei0is;!m;!b,m,n2u0;f1s,ß0;er;!s",
    "LastName": "true¦0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Kd2Ae27f22g1Wh1Mi1Hj1Ck16l0Ym0Mn0Ho0Ep03rWsLtGvEwCxBy8zh6;a6ou,u;ng,o;a6eun2Qoshi1Hun;ma6ng;da,guc1Wmo23sh1YzaP;iao,u;a6eb0illi37o4right,u;gn0lk0ng,tanabe;a6ivaldi;ssilj33zqu1;a9h8i2Do7r6sui,urn0;an,ynisI;lst0Prr1Sth;atch0omps2;kah0Unaka,ylor;aDchulz,eChimizu,iBmiAo9t7u6zabo;ar1lliv27zuD;a6ein0;l20rm0;sa,u4;rn3th;lva,mmo21ngh;mjon3rrano;ito,n7sa6to;ki;ch1dLtos,z;amBeag1Xi9o7u6;bio,iz,sD;b6dri1KgIj0SmeQosevelt,ssi,ux;erts,ins2;c6ve0F;ci,hards2;ir1os;aEeAh8ic6ow1X;as6hl0;so;a6illips;m,n1R;ders5et8r7t6;e0Mr3;ez,ry;ers;h1Yrk0t6vl3;el,te0I;baCg0Alivei01r6;t6w1L;ega,iz;a6eils2guy5ix2owak,ym1C;gy,ka7var6;ro;ji6muV;ma;aEeCiBo8u6;ll0n6rr09ssolini,ñ6;oz;lina,oKr6zart;al0Ke6r0R;au,no;hhail3ll0;rci0ssi6y0;!er;eUmmad3r6tsu05;in6tin1;!o;aCe8i6op1uo;!n6u;coln,dholm;fe7n0Nr6w0G;oy;bv6v6;re;mmy,rs5u;aAennedy,imu9le0Io7u6wok;mar,znets3;bay6vacs;asX;ra;hn,rl9to,ur,zl3;ansse0Gen9ha4imen1o6u4;h6nXu4;an6ns2;ss2;ki0Cs5;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a4b0ghNynh;a4ffmann,rvat;mingw7nde6rM;rs2;ay;ns5rrPs7y6;asDes;an3hi6;moI;a9il,o8r7u6;o,tierr1;ayli4ub0;m1nzal1;nd6o,rcia;hi;er9lor8o7uj6;ita;st0urni0;es;nand1;d7insteHsposi6vaL;to;is2wards;aCeBi9omin8u6;bo6rand;is;gu1;az,mitr3;ov;lgado,vi;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u4we;i,ng,u4w,y;!n,on6u4;!g;mpb6rt0;ell;aBe8ha4lanco,oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "Noun": "true¦0:7W;1:7M;2:7V;3:79;4:76;5:74;6:7D;7:70;8:59;9:7E;A:7T;B:7R;C:75;D:49;a73b66c60d5Re5Ff4Ug45h3Oi3Jj3Fk31l2Pm24n1Yo1Xp1Ir15s0Ht09u05vTwJzFäEölvor5B;gypten4Nngs3rz3;aGeFuEwic39;ge,kä19;c4hn3Lit06l3;c6Ggr6L;aLeHiFochenEäDört2ürst2;!enC;dersEnt1ssen49;a4Tp5G;ge,hrpfliUiGnCrEsen4N;n1rat32tE;!e,papi6N;g1se;ff0hl0ige8lE;den3Wes;arian3eKieJoE;igt,lk,rE;ab1Kg7AsEwürfeA;chußlorbe6GitzendeFtandsE;sp2Lv7;!r;l6Zrteljahrhunde60;ned3LrE;antwortlic9brau4EdFgleic4haEkä0Olus3teid68;l4Tndlungst2P;acBäE;chti54;ltent2LmFnterErO;geb4Kschri3P;brü2sEwelt38;chuldungs4Ftänd0;aIei8hyss0iHoCreFürE;!en;ndEpp2uhanda5G;!w5;e0Wg1;s2tFuE;be,s5;sac9;aZchVeUiTkand2JpOtGuFynod2Jz4MüE;d0pp2;c4detendeuts2mmeA;aJeIimme,rFudieEädt2;ngebühr0r5;aFeE;et,ß;t58ß0;inkohleze2l1X;atsEdtrat,rza3P;a02di5O;arHd GrE;ac4echE;chör0er;frak3Hl4Nv7;er,te;cBgnal6Nnn;i6Kuc9;arpings,e0Ain,neid1rFwE;ierig0Käc4;eibt1QiEöd1;fts25tt;chEnkt,rajewo;en,sen-an5O;aPeIiHoGu4üE;ckEd53he;s14t5F;be4Rl1E;tu1Rv1;chHgierungsRisEst;ch,eFighaE;uf0;!nC;er2tE;e,saE;nwa6;c4hmen36;aOeLfKhänom3Lioni4UoIrE;eFoEä07; kopf 07grammv1Tjek3tes3;isEsseG;absp5Uverfal8;lizeiErD;sp0U;enn1Wl0M;itDrE;es,sE;onal,pek3U;lästinense4IpieGrE;lamentEol0teiv7;es,swahl0;re;berfläc4f1Pliv1ppenheim1stslawonie1B;achIeGieForEä4;be40drhein westf11;r0tzD;andert0PgativtrEuk23;end;b5Ar08;aUcdonnTeQiKoJuIäHöglichGüE;lEn2;heim kärli30l1;keit0;d2rk3;l0Iseum;dellcharakt1nats5rd;chae8eIlHnEtgefang2F;destFisterpräEut0;sident0;ein2A;itär,lia3T;rt,te;nFrE;kma04rF;achem,em,ge,schenre1E;ell;astrQl1nGrktn43schinenFßE;e,n2E;!pistol0;ge8n;aKeIiHokal2RuEä31;dEft;ew0UwigE;!shaf3N;cBs3;ch,g5iEu4O;c9pz0Q;ch1fontain2KndEteiniD;eFgerE;icB;!sE;e18k14v7;aOe3AiMoIrFu2YöE;ln,nig4Ir3;a23iegsEuD;enCverbE;re1A;h8llekTmmun0nE;flik3tE;ak3rolE;le;nEr2;ke8;bel,mpagn0rFss0tschthEuf;al1;is1S;ahrGerusalFuEürg0;gendliche3Sppé;em;!es5hundertw5tausendw5zehnt;deHmperaGnFrEtali2W;an,e23;ha6itiativeA;tiv;al0;aLeHoFundertEäf0Tö4;taus5;eEr0T;ch0Sn0;broGn1VrEß;b0Qrn,sEzog;tell1;n 0S;ftLlKnIuE;ptFshaltE;!sstreits;urs2LvE;erantwor0A;delsEs jo2;!ab0M;s,t;!a1N;a0EeKipJläub32mbh,oIrEünt1;oßofGundFöße,ünE;de,en;ig;fens31;lft1Ztt;fe8;bie3faTha6lRmeinCnQrMsGwE;a6erkschaftE;en,sv7;chHeEicBpräc9ta6;llEtze;schaE;ft0;iEwor07;ch3;ichtFäuD;sc4;!eE;!s;era8f;d,senkE;ir2;hr,ngeneE;n,r;aXdp0GeViQlMoJrFührungseE;be0S;aFeiheiE;tli2;kEu0;tion1Q;l08rE;meln,sE;ch1;a09uFäc9üchE;tlin04;cBgangE;st;lialeAschE;!erE;!eiE;abE;komm0;ld,stgenommE;en0;ll26milienangehöriU;bOiInHpoc4rFuE;le,ropä1;achEde,folg,ha6löse,wachsene1R;tens;de,tge6;m1nE;bHheiGnFzelhande8;ls;ahm0;m10t0;rüc4;eneA;am0eKgbJiGraFu10örfE;ch0er;ch;enstFnEvid5;ge;e,mäd2; v7;fizi3legiert0utE;sc9;du HhEo6;arakter1Jef,iE;le,nabesuchE;es;lEv7;ande0K;a04eVilUlutvergieß0oRrMuIüE;ch1hGrgerE;!initiaE;tiv0;ne;ndesErs2;aFhaus0GläEtagsabgeordne3v7;nderA;nsta6;ancheFief,oEöt2;schür0t;!nE;!kollE;eg0;rcEusquN;heE;rt;d,l;am3freiungstLhöKrIsGtrE;iEoffQ;eb;chäftig0RucheE;r,s;ekEgsteGicht0Rnd;et;rd0;ig1;dInGrriFsf,ueE;rn;er0;an0kE;darleh0en;en1;a2b0Bgab,kb0Al06nYrUsQuE;fHge,sE;lä06sE;chußv7icBprE;ac4;entKsFtE;ritt;ichtsratFtändE;is2;sv7;orsiE;tz5;ha6;c4ylsuch5;enC;de;he;beitsGgumen3tenvielE;fa6;te;plätz0we6;geIhHlag0sEwa6;icBprüc9ta6;lt;heA;äng1;hörEklagt0stellP;igeE;!n,r;exaFternatE;ive;nd1;er;ar;endJgeordneHsE;icBpE;ra2;ht;teA;!n;!e;ch0;en",
    "MaleName": "true¦0:CA;1:BK;2:BY;3:B4;4:9N;5:BV;6:AS;7:9V;8:BC;9:AW;A:AN;aB3bA8c97d87e7Gf6Yg6Hh5Xi5Jj4Mk4Cl3Sm2Qn2Fo29p23qu21r1Bs0Qt06u05v00wNxavi4yGzB;aBor0;cBh8Ine;hCkB;!aB0;ar52eAZ;ass2i,oCuB;sDu26;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByaAO;lfgang,odrow;lBn1P;bDey,frBHlB;aA4iB;am,e,s;e89ur;i,nde7sB;!l6t1;de,lCrr5yB;l1ne;lBt4;a92y;aEern1iB;cCha0nceBrg9Bva0;!nt;ente,t5B;lentin4An8Xughn;lyss4Nsm0;aTeOhKiIoErCyB;!l4ro8s1;av9PeBist0oy,um0;nt9Iv55y;bDd7XmBny;!as,mBoharu;aAWie,y;i83y;mBt9;!my,othy;adDeoCia7DomB;!as;!do7M;!de9;dErB;en8GrB;an8FeBy;ll,n8E;!dy;dgh,ic9Snn4req,ts46;aScotQeOhKiIoGpenc4tBur1Pylve8Gzym1;anEeBua7B;f0phCvBwa7A;e57ie;an,en;!islaw,l6;lom1nA1uB;leyma8ta;dBl7Im1;!n6;aDeB;lBrm0;d1t1;h6Rne,qu0Uun,wn,y8;aBbasti0k1Xl41rg40th,ymo9G;m9n;!tB;!ie,y;lCmBnti21q4Iul;!mAu3;ik,vato6U;aWeShe90iOoFuCyB;an,ou;b6KdCf9pe6PssB;!elAD;ol2Uy;an,bIcHdGel,geFh0landA4mEnDry,sCyB;!ce;coe,s;!a93nA;an,eo;l3Jr;e4Pg4n6olfo,ri67;co,ky;bAer8K;cBl6;ar5Nc5MhCkBo;!ey,ie,y;a83ie;gCid,ub5x,yBza;ansh,nS;g8UiB;na8Qs;ch5Xfa3lDmCndBpha3sh6Sul,ymo6Y;al9Tol2By;i9Don;f,ph;ent2inB;cy,t1;aFeDhilCier61ol,reB;st1;!ip,lip;d96rcy,tB;ar,e2V;b3Rdra6Dt43ul;ctav2Vm91rFsCtBum8Sw5;is,to;aCc8QvB;al51;ma;i,l48vJ;athJeHiDoB;aBel,l0ma0rm0;h,m;cCg3i3HkB;h6Tola;hol5WkBol5W;!ol5V;al,d,il,ls1vB;il4Z;anBy;!a3i3;aWeTiKoFuCyB;l21r1;hamCr5XstaB;fa,p4F;ed,mF;dibo,e,hamDis1XntCsBussa;es,he;e,y;ad,ed,mB;ad,ed;cGgu3kElDnCtchB;!e7;a76ik;house,o03t1;e,olB;aj;ah,hBk6;a3eB;al,l;hClv2rB;le,ri7v2;di,met;ck,hNlLmOnu3rHs1tDuricCxB;!imilian87we7;e,io;eo,hCi51tB;!eo,hew,ia;eBis;us,w;cDio,ko,lCqu6Esha7tBv2;i2Gy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMlo2QoIuCyB;le,nd1;cEiDkBth4;aBe;!s;gi,s;as,iaB;no;g0nn6PrenDuBwe7;!iB;e,s;!zo;am,on3;a76evi,la4QnDoBst4vi;!nB;!a5Yel;!ny;mCnBr65ur4Rwr4R;ce,d1;ar,o4L;aIeDhaled,iBrist4Turt5Ly3A;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5B;e0Yy;a7ri4L;r,th;na66rBthem;im,l;aYeQiOoDuB;an,liBst2;an,o,us;aqu2eJhnInGrEsB;eChBi76ue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4W;!ath4Vie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;a5HemCmai8oBry;me,ni0N;i6Py;!e56rB;ey,y;cHd5kGmFrDsCvi4yB;!d5s1;on,p4;ed,od,rBv4K;e4Xod;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0i6Ama3sac;ac,iaB;h,s;a,vinBw2;!g;k,nngu50;!r;nacBor;io;im;in,n;aJeFina4ToDuByd54;be24gBmber4AsD;h,o;m4ra31sBwa3V;se2;aDctCitCn4CrB;be1Zm0;or;th;bKlJmza,nIo,rDsCyB;a41d5;an,s0;lEo4DrDuBv6;hi3Yki,tB;a,o;is1y;an,ey;k,s;!im;ib;aPeLiKlenJoHrDuB;illerBstavo;mo;aDegBov4;!g,orB;io,y;dy,h53nt;nzaBrd1;lo;!n;lb4Mno,ovan4N;ne,oDrB;aBry;ld,rd4Q;ffr6rge;bri3l5rBv2;la1Yr3Dth,y;aReNiLlJorr0IrB;anDedBitz;!dAeBri23;ri22;cDkB;!ie,lB;in,yn;esJisB;!co,zek;etch4oB;yd;d3lBonn;ip;deriDliCng,rnB;an01;pe,x;co;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym5zra;an,ere2U;gi,iCnBrol,v2w2;est41ie;c07k;och,rique,zo;aGerFiCmB;aFe2O;lCrB;!h0;!io;s1y;nu3;be09d1iEliDmCt1viBwood;n,s;er,o;ot1Ts;!as,j3ZsB;ha;a2en;!dAg31mEuCwB;a24in;arB;do;o0Ru0R;l,nB;est;aYeOiLoErDuCwByl0;ay8ight;a8dl6nc0st2;ag0ew;minFnDri0ugCyB;le;!l03;!a28nBov0;e7ie,y;go,icB;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt4;ay8ey;en,in;hawn,mo07;ek,ri0E;is,nBv4;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne7rByl;eBin,yl;l2Rn;n,o,us;!e,i3ny;iBon;an,en,on;e,lB;as;a06e04hViar0lKoFrDurtCyrB;il,us;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;fo0Ct1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aGeErisCuB;ck;!tB;i0oph4;st4;er;d,rlBs;eBie;s,y;cBdric,s10;il;lEmer1rB;ey,lCro7y;ll;!os,t1;eb,v2;ar01eTilSlaRoOrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dBnd1;!foBl6y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!r0X;aBie;rd0P;!edict,iCjam2nA;ie,y;to;n6rBt;eBy;tt;ey;ar0Ub0Kd0Ggust2hm0Did5ja0BlZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi3jun,maFnDon,tBy0;hBu03;ur;av,oB;ld;an,nd07;el;ie;ta;aq;dGgel02tB;hoEoB;i8nB;!iZy;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,bLd5eHfEi,l0onDphonGt1vB;aJin;on;so,zo;onCrB;edN;so;c,jaCksandBssaCx;ar,er;ndB;ro;ertH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "Conjunction": "true¦aFbDdAentwedGfalls,in9nach9o6s4u3w0zumal;e0ohingegen,ähre2;dEil,nn0;!g5;nd;eit4o0;bald,dass,lange,ndern,wie;b0d9;!g0wohl;lei2;dem;a1enn,o0;ch;mit,ss,ß;e0zw;vor,ziehungsweise;b0ls;er",
    "Determiner": "true¦d2ein0;!e0;!m,n,r,s;as,e0ie;m,n,r,s",
    "City": "true¦0:3A;a2Yb29c1Yd1Te1Sf1Qg1Kh1Ci1Ajakar2Kk11l0Um0Gn0Co0ApZquiYrVsLtCuBv8w3y1zuri23;ang1We1okohama;katerin1Krev0;ars4e3i1rocl4;ckl0Yn1;nipeg,terth0Z;llingt1Rxford;aw;a2i1;en2Klni33;lenc2Yncouv0Ir2J;lan bat0Ftrecht;a7bilisi,e6he5i4o3rondheim,u1;nWr1;in,ku;kyo,ronJulouD;anj27l16miso2Mra2D; haKssaloni10;gucigalpa,hr0l av0O;i1llinn,mpe2Engi09rtu;chu25n0pU;a4e3h2kopje,t1ydney;ockholm,uttga15;angh1Jenzh1D;o0Nv01;int peters0Xl4n1ppo1J; 1ti1F;jo1salv3;se;v1z0T;adW;eykjavik,i2o1;me,sario,t28;ga,o de janei1B;to;a9e7h6i5o3r1ueb1Tyongya1Q;a1etor28;gue;rt1zn0; elizabe4o;ls0Wrae28;iladelph23nom pe0Aoenix;r1tah tik1D;th;lerLr1tr14;is;dessa,s1ttawa;a1Klo;a3ew 1is;delWtaip1york ci1U;ei;goya,nt0Ypl0Yv0;a7e6i5o2u1;mb0Pni0M;nt2sco1;u,w;evideo,real;l0n03skolc;dellín,lbour0V;drid,l6n4r1;ib2se1;ille;or;chest1dalYi11;er;mo;a6i3o1vCy03;nd1s angel0I;on,r0H;ma1nz,sb00verpo2;!ss1;ol; pla0Kusan0H;a6hark5i4laipeda,o2rak1uala lump3;ow;be,pavog1sice;ur;ev,ng9;iv;b4mpa0Lndy,ohsiu0Ira1un05;c1j;hi;ncheNstanb1̇zmir;ul;a6e4o1; chi mi2ms,u1;stJ;nh;lsin1rakliH;ki;ifa,m1noi,va0B;bu0UiltE;alw5dan4en3hent,iza,othen2raz,ua1;dalaj0Hngzhou;bu0R;eWoa,ève;sk;ay;es,rankfu1;rt;dmont5indhov8;a2ha02oha,u1;blTrb0shanbe;e1kar,masc0HugavpiL;gu,je1;on;a9ebu,h4o1raioLuriti02;lo2nstanLpenhag1rk;en;gGmbo;enn4i2ristchur1;ch;ang m2c1ttagoL;ago;ai;i1lgary,pe town,rac5;ro;aHeCirminghWogoBr6u1;char4dap4enos air3r1s0;g1sa;as;es;est;a3isba2usse1;ls;ne;silQtisla1;va;ta;i3lgrade,r1;l1n;in;ji1rut;ng;ku,n4r1sel;celo2ranquil1;la;na;g2ja lu1;ka;alo1kok;re;aDbBhmedabad,l8m5n3qa2sh1thens,uckland;dod,gabat;ba;k1twerp;ara;m0s1;terd1;am;exandr2ma1;ty;ia;idj0u dhabi;an;lbo2rh1;us;rg",
    "Country": "true¦0:2P;1:2O;a2Hb22c20d1Re1Kf1Gg18h17i12j0Zk0Ql0Mm0Dn04o03pYrVsKtEu7v4weißrusXz3ä2öster1H;quatorial01thiopi0;entralafrik1Sype9;anuatu,e2ietnam;nezue2Ireinigte 2;arabische emira1Jstaat0;.6gan2FkraiLn2ruVsbeD;ga4ited 2;arab emirates,kingdom,states2;! of ame1S;rn;k.,s.2; virgin islands,a.;a5ha9o4rinidad und toba1Msch3u2ürk1T;n0Srkme2Dvalu;ad,echi0;go,nga;dschi2nsan0X;ki2A;aAchwed0e9i7low6omal0Vpa1ri lan0It. 5u4was3y25ão tomé und príncipe,üd2;afri0HkMsud29;il1C;d27riname;kitts und nevis,luc0Rvincent und die grenadC;ak1Ie1;erra leo2mbabwe,ngapur;ne;negJr02ychell0;lomon0m2n marino,udi-ara01;b0Loa;e14u2;an1Qmä1s2;sl11;a3eFhilipp2ortugD;in0;ki1Tl0Cnama,pua-neu3ra2;guay;guin0L;m1Rsttim0O;a8e6i4or2;dk2weg0;or0H;caragua,ederlanRger2;!ia;p2useel0P;al;mib04u2;ru;a4exi7ikronUo2yanmK;ldawi0n2samb0I;aco,gol0Stenegro;dagaskHl5r3ur2zedo1;eta1itius;ok2shallinseln;ko;a2ediv0i,ta;wi,ysU;a0Re4i2uxemburg;b2echtenste0Ttau0;erRy0;sotho,tX;a6enPir5o3roati0u2önigreich großbritan1;ba,wait;lum2mor0;bi0;gisi0ZibaZ;m4na0Rp ver3sach0Yt2;ar;de;bodscha,erI;a2em0;mai2p0U;ka;nd4r3s2ta0H;lVrael;ak,lU;i0on2;esi0;aiMondur0A;a6ha01r5u2;atema0Einea2ya00;!-biss2;au;ena0Aieche8;b3mb2;ia;un;i3rank2;reiX;dschi,n2;nlF;cu6l4ritr3s2;tlD;ea; salv3fenbeinküs2;te;ad2;or;e6omini3schibu2änemark;ti;ca,k2;anische republ2;ik;mokratische re3utschl2;and;publik kon2;go;hi9osta 2;rica;aAe8hutSo6r4u2;lgaMr2;kina faso,undi;asiEun2;ei;livi0snien und herzegowi2tswa2;na;l2n7;gi0ize;h4nglades3rbad2;os;ch;am3ra2;in;as;fghaBl7n4r3serbaidschDustra2;li0;genti1me1;dorra,go3tigua und barbu2;da;la;ba1ge2;ri0;ni0;en;ni2;st2;an",
    "Region": "true¦0:1S;1:20;a1Yb1Rc1Hd1Ces1Bf18g12h0Zi0Wj0Uk0Sl0Rm0GnZoXpSqPrMsDtAut9v6w4y2zacatec20;o05u2;cat17kZ;a2est vi4isconsin,yomi13;rwick0shington dc;er3i2;rgin1R;acruz,mont;ah,tar pradesh;a3e2laxca1DuscaB;nnessee,x1Q;bas0Kmaulip1PsmK;a7i5o3taf0Ou2ylh13;ffWrr02s0Y;me10no1Auth 2;cTdS;ber1Hc2naloa;hu0Sily;n3skatchew0Rxo2;ny; luis potosi,ta catari1;a2hode8;j2ngp04;asth0Mshahi;inghai,u2;e2intana roo;bec,ensYreta0E;ara5e3rince edward2; isW;i,nnsylv2rnambu02;an13;!na;axa0Ndisha,h2klaho1Antar2reg5x04;io;ayarit,eCo4u2;evo le2nav0L;on;r2tt0Rva scot0W;f7mandy,th2; 2ampton0;c4d3yo2;rk0;ako0X;aroli1;olk;bras0Wva01w2; 3foundland2;! and labrador;brunswick,hamp0jers3mexiJyork2;! state;ey;a7i3o2;nta1relos;ch4dlands,n3ss2;issippi,ouri;as geraFneso0K;igPoacP;dhya,harasht03ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca0eiHincoln0ouis7;a2entucky,hul1;ns08rnata0Dshmir;alis2iangxi;co;daho,llino3nd2owa;ia1;is;a3ert2idalFunB;ford0;mp0waii;ansu,eorgWlou6u2;an3erre2izhou,jarat;ro;ajuato,gdo2;ng;cester0;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby0;a9ea8hi7o2umbrH;ahui5l4nnectic3rsi2ventry;ca;ut;iMorado;la;apEhuahua;ra;l8m2;bridge0peche;a5ritish columb7uck2;ingham0;shi2;re;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo1kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "FemaleNoun": "true¦0:3F;1:3J;2:3T;3:3O;4:3N;5:3D;6:3X;7:3R;8:2V;a3Sb3Ec3Dd31e2Qf2Fg26h1Xin1Wj1Uk1Jl1Dm0Zn0Uo0Sp0Nr0GsYtQuNvKwAyoko,zei2Nüb9;erraschu5u5;aGeEiCoAto,u9;r2t;c8h9;lf6nungsnot;edergebu40rtschaft9;!sh4;lt,r9;bu5kstatt,leigh;f3llf6nd9;!e08;e9w-tocJ;ag,r9;bin2Jmoeg2K;-Nhr,n9;i9s0Rternehmenssteuern;!cef,versität;aEelefonnu09im1RoCrAu9;er,ge1C;auer9euha1B;!fei0;c9des1Xec9il2Nr34;ht0;lf6s9t,u3;c8se;aPchJeIms,oHpFs,t9uchocV;aDerbeh4ra9u3;fBße9;!n9;bahn;e,kaWt2M;dlmay0hm0si;e9ur;rb0zi1B;c2Zn7zialh4;d,henswürdigkeit;aDneeb2BulCw9;e9ienbach0;i9st0P;nepe2z;d,e,t0;er3u;ar,c8h7;aEeAied1u9;eck,ndP;d,g1pAservie9;ru5;ara09ubli9;ka;f,umf6;aBds,e2flanLhilharmon1Qizza,lo,oAr9;aeamb1opaga2Nüfu5;lizist1Rst27;rlamentska9u2M;mm0;eko1Fma,no,p08rd9;ers,nu5;aAe9ot,umm06;tzha27ubau0;belAcht,se,t9zE;o,ur;sch1A;aJeIiEorDuAüt9;ze;eAkakama9tt0;li;ller-münDtt0;al,genpo2;lBneraloel12ss,t9;h4s9;chu0D;ch;hrwert0Yrk1taph0;nArk,schi7tthaeus-mai0u9;er,s;dari7i0;aBeinwaQpgs,u9;ft9st;f6waf3;mpe,ndAs9;ker-schuel0t;k1Fschaft;aEirc8lDoerper0Hprf,rBu9önig0Xüc8;er,l9n2;tur;awat1Ce9;ditk1Aide;a0Qient1;mAsse9;!t18;eras,m9;er9;!n;ahresfri2uge9;nd;formaTgeboBs1;aDeBil3o9rk,üt11;chbu9se;rg;i9ll0;m0Or0O;ftPlbins1ndBu9;s9t;haltYtu0;!voll;aFeAglf,itarre,osal07u9;n2s;bu16dBgenAis1ldJrvais9werbekapitalZ;es;d,wa14;enktaf1u9;ld;b1r9s0Z;aLdi7;aHeFinanzh4l0NoErBu9;ess1nk9;tion;aAeiheits9g,i2;stra3;ge,u;lt0rm1tografie;d0i0s9;tu5;hr9u2;k08t;-mail,g,hefrIiDnBrbAta9;ge;schaftF;dstu3twicklung9;sh4;le,n9;kommAla9;du5;en9;steu0;au;-mark,aHec05hs,iskGoEpa,rBu9;nkelziff0sc8;he;ittstaatenklaAogenmaf9;ia;us1;lmetscher9ppel-cds,se;in;etP;g9u0;!m9;ar;ds,ity,ola;aGeDgag,ibCluAr9;ille,u2ücR;se,tt9;at;el,liothek;dienu5ih4s9tt0;chreibu5tellu5;ng;chmann,erb1nkArm0yernhypo;er;!k9;ar9;te;el;bf6dresKgInGpDr9;beitslosenh4m9t;ut;il3;fe;felsi7othe9;ke;ne;g2twoE;st;!e9;nda;se;ah9;rt",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;gw,hr;ax,cn,ndianG;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Month": "true¦a6dez4febr3j1m0nov4okto5sept4;ai,ärz;an1u0;li,ni;uar;em0;ber;pril,ugust",
    "WeekDay": "true¦donner3freit4m2s0;am2onn0;abend,t2;ittwoch,ont1;st0;ag",
    "Pronoun": "true¦a06b03dYeUiPjeKkeinJletzteres,mCnichts,paar,s6uns5viele05w0;a3e2i1o0;!bei,geg02mOnaTrin,von;ev5r;l5nXr;nn,rum,s;!er;i4o0ämtP;l1v0;iele;che0;m,n,r,s;ch,e;an3e1i0;ch,r;hrere6i0;n,stO;!ch0;!e0;!m,n,s;!eL;d1gliche0neN;!n;e0weder;!m,n,r0s;!mann;c3h1nwiewe0;it;m,n0r;!en;h,k;inige2r,s,t1u0;ch;liche;n,r,s;e3i0u;ch,e0r;jen0s6;ig2;n1r1ss1;eide1ißch0;en;!n,r;ll0nderem;!e0;!m,n,r,s",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "Person": "true¦ashton kutchSbRcNdKeIgastMhGinez,jEkDleCmBnettJoAp8r4s3t2v0;a0irgin maG;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uB;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipJ;lmIris hiltC;prah winfrFra;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers7k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt1ick wolf;lt0nte;on;ar0ruz;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Currency": "true¦cent2dollar2euro2frank1krone0rubel,y1;!n;en;!s",
    "Unit": "true¦ampere,bHgEheDk5litAm1quadrat6t0volt,w9zenti6;erFonneA;e1illi0;g9li4me4;ga0t6;bCw4;ilo2ubik0;me0;ter;!b8g3met1w0;att;er0;!n;ramm;ktar,rtz;ig1ra0;d,mm;ab0;yte",
    "Modal": "true¦d9k7m2soll1w0;illBollt7;!st,t6;ag9och7u2ö1ü0;sst,ßt;ch5gt;ss0ß0;!t1;ann4onn2önnt0;!e2;arf2urf0ürft;te0;!n,st,t;!st",
    "Possessive": "true¦d3eu1ihr0m3s3unse1;e1s;re0;!m,n,r,s;ein0;e0s;!m,n,r",
    "TextCardinal": "true¦achtBbillionen,drei9e8fünfBhundert,milli6n5s2tausend,vierBz0;eCw0;anz8ei,ölf;ech1ieb0;en,z8;s,z7;eun5ull;arde,on0;!en;ins,lf;!ze3ß0;ig;!z0;e0ig;hn",
    "TextOrdinal": "true¦achtHbillioGdrEeDfünfChundertBmilli9n6s3tausenAvierCz0;eJieb1w0;an0eiJölfJ;ziG;ech1ieb0;enGte,zeF;sFzC;eun0ullE;te,z0;ehCiA;ar0o6;dsA;ers9s9;te,z5;lf7rs7;ei0it6;ze4ßi3;ns4;e,z0;e1i0;gs1;hn0;te"
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
  const unpack$1 = function (str) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0
    };
    //process symbols, if they have them
    if (str.match(':')) {
      symbols(trie);
    }
    return toArray(trie)
  };

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
      const arr = unpack$1(obj[cat]);
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

  // hand-set tags for core function words.
  // these win over the packed lexicon and the conjugation expansion.
  var misc$1 = {
    // question words
    'wo': 'QuestionWord',// where
    'woher': 'QuestionWord',//where  from
    'wohin': 'QuestionWord',//where  to
    'wann': 'QuestionWord',// when
    'was': 'QuestionWord',// what
    'wer': 'QuestionWord',// who
    'wie': 'QuestionWord',// how
    'warum': 'QuestionWord',// why
    'achte': 'TextOrdinal',

    // negation
    'nicht': ['Adverb', 'Negative'],
    'nein': ['Negative', 'Expression'],
    'kein': ['Determiner', 'Negative'],
    'keine': ['Determiner', 'Negative'],
    'keinem': ['Determiner', 'Negative'],
    'keinen': ['Determiner', 'Negative'],
    'keiner': ['Determiner', 'Negative'],
    'keines': ['Determiner', 'Negative'],

    // demonstrative determiners
    'dieser': 'Determiner',
    'diese': 'Determiner',
    'dieses': 'Determiner',
    'diesem': 'Determiner',
    'diesen': 'Determiner',
    'jener': 'Determiner',
    'jene': 'Determiner',
    'jenes': 'Determiner',
    'jenem': 'Determiner',
    'jenen': 'Determiner',

    // quantifier determiners
    'jeder': 'Determiner',
    'jede': 'Determiner',
    'jedes': 'Determiner',
    'jedem': 'Determiner',
    'jeden': 'Determiner',
    'mancher': 'Determiner',
    'manche': 'Determiner',
    'manches': 'Determiner',
    'manchem': 'Determiner',
    'manchen': 'Determiner',
    'solcher': 'Determiner',
    'solche': 'Determiner',
    'solches': 'Determiner',
    'solchem': 'Determiner',
    'solchen': 'Determiner',
    'welcher': 'Determiner',
    'welche': 'Determiner',
    'welches': 'Determiner',
    'welchem': 'Determiner',
    'welchen': 'Determiner',
    'alle': 'Determiner',
    'allen': 'Determiner',
    'aller': 'Determiner',
    'beide': 'Determiner',
    'beiden': 'Determiner',
    'viele': 'Determiner',
    'vielen': 'Determiner',
    'vieler': 'Determiner',
    'mehrere': 'Determiner',
    'mehreren': 'Determiner',
    'wenige': 'Determiner',
    'wenigen': 'Determiner',
    'einige': 'Determiner',
    'einigen': 'Determiner',
    'einiger': 'Determiner',

    // common adverbs/particles the lexicon mis-tags
    'morgen': 'Adverb',// tomorrow — 'Morgen' (morning) is caught by the titlecase pass
    'bitte': 'Adverb',// please — far more common than 'ich bitte'
    'etwas': 'Pronoun',// something
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

  // a generated form may upgrade a bare 'Verb' entry to something richer,
  // but never overwrites a more-specific word
  const canEnrich = (lex, w) => !lex[w] || lex[w] === 'Verb';

  const addWords = function (obj, tag, lex) {
    Object.keys(obj).forEach(k => {
      let w = obj[k];
      if (canEnrich(lex, w) && tagMap[k]) {
        lex[w] = [tag, tagMap[k]];
      }
    });
  };

  // 1st pass - add all words directly from the lexicon
  let unpacked = {};
  Object.keys(lexData).forEach(tag => {
    let wordsObj = unpack(lexData[tag]);
    unpacked[tag] = Object.keys(wordsObj);
    unpacked[tag].forEach(w => {
      lexicon$1[w] = lexicon$1[w] || tag;
      if (tag === 'Possessive') {
        lexicon$1[w] = ['Pronoun', 'Possessive'];
      }
    });
  });

  // 2nd pass - generate inflections; never overwrite a real word
  Object.keys(unpacked).forEach(tag => {
    unpacked[tag].forEach(w => {

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        // add present tense
        let obj = toPresent(w);
        addWords(obj, 'PresentTense', lexicon$1);
        // participles
        let str = toPresentParticiple(w);
        if (canEnrich(lexicon$1, str)) {
          lexicon$1[str] = ['Participle', 'PresentTense'];
        }
        str = toPastParticiple(w);
        if (canEnrich(lexicon$1, str)) {
          lexicon$1[str] = ['Participle', 'PastTense'];
        }
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
        let obj = inflectAdj(w);
        addWords(obj, 'Adjective', lexicon$1);
      }
      // add plural forms for our nouns
      if (tag === 'Noun' || tag === 'MaleNoun' || tag === 'FemaleNoun' || tag === 'NeuterNoun') {
        let plural = toPlural(w).one;
        if (plural && plural !== w) {
          if (!lexicon$1[plural]) {
            lexicon$1[plural] = 'Plural';
          } else if (typeof lexicon$1[plural] === 'string' && /Noun$/.test(lexicon$1[plural])) {
            // 'kinder' is hand-listed as a noun - mark it plural too
            lexicon$1[plural] = [lexicon$1[plural], 'Plural'];
          }
        }
      }
    });
  });

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
          // only de-pluralize known plurals - the reverse-model mangles singulars
          term.root = term.tags.has('Plural') ? noun.toSingular(str) : str;
        }

      });
    });
    return view
  };

  var lexicon = {
    compute: { root: root },
    methods: {
      two: {
        transform: methods
      }
    },
    words: lexicon$1,
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
    // standalone — 'meinem' is #Possessive as both a determiner ('meinem Freund')
    // and a pronoun ('das ist meins')
    Possessive: {},
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

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = unicode;
      world.model.one.contractions = contractions;
      world.methods.one.tokenize.isSentence = isSentence;
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
      if (!match) {
        //we done
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
    let { values } = view.model.one.splitter;
    view.docs.forEach((terms) => {
      terms.forEach((term) => {
        // split numbers
        if (term.tags.has('Value')) {
          term.splits = findSplits(term.normal, values);
        }
        // split nouns
        // if (term.tags.has('Noun')) {
        // term.splits = findSplits(term.normal, nouns)
        // }
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
    words.forEach((a) => {
      let [w, tag] = a;
      if (tag === 'TextOrdinal' || tag === 'TextCardinal') {
        addWord(w, values);
      }
      if (tag === 'Noun' || tag === 'FemaleNoun' || tag === 'MaleNoun' || tag === 'NeuterNoun') {
        addWord(w, nouns);
      }
    });
    // misc words
    addWord('und', values); //'and'
    addWord('ein', values); //'one'
    addWord('hunderttausend', values);
  };

  var splitter = {
    mutate: buildIndex,
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

  const isTitleCase = function (str) {
    return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  };

  const hasNoVerb = function (terms) {
    return !terms.find(t => t.tags.has('Verb'))
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

  // 1st pass

  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      let found = titleCaseNoun(terms, i, world);
      // try look-like rules
      found = found || checkRegex(terms, i, world);
      // turn '1993' into a year
      tagYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = isAcronym(terms, i, world);
      found = found || suffixCheck(terms, i, world);
      found = found || checkPrefix(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found = found || fallback(terms, i, world);
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
    // german-format - '.' groups thousands
    [/^[-+]?[0-9]{1,3}(\.[0-9]{3})+(,[0-9]+)?$/, ['Cardinal', 'NumericValue'], '1.234.567'],
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
      tagger: tagger$1
    },
    model: {
      two: model
    },
    hooks: ['tagger']
  };

  const separablePrefixes = '(ab|an|auf|aus|bei|ein|fest|fort|her|heraus|hervor|hin|hinzu|los|mit|nach|nieder|vor|voraus|weg|weiter|zu|zurecht|zurück|zusammen|zuteil)';

  const postTagger$1 = function (doc) {
    // eine as 1 or the
    doc.match('eine #Value').tag('TextValue', 'eine-value');
    // 6.30 Uhr
    doc.match('#Value uhr').tag('Time', 'time-Uhr');
    // a value before a currency is money - '12,5 Euro'
    doc.match('[#Value] #Currency', 0).tag('Money', 'value-currency');

    // prenominal possessive is a determiner - 'mein Bruder', 'seine kleine Schwester'
    doc.match('[(mein|dein|sein|ihr|unser|euer)] #Adjective? #Noun', 0).tag('Determiner', 'possessive-det');
    doc.match('[#Possessive] #Adjective? #Noun', 0).tag('Determiner', 'possessive-det');

    // 'weiß' beside a pronoun is wissen, not white - 'das weiß ich'
    doc.match('[weiß] #Pronoun', 0).tag('PresentTense', 'weiß-pronoun');
    doc.match('#Pronoun [weiß]', 0).tag('PresentTense', 'pronoun-weiß');

    // a verb between a determiner and a noun is an inflected adjective - 'das schnelle Auto'
    doc.match('#Determiner [(#Verb && !#Infinitive && /e[nrsm]?$/)] (#Noun && !#Pronoun)', 0).tag('Adjective', 'det-adj-noun');

    // a determiner with no noun after it is a pronoun - 'das ist gut', 'alle außer ihm'
    doc.match('[#Determiner] (#Verb|#Preposition)', 0).tag('Pronoun', 'det-pronoun');

    // modal verbs - the infinitive goes to the end of the clause:
    // dürfen (may), können (can), mögen (like), müssen (must), sollen (should), wollen (want)
    doc.match('[{dürfen}] * #Infinitive', 0).tag('Modal', 'dürfen-verb');
    doc.match('[{können}] * #Infinitive', 0).tag('Modal', 'können-verb');
    doc.match('[{mögen}] * #Infinitive', 0).tag('Modal', 'mögen-verb');
    doc.match('[{müssen}] * #Infinitive', 0).tag('Modal', 'müssen-verb');
    doc.match('[{sollen}] * #Infinitive', 0).tag('Modal', 'sollen-verb');
    doc.match('[{wollen}] * #Infinitive', 0).tag('Modal', 'wollen-verb');

    // auxiliary + participle at the end of the clause (Satzklammer):
    // 'sie hat gestern ein Buch gelesen', 'er ist nach Hause gegangen'
    doc.match('[{haben}] * #Participle', 0).tag('Auxiliary', 'haben-participle');
    doc.match('[{haben}] * #Infinitive', 0).tag('Auxiliary', 'haben-infinitive');
    doc.match('[{sein}] * #Participle', 0).ifNo('#Determiner').tag('Auxiliary', 'sein-participle');
    // werden + infinitive is the future tense - 'wir werden nach Berlin fahren'
    doc.match('[{werden}] * #Infinitive', 0).tag('Auxiliary', 'werden-future');
    // werden + participle is the passive - 'das Buch wird gelesen'
    doc.match('[{werden}] * #Participle', 0).tag('Auxiliary', 'werden-passive');

    // a separable verb-prefix, at the end of the clause - 'ich stehe um sieben Uhr auf'
    doc.match('#Verb * [#Preposition]$', 0).match(separablePrefixes).tag('Particle', 'separable-prefix');
  };

  var postTagger = {
    compute: {
      postTagger: postTagger$1
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

  const fromNumber = function (m) {
    // use the raw text - normalization strips the german decimal-comma
    let str = (m.text() || m.text('normal')).toLowerCase().trim();
    str = str.replace(/(e|er)$/, '');
    // get prefix/suffix
    let arr = str.split(/([0-9.,]*)/);
    let [prefix, num] = arr;
    let suffix = arr.slice(2).join('');
    // german format - '.' groups thousands, ',' marks the decimal
    num = num.replace(/[.,]$/, '');
    let hasComma = /\d\.\d/.test(num);
    num = num.replace(/\./g, '').replace(/,/, '.');
    if (num !== '' && m.length < 2) {
      num = Number(num);
      //ensure that num is an actual number
      if (typeof num !== 'number' || isNaN(num)) {
        num = null;
      } else if (/-$/.test(prefix)) {
        num = num * -1;
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
      num = parseNumbers(terms);
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

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      let words = toText(parsed.num);
      let last = words[words.length - 1];
      words[words.length - 1] = toOrdinal[last];
      return words.join('')
    }
    if (fmt === 'TextCardinal') {
      return toText(parsed.num).join('')
    }
    // numeric formats
    // '55e'
    if (fmt === 'Ordinal') {
      let str = String(parsed.num);
      return str += '.'
    }
    if (fmt === 'Cardinal') {
      // german decimals use a comma - '12,5'
      return String(parsed.num).replace('.', ',')
    }
    return String(parsed.num || '').replace('.', ',')
  };

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$3 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parseNumber)
      }
      get(n) {
        return getNth$3(this, n).map(parseNumber).map(o => o.num)
      }
      json(n) {
        let doc = getNth$3(this, n);
        return doc.map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parseNumber(p);
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
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          let str = formatNumber(obj, fmt);
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
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          let str = formatNumber(obj, fmt);
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
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          let str = formatNumber(obj, fmt);
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
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          let str = formatNumber(obj, fmt);
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
          let num = parseNumber(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parseNumber(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parseNumber(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = formatNumber(obj, fmt);
          // re-group thousands - '1.234.567'
          if (obj.hasComma && fmt === 'Cardinal') {
            str = obj.num.toLocaleString('de-DE');
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
          n = parseNumber(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = formatNumber(obj, fmt);
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

  var numbers = {
    api: api$3
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$2 = function (m) {
    let r = m.not('(#Adverb|#Auxiliary|#Modal)');
    r = r.eq(0).compute('root');
    return r.text('root')
  };

  const api$2 = function (View) {
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

  var verbs = {
    api: api$2,
  };

  const getNth$1 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$1 = function (m) {
    m = m.eq(0).compute('root');
    return m.text('root')
  };

  const api$1 = function (View) {
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

  var adjectives = {
    api: api$1,
  };

  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get (lower-cased) singular form of noun
  const getRoot = function (m) {
    m = m.eq(0).compute('root');
    return m.text('root')
  };

  // german nouns are capitalized - keep the casing of the original word
  const matchCase = function (m, str) {
    if (/^[A-ZÄÖÜ]/.test(m.text().trim())) {
      return str.charAt(0).toUpperCase() + str.substring(1)
    }
    return str
  };

  // 'hunde' → 'hund' → 'hunde' round-trips, so it is already a plural,
  // even when the tagger could not tell - 'die Hunde' vs 'der Kunde'
  const isPluralForm = function (methods, str) {
    let single = methods.toSingular(str);
    return single !== str && methods.toPlural(single).one === str
  };

  const api = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.noun;
        return getNth(this, n).map(m => {
          let root = getRoot(m);
          return {
            singular: root,
            plural: methods.toPlural(root).one,
          }
        }, [])
      }

      isPlural(n) {
        return getNth(this, n).if('#Plural')
      }
      toPlural(n) {
        const methods = this.methods.two.transform.noun;
        return getNth(this, n).not('#Plural').map(m => {
          if (isPluralForm(methods, m.text('normal'))) {
            return m
          }
          let str = getRoot(m);
          let plural = methods.toPlural(str).one;
          return m.replaceWith(matchCase(m, plural))
        })
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        return getNth(this, n).not('#Singular').map(m => {
          let str = m.text('normal');
          if (!m.has('#Plural') && !isPluralForm(methods, str)) {
            return m
          }
          let singular = methods.toSingular(str);
          return m.replaceWith(matchCase(m, singular))
        })
      }
    }

    View.prototype.nouns = function (n) {
      let m = this.match('#Noun+');
      m = getNth(m, n);
      return new Nouns(this.document, m.pointer)
    };
  };

  var nouns = {
    api,
  };

  var version = '0.1.0';

  nlp.plugin(tokenizer);
  nlp.plugin(tagset);
  nlp.plugin(lexicon);
  nlp.plugin(tagger);
  nlp.plugin(postTagger);
  nlp.plugin(splitter);
  nlp.plugin(numbers);
  nlp.plugin(verbs);
  nlp.plugin(adjectives);
  nlp.plugin(nouns);

  const de = function (txt, lex) {
    let dok = nlp(txt, lex);
    return dok
  };

  // copy constructor methods over
  Object.keys(nlp).forEach(k => {
    if (nlp.hasOwnProperty(k)) {
      de[k] = nlp[k];
    }
  });

  // this one is hidden
  Object.defineProperty(de, '_world', {
    value: nlp._world,
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
