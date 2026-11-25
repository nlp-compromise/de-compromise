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

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input, options) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && Object.hasOwn(compute, input)) {
        compute[input](this, options);
      }
      // allow a list of methods
      else if (Array.isArray(input)) {
        input.forEach(name => {
          if (Object.hasOwn(world.compute, name)) {
            compute[name](this, options);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this, options);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };

  // wrappers for loops in javascript arrays

  // call the callback with a one-match view
  const wrap$3 = (view, cb) => (ptr, i) => cb(view.update([ptr]), i);

  const forEach = function (cb) {
    this.fullPointer.forEach(wrap$3(this, cb));
    return this
  };

  const map = function (cb, empty) {
    const run = wrap$3(this, cb);
    const res = this.fullPointer.map((ptr, i) => {
      const out = run(ptr, i);
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
    return this.update(this.fullPointer.filter(wrap$3(this, cb)))
  };

  const find$7 = function (cb) {
    const found = this.fullPointer.find(wrap$3(this, cb));
    if (found === undefined) {
      return this.update([])
    }
    return this.update([found])
  };

  const some$1 = function (cb) {
    return this.fullPointer.some(wrap$3(this, cb))
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
  var loops = { forEach, map, filter, find: find$7, some: some$1, random };

  // small helpers shared by the View class and its methods

  // the pointer, or one per sentence for a full document
  const rawPointer = view => view.pointer || view.docs.map((_d, n) => [n]);

  // tag new terms, if the tagger is loaded
  const retag = function (view, computes) {
    view.compute([...computes, 'freeze', 'lexicon']);
    if (view.world.compute.preTagger) {
      view.compute('preTagger');
    }
    view.compute('unfreeze');
    return view
  };

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
      const ptr = rawPointer(this);
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
      return this.update(rawPointer(this).slice(min, max))
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
      if (aPtr.length !== bPtr.length) {
        return false
      }
      // ensure [n, start, end] are all the same
      return aPtr.every((ptr, i) => bPtr[i] && ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2])
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

  const methods$m = { ...utils, ...fns$4, ...loops };

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
        start ||= 0;
        end ||= (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n]?.[start]) {
          id ||= document[n][start].id;
          if (document[n][end - 1]) {
            endId ||= document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer?.length > 0) {
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
      return retag(doc, ['normal'])
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0); //node 17: structuredClone(document);
      document = document.map(terms => {
        return terms.map(term => {
          term = { ...term };
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
  // subclasses set their own name on their prototype
  View.prototype.viewType = 'View';

  var version$1 = '14.20.0';

  const isObject$1 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isUnsafeKey = key => key === '__proto__' || key === 'constructor' || key === 'prototype';

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$1(plugin)) {
      for (const key in plugin) {
        // prevent prototype pollution
        if (isUnsafeKey(key)) {
          continue
        }
        if (isObject$1(plugin[key])) {
          if (!model[key]) {
            model[key] = {};
          }
          mergeDeep(model[key], plugin[key]); //recursion
        } else if (Array.isArray(plugin[key]) && Array.isArray(model[key])) {
          // a list, like model.one.contractions, is added to - not replaced
          model[key] = model[key].concat(plugin[key]);
        } else {
          model[key] = plugin[key];
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
      model[key] ||= {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  // verb forms, then adjective forms
  const irregularForms = [
    ['pastTense', 'Past'],
    ['presentTense', 'Present'],
    ['gerund', 'Gerund'],
    ['comparative', 'Comparative'],
    ['superlative', 'Superlative'],
  ];

  const addIrregulars = function (model, conj) {
    const m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      irregularForms.forEach(([prop, name]) => {
        const form = conj[k][prop];
        if (!form) {
          return
        }
        if (m['to' + name]) {
          m['to' + name].ex[k] = form;
        }
        if (m['from' + name]) {
          m['from' + name].ex[form] = k;
        }
      });
    });
  };

  const extend = function (plugin, world, View, nlp) {
    // support array of plugins
    if (Array.isArray(plugin)) {
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
    // Notify plugins when replacement creates new terms.
    if (plugin.onReplace) {
      methods.one.onReplace = (methods.one.onReplace || []).concat(plugin.onReplace);
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

  // Shared CLI colors and styles. Plain text when NO_COLOR is set, as the convention asks
  const off = typeof process !== 'undefined' && Object.hasOwn(process.env || {}, 'NO_COLOR');
  const color = code => s => (off ? s : '\x1b[' + code + 'm' + s + '\x1b[0m');

  const green = color(32);
  const red = color(31);
  const blue = color(34);
  const cyan = color(36);
  const yellow = color(33);
  // used by name, from the tagset colors
  const magenta = color(35);
  const dim = color(2);
  const i$1 = color(3);
  const b = color(1);
  const ul = color(4);
  const grey = color(90);

  var cli = /*#__PURE__*/Object.freeze({
    __proto__: null,
    b: b,
    blue: blue,
    cyan: cyan,
    dim: dim,
    green: green,
    grey: grey,
    i: i$1,
    magenta: magenta,
    red: red,
    ul: ul,
    yellow: yellow
  });

  const env = globalThis.process?.env ?? globalThis.env ?? {};
  const debug$2 = { tags: Boolean(env.DEBUG_TAGS) };

  // Capture only the requested terms, and only while tracing.
  const before$1 = term => {
    if (debug$2.tags && (!debug$2.word || debug$2.word === (term.normal || term.text || term.implicit || '').toLowerCase())) {
      return [...term.tags]
    }
    return null
  };

  // Show actual changes, including conflict removals.
  const log = (term, previous, reason = '') => {
    if (!previous) {
      return
    }
    const added = [...term.tags].filter(tag => !previous.includes(tag));
    const removed = previous.filter(tag => !term.tags.has(tag));
    if (!added.length && !removed.length) {
      return
    }
    const text = term.text || term.implicit || '';
    const index = term.index?.join(':') || '?';
    const prefix = debug$2.prefix || '   ';
    if (debug$2.rule !== reason) {
      const headingPrefix = debug$2.prefix ? prefix.replace('│  ', '│ ') : '  ';
      console.log(`${headingPrefix}${dim((reason || 'tag change') + ':')}`); // eslint-disable-line no-console
      debug$2.rule = reason;
    }
    const print = (tags, sign, color) => {
      if (!tags.length) {
        return
      }
      const word = color(`'${text}'`);
      const changes = tags.map(tag => color(`#${tag}`)).join(' ');
      console.log(`${prefix}${color(sign)} ${word} ${dim(index.padEnd(9))} ${changes}`); // eslint-disable-line no-console
    };
    print(removed, '−', red);
    print(added, '+', green);
  };

  debug$2.before = before$1;
  debug$2.log = log;

  // Install only while verbose matching is enabled; restore the original hot path.
  const matchDebug = (world, options) => {
    const one = world.methods.one;
    const match = one.match;
    const parse = one.parseMatch;
    const sources = new WeakMap();
    const word = options.word?.toLowerCase();
    const includesWord = terms =>
      !word || terms.some(term => (term.normal || term.text || term.implicit || '').toLowerCase() === word);

    const parseLogged = function (...args) {
      const regs = parse.apply(this, args);
      sources.set(regs, String(args[0]));
      return regs
    };
    const matchLogged = function (docs, todo, cache) {
      const result = match.call(this, docs, todo, cache);
      const pattern = todo.match || sources.get(todo.regs) || '[parsed pattern]';
      if (options.pattern !== undefined && pattern !== options.pattern) {
        return result
      }
      if (word && !docs.some(includesWord)) {
        return result
      }
      const matches = result.ptrs
        .map(([n, start, end]) => docs[n].slice(start, end))
        .filter(includesWord);
      if (word && result.ptrs.length && !matches.length) {
        return result
      }
      debug$2.rule = undefined;
      const status = result.ptrs.length ? green('✓') : red('✗');
      const spans = matches.map(terms => {
        const text = terms.map(term => term.text || term.implicit).join(' ');
        return `${green("'" + text + "'")} ${dim(terms[0]?.index?.join(':') || '?')}`
      }).join(', ');
      const rule = pattern.length > 80 ? pattern.slice(0, 79) + '…' : pattern;
      const words = spans ? spans + '  ' : ' ---         ';
      console.log(`${debug$2.prefix || '   '}${status} ${words}${dim(i$1(rule))}`); // eslint-disable-line no-console
      return result
    };
    one.parseMatch = parseLogged;
    one.match = matchLogged;
    return () => {
      // Do not overwrite a plugin's replacement installed during tracing.
      if (one.parseMatch === parseLogged) {
        one.parseMatch = parse;
      }
      if (one.match === matchLogged) {
        one.match = match;
      }
    }
  };

  const colorSpec = doc => {
    return doc.docs
      .map((terms, index) => {
        const plain = terms.map(t => t.pre + t.text + t.post).join('').trim();
        const text = dim("'" + plain + "'");
        const spec = doc.update([[index]]).out('spec');
        return text + grey(i$1(spec.slice(plain.length)))
      })
      .join('\n')
  };

  // Trace the actual pipeline once, including the initial tokenized document.
  const hooksDebug = headings => (doc, hooks) => {
    const width = Math.max('tokenize'.length, ...hooks.map(hook => hook.length));
    const snapshot = (hook, nested = false) => {
      const output = colorSpec(doc);
      output.split('\n').forEach((line, index, lines) => {
        if (nested) {
          const branch = index === lines.length - 1 ? ' ╰─' : '│ ';
          console.log(`  ${dim(branch)} ${line}`); // eslint-disable-line no-console
          return
        }
        const label = (index === 0 ? hook : '').padEnd(width);
        console.log(`  ${dim(label)}  ${line}`); // eslint-disable-line no-console
      });
    };
    snapshot('tokenize');
    hooks.forEach(hook => {
      const nested = headings;
      const prefix = debug$2.prefix;
      const rule = debug$2.rule;
      debug$2.rule = undefined;
      if (nested) {
        console.log(`  ${blue(b(ul(hook + ':')))}`); // eslint-disable-line no-console
        debug$2.prefix = dim('   │  ');
      }
      // Restore the log prefix even when a plugin hook throws.
      try {
        doc.compute(hook);
        snapshot(hook, nested);
      } finally {
        debug$2.prefix = prefix;
        debug$2.rule = rule;
      }
    });
  };

  let restoreMatch;

  /** log the decision-making to console */
  const verbose = function (set = true, options = {}) {
    restoreMatch?.();
    restoreMatch = undefined;
    if (set === 'match' || set === true) {
      restoreMatch = matchDebug(this._world, options);
    }
    debug$2.hooks = set === 'hooks' || set === true ? hooksDebug(set === true) : undefined;
    debug$2.word = options.word?.toLowerCase();
    debug$2.contractions = set === 'contractions' || set === true;
    debug$2.rule = undefined;
    debug$2.tags = set === 'tagger' || set === true;
    debug$2.spec = set === 'spec' || set === true;
    return this
  };

  // a plain object - not an array, null, or class instance
  const isObject = val => Object.prototype.toString.call(val) === '[object Object]';

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (Array.isArray(term.tags)) {
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
    if (isObject(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (Array.isArray(input)) {
      // pre-tokenized array-of-arrays 
      if (Array.isArray(input[0])) {
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = { ...tmpWrld };
  // the steps to run before (or without) the tagger
  const preTag = ['alias', 'normal', 'machine', 'contractions'];

  const nlp = function nlp(input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      if (debug$2.hooks) {
        debug$2.hooks(doc, world.hooks);
      } else {
        doc.compute(world.hooks);
      }
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
    if (debug$2.hooks) {
      debug$2.hooks(doc, compute.contractions ? preTag : []);
    } else if (compute.contractions) {
      doc.compute(preTag); //run it if we've got it
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

  // log the decision-making to console
  nlp.verbose = verbose;
  // current library release version
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
        term.tags.forEach(tag => {
          items.add('#' + tag);
        });
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

  var cache$3 = {
    api: addAPI$3,
    compute: compute$7,
    methods: methods$l,
  };

  // visit every term of a nested document: fn(term, terms, t, n)
  const eachTerm = (docs, fn) => {
    for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      for (let t = 0; t < terms.length; t += 1) {
        fn(terms[t], terms, t, n);
      }
    }
  };

  // uppercase the first letter - todo: support unicode?
  const titleCase$1 = str => str.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase());

  // change the text of every term
  const mapText = function (view, fn) {
    view.termList().forEach(t => {
      t.text = fn(t.text);
    });
    return view
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      return mapText(this, str => str.toLowerCase())
    },
    /** */
    toUpperCase: function () {
      return mapText(this, str => str.toUpperCase())
    },
    /** */
    toTitleCase: function () {
      return mapText(this, titleCase$1)
    },
    /** */
    toCamelCase: function () {
      eachTerm(this.docs, (t, terms, i) => {
        if (i !== 0) {
          t.text = titleCase$1(t.text);
        }
        if (i !== terms.length - 1) {
          t.post = '';
        }
      });
      return this
    },
  };

  // case logic for the first character of a word
  const isTitleCase$2 = str => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = str => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = str => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // give a new word the case of the one it replaced: 'Danes' -> 'Dane', 'DANES' -> 'DANE'
  const matchCase$2 = (original, str) => {
    if (original.length > 1 && original === original.toUpperCase() && original !== original.toLowerCase()) {
      return str.toUpperCase()
    }
    return /^\p{Lu}/u.test(original) ? toTitleCase(str) : str
  };

  // Heal the edges of a sentence, when its first or last words change.
  // Shared by insert and remove, and by the noun and verb conversions.

  // a capital of its own, not the sentence's - 'Spencer', 'NASA', 'I', or 'Plan B'
  const ownsCapital = function (term) {
    if (term.tags.has('ProperNoun') || term.tags.has('Acronym')) {
      return true
    }
    return term.text.length === 1 || !isTitleCase$2(term.text)
  };

  // the first word of a sentence lends its capital to a new first word
  const passCapital = function (from, to, drop) {
    if (!/^\p{Lu}/u.test(from.text)) {
      return
    }
    to.text = toTitleCase(to.text);
    if (drop && !ownsCapital(from)) {
      from.text = toLowerCase(from.text);
    }
  };

  // quotes, brackets and newlines open a phrase, so they stay in front of it
  const passOpening = function (from, to) {
    to.pre = from.pre + to.pre;
    from.pre = '';
  };

  // a bare hyphen joins two words - 'well-fed'
  const isJoiner = post => /^[-–]$/.test(post);

  // "dogs' bowls" - with no opening quote before it, an apostrophe belongs to its word
  const isPossessive = function (terms, i) {
    if (!/^['’]/.test(terms[i].post)) {
      return false
    }
    return !terms.slice(0, i + 1).some(term => /['‘]/.test(term.pre))
  };

  // periods, commas, closing quotes and brackets end a phrase, so they stay behind it
  const passClosing = function (terms, i, to) {
    const from = terms[i];
    // nothing to move, or it is part of the word
    if (!from.post || isJoiner(from.post) || isPossessive(terms, i)) {
      return false
    }
    let post = from.post;
    // the new words may bring their own ending - 'loudly!'
    if (/[.?!…]/.test(to.post)) {
      post = post.replace(/^[.?!…]+/, '');
    }
    to.post = to.post.trimEnd() + post;
    from.post = ' ';
    return true
  };

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      parent.splice(index, 0, ...child);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms.at(-1);
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document, agree) {
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
    if (agree) {
      // '"dogs' -> '"the dogs'
      passOpening(home[start], needle[0]);
      // 'Dogs' -> 'The dogs'
      if (start === 0) {
        passCapital(home[start], needle[0], true);
      }
    }
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document, agree) {
    const [n, , end] = ptr;
    const total = (document[n] || []).length;
    // 'bark.' -> 'bark loudly.'
    const moved = agree && home[end - 1] && passClosing(home, end - 1, needle.at(-1));
    if (!moved && end < total) {
      // in the middle - add trailing space on self
      endSpace(needle);
    } else if (!moved) {
      // at the end - add a space to predecessor
      endSpace(home);
      // is there another sentence after?
      if (document[n + 1]) {
        needle.at(-1).post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle.at(-1).id;
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

  const pad3 = str => str.padStart(3, '0');

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
    id += i.toString(36).padStart(2, '0');

    // 1 digit random number
    const r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we changing part of a contraction? expand it first
  const expandContraction = function (m) {
    if (m.has('@hasContraction') && m.contractions) {
      m.grow('@hasContraction').contractions().expand();
    }
  };

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
    if (Array.isArray(input)) {
      return Array.isArray(input[0]) ? input[0] : input
    }
    return []
  };

  // {agree: false} skips moving any capitals or punctuation
  const insert = function (input, view, prepend, opts = {}) {
    const agree = opts.agree !== false;
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
        expandContraction(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document, agree);
      } else {
        expandContraction(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document, agree);
      }
      // harden the pointer
      if (document[n]?.[ptr[1]]) {
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
    return retag(doc, ['id', 'index'])
  };

  const fns$3 = {
    insertAfter: function (input, opts) {
      return insert(input, this, false, opts)
    },
    insertBefore: function (input, opts) {
      return insert(input, this, true, opts)
    },
  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn, keep) {
    const ptrs = [];
    main.forEach((m, i) => {
      const out = m.replaceWith(fn(m, i), keep);
      ptrs.push(...out.fullPointer);
    });
    // a full document needs no new pointer
    if (main.ptrs) {
      main.ptrs = ptrs;
    }
    return main
  };

  // support 'foo $0' replacements, using this match's own groups
  const subDollarSign = function (input, main, [n, start, end]) {
    const groups = main._groups;
    return input.replace(dollarStub, a => {
      const name = a.replace(/\$/, '');
      const ptrs = Object.hasOwn(groups, name) ? groups[name] : [];
      const found = ptrs.find(ptr => ptr[0] === n && ptr[1] >= start && ptr[2] <= end);
      if (found) {
        // any end-punctuation will be moved over from the original
        return main.update([found]).text({ keepEndPunct: false })
      }
      return a
    })
  };

  // remember each match, before we change it
  const getOriginal = function (terms) {
    const last = terms.at(-1);
    return {
      pre: terms[0].pre,
      post: last.post,
      isTitleCase: isTitleCase$2(terms[0].text),
      text: terms[0].text,
      isPossessive: last.tags.has('Possessive'),
      tags: terms.map(term => Array.from(term.tags)),
    }
  };

  // keep any punctuation, and "John's"
  const restoreOriginal = function (terms, original, keep) {
    const last = terms.at(-1);
    if (keep.possessives && original.isPossessive && !last.tags.has('Possessive')) {
      last.text += "'s";
      last.normal += "'s";
      last.tags.add('Possessive');
    }
    // try to keep some pre-punctuation
    if (original.pre) {
      terms[0].pre = original.pre;
    }
    // try to keep any post-punctuation
    if (original.post) {
      // the punctuation may have moved here without its spaces - ' - '
      const post = last.post.trim();
      if (!post || post === original.post.trim()) {
        last.post = original.post;
      }
    }
  };

  fns$2.replaceWith = function (input, keep = {}) {
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
    if (!main.found) {
      return main
    }
    if (typeof input === 'function') {
      return replaceByFn(main, input, keep)
    }
    // each match has its own '$0' text
    if (typeof input === 'string' && input.includes('$') && Object.keys(main._groups).length > 0) {
      const strs = main.fullPointer.map(ptr => subDollarSign(input, main, ptr));
      return replaceByFn(main, (_m, i) => strs[i], keep)
    }
    const originals = main.docs.map(getOriginal);
    // Preserve old Term identities for plugins before insertion/deletion changes the view.
    const replacements =
      this.world.methods.one.onReplace &&
      this.fullPointer.map(([n, start, end]) => ({
        sentence: this.document[n],
        before: new Set(this.document[n]),
        oldTerms: this.document[n].slice(start, end),
      }));
    const original = this.update(this.fullPointer);
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    // {agree: false} swaps the words, and nothing else
    const agree = keep.agree !== false;
    main.insertAfter(input, { agree });
    // New terms follow each old match; stop at an existing term to separate nearby matches.
    if (replacements) {
      replacements.forEach(group => {
        const start = group.sentence.indexOf(group.oldTerms.at(-1)) + 1;
        group.newTerms = [];
        for (let i = start; i < group.sentence.length && !group.before.has(group.sentence[i]); i += 1) {
          group.newTerms.push(group.sentence[i]);
        }
      });
    }
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      const more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    // (we restore the start of the phrase ourselves, below)
    // the new words take the sentence's capital, unless {case: false}
    // (we restore the punctuation ourselves, below)
    main.delete(original, { agree, start: keep.case !== false, end: false }); //science.

    // main now points at only the new terms
    if (agree) {
      main.docs.forEach((terms, i) => restoreOriginal(terms, originals[i], keep));
    }

    // what should we return?
    const m = retag(main.toView(), ['index']);
    // replace any old tags
    if (keep.tags) {
      m.forEach((match, i) => {
        match.terms().forEach((term, k) => term.tagSafe(originals[i].tags[k]));
      });
    }
    // try to co-erce case, too
    if (keep.case) {
      m.docs.forEach((terms, i) => {
        const transformCase = originals[i].isTitleCase ? toTitleCase : toLowerCase;
        // 'DOGS' -> 'CATS'
        terms[0].text = matchCase$2(originals[i].text, transformCase(terms[0].text));
      });
    }
    // Transfer plugin metadata after replacement text, punctuation, and case are finalized.
    if (m.world.methods.one.onReplace) {
      replacements.forEach(({ oldTerms, newTerms }) => {
        m.world.methods.one.onReplace.forEach(fn => fn({ oldTerms, newTerms, document: m.document }));
      });
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && input === undefined) {
      return this.replaceWith(match, keep)
    }
    const m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };

  // Remove only the first qualifying run, matching String.replace without /g.
  const removeRunBefore = (str, run, following) => {
    let i = 0;
    while (i < str.length) {
      if (!run.includes(str[i])) {
        i++;
        continue
      }
      const start = i;
      while (i < str.length && run.includes(str[i])) i++;
      if (i < str.length && following.includes(str[i])) {
        return str.slice(0, start) + str.slice(i)
      }
    }
    return str
  };

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = removeRunBefore(to.post, ' ', '.?!,;:"”)]');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = removeRunBefore(to.post, ',;:', '.?!');
    }
  };

  const pairs$2 = { '(': ')', '[': ']', '"': '"', '“': '”', '‘': '’' };

  // a quote or bracket that opens and closes on the removed words leaves with them - '(loudly)'
  const dropPairs = function (terms, start, end) {
    const first = terms[start];
    const last = terms[end - 1];
    Object.keys(pairs$2).forEach(open => {
      if (first.pre.includes(open) && last.post.includes(pairs$2[open])) {
        first.pre = first.pre.replace(open, '');
        last.post = last.post.replace(pairs$2[open], '');
      }
    });
  };

  // the word before us becomes the end of the phrase - 'bark loudly, and' -> 'bark, and'
  const repairEnd = function (terms, start, end) {
    const prev = terms[start - 1];
    const post = terms[end - 1].post;
    // is there anything to keep, and room to keep it?
    if (prev && /\S/.test(post) && !/\S/.test(prev.post)) {
      prev.post = post;
    }
  };

  // the words after us become the start of the phrase
  const repairStart = function (terms, start, end) {
    const next = terms[end];
    if (!next) {
      return
    }
    // '"the dogs' -> '"dogs'
    passOpening(terms[start], next);
    // 'The dogs' -> 'Dogs'
    if (start === 0) {
      passCapital(terms[start], next);
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots, opts = {}) {
    nots.forEach(ptr => {
      const [n, start, end] = ptr;
      const len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (opts.agree !== false) {
        dropPairs(document[n], start, end);
        if (end === document[n].length && end > 1) {
          repairPunct(document[n], len);
        } else if (opts.end !== false) {
          repairEnd(document[n], start, end);
        }
        if (opts.start !== false) {
          repairStart(document[n], start, end);
        }
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
          const lastTerm = terms.at(-1);
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

  // which sentences will have no terms left?
  const getEmptied = function (gonePtrs, document) {
    return Object.keys(gonePtrs).map(Number).filter(n => {
      const count = gonePtrs[n].reduce((sum, no) => sum + no[2] - no[1], 0);
      return document[n] && count >= document[n].length
    })
  };

  // gonePtrs must run from last-to-first, in each sentence
  const fixPointers$1 = function (ptrs, gonePtrs, emptied) {
    ptrs = ptrs.map(ptr => {
      const [n] = ptr;
      const gone = gonePtrs[n] || [];
      gone.forEach(no => {
        const len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        } else if (ptr[1] >= no[2]) {
          // terms before our pointer are gone
          ptr[1] -= len;
          ptr[2] -= len;
        }
      });
      // sentences before our pointer are gone
      ptr[0] -= emptied.filter(k => k < n).length;
      // remove old hard-pointers
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    // remove any now-empty pointers
    return ptrs.filter(ptr => ptr[2] - ptr[1] > 0)
  };

  const methods$j = {
    // {agree: false} skips moving any capitals or punctuation
    remove: function (reg, opts) {
      const { indexN } = this.methods.one.pointer;
      // allow .remove({agree: false})
      if (reg && Object.hasOwn(reg, 'agree')) {
        opts = reg;
        reg = undefined;
      }
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
      expandContraction(not);

      let ptrs = self.fullPointer;
      const nots = not.fullPointer.reverse();
      const gonePtrs = indexN(nots);
      const emptied = getEmptied(gonePtrs, this.document);
      // remove them from the actual document)
      const document = pluckOut(this.document, nots, opts);
      // repair our pointers
      ptrs = fixPointers$1(ptrs, gonePtrs, emptied);
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

  // set or append the pre/post of the first/last term of each match
  const setSide = function (view, side, str, concat) {
    view.docs.forEach(terms => {
      const term = side === 'pre' ? terms[0] : terms.at(-1);
      if (concat === true) {
        term[side] += str;
      } else {
        term[side] = str;
      }
    });
    return view
  };

  // put these characters around each match
  const wrap$2 = function (view, start, end) {
    view.docs.forEach(terms => {
      terms[0].pre = start + terms[0].pre;
      const last = terms.at(-1);
      last.post = end + last.post;
    });
    return view
  };

  const methods$i = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      return setSide(this, 'pre', str, concat)
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        const last = this.docs.at(-1);
        return last.at(-1).post
      }
      return setSide(this, 'post', str, concat)
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      const docs = this.docs;
      const start = docs[0][0];
      start.pre = start.pre.trimStart();
      const last = docs.at(-1);
      const end = last.at(-1);
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      //remove whitespace
      eachTerm(this.docs, (t, terms, i) => {
        if (i !== 0) {
          t.pre = '';
        }
        if (terms[i + 1]) {
          t.post = '-';
        }
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      //remove whitespace
      eachTerm(this.docs, t => {
        if (hasHyphen.test(t.post)) {
          t.post = ' ';
        }
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      return wrap$2(this, start || '"', end || '"')
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      return wrap$2(this, start || '(', end || ')')
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

  /** count the # of characters of each match - longest first */
  const length = (a, b) => b.normal.trim().length - a.normal.trim().length;

  /** count the # of terms in each match - most first */
  const wordCount$1 = (a, b) => b.words - a.words;

  /** document order - sentence, then start, then end of each match */
  const sequential = (a, b) => a.pointer[0] - b.pointer[0] || a.pointer[1] - b.pointer[1] || a.pointer[2] - b.pointer[2];

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    const counts = Object.create(null);
    arr.forEach(o => {
      counts[o.normal] ??= 0;
      counts[o.normal] += 1;
    });
    // sort by freq - most first
    arr.sort((a, b) => counts[b.normal] - counts[a.normal]);
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
    const { docs } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input ||= 'alpha';
    const ptrs = rawPointer(this);
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
    const ptrs = [].concat(rawPointer(this)).reverse();
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

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs.at(-1);
      const last = end.at(-1);
      if (!/ /.test(last.post)) {
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
          const at = ptrs.at(-1)[0];
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
      if (Array.isArray(input)) {
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
    if (!ptr || ptr.length === 0) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$g = { ...caseFns, ...fns$3, ...fns$2, ...methods$j, ...methods$i, ...sort$1, ...concat, ...harden$1 };

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };

  const compute$6 = {
    id: function (view) {
      eachTerm(view.docs, term => {
        term.id ||= toId(term);
      });
    }
  };

  var change = {
    api: addAPI$2,
    compute: compute$6,
  };

  // one 'word:out words' per line - decoded once into { [key]: word, out: [...] }
  const parse$3 = (str, key) =>
    str
      .trim()
      .split('\n')
      .map(s => {
        const [k, out] = s.trim().split(':');
        return { [key]: k, out: out.split(' ') }
      });

  var contractions$2 = [
    // that's and let's are decided here, before any tagging
    // (step 1 of the 's decision - the list is in 2-two/contraction-two/compute/index.js)
    // simple mappings
    ...parse$3(
      `
@:at
arent:are not
alot:a lot
brb:be right back
cannot:can not
dun:do not
can't:can not
shan't:should not
won't:will not
that's:that is
what's:what is
let's:let us
dunno:do not know
gonna:going to
gotta:have got to
gimme:give me
outta:out of
tryna:trying to
gtg:got to go
im:i am
imma:I will
imo:in my opinion
irl:in real life
ive:i have
rn:right now
tbh:to be honest
wanna:want to
c'mere:come here
c'mon:come on
shoulda:should have
coulda:could have
woulda:would have
musta:must have
tis:it is
twas:it was
y'know:you know
ne'er:never
o'er:over
  `,
      'word'
    ),
    // contraction-part mappings
    ...parse$3(
      `
ll:will
ve:have
re:are
m:am
  `,
      'after'
    ),
    // french contractions - t'aime
    ...parse$3(
      `
c:ce
m:me
n:ne
qu:que
s:se
t:tu
  `,
      'before'
    ),
    // missing apostrophes, apostrophe-d
    ...parse$3(
      `
shouldnt:should not
couldnt:could not
wouldnt:would not
hasnt:has not
wasnt:was not
isnt:is not
cant:can not
dont:do not
wont:will not
howd:how did
whatd:what did
whend:when did
whered:where did
  `,
      'word'
    ),
  ];

  // one entry per line, in a template string
  const toList = str => str.trim().split('\n').map(s => s.trim());

  // ['a', 'b'] → { a: true, b: true }
  const toHash = list => Object.fromEntries(list.map(s => [s, true]));

  // number suffixes that are not units
  // s=1990s, e=18e french/spanish ordinal, er=french 1er, ère/ème=french 2ème
  var numberSuffixes = toHash(toList(`
st
nd
rd
th
am
pm
max
°
s
e
er
ère
ème
`));

  var model$7 = {
    one: {
      contractions: contractions$2,
      numberSuffixes
    }
  };

  // Log decisions before splicing replaces the original term.
  const contractionDebug = (term, expansion) => {
    if (!debug$2.contractions || (debug$2.word && debug$2.word !== (term.normal || term.text).toLowerCase())) {
      return
    }
    debug$2.rule = undefined;
    const result = expansion ? '[' + expansion.map(word => yellow(`'${word}'`)).join(', ') + ']' : 'possessive (kept)';
    console.log(`${debug$2.prefix || '   '}${yellow(JSON.stringify(term.text))} →  ${result}`); // eslint-disable-line no-console
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

  const twoApostrophes = /^(.+)'(t|d|ll)'ve$/;

  // wouldn't've -> would not have,  i'd've -> i would have
  const doubled = function (terms, i) {
    const m = terms[i].normal.match(twoApostrophes);
    if (m === null) {
      return null
    }
    const head = m[1];
    if (m[2] === 'd') {
      return [head, 'would', 'have']
    }
    if (m[2] === 'll') {
      return [head, 'will', 'have']
    }
    // n't've - but can't've, won't've
    if (head === 'can') {
      return ['can', 'not', 'have']
    }
    if (head === 'won') {
      return ['will', 'not', 'have']
    }
    return [head.replace(/n$/, ''), 'not', 'have']
  };

  const hasContraction = /'/;
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
  // l' words that end in e, but take le - accents are already stripped
  const masculineE = new Set(['homme', 'arbre', 'espace', 'exemple', 'ordre', 'ange', 'etre', 'ete', 'empire', 'oncle', 'angle', 'article', 'orchestre', 'insecte', 'episode']);
  // l' words that take la, without ending in e
  const feminineEnd = /(eau|tion|sion)$/;
  // the word after the apostrophe
  const getAfter = (terms, i) => terms[i].normal.split(hasContraction)[1];

  // l'amour, l'homme, l'eau
  const preL = (terms, i) => {
    // le/la
    const after = getAfter(terms, i);
    // quick french gender disambig (rough)
    if (after && ((after.endsWith('e') && !masculineE.has(after)) || feminineEnd.test(after))) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    const after = getAfter(terms, i);
    // quick guess for noun-agreement (rough)
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => ['je', getAfter(terms, i)];

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
      if (term.tags.has('PhoneNumber') || phoneNum.test(term.text)) {
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
      if (Object.hasOwn(notUnit, unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // poor-mans reindexing of this sentence only
  const reIndex = function (terms) {
    terms.forEach((t, i) => {
      if (t.index) {
        t.index[1] = i;
      }
    });
  };

  const byEnd = {
    // ain't
    t: apostropheT,
    // how'd
    d: _apostropheD,
  };

  const byStart = {
    // j'aime
    j: french.preJ,
    // l'amour
    l: french.preL,
    // d'amerique
    d: french.preD,
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

  // turn the words into terms, and put them where the contraction was
  const expand$2 = function (words, view, document, n, i) {
    contractionDebug(document[n][i], words);
    const doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    words = doc.docs[0];
    insertContraction(document, [n, i], words);
    return words
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
      const len = terms.length;
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        // already expanded - this runs on the whole document, and must be re-runnable
        if (terms[i].implicit) {
          continue
        }
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal)) {
          const res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
        }
        // wouldn't've, then any known-ones, like 'dunno'
        let words = doubled(terms, i) || knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && Object.hasOwn(byEnd, after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && Object.hasOwn(byStart, before)) {
          words = byStart[before](terms, i);
        }
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          expand$2(words, view, document, n, i);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = expand$2(words, view, document, n, i);
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit(terms, i, world);
        if (words) {
          words = expand$2(words, view, document, n, i);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
      // new terms shift the indexes of any terms after them
      if (terms.length !== len) {
        reIndex(terms);
      }
    });
  };

  var compute$5 = { contractions: contractions$1 };

  const plugin$1 = {
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

    eachTerm(view.docs, (t, terms, i) => {
      // basic lexicon lookup
      const word = t.machine || t.normal;

      // test a multi-word
      if (multi[word] !== undefined && terms[i + 1]) {
        const end = i + multi[word] - 1;
        for (let k = end; k > i; k -= 1) {
          const words = terms.slice(i, k + 1);
          const str = words.map(term => term.machine || term.normal).join(' ');
          // lookup frozen lexicon
          if (Object.hasOwn(frozenLex, str)) {
            setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
            words.forEach(term => (term.frozen = true));
          }
        }
      }
      // test single word
      if (frozenLex[word] !== undefined && Object.hasOwn(frozenLex, word)) {
        setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
        t.frozen = true;
      }
    });
  };

  const unfreeze = function (view) {
    eachTerm(view.docs, term => {
      delete term.frozen;
    });
    return view
  };
  var compute$4 = { frozen: freeze$1, freeze: freeze$1, unfreeze };

  var freeze = {
    // add .compute('freeze')
    compute: compute$4,

    mutate: world => {
      const methods = world.methods.one;
      // add @isFrozen method
      methods.termMethods.isFrozen = term => term.frozen === true;
      // `.debug('frozen')` is the tags view, which marks frozen terms
      methods.debug.freeze = view => methods.debug.tags(view);
      methods.debug.frozen = methods.debug.freeze;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        eachTerm(this.docs, term => {
          term.frozen = true;
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
        if (Object.hasOwn(lexicon, str)) {
          const tag = lexicon[str];
          // 'is off-white' is not the phrasal verb 'is off'.
          if (tag && tag.includes('PhrasalVerb') && words[words.length - 1].post === '-') {
            continue
          }
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

  const prefix$2 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
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
    if (lexicon[word] !== undefined && Object.hasOwn(lexicon, word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // '#gojetsgo' can be in the lexicon with its hash
    if (t.machine && Object.hasOwn(lexicon, t.normal)) {
      setTag([t], lexicon[t.normal], world, false, '1-lexicon-normal');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => Object.hasOwn(lexicon, str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$2.test(word)) {
      const stem = word.replace(prefix$2, '');
      if (Object.hasOwn(lexicon, stem) && stem.length > 3) {
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
    eachTerm(view.docs, (term, terms, i) => {
      if (term.tags.size === 0) {
        let found = null;
        found ||= multiWord(terms, i, world);
        // lookup known words
        found ||= checkLexicon(terms, i, world);
      }
    });
  };

  var compute$3 = {
    lexicon: lexicon$4,
  };

  // derive clever things from our lexicon key-value pairs
  const expand$1 = function (words) {
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
      lex[word] ||= tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };

  var methods$f = {
    one: {
      expandLexicon: expand$1,
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
    Object.entries(words).forEach(([k, v]) => {
      if (typeof v === 'string' && v.startsWith('#')) {
        words[k] = v.replace(/^#/, '');
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
        if (goNext[curr] && Object.hasOwn(goNext[curr], word)) {
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

    while (xs.length > 0) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !Object.hasOwn(goNext[n], word)) {
          n = failTo[n];
        }
        if (Object.hasOwn(goNext, n)) {
          const fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] ||= [];
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
      while (n > 0 && (trie.goNext[n] === undefined || !Object.hasOwn(trie.goNext[n], word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!Object.hasOwn(trie.goNext[n], word)) {
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
      if (cache.has(words[i])) {
        return false
      }
    }
    return true
  };

  const scan = function (view, trie, opts) {
    let results = [];
    opts.form ||= 'normal';
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

  function api$e (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      const trie = isObject(input) ? input : buildTrie(input, this.world);
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

  var lookup$1 = {
    api: api$e,
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

  // did they pass-in a compromise object?
  const isView = val => val && isObject(val) && val.isView === true;

  const isNet = val => val && isObject(val) && val.isNet === true;

  // sweep options when only finding, not tagging
  const noTag = { tagger: false };

  // parse the match-syntax, then run it over the docs
  const doMatch = (view, regs, group, opts, justOne) => {
    regs = parseRegs(regs, opts, view.world);
    return view.methods.one.match(view.docs, { regs, group, justOne }, view._cache)
  };

  // turn match results into a view
  const asView = (view, res) => {
    const { ptrs, byGroup } = fixPointers(res, view.fullPointer);
    const out = view.toView(ptrs);
    out._groups = byGroup;
    return out
  };

  const match$1 = function (regs, group, opts) {
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, noTag).view.settle()
    }
    return asView(this, doMatch(this, regs, group, opts))
  };

  const matchOne = function (regs, group, opts) {
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    return asView(this, doMatch(this, regs, group, opts, true))
  };

  const has = function (regs, group, opts) {
    // support view as input
    if (isView(regs)) {
      return this.intersection(regs).fullPointer.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, noTag).view.found
    }
    return doMatch(this, regs, group, opts, true).ptrs.length > 0
  };

  // keep only the matches that do (or don't) contain this match
  const ifBy = want => function (regs, group, opts) {
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found === want)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, noTag).view.settle();
      return this.filter(v => v.intersection(m).found === want)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const cache = this._cache || [];
    const view = this.filter((m, i) => {
      return (this.methods.one.match(m.docs, todo, cache[i]).ptrs.length > 0) === want
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$2 = { matchOne, match: match$1, has, if: ifBy(true), ifNo: ifBy(false) };

  // the words before (or after) each match, in its sentence
  const lookaround = function (view, isAfter, regs, group, opts) {
    const { indexN } = view.methods.one.pointer;
    const { document } = view;
    const dir = isAfter ? -1 : 1;
    const ptrs = [];
    const byN = indexN(view.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest (or latest) match in the sentence
      const [n, start, end] = byN[k].sort((a, b) => (a[1] > b[1] ? dir : -dir))[0];
      if (isAfter) {
        if (end < document[n].length) {
          ptrs.push([n, end, document[n].length]);
        }
      } else if (start > 0) {
        ptrs.push([n, 0, start]);
      }
    });
    const words = view.toView(ptrs);
    if (!regs) {
      return words
    }
    return words.match(regs, group, opts)
  };

  // extend each match left (or right), while the terms beside it match
  const growSide = function (view, isRight, regs, group, opts) {
    if (typeof regs === 'string') {
      regs = view.world.methods.one.parseMatch(regs, opts, view.world);
    }
    // ensure matches are beside us
    if (isRight) {
      regs[0].start = true;
    } else {
      regs[regs.length - 1].end = true;
    }
    const ptrs = view.fullPointer;
    view.forEach((m, n) => {
      const more = isRight ? m.after(regs, group) : m.before(regs, group);
      if (more.found) {
        const terms = more.terms();
        if (isRight) {
          ptrs[n][2] += terms.length;
          ptrs[n][4] = null; //remove end-id
        } else {
          ptrs[n][1] -= terms.length;
          ptrs[n][3] = terms.docs[0][0].id;
        }
      }
    });
    return view.update(ptrs)
  };

  // bind a direction to a method
  const side = (fn, flag) => function (regs, group, opts) {
    return fn(this, flag, regs, group, opts)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround$1 = {
    before: side(lookaround, false),
    after: side(lookaround, true),
    growLeft: side(growSide, false),
    growRight: side(growSide, true),
    grow,
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
      byN[ref[0]] ||= [];
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

  // turn a match-string, array, or view into a view
  const getDoc$1 = (reg, view, group) => {
    if (typeof reg === 'string' || Array.isArray(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    // support pre-parsed reg object
    return reg
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

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
    if (view.document[n]?.[start]) {
      ptr[3] ||= view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] ||= view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  // split each match, then collect the pieces into pointers
  const split = function (view, m, group, collect) {
    const { splitAll } = view.methods.one.pointer;
    const splits = getDoc$1(m, view, group).fullPointer;
    const all = splitAll(view.fullPointer, splits);
    const res = collect(all).filter(p => p).map(p => addIds$1(p, view));
    return view.update(res)
  };

  const methods$e = {};
  // [before], [match], [after]
  methods$e.splitOn = function (m, group) {
    return split(this, m, group, all => all.flatMap(o => [o.passthrough, o.before, o.match, o.after]))
  };

  // [before], [match after]
  methods$e.splitBefore = function (m, group) {
    return split(this, m, group, all => {
      // repair matches to favor [match, after]
      // - instead of [before, match]
      for (let i = 0; i < all.length; i += 1) {
        // move a before to a preceding after
        if (!all[i].after && all[i + 1]?.before) {
          // ensure it's from the same original sentence
          if (all[i].match && all[i].match[0] === all[i + 1].before[0]) {
            all[i].after = all[i + 1].before;
            delete all[i + 1].before;
          }
        }
      }
      return all.flatMap(o => {
        // a, [x, b]
        if (o.match && o.after) {
          return [o.passthrough, o.before, combine(o.match, o.after)]
        }
        // a, [x], b
        return [o.passthrough, o.before, o.match]
      })
    })
  };

  // [before match], [after]
  methods$e.splitAfter = function (m, group) {
    return split(this, m, group, all => all.flatMap(o => {
      if (o.before && o.match) {
        return [o.passthrough, combine(o.before, o.match), o.after]
      }
      return [o.passthrough, o.before, o.match, o.after]
    }))
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
    lMatch ||= '.$'; //defaults
    rMatch ||= '^.';
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

  const methods$c = { ...match$2, ...lookaround$1, ...methods$e, ...methods$d };
  // aliases
  methods$c.lookBehind = methods$c.before;
  methods$c.lookBefore = methods$c.before;

  methods$c.lookAhead = methods$c.after;
  methods$c.lookAfter = methods$c.after;

  methods$c.notIf = methods$c.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$c);
  };

  // Split parenthesized match blocks without retrying long rejected prefixes or
  // bodies. Preserve the original grammar, including its greedy capture header.
  const prefix$1 = new Set('!~[^');
  const suffix$1 = new Set('?]+*$~{},0123456789');
  const whitespace$2 = /\s/;

  const splitGroups = str => {
    if (!str.includes('(') || !str.includes(')')) return [str]
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const bodyEnd = new Uint32Array(length);
    const captureEnd = new Uint32Array(length);
    afterSuffix[length] = length;
    let close = -1;
    let capture = 0;
    for (let i = length - 1; i >= 0; i--) {
      afterSuffix[i] = suffix$1.has(str[i]) ? afterSuffix[i + 1] : i;
      if (str[i] === ')') close = i;
      if (str[i] === '(' && close >= i + 3 && str[close - 1] !== '\\') {
        const end = afterSuffix[close + 1];
        if (end === length || whitespace$2.test(str[end])) bodyEnd[i] = end;
      }
      // The optional <...> header cannot cross another '<', and prefers the
      // rightmost '>' which is followed by a valid parenthesized block.
      if (str[i] === '<') {
        captureEnd[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture) {
        // the block may be negative - [<name>!(a|b)]
        capture = bodyEnd[str[i + 1] === '!' ? i + 2 : i + 1] || 0;
      }
    }
    const parts = [];
    let previous = 0;
    let i = 0;
    while (i < length) {
      const start = i;
      while (i < length && prefix$1.has(str[i])) i++;
      const end = str[i] === '<' ? captureEnd[i] : bodyEnd[i];
      if (end) {
        parts.push(str.slice(previous, start), str.slice(start, end));
        // The old delimiter consumes one following whitespace character.
        i = end < length ? end + 1 : end;
        previous = i;
      } else if (i === start) {
        i++;
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // Split out /regex/ tokens - 'foo /yes/' and not 'foo/no/bar' - in linear time.
  // Has the grammar of this pattern, which rescans the line for each rejected opener:
  // (?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?=\s|$)
  const prefix = new Set('![^');
  const suffix = new Set('?]+*$~');
  const newline = new Set('\n\r  '); // what '.' can't cross
  const whitespace$1 = /\s/;

  const splitRegs = str => {
    if (!str.includes('/')) {
      return [str]
    }
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const ends = new Uint32Array(length); // a token's end, by its opening '/' or '<'
    afterSuffix[length] = length;
    let close = 0; // the nearest valid closing, for a body starting at i+1
    let capture = 0; // the rightmost valid '>' wins, and it can't cross another '<'
    for (let i = length - 1; i >= 0; i--) {
      if (str[i] === '/') {
        ends[i] = close;
      }
      afterSuffix[i] = suffix.has(str[i]) ? afterSuffix[i + 1] : i;
      if (newline.has(str[i])) {
        close = 0;
      }
      if (str[i + 1] === '/' && str[i] !== '/' && str[i] !== '\\') {
        const end = afterSuffix[i + 2];
        if (end === length || whitespace$1.test(str[end])) {
          close = end;
        }
      }
      if (str[i] === '<') {
        ends[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture && str[i + 1] === '/') {
        capture = ends[i + 1];
      }
    }
    const parts = [];
    let previous = 0;
    // -1 stands in for the '^' start
    for (let i = -1; i < length; i++) {
      if (i === -1 || whitespace$1.test(str[i])) {
        let start = i + 1;
        while (prefix.has(str[start])) {
          start++;
        }
        const end = ends[start];
        if (end) {
          parts.push(str.slice(previous, Math.max(i, 0)), str.slice(i + 1, end));
          // the whitespace after this token can also open the next one
          previous = end + 1;
          i = end - 1;
        }
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // any whitespace separates terms, the same as the tokenizer
  const byWord = /\s+/;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?!?\(/.test(str) && /\)[?\]+*$~{},0-9]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };
  const never = () => false;

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt, opts = {}) {
    // {noRegex} - slashes are plain characters
    const isRegex = opts.noRegex ? never : isReg;
    // parse by /regex/ first
    const arr = opts.noRegex ? [txt] : splitRegs(txt);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isRegex(str)) {
        res.push(str);
        return
      }
      res = res.concat(splitGroups(str));
    });
    res = cleanUp(res);
    // split by spaces, now - but not inside (blocks) or /regexes/
    const final = res.flatMap(str => {
      if (isBlock(str) || isRegex(str)) {
        return str
      }
      return str.split(byWord)
    });
    return cleanUp(final)
  };

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
  const captureName = /^<\s*([^\s>]+)\s*>/;
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
  // is the token wrapped in these chars, like (foo)
  const wrapped = (str, a, b = a) => start(str) === a && end(str) === b;
  //
  const parseToken = function (w, opts, aliases) {
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
          if (!res) {
            throw new SyntaxError('Invalid named capture: expected [<name> ...]')
          }
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+' && !w.endsWith('\\+')) {
        obj.greedy = true;
        w = stripEnd(w);
      }
      // 'foo*' is zero or more
      if (w !== '*' && end(w) === '*' && !w.endsWith('\\*')) {
        obj.greedy = true;
        obj.optional = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (wrapped(w, '~') && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy ?? 0.85;
        if (!/\(/.test(w)) {
          obj.word = w;
          return obj
        }
      }

      //regex - {noRegex} leaves it as a plain word, to avoid redos from user-input
      if (wrapped(w, '/') && w.length > 2 && !opts.noRegex) {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      // support foo{1,9}
      if (hasMinMax.test(w)) {
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
      if (wrapped(w, '(', ')')) {
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
          return str.split(/\s+/).map(s => parseToken(s, opts, aliases))
        });
        w = '';
      }

      //root/sense overloaded
      if (wrapped(w, '{', '}')) {
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
      if (wrapped(w, '<', '>')) {
        w = stripBoth(w);
        obj.chunk = titleCase(w);
        obj.greedy = true;
        return obj
      }
      if (wrapped(w, '%')) {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    //do the actual token content
    if (start(w) === '#') {
      const name = stripStart(w);
      obj.tag = aliases?.[name];
      if (!obj.tag) {
        obj.tag = titleCase(name);
        obj.tag = aliases?.[obj.tag] || obj.tag;
      }
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
      w = w.replace('\\+', '+');
      w = w.replace('\\/', '/');
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };

  // Text recognition, rather than full email/URL validation. Share these rules with
  // the tagger so hyphens in recognized addresses survive tokenization.
  const email = /^[\w.!#$%&'*+/=?^`{|}~-]+@(?:[\w-]+\.)+[a-z]{2,}$/i;
  const explicitUrl = /^(?:https?:(?:\/\/)?|www\.)(?:[a-z0-9-]+\.)+[a-z]{2,}(?::[0-9]+)?(?:[/?#]\S*)?$/i;
  const bareUrl = /^(?:[a-z0-9-]+\.)+(?:com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)(?::[0-9]+)?(?:[/?#]\S*)?$/i;

  const isWebToken = function (str) {
    if (!str.includes('.')) {
      return false
    }
    let start = 0;
    let end = str.length;
    while (start < end && /[\s("'“‘<]/.test(str[start])) start++;
    while (end > start && /[\s).,!?:;"'”’>]/.test(str[end - 1])) end--;
    const text = str.slice(start, end);
    return email.test(text) || explicitUrl.test(text) || bareUrl.test(text)
  };

  const hasHyphen$1 = function (str, model) {
    const parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    if (isWebToken(str)) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
    //dont split 're-do'
    if (Object.hasOwn(prefixes, parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (Object.hasOwn(suffixes, parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str)) {
      return true
    }
    //number-letter '20-aug'
    const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
    if (reg2.test(str)) {
      return true
    }
    return false
  };

  const splitHyphens$1 = function (word) {
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

  // match 're-do' -> ['re','do']
  // split them the same way the tokenizer does - 'x-ray' stays one word
  const splitHyphens = function (regs, world) {
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasHyphen$1(reg.word, world.model)) {
        let words = reg.word.split(/[-–—]/g);
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = { ...reg };
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };

  // add all inflections of this verb/noun/adjective
  const inflect = function (token, world, kind, fallback) {
    const { all } = world.methods.two.transform[kind] || {};
    if (!all) {
      return fallback
    }
    return all(token.root, world.model)
  };

  // explicitly-set POS - '{sweet/adjective}'
  const byPos = { Verb: 'verb', Noun: 'noun', Adjective: 'adjective' };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          if (token.pos) {
            if (Object.hasOwn(byPos, token.pos)) {
              const kind = byPos[token.pos];
              choices = inflect(token, world, kind, kind === 'verb' ? [] : [token.root]);
            }
          } else {
            // do verb/noun/adj by default
            choices = [
              ...inflect(token, world, 'verb', []),
              ...inflect(token, world, 'noun', [token.root]),
              ...inflect(token, world, 'adjective', [token.root]),
            ];
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
    opts ||= {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks(input, opts);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts, world.model.one.tagAliases));
    // '~re-do~'
    tokens = splitHyphens(tokens, world);
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
      if (reg.word !== undefined && !cache.has(reg.word)) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && !cache.has('#' + reg.tag)) {
        return true
      }
      // are all of the fast-or words missing?
      if (reg.fastOr !== undefined && !anyIntersection(reg.fastOr, cache)) {
        return true
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

  const hasHyphen = /^[-–—]$/;
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
    hasHyphen: term => hasHyphen.test(term.post) || hasHyphen.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase - also 'Tis */
    isTitleCase: term => /^['\u2019]?\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
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
      return term.tags.has(reg.tag)
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
      if (reg.regex.global || reg.regex.sticky) {
        const lastIndex = reg.regex.lastIndex;
        try {
          reg.regex.lastIndex = 0;
          return reg.regex.test(str)
        } finally {
          reg.regex.lastIndex = lastIndex;
        }
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
    // each choice is a list of tokens - this term can only test the first one
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r[0], index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r[0], index, length))
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

  const getGroup$1 = function (state, term_index) {
    // Most attempts fail without capturing anything.
    if (!state.groups) {
      state.groups = {};
    }
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  // add any terms used since startAt, to the current capture
  const logGroup = function (state, startAt) {
    if (state.hasGroup === true && state.t > startAt) {
      getGroup$1(state, startAt).length += state.t - startAt;
    }
  };

  // test the reg against the term at array-index t
  const matchAt = (state, reg, t) => wrapMatch(state.terms[t], reg, state.start_i + t, state.phrase_length);

  // anchors should not apply to repeated terms
  const noAnchors = reg => ({ ...reg, start: false, end: false });

  // how many terms a match must have - optional and negative regs don't count
  const getMinLength = regs => regs.filter(reg => reg.optional !== true && reg.negative !== true).length;

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    const reg = noAnchors(state.regs[state.r]);
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      // the number of terms we've matched, if we stop here
      const count = state.t - start + 1;
      //stop for next-reg match - unless we're still under our min
      if (endReg && matchAt(state, endReg, state.t)) {
        if (reg.min === undefined || count >= reg.min) {
          return state.t
        }
      }
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (matchAt(state, reg, state.t) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    // we ran out of terms - did we reach our min?
    if (reg.min !== undefined && state.t - start + 1 < reg.min) {
      return null
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
      if (matchAt(state, nextReg, t) === true) {
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
        const tmpReg = { ...reg, end: false };
        if (matchAt(state, tmpReg, state.t) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipto = greedyTo(state, regs[state.r + 1]);
    //maybe we couldn't find it
    if (skipto === null || skipto === state.offset) {
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
      // accumulate onto any tokens already captured before the wildcard,
      // so '[one .* after]' keeps its leading (and trailing) tokens
      g.length += skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };

  // try to match a list of tokens, starting at state.t + skipN
  // returns the number of terms it consumed, or 0 for no-match
  const tryChoice = function (state, regs, skipN) {
    let len = 0;
    for (let w = 0; w < regs.length; w += 1) {
      const cr = regs[w];
      const t = state.t + skipN + len;
      if (state.terms[t] === undefined) {
        return 0
      }
      if (matchAt(state, cr, t) !== true) {
        return 0
      }
      len += 1;
      // this can be greedy - '(foo+ bar)'
      if (cr.greedy === true) {
        // like getGreedy, anchors should not apply to the repeated terms
        const gr = noAnchors(cr);
        for (let i = t + 1; i < state.terms.length; i += 1) {
          if (matchAt(state, gr, i) !== true) {
            break
          }
          len += 1;
        }
      }
    }
    return len
  };

  // match the first choice that works - '(a b|c)'
  const tryChoices = function (state, skipN) {
    const block = state.regs[state.r];
    for (let c = 0; c < block.choices.length; c += 1) {
      const regs = block.choices[c];
      if (!Array.isArray(regs)) {
        return 0
      }
      const len = tryChoice(state, regs, skipN);
      if (len > 0) {
        return len
      }
    }
    return 0
  };

  const tryAndBlock = function (state, skipN) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    const reg = state.regs[state.r];
    const allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      const allWords = block.every((cr, w_index) => {
        const tryTerm = state.t + skipN + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return matchAt(state, cr, tryTerm)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      return longest
    }
    return 0
  };

  // match a block, and keep going if it's greedy - '(a b|c)+', '(a && b){2,3}'
  const repeatBlock = function (state, tryBlock) {
    const reg = state.regs[state.r];
    let skipN = tryBlock(state, 0);
    if (skipN === 0 || reg.greedy !== true) {
      return skipN
    }
    const next = state.regs[state.r + 1];
    let count = 1;
    while (count !== reg.max) {
      const t = state.t + skipN;
      const term = state.terms[t];
      const hasMin = reg.min === undefined || count >= reg.min;
      // stop for the next token, like 'foo+ bar'
      if (!term || (next && hasMin && matchAt(state, next, t))) {
        break
      }
      const more = tryBlock(state, skipN);
      if (more === 0) {
        break
      }
      skipN += more;
      count += 1;
    }
    // 'foo{2,3}' was too short
    if (reg.min !== undefined && count < reg.min) {
      return 0
    }
    return skipN
  };

  const doOrBlock$1 = state => repeatBlock(state, tryChoices);
  const doAndBlock$1 = state => repeatBlock(state, tryAndBlock);

  // 'foo? foo' matches are tricky.
  // should this optional token leave its term for the next one?
  const leaveForNext = function (state) {
    const next = state.regs[state.r + 1];
    if (!next || !matchAt(state, next, state.t)) {
      return false
    }
    // but does the next reg match the next term??
    // only skip if it doesn't
    const nextTerm = state.terms[state.t + 1];
    return !nextTerm || !matchAt(state, next, state.t + 1)
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = matchAt(state, reg, t);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = matchAt(state, nextReg, t);
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
    // '!foo* after' can match nothing, and leave this term for the next token
    if (skip === 0) {
      return reg.optional === true //dead, otherwise
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  // a negative block didn't find its terms - that's good news
  const negativeBlock = function (state) {
    const reg = state.regs[state.r];
    const startAt = state.t;
    let alive = true;
    if (reg.greedy === true) {
      // '!(a|b)+' keeps going - anchors should not apply to the repeated terms
      alive = negGreedy(state, noAnchors({ ...reg, negative: false }), state.regs[state.r + 1]);
    } else if (!reg.optional) {
      // but a '!(a b)?' can pass-through without consuming anything
      state.t += 1;
    }
    logGroup(state, startAt);
    return alive
  };

  // shared logic for '(a|b)' or-blocks and '(a && b)' and-blocks
  const makeBlock = tryBlock => function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const skipNum = tryBlock(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic - but '!(a|b)*' can match nothing
      if (reg.negative === true) {
        return reg.optional === true && reg.greedy === true
      }
      // '(a|b)? a' - go on to the next token, without using this term
      if (reg.optional === true && leaveForNext(state)) {
        return true
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
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      return negativeBlock(state)
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  // '(a|b)' - match any choice on the term
  var doOrBlock = makeBlock(doOrBlock$1);

  // '(foo && #Noun)' - require all matches on the term
  var doAndBlock = makeBlock(doAndBlock$1);

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const startAt = state.t;

    // match *anything* but this term
    const tmpReg = { ...reg };
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    const found = matchAt(state, tmpReg, state.t);
    if (found) {
      // but '!foo*' can match nothing - '!foo?' stays a lookahead
      return reg.optional === true && reg.greedy === true
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      // like getGreedy, anchors should not apply to the repeated terms
      const alive = negGreedy(state, noAnchors(tmpReg), regs[state.r + 1]);
      logGroup(state, startAt);
      return alive
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      const nextReg = regs[state.r + 1];
      if (nextReg) {
        const fNext = matchAt(state, nextReg, state.t);
        if (fNext) {
          return true // leave the term, and any capture, to the next reg
        }
        if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          const fNext2 = matchAt(state, regs[state.r + 2], state.t);
          if (fNext2) {
            return true
          }
        }
      }
    }
    state.t += 1;
    logGroup(state, startAt);
    return true
  };

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    const reg = regs[state.r];
    // foo{2,4} min-lengths are enforced inside getGreedy
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
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
    if (!term.implicit || !state.terms[state.t + 1]?.implicit) {
      return
    }
    // we matched "we've", or @hasContraction - skip over all of its hidden words, [we, have]
    if (reg.word === term.normal || reg.method === 'hasContraction') {
      let next = state.terms[state.t + 1];
      // a hidden word has no text of its own - the next contraction starts at a word that does
      while (next && next.implicit && next.text === '') {
        state.t += 1;
        next = state.terms[state.t + 1];
      }
    }
  };

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    const reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$1(state, startAt);
    // Update group - add greedy or increment length
    if (state.t - state.offset > 1 && reg.greedy) {
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
    // go on to the next token, without using this term
    if (reg.optional && leaveForNext(state)) {
      return true
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

  // choose how to consume this reg: a step function, null to die, or undefined to skip it
  const pickStep = function (reg, state) {
    // support 'unspecific greedy' .* properly
    if (reg.anything === true && reg.greedy === true) {
      return doAstrix
    }
    // slow-OR - multi-word OR (a|b|foo bar)
    if (reg.choices !== undefined && reg.operator === 'or') {
      return doOrBlock
    }
    // slow-AND - multi-word AND (#Noun && foo) blocks
    if (reg.choices !== undefined && reg.operator === 'and') {
      return doAndBlock
    }
    // support '.' as any-single
    if (reg.anything === true) {
      // '!.' negative anything should insta-fail
      if (reg.negative) {
        return null
      }
      return simpleMatch
    }
    // support 'foo*$' until the end
    if (isEndGreedy(reg, state) === true) {
      return simpleMatch
    }
    // ok, it doesn't match - but maybe it wasn't *supposed* to?
    if (reg.negative) {
      // we want *anything* but this term
      return doNegative
    }
    // ok, finally test the term-reg
    if (matchAt(state, reg, state.t) === true) {
      return simpleMatch
    }
    //ok who cares, keep going
    if (reg.optional === true) {
      return undefined
    }
    // finally, we die
    return null
  };

  /**
   * try a sequence of match tokens ('regs')
   * on a sequence of terms,
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length, offset = 0) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
    if (offset >= terms.length || regs.length === 0) {
      return null
    }
    // Use the original terms with a cursor instead of copying the remaining
    // sentence at every starting position. origin maps array indices to match
    // pointers; offset marks the beginning of this attempt within the array.
    const origin = start_i - offset;
    const state = {
      t: offset,
      offset: offset,
      terms: terms,
      r: 0,
      regs: regs,
      groups: null,
      start_i: origin,
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
      state.inGroup = state.hasGroup ? reg.group : null;
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      const step = pickStep(reg, state);
      if (step === null) {
        return null
      }
      if (step && !step(state)) {
        return null
      }
    }
    //return our results, as pointers
    const pntr = [null, start_i, state.t + origin];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    if (state.groups) {
      Object.keys(state.groups).forEach(k => {
        const o = state.groups[k];
        const start = origin + o.start;
        groups[k] = [null, start, start + o.length];
      });
    }
    return { pointer: pntr, groups: groups }
  };

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    const ptrs = [];
    const byGroup = {};
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
        Object.entries(r.groups).forEach(([k, ptr]) => {
          byGroup[k] ||= [];
          byGroup[k].push(ptr);
        });
      });
    }
    return { ptrs, byGroup }
  };

  // drop any results that contain this match
  const notIf = function (results, not, docs) {
    return results.filter(res => {
      const [n, start, end] = res.pointer;
      const terms = docs[n].slice(start, end);
      return !terms.some((_t, i) => tryHere(terms, not, i, terms.length, i) !== null)
    })
  };

  // Compiled sweeps cache this check; editable public patterns are rechecked.
  const isFixed = regs => regs.every(reg => !reg.optional && !reg.greedy &&
    !reg.negative && !reg.choices && !reg.anything &&
    (reg.word !== undefined || reg.tag !== undefined || reg.switch !== undefined || reg.fastOr !== undefined));

  const fromFixed = (terms, regs, start, length, offset = 0) => {
    if (offset + regs.length > terms.length) {
      return null
    }
    for (let r = 0; r < regs.length; r += 1) {
      const term = terms[offset + r];
      // A literal contraction can consume more than one term.
      if (term.implicit) {
        return tryHere(terms, regs, start, length, offset)
      }
      if (wrapMatch(term, regs[r], start + r, length) !== true) {
        return null
      }
    }
    // Failed attempts never need capture state.
    const groups = {};
    for (let r = 0; r < regs.length; r += 1) {
      const name = regs[r].group;
      if (name) {
        if (!groups[name]) {
          groups[name] = [null, start + r, start + r];
        }
        groups[name][2] += 1;
      }
    }
    return { pointer: [null, start, start + regs.length], groups }
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n, attempt) {
    let res = attempt(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache ||= [];
    const { regs, group, justOne, checkFirst } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }
    const attempt = (todo.fixed ?? isFixed(regs)) ? fromFixed : tryHere;

    // Compiled rules carry this value; public parsed patterns can still be edited
    // by callers, so calculate their minimum without caching on the token array.
    let minLength = todo.minLength;
    if (minLength === undefined) {
      minLength = getMinLength(regs);
    }
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n, attempt);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        // ensure it's long-enough
        if (terms.length - i < minLength) {
          break
        }
        // Compiled sweep rules can reject a start before allocating match state.
        if (checkFirst && !wrapMatch(terms[i], regs[0], i, terms.length)) {
          continue
        }
        let res = attempt(terms, regs, i, terms.length, i);
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

  const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
  const escapeXml = str => str.replace(/[&<>"']/g, c => escapes[c]);

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
        starts[a] ||= [];
        starts[a].push(tag.start);
        const b = terms.at(-1).id;
        ends[b] ||= [];
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
    eachTerm(this.docs, t => {
      // do a span tag
      if (Object.hasOwn(starts, t.id)) {
        out += starts[t.id].join('');
      }
      out += t.pre || '';
      out += t.text || '';
      if (Object.hasOwn(ends, t.id)) {
        out += ends[t.id].join('');
      }
      out += t.post || '';
    });
    return out
  };
  var html$1 = { html };

  // Walk the trailing punctuation run once, rather than retrying at every offset.
  const endPunctuation = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]/;
  const trimEnd = str => {
    let end = str.length;
    while (end > 0 && endPunctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  // the original text of these terms, with any outer whitespace removed
  const rawText = terms => terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach((t, i) => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(/[,،]/g, '');
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
        post = post.replace(/[,،…]|\.{2,}/g, '');
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
          post = trimEnd(post);
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
      // add an implicit space, for contractions - but not after the last word
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit && i < terms.length - 1) {
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
      const last = docs.at(-1);
      if (!last.at(-1).tags.has('Emoticon')) {
        text = trimEnd(text);
        // removing a spaced dash leaves its space behind
        if (!opts.keepSpace) {
          text = text.trimEnd();
        }
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

  const some = {
    whitespace: 'some',
    punctuation: 'some',
    unicode: 'some',
  };
  const fmts = {
    text: {
      form: 'text',
    },
    normal: {
      ...some,
      case: 'some',
      form: 'normal',
    },
    machine: {
      ...some,
      keepSpace: false,
      case: 'none',
      form: 'machine',
    },
    root: {
      ...some,
      keepSpace: false,
      case: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;

  /* eslint-disable no-bitwise, no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i = 0;
  for (; i < 64; i++) {
    k[i] = 0 | (Math.sin((i + 1) % Math.PI) * 4294967296);
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

    for (i = j = 0; i < s; i += 16) {
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
              ~~words[i | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
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

  const defaults$3 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  // text in this format, keeping punctuation
  const punct = (terms, fmt) => textFromTerms(terms, { ...fmt, keepPunct: true }, false);

  const fns$1 = {
    text: terms => punct(terms),
    normal: terms => punct(terms, fmts.normal),
    implicit: terms => punct(terms, fmts.implicit),

    machine: terms => textFromTerms(terms, opts, false),
    root: terms => textFromTerms(terms, { ...opts, form: 'root' }, false),

    hash: terms => md5(punct(terms)),

    offset: terms => {
      const len = fns$1.text(terms).length;
      // the text keeps leading punctuation but trims whitespace, so start where the text starts
      const raw = terms[0].pre + terms[0].text;
      const lead = terms[0].pre.length - (raw.length - raw.trimStart().length);
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start - lead,
        length: len,
      }
    },
    terms: terms => {
      return terms.map(t => ({ ...t, tags: [...t.tags] }))
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
    option ||= {};
    if (typeof option === 'string') {
      option = {};
    }
    option = { ...defaults$3, ...option };
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

  // Output the requested format, or the default tags view
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    if (!fmt || !Object.hasOwn(debugMethods, fmt)) {
      fmt = 'tags';
    }
    debugMethods[fmt](this);
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

  const wrap$1 = function (doc, obj) {
    // index ids to highlight
    const starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (Object.hasOwn(starts, t.id)) {
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
    return entry.parents.at(-1)
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

  const makeAliases = function (tagSet, registered) {
    const aliases = Object.create(null);
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      // A leading null explicitly keeps the canonical name.
      const preferred = entry.aliases === undefined ? entry.alias : entry.aliases[0];
      if (preferred && registered[preferred] === tag) {
        aliases[tag] = preferred;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet, world.model.one.tagAliases);
    return doc.docs.map(terms => {
      const text = rawText(terms);
      const tags = terms.map(t => {
        const tag = slotForTerm(t, tagSet);
        return aliases[tag] || tag
      }).join(',');
      return `${text} {${tags}}`
    }).join('\n')
  };

  // sort by frequency
  const topk = function (arr) {
    const counts = new Map();
    arr.forEach(word => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
    const res = Array.from(counts, ([normal, count]) => ({ normal, count }));
    return res.sort((a, b) => b.count - a.count)
  };

  // named output formats
  const outputs = {
    // text formats
    text: view => view.text(),
    normal: view => view.text('normal'),
    root: view => view.text('root'),
    machine: view => view.text('machine'),
    hash: view => md5(view.text()),
    // tagged-sentence format for LLMs (see docs/spec-format.md)
    spec: view => toSpec(view, view.world),
    // json data formats
    json: view => view.json(),
    offset: view => {
      view.compute('offset');
      return view.json({ offset: true })
    },
    array: view => view.docs.map(rawText).filter(str => str),
    // return terms sorted by frequency
    freq: view => topk(view.json({ normal: true }).map(o => o.normal)),
    // some handy ad-hoc outputs
    terms: view => view.docs.flatMap(terms => terms.map(t => t.text).filter(Boolean)),
    tags: view => {
      return view.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    },
    'best-tag': view => {
      view.compute('tagRank');
      return view.docs
        .map(ts => {
          return ts.map(t => (t.tagRank?.[0] ? `#${t.tagRank[0]}` : '')).join(' ')
        })
        .join('\n')
    },
    debug: view => view.debug(), //allow
  };
  // aliases
  outputs.reduced = outputs.machine;
  outputs.md5 = outputs.hash;
  outputs.offsets = outputs.offset;
  outputs.frequency = outputs.freq;
  outputs.topk = outputs.freq;

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject(method)) {
      return wrap$1(this, method)
    }
    if (Object.hasOwn(outputs, method)) {
      return outputs[method](this)
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

  // a dash between two words, like '2025-05-11 - they'
  const spacedDash = /^\s+[-—]\s+$/;

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && Object.hasOwn(fmts, fmt)) {
        opts = { ...fmts[fmt] };
      } else if (fmt && isObject(fmt)) {
        opts = { ...fmt }; //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        const lastTerm = this.docs.at(-1)?.at(-1);
        if (ptr?.[1] || spacedDash.test(lastTerm?.post)) {
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

  const methods$7 = { ...methods$8, ...text, ...methods$9, ...html$1 };

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$7);
  };

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!Object.hasOwn(model.one.tagSet, tag)) {
          return tag
        }
        // an unknown color should not break the output
        const paint = cli[model.one.tagSet[tag].color] || blue;
        return paint(tag)
      });
    }
    return tags.join(', ')
  };

  // browser consoles get a collapsible table per sentence
  const showClient = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      const out = m.docs[0].map(t => {
        const text = t.implicit ? '[' + t.implicit + ']' : t.text || '-';
        return { text, tags: '[' + Array.from(t.tags).join(', ') + ']' }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };

  const showTags = function (view) {
    if (typeof window !== 'undefined' && window.document) {
      showClient(view);
      return
    }
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = yellow(text);
        let word = "'" + text + "'";
        if (t.frozen === true) {
          word += ' ❄️';
        }
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${dim(i$1('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = blue('  │ ') + i$1(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const colors$1 = { Noun: blue, Verb: green, Adjective: yellow, Pivot: red };

  const showChunks = view => {
    console.log('');
    view.docs.forEach(terms => {
      const out = terms.map(term => {
        const text = term.implicit || term.normal;
        if (Object.hasOwn(colors$1, term.chunk)) {
          return colors$1[term.chunk](text)
        }
        return text
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  // each match on its own line: green, inside its grey sentence, aligned at the middle column
  const width = 55;
  const half = 27;
  const dots = '…';

  // drop words from the outer edge until the side fits, leaving room for an ellipsis
  const fit = (arr, max, fromStart) => {
    let cut = false;
    const size = () => (fromStart ? arr.join('').trimStart() : arr.join('').trimEnd()).length + (cut ? 2 : 0);
    while (arr.length > 0 && size() > max) {
      if (fromStart) {
        arr.shift();
      } else {
        arr.pop();
      }
      cut = true;
    }
    return cut
  };

  // the padded context before the match, the match, and the context after it
  const parts = (terms, start, end) => {
    const arrs = [[], [], []]; // before, match, after
    terms.forEach((t, i) => {
      const str = (t.pre + t.text + t.post).replace(/\s+/g, ' ');
      const arr = arrs[(i >= start ? 1 : 0) + (i >= end ? 1 : 0)];
      // blank terms fold into the word before them
      if (str.trim() === '' && arr.length > 0) {
        arr[arr.length - 1] = (arr.at(-1) + str).replace(/\s+/g, ' ');
      } else {
        arr.push(str);
      }
    });
    const [before, match, after] = arrs;
    const left = (fit(before, half, true) ? dots + ' ' : '') + before.join('').trimStart();
    let mid = match.join('');
    const cutR = fit(after, width - half - mid.length, false);
    const right = after.join('').trimEnd() + (cutR ? ' ' + dots : '');
    if (right === '') {
      mid = mid.trimEnd();
    }
    return [' '.repeat(Math.max(0, half - left.length)) + left, mid, right]
  };

  const showHighlight = function (view) {
    const client = typeof window !== 'undefined' && window.document;
    view.fullPointer.forEach(([n, s, e]) => {
      const [left, mid, right] = parts(view.document[n], s, e);
      if (client) {
        console.log('%c' + left + '%c' + mid + '%c' + right, 'color:grey', 'color:green', 'color:grey');
      } else {
        console.log(grey(left) + green(mid) + (right ? grey(right) : ''));
      }
    });
  };

  const debug = {
    tags: showTags,
    chunks: showChunks,
    highlight: showHighlight,
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#(.*)$/s; // an optional '# comment' after the last {tags} block


  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace); // eslint-disable-line prefer-const
    if (tags === undefined) {
      const note = text.match(/\s#(.*)$/s)?.[1] || '';
      // no {tags} block on this line
      return { text: text.replace(/\s#.*$/s, '').trim(), tags: null, comment: note.trim() }
    }
    const note = (tags.match(comment)?.[1] || '').trim();
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    const lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    if (tags.length === 1 && tags[0].length === 1 && tags[0][0] === '') {
      tags = []; // empty '{}'; retain empty slots in nonempty lists
    }
    return { text: text.trim(), tags, comment: note }
  };

  // parse a whole spec into [{ line, text, tags, comment }], skipping blank and comment lines
  const parseSpec = function (spec = '') {
    const list = [];
    spec.split('\n').forEach((str, i) => {
      if (str.trim() && !/^\s*#/.test(str)) {
        list.push({ line: i + 1, ...parseLine(str) });
      }
    });
    return list
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    // Slots accept tags and '.', never match-syntax quantifiers or groups.
    if (tags.some(slot => slot.some(tag => tag !== '.' && !/^!?#?[a-z][a-z0-9]*$/i.test(tag)))) {
      return null
    }
    return tags.map(arr => {
      arr = arr.map(str => {
        if (str === '.') {
          return '.'
        }
        const negative = str.startsWith('!');
        const tag = str.replace(/^!?#?/, '');
        const prefix = negative ? '!#' : '#';
        return prefix + (aliases[tag] || tag)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // Apply only positive constraints; negatives remain assertions.
  const applyTags = (doc, slots, aliases) => {
    const terms = doc.terms();
    // Tokenization can supply structural tags; literal slots replace them.
    doc.docs.flat().forEach(term => term.tags.clear());
    slots?.forEach((slot, i) => {
      const tags = slot.filter(tag => tag !== '.' && !tag.startsWith('!')).map(tag => {
        tag = tag.replace(/^#/, '');
        return aliases[tag] || tag
      });
      terms.eq(i).tag(tags, 'fromSpec');
    });
  };

  // Diagnostics describe the original parse, before the returned View is mutated.
  const specFailures = (doc, slots, aliases) => {
    const terms = doc.docs.flat();
    const patterns = slots.map(slot => toMatchString([slot], aliases));
    const pattern = toMatchString(slots, aliases);
    if (terms.length === slots.length && pattern !== null && doc.has(pattern)) {
      return [] // valid
    }
    const failures = [];
    if (terms.length !== slots.length) {
      failures.push({
        code: 'length', expected: slots.length, actual: terms.length,
        message: `expected ${slots.length} terms, got ${terms.length}`,
      });
    }
    doc.compute('tagRank');
    slots.forEach((slot, i) => {
      const term = terms[i];
      const actual = term ? Array.from(term.tags) : [];
      const detail = { term: i + 1, word: term?.implicit || term?.text || '', expected: slot, actual };
      if (patterns[i] === null) {
        failures.push({ ...detail, code: 'syntax', message: `term ${i + 1}: invalid slot ${slot.join('|')}` });
        return
      }
      if (!term) {
        return // covered by the length error
      }
      const problems = [];
      slot.forEach(value => {
        if (value === '.') {
          return
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        if (negative && present) {
          problems.push(`unexpected #${tag}`);
        } else if (!negative && !present) {
          problems.push(`missing #${tag}`);
        }
      });
      if (problems.length > 0) {
        const best = term.tagRank?.[0] || actual.at(-1) || 'Untagged';
        failures.push({
          ...detail, code: 'tags',
          message: `term ${i + 1} '${detail.word}': #${best}, ${problems.join(', ')}`,
        });
      }
    });
    if (failures.length === 0) {
      failures.push({ code: 'match', message: 'tags align, but the sentence pattern did not match' });
    }
    return failures
  };

  const logSpec = (doc, slots, failures, aliases) => {
    const terms = doc.docs.flat();
    const wrong = new Set(failures.filter(failure => failure.term).map(failure => failure.term - 1));
    const invalid = new Set(failures.filter(failure => failure.code === 'syntax').map(failure => failure.term - 1));
    const unmatched = failures.some(failure => failure.code === 'match');
    let visible = 0;
    terms.forEach((term, i) => {
      if (term.text) {
        visible = i;
      }
      // Implicit terms share their visible contraction or number-range token.
      if (wrong.has(i) || i >= slots.length || unmatched) {
        wrong.add(visible);
      }
    });
    const text = terms.map((term, i) => {
      const word = wrong.has(i) && term.text ? red(term.text) : term.text;
      return term.pre + word + term.post
    }).join('').trim();
    const tags = slots.map((slot, i) => {
      const term = terms[i];
      if (!term || invalid.has(i) || unmatched) {
        return red(slot.join('|'))
      }
      return slot.map(value => {
        if (value === '.') {
          return value
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        return present === negative ? red(value) : value
      }).join('|')
    }).join(',');
    const block = slots.length === 0 ? red('{}') : `{${tags}}`;
    return `${text} ${block}`
  };

  // one ✓ or ✗ line per spec line, for verbose mode
  const logLine = (text, tags, detail) => {
    const block = tags === null ? '' : ` {${tags.map(slot => slot.join('|')).join(',')}}`;
    if (detail) {
      return `${red('✗')} ${text}${dim(block)} - ${red(detail)}`
    }
    return `${green('✓')} ${green(dim(text))}${dim(block)}`
  };

  const fromSpec = function (spec, { tags: tagMode = 'ignore', failures: failureMode = 'ignore', verbose = false } = {}) {
    if (!['ignore', 'use'].includes(tagMode) || !['ignore', 'throw', 'retain', 'log'].includes(failureMode)) {
      throw new Error('Invalid fromSpec options')
    }
    const aliases = this.world().model.one.tagAliases;
    const result = this('');
    result.failures = [];
    parseSpec(spec).forEach(({ line, text, tags }) => {
      const doc = tagMode === 'use' ? this.tokenize(text) : this(text);
      let failures = [];
      if (tags !== null && (tagMode === 'use' || failureMode !== 'ignore')) {
        const count = doc.docs.reduce((sum, terms) => sum + terms.length, 0);
        const pattern = toMatchString(tags, aliases);
        // Assigning slots is unsafe when the shape or syntax is invalid.
        const canApply = count === tags.length && pattern !== null;
        if (tagMode === 'use' && !canApply && failureMode !== 'log') {
          const invalid = specFailures(doc, tags, aliases);
          throw new Error(`${text} - ${invalid.map(failure => failure.message).join('; ')}`)
        }
        if (tagMode === 'use') {
          applyTags(doc, canApply ? tags : null, aliases);
        }
        if (failureMode !== 'ignore') {
          failures = specFailures(doc, tags, aliases)
            .map(failure => ({ line, text, ...failure }));
          result.failures.push(...failures);
        }
      } else if (tagMode === 'use') {
        applyTags(doc, null, aliases);
      }
      const detail = failures.map(failure => failure.message).join('; ');
      if (failureMode === 'log' && failures.length > 0) {
        console.error(logSpec(doc, tags, failures, aliases)); //eslint-disable-line no-console
      } else if (verbose || debug$2.spec) {
        console.log(logLine(text, tags, detail)); //eslint-disable-line no-console
      }
      if (failures.length > 0 && failureMode === 'throw') {
        throw new Error(`${text} - ${detail}`)
      }
      if (failureMode === 'retain' && tags !== null && failures.length === 0) {
        return
      }
      // Preserve the parsed terms and assigned tags, without running hooks twice.
      if (doc.found) {
        const previous = result.document.at(-1)?.at(-1);
        if (previous) {
          previous.post += '\n';
        }
        result.document.push(...doc.docs);
      }
    });
    return result
  };

  // Keep the legacy logging and throwing arguments on the compatibility wrapper.
  const testSpec = function (spec, verbose = true, throwError = false) {
    const result = this.fromSpec(spec, { tags: 'ignore', failures: 'retain', verbose });
    if (throwError && result.failures.length > 0) {
      const failure = result.failures[0];
      throw new Error(`${failure.text} - ${failure.message}`)
    }
    return result
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
        parseSpec,
      },
    },
  };

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
      // look up a sentence, then down one
      for (const k of [n - i, n + i]) {
        if (doc[k]) {
          const index = doc[k].findIndex(term => term.id === id);
          if (index !== -1) {
            return [k, index]
          }
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
      ptr[4] = terms.length > 0 ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd + 1; // repair ending pointer, which is exclusive
    }
    return document[n].slice(start, ptr[2])
  };

  /** return a subset of the document, from a pointer */
  const getDoc = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      // eslint-disable-next-line prefer-const
      let [n, start, end, id, endId] = ptr;
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
          // the ending may have moved too, if its term still exists
          endId = document[wild[0]].some(term => term.id === endId) ? endId : undefined;
          ptr = [wild[0], wild[1], wild[1] + len, startId, endId];
          ptrs[i] = ptr;
        } else {
          // our start-term was deleted (replaced?) - trust the index, and adopt the term now there
          terms = terms.slice(start, end);
          ptr[3] = terms[0] ? terms[0].id : null;
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
  const termList = docs => docs.flat();

  var methods$6 = {
    one: {
      termList,
      getDoc,
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

  // a new view from the pointers
  const toView = (view, ptrs) => view.toView(addIds(ptrs, view.document));

  // combine our pointers with another view's
  const setOp = fn => function (m) {
    m = getDoc$1(m, this);
    return toView(this, fn(this.fullPointer, m.fullPointer))
  };

  const methods$5 = {};

  // all parts, minus duplicates
  methods$5.union = setOp(getUnion);
  methods$5.and = methods$5.union;

  // only parts they both have
  methods$5.intersection = setOp(getIntersection);

  // only parts of a that b does not have
  methods$5.not = setOp(subtract);
  methods$5.difference = methods$5.not;

  // get opposite of a match
  methods$5.complement = function () {
    return toView(this, subtract(this.all().fullPointer, this.fullPointer))
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

  const api$d = function (View) {

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
            term.index[1] + len
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

  const sets = new WeakMap();
  const empty = new Set();

  // Normalization replaces these arrays when plugins rebuild the tag graph.
  const getTagSet = (tags) => {
    if (!tags || tags.length === 0) {
      return empty
    }
    let set = sets.get(tags);
    if (!set) {
      set = new Set(tags);
      sets.set(tags, set);
    }
    return set
  };

  // strip the '#', then follow any alias
  const resolveTag = (tag, aliases) => {
    tag = tag.replace(/^#/, '');
    return aliases?.[tag] || tag
  };

  // Resolve actions and index hints once, alongside the match expression.
  const resolveAliases = (rule, aliases) => {
    const tag = value => {
      if (Array.isArray(value)) {
        return value.map(tag)
      }
      if (typeof value !== 'string') {
        return value
      }
      return value.trim().split(/ +/).map(name => resolveTag(name, aliases)).join(' ')
    };
    const hook = value => {
      if (typeof value === 'string' && value.startsWith('#')) {
        return '#' + tag(value)
      }
      return value
    };
    if (rule.tag !== undefined) {
      rule.tag = tag(rule.tag);
    }
    if (rule.unTag !== undefined) {
      rule.unTag = tag(rule.unTag);
    }
    if (rule.hook !== undefined) {
      rule.hook = hook(rule.hook);
    }
    if (rule.ifNo !== undefined) {
      rule.ifNo = [rule.ifNo].flat().map(hook);
    }
  };

  // Only precheck required, single-term tokens without special matching steps.
  const canCheck = reg => Boolean(reg && !reg.optional && !reg.negative && !reg.greedy &&
    !reg.choices && !reg.anything && !reg.regex && !reg.method);

  const getBoundary = (reg, boundary) => {
    if (!canCheck(reg) || !reg[boundary]) {
      return null
    }
    return reg
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

  // Only allow hooks that every successful match must contain. In particular,
  // a word inside an optional or negative AND block is not a required hook.
  const hasRequiredHook = function (regs, hook) {
    return regs.some(reg => {
      if (reg.optional || reg.negative) {
        return false
      }
      if (getTokenNeeds(reg) === hook) {
        return true
      }
      return reg.operator === 'and' && reg.choices &&
        reg.choices.some(side => hasRequiredHook(side, hook))
    })
  };

  const getNeeds = function (regs) {
    const needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag) - but an optional or negative block requires nothing
      if (reg.operator === 'and' && reg.choices && !reg.optional && !reg.negative) {
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

  const parse$2 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      resolveAliases(obj, world.model.one.tagAliases);
      obj.regs = parseMatch(obj.match, {}, world);
      obj.fixed = isFixed(obj.regs);
      obj.checkFirst = canCheck(obj.regs[0]);
      obj.startTerm = getBoundary(obj.regs[0], 'start');
      obj.endTerm = getBoundary(obj.regs[obj.regs.length - 1], 'end');
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      if (obj.hook !== undefined) {
        if (typeof obj.hook !== 'string' || !obj.needs.includes(obj.hook) || !hasRequiredHook(obj.regs, obj.hook)) {
          throw new Error(`Invalid hook "${obj.hook}" for match "${obj.match}": use a required word, #Tag, or %Switch%.`)
        }
      }
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
      // The matcher excludes negative tokens from its own minimum. Cache that
      // separately rather than changing the sweep's existing length filter.
      obj.minLength = getMinLength(obj.regs);
    });
    return matches
  };

  // Choose one necessary hook per rule. A missing required hook guarantees that
  // the rule cannot match, so broader hooks need not enqueue it as well.
  const buildIndex$1 = function (matches, hooks, hookOrder) {
    const index = Object.create(null);
    const seen = new Set();
    const lastRank = Object.keys(hooks).length;
    matches.forEach((rule, order) => {
      if (seen.has(rule)) {
        return
      }
      seen.add(rule);
      let anchor = null;
      let rank = lastRank;
      for (let i = 0; i < rule.needs.length; i += 1) {
        const key = rule.needs[i];
        // Prefer the hook shared by the fewest rules in this network.
        if (anchor === null || hooks[key].length < hooks[anchor].length) {
          anchor = key;
        }
        rank = Math.min(rank, hookOrder[key]);
      }
      // Explicit hooks have already been checked against required match tokens.
      if (rule.hook !== undefined) {
        anchor = rule.hook;
      }
      // Historically, any earlier matching alternative could determine where
      // this rule ran. Retain that ordering even when using a required anchor.
      const earlier = [...new Set(rule.wants)]
        .filter(key => hookOrder[key] < rank)
        .sort((a, b) => hookOrder[a] - hookOrder[b]);
      const keys = anchor === null ? [...new Set(rule.wants)] : [anchor];
      // The bucket already proves its anchor; check each remaining need once.
      const needs = [...new Set(rule.needs)].filter(key => key !== anchor);
      const entry = { rule, order, rank, earlier, needs, single: keys.length === 1 };
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        index[key] ||= [];
        index[key].push(entry);
      }
    });
    return index
  };

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$2(matches, world);

    // collect by wants and needs
    const hooks = {};
    matches.forEach(obj => {
      // add needs, then wants
      obj.needs.concat(obj.wants).forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
    });
    // Record enumeration order, including numeric keys, so input-driven lookup
    // can preserve the order in which tag actions have always been applied.
    const hookOrder = Object.create(null);
    Object.keys(hooks).forEach((k, i) => {
      hookOrder[k] = i;
      // remove duplicates
      const already = new Set();
      hooks[k] = hooks[k].filter(obj => {
        if (already.has(obj)) {
          return false
        }
        already.add(obj);
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      hookOrder,
      index: buildIndex$1(matches, hooks, hookOrder),
      always
    }
  };

  // Reject impossible candidates before allocating and sorting their entries.
  const canMatch = (obj, haves, terms, needs = obj.needs) => {
    const termCount = terms.length;
    if (!(termCount >= obj.minWords)) {
      return false
    }
    for (let j = 0; j < needs.length; j += 1) {
      if (!haves.has(needs[j])) {
        return false
      }
    }
    if (obj.ifNo !== undefined) {
      for (let j = 0; j < obj.ifNo.length; j += 1) {
        if (haves.has(obj.ifNo[j])) {
          return false
        }
      }
    }
    if (obj.wants.length > 0) {
      let count = 0;
      for (let j = 0; j < obj.wants.length; j += 1) {
        if (haves.has(obj.wants[j])) {
          count += 1;
          if (count >= obj.minWant) {
            break
          }
        }
      }
      if (!(count >= obj.minWant)) {
        return false
      }
    }
    // Required anchors must match the sentence boundary, not just occur in it.
    if (termCount && obj.startTerm && !wrapMatch(terms[0], obj.startTerm, 0, termCount)) {
      return false
    }
    if (termCount && obj.endTerm && !wrapMatch(terms[termCount - 1], obj.endTerm, termCount - 1, termCount)) {
      return false
    }
    return true
  };

  // Required anchors narrow the candidate list. Sort surviving entries by their
  // original first matching hook, then their position within that hook's bucket.
  const getIndexed = function (set, index, hookOrder, terms) {
    const found = [];
    const seen = new Set();
    set.forEach(key => {
      const bucket = index[key];
      if (!Array.isArray(bucket)) {
        return
      }
      for (let i = 0; i < bucket.length; i += 1) {
        const entry = bucket[i];
        // Single-bucket entries cannot be encountered twice. Older nets fall back.
        if (entry.single !== true) {
          if (seen.has(entry)) {
            continue
          }
          seen.add(entry);
        }
        if (!canMatch(entry.rule, set, terms, entry.needs)) {
          continue
        }
        let rank = entry.rank;
        for (let j = 0; j < entry.earlier.length; j += 1) {
          const earlier = entry.earlier[j];
          if (set.has(earlier)) {
            rank = hookOrder[earlier];
            break
          }
        }
        if (rank === entry.rank) {
          found.push(entry);
        } else {
          found.push({ rule: entry.rule, rank, order: entry.order });
        }
      }
    });
    found.sort((a, b) => a.rank - b.rank || a.order - b.order);
    return found.map(entry => entry.rule)
  };

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, net, document) {
    const { hooks, index, always } = net;
    let { hookOrder } = net;
    // Older compiled nets may not include the precomputed hook order.
    if (!hookOrder) {
      hookOrder = Object.create(null);
      Object.keys(hooks).forEach((k, i) => { hookOrder[k] = i; });
    }
    const lists = docCaches.map((set, n) => {
      if (index) {
        return getIndexed(set, index, hookOrder, document[n])
      }
      const keys = [];
      set.forEach(k => {
        if (typeof hookOrder[k] === 'number') {
          keys.push(k);
        }
      });
      keys.sort((a, b) => hookOrder[a] - hookOrder[b]);
      // Append each rule once, without concatenating and then filtering buckets.
      const maybe = [];
      const already = new Set();
      for (let i = 0; i < keys.length; i += 1) {
        const bucket = hooks[keys[i]];
        for (let j = 0; j < bucket.length; j += 1) {
          const m = bucket[j];
          if (!already.has(m)) {
            already.add(m);
            if (canMatch(m, set, document[n])) {
              maybe.push(m);
            }
          }
        }
      }
      return maybe
    });
    // Apply the same exclusions to unindexed rules, preserving their final position.
    lists.forEach((list, n) => {
      for (let i = 0; i < always.length; i += 1) {
        if (canMatch(always[i], docCaches[n], document[n])) {
          list.push(always[i]);
        }
      }
    });
    return lists
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      const sentence = [document[n]];
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match(sentence, m);
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
            results.push({ ...m, pointer: ptr });
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

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // filter candidates before sorting them into execution order
    const maybeList = getHooks(docCache, net, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  // quick check if this tag will require any untagging
  const canBe$1 = function (term, tag, tagSet) {
    if (!Object.hasOwn(tagSet, tag)) {
      return true // everything can be an unknown tag
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (const existing of term.tags) {
      if (conflicts.has(existing)) {
        return false
      }
    }
    return true
  };

  // is this tag consistent with the tags they already have?
  const canBe = (terms, tag, model) => terms.every(term => canBe$1(term, tag, model.one.tagSet));

  const tagger$3 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    const looksPlural = methods.two.looksPlural;
    if (list.length === 0) {
      return list
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
      let validated;
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
        // Only an exact single tag was checked by canBe; arrays and shorthand
        // still need their individual checks in setTag.
        if (typeof todo.tag === 'string' && Object.hasOwn(model.one.tagSet, todo.tag)) {
          validated = model.one.tagSet[todo.tag];
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`, validated);
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
        unTag(terms, todo.unTag, model.one.tagSet, reason);
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
    bulkTagger: tagger$3
  };

  var sweep = {
    lib: lib$2,
    api: api$d,
    methods: {
      one: methods$4,
    }
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun' || tag === 'Verb') {
      term.chunk = tag;
    }
  };

  // eslint-disable-next-line max-params
  const tagTerm = function (term, tag, tagSet, isSafe, validated, reason) {
    // does it already have this tag?
    if (term.tags.has(tag)) {
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
    const previous = debug$2.tags ? debug$2.before(term) : null;
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known !== validated && known.not && known.not.length > 0) {
        const conflicts = getTagSet(known.not);
        for (const existing of term.tags) {
          if (conflicts.has(existing)) {
            // Safe and frozen terms cannot lose conflicting tags.
            if (isSafe === true) {
              return null
            }
            term.tags.delete(existing);
          }
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
    if (previous) {
      debug$2.log(term, previous, reason);
    }
    return true
  };

  // support '#Noun . #Adjective' syntax
  // eslint-disable-next-line max-params
  const multiTag = function (terms, tagString, tagSet, aliases, isSafe, reason) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      const tag = tags[i];
      if (tag) {
        tagTerm(term, resolveTag(tag, aliases), tagSet, isSafe, undefined, reason);
      }
    });
  };

  // add a tag to all these terms
  // Whole-match validation is separate from per-term safety.
  // eslint-disable-next-line max-params
  const setTag = function (terms, tag, world = {}, isSafe, reason, validated) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    if (Array.isArray(tag)) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe, reason));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, world.model.one.tagAliases, isSafe, reason);
      return
    }
    tag = resolveTag(tag, world.model.one.tagAliases);
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe, validated, reason);
    }
  };

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet, reason = 'untag') {
    tag = tag.trim().replace(/^#/, '');
    const children = getTagSet(tagSet[tag]?.children);
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      const previous = debug$2.tags ? debug$2.before(term) : null;
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        if (previous) {
          debug$2.log(term, previous, reason);
        }
        continue
      }
      // removing #Verb should also remove #PastTense
      if (children.size > 0) {
        for (const existing of term.tags) {
          if (children.has(existing)) {
            term.tags.delete(existing);
          }
        }
      }
      term.tags.delete(tag);
      if (previous) {
        debug$2.log(term, previous, reason);
      }
    }
  };

  const validate$1 = function (node) {
    node.children = node.children || [];
    node._cache = node._cache || {};
    node.props = node.props || {};
    node._cache.parents = node._cache.parents || [];
    return node
  };

  // Iterative DFS keeps deep inputs safe and distinguishes shared nodes from cycles.
  const checkCycles = roots => {
    const states = new Map();
    const stack = roots.map(node => [node, false]);
    for (; stack.length > 0;) {
      const [node, done] = stack.pop();
      if (done) {
        states.set(node, 2);
      } else if (states.get(node) === 1) {
        throw new Error('[Grad] - cyclic input')
      } else if (!states.has(node)) {
        states.set(node, 1);
        stack.push([node, true]);
        for (const child of node.children || []) {
          stack.push([child, false]);
        }
      }
    }
    return states.keys()
  };

  // turn parent-index rows into nested json
  const fromArray = function (rows) {
    const index = new Map();
    // addTags allocates these rows for this graph, so initialize them in place.
    rows.forEach(node => {
      validate$1(node);
      index.set(node.id, node);
    });
    const root = validate$1({});
    rows.forEach(node => {
      if (node.parent) {
        if (index.has(node.parent)) {
          const parent = index.get(node.parent);
          delete node.parent; //no-longer needed
          parent.children.push(node);
        } else {
          console.warn(`[Graph] - missing node '${node.parent}'`); // eslint-disable-line no-console
        }
        return
      }
      // no parent, add it to root
      root.children.push(node);
    });
    checkCycles(rows);
    return root
  };

  // [a, a1, b, b1]
  // Visitor-only callers can skip collecting nodes.
  const byDepth = (root, fn, collect = true) => {
    const list = collect ? [] : null;
    const queue = [root];
    for (; queue.length > 0;) {
      // get first
      const node = queue.pop();
      if (collect) {
        list.push(node);
      }
      // add kids to queue
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i -= 1) {
          const child = node.children[i];
          if (fn) {
            fn(node, child);
          }
          queue.push(child);
        }
      }
    }
    return list
  };

  // Fresh graph nodes already have empty caches; fill ancestors in root-to-parent order.
  const cacheParents = root => {
    byDepth(root, (parent, child) => {
      if (parent.id) {
        child._cache.parents = parent._cache.parents.concat([parent.id]);
      }
    }, false);
  };

  // addTags supplies only exclusions, additional parents, and these scalar flags.
  const inherit = (props, parent) => {
    if (parent.not) {
      props.not = new Set([...props.not, ...parent.not]);
    }
    if (Array.isArray(parent.also) && (props.also === undefined || Array.isArray(props.also))) {
      props.also = parent.also.concat(props.also || []);
    } else if (props.also === undefined) {
      props.also = parent.also;
    }
    if (props.is === undefined) {
      props.is = parent.is;
    }
    if (props.novel === undefined) {
      props.novel = parent.novel;
    }
    return props
  };

  const fillDown = root => {
    byDepth(root, (parent, child) => {
      child.props = inherit(child.props, parent.props);
    }, false);
  };

  const toArray$5 = function (json) {
    // The tag formatter only reads these graph-owned nodes.
    const nodes = byDepth(json);
    // should we show the root?
    const root = nodes[0];
    if (root && !root.id && Object.keys(root.props).length === 0) {
      nodes.shift();
    }
    return nodes
  };

  // The tag-inheritance subset of grad-school;
  // https://github.com/spencermountain/grad-school

  class Graph {
    constructor(json) {
      Object.defineProperty(this, 'json', {
        enumerable: false,
        value: json,
        writable: true,
      });
    }
    cache() {
      cacheParents(this.json);
      return this
    }
    fillDown() {
      fillDown(this.json);
      return this
    }
    // the graph's nodes, parents first
    toArray() {
      // fillDown changes properties, so the cached graph relationships still hold.
      return toArray$5(this.json)
    }
  }

  const graph = rows => new Graph(fromArray(rows));

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Connector: 'cyan',
    Determiner: 'cyan',
    Hyphenated: 'cyan',
    Adverb: 'cyan',
  };

  const getColor = function (node) {
    if (Object.hasOwn(colors, node.id)) {
      return colors[node.id]
    }
    if (Object.hasOwn(colors, node.is)) {
      return colors[node.is]
    }
    const found = node._cache.parents.find(c => colors[c]);
    return colors[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    const each = fn => Object.keys(res).forEach(fn);
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
        children: [],
        color: getColor(node),
        // Retain the preferred output name for legacy model consumers.
        alias: node.aliases === undefined ? node.alias : node.aliases[0],
        aliases: node.aliases,
      };
    });
    // `also` is another inheritance edge. Resolve its ancestors before building
    // reverse edges, so removing any parent also removes all dependent tags.
    const resolved = new Set();
    const resolving = new Set();
    const resolveParents = function (tag) {
      if (resolved.has(tag)) {
        return res[tag].parents
      }
      if (resolving.has(tag)) {
        throw new Error(`compromise: cyclic tag inheritance at '${tag}'`)
      }
      resolving.add(tag);
      const parents = new Set();
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          resolveParents(parent).forEach(ancestor => parents.add(ancestor));
        }
        parents.add(parent);
      });
      res[tag].parents = Array.from(parents);
      resolving.delete(tag);
      resolved.add(tag);
      return res[tag].parents
    };
    each(resolveParents);
    each(tag => {
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          res[parent].children.push(tag);
        }
      });
    });

    // Inherit exclusions through every parent, then exclude all descendants of
    // each conflicting tag. Read a snapshot to keep this independent of order.
    const exclusions = {};
    each(tag => { exclusions[tag] = res[tag].not; });
    each(k => {
      const nots = new Set(exclusions[k]);
      res[k].parents.forEach(parent => {
        for (const not of exclusions[parent] || []) {
          nots.add(not);
        }
      });
      Array.from(nots).forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
      getTagSet(res[k].not);
      getTagSet(res[k].children);
      // Keep accepting custom definitions, but flag impossible combinations once
      // per tag, after both inheritance and reciprocal exclusions are resolved.
      const conflicts = [k, ...res[k].parents].filter(tag => nots.has(tag));
      if (conflicts.length > 0) {
        const names = conflicts.map(tag => `#${tag}`).join(', ');
        console.warn(`compromise: contradictory tag '#${k}' requires and excludes: ${names}`); // eslint-disable-line no-console
      }
    });
    return res
  };

  // Compile once per registration. Real tag names always take precedence.
  const compileAliases = (tags, normalize) => {
    const aliases = Object.create(null);
    Object.keys(tags).forEach(tag => { aliases[tag] = tag; });
    Object.keys(tags).forEach(tag => {
      const entry = tags[tag];
      const names = entry.aliases === undefined ? [entry.alias] : [entry.aliases].flat();
      names.forEach(name => {
        if (name === null || name === undefined) {
          return
        }
        if (typeof name !== 'string' || !/^[\p{L}_][\p{L}\p{M}\p{N}_-]*$/u.test(name)) {
          throw new Error(`compromise: invalid alias for '#${tag}'`)
        }
        // Match strings undergo Unicode normalization before parsing.
        const spellings = normalize ? [name, normalize(name)] : [name];
        spellings.forEach(spelling => {
          if (Object.hasOwn(tags, spelling)) {
            if (spelling !== name && spelling !== tag) {
              throw new Error(`compromise: tag alias '${name}' normalizes to '#${spelling}'`)
            }
            return
          }
          if (aliases[spelling] && aliases[spelling] !== tag) {
            throw new Error(`compromise: duplicate tag alias '${spelling}'`)
          }
          aliases[spelling] = tag;
        });
      });
    });
    return aliases
  };

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input.slice()
  };

  const addImplied = function (tags) {
    const aliases = compileAliases(tags);
    const resolve = tag => aliases[tag] || tag;
    // add an implicit entry for any tag we reference
    const ensure = tag => {
      if (!Object.hasOwn(tags, tag)) {
        tags[tag] = {};
      }
    };
    Object.keys(tags).forEach(k => {
      const o = tags[k];
      // support deprecated fmts
      if (o.isA) {
        o.is = o.isA;
      }
      if (o.notA) {
        o.not = o.notA;
      }
      if (typeof o.is === 'string') {
        o.is = resolve(o.is);
      }
      if (o.also) {
        o.also = toArr(o.also).map(resolve);
      }
      if (o.not) {
        o.not = toArr(o.not).map(resolve);
      }
      // add any implicit 'is' tags
      if (o.is && typeof o.is === 'string') {
        ensure(o.is);
      }
      // Additional parents need entries too, including parents introduced by plugins.
      toArr(o.also).forEach(ensure);
      // add any implicit 'not' tags
      toArr(o.not).forEach(ensure);
    });
    return tags
  };


  const validate = function (tags, already) {
    // Reciprocal links must reach previously registered tags too. Copy entries
    // before normalization so the existing compiled model remains untouched.
    tags = Object.fromEntries(Object.keys({ ...already, ...tags }).map(tag => [tag, { ...already[tag], ...tags[tag] }]));
    tags = addImplied(tags);

    // property validation
    Object.keys(tags).forEach(k => {
      const o = tags[k];
      if (o.aliases !== undefined) {
        o.aliases = toArr(o.aliases);
      }
      o.children = toArr(o.children);
      o.not = toArr(o.not);
      if (o.also) {
        o.also = toArr(o.also);
      }
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not && !tags[no].not.includes(k)) {
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
      return { id: k, parent: o.is, props, children: [], alias: o.alias, aliases: o.aliases?.slice() }
    });
    const graph$1 = graph(flatList).cache().fillDown();
    return graph$1.toArray()
  };

  const fromUser = function (tags) {
    Object.entries(tags).forEach(([k, v]) => {
      tags[k] = { ...v, novel: true };
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // Normalization owns its definitions, including when callers reuse a tagset.
    tags = Object.fromEntries(Object.entries(tags).map(([tag, definition]) => [tag, { ...definition }]));
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate(tags, already);

    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$2(tags);
    // convert it to our final format
    const res = fmt(nodes);
    return res
  };

  var methods$3 = {
    one: {
      setTag,
      unTag,
      addTags: addTags$1,
      canBe: canBe$1,
    },
  };

  // shared guards - returns the terms to change, or null
  const prep = function (view, input) {
    if (!view.found || !input) {
      return null
    }
    const terms = view.termList();
    if (terms.length === 0) {
      return null
    }
    return terms
  };

  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      const terms = prep(this, input);
      if (terms) {
        this.methods.one.setTag(terms, input, this.world, isSafe, reason);
        this.uncache();
      }
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      const terms = prep(this, input);
      if (terms) {
        const { methods, model } = this;
        const { tagSet, tagAliases } = model.one;
        const list = Array.isArray(input) ? input : [input];
        list.forEach(tag => methods.one.unTag(terms, resolveTag(tag.trim(), tagAliases), tagSet, reason));
        this.uncache();
      }
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      const { tagSet, tagAliases } = this.model.one;
      tag = resolveTag(tag, tagAliases);
      const canBe = this.methods.one.canBe;
      const nope = [];
      eachTerm(this.document, (term, terms, i, n) => {
        if (!canBe(term, tag, tagSet)) {
          nope.push([n, i, i + 1]);
        }
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
    const world = this.world();
    const { model, methods } = world;
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
    const aliases = compileAliases(res, name => methods.one.killUnicode(name, world));
    model.one.tagSet = res;
    model.one.tagAliases = aliases;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !Object.hasOwn(tagSet, b)) {
        return 1
      }
      if (boringTags.has(b) || !Object.hasOwn(tagSet, a)) {
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
    eachTerm(document, term => {
      const tags = Array.from(term.tags);
      term.tagRank = sortByKids(tags, tagSet);
    });
  };

  var tag = {
    model: {
      one: { tagSet: {}, tagAliases: Object.create(null) }
    },
    compute: {
      tagRank
    },
    methods: methods$3,
    api: tagAPI,
    lib: lib$1
  };

  // Scan punctuation runs once. Searching for an unanchored run followed by
  // whitespace repeatedly rescans long runs that have no following whitespace.
  const stops = new Set('.!?\u203D\u2E18\u203C\u2047\u2048\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002');
  const cjkStops = new Set('。！？｡');
  const openers$1 = new Set('「『（【〔《〈“');
  const closers = new Set('」』）】〕》〉”');
  const whitespace = /\s/;
  const splitsOnly = /^[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。]+\s$/;
  const splitsOnlyCjk = /^(?:[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。！？｡]+\s|[。！？｡]+[」』）】〕》〉”]*)$/;
  const newLine = /((?:\r?\n|\r)+)/;

  const basicSplit = function (text) {
    const all = [];
    const isCjk = /[。！？｡]/.test(text);
    const activeStops = isCjk ? new Set([...stops, ...cjkStops]) : stops;
    for (const line of text.split(newLine)) {
      let start = 0;
      const arr = [];
      const emit = (from, end) => {
        arr.push(line.slice(start, from), line.slice(from, end));
        start = end;
      };
      let i = 0;
      while (i < line.length) {
        if (!activeStops.has(line[i])) {
          i++;
          continue
        }
        const runStart = i;
        while (i < line.length && activeStops.has(line[i])) i++;
        if (i < line.length && whitespace.test(line[i])) {
          emit(runStart, i + 1);
          i++;
          continue
        }
        if (!isCjk) continue
        // A CJK stop ends a sentence without whitespace. Following closing quotes
        // only end it when followed by whitespace, another opener, or end of text.
        let j = runStart;
        while (j < i) {
          if (!cjkStops.has(line[j])) {
            j++;
            continue
          }
          const from = j;
          while (j < i && cjkStops.has(line[j])) j++;
          let end = j;
          while (end < line.length && closers.has(line[end])) end++;
          if (end === j || end === line.length || whitespace.test(line[end]) || openers$1.has(line[end])) {
            emit(from, end);
            if (end > i) i = end;
          }
        }
      }
      arr.push(line.slice(start));
      // Preserve the existing merge behavior, including punctuation-only pieces.
      for (let k = 0; k < arr.length; k++) {
        const next = arr[k + 1];
        if (next && (isCjk ? splitsOnlyCjk : splitsOnly).test(next)) {
          arr[k] += next;
          arr[k + 1] = '';
        }
        if (arr[k]) all.push(arr[k]);
      }
    }
    return all
  };

  // a letter, number, or symbol/emoji in any script - otherwise it's only punctuation
  const hasLetter$2 = /[\p{L}\p{N}\p{So}]/u;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    const chunks = [];
    let lead = ''; // whitespace+punctuation, before the first chunk
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (!hasSomething$1.test(s) || !hasLetter$2.test(s)) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          lead += s;
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(lead + s);
      lead = '';
    }
    return chunks
  };

  const hasLetter$1 = /\p{L}/u;

  const hasNewline = function (c) {
    return Boolean(/\n$/.test(c))
  };

  //loop through these chunks, and join the non-sentence chunks back together..
  // (only check the end of the joined text - re-reading it for every chunk is quadratic)
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    const sentences = [];
    let sentence = '';
    let tail = '';
    let foundLetter = false;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      sentence += c;
      tail = (tail + c).slice(-64);
      foundLetter ||= hasLetter$1.test(c);
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && !isSentence(tail, abbrevs, foundLetter) && !hasNewline(c)) {
        continue
      }
      //this chunk is a proper sentence..
      if (sentence.length > 0) {
        sentences.push(sentence);
      }
      sentence = '';
      tail = '';
      foundLetter = false;
    }
    return sentences
  };

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.'
  const MAX_QUOTE = 280; // ¯\_(ツ)_/¯
  const MAX_AHEAD = 5;

  // each opening quote, and the marks that may close it
  // (some marks open a quote in one language, and close it in another)
  // a third mark means 'not an opener, when that one is around'
  // don't support single-quotes for multi-sentences
  const pairs$1 = [
    ['\u0022', '\u0022'], // straight
    ['\uFF02', '\uFF02'], // wide
    ['\u201C', '\u201D', '\u201E'], // english (but it closes a german one)
    ['\u201F', '\u201D'], // reversed
    ['\u201E', '\u201D\u201C'], // polish, german
    ['\u2E42', '\u201D'], // low-reversed
    ['\u201A', '\u2019\u2018'], // low-single, german
    ['\u00AB', '\u00BB'], // french
    ['\u00BB', '\u00AB'], // german
    ['\u2039', '\u203A'], // single
    ['\u203A', '\u2039'], // single, reversed
    ['\u2035', '\u2032'], // prime
    ['\u2036', '\u2033'], // double-prime
    ['\u2037', '\u2034'], // triple-prime
    ['\u301D', '\u301E'], // prime
    ['\u301F', '\u301E'], // low-prime
    ['\u300C', '\u300D'], // corner
    ['\u300E', '\u300F'], // white-corner
  ];

  const count$1 = function (str, chars) {
    let n = 0;
    for (const c of str) {
      if (chars.includes(c)) {
        n += 1;
      }
    }
    return n
  };

  // is there a quotation here, that hasn't closed yet?
  const isOpen = function (str) {
    return pairs$1.some(([open, close, unless]) => {
      const n = count$1(str, open);
      if (n === 0 || (unless && str.includes(unless))) {
        return false
      }
      // the same mark opens and closes
      if (open === close) {
        return n % 2 === 1
      }
      return n > count$1(str, close)
    })
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let str = splits[i];
      if (isOpen(str)) {
        // look ahead for the sentence that closes it
        let toAdd = '';
        for (let n = i + 1; n < splits.length && n - i <= MAX_AHEAD; n += 1) {
          toAdd += splits[n];
          //make sure it's not too-long
          if (toAdd.length >= MAX_QUOTE) {
            break
          }
          if (!isOpen(str + toAdd)) {
            // merge them all
            str += toAdd;
            i = n;
            break
          }
        }
      }
      arr.push(str);
    }
    return arr
  };

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen$2 = /[(\uFF08]/g;
  const hasClosed$2 = /[)\uFF09]/g;
  const mergeParens = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      const m = split.match(hasOpen$2);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          const m2 = splits[i + 1].match(hasClosed$2);
          if (m2 !== null && m.length === 1 && !hasOpen$2.test(splits[i + 1])) {
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
    text ||= '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || !hasSomething.test(text)) {
      return []
    }
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

  const notWord = new Set(toList(`
.
?
!
:
;
-
–
—
--
...
(
)
[
]
"
'
\`
«
»
*
•
`));

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str ||= '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (Array.isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen$1(words[i], model)) {
        arr = arr.concat(splitHyphens$1(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      const word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) && !notWord.has(word) && !isBoundary.test(word)) {
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
  const isMark = /\p{Mark}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;
  // a leading apostrophe that stands for letters - 'tis, 'em, 'cause
  const elision = /^['’](tis|twas|em|cause|til|bout|round)\b/i;
  const isFullNumber = /^[(+\-]?\d+(th|st|nd|rd)?[)+\-]?$/;
  const openers = { ')': '(', ']': '[', '}': '{' };

  // does this closing bracket close one inside the word, like 'foo(bar)'
  const closesInside = function (chars, start, end) {
    const close = chars[end - 1];
    let depth = 0;
    for (let i = start; i < end - 1; i += 1) {
      if (chars[i] === openers[close]) {
        depth += 1;
      } else if (chars[i] === close) {
        depth -= 1;
      }
    }
    return depth > 0
  };

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    const original = str;
    const trimmed = str.trim();
    let pre = '';
    let post = '';
    const chars = Array.from(str);
    let start = 0;
    let end = chars.length;

    // punctuation-only words, like '<3'
    if (Object.hasOwn(emoticons, trimmed)) {
      return { str: trimmed, pre, post: ' ' } //not great
    }

    // Locate the first retained code point without shifting the array.
    while (start < end) {
      const c = chars[start];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        break//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(trimmed)) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // keep an elided apostrophe - 'tis
      if ((c === "'" || c === '’') && elision.test(chars.slice(start).join(''))) {
        break//keep it
      }
      // punctuation
      start++;
    }

    // Locate the last retained code point.
    while (end > start) {
      const c = chars[end - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        break//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // Keep marks attached to letters, but not variation selectors after symbols.
      if (isMark.test(c)) {
        let base = end - 2;
        while (base >= start && isMark.test(chars[base])) {
          base--;
        }
        if (base >= start && isLetter.test(chars[base])) {
          break
        }
        end = base + 1;
        continue
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original)) {
        break//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original)) {
        break//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(trimmed)) {
        break//done
      }
      if (Object.hasOwn(openers, c) && closesInside(chars, start, end)) {
        break//keep it
      }
      // punctuation
      end--;
    }
    pre = chars.slice(0, start).join('');
    post = chars.slice(end).join('');
    str = chars.slice(start, end).join('');
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      let last = original.length;
      while (last > 0 && original[last - 1] === ' ') last--;
      post = original.slice(last);
      str = original.slice(0, last);
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
    str ||= '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  // Inspect the trailing run once, including when punctuation occurs internally.
  const trimPunctuation = (str, punctuation) => {
    let end = str.length;
    while (end > 0 && punctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str ||= '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
    //punctuation
    str = trimPunctuation(str, /[,;.!?]/);
    //coerce Unicode ellipses
    str = str.replaceAll('…', '...');
    //en-dash
    str = str.replaceAll('–', '-');
    //strip leading & trailing grammatical punctuation
    if (!/^[:;]/.test(str)) {
      str = trimPunctuation(str, /[",.!:;?)]/);
      str = str.replace(/^['’"(]+/g, '');
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
  const acronyms = [
    /^([A-Z]\.)+[A-Z]?,?$/, //like N.D.A
    /^([a-z]\.)+[a-z]\.?$/, //like c.e.o
    /^[A-Z]\.,?$/, //like 'F.'
    /^[A-Z]{2,}('s|,)?$/, //like NDA
  ];

  const isAcronym$2 = str => acronyms.some(re => re.test(str));

  const doAcronym = function (str) {
    if (isAcronym$2(str)) {
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
  const parse$1 = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input ||= '';
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

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const hasPeriod$1 = /\. *$/;
  const leadInit = /^\p{Lu}\. $/u; // "W. Kensington"
  // an initial in any alphabet - 'А. С. Пушкин'
  const isInitial = /[ .]\p{Lu}\. *$/u;

  /** does this look like a sentence? - str can be the end of it, if foundLetter is given */
  const isSentence = function (str, abbrevs, foundLetter = hasLetter.test(str)) {
    // must have a letter
    if (foundLetter === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) || isInitial.test(str)) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str)) {
      return false
    }
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.' (and not mr?)
    if (Object.hasOwn(abbrevs, lastWord) && hasPeriod$1.test(str)) {
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
        isSentence,
        splitTerms: splitWords,
        splitWhitespace: parseTerm,
        fromString: parse$1,
      },
    },
  };

  const aliases$1 = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };

  // prob=probably, pron=pronunciation, gal=gallon, fig=figure, lat/lng=latitude/longitude,
  // vol=volume, fm (not am), def=definition, plz=please, ea=each, sec=second, pref=preface,
  // pl=plural, pp=pages, qt=quarter, fr=french, nee=given name at birth, ss=ship or sections,
  // ver=version, fem/masc, eng=engineering/english, adj/vb/rb/inf=grammar, situ/vivo/vitro=in situ..
  // wr=world record
  var misc$4 = toList(`
approx
apt
bc
cyn
eg
esp
est
etc
ex
exp
prob
pron
gal
min
pseud
fig
jd
lat
lng
vol
fm
def
misc
plz
ea
ps
sec
pt
pref
pl
pp
qt
fr
sq
nee
ss
tel
temp
vet
ver
fem
masc
eng
adj
vb
rb
inf
situ
vivo
vitro
wr
`);

  // (not miss, misses)
  var honorifics$1 = toList(`
adj
adm
adv
asst
atty
bldg
brig
capt
cmdr
comdr
cpl
det
dr
esq
gen
gov
hon
jr
llb
lt
maj
messrs
mlle
mme
mr
mrs
ms
mstr
phd
prof
pvt
rep
reps
res
rev
sen
sens
sfc
sgt
sir
sr
supt
surg
`);

  var months$1 = toList(`
jan
feb
mar
apr
jun
jul
aug
sep
sept
oct
nov
dec
`);

  var nouns$4 = toList(`
ad
al
arc
ba
bl
ca
cca
col
corp
ft
fy
ie
lit
ma
md
pd
tce
`);

  var organizations = toList(`
dept
univ
assn
bros
inc
ltd
co
`);

  // streets, then states/provinces (not ct)
  var places = toList(`
rd
st
dist
mt
ave
blvd
cl
cres
hwy
ariz
cal
calif
colo
conn
fla
fl
ga
ida
ia
kan
kans
minn
neb
nebr
okla
penna
penn
pa
dak
tenn
tex
ut
vt
va
wis
wisc
wy
wyo
usafa
alta
ont
que
sask
`);

  // units that are abbreviations too (not ft, gb, pa - ambiguous)
  // dm=decimeter, hr/hrs=hour, dg/cg/mg/µg=grams, lb=pound, oz=ounce, hz=hertz,
  // mps=meters per second, kmph=kilometers per hour, kb/mb/tb/yb=bytes, lx=lux, lm=lumen
  var units = toList(`
dl
ml
gal
qt
pt
tbl
tsp
tbsp
km
dm
cm
mm
mi
td
hr
hrs
kg
hg
dg
cg
mg
µg
lb
oz
sq ft
hz
mps
mph
kmph
kb
mb
tb
lx
lm
fl oz
yb
`);

  // add our abbreviation list to our lexicon
  const list = [
    [misc$4],
    [units, 'Unit'],
    [nouns$4, 'Noun'],
    [honorifics$1, 'Honorific'],
    [months$1, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  const abbreviations$1 = {};
  // add them to a future lexicon
  const lexicon$2 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations$1[w] = true;
      // future-lexicon
      lexicon$2[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$2[w] = [lexicon$2[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history', 'out-lived', 'ex-wife'
  // (not counter, mid, non, over, post, semi, super, ultra, under, whole)
  var prefixes$3 = toHash(toList(`
anti
bi
co
contra
de
extra
infra
inter
intra
macro
micro
mis
mono
multi
peri
pre
pro
proto
pseudo
re
sub
supra
trans
tri
un
out
ex
`));

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'  (not fold)
  var suffixes$3 = toHash(toList(`
like
ish
less
able
elect
type
designate
`));

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
  // fullwidth ascii - 'Ｈｅｌｌｏ ２０２４' to 'Hello 2024'
  for (let i = 0x21; i <= 0x7E; i += 1) {
    unicode$1[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
  }

  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7Bpunctuation%7D

  // zero-width chars
  const zeroWidth = '\u200B\u200C\u200D\uFEFF';

  // punctuation to keep at start of word - #hastag, @atmention, underscore
  // (not +4, -4, .4)
  const prePunctuation = toHash(('#@_°' + zeroWidth).split(''));

  // punctuation to keep at end of word - 88%, underscore, degrees/italian ordinal
  const postPunctuation = toHash(('%_°' + zeroWidth).split(''));

  const emoticons = toHash('<3 </3 <\\3 :^P :^p :^O :^3'.split(' '));

  var model$5 = {
    one: {
      aliases: aliases$1,
      abbreviations: abbreviations$1,
      prefixes: prefixes$3,
      suffixes: suffixes$3,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$2, //give this one forward
      unicode: unicode$1,
      emoticons
    },
  };

  const hasSlash$1 = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    const str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (Object.hasOwn(aliases, str)) {
      term.alias ||= [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash$1.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      const arr = str.split(hasSlash$1);
      // don't split urls and things
      if (arr.length <= 3) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias ||= [];
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
    const counts = Object.create(null);
    eachTerm(docs, term => {
      const word = term.machine || term.normal;
      counts[word] ??= 0;
      counts[word] += 1;
    });
    // add counts on each term
    eachTerm(docs, term => {
      term.freq = counts[term.machine || term.normal];
    });
  };

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    //start from the actual-top
    eachTerm(view.document, term => {
      term.offset = {
        index: index,
        start: elapsed + term.pre.length,
        length: term.text.length,
      };
      elapsed += term.pre.length + term.text.length + term.post.length;
      index += 1;
    });
  };

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    eachTerm(view.document, (term, terms, t, n) => {
      term.index = [n, t];
    });
  };

  const wordCount = function (view) {
    let n = 0;
    eachTerm(view.docs, term => {
      //skip implicit words
      if (term.normal !== '') {
        n += 1;
        term.wordCount = n;
      }
    });
  };

  // cheat-method for a quick loop
  const termLoop = (view, fn) => eachTerm(view.docs, term => fn(term, view.world));

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
    const lastTerm = docs.at(-1)?.at(-1);
    // if we've already put whitespace, end.
    if (!lastTerm || lastTerm.post) {
      return
    }
    // if we found something
    if (Object.hasOwn(prefixes, lastTerm.normal)) {
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
    const term = docs.at(-1)?.at(-1);
    if (term?.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$c = function (View) {
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
        if (opts.safe && Object.hasOwn(world.model.one.lexicon, prefix)) {
          continue
        }
        // does it already exist?
        if (Object.hasOwn(existing, prefix)) {
          collisions.push(prefix);
          continue
        }
        if (Object.hasOwn(index, prefix)) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = { ...existing, ...index };
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  const defaults$2 = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = { ...defaults$2, ...opts };
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (Object.hasOwn(model.one.typeahead, str)) {
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
    api: api$c,
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
  nlp.plugin(plugin$1); //~6kb
  nlp.extend(tokenize); //7kb
  nlp.extend(freeze); //
  nlp.plugin(cache$3); //~1kb
  nlp.extend(lookup$1); //7kb
  nlp.extend(typeahead); //1kb
  nlp.extend(lexicon$3); //1kb
  nlp.extend(sweep); //1kb

  const getWords = function (net) {
    return Object.keys(net.hooks).filter(w => !w.startsWith('#') && !w.startsWith('%'))
  };

  const maybeMatch = function (doc, net) {
    // must have *atleast* one of these words
    const words = getWords(net);
    if (words.length === 0) {
      return doc
    }
    if (!doc._cache) {
      doc.cache();
    }
    const cache = doc._cache;
    // return sentences that have one of our needed words
    return doc.filter((_m, i) => {
      return words.some(str => cache[i].has(str))
    })
  };

  // tokenize first, then only tag sentences required
  const lazy = function (input, reg) {
    let net = reg;
    if (typeof reg === 'string') {
      net = this.buildNet([{ match: reg }]);
    }
    const doc = this.tokenize(input);
    const m = maybeMatch(doc, net);
    if (m.found) {
      m.compute(['index', 'tagger']);
      return m.match(reg)
    }
    return doc.none()
  };

  var lazy$1 = {
    lib: {
      lazy,
    },
  };

  // Preferred alias identifiers holding canonical tag names.
  // NN is the umbrella noun tag; Sing is specifically singular.
  const NN = 'Noun';
  const Sing = 'Singular';
  const Plur = 'Plural';
  const Prop = 'ProperNoun';
  const Pron = 'Pronoun';

  const Adj = 'Adjective';
  const Comp = 'Comparative';
  const Adv = 'Adverb';
  const Det = 'Determiner';

  const Vb = 'Verb';
  const Inf = 'Infinitive';
  const Past = 'PastTense';
  const Ger = 'Gerund';
  const Pres = 'PresentTense';
  const Fut = 'FutureTense';

  const Cop = 'Copula';
  const Phrasal = 'PhrasalVerb';
  const Conj = 'Conjunction';
  const Prep = 'Preposition';
  const Expr = 'Expression';
  const QW = 'QuestionWord';

  const Pers = 'Person';
  const Place = 'Place';
  const Org = 'Organization';
  const First = 'FirstName';
  const Last = 'LastName';
  const MaleName = 'MaleName';
  const FemaleName = 'FemaleName';
  const Uncountable = 'Uncountable';
  const SportsTeam = 'SportsTeam';
  const Country = 'Country';
  const City = 'City';
  const Region = 'Region';

  const Val = 'Value';
  const Card = 'Cardinal';
  const Ord = 'Ordinal';
  const TxtNum = 'TextValue';
  const Numeric = 'NumericValue';
  const RomanNumeral = 'RomanNumeral';
  const Frac = 'Fraction';

  const Date = 'Date';
  const WeekDay = 'WeekDay';
  const Year = 'Year';
  const FinancialQuarter = 'FinancialQuarter';
  const Season = 'Season';
  const Time = 'Time';
  const Timezone = 'Timezone';

  const Connector = 'Connector';
  const Abbr = 'Abbreviation';
  const Acronym = 'Acronym';
  const HashTag = 'HashTag';
  const AtMention = 'AtMention';

  const Emoji = 'Emoji';
  const Emoticon = 'Emoticon';
  const SlashedTerm = 'SlashedTerm';
  const Email = 'Email';
  const PhoneNumber = 'PhoneNumber';
  const Url = 'Url';

  const entity = [Pers, Place, Org];

  var nouns$3 = {
    Noun: {
      aliases: [null, 'NN'],
      not: [Vb, Adj, Adv, Val, Det],
    },
    Singular: {
      aliases: [null, 'Sing', 'SG', 'NN1'],
      is: NN,
      not: [Plur, Uncountable],
    },
    // 'Canada'
    ProperNoun: {
      aliases: ['Prop', 'NNP', 'PROPN', 'NP0'],
      is: NN,
    },
    Person: {
      aliases: [null, 'Pers'],
      is: Sing,
      also: [Prop],
      not: [Place, Org, Date],
    },
    FirstName: {
      aliases: [null, 'First'],
      is: Pers,
    },
    MaleName: {
      is: First,
      not: [FemaleName, Last],
    },
    FemaleName: {
      is: First,
      not: [MaleName, Last],
    },
    LastName: {
      aliases: [null, 'Last'],
      is: Pers,
      not: [First],
    },
    // 'dr.'
    Honorific: {
      aliases: ['Hon'],
      is: Pers,
      not: [First, Last, Val],
    },
    Place: {
      is: Sing,
      not: [Pers, Org],
    },
    Country: {
      is: Place,
      also: [Prop],
      not: [City],
    },
    City: {
      is: Place,
      also: [Prop],
      not: [Country],
    },
    // 'california'
    Region: {
      is: Place,
      also: [Prop],
    },
    Address: {
      aliases: ['Addr'],
      // is: 'Place',
    },
    Organization: {
      aliases: ['Org'],
      is: Prop,
      not: [Pers, Place],
    },
    SportsTeam: {
      aliases: [null, 'Team'],
      is: Org,
    },
    School: {
      is: Org,
    },
    Company: {
      is: Org,
    },
    Plural: {
      aliases: [null, 'Plur', 'NNS', 'PL', 'NN2'],
      is: NN,
      not: [Sing, Uncountable],
    },
    // 'gravity'
    Uncountable: {
      is: NN,
    },
    // 'it'
    Pronoun: {
      aliases: [null, 'Pron', 'PRP', 'PRON'],
      is: NN,
      not: entity,
    },
    // 'swimmer'
    Actor: {
      is: NN,
      not: [Place, Org],
    },
    // walking
    Activity: {
      is: NN,
      not: [Pers, Place],
    },
    // kilometres
    Unit: {
      is: NN,
      not: entity,
    },
    // canadian
    Demonym: {
      aliases: [null, 'Dem'],
      is: NN,
      also: [Prop],
      not: entity,
    },
    // [spencer's] hat
    Possessive: {
      aliases: ['Poss'],
      is: NN,
    },
    // 'yourself'
    Reflexive: {
      aliases: [null, 'Refl'],
      is: Pron,
    },
  };

  var verbs$3 = {
    Verb: {
      aliases: ['Vb', 'V', 'VB'],
      not: [NN, Adj, Adv, Val, Expr],
    },
    // 'he [walks]'
    PresentTense: {
      aliases: ['Pres', 'PRS'],
      is: Vb,
      not: [Past, Fut],
    },
    // 'will [walk]'
    Infinitive: {
      aliases: ['Inf', 'VVI'],
      is: Pres,
      not: [Ger],
    },
    // '[walk] now!'
    Imperative: {
      aliases: ['Imp'],
      is: Vb,
      not: [Past, Ger, Cop],
    },
    // walking
    Gerund: {
      aliases: ['Ger', 'VBG'],
      is: Pres,
      not: [Cop],
    },
    // walked
    PastTense: {
      aliases: ['Past', 'VBD', 'PST'],
      is: Vb,
      not: [Pres, Ger, Fut],
    },
    // will walk
    FutureTense: {
      aliases: ['Fut'],
      is: Vb,
      not: [Pres, Past],
    },
    // is/was
    Copula: {
      aliases: [null, 'Cop'],
      is: Vb,
    },
    // '[could] walk'
    Modal: {
      aliases: [null, 'Mod', 'MD'],
      is: Vb,
      not: [Inf],
    },
    // 'awaken'
    Participle: {
      aliases: [null, 'VBN'],
      is: Past,
    },
    // '[will have had] walked'
    Auxiliary: {
      aliases: ['Aux'],
      is: Vb,
      not: [Past, Pres, Ger, Conj],
    },
    // 'walk out'
    PhrasalVerb: {
      aliases: ['Phrasal', 'PhrV'],
      is: Vb,
    },
    // 'walk [out]'
    Particle: {
      aliases: [null, 'RP'],
      is: Phrasal,
      not: [Past, Pres, Cop, Ger],
    },
    // 'walked by'
    Passive: {
      aliases: [null, 'Pass'],
      is: Vb,
    },
  };

  // Written format is independent of quantity types such as Fraction or Money.
  var values$2 = {
    Value: {
      aliases: ['Val', 'Num'],
      not: [Vb, Adj, Adv],
    },
    Ordinal: {
      aliases: [null, 'Ord'],
      is: Val,
      not: [Card],
    },
    Cardinal: {
      aliases: [null, 'Card', 'CD'],
      is: Val,
      not: [Ord],
    },
    Fraction: {
      aliases: [null, 'Frac'],
      is: Val,
      not: [NN],
    },
    Multiple: {
      aliases: [null, 'Mult'],
      is: TxtNum,
    },
    RomanNumeral: {
      aliases: [null, 'RomNum'],
      is: Card,
    },
    TextValue: {
      aliases: [null, 'TxtNum'],
      is: Val,
      not: [Numeric, RomanNumeral],
    },
    NumericValue: {
      aliases: ['Numeric'],
      is: Val,
      not: [RomanNumeral],
    },
    Money: {
      is: Card,
    },
    Percent: {
      aliases: [null, 'Perc', 'Pct'],
      is: Val,
    },
  };

  // Calendar/clock components are distinct. Holiday and Duration describe spans
  // that can overlap components or one another (for example, 'Christmas Day').
  // Each exclusion pair is declared once; the tag compiler supplies reciprocity.
  var dates$1 = {
    Date: {
      not: [Vb, Adv, Adj],
    },
    Month: {
      is: Date,
      also: [NN],
      not: [WeekDay, Year, FinancialQuarter, Season, Time, Timezone],
    },
    WeekDay: {
      is: Date,
      also: [NN],
      not: [Year, FinancialQuarter, Season, Time, Timezone],
    },
    Year: {
      is: Date,
      not: [RomanNumeral, FinancialQuarter, Season, Time, Timezone],
    },
    FinancialQuarter: {
      is: Date,
      aliases: [null, 'Quarter'],
      not: [Frac, Season, Time, Timezone],
    },
    // 'easter'
    Holiday: {
      is: Date,
      also: [NN],
    },
    // 'summer'
    Season: {
      is: Date,
      not: [Time, Timezone],
    },
    Timezone: {
      is: Date,
      aliases: [null, 'Tz'],
      also: [NN],
      not: [Prop],
    },
    Time: {
      is: Date,
      not: [AtMention, Timezone],
    },
    // 'months'
    Duration: {
      aliases: [null, 'Dur'],
      is: Date,
      also: [NN],
    },
  };

  const anything = [NN, Vb, Adj, Adv, Val, QW];

  var misc$3 = {
    Adjective: {
      aliases: ['Adj', 'JJ', 'ADJ', 'AJ0'],
      not: [NN, Vb, Adv, Val],
    },
    Comparable: {
      is: Adj,
    },
    Comparative: {
      aliases: [null, 'Comp', 'JJR', 'AJC'],
      is: Adj,
    },
    Superlative: {
      aliases: [null, 'Sup', 'JJS', 'AJS'],
      is: Adj,
      not: [Comp],
    },
    NumberRange: {
      aliases: [null, 'NumRange'],
    },
    Adverb: {
      aliases: ['Adv', 'RB', 'ADV'],
      not: [NN, Vb, Adj, Val],
    },

    Determiner: {
      aliases: ['Det', 'DT', 'DET'],
      not: [NN, Vb, Adj, Adv, QW, Conj], //allow 'a' to be a Determiner/Value
    },
    Connector: {
      not: [NN, Vb, Adj, Adv, QW, Det],
    },
    Conjunction: {
      aliases: ['Conj', 'CC'],
      is: Connector,
      not: anything.concat([Prep]),
    },
    Preposition: {
      aliases: ['Prep', 'IN', 'ADP'],
      is: Connector,
      not: [NN, Vb, Adj, Adv, QW, Det, Conj],
    },
    QuestionWord: {
      aliases: [null, 'QW'],
      not: [Det],
    },
    Currency: {
      is: NN,
    },
    Expression: {
      aliases: ['Expr'],
      not: [NN, Adj, Vb, Adv],
    },
    Abbreviation: {
      aliases: ['Abbr'],
    },
    Url: {
      aliases: [null, 'URL'],
      not: [HashTag, Vb, Adj, Val, SlashedTerm, Email, PhoneNumber, AtMention, Emoji, Emoticon],
    },
    PhoneNumber: {
      not: [HashTag, Vb, Adj, Val, AtMention, Emoji, Emoticon],
    },
    HashTag: {},
    AtMention: {
      is: NN,
      not: [HashTag, Emoji, Emoticon],
    },
    Emoji: {
      not: [HashTag, Vb, Adj, Val, Emoticon],
    },
    Emoticon: {
      not: [HashTag, Vb, Adj, Val, SlashedTerm],
    },
    SlashedTerm: {
      not: [Emoticon, Url, Val]
    },
    Email: {
      not: [HashTag, Vb, Adj, Val, PhoneNumber, AtMention, Emoji, Emoticon],
    },
    Acronym: {
      not: [RomanNumeral, Pron, Date],
    },
    Negative: {
      aliases: [null, 'Neg'],
      not: [NN, Adj, Val, Expr],
    },
    Condition: {
      is: Connector,
      aliases: [null, 'Cond'],
      not: [Vb, Adj, NN, Val],
    },
    // existential 'there'
    There: {
      aliases: [null, 'EX'],
      not: [Vb, Adj, NN, Val, Conj, Prep],
    },
    // 'co-wrote'
    Prefix: {
      not: [Abbr, Acronym, Prop],
    },
    // hard-nosed, bone-headed
    Hyphenated: {},
  };

  const allTags = { ...nouns$3, ...verbs$3, ...values$2, ...dates$1, ...misc$3 };

  // Some finders retain the caller's document; others use the selected view's.
  const select = (View, find, originalDocument = false) => function (n) {
    const matches = typeof find === 'string' ? this.match(find) : find(this);
    const selected = matches.getNth(n);
    return new View(originalDocument ? this.document : selected.document, selected.pointer)
  };

  // name the View subclass, and have .update() return it, sharing the match cache
  const keepClass = (Cls, name) => {
    Cls.prototype.viewType = name;
    Cls.prototype.update = function (pointer) {
      const m = new this.constructor(this.document, pointer);
      m._cache = this._cache;
      m.world = this.world;
      return m
    };
  };

  // the json of each match, plus a parsed form under one key
  const jsonWith = (view, n, key, fn) => {
    const opts = typeof n === 'object' ? n : {};
    return view.getNth(n).map(p => {
      const json = p.toView().json(opts)[0];
      json[key] = fn(p);
      return json
    }, [])
  };

  const find$6 = function (doc) {
    let m = doc.splitAfter('@hasComma');
    m = m.match('#Hon+? #Pers+');
    // Spencer's King - but keep 'John Smith's' together
    const poss = m.match('#Poss+').notIf('(his|her)'); //her majesty ...
    m = m.splitAfter(poss);
    return m
  };

  const parse = function (m) {
    const res = {};
    res.firstName = m.match('#First+');
    res.lastName = m.match('#Last+');
    res.honorific = m.match('#Hon+');

    const last = res.lastName;
    const first = res.firstName;
    if (!first.found || !last.found) {
      // let p = m.clone()
      // assume 'Mr Springer', or 'Vice President Springer' is a last-name
      if (!first.found && !last.found && m.has('^#Hon #Hon? .$')) {
        res.lastName = m.match('.$');
        return res
      }
    }
    return res
  };

  // gendered pronouns
  const she = '(she|her|hers)';

  /*
    Important notice - 
    this method makes many assumptions about gender-identity, in-order to assign grammatical gender.
    it should not be used for any other purposes, other than resolving pronouns in english
  */
  const m = 'male';
  const f = 'female';

  // known gendered honorifics
  const honorifics = {
    mr: m,
    mrs: f,
    miss: f,
    madam: f,

    // british stuff
    king: m,
    queen: f,
    duke: m,
    duchess: f,
    baron: m,
    baroness: f,
    count: m,
    countess: f,
    prince: m,
    princess: f,
    sire: m,
    dame: f,
    lady: f,

    ayatullah: m, //i think?

    congressman: m,
    congresswoman: f,
    'first lady': f,

    // marked as non-binary
    mx: null,
  };

  const predictGender = function (parsed, person) {
    const { firstName, honorific } = parsed;
    // use first-name as signal-signal
    if (firstName.has('#FemaleName')) {
      return f
    }
    if (firstName.has('#MaleName')) {
      return m
    }
    // use honorics as gender-signal
    if (honorific.found) {
      let hon = honorific.text('normal');
      hon = hon.replace(/\./g, ''); //clean it up a bit
      if (Object.hasOwn(honorifics, hon)) {
        return honorifics[hon]
      }
      // her excelency
      if (/^her /.test(hon)) {
        return f
      }
      if (/^his /.test(hon)) {
        return m
      }
    }
    // offer used-pronouns as a signal
    const after = person.after();
    if (!after.has('#Pers') && after.has('#Pron')) {
      const pro = after.match('#Pron');
      // manual use of gender-neutral
      if (pro.has('(they|their)')) {
        return null
      }
      const hasMasc = pro.has('(he|his)');
      const hasFem = pro.has(she);
      if (hasMasc && !hasFem) {
        return m
      }
      if (hasFem && !hasMasc) {
        return f
      }
    }
    return null
  };

  const addMethod = function (View) {
    /**
     *
     */
    class People extends View {
      parse(n) {
        return this.getNth(n).map(parse, [])
      }
      json(n) {
        return jsonWith(this, n, 'person', p => {
          // read the names from a copy, without its possessive - "Biden's" → 'biden'
          const tmp = p.clone();
          tmp.possessives().strip();
          const parsed = parse(tmp);
          return {
            firstName: parsed.firstName.text('normal'),
            lastName: parsed.lastName.text('normal'),
            honorific: parsed.honorific.text('normal'),
            presumed_gender: predictGender(parsed, p),
          }
        })
      }
      // used for co-reference resolution only
      presumedMale() {
        return this.filter(m => {
          return m.has('(#MaleName|mr|mister|sr|jr|king|pope|prince|sir)')//todo configure these in .world
        })
      }
      presumedFemale() {
        return this.filter(m => {
          return m.has('(#FemaleName|mrs|miss|queen|princess|madam)')
        })
      }
    }
    keepClass(People, 'People');

    View.prototype.people = select(People, find$6, true);
  };

  const find$5 = function (doc) {
    let m = doc.match('(#Place|#Address)+');

    // split all commas except for 'paris, france'
    let splits = m.match('@hasComma');
    splits = splits.filter(c => {
      // split 'europe, china'
      if (c.has('(asia|africa|europe|america)$')) {
        return true
      }
      // don't split 'paris, france'
      if (c.has('(#City|#Region|#Prop)$') && c.after('^(#Country|#Region)').found) {
        return false
      }
      return true
    });
    m = m.splitAfter(splits);
    return m
  };

  //combine them with .topics() method
  const find$4 = function (n) {
    // builds without the chunker have no .clauses()
    const r = this.clauses ? this.clauses() : this;
    // Find entities and acronyms without duplicating acronyms inside entities.
    let m = r.people();
    m = m.concat(r.places());
    m = m.concat(r.organizations());
    m = m.concat(r.match('#Acronym').ifNo(m));
    m = m.not('(someone|man|woman|mother|brother|sister|father)');
    //return them to normal ordering
    m = m.sort('seq');
    // m = m.unique()
    m = m.getNth(n);
    return m
  };

  const api$b = function (View) {
    View.prototype.topics = find$4;
  };

  const api$a = function (View) {
    addMethod(View);

    View.prototype.places = function (n) {
      const m = find$5(this);
      return m.getNth(n)
    };
    View.prototype.organizations = function (n) {
      const m = this.match('#Org+');
      return m.getNth(n)
    };
    api$b(View);
  };
  var topics = { api: api$a };

  // key order is the order they are redacted in
  const defaults$1 = {
    people: true,
    places: true,
    organizations: true,
    emails: true,
    money: true,
    percentages: true,
    fractions: true,
    phoneNumbers: true,
    atMentions: true,
    acronyms: true,
    urls: true,
    // off by default
    properNouns: false,
    dates: false,
    numbers: false,
    pronouns: false,
  };

  // remove these specific tags when redacting, which may leak information
  const hideTags = {
    people: [MaleName, FemaleName, First, Last],
    places: [City, 'State', Country, Region],
    organizations: [SportsTeam, 'Company', 'School'],
  };
  hideTags.pronouns = [...hideTags.people, ...hideTags.places, ...hideTags.organizations];

  // replace text with blockStr but keep tags
  const redactMatch = function (m, blockStr, keep = true) {
    m = m.notIf('#Redacted');
    m.replaceWith(blockStr, keep);
    m.tag('Redacted');
    return m
  };

  const redact = function (opts = {}, blockStr = '██████████', keep = true) {
    opts = { ...defaults$1, ...opts };
    // each key is also the View method that finds them
    Object.keys(defaults$1).forEach(k => {
      // skip finders that this build or language does not have
      if (opts[k] !== false && this[k]) {
        const m = redactMatch(this[k](), blockStr, keep);
        if (hideTags[k]) {
          m.unTag(hideTags[k]);
        }
      }
    });
    return this
  };

  const plugin = {
    model: {
      one: {
        tagSet: {
          Redacted: true
        }
      }
    },
    api: function (View) {
      View.prototype.redact = redact;
    }
  };

  // remove a regex match from the text of each term
  const stripper = reg => view => {
    eachTerm(view.docs, term => {
      term.text = term.text.replace(reg, '');
      term.normal = term.normal.replace(reg, '');
    });
    return view
  };

  const strip$3 = stripper(/\./g);

  const api$9 = function (View) {

    class Acronyms extends View {
      strip() {
        return strip$3(this)
      }
      addPeriods() {
        strip$3(this);
        eachTerm(this.docs, term => {
          // Reuse the sentence period so strip() still preserves punctuation.
          const ending = term.post.startsWith('.') ? '' : '.';
          term.text = term.text.split('').join('.') + ending;
          term.normal = term.normal.split('').join('.') + ending;
        });
        return this
      }
    }
    Acronyms.prototype.viewType = 'Acronyms';

    View.prototype.acronyms = select(Acronyms, '#Acronym');
  };

  // select spans wrapped by paired punctuation held in term.pre / term.post
  const findPairs = (hasOpen, findEnd) => doc => {
    const ptrs = [];
    doc.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const term = terms[i];
        if (term.pre && hasOpen.test(term.pre)) {
          const end = findEnd(terms, i);
          if (end !== null) {
            const [n, start] = terms[i].index;
            // i and end are relative to this view, but start is not
            ptrs.push([n, start, start + end - i + 1, terms[i].id]);
            i = end;
          }
        }
      }
    });
    return doc.update(ptrs)
  };

  // remove the opening and closing punctuation from each span
  const stripPairs = (hasOpen, hasClosed) => m => {
    m.docs.forEach(terms => {
      terms[0].pre = terms[0].pre.replace(hasOpen, '');
      const last = terms[terms.length - 1];
      last.post = last.post.replace(hasClosed, '');
    });
    return m
  };

  const hasOpen$1 = /\(/;
  const hasClosed$1 = /\)/;

  const findEnd$1 = function (terms, i) {
    for (; i < terms.length; i += 1) {
      if (terms[i].post && hasClosed$1.test(terms[i].post)) {
        return i
      }
    }
    return null
  };

  const find$3 = findPairs(hasOpen$1, findEnd$1);
  const strip$2 = stripPairs(hasOpen$1, hasClosed$1);

  const api$8 = function (View) {
    class Parentheses extends View {
      strip() {
        return strip$2(this)
      }
    }
    Parentheses.prototype.viewType = 'Parentheses';

    View.prototype.parentheses = select(Parentheses, find$3);
  };

  const stripS = stripper(/['’]s$/);
  const leadApostrophe = /^['’]/;

  // spencer's, spencer’s - and the flanders', whose apostrophe is in .post
  const strip$1 = function (view) {
    stripS(view);
    eachTerm(view.docs, t => {
      if (t.text.endsWith('s') && leadApostrophe.test(t.post)) {
        t.post = t.post.replace(leadApostrophe, '');
      }
    });
    return view
  };

  // #Possessive is decided upstream, in steps - the list is in 2-two/contraction-two/compute/index.js
  const find$2 = function (doc) {
    let m = doc.match('#Poss+');
    // expand it to include 'john smith's'
    if (m.has('#Pers')) {
      m = m.growLeft('#Pers+');
    }
    if (m.has('#Place')) {
      m = m.growLeft('#Place+');
    }
    if (m.has('#Org')) {
      m = m.growLeft('#Org+');
    }
    return m
  };


  const api$7 = function (View) {

    class Possessives extends View {
      strip() {
        return strip$1(this)
      }
    }
    Possessives.prototype.viewType = 'Possessives';

    View.prototype.possessives = select(Possessives, find$2);
  };

  /* eslint-disable regexp/no-dupe-characters-character-class */

  const pairs = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes' «, »
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    // Prime 'non quotation'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    // Prime 'quotation' variation
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
  };

  const hasOpen = RegExp('[' + Object.keys(pairs).join('') + ']');
  const hasClosed = RegExp('[' + Object.values(pairs).join('') + ']');

  const findEnd = function (terms, i) {
    const have = terms[i].pre.match(hasOpen)[0] || '';
    if (!have || !pairs[have]) {
      return null
    }
    const want = pairs[have];
    for (; i < terms.length; i += 1) {
      if (terms[i].post && terms[i].post.match(want)) {
        return i
      }
    }
    return null
  };

  const find$1 = findPairs(hasOpen, findEnd);
  const strip = stripPairs(hasOpen, hasClosed);

  const api$6 = function (View) {

    class Quotations extends View {
      text(fmt) {
        if (!fmt || fmt === 'text') {
          return super.text({ keepEndPunct: true })
        }
        if (typeof fmt === 'object') {
          return super.text({ keepEndPunct: true, ...fmt })
        }
        return super.text(fmt)
      }
      strip() {
        strip(this);
      }
    }
    Quotations.prototype.viewType = 'Quotations';

    View.prototype.quotations = select(Quotations, find$1);
  };

  /** return anything tagged as a phone number */
  const phoneNumbers = function (n) {
    let m = this.splitAfter('@hasComma');
    m = m.match('#PhoneNumber+');
    m = m.getNth(n);
    return m
  };

  /** return anything tagged as an address */
  const addresses = function (n) {
    let m = this.match('#Address+');
    m = m.getNth(n);
    return m
  };

  // setup easy helper methods
  const selections = [
    ['hyphenated', '@hasHyphen .'],
    ['hashTags', '#HashTag'],
    ['emails', '#Email'],
    ['emoji', '#Emoji'],
    ['emoticons', '#Emoticon'],
    ['atMentions', '#AtMention'],
    ['urls', '#Url'],
    // ['pronouns', '#Pronoun'],
    ['conjunctions', '#Conj'],
    ['prepositions', '#Prep'],
    ['abbreviations', '#Abbr'],
    ['honorifics', '#Hon'],
  ];

  // aliases
  const aliases = [
    ['emojis', 'emoji'],
    ['atmentions', 'atMentions'],
  ];

  const addMethods = function (View) {
    // add a list of new helper methods
    selections.forEach(a => {
      View.prototype[a[0]] = function (n) {
        const m = this.match(a[1]);
        return typeof n === 'number' ? m.get(n) : m
      };
    });
    View.prototype.phoneNumbers = phoneNumbers;
    View.prototype.addresses = addresses;
    // add aliases
    aliases.forEach(a => {
      View.prototype[a[0]] = View.prototype[a[1]];
    });
  };

  const hasSlash = /\//;

  const api$5 = function (View) {

    class Slashes extends View {
      split() {
        return this.map((m) => {
          const str = m.text();
          const arr = str.split(hasSlash);
          m = m.replaceWith(arr.join(' '));
          return m.growRight('(' + arr.join('|') + ')+')
        })
      }
    }
    Slashes.prototype.viewType = 'Slashes';

    View.prototype.slashes = select(Slashes, '#SlashedTerm');
  };

  var misc$2 = {
    api: function (View) {
      api$9(View);
      api$8(View);
      api$7(View);
      api$6(View);
      addMethods(View);
      api$5(View);
    }
  };

  // a comma, but not a clause break
  const notClause = [
    '@hasComma @hasComma', //fun, cool...
    '(#City && @hasComma) #Country', //'toronto, canada'
    '(#WeekDay && @hasComma) #Date', //'tuesday, march 2nd'
    '(#Date+ && @hasComma) #Val', //'july 6, 1992'
    '(#Adj && @hasComma) #Adj', //nice, pretty
  ];

  const byComma = function (doc, rules) {
    const skip = notClause.concat(rules.notClause || []);
    let commas = doc.match('@hasComma');
    // remove any non-clause uses
    commas = commas.filter(m => {
      // don't split the first word
      if (m.growLeft('.').wordCount() === 1) {
        return false
      }
      // don't split the last word
      if (m.growRight('. .').wordCount() === 1) {
        return false
      }
      const more = m.grow('.'); // grow by 1 word in either direction
      return !skip.some(str => more.has(str))
    });
    return doc.splitAfter(commas)
  };

  // should we split-out a clause (in brackets)?
  const splitParentheses = function (doc) {
    // from the misc plugin
    if (!doc.parentheses) {
      return doc
    }
    let matches = doc.parentheses();
    matches = matches.filter(m => {
      return m.wordCount() >= 3 && m.has('#Verb') && m.has('#NN')
    });
    return doc.splitOn(matches)
  };

  // split-out a long quotion, but not 'inline quotes'.
  const splitQuotes = function (doc) {
    // from the misc plugin
    if (!doc.quotations) {
      return doc
    }
    let matches = doc.quotations();
    matches = matches.filter(m => {
      return m.wordCount() >= 3 && m.has('#Verb') && m.has('#NN')
    });
    return doc.splitOn(matches)
  };

  const clauses$2 = function (n) {
    let found = this;
    // word-rules, like 'but' and 'until', are in the model
    const rules = this.model.three?.clauses || {};

    found = splitParentheses(found);
    found = splitQuotes(found);

    found = byComma(found, rules);

    found = found.splitAfter('(@hasEllipses|@hasSemicolon|@hasDash|@hasColon)');

    // each language's own rules
    const { splitAfter = [], splitBefore = [], splitBeforeGroup = [] } = rules;
    splitAfter.forEach(str => {
      found = found.splitAfter(str);
    });
    splitBefore.forEach(str => {
      found = found.splitBefore(str);
    });
    splitBeforeGroup.forEach(str => {
      const m = found.match(str, 0);
      if (m.found) {
        found = found.splitBefore(m);
      }
    });

    // // misc clause partitions
    // found = found.splitBefore('as well as .')
    // found = found.splitBefore('such as .')
    // found = found.splitBefore('in addition to .')

    // // semicolons, dashes
    // found = found.splitAfter('@hasSemicolon')
    // found = found.splitAfter('@hasDash')

    // //
    // found = found.splitBefore('which (were|are|will)')

    // // he said [...]
    // found = found.splitAfter('#Noun (said|say|says)')

    // passive voice verb - '.. which was robbed is empty'
    // let passive = found.match('#Noun (which|that) (was|is) #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // //which the boy robbed
    // passive = found.match('#Noun (which|that) the? #Noun+ #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // does there appear to have relative/subordinate clause still?
    // let tooLong = found.filter(d => d.wordCount() > 5 && d.match('#Verb+').length >= 2)
    // if (tooLong.found) {
    //   // and after the ..
    //   found = found.splitBefore('#Conjunction #Preposition')

    //   // let m = tooLong.splitAfter('#Noun .* #Verb .* #Noun+')
    //   // found = found.splitOn(m.eq(0))
    // }
    if (typeof n === 'number') {
      found = found.get(n);
    }
    return found
  };

  const api$4 = function (View) {
    View.prototype.clauses = clauses$2;
  };

  // .clauses() with only its punctuation rules - a language adds its own model.three.clauses
  var clauses$1 = { api: api$4 };

  // a leading '-', or the real minus-sign, or one after a symbol - '$-5'
  const minus = /^\s*[-−]|\P{L}[-−]$/u;
  const signs = /[-−]/g;
  // any currency symbol - '$', '€', '₽'
  const currency = /\p{Sc}/u;

  // a decimal-comma, unless the language's model says otherwise.
  // `ordinal` is regex-source for the ending of a numeric ordinal - '[ºª°]'
  // `loose` reads a lone decimal-mark before three digits as thousands - '7,938'
  // `percent` and `currencies` are the words that follow a number - 'per cento', 'euro'
  const defaults = { decimal: ',', group: '.', ordinal: '', loose: false, percent: [], currencies: [] };

  // the mark that groups thousands can't also be the decimal
  const groupMark = function (group, decimal) {
    if (group !== decimal) {
      return group
    }
    return decimal === '.' ? ',' : '.'
  };

  // '1234567' → '1.234.567'
  const addGroups = function (int, mark) {
    const out = [];
    for (let end = int.length; end > 0; end -= 3) {
      out.unshift(int.slice(Math.max(end - 3, 0), end));
    }
    return out.join(mark)
  };

  // floating-point noise - 0.1 + 0.2. a whole number is already exact,
  // and rounding it to 15 digits would corrupt a 16-digit one
  const tidy$1 = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)));

  // compile each ordinal-ending once
  const cache$2 = {};
  const isOrdinal$1 = function (suffix, src) {
    if (!src || !suffix) {
      return false
    }
    cache$2[src] = cache$2[src] || new RegExp('^(?:' + src + ')$', 'iu');
    return cache$2[src].test(suffix)
  };

  // digits, and any mark that sits between two of them - '1.234,56', '1 000', "1'000"
  const body = /^[0-9](?:[0-9]|[.,'’\s](?=[0-9]))*/;
  const count = (str, char) => str.split(char).length - 1;

  // which mark is the decimal, and which one groups the thousands?
  // two different marks, or a repeated one, say so themselves - '1.234,56', '1.234.567'
  // a lone '.' or ',' is the only real guess, and the locale makes it
  const findMarks = function (str, locale) {
    const dots = count(str, '.');
    const commas = count(str, ',');
    // a space or an apostrophe is only ever a thousands-group
    const soft = str.match(/[ ']/);
    let decimal = null;
    let group = soft ? soft[0] : null;
    if (dots && commas) {
      // the last one is the decimal
      decimal = str.lastIndexOf(',') > str.lastIndexOf('.') ? ',' : '.';
      group = decimal === ',' ? '.' : ',';
      if (soft) {
        return null
      }
    } else if (dots + commas > 1) {
      group = dots ? '.' : ',';
      if (soft) {
        return null
      }
    } else if (dots + commas === 1) {
      const mark = dots ? '.' : ',';
      const isGroup = /^[1-9][0-9]{0,2}[.,][0-9]{3}$/.test(str);
      const isDecimal = mark === locale.decimal && !(locale.loose && isGroup);
      if (soft || isDecimal || !isGroup) {
        decimal = mark; // '3,5', and '3.5' anywhere
      } else {
        group = mark; // '1.000' where the decimal is a comma
      }
    }
    return { decimal, group }
  };

  // '1.234,56' → 1234.56, or null for something that isn't one number - '1.2.3'
  const toNumber$1 = function (str, marks) {
    let int = str;
    let fraction = '';
    if (marks.decimal) {
      const parts = str.split(marks.decimal);
      if (parts.length !== 2) {
        return null
      }
      int = parts[0];
      fraction = parts[1];
    }
    // thousands come in threes
    if (marks.group) {
      const groups = int.split(marks.group);
      if (groups[0].length > 3 || groups.slice(1).some(s => s.length !== 3)) {
        return null
      }
      int = groups.join('');
    }
    if (!/^[0-9]+$/.test(int) || !/^[0-9]*$/.test(fraction)) {
      return null
    }
    return Number(fraction ? int + '.' + fraction : int)
  };

  /**
   * pull-apart a number written in digits - '-5', '1.234,56 €', '3,5%', '2ª'
   * `pre` is any punctuation that the tokenizer left in front of it - '(-'
   * `locale` is model.two.europeanNumbers
   */
  const read = function (str, pre = '', locale = defaults) {
    const res = {
      num: null,
      prefix: '',
      suffix: '',
      hasComma: false,
      decimal: null,
      group: null,
      ordinal: null,
      currency: null,
      isPercent: false,
      isFraction: false,
    };
    str = String(str).trim();
    const begin = str.search(/[0-9]/);
    if (begin === -1) {
      return res
    }
    let prefix = str.slice(0, begin);
    const raw = str.slice(begin).match(body)[0];
    let suffix = str.slice(begin + raw.length);
    // every kind of space, and both kinds of apostrophe
    let digits = raw.replace(/\s/g, ' ').replace(/’/g, "'");
    // a decimal with nothing in front of it - '.5', ',5'
    const lead = prefix.slice(-1);
    if ((lead === '.' || lead === ',') && /^[0-9]+$/.test(digits)) {
      digits = '0' + lead + digits;
      prefix = prefix.slice(0, -1);
    }
    const marks = findMarks(digits, locale);
    let num = marks ? toNumber$1(digits, marks) : null;
    if (num === null) {
      return res
    }
    // a fraction - '1/2'
    const frac = suffix.match(/^\/([0-9]+)$/);
    if (frac && Number(frac[1]) !== 0) {
      num /= Number(frac[1]);
      suffix = '';
      res.isFraction = true;
    }
    // the sign may be hiding in the punctuation - '(-5)'
    // .. on either side of the currency - '-$5', '$-5' - but not 'covid-19'
    if (minus.test(prefix) || /[-−]$/.test(pre)) {
      num *= -1;
    }
    // a numeric ordinal - '2ª', '5-го', '3e'
    if (isOrdinal$1(suffix, locale.ordinal)) {
      res.ordinal = suffix;
      suffix = '';
    }
    res.num = num;
    res.prefix = prefix.replace(signs, '');
    res.suffix = suffix;
    res.decimal = marks.decimal;
    res.group = marks.group;
    res.hasComma = marks.group !== null;
    // remember which space it was - a non-breaking one is put back as one
    if (marks.group === ' ') {
      res.group = raw.match(/\s/)[0];
    }
    const money = [res.prefix, suffix].find(s => currency.test(s));
    res.currency = money ? money.trim() : null;
    res.isPercent = /^\s*[%％]/.test(suffix);
    return res
  };

  /**
   * write a number in digits - 1234.5 → '1.234,5'
   * `how` is the result of read(), so a number goes back the way it was found.
   * thousands are only grouped when `how.hasComma` is set
   */
  const write$1 = function (num, how = {}, locale = defaults) {
    if (typeof num !== 'number' || !isFinite(num)) {
      return ''
    }
    num = tidy$1(num);
    let str = String(Math.abs(num));
    // leave '1e+21' alone
    if (/^[0-9]+(?:\.[0-9]+)?$/.test(str)) {
      let decimal = how.decimal || locale.decimal;
      // '7,938' was grouped with a comma, so its decimal is a period
      if (!how.decimal && how.group === decimal) {
        decimal = groupMark(decimal, decimal);
      }
      const parts = str.split('.');
      let int = parts[0];
      const fraction = parts[1];
      if (how.hasComma) {
        int = addGroups(int, groupMark(how.group || locale.group, decimal));
      }
      str = fraction ? int + decimal + fraction : int;
    }
    // the sign goes ahead of any currency - '-$5'
    const sign = num < 0 ? '-' : '';
    return sign + (how.prefix || '') + str + (how.suffix || '')
  };

  const sign = '[-+−]?';
  // '1.234.567,89', or '1234,5' - either mark, the reader sorts-out which is which
  const digits = "(?:[0-9]{1,3}(?:[.,'’][0-9]{3})+(?:[.,][0-9]+)?|[0-9]+(?:[.,][0-9]+)?)";
  // 'R$', 'US$', '€'
  const symbol$1 = '(?:[a-z]{1,2})?\\p{Sc}';

  const cardinal = ['Cardinal', 'NumericValue'];
  const percent$1 = ['Percent', 'Cardinal', 'NumericValue'];
  const money = ['Money', 'Value'];

  // build them once per language
  const cache$1 = new WeakMap();

  /**
   * tagging rules for numbers written in digits, as [regex, tags, example].
   * test them on the term's text, not its 'normal' - which has lost its commas
   */
  const regexes = function (locale = defaults) {
    if (cache$1.has(locale)) {
      return cache$1.get(locale)
    }
    const reg = str => new RegExp('^' + str + '$', 'iu');
    const out = [
      [reg(sign + symbol$1 + ' ?' + sign + digits + '(?:[kmb]|bn)?\\+?'), money, '€5,30'],
      [reg(sign + digits + ' ?' + symbol$1 + '\\+?'), money, '5,30€'],
      [reg(sign + digits + '\\+?'), cardinal, '1.234,56'],
      [reg(sign + '[.,][0-9]+\\+?'), cardinal, ',5'],
      [reg(sign + digits + ' ?[%％]\\+?'), percent$1, '3,5%'],
      [reg(sign + '[.,][0-9]+[%％]'), percent$1, ',5%'],
    ];
    // '2ª', '5-го', '3e'
    if (locale.ordinal) {
      out.push([reg('[0-9]+(?:' + locale.ordinal + ')'), ['Ordinal', 'NumericValue'], 'ordinal']);
    }
    cache$1.set(locale, out);
    return out
  };

  const reason$1 = 'european-number';
  // '€', '₽', 'R$', 'US$'
  const symbol = /^[a-z]{0,2}\p{Sc}$/iu;
  // only in capitals - 'EUR 5', not 'eur'
  const codes = /^(?:EUR|USD|GBP|CHF|JPY|CAD|AUD|BRL|MXN|RUB|CNY)$/;
  const percent = /^[%％]$/;

  const isValue = term => term.tags.has('Value');
  // nothing but a space between this word and the next - not '5, euro'
  const touches = term => /^\s*$/.test(term.post);

  // do these words come next? - 'per cento'
  const hasPhrase = function (terms, i, words) {
    return words.every((w, o) => terms[i + o] && terms[i + o].normal === w && (o === words.length - 1 || touches(terms[i + o])))
  };

  /**
   * a number takes its meaning from the word beside it - '5,30 €', '50 per cento', 'mille euro'.
   * the number is tagged #Money or #Percent, and the word beside it #Currency or #Unit.
   * the words come from the model - { percent: ['per cento'], currencies: ['euro'] }
   */
  const tagNeighbours = function (terms, view) {
    const { world, model, methods } = view;
    const { setTag, unTag } = methods.one;
    const locale = model.two.europeanNumbers;
    const phrases = (locale.percent || []).map(str => str.split(' '));
    const words = new Set(locale.currencies || []);
    const isCurrency = term => term.tags.has('Currency') || symbol.test(term.text) || words.has(term.normal);
    const isCode = term => symbol.test(term.text) || codes.test(term.text);

    for (let i = 0; i < terms.length; i += 1) {
      if (!isValue(terms[i]) || terms[i].tags.has('Ordinal')) {
        continue
      }
      // the whole number - '1 000', 'trois cent'
      let end = i;
      while (terms[end + 1] && isValue(terms[end + 1]) && touches(terms[end])) {
        end += 1;
      }
      const run = terms.slice(i, end + 1);
      const next = touches(terms[end]) ? terms[end + 1] : null;
      const before = terms[i - 1];
      const phrase = next ? phrases.find(a => hasPhrase(terms, end + 1, a)) : null;
      if (phrase) {
        // 'cento' is not a second number
        const unit = terms.slice(end + 1, end + 1 + phrase.length);
        unTag(unit, 'Value', model.one.tagSet);
        setTag(unit, 'Unit', world, false, reason$1);
        setTag(run, 'Percent', world, false, reason$1);
        end += phrase.length;
      } else if (next && percent.test(next.text)) {
        setTag(run, 'Percent', world, false, reason$1);
        setTag([next], 'Unit', world, false, reason$1);
      } else if (next && (isCurrency(next) || codes.test(next.text))) {
        setTag(run, 'Money', world, false, reason$1);
        setTag([next], 'Currency', world, false, reason$1);
      } else if (before && isCode(before) && touches(before)) {
        // only a symbol goes in front - '€ 5,30', 'CHF 12'
        setTag(run, 'Money', world, false, reason$1);
        setTag([before], 'Currency', world, false, reason$1);
      }
      i = end;
    }
  };

  const reason = 'european-number';
  // leave these to the language's own tagger - '12.05.2020', '15.30', '555-1234'
  // .. and a german ordinal keeps its period outside of the term - '3.'
  const skip = ['Date', 'PhoneNumber', 'NumberRange', 'Ordinal'];

  // tag numbers written in digits, from their raw text - '1.234,56', '3,5%', '5,30€'
  const tagNumbers = function (view) {
    const { world, model, methods } = view;
    const regs = regexes(model.two.europeanNumbers);
    const setTag = methods.one.setTag;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        if (!/[0-9]/.test(term.text) || skip.some(tag => term.tags.has(tag))) {
          return
        }
        const found = regs.find(a => a[0].test(term.text));
        if (found) {
          setTag([term], found[1], world, false, reason);
        }
      });
      // '5,30 €', '50 per cento'
      tagNeighbours(terms, view);
    });
  };

  /**
   * numbers written in digits, with a decimal-comma - '1.234,56', '3,5%', '5,30 €'
   * shared across many languages
   * tags them, and adds a reader and writer:
   *   const { read, write } = doc.methods.two.europeanNumbers
   *   const locale = doc.model.two.europeanNumbers
   *   read('1.234,56', term.pre, locale).num // 1234.56
   *   write(1234.56, { hasComma: true }, locale) // '1.234,56'
   * a language sets its own marks in model.two.europeanNumbers - { group: ' ', ordinal: 'er?' }
   * and its own words - { percent: ['per cento'], currencies: ['euro'] } - for '50 per cento', 'mille euro'
   */
  var europeanNumbers = {
    model: { two: { europeanNumbers: { ...defaults, percent: [], currencies: [] } } },
    methods: { two: { europeanNumbers: { read, write: write$1, regexes } } },
    compute: { europeanNumbers: tagNumbers },
    hooks: ['europeanNumbers'],
  };

  // Generated by scripts/pack/index.js; see data/README.md for source files.
  var properNouns = {
    "ProperNoun": "true¦aIbDc8dalhousHe7f5gosford,h4kirby,landsdowne,m2nis,r1s0wembF;herwood,paldiB;iel,othwe1;cgi0ercedes,issy;ll;intBudsB;airview,lorence,ra0;mpt9nco;lmo,uro;a1h0;arlt6es5risti;rl0talina;et4i0;ng;arb3e0;et1nt0rke0;ley;on;ie;bid,jax",
    "Organization": "true¦0:4Q;1:3Z;a3Vb3Dc2Md2Fe2Af25g1Yh1Ri1Nj1Lk1Jl1Gm13n0Ro0Op0Equ0Dr04sStIuDvAw4xiaomi,y2;amaha,mca,ou2wca;gov,tube;a5e3iki2orld trade organization;leaRpedia;lls fargo,st2;field,inghouse;l2rner bros;greens,l street journal,m1C;an halPerizon,isa,o2;dafone,l2;kswagNvo;b5kip,n3ps,s2;a today,ps;esco,i2;lever,ted nations;er,s; mobile,aco beTd bQe8gi fridays,he 4im hortons,mz,o2witter;shiba,y2;ota,s r us;b3carpen3Mdaily ma1holli0s2who;mashing pumpkins,uprem0;ea2lack eyed peas,yrds;ch boys,tl0;l3n3Us2xas instruments;co,la m1F;efonica,us;aCcBe8iemens,mirnoff,np,o6p5quare0Dt2ubaru;a2eer02;rbuc2to1;ks;eci2Cice gir5;ny,undgard2;en;a3x pisto2;ls;g1Wrs;hool1Sientology;feway,insburys,lesforce,msung;adiohead,b9e5o2yanair;man empire,yal 2;b2dutch she5;ank;a4d 2max,vlon;bu2c2Bhot chili peppers,lobster;ll;ders digest,l madrid;c,s;antas,iznos;a9bs,e6fizer,hilip5i4r2;emier 2udential;leagTo1;nk floyd,zza hut; morrCs;psi3tro2ugeot;bras,china,nas;!co;lantir,n2ypal; 3asonic,da2Q;ld navy,pec,range juli3xf2;am;us;aAb9e8fl,h7i6o2sa,vid5wa;k4minat3tre dame,vart2;is;ing1F;ia;ke,ntendo,ssan,vV;l,s;c,stle,tflix,wsweek;a,c;ndos,s3t2;o,west;a,car,daq;aDeAi7lb,o4tv,y2;spa2;ce;b1nsanto,ody blu0t2;ley cr2or0T;ue;c3t2;as,subisM;helin,rosoft;dica3rcedes benz,talli2;ca;id,re;cs milk,ttel,zda;a presse,e2g,ittle caesars; oreal,novo,x2;is,mark,us;atv,fc,kk,lm,m2odak;art;iffy lube,oy division,pmorgan2sa;! chase;bm,hop,k4n2tv;g,te2;l,rpol;ea;a7e6i4o2sbc,yundai;me dep2nda;ot;tac2zbollah;hi;althYwlett pack1V;lliburton,sbro;eneral 6hq,ithub,l5mb,o2reen day,ucci;ldman sachs,o2;dye2gle;ar;axo smith kline,encoZ;electric,m2;otors;a5bi,c barcelo4da,edex,i3leetwood mac,o2rito lay;rd,xcon;at,fa,restone;na;cebook,nnie mae;bay,sa,u5x2;ecutiveYxon2; m2m2;ob1;!rosceptics;aimler,e6isney,o5u2;nkin donu3pont,ran dur2;an;ts;j,w jon0;a,f lepp17ll,peche mode,r spiegel,stiny's chi2;ld;aObc,entrMhIiGloudflaFnn,o4r2;aigsli8eedence clearwater reviv2ossra1;al;cAinba9l7m3n2ors,stco;ferenceJgressionI;ca4merce3p2;aq; bo0Y;st;dplVg2;ate;se;a c2o chanT;ola;re;a,sco2tigroup;! systems;ev3i2;ck fil a,na daily;r2y;on;al2; committee;d3pital o2rls jr;ne;bury,ill2;ac;aFbc,eCfAl6mw,ni,o2p,rexiteeV;ei4mbardiJston 2;glo2pizza;be;ng;o3ue c2;roW;ckbuster video,omingda2;le; g2g2;oodriM;cht3e ge0rkshire hathaw2;ay;el;cardi,idu,nana republ4s2xt6y6;f,kin robbi2;ns;ic;bYcUdidTerosmith,iSlLmFnheuser busEol,ppleBr7s5u4v3y2;er;is,on;di,todesk;hland o1sociated F;il;b4g3m2;co;os;ys; compu2be0;te2;rs;ch;c,d,erican4t2;!r2;ak; ex2;pre2;ss; 6catel3ta2;ir;! lu2;ce2;nt;jazeera,qae2;da;g,rbnb;as;/dc,ademy of scienc0er,tivision2;! blizz2;ard;es;ba",
    "City": "true¦0:75;1:62;2:6H;3:6K;4:5T;5:5M;a6Ab55c4Kd4Ae46f3Yg3Jh3Bi33j2Yk2Gl24m1Nn1Do1Ap0Xq0Vr0Ps06tSuRvMwExiCyAz6;a8h6ibo,urich;a6e6ongsh0;ng3J;greb,nzibar;ang2e6okohama,unfu;katerin3Jrev0;a6n0R;m5n;arsCeBi7roclCu6;h0xi,zhou;c8n6;d6nipeg,terth4;hoek,sor;hita,klow;l65xford;aw;a9e7i6ladivostok,olgograd;en3lnius;nice,r6;o3sailles;lencia,ncouver,r3ughn;lan bator,rumqi,trecht;aGbilisi,eFheEiCoAr8u6;lsa,nis,r6;in,ku;i6ondh64;este,poli;kyo,msk,ronto,ulo6;n,uT;an6jua3l2Vmisoara,ra3;jin,shui; hague,ssaloniki;gucigalpa,hr0l aviv;briz,i7llinn,mpere,ng6rtu,shk2T;ier,sh0;an,chu1n0pei,yu0;aFeEh9kopje,oweto,t8u6;ra6zhou;baya,t;aten is57ockholm,rasbourg,uttgart;an9e7i6;jiazhua1llo1mla,y0;f52n6;ya1zh5;ghai,tou;attle,oul,v46;cramento,int DlCn6o paulo,pporo,rajevo; 8aa,t6;a 6o domingo;a3fe,m1O;antonio,diego,francisco,j6pedro,salvador;o6u0;se;em,t lake city,z27;louis,peters26;aAe9i7o6;me,stov,t5B;ga,o6yadh;! de janeiro;cife,ims,nnes,ykjavik;bat,ip4leigh,nchi,walpindi;ingdao,u6;ez2ito;aGeFhEiDoAr8u7yong6;ya1;ebla,ya1;a6etoria;gue,to;rt6zn0; 6land,o;au prince,elizabeth,said;ls5raeus,tts28;iladelphia,nom penh,oenix;ki1tah tikva;dua,lerZnaji,ris,t6;na,ras;ak46dessa,msk,r7s6ttawa;aka,lo;an,dos;a8ew6ingbo,ovosibirsk,yc; 6castle;delhi,orleans,taipei;g9irobi,n6ples,shv35tchez,v0;ch7ji1t6;es,o1;a1o1;a7o6p4;ya;no,saki;aFeDiAo7u6;mbai,nich,scat;gadishu,nt7s6;cow,ul;evideo,pellier,real;ami,l7nsk,s6;kolc,sissauga;an,waukee;cca,d6lbourne,mphis,ndoza,ssi3;an,ellin,i3;cau,drBkassar,lAn9r6shhad;aca7ib6rakesh,se2N;or;ibo,y;aus,chGdalay,ila;mo;id;aEeBi9o7u6vUy2;anNcknow,dhia3;n6s angeles;d2g beach;brev2Dege,ma6nz,sb2verpool;!ssol; mans,i6;c6pzig;ester; p7g6hore,n0Es vegas,usanne;os;az,lata;aJharHiDlaipeCoArakow,u8y6;iv,o6;to;ala lump4n6;mi1sh0;hima,lkata,pavog4si6wlo2;ce;da;ev,n7r6;kuk,ov;gst2sha6;sa;k6toum;iv;bIdu3llakurichi,mpala,n7ohsiu1ra6unas,waguchi;chi,j;d6o,p4;ahar,y;a8e7i6ohannesW;lin,n0;ddah,rusalem;ip4k6;arta;bad0mphal,nBrkutVs8taYz6;mir,tapala6;pa;fah0l7tanb6;ul;am30i2I;che2d6;ianap2Nore;aBe8o6yder2X; chi mi6ms,nolulu;nh;f7lsin6rakli2;ki;ei;ifa,lifax,mDn6rbin,va3;g9nover,oi;aGdanFenEhDiQlasgCoAraz,u6;a6jrat;dal7ng6yaquil;zhou;ajara,upe;ld coast,then6;burg;ow;ent;eva,oa;sk;lw8n6za;dhi6gtok;nagar;ay;aisal2Aes,o9r7ukuya6;ma;ankfu6esno;rt;rt6sh0; wor7ale6;za;th;d6indhov5l paso,ss5;in6mont2;bur6;gh;aCe9haka,isp4o8resd5u6;b6esseldorf,nkirk,rb0shanbe;ai,lin;ha,nggu0rtmund;hradTl7nv6troit;er;hi;donghJe7kar,l6mascus,r es salaam,ugavpiZ;i0lV;gu,je2;aKebu,hBleve0Wo6raiova,uritiba;lo8n7penhag5r6;doba,k;akLst0W;gVm6;bo;aCen9i7ongqi1ristchur6;ch;ang m8ca6ttago1;go;g7n6;ai;du,zho1;ng6ttogram;ch9sha,zhou;gliari,iAlga9mayenKn7pe town,r6tanP;acDdiff;berra,c6;un;ry;ro;aXeOhLirmingham,oKrAu6;chareUdapeUenos air8r6s0tu0;g6sa;as;es;aAis7usse6;ls;ba7t6;ol;ne;sil9tisla8zzav6;il6;le;va;ia;gota,st2;op7ubaneshw6;ar;al;iDlAng9r6;g5l6n;in;en;aluru,hazi;fa7grade,o horizon6;te;st;ji1rut;ghdad,kGnAot9r8s7yan n4;ur;el,rah;celo3i,ranquilla;ou;du1g7ja lu6;ka;alo7k6;ok;re;ng;ers6u;field;a06b03ccra,ddis ababa,gartala,hmedYizawl,lTmQnIqaba,rFsCt8uck6;la6;nd;he8l6;an6;ta;ns;h6unci2;dod,gab6;at;li6;ngt2;on;a9c6kaPtwerp;hora7o3;na;ge;h8p6;ol6;is;eim;aravati,m0s6;terd6;am; 8buquerq7eppo,giers,ma6;ty;ue;basrah al qadim6mawsil al jadid6;ah;ab6;ad;la;ba;ra;idj0u dha6;bi;an;lbo7rh6;us;rg",
    "Place": "true¦0:4Y;1:50;2:4A;3:4H;4:3O;5:30;6:4Q;a4Mb3Oc31d2Oe2Ef2Cg22h1Qi1Mjapa2Sk1Il19m0Xn0Po0Lp0Br07sVtPuNvLw9y7;a7ork,yz;kutsk,ngtze;aFeEhitDiBo7upatki,ycombe;king,o7;d7l1I;b3Xs7;i4tock;c0UllowbroEn7;c2Ygh2;by,church;ed0ntw3Os2A;ke8r40t7;erf1f1; is0If43;auxhall,irgin is0Lost7;ok;laanbaatar,pto7xb3M;n,wn;aBeotihuacan,h9ive4Go8ruro,sarskoe selo,u7;lum,zigoot;nto,rquay,tt2S;am3e 7orn3N;bronx,hamptons;hiti,j mahal,u1V;aHcotts bluff,eFfo,hEoCpringBt9u7yd2O;dbury,ez,n7;der05set3K;aff1ock2Vr7;atf1oud;hill,w5;ho,uth7; 1Qam27wold;erbroKopping1G;a7ine;f30t0;int lawrence riv6khalin;ayleigh,ed9i7oc26;chmond,o gran4ver7;bend,fr0Esi4; sea,cliffe,hill;aDeAhx,i7ompeii,utn2;c8ne7tcairn; 2Wc0M;kering,t0;k,lh2mbr8n7rth;n1Pzance;oke;cif3Gpahanaumokuakea,r7;k7then0;si4w5;ak9ld t2Jr8x7;f1ley;ange county,f1inoco;mZw5;eAile,o7;r7tt2V;th7wich; 10am1H;gev,uschwanstein,w7; eng8a7h2markKport;rk;land;aAco,e8i7uc;dt26ll17;adow7kong;lands;chu picchu,gadan,iBlAn9ple8r7;kh2; 1Kw5;hattan,sf2J;ibu,t0vern;dstone,n st7;!re7;et;aBeAgw,hr,i7owlSynd06;n7ttle italy;coln memori7dley;al;asi4w3;kefr9mbeth,n7;ca2Mg7sing;f1ley,t0;ont;azan kremlin,e9itchen6o8rasnoyar7ul;sk;re0Xsrae;ns0Ks1X;ax,lf1n8ps7;wiP;d7glew5verness;ian2Aochina;aFeDi8kg,nd,ov7unti2J;d,enweep;gh8llc7;reN;bury,l7;and7;!s;r7yw5;ef1tf1;libu26mp8r7stings;f1lem,row;stead,t0;aFodavari,r7uelph;avenCe7imsW;at Aen7; 8f1Iwi7;ch;acr3valley;britain,lak3;hur7;st;ng3y village;airhavKinancial7ra; district;aCgliBnf19ppiAu9ver8x7;et6f1;glad3t0;rope,st0;ng;nt0;rls1Ms7;t 7;e7si4;nd;aEeCfw,igBo9ryd8u7xb;mfri3nstable,rh2tt0;en;nca1ArcMv6w7;nt0C;by;nh2r7vonport;ry;nuAr7;l8t7;f1moor;ingt0;be;aNdg,eLgk,hElDo7royd0;l8m7rnwall;pt0;c9lingw5osse7;um;ood;he0U;earwat6t;aBel9i7uuk;chen itza,mney rock,n7ricahua;atT;m0Zt7;enh2;mor7rlottetQth2;ro;dar 7ntervilB;grove;ldBmAr7versh2;lis8rizo pla7;in;le;bNpbellf1;weT;a01eQingley,kk,lackOoNr7uckX;aIiCo7;ckt0ok7wns cany0;lyn,s7;i4to7;ne;de;dge8gh7;am,t0;n8t7;own;or7;th;ceb8m7;lPpt0;rid7;ge;ardwalk,lt0;bu7pool,waA;rn;aconsfFdf1lCrAverly9x7;hi7;ll; hills;wi7;ck; air,l7;ingh2;am;ie7;ld;ltimore,rnsl8tters7;ea;ey;bMct0driadic,frica,ginKlHmericas,nBrcAs9tl8ylePzor3;es;!antA;hcroft,ia; de triomphe,t8;adyr,caAdov6tarct7;ic7; oce7;an;st6;er;be8dersh7hambra,list0;ot;rt0;cou7;rt;bot9i7;ngd0;on;sf1;ord",
    "Region": "true¦0:2J;1:2G;2:2P;3:2A;a2Nb2Ac1Wd1Res1Qf1Og1Jh1Fi1Aj16k11l0Ym0Nn07o05pYqUrRsJtEuBverAw6y4zacatecas;akut0ork3u4;cat1kon;a5est 4isconsin,yoming;bengal,virgin0;rwick3shington4;! dc;acruz,mont;dmurt0t4;ah,tar4; 2Ka0X;a6e5laxcala,ripura,u4;scaDva;langa2nnessee,xas;basco,m4smOtar24;aulipas,il nadu;a8elangor,i6o5taf11u4ylhet;ffXrrey,s19;me1Bnora,uth V;ber0c4kkim,naloa;hu1ily;n5rawak,skatchew1xo4;ny; luis potosi,ta catari2;a4hode i9;j4ngpur;asth1shahi;inghai,u4;e4intana roo;bec,en4retaro;sl0E;a8e4unjab;i,n5r4;ak,nambuco;ang,nsylv4;an0;hang,ra4;!na;axaca,disha,h4klahoma,ntar4reg7ss0Ax0F;io;aIeBo6u4;evo le4navut;on;r4tt15va scot0;f6mandy,th4; 4ampton3;caroli2dakota;olk;braska,vada,w4; 6foundland4;! and labrad4;or;brunswick,hamp3jers5mexiTyork4;! state;ey;galPyarit;aAeghalaya,i6o4;nta2r4;dov0elos;ch6dlanDn5ss4zoram;issippi,ouri;as geraPnesota;ig1oac1;dhy12harashtra,ine,lacca,ni5r4ssachusetts;anhao,i el,ylG;p4toba;ur;anca3e4incoln3ouisI;e4iR;ds;a6e5h4omi;aka06ul2;dah,lant1ntucky,rala;bardino,lmyk0nsas,r4;achay,el0nataka;alis6har4iangxi;kh4;and;co;daho,llino7n4owa;d5gush4;et0;ia2;is;a6ert5i4un1;dalFm0D;ford3;mp3rya2waii;ansu,eorg0lou7oa,u4;an4izhou,jarat;ajuato,gdo4;ng;cester3;lori4uji1;da;sex;ageUe7o5uran4;go;rs4;et;lawaMrby3;aFeaEh9o4rimea,umbr0;ahui7l6nnectic5rsi4ventry;ca;ut;ima,orado;la;e5hattisgarh,i4uvash0;apRhuahua;chn5rke4;ss0;ya;ra;lGm4;bridge3peche;a9ihar,r8u4;ck4ryat0;ingham3;shi4;re;emen,itish columb0;h0ja cal8lk7s4v7;hkorto4que;st1;an;ar0;iforn0;ia;dygHguascalientes,lBndhr9r5ss4;am;izo2kans5un4;achal 7;as;na;a 4;pradesh;a6ber5t4;ai;ta;ba5s4;ka;ma;ea",
    "FemaleName": "true¦0:I4;1:I8;2:HG;3:HY;4:HH;5:HL;6:IL;7:IP;8:G8;9:IH;A:G1;B:GZ;C:HQ;D:IE;E:AF;F:HU;G:H1;aFSbEOcCVdC4eARfA9g9Kh92i8Sj7Pk6Rl5Cm3Sn39o36p2Uqu2Tr22s11t0Bu09vZwSxi30yOzH;aLeIineb,oHsof4;e3Df4la,ra;h2iKlIna,ynH;ab,ep;da,ma;da,h2iHra;nab;aJeIing,olACu0vH;et8onCT;le0sen4;el,gmur,n,s89;aMendD6hiCNiH;lJnH;if3TniHo0;e,f3S;helmi0lHma;a,ow;ka0nB;aNeKiHusa5;ck7JkIl8oleAviH;anEenI4;ky,toriAT;da,lma,rHs0;a,nHonica;a,ice;leHnesG9;nHLrH;i1y;g9rHs7;su5te;aXeThQiMoKrHu5y2;acI4iHudy;c4na,sH;hEta;nHr0F;iEya;aJffany,nHs7;a,gtiH;ng;!nEUra;aIeHomasi0;a,lma,o7Pres1;l4ndolwethu;gan,o7NrIssH;!a,ie;eHi,ri6;sa,za;bOlMmKnIrHs7tia0wa0;a7Gyn;iHya;a,ka,s7;arEe2iHm6Nra;!ka;a,iH;a,t7;at7it7;a0Bcarlett,e07hViSkye,neza0oQri,tNuIyH;bil,lvi1;ha,niAsIzH;an39et8ie,y;anHi6;!a,e,nH;aCe;aIeH;fan3l4Wphan5U;cH6r5;fi9KnHphi1;d2ia,ja,ya;er2lv4mon1nIobhan,tH;a,i;dy;aMeIirHo0y5;a,lCU;ba,e0i5lJrH;iHr60yl;!dan;ia,lD7;imaa,ki2nJrIu0w0yH;la,na;i,le9on,ron,yn;aIda,ia,nHon;a,on;!ya;lJrIvH;da,inj;e0ife;en1i0ma;anvi,bLd57har,iBkKlJmInd2rHs7vannaC;aCi0;ant7i2;lCYma,ome;ineh,u2;in1ri0;a03eYhWiToHuthCW;bRcQl7XnPsJwIxH;anAEie,y;an,e0;aIeHie,lD;ann6ll1marCQtA;!lHnn1;iHyn;e,nH;a,dE;da,i,na;hel5Rio;bin,erAyn;a,cIkHmas,nEta,ya;ki,o;h8Bki;ea,iannon,oH;da,n1F;an0bIemEgi0i0nHta,y0;a7Oee;a,eH;cHkaC;a,ca;chIe,i0mo0nHquel,y0;di,ia;ael,elHiB;!e,le;een3ia0;aOeNhKia,oIrH;iscil3Audence;lHrt4;i0ly;iloIoebe,ylH;is,lis;me0;ggy,nelope,r5t2;ige,m0Nn59o5rvati,tIulH;a,et8in1;ricHt4F;a,e,ia;ctav4deIfCCksa0lHphCCumou;a,ga,iv4;l4t8;aTeRiLoIurHy5;!ay,ul;a,eIor,rHur;aCeFma;ll1mi;aLcJharika,kIlaHna,s7ta;!y;a,iDBki;hoGk9HolH;a,e4G;!mh;hir,lHna,rissa;!a,lBD;dLima,nKomi6rges,tH;aHhal3;lHs7;i1ya;cy,et8;e9iECya;a08ckenz3e00iMoJuriel,yH;a,rH;a,iMna,tG;i2llB2nH;a,iH;ca,ka,que;a,cSdori,kaRlMmi,nKrHtzi;aIiH;am;!nB;dy,eHh,n3;nhGrva;aKdJe0ica,lH;iHy;cent,e;red;!gros;!e5;ae5hH;ae5el3T;agan,gNi,lKrH;edith,iIon,yH;em,l;em,ssa;an3iHlisa;nHsBY;a,da;!an,han;b07cADd05e,g03ha,i02ja,l00nZrLsoumeh,tKuIvis,xB0yHz3;bell,ra,soun;d6rH;a,eF;h82ild1t3;a,cTgPiKjor3l7Gn3s7tJwa,yH;!aHbeth,ja9lou;m,nB0;a,ha,in1;!aJbel,eIja,lDna,sHtza;!a,ol,sa;!l1A;!h,m,nH;!a,e,n1;arJeIie,oHr3Yueri8;!t;!ry;et3Wi36;el4Li6Zy;dy,on,ue5;ak,en,iHlory;a,ka,nB;a,re,s3te;daHg3;!len1;alDd3elHge,ison,on0;ei9in1yn;el,le;a0Me0BiWoQuLyH;d4la,nH;!a,dIe2KnHsey;!a,e2J;a,sey;ann,cJel0Ois1lIna,pHz;e,iA;a,u;iHy;a2Oe,ja,l2JnB;is,l1QrItt1HuH;el5is1;aJeIi6na,rH;a9Vi6;lei,n1tA;!in1;aTbb95dSepa,lNnKsJvIzH;!a,beth,et8z3;!ia;a,et8;!a,dH;a,sHy;ay,ey,i,y;a,iJja,lH;iHy;a9Qe;!aH;!nE;ia,ya;!nH;!a,ne;aPda,e0iNjYla,nMoKsJtHx8Ry5;iHt3;c4t4;edi,lC6;la,nHra;a,ie,o2;a,or1;a,gh,laH;!ni;!h,nH;a,d2e,n5K;cOdon0iNkes7mija,na,rMtJurIvHxmi,y5;ern1in4;a,e4Zie,yn;as7iIoH;nya,ya;fa,s7;a,is9R;a,la;ey,ie,y;a01eWhaViNlea,oMrJyH;lHra;a,ee,ie;istHy67;a,en,iHy1E;!e,n55;nul,ri,urtney;aNerMley,mJrHzzy;a,stH;en,in;!berlH;eHi,y;e,y;a,stF;!na,ra;dij1w5;el7LiKlJnIrH;a,i,ri;d2na,za;ey,i,lB6s3y;ra,s7;cey,diatou,ede,iSlQmPrNss6EtKviAyH;!e,lH;a,eH;e,igh;!a68eIhHi4LlDri0y;ar83er83ie,leFrAVy;!lyn89ri0;a,en,iHl5Poli0yn;!ma,nEssa;a5il1;eigh,i,lH;e,ie;a,tl6F;a0AeZiWoOuH;anMdLlHst7U;es,iH;a88eHssa;!n9tH;!a,te;ith,y;a,iA;!anNcelDdMelGhan7HleLni,sIva0yH;a,ce;eHie;fHlDph7K;a,in1;en,n1;i6y;!a,e,n3X;lHng;!ian,lH;!ian;anNle0nKrJsH;ica,sH;!e,ica;i,ri;!a,elGifer,nH;a,et8iHy;!e,fer;a,eJiInH;a,eIiH;e,n1;!t8;cMda,mi,nIque27sminEvie2y9zH;min6;a6eIiH;ce,e,n1s;!lHssa,t0A;e,le;inIk68lDquelH;in1yn;da,ta;da,lPmOnNo0rMsIvaHwo0;!na;aIiHla,obel;do2;belHdo2;!a,e,l34;ati,en1i0ma;di2es,grid;a9elBoge9;a,e9ia0o0se;aQeNiIoHyacinth;da,ll3rtense;lImaH;ri;aIdHlaI;a,egard;ry;ather,iIlHnrietArmi9ster;en2Rga,mi;di;biba,iley,lNnMrJsnItHwa,yley;ice,t3;aa;iHmony,ri4Z;etH;!te;aCnaC;a,ey,l3;a01eViQlOoNrKunJwH;enHyneth;!dolD;ay,el;acieIetHiselB;a,chF;!la;ld1Aogoosh;adys,enHor4ynis;a,da,na;aKgi,lIna,ov85selHta;a,e,le;da,liH;an;!n0;mLnJorgIrH;ald5Ki,m3Btrud6;et8i4U;a,eHna;sis,vieve;ma;bHle,rnet,yG;iIrielH;a,l1;!ja;aTeQiPlorOoz4rH;anJeIiH;da,eB;da,ja;!cH;esIiHoise;n1sca;!ca;a,enc4;en,o0;lIn0rnH;anB;ec4ic4;nArKtHy6;emIiHma,oumaA;ha,ma,n;eh;ah,iBrah,za0;crin,d0Qevi,ileFk0Ol07mXnid,rUsOtNuMvHwa;aKelIiH;!e,ta;inEyn;!a;!ngel4O;geni1nice;hel,ien9ta;mLperanKtH;eIhHrel5;er;l2Zr6;za;a,eralB;iHma,ne4Eyn;cHka,n;a,ka;aPeOiLmH;aIeHie,y;li9;!li9nuH;elG;lHn1;e6iHy;a,e,ja;ly,rald;!nue5;aWeUiNlMma,no2oKsJvH;a,iH;na,ra;a,ie;iHuiH;se;a,en,ie,y;a0c4da,e,f,nMsJzaH;!betHveA;e,h;aHe,ka;!beH;th;!a,or;anor,nH;!a,i;!in1na;ate1Pta;vi;eIiHna,wi0;e,th;l,n;aYeMiLjeneKoH;lores,minique,n39rHtt3;a,eFis,la,othHthy;ea,y;ba;an09naCon9ya;anQbPde,eOiMlJmetr4nHsiree;a,iH;ce,se;a,iIla,orHphi9;es,is;a,lah;dHrdH;re;!dee,na;!b2EoraCraC;a,d2nH;!a,e;hl4i0lal,mNnLphn1rIvi1VyH;le,na;a,by,cIia,lH;a,en1;ey,ie;a,et8iH;!ca,el19ka;arHia;is;a0Qe0Mh04i02lUoJristIynH;di,th4;al,i0;lPnMrIurH;tn1C;aJd2IiHn2Iri9;!nH;a,e,n1;!l3;cepcion,n3sH;tanHuelo;ce,za;eHleF;en,t8;aJeoIotH;ilde;!pat2;ir6rJudH;et8iH;a,ne;a,e,iH;ce,sY;a2er2ndH;i,y;aQeNloe,rH;isJyH;stH;al;sy,tH;a1Men,iHy;an1e,n1;lseIrH;!i6yl;a,y;nMrH;isKlImH;ai9;a,eHot8;n1t8;!sa;d2elGtH;al,elG;cIlH;es8i41;el4ilH;e,ia,y;itlYlXmilWndVrMsKtHy5;aIeIhHri0;er1DleFrDy;ri0;a32sH;a31ie;a,iOlLmeJolIrH;ie,ol;!e,in1yn;lHn;!a,la;a,eIie,otHy;a,ta;ne,y;na,ssa;ace,ice;a,e,l1;isAl3;in,yn;arb0Je02iZlXoUrH;andi6eRiJoIyH;an0nn;nwDoke;an3BdgMgiLtH;ney,tH;!aInH;ey,i,y;ny;d,t8;etH;!t6;an0e,nH;da,na;bbi6glarInH;iAn3;ka;ancHythe;a,he;anca,lja0nH;iAtH;ou;aVcUlinBniArPssOtJulaCvH;!erlH;ey,y;hJsy,tH;e,iHy6;e,na;!anH;ie,y;!ie;nItHyl;ha,ie;adIiH;ce;et8i9;ca,ky;!triH;ce,z;a2o2ra;a2Sb2Md23g1Zi1Qj5l16m0Xn09oi,r04sVtUuOvNwa,yHz2;aKes7gJlIn,seH;!l;in;un;!nH;a,na;a,i2J;drLguJrIsteH;ja;el4;stH;in1;a,ey,y;aahua,he0;hIiya,ja,miAtrH;id;aLlHton;eIi6yH;!n;e,iHy;gh;!nH;ti;iJleIo7piA;ta;en,n1t8;aHelG;!n1J;a01dje5eZgViTjRnKtoHya;inet8nH;el5ia;te;!aKeIiHmJ;e,ka;!mHtt6;ar3;!belIliHmU;sa;!l1;a,eliH;ca;ka,sHta;a,sa;elHie;a,iH;a,ca,n1qH;ue;!tH;a,te;!bImHstasiMya;ar4;el;aLberKeliJiHy;e,l4naH;!ta;a,ja;!ly;hGiIl4nB;da;a,ra;le;aWba,ePiMlKthJyH;a,c4sH;a,on,sa;ea;iHyson;e,son;a,cIn1sHza;a,e,ha,on,sa;e,ia,ja;c4is7jaKksaKna,sJxH;aHia;!nd2;ia,saH;nd2;ra;ia;i0nIyH;ah,na;a,is,naC;la;c7da,leFmNnLsH;haClH;inHyY;g,n;!h;a,o,slH;ey;ee;en;at7g3nIusH;ti0;es;ie;aWdiTelMrH;eJiH;anMenH;a,e,ne;an0;na;!aLeKiIyH;nn;a,n1;a,e;!ne;!iH;de;e,lDsH;on;yn;!lH;i9yn;ne;aKbIiHrL;!e,gaK;ey,i6y;!e;gaH;il;dKliyJradhIs7;ha;ya;ah;a,ya",
    "FirstName": "true¦aTblair,cQdOfrancoZgabMhinaLilya,jHkClBm6ni4quinn,re3s0;h0umit,yd;ay,e0iloh;a,lby;g9ne;co,ko0;!s;a1el0ina,org6;!okuhF;ds,naia,r1tt0xiB;i,y;ion,lo;ashawn,eif,uca;a3e1ir0rM;an;lsFn0rry;dall,yat5;i,sD;a0essIie,ude;i1m0;ie,mG;me;ta;rie0y;le;arcy,ev0;an,on;as1h0;arl8eyenne;ey,sidy;drien,kira,l4nd1ubr0vi;ey;i,r0;a,e0;a,y;ex2f1o0;is;ie;ei,is",
    "LastName": "true¦0:96;1:8Q;2:90;3:8Y;4:8R;5:8I;6:8G;7:8L;8:6N;9:6D;a8Sb7Oc6Nd62e5Wf5Jg4Xh4Fi4Cj45k3Ml37m2Cn23o1Vp1Hquispe,r0Ys0At02vWwMxLyDzA;hAimmerm4L;aAou,u;ng,o;aEeun71iBoAun;koyama,shida;!lA;diAmaz;rim,z;maAng;da,g3Omoto,sAza9;a9hita;iao,u;aFeDiBoAright,u;jcik,lff,ng;lAmm0nkl0sniews9;ki8Hliams25s3;bAiss,lt0;b,er,st0;age,gn0lBtA;anabe,s3;k0sh,tA;ers,on;aCesel6RiAogt;dal,llalAss0valdi;ba,obos;lBn dArgas;en b4Gijk,yk;enzuela,verde;aGeix18hDi1j7oCrBsui,urA;c1n0;an,emblay,ynis9;lstoy,m5rr2th;atch0ill,oA;mArlacius;ps3s3;kah7Anaka,te,var2;aSchNeMhKiImGoEtBuAvoboda,zabo;bot5lliv1zu9;aBeAoica;ele,in1Pphe8vens1H;l7rm0;sa,to,uA;ng,sa;itAyth;!h;lva,mmo8nArbu;at6clair,gh;aAehu,imizu;la,rma;gu6infeld,oh,pulveda,rrano;evi4iltz,miBneid0roed0uAwarz;bert,lz;dBtA;!t,z;!t;h7ito,ka3AlDnAr5sa9to,unders;dBtAz;ana,e,os;b3Kers;as,o;aPeMiJoDuByA;a4oo,u;bio,iz,sA;so,u;bEcha,drigu2gers,jas,mDosevelt,sCtBux,wA;e,li4;ari,h;enb3Bsi;ano,ero;erts0Ni6Z;beiro,cBes,vAzzo;as,e6;ci,hards0K;ag1es,iBut0yA;es,nolds;s,t0;dBmAv4K;os;ic,u;aLeIhGiDoCrAut7;asad,ifti,ochazA;ka;p23rti58well;cBero,nA;as,to;asso,hl0;aAillips;k,m,n4P;a6PeteWna,rAters04;eAic,ki8;i6ra,tz;h66k,rk0tA;el,te6L;bGconnor,g1RlDneill,rBsborne,we8zA;demir,turk;ellana,tAwell;ega,iz;iAs3;vAynyk;ei6;aIrien;aFeEiDoAun2ym1;rBvAwak;ak,otn4I;odahl,ris;cholsNemi,kol5x3;ils3mec;gy,kaAray1sh,varro;jiAmu6shiA;ma;aXcUePiOoFuByeA;rs;lCnBrAssolini;ati,pTray;oz,te3R;d0l0;h1lHnGore,rBsAzart;er,s;aDeCiBrisAt3;!on;!n0C;au,i6no,tti;!l2;roe,tgomery;ina,l0;crachi,ll0;hmeti,iDjia,lBnd2rci0ssiAyer1J;!er;nAo;yk;er,j0;cartBlA;aughl7e1;hy;drigal,eda,i0jerus,kela,mani,nFrCtByA;er,r;ei,ic,su11th5C;iAqu2roqu7ti8;ani,c,nA;!o;cini,n;aNeIiFoDuByA;!nch;k5nAo;d,gu;mbarAp2vr5we;di;!nAu,yanage;coln,dA;b11holm,strom;feChm0Fitn0kaBn7rAwis;oy;!j;bvAvA;re;ine,mmy,ng,u,voie,ws3;aNeMh1iKlIoFrDuBvar1woA;k,n;ce6marA;!a;aAem0ishna,yeziu;m0sniqi,us2F;bay3Rch,vaAwals9;cAl;!ic,s;e7uiveA;rt;eff0kAl5mu6;uchi;ll0nnedy;hn,llDmins9ne,pBstrati,to,ur,yA;a,s0;l1oA;or;oe;aEenDha4oBuA;ng,r5;hnsAn2u4;on,t3;ki8nings;cAnsse8;ks3obs;glesias,keda,l07noTonBshikAto,vanou;awa;escu;aJeIiHjaltal7oCuA;!aAb0gh2ynh;m1ng;a4dz5fCjgaard,k,lBpIrAwe,xha;ak,vat;m2t;er,fm2WmA;ann;ggi8tchcock;ikkila,mingway,nde3Rrre6ss;dz5gen,qGrFsDuCwByA;ashi,es;ki8;gen,ng;ani,hiA;moto;di4p0ris,t;ue;aNeorgMheorghe,iLjonKoFrDuAw3;errAo,zm1;a,eA;ro;ayli4eene,g5iffithAub0;!s;ldCm2nBodA;e,m1;calv2zal2;bAs02;erg;aj,i;bs3l,ordaH;ieva;gnGlDmaCndhi,o,rAshi,uthi0;cAdn0za;ia;ge;eaBlA;agh0i,o;no;e,on;aLerIiFjeldsted,lEoCrBuA;chs,ent2jita,ll0;eem1iedm1;ntaArt7urni0wl0;na;emi4or2;sBtzgeraA;ld;ch0h0;nand2rA;arAei6;a,i;b0rrell;dDinsCsAva8;cobar,pAtrada;inoza,osiJ;te7;er,is3warA;ds;aQeJiHjurhuGoEriscoll,uBvorA;ak;arte,boBmitru,nn,rAtta;and,ic;is;g1he0DtA;to;us;aAcki1Wssanayake,x3;s,z; CbnaBlAmir,rvishi,vi,w1;gado,ic;th;bo0groot,jo4lBsilAvri2;va;a cruz,e3uA;ca;hl,mcevs9nBtta,viA;ds3es,s;iels,kula;ki;a03eYhLiobKlarkJoCrAunningham;awford,ivAuz;elli;hen,lEntDoCrAsta,x;byn,reA;a,ia;ke,p0;i,reras;em1li8;ns;!e;anu;aGeEiu,oAu4we;i,ng,p6uBwAy;!dB;dAng;huD;!n,onAu4;!g;kDnCpm1ttBudhA;ry;erjee,o0O;!d,g;ma,raboA;rty;bDlZng5rA;eghetBnA;a,y;ti;an,otari;cer2lder3mpbeFrCstAvadiX;iAro;llo;doBr,t0uAvalho;so;so,zo;ll;a00eOhLiKlJoHrEuCyA;rFtyA;qi;chan1rA;ke;iem,oAyant;oks,wA;ne;nFruya,su,uchaAyko,z5;rd;anco,ondal;ancLdMshwas;aZoAuiy1;umAwmA;ik;ckJethovIgu,ktGnnOrA;gCisBnascoA;ni;ha;er,mA;anA;!n;asA;hi;en;er,hA;am;b5ch,hKiley,kk0ldw7nFrBshAt2u0;ir;bCnBtlAua;ett;es,i0;ieSosa;dAik;a6yoA;padhyA;ay;ra;k,ng;ic;bbYcosXdVgSkhtTlPnJrFsl1tDyA;aBd7;in;la;chis3kiA;ns3;aCmstro4sl1;an;ng;ujo,ya;dBsaA;ri;eBrA;ews;rs3;on;meiBv2;es;da;arwBuilA;ar;al;ams,l0;er;ta;as",
    "MaleName": "true¦0:GJ;1:FD;2:DD;3:G3;4:D0;5:G9;6:CJ;7:F5;8:EB;9:BL;A:FZ;B:FR;aEQbDMcC9dB5eACf9Lg8Lh7Wi7Kj6Ik63l5Dm40n3Mo3Dp2Zqu2Xr22s1Bt0Pu0Mv0AwRxavi2yHzC;aCor0;cChid,karia,nAC;!hDkC;!ary;!ar72ery;aIevgenBBoEuC;en,rFBsCval;if,uf;nCsef,ussef;aCg;s,tC;an,h0;nCrosDNss08;is,nC;!ick;aPeNiDoCyatt;jciech,lfgang,odrFutR;lFnC;f8IsC;lCt1;ow;bGey,frEhelm,lC;ard,iCy;am,e,s;ed5iC;d,ed;e9ur;i,ndell,rn2sC;!l8t1;lDyC;l1ne;lDtC;!er;ace,y;aKernCXiFladDoC;jtech,lodymyr;!iC;mir,sCY;cFha0ktor,nceDrgil,vC;a0ek;!nC;t,zo;!e4Mtor;lCnce,sily;!entC;in94;lCm6Qri,sm0;riCysses;ch,k;aVeQhMiKoFrDurki,yC;!l2rone,s1;avis,eCist0oy,um0;ntCFvor,y;bFdAImCny;!asDmC;aso,ie,y;!z;ias,y;mCt6;!my,othy;adEeoDiago,omC;!as;!dor8N;!de6;dFrC;ence,rC;ance,eCy;ll,nce;!dy;dgh,ha,iCnn2req,tsuki;chi,ka;aXcotVeShOiLlobod0oKpenc2tEurDvenA0yCzym1;ed,lvest2;aj,esh;anFeDuC;!a9;fan15phE6vCwa9;e6Xie;!islaCl8;v,w;lom1rBuleymane;dDgmund,lCm1yabonga;as,vio;!dhartha,n8;aEeClomo;lCrm0;d1t1;hid,ne,qu1Hun,wn,yne;aDbastiDUkou,lim,pp,rgCth,ymour;e1Bio;m6n;!tC;!ie,y;eed,lFmEnCqib,toshi,ul;dCjay,tino;eep,ro;!iAHkelo,mBQu4;!vatore;aZeUhett,iRoGuDyC;an,ou;b8WdDf6pe9ssC;!elDX;ol00y;an,bLcco,dJel,geIh0lHmGnEry,sDyC;!ce;ario,coe,s;!aCnBG;ld,n;an,eo;a72f;lio,r;e38g2n8olfo,riC;go;bB9eCZ;cCl8;ardo,c7Th4WkCo;!ey,ie,y;cFece,gDid,ubByCza;ansh,n05;gie,iC;nald,s;ep;chid,fa4hHin2jesh,lGmFndEoHpha4sDul,wiri,yC;an,mond;had,m6;alD9olph;iro,on;f,ph;ul;e90inC;cy,t1;aNeKhilIiErCyoF;akash,eC;m,st1;eDoC;tr;rre,tC;er,ro;!ipClip;!p6I;dro,rcy,tC;ar,e98rC;!o7;blo,draig,olo,scal,tri5RulCv86;!ie,o;ctavio,i2lHmGndrej,rFsDtCumAwB;is,to;ama,cAkAm0vCwald;aldo;i,vR;ar,er;aDeksandr,ivC;er,i2;f,v;atNeLguyBiFoC;aDel,l0rC;be9m0;h,m;cFels,g4ilo,kDlC;es,s;!hil,las,olaC;!i,y;hCkColas;olas;al,d,il,ls1vC;ille;e,hanC;!a4i4;aXeUiLoGuDyC;les,r1;hamDrad,staC;fa,pha;ed,mG;dibo,e,hamEises,ntDritz,sCussa;es,he;e,y;ad,ed,mC;ad,ed;cFgu4hai,kElDnato,tchC;!ell;house,o7t1;aere,eBPhail,olaj;ah,hDkC;!ey,y;aDeC;al,l;el,l;hDlv3rC;le,rill,v4M;di,met;ay0c00gn6hWjd,ksim,lTmadZnSrKsXtDuric7OxC;imilB6well;eHhEias,tCus,yas;!eo,hCia7;ew,ias;eDiC;as,eu,s;us,w;j,o;cHiGkFlEquis,shall,tCv3;iCy;!m,n;in,on;el,o7us;ano,o7us;!elCin,o7us;!l5o;fred,ish,ny,u4;acDcoCik;lm;hy;amDdi,esh,mC;oud;adCmad;ou;aulCiej;ay;aXePiNloyd,oJuDyC;le,nd1;cFdEiDkCth2uk;a7e;gi,s,z;ovic,vig,wig;!as,iC;ano,en;g0nnie,renEuCvro,well;!iC;e,s;!zo;am,n6oC;n4r;a9Kevi,land,nHoFst2thaEvC;eCi;nte;bo;nCpold;!a7Sel,id;!nC;a9y;mEnd1rDszlo,urenCwr6C;ce,t;ry,s;ar,be9ont;aMeHhalGiEla6onrad,rCu5Jyle;istCzysztof;i0oph2;er0ngsl8p,rC;il9Vk;ed,id;en0iFnCrmit,v4R;!dDnCt1;eth,y;rick;r,th;cp2mErDspAuC;ri;im,l;al,il;a03eXiVoFuC;an,lCst3;en,iC;an,en,o,us;aQeOhKnIrGsDzC;ef;eDhCiah,ue;!ua;!f,ph;dCge;i,on;!aCny;h,s,th6E;anDnC;!ath6Cie,n6U;!nC;!es;!l,sCy;ph;o,qu3;an,mC;!i,m6N;d,ffFns,rCs6;ald,emDmaine,oCry;me,nimo;iah,y;!ery,rC;ey,y;cKdBkImHrEsDvi2yC;dBs1;on,p2;ed,oDrCvis;ett,od;d,s5W;al,es5Ris1;a,e,oCub;b,v;ob,ques;aRbLgKke4Xlija,onut,rIsEtCv0;ai,suC;ki;aDha0iah,maCsac;el,il;ac,iaC;h,s;a,vinCw3;!g;nacio,or;ai,rahC;im;aReLoIuC;be9gGmFsC;eyDsC;a3e3;in,n;berto;h,o;m2raDsse3wC;ard,ie;c45tio;ath,ctor,iGnDrC;be9man07;drik,rC;iCy2I;!k,que;n0Ptor;bJlImza,nHo,rEsDyC;ato,dB;an,s0;lDold,r2DuCv8;hito,ki,to;an,ey;k,s;!im;ib;a07eZiUlenToQrMuCyorgy;iHnFsC;!taC;f,vC;!e,o;nAtC;er,h2;do,lC;herDlC;auCerP;me;aEegCov2;!g,orC;!io,y;dy,ham;dfr8nzalo,rDttfC;ried;an,d45;!n;acoFlDno,oCuseppe;rgi5vanni;be6Aes,lC;es;mo;oFrC;aDhard,rCt;it,y;ld,rd5;ffErgC;!e7iCy;!os;!r8;bElBrCv3;eCland,r4Dth,y;th;e,ri4;aXeSiQlOorrest,rCyodor;aHedFiC;edDtC;s,z;rich;!d40eri10riC;ck,k;nCs2;cEkC;ie,lC;in,yn;esLisC;!co,zek;etch2oC;ri0yd;d4lConn;ip;deriFliEng,rC;dinaCg6nando;nd5;pe,x;co;bCdi,hd;iEriC;ce,zC;io;an,en,o;benez2dYfrXit0lSmLnIo3rEsteb0th0ugenDvCzra;an,erett,geny;!e;iDnCrol,v3w3;est5ie,st;cCk;!h,k;och,riCzo;co,qC;ue;aHerGiDmC;aGett;lCrh0;!iC;ano,o,s;s1y;nu4;be9d1iEliDm2t1viCwood;n,s;ot2As;!as,jah,ot,sC;ha;a3en;!dGgAmFoDua2PwC;a2Oin;arC;do;oZuZ;ie;a04eTiOmitrNoFrag0uEwDylC;an,l0;ayne,ight;ane,dl8nc0st3;minFnDri0ugCvydGyle;!lF;!ald,nCov0;ell,ie,y;go,iDykC;as;cCk;!k;i,y;armuFetDll1mitri7neCon,rk;sh;er,mAriC;ch;id;andLepak,j0lbe9metri6nIon,rGsEvDwCxt2;ayne,ey;en,in;hawn,moC;nd;ek,riC;ck;is,nC;is,y;rt;re;an,le,mKnIrEvC;e,iC;!d;en,iEnell,rCyl;eCin,yl;l3Zn;n,o,us;!iCny;el,lo;iCon;an,en,on;a0He0Eh04iar0lSoKrFuDyrC;il,us;rtC;!is;aFistC;iaDobC;al;no;ig;dy,lInErC;ey,neliCy;s,us;nEor,rDstaC;nt3;ad;or;by,e,in,l3t1;aHeEiCyde;fCnt,ve;ford,t1;menDt6;us;s,t;rFuDyC;!t1;dCs;e,io;enC;ce;aHeGrisC;!toC;phCs;!eC;!r;st2t;d,rCs;b4leC;s,y;el;cDdrCsA;ic;il;lHmFrC;ey,lDroCy;ll;!o7t1;er1iC;lo;!eb,v3;a06eWilVjorn,laUoSrEuCyr1;ddy,rtKst2;er;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dFnC;dDisC;lav;en,on;!foLl8y;bby,gd0rCyd;is;ine,ke;al,lK;nIrC;at,nEtC;!raC;m,nd;aDhaCie;rd;rd5;!iDjam3nCs1;ie,y;to;kaMlazs,nHrC;n8rDtC;!holomew;eCy;tt;ey;dCeD;ar,iC;le;ar1Hb18d11fonso,gust3hm0Xi0Ul07m05nRrGsaFugustEveDyCziz;a0kh0;ry;o,us;hi;ata,chiKiJjun,mHnEon,tCy0;em,hCie,ur5;ur;aDoC;!ld;ud,v;aCin;an,nd5;!el,ki;baCe;ld;aMdHgel5tCwA;hoFoC;iDnC;!i5y;ne;ny;er7rCy;eDzC;ej;!as,i,j,s,w;!s;s,tolC;iCy;!y;ar,iCmAos;ne,r,t;aVbSdBeJfHiGl00onFphonsEt1vC;aPin;on;e,o;so,zo;!sR;!onYrC;ed;c,jaHksFssaHxC;!andC;er,rC;e,os,u;andCei;ar,er,r;ndC;ro;en;eDrecC;ht;rt5;dd3in,n,sC;taC;ir;dDmA;ar;an,en;ad,eC;d,t;in;so;aGi,olErDvC;ik;ian5;f5ph;!o;mCn;!a;dGeFraDuC;!bakr;hCm;am;!l;allEel,oulaye,ulC;!lDrahm0;an;ah;av,on",
    "Person": "true¦0:1Q;a21b1Tc1Hd1Ae14f11g0Zh0Ni0Mj0Jk0Gl0Dm07n04o03pYrOsItCusain bolt,v9w4xzibit,y1;anni,oko on2uji,v1;an,es;en,o;a3ednesday adams,i2o1;lfram,ode;ll ferrell,z khalifa;lt disney,r1;hol,ren;a2i1oltaire;n diesel,rginia wo12;lentino rossi,n gogh;a4h3i2ripp,u1yra banks;lXpac shakur;mba03pper gore;eresa may,or;kashi,t1ylor;um,yana;a4carlett johanss0h3i2lobodan milosevic,noop dogg,ocrates,pider1uperman,wami; man,man;egfried,nbad;akespeare,erlock holmes,ia labeouf;ddam hussain,nt1;a claus,ig8;a9e5i4o2u1za;mi,paul;bin hood,d stew12nald1thko;inho,o;hanna,ngo starr,valdo;ese witherspo0i1mbrandt;ll2nh1;old;ey,y;chmaninoff,ffi,iIshid,y romano;a4e3i2lato,o1uff daddy;cahontas,e;lar,per;le,rX;lmer,ris hilt0;leg,prah winfrey,ra;a2e1iles crane,ostradamus; yo,l5ttie,wmL;pole0s;a5e4i2o1ubarek;by,liere,net,rrissey;randa ju1tt romney;ly;rlin,ssia9;cklemore,rkov,s0ta hari,ya angelou;ady gaga,e1iberace,u;bron james,ch wale1e;sa;anye west,e2iefer suther1obe bryant;land;ats,sha;a2effers0fk,k rowling,rr tolki1;en;ck the ripper,waharlal nehru,y z;liSnez;a7e6i4u1;lk hog2mphrey1saZ;! bog03;an;l1tler;de;dwig,nry 3;ile selassFlle ber4m3rrison1;! 1;ford;id,mond;ry;ast0iannis,o1;odwNtye;ergus0lorence nightingale,r1;an1ederic chopL;s,z;ff5m2nya,ustaTzeki1;el;eril lagasse,i1;le zatop1nem;ek;ie;a5e3i1rake;ck w1ego maradoB;olf;g1mi lovaLnzel washingt0;as;l1nGrth vadO;ai lKt0;a7h4lint0o1thulhu;n1olio;an,fuci1;us;aucIop2ristian baKy1;na;in;millo,ptain beefhe4r1;dinal wols2s0;on;ey;art;a6e3hatt,ing crosby,oFro1;ck,n1;te;ck,nazir bhut2rtil,yon1;ce;to;nksy,rack ob1;ama;l 6r3shton kutch2vril lavig9yn ra1;nd;er;chimed2istot1;le;es;capo3go2paci1;no;re;ne"
  };

  /*! spencermountain/suffix-thumb 6.1.0 MIT */
  // the four parts of a model, in the order they are packed
  const sections = ['fwd', 'both', 'rev', 'ex'];

  // characters with a meaning in the packed format - words containing these cannot be learned
  const reserved = /[~|:,{}0-9]/;

  const decodeVal = function (key, str) {
    const m = str.match(/^[0-9]+/);
    const n = m ? Number(m[0]) : 0;
    const tail = m ? str.slice(m[0].length) : str;
    return key.slice(0, key.length - n) + tail
  };

  // apply a model to one word:
  //   1. whole-word exceptions
  //   2. the longest suffix with a rule (a rule may match the entire word)
  //   3. the '' rule, if any, as a fallback (a plain append)
  //   4. otherwise, the word is returned unchanged
  const convert = function (str = '', model = {}) {
    if (typeof model === 'string') {
      throw new Error('suffix-thumb: convert expects a model - uncompress() a packed string first')
    }
    const { ex = {}, fwd = {}, both = {} } = model;
    if (Object.hasOwn(ex, str)) {
      return ex[str]
    }
    // longest suffix first - the stem is only cut once a rule matches
    for (let i = 0; i <= str.length; i += 1) {
      const suff = str.slice(i);
      if (Object.hasOwn(fwd, suff)) {
        return str.slice(0, i) + fwd[suff]
      }
      if (Object.hasOwn(both, suff)) {
        return str.slice(0, i) + both[suff]
      }
    }
    return str
  };

  const flipObj = function (obj = {}) {
    return Object.fromEntries(Object.entries(obj).map(([key, val]) => [val, key]))
  };

  // swap the direction of a model
  const reverse = function (model = {}) {
    return {
      reversed: !model.reversed,
      // these two work both ways
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // and the one-way rules trade places
      fwd: model.rev || {},
      rev: model.fwd || {},
    }
  };

  const invalid = function () {
    throw new Error('suffix-thumb: invalid packed model')
  };

  // suffix-trie → list of keys
  const unpackKeys = function (str, suff = '', out = []) {
    let i = 0;
    do {
      let chain = '';
      while (i < str.length && str[i] !== ',' && str[i] !== '{') {
        chain += str[i];
        i += 1;
      }
      if (reserved.test(chain)) {
        invalid();
      }
      if (str[i] === '{') {
        // find the matching brace
        let depth = 1;
        let j = i + 1;
        while (depth > 0 && j < str.length) {
          if (str[j] === '{') {
            depth += 1;
          } else if (str[j] === '}') {
            depth -= 1;
          }
          j += 1;
        }
        if (depth !== 0 || (j < str.length && str[j] !== ',')) {
          invalid();
        }
        unpackKeys(str.slice(i + 1, j - 1), chain + suff, out);
        i = j;
      } else {
        out.push(chain + suff);
      }
      i += 1; // step over the comma
    } while (i <= str.length)
    return out
  };

  const unpackSection = function (str = '') {
    const obj = Object.create(null);
    if (!str) {
      return { ...obj }
    }
    str.split('|').forEach(group => {
      const i = group.indexOf(':');
      const val = group.slice(0, i);
      const count = val.match(/^[0-9]+/);
      if (i < 0 || !count || reserved.test(val.slice(count[0].length))) {
        invalid();
      }
      unpackKeys(group.slice(i + 1)).forEach(k => {
        if (Number(count[0]) > k.length) {
          invalid();
        }
        obj[k] = decodeVal(k, val);
      });
    });
    return { ...obj }
  };

  // one string → model
  const uncompress = function (str = '') {
    if (typeof str !== 'string' || str[0] === '{') {
      throw new Error('suffix-thumb: uncompress expects a packed string. Models made before v6 must be learned again.')
    }
    const parts = str.split('~');
    // Preserve the empty/default input shorthand for an empty model.
    if (str !== '' && parts.length !== sections.length) {
      invalid();
    }
    const model = {};
    sections.forEach((s, i) => {
      model[s] = unpackSection(parts[i]);
    });
    return model
  };

  // generated in ./lib/models
  var model$3 = {
    "pastTense": {
      "first": "1te:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5itt:abreiten|5ag:fliegen{au,e}|4og:gen{we,wä}|5ang:abringen|2te:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},lär}|4ochte:ögen|3at:tuen|5iss:cheißen|4ief:lafen|4ßte:lassen{b,ran}|5ieß:ablassen|5ob:hieben|5annte:ortrennen|10fuhr:rad fahren|4ielt:alte|0rte:ie|4amm:imme|0erte:i|0te:l~2te:en,escheren|1te:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,ni,cl}|7mailte:-mailen|5usste:wissen|11hettoisierte:ettoisieren|5achte:bringen,denken|5annte:ennen|5onnte:können|4ßte:ssen{a,pre,tre,ä}|5urfte:dürfen|3tte:haben|5andte:bersenden|4ie:eien{hr,p}|5urde:werden|5ielt:halten|5alt:elten|2at:un|5at:bitten|4at:reten|5itt:en{eid{l,hn},eit{gl,r}}|5ott:sieden|4iet:raten|5ot:bieten|6ocht:echten{f,l}|14schwamm brust:brustschwimmen|6arst:ersten|5iss:eißen|5oss:ießen|4ies:blasen|5ies:eisen{w,pr}|4as:esen{l,n}|6uchs:achsen|5am:ommen|5ahm:ehmen|5amm:wimmen|5omm:limmen|4ief:rufen|5ief:laufen|5iff:eifen{gr,n,f,l}|5off:fen{sau,rie}|5alf:elfen|5arf:erfen|5af:effen|5uf:haffen|5og:en{ieh,g{ie{b,fl,w},sau}}|4og:ügen{l,tr}|5ang:ingen|5ing:fangen|4ing:gehen|4ug:agen{hl,tr}|5ieg:eigen{t,hw}|5ag:liegen|5arg:ergen|5and:inden{b,f,w}|4and:tehen|4ud:laden|5ied:eiden{h,m}|9fuhr rad:radfahren|5ieb:eiben{bl,r}|4ab:geben|4ub:graben|4ob:eben{h,w}|5ob:tieben|5arb:erben{st,w,d}|4ib:vergraben|5ach:echen{r,t}|6ich:eichen{l,tr,w}|6usch:waschen|6osch:schen{dre,rlö}|6och:riechen|5och:hstechen|4ah:ehen{s,h}|5ieh:eihen|5oh:liehen|5aß:essen,sitzen|4ieß:oßen|5ieß:lassen,heißen|5uhr:fahren|4or:ren{ä,he,wö}|5or:en{ier{fr,rl},kies}|4war:sein|4ar:bären|5iel:fallen|5oll:ellen{hw,u}|5ahl:ehlen|5ann:innen|5onn:berspinnen|5ien:heinen|15schwamm delfin:delfinschwimmen|16schwamm delphin:delphinschwimmen|5olz:elzen|5ank:inken{r,t,s}|5olk:melken~2e:te{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|2n:te{el,er,eier}|2:rentwickelte|2en:te{el{i,e,w},er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|4:ierte{skristallis,skompliment}|3:tkommerzialisierte|5ögen:mochte|4alte:hterhielt|2uen:vertat|3imme:herschwamm|3afen:schlief|2egen:ewog|2ieben:chob|2essen:ausaß~1te:auskristallisiere|4og:erwägen|10fuhr:rad fahren|5uk:backen|2te:en{dach,fehl,pinn}|4or:schwären",
      "second": "1test:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5ittest:abreiten|5altest:elten|6ochtest:lechten|5agst:fliegen{au,e}|4ogst:gen{we,wä}|5angst:abringen|2test:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,hdresch,nweich,enn{tr,l,p},lär}|4ochtest:ögen|5isst:cheißen|4iefst:lafen|4ßtest:lassen{b,ran}|5ießt:ablassen|5obst:hieben|5anntest:ortrennen|10fuhrst:rad fahren|4ieltest:alte|0rtest:ie|4ammst:imme|0ertest:i|0test:l~2test:en,escheren|1test:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ietest:raten|5ieltest:halten|7mailtest:-mailen|5atest:bitten|4atest:reten|3atest:tuen|5usstest:wissen|6arstest:ersten|11hettoisiertest:ettoisieren|5achtest:bringen,denken|6ochtest:fechten|5anntest:ennen|5onntest:können|4ßtest:ssen{a,pre,tre,ä}|5urftest:dürfen|5ittest:en{eid{l,hn},eit{gl,r}}|5ottest:sieden|3ttest:haben|5otest:bieten|5andtest:bersenden|5andest:inden{b,f,w}|4andest:tehen|4udest:laden|5iedest:eiden{h,m}|5urdest:werden|4iest:en{blas,hrei,pei}|5iest:eisen{w,pr}|5ießest:enlassen{h,g}|5isst:eißen|5osst:ießen|5amst:ommen|5ahmst:ehmen|5ammst:wimmen|5ommst:limmen|4iefst:rufen|5iefst:laufen|5iffst:eifen{gr,n,f,l}|5offst:fen{sau,rie}|5alfst:elfen|5arfst:erfen|5afst:effen|5ufst:haffen|5ogst:en{ieh,g{ie{b,fl,w},sau}}|4ogst:ügen{l,tr}|5angst:ingen|5ingst:fangen|4ingst:gehen|4ugst:agen{hl,tr}|5iegst:eigen{t,hw}|5agst:liegen|5argst:ergen|5iebst:eiben{bl,r}|4abst:geben|4ubst:graben|4obst:eben{h,w}|5obst:tieben|5arbst:erben{st,w,d}|4ibst:vergraben|5achst:echen{r,t}|6ichst:eichen{l,tr,w}|6uschst:waschen|6oschst:schen{dre,rlö}|6uchst:achsen|6ochst:riechen|5ochst:hstechen|4ahst:ehen{s,h}|5iehst:eihen{l,d}|5ohst:liehen|5uhrst:fahren|4orst:ren{ä,he,wö}|5orst:en{ier{fr,rl},kies}|4warst:sein|4arst:bären|5ielst:fallen|5ollst:ellen{hw,u}|5ahlst:ehlen|5annst:innen|5onnst:berspinnen|5ienst:heinen|4ast:esen{l,n}|5olzst:elzen|5ankst:inken{r,t,s}|5olkst:melken|14schwammst brust:brustschwimmen|4andst:stehen{lein,tan,pf}|2atst:un|5atst:verbitten|5ieltst:ochhalten|5aßt:essen,sitzen|4ießt:oßen|5ießt:lassen,heißen|15schwammst delfin:delfinschwimmen|16schwammst delphin:delphinschwimmen|9fuhrst rad:radfahren~4e:test{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|4n:test{el,er,eier}|4en:test{el{i,chi,e,w},pars,er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|7alte:hterhieltest|4:rentwickeltest|6elten:galtest|6:iertest{skristallis,skompliment}|5:tkommerzialisiertest|7echten:flochtest|7ögen:mochtest|5imme:herschwammst|5afen:schliefst|4egen:ewogst|4ieben:chobst|3essen:ausaßt~1test:auskristallisiere|4ogst:erwägen|10fuhrst:rad fahren|5ukst:backen|2test:en{dach,fehl,pinn}|4orst:schwären",
      "third": "1te:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5itt:abreiten|5ag:fliegen{au,e}|4og:gen{we,wä}|5ang:abringen|2te:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},lär}|4ochte:ögen|3at:tuen|5iss:cheißen|4ief:lafen|4ßte:lassen{b,ran}|5ieß:ablassen|5ob:hieben|5annte:ortrennen|10fuhr:rad fahren|4ielt:alte|0rte:ie|4amm:imme|0erte:i|0te:l~2te:en,escheren|1te:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,ni,cl}|7mailte:-mailen|5usste:wissen|11hettoisierte:ettoisieren|5achte:bringen,denken|5annte:ennen|5onnte:können|4ßte:ssen{a,pre,tre,ä}|5urfte:dürfen|3tte:haben|5andte:bersenden|4ie:eien{hr,p}|5urde:werden|5ielt:halten|5alt:elten|2at:un|5at:bitten|4at:reten|5itt:en{eid{l,hn},eit{gl,r}}|5ott:sieden|4iet:raten|5ot:bieten|6ocht:echten{f,l}|14schwamm brust:brustschwimmen|6arst:ersten|5iss:eißen|5oss:ießen|4ies:blasen|5ies:eisen{w,pr}|4as:esen{l,n}|6uchs:achsen|5am:ommen|5ahm:ehmen|5amm:wimmen|5omm:limmen|4ief:rufen|5ief:laufen|5iff:eifen{gr,n,f,l}|5off:fen{sau,rie}|5alf:elfen|5arf:erfen|5af:effen|5uf:haffen|5og:en{ieh,g{ie{b,fl,w},sau}}|4og:ügen{l,tr}|5ang:ingen|5ing:fangen|4ing:gehen|4ug:agen{hl,tr}|5ieg:eigen{t,hw}|5ag:liegen|5arg:ergen|5and:inden{b,f,w}|4and:tehen|4ud:laden|5ied:eiden{h,m}|9fuhr rad:radfahren|5ieb:eiben{bl,r}|4ab:geben|4ub:graben|4ob:eben{h,w}|5ob:tieben|5arb:erben{st,w,d}|4ib:vergraben|5ach:echen{r,t}|6ich:eichen{l,tr,w}|6usch:waschen|6osch:schen{dre,rlö}|6och:riechen|5och:hstechen|4ah:ehen{s,h}|5ieh:eihen|5oh:liehen|5aß:essen,sitzen|4ieß:oßen|5ieß:lassen,heißen|5uhr:fahren|4or:ren{ä,he,wö}|5or:en{ier{fr,rl},kies}|4war:sein|4ar:bären|5iel:fallen|5oll:ellen{hw,u}|5ahl:ehlen|5ann:innen|5onn:berspinnen|5ien:heinen|15schwamm delfin:delfinschwimmen|16schwamm delphin:delphinschwimmen|5olz:elzen|5ank:inken{r,t,s}|5olk:melken~2e:te{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|2n:te{el,er,eier}|2:rentwickelte|2en:te{el{i,e,w},er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|4:ierte{skristallis,skompliment}|3:tkommerzialisierte|5ögen:mochte|4alte:hterhielt|2uen:vertat|3imme:herschwamm|3afen:schlief|2egen:ewog|2ieben:chob|2essen:ausaß~1te:auskristallisiere|4og:erwägen|10fuhr:rad fahren|5uk:backen|2te:en{dach,fehl,pinn}|4or:schwären",
      "firstPlural": "1ten:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5itten:abreiten|5alten:elten|6ochten:lechten|5agen:fliegen{au,e}|4ogen:gen{we,wä}|5angen:abringen|2ten:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},lär}|4ochten:ögen|3aten:tuen|5issen:cheißen|4iefen:lafen|4ßten:lassen{rb,ran}|5oben:hieben|5annten:ortrennen|10fuhren:rad fahren|4ielten:alte|0rten:ie|4ammen:imme|0erten:i|0ten:l~2ten:en,escheren|1ten:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ieten:raten|5ielten:halten|7mailten:-mailen|2aten:un|5aten:bitten|4aten:reten|5ussten:wissen|6arsten:ersten|11hettoisierten:ettoisieren|5achten:bringen,denken|6ochten:fechten|5annten:ennen|5onnten:können|4ßten:ssen{a,pre,tre,ä}|5urften:dürfen|5itten:en{eid{l,hn},eit{gl,r}}|5otten:sieden|3tten:haben|5oten:bieten|5andten:bersenden|5issen:eißen|5ossen:ießen|4iesen:blasen|5iesen:eisen{w,pr}|4asen:esen{l,n}|6uchsen:achsen|5amen:ommen|5ahmen:ehmen|5ammen:wimmen|5ommen:limmen|4iefen:rufen|5iefen:laufen|5iffen:eifen{gr,n,f,l}|5offen:fen{sau,rie}|5alfen:elfen|5arfen:erfen|5afen:effen|5ufen:haffen|5ogen:en{ieh,g{ie{b,fl,w},sau}}|4ogen:ügen{l,tr}|5angen:ingen|5ingen:fangen|4ingen:gehen|4ugen:agen{hl,tr}|5iegen:eigen{t,hw}|5agen:liegen|5argen:ergen|5anden:inden{b,f,w}|4anden:tehen|4uden:laden|5ieden:eiden{h,m}|5urden:werden|5ieben:eiben{bl,r}|4aben:geben|4uben:graben|4oben:eben{h,w}|5oben:tieben|5arben:erben{st,w,d}|4iben:vergraben|5achen:echen{r,t}|6ichen:eichen{l,tr,w}|6uschen:waschen|6oschen:schen{dre,rlö}|6ochen:riechen|5ochen:hstechen|4ahen:ehen{s,h}|5iehen:eihen|5ohen:liehen|5aßen:essen,sitzen|4ießen:oßen|5ießen:lassen,heißen|5uhren:fahren|4oren:ren{ä,he,wö}|5oren:en{ier{fr,rl},kies}|4waren:sein|4aren:bären|5ielen:fallen|5ollen:ellen{hw,u}|5ahlen:ehlen|5annen:innen|5onnen:berspinnen|5ienen:heinen|5olzen:elzen|5anken:inken{r,t,s}|5olken:melken|4ien:eien{hr,p}|15schwammen delfin:delfinschwimmen|16schwammen delphin:delphinschwimmen|14schwammen brust:brustschwimmen|9fuhren rad:radfahren~3e:ten{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:ten{el,er,eier}|3en:ten{el{i,chi,e,w},pars,er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|6alte:hterhielten|3:rentwickelten|5elten:galten|4uen:vertaten|5:ierten{skristallis,skompliment}|4:tkommerzialisierten|6echten:flochten|6ögen:mochten|5imme:herschwammen|5afen:schliefen|4egen:ewogen|4ieben:choben|4essen:ausaßen~1ten:auskristallisiere|4ogen:erwägen|10fuhren:rad fahren|5uken:backen|4ßten:blassen|2ten:en{dach,fehl,pinn}|4oren:schwären",
      "secondPlural": "1tet:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5ittet:abreiten|5altet:elten|6ochtet:lechten|5agt:fliegen{au,e}|4ogt:gen{we,wä}|5angt:abringen|2tet:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,hdresch,nweich,enn{tr,l,p},lär}|4ochtet:ögen|3atet:tuen|5isst:cheißen|4ieft:lafen|4ßtet:lassen{b,ran}|5ießt:ablassen|5obt:hieben|5anntet:ortrennen|10fuhrt:rad fahren|4ieltet:alte|0rtet:ie|4ammt:imme|0ertet:i|0tet:l~2tet:en,escheren|1tet:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ietet:raten|5ieltet:halten|7mailtet:-mailen|2atet:un|5atet:bitten|4atet:reten|5usstet:wissen|6arstet:ersten|11hettoisiertet:ettoisieren|5achtet:bringen,denken|6ochtet:fechten|5anntet:ennen|5onntet:können|4ßtet:ssen{a,pre,tre,ä}|5urftet:dürfen|5ittet:en{eid{l,hn},eit{gl,r}}|5ottet:sieden|3ttet:haben|5otet:bieten|5andtet:bersenden|5andet:inden{b,f,w}|4andet:tehen|4udet:laden|5iedet:eiden{h,m}|5urdet:werden|4iet:eien{hr,p}|5isst:eißen|5osst:ießen|4iest:blasen|5iest:eisen{w,pr}|4ast:esen{l,n}|6uchst:achsen|14schwammt brust:brustschwimmen|5amt:ommen|5ahmt:ehmen|5ammt:wimmen|5ommt:limmen|4ieft:rufen|5ieft:laufen|5ifft:eifen{gr,n,f,l}|5offt:fen{sau,rie}|5alft:elfen|5arft:erfen|5aft:effen|5uft:haffen|5ogt:en{ieh,g{ie{b,fl,w},sau}}|4ogt:ügen{l,tr}|5angt:ingen|5ingt:fangen|4ingt:gehen|4ugt:agen{hl,tr}|5iegt:eigen{t,hw}|5agt:liegen|5argt:ergen|5iebt:eiben{bl,r}|4abt:geben|4ubt:graben|4obt:eben{h,w}|5obt:tieben|5arbt:erben{st,w,d}|4ibt:vergraben|5acht:echen{r,t}|6icht:eichen{l,tr,w}|6uscht:waschen|6oscht:schen{dre,rlö}|6ocht:riechen|5ocht:hstechen|4aht:ehen{s,h}|5ieht:eihen{l,d}|5oht:liehen|5aßt:essen,sitzen|4ießt:oßen|5ießt:lassen,heißen|5uhrt:fahren|4ort:ren{ä,he,wö}|5ort:en{ier{fr,rl},kies}|4wart:sein|4art:bären|5ielt:fallen|5ollt:ellen{hw,u}|5ahlt:ehlen|5annt:innen|5onnt:berspinnen|5ient:heinen|5olzt:elzen|5ankt:inken{r,t,s}|5olkt:melken|15schwammt delfin:delfinschwimmen|16schwammt delphin:delphinschwimmen|9fuhrt rad:radfahren~3e:tet{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:tet{el,er,eier}|3en:tet{el{i,chi,e,w},pars,er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|6alte:hterhieltet|3:rentwickeltet|5elten:galtet|4uen:vertatet|5:iertet{skristallis,skompliment}|4:tkommerzialisiertet|6echten:flochtet|6ögen:mochtet|4imme:herschwammt|4afen:schlieft|3egen:ewogt|3ieben:chobt|3essen:ausaßt~1tet:auskristallisiere|4ogt:erwägen|10fuhrt:rad fahren|5ukt:backen|2tet:en{dach,fehl,pinn}|4ort:schwären",
      "thirdPlural": "1ten:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5itten:abreiten|5alten:elten|6ochten:lechten|5agen:fliegen{au,e}|4ogen:gen{we,wä}|5angen:abringen|2ten:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},lär}|4ochten:ögen|3aten:tuen|5issen:cheißen|4iefen:lafen|4ßten:lassen{rb,ran}|5oben:hieben|5annten:ortrennen|10fuhren:rad fahren|4ielten:alte|0rten:ie|4ammen:imme|0erten:i|0ten:l~2ten:en,escheren|1ten:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ieten:raten|5ielten:halten|7mailten:-mailen|2aten:un|5aten:bitten|4aten:reten|5ussten:wissen|6arsten:ersten|11hettoisierten:ettoisieren|5achten:bringen,denken|6ochten:fechten|5annten:ennen|5onnten:können|4ßten:ssen{a,pre,tre,ä}|5urften:dürfen|5itten:en{eid{l,hn},eit{gl,r}}|5otten:sieden|3tten:haben|5oten:bieten|5andten:bersenden|5issen:eißen|5ossen:ießen|4iesen:blasen|5iesen:eisen{w,pr}|4asen:esen{l,n}|6uchsen:achsen|5amen:ommen|5ahmen:ehmen|5ammen:wimmen|5ommen:limmen|4iefen:rufen|5iefen:laufen|5iffen:eifen{gr,n,f,l}|5offen:fen{sau,rie}|5alfen:elfen|5arfen:erfen|5afen:effen|5ufen:haffen|5ogen:en{ieh,g{ie{b,fl,w},sau}}|4ogen:ügen{l,tr}|5angen:ingen|5ingen:fangen|4ingen:gehen|4ugen:agen{hl,tr}|5iegen:eigen{t,hw}|5agen:liegen|5argen:ergen|5anden:inden{b,f,w}|4anden:tehen|4uden:laden|5ieden:eiden{h,m}|5urden:werden|5ieben:eiben{bl,r}|4aben:geben|4uben:graben|4oben:eben{h,w}|5oben:tieben|5arben:erben{st,w,d}|4iben:vergraben|5achen:echen{r,t}|6ichen:eichen{l,tr,w}|6uschen:waschen|6oschen:schen{dre,rlö}|6ochen:riechen|5ochen:hstechen|4ahen:ehen{s,h}|5iehen:eihen|5ohen:liehen|5aßen:essen,sitzen|4ießen:oßen|5ießen:lassen,heißen|5uhren:fahren|4oren:ren{ä,he,wö}|5oren:en{ier{fr,rl},kies}|4waren:sein|4aren:bären|5ielen:fallen|5ollen:ellen{hw,u}|5ahlen:ehlen|5annen:innen|5onnen:berspinnen|5ienen:heinen|5olzen:elzen|5anken:inken{r,t,s}|5olken:melken|4ien:eien{hr,p}|15schwammen delfin:delfinschwimmen|16schwammen delphin:delphinschwimmen|14schwammen brust:brustschwimmen|9fuhren rad:radfahren~3e:ten{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:ten{el,er,eier}|3en:ten{el{i,chi,e,w},pars,er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|6alte:hterhielten|3:rentwickelten|5elten:galten|4uen:vertaten|5:ierten{skristallis,skompliment}|4:tkommerzialisierten|6echten:flochten|6ögen:mochten|5imme:herschwammen|5afen:schliefen|4egen:ewogen|4ieben:choben|4essen:ausaßen~1ten:auskristallisiere|4ogen:erwägen|10fuhren:rad fahren|5uken:backen|4ßten:blassen|2ten:en{dach,fehl,pinn}|4oren:schwären"
    },
    "presentTense": {
      "first": "1e:n|10fahre:rad fahren|0:e|0re:ie|0ere:i|2le:el~1:en|12schäme:fremdschämen|3le:eln|7maile:-mailen|1e:celn|11hettoisiere:ettoisieren|14schwimme brust:brustschwimmen|15schwimme delfin:delfinschwimmen|16schwimme delphin:delphinschwimmen|4bin:sein|5ann:können|9fahre rad:radfahren|5arf:dürfen|4ag:ögen|5uss:müssen|2:sollen|5ill:wollen|5eiß:wissen~0:e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:e{tu,er{,ei,sch{t,ä}}}|0n:e{vertu,l{l,h,i,o,a,ä,e,u,ü,ö,r,c},er{i,rei,qu,sch{,rt},hw,e}}|2eln:chle|2el:rentwickle|3:iere{skristallis,skompliment}|2:tkommerzialisiere~0:auskristallisiere|10fahre:rad fahren",
      "second": "1st:n{,e{t{chal,beinhal,zel,ira},ni}},e|2st:en{g{eantra,eauftra,ranschla,herber},unfall,rfehl,hab{c,d},hdresch,verschreck}|4agst:ögen|5immst:ehmen|5iffst:effen|2t:sen{,s{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}}}|4ßt:lassen{rb,ran}|5äßt:enlassen{f,d,m}|10fährst:rad fahren|4ältst:alte|0rst:ie|0erst:i|0st:l~2st:en|1st:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,cl}|4iest:lesen|5ängst:fangen|4ägst:agen{hl,tr}|5irgst:ergen|14schwimmst brust:brustschwimmen|5ältst:halten|5iltst:elten|4ätst:raten|4ittst:reten|6ichtst:echten{f,l}|5äufst:aufen{l,s}|5ilfst:elfen|5irfst:erfen|5arfst:dürfen|4äfst:lafen|5ällst:fallen|5illst:llen{wo,hwe,ue}|5iehlst:ehlen|7mailst:-mailen|4äst:blasen|5isst:essen|5ässt:lassen{en,lein,rei}|5usst:müssen|4ibst:geben|5irbst:erben{st,w,d}|4äbst:graben|11hettoisierst:ettoisieren|5ährst:fahren|6irst:ersten|5irst:werden|5ichst:echen{r,t}|6ischst:schen{dre,rlö}|6äschst:waschen|6ächst:achsen|4iehst:ehen{s,h}|5annst:können|5ickst:hrecken|5ilkst:melken|3st:haben|4ädst:laden|4bist:sein|5ilzst:verschmelzen|2t:en{z,ß,sch{rut,rei},x,c}|5ilzt:elzen|5eißt:wissen|4ßt:ssen{pre,tre,ä,a}|5äßt:lassen|4ößt:oßen|15schwimmst delfin:delfinschwimmen|16schwimmst delphin:delphinschwimmen|9fährst rad:radfahren~1en:t{s{e,u{a{br,gr,kr,tl,s,p,z},hle,m},t,m{bre,bu,hei,bi},hal,hül,rä,s,pis,hub,rin,zin,ran,k{c{kle,glu,mu,na,ri},ur,rkor,o},a,p{a,i,plum,rül,o,e},ö,i,o,w,ü},filz,ß{hwei,lö,ma,spa}}|2n:st{knie,tu,el,er{,ei,sch{it,ät,ä}}}|2e:st{rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|4ögen:magst|2en:st{u{nbra,nsa,versa,vert},l{ie,ee,we,cha},er{i,rei,qu,sch,hw,e},äch{schw,r},rknack,dop,ei{schr,fr,nsp,ssp,n,f,z}}|5alte:hterhältst|5ehmen:nimmst|5effen:riffst|2:rentwickelst|4:ierst{skristallis,skompliment}|3:tkommerzialisierst~1st:auskristallisiere|10fährst:rad fahren|4ßt:blassen|2st:brauen,fehlen|2t:sen{flie,knick,lau,mor,par}",
      "third": "1t:n{,te{chal,beinhal,zel,ira}},e|6icht:lechten|2t:en{g{eantra,eauftra,ranschla,herber},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},hab{c,d},hdresch,verschreck}|5immt:ehmen|5ifft:effen|4ßt:lassen{rb,ran}|5äßt:enlassen{f,d,m}|10fährt:rad fahren|2st:peien|4ist:sein|4ält:alte|0rt:ie|0ert:i|0t:l~2t:en|1t:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,ni,cl}|5ängt:fangen|4ägt:agen{hl,tr}|5irgt:ergen|5ält:halten|5ällt:fallen|5illt:ellen{hw,u}|5iehlt:ehlen|5ilt:elten|7mailt:-mailen|5ilzt:elzen|4ßt:ssen{pre,tre,ä,a}|5äßt:lassen|4ößt:oßen|5äuft:aufen{l,s}|5ilft:elfen|5irft:erfen|4äft:lafen|4äst:blasen|5isst:essen|5ässt:lassen{en,lein,rei}|14schwimmt brust:brustschwimmen|4iest:lesen|6ächst:achsen|6irst:ersten|4ibt:geben|5irbt:erben{st,w,d}|4äbt:graben|11hettoisiert:ettoisieren|5ährt:fahren|5icht:echen{r,t}|6icht:fechten|6ischt:schen{dre,rlö}|6äscht:waschen|4ieht:ehen{s,h}|5ickt:hrecken|5ilkt:melken|4ädt:laden|4ät:raten|4itt:reten|3t:haben|15schwimmt delfin:delfinschwimmen|16schwimmt delphin:delphinschwimmen|5ann:können|9fährt rad:radfahren|5ird:werden|4äd:berladen|5arf:dürfen|4ag:ögen|5uss:müssen|2:sollen|5ill:wollen|5eiß:wissen~1e:t{rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:t{tu,el,er{,ei,sch{it,ät,ä}}}|1en:t{vertu,l{chä,ie,ee,we,ei},filz,löß,maß,spaß,piss,er{i,rei,qu,sch,hw,e}}|3alte:hterhält|1:rentwickelt|4ehmen:nimmt|4effen:rifft|2en:speist{n,s}|3:iert{skristallis,skompliment}|2:tkommerzialisiert|4echten:flicht~1t:auskristallisiere|10fährt:rad fahren|4ist:sein|4ßt:blassen|2t:fehlen,fliesen",
      "firstPlural": "2n:tuen|10fahren:rad fahren|0n:e,l|0ren:ie|0eren:i~0:n|7mailen:-mailen|11hettoisieren:ettoisieren|15schwimmen delfin:delfinschwimmen|16schwimmen delphin:delphinschwimmen|14schwimmen brust:brustschwimmen|9fahren rad:radfahren|3ind:ein~1:n{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|4:ieren{skristallis,skompliment}|3:tkommerzialisieren|1en:vertun~0n:auskristallisiere|10fahren:rad fahren",
      "secondPlural": "1t:n,e|2t:ssen{a{l{bb,en,lein,rei},bf,anf,bp,enp},pre{b,en,zer,i}}|4ßt:enlassen{f,d,m}|10fahrt:rad fahren|0t:te,l|0rt:ie|0ert:i~2t:en|1t:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,ni,cl}|4ßt:ssen{e,a,ä}|5äuft:islaufen|7mailt:-mailen|14schwimmt brust:brustschwimmen|11hettoisiert:ettoisieren|15schwimmt delfin:delfinschwimmen|16schwimmt delphin:delphinschwimmen|9fahrt rad:radfahren|1d:in~1:hterhaltet,rentwickelt|1e:t{rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:t{tu,el,er{,ei,sch{it,ät,ä}}}|1en:t{vertu,ieß,maß,spaß,el{i,e,w},er{i,rei,qu,sch,hw,e}}|3:iert{skristallis,skompliment}|2:tkommerzialisiert~1t:auskristallisiere|10fahrt:rad fahren|2t:essen{,fr,m}",
      "thirdPlural": "2n:tuen|10fahren:rad fahren|0n:e,l|0ren:ie|0eren:i~0:n|7mailen:-mailen|3len:tümeln|11hettoisieren:ettoisieren|15schwimmen delfin:delfinschwimmen|16schwimmen delphin:delphinschwimmen|14schwimmen brust:brustschwimmen|9fahren rad:radfahren|3ind:ein~1:n{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|4:ieren{skristallis,skompliment}|3:tkommerzialisieren|1en:vertun~0n:auskristallisiere|10fahren:rad fahren"
    },
    "subjunctive1": {
      "first": "1e:n|10fahre:rad fahren|0:e|0re:ie|0ere:i|2le:el~1:en,in|3le:eln|7maile:-mailen|1e:celn|11hettoisiere:ettoisieren|14schwimme brust:brustschwimmen|15schwimme delfin:delfinschwimmen|16schwimme delphin:delphinschwimmen|9fahre rad:radfahren~0:e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:e{tu,er{,ei,sch{t,ä}}}|0n:e{vertu,l{l,h,i,o,a,ä,e,u,ü,ö,r,c},er{i,rei,qu,sch{,rt},hw,e}}|2eln:chle|2el:rentwickle|3:iere{skristallis,skompliment}|2:tkommerzialisiere~0:auskristallisiere|10fahre:rad fahren",
      "second": "10fahrest:rad fahren|1est:un|0st:e,l|0rest:ie|0erest:i~1st:n|7mailest:-mailen|3lest:eln{tüm,ßstramp,tbüg,oog,twand}|11hettoisierest:ettoisieren|14schwimmest brust:brustschwimmen|15schwimmest delfin:delfinschwimmen|16schwimmest delphin:delphinschwimmen|9fahrest rad:radfahren~2:st{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|3n:tuest|2n:vertuest|5:ierest{skristallis,skompliment}|4:tkommerzialisierest~0st:auskristallisiere|10fahrest:rad fahren|3lest:bügeln",
      "third": "1e:n|10fahre:rad fahren|0:e|0re:ie|0ere:i|2le:el~1:en,in|3le:eln|7maile:-mailen|1e:celn|11hettoisiere:ettoisieren|14schwimme brust:brustschwimmen|15schwimme delfin:delfinschwimmen|16schwimme delphin:delphinschwimmen|9fahre rad:radfahren~0:e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:e{tu,er{,ei,sch{t,ä}}}|0n:e{vertu,l{l,h,i,o,a,ä,e,u,ü,ö,r,c},er{i,rei,qu,sch{,rt},hw,e}}|2eln:chle|2el:rentwickle|3:iere{skristallis,skompliment}|2:tkommerzialisiere~0:auskristallisiere|10fahre:rad fahren",
      "firstPlural": "10fahren:rad fahren|1en:in,un|0n:e,l|0ren:ie|0eren:i~0:n|7mailen:-mailen|11hettoisieren:ettoisieren|15schwimmen delfin:delfinschwimmen|16schwimmen delphin:delphinschwimmen|2n:tuen|14schwimmen brust:brustschwimmen|9fahren rad:radfahren~1:n{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|2n:tuen,seien|4:ieren{skristallis,skompliment}|3:tkommerzialisieren~0n:auskristallisiere|10fahren:rad fahren|0:tun",
      "secondPlural": "10fahret:rad fahren|1et:in,un|0t:e,l|0ret:ie|0eret:i~1t:n|7mailet:-mailen|3let:eln{tüm,ßstramp,tbüg,oog,twand}|11hettoisieret:ettoisieren|14schwimmet brust:brustschwimmen|15schwimmet delfin:delfinschwimmen|16schwimmet delphin:delphinschwimmen|9fahret rad:radfahren~1:t{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|2n:tuet,seiet|1n:vertuet|4:ieret{skristallis,skompliment}|3:tkommerzialisieret~0t:auskristallisiere|10fahret:rad fahren|3let:bügeln",
      "thirdPlural": "10fahren:rad fahren|1en:in,un|0n:e,l|0ren:ie|0eren:i~0:n|7mailen:-mailen|11hettoisieren:ettoisieren|15schwimmen delfin:delfinschwimmen|16schwimmen delphin:delphinschwimmen|2n:tuen|14schwimmen brust:brustschwimmen|9fahren rad:radfahren~1:n{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|2n:tuen,seien|4:ieren{skristallis,skompliment}|3:tkommerzialisieren~0n:auskristallisiere|10fahren:rad fahren|0:tun"
    },
    "subjunctive2": {
      "first": "1te:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5itte:abreiten|5äge:fliegen{au,e}|4öge:gen{we,wä}|5änge:abringen|2te:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3äte:tuen|5isse:cheißen|4iefe:lafen|4ßte:lassen{rb,ran}|5öbe:hieben|5annte:ortrennen|10führe:rad fahren|2äte:un|4ielte:alte|0rte:ie|4ämme:imme|0erte:i|0te:l~2te:en,escheren|1te:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4iete:raten|5ielte:halten|7mailte:-mailen|5älte:gelten|5ölte:helten|5äte:bitten|4äte:reten|5üsste:wissen|6ärste:ersten|11hettoisierte:ettoisieren|5ächte:bringen,denken|5achte:gedenken|3chte:ögen|6öchte:echten{f,l}|5annte:ennen|4ßte:ssen{a,pre,tre,ä}|5itte:en{eid{l,hn},eit{gl,r}}|5ötte:sieden|4ätte:haben|5öte:bieten|5andte:bersenden|5isse:eißen|5össe:ießen|5osse:eschießen|4iese:blasen|5iese:eisen{w,pr}|4äse:esen{l,n}|6üchse:achsen|5äme:ommen|5ähme:ehmen|5ämme:wimmen|5ömme:limmen|4iefe:rufen|5iefe:laufen|5iffe:eifen{gr,n,f,l}|5öffe:fen{sau,rie}|5älfe:elfen|5ärfe:erfen|5äfe:effen|5üfe:haffen|5öge:en{ieh,g{ie{b,fl,w},sau}}|4öge:ügen{l,tr}|5änge:ingen|5inge:fangen|4inge:gehen|4üge:agen{hl,tr}|5iege:eigen{t,hw}|5äge:liegen|5ärge:ergen|5ände:inden{b,f,w}|4ände:stehen{ge,sver}|4ünde:tehen|4üde:laden|5iede:eiden{h,m}|5ürde:werden|5iebe:eiben{bl,r}|4äbe:geben|4übe:graben|4öbe:eben{h,w}|5öbe:tieben|5ärbe:erben{st,w,d}|4ibe:vergraben|5äche:echen{r,t}|6iche:eichen{l,tr,w}|6üsche:waschen|6ösche:dreschen|1:en{rlösch,wör,bär,hill}|6öche:riechen|5öche:hstechen|4ähe:ehen{s,h}|5iehe:eihen|5öhe:liehen|5äße:essen,sitzen|4ieße:oßen|5ieße:lassen,heißen|5öße:mfließen|5ühre:fahren|5öre:en{ier{fr,rl},kies}|4öre:ren{he,gä}|4wäre:sein|4ore:wären|5iele:fallen|5ölle:ellen{hw,u}|5ähle:ehlen|5änne:innen|5önne:berspinnen|5iene:heinen|5ölze:elzen|5äke:hrecken|5änke:inken{r,t,s}|5ölke:melken|4iee:eien{hr,p}|14schwömme brust:brustschwimmen|15schwömme delfin:delfinschwimmen|16schwömme delphin:delphinschwimmen|9führe rad:radfahren~2e:te{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|2n:te{el,er,eier}|2en:te{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|5alte:hterhielte|2:rentwickelte|3un:täte|3uen:vertäte|4:ierte{skristallis,skompliment}|3:tkommerzialisierte|4imme:herschwämme|4afen:schliefe|3egen:ewöge|3ieben:chöbe|3essen:ausäße~1te:auskristallisiere|4öge:erwägen|10führe:rad fahren|5üke:backen|4ßte:blassen|2te:en{fehl,kenn,pinn}|5önne:gewinnen|4ände:überstehen",
      "second": "1test:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5ittest:abreiten|5ägest:fliegen{au,e}|4ögest:gen{we,wä}|5ängest:abringen|2test:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3ätest:tuen|5issest:cheißen|4iefest:lafen|4ßtest:lassen{rb,ran}|5öbest:hieben|5anntest:ortrennen|10führest:rad fahren|2ätest:un|4ieltest:alte|0rtest:ie|4ämmest:imme|0ertest:i|0test:l~2test:en,escheren|1test:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ietest:raten|5ieltest:halten|7mailtest:-mailen|5ältest:gelten|5öltest:helten|5ätest:bitten|4ätest:reten|5üsstest:wissen|6ärstest:ersten|11hettoisiertest:ettoisieren|5ächtest:bringen,denken|5achtest:gedenken|3chtest:ögen|6öchtest:echten{f,l}|5anntest:ennen|4ßtest:ssen{a,pre,tre,ä}|5ittest:en{eid{l,hn},eit{gl,r}}|5öttest:sieden|4ättest:haben|5ötest:bieten|5andtest:bersenden|5issest:eißen|5össest:ießen|5ossest:eschießen|4iesest:blasen|5iesest:eisen{w,pr}|4äsest:esen{l,n}|6üchsest:achsen|5ämest:ommen|5ähmest:ehmen|5ämmest:wimmen|5ömmest:limmen|4iefest:rufen|5iefest:laufen|5iffest:eifen{gr,n,f,l}|5öffest:fen{sau,rie}|5älfest:elfen|5ärfest:erfen|5äfest:effen|5üfest:haffen|5ögest:en{ieh,g{ie{b,fl,w},sau}}|4ögest:ügen{l,tr}|5ängest:ingen|5ingest:fangen|4ingest:gehen|4ügest:agen{hl,tr}|5iegest:eigen{t,hw}|5ägest:liegen|5ärgest:ergen|5ändest:inden{b,f,w}|4ändest:stehen{ge,sver}|4ündest:tehen|4üdest:laden|5iedest:eiden{h,m}|5ürdest:werden|5iebest:eiben{bl,r}|4äbest:geben|4übest:graben|4öbest:eben{h,w}|5öbest:tieben|5ärbest:erben{st,w,d}|4ibest:vergraben|5ächest:echen{r,t}|6ichest:eichen{l,tr,w}|6üschest:waschen|6öschest:dreschen|1st:en{rlösch,wör,bär}|6öchest:riechen|5öchest:hstechen|4ähest:ehen{s,h}|5iehest:eihen|5öhest:liehen|5äßest:essen,sitzen|4ießest:oßen|5ießest:lassen,heißen|5ößest:mfließen|5ührest:fahren|5örest:en{ier{fr,rl},kies}|4örest:ren{he,gä}|4orest:wären|5ielest:fallen|5öllest:ellen{hw,u}|5ählest:ehlen|5ännest:innen|5önnest:berspinnen|5ienest:heinen|5ölzest:elzen|5äkest:hrecken|5änkest:inken{r,t,s}|5ölkest:melken|4ieest:eien{hr,p}|14schwömmst brust:brustschwimmen|5ämst:kommen{den,ibe}|5ähmst:nehmen{i,orlieb}|5öbst:eschieben|4wärst:sein|4ähst:tsehen|15schwömmst delfin:delfinschwimmen|16schwömmst delphin:delphinschwimmen|9führest rad:radfahren~4e:test{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|4n:test{el,er,eier}|4en:test{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|7alte:hterhieltest|4:rentwickeltest|5un:tätest|5uen:vertätest|6:iertest{skristallis,skompliment}|5:tkommerzialisiertest|6imme:herschwämmest|6afen:schliefest|5egen:ewögest|5ieben:chöbest|5essen:ausäßest~1test:auskristallisiere|4ögest:erwägen|10führest:rad fahren|5ükst:backen|4ßtest:blassen|2test:en{fehl,kenn,pinn}|5önnst:gewinnen|4ändest:überstehen",
      "third": "1te:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5itte:abreiten|5äge:fliegen{au,e}|4öge:gen{we,wä}|5änge:abringen|2te:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3äte:tuen|5isse:cheißen|4iefe:lafen|4ßte:lassen{rb,ran}|5öbe:hieben|5annte:ortrennen|10führe:rad fahren|2äte:un|4ielte:alte|0rte:ie|4ämme:imme|0erte:i|0te:l~2te:en,escheren|1te:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4iete:raten|5ielte:halten|7mailte:-mailen|5älte:gelten|5ölte:helten|5äte:bitten|4äte:reten|5üsste:wissen|6ärste:ersten|11hettoisierte:ettoisieren|5ächte:bringen,denken|5achte:gedenken|3chte:ögen|6öchte:echten{f,l}|5annte:ennen|4ßte:ssen{a,pre,tre,ä}|5itte:en{eid{l,hn},eit{gl,r}}|5ötte:sieden|4ätte:haben|5öte:bieten|5andte:bersenden|5isse:eißen|5össe:ießen|5osse:eschießen|4iese:blasen|5iese:eisen{w,pr}|4äse:esen{l,n}|6üchse:achsen|5äme:ommen|5ähme:ehmen|5ämme:wimmen|5ömme:limmen|4iefe:rufen|5iefe:laufen|5iffe:eifen{gr,n,f,l}|5öffe:fen{sau,rie}|5älfe:elfen|5ärfe:erfen|5äfe:effen|5üfe:haffen|5öge:en{ieh,g{ie{b,fl,w},sau}}|4öge:ügen{l,tr}|5änge:ingen|5inge:fangen|4inge:gehen|4üge:agen{hl,tr}|5iege:eigen{t,hw}|5äge:liegen|5ärge:ergen|5ände:inden{b,f,w}|4ände:stehen{ge,sver}|4ünde:tehen|4üde:laden|5iede:eiden{h,m}|5ürde:werden|5iebe:eiben{bl,r}|4äbe:geben|4übe:graben|4öbe:eben{h,w}|5öbe:tieben|5ärbe:erben{st,w,d}|4ibe:vergraben|5äche:echen{r,t}|6iche:eichen{l,tr,w}|6üsche:waschen|6ösche:dreschen|1:en{rlösch,wör,bär}|6öche:riechen|5öche:hstechen|4ähe:ehen{s,h}|5iehe:eihen|5öhe:liehen|5äße:essen,sitzen|4ieße:oßen|5ieße:lassen,heißen|5öße:mfließen|5ühre:fahren|5öre:en{ier{fr,rl},kies}|4öre:ren{he,gä}|4wäre:sein|4ore:wären|5iele:fallen|5ölle:ellen{hw,u}|5ähle:ehlen|5änne:innen|5önne:berspinnen|5iene:heinen|5ölze:elzen|5äke:hrecken|5änke:inken{r,t,s}|5ölke:melken|4iee:eien{hr,p}|14schwömme brust:brustschwimmen|15schwömme delfin:delfinschwimmen|16schwömme delphin:delphinschwimmen|9führe rad:radfahren~2e:te{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|2n:te{el,er,eier}|2en:te{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|5alte:hterhielte|2:rentwickelte|3un:täte|3uen:vertäte|4:ierte{skristallis,skompliment}|3:tkommerzialisierte|4imme:herschwämme|4afen:schliefe|3egen:ewöge|3ieben:chöbe|3essen:ausäße~1te:auskristallisiere|4öge:erwägen|10führe:rad fahren|5üke:backen|4ßte:blassen|2te:en{fehl,kenn,pinn}|5önne:gewinnen|4ände:überstehen",
      "firstPlural": "1ten:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5itten:abreiten|5ägen:fliegen{au,e}|4ögen:gen{we,wä}|5ängen:abringen|2ten:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3äten:tuen|5issen:cheißen|4iefen:lafen|4ßten:lassen{rb,ran}|5öben:hieben|5annten:ortrennen|10führen:rad fahren|2äten:un|4ielten:alte|0rten:ie|4ämmen:imme|0erten:i|0ten:l~2ten:en,escheren|1ten:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ieten:raten|5ielten:halten|7mailten:-mailen|5älten:gelten|5ölten:helten|5äten:bitten|4äten:reten|5üssten:wissen|6ärsten:ersten|11hettoisierten:ettoisieren|5ächten:bringen,denken|5achten:gedenken|3chten:ögen|6öchten:echten{f,l}|5annten:ennen|4ßten:ssen{a,pre,tre,ä}|5itten:en{eid{l,hn},eit{gl,r}}|5ötten:sieden|4ätten:haben|5öten:bieten|5andten:bersenden|5issen:eißen|5össen:ießen|5ossen:eschießen|4iesen:blasen|5iesen:eisen{w,pr}|4äsen:esen{l,n}|6üchsen:achsen|5ämen:ommen|5ähmen:ehmen|5ämmen:wimmen|5ömmen:limmen|4iefen:rufen|5iefen:laufen|5iffen:eifen{gr,n,f,l}|5öffen:fen{sau,rie}|5älfen:elfen|5ärfen:erfen|5äfen:effen|5üfen:haffen|5ögen:en{ieh,g{ie{b,fl,w},sau}}|4ögen:ügen{l,tr}|5ängen:ingen|5ingen:fangen|4ingen:gehen|4ügen:agen{hl,tr}|5iegen:eigen{t,hw}|5ägen:liegen|5ärgen:ergen|5änden:inden{b,f,w}|4änden:stehen{ge,sver}|4ünden:tehen|4üden:laden|5ieden:eiden{h,m}|5ürden:werden|5ieben:eiben{bl,r}|4äben:geben|4üben:graben|4öben:eben{h,w}|5öben:tieben|5ärben:erben{st,w,d}|4iben:vergraben|5ächen:echen{r,t}|6ichen:eichen{l,tr,w}|6üschen:waschen|6öschen:dreschen|0:en{rlösch,wör,bär}|6öchen:riechen|5öchen:hstechen|4ähen:ehen{s,h}|5iehen:eihen|5öhen:liehen|5äßen:essen,sitzen|4ießen:oßen|5ießen:lassen,heißen|5ößen:mfließen|5ühren:fahren|5ören:en{ier{fr,rl},kies}|4ören:ren{he,gä}|4wären:sein|4oren:wären|5ielen:fallen|5öllen:ellen{hw,u}|5ählen:ehlen|5ännen:innen|5önnen:berspinnen|5ienen:heinen|5ölzen:elzen|5äken:hrecken|5änken:inken{r,t,s}|5ölken:melken|4ieen:eien{hr,p}|15schwömmen delfin:delfinschwimmen|16schwömmen delphin:delphinschwimmen|14schwömmen brust:brustschwimmen|9führen rad:radfahren~3e:ten{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:ten{el,er,eier}|3en:ten{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|6alte:hterhielten|3:rentwickelten|4un:täten|4uen:vertäten|5:ierten{skristallis,skompliment}|4:tkommerzialisierten|5imme:herschwämmen|5afen:schliefen|4egen:ewögen|4ieben:chöben|4essen:ausäßen~1ten:auskristallisiere|4ögen:erwägen|10führen:rad fahren|5üken:backen|4ßten:blassen|2ten:en{fehl,kenn,pinn}|5önnen:gewinnen|4änden:überstehen",
      "secondPlural": "1tet:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5ittet:abreiten|5äget:fliegen{au,e}|4öget:gen{we,wä}|5änget:abringen|2tet:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3ätet:tuen|5isset:cheißen|4iefet:lafen|4ßtet:lassen{rb,ran}|5öbet:hieben|5anntet:ortrennen|10führet:rad fahren|2ätet:un|4ieltet:alte|0rtet:ie|4ämmet:imme|0ertet:i|0tet:l~2tet:en,escheren|1tet:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ietet:raten|5ieltet:halten|7mailtet:-mailen|5ältet:gelten|5öltet:helten|5ätet:bitten|4ätet:reten|5üsstet:wissen|6ärstet:ersten|11hettoisiertet:ettoisieren|5ächtet:bringen,denken|5achtet:gedenken|3chtet:ögen|6öchtet:echten{f,l}|5anntet:ennen|4ßtet:ssen{a,pre,tre,ä}|5ittet:en{eid{l,hn},eit{gl,r}}|5öttet:sieden|4ättet:haben|5ötet:bieten|5andtet:bersenden|5isset:eißen|5össet:ießen|5osset:eschießen|4ieset:blasen|5ieset:eisen{w,pr}|4äset:esen{l,n}|6üchset:achsen|5ämet:ommen|5ähmet:ehmen|5ämmet:wimmen|5ömmet:limmen|4iefet:rufen|5iefet:laufen|5iffet:eifen{gr,n,f,l}|5öffet:fen{sau,rie}|5älfet:elfen|5ärfet:erfen|5äfet:effen|5üfet:haffen|5öget:en{ieh,g{ie{b,fl,w},sau}}|4öget:ügen{l,tr}|5änget:ingen|5inget:fangen|4inget:gehen|4üget:agen{hl,tr}|5ieget:eigen{t,hw}|5äget:liegen|5ärget:ergen|5ändet:inden{b,f,w}|4ändet:stehen{ge,sver}|4ündet:tehen|4üdet:laden|5iedet:eiden{h,m}|5ürdet:werden|5iebet:eiben{bl,r}|4äbet:geben|4übet:graben|4öbet:eben{h,w}|5öbet:tieben|5ärbet:erben{st,w,d}|4ibet:vergraben|5ächet:echen{r,t}|6ichet:eichen{l,tr,w}|6üschet:waschen|6öschet:dreschen|1t:en{rlösch,wör,bär}|6öchet:riechen|5öchet:hstechen|4ähet:ehen{s,h}|5iehet:eihen|5öhet:liehen|5äßet:essen,sitzen|4ießet:oßen|5ießet:lassen,heißen|5ößet:mfließen|5ühret:fahren|5öret:en{ier{fr,rl},kies}|4öret:ren{he,gä}|4oret:wären|5ielet:fallen|5öllet:ellen{hw,u}|5ählet:ehlen|5ännet:innen|5önnet:berspinnen|5ienet:heinen|5ölzet:elzen|5äket:hrecken|5änket:inken{r,t,s}|5ölket:melken|4ieet:eien{hr,p}|14schwömmt brust:brustschwimmen|5ämt:kommen{den,ibe}|5ähmt:nehmen{i,orlieb}|5öbt:eschieben|4wärt:sein|4äht:tsehen|15schwömmt delfin:delfinschwimmen|16schwömmt delphin:delphinschwimmen|9führet rad:radfahren~3e:tet{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:tet{el,er,eier}|3en:tet{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|6alte:hterhieltet|3:rentwickeltet|4un:tätet|4uen:vertätet|5:iertet{skristallis,skompliment}|4:tkommerzialisiertet|5imme:herschwämmet|5afen:schliefet|4egen:ewöget|4ieben:chöbet|4essen:ausäßet~1tet:auskristallisiere|4öget:erwägen|10führet:rad fahren|5ükt:backen|4ßtet:blassen|2tet:en{fehl,kenn,pinn}|5önnt:gewinnen|4ändet:überstehen",
      "thirdPlural": "1ten:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5itten:abreiten|5ägen:fliegen{au,e}|4ögen:gen{we,wä}|5ängen:abringen|2ten:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3äten:tuen|5issen:cheißen|4iefen:lafen|4ßten:lassen{rb,ran}|5öben:hieben|5annten:ortrennen|10führen:rad fahren|2äten:un|4ielten:alte|0rten:ie|4ämmen:imme|0erten:i|0ten:l~2ten:en,escheren|1ten:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ieten:raten|5ielten:halten|7mailten:-mailen|5älten:gelten|5ölten:helten|5äten:bitten|4äten:reten|5üssten:wissen|6ärsten:ersten|11hettoisierten:ettoisieren|5ächten:bringen,denken|5achten:gedenken,nderbringen|3chten:ögen|6öchten:echten{f,l}|5annten:ennen|4ßten:ssen{a,pre,tre,ä}|5itten:en{eid{l,hn},eit{gl,r}}|5ötten:sieden|4ätten:haben|5öten:bieten|5andten:bersenden|5issen:eißen|5össen:ießen|5ossen:eschießen|4iesen:blasen|5iesen:eisen{w,pr}|4äsen:esen{l,n}|6üchsen:achsen|5ämen:ommen|5ähmen:ehmen|5ämmen:wimmen|5ömmen:limmen|4iefen:rufen|5iefen:laufen|5iffen:eifen{gr,n,f,l}|5öffen:fen{sau,rie}|5älfen:elfen|5ärfen:erfen|5äfen:effen|5üfen:haffen|5ögen:en{ieh,g{ie{b,fl,w},sau}}|4ögen:ügen{l,tr}|5ängen:ingen|5ingen:fangen|4ingen:gehen|4ügen:agen{hl,tr}|5iegen:eigen{t,hw}|5ägen:liegen|5ärgen:ergen|5änden:inden{b,f,w}|4änden:stehen{ge,sver}|4ünden:tehen|4üden:laden|5ieden:eiden{h,m}|5ürden:werden|5ieben:eiben{bl,r}|4äben:geben|4üben:graben|4öben:eben{h,w}|5öben:tieben|5ärben:erben{st,w,d}|4iben:vergraben|5ächen:echen{r,t}|6ichen:eichen{l,tr,w}|6üschen:waschen|6öschen:dreschen|0:en{rlösch,wör,bär}|6öchen:riechen|5öchen:hstechen|4ähen:ehen{s,h}|5iehen:eihen|5öhen:liehen|5äßen:essen,sitzen|4ießen:oßen|5ießen:lassen,heißen|5ößen:mfließen|5ühren:fahren|5ören:en{ier{fr,rl},kies}|4ören:ren{he,gä}|4wären:sein|4oren:wären|5ielen:fallen|5öllen:ellen{hw,u}|5ählen:ehlen|5ännen:innen|5önnen:berspinnen|5ienen:heinen|5ölzen:elzen|5äken:hrecken|5änken:inken{r,t,s}|5ölken:melken|4ieen:eien{hr,p}|15schwömmen delfin:delfinschwimmen|16schwömmen delphin:delphinschwimmen|14schwömmen brust:brustschwimmen|9führen rad:radfahren~3e:ten{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:ten{el,er,eier}|3en:ten{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|6alte:hterhielten|3:rentwickelten|4un:täten|4uen:vertäten|5:ierten{skristallis,skompliment}|4:tkommerzialisierten|5imme:herschwämmen|5afen:schliefen|4egen:ewögen|4ieben:chöben|4essen:ausäßen~1ten:auskristallisiere|4ögen:erwägen|10führen:rad fahren|5üken:backen|4ßten:blassen|2ten:en{fehl,kenn,pinn}|5önnen:gewinnen|4änden:überstehen"
    },
    "imperative": {
      "singular": "1e:n|1:en{herberg,l{fal{m,ge,ber,n},rfeh},ss{la{b,n,ber,i},pre,tre},hdresch,bertret,verschreck,rtreff}|2:missen|13lerne:kennen lernen|10fahre:rad fahren|0:e|0re:ie~1:en,in|3le:eln|7maile:-mailen|1e:eln{twand,tbüg,c}|4iehe:tsehen|11hettoisiere:ettoisieren|6gefallen:fallen|15schwimm delfin:delfinschwimmen|16schwimm delphin:delphinschwimmen|4ib:geben|2:en{derschreib,slauf,sitz,ch{ma{sig,h,z,d,ß,tt},tko},enlass{h,g},lax}|5irb:erben{w,st,d}|5ilf:elfen|5iff:effen|5irf:erfen|4ß:lassen|5imm:ehmen|5ilz:elzen|5ich:echen{r,t}|6ich:echten{l,f}|6isch:schen{rlö,dre}|4ieh:ehen{s,h}|5iehl:ehlen|5ill:ellen{u,hw}|4itt:reten|14schwimm brust:brustschwimmen|5ilt:helten|5ick:hrecken|5ilk:melken|9fahre rad:radfahren|5irg:ergen|4ies:lesen|5iss:essen~1n:e{tu,er{,sch{t,ä},ei}}|0n:e{vertu,l{l,i,h,a,e,o,u,r,ö,ä,ü,c},er{qu,sch,i,rei,e,hw}}|2eln:chle|0:isiere{tbürokrat,al{tkoloni,tkommun,tkrimin,ution}}|2:tkommerzialisiere~10fahre:rad fahren|4ß:blassen|1:len{fal,feh}|6icht:echten{f,fl}|2:gerieren",
      "plural": "1t:n,e|2t:assen{l{bb,en,in,i},bf,nf,bp,np}|10fahrt:rad fahren|0rt:ie~2t:en|7mailt:-mailen|14schwimmt brust:brustschwimmen|1t:en{d,t,ni,n{ch,f,g,d,k,b,p,m},tm,dm,cl}|11hettoisiert:ettoisieren|4ßt:ssen{a,e{rfr,tr,rm,g},ä}|15schwimmt delfin:delfinschwimmen|16schwimmt delphin:delphinschwimmen|9fahrt rad:radfahren|1d:in~1n:t{tu,el,er{,sch{t,ä},ei}}|1en:t{vertu,el{i,e,w},er{qu,sch,i,rei,e,hw},spaß,maß}|1e:isiert{tbürokrat,al{tkoloni,tkommun,tkrimin,ution}}|2:tkommerzialisiert~4ßt:pressen{,er}|10fahrt:rad fahren"
    },
    "presentParticiple": {
      "presentParticiple": "1end:in,un|0nd:e,l|0erend:i~0d:n|9 schwimmend:schwimmen{st,fin,phin}|12schämend:fremdschämen|7mailend:-mailen|8sackend:absacken|11hettoisierend:ettoisieren~2:nd{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin},tbürokrat}}},rentwickel}|3n:end{tu,sei}|1:vertuend|5:ierend{skristallis,skompliment}~0nd:auskristallisiere"
    },
    "pastParticiple": {
      "pastParticiple": "1t:n{,e{t{ei{arb{e,er},egl,verl,gel,rbr,er},al{rsch,beinh,tf},rmie,rnie,rkne,t{rki,sta{e,r},rke,tfe,rschü,hro},s{rlei,rli,tmi,erü,trü,la{e,t,r},rdun,o{rk,tr,rr,fr},rtrö},ch{i{rd,rpfl,el,ber,err,tr,esch},eleu,efeu,rzü},lüf{e,t},r{rhä,thä,rwa,ta,we{e,t,r}},u{thä,rla,ede,rbe,rm,rchbl,rbl},rkan,rheira,rlö,rkno},d{ssbil,rmel,n{rfei,rble,ewe,hwe,rru,tzü},lei{ek,tk,rk,emit},re{e,zer,ber,b}},gn{rre,tei,rei}},el{t{rbet,rzet,rrüt,rschach,rwurs},k{rbröc,twic,rwic,rdun,rwin,rschau},s{rdros,rwech,rdrö,epin},d{n{a{h{ss,e,ver,c},rw},erschwi},rbud,sie{e,r}},p{rhas,tkop,tkup,rkup,zertram},b{rsä,rmö,drib,eju,verju},z{wur{nt,r},zermet},g{ie{tr,rr,tsp},rna,rprü},eträuf,ch{elä,tsta,rka},chimm,rsamm},er{t{t{tblä,rfü,zerschme,rspli,rgi,ewi,rfu},rkleis,rhei},d{rglie,rfor,eschil,rplau,tpu,rschleu,terwan,rän,rwi},u{e{ef,rf,rsch,est,rst},a{ed,rd,el,rm},rsä},b{zau{e,t,ver},hstö},rgaun,rdonn,rplapp,g{ela,rla,rhun,rär},f{lie{e,r},rei},ch{i{ts,rs,ns,ere},räu{h,r}},mm{kla{nt,r,m},tschlu},s{bes{r,m},rfa},rkell,rball}},e|8gearbeitet:terarbeiten|6geritten:abreiten|5oten:ebieten|6gebeten:herbitten|7gerichtet:herrichten|5geraten:raten|2t:en{g{efol,verfol,rtil,e{ekri,erl,rpfl,bel,rr},n{rdi,ä{edr,erdr,verh,eh},rla,ela,e{r,rspr,ranstr,verm}},i{erne,rzwe,rge,rkünd,ewill},a{r{ef,rf,eant,eauft,er},verj,rn,s{e,nt,ver,nter},ranschl},rsä,rwür,verfü,zerpflü},u{a{eb,erb,sch{e,rch},rst,tr{r,e,s},zerk,rs},e{r{st{e,ver,zer},rf},bsch}},z{ei{rr,eh,rh},t{i{spr{e,r},rsp,rschw},se{be,er{id,v,z,küb}},eglo,rkra,rpla,rschwa,enu,rpu,rschä,rstü,eschü},n{egre,a{pfl{e,r},fr,rsch}},thol,r{stü{e,ber},hme}},rschweiß,rbüß,m{m{ekle,verkle,rschwe,tsta,tfla,hra,sti{e,r}},rfil,r{erfo,eschi,mschwä,erwä},mrah,rträu,rsäu,strö{t,h},ezie,lei{sch{t,r},r}},f{rkau,rschnau,p{m{rda,zersta,ekä,rtru,eschi,li},rsto,rschö,rru,etu,rzu,rza,rknü,tschlü},ei{hstr,er,rst},f{a{sch{e,ver},rschl,eg},schi{r,m}},estra,rprü},l{l{e{st{e,nt,ver},tp,rd},a{unf,rkn,esch,rsch,verh},rfü,rknü,berro},h{a{ez,rz,str{e,r}},rkü,rwü,erwä,erzä,rko,rfe},ei{rch,rh,rt,ent,rk,e,w},erho{wied,b},ema,rma,rscha,rfau,rbeu,rspü},s{rgla,s{a{rbl,ranl,ef,rf,mf,rp},rpre},hbrau,rbrem,rlö,rmurk,rknack,ei{er,verr,rsp,tgl,t},rfran},b{fär{ent,r},reb,e{l{ek,rk,e,er,rch},rsi,erstr},au{rschr,er,tst,rst},rbom,o{rpr,tl,rl,el},rü,etrü},h{ü{rbl,rgl,rbr,espr,rspr,em},c{rsie,u{rb,es,ers,rsta,bra,rsche},rda,rfla,verma,s{u{tra,rra,rta,ttä},i{rw,ntw,rfr,verm},rfäl,t{ekla,rla,rqua,rru,tflu,rque},rfor,eherr,wün{lück,r}},rei{rab,e},ehor,eko,zerko},rdre,rwe,hmä,rnä,rspä,edro,eru},n{ertren,pen,die{e,r},h{rsö,rde,rma,rza,bewo,rwo},rtö,mzäu,ewei,rler,tker,rpla},k{n{eta,e{rs,rr,sch{e,r}}},c{e{ed,td,rd,rschr,rst},edru,ndru,espu,rü{ed,rd,rb,t,ver},a{rh,ep,tp,rp},rbli,rschi},r{eme,erme,ewi,rwi,tko},rwel},r{h{ü{ntf,verf,lf,er,verr},e{ek,verk,rw,rz},rchbo,erbo,ewä,rwä},e{schmi{e,r},tle},ehö,rhö,rklä,r{tschwi,rspe,rsta,rscha},rschnü,rspü,rspa},pp{rka,verschle,rti},rschnei}|6gelegen:fliegen{au,e}|5gelegt:erlegen{rüb,h,ed,u}|6gerungen:abringen|5ungen:lingen{verk,rsch}|6gelangt:erlangen{h,b}|5geragt:ufragen|5gewogen:wägen|4ogen:rwägen|5issen:eißen{rb,ntr,verr,zerr,esch,rschm}|5ossen:ießen{l{zerf,verf,mf,sch{e,t,r}},eg,verg,sch{zer,ver,e}}|6geräumt:orträumen|6geziemt:ziemen|7geschämt:schämen|6gezählt:berzählen|5ohlen:estehlen|5geeilt:eilen{ch,fort,ck}|6gelassen:derlassen|6gereist:ckreisen|7getrieben:hertreiben|0:egraben|5gelobt:loben|7gebrochen:derbrechen|6gedacht:dachen|6ichen:egleichen|6gestanden:erstehen{int,b,e}|4anden:gestehen|6gezogen:erziehen{h,b,nunt}|5annt:rennen{verb,tb,ver,ber}|6gerannt:rtrennen|5onnen:innen{bersp,tr,rr,er}|6geronnen:rinnen|7gedrückt:runterdrücken|5oren:efrieren|5gehört:herhören|8geschworen:schwären|7gewittert:wittern|0n:te|0rt:ie|8geschwommen:schwimme|9geschrumpft:schrumpfe|0ert:i|0t:l~2t:en{,iel{sp{e,er,m},rz},escher,spann{e,t,er}}|1t:n{e{t,d,n{verord,ch{ere,erre,zei{e,er}},g,rtrock,f,m},eatm,ekni,cl},hleier}|8gearbeitet:arbeiten|6geleitet:leiten|7gebreitet:breiten|6geweitet:weiten|5gebetet:beten|6gemietet:mieten|6genietet:nieten|6geknetet:kneten|7gebürstet:bürsten|7gedürstet:dürsten|7geforstet:forsten|7geleistet:leisten|6gelistet:listen|6gemistet:misten|6genistet:nisten|6gerüstet:rüsten|6getastet:tasten|6gelastet:lasten|6gerastet:rasten|6gefastet:fasten|6gehastet:hasten|7getoastet:toasten|5geästet:ästen|6gemästet:mästen|6getestet:testen|7gedunstet:dunsten|6gehustet:husten|6gepustet:pusten|7gefaustet:fausten|7gefrustet:frusten|7geprustet:prusten|6gekostet:kosten|6gerostet:rosten|7geprostet:prosten|6gepostet:posten|7getröstet:trösten|6geröstet:rösten|7gedichtet:dichten|7gelichtet:lichten|9gepflichtet:pflichten|7gerichtet:richten|9geschichtet:schichten|8gebeichtet:beichten|7gesichtet:sichten|8gefluchtet:fluchten|8geleuchtet:leuchten|8gefeuchtet:feuchten|7gebuchtet:buchten|7gewuchtet:wuchten|10geschlachtet:schlachten|6geachtet:achten{g,h}|10geschmachtet:schmachten|9geschachtet:schachten|11geweihnachtet:weihnachten|7gezüchtet:züchten|8geflüchtet:flüchten|7gehechtet:hechten|8geknechtet:knechten|6geächtet:ächten|7gedriftet:driften|5egiftet:ngiften|7gestiftet:stiften|6geliftet:liften|6geheftet:heften|8geschuftet:schuften|12gewirtschaftet:bwirtschaften|12gekundschaftet:kundschaften|6gehaftet:nhaften|6gelüftet:lüften|6gehärtet:härten|6gekartet:karten|6gewartet:warten|5geartet:arten|7gestartet:starten|6gewertet:werten|5egurtet:urten|7gespurtet:spurten|6gehortet:horten|6gehäutet:häuten|6geläutet:läuten|6gelautet:lauten|6gedeutet:deuten|6gebeutet:beuten|5gemutet:muten|6geblutet:bluten|6gesputet:sputen|5getutet:tuten|6gekantet:kanten|6geerntet:ernten|8gesprintet:sprinten|8geschaltet:schalten|6gefaltet:falten|6gezeltet:zelten|7gestattet:statten|6gekettet:ketten|6gebettet:betten|6gefettet:fetten|6gerettet:retten|8geschüttet:schütten|6gerottet:rotten|7getrottet:trotten|6gemottet:motten|7geplottet:plotten|6gekittet:kitten|6eglättet:lätten|7geplättet:plätten|6geputtet:putten|5getötet:töten|5gelötet:löten|6geflötet:flöten|6gebrütet:brüten|5gehütet:nhüten|5getütet:tüten|5gewütet:wüten|6geknotet:knoten|6gebootet:booten|5gelotet:loten|8geheiratet:heiraten|5gewatet:waten|6geskatet:skaten|5gejätet:jäten|7gepunktet:punkten|6getextet:texten|6gebildet:bilden|6gemeldet:melden|8geschuldet:mschulden|7geblendet:blenden|7gespendet:spenden|6gerindet:rinden|7gefeindet:feinden|6gerundet:runden|8gefreundet:freunden|7gestundet:stunden|6gezündet:zünden|6gemündet:münden|8geschändet:schänden|6gelandet:landen|7gebrandet:branden|8gestrandet:stranden|6geahndet:ahnden|7gefahndet:fahnden|5gerodet:roden|6geweidet:weiden|7gekleidet:kleiden|7gekreidet:kreiden|5geredet:reden|10gebauchredet:bauchreden|9geschmiedet:schmieden|4geödet:nöden|6gebürdet:bürden|6genordet:norden|5geerdet:erden|5gebadet:baden|6geloadet:loaden|6getradet:traden|5egradet:raden|6geordnet:ordnen|7gerechnet:rechnen|8gezeichnet:zeichnen|12gekennzeichnet:kennzeichnen|6gesegnet:segnen|6geregnet:regnen|6geeignet:eignen|8getrocknet:trocknen|5geebnet:ebnen|7gewappnet:wappnen|5geatmet:atmen|6gewidmet:widmen|5gekniet:knien|6gebalgt:balgen|6gefolgt:folgen|6getilgt:tilgen|9geschwelgt:schwelgen|7gedrängt:drängen|7gezwängt:zwängen|6gesengt:sengen|8gesprengt:sprengen|8gestrengt:strengen|6gemengt:mengen|5geengt:engen|6gelangt:langen|6gebangt:bangen|7geprangt:prangen|6gedüngt:düngen|5egongt:ongen|8gefertigt:fertigen|13gerechtfertigt:rechtfertigen|9genächtigt:nächtigen|9gezüchtigt:züchtigen|9gedemütigt:demütigen|6geneigt:neigen|7gezweigt:zweigen|6gezeigt:zeigen|4geigt:eigen|9geohrfeigt:ohrfeigen|8gekündigt:kündigen|8gehändigt:händigen|8gebändigt:bändigen|8gewürdigt:würdigen|8gepredigt:predigen|8gepeinigt:peinigen|9gesteinigt:steinigen|8gewilligt:willigen|8gebilligt:ubilligen|7gemäßigt:mäßigen|6gefragt:fragen|5geragt:ragen|5gejagt:jagen|5genagt:nagen|7gemanagt:managen|5gesagt:sagen|6geklagt:nklagen|6geplagt:plagen|5gewagt:wagen|7gekriegt:kriegen|9geschmiegt:schmiegen|5gelegt:legen|7gepflegt:pflegen|5geregt:regen|5gefegt:fegen|5gehegt:hegen|6gesaugt:saugen|11gestaubsaugt:staubsaugen|6gelaugt:laugen|6getaugt:taugen|5gefugt:sfugen|6gebeugt:beugen|5gelugt:lugen|8geschrägt:schrägen|6geprägt:prägen|5gesägt:sägen|6gewürgt:würgen|6geborgt:borgen|6gesorgt:orsorgen|6gesargt:sargen|5gefügt:fügen|7gepflügt:pflügen|7geflaggt:sflaggen|6gejoggt:joggen|6geloggt:loggen|7geröntgt:röntgen|5gebaut:bauen|6geflaut:flauen|7geschaut:schauen|5getaut:tauen|6gestaut:stauen|6getraut:trauen|5geraut:rauen|6gebraut:brauen|5gekaut:kauen|5gesaut:sauen|7gestreut:streuen|6gefreut:freuen|6gebleut:bleuen|7gescheut:scheuen|6gebläut:bläuen|5gekäut:käuen|6gebeizt:beizen|8gespreizt:spreizen|6gereizt:reizen|6geheizt:heizen|4geizt:izen|7geblitzt:blitzen|9geschlitzt:schlitzen|7geflitzt:flitzen|8gespritzt:spritzen|6geritzt:ritzen|7gespitzt:spitzen|9geschwitzt:schwitzen|9geschnitzt:schnitzen|6gehetzt:hetzen|6gesetzt:setzen|6gewetzt:wetzen|6gekotzt:kotzen|7getrotzt:trotzen|8gestrotzt:strotzen|7geprotzt:protzen|6eglotzt:lotzen|7geklotzt:klotzen|6gemotzt:motzen|7gekratzt:kratzen|6geratzt:ratzen|7geplatzt:platzen|9geschmatzt:schmatzen|9geschwatzt:schwatzen|6genutzt:nutzen|6geputzt:putzen|7gestutzt:stutzen|8geschätzt:schätzen|5geätzt:ätzen|7gestützt:stützen|8geschützt:schützen|6egrenzt:renzen|9gefaulenzt:faulenzen|9geschlenzt:schlenzen|6getanzt:tanzen|7gestanzt:stanzen|8gepflanzt:pflanzen|6geranzt:ranzen|8geschanzt:schanzen|6eglänzt:länzen|7gekränzt:kränzen|9geschwänzt:schwänzen|6egrunzt:runzen|6gemünzt:münzen|6geholzt:holzen|6gebolzt:bolzen|6gewälzt:wälzen|6gewalzt:walzen|6gebalzt:balzen|6gefalzt:falzen|9geschnalzt:schnalzen|6gesülzt:sülzen|6gekürzt:bkürzen|7gestürzt:stürzen|6gewürzt:würzen|9geschwärzt:schwärzen|6gemerzt:merzen|6gefurzt:furzen|6geharzt:harzen|7geknarzt:knarzen|7gequarzt:quarzen|7gekreuzt:kreuzen|9geschneuzt:schneuzen|9geschnauzt:schnauzen|9geschnäuzt:schnäuzen|5geduzt:duzen|8gejauchzt:jauchzen|10geschluchzt:schluchzen|7gejuchzt:juchzen|8gekrächzt:krächzen|6geächzt:ächzen|7geseufzt:seufzen|6gefläzt:fläzen|6gesiezt:siezen|7getriezt:triezen|7gestellt:stellen|6gepellt:pellen|9geschwellt:schwellen|6gewellt:wellen|6gehellt:fhellen|7gequellt:quellen|9geschnellt:schnellen|6gedellt:dellen|6gebellt:bellen|6gefüllt:füllen|7gebrüllt:brüllen|6gehüllt:nhüllen|7geknüllt:knüllen|7geknallt:knallen|9geschnallt:schnallen|7geprallt:prallen|7gekrallt:krallen|6gewallt:wallen|8geschallt:schallen|6gehallt:hallen|6geballt:ballen|6gelallt:lallen|6gerollt:rollen|7getrollt:trollen|9geschmollt:schmollen|6gesollt:sollen|6getollt:tollen|6gewollt:wollen|7gestillt:stillen|7gedrillt:drillen|6egrillt:rillen|7gechillt:chillen|6gekillt:killen|6gefällt:fällen|6gelullt:lullen|6genullt:nullen|8gestrullt:strullen|7gebettelt:betteln|7gezettelt:zetteln|7gesattelt:satteln|9geschüttelt:schütteln|7gerüttelt:rütteln|8gedrittelt:dritteln|7gebeutelt:beuteln|7gedeutelt:deuteln|10geschachtelt:schachteln|8gefuchtelt:fuchteln|8gewichtelt:wichteln|7getüftelt:tüfteln|8gewurstelt:wursteln|7gebastelt:basteln|8gefröstelt:frösteln|7genestelt:nesteln|7gemörtelt:mörteln|7geturtelt:turteln|8geviertelt:vierteln|8gebröckelt:bröckeln|7gewickelt:wickeln|7geruckelt:ruckeln|9geschuckelt:schuckeln|7gedunkelt:dunkeln|7gefunkelt:funkeln|7gemunkelt:munkeln|9geschunkelt:schunkeln|7gewinkelt:winkeln|7gepinkelt:pinkeln|6getakelt:takeln|7gezirkelt:zirkeln|7geferkelt:ferkeln|7gewerkelt:werkeln|7getorkelt:torkeln|5geekelt:ekeln|9geschaukelt:schaukeln|6egaukelt:aukeln|6gepökelt:pökeln|6gehäkelt:häkeln|6gemäkelt:mäkeln|6geräkelt:räkeln|8gedrosselt:drosseln|10geschlüsselt:fschlüsseln|7gerasselt:rasseln|8geprasselt:prasseln|8gequasselt:quasseln|7gekesselt:kesseln|7gefusselt:fusseln|7genässelt:nässeln|7gekapselt:kapseln|8gestöpselt:stöpseln|10geschnipselt:schnipseln|8gewechselt:wechseln|9gedeichselt:deichseln|7gesäuselt:säuseln|6egruselt:ruseln|9gestreuselt:streuseln|6gewuselt:wuseln|7gedröselt:dröseln|7gerieselt:rieseln|7genieselt:nieseln|7gepinselt:pinseln|7gewinselt:winseln|7gehänselt:hänseln|6gefaselt:faseln|7gekriselt:kriseln|6genäselt:näseln|7gehandelt:handeln|7gewandelt:wandeln|11gelustwandelt:lustwandeln|13geschlafwandelt:schlafwandeln|12getraumwandelt:traumwandeln|7gebandelt:bandeln|10geschwindelt:schwindeln|7gependelt:pendeln|7gebündelt:bündeln|7gezündelt:zündeln|6egondelt:ondeln|7getrudelt:trudeln|8gestrudelt:strudeln|8gesprudelt:sprudeln|6gedudelt:dudeln|6genudelt:nudeln|7gepaddelt:paddeln|7gebuddelt:buddeln|10geschmuddelt:schmuddeln|7gesiedelt:siedeln|7gefiedelt:fiedeln|6gewedelt:wedeln|6gefädelt:fädeln|6gemodelt:modeln|7gebrodelt:brodeln|6gerodelt:rodeln|6gejodelt:jodeln|7geblödelt:blödeln|5geadelt:adeln|6geradelt:radeln|6getadelt:tadeln|8gefremdelt:fremdeln|7gehaspelt:haspeln|7geraspelt:raspeln|7gelispelt:lispeln|7gekoppelt:koppeln|7gehoppelt:hoppeln|8gestoppelt:stoppeln|7gekuppelt:kuppeln|7gezappelt:zappeln|7gerappelt:rappeln|7gepäppelt:päppeln|8geknüppelt:knüppeln|7getippelt:tippeln|8getrippelt:trippeln|8gestempelt:stempeln|7gerempelt:rempeln|8gekrempelt:krempeln|9gestrampelt:strampeln|8getrampelt:trampeln|7gehampelt:hampeln|7gedümpelt:dümpeln|7gestapelt:stapeln|7egraupelt:raupeln|6gepopelt:popeln|6gehobelt:hobeln|7geknobelt:knobeln|6genabelt:nabeln|5egabelt:gabeln|6gesäbelt:säbeln|9geschwäbelt:schwäbeln|7gekurbelt:kurbeln|7gewirbelt:wirbeln|8gezwirbelt:zwirbeln|6gepöbelt:pöbeln|6gemöbelt:möbeln|7geribbelt:ribbeln|8gekribbelt:kribbeln|8gebrabbelt:brabbeln|8gekrabbelt:krabbeln|7gesabbelt:sabbeln|10geschwabbelt:schwabbeln|7gewabbelt:wabbeln|7gerubbelt:rubbeln|6gejubelt:jubeln|7gedoubelt:doubeln|6genebelt:nnebeln|7geknebelt:knebeln|8gezwiebelt:zwiebeln|6egrübelt:grübeln|6gedübelt:dübeln|6gekübelt:kübeln|7gekanzelt:kanzeln|8geblinzelt:blinzeln|7gerunzelt:runzeln|7getänzelt:tänzeln|7gewurzelt:wurzeln|7gepurzelt:purzeln|8gekritzelt:kritzeln|7gekitzelt:kitzeln|7gewitzelt:witzeln|7gemetzelt:metzeln|8gebrutzelt:brutzeln|8gefrotzelt:frotzeln|7geriegelt:riegeln|9gestriegelt:striegeln|8gespiegelt:spiegeln|7gewiegelt:wiegeln|6gekegelt:kegeln|7geflegelt:flegeln|6geregelt:regeln|8geklingelt:klingeln|7geringelt:ringeln|8gekringelt:kringeln|7getingelt:tingeln|10geschlängelt:schlängeln|8gedrängelt:drängeln|6egängelt:gängeln|7gezüngelt:züngeln|6geangelt:angeln|7gehangelt:hangeln|7gemangelt:mangeln|7gekungelt:kungeln|8gequengelt:quengeln|6genagelt:nageln|6gebügelt:bügeln|7geklügelt:klügeln|7geprügelt:prügeln|6gezügelt:zügeln|6gekugelt:kugeln|10geliebäugelt:liebäugeln|10geschmuggelt:schmuggeln|5geigelt:igeln|6egoogelt:oogeln|6gemogelt:mogeln|6egurgelt:urgeln|7genörgelt:nörgeln|6georgelt:orgeln|10geschmirgelt:schmirgeln|6gevögelt:vögeln|7geriffelt:riffeln|7gelöffelt:löffeln|7gebüffelt:büffeln|7gesüffelt:süffeln|7gemuffelt:muffeln|9gescheffelt:scheffeln|8gestaffelt:staffeln|8geträufelt:träufeln|9geschaufelt:schaufeln|8gezweifelt:nzweifeln|9geschwefelt:schwefeln|8gestiefelt:stiefeln|6egipfelt:ipfeln|8getröpfelt:tröpfeln|9geschwafelt:schwafeln|7gewürfelt:würfeln|11geschmeichelt:schmeicheln|10gestreichelt:streicheln|7gepichelt:picheln|8gestichelt:sticheln|7gelächelt:lächeln|7gefächelt:fächeln|8gestachelt:stacheln|7gekachelt:kacheln|7gehechelt:hecheln|9getätschelt:tätscheln|9gewatschelt:watscheln|8gekuschelt:kuscheln|9gemauschelt:mauscheln|8genuschelt:nuscheln|8getuschelt:tuscheln|8geraschelt:rascheln|8geheuchelt:heucheln|10gestrauchelt:straucheln|7geröchelt:röcheln|11geschnorchelt:schnorcheln|7gespielt:spielen|7gestielt:stielen|6gezielt:zielen|8geschielt:schielen|7gewimmelt:wimmeln|7gehimmelt:himmeln|7gebimmelt:bimmeln|7gesammelt:sammeln|8gestammelt:stammeln|7egrummelt:rummeln|9geschummelt:schummeln|7getummelt:tummeln|7gemümmelt:mümmeln|7gelümmelt:lümmeln|8getrommelt:trommeln|7geheimelt:heimeln|11gealtertümelt:altertümeln|7getaumelt:taumeln|7gebaumelt:baumeln|6gedamelt:dameln|7gemurmelt:murmeln|7gemeißelt:meißeln|5geißelt:ißeln|7gefrevelt:freveln|8geschwelt:schwelen|6geähnelt:ähneln|6gezahlt:zahlen|8gestrahlt:strahlen|7geprahlt:prahlen|6gekühlt:kühlen|6gefühlt:fühlen|6gewühlt:wühlen|6gewählt:wählen|6gezählt:zählen|6gekohlt:kohlen|6gesohlt:nsohlen|6gejohlt:johlen|6gehöhlt:höhlen|6gebuhlt:buhlen|6gesuhlt:suhlen|6gefeilt:feilen|6geheilt:heilen|6geseilt:seilen|6geteilt:teilen|8geurteilt:burteilen|10gevierteilt:vierteilen|6gekeilt:keilen|6gepeilt:peilen|4geilt:geilen|5geeilt:eilen|10gelangweilt:langweilen|8geemailt:e-mailen|5geholt:holen|5gepolt:polen|5gemalt:malen|7geschalt:schalen|5geaalt:aalen|6gequält:quälen|7geschält:schälen|6gespult:spulen|5gepult:pulen|6gefault:faulen|7gekrault:kraulen|6gejault:jaulen|6gemault:maulen|6gebeult:beulen|6geheult:heulen|7geschult:schulen|6gefoult:foulen|6gespült:spülen|4geölt:ölen|5egrölt:rölen|6geperlt:perlen|7geblasst:bblassen|6gefasst:fassen|6gepasst:passen|6gehasst:hassen|6geküsst:küssen|7gepresst:pressen|8gestresst:stressen|6gemusst:müssen|6gewusst:wissen|7gebraust:brausen|6egraust:rausen|7gekraust:krausen|6gesaust:sausen|6gepaust:pausen|9geschleust:schleusen|8geschmust:schmusen|7gebremst:bremsen|7geheimst:heimsen|6gebimst:bimsen|6gebumst:bumsen|5egrast:grasen|5gerast:rasen|5eglast:lasen|7geknapst:knapsen|6gejapst:japsen|6getapst:tapsen|7getrapst:trapsen|7geknipst:knipsen|5egipst:ipsen|8geplumpst:plumpsen|6gehopst:hopsen|6gemopst:mopsen|7gepiepst:piepsen|7gerülpst:rülpsen|5gelöst:lösen|5gedöst:dösen|7gemurkst:murksen|8geknackst:knacksen|8getrickst:tricksen|8geknickst:knicksen|8gedruckst:drucksen|7egluckst:lucksen|7gemuckst:mucksen|6gekokst:koksen|6gereist:reisen|7gekreist:kreisen|7gespeist:speisen|6egleist:leisen|5geeist:eisen|6egrinst:rinsen|7gefranst:fransen|6gehalst:halsen|6gehülst:hülsen|5gelost:slosen|5gedost:dosen|5getost:tosen|7gebrowst:browsen|5gedüst:düsen|7gefliest:fliesen|6geniest:niesen|5gepest:pesen|6gefräst:fräsen|6gelotst:lotsen|6gemorst:morsen|6geparst:parsen|8geschubst:schubsen|8geblättert:blättern|7gefüttert:füttern|10geschmettert:schmettern|8geklettert:klettern|7gewettert:wettern|9gesplittert:splittern|8geflittert:flittern|10geschlittert:schlittern|7gezittert:zittern|6egittert:gittern|8getwittert:twittern|8gestottert:stottern|10geschlottert:schlottern|9geschottert:schottern|7gefuttert:futtern|7gebuttert:buttern|8geflattert:herflattern|8geknattert:knattern|10geschnattert:schnattern|7gerattert:rattern|8gehalftert:halftern|7gemustert:mustern|8geplustert:plustern|9geschustert:schustern|8gepolstert:polstern|8geflüstert:flüstern|9gekleistert:kleistern|8gemeistert:meistern|8geknistert:knistern|8gehamstert:hamstern|7gelästert:lästern|7gerastert:rastern|7geheitert:heitern|9gescheitert:scheitern|7gemuntert:muntern|6geentert:entern|7gekentert:kentern|7gekontert:kontern|7gefiltert:filtern|7gekeltert:keltern|7gefoltert:foltern|7gepoltert:poltern|9geschultert:schultern|9getrichtert:trichtern|7gedoktert:doktern|7gemeutert:meutern|6gefedert:federn|6geledert:ledern|7gebiedert:biedern|7egliedert:liedern|7gefiedert:fiedern|7gefordert:fordern|7gemildert:mildern|9geschildert:schildern|7gewildert:wildern|6gerudert:rudern|8geplaudert:plaudern|9geschaudert:schaudern|7gezaudert:zaudern|6gepudert:pudern|10geschleudert:schleudern|7gesondert:sondern|7gewandert:wandern|6geändert:ändern|8geplündert:plündern|7gelindert:lindern|10geschlendert:schlendern|6geködert:ködern|6gewidert:widern|10geschneidert:schneidern|6gelodert:lodern|6gehadert:hadern|6gerädert:rädern|6gefeiert:feiern|6geleiert:leiern|5geeiert:eiern|6geziert:uszieren|9geschmiert:schmieren|8gepoliert:kpolieren|14oktroyiert:aufoktroyieren|6gefeuert:feuern|8gescheuert:scheuern|6geheuert:heuern|7gesteuert:steuern|6gedauert:dauern|6gelauert:lauern|6gemauert:mauern|6gekauert:kauern|7getrauert:trauern|10gebildhauert:bildhauern|6gesäuert:säuern|7gefiebert:fiebern|8geknabbert:knabbern|7gelabbert:labbern|10geschlabbert:schlabbern|7gebibbert:bibbern|7eglibbert:libbern|8geblubbert:blubbern|7gezaubert:zaubern|7gesäubert:säubern|7gestöbert:stöbern|6gelabert:labern|6egaunert:aunern|7gedonnert:donnern|7gebohnert:bohnern|11gesaugbohnert:saugbohnern|7egärtnert:ärtnern|8gekellnert:kellnern|9geklempnert:klempnern|10geschreinert:schreinern|7gewienert:wienern|8geklappert:klappern|8geplappert:plappern|7geläppert:läppern|8geflippert:flippern|9gescheppert:scheppern|8geklimpert:klimpern|8gestümpert:stümpern|6gehapert:hapern|6gekapert:kapern|6getapert:tapern|7geholpert:holpern|8gestolpert:stolpern|7gekaspert:kaspern|8geknuspert:knuspern|8geräuspert:räuspern|7gewispert:wispern|6gelagert:lagern|6gemagert:magern|7gebaggert:baggern|8geprangert:prangern|7gehungert:hungern|7gelungert:lungern|10geschlingert:schlingern|10geschwängert:schwängern|7gebürgert:bürgern|6geärgert:ärgern|6getigert:tigern|7gefolgert:folgern|7gepilgert:pilgern|7geliefert:liefern|9geschiefert:schiefern|6geopfert:opfern|7getöpfert:töpfern|5geufert:ufern|9geschläfert:schläfern|6geeifert:eifern|7geschert:scheren|10gezwitschert:zwitschern|10geplätschert:plätschern|7geäschert:äschern|7gesichert:sichern|9gespeichert:speichern|8gereichert:reichern|7gekichert:kichern|8geräuchert:räuchern|7gebechert:bechern|7gefächert:fächern|8gestochert:stochern|6genähert:nähern|7gereihert:reihern|7gewiehert:wiehern|8geklammert:klammern|7gejammert:jammern|7gedämmert:dämmern|7gehämmert:hämmern|9geschimmert:schimmern|7gezimmert:zimmern|8geflimmert:flimmern|7eglimmert:glimmern|7gewimmert:wimmern|10geschlummert:schlummern|8gestromert:stromern|7gebessert:bessern|10geschlossert:schlossern|6gefasert:fasern|6gemasert:masern|8geknausert:knausern|7gemausert:mausern|6gemosert:mosern|8gesponsert:sponsern|7gelockert:lockern|10geschleckert:schleckern|7gemeckert:meckern|8geflackert:flackern|8geklackert:klackern|7egluckert:luckern|7gebunkert:bunkern|8geflunkert:flunkern|8gezwinkert:zwinkern|10geschlenkert:schlenkern|7gekerkert:kerkern|6geimkert:imkern|9geschmökert:schmökern|6gepowert:powern|6geleert:leeren|6geteert:teeren|7gekellert:kellern|7geballert:ballern|7gebullert:bullern|9geschillert:schillern|8getrillert:trillern|8geträllert:trällern|13geschauspielert:schauspielern|9geschmälert:schmälern|9getischlert:tischlern|7gepanzert:panzern|6geführt:führen|6gerührt:rühren|6gekehrt:kehren|6gewehrt:wehren|6gezehrt:zehren|6gebohrt:bohren|6gebahrt:bahren|6gewährt:währen|5gehört:hören|6geklärt:klären|8geschirrt:schirren|9geschwirrt:schwirren|5geirrt:herirren|7geklirrt:klirren|7gesperrt:sperren|6gezerrt:rtzerren|7gestarrt:starren|8gescharrt:scharren|6geharrt:orharren|7geknarrt:knarren|6gebarrt:barren|6gekarrt:karren|6gedörrt:dörren|5egurrt:urren|7geknurrt:knurren|9geschnurrt:schnurren|6gemurrt:murren|6gesurrt:surren|6gezurrt:zurren|9geschnorrt:schnorren|8geschnürt:schnüren|6gespürt:spüren|7geschürt:schüren|6gespart:sparen|9gebauspart:bausparen|6geklart:klaren|7geschart:scharen|6gepaart:paaren|4egart:garen|8geschmort:schmoren|6gespurt:spuren|6geblüht:blühen|5eglüht:lühen|6gebrüht:brühen|7gesprüht:sprühen|5gemüht:mühen|7gebracht:bringen|5acht:en{bring{ver,ber,l},denk{e,ver}}|6gedacht:denken|7geflacht:bflachen|6gelacht:lachen|10gehohnlacht:hohnlachen|6gemacht:machen|6gefacht:anfachen|6gewacht:fwachen|6gebucht:buchen|6gesucht:suchen|7getaucht:tauchen|8gestaucht:stauchen|7gefaucht:fauchen|7gehaucht:hauchen|8gebraucht:fbrauchen|7geraucht:rauchen|7gebaucht:bauchen|10geschlaucht:schlauchen|9gescheucht:scheuchen|6gedeucht:dünken|7gekeucht:keuchen|7geduscht:duschen|8gerauscht:rauschen|8gebauscht:bauschen|8getauscht:tauschen|9geplauscht:plauschen|8getäuscht:täuschen|7gehuscht:huschen|7gekuscht:kuschen|7gepuscht:puschen|7gefischt:fischen|7gewischt:wischen|7gezischt:zischen|8gefrischt:frischen|7getischt:tischen|7gemischt:mischen|9gekreischt:kreischen|8gefälscht:fälschen|9gefeilscht:feilschen|8egrätscht:rätschen|9geklatscht:klatschen|8gelatscht:latschen|9geplatscht:platschen|9gequatscht:quatschen|8gepatscht:patschen|9geknutscht:knutschen|8gerutscht:rutschen|8geputscht:putschen|9geflutscht:flutschen|8gelutscht:lutschen|9gedeutscht:deutschen|9gequetscht:quetschen|11gedolmetscht:dolmetschen|9gefletscht:fletschen|10gequietscht:quietschen|8eglitscht:litschen|9gepeitscht:peitschen|9gepritscht:pritschen|8getitscht:titschen|9gepantscht:pantschen|8gepirscht:pirschen|8geforscht:forschen|9geherrscht:herrschen|8egrabscht:rapschen|8gewünscht:wünschen|9geflanscht:flanschen|9geplanscht:planschen|8gepanscht:panschen|8geprescht:preschen|11gemähdrescht:mähdreschen|7gehorcht:horchen|8gepfercht:pferchen|10geschnarcht:schnarchen|6gekocht:kochen|6gelocht:lochen|5gemocht:mögen|6gepocht:pochen|7gereicht:reichen|7geweicht:weichen|7gedeicht:deichen|6geeicht:eichen|9geehelicht:ehelichen|9geschwächt:schwächen|6gerächt:rächen|7gesiecht:siechen|6gezecht:zechen|7geblecht:blechen|9gestrolcht:strolchen|6gedreht:drehen|6gefleht:flehen|5geweht:wehen|5gemäht:mähen|5genäht:nähen|6gebläht:blähen|6gespäht:spähen|6gekräht:krähen|5gesäht:sähen|6gedroht:drohen|6gerauht:rauhen|5geruht:ruhen|5gebuht:buhen|6gereiht:reihen|6geweiht:weihen|5annt:ennen|7gebrannt:brennen|6gerannt:rennen|6gekannt:skennen|7gespannt:spannen|7getrennt:trennen|7geflennt:flennen|6gekonnt:können|6gesonnt:sonnen|6gepinnt:pinnen|6gedient:dienen|9geargwöhnt:argwöhnen|6gesöhnt:söhnen|7gedröhnt:dröhnen|6geföhnt:föhnen|7geklöhnt:klöhnen|6gelöhnt:löhnen|6gelehnt:lehnen|6gedehnt:dehnen|6gesehnt:sehnen|6gesahnt:sahnen|6gebahnt:bahnen|6gemahnt:mahnen|6gezahnt:zahnen|6gewohnt:wohnen|5egähnt:gähnen|5getönt:tönen|5gefönt:fönen|6geklönt:klönen|6gekrönt:krönen|6gezäunt:zäunen|6geraunt:raunen|8gestreunt:streunen|6geleint:leinen|6geweint:weinen|6gemeint:meinen|6gelernt:lernen|6gekernt:kernen|7gespornt:spornen|6getörnt:törnen|6gewarnt:orwarnen|6geturnt:turnen|6geplant:planen|8geschwant:schwanen|6geclont:clonen|6geklont:klonen|6getränt:tränen|5gebüßt:büßen|5gemaßt:maßen|8gemutmaßt:mutmaßen|6gepaßt:neinpassen|6gespaßt:spaßen|6gefaßt:fassen{h,ter}|7gepreßt:pressen{an,in,h}|7gespießt:spießen|9geschweißt:schweißen|6geflößt:flößen|6genäßt:nässen|4ßt:tnässen|5gefußt:fußen|7gedampft:dampfen|8gestampft:stampfen|8gekrampft:nkrampfen|7gekämpft:kämpfen|7gedämpft:dämpfen|8gestumpft:stumpfen|10geschrumpft:schrumpfen|8getrumpft:trumpfen|9geschimpft:schimpfen|6geimpft:impfen|7gerümpft:rümpfen|7geklopft:klopfen|7getropft:tropfen|8gepfropft:pfropfen|7gestopft:stopfen|6getopft:topfen|7geknöpft:knöpfen|9geschröpft:schröpfen|8geschöpft:schöpfen|6geköpft:köpfen|6gerupft:rupfen|6getupft:tupfen|6gezupft:zupfen|6gelupft:lupfen|6gezapft:zapfen|7gestapft:stapfen|7geknüpft:knüpfen|9geschlüpft:schlüpfen|6gehüpft:hüpfen|6gekauft:kaufen|9geschnauft:schnaufen|6getauft:taufen|6gerauft:raufen|6gestuft:stufen|7geträuft:träufen|8geschafft:schaffen{b,an,g}|9geschlafft:schlaffen|7geblafft:blaffen|7geklafft:klaffen|5egafft:affen|6gerafft:raffen|6gepafft:paffen|8geschifft:schiffen|6gekifft:kiffen|5geäfft:äffen|7gekläfft:kläffen|7geknufft:knuffen|6gemufft:muffen|9geschleift:schleifen|9geschweift:schweifen|6geseift:seifen|7gesteift:steifen|8gestreift:streifen|6gereift:reifen|6gekeift:keifen|8geschürft:schürfen|9geschlürft:schlürfen|8geschärft:nschärfen|6gedurft:dürfen|7gestraft:strafen|6geprüft:prüfen|9geschnieft:schniefen|7getrieft:triefen|5egolft:olfen|6gedankt:bdanken|6getankt:tanken|6gezankt:zanken|7geflankt:flanken|9geschwankt:schwanken|6gewankt:wanken|6gelenkt:lenken|9geschwenkt:schwenken|6gesenkt:senken|6gerenkt:renken|8geschenkt:schenken|9geschminkt:schminken|6gewinkt:winken|7geklinkt:klinken|7geblinkt:blinken|6gehinkt:hinken|6gefunkt:funken|6getunkt:tunken|5geunkt:unken|9geschränkt:nschränken|6gedeckt:decken|9geschreckt:schrecken|8gestreckt:strecken|7gesteckt:stecken|6geweckt:fwecken|7gecheckt:checken|8gequieckt:quiecken|9geschmeckt:schmecken|7gedruckt:drucken|7gespuckt:spucken|6geduckt:ducken|6gekuckt:kucken|6gezuckt:zucken|7gedrückt:drücken|6gerückt:rücken|6gebückt:bücken|9geschmückt:schmücken|6gehackt:hacken|6gepackt:packen|8gesackt:absacken|7geknickt:knicken|6genickt:nicken|7geblickt:blicken|8geschickt:schicken|7gespickt:spicken|6gekickt:kicken|7gestockt:stocken|7geflockt:flocken|6gedockt:docken|6gehockt:hocken|8geschockt:schocken|5gehakt:haken|6gequakt:quaken|6gemerkt:merken|6gewerkt:werken|6geparkt:parken|11gebrandmarkt:brandmarken|6gewirkt:wirken|6gekorkt:korken|6getürkt:türken|6gemelkt:melken|6gewelkt:welken|7gestalkt:stalken|6gebölkt:bölken|5gelikt:liken|6gepaukt:pauken|6gespukt:spuken|6geblökt:blöken|6gekiekt:kieken|6gedarbt:darben|6gefärbt:färben|6gekerbt:kerben|4gerbt:gerben|5geebbt:ebben|6gejobbt:jobben|6gerobbt:robben|9geschrubbt:schrubben|7geklaubt:klauben|6eglaubt:glauben|9geschraubt:schrauben|6geraubt:rauben|7gestaubt:stauben|9geschnaubt:schnauben|8gesträubt:sträuben|6geklebt:kleben|5gelebt:leben|7gestrebt:streben|6gesiebt:sieben|6geliebt:derlieben|5gewebt:weben|8geschwebt:schweben|7geschabt:schaben|5gehabt:haben|9gehandhabt:handhaben|6getrabt:traben|5gelabt:laben|6gebombt:bomben|5getobt:toben|6geprobt:proben|4geübt:üben|6getrübt:trüben|6gesalbt:salben|6gekalbt:kalben|6gewölbt:wölben|6gedämmt:dämmen|6gekämmt:kämmen|9geschlämmt:schlämmen|7geflämmt:flämmen|7geklemmt:klemmen|9geschlemmt:schlemmen|9geschwemmt:schwemmen|7gestemmt:stemmen|7gestammt:stammen|7geflammt:flammen|6gerammt:rammen|7gestimmt:stimmen|7gebrummt:brummen|6gefilmt:filmen|6geformt:formen|6genormt:normen|8geschirmt:schirmen|6gefirmt:firmen|7gestürmt:stürmen|6getürmt:türmen|6gewärmt:wärmen|9geschwärmt:schwärmen|6gelärmt:lärmen|6gewurmt:wurmen|6geräumt:räumen|7geträumt:träumen|8geschäumt:schäumen|6gezäumt:zäumen|6gebäumt:bäumen|6gesäumt:säumen|8gepflaumt:pflaumen|7geströmt:strömen|6gecremt:cremen|6geleimt:leimen|9geschleimt:schleimen|6gekeimt:keimen|6gereimt:reimen|5gesamt:ansamen|6gekramt:kramen|6gerahmt:rahmen|5geahmt:hahmen|6gerühmt:rühmen|6gelähmt:lähmen|6gezähmt:zähmen|6geboomt:boomen|12geschämt:fremdschämen|6gekappt:kappen|9geschnappt:schnappen|7geklappt:klappen|6gelappt:lappen|9geschlappt:schlappen|6getappt:tappen|7getrappt:trappen|6gepappt:pappen|9geschwappt:schwappen|9geschleppt:schleppen|7gesteppt:steppen|6geneppt:neppen|7gestoppt:stoppen|6getoppt:toppen|6gepoppt:poppen|7gefloppt:floppen|6gefoppt:foppen|6gehoppt:hoppen|8geschoppt:schoppen|6getippt:tippen|7gestippt:stippen|7geflippt:flippen|6gekippt:kippen|6gedippt:dippen|6genippt:nippen|9geschnippt:schnippen|6gerippt:rippen|8gestrippt:strippen|6gewippt:wippen|7gefluppt:fluppen|6gepumpt:pumpen|7gestülpt:stülpen|5gedopt:dopen|5gehupt:hupen|5gepupt:pupen|6gepiept:piepen|6geskypt:skypen|6gesandt:senden|5andt:enden{ts,vers,bers,tw,rw}|6gewandt:wenden|5gefaxt:faxen|5gefixt:fixen|5gemixt:mixen|5gebüxt:büxen|5geboxt:boxen|4gesät:säen|6gehievt:hieven|6gekurvt:kurven|8geschneit:schneien|5gefeit:feien|0:en{t{al{h{be,er{t,v,r,k},nt},rsp},tre{be,ver,zer},ra{e,verb,r,s}},s{s{rge,rfre,rme,la{e,nt,r}},zerbla,erle,ne,wach{e,r}},komm{be,nt,ver,ber},f{u{er,derr,la{e,nt,er{v,z,nt,b}}},schla{t,r}},g{fan{r,p},a{schl{e,ver,zer,at},etr,vertr}},lad{e,t,er},b{ge{e,ver,ber,um},rgra},eh{ers{s,v,b},h},fahr{e,rch,ver,der},l{fal{e,nt,ss,ver,zer},rmah},hau{e,ver,zer},rsalz,verstoß,rheiß}|6gehalten:halten|7gespalten:spalten|4golten:elten|5olten:rgelten|8gescholten:schelten|6gebeten:bitten|5eten:rbitten|6getreten:treten|6eglitten:gleiten|5itten:en{eit{tgl,r{sch{e,h,ter,ber},est,rst}},eid{rl,schn{e,er}}}|6gelitten:leiden|6geritten:reiten|9geschritten:schreiten|8gestritten:streiten|9geschnitten:schneiden|5geraten:abraten|6gebraten:braten|6geboten:bieten|5oten:erbieten|7gefochten:fechten|6ochten:echten{rf,rfl,hfl}|8geflochten:flechten|7geborsten:bersten|5issen:eißen|6gebissen:beißen|6gerissen:reißen|8geschissen:scheißen|9geschmissen:schmeißen|8gesplissen:spleißen|5gegessen:essen|7gefressen:fressen|6gemessen:messen|6gesessen:sitzen|5essen:besitzen|5ossen:ießen|7geflossen:fließen|9geschlossen:schließen|5egossen:gießen|8geschossen:schießen|8gesprossen:sprießen|6gelassen:lassen|6geblasen:blasen|5gelesen:lesen|5iesen:weisen{e,er}|6gewiesen:weisen|7gepriesen:preisen|4gewesen:sein|7gewachsen:wachsen|6gekommen:kommen|5ommen:men{neh{e,nt,ver,ber},im{rschw,rgl,kl}}|6genommen:nehmen|9geschwommen:schwimmen|9 geschwommen:schwimmen{st,fin,phin}|6eglommen:limmen|5gerufen:rufen|6gelaufen:laufen|5iffen:eifen{gr{e,rer,ver},rkn,rpf}|6egriffen:greifen|7gekniffen:kneifen|7gepfiffen:pfeifen|5offen:fen{sau{e,r},tref{e,r}}|6gesoffen:saufen|7getroffen:treffen|8geschaffen:schaffen|5olfen:helfen{e,ver}|6geholfen:helfen|5orfen:werfen{e,ver,ter,nt}|6geworfen:werfen|8geschlafen:schlafen|6gebogen:biegen|5ogen:en{ieg{erb{v,z},fl{h,nt,ver,ber},erw},zieh{e,er,nt,l}}|7geflogen:fliegen|4ogen:ügen{el,r}|5gelogen:lügen|6gewogen:wiegen|6gezogen:ziehen|6gedungen:dingen|5ungen:ingen{l,r{sp{nt,ver,zer},rchd},es}|7geklungen:klingen|9geschlungen:schlingen|6gerungen:ringen|8gesprungen:springen|7gedrungen:dringen|7gewrungen:wringen|9geschwungen:schwingen|7gezwungen:zwingen|6gesungen:singen|6gefangen:fangen|3gangen:ehen|4angen:gehen{be,nt,er{v,int,z}}|6gehangen:hängen|8geschlagen:schlagen|6getragen:tragen|5iegen:eigen{st{e,t,ber},rschw}|7gestiegen:steigen|9geschwiegen:schweigen|6gelegen:liegen|5egen:terliegen|5orgen:verbergen|6gebunden:binden|5unden:inden{tb,erb,ef,pf,rsch,w{sch{t,r},er}}|6gefunden:finden|8geschunden:schinden|6gewunden:winden|9geschwunden:schwinden|6gestanden:stehen|4anden:stehen{be,er,nt}|5geladen:laden|8geschieden:scheiden|5ieden:eiden{sch{t,r},m}|6geworden:werden|7geblieben:bleiben|5ieben:eiben{verbl,r{sch{e,ver},et,ert,r}}|6gerieben:reiben|9geschrieben:schreiben|7getrieben:treiben|3geben:geben|5egraben:raben|4oben:heben{e,ver,t}|5gehoben:heben|8geschoben:schieben|5oben:verschieben|7gestoben:stieben|7gestorben:sterben|5orben:erben{rst,ew,rw,mw,d}|6geworben:werben|7gebrochen:brechen|5ochen:echen{r{hb,erb,sp{e,nt,er}},est,zerst}|8gesprochen:sprechen|8gekrochen:kriechen|6ochen:verkriechen|7gerochen:riechen|7gestochen:stechen|7eglichen:leichen|6ichen:eichen{l{rg,sch{e,nt},erb},rstr,tw}|10geschlichen:schleichen|8geblichen:bleichen|9gestrichen:streichen|7geloschen:löschen|6oschen:schen{rlö,rdre}|8gedroschen:dreschen|7gewaschen:waschen|5gesehen:sehen|5iehen:eihen|6geliehen:leihen{s,her}|5ohen:iehen|6gefahren:fahren|7gefroren:frieren|4oren:ren{schwö{e,r},rsche,bä}|8geschworen:schwören|5oren:kiesen,rlieren|4egoren:ären|6gefallen:fallen|6gemahlen:mahlen|5ohlen:ehlen|7gestohlen:stehlen|5onnen:innen|7gesponnen:spinnen|6gesonnen:hsinnen|5ienen:escheinen|8geschienen:scheinen|5gehauen:hauen|9geschmolzen:schmelzen|5olzen:rschmelzen|6gesalzen:salzen|6gestoßen:stoßen|6geheißen:heißen|5unken:inken{etr,rtr,rst,ts,vers}|7getrunken:trinken|7gestunken:stinken|6gesunken:sinken|6gebacken:backen|4ien:schreien{e,ver}|8geschrien:schreien|6gespien:speien|3an:tuen|3getan:tun~1e:t{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur}}|1en:t{beglotz,begrenz,eel,r{e{i,qu,hw,e},gehö{n,rher,u}},begrabsch,ann{b,m},begaff}|1n:elt,ert|1:rentwickelt,hterhalten|3:iert{skristallis,skompliment}|2:tkommerzialisiert|7dachen:bgedacht|11schrumpfe:engeschrumpft|7raten:geraten{an,u}|11schwimme:rgeschwommen|5ehen:ugestanden|0:begraben|5eichen:beglichen~1t:auskristallisiere,ten{erbe,ertas,gelei,gestat}|5ossen:ießen{durchfl,erg,ersch}|4anden:stehen{ge,einge,über}|5acht:erbringen,erdenken|0:en{fahr{er,über,um},ergeb,erhalt,erlauf,erschaff,ag{erschl,ertr{,üb}},erseh,überfall}|5unden:erfinden|2t:en{erfolg,erhäng,l{l{erha,erste{,üb}},erho,erei},erkämpf,ch{rei{er,über,ge},gehor},ersehn,ersetz,erstreck,app{ert,überl},gehör,gewähr,überführ,überschau}|5iffen:ergreifen|4oben:erheben|5ungen:ingen{erkl,err,erzw}|5egen:erliegen|5ienen:erscheinen|6ichen:erschleichen|4ogen:erwägen|6gezählt:herzählen|5ogen:umfliegen,überziehen|6geachtet:achten|5geahmt:ahmen|5geahnt:ahnen|6gealbert:albern|6gealtert:altern|6geankert:ankern|9geantwortet:antworten|6gebannt:bannen|6geborgen:bergen|5gebebt:beben|8gebilligt:billigen|7geblaßt:blassen|8gebraucht:brauchen|7gebrüstet:brüsten|7gebummelt:bummeln|7geböllert:böllern|6gebürgt:bürgen|6gedacht:dachen|6gedankt:danken|7gedoppelt:doppeln|7gedrahtet:drahten|8gedribbelt:dribbeln|6geduftet:duften|6geduldet:dulden|7gedurstet:dursten|6geduselt:duseln|6gedünnt:dünnen|7gedünstet:dünsten|5geehrt:ehren|5geeint:einen|7geeinigt:einigen|6geeitert:eitern|5geendet:enden|5geerbt:erben|6gefacht:fachen|6gefehlt:fehlen|7gefesselt:fesseln|8gefestigt:festigen|6gefetzt:fetzen|6gefilzt:filzen|7geflacht:flachen|7geflaggt:flaggen|8geflattert:flattern|7gefleckt:flecken|8gefleddert:fleddern|7geflohen:fliehen|7geflucht:fluchen|6geflutet:fluten|8gefrachtet:frachten|7gefranzt:franzen|7gefristet:fristen|8gefruchtet:fruchten|5gefugt:fugen|7gefummelt:fummeln|7gefördert:fördern|8gefürchtet:fürchten|6egammelt:gammeln|4egast:gasen|4gehrt:gehren|6geistert:geistern|5egiert:gieren|5egiftet:giften|8eglupscht:glupschen|6eglückt:glücken|6egrault:graulen|5egrämt:grämen|6egründet:gründen|5egrüßt:grüßen|5eguckt:gucken|5egönnt:gönnen|6gehaart:haaren|6gehaftet:haften|6gehagelt:hageln|6geharrt:harren|7gehascht:haschen|6gehaust:hausen|6gehellt:hellen|6gehemmt:hemmen|6geherzt:herzen|5gehext:hexen|7gehindert:hindern|6gehofft:hoffen|8gehuldigt:huldigen|8gehäckselt:häckseln|9gehätschelt:hätscheln|6gehäuft:häufen|6gehüllt:hüllen|5gehütet:hüten|5geirrt:irren|6gekakelt:kakeln|6gekalkt:kalken|6gekannt:kennen|6geklagt:klagen|6geklaut:klauen|8gekleckert:kleckern|8gekleckst:klecksen|7geklommen:klimmen|7gekloppt:kloppen|7geklumpt:klumpen|8geklüngelt:klüngeln|7geknackt:knacken|10geknautscht:knautschen|9geknirscht:knirschen|8geknittert:knittern|6gekokelt:kokeln|7gekracht:krachen|8gekrampft:krampfen|7gekrankt:kranken|9gekreuzigt:kreuzigen|9gekräftigt:kräftigen|8gekräuselt:kräuseln|7gekrümelt:krümeln|7gekrümmt:krümmen|7gekümmert:kümmern|5gekürt:küren|6gekürzt:kürzen|6gelahmt:lahmen|8gelauscht:lauschen|6gelaust:lausen|6gelehrt:lehren|6geleibt:leiben|7geleugnet:leugnen|6geliebt:lieben|6geliehen:leihen|6gelockt:locken|6gelohnt:lohnen|5gelost:losen|7gelottert:lottern|7gelöchert:löchern|7gemampft:mampfen|7gemartert:martern|6gemehrt:mehren|6gemieden:meiden|6gemieft:miefen|5gemimt:mimen|7gemindert:mindern|6gemisst:missen|7gemittelt:mitteln|6gemordet:morden|6gemundet:munden|6genannt:nennen|6genarrt:narren|7genascht:naschen|6genebelt:nebeln|6geneidet:neiden|6genervt:nerven|6genährt:nähren|5genölt:nölen|7genötigt:nötigen|6genützt:nützen|6geordert:ordern|5geortet:orten|7gepachtet:pachten|6gepatzt:patzen|6gepennt:pennen|6gepetzt:petzen|8gepfeffert:pfeffern|8gepflückt:pflücken|8gepfuscht:pfuschen|7gepfändet:pfänden|6gepickt:picken|7gepieselt:pieseln|6gepisst:pissen|8geplempert:plempern|6gepokert:pokern|7geprellt:prellen|6gepufft:puffen|7gepulvert:pulvern|7gequalmt:qualmen|7gequirlt:quirlen|7gerammelt:rammeln|8geramscht:ramschen|6gerankt:ranken|8gereinigt:reinigen|6gerillt:rillen|6gerotzt:rotzen|7gerätselt:rätseln|5gerötet:röten|5gerügt:rügen|7gesabbert:sabbern|6gesaftet:saften|5gesamt:samen|6gesauert:sauern|6gesaunt:saunen|9geschachert:schachern|7geschadet:schaden|8geschellt:schellen|8gescherzt:scherzen|9geschimmelt:schimmeln|9geschlampt:schlampen|9geschleißt:schleißen|9geschluckt:schlucken|9geschludert:schludern|10geschlüsselt:schlüsseln|9geschmerzt:schmerzen|10geschmunzelt:schmunzeln|10geschnuppert:schnuppern|10geschnüffelt:schnüffeln|7geschont:schonen|9geschrammt:schrammen|10geschrumpelt:schrumpeln|9geschränkt:schränken|8geschuldet:schulden|8geschworen:schwären|9geschädigt:schädigen|8geschärft:schärfen|9geschüttert:schüttern|6gesegelt:segeln|6gesiedet:sieden|7gesiegelt:siegeln|6gesiegt:siegen|6gesohlt:sohlen|6gesonnen:sinnen|6gesorgt:sorgen|9gespachtelt:spachteln|8gespitzelt:spitzeln|7gespottet:spotten|9gesprenkelt:sprenkeln|7gestaunt:staunen|8gesteigert:steigern|7gestiert:stieren|8gestreikt:streiken|8gestänkert:stänkern|7gestärkt:stärken|7gestöhnt:stöhnen|6gestört:stören|8gestückelt:stückeln|8gestümmelt:stümmeln|6gesudelt:sudeln|7gesumpft:sumpfen|7geswingt:swingen|9gesänftigt:sänftigen|8gesättigt:sättigen|6gesühnt:sühnen|8gesündigt:sündigen|5gesüßt:süßen|5getagt:tagen|6getarnt:tarnen|8getatscht:tatschen|7gethront:thronen|8getrachtet:trachten|7getrimmt:trimmen|6getrogen:trügen|7getrödelt:trödeln|6getäfelt:täfeln|7getändelt:tändeln|7getätigt:tätigen|7getüncht:tünchen|5geulkt:ulken|8geurteilt:urteilen|6gewacht:wachen|7gewaffnet:waffnen|6gewahrt:wahren|6gewaltet:walten|6gewarnt:warnen|6geweckt:wecken|7geweigert:weigern|6geweilt:weilen|6gewettet:wetten|6gewirtet:wirten|12gewirtschaftet:wirtschaften|7gewuchert:wuchern|7gewundert:wundern|7gewurstet:wursten|6gewähnt:wähnen|7gewässert:wässern|5gezagt:zagen|6gezaust:zausen|6gezerrt:zerren|6gezeugt:zeugen|6geziert:zieren|6gezinkt:zinken|6gezollt:zollen|8gezweifelt:zweifeln|6gezögert:zögern|6gezürnt:zürnen|9geängstigt:ängstigen|6geäußert:äußern|4geödet:öden|6geöffnet:öffnen|5ieben:eiben{unterbl,erschr{unt,üb}}|5ommen:unternehmen|4angen:übergehen"
    },
    "nouns": {
      "plural": "1e:otta|1en:a{aur,gend,mad,ub,en,onn,un,aum,rm,ul,al,ri,gi,ig,av,ns}|0s:sigma,on{ciati,conditi,et,est,art,lk},ffee,onee,au{gr,l,e,t},g{n{sla,ta,i{arl,il,el,ar,or}},blo},eriff,cknick,rlei,fei|0en:r,rbar,ron,eun,bell,ull,tess,ins,au,reu,d{ul,en,oran,toi,oli,era,m},t{ach,uch,r,i,ä,n,haf,rf,as,ys,ürs,ba,eu,me,ne,wel,g},th,zeh,reif,raf,ek,ink,rv,z,bub,ump,x|0:er{kleb,jamm,i{orn,ib,ub,chle},lov,re,ne},en,l{e{pins,d{n{hwi,ü,wa,e},pad},iang,ärm,emb,kab,irb,ch{üs,pei,mi,nor}},nker},e{häng,eleg,werb,rieb,äll},s{ou,na,pa,i},oni|1n:mter|5äuser:auser|0e:wür,n{i{cer,bur,pent,rot,res,ub,x,rph,lph,ith,e,nz,az,elf,ek,ill,pel,mpol,a,rm,am,gu},o{pi,f,ph,zet,it,ant,lik,hal,kl,ar,hr,m},e{änom,tig,og,yl,äz},moh,por},l{ta{k,or,ar},ie,ame,istal,uir,ker},gas,eis,kis,d{ol,n{be,ze,se,lbu,ila},ie,gra,fa},g{in{l,r,nd,rs,m},rla,ta,slu,eu,lo,so},t{r{o{,w{or,er,a,tich}},wa,gu,e,wi},agot,i{re,an,en,et,ed,ul,lor,pr,z,f,h},rä,n{e{m,dv,kz,roz,at,äs,in,l},zo,h},s{aori,zwi,ra,tte,rote,rlu},mira,ria,agia,lau,spu,e{b,be,ak,r,i}},h{c{su,ltu,bars,la},nt},f{rie,if,puf,of},k{c{i{bl,n,h,str},la,verde},ba},m{mono,hal,ram,lsa,na,ble}|2en:dion,s{u{m,di,kl,ir},asi,xi,ho},um{,at,pt}|2ien:xon|5ärten:arten|0n:lique|2sse:hoße|3üsse:uss|0se:bis|0sen:mes|3änder:land|3ände:band{n,hl,ver,t}|0er:leid,iest,iech,ib|3ätten:tatt|2a:kum|1i:hino|2ices:codex~0s:a,c,r{e{i{el,k,son,nn,met,at,m},hart,lett,ov,dinn,oy,dtim,ap,sf,ouch},a{b,ll,g,ad,st},ko,bo,i},i,t{n{e{m{ne,ge,te,h},ev},issa,tna,aura,i},c,ou,deu,pu,i{ud,ku,p,az,im,b,tf,a},tes,oas,po,ko,e,t{e{rik,ol,mel,s},pa,pu},r{be,se,o{rp,ip,f,s},a{t,h,d,e},li,shi,hu,ogu},ela,fia,bü,trä},e{hav,riv,n{rli,eli,rri,ce,tpho},t{guet,clet,da,tra,y,le,bsi},i{rb,mb,oog,ll,gen,pp,k,ld,na,lf,oth},u{q,d,n,ue},e,d{co,ko,cor,gra},vic,ac,ok,fk,oup,crem,l{b{u,m,ai,eara},y,z,g,le},é,r{tu,n,v,do,to,sai,oi},ouss,eas,y,saf},n{o,ie,ee,oke,i{s{bas,kas,des,u},llet,grat,räule,u,p,ra,sk},a{c,v,f,rik,l,-ut,og},w,eschö,eer,ger,tör,g},u,o,k{a,ar,c{e{h,d,rbest,tr},a,do,ho,i,pu},rin,un,tan,o,ei,as},f{ti,e,f,d,ckau},p,g{n,o,ga,shta,gi,lle},ü,w,y,l{e{r,sp,ump,ot,v,od,ni,n},ai,l{i,ewa,cha,era,se},va,ca,mina,ou,r,oo},m{liku,fu,leu,oo,alo,a,e{ar,kr,it,l,ui,nd},ri,fü,w},b,d{r{va,ca,da,co,lo},c,u,n{fo,ye,re,-sta},ki,e,a,po},h{c{un,oa,ho,at,ar},s,b,ru},é,j,q,kz,sitiv,uv|12s provocateurs: provocateur|8s complets: complet|1ines:ago|1zes:ix|2izes:dex|2ites:imes|1ies:story|0es:kbox,sär,dress,pgloss,wich|5s fixes: fixe|0:s{de,u{sk,ok,rzirk,i,pl,s,lism,at},yro,orp,il,m,á,los},r{e,cto,rumo,kta},n{flade,tfade,boge,oster,lei,-ärzti,ba},e{final,douill,s{tinteres,äch,äu,mü,kä,lä},d{n{vore,elä,ebi,ewi},ewei,trei,bil,äl,äu,b,ta},g{tän,he,fe,fü,ela,au,ir}, latt,lllist,würz,viz,ölz,gim,geweb,ölb,amper,ceder,kni,cop},el,erl,moll,pasta,hini,olt,fax,mb,mmerierung,uiz,sherry|2ices:ex|7 mobiles: mobile|3änner:mann|3ühner:uhn|3örner:orn|0er:iking,d{l,kin,rin,li,lie},t{ch{li,esi,sewi,hle},bret,mü,geis,pens,nes,schwer,chei,gimen},äuch,ski|3älger:balg|3älder:ald|3ünder:mund|3änder:and{b,ew,f}|2äder:bad,rad|4üder:bruder|6öchter:ochter|3ämter:amt|3ötter:gott|3ätter:latt|5ütter:mutter|6ömeter:hometer|2üter:gut|5öster:loster|3älter:gehalt|4äupter:aupt|3örter:wort|3äuter:kraut|4äter:vater|3ächer:ach|3ücher:uch|3öcher:loch|3örfer:orf|2äler:al{nkm,bm,t}|3äuler:maul|2ümer:tum|3ürmer:wurm|5ämmer:hammer|3ämmer:lamm|3äcker:mack|3ölker:olk|3älber:alb|2äber:rab|5ässer:bwasser|2ässer:faß|3össer:ross|2össer:loß|2äser:glas,ras|3äuser:aus|3ölzer:olz|0n:e{,stur,e{ll,rm,d,uss,f,er,kt,n,osch}},l{e{s{ach,m,s{nne,fe,o,fu,hü},n,au,gei,ap},p{rem,au,up,pap},g{an,in,or,re,u},d{na,n,d,i,e,nu},b{i,a,r,m,wie},m{m{bi,bu,e,o},r,i},f{rtof,af,trüf,a,au},z{et,e,an,ur},t{ut,at,is,hach},h,k{fac,s,arun,ri,parti}},u},r{e{fed,plund,leud,amm,numm,t{aus,wes,lei{h,el,tt},ol,ul,nmut,nat,vet,lf},mau,trau,steu,ay,ziff,gf,lei,fei,fas,leb,ph,ith,op,sp},achba},nerkenntnis,dollerei|0nen:in|0en:n{ran,pli,o{i,rs,nis,iak,ot},bah,sa,rstir,dir,dor},t{bet,guns,is,u{na,fl,h,bstit},tal,ewal,twor,sumen,e{nalphab,h,hl,rol,pr,o},ch{llma,nma,uflu,i{s,pfl,hr,h}},rif,k{pun{end,t,r},da,sta,te,äfe,nse},ilo,a{s,kr,ir,id,ld,t{os,el,un,e,f,zu},i,a,om,leg,äl},y},klop,yp,ams,els,d{n{a{ob,m,gr,er,it},abu},hel,eroi,ai,jag},ung,urg,r{e{mani,bau{ß,in}},rta,ha,bä,gö},lif,ölf,hluff,h{nsc,nuc,sop,ap},verb,ei,m{far,or,ono,al},l{qua,ah,gal,we},patz,k{ban{z,al},i,is}|5ästen:asten|0ten:bau|5n beten: bete|6chnachten:hnacht|2en:faktum|1en:a{vit,ram,hem,gm,vill,izz}|0anden:oktor|1den:tis|4äden:aden|4öden:boden|4ögen:ebogen|4ägen:magen|4äfen:afen|4öfen:ofen|4äben:raben|0ien:diz,ileg,l{ria,inera,mmobi,nsi,pti},zip,nod|1zien:äsens|1ien:hivale|0e:l,s,h,f,k,d,g,t,v,z{it,et,ar,cher,ei,l,u},m,b{e,au,shu,lo,r},r{eu,lu,bitu,ä,e{i{ap,b,t,rn,non,enad,wel,ol,pal,lav,ev,kur,fiz,sag,is},e,rakt},a,h{ru,e{g,hw,ew,uw},ro,ja,ö},ö,tar,ir,o{ent,ont,l,e,o,es},pü,pi},n,maß,äß,eiß,i{hre,bre,ble,ha},p{oto,ko,üp,al,eoty},äu,ptau,rhau,lex,fix,nx|3älle:all{f,b,st}|3ölle:zoll|3ühle:uhl|3ähle:fahl|3äule:aul|2äle:al{ner,an,din}|3äle:saal|1sse:ß|0se:s{u,ni,ro,a},tnisse|2üsse:uß|2sse:biße|2ässe:aß|4üchse:uchs|4ächse:uwachs|3äuse:aus{m,l}|3änse:ans|3äpse:naps|3älse:als|3üche:uch{r,l}|5ärsche:arsch|5äusche:ausch{b,r}|4üsche:busch|4ösche:osch|5ünsche:unsch|1:licher,deter|3äche:bach|4äuche:auch|3öche:koch|4örche:orch|2öhe:oh|2ühe:kuh|4ämpfe:ampf|4ümpfe:umpf|3öpfe:opf|3äpfe:apf|3äufe:auf|3ürfe:urf|2öfe:of|3ölfe:olf|3ücke:druck{lb,p,s,in}|3öcke:ock|3äcke:sack|3änke:ank|3ünde:und{r,b}|3ände:and|3ägde:magd|3änge:ang|3ünge:ung{w,pr}|2äge:ag|2üge:ug|3ärge:arg|2öge:zog,trog|2äte:rat{bei,m,l,n,or}|3ärte:bart|3äbte:abt|4ärkte:markt|11n-bete-salate:-bete-salat|0te:ima|3äfte:aft|4ünfte:unft|3üfte:uft|3äufte:itlauf|4ärzte:arzt|3ädte:adt|5ängste:angst|3äste:ast{g,al}|4äuste:aust|4ünste:unst|4ürste:urst|3üste:ust{br,l}|3öste:frost|4äpste:apst|4ülste:hwulst|3älte:walt|4üchte:ucht{fl,s,r}|4ächte:acht{m,n,h}|3ähte:aht|3äute:aut|4leute:fmann|3äxte:axt|2öte:not|3ätze:atz|3ötze:lotz|3ürze:urz|3änze:anz{kr,w}|3äume:aum|3ürme:urm|3ärme:darm|3ämme:amm|6s crème: crème|2öme:trom|3örbe:orb|2äbe:tab|2übe:hub|2äre:ltar|2öre:hor,nor|2üre:wur,nur|3öhne:ohn|3ähne:ahn|2äne:an{pl,kr,w,sp}|2öne:ton|3äune:aun|2öße:toß|2üße:fuß,ruß|2äße:spaß|3äuße:auß|3ämpe:kamp|8a vitae:um vitae|5ättel:sattel|5äntel:antel|5ändel:handel|5äpfel:apfel|4ögel:ogel|4ägel:nagel|4äbel:nabel|2a:um{kt,it,l,m,rn,v},on{k,or,on}|0ta:ma{m,rko,ug}|0a:lom|2era:enus|3zera:lkus|2ora:pus{em,tkor}|2ina:lumen|0ja:mni|2i:us{mn,in,mod,r,mul}|1i:erone,o{torn,fit,int,os,azz},pos|0i:wik|10ora delicti:us delicti|3zi:ikus|8s au lait: au lait|1it:uk|1ä:mina,ova|4uareg:argi|7iatantum:etantum|0im:eraph~0:s{ana,xpa,i{em,ov,la,ass,ir},sou},er{d{l{usbi,efe,örfe,me,o},flie},hlicht,äch{w,r},gentüm,reib,dgräb,äus{m,lnh}},en{renn,runn,t{hat,lit,hus,pos,fos,rhal,ach{t,n},kno,bra,spa},p{p{a{rl,ischl,h,w},ho,ro},um{h,kl,t}},s{kis,bis,htes,ei,mmei,bu,we,be,re},d{rie,or,gul,lei},g{rei,fan,prin,kra,wa,mö,gal,nlie,de,re,mor,nü},hr{ege,erfa,tfa},f{rei{-,st,al},ref,hau,p},h{c{,zei,s{s,ie,gro,äu,pu,ö,äl,ä,än},rsu,rau,ku,no,re},le,ge,se},b{ha,ol,ster,rei,be,le},m{kom,xa,prono,erneh,rah,dau,gau,ie},l{foh,l{po,wi,ba,efa}},z{lran,tut,bol,wei},k{den,hin,zin,ne,broc,zac,bec,kor,ha,bal,ü},eß},e{gefäll,gehäng,geleg,getrieb,gewerb}|3x:endizes|5and:länder{hr,en,z,h,m}|2:er{kleid,biest,viech,eib},en{ktron,uron,neun,t{s{für,a{m,l,i,nt},hei,ly},zeu,peu,r{fah,a{nk,ng,n,r},u,derhi},n{e{i,oeffizi,v,ag,rig,eg,efer,nkurr,oz,uz,ssist,d,ns,ss,nqu,bstitu,on,rn,ah},a{,ik,ss,his,ig,nson},fro},agne,ane,ome,ch{a{r,nd,hl,j,p,y},u{kb,rchla,hl,w}},erf,chaf,i{e{k,h,z,b},on,m,band,l,or,s,u,i,t},tä,iä,kroba},stess,eins,zins,d{en{geg,tug,nu,vid,hen},hul,mera,hem,etoi,boli},r{arba,o,h{u,we,ü,wä,fa,o},u,tü,her},graf,ath,ith,ebell,null,nerv,au{fr,ch,f,s},z{an,en,in,ischüt,rot,ili,ti,er},fink,othek,box,ntax},rbisse|5auser:senhäuser|1:en{n{in{hrr,chr,p},noto},t{s{gla,pla,i{e,l{s,ß,tel,n,h},tr,k,wa},rä},bau{e,r},pur,n{e{di,fizi,esid,ad,mpon},a{k,pik,fik,t{i,e,ns,nn,l},s,eress,mbul,pl,al,ler,etr,g,ri,arm,n,rd,w,v}},athe,ch{bra,kra,eschi},i{che,heze,rm,ul,xquis},bia},eotyp,eis{n,w,m,r,l,p},rfried,hord,päd,ung{erz,sz,j},r{furo,po,äu,au,eu,tü{t,i,ver,k},st},läf,mpf,epf,ch{i,s,wäs,a,ä,ol,ü,r{a,le,he,u,lä,i},an,ün,u,o,e,fre,y},frei,blei,m{r{ffa,bno,eno,onfo},hkom,tono,pal,nthe,trie},ahl{f,k},z{n{a{fl,mer,g,m,h,w},gre,mi},ker,kiz},k{nti,pi,apothe,ubec}},e{fühl,ss{sze,tre,ho,pa},ch{eräus,ebüs,hli},tränk,häft,erücht,läut,rhör,eschwür,föhn}|2a:en{donn,aren,mens,rmad,slig,ggi,eteri,irm,traum,skal}|2um:en{plen,ipt,dat,impress,nivers,for,tr,i{rem,ort,nas,os,r{na,ste,ite,to},d{po,e,si,n}},du,ku,e,lä}|5att:rkstätten|3:terbauten,rmessen|5arten:gärten|2us:en{vir,adi,thm,sm,ykl}|2on:tadien|2is:raxen|4uss:üsse{bfl,bschl,n}|4uß:enüsse|3ß:mbisse|1a:cotte|1um:tika~3ücke:abdruck|0s:er{ab,din,pi},t{al,bo,ro,eta,ka,fak,hi,skrip},eck{,l},game,gin,im,rum,ich,kord,mädel,tag|0n:e{abkomm,g{au,lau,lun,zun},t{eli,kulan,tan,pis,toma},final,gall,inn{f,r},kolb,lanz,pur,se,streif},er{ad,ord,bau,kief,leit},el{amp,ass,riff},lohn|0en:t{ach,buch,ak,punk,ar,predig,ras,ta,wel},alp,lump,au,streu,bub,elf,reif,kür,narr,zar,leid,mark,zeh|5äcker:acker|1en:a{agend,aul,aur,lav,lig,saun,tub},konto|2en:album,visum,lexikon|0:en{am,sam,ess,ras,hod,rach,ranz,rück,schreck},minus,nabel|3äste:ast|0e:bund,ding,gel,mahl,gen,urin,lauch,mus,pionier,rektor|1n:beamter|0er:ei|3üsse:fluss|2üte:hut|3änder:and{l,r}|5ängel:mangel|2ina:nomen|2era:opus|3ötte:pott|2äte:rat|0a:rom|2äue:sau|3änze:tanz|5ässer:wasser"
    }
  };

  // uncompress them
  Object.keys(model$3).forEach(k => {
    Object.keys(model$3[k]).forEach(form => {
      model$3[k][form] = uncompress(model$3[k][form]);
    });
  });

  const prefixes$2 = [
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

  const suffixes$2 = [
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
    const m = str.match(inseparable);
    if (m && irregulars.hasOwnProperty(str.substring(m[0].length))) {
      return { base: irregulars[str.substring(m[0].length)], prefix: m[0], separable: false }
    }
    for (let i = 0; i < prefixes$2.length; i += 1) {
      const p = prefixes$2[i];
      if (str.startsWith(p) && irregulars.hasOwnProperty(str.substring(p.length))) {
        return { base: irregulars[str.substring(p.length)], prefix: p, separable: true }
      }
    }
    return null
  };

  // returns conjugated forms for one tense, or null.
  // tense: present | past | subj1 | subj2 | imperative | pastParticiple | presentParticiple
  const getIrregular = function (str, tense) {
    const found = find(str);
    if (!found || !found.base[tense]) {
      return null
    }
    const { base, prefix, separable } = found;
    const forms = base[tense];
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
  const toInfinitive = {};
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
    for (let i = 0; i < prefixes$2.length; i += 1) {
      if (str.startsWith(prefixes$2[i])) {
        return prefixes$2[i] + 'ge' + str.substring(prefixes$2[i].length)
      }
    }
    if (inseperable.test(str)) {
      // str = str.replace(/en$/, 't')
      return str
    }
    // otherwse, add 'ge-'
    if (!/^(über|unt|v|au|miß)/.test(str)) {
      str = 'ge' + str;
    }
    return str
  };

  const doSuffix$1 = function (str) {
    for (let i = 0; i < suffixes$2.length; i += 1) {
      const [from, to] = suffixes$2[i];
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

  const { presentTense: presentTense$1, pastTense: pastTense$1, subjunctive1: subjunctive1$1, subjunctive2: subjunctive2$1, imperative: imperative$1, presentParticiple: presentParticiple$1, pastParticiple: pastParticiple$1 } = model$3;

  const doEach = function (str, m, tense) {
    const irr = getIrregular(str, tense);
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
    const irr = getIrregular(str, 'pastParticiple');
    if (irr) {
      return irr
    }
    if (pastParticiple$1) {
      return convert(str, pastParticiple$1.pastParticiple)
    }
    return toPastParticiple$1(str)
  };
  const toImperative = (str) => {
    const irr = getIrregular(str, 'imperative');
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
      const [inf, prt] = suffixes$2[i];
      if (str.endsWith(prt)) {
        return str.substring(0, str.length - prt.length) + inf
      }
    }
    str = str.replace(/t$/, 'en');
    return str
  };

  const doPrefix = function (str) {
    // remove 'ge-' off the front
    for (let i = 0; i < prefixes$2.length; i += 1) {
      if (str.startsWith(prefixes$2[i] + 'ge')) {
        return prefixes$2[i] + str.substring(prefixes$2[i].length + 2)
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

  const { presentTense, pastTense, subjunctive1, subjunctive2, imperative, presentParticiple, pastParticiple } = model$3;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse(m[k]);
      return h
    }, {})
  };

  const presentRev = revAll(presentTense);
  const pastRev = revAll(pastTense);
  const subjRev1 = revAll(subjunctive1);
  const subjRev2 = revAll(subjunctive2);
  const impRev = revAll(imperative);
  const presentPartRev = reverse(presentParticiple.presentParticiple);
  const pastPartRev = pastParticiple ? reverse(pastParticiple.pastParticiple) : null;

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

  // find a conjugated verb in the conjugation table of its infinitive.
  //
  // the reverse-models (fromPresent, fromPast..) each guess at an infinitive,
  // and they need to be told the tense + person, which we often do not know.
  // so try them all, and only keep an infinitive that conjugates back into our word.
  //
  // (this file is the same in each of the *-compromise libraries - the list of tenses is not)

  const persons$3 = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural'];

  // tenses is a list of { name, to(infinitive), from(word, person) }
  // opts.extra(word) may give more infinitives to try
  const makeLookup = function (tenses, opts = {}) {
    // what an infinitive looks like - 'hablar', 'parlare', 'sprechen'
    const shape = opts.shape || /./;
    const pick = (only) => (only ? tenses.filter((o) => only.includes(o.name)) : tenses);

    // every form of this verb, by tense, and then person
    const table = function (inf, only) {
      const res = {};
      pick(only).forEach((o) => {
        res[o.name] = o.to(inf) || {};
      });
      return res
    };

    // where is this word, in the conjugations of this infinitive?
    const findHits = function (str, inf, only) {
      const forms = table(inf, only);
      const hits = [];
      Object.keys(forms).forEach((tense) => {
        persons$3.forEach((person) => {
          if (forms[tense][person] === str) {
            hits.push({ tense, person });
          }
        });
      });
      return hits
    };

    // every infinitive that has this word as one of its forms
    const candidates = function (str, only) {
      // the word itself may be one - 'wir gehen'
      let roots = shape.test(str) ? [str] : [];
      // any irregular verbs, that the models do not reverse
      if (opts.extra) {
        roots = roots.concat(opts.extra(str) || []);
      }
      pick(only).forEach((o) => {
        persons$3.forEach((person) => {
          // 'rad fahren' -> 'fahren'
          const inf = (o.from(str, person) || '').split(' ').pop();
          if (inf && inf !== str && shape.test(inf)) {
            roots.push(inf);
          }
        });
      });
      roots = roots.filter((s, i) => roots.indexOf(s) === i);
      const found = [];
      roots.forEach((root) => {
        const hits = findHits(str, root, only);
        if (hits.length > 0) {
          found.push({ root, hits });
        }
      });
      return found
    };

    // the best of them - or null
    // - isVerb(infinitive) says if this is a verb that we know. these are preferred.
    // - known: only accept a verb that we know
    // - tenses: only look in these tenses
    const lookup = function (str, options = {}) {
      const isVerb = options.isVerb || (() => false);
      let found = candidates(str, options.tenses);
      found = found.map((o, i) => ({ o, i, known: isVerb(o.root) }));
      if (options.known) {
        found = found.filter((a) => a.known);
      }
      // prefer a real verb - 'pude' is 'poder', not 'pudir'
      found.sort((a, b) => {
        const diff = Number(b.known) - Number(a.known);
        if (diff !== 0) {
          return diff
        }
        // then the shortest - 'sagte' is 'sagen', not 'sagten'
        return a.o.root.length - b.o.root.length || a.i - b.i
      });
      return found.length > 0 ? found[0].o : null
    };

    return { table, findHits, candidates, lookup }
  };

  // the tenses that are one word
  const tenses$3 = [
    { name: 'present', to: toPresent, from: fromPresent },
    { name: 'past', to: toPast, from: fromPast },
    { name: 'subjunctive1', to: toSubjunctive1, from: fromSubjunctive1 },
    { name: 'subjunctive2', to: toSubjunctive2, from: fromSubjunctive2 },
  ];

  const { table, findHits, candidates, lookup } = makeLookup(tenses$3, { shape: /n$/ });

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
      const suff = keys[i];
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
      const suff = suffixes$1[i];
      if (str.endsWith(suff)) {
        return str.substring(0, str.length - suff.length)
      }
    }
    return str
  };
  // console.log(toRoot('saurerer'))

  // fallback rules, when no trained model is available
  const rules = [
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
      const [from, to] = rules[i];
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

  const pluralRev = model$3.nouns && model$3.nouns.plural ? reverse(model$3.nouns.plural) : null;

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
      const suff = suffixes[i];
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
      fromPastParticiple,
      table,
      findHits,
      candidates,
      lookup
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
    "Adjective": "true¦:!1:#$%&()*+-./<=>?@[]^_`~:re,hc,eg,ie,ne,nu,ts,ni,cs,ar,er,na,el,al,eb,ua,et,le,dn,ro,ed,ir;0:082;1:077;2:08R;3:07U;4:01B;5:08U;6:07O;7:07A;8:05N;9:039;A:07N;B:08O;C:07G;D:08M;E:04Y;F:RA;G:08C;H:06W;I:059;J:09F;K:09B;b09Lci$,d07Le06Gf05Og04Zh023&rf016k00HlTKmRTnNHpNGrJ7sFOt2Ru2Dv0Jx0GyxEz0CßL;a05ek,iZorgXäm%NüsL;!brJ#L;ttib,@s;d+k,$Sm5CnRr09JsMtL;h3R&z7;e08LgNtL;f~$srG&hL;nhow0rhaw;aTV)L;nd_,rhaf6s&w,traw6ztas;>p,im#t,+s;aLs)w;f,s7;!]028(se~,#Ls(b=YS;bü,temillim;eMw%L;),s%eis;hMwL;!ee01H;!^L;.b,ehülg;lbOnLrk;!e$stap,$stLl9N;aLilk;lk,p;!(L;$&l,tot;lo2rMtL;iBün4;aw$sLuk;!feit;>,=pMif,odL;.ap,oht_7;m4U#p;a1DiL;an,s0VtLx=f9;a08i02kQpO_BsMuL;b~tZkexe,+m`;.03D%gusL;!otC;ezLursid;/,#p;aSeOif,+X1uL;dLrUJ;`,+,orpL;!.036/,);ffNjLlErid;bL+,rus;o,us;a,eW8;!/,+,oid.,rL;eMtL;ta;grüb,tD;dPmi8nOsMtepLutD;/,m3;nLop;.tW0es;g3if`;da,@;/k,g05izossa,k03l01mXnWrRtNutis,vL;onD#sL;n3ä8;/IYiMlukaf,(LuX3;mugra,särp9;dem,lauq,rLt<uq;ak,otC;appa,eMgY1ipsn3kul,oLran,*nom`;jep,k`;n%e05poLti;!oL*op;c,k;!igami,r06E;iNrL;iffa,oL;fVIn;tlu,xorppa;/,sig=,uL;g9keB;>p,iLude3;dä8)WM;en,orrXN;lup00nVolpxeI3rukUsMulkL;ko,xe;aReL;rMsbo,zL;kus,n3xe;gMpL;eMmi,xe;eLga,o8;d,r;m,p;!/;apxe,eL;fNpxe,tL;+Lxe;!latipak,(*3sX;`,fo;/,mi;kn3rb;aUeL;$sRnPrtL;!%N),sgL;inök,)L;n+s0#IX;ba*ßHr06Psti05Wt_w;!dSGl%anL;!]k)f;ehe,($s(m,r85sLt01E;tiPW;lNn%MrL;!g;!),raI;b,h5;aCCbBYcaBWd<wBSeAOf95g8Eh7Ki75k6Jl5Qm5In3So3Pp3Mr1Ds0Lt0Bu02x>9zRßMäL;ps,s%n6E;e0Suw?L;dl03Q`om,l0QnMrPMsLt0L;e05Gg0Nno004t4Z;eLu;iOV*3;&hFnUrTtL;eOiNuLä$s%GZü6D;drA(Lp%31;b4g4;hWw0;lNsL;%Lt(;d<UNn%%t(;!#vAZ;eh1ükF;aLIeB3;aQeNgMka,losL;ba,/;!),s(067;n6rL;fLtQG;#QN;drNElMrL;%<,g6W;n63rG;aPeL~d,olf,upak,ül;fNk3lMnL;!ürb;oiv,pm3;!blI;lMm(diEsL;!ppap,#mmin;gLp;!lL;aa,eWS;efY$XiVn#UsLubor,üw;eSuw?L;!dl02Q`om,lQnPrOMsNtL;hL]wmu,sN7;cilfp;gLnoZ2t3X;)t_Q1;eiNTu;anUC;rp23;!#ib;/Lrt;d,%uz;uf7YänUL;beiXd<W/XCfpolk,$Vk+rt,]S(Q#OsNßL;i9o2uL;h5k;s02Bt_;ssaw,tLuef;+w,tew;bmob,+$samlüBsL;~k,]f;bib,gMtL;ipak,tas;uk,üb;ok,stur,urb;h,*;h,rba;a1PeThO#A3älkFöL;hM*%L;),seZJße;%4#4;aj5OeNäLürLE;nLw?tla;%8Sr4C;%PAg?LAk#vL]94#vPA;dXO(tiE;d1Afeil#bütla,$äf%t&rb,i0Gklöv?0Fla,mm0DppP4t08ue03wL;hJC(rhe,sL;&8nL;eM#L;^B7mmaj1trö6u60;bWd&VgUhTkSlhRmQnOrNsMt$aLue$sbP2ztäh5ßürg1;?,rA;=,siw;h%1öh;häw6(L@2;k#<,n;haHQrP0;eNUäz6;<d,#m1;-nüw,es;a17äw6;ltim1n1;eLol;il,r*6;h008tL;#bü,sL;%LrLF;fp3mL;m.go8;a029&h4VlaLJsMtL;adrAiN;eiMi%Llop0;?z<t,t(;brA;=1äLükMM;h1l1;n3It5J;b23ca0Demkc30krHl0Bm0An03r01sWtSuQvPzL;a0CiLta0C;filauqMlpmL;okE6;!$oh,);!itomE4;g+*id,qit<,tL;istug,(zka;iNk=f/4lahpsa,(LodO4rZQupma;i_Llat7särp/rMI;mKPsgU7;d/kka,mil4;aOiMsL;e#t+r035ukof;lL_tom,tamora;aizepsDUoV9;lb,r4;akn3EeLt(znokJ0;döf,pm[7B;%4iQnoba,oMrL;ob;iLpsQP;sMtL;ibma,kQ4_S7;(midKNsap;ff.,lAW;mon9r>a;bate,emu.g,liam`log,opLum_fhEE;k<lb;lp`;eif0&n$s%ßHnM_f%fLYu=$sLär0;%01H;iLärK8;heLmrK7;bLg4;h0n#l,#01F;ah1b$an1hLms,ps0zGZ;!lMnL;esKi1;eTWha2lank;aci^MPmo8poMurL;ba,rSS;lk1;rMtL;!+5V;!.fD;a0Se02h01&m%t00nQot?PrNuLörk%s&8;>%Lb,ärb%(DL;!horf,tug;=%Löh0;gid(wsC);slhNA*ul;aLis%h4GüJN;kQmIWn%NrbL;%nL#vnrih,t(tuw;a,u.b;os,tL;sLzt=;&m,#;?L#nHN;!lla,),tL;da2]w;sn6ug;es#ILowIMöw#vsglW4;d09g08i05l02mehAnYrWsTtPuMzL;`,s=oda;qLrgn3;eLn7No];rfCDsnP7;aNeCPin9opMsisL;/,nP5#p;!iOmi;l,p;&t(,ärpL;!iL;nmo;apsPWeffP6ruk9ähL;da,+,ok;amNiL;mLt#pmi;e,mi,o8;mi,#p;avilop,]zxe,uL;brut,pL;o,r3;d#vMziffL;e,usD;$oh,lhow,);ill[+BT+r2#vid;ak`,is9;d01g00kYlWmra$VnTrSsQtOv=/MyobL;m>f;!stL;&h#$is;iLsn3;b_xe,lim;.,iLopmi,s/R4üma;ffüs,rbBK;=otORongi,te(p;%,imLossid;luf,od;!s;ag,uL;bma,k;iLrHs~;fingis,p;=e,iOUorra;ep,_7B;as0hPi2OmMri$s5Zä$srG4ülbL;%,rG3;a*1LehFi*eL;b4VgL;ssim,ßim;äMü#bL;!t]w;l%sttin$s35zF;a0AeZhU&RlMoh%#h4VuL;hZ7kko;e*%Oiw0oNüL;f#LhrHT;bü,m.g,),ssI*g<,ßI;wFzrHR;<FD#ss1;t%MwgnL;>0;&wz,);az?OoYJäMük%L;feit,sK;m#vLzF;),uen;$oh,),rJ5tug;bohFdeis?nUfrüw%nHRgRipsGQkciwtnQmmSOppoPtNzL;n&rAruwL;eF5#vF2;snük0tL;imrHDü$s%(s~k;d,k%kK6m%t]ppod;/IY;eMüL;lf0zF;inhYKrF;nüd;![rVIkLn&2ru;!eUOgisK$sra,sLßan;&,lhKPsan;a05cReN~2löw?t1HnL#mGC;ehYEimLär$s%n&4;$sF;fNrL;idNC_kL;!),rN0;`,#p;aRePiOuLülg?K4;f4Qrd%L;nLttef;&lk;$sXCr*4VwzrA;dFlf?L*%JZ;),tulb;nMrL;trAw4J;!blIk1lO#L;safLtM;!#tL;tilB;`up;pm3r3YtDxe;eMf,+fLsiuqxe,zilpxe;!`,+;$s%WrNwL;!]L(l&m,#temolik,seRNt]w,z;gn.YBmmih;bS?L;!fQg)rBrPsMtLztaRVßN;ra2s(id;be~t1fMsLt$ef0;i60uh5;f~guz,lih;efpo,haf;f~g,pmak;!^I(m@d;!zPS;cN&w%Mu.Län45öhG9ürb3X;%<;dot,);a08eXiQok%PsNuL;aLef,srFYt1;l6rbF;&lf%nKläfrFWnüw#7rL;ink#z,r0P;git#f,$&w,sCtrI;dPeMlLröt;h5llJt(fförFS;lLs;!%=fp,#dL;ef,+k;!llQP),rLtful;essaw;!braf,$UlT),rMsLßuk;nVNsuk;!%LknEl%9),tol;!aaw,d)m,hPli2nOsfrNtL;krHsL;blE~f,)k;ad1;eil80u;caf,eVI;$sQZi2;ok,saw;d1Zm%Mrb%LwEK;<4#htla;suI*FI;a0Ae07iQnLuezFFüng#v$steiuq;iMärd%tL;$id;d?LwhTW;!sL;fDWrW9;dXewz20hu#bsrR6lVtL;$M#ft$Lsnüg?(iPIä*EA;/F;e#bMisLür1;baE7kcürE7;b6dgaj,hPlOmmi2nNsL;gnLtlahrGJ;aH1ugüAJ;how,u;haw,lG;c&lg;&tE0lL;ehDZ;eNluC9ä$seL;b20gL;nrih,röh;i1ElD7;lLw?2J;eLfpFr9V;brG6g<ßorg;lp%eztih,rfFt?7N;aSe53fQ&r*%PnOpL@t0;mLönk%uz;.krEFäkmuL;!ßiJ;as7üf;#uq;iHBohrEBubL;%sC;hMr*eL;brGg4;b0R-rhäw,d0Oee$silk,fpm.k,g0L$0Jk0Hl0Cm0BnYrQsPtOzLßE;#LtaVG;hLmh5;!-;$us,mPAsn6ta2;ob,sE;eMhL;an,=;bPduP0&SUlOnnög,pmü2rh=#bo,tL@d;sLt>f;>,&L;g,m;hef,üh5;eif,@z;eLnH;bVdUgS$räm,i>,ksHlluTAmRnQppup,rhe7sOtNu.MzL;t.f,ziks;f,g;=o8tOQ;.hp,e~,&rg,omim,sL;am,iw0op;omäd,u>,üh;eh5;as,nL#wz,ül;aSEuj;>lab,lJ;ank,ub;a2Iu.t;askcVJeL&tBQ;baf,fNMgnH$&PMip4HkNm_f,pLstär,v/f;lLür;öt;e,no;cLlOBn.k,uB;aPHeSRü*$urb;>,sL;an,t>k,u.;az,nL;awz,uL;rBwh5;ah5libMnL;a2%ut,ik,üs;!n+s;eLu>g;~t,l;d0Cn08rk07tLwtiAV;a03fa$striw0S$X&TlG4raSsOtisTHuNühL;?L;lhow;lf$rudt$il,mrCU;aMiLörtF;rfC1;l?LtA7;),rG;%s#d<,wBA;bra0RlgBXrL;bL?BB;#vL;t&w;aN~L;eLrCJ;gstKX;eLnmu;bLgFO;]iv,);mi7Yr&hL;%<,#vL;!g)j,);n3sidIO;d_%Nffaw?MgL;es0&ST;),#TI;ba,);&lkeVlTm/ft(kBOnNrhäf%L;),sgeiL;*ba;eOuMüL;rgBB;/f?Lw#v7I;!g(;llovLs0;!m_f;em9Dib%Lu$sC4;!$oh,kEQ),ssim,ßim;b4gtug;%N#vL;mma2nLsPRtra;a,=eE;bE6`9h00t]w;psL;%ba;ag?VeQ&l1olPräf%Ou>NürteL;bLg4;feit;g%tot,#;^olb,t)b;%ERrA;ilMwL;%^I;eLrA;bLgAN;!lla,);$oh,)L#d+m;!hL;c.B;bo8ib.,kOlos`,rLvi8;apM`om,ukL;ka;!es;i]d;ei32i30o02#v01sa00ufZöL;iRlPnMpmop,rLt(makBMv#n;en0op;akT6iL;dibil,mLru,ur;o,ulG;ad<ks,uL;baf,ksum;do]m,g0SrPtOzL;aMe8iL(d(t,u+m;lHrpak;pRUrg;kefDu+m;ak,eLuxul;s,*ym;fid,n3;n,rk;id,orNV#p;i2HlLmaf,_g~;b2Ed2Be28f26g1Z$1T&75k1Rl1Km1Gn10r0Us0AtTu/t,vitanrRSzMßL;am,i0D;i9las,nP#OtL;as6es0iMuL;h5n;snhow,w;h,mh5;>g,/ruL;kn3;a00faZhViUkTlaRnD0orb,rQsNtMuLßO;>,m;>b,og;.,blE/,iMort,sLul;uw1;%,rf;ab,ew,ow;hL*0w0;!?rG;at,eGC;ez,teppa;aNcL;a4Druf,uL;rf,z;n,rd;rk,s;miJr;b#w6d<*03gnU$urps03inTkCSlM5mhanSnPsiOtL;$isM&braL;!t&zg<l;kCNsC;mor3A;iz,oiL;gLssefn3;il9;l&t,sC;b%6dCMfrüd1gLY;aSuL;bi9d+BRgPkriw,mOnMssaf,tL;$~,_CQuCO;ffoh,ha,+seLoh5;b,g;mJrCS;eLitfähO7+d1;r,w1;g9Lhn9O;<,r55;aPeNhLomuh,uB;af0eL;!w;d+k,fu,lhef,tL;av,tälb;ah,t(GT;>p,eOhaz,ilN+s,rL;eLih;k,t];pizsid;dVfu2gUkRlPman,rrJsNtLz(rg;aLlaf,s3tis;a2t;sL@p;iw0;eElL;iw,üh;low,nL;aL`1;d0rh5;lof,_s;ang,ob;ah5eMrL;ah,of;l8KtL;a,sys;eNhMiL;eh,*;a3Nüf0;dat,fIRgNiLkHmrä,purks,ttim;pLz;si1;/,üz;cLit~k;aC2ewz,uKMülg;aOsNuL;.,rL;b,%;&lf,)w,uC0;dLrB;bo;aPeOlKYnMrL;a,os;aLuPF;hn8ElBXwz;r,wsC;lk,rL;f,t6;aMVlih,pL;mak,ok;drMhLiBT#P8;e,ur,üm;eig1üw;lMnL;e,urg;%rab,uh5;eLraf;il,l;bud,^.g,ruDJ;eLzäE4;rg,wPC;f,m;a10e0Fh0Eiaf7r0Au09äL;^07i05ke8lu02mi8nTrStL;iN(mL;=pLidur;m3pus;lN<Mr8IsLzif`;.ap,#vi4;muh,s;atot,e;oA1tn3;iQoiL;sOtL;aLka9ulov9;lfL*;`,+;iv,u09;b,d_,gMlpizsidL;!iG1rFT;ami,i_;gMkLpop7;atkeBsum0P;/G5+s;lLt#t;imaf;%=,ukE;p,*;aNiw,üdL;!]L;d+Bpp.;*,zib;aw7äfF;b03d01eYfpat,gVhpi#p,ih5kcUlI4nDsiJtQuMv=c,w$sLßuä;!n%lof,#nFRsZ;asMeL;hFt;!kLCßL;üs;iJ)mztup,sMtLu>4zt=;ib,üh5;+f,uLüd;lli;aw,=,ol;aM[D<w$sL;!$oh;h,m;lLuq;!blIsLtful;tlIA;eiLnos1rG;b,n;akHo,@sL;!),zFW;b00dip>,eZlQmotaP<lOtL;e<lM(meL;];prER;pm3;!bus;aks,kQlOop,uL;c~ruc,dom,kLl]zM;=omLi2Ho,riz,äs;!aCL;e*rEKipaL;k,p;!nLtra2;eLu;nnos;lkun,+l;!b&rtnKd1Sf1Qg1Dh12k0Wl0Om0Ln0Fpp>kn60r03s00tU@TzNßL;af,eL&r#z;!inM8m;&P]HVtL;eLun,äh5;lrAsL;hL#;crud;h0Pr;bba,$s$rud4;e8BfaP$N&lba,laM#3DsL;>1(id,ok;h,ps;a,ef<,iLruf,urf7;s7zr5C;h,rM8;=(+hA4&w1BsLöl31;af,eL;!m;eOhLälk6öh,üB;af0DeMüfL;$rud7sC;!kmu;^RfQiL;b_sOlupinHr*NsMtLz(#AH;ad,k=f;ila9sap;ig9;da;eil,fizt(;os,uw,ärA;e$/1hP&h0U(M#lL;!#;k6rL;b,tL;!ba;`,ow1;hLmi*1_f,uäHI;enLäz;ba,<,rhaw;eQhO&N]*L;nKrLuz4;ad,ov7;h,t;az5Xef4äLüf;w,z;s$ewLttim7;r4FsC;cOnM#mL;!?;ad7eL;d7l;[GDürbrL;?ü4;an4cQeL;g1izNrd,sLt77;ba7#L;bü7hrG;llov05#Lsu.J;#LD;am,/pG2&NsLu.b;aw,rrL@*C;eh1;lgLr6;rAsC;aReOlit,nMüL;frA;ag,iL;d18wz1;iMlrLr6w1;`iw;b,s1;lNrtLs4;!),#L;!bü;hMkL;!nK;-7;.2&rg5NürpL;$an;&Olu$6UnL;ewMiw3Ou1Eäfp,üL;k,zt(;ba,<;$sr51mr1E;mulp,polas,ytoeCW;a3Qe0Hhük0Gi08]znKnüd07o05#RuOä#vuos,ö$sNürgL;!]fL;pa;!dlib,m_f,),#EY;.bLmmi,tr7V;!ßL;un;blis2RdomXfslI$W&lb,lhä2nUsRtLzlV;$üO+MsülLxe;!snoitasnE;!&L;trap;h5nL;!kHO;&Lälg;!ssLßL;ug;&2rLöt;öh;=b,s2Vönk;!$oh,),r8U*op;hpLtonom;ordauq,ylop;!$uI;eMffa,+mef,plaL;!s9J;fPlkeztilk,m%OrL;!nLrKZ*a;eLu;bu2pul,s1;!lla,sG1;!.txe,keip,);!llot;b2Cd1Sf1Lg15he11k0Wl0Tmmo0Pnnos1Or0BsWtMzL;lDLnorb;?Fge#gfC$SlO<9NtL;iLos%trI;n$s0Rr*muL;!),ßiJ;ahFes,oL;g%MhL;-1G;ba4;if,ofL;%<4;eV)d%UsL;eQiNoL;$s%f@59lL;$st1R;brAl$s#z,rL;%,muL;*ef;gr1Wme38rf%lhak,sL;eLrA;g+J0;!fC;lMw%L;ad;?,#L;!sC;hVoM_L;wrA;b%Qg%s3A$s%PrfL;%MrL;ev7;feLtrI;it;lhak,);nM#deiw,tLuen;ot,s6;a,u;afLpozJH;e0B#L;),z;kllMn%n&L;_v7;iwLov7;$oh,);hLlo$46;amLot45;%n&f;cM)rtLrib;faFXllG;ab%$s~f,orL;$sLt;#4;il0s%L;nM#hL;_v4;a43r0;eWnRoL;h9ClPmoh,#OtNzeL;bsfLg4;ur1;of,@;!tJ;ah,f%*&m,rA;aNuL;rd%ton,seLwzF;b]iv;f1Zh#vL;!(klow;id0lL;eLt(;gLt;ba,ehan,);fOlohN_wt(,u>L;%L#t)EB;ßiJ;?4;a$s%uen,iMoL;!sH5t]w;lhHKrg?D;>ZeiV&UlSnL;aPubL;%L#vd6;^IkM),sLt&z;g)s&w,&8;cewz;hrG*#vnL;&,u;ogLüg;!t$e;$s1Cs;$sMrfuzL;!),*04;%,#vdBHtL;(4;eLokoh5;bdlFIgL;mLsn9V;=L;bo8;eRrL;afNoL;drL;ev4;dM$sLn&*nr1#deilf;&lf;<s,#;gTiL);lb%gRrL;$s%MtL;#bü;nM#d<n&sC*L;blE;emmasL;uz;~bü,)j;%rHLr0U;bru,fo8mPr#tOtL;lumis,nL;emom,oL;m,ps;idem;ohpmyn,uh;a0Ge0Eh0Ai07m02on01rNuMyno<,ü*F;%4;.0hFQ;aPoL;fnokMnL;ba,e;!me*L;ys;ffo*d9T$su.,lSnOsNtMwL;!^Ihürb,t$uef,u>;kaBXtef,ulb;agba,noitat%A;eMitokL;in;iLnnos;_lak;[t1hazh/d;otC;>k,iDDorfOuL;dM*L;!b@t;!hor2@s;!mm>,);eh0tL;iL+;g=,rH;aNenL;eLrG;g<7;ll%ülf,z;rtxe6KuqL;?7;fDgylop,sL;be0Cd07g03h02krZlXn&WrVtLu.g;.,$TiRlMtis,uL;`1h1;aLes;hLw0;fMrLt(;[4;@4;?L;ra;a7ruf;aBe9HohEC;!m0;hüA0&Loh6;h,ttim;emf@7iwL;!?#w,nCNsL;mukilbup,n%ömrA;caw,ur0üm;eL&EUlof,<l,_s,ärpnKün0;iLw4;b,m$sL;!<;e~f,&Olud,nL;%MiL;fpme;ut;lk;iLr2;l4rt1;a3Re33h30i2MlQoocPuLüEJ;afLwh5;!bMknL;`,i2;&CN;!ru;e12i11oL;!d,t,vL;!blId0Ye0Vgn0S$0Qk0Ol0Km.g,n0Hr0FsStMzLßH;i9<lg,#98;f.k,$a8kePlOnM#w,sL;)k,ul;ema#L;pm[;ah0;ffe,ps9;fruwrGg)U$urps<,inRkP(@OtL;$L&hoh,umhew,ätilauq;iskLusnhE;cür;rtrA;curdL;nKsC;dLgnäOm&h0;nätL;srA;bWgaVkriw,mTnStMß&L;hrA;$aPrMuL;`1;aw6oL;wtnL;.A;$oh;ffoh,ha;mi2rL;ab6;st(;%+h,las;eLhaf0omuh;d)w,mmaj,tk.a$;>p,eL+s;g_s,p3TrL;he;aNhMiL;eh4*;üf0;uq;caL)8;mhD8;a83suL;är0;aLuD3;lLrd;?,k;beil,drMhüm,iLnnow,u9;sat<hp;üw;&l,u/f;rh5*;e0Xh,i0Im_f1YnZrVt(mUuL;dSnHsivRtMxesL;!ib,omoh,r47;i23kL(ve;aM=l45nL;up;!dL$oh;n.b;!oidC;.g,iv1I;i#pxe,ur2A;en0g,utL;an,kMlukL;!i44oizos,r3W;)jn3ur2;$s01iYoL;iLs#p;sTtL;aRiPkN(vn3ome,peznok0EutiL;*nL;i,ok;aL)f;d9rfr3N;d.t,sL;oppo;r,snE;akMsefL;nokr3Io8;ko;gi_,hMmL;~k,on;-H;!l&LrGz4E;fp;piz+8rVtnPzL;eBiffo0ZnL#28;aMeLivo8;d(t,m`,sPtOuqE;+f,tQ;atPeL;m`,nopN#WsMtLuqE;op,siM;se;xe;sbus;aton,eL*udD;s,tL;am,kabLs30;!it<;di,r;bWeTgaSnErQssPtOvNzL;.g,iL;ffid;iz;bus,<fD;of;e2ruL;ks;!rf;gnL*;efL;fa;aLom;l,*07;aMoLük;h,w4;f,k;bMde,eh5kLpmis,tK;iJ)d;aRiMon,üL;!&Bzt3;(p,sMtapmLx=f,zud00;okY;(sL#v/ri,sopmi,u>p;!rL;epyh;d(BiXkitkaWm>b,+lk`,rQssap,tL;i0SkeO(r7pezkaT_NuL;ksLm#p;idD;fm26ps09;ps9;apPeMoL;da,noh;poMsimL;!s6R;!+;/2A;rp7;rav,tLzL;i*uj;b28d27e25g22h20i1Ik1Em18n0Np0Mr08s06tSuL;dQg+lNtL;iL(zo8;riB;!aMiL;b,tlum;rtD;!is9;aXiWkVnMot,_m9MuL;rb;eMoL;rf,zi_h;d,mN+tnokLrap,z>p;!r1DsL;n.t;!aNitnEuL;nom,rL;*D;d)f,n_,rkas;.f,/;b_,gid,n0v;f,n99;an,sol3@kL;!onom;eRkas,oPtMuL;gif,tak~ak;eM(zLuen;!`;maid;(t,pm[,sseL*ap;fo8;bilNdMt>L;!ib;öf;!laMsL;k+l,t0I;izos,nL;oitan;idö,p~g;ab,emonähp,iZoMuL;mm3;gWiLruen,yrbme;g/Ts(midRtL;aOidNkMn0Jome,_L;po8;if,)f0O;da,n3;nLr0V;!r0E*op;!&5BnKrL;eMhem;!#L;bü;aid,ohtPylop;f,gNmLru;~k,onL#t;!o8;iLrH;_;hp;h5iOo<,rL;eht,oL;f,nL;!ba,);+m,s[i+fDtLxHz`;po;iLkub,ol,äf;d.L*ur;!stL;$9;dYg=lXnWrOsanmyg,tn%<t,xa3zL;>g,osL;!a,),ohL;cysp;ePoL;g[ak,tL;auqä,~#tL;!rLxe;[D;pM*L;i+m;mi;%,ol3;ok7;.,emL;!iL;tlL;um;-@p,pL;mu~t,or*atak;=Muf~L;t(z;!li;di,rL;!ri;om,uef;oLrA;lg;c03it<,nRorpiz9ra*MseL;akfak,torg;!(O#deilgtim,sMtL;$il,u>;gL(3J;)*&l;g3Lt3Kwöl;aLil8D;lQrkL;!dot,eE(N#7DsLt$us;b/k,e3E(bLt4Z;#2;gnLv#n;ul;bM$sL;!llG(tr0;!]MzL;tilb;geiB;ePiLorab,u21;dM$sL;!dot;!]L*@f;ppünk;j,k;!b@2^0Fe0Bf6N&lb,l06m05n02ot01#YsRtOzMßL;uf;lL#1T;oh;eim,$.f,k=aMpez9rLsor;ew,owdm/f;id;g)Q&PlNnL;oitoL;me;efL&trurG;&wz;!rk;rö2traw,zu/k;beif,lhef,tLue2;l4ZtiL;lBnk;_p,@;eL&ff3;bagba,dl4Vg_s,iLrhüb0seB*3;mä8;&k,ru2;eOhaw,lMoLuh5;hokla;af4oz;);d+67gGiB;eNiMrL;uäs;nk;nh5;awnK%L;uj;an,cSorOp_mNuMäLürf;j,z;.;osi,ylop;!fL;!liJ(Lsn4N;braf,dL;ah5;a1L/f1J&0Alos,oh,sL;a08büh05du/f,l02mm~g,n&t01rXtu`Luek;!dU$ohSl[tim*o,rQsOtLßorg;la,mMsLt>p;ew,o;as0;d<lsCeLklG;d)b;eLu;nDßC;!]Ltla,uen;ttim;rLüs;on;aNiw7oL;fLm;!ssan,ßan;b,h;snK;afLök;!dL;)rg;!dlib,#L;^L;uw;l,r;l0OrMwL;!]2Xmu>f,#ttub,tmas;eig#(,flih,g0F$sif,k+2lhaz,mhur,n07okis~,r03sNtLuen,ßuR;sLtef;.0Vi0;g)ZingYlWnSrRsuOtL;$iMlL;ahD;ssC;lLn0;fnK$L;sfC;he4D;eMoL;itid.t;gEz#L;mh5;laL;fnK;&6;d+f6ls$ewba;eLh=;dLwh5;a,lib,+k;~;eL&2;braf,daNg9mulb,närt,tL;laf,s0ülb;/;ng;ur;az;if;aOeNlM<fL;mu;of6;is;rt6;ih;(;bOgL;),tL;iLra;ez;`37$sa,(tot;!ztL;or;fYlf,rb,wL;blI$sLllJ;!knV(Srutkur2sOtL;$MkaL;tn3;il;eNint$äd0(MrL;[la,he37;lliw,mmoknK;*i0;gMtL;rub0;>fC;`;d(s@t,giQ&P]OnKrhem,tL;hR#L;^L;uh;iv;rd,wz;nnHzL;!thL;ca;nRolaQraOulkL;!lam)M),tlL;a,ew;en;!kL;!trW;<;>NeM~0ujL;tulb;!r2tuI;!eUm@b,(N#tLsn1M;emLl1A;!olik;d)P$OlNtL;iEunL;im;iX];ow;kE*;es;rhOtL;nhezMrL;`)hL;rhL;aj;ei0Af09&ToSpmRra$sL;!nPrL;aIeL;bü,ssL;em;ah;(rt,u;ud;od;rM*kL;co2;!hVkcurd,l0LnUsQtNuMßulhL;-1;ab;$aMrLto09;ezn3;lh5;bu>Nixa8tL@h(kn.k;$=h1Z;rp;ru;enhüb,u;curMüL;rf;bba,ps;.2oY;$sLt;d+w;brüm,d09g05sOtL;$as,sLzt=rG;?L#L;#lla;&Nol,öbL;!#ttL;ib;l,wL;bW^Vkcü2lRraQsg<PttMztasL;ba,#;aMiL;rh5;lb;wz;ap,tkJ;eMhL;aw;^L$sL;üb;ub;uh5;güNäMöL;rd;rt;lf;a#gnXilWorHörBüL;mMrL;!p;!dRhePsL;nMtL;ma;?L;=;snrL;ef;ot;am;os;ezrLu;ek;üm;af,i13l11m/f0NnPrusOöL;lbLnh5;!uL;as;ba;i0E]07olb04#TuMäh1;?;rNsLw;%7;!);l%N),sL;&L;rk;uk;dOg>Mk+wzn%C;@;*L;op;limfQolllJröfL;löd6sL;f@L;krA;ev;#;.2;!$M+taL;lp;sa;dewz<Q$älOmütrMttü$sfp3;ok;[L;la;tlL;ak;wh5;lbNwhL;-0;%;!(braf;!dV$af,#TsOtL;lQrL;a,oL;d<2;klG(sNtL;iL_;ek$ilkrR;ew;ov;liL;[;lMnL;>;iw;iLoh;m,w;brZfrYg~XoSpQrbPziL;mMtkesD;+;#B;ps;yh;.,u2;*;n.O*i$sNzL;ih5;-;af;ap;!f;ep;om;$;eilVlSoR#PuOürtL;!rL;utL;an;at;d,h,pL;us;rg;ah,%L;!#ttodK;&;!),#L;^NllaL;zrJ;eh;ik",
    "MaleNoun": "true¦:!1:#$%&()*+./<=>?@[]^_`~:hc,re,ne,ie,ts,na,ir,er,ni,ro,rt,st,an,nu,ar,le,et,no,ra,eh,es;0:CG;1:CA;2:BZ;3:AJ;4:C5;5:BQ;6:BA;7:CD;8:CB;9:B5;A:92;B:CO;C:CM;D:BJ;aCWbualru,dCFe9Xf9Ug8B#89i86k7Yl7Im76n16o12r0Os01tLviv@,zEßuf;&Jloh1nFtalpE;!tk_m;aGiE;`Erp;!-0ZlrB;lg,rf,t;grhe,r85;dQfOiKk_mJnIorHsGuEz_;alt/w,h,mEnk,okalin;![h,?,tr7;],*uot,rud;ep,$ip;a4Forffa;!$pus;d+k,+(Ffo3l2VrEteppa;ovaf,ps;!=E;#8l2J;asEi(tor,ud;!%(r6;iFloF)rb,orx8_hE;[g%,r6;mh1;aY&wsAmXnNoKp>h1sCtEub;aHejG#Fi5Kkil3Fl2C%.21/pria,s]E;!mota;adr9*4;!wos;a(lAWnErla<%z,te;~,om;c_ppih,dFhtym,*,.pilif,rEssacip;+ot,tub;>/t,$f;aMeIiGn5Yoggaw,rE;ez^kEub;![o,otA;eEz30;#s$rheuf,r9;dFfahg7Wj,_,sn0(Ewo;ew,o;ah1eE;iDus;f,ri;e0Plif;ihttam,lta,mE;i3$b7;a2eJotI$h,uE;eElf;d)mm0lg^jz1Rn$vuog,ss2TtkE;aEeps.l3Z;!d+fe#;i^m,kejo3;b&r#s[guk,gJhIkcuHllGmmos,nFrhel,tEua#suz,vollup;av,up2B;hown5l[k;ek,üf;rd,z;col,~n$f;&z,nErubm7;if,uh;akBg.G*ottiv,kt@,lli2Mr(ac,tE;ama,e,to-E;lrB;!r;eK&J[kIoE;cab,ge,klab,ll*om,m97)bil,pCrGsFtEwk;!.lc;dl>od,kcaj,liw,$d);ebo,ht,uk;it_,sum;#srhaf,w;atipBb54d4J~ua2f4Ag3Ph3Iial,k3El33m2Zn2Vp2Ur2Ds1UtKweol9GzE;il82.3teaE;lpHsE;!nE;a,&E;!fpmB;!krC%idu2=&b_;a16e15#i$b14i10k0Vl0Uma4n0Go0Er09sKtGuaEz$a;bE^r(a;!uen;aGiE;n#sn5r#sE;!t/f;h1p;akfe*b,eYiF%id,oZrEulr9yla);ak,euf;#UlPmNnKrIvEybbol,z1R;itkaE$s8;!-Et[wmu;i^go,meE;lsom;#,or$t,uE;j,ot;oFummokE;!-xe;ga09pm0r#;alsi,+txeE;!=#8;aEiviz;izFnEt%mad?f;o0Wruoj;eps,osE;!g?j,l0T;_),=E;up;agGto3wE;!dE;eus,/n;!$ua<;agHeFoE;d)2/v;ag,pxeE;!%#)rb,zY;!r2C;a#,b/v,*pyz,lE;ip;aMeE;dGga,h@FitCmusn0.FrEsse$t.,z7K;ef8rukn0;tn0;isE^pse4Iu2;e@pEsid;!-F$(i.m,sE;e06^issimmok-ue,t8U;xe;dnHfe[,rGtE;%se@p8seE;to3;efeil,gime,(^med;am,].;ahsu7;af,eGil0F?p=#is6$amE;!t[w,zE;).f;psa,ti#E;_;deLlGrE;b,ovE;af;[tas;~se3sg?t&z;@sbe*t4)lp;a(LdHe4Hisa,moG^m,oFrkomedE;!&Dl7O(*#;rk;lpid,tA;id)kGlosE;!-Er1Esfur4t&z;?,su;!=fa#=%disea3;!-KdJe*(ud.,lHrGsE;dIeE;d?b;ab#>,emhenl&t;>oE;it>;eilgtim;-g,htlaew^mEue,xu[n4;moc;eR&rkMnJo66ruk,sEtolg4I;as.,eG.l,o%gFuE;ahlh0b,r;!d5t&z;o5SuEzo3;f,h1l#s4;aj,ej-n)melFizE;!t&l;[;&zHsFz%$E;fn0;g?$Et23;ig8;ilI;b,iFm>teE.#,o64<;iv;guEr;trE;op;eQoE$h,ue5K;i%s,sNtE;aKkFor,sEua;ap,evK;aGeE;rEs;!lu#s#oh;fE<;!okis*;itiE%s,si)g/;.;nEsefo3;~,ops;aGiE;gaEziffo;ssC;^i54t+k~=6V;!-(ew;a$t9eaGheol,&FnEomead,$5Py(r9;if,urb;$v=/,(;d,lp,mur;>,o^Fsi)E;g/,#Z;keo,<E;sa;av*,eNheu2iLlE;eGiwFubE;!t#a1V;!?;aFb+E;!%limat;fE(;!emh>sA?;]Emat;),tda2;@1R;aGcFil20nE$ut;ad6ih1;eur,orb;h$d&lk,wols;cGposo50tFu#srE;ed.k;ym;eG&r4oj28_FsnEuk;em;*tC^m;#=,*g;aVeNnMoHpeid,rGt&FueE;!hr9z%gA;lp;euj21om;bHloE;eF#ysp,ib,kE;eo;di,ht;!egaD;eurps,ilth2D;aH*kt[w,llokFrs5s,uE;lfsAz1P;!=E;ma;l#sG<E;fAi4$vE;![zn5;),/v;h-1NwE;%fiE(al;+2;ahLeIf*gnH&r(GpeoF$uw/v,uE;ah%br45eakuz;k,t;-azag,azag;a,&;ahGiFohE;!nhab;rb;!g1U;af,eVlUnGobEruk,uj;!rhe>,ßE;uf;eGukE;!%mrEssorg,tavi3;if;aM$id)mmok$LurgHztis/vE;!-E&trC;dEllatem-gi,usc;ps;!%(0sE;%ssFtE;&h$#is;iw6;bo;br9(E;mu,uz;`,ug;aEiDob,us;f,#sEl;!=&hd?s6;a(#ub,rE;~;eOrNuE;aFsn0tE;#i8rri;bJrE;![ipsHsGtE;!&zE[w,pla,=#>$mmos;!s+haj/v;%bel,sorg,tfa#=riw;!sg?ldn7;!=#>h&w;a,i#sdlib;ta,ulb;aKeGhFoE;hokla,op;a2u2;fGmmih,ssE;~,üE;lh1;föl,pa;!asLd)ksJed,giIht%znHnGrFuo$z,zE;*;en6;ak,idrB;ub;j,y;!s^itpuE;rr0;!=#*6;>g0cKiF)rh1rE;ap,iz4ob;+(HfizapFlEr%h,t)lta,ven_b;ohtB;!deE;us;!$g?h;or;+Fmmug$idE;@;b,#sfA;ipp],ok,sE;it,?w;at0TnNrFuzE;!);as,eFoegEubz.g;!sn7;bGojE;!-E;sn7;!dlF%E;dluh1lliw,tlo2;ef;aTeSiJodIuE;rpsFw#sE;!fA;!rE;ov,u;ez;lInnHpGrE;!ef]%E;um;oaix,_h1;`;ebe,gn*dn5hüDl1ItEuen%s00;hEpue7;ceE;ulf;d,m,p;fYgKhIij,lkn5rGsFwE;h,z;eg,i;!dErG;);!n0MrE;ov;!ba,#rQk06lhPmu,nIrEsAuz;eEhUov;beuFdeEt?;in;!z%rg;eI&E;!lG$dFsga<fA;ua;/;la;nru,sE;$ob;aw;ud;!mu,)FpE;me;!s+hFuE;en;aj;!sE;%Etrub6;id;ohnhab,pmur2/d%rhFurE;eb,);ad;b1Md?k,e1Kh17m>,n0Mp0KsEt_k=t*tn5;d>d_w0Ie0Dh08&03lupmi,o02rXsE;eIiGuf,üE;#s$beu,l#skE;ceur;morEr;pm0;apPoMuEzo3;f,#sJlE;fn5#sE;baEeb,nL;!f*FnhE;ol;at;!sedEuz;ot;(E;nEr9;emmasV;!gE;%;eHukE;![s#F%iE;tka;ew;iht,v;z)D;rGwE;eb,nE;ih;k,pE;!$#u@br9;cE+;eawGäwuz=eativitkE;udo3;rp;uz;*FoE;l$;!eimeF%%E;ih1;#;`1;lo2piE;lihp;eTheRiI.Fo(dlog,$E;(,zn0;s,wegE;!s%mhen$tE;?;at^fLeHmE;aFrE;];il;r9(Ew;!uE;ab;ev;al;az,oE;l,s;alpFg)f6ot;eg;!lE;aizos;>;cFeEuh1;ur;eurLiK%JsHus$vE;d)l&DmoE$it;ta;rf;iEom;f,t;om;+4r(ba;bn5psE;),$diw;&;ffBnh1t;uk;eFiE;el;a(ssJ*tebE;!sE;soGtE;aa2;(;rg;am;aPlEnS;aH`,ohE;nFtr4;eb;aGi8;r7v/IwE;!e,%g8ru,so,z_E;wh1;cs;+;ht;ah;iws,rE;gsg?krFn0;ok;iw;ru;idru#asmMkJpo,rim@BtFwazayE;im;euziFsa,tenC;ap;og;ak;#sF.yE;os;oj;ag",
    "Adverb": "true¦:!1:#$%&()*+-./<=>?@[]:re,ie,hc,ni,uz,eb,os,ed,ne,eg,na,an,tim,nu,ua,la,ov,en;a2Xb2Qd2Le28g23%1Fi1El18m13n0Oo0Jpp<k,r09sLt2z1ß0;iw.,olb;/g,tort;eHfGg&d)>,%$lMiAmas9p?h16r7s1ug*u0Kzte0ßuw);j,l(;af,bles,+&m(,%3$m2n1#0uj;!r[,(,ßuä;$,*;!(;i21än0;m+,(;a#d,o0;d,f2;!e0U=;e1m0;*;w2z#0;d0&Z;!ej;>,*&;ahrhaw,o;n%e#gs?,t%a.>;d-M+&,gnLknVlA-7#dn5t1u0;ah1Ks14;ets,%2ro0;nrA#0;leiv;<,is./;a0*);!ow;b.0Xg0m<;i0rom;e,rbü;am5e1E$4@f0;n0s]$k,t7;e1r0;+/;be,dej,lTts);t-tßörg,wej;ad,e3%2r1t0;fo,s#;)a,hem;on;he,in,j;af/,id#lM;grin,hes(;a8e0h6[(,un;b4d3h1ih,mmi,n#f,p,t0ueh;$w,>=;e0sib,ti3;!j;eQ$l,/n$=;e1l0;es;il;gJwz;rp,s2t0;sXt0;],urb;!@,n)e,u0;a-g;<)],e6i3/d,o%s,r0un;e0[;f*&,g,ts.0;!r[;el1h]ho,rd0;!-0H;@;b5ge4%siwz&,mmas(,n&b,ss+#t3t1ß?0;!rd;>,sn0=;*Oug(;>;g&h,w;e0o;!*;$h2u0;ak,#de0;iw;ad,e0;gs&;am4e3how2$wr9@0;#0;bü;!%$lg;iv;$wz,nG;ot,sauq;i4o0?;d2n0;!n0;+;ej;elgHl0;d-EgD$rf,mCr9t4u3zrük,ß0;eil%s1äl0;/;!n5s?;];%isnSn1um0ztA;#v;e0/k);g0m2;$;e%is,h1üt0;<;aw;eZän;id1lof,ömow;!tzt0;el;!*,(;ew2in1/ls0;ib;ew;h0rO;crud;d7gat(5ha&Ni4j,l$w#l2nrB#dn*)sKs$w0tu6visulkK;l$t,#%i0sleipsiM;lgöm;tt0;im;n,wd-gB;!tu0;eh;ar3n0;al(#1urg0;(;ih;.;@b,n0;e1ur0;!gf4;g0%erpst-;ri;a3@h#0;n1ß0;?;&;gr1r0;[;);cric,iv,j,kr0rtxe,wte;iz",
    "Infinitive": "true¦:!1:#$%&()*+./<=>?@[]^_`~:ba,re,hc,eb,uz,bü,na,mu,ts,cs,ie,kc,ov,er,ni,eh,tn,ar,ei,ok,rt;0:13W;1:13J;2:141;3:149;4:138;5:0XJ;6:12B;7:13M;8:12V;9:10P;A:123;B:12Z;C:0Z7;D:11B;E:117;F:12U;G:11N;H:106;I:10I;J:134;K:10B;L:12E;M:13B;N:12Q;O:0V9;P:14D;e14Gi14Cle=iw]e149nQ;e9H<s,le4F$RutQ;!#,$0MMtug,ßorg;b42d3Ef38g2Uh2H<2Ek25l21m1Pn1Jp1Bs15t07uSvlup5woRz*p,ßQ;<0TKuä5ör100;dlabCpC;a00eRäsQ;!nA$);fXhVn$,tQ;&,r1sQ;!&,i6nSr1s0Z1(Q;!nQ;a,egM;a,egMih,rD;!/Q*;!#,f0h2$104;!#,&,nAr1;dShdlib,k0W8lRmQ~0S1s5;!n4r0SY(;!&,f0;!&,*,$),s0trF;flah0JK%0L<0Ikod,l0Gn0Fr0Es07tSuQüg6;eQäl$;al$,m;a01eZiWoUuTälbSö0ZGüQ;fQ%s12X;!#,h2$0Y7s0;!#,f0h2+,@h,t3;b0D4fI3m6;hBlQ.G;!hBr1;br1g027lRnk0HXwQzG;!eg,t;f,hBps0BE;alb@h,lk,m%sQuhJ5w;!#,$0TD;g$,lfQnL7r;!$Qt3;h+,z;aViTlopBOmah,uRäl,ülfQ;!n4(;%sQlpOm0CV;!th0VP(;eQnk;gIlk0EBm;#lk,r;am0XFeo$,ö$;e00Yiw04L`,umO;a5ekCifQo0FBuhB;!s119;!hRrQw$;br1ev;!/,f0$;el0S7iQü0S7;el$,~K;aUnops,om,sRuaQümalkC;m,nk;eQi0LKo0HMuea5äwI;bQor0YI;!f0mmil0S1r1s0u0KW;f0YDm;aWloVmUpSröJ8sQ;ak,iw,uQ;nk,är;alQ[Bilf,unh0X6äl0QM;kGp0QN;elp5ilk,ü.;h,.;h,k,t;_w,hobU<Tllek,nRpmelk,träg,uQö0RR;ag0TGegiz;i$0XQodQ;!f0$0YJsol;fr1lk0XTmegll126rhBt0V9;!guas;mQor.;aYeXiTul%sHHäRüQ;k5~$z;dQh,l6;!n0W5;%sSlRw,zQ;!th0UM;f,g,%0V0;!h2ro0PS;l6uk;j0Y4lkQ;!+,n0WYr1s0t2B;_psu058%sit,lQä8G;abA2ekRiQub,ä~,öb5;hB~;!n4r0QY;cTlöv6mi,nRop5$kKöQ;hr1mhB;a5e0GMiwz0BBuQä07J;bKlf0XV;alTeRolOuQ;lg,t;lQm;hBkI;f,k;!fRlQ;!%0UH$h,s0;!#,%Nk0GQ;cSeQ<r,änJ;anQiw;*,(*;ah08M&,iVo.,sTuQäf,öl0F9;wRärQ;!hi0KYn4r1s0;!&,$0VW;tQäK;iwzGälp;eSk,sQ;!#,n0R0$vQt3(G;!%9=ür,$KJ;ps00Ur0SC;a01eozr1gab0OTiYlXnSrQäw0QGöz5;äQüb0VM;!r1tot;^pJea0UCiTuRäQ;lr1whB;hBWlQ;!m0O4;lhBrr1;ip,of;eQt;.Qw5;!$0OU;lQmG;!#,&,+,nA$0VCs0;_TfSgnujt3<RpQuCäl7K;oOöt;!%9$;efp5iz0L5;h0PSlQ;!#,&,f0%9nA$),s0(00;ah,de0Ce08i07li05nXolOrUuQär,ökJür0S4;aSel%sRlQpFSr0GC;h07Qr1;!r1trF;%s0VTlp0OKz;eofIoQöfI;!&0Z4fQ;!#,f0%9=8nA$0RVu0O0;awVeTiSosRuw0LSäQülpC;!#,+,r1;#,s0;h0LPl,m5;a5l%sQ;!$hCS;!#,h2=8n4$Qs0(;h+,]u;b6%s0PZmQw;!#,(#;e0CTw063;fSiQlG;bJf,lgQ;!f0h2nA$0FJs0;!#,h2(#;hr1lf0UA;al05bX_fWlVo$UuRöQ;r0VN.AP;azQäs;!&,g7n0X8rQt3;e08O>0YI;!=0YSu0OF;a5i0SO;!#,ne09J;aRiQulb;b,lg;l067nk0FFsI;b4Ac04Xd3Lf3Dg2R%2Fk1Zm1Nn1Mp0Zs0Kt02v?f,zRß<Q;g,m0FB;nXruUtQ;emSiQorf,urb,ümr02T;k,psIrkQw;!llH;!$0PF;p0RRwQ;!nAr1tQ;ne,sD;akGiRuQät;mh0TWr;?1lb82;fütC%05i04näm6r03s02tRueQ;b0B3d;as0AVeWiUüQ;%sSrQ;!f0%Q$z;aw,rud;!#,f0h2s0;mQrd;!$049;bSuQz0RP;%sQr;#,(#;!#,h2n0PS$;ab,en,ruwDEär1örf;_v,ut,öm;?1t6;aQiw,uf;%s051ps5;af,_03%01irk,=äh0T3nZpYsTtär08ZuRän,ördQ;!f0$z;alF9dI?.,rg,w,äQ;rk0T0sJ;aSeRord0POuf,än,ül%sQ;!f0r1t3;f08TkKul%WC;mr1rQuq;!h2p01$]0LO;ak0OTi0B8ö.081;iQäh;p0T5w;ewQ<d;!#,n4r1s0;n,pIr0C7;a.0B_penho0BElötZVm01op,pSronEWsQu^g;aQil;h0XNr;aXiWoUukTäSüQ;nkQrES;!$0J3;p05r1;!#,n0P0r1s0t3;d5h,kQ.;!#,n0OYsol,t3;~,t;rOzG;aWeSurRüQ;d,~3;h055$);rR.Q;!#,<rf;!kQ*;!f0+;h,~Q;!$0NRsQ;!#,ßolb;!f0%oh;hä,nutr0MS;ad,i01MmTrum,uaSüQ;rkQt$tla;!&,$0TSt3;b,t0SX;aViSo~0LLuRüQ;l0PVmK.0BY;b5f0IXhBrg,t;b,hRwQ;!#,$h+;!/5*;g5r5sQ.;!f0nAr1;a04c00eJnW`5rUuaRäQöpK;h,m,r;gR%sQ;!f0%oh,r1;!rHu0D8;eQiz0QTot,ön0MI;f,w;?psIiSuQ;dQfJhBm;!#,%9r1;p,w0PR;aw,iwRuQörb04Zü.0BG;hBr;!#,n4r1s0]eQ(#;!$0WV(0WU;kIt0S0;aZ[0AQiXro09MsTuSäQör;f06ElQ;!&,*,(;^.,[0SX;^,tRuQ;am,k,n,t;aw,äQ;h5t;eQp,.;m%s0MYr.;kVB.Q;!f0*,t3;a09e02gumBLiKnWoVrUuTöv,üQ;bRlQrpB1z;f0F8kC;!f0$0HDs0t09S;kCäCR;i2Xo,ug,ön;m,og;aUeuq,iSuk,äRüQ;lk5z;g,l%s0A5m6rd;lk051rQt,z+;!k,n0WX;!h,m;iRkClf0OJr,sQ(;!&,h2+,r1;psSrQs0HKwO;!#,n4r1tQ(;ne,s;!#,rQt3;ediw,>;h0AFnQ;!f0n0MUr1.D(;a0E9eWfU<wz036pTrüw,uQät5;a%sRetr1ä~Q;!#,&,n4;!g7s0(;ig,ö~;a.,[BirGum,ölCüQ;b,nh0QDs;i.,w%s0Q9;a0Dd0Be07m?f,nXoWuRäf0BGöQ;lb,~5;d,n,rQsI;psRtQ;!#,n4s;!rQsu0VM;&ü,o0JA;j,m0JHr7L;aTeSiw%sRog,ät5üQ;b,z;!#,h2*,rUR;p0PXub;bJhSwQ;!#,fa0A7+Q*,r1.ul,(+;!^t;!#,c0O8&0RFnR$QsZ1u0SLßE;d0JOv;eg00W<;iQr1w;f,sQ;!&,+Q*,$z,s0(*;!sg*wz;apJuQ;b01CmhB;!r,t;a05b02e00oYrWuUäTöSüQ;d,k,rQ;ev,g0J4;mDNpJ;s0UAwhB;jQod;!&,%oh,$0UD(;e0K5iwQuk42;!f0m0HYzO;hQnkC;!#,t082;hs0iwz,nQ;!&,k,n4r1;aRirQur;!d5f0k;rJGs,w016;gOkr1nG;b0P6cric6d0LZf0I0g09Xh02Ui02LkZYlWDmTAnR2pQArBXs9Ht46u3Fv3Dx39z0MßQäs0I8;a0J_07<Vo.Tuf,ölSüQ;bQrgIs5;!#,n4r1;bt3fK;!#,d0R0f0g7h2=8+,n0LArQs0(;e0AG>0T3;b00hYlXm%sVrRw%sQ;!n0L7r1;!#0T0f0g7%0QGi0O4=8+,nR$Qs0P9t0GF;d_n,]0HFv,z;a,emPiQ;e0IGh;!f0g7%9+,nQ$z,(;a0B0i0SB;f6h01Cps;!/0LAr1tQ;ug;!#,f0h2i0NVn0KX$0Q8s0SB.D(;gZ%sVlRnMpsOrQ;dr1ps09U;fR%sQ;!#,&,f0g7n0OX$0HYs0t3(,zruk;!#0SMfu0TYg7h0AGi0O5=8+,nSP$Qs0(;),]CAv,z;!#0SK&,f0h2i0O3lhDn0FRrRsQ(;ol,ua07C;eQ>0SI;!d_n,]0GXuq,v,z;!#,&,f0%9llH+,n0RV$Qs0trF(;!),t@h,v;mQps;!*,tum;_2BfuesO%26<23l1Tn1Ir16tTuQälf0LZ;an0FEd,eQänh0OM;nh0OLrkQ;!f0h2nA;a0Ye0Fi05oYuUäSüQ;%s05KnI.Q;!#,f0r0IK;!%sQ;!#,g7C%oh,n4$06Rtr7;m%s0BYnSpR.Q;!=8th0LV(;!#,f0kMA*,r1s0RL;!#,&0OOs0u0QL;k092lTm021rQ;!aRp,tQ;!#,s;mhB;g0KCkQ;!nQ;^,ih;bi.,h0KJlXnWpsVrTsQw%s3Z;!ad,#,e6Jf0%Ni&0RXnQrHs0.D(;a,emPiQ;e,r0QR;!n4psQ;!#,&,f0llHm0G3nAr1s0R7;!*,$),(;%sK;bQf,h1H;!#,f0*;a%s07f0N5h0NWlr1n0BDp5sSuQw0SM;hBn,.Q;!r0HU;!#0RFe02f0QZg01%02W<0RR=8+,n00rUs02FtT(Q;!ad,#0RE%R+,nQ$dn0P5s0trF;a,e02Hi0QT;<lg,rud;h0L4rFsD;eQ>;!bTdSh0QN]uQv0NWz;!rQ;!ad,[;_n,iw,n0OX;eu,ü0NS;a0Q5e0OHi0QK;ew0KQne;bQd0EQ;!d*0SN+;r0HEu0FX;lpSmh0HFp5rQw%s00O;!kQ;!#,f0g7n0IS$0OEs0;!#,f0$z,sol;a00eWiz6uf,äw%sVüQ;kYS.Qw;!#,&,%9i0FY+,nSrQs0S4trF(;eQo0FT;),]AG;e0O3i08U;!nA;hSmRuQ;k5.;!hZ4s0;!/5;h,nk,uq;aVeSuRäQüm;g$,lg,rk,whB;hr1rg;ag$,d?k,lRrgQ;!#,&,nAr6Ks0u0P0;hBuaf;%sTlfpSrRtQ;!#,h2m0ESnArHsCtE;!f5*;!&,f0+,nAr1s0trF;!r1(;aWeTif01RoRäwQüs;!#,+,trF;b,hQ;!#,s0t3;awRm%sQ;!#,g7h2nXH$0NKs0;#,$beu,(#;b,f,nhBsRwQ;!f0s0;!n4$0NGs0;bGgChRrQ;!f0*,psG$),s0;!&,h2nA$0LR(*;uRäQ;!rk;ajRj,lhQ;/O;!f0(;~,s;aR[5iQob04UübC;fJm;fQl?;!*,(;alk0JT_hKrQ;a0FGen013uk;aYeRtr1äQ;k0OMlbW9;%sVlbW8rQ;&,fTtQ;&,n0GIsQ;!&,n4$Qs0;]u,v,z;!$,tE;!b0QG=8;b05dr1hYkVlUrRsPAtQ;!#,f0s0AQ;!b0EKf0*,tQ;!&,*,$vQssE(001ßE;!*,(*;fGkI;!h2rQ;eQ>;t@h,z;!#,/R&,f0h2i0K5+,nQ$0CNs0LA(;a,e0C8i0OG;!#,&,f0g7%N=8+,nSrQsZZ(J;eQo0OK;)0IKh0M8;a,iQ;?d,h;!#,&,f0%9+,n0L4rVCs0(Q;!#,f0+,s0;a4Te4Df41h39i2Hk2Gl1Pmae0HMn1Oo1Lpuah0AKr1As0Lt05uVxet,zr0PXäUöSüQ;gr1hVWrbQtKw;!n0NFs0;lQr0P9tG;!f,nAr1trah,(;j,p0IVr0M1;alYeWlTmSps,t,äQ;hT9lQ;!nAs0;!*,r1(ZD;bRfQ;!h2$);!%Nr1s0;bYDdQ;!&,+,n0N3s0;!#,+,*,r1s0;a02eZiVoTup,älSüQ;%sQr$z;!f0g7%9+,nODr1s0(;g,p;%s#,lp,mKps5rQ;!%0IFn0Q6s0t;bRkQ;!n0G0r1;!#,lhD$Qs0;!h0NH=8v;bRf4LkQr,u%ss0w5;!n0G7r1sol;!f0+,n4;g6%s080m$,.Q;!#,eVQ$Qs0u0MJ;!kBWr0PU;a0Be09i05n04o01rXuVäUörSüQ;lMrQwr1;!bC0&,f0%9+,n4s0t3(;!tQ;!g00Lr1;!#,m;af,hCpCrQ;f,k$0JKp;&,ofSuRüQ;b0ORd;d5w5;!f0h2;kRp,rQ;!ft3h2n4pYDr1t3;!h2r1s0;ud0CVüd5;eQl0EFmLMnKrfI;lQrd$;!#,rhQ;eawMäwM;pr1tQur+;!h2*;f,h,lRot,r0J3tQ;!#,*,$027;!&,f0*,$),s0t3(*;aWewUiwIoSuRähQ;!#,f0*,$0CHs0t3;gJps;!h,wQ;rüf6t*09T;!#,&Qf0+,r1s0t3;!$7O;!kSs0tRwQ;!#,f0$0JM(#;ne,s023;!#,%9;lCmoLnQob0IP;&,kQ;!f0n4r1;ak0NHirps,$K;aReQäk$;g0NFh0J2z;f0DhUk$,psTr1.Qw5;egRnQ;^1ur1;!+,s0tE;!#,f0$z,(#;!#,/07dD8e03f0g7%02<rf,=8m01nWppank,rUs0M5tS(Qzruk,ßam;!#,f0%aw,k0NKnQsu0NW.D;a,effo,<,rD;iQne0JXsD;?6m;eQ>,üfad;!buas,d_n,h,=8r0OC]u,(0NUv;a,eSiQrD;eQh;!b;ffo,gQmP;egT9n0F9;<hMraw;aw,oh,rud;bQn@;!ad,bKNf0gir),i6=8+,nArQ(i6;eQ>;),ih;!#,%<lg,=8lellCU+,nAr1s0u0B0;!n0O1t3;a8Wnup,ra00G;as6eQ;bra08l03rQw0KJ;!b00&Zf0%W=8+,nUrSs0tQ(;rFsQ;!#,&,$z;[Q>;+,n4;a,<Q;!@h,r;rud,sQ;&,h2n4$Q;b0K3]u;!f0%9rH(0J3;!a,$Qs0u0K8;]u,vRS;!#,eTgRlhD+,nA$Q(K;),h,ti7v;!#,&Q$07Qs0t3;!=8m<h,@h,$h;g,rri;!#,&,f0%W+,nVrTsStR(CzrQ;a051uk;im,ot;ol0AXua0LD;eQo0JV;!),ti7v;e0INi0KQ;an,oh,r034;^d5cQ;a08e05iVrüfIuSä,üQ;lf,zQ;!%oh,n0MH$);b0GXeQlfGrfIwC;f0DKlQ;!#,&,f0h2m<h,nAro0A3s0;dY&,%sXlUn0HTrQs,wMzr1;!#,eSf0n0IIrQs0t3(0GT;eQo0JI;!h,]u,v;b,d08L;!#,&09RfQs0;pQua;!i6r1;!&,f0+;!#,%9+,*,r1;a,fRh,lfQnk;!h2n0CLr1;!h2*,r1s0;!bo6&,gW%Vl%sUmTnSp5rQssEtug6ßE;e09YfQtI;!$0GHt3;hi7r0CS;hBt3;!#,@h,s0zVG;oh,s;@rM;aXeViSuRär0MBülQ;!&,h2s0t3;d5h0AU;gRl,rQ.UF;dGh052;!*,r1t3;^0M5hQ;!#,n0GJ.D;hQr23sVR;!/Q&,*,r1;dnukCtriwQ;!#,&,$,ßE;b03ewt?,iYnkXot,pmo~C~Q;!#,eW5f0g7h2i6=0KEnVrSs0GCtR(Qzruk;#,f0n0HK;<rb,ot,sD;eQ>;)ODd_n,]u,v,zQ;!$uk;a,eUKi0JD;!h2r1;bSmQn0DV;!nA$vQ;!$t09H;!eg,f0liD*,rQs0(*;ad,eYE;!#,d0HM%9*,rQ;eZO>;kse@l@,rQw;!bUeQ<hJN*,$08YssE(GßE;b,gQ;!%9nRrQ;ed01M;emPih;!a,f0h2*,$0FDs0;a21b0AJe1T%aw1Si1Gk1Al19m16n14o10p0Xr0WsYtol,uSworb,ärf,öQüd;d,lQ;!#,f0%9n4$,s0FO;aRelQmhB;%sQ4;hIlUVpYHrRsQz0EZ;!#,h2$05I;bQg,k;!#,f0h2$hn4sol;a0BeViTo.,uSänRüQ;kGm;!n4t3;%s(6lfn03C;eQm5p05Uw;mhBr+;!#,f0g04%NiYllHmXrRs0tEuQ;b5rg;eUfSpQ.;!#,h2<rf,n0F9$Qs0;!z;!#,f0g7h2lhak,nQ$X2s0.D;a,<0CJ;),t@h;!#,%Ni6*,r1s0(;hUlQnMrps;fS%sQ;!#,&,n0F1$082s0(Q;#,*,s0;#,n4(;/$;ew,r1;f00h,lSpQr0FK;!#,f0nQr1(*;a,emP<0C7;!ad,bW&,f0g7%N<V=8nS$Rs0ESt05Y(Q;!n4$04P(;!b0GVd_n,]UCv;a5eRiQ;eT0h;b<lb,d0IMffo,gnäh,hM=ilb,llaf,mP;brHrf;!a,#,$07N;!#,&,f0%9+,n0EL$UK(;ap,om;aR_p,iQlür,+lpXEo3Y;gKnkT6;j,nkG~,t;dKkSlQt;!mraWIrQs0u0GQ;ev,haWK;b_l;^fLGiQ;rgJzr1;?bRiQub;b,[K;!#,*,r1s0;ahOühC;cS`,rQ;oQum0IJ;kr1;ank0BTelkIiRuQ;lg,m,rd;nk,~C;aW6eQ;!lgZps0IDrUsol,t3wQ;!#,&,f0%9=8n0F6rRs0th0BH(Q;!%9@h,rHs0;eQ>;!b0FZ]u,v0E8;!#,e029%NkTm<h,n0F2pS$Qs0t05N;hQti7v;+,$ih;!giles,*;!c8+,n4;!f0n4t3;!&,f0%9nPN$06Ps0;iWlSnMolQp,wr1;!#,f0s0(Q;#,f0n4s0;!#,f0%NnRr0D4s0.D(Q;#,%9;a,eQ<0AV;gMmP;k$Clf,mr1n;gr1lRrQ;!gGh2sol;bQgH3;!#,f0g7h2+,nA$08Cs0trF;aDYe1Kh0Iom0Hr04ups,ä01öUüQ;hBkSn%sRpsQ;!f0%9r1;!#,f0n08Tr1(;!idep;hTpme,tRw%sQ;!#,&Oi060n4r1;&,sQ;!$z,t3;!#,egRf0h2+,n0FH$QtE(,zRP;!),h,v;!nYO$h04J(;bMg065lkQwhB;!#,f0$Q;!tiQZv;aYeViSoUNuQödC;g,m,nQs,z;hBk;!&,%sRHlk,$RwQ;%sL6r1t3;h+,v;psRzQ;!r1t06M;!#,f0n089r1s0(;b,hRk,nQ.NO;!k,r1;!/Q&,r01K;!n085r1s0;hBur;a0Ie07ob05ä03üQ;bMfRrQ;!#,&,f0h2+,nA$QC;!#,?Zf0FPg7h2i05W=8llHmYnWrRs0FPt06C(Q;!k0H4;eQ>;bSh0FGtQv;i7nQ;u@h;eu,üUS;a,eQiY2;ge0DBmPrRW;<h,u$h;ri;jr1n0GEwQ;!eNLr1trF;!%NnQr011s0;a,iYS;!aZbt3&,gYkVlIm5r1sr1t3uRw0GEzQ;!f0r1;fQrI;!#,h2nArHs0(Q;#,h2i04RnQr0AGsu0GYtrF;a$h,emP<;!#,&,g7=0FVmYFn07FrRs0(Q;!k0GJ+;e0EQ>0FI;!&O;n$,wM;bOfRwQ;!&Or1;! d^,#,d^,&,f0g058%0EGi0AW=0FO+0FDnVrSsRtQ;im,sD;träw#,ua;eQ>;!)0DBdiw,hQti7v;+,rXR;a,ePUi0FC>ad;alkSVeC2%sC1iWoUuRw%sQ;&,$;hBps,qQ;h2$Q;),]u;hQ.0AO;!eg*,f0*,(O;bBKcBHdAP?k,fAJgA7h9Vi9Tk9Nl8Sm86n6Yp6Pr5Rs2Zt17u12v0Vwotät,x0Uyo~koOzQ;!a0Re0QiZlo.,nVoU$TsStaBIudQziks;bQe8C@,o25;a,o;iAAua;v,xe;d,voL;aReQuned;$ffidCtop;lib,@fQ.id;!?,rH;d0FfZjXlUnu51ps@,sTtQ;kaLsQ;emod,ongQ;aid,oL;um;bup,pQ;mQxe;i,`Q0;@,orpQ;!@XG;iR@Q;!sed;dom,lauq02+01nZrYsXtSzQ;anQeps;ed,t3;^Tk?,nRrom,sQ;uj,ymPR;auq,eQ;di,ht0;!g;laf,salk;olg,t2X;oQu;b,s$p;h,m;!#,sid;#,@;pat,s;lp9VpQ;^.02Qs;at,ed@,if;iTloSoR$sQ;!bo,?;moLn?;s#,v@;sn7XtQ;kQluk,om;a,ejbo;#tP5d^g,kave,rStQ;a.,i.Qkulf,n0M;bus,n`;e,gn`,.nQ;i,`8N;a1Ee1Afah@,i15k10l0Yma,n0Ko0Jp0Ir0Ds03tWuQä~rop,übed;kTlSmRpQrk?;ed,ma;!$p;as,o091;exe,sidQ;!h2*,s0;aUeRiQol0P;mo,rf,uq;kRlQ;eks,pm`;ite,`,rap;bQhB;^,ed;!aXeUiSopRujQ;!da,ed;!m`;sQxe;?,sa;f6VtRv@Q;!lhD;!oLta;g,rQ;]`;auqG5eSoQ;kse,pQs08L;!ed,mi,pa,s*~Gxe;bup,sQv56;ed,sid;ezka;#s,d,n,r,uq,v;a02eSoQ;mQr80;!#,e5Z;iro,mSr,sQtap,uq?f;#,eaLäQ;rp7M;al,eTgSiRm`,uQ;gra,kod,r0E1;lT$pxe;es,ip;d,lRrkQz;ed,@;pm`;h,lps5Nrag;ahpsa,uQ;patak,s37;aTeRidN0nupQ;!r6Duka;ffa,joLlQn*,ps?;es,f78;lG~,t3N;deSfoLli#h76mi2Gpsoh,rRzQ;!?,i015;eme,f,ri;m,rkQ;ed,ka,sid;lif,rQ;kes,pQ;pa,$t@Q;!lhD+,ßE;dQkalp,mrFt85;!%9kQrH;cürMK;a2Egub,i01lup,neZoYruk,sRua8SylaQüma;id,*,rap,tak;aUeRia#,uQ;ah,kF;rQzoL;dQet@,p;!a;k034lk7Hm,p,rQ;g,t;d00Bp;dn`,pm`00Az6K;up;d1Zgol1Wh1Ul0Um0Sn0Ho0Gpyt,r06tRvQzäLäporue;!a,orpmi;aVeTiSn[t0oQroma;kr9npyh,rQ;e,uen;lopMRrk;#hpla,h]ys,op,rQ;kn`,o34;mRrkoQviL;med,rüb;^d,eTgSilk52mel,oQ;iQlpid,ra,tuaML;di,xa;i.,od;hQlboL.ys;/,tQ;!am6W;aTetk^a%,f,oRtQutainE;kele;getak,r$t,tQ;om,ua;dilos,lS$til,tQ;eloLilimQ;!e45t3;l&Rop,uQ;käs,pop;at;$h,ttM;aVegomoh,%etM4nToS$RumQ;mi;dom,t^f;bracM1i,l`,mrah,*k,rht@,zo;^QüR3;yt;bru,groTkRmQtob;rMuh;i$QlabLW;ma;!?,h2+;aQelop,ota;lsi,nyd;a01iWlToQ;bRhQponomLQ;`laLPtak;^ap,mys;atReQ;m^ak,tagab;emLLsirk;bS$.,tQ;sQu;!%oh;a.,isnQom;es;e0Cge0B%4Ii07k05m02nVrStRutQ;ir,ka;ipak,ne+r0BGot;eRom5StQutanLC;nez5Ruen;bilLAdöf,nMtil;aVgis,imUoQr3Yu03;iQs$p;ssefoLtQ;aQknuf,ome;n,r;irk,on;b,k;iRroQ;fL1n;n35zed;iQla,ol;d^,xel;nol`,rSzQ;eps,os4I$Q;mm`;etam,.ud@;!l;di,r;/itDtapmQ;ys;aRoQ;edi,ib;id,tak;amon,oRradQ;*.;htem,i$p;b,lg,rQt*hp;!#,hpQs0;^ap;a0Kd0Je09f08g07i04oYrukXtVuQüp;as0Ugi4Bj,kCtQ;aSkQ;af,ur.Q;!?,+;n?,s;lif@,nez0CsQ;ig?,nomed,u1K;?,n`;#lUf$p,ked,lTmSnRtkQ;el,od;gi,oh;em,ram;f,pxe;!e,l`;psnRuqQ;?,ka;i,`;et@,im;!#,eg,h2nAs0(;dXfVgUlot,mSneg3IpQs@,tla;met,oQsoL;!n4`;+n,o11unQ;!?,h2;!gus;?,fQn`,s1L;id,o;om,öfQ;!n`;auq,yh;k,lked,pQtC;!eQm`,äL;r,s;aW?k,izTlaks,mS`RpQu3Süd;^f,olagI0urgWO;!otF;ac,u2D;?,itRnQ;ame,`;*,rap;k,rQ;[t;a0Ue0Tg0Si0En0DoTrQuprah;ag,eQo.,uf;sak,tQ;la,@,sn`;feletGiYmX*k,pTtQ;eQ@,rak;bQd;!n4s0(;ed,mRpo,sQxe;idWQ*~;aQi,`ML;hBr,t;!rah;psCsXtQ;aViTkQrop,ul>?;^f,efRnQua;as,ufWJ;n`,rR;dn`,sop,tQ;ep;r,.;neRsim34uQ;f,llised;mid,p;is,o#;^t,bm`,d01f00lZmUrTtRur,zQ;saf,ullah;^g,sedäLuQ;lgga;am,u;aTiSoR$t2VuQ;lli;d,n;le,rksid;l,]`;!ked;ed,f^;!roQ;!`;a.,is?;g,moLvr0Uzs@;kU5lQno,p,s;f,pQ;!xe;a08%s07i02mZolpid,rTuRäLüQ;frap,s?,.`;hxe,sQ;bus,n`5;ala,ifUoQ;fQn;!eRinu,@,sQ;*~;d,r;!fa,n`;^gorpRuQ;g,s;!+,n4rH;nTrpStQxam,zed;igQpo;el;ed,m`HL;a,im;!#,&,llHn03Ir1s0;ffid,lQslabK;b,kQ;?,ka,oL;a0Fb0Ee0Di0Ckyz?,l06o02r1uQ;dom1Ug00kXmTpStQ;^g,ipak0ZsQ;op;i*m;iSrofRukQ;!ka;!rHs0;s,.;aje,eps5itRlak5NrQ;iz;ra,sM;?,nG9;med,pQsi;!^txe,f0kRrQuOZ;et@;*lb;a071eSiRoQun*;kotoLr]`UU;rb,zso;bRdQppa,trak1Bud,zrap;om;at,?;buj,foLmissa,pm`;rr`;ate0Cöm;dnThRkse15sQ;an,g*rd;cQ@;suap;^;cSirak,*Rram,sQ;am0Zir,ürb;lf,rf;aQolb;l,tQ;ta;rav,zosQ;sa;^t00cWpQ;^gQ+i~,osoliT;^ap,oQ;e0EilbStQ;oQrak;hp;ib;or,sQ;ak,*~,ramRtuk,utQ;!?;!#,f0h2i002=8nA$05Rsol,trF;bZn`,xe;!a00eZiUlume,nRuQ;fir]ez,jn`;aQif,uf;rQt;!ra,s0;fSlRrQ;id,r`,t@;fn`;fQäL;us;led,n,r;!?KTg3poL;^gRfaQoh;rhB.C;^ap,oQ;eQtF;roQ;%;a0Dda,eprot,i08nZoWraUuRälQ;!p;alpRlQ.K;kko;pa;bmoQt?;b,l;cRlpZmm`Q;ka;!ed;aVeSoRufQ;!?,fZ;lb,s;psRtQ;!@;!us;gaD0kRmm`GpQ;xe;!s;d*k,lSsQuqil,xo,zed;?,sQ;id;l`,oQ;sn`;kirrab5rQ;!gQs0t;!eQ;d,w;aR*QrF;lab,va;lped;aXihWlah,mUorpTrQ;ab,osRu.Q;am;#,da,?;!f0h2*,s0;alf,oQ;lp;oLxe;ll`,.%Q;ub;!#,&,g7lhak,n4$z,s0trF;hr1l0Zt;aSbnRg,%sS4lkOpsQ;!#,f0nZ1$,s0uab;effo,iMG;hE8p;_p,lü.0Fm0Bod,pSuRyQ;ks;h,p;a01eYiUoRuQ;lf,pEV;f,hB6lRpOtQ;!sG;f,k5;d,kSlfY9nABrRtQw;!#,*,r1sK;!.;!+,$)7I;l%sQn,.G;!#,%NiRG@02G$QtQE;h01Ov;k02XlUnSp,rRtQw%sR4;!$H6;&,t;%sQkr1;!#,f0g7n4$),s0(;!hBkQ$)VR;!f0%oh,=8+,n042(;alhAKuQ;lkRpQ;!#,f0nAs0;!$ZGt3;!f0+,n4rHs0;ip;a1VbeKdro1R_d1Qff1Pg1Lh10i0V=o~0Umm`lNGn08o05ppaw,rWuTäSöQüFR;f,lk,pr1rk,tQ;!#,%9mQA*,$);~;aQ?.,äzAJ;rCLsQ.UZ;!opC;aWeQopsJutZ4ötJüz029;ft3kUlQ;! neS%9+,nR$QYs0tE(Q;ad,neR;a,eQ<;nnek;!s0t3;g+,tD1wQ;!rMQt3;h9YlRrhtCZtQ;&QA$vQV;c,k;a09e00iSos,öQüd5;g5kQ;!rüfad;g6pUrTsSwegQ;!bQ=01Kr036uR7;a,_l;!&,%9$,t3;!eg,$YNt3;!sQ;!f0$Q;),ti7;kWlf,nVog,p5rQuds0;!bT%004iQS+,nYJ$Ssol,tQ;!#,f0h2rQsol;ez,of;),]PEv;!#,f0g7h2nA$IAs0t3;!&Q5$;!&K$Qs0;!#,*,r02R(Jv;b5mKUpsQ;!#,&,+,nX2rWMs0t3;!#,nSMr1s0;eQmr1;%sSlJnr1r1tRwQ;!&,%9s0;st3;!&,f0h2*,$ZA;a08c03eXoUäTöQüs5;f,hr1lRrd,sPY.IwQ;egJMgra,r1t3;!k;g,w011;lLSwQ;!#,eQi6nAr1;b,n@;aw$,dUlToRsQ;!iPH=8$GBtrF;sr1wQ;eg,r1;!#,f0=8*,(#;!$),s0uYT;?T<zQ;!#,&,f0%N+,nQrU9s0;a,egM<,nQ;ek;!#,&PJf0%Z6+,nWDrF6s0tE(AX;!bJmQ$,sGzPG;!nA$;eR<Quel5;!*,$SRt3(J;gLQrQsRK;!b019h2n4r1s0;awL8eo00Gö00G;!#,&,%oh,*,r1s0(;!#,i6nRrQ(;eEG>;a,&Q<;en;lpQwhB;!n4r1;a2Qdiw,e2Nh25i20l1Xm0Io0Hr05ta04uUäSör.Q;!#,h2iOS=8nQ$),s0t3(;emPiZ2;%sQrg5;!dBN;aYeaVäQ;bO%sG5rRsQzVW;!+,n4r1;!#,f0g7+,nRBr016s0tQ;!rQs0;eOPof;rQsr1;n4t,(Q;n4s0;lfpJ$bJ;!&,f0h2n4s0;a00iZoXuw,äSütQ;!f0sQ;!h2nArHsol,trF;l,wQ;!f0%R*,rQs0;e,>;rud,sQ;!+,rHs0;fQn;!#,h2+,rK8;f,%sRM;b$,+,r1;ob,~T4;a0Ze0Ti0H`WuVäQürk5;dTkSlQ;f,%sQ;!#,f0*,s0;!#,f0%W7=8s0;!#,f0n4;dr1mr1rb8RtSX;!#,e05f0g9T%Ni&W3=8mHJn00rUsTtS(Q;!ad,%9kZNnQsuZZ;aAMe9Qih;hSEne,rF;ol,träwrHuaYK;alk,eR>Q;!$h,(;),d_w,hStQv;i7nQ;ihad,uYF;!ad,$ih;aSeRiQ>ad;e16h;d*h#,geVPmP;!rQ;d,>;bQd*.(,h9;!#,f0gH3h2<rf,=8$Ssol,tR(QzKZ;!<rf;im,tolf;),d_w,h;lZ~5.Vw%sQ;!%N<rf,=8nRr1tQ;rFsurb;a,iQ;e,fled,hQ;!pled;!#,&S%NQi6+,nR$TS(Q;!#,+,(;a,emP<MQ;!tE(tE;gQkYD;!f0r1s0;adUh9AlR.7Tw%sQ;!f0*,$),s0;hBkQ;!#,&,n4$Q.D;t72v;n4uMJ;dr1lSrR.Q;!#,*,$h,t3;!h61n4;fQ%RQ;!f0t3;aRifQ;!#,%9r1tE;m$z,uq5;eQm5;kSlQrMO;!f0%sQnPHr1;!n4r1s0t3;!f0r>X9s0;a05enRäQürMO;l,z;!b01d*h00&Zf0gewUL%W9<rf,=XHlYmXnWrUsTtS(Q;!#,f9Ol<t,nUNrQsuYH;haw,>;im,ne,rFsD;poh,ua;eQhaw,>;bVEh,tWDv;aXEeUCiWF;<h,+rk;am,&ü,<t;!iSFn&K5;$);a,_lrQ;>,üf;!%9lXCnQrLI;gaHD@GH;izRrcKuq&Q;!*,$h;!eg;rkEAsQ;!&,g*R7nD7;a38c37e2Zh28i1Vl07o03r02uUäTöRüpsQ;!#,g7%VN*,rMYs0;!nQrg;!<;hO1uqDK;aVeT%sSof,pQ;!sQ;!#,f0=8+,rH;!+,n4s0;bQhTR;!$TSs0;fQAj,m,rQ;g5k;ep,iuq5;hQpLG;!#,f0g7%NiOM=WHm<h,nA$Rs0(Q;%9kX5n4;!),d_LBhVI;a0Ve00iYoVuUäfCüQ;fShRnkQrbJ;!nY0$z;!+,n4r1t3;!#,f0%9llH+,nA$ORs0;lKn,r.;mhBrQs,t,w,z5;!#,fVGg7=8nS6$Qs0t,(;),]KB;%,k,rQ.G;!dKg;aSUb,d0Jh0In%s0Hp0Grp5seg0F.UuRwQ;!hCT;f5OqQ;!f0rQ;&ü,>VO;!#,&09f07g05%74<rf,=8mVWn03rVsV7tU(Qßolb;!#,f0+,nNHrRsV6tQ;i5XsD;ad,[Q>;!cWrXG;i5Ulak,ne,ot,sD;aWeQ>VN;!)UhRtQv;%eBKnu;!cR$Q;d_w,ih;is;!n7P;d,lk;a0EeQiVE;dVGgeSMmP;ew,itQ;hIIrD;rQuaOS;ahB;!#,%9@UJrKV;!i6(OP;!#,t3;!f0%oh,=8rDBtrF;!/QMf0$;!n4$z;bK9fXhVl,nSrQwLW;kJpQ;!#,f0=8nN1;%sRkQ;!#,$SA(;!#,f0+,*,(;!/Q%9$DQ;!&,h2=8ne5U$;!#,e2HfU9g7%31=V0mXnVrRsQtKW(OßE;sEua;eQ>;)Rd_n,h,]urQv,whBz;ad,[;!neWC;a,eHRiQur1;eCNh;iQu;[J;am-e,eQ;!&,fVIgOh00iJJkZnYpJ$XsBHtR($h,wQ;!g*l,r1;!#,f0nUrQs0tE(R0;eSoRuQ;!#,&,$vRP;f,vEA;!iv,]u,v,z;e,<;!hHZ;e59ihUB>ad;!c8nAr1s0.D;!#,cNnLYr1s0(;a0Be05o04u03äUöhCüQ;fSkRwQ;!f0h2+,$z;!#,$USs0;!%NnArHtE;mr1wVzQ;!#,f0%NnBUrQs0tE(NJ;eQ>;!),hRrQv;eJU>;!c9;!#,h2*,rQs0;eQ>;!s0v;b,s,.6;j,kNNs26;aTfRhr1.Q;!&,g7n>ad,trF;!&,pmeQr1;!$UR;wQzU2;!*,s0(#;mTrRzQ;!#,&OCfJ0%9=TQm<h,nA$),s0trF(TL;p,.Q;!#,&,=8nA$P8s0;!@D$z,s0;eWiQwhB;hBpsQ.POzLM;!#,&,f0g7%SC<rf,+,nTrRsSTtE(Q;!%9n4;eQ>;!),v;aT5<;k^k,s6;yc?;a,hIFmQ;!#,&,%9llH*,$7Os0z3Y;a2Ac14_k,i13l0Zn04rSuQölb;apQps;!h2n4;a00eXiwR`Qä.FNüt;!t3(;!&,%N=8nR$,s0tGY(Q;ne3YtE;eQiS9;gQmP;egQ;ad,t3;aRmQw;!&,f0*,rDX;.5;md*rb,pOF.$;a0Fe03iUuRär%sQüd;!&,n4r1;!fQtK;!nQ;a,[NZ;hHWlWmhIW~VsS.RwQz5;!#,%9iHKn4$h,(;!*,$;!#78h2=8+,nR$Qt3;d_n,]u,v;emPiSG;!#,&,*,$,s0tE(;b,kQ;!f0n4s0(;^%s00dV%sUlSrRsSVw%sQ;!#,+,n4s0;!n4r1s0;!#,+,nQ;egM<,rD;!&,g7n4r1s0;!eTg7%N=8+,nQQrRs0tG4(Q;!%9@h;eQ>;!bQCh,ti7uq,v;b,g;&,n4uGT;dTlf,rStRwQzC;!hB;!#,&,f0%9llH;!kSC+;!#,&,r1;aSeRu5öQ;b,w6;mCw78;kK9.;?.KUl;a0Re0Gi09o05u01üQ;b,lYmhBrQ;!bWdTnSrQsR3t3;eQ>;)6Ch,v;aRGemP<;!#,&,f0g7%Rn4$Qs0(;tQRv,z;alf,rud;a,$);fpMYgQ;!&,nIDssEßE;d,gSk,lhRpsIErdQz;!#,&,%9nBFs0;/5;!&,*,r1;d,hSlR.Q;!f0uAL;!fC*,r1t3;!/;%sVk,lbTnRpQ.$;!$z,s;!kQ;!#,+,n4;!g7%N=Q*,$86suO5;eRXür1Q;!g7r1;dZ%MNiuq,lYmhBrV.UuRwQ;!f0$,z6;lg6mhBrdQz;!h2rH5s0(Q;h2s0;!f0g7nMZr1.D(;dr1%sR.Q;!$HJ;!#,f0%oh,=8nSL$FX;!fI;!#,&,f0r1t3;b0LhSnk69pRsQ;#,uFF;!&,nAr1s0t3(J;!#,$z;hQuq;!#,f0%9nA$]29s0.D(;eTnkQ;!&,@h,$Q;d_n,tQ;@had;f,n%sTpsF8rRz[Q;poL;f6%sQ;!&,f0*,$7JsJS;!n4r1(;aj6c28e0B<07ordILu05ä01öhIVüQ;lXmTrQ;bRfr1psQ;!#,&,nAr1s0;!#,f0r1;!#,&Q;!f4S@R$Q;)4ShPB]u4S;e@h,h;bRgQ;!f0h2r1s0;!#,f0$F4;lbOmSnRpsQrk,s;!$,s0;!#,f0+,nM0r1(;!#,%JX$BW;^Qb,hAErGT;!f0*;dMlRrQwKzr1;!f0nLV;!&,$Qs0t3;h,v;g12%sMi0PlfJoh$,rd0Os0E.RwQ;!*,r1(;!ad,#,e08f06%F9<PS=8mm05n00rUsTtR(Q;!n4rIT;iQne,sD;?6;t<s#,ua;eR>Qüfad;!ad,&,$h;!)Sdiw,el,f0rR6]RvQ;!ssEßE;ihad,u;!n1Krad;aTeS<Q;!lQ;la;geMGhKKmP;!neQTt@h;^.;pQua;`;bSgQh9;!n4(Q;!(;!$Q2trF;!#IGf0gY%NW+,nWrUsTttS(RzQ;ra8E;!#,*,s0;as;uaM4;alk,eQ>;!),d_w,h,s0ti7v;aLAeQiO2rD;geLZ;ewI7;!#,f0g*l,h2i6=8+,nA$KEs0(;lf01zQ;!#,&Zf35g7%Y=OSll>X+OHnWrSsKQtR(Q;!#,iJZkPGnPSrH;im,ne,talg;eQ>;!bRhDM+,*,]Qv;ih,uHZ;eCRü34;a,emPi6E>ad;!%9uGT;an,<lg,oh,rud;!n4uD4;!t3;!#,d08e07f06gE0%N8iJO=OG+,n02rXsTtR(Q;!%9+,nAr6T;ne,tQ;alg,ork*b,upak,üEO;ol,poh,träwRuaQ;!@h,rH;#,f0=QrH;ür;eQ>NX;!bSdnLNhn4tQv,z;i7nQ;ih,u;eu,üL8;aSeQiNX;mPrQtölf;_zaps;!rDH;eB8ua;b,h9;m?f;a39e2Pi1Tlo1Snüt1Ro1Nr1Js09uRäQ;r,whE0;aYbWeTlf5rps*&CEsQ;!#,&,f0%Nm<h,nFOrQsN2u6Z;eQoCI;!]u,v;%sRk,sQ;r1t3;!f0=8r1trF;!#,+,nQr1s0;egM;bCfJhWlhBrUtQ;!#,fSg7n4rRsQ;!nP7r1;e]u,oC8;uaMA;!bQf0s0;!eg,f0r1ssEßE;!h2iI7nQsJC;a,&ABih;a0X#0W?0Ui0Ol0Nm^5n0Ip0Hr0DtZuRölQ;!#,$CBs0;aTdGeatRfp5h,k,p,tr1ätQ;!gRrHt3;!gQ;ew@h;bOlSrRtQ;!+,n4r1s0uLF;!#,h2r1t3;!&,p;a00eYiWnVuRärgQ;!#,+;ankICedn4lRnkGpOrQ;!#,h2r1s0(#;!fQ;!h2t3;ap;epQlgCrp,t;!h2s0;iQlf,mlod,uqD3;uq;lRp,tIuqQ;!llHr1s0;!#,kF2p,$z,s0;^1iSofR$hQ;!&,rH;!%9$,s0;nkHXpJ;^g,ulgI;aSeuw,üwQ;!iBC=üQr1trF;lg6r(;lQp;f,p;iDäfMR;eUfTmSrfRtOwQzGZ;!#,f0g7h2$BCs0tC8;!f0$,u5H;!i6n4$MStEuAW;!#,f0s0;lf$z,rk;dQpJB;!häm,r1s0;rg6;hMDn5rrE0wQ;!#,f0h2n<r,s0;aSefpRohQ;!#,eg,f0@h,s0;!nDK;nhB;kQlKp;!#,&,f0giEQn4rQs0trah;ag,eQ;),z;!rDQ;d$,r.;eZlQp$;d_5Z[e,gX%UkriWm<TrStQua%snML;aatFN<h@55leVneffQtiFNue21;eor1ör1;en@r1$Q;hr1;aFJ<RsneQ;mr1;wr1;eom$,öm$;!dKl03rRwQ;!#,f0h2=8n4s0t3(#;!#5eg,fZ%Nm9LnWrUsT.Q(K;!#,f0g7h2=8nA$Rs0tQ;talg;),]u,v;uaU;ad,eQ;!)Sh,]9F;a,iQ;eQh;!@h,$h;uaQ;@h,$h;bVgT%sQ;!&,g7%NnR$QtAZ;!h+;aKQiK6;!#,&,*,r1s0(Q;*,s0;!%9rQs0;e9X>;^,i04lb,rT.RzQ;!h2;!#,&,f0h2+,nArQs0tot,(;eBSo9J;bWpsQ;!#,&,gilU%N<rf,m8WnTrRsGPtQ(9F;im,ne;eQ>;diw,v;a,hoh,<,rD;es,<h;!#,f0h2iFE+,nGKrRsQu3R;ol,uaK9;eQo99;!d_n,]u,v,z;rRsQ;!nFFr1;!kQn<r;!h1XnLF$Qs0trF;h+,]u,v;d0Of0Ll0GmSrkRsrB4wQ;!&,f0$19;!$HG;!#,dHUfKCg0B%0A<09llHmra,n04ppa03r01sG7tUuSznRßQ;<h,org;ag;alb,en,zQ;!f0$L2s0tE;%ViTlaSnJQrFsRtQ;ew,upak;ef,sCU;!h;?Qm;b,&;?(,id;alk,eQ>;d_n,h,t7Rv;lhB;aRiQ>ad;eDMh;!rQ;d,[;ra;rf,wEJ;an,rud,sirf;ew,iQ;ssülf,trD;!#,fTkSm+rk,nRsFJtQ(;ot,tupak;a,hoh;*rk;!#,e6Qr1ua;!<rRl37nQt3;a,i2U;dr1;!#,$);a6Re4Yg4Vi2Ol2Jn0Rr0I]ör,u05äZöm,üQ;fVlSnRrQ;!tI;eg,g2T;!&,fpQh2nB3rH;!+,$Q;]u,z;!i6nF4$Q(CH;d*n<nQv;a,i;rRsQwB3;!#,h2nA$z,s0;hRpQ;!f0n4s0;/Q;!#,*;aZeSfRlQzrBZä6;!suJW;!r1s0t3;bSzQ;!&,$Q;!bGU;!=8rRuQ;zrH;eQ>;d_n,v;lCsQt;!bQf0h2nAs0;a,ua.;asK&WoSüQ;b5wQ;!#,n<r,$;bSsQ;!&,+,rQt3;ev,>,üf6;!nK1s0;!$Q;h6v;a1Ae11i06og,äRüQ;d,jr1;hWrdTwzQ;!hQn4;crQ;udBH;!#,&,f0%Ni6Y=8nRrQtrF;ev,>HS;a,emPih;!#,&,f0g7%N+VnTrQs0(;eQ>;!),dQv;*n<*;a,emPiQ;eB8h;!rQ;![;dI6l0FrVsUwQ;%sRsIzQ;!#,f0$8Cu0X;!#,f0n4rQs0tE;opme;!#,&,%NnArHtE;!bZdWh2psQ$88wC;!#,f0%Ni9R=8+,nArRsQt7I(;ol,uIM;eQoV;),hQv,z;!rQ;eIY>;!%NnAroRs0(Q;n4rH;pme,vH3;!a,#,[9f0gY%G5i9I=8llHmXnEErSsDBt55(Q;!f0+,rQtE;e]u,>;ad,eQ>GZ;!),dShRtQv;i7nuGX;!$ih,än;_62*n<h2;<h,u;ew,i9X;eg,%sSkQssEßE;!#,%Nn8X$Qs0;!diw,v;!h2@Qr1;e@h;!aVmUn4rRsQ;!#,nA;ev,psR.Q;!*5F;!#,f0g7nA$z,sG3;!i6n4$HB;hRrdQ;f0r1u6E;#,nIE;b,fUlQrp;!eSh2@FT$Qs0(;!)$h,h,=8rI9vQ;!#,=8;bJg;!#,f0g7nApme,r1uQ;zf0;abGeTit5LofQ;!&,%9i6$Qs0;!d*n<f0vQ;!=8$HC;whB;bualg6d1De12h10l0TmhenMn0Nr0Mss0ItTwSzRßQ;äm;$h6u?kI;?1;eat0Df0A%02<s6lXrUsStäs4Tum1PätRönIümQ;ed;!&,s6;ef2Lgnä2LnügQul6äl6ökQ;&,r1;efQäwnegeCV;!#,*,rHs0t%Q(*;?;aTeaw6äQ;flRwQ;&,$);_18;weCO;?6iUäRüQ;l01z;dr1mRn,r]Q;<6;&,ll8V$;r0DsQwh06z6;#6&,fua6=Q;eur6ür6;e^k6nRäQ;h02rkI;eas6äsI;&,s6;eaRäRülQ;fr1;l%aQ;nr1;)$,d_n$;eohU<RueQöhU;lhT;hSp,rQ.;!eQn64;b,v;/6;hef6<tVlQ;eSiQ;bQwAW;!r1ssE(,ßE;h6.krQ;ew6;&,%an6;urQäf6;&,nu6;frho,gZnX.UwRzQ;!f0nDDr4G;%sQzFB;!l15*,r1s0tQ;ot;!#,&,f0gr6%DN+,nArQs0t3(C;eQopme;),d_n;!#,@h,rQ(;ev,>;!m<h,r1;a07e04<03luh02nTrRä%sQ;!&,t3;eQüw;&,uw;ea.Wuk$,äSüQ;kQmt3s5;!f0*,r1;b,hA0.Q;bTlQr1.bT;loQ;vr1;bQr1;le8A;!/T;l6r1tr1;a%sRirf6lQrp;$,t3;&,t3;ng6rg6;alfRoQ;j,l;!&,s0t3;aLf1Hh,i0FlWrVuRw&Q;!=8trF;fRnQ;eg,g6;n4r1(Q;n4(@h;!#,f0*,$;!#,e07f05g7%9<DXl04m02n00rVs9UtU(Qßolb;!#,f0i6nSrQ.D;eQ>;d_n;a,effo,<;h79sD;ad,eQ>DL;!bSdRf0hCSt@h,uq,vQz;!=8rH;_n,iw;eu,üBD;a,eQiCQ;ffo,mP;hQ+rk,u;al;li.;pQuaDK;!dB0r1;b,h9tCK;b0Nl06m05rkTsSwQ;!#,f0%9n4rQs0;&ü,>;!&,r1;!#,&,f0h2nYrWtS(,zQ;tiQ;ps;h6Oim,tQ;oRupQ;ak;lf;alk,eQ;),d_w,h,]u;^86iQ;eQh;!lk;%sJ;!ad,[9fYgithX%Vi6=8m11nSrQ.Dßolb;eQ>CQ;!),]u;a,eQ<;bQmP;e*d;^b,rud,slQ;af;cir;!#,d@lb,eWf0g7h2i23=8+CCnVrSs0tRuQ;a,z;im,ne,rF;eQopme;bAMhQti7v;!ad,+;a,iCB>ad;ihB;!#,edSf0h2i6=8mR@BK$Qs0th5X;d_n,v,z;+rk,u;^M;!g7nDZs0;j0Nl0Bn0ArZsTt5wQz5;!rQ;[Q>BX;$ih;!#,&,f0%Nn9DrSsRtQ(C;ne,ot;i7ol,ua98;eRhQ>;aw;d_w,h95t1Ev;!fYrXtQ;!#,&,fuaIg7%AEi44=8m<h,nVrSs0tR(Q;!i6tE;im,rF;eQ>;!)BKhAYtQv;i7nZ;aIe8ViAY>ad;&ü,oB3;!#,&,%N=8+,*,$Qs0ua;!),t@h;!am,#,h2*,$z;%sRkQnCIp;!&,nAr1(*;!#,&,f0%Ni6F=YlX+BBnWrUs7KtS(Q;!h2mQrHsol;u$h;^6<Qot;rb;eQ>;!),d_n,]u,v,z;a5emPiAK;hDlH;el,ür(;!#,f0g7%A4=8nA$QtrF(#;hQv;!+,n4;a3Le3Gf2X<2Hl2Dp18r10uRürpQ;!%Nr34;a04rU.SäQ;hQ~;!$);!#,n4uQ;zn4;!#,&2Df0g7%XiW=8nUrRs0(Q;!*,s0;eRoQ;v$h;diw,h;a,eQ<$h;h63mP;&$h;aQrud;n,w;k0ElWnhUrTsRtQ;!+;!#,&,g7h2*,$Qs0tE;!v;!nCC;/Q;!r1s0;!#,&,f0g05%03i01=8+,n00rWsStR(Q;!%9;im,ne,sD;<,olRuaQ;!r;!fQ;u^d;eQ>;!),dRhA8tQv,z;i7nu;iw(;a,e7Ci9F>ad;&rQ;[,>;an,<Qrud;lg;ew,*Q;lt3;!#,f0%9<rf,=A3n62$Rsol,uQ;zkAR;!vQ;!$Qs0;d_w,ti7;eSä%sRüQ;d,%s60lh5X;!n4r1t3;a%s26wQ;!#,&,f0g7%9=8+,n8YrRs93tQ(6Y;ne,rF;eQ>;),d_n,h,]u,v;a0Seunk5m08o02uYöUüQ;h,l%sRnkQ;!f0n5Nr1;!h2rQs0t3;e]u;%sSk,nkRrhQ;/G;!#,f0h2nArH(;!#,$,s0;l,nSrRtQzR;!#,&,s0;!#,$z,s0;%3B;lkUrStQ;!+,n4sQ;!llHr1s0(;fpQtG;!f0llHn4(;!#,nAs0.D;a04ea02iXuTäQür;d,kQ;!#,&,h2*,$Qs0tE;!d_n;rQs5.G;%sRtQ;!f0$);!d6Lf0n4;!%SlgnRn4rALztQ;uhB;ur1;an,sQ;!&,s0;d,kQ;&,*;dTm5rkS.Q;!f0n4$Q;d_n,z;!nADr1t3;!#,f0n4$5U;.,zQ;!#,*,r1;[Qog;!#,&,%Nn4rQs0tE;eQopme;ti7v;fp04k,l%s02nk00rTsS.RwhQ;/32;!#,r1s0;!#,n4;!&,gS%9n9Es0.Q;!#,h2=8$Q;),h+;!#,&,f0h2=8AlhDnArRs0(Q;!f0n4;eQ>;!),d*n<@,r9Tv;!#,h2nQ$5Cs0;emP<;!#,nQtE;a,<1W;!#,%9*,$58s0;aY?tUiSoh8AuRäQül0K;!%9lk;m,nk,p5;%sQk;!+,nAr1s0;!&Jf0i34n3VrS(Q;!nQ;a,emP;&5W;gY%sUlSp,rQ;!f0g7nQ.;emPih7L;bJ%sQk;!#,$;!#,&,f8Ng7%9iS=8n61$R(Q;#;!h6Ov;&79;!&,*;iSurpQ;!uQ;z%9;mQnhB~,tr1;!r1t3;l%sRr.Q;!#,&;!h2n4$2Vs0t3;a2Oe2A<1Vl1Mm1Jn04or1WrUue41öSümQ;$Q;!);!lQ*,r1;br1;eUhSoRäbMübO;!f0;m7Cn;eQäfM;afM;!ubf0wQ;!giSsol,tQ(sol;n6KssQ;uw6;trD;a0Ze0Pha0Oi00uUäTüQ;br1kr1m2CrgRzQ;!*,t3;!&,$;fp5hB;?fJkUmSrQsM.;!#,f0$Q;);!rQ;>6;&,r2N;b0Ae08fZ%sYlbXrGwQ;!#,fU%SrQs0;eQopme;b4Kv;rud,sQ;!n1Er1t3;uaQ;!@h;$;!#,f0$z,su7C;!#,&,f0h2=6Am<h,nWpmeVrTtR(Q;su7AthR;hQta.;c?(;eQ>;!d_w,h;!%9tE;a,emPiQ;e66h;fQmegK;!*,r1;!#,f0%oh,+,n1YrRsQt3(K;ol;e6F>;!f;!&,lWps,r1sUuTwQ;!#,&,f0g7%R+,n31r1t3(Q;!#,nA(;sr1;br1rg6;!#,%9=8n4$Qs0t3(;),h75v;bQ?1lH;!#,f0nQr1s0;eT<;lRrQsr1.*6;b,+,.;!neQ;%siQ;wz;?fRueQ;lr1;&,$0Yt3;emXibVoUuQ;dS%sQ;!+,r1t3(Q;+;!eg,$;gr1s6;!#,%N=8+,n4rQs4GtrFu3HßE;e63>;!#,%9=8+,*,r1;%s02l00m5nSrRwQ;!#,s0;ev,kJ;!&,%sQ;!#,&,f0g7%NiTnRrQs0tE(;e3N>;a,<Q;!f,lk;ewQ;zt3;!r1;!kQ$,s0timI;!&,+,nAr1s0t3;!#,nQ$59s0t3;ih4L;i00or1rQ;!b5I&,%XiWnSrQs0tE(11;eQ>;b2Phad,z;a,[S<Q;!rQ;!d;/iwzad;&rH;an,uQ;ab;%RmhBsQ;!$z;sb56;bChWlSolnwRrQ;gpu,t;od;!#,&,f0%Ni6+,n4rRs0t3(Q;!n4s0;eQ>;),v;/I;a4Hb4De27<0Wl0Tmo0Po0Lr07uTüQ;!n4rQs0;ev,tQ;!&,n4;aTäQ;r.,tQ;&,sQ;&,$z;lWnhVrR.Q;!#,nAr1t3;!&,%sQs0;!#,f0=8nRr1sQ.D(;ol,ua;a,emP<;/C;g,kRrQ;e,u6;!#,f0;a01eVäfQüm$z;!#,dnoTf0+,nSr1tQuaT;nQor;e,ub;<,öhBürg;lb;!dr1&,g,kKr1tTwQ;!#,&R+,*,$Q;!=8;!tE;ne,sQ;!#,g7@h,r1s0;dGnQ;$0E;lSrpRtC;!s0;!h2$;!eg,r1t3;bRlQ;pr1;!rQs0;ez;aRiQöw03;gr1;k,sK;l0IrQ;!#,f0%03n02$01s0tQ;!#,&,f0g7%Z=8+,nVrSs0trF(Q;!nQ;^H;eQ>;b0ThQ]u,v;!+,$ih;aSeQi1T;geQmP;gt3;!rH;oh,rud;v,z;a,i1N;rud,sQ;!#,d01&,f0%NkZllH+,n1KrTs0tS(RßoQ;rg;!ad,.D;im,rFsD;eQ>;)02dQt01v;eRnQ;an<s0;in;>;c8*Q;rk;nusM;!bR$vK;!n4;!ad,#,f0g03%9<#d,=8nT$Qs0trF;ih,tQv;nuQ;!rad;aXeQiX>ad,rD;beVfUgRhe.ImPtfah;!&;eRnQ;äh;il;fo;lk;rd;an;ew,irbQ;eu,ü;b1Ug12h0Si0Fl01r.WuUwQ;!%Qn4;rud,sQ;!n4roQ;pme,v;!s0uQ;zs0;!#,f0%TnSrQ(J;eQopme;!diw;a,ih;an,oh;!#,&02f0%01kVnTrQs0trF;eQ>;!),tEv;im;emPiQ;e,had;!#,&,f0nS$Rs0.D(;ef;),v,z;aQemP<;!rQ;ad,d;an,oh,rud;!r2I;%sTlRsQ.;h2r1s0;!&,$Q;d_w,v;!#0GetXf0g7h2=8nVrRtrF(G;!#;eQ>;hRtQv;nu0C;!$ih;a,emPiQ;e,h;<si6;!#,&,f0g7%YnArSsRt3(Q;f0*;ua05;eSoQ;pQv$h;me;!]urQv;ad;a,<;oh;!#,dnuk,&0Df0Bg7%N<09=08m06n01rZsWtS(Q;!#,f0nQr1Ts0;a,ed03;%a,im,nRrFtaQ;.;*k6;&;<Lol,uaQ;!$h;rp;eQ>;!),d_w,h,ti7v;a00eSiQ;e,hQ;!ad;dQmP;_rf(;<hQu;*;e0Für(;b,rf;an,rud;uaQ;!rd;!=8m<h,trF;of;ür(;uk;!$;eSoRurhB;/;j,r;!#,r1;gsu05hWl,rQ;gRtJ;!*;!#,&,+,n4$Qs0;tQv;nu;<;!/XdnW<VkTliSnrMr0QthQ;ca;eg;et;ceQ;ur(;rf;ah;!#,h2s0;^1;ev;$Q;ti7;ew;silla.irksuR]emilpm`sQ;ua@h;^Q;[;fp+r%sn0Agin<$vr08isilaiz$05mmiw%sr01$iRtlah$Q;t%?f0;rutkur.h2siQ;lQt^korübt3;aRla.irks0;ua;inolo00nQ;imirZoitutiQuY;.Q;@;crQ;ud;[Q;$Q;]Q;ih;mmoQ;kt3;ne;edeQ;iw;emP;masQ;(",
    "FemaleName": "true¦:aEe9i7koorb,l4m3n2oDsunev,telracs,y0;bur,dna0stap,trebil;rb,s;evar,ref;ossolb,utat;a1ezah,i0raep;ag,rva;roc,tsyrc;nayangirm,r0tsirhc;amukaynak,dua;c2d1i0leirbag,nims1tteb,us;brab,loj,xid;aj;arg,lud,nero0;lf;d5erdna,irotciv,jed,l4mla,n2ramas,si,t0y1;la,narkadn0;am;egomi,i0odal;!latac,m;iw,ue;avmayirp,i,leme",
    "NeuterNoun": "true¦!1:#$%&()*+./<=>?@[]^_`~:er,ch,en,nd,el,an,st,ss,la,ng,ae,te,ge,es,ta,ie,se,ei,tt,it,at;0:CU;1:CS;2:CI;3:CA;4:BD;5:CM;6:BL;7:AW;8:CL;9:9U;A:CE;aBKbA7cA1d94e8Df7Ng6Ch5Li57j53k3Vl3Km2Xn2Lo2Ep1Vquart1Ur1Js0St0Au04vSwGzB;ahl02eDiCuB;#i7>*a%d8Lsamm%s2T;(,mm1@t;hnt3iBntr0ug;$0@7B;aIeEiCoBu94;$%%d0#t1hlwoll0lf%bueCCrt6Q;eBsmar;n,sBA;i+ruß5SrkDsB_1;%,tB;d24f2Bjord)5Q;?,s;hDrCsB_%me1;hi/ton,s47;%CJs$au;l#>bBTrzC8;~5EeIiGoBukovar;(k8lErB;bi9Qh5VjahreBkommBQ*a&sm`gl[d6Nur6Xwort;n,sB;!niveau;k2um0;$y-regim2deo,eBg),si1;lfa$2rt3;hik3rB;bu&u6Hdikt,gnu8AhBkehrsBRmo8A;a(t7Vo1uetB;u/sBP;eb#Ff1mDnBr=8Xs-repr<s%t)C4;gBh^l,t#C4weA0;ez[f1lQ;.4s~zB;minus,plus;e11lA3ma+;aReNhIiHoFrDs$ets$e5NuB;$Beb5Otzi/;!olsky-zi@t;avnik,iB;bu17e*;d?Bnba&g#ät,r6;opf1ur=il6;bAckA#6;eBu#5H;~#Bm0;!haus,sB;!tB;ue9;am,h#),lBrr`o32;!eB;fonBkommunik~ions7I;!e,>spr<7;bus,>bue28iw),l2uzi8Ixi;aZ$TeSha&o/,iRoPpNrinagar,tEuBy*0H;b0OedBjA;fr)kr3IosB;]ti0@AV;aGeEi$3KrCuBü9;di0eck5A;aB^$ho(z1;f43lsu4+%ki7L;ak,u#>B;h^mn8Sld8;~sCbil`<ts2LdtBedtAY;s$lo+,w#k0;d4Dob#h<upt1t8H;ekt80i(B;!zeug;fB&i#u/sg5Y;a,twareB1;bi2Glve7U;$*3kre@ri~,me7T;aEiffDkopau,lBmi#88n`z3o_41w^ne5;aBepp@u,o+8L;$tpf#d0g33;!e;fe,uB;f%7Ns0P;arBc0Jigon,/#haus0;brueck0.4;aKeFh^n3TiDo*o9uB;d1eBhrgA2m<4D&s$r^b0+7G;g0+(s17;?e7A&Bsik0;#5fle5P;$nu8KgEiDpr<s%t)t%haus89sButl4Bvi1;#voir,tBul@t;-5Zaur)t;$86]u4R;al,im2;dio,ed1*a_,tAG;e_,i1;aRePfNha%om0ilotproMlKoIrB;aGe7KiFoB;-kopf-eDblCduBfil,gra6WjeBra,tokoll;kt6;em0;in6S;nziA3vile4D;b)g,g;k1rBsGtsdam;t2Xz(l);aBus;edoy1k~0;jekt;arrA1#d6li$Bu4;tfa7;acekeepi/,ki2OrsoB;nals;kApi#6rB+au;adi2ke_,.90tn#5E;bFeEff%81goniDhr0pf1r$e6P*Bxford;dBs.woni%2Y;euts$2W;-volk2.4;ko-aud`,l,*#r^$7H;da$los%09#Bjekt,*;haus3Ns$le96;aIeGiDordB;bos3Bir2Qrh^n-we*fBzyp#n;al0;eBg#-d(@,veau;d#sacBma&s2N;hs0;*,tz3GuB;-d(hi,g65]e68;$Bhru/s8Jsho#n1;bar.CsB;pi3;%d#n,&;aReOiHoEuB;%CsB_28;e0ikt6Mt1;$0*1;d(l6Yrsl7BsCtBv[;ive5orrad;kau6W@r;ami,liGnFtB;gl[dCl^d,t(B;!a3Kme1;!#5sB;!l1J;is0Fus;eus,@1;ckl%burg-vorpomm#n,diC#,isBns$%re3J+0L@ll;s0t#-baf7F;%,ka80;ed8MiFnDrkeC+Bt#ials;!ak#4Ge;nz8Jti/;d7NnBoev1;h^m;.4nz;aJeHiGoEuB;dwig3IeCmpur,xB;em6Eor;be9n0;b,$,eB;$1;c2Yed,+abon;b%s7Ld1eds,nzB_59utB;kir7;bor,d%s$lu+g22eBg03&64=inis87;$(n,&8;a08#51i03lZnYoLrEuBänn85;#z3pf1rB;di*Bsbaromet1;);aEeDiB;egsB=P;g7Lv#bre7Z;d`in*0Luz2;f73nk%B;be_,haB;e1Fus;bl%z,eMllektivs,mLnEpCrB;n,ps;%hag0fB;-)-kopf-re7Gki84;kurs6ZsGt0v#g%zDzB;eBil;ntr~ions.g1pt0rt;kriB;=B;ri0;t)z,u.t;i=2ma&o;ln,nigrU;[;ag%furt,eDis$e2oB;!e4I*B;#5D;id;(,gali,nBr$%volksbe>6Ms)g)i;dBo;!eB;rBs;!n,z3Y;bine_,is#IlGnin77p`FrDsCvali#sd(iB;kt;$mNs3;~scBlsruhe,t(4T;hi;als,(;iBku3;b1for0X;rBs.ut#n;^7;aBorda0Uu2N;-ChrBzzfe*;e1Rhu&#t6@u]4zeh6C;wort;mMnCsra(s,zmB;ir;dGkraf_ret0.4nFsDt#Cve*m%tb)kiB;/;e2J[urs,nA;ekt0tB;`ut0;#n,sbru9;iDu*r[B;lBu12;<47;vidu0z;`Bmobil[3D;~;aTeMiJoCuB;hn,&#t0;-$i-minh-3L$GeCf,lP/koBrmon,t4B;/4B;$*DrB;>Bn1;raA;ma+;lohnJwa1S;lfs63nB;d#5PtB;#G;bronG#40ft,iDlCmd,rzB+0u;!og%aura7;l#au,ms-burton-28;l5SmBzo3;!~B;.4;!-2O;aHeGlbjahr2m3WnEs$18uB;ptquarti1sB;!e3ThaltsdB;efiz`;au,dBnov1sa-spar2E;(sb11tu7y;us8;g,r;eQiPlOoMrFuB;a=ma.-2Ve=DtB;a0GhB;ab0;r5s[g3;emi0[$is$e5o+FuB;%,&B;gCsB;~zur07tueck6;?etz3C;br`)BuW;ni0;e_Brl3O;i/0;as,^s,ue9;ft,pf(treff0;b03f01g%ZhXlRmNn,orMp<9rJsDtra%k0wB;aB#be36i5K;e0R&;amtme@ll,$DetzCi$t8pr<$Btod0u&h^t3E;!e5s;!eZ;<ftBi9lPo+e,äft;!%,sB;fe2Kv42;<Ci$tBueT;%,s47;t0us$e;gi0;^ns$aftsuDueBü];],tB;!#;nt10;aEdB;eChaB;e11us2M;r5s;ecB;ht1;<Birn,o1;lt1;=B;il;a%g0AeBuehl0ühl;$t0;<udeBet,[t2C;n,s;aUeQi1lLoKrDuB;eB_1;hru/1Fnft3;)kr^$s,[dCueBäul^n,üB;h*ü9;%sCri$B;shaf0;ab0YgB;?pr<cB;he;r0to;aggs$iff,eEoreDugB;bBzL;._;nz;is7;hlv#halt0ld8n10rn]hdu(l,*CuB;#,illeton;!ivaB.4spi(44;ls;$,e13hrC+,x,zB;`;rDwaCzB;eug6;+1;ad;hepaar,iSlQnMrFs$born,u-ExB;-Bemp3il;juB;gos.wi0;.e03;be,dG^gFfuE>bBmi_lu/s2R;niB;+eB;!n,s;rt;ni+e5;b1O>s$o+,o3;d2glD]mbl2tB;]tz0wicklu/s.B;e0X&;a4is7;eBsa+;me2N&;!#,g%tumsv2NnB;fEkDvCwa&#u/sBz()liF;>]tz;#nehm0;aufsz%trum,oU;amili%h<Cuehlu/sv#moB;eg0;us1;ar;a02eViRoJrDuB;eBs$)be,tze4;ll,+(dorf;ama,eEi_B;(,.B;eB&;&1;hB[9sd0;bu7;#fHku20pp(CrB;f,tmu4;be*eu#u/sCzB;imm1;abB;koB;mm0;$0#5;am)=B%*m<d2F/,sziplinar1O;/B;?$<B;ft;bGfiz`6krAleg~ionFsD@Cuts$Bzib3;.&s;il08;aBo>*r3sau;*1;sm`gl[d1;ak3;$,eEmaskus,rBt0yton;lCmB;*adt;eh0;$8;afé,hEoCreB;do;meba9rps;ck;eBil2;mn`z;a0Fe03iZ.XoUrOuByt2;$MdgAeJkare*,&?ErgtD+B;>B;ld1;he~1;aEg1AkriminaD.B;eB&K;&8;.B;mt2;$8&B;(,nB;i+2;!eF;a&%Fem0uB;e+C_oin.&sproduktB;!?;(B;!s;burgs;nn,rd,sB;ni0tB;on;eB_;_1;#,ldB;#5uB;/B;sw0P;du#f0KiKlHrDsB_;$<ftigu/sv#hä0ItrB;eb0;g-karaCnB;au;ba7;$;faCgraB;ds;*;nBspi(6;!e5;dGfFgElleD&,u>w#CyeB;rn;be;_;!);oeg;!%-B;bad0;b0Ne0Ji0Hk0Bl07mt2n03rRsOtJuB;ftragsvH>Ektions0OsBto;$wiC.4maF;&;tz;nBs;!maB;+;olum0;(i1h0l)EomkrafDt%tB;~6;!%;tw#ks;@;i0ylB;v#faB;hr0;b^tsD$iv0guCzn^B;mi_(5;meE;gIlos%g(d2vEz^tB;koCmodeB;ll;nt0;#h<B;ltB;nisB;];ebiA;daluDg(2siCwBzM;?0;nn0;si0;gi1lh^lBt1;miB;_3;(;tBw;%zDi%B;pakA;et;^B;$0;ds,r2;?;gypt0mt8thioB;pi0;#5;!n;%E>ordneBho#0;t%B;haB;us;deC=u1;#;+0;%",
    "Verb": "true¦:!1:#$%&()*+-./<=>?:re,eg,hcs,hc,ts,ei,rt,tne,sua,ie,na,ah,uz,üm,üw;0:1H;1:23;2:3E;b3Hd39e1Sf1Qg1K&ir(#1P.s,l)f,nKraw,s)w,t3;<,dHfar($ba,h9.zehporp,kr8mma(,n6r5s3;i3uel18;!ew;a5en1Xä1Vö(#z;alp18)dr1o3;rht,t2;ap0;c3öh#;a8i5u3;arb13s3;$,r1;er,l4rps3;r1+;g2F+fför1;d0m0rb0;/w$3äl;!/,=;at0e3ib,/g2#bo#03;b0Xd0Sff0Pg00&MiLknus0mJnHrEs8t3;a*,d/w,eb0früd,&a6l<0ob4r3t1Dztes,ß>,ät;ed1Hhüf;$3r1;!/;m,rb;e7s3;al$=,o3;%#,l%e3;b,g3;!ba,-;iw$k08w0;aw,o3äw;b0lr1rf3w2J;$nU#;)%,no3;g2w0;ak3han;!eb;es,%1T;arpsFiBo3saw0;r3(#;b7ps3;e4#3+;diw,v;b,g3;!.rf,/,-,=;$3#0F;!ba,fua,nemmasS-;lg4r(3w;$,#0C;!e3r1;b,g-;!+;aOn3ozWäl,öz;aBiAu4ärd3;=kJ;l0r5s0wz3;$3#;!fW;d$3$,ps#bü,#;!n3rJ;.;f,h;f$Dg3rd;e4#3+;!v;b,g3;!fNk7mu,n6r4-3;!rB;ed)n,ov3;!#h;a,erolr1.;cür3;=;fG/;l3*0;!%$r3;ov;a4o*e3;b,g;%0;)0Xn5r3;ow3uw,?;!$;a(,u3ü(;br1f0;ag,oh3ro(0;$f3#;ua;$;a4ni3u9;fpme,g;l3mr1;!r3;e3ov;tnu;a3)r,rN;*;b0Hd0Ef0Bg06hYir%,kTlOmmNnnök,rMsIt5u3ztis2;a3t;b,%;eEgiD&usr1lBmuär,nAr5t4ß3;uw,>;<,äh;e4hLä3;lkX;d4n3ßuä;niV;rof;alp,hel,.m,ot2rA;<,leLoD;ev;dnük,ez,tä(2;ib,t&ir2;&5s3;a3iw,>;l,p;aw;$.w,h7äw;aCok;e6h5lo4o3;h#deX;s,w;üf;d/h,if;c5n3rT;ed,i3;*,s;e3ür;(;c3öh8;am,i5s3uarb;n?,rr3;eh;er5lg3;öm3;#;!#;a6)l,i3näh;e4t3;&isba2ön2;(,z;lhL*2s;f4r3;üd;<Ioh;.4r3;ew,?;%t9;<,e3;g,ilb;)8i7n4r3ul;iw;a(3is;!$,t3;ne;es;%2;eb;)3ig;lb,rh3;cs",
    "Preposition": "true¦aHbFdDentBfürKge9hintJi8laut,m7n6ohne,se7u4vo2z0üb5;!u0wischB;!folge,m,r;m,n,r0;!m,s;mFnt0;erE;a7eb5;it;m,nB;gen0mäß;!üb8;geg0lang;en;ank,ur0;ch;ei0is;!m;!b,m,n2u0;f1s,ß0;er;!s",
    "LastName": "true¦:gnYnNrMstrebLual,v9yrrep,z0;e0oñum;dnanre6hcnas,lazn5m5n4pol,r2u0;g0qzF;irdHnimod;a0ep,imar,reitug;us,vE;emij,itr8;og;f,h;e6o0;damm4l3n1rt0stenzuk;ep,imid;a0ojmes,rims;sah,vi;iahhim,vap,zB;am;j0yi3;e1liss0;av;r5ske0;la;or;etsof,olyat;e4i3oss0;lr1nahoj,re0;dna;ak;elk,wrad;s0yugn;n2r0;al,ed0;ep,na;ah,e0;j,tsirhc;aw,uj",
    "Noun": "true¦!1:#$%&()*+./<=>?@[]^_`~:ch,en,er,nd,ge,st,de,te,ei,an,ig,ha,ng,ic,li,ra,ie,ne,rt,le,se;0:7U;1:7K;2:7T;3:77;4:74;5:72;6:7B;7:58;8:7C;9:6Y;A:7R;B:7P;C:73;D:48;a71b65c5Zd5Qe5Ef4Tg44h3Ni3Ij3Ek30l2Om24n1Yo1Xp1Ir15s0Ht09u05vTwJzFäEölvor5A;gypt$4M>s3rz3;aGeFuEw?38;(,kä19;c4hn3Kit06l3;c6Fgreb;aLeHiFo#$EäDö_2ür)2;!$C;d%sEnt1ss$48;a4Sp5F;(,hrpf@UiGnCrEs$4M;n1[t31tE;!e,papi6L;g1~;ff0hl0i(7lE;d$3Ves;ari/3eK]JoE;<t,lk,rE;ab1Kg78sEwürfeA;#ußlorbe6Eitz$*Fta&sE;sp2Kv9;!r;l6Xr+ljahrhu&%t;^d<,rE;/two_l?8b[u4DdFgl.c4=Ekä0Olus3+id66;l4S&lu>)2O;acBäE;#ti(;lt$t2KmFnt%ErO;(b4Js#ri3O;brü2sEwelt37;#uldu>s4Etä&0;aI.7hyss0iHoCreFürE;!$;&Epp2u=&a5F;!w5;%e,g1;s2tFuE;be,s5;sac8;aZ#VeUiTka&2IpOtGuFynod2Iz4LüE;d0pp2;c4*t$*uts2mmeA;aJeIimme,rFud]Eädt2;n(bühr0r5;aFeE;et,ß;t57ß0;inkoh`ze2l`;atsEdt[t,rza3O;a02di5M;arHd GrE;ac4e#E;#ör0%;f[k3Gl4Mv9;%,+;cBgnal6Lnn;i6Iuc8;arpi>s,%e,in,n.d1rFwE;i%<0Käc4;.bt1PiEöd1;fts24tt;#Enkt,[jewo;$,s$-/5M;aPeIiHoGu4üE;ckEd51he;s13t5D;b%t,l`;tu1Qv1;#Hgi%u>sRisE);#,eF<=E;uf0;!nC;%2tE;e,saE;nwa6;c4hm$35;aOeLfKhänom3Kioni4SoIrE;eFoEä07; kopf 07g[mmv1Sjek3+s3;isEs~G;absp5Sv%fal7;@z.ErD;sp0T;$n<,l0L;itDrE;es,sE;onal,pek3T;lä)in$s%n,p]GrE;lam$tEol0+iv9;es,swahl0;re;b%fläc4f1O@v1pp$h.m1)slawon]1A;a#IeG]ForEä4;b%t,drh.n we)f10;r0tzD;a&%t0OgativtrEuk22;$d;bar,r07;aTcdonnSePiKoJuIäHög@#GüE;lEn2;h.m kär@#,l1;k.t0;d2rk3;l0H~um;*ll#a[kt1nats5rd;#ae7eH@tär,nEt(f/g2E;*)Fi)%präEut0;sid$t0;.n29;_,+;nFrE;kma`,rF;a#em,em,(,s#$re1E;ell;a)rQl1nGrktn42s#in$FßE;e,n2E;!pi)ol0;(7n;aKeIiHoka`s,uEä31;dEft;ew<,w<E;!s=f3M;cBs3;#,g5iEu4N;c8pz<;#1fontai^s,&E+iniD;eFg%E;?B;!sE;e18k14v9;aO%n,iMoIrFu_,öE;ln,n<4Hr3;a#,]gsEuD;$Cv%bE;re1A;h7l`kTmmun0nE;f@k3tE;ak3rolE;`;nEr2;ke7;bel,mpagn0rFss0ts#thEuf;al1;is#;ahrG%usalFuEürg0;g$d@#e3Rppé;em;!es5hu&%tw5taus$dw5zehnt;*Hmp%aGnFrEta@2V;/,$e;=6itiativeA;tiv;al0;aLeHoFu&%tEäf0Tö4;taus5;eEr);#),n0;broGn^,rEß;b),rn,sEzog;+ll1;n 0S;ftLlKnIuE;ptFs=ltE;!s)r.ts;urs2KvE;%/twor0A;*lsEs jo2;!ab0M;s,t;!a1N;a),eKipJläub31mbh,oIrEünt1;oßofGu&Föße,ünE;*,$;<;f$s30;lft1Ytt;fe7;b]3faT=6lRm.nCnQrMsGwE;a6%ks#aftE;$,sv9;#HeE?Bpräc8ta6;llEtze;s#aE;ft0;iEwor07;#3;i#tFäuD;sc4;!eE;!s;%a7f;d,s$kE;ir2;hr,>$eE;n,r;aXdp0GeViQlMoJrFühru>~E;b$e;aF.h.E;t@2;kEu0;tion1P;l(,rE;meln,sE;#1;a09uFäc8ü#E;t@n(;cBg/gE;);@a`As#E;!%E;!.E;abE;komm0;ld,)g$ommE;$0;ll25mi@$/(höriU;bOiInHpoc4rFuE;`,ropä1;a#E*,folg,=6lö~,wa#s$e1Q;t$s;*,t(6;m1nE;bHh.GnFzel=&e7;ls;ahm0;m0Zt0;rüc4;$eA;am0eKgbJiG[Fu0ZörfE;#0%;#;$)FnEvid5;(;e,mäd2; v9;fizi3`gi%t0utE;sc8;du HhEo6;a[kt%1Ief,iE;`,nabesu#E;es;lEv9;a&e0J;a03eVilUlutv%g]ß0oRrMuIüE;#1hGrg%E;!initiaE;tiv0;^;&esErs2;aF=us0FläEtagsab(ord^3v9;&%A;n)a6;/#eF]f,oEöt2;s#ür0t;!nE;!kollE;eg0;rcEusquN;heE;_;d,l;am3fr.u>)Khörd0rIsGtrE;iEoffP;eb;#äft<0Qu#eE;r,s;ekEg)eFi#t0Q&;et;<1;dInGrriFsf,ueE;rn;%0;/0kE;dar`h0$;$1;a2b0Bgab,kbar,l06nYrUsQuE;fH(,sE;lä06sE;#ußv9?BprE;ac4;$tKsFtE;ritt;i#ts[tFtä&E;is2;sv9;orsiE;tz5;=6;c4ylsu#5;$C;*;he;b.tsGgum$3t$v]lE;fa6;+;plätz0we6;(IhHlag0sEwa6;?Bprüc8ta6;lt;heA;ä>1;hörEklagt0)ellP;i(E;!n,r;exaFt%natE;ive;&1;%;ar;$dJ(ord^HsE;?BpE;[2;ht;+A;!n;!e;#0;$",
    "MaleName": "true¦:aXbob,dnalevelc,eRfuosuoy,iOkJlGmehtak,nCo9qa8r7s5t3urahomot,werd,x2y0;aj,b5d0htan,kcor,nnos;de,nar;am,er;cidenLemha,n0reb7senrEtM;arg,ek;allad,ollo0sM;rik;adyh,evned,ime;istupa,ugnnuB;d0el,geid,llud7mle;erf0nalro;la;a2e1hguav,itsua,os0;am,irrM;mye,rrH;amon,droj,ed,itsirF;ladnek,op,r1zaflu0;ba;ae;c2i1narf,u0;ni;las,nim;a0in,u8;j,m;ahcal1gre,naja,ohs0y;eb;am;cnal,d4groeg,i2n1ss0;ej;ad,eg;j,lra0;hc;aw;kihci,muuy,t0;an2u0;os,r0;ah;ak,ih",
    "Conjunction": "true¦aFbDdAentwedGfalls,in9nach9o6s4u3w0zumal;e0ohingegen,ähre2;dEil,nn0;!g5;nd;eit4o0;bald,dass,lange,ndern,wie;b0d9;!g0wohl;lei2;dem;a1enn,o0;ch;mit,ss,ß;e0zw;vor,ziehungsweise;b0ls;er",
    "Determiner": "true¦d2ein0;!e0;!m,n,r,s;as,e0ie;m,n,r,s",
    "City": "true¦alexandria,genève,h4i̇zmir,kobe,londres,m3n2perth,rosario,s0;a0ydney;lvador,ntiago;ew york city,is;edellín,oscou;amil0ous0;ton",
    "Country": "true¦:!1:#$%&()*+/<=>?@[]^_`~: dnu ,hcs,hc,ar,ni,am,na,la,ab,ta,an,en,et,ts,ne,il,re,ti,as,me;.2La1Ed12e0Ugrub~xul,%0Ri0Ik0Fl0Bm0AnGoCr8s4_awuk,u1yaug0;&ap,uru;a1+vut,r0<u*v;ep,u=;+p,ssib-ae(ug;a2d*lsi (griv 2He<1iv>#st_k1Uo0ui_Q;al,d/r/;ri~ b&a2A@2A;mah/,rudnoh;a2egin,o0upag(s;da0mit@o;uce,v+s le;ksagad),m*ym,<k;c=om,g1htosel,k0(r) *s,rg>?nom,saf a(krub;ixem,kor);/ot#dadi(rt,nok k]buper0ot;! e$it&ko~d;aLe3i2les(l+hsr),r1u0;bag,^mak;agnu,epyz;&h/,?sn?%e],[b;dew$,gewron,i2lle%yT~j,n0romG<a@0Duat],videl),yb];i0omo+s;d=erg eid#t[c(v1Cpp]ihp;bCdBgleb,%e0Pl9n3poihtä,r2s>0<ork,v]ob,wadlZ;o0ut;d9rkim;aglZeg5ys;a2e0it[g1*_rbßorg %ierginök,odez),ämur;m0wW;ra;b1ps,te0;ru);+;a0isaO;r@ua,_;(;&a-idu`,mul0rD;ok;dus6$di/^sa,mo,paj,t0;s0uhb;%`ak,i0;k2n0sigE;ahgfa,emkr0;ut;ap,ebsu,i$dat;!düs;=teiv,odg(k16;a0e&si;g0pZ;>0utrop;es;&i,i0r)>äd;bm`6lbuper e$i*ki0;n11rfal&t[z;dnur7e2$dQl),t0w09;/i0iah,ubi$d;rik;k2logn1nu0;rb;om;aw0rüt;ols;ub;ier1sedalgn0;/;kn&f,r?sö;d6ma(rus,n4picnírp#émot oãs,t1wb/m5z]0;eb;&i~ e$ib&a1sük(eb[f0;le; ?gi(erM;i&ku,oel &^0;is;*l^deT^v pak;aA*l0;eesu8$tu7i6n4ri,s2t0;se,t0;el;i,sur0;!ßiew;e%eirg,n0;if;aht,saws;ed;>;$t;buk,ci00dVePgnot,$dobmOiCk8l5m=Un1om0rrodWtlEug&acG;`;a1i0;%,wogez^h#[ins1;hg,wst0y3;ob;)e<1euz>0ogQ;ev;ug;i0*l irs;)1rfad0;üs;aj;b8cul7l)os,n5^2sy0;al0;);b1g0;in;];`n0ek;at; .@;im1ma0;g,s;=;ak;(ug3r0;okd0_^;r0üs;on;!+iro<uqä,u>-aup0;ap;=2*1ubr/#augit0;*;gu,ur;ak,e0;rg;n3r0; a@oc,ema fo se<@0; d?i0;nu;imod;uk;a0k1;.s0;.u",
    "Region": "true¦g0kashmir,madhya,north yorkshire,prince edward island,virgin1;eorg0uerrero;ia",
    "FemaleNoun": "true¦:!1:#$%&()*+./<=>?@[]^_`~:re,hcs,hc,ne,ts,at,am,nu,ah,ie,ar,er,eb,eg,le,ra,al,ni,ak,dn,an;0:3Q;1:2B;a3Td3Ge21f1Zg1Jh1Gi1Dk19l10n0So0QrVsPt5ua2ytic,zi0U;$3rf2;!ehe;!d+r,l>~;aJfa$I%~,/kgidrüws&hes,@w,onGrAs4ta(k#w,u2ätis#vi+;.2lf,m[,w;!zten;],ep6g9irf5+4op3ruw,u2;af,l,rb;!&g0Z;g,k;!s=haj;!e^0I;a6haf4owt3ub?2;!#deiw;na;!ba,l2mu<,t2U;),h4law;!w&g0;!sg+nh2;ow;`],triw;miYriYt2;!f1Ftulb;a#m_,d5e4gpl,hd,ms,#dro,s3u2;*,g;!im;izXmit,siavr0;c2p;!-@ppod;aVe5hu,u2;ps,t2;a2luk;n,[p=;brQdef,ffiz@k+d,hPiNlLmHpo,tBu2y*lda(;a8e(3k,t2;!su.;l5&4okeo,t2;fa$2#wrhem;b#,#p#ok;geom0Qmmok0R;)ip_>#w0eola#^m;bu2d,m,rt;en;%5l4sMt2;e2um;b,um;of,u1O;eot,ot2;!-wv;ha(,m2r1;_3un2;!nofe@t;!f0Lst&m][p;eu$-#ks],l2;eh;*-sue.tt*,ef2n*;!#u<t;cab&iw1Dp)K;eps;as,been1Bmgad;koy,lp,no,pyhn#y1t2;~,w;hab8i6n*%1oit5#2;mm3po,(2ue(s&mhen#t+;ew16;_,un;*rofQkn9;ginök,#$teml2(izilop;od;-u,&ß04;a9e2i*-e,lov`.;b7deir,f)k&d0g=,kr6mrof,s2t&ilk;i0^4se3u]k2;!&taa(ttird;uf;!bl.;em;ag,ib,mae<p,#1;rom;ce4ehtoilbib,n1r2;*2h;!-d;ur;l2+,sa(;*__5z2;~;c2g/lrI;lim,nüm-#l@2;um;aGe,+4r2;f,ob?2ub%oh;^;bBd8fürp,$<#bü,l@(>,n6#4t2;/z,s2;ef;`2iv#s=;aw;d2eid>;ro;]3^b2;#v;n/;/r$>,r2ü;ew;!d,ev,gb;<,eci2lgg,rpk;+;d/rk,fWgaU%Sif<gotRkNlMnJpmIrr)ig,sDt4z3ß2;<(;n]fp,tüm;r5t2;aw<k,e2üh;ksid,liot,ss2;_;_2ot;`Akn1rhaf,t2;id=k,s2;op;ab;~,o5s3u2;ap,lb;a2=da;g,k,t;d,h;];has,i2nO;d[g,$2[`2s@f5;*;/,li5uE;c3ehto2;pa;ed,os,ü2;rb;of;as,ow,rik,s2ük;),ud;r2te;ag,f;<(GfawElih5#a4u2;),(2;!d7;$;!>#9i8laiz7&solst/b6s2tRzna^f;g+lkciwt4t2;fa$tr2l.suB;iw;&;[;os;>;(;!t2;ful;!dl0s3tf2;.;ed2t/h/rf;ot;rk;eDlu9n2;a4?2;?,u2;j,t;h3w2;!n/l;!ue2;rt;d0$2;!+,t2;im;?;r,s;`6i4k2loc,mo,pd,zzip;co%us,ilbup2;=;f*&go2lasog,nomr.lihp;rd;agapo2?a;rp",
    "Place": "true¦ams,b0fco,i0jfk,ord,phl,syd;cn",
    "Month": "true¦:i4lirpa,r0tsugua,zräm;au2eb0;me0otko;tpes,von,zed;naj,rbef;am,l0n0;uj",
    "WeekDay": "true¦:dnebann3gat0hcowttim;ierf,n1s0;mas,rennod;n0om;os",
    "Pronoun": "true¦!1:#$:ch,er;a06b03dYeUiPjeKkeinJletzt$es,mCni#ts,paar,s6uns5viele05w0;a3e2i1o0;!bei,gegen,mOnaTrin,von;ev5r;l5nXr;nn,rum,s;!$;i4o0ämtP;l1v0;iele;#e0;m,n,r,s;#,e;an3e1i0;#,r;hr$e6i0;n,stO;!#0;!e0;!m,n,s;!eL;d1gli#e0neN;!n;e0wed$;!m,n,r0s;!mann;c3h1nwiewe0;it;m,n0r;!en;h,k;inige2r,s,t1u0;#;li#e;n,r,s;e3i0u;#,e0r;jen0s6;ig2;n1r1ss1;eide1iß#0;en;!n,r;ll0nd$em;!e0;!m,n,r,s",
    "FirstName": "true¦nelly",
    "Person": "true¦c0jaime,rush limbaugh,sung,tiger woods,virgin mary;arson palmer,ruz",
    "Currency": "true¦cent2dollar2euro2frank1krone0rubel,y1;!n;en;!s",
    "Unit": "true¦ampere,bHgEheDk5litAm1quadrat6t0volt,w9zenti6;erFonneA;e1illi0;g9li4me4;ga0t6;bCw4;ilo2ubik0;me0;ter;!b8g3met1w0;att;er0;!n;ramm;ktar,rtz;ig1ra0;d,mm;ab0;yte",
    "TextCardinal": "true¦achtDb9drei7e6fünfDhundert,m9n5s2tausend,vierDz0;eEw0;anz6ei,ölf;ech1ieb0;en,zA;s,z9;eun7ull;ins,lf;!ze7ß0;ig;illi0;arde1on0;!en;!n;!z0;e0ig;hn",
    "Modal": "true¦d9k7m2soll1w0;illBollt7;!st,t6;ag9och7u2ö1ü0;sst,ßt;ch5gt;ss0ß0;!t1;ann4onn2önnt0;!e2;arf2urf0ürft;te0;!n,st,t;!st",
    "Possessive": "true¦:e1me1ne1re1s0;er1n2rhi;n1r0;esnu,hi,ue;ie0;d,m,s",
    "TextOrdinal": "true¦achtEbBdr9e8fünf7hundert6mBn5s2tausenDvier7z0;eGw0;anziEeiGölfG;ech1ieb0;enEte,zB;sDzA;eun1ullC;ersBsB;te,z7;lf9rs9;ei0it8;ze6ßi5;illi0;ar0ons5;ds4;e,z0;e1i0;gs1;hn0;te"
  };

  /* eslint-disable no-empty */
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
    for (; places > 0; places--) {
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
    const reSymbol = /^([0-9A-Z]+):([0-9A-Z]+)$/;
    for (let i = 0; i < t.nodes.length; i++) {
      if (!t.nodes[i].includes(':')) {
        break
      }
      const m = reSymbol.exec(t.nodes[i]);
      if (!m || m[0].length !== t.nodes[i].length || encoding.fromAlphaCode(m[1]) !== i) {
        throw new SyntaxError('Invalid efrt packed data: symbol definition')
      }
      t.syms.push(encoding.fromAlphaCode(m[2]));
    }
    t.symCount = t.syms.length;
    t.nodes = t.nodes.slice(t.symCount);
    if (t.nodes.length === 0 || t.syms.some((index) => !Number.isSafeInteger(index) || index >= t.nodes.length)) {
      throw new SyntaxError('Invalid efrt packed data: symbol target')
    }
  };

  const unescapeLabel = function (text) {
    return text.replace(/\\([\s\S]|$)/g, (match, char) => {
      if (char === '\\') {
        return '\\'
      }
      if (char >= 'a' && char <= 'j') {
        return String(char.charCodeAt(0) - 97)
      }
      throw new SyntaxError('Invalid efrt packed data: label escape')
    })
  };

  const dictionary = function (trie) {
    if (!trie.nodes[0].startsWith('!1:')) {
      return
    }
    const header = trie.nodes.shift().split(':');
    const tokens = Array.from(header[1]);
    const fragments = (header[2] || '').split(',');
    if (header.length !== 3 || tokens.length === 0 || tokens.length !== fragments.length ||
      new Set(tokens).size !== tokens.length || trie.nodes.length === 0 ||
      tokens.some((token) => token.length !== 1 || token.charCodeAt(0) < 33 ||
        token.charCodeAt(0) > 126 || /[A-Za-z0-9,;!:|]/.test(token) ||
        (trie.versioned && token === '\\')) ||
      fragments.some((text) => !text || /[A-Z0-9,;!:|¦]/.test(text))) {
      throw new SyntaxError('Invalid efrt packed data: fragment dictionary')
    }
    trie.dictionary = Object.create(null);
    for (let i = 0; i < tokens.length; i++) {
      trie.dictionary[tokens[i]] = trie.versioned ? unescapeLabel(fragments[i]) : fragments[i];
    }
  };

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    const target = dnode < trie.symCount ? trie.syms[dnode] : index + dnode + 1 - trie.symCount;
    // The encoder emits nodes in topological order. Every edge must point
    // forward, which also rules out cycles before expansion starts.
    if (!Number.isSafeInteger(target) || target <= index || target >= trie.nodes.length) {
      throw new SyntaxError('Invalid efrt packed data: node reference')
    }
    return target
  };

  const parseNodes = function (trie) {
    return trie.nodes.map((node, index) => {
      if (node === '' && trie.nodes.length !== 1) {
        throw new SyntaxError('Invalid efrt packed data: empty node')
      }
      const terminal = node[0] === '!';
      const body = terminal ? node.slice(1) : node;
      const edges = [];
      // Match only at the current offset. Searching later positions would
      // repeatedly rescan a long malformed fragment before rejecting it.
      const token = /([^A-Z0-9,;!:|¦]+)([A-Z0-9]+|,|$)/y;
      for (let offset = 0; offset < body.length; offset = token.lastIndex) {
        const match = token.exec(body);
        if (!match || match.index !== offset || (match[2] === ',' && token.lastIndex === body.length)) {
          throw new SyntaxError('Invalid efrt packed data: node syntax')
        }
        const ref = match[2];
        const label = trie.versioned ? unescapeLabel(match[1]) : match[1];
        const text = trie.dictionary ? Array.from(label,
          (char) => trie.dictionary[char] || char).join('') : label;
        edges.push({
          text,
          target: ref === '' || ref === ',' ? -1 : indexFromRef(trie, ref, index)
        });
      }
      return { terminal, edges }
    })
  };

  const toArray$4 = function (trie) {
    const nodes = parseNodes(trie);
    const all = [];
    const stack = [{ index: 0, pref: '', edge: -1 }];
    for (; stack.length > 0;) {
      const frame = stack[stack.length - 1];
      const node = nodes[frame.index];
      if (frame.edge === -1) {
        if (node.terminal) {
          all.push(frame.pref);
        }
        frame.edge = 0;
      }
      if (frame.edge === node.edges.length) {
        stack.pop();
        continue
      }
      const edge = node.edges[frame.edge++];
      const word = frame.pref + edge.text;
      if (edge.target === -1) {
        all.push(word);
      } else {
        stack.push({ index: edge.target, pref: word, edge: -1 });
      }
    }
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$1 = function (str, versioned = false) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0,
      versioned
    };
    dictionary(trie);
    //process symbols, if they have them
    if (str.match(':')) {
      symbols(trie);
    }
    return toArray$4(trie)
  };

  const unpack = function (str) {
    if (str === '' || str === null || str === undefined) {
      return {}
    }
    if (typeof str !== 'string') {
      throw new TypeError('efrt unpack expects a string')
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      if (arr.length !== 2 || Object.prototype.hasOwnProperty.call(h, arr[0])) {
        throw new SyntaxError('Invalid efrt packed data: category separator or duplicate category')
      }
      h[arr[0]] = arr[1];
      return h
    }, Object.create(null));
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      let data = obj[cat];
      const versioned = data.startsWith('!2;');
      if (versioned) {
        data = data.slice(3);
        if (!data || data === ':') {
          throw new SyntaxError('Invalid efrt packed data: missing versioned trie')
        }
      }
      const reversed = data[0] === ':';
      const arr = unpack$1(reversed ? data.slice(1) : data, versioned);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = reversed ? Array.from(arr[i]).reverse().join('') : arr[i];
        if (Object.prototype.hasOwnProperty.call(all, k)) {
          if (Array.isArray(all[k]) === false) {
            if (all[k] !== cat) {
              all[k] = [all[k], cat];
            }
          } else if (!all[k].includes(cat)) {
            all[k].push(cat);
          }
        } else {
          Object.defineProperty(all, k, {
            value: cat,
            writable: true,
            enumerable: true,
            configurable: true
          });
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

  const lexicon$1 = Object.assign({}, misc$1);

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
      const w = obj[k];
      if (canEnrich(lex, w) && tagMap[k]) {
        lex[w] = [tag, tagMap[k]];
      }
    });
  };

  // 1st pass - add all words directly from the lexicon
  const unpacked = {};
  Object.keys(lexData).forEach(tag => {
    const wordsObj = unpack(lexData[tag]);
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
        const obj = inflectAdj(w);
        addWords(obj, 'Adjective', lexicon$1);
      }
      // add plural forms for our nouns
      if (tag === 'Noun' || tag === 'MaleNoun' || tag === 'FemaleNoun' || tag === 'NeuterNoun') {
        const plural = toPlural(w).one;
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
  // console.log(lexicon['zweite'])
  // names of people and places, shared by every language - our own words win
  Object.keys(properNouns).forEach(tag => {
    Object.keys(unpack(properNouns[tag])).forEach(w => {
      lexicon$1[w] = lexicon$1[w] || tag;
    });
  });

  // find the infinitive of an imperative - 'gib' -> 'geben', 'geh' -> 'gehen', 'kommt' -> 'kommen'
  // the singular is often cut short - 'geh!' for 'gehe!'

  // old + new spelling - 'laß' and 'lass'
  const norm = (str) => (str || '').replace(/ß$/, 'ss');

  // is this word the singular imperative of this verb?
  const isSingular = function (str, inf) {
    const want = norm(toImperative(inf).secondSingular);
    return Boolean(want) && (want === norm(str) || want === str + 'e' || want + 'e' === str)
  };

  // is it the plural? - this is also the present-tense 'ihr' form
  const isPlural = function (str, inf) {
    return norm(toImperative(inf).secondPlural) === norm(str) || toPresent(inf).secondPlural === str
  };

  // returns { root, form } or null
  // - 'isVerb' is a function that says if an infinitive is one that we know
  const parseImperative = function (str, isVerb) {
    const guesses = [
      fromImperative(str, 'singular'),
      fromImperative(str + 'e', 'singular'),
      // 'geh' -> 'gehen', 'tu' -> 'tun', 'sammle' -> 'sammeln'
      str + 'en',
      str + 'n',
      str.replace(/le$/, 'eln'),
      str.replace(/re$/, 'ern'),
    ];
    let found = guesses.find((inf) => inf && inf !== str && isVerb(inf) && isSingular(str, inf));
    if (found) {
      return { root: found, form: 'singular' }
    }
    found = [fromImperative(str, 'plural'), fromPresent(str, 'secondPlural')].find((inf) => {
      return inf && inf !== str && isVerb(inf) && isPlural(str, inf)
    });
    return found ? { root: found, form: 'plural' } : null
  };

  // the conjugation models are keyed by these names
  const forms = {
    FirstPerson: 'first',
    SecondPerson: 'second',
    ThirdPerson: 'third',
    FirstPersonPlural: 'firstPlural',
    SecondPersonPlural: 'secondPlural',
    ThirdPersonPlural: 'thirdPlural',
  };

  const verbForm = function (term) {
    const tag = Object.keys(forms).find(k => term.tags.has(k));
    return tag ? forms[tag] : null
  };

  // the tag of each tense
  const tenses$2 = {
    present: 'PresentTense',
    past: 'PastTense',
    subjunctive1: 'Subjunctive1',
    subjunctive2: 'Subjunctive2',
  };

  const isInfinitive$2 = function (str, lexicon) {
    if (!lexicon.hasOwnProperty(str)) {
      return false
    }
    const tags = lexicon[str];
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  // find the infinitive of a conjugated verb - 'sprichst' -> 'sprechen'
  // the tagger's guess at the tense + person is often wrong, so every tense is tried,
  // and only an infinitive that conjugates back into our word is kept
  const getVerbRoot = function (term, str, world) {
    const verb = world.methods.two.transform.verb;
    const lexicon = world.model.one.lexicon;
    const form = verbForm(term);
    const found = verb.candidates(str).filter(o => o.root !== str);
    // how well does this one agree with the tagger?
    const score = function (o) {
      const hits = o.hits.filter(h => term.tags.has(tenses$2[h.tense]));
      return (hits.length > 0 ? 2 : 0) + (hits.some(h => h.person === form) ? 1 : 0)
    };
    // prefer a real verb - 'sagte' is 'sagen', not 'sagten'
    const known = found.filter(o => isInfinitive$2(o.root, lexicon));
    const list = (known.length > 0 ? known : found).map((o, i) => ({ o, i, score: score(o) }));
    list.sort((a, b) => b.score - a.score || a.i - b.i);
    if (list.length === 0) {
      return null
    }
    // without a tense, the tagger is not sure about this verb - so neither are we
    const hasTense = Object.values(tenses$2).some(tag => term.tags.has(tag));
    return known.length > 0 || hasTense ? list[0].o.root : null
  };

  const root = function (view) {

    const { verb, noun, adjective } = view.world.methods.two.transform;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        const str = term.implicit || term.normal || term.text;
        // get infinitive form of the verb
        if (term.tags.has('Verb')) {
          const lexicon = view.world.model.one.lexicon;
          const imp = term.tags.has('Imperative') ? parseImperative(str, (inf) => isInfinitive$2(inf, lexicon)) : null;
          if (imp) {
            // 'Ruf mich [an]!' is 'anrufen'
            const last = terms[terms.length - 1];
            const joined = last !== term && last.tags.has('Particle') ? last.normal + imp.root : null;
            term.root = joined && isInfinitive$2(joined, lexicon) ? joined : imp.root;
          } else if (term.tags.has('Participle') && term.tags.has('PresentTense')) {
            // look at past + present participles, first
            term.root = verb.fromPresentParticiple(str);
          } else if (term.tags.has('Participle') && term.tags.has('PastTense')) {
            term.root = verb.fromPastParticiple(str);
          } else if (term.tags.has('Particle')) ; else if (isInfinitive$2(str, view.world.model.one.lexicon)) {
            // 'wir [wohnen] hier'
            term.root = str;
          } else {
            const inf = getVerbRoot(term, str, view.world);
            if (inf) {
              term.root = inf;
            } else if (term.tags.has('Imperative')) {
              term.root = verb.fromImperative(str, verbForm(term));
            } else if (term.tags.has('PresentTense') || term.tags.has('PastTense')) {
              // no luck
              term.root = str;
            }
          }
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

  // compromise drops the key 'null' when it expands a lexicon,
  // which loses the german word for zero
  const mutate$1 = function (world) {
    world.model.one.lexicon.null = lexicon$1.null;
  };

  var lexicon = {
    mutate: mutate$1,
    compute: { root: root },
    methods: {
      two: {
        transform: methods
      }
    },
    words: lexicon$1,
    hooks: ['lexicon']
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var nouns$2 = {
    Noun: {
      aliases: [null, 'Nomen', 'Substantiv'],
    },
    Singular: {
      not: ['Plural'],
    },
    ProperNoun: {
      aliases: [null, 'Eigenname'],
    },
    Person: {
    },
    FirstName: {
      aliases: [null, 'Vorname'],
    },
    MaleName: {
      aliases: [null, 'Männername'],
    },
    FemaleName: {
      aliases: [null, 'Frauenname'],
    },
    LastName: {
      aliases: [null, 'Nachname'],
    },
    Honorific: {
      aliases: [null, 'Titel'],
      is: 'Noun',
    },
    Place: {
      aliases: [null, 'Ort'],
    },
    Country: {
      aliases: [null, 'Land'],
    },
    City: {
      aliases: [null, 'Stadt'],
    },
    Region: {
    },
    Address: {
      aliases: [null, 'Adresse'],
    },
    Organization: {
      aliases: [null, 'Organisation'],
    },
    SportsTeam: {
      aliases: [null, 'Mannschaft'],
    },
    School: {
      aliases: [null, 'Schule'],
    },
    Company: {
      aliases: [null, 'Unternehmen'],
    },
    Plural: {
      not: ['Singular'],
    },
    Uncountable: {
      aliases: [null, 'Unzählbar'],
    },
    Pronoun: {
      aliases: [null, 'Pronomen'],
    },
    Actor: {
      not: ['Person', 'Place', 'Organization'],
    },
    Activity: {
      aliases: [null, 'Aktivität'],
    },
    Unit: {
      aliases: [null, 'Einheit'],
    },
    Demonym: {
      aliases: [null, 'Einwohnername'],
    },
    Possessive: {
      aliases: [null, 'Possessiv'],
      is: undefined,
    },
    MaleNoun: {
      aliases: [null, 'Maskulinum'],
      is: 'Noun',
      not: ['FemaleNoun', 'NeuterNoun'],
    },
    FemaleNoun: {
      aliases: [null, 'Femininum'],
      is: 'Noun',
      not: ['MaleNoun', 'NeuterNoun'],
    },
    NeuterNoun: {
      aliases: [null, 'Neutrum'],
      is: 'Noun',
      not: ['MaleNoun', 'FemaleNoun'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var verbs$2 = {
    Verb: {
    },
    PresentTense: {
      aliases: [null, 'Präsens'],
      not: ['PastTense'],
    },
    Infinitive: {
      aliases: [null, 'Infinitiv'],
    },
    Imperative: {
      aliases: [null, 'Imperativ'],
      is: 'Infinitive',
      not: undefined,
    },
    Subjunctive: {
      aliases: [null, 'Konjunktiv'],
      is: 'Verb',
    },
    Participle: {
      aliases: [null, 'Partizip'],
      is: 'Verb',
    },
    Gerund: {
    },
    PastTense: {
      aliases: [null, 'Vergangenheit'],
      not: ['PresentTense', 'Gerund'],
    },
    Copula: {
      aliases: [null, 'Kopula'],
    },
    Modal: {
      aliases: [null, 'Modalverb'],
    },
    PerfectTense: {
      aliases: [null, 'Perfekt'],
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      aliases: [null, 'Plusquamperfekt'],
      is: 'Verb',
    },
    PhrasalVerb: {
      aliases: [null, 'Partikelverb'],
    },
    Particle: {
      aliases: [null, 'Verbpartikel'],
    },
    Auxiliary: {
      aliases: [null, 'Hilfsverb'],
    },
    FirstPerson: {
      aliases: [null, 'ErstePerson'],
      is: 'Verb',
    },
    SecondPerson: {
      aliases: [null, 'ZweitePerson'],
      is: 'Verb',
    },
    ThirdPerson: {
      aliases: [null, 'DrittePerson'],
      is: 'Verb',
    },
    FirstPersonPlural: {
      aliases: [null, 'ErstePersonPlural'],
      is: 'Verb',
    },
    SecondPersonPlural: {
      aliases: [null, 'ZweitePersonPlural'],
      is: 'Verb',
    },
    ThirdPersonPlural: {
      aliases: [null, 'DrittePersonPlural'],
      is: 'Verb',
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var values$1 = {
    Value: {
      aliases: [null, 'Zahl'],
    },
    Ordinal: {
      aliases: [null, 'Ordinalzahl'],
    },
    Cardinal: {
      aliases: [null, 'Kardinalzahl'],
    },
    Fraction: {
      aliases: [null, 'Bruchzahl'],
    },
    Multiple: {
      aliases: [null, 'Vielfaches'],
      is: 'Value',
    },
    RomanNumeral: {
      aliases: [null, 'RömischeZahl'],
      not: ['TextValue'],
    },
    TextValue: {
      aliases: [null, 'Zahlwort'],
      not: ['NumericValue'],
    },
    TextOrdinal: {
      is: 'TextValue',
      also: ['Ordinal'],
    },
    TextCardinal: {
      is: 'TextValue',
      also: ['Cardinal'],
    },
    NumericValue: {
      aliases: [null, 'Numerisch'],
      not: ['TextValue'],
    },
    Money: {
      aliases: [null, 'Geld'],
    },
    Percent: {
      aliases: [null, 'Prozent'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var dates = {
    Date: {
      aliases: [null, 'Datum'],
    },
    Month: {
      aliases: [null, 'Monat'],
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      aliases: [null, 'Wochentag'],
      is: 'Noun',
      also: ['Date'],
      not: undefined,
    },
    Year: {
      aliases: [null, 'Jahr'],
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      aliases: [null, 'Quartal'],
      not: 'Fraction',
    },
    Holiday: {
      aliases: [null, 'Feiertag'],
    },
    Season: {
      aliases: [null, 'Jahreszeit'],
      not: undefined,
    },
    Timezone: {
      aliases: [null, 'Zeitzone'],
      is: 'Noun',
      also: ['Date'],
    },
    Time: {
      aliases: [null, 'Uhrzeit'],
      not: ['AtMention'],
    },
    Duration: {
      aliases: [null, 'Dauer'],
      is: 'Noun',
      also: ['Date'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var misc = {
    Adjective: {
      aliases: [null, 'Adjektiv'],
    },
    Comparable: {
      aliases: [null, 'Steigerbar'],
    },
    Comparative: {
      aliases: [null, 'Komparativ'],
    },
    Superlative: {
      aliases: [null, 'Superlativ'],
    },
    NumberRange: {
      aliases: [null, 'Zahlenbereich'],
    },
    Adverb: {
    },
    Determiner: {
      aliases: [null, 'Artikel', 'Determinativ'],
    },
    Conjunction: {
      aliases: [null, 'Konjunktion'],
      is: undefined,
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'],
    },
    Preposition: {
      aliases: [null, 'Präposition'],
      is: undefined,
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      aliases: [null, 'Fragewort'],
    },
    Currency: {
      aliases: [null, 'Währung'],
    },
    Expression: {
      aliases: [null, 'Interjektion'],
    },
    Abbreviation: {
      aliases: [null, 'Abkürzung'],
    },
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      aliases: [null, 'Telefonnummer'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {
    },
    AtMention: {
      aliases: [null, 'Erwähnung'],
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
      aliases: [null, 'Akronym'],
      not: ['Plural', 'RomanNumeral'],
    },
    Negative: {
      aliases: [null, 'Negation'],
      not: ['Noun', 'Adjective', 'Value'],
    },
    Condition: {
      aliases: [null, 'Bedingung'],
      is: undefined,
    },
  };

  const ours = Object.assign({}, nouns$2, verbs$2, values$1, dates, misc);

  // start from the shared tagset, then apply our own tags and changes
  const tags = { ...allTags };

  Object.keys(ours).forEach(tag => {
    const en = tags[tag];
    if (!en) {
      tags[tag] = ours[tag];
      return
    }
    // our aliases lead, so the first one stays the preferred name - then the english ones, like #NN
    const aliases = (ours[tag].aliases || [null]).concat((en.aliases || []).filter(str => str));
    tags[tag] = { ...en, ...ours[tag], aliases };
  });

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

  const compact = {
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
  const unicode = {};
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

  // words that end in a period, but don't end a sentence - 'Dr.'
  // (these replace the english abbreviations, which collide with real words here)
  const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]));

  var abbreviations = toObj(`
  dr prof dipl ing dipl.-ing med jur rer nat phil hr fr fa hrsg inh univ hbf bhf
  bzw ggf evtl inkl exkl zzgl ca vgl sog bzgl bspw bsp ggü lt gem allg bes
  einschl ausschl entspr ehem geb gest verh gegr mind zus zw od
  nr abs kap anm abb tab bd aufl ebd ff resp tel st str co ltd vs
  mio mrd tsd mwst jh jhd chr min std rd mtl
  tägl monatl jährl nördl südl östl westl
  mo di sa usw usf etc
  jan feb mär apr jun jul aug sep sept okt nov dez
`);

  // in german, '3.' is 'third' - so 'am 3. Mai' is not the end of a sentence.
  // this runs after the sentence-splitter, and puts those back together.
  // (and street-names too - 'in der Hauptstr. 5')
  const endsNumber = /(?:(\S+)\s+)?(?:\d+|[IVX]{2,})\.\s*$/;
  const endsStreet = /\p{L}str\.\s*$/u;
  const endsNewline = /\n\s*$/;
  const startsLower = /^\p{Ll}/u;
  const firstWord = /^\p{L}+/u;
  const toSet = str => new Set(str.split(/\s+/));

  // an ordinal comes after one of these - 'der 3. Mann'
  const before = toSet(`am im vom zum beim zur der die das den dem des ein eine einen einem einer
  jeder jede jedes jeden mein meine meinen sein seine seinen ihr ihre ihren unser unsere unseren
  und bis oder ab seit nach v.`);
  // .. or before one of these - '3. Mai'
  const months = toSet(`Januar Jänner Februar März April Mai Juni Juli August September Oktober November Dezember
  Jan Feb Mär Apr Jun Jul Aug Sep Sept Okt Nov Dez`);
  // .. but these begin a new sentence - 'Sie wohnt im 4. Das ist hoch.'
  const starters = toSet(`Der Die Das Er Sie Es Ich Du Wir Ihr Man Wer Was Wie Wo Wann Warum
  Und Aber Doch Oder Denn Da Dort Hier Dann Danach Nun Also Auch Heute Morgen Jetzt Später`);

  // does the sentence carry on, after this period?
  const isOrdinal = function (last, str) {
    if (endsNewline.test(last)) {
      return false
    }
    const next = (str.match(firstWord) || [])[0];
    if (endsStreet.test(last)) {
      return !starters.has(next)
    }
    const m = last.match(endsNumber);
    if (m === null) {
      return false
    }
    // 'Heinrich VIII. war König'
    if (startsLower.test(str)) {
      return true
    }
    if (months.has(next)) {
      return true
    }
    // a number at the very start - '1. FC Köln'
    if (m[1] === undefined) {
      return !starters.has(next)
    }
    return before.has(m[1].toLowerCase()) && !starters.has(next)
  };

  const mergeOrdinals = function (arr) {
    const out = [];
    arr.forEach(str => {
      const last = out[out.length - 1];
      if (last !== undefined && isOrdinal(last, str)) {
        out[out.length - 1] += str;
        return
      }
      out.push(str);
    });
    return out
  };

  /** add a german step to the end of the english sentence-splitter */
  const wrap = function (splitSentences) {
    return (text, world) => mergeOrdinals(splitSentences(text, world))
  };

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = unicode;
      world.model.one.contractions = contractions;
      // our own abbreviations, for the sentence-parser
      world.model.one.abbreviations = { ...abbreviations };
      // '3.' is an ordinal - 'am 3. Mai'
      world.methods.one.tokenize.splitSentences = wrap(world.methods.one.tokenize.splitSentences);
    },
  };

  // import values from './splitter/values.js'
  // import nouns from './splitter/nouns.js'
  // import verbs from './splitter/verbs.js'
  // import adjectives from './splitter/adjectives.js'

  const values = { more: [] };
  const nouns$1 = { more: [] };
  const verbs$1 = { more: [] };
  const adjectives$1 = { more: [] };

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
    const chars = str.split('');
    let node = root;
    chars.forEach(c => {
      node.more[c] = node.more[c] || { more: {} };
      node = node.more[c];
    });
    node.end = true;
  };

  const findMatch = function (str, root) {
    let match = null;
    const chars = str.split('');
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
    const found = [];
    while (str.length > 0) {
      let match = findMatch(str, root);
      if (!match) {
        //we done
        // allow a connector - [foo, en, bar]
        if (found.length > 0 && hasLink.test(str)) {
          const tmp = str.replace(hasLink, '');
          match = findMatch(tmp, root);
          if (match) {
            const link = str.match(hasLink)[0];
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
    const { values } = view.model.one.splitter;
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
    const words = Object.entries(world.model.one.lexicon);
    const { nouns, values } = world.model.one.splitter;
    words.forEach((a) => {
      const [w, tag] = a;
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
    addWord('null', values); // compromise drops this key from the lexicon
    addWord('minus', values); // 'minusfünf'
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const { regexText, regexNormal, regexNumbers } = world.model.two;
    const normal = term.machine || term.normal;
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

  const isBigNumber = /^(million|milliarde|billion|billiarde)(n|en)?$/;

  // add a noun to any non-0 index titlecased word, with no existing tag
  const titleCaseNoun = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    // don't over-write any tags
    // if (term.tags.size > 0) {
    //   return
    // }
    // skip first-word, for now
    if (i === 0) {
      return
    }
    // these are written as nouns, but they are numbers - 'zwei Millionen'
    if (term.tags.has('TextCardinal') && isBigNumber.test(term.normal)) {
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      const num = Number(term.normal);
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
    const str = term.text;
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
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
      const suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        const tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const suffixes = world.model.two.suffixPatterns;
    const term = terms[i];
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
      const prefix = str.substring(0, i);
      if (prefixes[prefix.length].hasOwnProperty(prefix) === true) {
        const tag = prefixes[prefix.length][prefix];
        return tag
      }
    }
    return null
  };

  // give 'overwork' the same tag as 'work'
  const checkPrefix = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.size === 0) {
      const tag = prefixLoop(term.normal, world.model.two.prefixPatterns);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-prefix');
        term.confidence = 0.5;
        return true
      }
    }
    return null
  };

  // a separable verb is written as one word, at the end of a subordinate clause
  // 'weil ich dich anrufe', 'ob er mitkommt'
  // - we may only know 'rufe' and 'kommt', so look for the verb behind the prefix
  const prefixes$1 = [
    'zusammen', 'zurück', 'weiter', 'vorbei', 'heraus', 'herein', 'hinaus', 'hinein', 'herum', 'fort', 'fest',
    'nach', 'teil', 'weg', 'vor', 'mit', 'los', 'her', 'hin', 'ein', 'bei', 'aus', 'auf', 'ab', 'an', 'zu',
  ];
  const finite = ['PresentTense', 'PastTense'];
  const persons$2 = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'];

  const toArray$3 = (tags) => (typeof tags === 'string' ? [tags] : tags || []);

  const separable = function (terms, i, world) {
    const term = terms[i];
    const str = term.normal;
    // german nouns are capitalized, so a lower-case word is something else
    if (i === 0 || !term.text || term.text[0] !== term.text[0].toLowerCase()) {
      return null
    }
    const lexicon = world.model.one.lexicon;
    const known = toArray$3(lexicon[str]);
    // only an unknown word, or one that we know as a noun
    // (an unknown word may have been guessed as a plain verb, already)
    const isGuess = known.length === 0 && term.tags.size === 1;
    if ((term.tags.has('Verb') && !isGuess) || known.some((tag) => tag !== 'Plural' && tag !== 'Noun' && !/Noun$/.test(tag))) {
      return null
    }
    for (let k = 0; k < prefixes$1.length; k += 1) {
      const prefix = prefixes$1[k];
      if (!str.startsWith(prefix) || str.length < prefix.length + 3) {
        continue
      }
      const tags = toArray$3(lexicon[str.slice(prefix.length)]);
      // an infinitive - 'sie werden mitkommen'
      // or a conjugated verb, with a person - 'rufe', 'kommt'
      const isVerb = tags.includes('Infinitive') || (tags.some((tag) => finite.includes(tag)) && tags.some((tag) => persons$2.includes(tag)));
      if (isVerb) {
        term.tags.clear();
        world.methods.one.setTag([term], ['Verb'].concat(tags), world, false, '2-separable-verb');
        return true
      }
    }
    return null
  };

  // german nouns are capitalized, so a lower-case word that we only know as a noun is something else
  // 'sie [schloss] die Tür' is 'schließen', not 'das Schloss'
  const tenses$1 = { present: 'PresentTense', past: 'PastTense' };
  const persons$1 = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };
  const toArray$2 = (tags) => (typeof tags === 'string' ? [tags] : tags || []);

  const lowercaseVerb = function (terms, i, world) {
    const term = terms[i];
    const str = term.normal;
    if (i === 0 || !term.text || term.text[0] !== term.text[0].toLowerCase()) {
      return null
    }
    const lexicon = world.model.one.lexicon;
    const known = toArray$2(lexicon[str]);
    if (known.length === 0 || !known.every((tag) => tag === 'Plural' || /Noun$/.test(tag))) {
      return null
    }
    // is it a form of a verb that we know?
    const isVerb = (inf) => toArray$2(lexicon[inf]).includes('Infinitive');
    const found = world.methods.two.transform.verb.lookup(str, { isVerb, known: true, tenses: Object.keys(tenses$1) });
    if (!found) {
      return null
    }
    const { tense, person } = found.hits[0];
    term.tags.clear();
    world.methods.one.setTag([term], ['Verb', tenses$1[tense], persons$1[person]], world, false, '2-lowercase-verb');
    return true
  };

  // these join number-words together
  const glue = new Set(['und', 'ein', 'minus']);
  // an inflected ordinal - 'einhundertzweiten'
  const isEnding = /^[nrsm]$/;

  const getTag = function (str, lex) {
    if (str === 'hunderttausend') {
      return 'TextCardinal'
    }
    const tag = lex.hasOwnProperty(str) ? lex[str] : null;
    return tag === 'TextCardinal' || tag === 'TextOrdinal' ? tag : null
  };

  // a word made only of number-words is a number - 'einhundertzweite', 'dreitausendvier'
  const numberWord = function (terms, i, world) {
    const term = terms[i];
    if (term.tags.size !== 0) {
      return null
    }
    const lex = world.model.one.lexicon;
    const values = world.model.one.splitter.values;
    const parts = findSplits(term.normal, values);
    if (parts.length < 2) {
      return null
    }
    let hasEnding = false;
    if (parts.length > 2 && isEnding.test(parts[parts.length - 1])) {
      parts.pop();
      hasEnding = true;
    }
    if (!parts.every(str => glue.has(str) || getTag(str, lex))) {
      return null
    }
    // the last word decides it - 'einhundert[zweite]'
    const tag = getTag(parts[parts.length - 1], lex);
    if (!tag || (hasEnding && tag !== 'TextOrdinal')) {
      return null
    }
    world.methods.one.setTag([term], tag, world, false, '2-number-word');
    term.confidence = 0.8;
    return true
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
      found = found || separable(terms, i, world);
      found = found || lowercaseVerb(terms, i, world);
      found = found || numberWord(terms, i, world);
      found = found || suffixCheck(terms, i, world);
      found = found || checkPrefix(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found = found || fallback(terms, i, world);
    }
  };


  const tagger$2 = function (view) {
    const world = view.world;
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

  var tagger$1 = {
    compute: {
      preTagger: tagger$2
    },
    model: {
      two: model
    },
    hooks: ['preTagger']
  };

  // a command begins with its verb - 'Geh nach Hause!', 'Gib mir das Buch.', 'Kommen Sie herein!'
  // - so does a question, and german capitalizes both nouns and first words ('Ruf mich an' / 'Ruf und Ehre')

  const subjects$2 = new Set(['ich', 'du', 'er', 'wir', 'ihr', 'man']);
  const politeWords = new Set(['bitte', 'also', 'nun', 'los']);
  const toArray$1 = (tags) => (typeof tags === 'string' ? [tags] : tags || []);

  const isInfinitive$1 = function (str, lexicon) {
    return Object.prototype.hasOwnProperty.call(lexicon, str) && toArray$1(lexicon[str]).includes('Infinitive')
  };

  // a conjugated verb, that is not at the end of an infinitive-phrase
  const isFinite$1 = function (term, lexicon) {
    if (!term.tags.has('Verb') || term.tags.has('Participle') || term.tags.has('Particle')) {
      return false
    }
    if (isInfinitive$1(term.normal, lexicon)) {
      return false
    }
    return term.tags.has('PresentTense') || term.tags.has('PastTense') || term.tags.has('Modal') || term.tags.has('Auxiliary')
  };

  const tagImperatives = function (doc) {
    const world = doc.world;
    const lexicon = world.model.one.lexicon;
    const isVerb = (inf) => isInfinitive$1(inf, lexicon);
    const tag = function (term, reason) {
      term.tags.clear();
      world.methods.one.setTag([term], 'Imperative', world, false, reason);
    };
    doc.docs.forEach((terms) => {
      const last = terms[terms.length - 1];
      if (!last || /\?/.test(last.post)) {
        return
      }
      // 'Bitte [warte] hier'
      let i = 0;
      if (terms.length > 1 && terms[0].normal === 'bitte' && !/[,!]/.test(terms[0].post)) {
        i = 1;
      }
      const term = terms[i];
      const next = terms[i + 1];
      const str = term.normal;
      if (!str || term.tags.has('Imperative') || politeWords.has(str)) {
        return
      }
      // 'Gehen [Sie] nach Hause!'
      if (next && next.text === 'Sie' && isVerb(str)) {
        tag(term, 'sie-imperative');
        return
      }
      // a subject right after it is something else - 'Gehe ich ..', 'Kommt er ..'
      if (next && subjects$2.has(next.normal)) {
        return
      }
      // words that we know as something else - 'Bitte', 'Morgen'
      const known = toArray$1(lexicon[str]);
      const isNoun = known.some((t) => t === 'Noun' || /Noun$/.test(t));
      const verbTags = ['Verb', 'PresentTense', 'FirstPerson', 'SecondPersonPlural', 'ThirdPerson', 'Imperative', 'Infinitive'];
      if (known.length > 0 && !isNoun && !known.some((t) => verbTags.includes(t))) {
        return
      }
      const found = parseImperative(str, isVerb);
      if (!found) {
        return
      }
      // the first clause has no other conjugated verb - 'Wein ist gut'
      let end = terms.findIndex((t, k) => k >= i && /[,;:]/.test(t.post));
      end = end === -1 ? terms.length : end + 1;
      const rest = terms.slice(i + 1, end);
      if (rest.some((t) => isFinite$1(t, lexicon))) {
        return
      }
      const isCommand = /!/.test(last.post);
      if (found.form === 'singular') {
        // 'Gehe ich nach Hause, ..'
        if (/e$/.test(str) && terms.some((t) => t.normal === 'ich')) {
          return
        }
        // 'Ruf mich an' - but 'Ruf und Ehre'
        if (isNoun && !isCommand && !(next && next.tags.has('Pronoun'))) {
          return
        }
        tag(term, 'singular-imperative');
        return
      }
      // 'Kommt herein!' - also 'er kommt', so only in a command
      if (isCommand || str === 'seid') {
        tag(term, 'plural-imperative');
      }
    });
  };

  // some verb-forms are also an adjective or an adverb - 'er [brach] sein Versprechen', 'ich [bitte] dich'
  // right after a subject-pronoun, in a clause with no other verb, a form that agrees with it is the verb.

  const subjects$1 = {
    ich: ['first'],
    du: ['second'],
    er: ['third'],
    es: ['third'],
    man: ['third'],
    sie: ['third', 'thirdPlural'],
    wir: ['firstPlural'],
    ihr: ['secondPlural'],
  };
  const tenses = { present: 'PresentTense', past: 'PastTense' };
  const persons = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };
  const toArray = (tags) => (typeof tags === 'string' ? [tags] : tags || []);

  const homographVerbs = function (doc) {
    const world = doc.world;
    const lexicon = world.model.one.lexicon;
    const verb = world.methods.two.transform.verb;
    const isVerb = (inf) => toArray(lexicon[inf]).includes('Infinitive');
    doc.docs.forEach((terms) => {
      terms.forEach((term, i) => {
        const prev = terms[i - 1];
        if (!prev || !subjects$1.hasOwnProperty(prev.normal) || !(term.tags.has('Adjective') || term.tags.has('Adverb'))) {
          return
        }
        // the clause already has its verb - 'er ist brach', 'ich habe bitte ..'
        let start = i;
        while (start > 0 && !/[,;:]/.test(terms[start - 1].post)) {
          start -= 1;
        }
        let end = i;
        while (end < terms.length - 1 && !/[,;:]/.test(terms[end].post)) {
          end += 1;
        }
        if (terms.slice(start, end + 1).some((t) => t.tags.has('Verb'))) {
          return
        }
        const found = verb.lookup(term.normal, { isVerb, known: true, tenses: Object.keys(tenses) });
        const hit = found ? found.hits.find((o) => subjects$1[prev.normal].includes(o.person)) : null;
        if (hit) {
          term.tags.clear();
          world.methods.one.setTag([term], ['Verb', tenses[hit.tense], persons[hit.person]], world, false, 'homograph-verb');
        }
      });
    });
  };

  const separablePrefixes = '(ab|an|auf|aus|bei|ein|fest|fort|her|heraus|hervor|hin|hinzu|los|mit|nach|nieder|vor|voraus|weg|weiter|zu|zurecht|zurück|zusammen|zuteil)';

  const postTagger$1 = function (doc) {
    // eine as 1 or the
    doc.match('eine #Value').tag('TextValue', 'eine-value');
    // 'mit einer Million Menschen'
    doc.match('[einer] (million|milliarde|billion|billiarde)', 0).tag('TextValue', 'einer-million');
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

    // 'Geh nach Hause!', 'Gib mir das Buch.'
    tagImperatives(doc);
    // 'er [brach] sein Versprechen', 'ich [bitte] dich'
    homographVerbs(doc);

    // a separable verb-prefix, at the end of the clause - 'ich stehe um sieben Uhr auf'
    doc.match('#Verb * [#Preposition]$', 0).match(separablePrefixes).tag('Particle', 'separable-prefix');
  };

  // the whole tagging process, for re-tagging text after a change
  const tagger = view => view.compute(['freeze', 'lexicon', 'preTagger', 'europeanNumbers', 'postTagger', 'unfreeze']);

  var postTagger = {
    compute: {
      postTagger: postTagger$1,
      tagger
    },
    hooks: ['postTagger']
  };

  const data = {
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
  // these are their own, capitalised nouns - 'zwei Millionen dreihunderttausend'
  // [value, singular, plural, ordinal]
  const bigNumbers = [
    [1e6, 'Million', 'Millionen', 'millionste'],
    [1e9, 'Milliarde', 'Milliarden', 'milliardste'],
    [1e12, 'Billion', 'Billionen', 'billionste'],
    [1e15, 'Billiarde', 'Billiarden', 'billiardste'],
  ];
  // 'millionen' → 1000000
  const scales = {};

  const toCardinal = {};
  const toOrdinal = {};
  const toNumber = {};

  Object.keys(data).forEach(k => {
    data[k].forEach(a => {
      const [num, w, ord] = a;
      toCardinal[ord] = w;
      toOrdinal[w] = ord;
      toNumber[w] = num;
    });
  });

  bigNumbers.forEach(a => {
    const [num, sing, plur, ord] = a;
    scales[sing.toLowerCase()] = num;
    scales[plur.toLowerCase()] = num;
    toCardinal[ord] = sing.toLowerCase();
  });

  new Set(data.multiples.map(a => a[1]));

  // misc
  toNumber.null = 0;
  toOrdinal.null = 'nullte';
  toCardinal.nullte = 'null';
  toNumber.ein = 1; // eins - ein
  toNumber.hunderteins = 101;
  toCardinal.siebte = 'sieben';
  toCardinal.hunderterste = 'hunderteins';
  toOrdinal.hunderteins = 'hunderterste';

  // words that the splitter leaves in one piece
  const expand = {
    hunderttausend: ['hundert', 'tausend'],
    hunderteins: ['hundert', 'eins'],
    hunderterste: ['hundert', 'erste'],
  };

  // a multiplier in digits - '2,5 Millionen'
  const fromDigits = function (str) {
    str = str.replace(/\./g, '').replace(/,/, '.');
    return /^[0-9]+(\.[0-9]+)?$/.test(str) ? Number(str) : 0
  };

  // avoid float-noise - 1,1 Millionen
  const round = n => Math.round(n * 1000) / 1000;

  // a number is built in three levels -
  // [zwei Millionen] [einhundertdreiundzwanzig tausend] [vierhundertsechsundfünfzig]
  const parseNumbers = function (terms = []) {
    let total = 0; // millions, and up
    let thousands = 0;
    let carry = 0; // under one-thousand
    let minus = false;

    const addWord = function (w) {
      if (expand.hasOwnProperty(w)) {
        expand[w].forEach(addWord);
        return
      }
      if (w === 'minus') {
        minus = true;
        return
      }
      // ...  [ein][und][zwanzig]
      if (w === 'und') {
        return
      }
      // 'zweite' → 'zwei'
      if (!toNumber.hasOwnProperty(w) && toCardinal.hasOwnProperty(w)) {
        w = toCardinal[w];
      }
      // 'millionen' multiplies everything said so far
      if (scales.hasOwnProperty(w)) {
        total += round((thousands + carry || 1) * scales[w]);
        thousands = 0;
        carry = 0;
        return
      }
      // 'tausend' multiplies the hundreds - [einhundertdreiundzwanzig][tausend]
      if (w === 'tausend') {
        thousands += (carry || 1) * 1000;
        carry = 0;
        return
      }
      // 'hundert' multiplies the one before it - [zwei][hundert]
      if (w === 'hundert') {
        carry = (carry || 1) * 100;
        return
      }
      // 'fünf'
      if (toNumber.hasOwnProperty(w)) {
        carry += toNumber[w];
      }
    };

    // very-large numbers are several terms - 'zwei Millionen dreihunderttausend'
    terms.forEach(term => {
      if (term.tags.has('NumericValue')) {
        carry += fromDigits(term.text);
        return
      }
      const words = term.splits || [term.normal];
      words.forEach(addWord);
    });

    let sum = total + thousands + carry;
    // make it all negative
    if (minus === true) {
      sum *= -1;
    }
    return sum
  };

  // read digits with the shared european-numbers plugin - '1.234,56', '-5', '3,5%'
  const fromNumber = function (m) {
    const { read } = m.methods.two.europeanNumbers;
    const locale = m.model.two.europeanNumbers;
    let terms = m.docs[0];
    // a written-out sign - 'minus 5'
    const isMinus = terms.length > 1 && terms[0].normal === 'minus';
    if (isMinus) {
      terms = terms.slice(1);
    }
    const pre = terms[0].pre;
    // thousands may be split-up by a space - '1 000'
    let res = read(terms.map(t => t.text).join(' '), pre, locale);
    if (res.num === null && terms.length > 1) {
      res = read(terms[0].text, pre, locale);
    }
    let num = res.num;
    if (isMinus && num !== null) {
      num *= -1;
    }
    // strip an ordinal off the suffix
    let suffix = res.suffix.toLowerCase();
    if (suffix === 'e' || suffix === 'er') {
      suffix = '';
    }
    return {
      hasComma: res.hasComma,
      prefix: res.prefix.toLowerCase(),
      num,
      suffix,
      // how the digits were written
      decimal: res.decimal,
      group: res.group,
    }
  };

  const parseNumber = function (m) {
    const terms = m.docs[0];
    let num = null;
    let prefix = '';
    let suffix = '';
    let hasComma = false;
    let decimal = null;
    let group = null;
    const isText = m.has('#TextValue');
    if (isText) {
      // terms made by .replaceWith() haven't been through the splitter yet
      if (terms.some(term => !term.splits)) {
        m.compute('splitter');
      }
      num = parseNumbers(terms);
    } else {
      const res = fromNumber(m);
      prefix = res.prefix;
      suffix = res.suffix;
      num = res.num;
      hasComma = res.hasComma;
      decimal = res.decimal;
      group = res.group;
    }
    // a number that we re-wrote remembers its thousands-grouping - '1.234' → 'eintausend..' → '1.234'
    if (terms.some(term => term.grouped === true)) {
      hasComma = true;
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
      decimal,
      group,
      isText,
      isOrdinal: m.has('#Ordinal'),
      isFraction: m.has('#Fraction'),
      isMoney: m.has('#Money'),
    }
  };

  // 7 → 'sieben', 30 → 'dreißig'
  const byNum = {};
  data.ones.concat(data.teens, data.tens).forEach(a => {
    byNum[a[0]] = a[1];
  });
  // largest first
  const bigFirst = bigNumbers.slice().reverse();

  // 23 -> '[drei][und][zwanzig]'
  // 'eins' is only said at the very end - 'einhunderteins', but 'eintausend'
  const twoDigit = function (num, isLast) {
    if (num === 0) {
      return []
    }
    if (num === 1) {
      return [isLast ? 'eins' : 'ein']
    }
    // these don't combine
    if (num < 20) {
      return [byNum[num]]
    }
    const one = num % 10;
    const ten = byNum[num - one];
    if (one === 0) {
      return [ten]
    }
    // use '[ein][und][zwanzig]', not 'eins..'
    return [one === 1 ? 'ein' : byNum[one], 'und', ten]
  };

  // 230 -> '[zweihundert][dreißig]'
  const threeDigit = function (num, isLast) {
    const words = [];
    const hundred = Math.floor(num / 100);
    if (hundred > 0) {
      words.push((hundred === 1 ? 'ein' : byNum[hundred]) + 'hundert');
    }
    return words.concat(twoDigit(num % 100, isLast))
  };

  // everything under a million is one word - '[einhundert][drei][und][zwanzig][tausend][vierhundert]..'
  const sixDigit = function (num, isLast) {
    let words = [];
    const thousand = Math.floor(num / 1000);
    if (thousand > 0) {
      words = threeDigit(thousand, false);
      words.push('tausend');
    }
    return words.concat(threeDigit(num % 1000, isLast))
  };

  // turn 130 into '[einhundert][dreißig]'
  // and 2300000 into '[zwei][Millionen][dreihundert][tausend]'
  const toText = function (num) {
    const words = [];
    if (num === 0) {
      return ['null']
    }
    if (num < 0) {
      words.push('minus');
      num = Math.abs(num);
    }
    // no decimals
    num = Math.floor(num);
    // too big to count
    if (!Number.isSafeInteger(num)) {
      return []
    }
    // do '[zwei][Millionen]'
    bigFirst.forEach(a => {
      const [scale, singular, plural] = a;
      const n = Math.floor(num / scale);
      if (n === 0) {
        return
      }
      // 'eine Million', 'zwei Millionen'
      if (n === 1) {
        words.push('eine', singular);
      } else {
        words.push(...sixDigit(n, true), plural);
      }
      num %= scale;
    });
    // do '[sieben][tausend][zweihundert][drei][und][zwanzig]'
    return words.concat(sixDigit(num, true))
  };

  const { write } = europeanNumbers.methods.two.europeanNumbers;

  // 'Millionen' → 'millionste'
  const bigOrdinal = {};
  bigNumbers.forEach(a => {
    bigOrdinal[a[1]] = a[3];
    bigOrdinal[a[2]] = a[3];
  });


  // german format - '.' groups thousands, ',' marks the decimal
  // .. unless the digits were found some other way - '1 234'
  const toNumeric = function (parsed) {
    return write(parsed.num, { hasComma: parsed.hasComma, decimal: parsed.decimal, group: parsed.group })
  };

  // 'minus' is its own word - 'minus fünf'
  // and so are the big ones - 'zwei Millionen dreihunderttausend'
  const joinWords = function (words) {
    // nothing to say - don't leave a bare 'minus'
    if (words.length === 1 && words[0] === 'minus') {
      return ''
    }
    let str = '';
    words.forEach(w => {
      if (w === 'minus') {
        str += 'minus ';
      } else if (bigOrdinal.hasOwnProperty(w)) {
        str += ' ' + w + ' ';
      } else {
        str += w;
      }
    });
    return str.trim()
  };

  // an ordinal is always one word - 'zweimillionste', 'zweimillionenerste'
  const toOrdinalWords = function (words) {
    if (words.length === 0) {
      return words
    }
    const last = words.length - 1;
    return words.map((w, i) => {
      if (bigOrdinal.hasOwnProperty(w)) {
        return i === last ? bigOrdinal[w] : w.toLowerCase()
      }
      // 'eine Million' → 'einmillionste'
      if (w === 'eine') {
        return 'ein'
      }
      return i === last ? toOrdinal[w] : w
    })
  };

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      return joinWords(toOrdinalWords(toText(parsed.num)))
    }
    if (fmt === 'TextCardinal') {
      return joinWords(toText(parsed.num))
    }
    // numeric formats
    // '55.'
    if (fmt === 'Ordinal') {
      return toNumeric(parsed) + '.'
    }
    if (fmt === 'Cardinal') {
      // german decimals use a comma - '12,5'
      return toNumeric(parsed)
    }
    return String(parsed.num || '').replace('.', ',')
  };

  // accept a number, or a german number as a string - 'fünf', '5', '1.234'
  // returns null if it's not a number
  const toNum = function (view, n) {
    if (typeof n === 'number') {
      return isNaN(n) ? null : n
    }
    if (typeof n !== 'string') {
      return null
    }
    // .fromText() does not run our tagger
    const m = view.fromText(n).compute('tagger').numbers();
    if (!m.found) {
      return null
    }
    const num = parseNumber(m.eq(0)).num;
    return typeof num === 'number' && !isNaN(num) ? num : null
  };

  // swap-in the new form of this number
  // 'grouped' remembers that the number was written with thousands-grouping - '1.234'
  const replace = function (val, str, grouped) {
    const [n, , end] = val.fullPointer[0];
    const sentence = val.document[n];
    const last = sentence[end - 1];
    // a numeric ordinal owns the period after it - '3.'
    if (/^\./.test(last.post)) {
      const wasNumeric = val.has('#Ordinal') && !val.has('#TextValue');
      if (/[0-9]\.$/.test(str)) {
        str = str.replace(/\.$/, ''); // re-use the existing period
      } else if (wasNumeric && end < sentence.length) {
        last.post = last.post.replace(/^\./, ''); // 'der 3. Mann' → 'der dritte Mann'
      }
    }
    // a numeric sign can sit in the punctuation before the term - the new text brings its own
    const first = sentence[val.fullPointer[0][1]];
    if (/[-−]$/.test(first.pre) && !val.has('#TextValue')) {
      first.pre = first.pre.replace(/[-−]$/, '');
    }
    // keep an existing sign-word as it is - 'Minus 5 Grad' → 'Minus fünf Grad'
    let target = val;
    if (first.normal === 'minus' && /^minus /.test(str) && val.terms().length > 1) {
      target = val.not('^minus');
      str = str.replace(/^minus /, '');
    }
    target.replaceWith(str, { tags: true });
    // ...and make sure that a new sign was not lost with it - '(-1.234)'
    const now = val.docs[0][0];
    if (/^-/.test(str) && !/^-/.test(now.text) && !/-$/.test(now.pre)) {
      now.pre += '-';
    }
    if (grouped) {
      val.docs[0].forEach((term) => {
        // hidden from .json()
        Object.defineProperty(term, 'grouped', {
          value: true,
          enumerable: false,
          writable: true,
          configurable: true
        });
      });
    }
  };

  // 'millionen', 'milliarde'
  const isBig = (term) => scales.hasOwnProperty(term.normal);
  // 'zwei' in 'zwei Millionen' - a cardinal in words or digits, or 'eine'
  const canMultiply = (term) => !isBig(term) && !term.tags.has('Ordinal');
  // 'dreihunderttausend' in 'zwei Millionen dreihunderttausend'
  const isTextCardinal = (term) =>
    !isBig(term) && term.tags.has('TextValue') && !term.tags.has('Ordinal');

  // thousands may be split-up by a space - '1 000 000', '1 234,5'
  const isHead = (term) => /^[0-9]{1,3}$/.test(term.text);
  const isGroup = (term) => /^[0-9]{3}(?:,[0-9]+)?$/.test(term.text) && term.pre === '';
  const spaceGroups = function (terms, i, end) {
    let j = i + 1;
    if (!isHead(terms[i])) {
      return j
    }
    while (
      j < end &&
      isGroup(terms[j]) &&
      /^\s+$/.test(terms[j - 1].post) &&
      /^[0-9]+$/.test(terms[j - 1].text)
    ) {
      j += 1;
    }
    return j
  };

  // most numbers are 1-term
  // but very-large numbers are several - 'zwei Millionen dreihunderttausend'
  const splitValues = function (m) {
    const ptrs = [];
    m.fullPointer.forEach((ptr) => {
      const [n, start, end] = ptr;
      const terms = m.document[n];
      let i = start;
      while (i < end) {
        let j = i;
        let last = Infinity;
        // [zwei Milliarden] [drei Millionen]
        while (
          j + 1 < end &&
          canMultiply(terms[j]) &&
          isBig(terms[j + 1]) &&
          scales[terms[j + 1].normal] < last
        ) {
          // only the first multiplier may be digits - '5 Millionen'
          if (j > i && !isTextCardinal(terms[j])) {
            break
          }
          last = scales[terms[j + 1].normal];
          j += 2;
        }
        if (j > i) {
          // ... [dreihunderttausend]
          const isNext = j + 1 < end && isBig(terms[j + 1]);
          if (j < end && isTextCardinal(terms[j]) && !isNext) {
            j += 1;
          }
        } else {
          j = spaceGroups(terms, i, end);
        }
        ptrs.push([n, i, j]);
        i = j;
      }
    });
    return m.update(ptrs)
  };

  // tag the number-words, but not the sign - 'minus fünf'
  const tagValue = function (val, tag) {
    val.not('minus').tag(tag);
  };

  // there are no words for 5,5 - so 'fünf' plus a half is written in digits
  const asDigits = function (val) {
    val.unTag('TextValue');
    val.unTag('Ordinal');
    tagValue(val, 'NumericValue');
    tagValue(val, 'Cardinal');
  };

  // run a change on each number, and keep the original view pointing at the new terms
  const mutate = function (view, fn) {
    const res = view.map((val) => fn(val) || val);
    if (view.ptrs) {
      view.ptrs = res.ptrs;
    }
    return res
  };

  // floating-point noise - 0.1 + 0.2 - but a whole number is already exact
  const tidy = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)));

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
        return getNth$3(this, n).map(parseNumber, [])
      }
      get(n) {
        return getNth$3(this, n)
          .map(parseNumber, [])
          .map((o) => o.num)
      }
      json(n) {
        // a number selects the nth match, anything else is json options
        const opts = typeof n === 'number' ? undefined : n;
        const doc = getNth$3(this, n);
        return doc.map((p) => {
          const json = p.toView().json(opts)[0];
          const parsed = parseNumber(p);
          json.number = {
            prefix: parsed.prefix,
            num: parsed.num,
            suffix: parsed.suffix,
            hasComma: parsed.hasComma
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
        const changed = [];
        mutate(this, (val) => {
          if (!val.has('#TextValue')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          changed.push(val);
          const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            replace(val, str, obj.hasComma);
            val.tag('NumericValue');
          }
          return val
        });
        // return only the numbers that were text
        return new Numbers(
          this.document,
          changed.map((val) => val.fullPointer[0])
        )
      }
      /** convert to numeric form like 'eight' or 'eighth' */
      toText() {
        const res = mutate(this, (val) => {
          // already in words - but not '5 Millionen'
          if (val.has('#TextValue') && !val.has('#NumericValue')) {
            return val
          }
          const obj = parseNumber(val);
          // there are no words for '3,5' - leave it in digits
          if (obj.num === null || !Number.isInteger(obj.num)) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            replace(val, str, obj.hasComma);
            tagValue(val, 'TextValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert ordinal to cardinal form, like 'eight', or '8' */
      toCardinal() {
        const res = mutate(this, (val) => {
          if (!val.has('#Ordinal')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            replace(val, str, obj.hasComma);
            tagValue(val, 'Cardinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert cardinal to ordinal form, like 'eighth', or '8th' */
      toOrdinal() {
        const res = mutate(this, (val) => {
          if (val.has('#Ordinal')) {
            return val
          }
          const obj = parseNumber(val);
          // ... and there is no '3,5.'
          if (obj.num === null || !Number.isInteger(obj.num)) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            replace(val, str, obj.hasComma);
            tagValue(val, 'Ordinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }

      /** return only numbers that are == n */
      isEqual(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        n = toNum(this, n);
        if (n === null) {
          return this // not a number
        }
        const res = mutate(this, (val) => {
          const obj = parseNumber(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          const toDigits = val.has('#TextValue') && !Number.isInteger(obj.num);
          if (val.has('#TextValue') && !toDigits) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          const str = formatNumber(obj, fmt);
          if (str) {
            val = val.not('#Currency');
            replace(val, str, obj.hasComma);
            if (toDigits) {
              asDigits(val);
            }
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      add(n) {
        n = toNum(this, n);
        if (!n) {
          return this // don't bother
        }
        const res = mutate(this, (val) => {
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          obj.num = tidy(obj.num + n);
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          const toDigits = obj.isText && !Number.isInteger(obj.num);
          if (obj.isText && !toDigits) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          const str = formatNumber(obj, fmt);
          if (str) {
            replace(val, str, obj.hasComma);
            if (toDigits) {
              asDigits(val);
            }
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** decrease each number by n*/
      subtract(n) {
        n = toNum(this, n);
        if (!n) {
          return this // don't bother
        }
        return this.add(n * -1)
      }
      /** increase each number by 1 */
      increment() {
        return this.add(1)
      }
      /** decrease each number by 1 */
      decrement() {
        return this.add(-1)
      }
      // overloaded - keep Numbers class
      update(pointer) {
        const m = new Numbers(this.document, pointer);
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
      let m = splitValues(this.match('#Value+'));
      // a written-out sign belongs to its number - 'minus fünf Grad'
      // (but 'zehn minus fünf' is a subtraction)
      if (this.has('minus')) {
        m = m.not('minus').map((val) => {
          const sign = val.lookBehind('minus$');
          if (sign.found && !sign.lookBehind('#Value$').found) {
            return val.growLeft('minus')
          }
          return val
        });
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
    api: api$3,
    // the words beside a number, for the shared european-numbers plugin - '50 Prozent', '5 Franken'
    model: {
      two: {
        europeanNumbers: {
          percent: ['prozent'],
          currencies: ['euro', 'franken', 'dollar', 'pfund'],
        },
      },
    },
  };

  // re-conjugate each clause into another tense, in-place
  // 'ich gehe' -> 'ich ging' -> 'ich werde gehen'
  //
  // german spreads its verb across the clause - 'ich [habe] einen Apfel [gegessen]'
  // so we work on the whole clause that each finite verb belongs to.
  //
  // - the past-tense is the Präteritum, which is a one-word substitution.
  //   (the Perfekt is already in the past, and is left alone)
  // - the future-tense is 'werden' + an infinitive at the end of the clause.

  const personTags = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };
  const tenseTags = {
    present: 'PresentTense',
    past: 'PastTense',
  };

  // nominative pronouns, and the persons they may be
  const subjects = {
    ich: ['first'],
    du: ['second'],
    er: ['third'],
    es: ['third'],
    man: ['third'],
    sie: ['third', 'thirdPlural'],
    wir: ['firstPlural'],
    ihr: ['secondPlural'],
  };

  // these send the finite verb to the end of the clause - 'weil ich nach Hause [gehe]'
  const subordinators = new Set([
    'dass', 'daß', 'weil', 'wenn', 'ob', 'als', 'obwohl', 'während', 'bevor', 'nachdem', 'damit', 'falls',
    'sobald', 'solange', 'bis', 'da', 'seit', 'seitdem', 'indem', 'sodass', 'obgleich', 'ehe', 'sofern',
  ]);
  // relative pronouns + question-words do too, after a comma - 'der Mann, der hier [wohnt]'
  const relatives = new Set([
    'der', 'die', 'das', 'den', 'dem', 'dessen', 'deren', 'denen', 'was', 'wer', 'wen', 'wem', 'wo', 'wie',
    'warum', 'wann', 'wohin', 'woher', 'welche', 'welcher', 'welches', 'welchen', 'welchem',
  ]);
  const coordinators = new Set(['und', 'oder', 'aber', 'denn', 'sondern', 'doch']);

  // separable prefixes - 'ich rufe dich [an]'
  const prefixes = [
    'zusammen', 'zurück', 'weiter', 'vorbei', 'heraus', 'herein', 'hinaus', 'hinein', 'herum', 'empor', 'fort',
    'fest', 'frei', 'hoch', 'nach', 'teil', 'statt', 'weg', 'vor', 'mit', 'los', 'her', 'hin', 'ein', 'bei',
    'aus', 'auf', 'ab', 'an', 'zu', 'um',
  ];
  const isPrefix = new Set(prefixes);

  // verbs that build their Perfekt with 'sein' - 'ich bin gegangen'
  // (any other participle after 'sein' is a state - 'die Tür ist geschlossen')
  const seinVerbs = new Set([
    'sein', 'werden', 'bleiben', 'gehen', 'kommen', 'fahren', 'laufen', 'fliegen', 'fallen', 'steigen', 'sterben',
    'wachsen', 'reisen', 'rennen', 'springen', 'schwimmen', 'passieren', 'geschehen', 'folgen', 'begegnen',
    'gelingen', 'misslingen', 'erscheinen', 'verschwinden', 'entstehen', 'wandern', 'landen', 'fliehen',
    'kriechen', 'klettern', 'sinken', 'stürzen', 'rutschen', 'eilen', 'reiten', 'schleichen', 'gelangen',
    'scheitern', 'erwachen', 'ertrinken', 'verreisen', 'aufstehen', 'einschlafen', 'aufwachen', 'umziehen',
    'einziehen', 'ausziehen', 'aufwachsen', 'auswandern', 'einwandern',
  ]);
  // .. and anything built from these - 'ankommen', 'abfahren', 'einsteigen'
  const seinBases = new Set(['gehen', 'kommen', 'fahren', 'laufen', 'fliegen', 'fallen', 'steigen', 'reisen', 'rennen', 'springen', 'bleiben']);

  const isInfinitive = function (str, lexicon) {
    if (!lexicon.hasOwnProperty(str)) {
      return false
    }
    const tags = lexicon[str];
    return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
  };

  // the two indicative tenses that are one word
  const oneWord = ['present', 'past'];

  // the infinitive of 'gegessen', if it is one
  const fromParticiple = function (term, methods, isLoose) {
    const str = term.normal;
    if (!str || (!isLoose && !term.tags.has('Verb'))) {
      return null
    }
    const root = (methods.fromPastParticiple(str) || '').split(' ').pop();
    if (root && root !== str && methods.toPastParticiple(root) === str) {
      return root
    }
    return null
  };

  // the Konjunktiv of the auxiliary + modal verbs is a mood, not a tense - 'würde', 'wäre', 'könnte'
  let subjunctives = null;
  const isSubjunctive = function (str, methods) {
    if (subjunctives === null) {
      subjunctives = new Set(['möchte', 'möchtest', 'möchten', 'möchtet']);
      const roots = ['sein', 'haben', 'werden', 'können', 'müssen', 'dürfen', 'mögen', 'wissen', 'sollen', 'wollen'];
      roots.forEach((root) => {
        const indicative = new Set(Object.values(methods.toPresent(root)).concat(Object.values(methods.toPast(root))));
        const forms = Object.values(methods.toSubjunctive1(root)).concat(Object.values(methods.toSubjunctive2(root)));
        forms.filter((w) => w && !indicative.has(w)).forEach((w) => subjunctives.add(w));
      });
    }
    return subjunctives.has(str)
  };

  // find an infinitive that conjugates back into our word
  // prefer a real verb - 'sagte' is 'sagen', not 'sagten'
  const findRoot = function (str, methods, lexicon) {
    return methods.lookup(str, { isVerb: (inf) => isInfinitive(inf, lexicon), tenses: oneWord })
  };

  // is this a conjugated verb? - which one, and in which tense + person?
  // every tense is tried, to find an infinitive that conjugates back into our word
  const parseFinite = function (term, prev, methods, lexicon) {
    const str = term.normal;
    if (!str || !term.text || !term.tags.has('Verb') || term.tags.has('Particle')) {
      return null
    }
    // 'um zu [gehen]'
    if (prev && prev.normal === 'zu') {
      return null
    }
    if (isSubjunctive(str, methods)) {
      return null
    }
    const found = findRoot(str, methods, lexicon);
    if (found && isInfinitive(found.root, lexicon)) {
      return found
    }
    // a separable verb, joined in a subordinate clause - 'weil ich dich [anrufe]'
    for (let k = 0; k < prefixes.length; k += 1) {
      const prefix = prefixes[k];
      if (str.startsWith(prefix) && str.length > prefix.length + 2) {
        const rest = findRoot(str.slice(prefix.length), methods, lexicon);
        if (rest && isInfinitive(rest.root, lexicon)) {
          return { root: prefix + rest.root, hits: rest.hits }
        }
      }
    }
    return found
  };

  // 'gegessen' is never a conjugated verb, but 'verstanden' may be - 'wir verstanden'
  const isOnlyParticiple = function (term, methods, lexicon) {
    const root = fromParticiple(term, methods);
    if (root === null || methods.findHits(term.normal, root, oneWord).length > 0) {
      return false
    }
    // .. and 'gefällt' is the participle of 'fällen', but also 'es gefällt mir'
    return !methods.lookup(term.normal, { isVerb: (inf) => isInfinitive(inf, lexicon), known: true, tenses: oneWord })
  };

  const hasVerb = (terms, start, end) => {
    for (let i = start; i < end; i += 1) {
      if (terms[i].tags.has('Verb')) {
        return true
      }
    }
    return false
  };

  // the first conjugated verb in this span
  const findFinite = function (terms, start, end, methods, lexicon) {
    for (let i = start; i < end; i += 1) {
      if (!isOnlyParticiple(terms[i], methods, lexicon)) {
        const parsed = parseFinite(terms[i], terms[i - 1], methods, lexicon);
        if (parsed) {
          return { index: i, parsed }
        }
      }
    }
    return null
  };

  // 'weinen und singen' - nothing here but infinitives
  const allInfinitives = function (terms, start, end, lexicon) {
    const verbs = terms.slice(start, end).filter((t) => t.tags.has('Verb'));
    // 'Deutsch zu lernen' is a clause of its own
    if (terms.slice(start, end).some((t) => t.normal === 'zu')) {
      return false
    }
    return verbs.length > 0 && verbs.every((t) => isInfinitive(t.normal, lexicon))
  };

  // these verbs take an infinitive, at the end of the clause
  const takesInfinitive = new Set(['werden', 'können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen']);

  // is there a clause on both sides of this conjunction?
  const isTwoClauses = function (terms, span, methods, lexicon) {
    const [start, i, end] = span;
    const left = findFinite(terms, start, i, methods, lexicon);
    const right = findFinite(terms, i + 1, end, methods, lexicon);
    if (!left || !right) {
      return false
    }
    // 'ich werde Brot und Käse [essen]' is one clause, and 'ich werde lesen und [schreiben können]'
    if (takesInfinitive.has(left.parsed.root) && terms.slice(right.index, end).every((t) => isInfinitive(t.normal, lexicon))) {
      return false
    }
    // .. and so is 'weil ich [essen] und [trinken] werde'
    const last = parseFinite(terms[end - 1], terms[end - 2], methods, lexicon);
    if (last && takesInfinitive.has(last.root) && left.index === i - 1 && right.index === end - 2) {
      if (isInfinitive(terms[left.index].normal, lexicon) && isInfinitive(terms[right.index].normal, lexicon)) {
        return false
      }
    }
    // .. and 'weil er lachen, weinen und singen wird'
    const head = terms[start].normal;
    if (last && takesInfinitive.has(last.root) && (subordinators.has(head) || relatives.has(head))) {
      if (allInfinitives(terms, start, end - 1, lexicon)) {
        return false
      }
    }
    return true
  };

  // does this part carry on a list of infinitives, that all share one 'werden'?
  const isInfinitiveList = function (terms, last, part, methods, lexicon) {
    const [start, end] = part;
    const head = terms[start].normal;
    if (subordinators.has(head) || relatives.has(head) || subjects.hasOwnProperty(head)) {
      return false
    }
    // 'er wird lachen, [weinen und singen]'
    const found = findFinite(terms, last[0], last[1], methods, lexicon);
    if (found && takesInfinitive.has(found.parsed.root) && found.index < last[1] - 1) {
      return allInfinitives(terms, found.index + 1, last[1], lexicon) && allInfinitives(terms, start, end, lexicon)
    }
    // 'weil er lachen, [weinen und singen wird]'
    if (subordinators.has(terms[last[0]].normal) && end - start > 1 && isInfinitive(terms[last[1] - 1].normal, lexicon)) {
      const final = parseFinite(terms[end - 1], terms[end - 2], methods, lexicon);
      return Boolean(final) && takesInfinitive.has(final.root) && allInfinitives(terms, start, end - 1, lexicon)
    }
    return false
  };

  const isNoun = (term) => term.tags.has('Noun') && !term.tags.has('Pronoun');

  // 'zu' + infinitive is a clause of its own, even without a comma - 'ich fange an | zu verstehen'
  // - but only after the end of the verb before it: a prefix, an infinitive, or a participle
  const isBeforeZu = function (terms, start, i, methods, lexicon) {
    const term = terms[i];
    const zu = terms[i + 1];
    const verb = terms[i + 2];
    if (!zu || zu.normal !== 'zu' || !verb || !isInfinitive(verb.normal, lexicon) || i <= start) {
      return false
    }
    if (isPrefix.has(term.normal) && !isNoun(term)) {
      return true
    }
    if (isOnlyParticiple(term, methods, lexicon)) {
      return true
    }
    // 'ich werde [anfangen] zu verstehen' - but not 'wir [versuchen] zu lernen'
    return isInfinitive(term.normal, lexicon) && hasVerb(terms, start, i)
  };

  // split the sentence into clauses - each has (up to) one finite verb
  const getClauses = function (terms, methods, lexicon) {
    // first, split on punctuation
    let parts = [];
    let start = 0;
    terms.forEach((term, i) => {
      if (/[,;:–—]/.test(term.post) || i === terms.length - 1 || isBeforeZu(terms, start, i, methods, lexicon)) {
        parts.push([start, i + 1]);
        start = i + 1;
      }
    });
    // a part without a verb is not a clause - 'Brot, Käse und Wein'
    const merged = [];
    parts.forEach((part) => {
      const last = merged[merged.length - 1];
      // .. nor is a part with only participles - 'er hat gelacht, geweint und gesungen'
      const isList = last && !terms.slice(part[0], part[1]).some((t) => t.tags.has('Verb') && !isOnlyParticiple(t, methods, lexicon));
      // .. or only infinitives, after 'werden' - 'er wird lachen, weinen und singen'
      const isInfList = last && isInfinitiveList(terms, last, part, methods, lexicon);
      // .. but leave it, before a relative clause - 'der Mann, der hier wohnt, ..'
      const head = terms[part[0]].normal;
      const isStart = last && !hasVerb(terms, last[0], last[1]) && !subordinators.has(head) && !relatives.has(head);
      if (isList || isInfList || isStart) {
        last[1] = part[1];
      } else {
        merged.push(part);
      }
    });
    // then split on a conjunction, when there is a verb on both sides - 'ich esse und er trinkt'
    parts = [];
    merged.forEach((part) => {
      let from = part[0];
      for (let i = part[0] + 1; i < part[1] - 1; i += 1) {
        if (coordinators.has(terms[i].normal) && isTwoClauses(terms, [from, i, part[1]], methods, lexicon)) {
          parts.push([from, i]);
          from = i;
        }
      }
      parts.push([from, part[1]]);
    });
    return parts
  };

  // find the finite verb of this clause
  const parseClause = function (terms, part, methods, lexicon) {
    const [start, end] = part;
    // a command has no tense - 'Gib mir das Buch!', 'Lass mich gehen!'
    if (terms.slice(start, end).some((t) => t.tags.has('Imperative'))) {
      return null
    }
    // skip a leading conjunction - 'und [weil] ..'
    let first = start;
    if (coordinators.has(terms[first].normal) && first + 1 < end) {
      first += 1;
    }
    const head = terms[first].normal;
    const isSub = subordinators.has(head) || (start > 0 && relatives.has(head));
    // in a subordinate clause, the finite verb is the last word
    if (isSub && end - 1 > first) {
      const parsed = parseFinite(terms[end - 1], terms[end - 2], methods, lexicon);
      if (parsed) {
        return { start, end, index: end - 1, isSub: true, parsed }
      }
    }
    // otherwise, it is the first verb
    for (let i = start; i < end; i += 1) {
      // the Konjunktiv is not a tense - 'ich würde gehen'
      if (terms[i].tags.has('Verb') && isSubjunctive(terms[i].normal, methods)) {
        return null
      }
      if (isOnlyParticiple(terms[i], methods, lexicon)) {
        continue
      }
      const parsed = parseFinite(terms[i], terms[i - 1], methods, lexicon);
      if (parsed) {
        return { start, end, index: i, isSub: false, parsed }
      }
    }
    return null
  };


  // 'ging' is both first and third person - so look for the subject
  const choosePerson = function (hits, terms, clause, lastPerson) {
    const found = hits.map((o) => o.person).filter((p, k, arr) => arr.indexOf(p) === k);
    if (found.length === 1) {
      return found[0]
    }
    const { start, end, index } = clause;
    // nearest-first, looking backward and then forward
    const order = [];
    for (let i = index - 1; i >= start; i -= 1) {
      order.push(terms[i]);
    }
    for (let i = index + 1; i < end; i += 1) {
      order.push(terms[i]);
    }
    // a subject-pronoun - 'heute gehe [ich]'
    for (let i = 0; i < order.length; i += 1) {
      const list = subjects[order[i].normal] || [];
      const person = list.find((p) => found.includes(p));
      if (person) {
        return person
      }
    }
    // any other subject is in the third person - 'der Hund schläft'
    const third = ['third', 'thirdPlural'].find((p) => found.includes(p));
    if (third && terms.slice(start, index).some(isNoun)) {
      return third
    }
    // the subject of the last clause - 'er kam, sah und [siegte]'
    if (lastPerson && found.includes(lastPerson)) {
      return lastPerson
    }
    return third || found[0]
  };

  // 'anrufen' -> ['an', 'rufen']
  const splitPrefix = function (root, participle, lexicon) {
    for (let i = 0; i < prefixes.length; i += 1) {
      const prefix = prefixes[i];
      if (!root.startsWith(prefix) || root.length < prefix.length + 3) {
        continue
      }
      const rest = root.slice(prefix.length);
      // 'an-ge-rufen' can only be a separable verb
      if (participle && participle.startsWith(prefix + 'ge') && !rest.startsWith('ge')) {
        return [prefix, rest]
      }
      // 'um' is often inseparable - 'umarmen', 'umgeben'
      if (prefix !== 'um' && isInfinitive(rest, lexicon)) {
        return [prefix, rest]
      }
    }
    return ['', root]
  };

  const usesSein = function (root, lexicon) {
    return seinVerbs.has(root) || seinBases.has(splitPrefix(root, null, lexicon)[1])
  };

  // 'Gehe' -> 'Ging'
  const matchCase$1 = function (str, term) {
    const orig = term.text || '';
    if (orig.length > 1 && orig === orig.toUpperCase() && orig !== orig.toLowerCase()) {
      return str.toUpperCase()
    }
    if (orig && orig[0] !== orig[0].toLowerCase()) {
      return str[0].toUpperCase() + str.slice(1)
    }
    return str
  };

  // the verbs that share one auxiliary - 'ich habe gegessen und getrunken'
  // returns null if the clause is not one that we can re-arrange
  const getShared = function (terms, clause, other, toRoot) {
    const { start, index, isSub } = clause;
    const verbs = [];
    // they are all before the auxiliary, in a subordinate clause - 'weil ich gegessen und getrunken habe'
    for (let i = isSub ? start : index + 1; i < other; i += 1) {
      const term = terms[i];
      const next = terms[i + 1];
      // an adjective, misread as a verb - 'einen [langen] Brief'
      if (!term.tags.has('Verb') || (next && isNoun(next) && !/,/.test(term.post))) {
        continue
      }
      const root = toRoot(term);
      // each one ends its own part - 'gegessen, getrunken und gelacht'
      const isJoined = /,/.test(term.post) || coordinators.has(next.normal);
      // a word that is not one of these verbs - 'ich werde [lange] schlafen'
      if (!root && !isJoined) {
        continue
      }
      // the last two make one verb - 'wir werden [einkaufen] gehen'
      if (root && !isJoined && i === other - 1) {
        continue
      }
      if (!root || !isJoined) {
        return null
      }
      verbs.push({ at: i, root, str: term.normal });
    }
    verbs.push({ at: other, root: toRoot(terms[other]), str: terms[other].normal });
    // where each part begins - 'und [Wasser] getrunken'
    verbs.forEach((o, k) => {
      if (k > 0) {
        const from = verbs[k - 1].at + 1;
        o.start = coordinators.has(terms[from].normal) ? from + 1 : from;
      }
    });
    return verbs
  };

  const reflexives = new Set(['mich', 'dich', 'sich', 'uns', 'euch']);

  // what sort of verb-phrase is this clause?
  const getShape = function (terms, clause, methods, lexicon) {
    const { start, end, index, isSub, parsed } = clause;
    const root = parsed.root;
    const isPresent = parsed.hits.some((o) => o.tense === 'present');
    // where the rest of the verb is found
    const other = isSub ? index - 1 : end - 1;
    const res = { kind: 'simple', root, other: null, particle: '' };
    if (other < start || other === index) {
      return res
    }
    const term = terms[other];
    const str = term.normal;
    // 'ich habe einen Apfel gegessen', 'ich bin nach Hause gegangen'
    if (root === 'haben' || root === 'sein') {
      // 'er hat sich verliebt' - with a reflexive pronoun, the last word is a participle, even one we call an adjective
      const hasReflexive = root === 'haben' && terms.slice(start, other).some((t) => reflexives.has(t.normal));
      const toRoot = (t) => {
        const inf = fromParticiple(t, methods, hasReflexive && t === term && isInfinitive(fromParticiple(t, methods, true) || '', lexicon));
        return inf && (root === 'haben' || usesSein(inf, lexicon)) ? inf : null
      };
      if (toRoot(term)) {
        const verbs = getShared(terms, clause, other, toRoot);
        if (!verbs) {
          return null
        }
        // the one whose place the new verb takes
        const first = isSub ? verbs.pop() : verbs.shift();
        return { kind: 'perfect', root: first.root, other: first.at, participle: first.str, extras: verbs }
      }
    }
    // 'ich werde nach Hause gehen'
    if (root === 'werden' && isPresent && term.tags.has('Verb') && !isOnlyParticiple(term, methods, lexicon)) {
      const toRoot = (t) => {
        const isInf = isInfinitive(t.normal, lexicon) || (t.tags.has('Infinitive') && /n$/.test(t.normal));
        return isInf && !isOnlyParticiple(t, methods, lexicon) ? t.normal : null
      };
      if (toRoot(term)) {
        // a modal has all of the others - 'ich werde lesen und schreiben können'
        if (takesInfinitive.has(str)) {
          return { kind: 'future', root: str, other, participle: null, extras: [] }
        }
        const verbs = getShared(terms, clause, other, toRoot);
        if (!verbs) {
          return null
        }
        const first = isSub ? verbs.pop() : verbs.shift();
        return { kind: 'future', root: first.root, other: first.at, participle: null, extras: verbs }
      }
    }
    // 'ich rufe dich an'
    if (!isSub && isPrefix.has(str) && !isNoun(term) && (term.tags.has('Particle') || isInfinitive(str + root, lexicon))) {
      res.other = other;
      res.particle = str;
    }
    return res
  };

  // a clause that begins with its verb takes the subject of the one before it - 'er lacht und [singt] ein Lied'
  const hasNoSubject = function (terms, clause) {
    const { start, end, index, isSub } = clause;
    if (isSub || start === 0) {
      return false
    }
    const first = ['und', 'oder'].includes(terms[start].normal) ? start + 1 : start;
    if (index !== first) {
      return false
    }
    // 'und dann lacht [er]'
    return !terms.slice(start, end).some((t) => ['ich', 'du', 'er', 'wir', 'ihr', 'man'].includes(t.normal))
  };

  // the last clause has a 'werden' already, so this one only needs its infinitive
  // 'er wird lachen und [singt ein Lied]' -> 'er wird lachen und [ein Lied singen]'
  const shareFuture = function (view, n, clause, shape) {
    const { end, index } = clause;
    const at = (i) => view.update([[n, i, i + 1]]);
    const str = shape.particle + shape.root;
    let where = index;
    if (index === end - 1) {
      at(index).replaceWith(str);
    } else {
      if (shape.particle) {
        // 'und ruft mich an' -> 'und mich anrufen'
        at(shape.other).replaceWith(str);
      } else {
        at(end - 1).insertAfter(str);
      }
      at(index).remove();
      where = shape.particle ? shape.other - 1 : end - 1;
    }
    at(where).tag(['Verb', 'Infinitive'], 'to-future');
    return [view.document[n][where]]
  };

  // a verb-final part, after a subordinate clause, is more of the same clause - 'weil er lacht und [ein Lied singt]'
  const isContinued = function (terms, clause) {
    const { start, end, index, isSub } = clause;
    if (isSub || start === 0 || index !== end - 1) {
      return false
    }
    return !terms.slice(start, end).some((t) => subjects.hasOwnProperty(t.normal) && t.normal !== 'sie' && t.normal !== 'es')
  };

  // 'werden' goes to the very end of a subordinate clause
  // 'weil er lachen wird und [singt]' -> 'weil er lachen und [singen wird]'
  const moveWerden = function (view, n, clause, werden, root) {
    const at = (i) => view.update([[n, i, i + 1]]);
    at(clause.index).replaceWith(root + ' ' + werden.normal);
    at(clause.index).tag(['Verb', 'Infinitive'], 'to-future');
    at(clause.index + 1).tag(['Verb', 'Auxiliary'].concat(Object.values(personTags).filter((tag) => werden.tags.has(tag))), 'to-future');
    const found = view.document[n][clause.index + 1];
    // drop the old one, but keep its punctuation
    const i = view.document[n].indexOf(werden);
    if (i > 0) {
      const post = werden.post;
      at(i).remove();
      view.document[n][i - 1].post = post;
    }
    return found
  };

  // change one clause, and return its new finite verbs
  const convertClause = function (view, n, clause, want, state) {
    const { methods, lexicon } = state;
    const terms = view.document[n];
    const { end, index, isSub, parsed } = clause;
    const shape = getShape(terms, clause, methods, lexicon);
    if (!shape) {
      return null
    }
    const term = terms[index];
    const tenses = parsed.hits.map((o) => o.tense);
    const person = choosePerson(parsed.hits, terms, clause, state.lastPerson);
    // is it one more verb for the 'werden' of the last clause? - 'er wird lachen und [singt]'
    const isShared = want === 'future' && state.lastFuture && state.lastPerson === person && hasNoSubject(terms, clause);
    // a later clause may share this subject - 'er kam, sah und siegte'
    state.lastPerson = isSub ? null : person;
    state.lastFuture = false;
    if (isShared && shape.kind === 'simple') {
      state.lastFuture = true;
      return shareFuture(view, n, clause, shape)
    }
    // .. or of a subordinate clause? - 'weil er lachen wird und [singt]'
    const last = state.subWerden;
    state.subWerden = null;
    if (want === 'future' && last && last.person === person && shape.kind === 'simple' && isContinued(terms, clause)) {
      const found = moveWerden(view, n, clause, last.term, shape.root);
      state.subWerden = { term: found, person };
      return [found]
    }
    const werden = methods.toPresent('werden')[person];
    const at = (i, len) => view.update([[n, i, i + (1)]]);
    // each edit, as [index, 'replace' | 'remove' | 'after' | 'before', text]
    let edits = [];
    let tags = null;
    if (want === 'future') {
      tags = ['Verb', 'Auxiliary', personTags[person]];
      state.lastFuture = !isSub;
      if (shape.kind === 'future') {
        return null
      }
      if (shape.kind === 'perfect') {
        // 'ich habe gegessen' -> 'ich werde essen'
        edits = [[index, 'replace', werden], [shape.other, 'replace', shape.root]];
        // 'ich habe gegessen und getrunken' -> 'ich werde essen und trinken'
        shape.extras.forEach((o) => edits.push([o.at, 'replace', o.root]));
      } else if (isSub) {
        // 'weil ich gehe' -> 'weil ich gehen werde'
        edits = [[index, 'replace', shape.root + ' ' + werden]];
      } else if (shape.particle) {
        // 'ich rufe dich an' -> 'ich werde dich anrufen'
        edits = [[index, 'replace', werden], [shape.other, 'replace', shape.particle + shape.root]];
      } else if (index === end - 1) {
        // 'ich schlafe' -> 'ich werde schlafen'
        edits = [[index, 'replace', werden + ' ' + shape.root]];
      } else {
        // 'ich gehe nach Hause' -> 'ich werde nach Hause gehen'
        edits = [[index, 'replace', werden], [end - 1, 'after', shape.root]];
      }
    } else if (shape.kind === 'simple') {
      // 'ich gehe' <-> 'ich ging'
      if (tenses.includes(want)) {
        return null
      }
      edits = [[index, 'replace', methods.table(shape.root, [want])[want][person]]];
      tags = ['Verb', tenseTags[want], personTags[person]];
    } else {
      // the Perfekt is already in the past - 'ich habe gegessen'
      if (shape.kind === 'perfect' && want === 'past') {
        return null
      }
      // collapse it to one verb - 'ich habe gegessen' -> 'ich esse', 'ich werde gehen' -> 'ich ging'
      const [prefix, base] = splitPrefix(shape.root, shape.participle, lexicon);
      const str = methods.table(base, [want])[want][person];
      tags = ['Verb', tenseTags[want], personTags[person]];
      if (isSub) {
        // 'weil er mich angerufen hat' -> 'weil er mich anruft'
        edits = [[index, 'replace', prefix + str], [shape.other, 'remove']];
      } else if (prefix) {
        // 'er hat mich angerufen' -> 'er ruft mich an'
        edits = [[index, 'replace', str], [shape.other, 'replace', prefix]];
      } else {
        edits = [[index, 'replace', str], [shape.other, 'remove']];
      }
      // each of the other verbs leads its own part - 'ich esse Brot und [trinke] Wasser'
      shape.extras.forEach((o) => {
        const [pre, inf] = splitPrefix(o.root, shape.kind === 'perfect' ? o.str : null, lexicon);
        const form = methods.table(inf, [want])[want][person];
        if (isSub) {
          // 'weil ich gegessen und getrunken habe' -> 'weil ich esse und trinke'
          edits.push([o.at, 'replace', pre + form, true]);
        } else if (o.start === o.at) {
          edits.push([o.at, 'replace', pre ? form + ' ' + pre : form, true]);
        } else {
          edits.push([o.at, pre ? 'replace' : 'remove', pre]);
          edits.push([o.start, 'before', form]);
        }
      });
    }
    if (edits.some((e) => e[1] !== 'remove' && !e[2])) {
      return null
    }
    // go right-to-left, so that each index stays true
    edits = edits.sort((a, b) => b[0] - a[0] || (a[1] === 'before' ? 1 : -1));
    let where = index;
    // any other finite verbs that we make
    const made = [];
    edits.forEach((edit) => {
      const [i, action, str] = edit;
      if (action === 'remove') {
        // keep any punctuation after it - 'ich habe gegessen, und ..'
        const post = view.document[n][i].post;
        at(i).remove();
        if (i > 0) {
          view.document[n][i - 1].post = post;
        }
        where -= i < index ? 1 : 0;
      } else if (action === 'after') {
        at(i).insertAfter(str);
        at(i + 1).tag(['Verb', 'Infinitive'], 'to-' + want);
      } else if (action === 'before') {
        at(i).insertBefore(str);
        at(i).tag(tags, 'to-' + want);
        made.push(view.document[n][i]);
      } else if (i === index) {
        at(i).replaceWith(matchCase$1(str, term));
      } else {
        at(i).replaceWith(str);
        // a second finite verb - 'und [trinke]'
        if (edit[3]) {
          at(i).tag(tags, 'to-' + want);
          made.push(view.document[n][i]);
        }
      }
    });
    // 'gehen [werde]'
    if (want === 'future' && isSub && shape.kind !== 'perfect') {
      where += 1;
    }
    at(where).tag(tags, 'to-' + want);
    // more verbs may follow it - 'weil er lachen [wird], weint und singt'
    if (want === 'future' && isSub && shape.kind === 'simple') {
      state.subWerden = { term: view.document[n][where], person };
    }
    return [view.document[n][where]].concat(made.reverse())
  };

  const convertTo = function (view, want) {
    const state = {
      methods: view.methods.two.transform.verb,
      lexicon: view.model.one.lexicon,
      lastPerson: null,
      // did the last clause get a 'werden'?
      lastFuture: false,
      // the 'werden' at the end of the last subordinate clause
      subWerden: null,
      // every word of the clauses we have looked at
      seen: new Set(),
    };
    // pointers go stale as we add + remove words, so hold onto the terms themselves
    const phrases = [];
    view.forEach((vb) => {
      const ptr = vb.fullPointer[0];
      if (ptr) {
        phrases.push({ n: ptr[0], terms: (vb.docs[0] || []).slice() });
      }
    });
    let sentence = null;
    phrases.forEach((phrase) => {
      const { n } = phrase;
      if (n !== sentence) {
        state.lastPerson = null;
        state.lastFuture = false;
        state.subWerden = null;
        sentence = n;
      }
      phrase.terms.slice().forEach((term) => {
        const terms = view.document[n];
        const i = terms.indexOf(term);
        // was it removed already?
        if (i === -1) {
          return
        }
        const part = getClauses(terms, state.methods, state.lexicon).find((p) => p[0] <= i && i < p[1]);
        const clause = part ? parseClause(terms, part, state.methods, state.lexicon) : null;
        // only change a clause when its finite verb was selected
        if (!clause || terms[clause.index] !== term || state.seen.has(term)) {
          return
        }
        // .. and only once - a new infinitive can look like a second clause
        terms.slice(part[0], part[1]).forEach((t) => state.seen.add(t));
        const res = convertClause(view, n, clause, want, state);
        if (res) {
          phrase.terms.splice(phrase.terms.indexOf(term), 1, ...res);
        }
      });
    });
    // return what is left of each verb-phrase
    const ptrs = [];
    phrases.forEach((phrase) => {
      const terms = view.document[phrase.n];
      const found = phrase.terms.map((term) => terms.indexOf(term)).filter((i) => i !== -1);
      // one match for each run of words - 'ich [esse] Brot und [trinke] Wasser'
      found.sort((x, y) => x - y).forEach((i, k) => {
        if (k > 0 && found[k - 1] === i - 1) {
          ptrs[ptrs.length - 1][2] = i + 1;
        } else {
          ptrs.push([phrase.n, i, i + 1]);
        }
      });
    });
    return view.update(ptrs)
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
          const str = getRoot$2(m);
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
      /** 'ich gehe' -> 'ich ging' (Präteritum) */
      toPastTense(n) {
        return convertTo(getNth$2(this, n), 'past')
      }
      /** 'ich ging' -> 'ich gehe' */
      toPresentTense(n) {
        return convertTo(getNth$2(this, n), 'present')
      }
      /** 'ich gehe' -> 'ich werde gehen' */
      toFutureTense(n) {
        return convertTo(getNth$2(this, n), 'future')
      }
      // overloaded - keep Verb class
      update(pointer) {
        const m = new Verbs(this.document, pointer);
        m._cache = this._cache;
        return m
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
          const str = getRoot$1(m);
          const root = toRoot(str) || str;
          const res = inflect(root);
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
    const single = methods.toSingular(str);
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
          const root = getRoot(m);
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
          const str = getRoot(m);
          const plural = methods.toPlural(str).one;
          return m.replaceWith(matchCase(m, plural))
        })
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        return getNth(this, n).not('#Singular').map(m => {
          const str = m.text('normal');
          if (!m.has('#Plural') && !isPluralForm(methods, str)) {
            return m
          }
          const singular = methods.toSingular(str);
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

  var version = '0.1.2';

  // german word-rules for .clauses() - the method itself comes from compromise/shared
  const clauses = {
    // a comma, but not a clause break
    notClause: [
      '@hasComma (und|oder) .', // groß, und stark
    ],
    // split a clause after these
    splitAfter: [
      '^#Pron (sagte|sagt)', // er sagte
    ],
    // split a clause before these
    splitBefore: [
      '(sagte|sagt) #Prop$',
      '. . wenn .{4}', // ... wenn es so wäre
      'und während',
      'jetzt wo',
      'seitdem',
      '(obwohl|obgleich)',
      '(selbst|auch) wenn',
      'wohingegen', // whereas
      'als ob',
      'solange',
    ],
    // split a clause before the [captured] word
    splitBeforeGroup: [
      '#Verb .* [aber] .* #Verb', // es ist gut aber es ist ..
      'wenn .{2,9} [dann] .', // wenn es dies ist dann das
    ],
  };

  var clauseRules = {
    model: { three: { clauses } },
  };

  nlp.plugin(tokenizer);
  nlp.plugin(tagset);
  nlp.plugin(lexicon);
  nlp.plugin(tagger$1);
  // tags '1.234,56' and '5,30€' from their raw text
  nlp.plugin(europeanNumbers);
  nlp.plugin(postTagger);
  nlp.plugin(splitter);
  nlp.plugin(numbers);
  nlp.plugin(verbs);
  nlp.plugin(adjectives);
  nlp.plugin(nouns);

  // language-neutral plugins, shared with compromise
  nlp.plugin(lazy$1); // nlp.lazy() - only tags the sentences that may match
  nlp.plugin(misc$2); // .parentheses(), .quotations(), .acronyms(), .emails() ...
  nlp.plugin(clauses$1); // .clauses() - split on punctuation, and our rules below
  nlp.plugin(clauseRules);
  nlp.plugin(topics); // .people(), .places(), .organizations(), .topics()
  nlp.plugin(plugin); // .redact()

  const de = function (txt, lex) {
    const dok = nlp(txt, lex);
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
    const env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  de.version = version;

  return de;

}));
