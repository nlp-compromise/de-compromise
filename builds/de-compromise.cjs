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

  var version$1 = '14.19.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
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
      model[key] ||= {};
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

  // Shared CLI colors and styles.
  const color = code => s => '\x1b[' + code + 'm' + s + '\x1b[0m';

  const green = color(32);
  const red = color(31);
  const blue = color(34);
  const magenta = color(35);
  const cyan = color(36);
  const yellow = color(33);
  const black = color(30);
  const white = color(37);
  const dim = color(2);
  const i$1 = color(3);
  const b = color(1);
  const ul = color(4);
  const grey = color(90);

  var cli$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    b: b,
    black: black,
    blue: blue,
    cyan: cyan,
    dim: dim,
    green: green,
    grey: grey,
    i: i$1,
    magenta: magenta,
    red: red,
    ul: ul,
    white: white,
    yellow: yellow
  });

  const env = globalThis.process?.env ?? globalThis.env ?? {};
  const debug$3 = { tags: Boolean(env.DEBUG_TAGS) };

  // Capture only the requested terms, and only while tracing.
  const before$1 = term => {
    if (debug$3.tags && (!debug$3.word || debug$3.word === (term.normal || term.text || term.implicit || '').toLowerCase())) {
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
    const prefix = debug$3.prefix || '   ';
    if (debug$3.rule !== reason) {
      const headingPrefix = debug$3.prefix ? prefix.replace('│  ', '│ ') : '  ';
      console.log(`${headingPrefix}${dim(white((reason || 'tag change') + ':'))}`); // eslint-disable-line no-console
      debug$3.rule = reason;
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

  debug$3.before = before$1;
  debug$3.log = log;

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
      debug$3.rule = undefined;
      const status = result.ptrs.length ? green('✓') : red('✗');
      const spans = matches.map(terms => {
        const text = terms.map(term => term.text || term.implicit).join(' ');
        return `${green("'" + text + "'")} ${dim(terms[0]?.index?.join(':') || '?')}`
      }).join(', ');
      const rule = pattern.length > 80 ? pattern.slice(0, 79) + '…' : pattern;
      const words = spans ? spans + '  ' : ' ---         ';
      console.log(`${debug$3.prefix || '   '}${status} ${words}${dim(i$1(rule))}`); // eslint-disable-line no-console
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
        const plain = terms
          .map(t => t.pre + t.text + t.post)
          .join('')
          .trim();
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
      const prefix = debug$3.prefix;
      const rule = debug$3.rule;
      debug$3.rule = undefined;
      if (nested) {
        console.log(`  ${blue(b(ul(hook + ':')))}`); // eslint-disable-line no-console
        debug$3.prefix = dim('   │  ');
      }
      // Restore the log prefix even when a plugin hook throws.
      try {
        doc.compute(hook);
        snapshot(hook, nested);
      } finally {
        debug$3.prefix = prefix;
        debug$3.rule = rule;
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
    const env = globalThis.process?.env ?? globalThis.env ?? {}; //use window, in browser
    debug$3.hooks = set === 'hooks' || set === true ? hooksDebug(set === true) : undefined;
    debug$3.word = options.word?.toLowerCase();
    debug$3.contractions = set === 'contractions' || set === true;
    debug$3.rule = undefined;
    debug$3.tags = set === 'tagger' || set === true;
    env.DEBUG_TAGS = debug$3.tags ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

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
    if (isObject$5(input) && input.isView) {
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

  const nlp = function nlp(input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      if (debug$3.hooks) {
        debug$3.hooks(doc, world.hooks);
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
    if (debug$3.hooks) {
      debug$3.hooks(doc, compute.contractions ? ['alias', 'normal', 'machine', 'contractions'] : []);
    } else if (compute.contractions) {
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
      const last = needle.at(-1);
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
      if (Object.hasOwn(groups, num)) {
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
    const isOriginalPossessive = keep.possessives && terms.at(-1).tags.has('Possessive');
    const isOriginalTitleCase = keep.case && isTitleCase$2(terms[0].text);
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    const original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    const originalPre = original.docs[0][0].pre;
    const originalPost = original.docs[0].at(-1).post;
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
      const term = tmp.at(-1);
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
      const lastOne = main.docs[0].at(-1);
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
      to.post = removeRunBefore(to.post, ' ', '.?!,;:');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = removeRunBefore(to.post, ',;:', '.?!');
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
        const last = this.docs.at(-1);
        return last.at(-1).post
      }
      this.docs.forEach(terms => {
        const term = terms.at(-1);
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
      const last = docs.at(-1);
      const end = last.at(-1);
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
      start ||= `"`;
      end ||= `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms.at(-1);
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start ||= `(`;
      end ||= `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms.at(-1);
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
    const counts = Object.create(null);
    arr.forEach(o => {
      counts[o.normal] ??= 0;
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
    input ||= 'alpha';
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

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs.at(-1);
      const last = end.at(-1);
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
      const docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          const term = docs[n][i];
          term.id ||= toId(term);
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
  const t = true;
  var numberSuffixes = {
    'st': t,
    'nd': t,
    'rd': t,
    'th': t,
    'am': t,
    'pm': t,
    'max': t,
    '°': t,
    's': t, // 1990s
    'e': t, // 18e - french/spanish ordinal
    'er': t, //french 1er
    'ère': t, //''
    'ème': t, //french 2ème
  };

  var model$7 = {
    one: {
      contractions: contractions$2,
      numberSuffixes
    }
  };

  // Log decisions before splicing replaces the original term.
  const contractionDebug = (term, expansion) => {
    if (!debug$3.contractions || (debug$3.word && debug$3.word !== (term.normal || term.text).toLowerCase())) {
      return
    }
    debug$3.rule = undefined;
    const result = expansion ? '[' + expansion.map(word => yellow(`'${word}'`)).join(', ') + ']' : 'possessive (kept)';
    console.log(`${debug$3.prefix || '   '}${yellow(JSON.stringify(term.text))} →  ${result}`); // eslint-disable-line no-console
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
      if (Object.hasOwn(notUnit, unit)) {
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

  const toDocs = function (words, view, term) {
    contractionDebug(term, words);
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
          words = toDocs(words, view, terms[i]);
          insertContraction(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = toDocs(words, view, terms[i]);
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
          words = toDocs(words, view, terms[i]);
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
            if (Object.hasOwn(frozenLex, str) === true) {
              setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
              words.forEach(term => (term.frozen = true));
              continue
            }
          }
        }
        // test single word
        if (frozenLex[word] !== undefined && Object.hasOwn(frozenLex, word)) {
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

  const debug$2 = function (view) {
    view.docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        let str = `  ${i$1(dim('│'))}  `;
        const txt = t.implicit || t.text || '-';
        if (t.frozen === true) {
          str += `${blue(txt)} ❄️`;
        } else {
          str += i$1(dim(txt));
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
        if (Object.hasOwn(lexicon, str) === true) {
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
    if (prefix$1.test(word) === true) {
      const stem = word.replace(prefix$1, '');
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
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found ||= multiWord(terms, i, world);
          // lookup known words
          found ||= checkLexicon(terms, i, world);
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
      if (cache.has(words[i]) === true) {
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

  const getDoc$2 = (reg, view, group) => {
    if (typeof reg === 'string' || Array.isArray(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
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
      if (!all[i].after && all[i + 1]?.before) {
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

  const methods$c = { ...match$2, ...lookaround, ...methods$e, ...methods$d };
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
  const prefix = new Set('!~[^');
  const suffix = new Set('?]+*$~');
  const whitespace$1 = /\s/;

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
      afterSuffix[i] = suffix.has(str[i]) ? afterSuffix[i + 1] : i;
      if (str[i] === ')') close = i;
      if (str[i] === '(' && close >= i + 3 && str[close - 1] !== '\\') {
        const end = afterSuffix[close + 1];
        if (end === length || whitespace$1.test(str[end])) bodyEnd[i] = end;
      }
      // The optional <...> header cannot cross another '<', and prefers the
      // rightmost '>' which is followed by a valid parenthesized block.
      if (str[i] === '<') {
        captureEnd[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture && bodyEnd[i + 1]) {
        capture = bodyEnd[i + 1];
      }
    }
    const parts = [];
    let previous = 0;
    let i = 0;
    while (i < length) {
      const start = i;
      while (i < length && prefix.has(str[i])) i++;
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

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
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
      res = res.concat(splitGroups(str));
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
        obj.min = opts.fuzzy ?? 0.85;
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
          return str.split(/ /g).map(s => parseToken(s, opts, aliases))
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
    opts ||= {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks(input);
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
      if (reg.word !== undefined && cache.has(reg.word) === false) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && cache.has('#' + reg.tag) === false) {
        return true
      }
      // are all of the fast-or words missing?
      if (reg.fastOr !== undefined && anyIntersection(reg.fastOr, cache) === false) {
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
    const reg = { ...state.regs[state.r], start: false, end: false };
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      // the number of terms we've matched, if we stop here
      const count = state.t - start + 1;
      //stop for next-reg match - unless we're still under our min
      if (endReg && wrapMatch(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        if (reg.min === undefined || count >= reg.min) {
          return state.t
        }
      }
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
        const tmpReg = { ...reg, end: false };
        if (wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
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
      if (wrapMatch(state.terms[t], cr, state.start_i + t, state.phrase_length) !== true) {
        return 0
      }
      len += 1;
      // this can be greedy - '(foo+ bar)'
      if (cr.greedy === true) {
        // like getGreedy, anchors should not apply to the repeated terms
        const gr = { ...cr, start: false, end: false };
        for (let i = t + 1; i < state.terms.length; i += 1) {
          if (wrapMatch(state.terms[i], gr, state.start_i + i, state.phrase_length) !== true) {
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

  const doOrBlock = function (state) {
    const block = state.regs[state.r];
    let skipN = tryChoices(state, 0);
    if (skipN === 0) {
      return 0
    }
    // greedy or-block - keep matching choices - '(a b|c)+'
    if (block.greedy === true) {
      let more = tryChoices(state, skipN);
      while (more > 0) {
        skipN += more;
        more = tryChoices(state, skipN);
      }
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
        return wrapMatch(state.terms[tryTerm], cr, state.start_i + tryTerm, state.phrase_length)
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
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
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
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-and|`)
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a && b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = wrapMatch(state.terms[t], reg, state.start_i + t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length);
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
    const tmpReg = { ...reg };
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
      if (!nextTerm || !wrapMatch(nextTerm, regs[state.r + 1], state.start_i + state.t + 1, state.phrase_length)) {
        state.r += 1;
      }
    }
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
          byGroup[k] ||= [];
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
        const found = tryHere(terms, not, i, terms.length, i);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
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
      minLength = 0;
      for (let i = 0; i < regs.length; i += 1) {
        const reg = regs[i];
        if (reg.optional !== true && reg.negative !== true) {
          minLength += 1;
        }
      }
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

  const escapeXml = str => {
    str = str.replaceAll('&', '&amp;');
    str = str.replaceAll('<', '&lt;');
    str = str.replaceAll('>', '&gt;');
    str = str.replaceAll('"', '&quot;');
    str = str.replaceAll("'", '&apos;');
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
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
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
      }
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

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach(t => {
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

  const fmts$1 = {
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
  fmts$1.clean = fmts$1.normal;
  fmts$1.reduced = fmts$1.root;

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

  const defaults$1 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return { ...a, ...b }
  };

  const fns$1 = {
    text: terms => textFromTerms(terms, { keepPunct: true }, false),
    normal: terms => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: terms => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

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
    option = { ...defaults$1, ...option };
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

  // Output the requested format, or the platform's default console view.
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    if (!fmt || !Object.hasOwn(debugMethods, fmt)) {
      fmt = isClientSide() ? 'clientSide' : 'tags';
    }
    debugMethods[fmt](this);
    return this
  };

  const toText$2 = function (term) {
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
        if (Object.hasOwn(starts, t.id)) {
          const { fn, end } = starts[t.id];
          const m = doc.update([[n, i, end]]);
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
      const text = terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();
      const tags = terms.map(t => {
        const tag = slotForTerm(t, tagSet);
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
    const counts = new Map();
    arr.forEach(word => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
    const res = Array.from(counts, ([normal, count]) => ({ normal, count }));
    return res.sort((a, b) => b.count - a.count)
  };

  /** some named output formats */
  const out$1 = function (method) {
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
      return this.docs.flatMap(terms => terms.map(t => t.text).filter(Boolean))
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    }
    if (method === 'best-tag') {
      this.compute('tagRank');
      return this.docs
        .map(ts => {
          return ts.map(t => (t.tagRank?.[0] ? `#${t.tagRank[0]}` : '')).join(' ')
        })
        .join('\n')
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
    out: out$1,
    /** */
    wrap: function (obj) {
      return wrap(this, obj)
    },
  };

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };
  // a dash between two words, like '2025-05-11 - they'
  const spacedDash = /^\s+[-—]\s+$/;

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && Object.hasOwn(fmts$1, fmt)) {
        opts = { ...fmts$1[fmt] };
      } else if (fmt && isObject$1(fmt)) {
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

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!Object.hasOwn(model.one.tagSet, tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli$1[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
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

  const spliceIn = (txt, offset, index) => {
    const start = offset.start + index * 9; // Each highlight adds nine ANSI characters.
    const end = start + offset.length;
    return txt.substring(0, start) + blue(txt.substring(start, end)) + txt.substring(end)
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    const bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] ||= [];
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

  // Diagnostics describe the original parse, before the returned View is mutated.
  const specFailures = (doc, slots, patterns, aliases) => {
    const terms = doc.docs.flat();
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

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#.*$/; // an optional '# comment' after the last {tags} block


  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace); // eslint-disable-line prefer-const
    if (tags === undefined) {
      return { text: text.replace(/\s#.*$/, '').trimEnd(), tags: null } // no {tags} block on this line
    }
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    const lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    if (tags.length === 1 && tags[0].length === 1 && tags[0][0] === '') {
      tags = []; // empty '{}'; retain empty slots in nonempty lists
    }
    return { text, tags }
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

  const fromSpec = function (spec, { tags: tagMode = 'ignore', failures: failureMode = 'ignore', verbose = false } = {}) {
    if (!['ignore', 'use'].includes(tagMode) || !['ignore', 'throw', 'retain', 'log'].includes(failureMode)) {
      throw new Error('Invalid fromSpec options')
    }
    const aliases = this.world().model.one.tagAliases;
    const result = this('');
    result.failures = [];
    spec.split('\n').forEach((line, index) => {
      if (!line.trim() || /^\s*#/.test(line)) {
        return
      }
      const { text, tags } = parseLine(line);
      const doc = tagMode === 'use' ? this.tokenize(text) : this(text);
      let failures = [];
      if (tags !== null && (tagMode === 'use' || failureMode !== 'ignore')) {
        const count = doc.docs.reduce((sum, terms) => sum + terms.length, 0);
        const patterns = tags.map(slot => toMatchString([slot], aliases));
        const pattern = toMatchString(tags, aliases);
        // Assigning slots is unsafe when the shape or syntax is invalid.
        const canApply = count === tags.length && pattern !== null;
        if (tagMode === 'use' && !canApply && failureMode !== 'log') {
          const invalid = specFailures(doc, tags, patterns, aliases);
          throw new Error(`${text.trim()} - ${invalid.map(failure => failure.message).join('; ')}`)
        }
        if (tagMode === 'use') {
          applyTags(doc, canApply ? tags : null, aliases);
        }
        if (failureMode !== 'ignore' && (count !== tags.length || pattern === null || !doc.has(pattern))) {
          failures = specFailures(doc, tags, patterns, aliases)
            .map(failure => ({ line: index + 1, text: text.trim(), ...failure }));
          result.failures.push(...failures);
        }
      } else if (tagMode === 'use') {
        applyTags(doc, null, aliases);
      }
      const detail = failures.map(failure => failure.message).join('; ');
      if (failureMode === 'log' && failures.length > 0) {
        console.error(logSpec(doc, tags, failures, aliases)); //eslint-disable-line no-console
      } else if (verbose) {
        const block = tags === null ? '' : ` {${tags.map(slot => slot.join('|')).join(',')}}`;
        if (failures.length > 0) {
          console.log(`${red('✗')} ${text}${dim(block)} - ${red(detail)}`); //eslint-disable-line no-console
        } else {
          console.log(`${green('✓')} ${green(dim(text))}${dim(block)}`); //eslint-disable-line no-console
        }
      }
      if (failures.length > 0 && failureMode === 'throw') {
        throw new Error(`${text.trim()} - ${detail}`)
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
      ptr[4] = terms.length > 0 ? terms[terms.length - 1].id : null;
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

  const getDoc = (m, view) => {
    if (typeof m === 'string' || Array.isArray(m)) {
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

  // Resolve actions and index hints once, alongside the match expression.
  const resolveAliases = (rule, aliases) => {
    const tag = value => {
      if (Array.isArray(value)) {
        return value.map(tag)
      }
      if (typeof value !== 'string') {
        return value
      }
      return value.trim().split(/ +/).map(name => {
        name = name.replace(/^#/, '');
        return aliases[name] || name
      }).join(' ')
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
      obj.minLength = obj.regs.filter(o => o.optional !== true && o.negative !== true).length;
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
  const runMatch = function (maybeList, document, docCache, methods, opts) {
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
            const todo = { ...m, pointer: ptr };
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

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // filter candidates before sorting them into execution order
    const maybeList = getHooks(docCache, net, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
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

  // is this tag consistent with the tags they already have?
  const canBe$1 = function (terms, tag, model) {
    const tagSet = model.one.tagSet;
    if (!Object.hasOwn(tagSet, tag)) {
      return true
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      for (const existing of term.tags) {
        if (conflicts.has(existing)) {
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
        if (canBe$1(terms, todo.tag, model) === false) {
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

  // eslint-disable-next-line max-params
  const tagTerm = function (term, tag, tagSet, isSafe, validated, reason) {
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
    const previous = debug$3.tags ? debug$3.before(term) : null;
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
      debug$3.log(term, previous, reason);
    }
    return true
  };

  // support '#Noun . #Adjective' syntax
  // eslint-disable-next-line max-params
  const multiTag = function (terms, tagString, tagSet, aliases, isSafe, reason) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tag = aliases?.[tag] || tag;
        tagTerm(term, tag, tagSet, isSafe, undefined, reason);
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
    if (Array.isArray(tag) === true) {
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
    tag = tag.replace(/^#/, '');
    tag = world.model.one.tagAliases?.[tag] || tag;
    // let set = false
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
      const previous = debug$3.tags ? debug$3.before(term) : null;
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        if (previous) {
          debug$3.log(term, previous, reason);
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
        debug$3.log(term, previous, reason);
      }
    }
  };

  // quick check if this tag will require any untagging
  const canBe = function (term, tag, tagSet) {
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
          console.warn(`[Grad] - missing node '${node.parent}'`); // eslint-disable-line no-console
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

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

  const reset = '\x1b[0m';
  //cheaper than requiring chalk
  const cli = {
    // green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    // blue: str => '\x1b[34m' + str + reset,
    // magenta: str => '\x1b[35m' + str + reset,
    // cyan: str => '\x1b[36m' + str + reset,
    // yellow: str => '\x1b[33m' + str + reset,
    // black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
  };

  const indent = '    ';

  const toText$1 = function (json, color) {
    let arrow = '-> ';
    if (color) {
      arrow = cli.dim('→ ');
    }
    let txt = '';
    const rows = byDepth(json);
    rows.forEach((node, i) => {
      let label = node.id || '';
      if (color) {
        label = cli.red(label);
      }
      if (i === 0 && !node.id) {
        return //skip empty root
      }
      const depth = node._cache.parents.length;
      txt += indent.repeat(depth) + arrow + label + '\n';
    });
    return txt
  };

  const toArray$1 = function (json) {
    // The tag formatter only reads these graph-owned nodes.
    const nodes = byDepth(json);
    // should we show the root?
    const root = nodes[0];
    if (root && !root.id && Object.keys(root.props).length === 0) {
      nodes.shift();
    }
    return nodes
  };

  // Keep this dispatch intact: an array-only version regresses V8 benchmarks.
  const fmts = {
    text: toText$1,
    txt: toText$1,
    array: toArray$1,
    flat: toArray$1,
  };

  const out = function (root, label) {
    // return internal json
    if (label === 'nested' || label === 'json') {
      return root
    }
    if (label === 'debug') {
      console.log(toText$1(root, true)); // eslint-disable-line no-console
      return null
    }
    if (fmts.hasOwnProperty(label)) {
      return fmts[label](root)
    }
    return root
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
    out(fmt) {
      // fillDown changes properties, so the cached graph relationships still hold.
      return out(this.json, fmt)
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
    Object.keys(res).forEach(tag => resolveParents(tag));
    Object.keys(res).forEach(tag => {
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          res[parent].children.push(tag);
        }
      });
    });

    // Inherit exclusions through every parent, then exclude all descendants of
    // each conflicting tag. Read a snapshot to keep this independent of order.
    const exclusions = {};
    Object.keys(res).forEach(tag => { exclusions[tag] = res[tag].not; });
    Object.keys(res).forEach(k => {
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
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      if (typeof tags[k].is === 'string') {
        tags[k].is = resolve(tags[k].is);
      }
      if (tags[k].also) {
        tags[k].also = toArr(tags[k].also).map(resolve);
      }
      if (tags[k].not) {
        tags[k].not = toArr(tags[k].not).map(resolve);
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!Object.hasOwn(tags, tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // Additional parents need entries too, including parents introduced by plugins.
      toArr(tags[k].also).forEach(parent => {
        if (!Object.hasOwn(tags, parent)) {
          tags[parent] = {};
        }
      });
      // add any implicit 'not' tags
      toArr(tags[k].not).forEach(excluded => {
        if (!Object.hasOwn(tags, excluded)) {
          tags[excluded] = {};
        }
      });
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
      if (tags[k].aliases !== undefined) {
        tags[k].aliases = toArr(tags[k].aliases);
      }
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
      if (tags[k].also) {
        tags[k].also = toArr(tags[k].also);
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
    return graph$1.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = { ...tags[k] };
      tags[k].novel = true;
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
      canBe,
    },
  };

  /* eslint no-console: 0 */

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
      if (Array.isArray(input)) {
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
      const resolve = tag => {
        tag = tag.trim().replace(/^#/, '');
        return model.one.tagAliases[tag] || tag
      };
      if (Array.isArray(input)) {
        input.forEach(tag => methods.one.unTag(terms, resolve(tag), tagSet, reason));
      } else {
        methods.one.unTag(terms, resolve(input), tagSet, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      tag = tag.replace(/^#/, '');
      tag = this.model.one.tagAliases[tag] || tag;
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
    document.forEach(terms => {
      terms.forEach(term => {
        const tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
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
    return Boolean(/\n$/.test(c))
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
    '\u300C': '\u300D', // 'CornerBrackets' 「」
    '\u300E': '\u300F', // 'WhiteCornerBrackets' 『』
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
        // is the quote already closed in this chunk? - '“Yes!” said Tom. “No!” said Ann.'
        const closed = split.match(closeQuote);
        if (closed !== null && closed[0] !== m[0]) {
          arr.push(split);
          continue
        }

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
  const hasOpen = /[(\uFF08]/g;
  const hasClosed = /[)\uFF09]/g;
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
    text ||= '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
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
      if (hasHyphen$1(words[i], model) === true) {
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
      if (wordlike.test(word) === true && Object.hasOwn(notWord, word) === false && isBoundary.test(word) === false) {
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
    let pre = '';
    let post = '';
    const chars = Array.from(str);
    let start = 0;
    let end = chars.length;

    // punctuation-only words, like '<3'
    if (Object.hasOwn(emoticons, str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // Locate the first retained code point without shifting the array.
    while (start < end) {
      const c = chars[start];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        break//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(str.trim())) {
        break//done
      }
      // '97 - year short-form
      if (c === "'" && c.length === 3 && isNumber.test(chars[start + 1])) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
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
      // F.B.I.
      if (c === '.' && hasAcronym.test(original) === true) {
        break//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original) === true) {
        break//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(str.trim())) {
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
    if (/^[:;]/.test(str) === false) {
      str = trimPunctuation(str, /[",.!:;?)]/);
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
  const periodAcronym$1 = /^([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /^[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /^([a-z]\.)+[a-z]\.?$/;

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

  const isAcronym$2 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse$1 = /(?:\u2026|\.{2}) *$/; // '...'
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
    if (Object.hasOwn(abbrevs, lastWord) === true && hasPeriod$1.test(str) === true) {
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
  // fullwidth ascii - 'Ｈｅｌｌｏ ２０２４' to 'Hello 2024'
  for (let i = 0x21; i <= 0x7E; i += 1) {
    unicode$1[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
  }

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
    if (Object.hasOwn(aliases, str)) {
      term.alias ||= [];
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
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        counts[word] ??= 0;
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
        if (opts.safe && Object.hasOwn(world.model.one.lexicon, prefix)) {
          continue
        }
        // does it already exist?
        if (Object.hasOwn(existing, prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (Object.hasOwn(index, prefix) === true) {
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

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = { ...defaults, ...opts };
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
    const { ex = {}, fwd = {}, both = {} } = model;
    if (Object.hasOwn(ex, str)) {
      return ex[str]
    }
    for (let len = str.length; len >= 0; len -= 1) {
      const suff = str.slice(str.length - len);
      const stem = str.slice(0, str.length - len);
      if (Object.hasOwn(fwd, suff)) {
        return stem + fwd[suff]
      }
      if (Object.hasOwn(both, suff)) {
        return stem + both[suff]
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
      reversed: true,
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
      "first": "0erte:|1te:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5itt:abreiten|5ag:fliegen{au,e}|4og:gen{we,wä}|5ang:abringen|2te:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},lär}|4ochte:ögen|3at:tuen|5iss:cheißen|4ief:lafen|4ßte:lassen{b,ran}|5ieß:ablassen|5ob:hieben|5annte:ortrennen|10fuhr:rad fahren|4ielt:alte|0rte:ie|4amm:imme|0te:l~2te:en,escheren|1te:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,ni,cl}|7mailte:-mailen|5usste:wissen|11hettoisierte:ettoisieren|5achte:bringen,denken|5annte:ennen|5onnte:können|4ßte:ssen{a,pre,tre,ä}|5urfte:dürfen|3tte:haben|5andte:bersenden|4ie:eien{hr,p}|5urde:werden|5ielt:halten|5alt:elten|2at:un|5at:bitten|4at:reten|5itt:en{eid{l,hn},eit{gl,r}}|5ott:sieden|4iet:raten|5ot:bieten|6ocht:echten{f,l}|14schwamm brust:brustschwimmen|6arst:ersten|5iss:eißen|5oss:ießen|4ies:blasen|5ies:eisen{w,pr}|4as:esen{l,n}|6uchs:achsen|5am:ommen|5ahm:ehmen|5amm:wimmen|5omm:limmen|4ief:rufen|5ief:laufen|5iff:eifen{gr,n,f,l}|5off:fen{sau,rie}|5alf:elfen|5arf:erfen|5af:effen|5uf:haffen|5og:en{ieh,g{ie{b,fl,w},sau}}|4og:ügen{l,tr}|5ang:ingen|5ing:fangen|4ing:gehen|4ug:agen{hl,tr}|5ieg:eigen{t,hw}|5ag:liegen|5arg:ergen|5and:inden{b,f,w}|4and:tehen|4ud:laden|5ied:eiden{h,m}|9fuhr rad:radfahren|5ieb:eiben{bl,r}|4ab:geben|4ub:graben|4ob:eben{h,w}|5ob:tieben|5arb:erben{st,w,d}|4ib:vergraben|5ach:echen{r,t}|6ich:eichen{l,tr,w}|6usch:waschen|6osch:schen{dre,rlö}|6och:riechen|5och:hstechen|4ah:ehen{s,h}|5ieh:eihen|5oh:liehen|5aß:essen,sitzen|4ieß:oßen|5ieß:lassen,heißen|5uhr:fahren|4or:ren{ä,he,wö}|5or:en{ier{fr,rl},kies}|4war:sein|4ar:bären|5iel:fallen|5oll:ellen{hw,u}|5ahl:ehlen|5ann:innen|5onn:berspinnen|5ien:heinen|15schwamm delfin:delfinschwimmen|16schwamm delphin:delphinschwimmen|5olz:elzen|5ank:inken{r,t,s}|5olk:melken~2e:te{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|2n:te{el,er,eier}|2:rentwickelte|2en:te{el{i,e,w},er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|4:ierte{skristallis,skompliment}|3:tkommerzialisierte|5ögen:mochte|4alte:hterhielt|2uen:vertat|3imme:herschwamm|3afen:schlief|2egen:ewog|2ieben:chob|2essen:ausaß|2acken:uk~1te:auskristallisiere|4og:erwägen|10fuhr:rad fahren|5uk:backen|2te:en{dach,fehl,pinn}|4or:schwären",
      "second": "0ertest:|1test:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5ittest:abreiten|5altest:elten|6ochtest:lechten|5agst:fliegen{au,e}|4ogst:gen{we,wä}|5angst:abringen|2test:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,hdresch,nweich,enn{tr,l,p},lär}|4ochtest:ögen|5isst:cheißen|4iefst:lafen|4ßtest:lassen{b,ran}|5ießt:ablassen|5obst:hieben|5anntest:ortrennen|10fuhrst:rad fahren|4ieltest:alte|0rtest:ie|4ammst:imme|0test:l~2test:en,escheren|1test:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ietest:raten|5ieltest:halten|7mailtest:-mailen|5atest:bitten|4atest:reten|3atest:tuen|5usstest:wissen|6arstest:ersten|11hettoisiertest:ettoisieren|5achtest:bringen,denken|6ochtest:fechten|5anntest:ennen|5onntest:können|4ßtest:ssen{a,pre,tre,ä}|5urftest:dürfen|5ittest:en{eid{l,hn},eit{gl,r}}|5ottest:sieden|3ttest:haben|5otest:bieten|5andtest:bersenden|5andest:inden{b,f,w}|4andest:tehen|4udest:laden|5iedest:eiden{h,m}|5urdest:werden|4iest:en{blas,hrei,pei}|5iest:eisen{w,pr}|5ießest:enlassen{h,g}|5isst:eißen|5osst:ießen|5amst:ommen|5ahmst:ehmen|5ammst:wimmen|5ommst:limmen|4iefst:rufen|5iefst:laufen|5iffst:eifen{gr,n,f,l}|5offst:fen{sau,rie}|5alfst:elfen|5arfst:erfen|5afst:effen|5ufst:haffen|5ogst:en{ieh,g{ie{b,fl,w},sau}}|4ogst:ügen{l,tr}|5angst:ingen|5ingst:fangen|4ingst:gehen|4ugst:agen{hl,tr}|5iegst:eigen{t,hw}|5agst:liegen|5argst:ergen|5iebst:eiben{bl,r}|4abst:geben|4ubst:graben|4obst:eben{h,w}|5obst:tieben|5arbst:erben{st,w,d}|4ibst:vergraben|5achst:echen{r,t}|6ichst:eichen{l,tr,w}|6uschst:waschen|6oschst:schen{dre,rlö}|6uchst:achsen|6ochst:riechen|5ochst:hstechen|4ahst:ehen{s,h}|5iehst:eihen{l,d}|5ohst:liehen|5uhrst:fahren|4orst:ren{ä,he,wö}|5orst:en{ier{fr,rl},kies}|4warst:sein|4arst:bären|5ielst:fallen|5ollst:ellen{hw,u}|5ahlst:ehlen|5annst:innen|5onnst:berspinnen|5ienst:heinen|4ast:esen{l,n}|5olzst:elzen|5ankst:inken{r,t,s}|5olkst:melken|14schwammst brust:brustschwimmen|4andst:stehen{lein,tan,pf}|2atst:un|5atst:verbitten|5ieltst:ochhalten|5aßt:essen,sitzen|4ießt:oßen|5ießt:lassen,heißen|15schwammst delfin:delfinschwimmen|16schwammst delphin:delphinschwimmen|9fuhrst rad:radfahren~4e:test{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|4n:test{el,er,eier}|4en:test{el{i,chi,e,w},pars,er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|7alte:hterhieltest|4:rentwickeltest|6elten:galtest|6:iertest{skristallis,skompliment}|5:tkommerzialisiertest|7echten:flochtest|7ögen:mochtest|5imme:herschwammst|5afen:schliefst|4egen:ewogst|4ieben:chobst|4acken:ukst|3essen:ausaßt~1test:auskristallisiere|4ogst:erwägen|10fuhrst:rad fahren|5ukst:backen|2test:en{dach,fehl,pinn}|4orst:schwären",
      "third": "0erte:|1te:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5itt:abreiten|5ag:fliegen{au,e}|4og:gen{we,wä}|5ang:abringen|2te:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},lär}|4ochte:ögen|3at:tuen|5iss:cheißen|4ief:lafen|4ßte:lassen{b,ran}|5ieß:ablassen|5ob:hieben|5annte:ortrennen|10fuhr:rad fahren|4ielt:alte|0rte:ie|4amm:imme|0te:l~2te:en,escheren|1te:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,ni,cl}|7mailte:-mailen|5usste:wissen|11hettoisierte:ettoisieren|5achte:bringen,denken|5annte:ennen|5onnte:können|4ßte:ssen{a,pre,tre,ä}|5urfte:dürfen|3tte:haben|5andte:bersenden|4ie:eien{hr,p}|5urde:werden|5ielt:halten|5alt:elten|2at:un|5at:bitten|4at:reten|5itt:en{eid{l,hn},eit{gl,r}}|5ott:sieden|4iet:raten|5ot:bieten|6ocht:echten{f,l}|14schwamm brust:brustschwimmen|6arst:ersten|5iss:eißen|5oss:ießen|4ies:blasen|5ies:eisen{w,pr}|4as:esen{l,n}|6uchs:achsen|5am:ommen|5ahm:ehmen|5amm:wimmen|5omm:limmen|4ief:rufen|5ief:laufen|5iff:eifen{gr,n,f,l}|5off:fen{sau,rie}|5alf:elfen|5arf:erfen|5af:effen|5uf:haffen|5og:en{ieh,g{ie{b,fl,w},sau}}|4og:ügen{l,tr}|5ang:ingen|5ing:fangen|4ing:gehen|4ug:agen{hl,tr}|5ieg:eigen{t,hw}|5ag:liegen|5arg:ergen|5and:inden{b,f,w}|4and:tehen|4ud:laden|5ied:eiden{h,m}|9fuhr rad:radfahren|5ieb:eiben{bl,r}|4ab:geben|4ub:graben|4ob:eben{h,w}|5ob:tieben|5arb:erben{st,w,d}|4ib:vergraben|5ach:echen{r,t}|6ich:eichen{l,tr,w}|6usch:waschen|6osch:schen{dre,rlö}|6och:riechen|5och:hstechen|4ah:ehen{s,h}|5ieh:eihen|5oh:liehen|5aß:essen,sitzen|4ieß:oßen|5ieß:lassen,heißen|5uhr:fahren|4or:ren{ä,he,wö}|5or:en{ier{fr,rl},kies}|4war:sein|4ar:bären|5iel:fallen|5oll:ellen{hw,u}|5ahl:ehlen|5ann:innen|5onn:berspinnen|5ien:heinen|15schwamm delfin:delfinschwimmen|16schwamm delphin:delphinschwimmen|5olz:elzen|5ank:inken{r,t,s}|5olk:melken~2e:te{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|2n:te{el,er,eier}|2:rentwickelte|2en:te{el{i,e,w},er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|4:ierte{skristallis,skompliment}|3:tkommerzialisierte|5ögen:mochte|4alte:hterhielt|2uen:vertat|3imme:herschwamm|3afen:schlief|2egen:ewog|2ieben:chob|2essen:ausaß|2acken:uk~1te:auskristallisiere|4og:erwägen|10fuhr:rad fahren|5uk:backen|2te:en{dach,fehl,pinn}|4or:schwären",
      "firstPlural": "0erten:|1ten:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5itten:abreiten|5alten:elten|6ochten:lechten|5agen:fliegen{au,e}|4ogen:gen{we,wä}|5angen:abringen|2ten:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},lär}|4ochten:ögen|3aten:tuen|5issen:cheißen|4iefen:lafen|4ßten:lassen{rb,ran}|5oben:hieben|5annten:ortrennen|10fuhren:rad fahren|4ielten:alte|0rten:ie|4ammen:imme|0ten:l~2ten:en,escheren|1ten:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ieten:raten|5ielten:halten|7mailten:-mailen|2aten:un|5aten:bitten|4aten:reten|5ussten:wissen|6arsten:ersten|11hettoisierten:ettoisieren|5achten:bringen,denken|6ochten:fechten|5annten:ennen|5onnten:können|4ßten:ssen{a,pre,tre,ä}|5urften:dürfen|5itten:en{eid{l,hn},eit{gl,r}}|5otten:sieden|3tten:haben|5oten:bieten|5andten:bersenden|5issen:eißen|5ossen:ießen|4iesen:blasen|5iesen:eisen{w,pr}|4asen:esen{l,n}|6uchsen:achsen|5amen:ommen|5ahmen:ehmen|5ammen:wimmen|5ommen:limmen|4iefen:rufen|5iefen:laufen|5iffen:eifen{gr,n,f,l}|5offen:fen{sau,rie}|5alfen:elfen|5arfen:erfen|5afen:effen|5ufen:haffen|5ogen:en{ieh,g{ie{b,fl,w},sau}}|4ogen:ügen{l,tr}|5angen:ingen|5ingen:fangen|4ingen:gehen|4ugen:agen{hl,tr}|5iegen:eigen{t,hw}|5agen:liegen|5argen:ergen|5anden:inden{b,f,w}|4anden:tehen|4uden:laden|5ieden:eiden{h,m}|5urden:werden|5ieben:eiben{bl,r}|4aben:geben|4uben:graben|4oben:eben{h,w}|5oben:tieben|5arben:erben{st,w,d}|4iben:vergraben|5achen:echen{r,t}|6ichen:eichen{l,tr,w}|6uschen:waschen|6oschen:schen{dre,rlö}|6ochen:riechen|5ochen:hstechen|4ahen:ehen{s,h}|5iehen:eihen|5ohen:liehen|5aßen:essen,sitzen|4ießen:oßen|5ießen:lassen,heißen|5uhren:fahren|4oren:ren{ä,he,wö}|5oren:en{ier{fr,rl},kies}|4waren:sein|4aren:bären|5ielen:fallen|5ollen:ellen{hw,u}|5ahlen:ehlen|5annen:innen|5onnen:berspinnen|5ienen:heinen|5olzen:elzen|5anken:inken{r,t,s}|5olken:melken|4ien:eien{hr,p}|15schwammen delfin:delfinschwimmen|16schwammen delphin:delphinschwimmen|14schwammen brust:brustschwimmen|9fuhren rad:radfahren~3e:ten{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:ten{el,er,eier}|3en:ten{el{i,chi,e,w},pars,er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|6alte:hterhielten|3:rentwickelten|5elten:galten|4uen:vertaten|5:ierten{skristallis,skompliment}|4:tkommerzialisierten|6echten:flochten|6ögen:mochten|5imme:herschwammen|5afen:schliefen|4egen:ewogen|4ieben:choben|4essen:ausaßen|4acken:uken~1ten:auskristallisiere|4ogen:erwägen|10fuhren:rad fahren|5uken:backen|4ßten:blassen|2ten:en{dach,fehl,pinn}|4oren:schwären",
      "secondPlural": "0ertet:|1tet:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5ittet:abreiten|5altet:elten|6ochtet:lechten|5agt:fliegen{au,e}|4ogt:gen{we,wä}|5angt:abringen|2tet:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,hdresch,nweich,enn{tr,l,p},lär}|4ochtet:ögen|3atet:tuen|5isst:cheißen|4ieft:lafen|4ßtet:lassen{b,ran}|5ießt:ablassen|5obt:hieben|5anntet:ortrennen|10fuhrt:rad fahren|4ieltet:alte|0rtet:ie|4ammt:imme|0tet:l~2tet:en,escheren|1tet:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ietet:raten|5ieltet:halten|7mailtet:-mailen|2atet:un|5atet:bitten|4atet:reten|5usstet:wissen|6arstet:ersten|11hettoisiertet:ettoisieren|5achtet:bringen,denken|6ochtet:fechten|5anntet:ennen|5onntet:können|4ßtet:ssen{a,pre,tre,ä}|5urftet:dürfen|5ittet:en{eid{l,hn},eit{gl,r}}|5ottet:sieden|3ttet:haben|5otet:bieten|5andtet:bersenden|5andet:inden{b,f,w}|4andet:tehen|4udet:laden|5iedet:eiden{h,m}|5urdet:werden|4iet:eien{hr,p}|5isst:eißen|5osst:ießen|4iest:blasen|5iest:eisen{w,pr}|4ast:esen{l,n}|6uchst:achsen|14schwammt brust:brustschwimmen|5amt:ommen|5ahmt:ehmen|5ammt:wimmen|5ommt:limmen|4ieft:rufen|5ieft:laufen|5ifft:eifen{gr,n,f,l}|5offt:fen{sau,rie}|5alft:elfen|5arft:erfen|5aft:effen|5uft:haffen|5ogt:en{ieh,g{ie{b,fl,w},sau}}|4ogt:ügen{l,tr}|5angt:ingen|5ingt:fangen|4ingt:gehen|4ugt:agen{hl,tr}|5iegt:eigen{t,hw}|5agt:liegen|5argt:ergen|5iebt:eiben{bl,r}|4abt:geben|4ubt:graben|4obt:eben{h,w}|5obt:tieben|5arbt:erben{st,w,d}|4ibt:vergraben|5acht:echen{r,t}|6icht:eichen{l,tr,w}|6uscht:waschen|6oscht:schen{dre,rlö}|6ocht:riechen|5ocht:hstechen|4aht:ehen{s,h}|5ieht:eihen{l,d}|5oht:liehen|5aßt:essen,sitzen|4ießt:oßen|5ießt:lassen,heißen|5uhrt:fahren|4ort:ren{ä,he,wö}|5ort:en{ier{fr,rl},kies}|4wart:sein|4art:bären|5ielt:fallen|5ollt:ellen{hw,u}|5ahlt:ehlen|5annt:innen|5onnt:berspinnen|5ient:heinen|5olzt:elzen|5ankt:inken{r,t,s}|5olkt:melken|15schwammt delfin:delfinschwimmen|16schwammt delphin:delphinschwimmen|9fuhrt rad:radfahren~3e:tet{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:tet{el,er,eier}|3en:tet{el{i,chi,e,w},pars,er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|6alte:hterhieltet|3:rentwickeltet|5elten:galtet|4uen:vertatet|5:iertet{skristallis,skompliment}|4:tkommerzialisiertet|6echten:flochtet|6ögen:mochtet|4imme:herschwammt|4afen:schlieft|3egen:ewogt|3ieben:chobt|3essen:ausaßt|3acken:ukt~1tet:auskristallisiere|4ogt:erwägen|10fuhrt:rad fahren|5ukt:backen|2tet:en{dach,fehl,pinn}|4ort:schwären",
      "thirdPlural": "0erten:|1ten:n{,e{t{eglei,brei,chal,beinhal,zel,ira},leid{k,emit}}},e|5itten:abreiten|5alten:elten|6ochten:lechten|5agen:fliegen{au,e}|4ogen:gen{we,wä}|5angen:abringen|2ten:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},lär}|4ochten:ögen|3aten:tuen|5issen:cheißen|4iefen:lafen|4ßten:lassen{rb,ran}|5oben:hieben|5annten:ortrennen|10fuhren:rad fahren|4ielten:alte|0rten:ie|4ammen:imme|0ten:l~2ten:en,escheren|1ten:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ieten:raten|5ielten:halten|7mailten:-mailen|2aten:un|5aten:bitten|4aten:reten|5ussten:wissen|6arsten:ersten|11hettoisierten:ettoisieren|5achten:bringen,denken|6ochten:fechten|5annten:ennen|5onnten:können|4ßten:ssen{a,pre,tre,ä}|5urften:dürfen|5itten:en{eid{l,hn},eit{gl,r}}|5otten:sieden|3tten:haben|5oten:bieten|5andten:bersenden|5issen:eißen|5ossen:ießen|4iesen:blasen|5iesen:eisen{w,pr}|4asen:esen{l,n}|6uchsen:achsen|5amen:ommen|5ahmen:ehmen|5ammen:wimmen|5ommen:limmen|4iefen:rufen|5iefen:laufen|5iffen:eifen{gr,n,f,l}|5offen:fen{sau,rie}|5alfen:elfen|5arfen:erfen|5afen:effen|5ufen:haffen|5ogen:en{ieh,g{ie{b,fl,w},sau}}|4ogen:ügen{l,tr}|5angen:ingen|5ingen:fangen|4ingen:gehen|4ugen:agen{hl,tr}|5iegen:eigen{t,hw}|5agen:liegen|5argen:ergen|5anden:inden{b,f,w}|4anden:tehen|4uden:laden|5ieden:eiden{h,m}|5urden:werden|5ieben:eiben{bl,r}|4aben:geben|4uben:graben|4oben:eben{h,w}|5oben:tieben|5arben:erben{st,w,d}|4iben:vergraben|5achen:echen{r,t}|6ichen:eichen{l,tr,w}|6uschen:waschen|6oschen:schen{dre,rlö}|6ochen:riechen|5ochen:hstechen|4ahen:ehen{s,h}|5iehen:eihen|5ohen:liehen|5aßen:essen,sitzen|4ießen:oßen|5ießen:lassen,heißen|5uhren:fahren|4oren:ren{ä,he,wö}|5oren:en{ier{fr,rl},kies}|4waren:sein|4aren:bären|5ielen:fallen|5ollen:ellen{hw,u}|5ahlen:ehlen|5annen:innen|5onnen:berspinnen|5ienen:heinen|5olzen:elzen|5anken:inken{r,t,s}|5olken:melken|4ien:eien{hr,p}|15schwammen delfin:delfinschwimmen|16schwammen delphin:delphinschwimmen|14schwammen brust:brustschwimmen|9fuhren rad:radfahren~3e:ten{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:ten{el,er,eier}|3en:ten{el{i,chi,e,w},pars,er{i,rei,qu,hw,e},bdach,ann{p,b,m},maß,spaß}|6alte:hterhielten|3:rentwickelten|5elten:galten|4uen:vertaten|5:ierten{skristallis,skompliment}|4:tkommerzialisierten|6echten:flochten|6ögen:mochten|5imme:herschwammen|5afen:schliefen|4egen:ewogen|4ieben:choben|4essen:ausaßen|4acken:uken~1ten:auskristallisiere|4ogen:erwägen|10fuhren:rad fahren|5uken:backen|4ßten:blassen|2ten:en{dach,fehl,pinn}|4oren:schwären"
    },
    "presentTense": {
      "first": "0:|1e:n|10fahre:rad fahren|0re:ie|0ere:i|2le:el~1:en|12schäme:fremdschämen|3le:eln|7maile:-mailen|1e:celn|11hettoisiere:ettoisieren|14schwimme brust:brustschwimmen|15schwimme delfin:delfinschwimmen|16schwimme delphin:delphinschwimmen|4bin:sein|5ann:können|9fahre rad:radfahren|5arf:dürfen|4ag:ögen|5uss:müssen|2:sollen|5ill:wollen|5eiß:wissen~0:e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:e{tu,er{,ei,sch{t,ä}}}|0n:e{vertu,l{l,h,i,o,a,ä,e,u,ü,ö,r,c},er{i,rei,qu,sch{,rt},hw,e}}|2eln:chle|2el:rentwickle|3:iere{skristallis,skompliment}|2:tkommerzialisiere~0:auskristallisiere|10fahre:rad fahren",
      "second": "0erst:|1st:n{,e{t{chal,beinhal,zel,ira},ni}},e|2st:en{g{eantra,eauftra,ranschla,herber},unfall,rfehl,hab{c,d},hdresch,verschreck}|4agst:ögen|5immst:ehmen|5iffst:effen|2t:sen{,s{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}}}|4ßt:lassen{rb,ran}|5äßt:enlassen{f,d,m}|10fährst:rad fahren|4ältst:alte|0rst:ie|0st:l~2st:en|1st:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,cl}|4iest:lesen|5ängst:fangen|4ägst:agen{hl,tr}|5irgst:ergen|14schwimmst brust:brustschwimmen|5ältst:halten|5iltst:elten|4ätst:raten|4ittst:reten|6ichtst:echten{f,l}|5äufst:aufen{l,s}|5ilfst:elfen|5irfst:erfen|5arfst:dürfen|4äfst:lafen|5ällst:fallen|5illst:llen{wo,hwe,ue}|5iehlst:ehlen|7mailst:-mailen|4äst:blasen|5isst:essen|5ässt:lassen{en,lein,rei}|5usst:müssen|4ibst:geben|5irbst:erben{st,w,d}|4äbst:graben|11hettoisierst:ettoisieren|5ährst:fahren|6irst:ersten|5irst:werden|5ichst:echen{r,t}|6ischst:schen{dre,rlö}|6äschst:waschen|6ächst:achsen|4iehst:ehen{s,h}|5annst:können|5ickst:hrecken|5ilkst:melken|3st:haben|4ädst:laden|4bist:sein|5ilzst:verschmelzen|2t:en{z,ß,sch{rut,rei},x,c}|5ilzt:elzen|5eißt:wissen|4ßt:ssen{pre,tre,ä,a}|5äßt:lassen|4ößt:oßen|15schwimmst delfin:delfinschwimmen|16schwimmst delphin:delphinschwimmen|9fährst rad:radfahren~1en:t{s{e,u{a{br,gr,kr,tl,s,p,z},hle,m},t,m{bre,bu,hei,bi},hal,hül,rä,s,pis,hub,rin,zin,ran,k{c{kle,glu,mu,na,ri},ur,rkor,o},a,p{a,i,plum,rül,o,e},ö,i,o,w,ü},filz,ß{hwei,lö,ma,spa}}|2n:st{knie,tu,el,er{,ei,sch{it,ät,ä}}}|2e:st{rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|4ögen:magst|2en:st{u{nbra,nsa,versa,vert},l{ie,ee,we,cha},er{i,rei,qu,sch,hw,e},äch{schw,r},rknack,dop,ei{schr,fr,nsp,ssp,n,f,z}}|5alte:hterhältst|5ehmen:nimmst|5effen:riffst|2:rentwickelst|4:ierst{skristallis,skompliment}|3:tkommerzialisierst~1st:auskristallisiere|10fährst:rad fahren|4ßt:blassen|2st:brauen,fehlen|2t:sen{flie,knick,lau,mor,par}",
      "third": "0ert:|1t:n{,te{chal,beinhal,zel,ira}},e|6icht:lechten|2t:en{g{eantra,eauftra,ranschla,herber},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},hab{c,d},hdresch,verschreck}|5immt:ehmen|5ifft:effen|4ßt:lassen{rb,ran}|5äßt:enlassen{f,d,m}|10fährt:rad fahren|2st:peien|4ist:sein|4ält:alte|0rt:ie|0t:l~2t:en|1t:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,ni,cl}|5ängt:fangen|4ägt:agen{hl,tr}|5irgt:ergen|5ält:halten|5ällt:fallen|5illt:ellen{hw,u}|5iehlt:ehlen|5ilt:elten|7mailt:-mailen|5ilzt:elzen|4ßt:ssen{pre,tre,ä,a}|5äßt:lassen|4ößt:oßen|5äuft:aufen{l,s}|5ilft:elfen|5irft:erfen|4äft:lafen|4äst:blasen|5isst:essen|5ässt:lassen{en,lein,rei}|14schwimmt brust:brustschwimmen|4iest:lesen|6ächst:achsen|6irst:ersten|4ibt:geben|5irbt:erben{st,w,d}|4äbt:graben|11hettoisiert:ettoisieren|5ährt:fahren|5icht:echen{r,t}|6icht:fechten|6ischt:schen{dre,rlö}|6äscht:waschen|4ieht:ehen{s,h}|5ickt:hrecken|5ilkt:melken|4ädt:laden|4ät:raten|4itt:reten|3t:haben|15schwimmt delfin:delfinschwimmen|16schwimmt delphin:delphinschwimmen|5ann:können|9fährt rad:radfahren|5ird:werden|4äd:berladen|5arf:dürfen|4ag:ögen|5uss:müssen|2:sollen|5ill:wollen|5eiß:wissen~1e:t{rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:t{tu,el,er{,ei,sch{it,ät,ä}}}|1en:t{vertu,l{chä,ie,ee,we,ei},filz,löß,maß,spaß,piss,er{i,rei,qu,sch,hw,e}}|3alte:hterhält|1:rentwickelt|4ehmen:nimmt|4effen:rifft|2en:speist{n,s}|3:iert{skristallis,skompliment}|2:tkommerzialisiert|4echten:flicht~1t:auskristallisiere|10fährt:rad fahren|4ist:sein|4ßt:blassen|2t:fehlen,fliesen",
      "firstPlural": "0n:|2n:tuen|10fahren:rad fahren|0ren:ie|0eren:i~0:n|7mailen:-mailen|11hettoisieren:ettoisieren|15schwimmen delfin:delfinschwimmen|16schwimmen delphin:delphinschwimmen|14schwimmen brust:brustschwimmen|9fahren rad:radfahren|3ind:ein~1:n{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|4:ieren{skristallis,skompliment}|3:tkommerzialisieren|1en:vertun~0n:auskristallisiere|10fahren:rad fahren",
      "secondPlural": "0t:,te|1t:n,e|2t:ssen{a{l{bb,en,lein,rei},bf,anf,bp,enp},pre{b,en,zer,i}}|4ßt:enlassen{f,d,m}|10fahrt:rad fahren|0rt:ie|0ert:i~2t:en|1t:en{t,d,n{d,ch,g,k,b,f,p,m},tm,dm,ni,cl}|4ßt:ssen{e,a,ä}|5äuft:islaufen|7mailt:-mailen|14schwimmt brust:brustschwimmen|11hettoisiert:ettoisieren|15schwimmt delfin:delfinschwimmen|16schwimmt delphin:delphinschwimmen|9fahrt rad:radfahren|1d:in~1:hterhaltet,rentwickelt|1e:t{rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:t{tu,el,er{,ei,sch{it,ät,ä}}}|1en:t{vertu,ieß,maß,spaß,el{i,e,w},er{i,rei,qu,sch,hw,e}}|3:iert{skristallis,skompliment}|2:tkommerzialisiert~1t:auskristallisiere|10fahrt:rad fahren|2t:essen{,fr,m}",
      "thirdPlural": "0n:|2n:tuen|10fahren:rad fahren|0ren:ie|0eren:i~0:n|7mailen:-mailen|3len:tümeln|11hettoisieren:ettoisieren|15schwimmen delfin:delfinschwimmen|16schwimmen delphin:delphinschwimmen|14schwimmen brust:brustschwimmen|9fahren rad:radfahren|3ind:ein~1:n{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|4:ieren{skristallis,skompliment}|3:tkommerzialisieren|1en:vertun~0n:auskristallisiere|10fahren:rad fahren"
    },
    "subjunctive1": {
      "first": "0:|1e:n|10fahre:rad fahren|0re:ie|0ere:i|2le:el~1:en,in|3le:eln|7maile:-mailen|1e:celn|11hettoisiere:ettoisieren|14schwimme brust:brustschwimmen|15schwimme delfin:delfinschwimmen|16schwimme delphin:delphinschwimmen|9fahre rad:radfahren~0:e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:e{tu,er{,ei,sch{t,ä}}}|0n:e{vertu,l{l,h,i,o,a,ä,e,u,ü,ö,r,c},er{i,rei,qu,sch{,rt},hw,e}}|2eln:chle|2el:rentwickle|3:iere{skristallis,skompliment}|2:tkommerzialisiere~0:auskristallisiere|10fahre:rad fahren",
      "second": "0st:|10fahrest:rad fahren|3lest:geln{tbü,oo}|1est:un|0rest:ie|0erest:i~1st:n|7mailest:-mailen|3lest:eln{tüm,ßstramp,twand}|11hettoisierest:ettoisieren|14schwimmest brust:brustschwimmen|15schwimmest delfin:delfinschwimmen|16schwimmest delphin:delphinschwimmen|9fahrest rad:radfahren~2:st{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|3n:tuest|2n:vertuest|4eln:glest|5:ierest{skristallis,skompliment}|4:tkommerzialisierest~0st:auskristallisiere|10fahrest:rad fahren|3lest:bügeln",
      "third": "0:|1e:n|10fahre:rad fahren|0re:ie|0ere:i|2le:el~1:en,in|3le:eln|7maile:-mailen|1e:celn|11hettoisiere:ettoisieren|14schwimme brust:brustschwimmen|15schwimme delfin:delfinschwimmen|16schwimme delphin:delphinschwimmen|9fahre rad:radfahren~0:e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}}|1n:e{tu,er{,ei,sch{t,ä}}}|0n:e{vertu,l{l,h,i,o,a,ä,e,u,ü,ö,r,c},er{i,rei,qu,sch{,rt},hw,e}}|2eln:chle|2el:rentwickle|3:iere{skristallis,skompliment}|2:tkommerzialisiere~0:auskristallisiere|10fahre:rad fahren",
      "firstPlural": "0n:|10fahren:rad fahren|1en:in,un|0ren:ie|0eren:i~0:n|7mailen:-mailen|11hettoisieren:ettoisieren|15schwimmen delfin:delfinschwimmen|16schwimmen delphin:delphinschwimmen|2n:tuen|14schwimmen brust:brustschwimmen|9fahren rad:radfahren~1:n{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|2n:tuen,seien|4:ieren{skristallis,skompliment}|3:tkommerzialisieren~0n:auskristallisiere|10fahren:rad fahren|0:tun",
      "secondPlural": "0t:|10fahret:rad fahren|3let:geln{tbü,oo}|1et:in,un|0ret:ie|0eret:i~1t:n|7mailet:-mailen|3let:eln{tüm,ßstramp,twand}|11hettoisieret:ettoisieren|14schwimmet brust:brustschwimmen|15schwimmet delfin:delfinschwimmen|16schwimmet delphin:delphinschwimmen|9fahret rad:radfahren~1:t{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|2n:tuet,seiet|1n:vertuet|3eln:glet|4:ieret{skristallis,skompliment}|3:tkommerzialisieret~0t:auskristallisiere|10fahret:rad fahren|3let:bügeln",
      "thirdPlural": "0n:|10fahren:rad fahren|1en:in,un|0ren:ie|0eren:i~0:n|7mailen:-mailen|11hettoisieren:ettoisieren|15schwimmen delfin:delfinschwimmen|16schwimmen delphin:delphinschwimmen|2n:tuen|14schwimmen brust:brustschwimmen|9fahren rad:radfahren~1:n{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat}}},rentwickel}|2n:tuen,seien|4:ieren{skristallis,skompliment}|3:tkommerzialisieren~0n:auskristallisiere|10fahren:rad fahren|0:tun"
    },
    "subjunctive2": {
      "first": "0erte:|1te:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5itte:abreiten|5äge:fliegen{au,e}|4öge:gen{we,wä}|5änge:abringen|2te:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3äte:tuen|5isse:cheißen|4iefe:lafen|4ßte:lassen{rb,ran}|5öbe:hieben|4ände:stehen{sver,ge}|5annte:ortrennen|5önne:berspinnen|10führe:rad fahren|2äte:un|4ielte:alte|0rte:ie|4ämme:imme|0te:l~2te:en,escheren|1te:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4iete:raten|5ielte:halten|7mailte:-mailen|5älte:gelten|5ölte:helten|5äte:bitten|4äte:reten|5üsste:wissen|6ärste:ersten|11hettoisierte:ettoisieren|5ächte:bringen,denken|5achte:gedenken|3chte:ögen|6öchte:echten{f,l}|5annte:ennen|4ßte:ssen{a,pre,tre,ä}|5itte:en{eid{l,hn},eit{gl,r}}|5ötte:sieden|4ätte:haben|5öte:bieten|5andte:bersenden|5isse:eißen|5össe:ießen|5osse:eschießen|4iese:blasen|5iese:eisen{w,pr}|4äse:esen{l,n}|6üchse:achsen|5äme:ommen|5ähme:ehmen|5ämme:wimmen|5ömme:limmen|4iefe:rufen|5iefe:laufen|5iffe:eifen{gr,n,f,l}|5öffe:fen{sau,rie}|5älfe:elfen|5ärfe:erfen|5äfe:effen|5üfe:haffen|5öge:en{ieh,g{ie{b,fl,w},sau}}|4öge:ügen{l,tr}|5änge:ingen|5inge:fangen|4inge:gehen|4üge:agen{hl,tr}|5iege:eigen{t,hw}|5äge:liegen|5ärge:ergen|5ände:inden{b,f,w}|4ünde:tehen|4üde:laden|5iede:eiden{h,m}|5ürde:werden|5iebe:eiben{bl,r}|4äbe:geben|4übe:graben|4öbe:eben{h,w}|5öbe:tieben|5ärbe:erben{st,w,d}|4ibe:vergraben|5äche:echen{r,t}|6iche:eichen{l,tr,w}|6üsche:waschen|6ösche:dreschen|1:en{rlösch,wör,bär,hill}|6öche:riechen|5öche:hstechen|4ähe:ehen{s,h}|5iehe:eihen|5öhe:liehen|5äße:essen,sitzen|4ieße:oßen|5ieße:lassen,heißen|5öße:mfließen|5ühre:fahren|5öre:en{ier{fr,rl},kies}|4öre:ren{he,gä}|4wäre:sein|4ore:wären|5iele:fallen|5ölle:ellen{hw,u}|5ähle:ehlen|5änne:innen|5iene:heinen|5ölze:elzen|5äke:hrecken|5änke:inken{r,t,s}|5ölke:melken|4iee:eien{hr,p}|14schwömme brust:brustschwimmen|15schwömme delfin:delfinschwimmen|16schwömme delphin:delphinschwimmen|9führe rad:radfahren~2e:te{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|2n:te{el,er,eier}|2en:te{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|5alte:hterhielte|2:rentwickelte|3un:täte|3uen:vertäte|4:ierte{skristallis,skompliment}|3:tkommerzialisierte|4imme:herschwämme|4afen:schliefe|3egen:ewöge|4ehen:ände|3ieben:chöbe|3essen:ausäße|4innen:önne|3acken:üke~1te:auskristallisiere|4öge:erwägen|10führe:rad fahren|5üke:backen|4ßte:blassen|2te:en{fehl,kenn,pinn}|5önne:gewinnen|4ände:überstehen",
      "second": "0ertest:|1test:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5ittest:abreiten|5ägest:fliegen{au,e}|4ögest:gen{we,wä}|5ängest:abringen|2test:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3ätest:tuen|5issest:cheißen|4iefest:lafen|4ßtest:lassen{rb,ran}|5öbest:hieben|4ändest:stehen{sver,ge}|5anntest:ortrennen|10führest:rad fahren|2ätest:un|4ieltest:alte|0rtest:ie|4ämmest:imme|0test:l~2test:en,escheren|1test:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ietest:raten|5ieltest:halten|7mailtest:-mailen|5ältest:gelten|5öltest:helten|5ätest:bitten|4ätest:reten|5üsstest:wissen|6ärstest:ersten|11hettoisiertest:ettoisieren|5ächtest:bringen,denken|5achtest:gedenken|3chtest:ögen|6öchtest:echten{f,l}|5anntest:ennen|4ßtest:ssen{a,pre,tre,ä}|5ittest:en{eid{l,hn},eit{gl,r}}|5öttest:sieden|4ättest:haben|5ötest:bieten|5andtest:bersenden|5issest:eißen|5össest:ießen|5ossest:eschießen|4iesest:blasen|5iesest:eisen{w,pr}|4äsest:esen{l,n}|6üchsest:achsen|5ämest:ommen|5ähmest:ehmen|5ämmest:wimmen|5ömmest:limmen|4iefest:rufen|5iefest:laufen|5iffest:eifen{gr,n,f,l}|5öffest:fen{sau,rie}|5älfest:elfen|5ärfest:erfen|5äfest:effen|5üfest:haffen|5ögest:en{ieh,g{ie{b,fl,w},sau}}|4ögest:ügen{l,tr}|5ängest:ingen|5ingest:fangen|4ingest:gehen|4ügest:agen{hl,tr}|5iegest:eigen{t,hw}|5ägest:liegen|5ärgest:ergen|5ändest:inden{b,f,w}|4ündest:tehen|4üdest:laden|5iedest:eiden{h,m}|5ürdest:werden|5iebest:eiben{bl,r}|4äbest:geben|4übest:graben|4öbest:eben{h,w}|5öbest:tieben|5ärbest:erben{st,w,d}|4ibest:vergraben|5ächest:echen{r,t}|6ichest:eichen{l,tr,w}|6üschest:waschen|6öschest:dreschen|1st:en{rlösch,wör,bär}|6öchest:riechen|5öchest:hstechen|4ähest:ehen{s,h}|5iehest:eihen|5öhest:liehen|5äßest:essen,sitzen|4ießest:oßen|5ießest:lassen,heißen|5ößest:mfließen|5ührest:fahren|5örest:en{ier{fr,rl},kies}|4örest:ren{he,gä}|4orest:wären|5ielest:fallen|5öllest:ellen{hw,u}|5ählest:ehlen|5ännest:innen|5önnest:berspinnen|5ienest:heinen|5ölzest:elzen|5äkest:hrecken|5änkest:inken{r,t,s}|5ölkest:melken|4ieest:eien{hr,p}|14schwömmst brust:brustschwimmen|5ämst:kommen{den,ibe}|5ähmst:nehmen{i,orlieb}|5öbst:eschieben|4wärst:sein|4ähst:tsehen|15schwömmst delfin:delfinschwimmen|16schwömmst delphin:delphinschwimmen|9führest rad:radfahren~4e:test{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|4n:test{el,er,eier}|4en:test{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|7alte:hterhieltest|4:rentwickeltest|5un:tätest|5uen:vertätest|6:iertest{skristallis,skompliment}|5:tkommerzialisiertest|6imme:herschwämmest|6afen:schliefest|5egen:ewögest|6ehen:ändest|5ieben:chöbest|5essen:ausäßest|4acken:ükst|5innen:önnst~1test:auskristallisiere|4ögest:erwägen|10führest:rad fahren|5ükst:backen|4ßtest:blassen|2test:en{fehl,kenn,pinn}|5önnst:gewinnen|4ändest:überstehen",
      "third": "0erte:|1te:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5itte:abreiten|5äge:fliegen{au,e}|4öge:gen{we,wä}|5änge:abringen|2te:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3äte:tuen|5isse:cheißen|4iefe:lafen|4ßte:lassen{rb,ran}|5öbe:hieben|4ände:stehen{sver,ge}|5annte:ortrennen|5önne:berspinnen|10führe:rad fahren|2äte:un|4ielte:alte|0rte:ie|4ämme:imme|0te:l~2te:en,escheren|1te:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4iete:raten|5ielte:halten|7mailte:-mailen|5älte:gelten|5ölte:helten|5äte:bitten|4äte:reten|5üsste:wissen|6ärste:ersten|11hettoisierte:ettoisieren|5ächte:bringen,denken|5achte:gedenken|3chte:ögen|6öchte:echten{f,l}|5annte:ennen|4ßte:ssen{a,pre,tre,ä}|5itte:en{eid{l,hn},eit{gl,r}}|5ötte:sieden|4ätte:haben|5öte:bieten|5andte:bersenden|5isse:eißen|5össe:ießen|5osse:eschießen|4iese:blasen|5iese:eisen{w,pr}|4äse:esen{l,n}|6üchse:achsen|5äme:ommen|5ähme:ehmen|5ämme:wimmen|5ömme:limmen|4iefe:rufen|5iefe:laufen|5iffe:eifen{gr,n,f,l}|5öffe:fen{sau,rie}|5älfe:elfen|5ärfe:erfen|5äfe:effen|5üfe:haffen|5öge:en{ieh,g{ie{b,fl,w},sau}}|4öge:ügen{l,tr}|5änge:ingen|5inge:fangen|4inge:gehen|4üge:agen{hl,tr}|5iege:eigen{t,hw}|5äge:liegen|5ärge:ergen|5ände:inden{b,f,w}|4ünde:tehen|4üde:laden|5iede:eiden{h,m}|5ürde:werden|5iebe:eiben{bl,r}|4äbe:geben|4übe:graben|4öbe:eben{h,w}|5öbe:tieben|5ärbe:erben{st,w,d}|4ibe:vergraben|5äche:echen{r,t}|6iche:eichen{l,tr,w}|6üsche:waschen|6ösche:dreschen|1:en{rlösch,wör,bär}|6öche:riechen|5öche:hstechen|4ähe:ehen{s,h}|5iehe:eihen|5öhe:liehen|5äße:essen,sitzen|4ieße:oßen|5ieße:lassen,heißen|5öße:mfließen|5ühre:fahren|5öre:en{ier{fr,rl},kies}|4öre:ren{he,gä}|4wäre:sein|4ore:wären|5iele:fallen|5ölle:ellen{hw,u}|5ähle:ehlen|5änne:innen|5iene:heinen|5ölze:elzen|5äke:hrecken|5änke:inken{r,t,s}|5ölke:melken|4iee:eien{hr,p}|14schwömme brust:brustschwimmen|15schwömme delfin:delfinschwimmen|16schwömme delphin:delphinschwimmen|9führe rad:radfahren~2e:te{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|2n:te{el,er,eier}|2en:te{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|5alte:hterhielte|2:rentwickelte|3un:täte|3uen:vertäte|4:ierte{skristallis,skompliment}|3:tkommerzialisierte|4imme:herschwämme|4afen:schliefe|3egen:ewöge|4ehen:ände|3ieben:chöbe|3essen:ausäße|4innen:önne|3acken:üke~1te:auskristallisiere|4öge:erwägen|10führe:rad fahren|5üke:backen|4ßte:blassen|2te:en{fehl,kenn,pinn}|5önne:gewinnen|4ände:überstehen",
      "firstPlural": "0erten:|1ten:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5itten:abreiten|5ägen:fliegen{au,e}|4ögen:gen{we,wä}|5ängen:abringen|2ten:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3äten:tuen|5issen:cheißen|4iefen:lafen|4ßten:lassen{rb,ran}|5öben:hieben|4änden:stehen{sver,ge}|5annten:ortrennen|5önnen:berspinnen|10führen:rad fahren|2äten:un|4ielten:alte|0rten:ie|4ämmen:imme|0ten:l~2ten:en,escheren|1ten:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ieten:raten|5ielten:halten|7mailten:-mailen|5älten:gelten|5ölten:helten|5äten:bitten|4äten:reten|5üssten:wissen|6ärsten:ersten|11hettoisierten:ettoisieren|5ächten:bringen,denken|5achten:gedenken|3chten:ögen|6öchten:echten{f,l}|5annten:ennen|4ßten:ssen{a,pre,tre,ä}|5itten:en{eid{l,hn},eit{gl,r}}|5ötten:sieden|4ätten:haben|5öten:bieten|5andten:bersenden|5issen:eißen|5össen:ießen|5ossen:eschießen|4iesen:blasen|5iesen:eisen{w,pr}|4äsen:esen{l,n}|6üchsen:achsen|5ämen:ommen|5ähmen:ehmen|5ämmen:wimmen|5ömmen:limmen|4iefen:rufen|5iefen:laufen|5iffen:eifen{gr,n,f,l}|5öffen:fen{sau,rie}|5älfen:elfen|5ärfen:erfen|5äfen:effen|5üfen:haffen|5ögen:en{ieh,g{ie{b,fl,w},sau}}|4ögen:ügen{l,tr}|5ängen:ingen|5ingen:fangen|4ingen:gehen|4ügen:agen{hl,tr}|5iegen:eigen{t,hw}|5ägen:liegen|5ärgen:ergen|5änden:inden{b,f,w}|4ünden:tehen|4üden:laden|5ieden:eiden{h,m}|5ürden:werden|5ieben:eiben{bl,r}|4äben:geben|4üben:graben|4öben:eben{h,w}|5öben:tieben|5ärben:erben{st,w,d}|4iben:vergraben|5ächen:echen{r,t}|6ichen:eichen{l,tr,w}|6üschen:waschen|6öschen:dreschen|0:en{rlösch,wör,bär}|6öchen:riechen|5öchen:hstechen|4ähen:ehen{s,h}|5iehen:eihen|5öhen:liehen|5äßen:essen,sitzen|4ießen:oßen|5ießen:lassen,heißen|5ößen:mfließen|5ühren:fahren|5ören:en{ier{fr,rl},kies}|4ören:ren{he,gä}|4wären:sein|4oren:wären|5ielen:fallen|5öllen:ellen{hw,u}|5ählen:ehlen|5ännen:innen|5ienen:heinen|5ölzen:elzen|5äken:hrecken|5änken:inken{r,t,s}|5ölken:melken|4ieen:eien{hr,p}|15schwömmen delfin:delfinschwimmen|16schwömmen delphin:delphinschwimmen|14schwömmen brust:brustschwimmen|9führen rad:radfahren~3e:ten{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:ten{el,er,eier}|3en:ten{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|6alte:hterhielten|3:rentwickelten|4un:täten|4uen:vertäten|5:ierten{skristallis,skompliment}|4:tkommerzialisierten|5imme:herschwämmen|5afen:schliefen|4egen:ewögen|5ehen:änden|4ieben:chöben|4essen:ausäßen|5innen:önnen|4acken:üken~1ten:auskristallisiere|4ögen:erwägen|10führen:rad fahren|5üken:backen|4ßten:blassen|2ten:en{fehl,kenn,pinn}|5önnen:gewinnen|4änden:überstehen",
      "secondPlural": "0ertet:|1tet:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5ittet:abreiten|5äget:fliegen{au,e}|4öget:gen{we,wä}|5änget:abringen|2tet:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3ätet:tuen|5isset:cheißen|4iefet:lafen|4ßtet:lassen{rb,ran}|5öbet:hieben|4ändet:stehen{sver,ge}|5anntet:ortrennen|10führet:rad fahren|2ätet:un|4ieltet:alte|0rtet:ie|4ämmet:imme|0tet:l~2tet:en,escheren|1tet:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ietet:raten|5ieltet:halten|7mailtet:-mailen|5ältet:gelten|5öltet:helten|5ätet:bitten|4ätet:reten|5üsstet:wissen|6ärstet:ersten|11hettoisiertet:ettoisieren|5ächtet:bringen,denken|5achtet:gedenken|3chtet:ögen|6öchtet:echten{f,l}|5anntet:ennen|4ßtet:ssen{a,pre,tre,ä}|5ittet:en{eid{l,hn},eit{gl,r}}|5öttet:sieden|4ättet:haben|5ötet:bieten|5andtet:bersenden|5isset:eißen|5össet:ießen|5osset:eschießen|4ieset:blasen|5ieset:eisen{w,pr}|4äset:esen{l,n}|6üchset:achsen|5ämet:ommen|5ähmet:ehmen|5ämmet:wimmen|5ömmet:limmen|4iefet:rufen|5iefet:laufen|5iffet:eifen{gr,n,f,l}|5öffet:fen{sau,rie}|5älfet:elfen|5ärfet:erfen|5äfet:effen|5üfet:haffen|5öget:en{ieh,g{ie{b,fl,w},sau}}|4öget:ügen{l,tr}|5änget:ingen|5inget:fangen|4inget:gehen|4üget:agen{hl,tr}|5ieget:eigen{t,hw}|5äget:liegen|5ärget:ergen|5ändet:inden{b,f,w}|4ündet:tehen|4üdet:laden|5iedet:eiden{h,m}|5ürdet:werden|5iebet:eiben{bl,r}|4äbet:geben|4übet:graben|4öbet:eben{h,w}|5öbet:tieben|5ärbet:erben{st,w,d}|4ibet:vergraben|5ächet:echen{r,t}|6ichet:eichen{l,tr,w}|6üschet:waschen|6öschet:dreschen|1t:en{rlösch,wör,bär}|6öchet:riechen|5öchet:hstechen|4ähet:ehen{s,h}|5iehet:eihen|5öhet:liehen|5äßet:essen,sitzen|4ießet:oßen|5ießet:lassen,heißen|5ößet:mfließen|5ühret:fahren|5öret:en{ier{fr,rl},kies}|4öret:ren{he,gä}|4oret:wären|5ielet:fallen|5öllet:ellen{hw,u}|5ählet:ehlen|5ännet:innen|5önnet:berspinnen|5ienet:heinen|5ölzet:elzen|5äket:hrecken|5änket:inken{r,t,s}|5ölket:melken|4ieet:eien{hr,p}|14schwömmt brust:brustschwimmen|5ämt:kommen{den,ibe}|5ähmt:nehmen{i,orlieb}|5öbt:eschieben|4wärt:sein|4äht:tsehen|15schwömmt delfin:delfinschwimmen|16schwömmt delphin:delphinschwimmen|9führet rad:radfahren~3e:tet{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:tet{el,er,eier}|3en:tet{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|6alte:hterhieltet|3:rentwickeltet|4un:tätet|4uen:vertätet|5:iertet{skristallis,skompliment}|4:tkommerzialisiertet|5imme:herschwämmet|5afen:schliefet|4egen:ewöget|5ehen:ändet|4ieben:chöbet|4essen:ausäßet|3acken:ükt|4innen:önnt~1tet:auskristallisiere|4öget:erwägen|10führet:rad fahren|5ükt:backen|4ßtet:blassen|2tet:en{fehl,kenn,pinn}|5önnt:gewinnen|4ändet:überstehen",
      "thirdPlural": "0erten:|1ten:n{,e{t{eglei,brei,hal{c,bein},ira},leid{k,emit}}},e|5itten:abreiten|5ägen:fliegen{au,e}|4ögen:gen{we,wä}|5ängen:abringen|2ten:en{g{rdin,swin,eantra,eauftra,ranschla,ubsau,herber,flü},weiß,pieß,schaff{b,an,e,ver,g},unfall,rfehl,ss{a{bbl,bf,anf,bp,enp},pre{b,en,zer,i}},schweb,chab,dhab,h{hdresc,nweic,rei,wei},enn{tr,l,p},verschreck}|3äten:tuen|5issen:cheißen|4iefen:lafen|4ßten:lassen{rb,ran}|5öben:hieben|4änden:stehen{sver,ge}|5annten:ortrennen|5önnen:berspinnen|10führen:rad fahren|2äten:un|4ielten:alte|0rten:ie|4ämmen:imme|0ten:l~2ten:en,escheren|1ten:en{t,d,n{d,ch,g,k,b,f,p,m},ni,tm,dm,cl}|4ieten:raten|5ielten:halten|7mailten:-mailen|5älten:gelten|5ölten:helten|5äten:bitten|4äten:reten|5üssten:wissen|6ärsten:ersten|11hettoisierten:ettoisieren|5ächten:bringen,denken|5achten:gedenken,nderbringen|3chten:ögen|6öchten:echten{f,l}|5annten:ennen|4ßten:ssen{a,pre,tre,ä}|5itten:en{eid{l,hn},eit{gl,r}}|5ötten:sieden|4ätten:haben|5öten:bieten|5andten:bersenden|5issen:eißen|5össen:ießen|5ossen:eschießen|4iesen:blasen|5iesen:eisen{w,pr}|4äsen:esen{l,n}|6üchsen:achsen|5ämen:ommen|5ähmen:ehmen|5ämmen:wimmen|5ömmen:limmen|4iefen:rufen|5iefen:laufen|5iffen:eifen{gr,n,f,l}|5öffen:fen{sau,rie}|5älfen:elfen|5ärfen:erfen|5äfen:effen|5üfen:haffen|5ögen:en{ieh,g{ie{b,fl,w},sau}}|4ögen:ügen{l,tr}|5ängen:ingen|5ingen:fangen|4ingen:gehen|4ügen:agen{hl,tr}|5iegen:eigen{t,hw}|5ägen:liegen|5ärgen:ergen|5änden:inden{b,f,w}|4ünden:tehen|4üden:laden|5ieden:eiden{h,m}|5ürden:werden|5ieben:eiben{bl,r}|4äben:geben|4üben:graben|4öben:eben{h,w}|5öben:tieben|5ärben:erben{st,w,d}|4iben:vergraben|5ächen:echen{r,t}|6ichen:eichen{l,tr,w}|6üschen:waschen|6öschen:dreschen|0:en{rlösch,wör,bär}|6öchen:riechen|5öchen:hstechen|4ähen:ehen{s,h}|5iehen:eihen|5öhen:liehen|5äßen:essen,sitzen|4ießen:oßen|5ießen:lassen,heißen|5ößen:mfließen|5ühren:fahren|5ören:en{ier{fr,rl},kies}|4ören:ren{he,gä}|4wären:sein|4oren:wären|5ielen:fallen|5öllen:ellen{hw,u}|5ählen:ehlen|5ännen:innen|5ienen:heinen|5ölzen:elzen|5äken:hrecken|5änken:inken{r,t,s}|5ölken:melken|4ieen:eien{hr,p}|15schwömmen delfin:delfinschwimmen|16schwömmen delphin:delphinschwimmen|14schwömmen brust:brustschwimmen|9führen rad:radfahren~3e:ten{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur},enschrumpf}|3n:ten{el,er,eier}|3en:ten{el{i,chi,e,w},er{i,rei,qu,hw,e},ann{p,b,m},maß,spaß}|6alte:hterhielten|3:rentwickelten|4un:täten|4uen:vertäten|5:ierten{skristallis,skompliment}|4:tkommerzialisierten|5imme:herschwämmen|5afen:schliefen|4egen:ewögen|5ehen:änden|4ieben:chöben|4essen:ausäßen|5innen:önnen|4acken:üken~1ten:auskristallisiere|4ögen:erwägen|10führen:rad fahren|5üken:backen|4ßten:blassen|2ten:en{fehl,kenn,pinn}|5önnen:gewinnen|4änden:überstehen"
    },
    "imperative": {
      "singular": "0:|1e:n|1:en{herberg,l{fal{m,ge,ber,n},rfeh},ss{la{b,n,ber,i},pre,tre},hdresch,bertret,verschreck,rtreff}|2:en{sitz,ss{enla{h,g},mi},ch{tko,ma{tt,sig,h,z,d,ß}},derschreib,slauf,lax}|13lerne:kennen lernen|10fahre:rad fahren|0re:ie~1:en,in|3le:eln|7maile:-mailen|1e:eln{twand,tbüg,c}|4iehe:tsehen|11hettoisiere:ettoisieren|6gefallen:fallen|15schwimm delfin:delfinschwimmen|16schwimm delphin:delphinschwimmen|4ib:geben|5irb:erben{w,st,d}|5ilf:elfen|5iff:effen|5irf:erfen|4ß:lassen|5imm:ehmen|5ilz:elzen|5ich:echen{r,t}|6ich:echten{l,f}|6isch:schen{rlö,dre}|4ieh:ehen{s,h}|5iehl:ehlen|5ill:ellen{u,hw}|4itt:reten|14schwimm brust:brustschwimmen|5ilt:helten|5ick:hrecken|5ilk:melken|9fahre rad:radfahren|5irg:ergen|4ies:lesen|5iss:essen~0en:|1n:e{tu,er{,sch{t,ä},ei}}|0n:e{vertu,l{l,i,h,a,e,o,u,r,ö,ä,ü,c},er{qu,sch,i,rei,e,hw}}|2eln:chle|0:isiere{tbürokrat,al{tkoloni,tkommun,tkrimin,ution}}|2:tkommerzialisiere|4echten:icht~10fahre:rad fahren|4ß:blassen|1:len{fal,feh}|6icht:echten{f,fl}|2:gerieren",
      "plural": "0rt:|1t:n,re|2t:en{ass{l{bb,en,in,i},bf,nf,bp,np},bfind,nwend,ihalt}|4ßt:ressen{rf,t}|10fahrt:rad fahren~2t:en|7mailt:-mailen|14schwimmt brust:brustschwimmen|11hettoisiert:ettoisieren|1t:en{t,d,ni,n{ch,f,g,d,k,b,p,m},tm,dm,cl}|4ßt:ssen{a,rme,ge,ä}|15schwimmt delfin:delfinschwimmen|16schwimmt delphin:delphinschwimmen|9fahrt rad:radfahren|1d:in~1n:t{tu,el,er{,sch{t,ä},ei}}|1en:t{vertu,el{i,e,w},er{qu,sch,i,rei,e,hw},spaß,maß}|1e:isiert{tbürokrat,al{tkoloni,tkommun,tkrimin,ution}}|2:tkommerzialisiert|2ssen:reßt~4ßt:pressen{,er}|10fahrt:rad fahren"
    },
    "presentParticiple": {
      "presentParticiple": "0nd:|1end:in,un|0erend:i~0d:n|9 schwimmend:schwimmen{st,fin,phin}|12schämend:fremdschämen|7mailend:-mailen|8sackend:absacken|11hettoisierend:ettoisieren~2:nd{e{hterhalt,rvereinig,herschwimm,enschrumpf,ier{hstruktur,is{al{tkoloni,tkommun,tkrimin},tbürokrat}}},rentwickel}|3n:end{tu,sei}|1:vertuend|5:ierend{skristallis,skompliment}~0nd:auskristallisiere"
    },
    "pastParticiple": {
      "pastParticiple": "0ert:|1t:n{,e{t{ei{arb{e,er},egl,verl,gel,rbr,er},al{rsch,beinh,tf},rmie,rnie,rkne,t{rki,sta{e,r},rke,tfe,rschü,hro},s{rlei,rli,tmi,erü,trü,la{e,t,r},rdun,o{rk,tr,rr,fr},rtrö},ch{i{rd,rpfl,el,ber,err,tr,esch},eleu,efeu,rzü},lüf{e,t},r{rhä,thä,rwa,ta,we{e,t,r}},u{thä,rla,ede,rbe,rm,rchbl,rbl},rkan,rheira,rlö,rkno},d{ssbil,rmel,n{rfei,rble,ewe,hwe,rru,tzü},lei{ek,tk,rk,emit},re{e,zer,ber,b}},gn{rre,tei,rei}},el{t{rbet,rzet,rrüt,rschach,rwurs},k{rbröc,twic,rwic,rdun,rwin,rschau},s{rdros,rwech,rdrö,epin},d{n{a{h{ss,e,ver,c},rw},erschwi},rbud,sie{e,r}},p{rhas,tkop,tkup,rkup,zertram},b{rsä,rmö,drib,eju,verju},z{wur{nt,r},zermet},g{ie{tr,rr,tsp},rna,rprü},eträuf,ch{elä,tsta,rka},chimm,rsamm},er{t{t{tblä,rfü,zerschme,rspli,rgi,ewi,rfu},rkleis,rhei},d{rglie,rfor,eschil,rplau,tpu,rschleu,terwan,rän,rwi},u{e{ef,rf,rsch,est,rst},a{ed,rd,el,rm},rsä},b{zau{e,t,ver},hstö},rgaun,rdonn,rplapp,g{ela,rla,rhun,rär},f{lie{e,r},rei},ch{i{ts,rs,ns,ere},räu{h,r}},mm{kla{nt,r,m},tschlu},s{bes{r,m},rfa},rkell,rball}},e|8gearbeitet:terarbeiten|6geritten:abreiten|0:en{t{al{h{be,nt,er{v,r,k,t}},rsp},tre{be,ver,zer},ra{verb,e,r,s}},ag{etr,vertr,schl{at,ver,zer,e}},hau{e,ver,zer},rsalz,rheiß,verstoß,f{u{er,derr,la{e,er{v,nt,z,b},nt}},schla{t,r}},l{fal{ss,e,ver,zer,nt},rmah},lad{e,t,er},s{zerbla,s{la{e,nt,r},rfre,rme,rge},erle,ne,wach{e,r}},b{ge{um,e,ver,ber},gra{e,r}},eh{ers{s,v,b},h},fahr{e,ver,der,rch}}|5oten:ebieten|6gebeten:herbitten|7gerichtet:herrichten|6geachtet:achten{g,h}|5egiftet:ngiften|12gewirtschaftet:bwirtschaften|6gehaftet:nhaften|5geraten:raten|5gehütet:nhüten|2t:en{g{efol,verfol,rtil,e{ekri,erl,rpfl,bel,rr},n{rdi,ä{edr,erdr,verh,eh},rla,ela,e{r,rspr,ranstr,verm}},i{erne,rzwe,rge,rkünd,ewill},a{r{ef,rf,eant,eauft,er},verj,rn,s{e,nt,ver,nter},ranschl},rsä,rwür,verfü,zerpflü},u{a{eb,erb,sch{e,rch},rst,tr{r,e,s},zerk,rs},e{r{st{e,ver,zer},rf},bsch}},z{ei{rr,eh,rh},t{i{spr{e,r},rsp,rschw},se{be,er{id,v,z,küb}},eglo,rkra,rpla,rschwa,enu,rpu,rschä,rstü,eschü},n{egre,a{pfl{e,r},fr,rsch}},thol,r{stü{e,ber},hme}},rschweiß,rbüß,m{m{ekle,verkle,rschwe,tsta,tfla,hra,sti{e,r}},rfil,r{erfo,eschi,mschwä,erwä},mrah,rträu,rsäu,strö{t,h},ezie,lei{sch{t,r},r}},f{rkau,rschnau,p{m{rda,zersta,ekä,rtru,eschi,li},rsto,rschö,rru,etu,rzu,rza,rknü,tschlü},ei{hstr,er,rst},f{a{sch{e,ver},rschl,eg},schi{r,m}},estra,rprü},l{l{e{st{e,nt,ver},tp,rd},a{unf,rkn,esch,rsch,verh},rfü,rknü,berro},h{a{ez,rz,str{e,r}},rkü,rwü,erwä,erzä,rko,rfe},ei{rch,rh,rt,ent,rk,e,w},erho{wied,b},ema,rma,rscha,rfau,rbeu,rspü},s{rgla,s{a{rbl,ranl,ef,rf,mf,rp},rpre},hbrau,rbrem,rlö,rmurk,rknack,ei{er,verr,rsp,tgl,t},rfran},b{fär{ent,r},reb,e{l{ek,rk,e,er,rch},rsi,erstr},au{rschr,er,tst,rst},rbom,o{rpr,tl,rl,el},rü,etrü},h{ü{rbl,rgl,rbr,espr,rspr,em},c{rsie,u{rb,es,ers,rsta,bra,rsche},rda,rfla,verma,s{u{tra,rra,rta,ttä},i{rw,ntw,rfr,verm},rfäl,t{ekla,rla,rqua,rru,tflu,rque},rfor,eherr,wün{lück,r}},rei{rab,e},ehor,eko,zerko},rdre,rwe,hmä,rnä,rspä,edro,eru},n{ertren,pen,die{e,r},h{rsö,rde,rma,rza,bewo,rwo},rtö,mzäu,ewei,rler,tker,rpla},k{n{eta,e{rs,rr,sch{e,r}}},c{e{ed,td,rd,rschr,rst},edru,ndru,espu,rü{ed,rd,rb,t,ver},a{rh,ep,tp,rp},rbli,rschi},r{eme,erme,ewi,rwi,tko},rwel},r{h{ü{ntf,verf,lf,er,verr},e{ek,verk,rw,rz},rchbo,erbo,ewä,rwä},e{schmi{e,r},tle},ehö,rhö,rklä,r{tschwi,rspe,rsta,rscha},rschnü,rspü,rspa},pp{rka,verschle,rti},rschnei}|5ogen:iegen{erb{v,z},fl{ver,ber,h,nt},erw}|6gelegen:fliegen{au,e}|5egen:terliegen|5gelegt:erlegen{rüb,h,ed,u}|6gerungen:abringen|5acht:bringen{ver,ber,l}|5ungen:ingen{r{sp{ver,zer,nt},rchd},l,verkl,rschl,es}|6gelangt:erlangen{h,b}|8gebilligt:ubilligen|5geragt:ufragen|6geklagt:nklagen|5gefugt:sfugen|5gewogen:wägen|4ogen:rwägen|6gesorgt:orsorgen|7geflaggt:sflaggen|6gekürzt:bkürzen|5issen:eißen{rb,ntr,verr,zerr,esch,rschm}|5ossen:ießen{l{zerf,verf,mf,sch{e,t,r}},eg,verg,sch{zer,ver,e}}|5ommen:nehmen{e,nt,ver,ber}|5geahmt:hahmen|6geräumt:orträumen|6geziemt:ziemen|5gesamt:ansamen|7geschämt:schämen|8gekrampft:nkrampfen|5iffen:eifen{gr{e,rer,ver},rkn,rpf}|8geschärft:nschärfen|6gehellt:fhellen|6gehüllt:nhüllen|6gezählt:berzählen|6gesohlt:nsohlen|5ohlen:estehlen|5geeilt:eilen{ch,fort,ck}|8geurteilt:burteilen|8geschuldet:mschulden|5unden:inden{tb,erb,ef,pf,rsch,w{sch{t,r},er}}|4geödet:nöden|6gelassen:derlassen|6gereist:ckreisen|5gelost:slosen|5ieben:eiben{verbl,r{sch{e,ver},et,ert,r}}|7getrieben:hertreiben|4oben:heben{ver,e,t}|6geliebt:derlieben|5gelobt:loben|7gebrochen:derbrechen|8gebraucht:fbrauchen|6gedacht:dachen|7geflacht:bflachen|6gefacht:anfachen|6gewacht:fwachen|6ichen:eichen{l{eg,rg,sch{e,nt},erb},rstr,tw}|4angen:gehen{er{int,v,z},nt}|6gestanden:erstehen{int,b,e}|4anden:gestehen|6gezogen:erziehen{h,b,nunt}|6geliehen:leihen{s,her}|5annt:rennen{verb,tb,ver,ber}|6gerannt:rtrennen|6gekannt:skennen|5onnen:innen{bersp,tr,rr,er}|6gesonnen:hsinnen|6geronnen:rinnen|5ienen:escheinen|6gewarnt:orwarnen|6gedankt:bdanken|9geschränkt:nschränken|6geweckt:fwecken|7gedrückt:runterdrücken|5oren:efrieren|6geziert:uszieren|5gehört:herhören|8geschworen:schwären|5geirrt:herirren|6gezerrt:rtzerren|6geharrt:orharren|10geschlüsselt:fschlüsseln|6genebelt:nnebeln|8gezweifelt:nzweifeln|7gewittert:wittern|8geflattert:herflattern|0n:te|0rt:ie|8geschwommen:schwimme|9geschrumpft:schrumpfe|0t:l~2t:en{,iel{sp{e,er,m},rz},escher,spann{e,t,er}}|1t:n{e{t,d,n{verord,ch{ere,erre,zei{e,er}},g,rtrock,f,m},eatm,ekni,cl},hleier}|8gearbeitet:arbeiten|6geleitet:leiten|7gebreitet:breiten|6geweitet:weiten|5gebetet:beten|6gemietet:mieten|6genietet:nieten|6geknetet:kneten|7gebürstet:bürsten|7gedürstet:dürsten|7geforstet:forsten|7geleistet:leisten|6gelistet:listen|6gemistet:misten|6genistet:nisten|6gerüstet:rüsten|6getastet:tasten|6gelastet:lasten|6gerastet:rasten|6gefastet:fasten|6gehastet:hasten|7getoastet:toasten|5geästet:ästen|6gemästet:mästen|6getestet:testen|7gedunstet:dunsten|6gehustet:husten|6gepustet:pusten|7gefaustet:fausten|7gefrustet:frusten|7geprustet:prusten|6gekostet:kosten|6gerostet:rosten|7geprostet:prosten|6gepostet:posten|7getröstet:trösten|6geröstet:rösten|7gedichtet:dichten|7gelichtet:lichten|9gepflichtet:pflichten|7gerichtet:richten|9geschichtet:schichten|8gebeichtet:beichten|7gesichtet:sichten|8gefluchtet:fluchten|8geleuchtet:leuchten|8gefeuchtet:feuchten|7gebuchtet:buchten|7gewuchtet:wuchten|10geschlachtet:schlachten|10geschmachtet:schmachten|9geschachtet:schachten|11geweihnachtet:weihnachten|7gezüchtet:züchten|8geflüchtet:flüchten|7gehechtet:hechten|8geknechtet:knechten|6geächtet:ächten|7gedriftet:driften|7gestiftet:stiften|6geliftet:liften|6geheftet:heften|8geschuftet:schuften|12gekundschaftet:kundschaften|6gelüftet:lüften|6gehärtet:härten|6gekartet:karten|6gewartet:warten|5geartet:arten|7gestartet:starten|6gewertet:werten|5egurtet:urten|7gespurtet:spurten|6gehortet:horten|6gehäutet:häuten|6geläutet:läuten|6gelautet:lauten|6gedeutet:deuten|6gebeutet:beuten|5gemutet:muten|6geblutet:bluten|6gesputet:sputen|5getutet:tuten|6gekantet:kanten|6geerntet:ernten|8gesprintet:sprinten|8geschaltet:schalten|6gefaltet:falten|6gezeltet:zelten|7gestattet:statten|6gekettet:ketten|6gebettet:betten|6gefettet:fetten|6gerettet:retten|8geschüttet:schütten|6gerottet:rotten|7getrottet:trotten|6gemottet:motten|7geplottet:plotten|6gekittet:kitten|6eglättet:lätten|7geplättet:plätten|6geputtet:putten|5getötet:töten|5gelötet:löten|6geflötet:flöten|6gebrütet:brüten|5getütet:tüten|5gewütet:wüten|6geknotet:knoten|6gebootet:booten|5gelotet:loten|8geheiratet:heiraten|5gewatet:waten|6geskatet:skaten|5gejätet:jäten|7gepunktet:punkten|6getextet:texten|6gebildet:bilden|6gemeldet:melden|7geblendet:blenden|7gespendet:spenden|6gerindet:rinden|7gefeindet:feinden|6gerundet:runden|8gefreundet:freunden|7gestundet:stunden|6gezündet:zünden|6gemündet:münden|8geschändet:schänden|6gelandet:landen|7gebrandet:branden|8gestrandet:stranden|6geahndet:ahnden|7gefahndet:fahnden|5gerodet:roden|6geweidet:weiden|7gekleidet:kleiden|7gekreidet:kreiden|5geredet:reden|10gebauchredet:bauchreden|9geschmiedet:schmieden|6gebürdet:bürden|6genordet:norden|5geerdet:erden|5gebadet:baden|6geloadet:loaden|6getradet:traden|5egradet:raden|6geordnet:ordnen|7gerechnet:rechnen|8gezeichnet:zeichnen|12gekennzeichnet:kennzeichnen|6gesegnet:segnen|6geregnet:regnen|6geeignet:eignen|8getrocknet:trocknen|5geebnet:ebnen|7gewappnet:wappnen|5geatmet:atmen|6gewidmet:widmen|5gekniet:knien|6gebalgt:balgen|6gefolgt:folgen|6getilgt:tilgen|9geschwelgt:schwelgen|7gedrängt:drängen|7gezwängt:zwängen|6gesengt:sengen|8gesprengt:sprengen|8gestrengt:strengen|6gemengt:mengen|5geengt:engen|6gelangt:langen|6gebangt:bangen|7geprangt:prangen|6gedüngt:düngen|5egongt:ongen|8gefertigt:fertigen|13gerechtfertigt:rechtfertigen|9genächtigt:nächtigen|9gezüchtigt:züchtigen|9gedemütigt:demütigen|6geneigt:neigen|7gezweigt:zweigen|6gezeigt:zeigen|4geigt:eigen|9geohrfeigt:ohrfeigen|8gekündigt:kündigen|8gehändigt:händigen|8gebändigt:bändigen|8gewürdigt:würdigen|8gepredigt:predigen|8gepeinigt:peinigen|9gesteinigt:steinigen|8gewilligt:willigen|7gemäßigt:mäßigen|6gefragt:fragen|5geragt:ragen|5gejagt:jagen|5genagt:nagen|7gemanagt:managen|5gesagt:sagen|6geplagt:plagen|5gewagt:wagen|7gekriegt:kriegen|9geschmiegt:schmiegen|5gelegt:legen|7gepflegt:pflegen|5geregt:regen|5gefegt:fegen|5gehegt:hegen|6gesaugt:saugen|11gestaubsaugt:staubsaugen|6gelaugt:laugen|6getaugt:taugen|6gebeugt:beugen|5gelugt:lugen|8geschrägt:schrägen|6geprägt:prägen|5gesägt:sägen|6gewürgt:würgen|6geborgt:borgen|6gesargt:sargen|5gefügt:fügen|7gepflügt:pflügen|6gejoggt:joggen|6geloggt:loggen|7geröntgt:röntgen|5gebaut:bauen|6geflaut:flauen|7geschaut:schauen|5getaut:tauen|6gestaut:stauen|6getraut:trauen|5geraut:rauen|6gebraut:brauen|5gekaut:kauen|5gesaut:sauen|7gestreut:streuen|6gefreut:freuen|6gebleut:bleuen|7gescheut:scheuen|6gebläut:bläuen|5gekäut:käuen|6gebeizt:beizen|8gespreizt:spreizen|6gereizt:reizen|6geheizt:heizen|4geizt:izen|7geblitzt:blitzen|9geschlitzt:schlitzen|7geflitzt:flitzen|8gespritzt:spritzen|6geritzt:ritzen|7gespitzt:spitzen|9geschwitzt:schwitzen|9geschnitzt:schnitzen|6gehetzt:hetzen|6gesetzt:setzen|6gewetzt:wetzen|6gekotzt:kotzen|7getrotzt:trotzen|8gestrotzt:strotzen|7geprotzt:protzen|6eglotzt:lotzen|7geklotzt:klotzen|6gemotzt:motzen|7gekratzt:kratzen|6geratzt:ratzen|7geplatzt:platzen|9geschmatzt:schmatzen|9geschwatzt:schwatzen|6genutzt:nutzen|6geputzt:putzen|7gestutzt:stutzen|8geschätzt:schätzen|5geätzt:ätzen|7gestützt:stützen|8geschützt:schützen|6egrenzt:renzen|9gefaulenzt:faulenzen|9geschlenzt:schlenzen|6getanzt:tanzen|7gestanzt:stanzen|8gepflanzt:pflanzen|6geranzt:ranzen|8geschanzt:schanzen|6eglänzt:länzen|7gekränzt:kränzen|9geschwänzt:schwänzen|6egrunzt:runzen|6gemünzt:münzen|6geholzt:holzen|6gebolzt:bolzen|6gewälzt:wälzen|6gewalzt:walzen|6gebalzt:balzen|6gefalzt:falzen|9geschnalzt:schnalzen|6gesülzt:sülzen|7gestürzt:stürzen|6gewürzt:würzen|9geschwärzt:schwärzen|6gemerzt:merzen|6gefurzt:furzen|6geharzt:harzen|7geknarzt:knarzen|7gequarzt:quarzen|7gekreuzt:kreuzen|9geschneuzt:schneuzen|9geschnauzt:schnauzen|9geschnäuzt:schnäuzen|5geduzt:duzen|8gejauchzt:jauchzen|10geschluchzt:schluchzen|7gejuchzt:juchzen|8gekrächzt:krächzen|6geächzt:ächzen|7geseufzt:seufzen|6gefläzt:fläzen|6gesiezt:siezen|7getriezt:triezen|7gestellt:stellen|6gepellt:pellen|9geschwellt:schwellen|6gewellt:wellen|7gequellt:quellen|9geschnellt:schnellen|6gedellt:dellen|6gebellt:bellen|6gefüllt:füllen|7gebrüllt:brüllen|7geknüllt:knüllen|7geknallt:knallen|9geschnallt:schnallen|7geprallt:prallen|7gekrallt:krallen|6gewallt:wallen|8geschallt:schallen|6gehallt:hallen|6geballt:ballen|6gelallt:lallen|6gerollt:rollen|7getrollt:trollen|9geschmollt:schmollen|6gesollt:sollen|6getollt:tollen|6gewollt:wollen|7gestillt:stillen|7gedrillt:drillen|6egrillt:rillen|7gechillt:chillen|6gekillt:killen|6gefällt:fällen|6gelullt:lullen|6genullt:nullen|8gestrullt:strullen|7gebettelt:betteln|7gezettelt:zetteln|7gesattelt:satteln|9geschüttelt:schütteln|7gerüttelt:rütteln|8gedrittelt:dritteln|7gebeutelt:beuteln|7gedeutelt:deuteln|10geschachtelt:schachteln|8gefuchtelt:fuchteln|8gewichtelt:wichteln|7getüftelt:tüfteln|8gewurstelt:wursteln|7gebastelt:basteln|8gefröstelt:frösteln|7genestelt:nesteln|7gemörtelt:mörteln|7geturtelt:turteln|8geviertelt:vierteln|8gebröckelt:bröckeln|7gewickelt:wickeln|7geruckelt:ruckeln|9geschuckelt:schuckeln|7gedunkelt:dunkeln|7gefunkelt:funkeln|7gemunkelt:munkeln|9geschunkelt:schunkeln|7gewinkelt:winkeln|7gepinkelt:pinkeln|6getakelt:takeln|7gezirkelt:zirkeln|7geferkelt:ferkeln|7gewerkelt:werkeln|7getorkelt:torkeln|5geekelt:ekeln|9geschaukelt:schaukeln|6egaukelt:aukeln|6gepökelt:pökeln|6gehäkelt:häkeln|6gemäkelt:mäkeln|6geräkelt:räkeln|8gedrosselt:drosseln|7gerasselt:rasseln|8geprasselt:prasseln|8gequasselt:quasseln|7gekesselt:kesseln|7gefusselt:fusseln|7genässelt:nässeln|7gekapselt:kapseln|8gestöpselt:stöpseln|10geschnipselt:schnipseln|8gewechselt:wechseln|9gedeichselt:deichseln|7gesäuselt:säuseln|6egruselt:ruseln|9gestreuselt:streuseln|6gewuselt:wuseln|7gedröselt:dröseln|7gerieselt:rieseln|7genieselt:nieseln|7gepinselt:pinseln|7gewinselt:winseln|7gehänselt:hänseln|6gefaselt:faseln|7gekriselt:kriseln|6genäselt:näseln|7gehandelt:handeln|7gewandelt:wandeln|11gelustwandelt:lustwandeln|13geschlafwandelt:schlafwandeln|12getraumwandelt:traumwandeln|7gebandelt:bandeln|10geschwindelt:schwindeln|7gependelt:pendeln|7gebündelt:bündeln|7gezündelt:zündeln|6egondelt:ondeln|7getrudelt:trudeln|8gestrudelt:strudeln|8gesprudelt:sprudeln|6gedudelt:dudeln|6genudelt:nudeln|7gepaddelt:paddeln|7gebuddelt:buddeln|10geschmuddelt:schmuddeln|7gesiedelt:siedeln|7gefiedelt:fiedeln|6gewedelt:wedeln|6gefädelt:fädeln|6gemodelt:modeln|7gebrodelt:brodeln|6gerodelt:rodeln|6gejodelt:jodeln|7geblödelt:blödeln|5geadelt:adeln|6geradelt:radeln|6getadelt:tadeln|8gefremdelt:fremdeln|7gehaspelt:haspeln|7geraspelt:raspeln|7gelispelt:lispeln|7gekoppelt:koppeln|7gehoppelt:hoppeln|8gestoppelt:stoppeln|7gekuppelt:kuppeln|7gezappelt:zappeln|7gerappelt:rappeln|7gepäppelt:päppeln|8geknüppelt:knüppeln|7getippelt:tippeln|8getrippelt:trippeln|8gestempelt:stempeln|7gerempelt:rempeln|8gekrempelt:krempeln|9gestrampelt:strampeln|8getrampelt:trampeln|7gehampelt:hampeln|7gedümpelt:dümpeln|7gestapelt:stapeln|7egraupelt:raupeln|6gepopelt:popeln|6gehobelt:hobeln|7geknobelt:knobeln|6genabelt:nabeln|5egabelt:gabeln|6gesäbelt:säbeln|9geschwäbelt:schwäbeln|7gekurbelt:kurbeln|7gewirbelt:wirbeln|8gezwirbelt:zwirbeln|6gepöbelt:pöbeln|6gemöbelt:möbeln|7geribbelt:ribbeln|8gekribbelt:kribbeln|8gebrabbelt:brabbeln|8gekrabbelt:krabbeln|7gesabbelt:sabbeln|10geschwabbelt:schwabbeln|7gewabbelt:wabbeln|7gerubbelt:rubbeln|6gejubelt:jubeln|7gedoubelt:doubeln|7geknebelt:knebeln|8gezwiebelt:zwiebeln|6egrübelt:grübeln|6gedübelt:dübeln|6gekübelt:kübeln|7gekanzelt:kanzeln|8geblinzelt:blinzeln|7gerunzelt:runzeln|7getänzelt:tänzeln|7gewurzelt:wurzeln|7gepurzelt:purzeln|8gekritzelt:kritzeln|7gekitzelt:kitzeln|7gewitzelt:witzeln|7gemetzelt:metzeln|8gebrutzelt:brutzeln|8gefrotzelt:frotzeln|7geriegelt:riegeln|9gestriegelt:striegeln|8gespiegelt:spiegeln|7gewiegelt:wiegeln|6gekegelt:kegeln|7geflegelt:flegeln|6geregelt:regeln|8geklingelt:klingeln|7geringelt:ringeln|8gekringelt:kringeln|7getingelt:tingeln|10geschlängelt:schlängeln|8gedrängelt:drängeln|6egängelt:gängeln|7gezüngelt:züngeln|6geangelt:angeln|7gehangelt:hangeln|7gemangelt:mangeln|7gekungelt:kungeln|8gequengelt:quengeln|6genagelt:nageln|6gebügelt:bügeln|7geklügelt:klügeln|7geprügelt:prügeln|6gezügelt:zügeln|6gekugelt:kugeln|10geliebäugelt:liebäugeln|10geschmuggelt:schmuggeln|5geigelt:igeln|6egoogelt:oogeln|6gemogelt:mogeln|6egurgelt:urgeln|7genörgelt:nörgeln|6georgelt:orgeln|10geschmirgelt:schmirgeln|6gevögelt:vögeln|7geriffelt:riffeln|7gelöffelt:löffeln|7gebüffelt:büffeln|7gesüffelt:süffeln|7gemuffelt:muffeln|9gescheffelt:scheffeln|8gestaffelt:staffeln|8geträufelt:träufeln|9geschaufelt:schaufeln|9geschwefelt:schwefeln|8gestiefelt:stiefeln|6egipfelt:ipfeln|8getröpfelt:tröpfeln|9geschwafelt:schwafeln|7gewürfelt:würfeln|11geschmeichelt:schmeicheln|10gestreichelt:streicheln|7gepichelt:picheln|8gestichelt:sticheln|7gelächelt:lächeln|7gefächelt:fächeln|8gestachelt:stacheln|7gekachelt:kacheln|7gehechelt:hecheln|9getätschelt:tätscheln|9gewatschelt:watscheln|8gekuschelt:kuscheln|9gemauschelt:mauscheln|8genuschelt:nuscheln|8getuschelt:tuscheln|8geraschelt:rascheln|8geheuchelt:heucheln|10gestrauchelt:straucheln|7geröchelt:röcheln|11geschnorchelt:schnorcheln|7gespielt:spielen|7gestielt:stielen|6gezielt:zielen|8geschielt:schielen|7gewimmelt:wimmeln|7gehimmelt:himmeln|7gebimmelt:bimmeln|7gesammelt:sammeln|8gestammelt:stammeln|7egrummelt:rummeln|9geschummelt:schummeln|7getummelt:tummeln|7gemümmelt:mümmeln|7gelümmelt:lümmeln|8getrommelt:trommeln|7geheimelt:heimeln|11gealtertümelt:altertümeln|7getaumelt:taumeln|7gebaumelt:baumeln|6gedamelt:dameln|7gemurmelt:murmeln|7gemeißelt:meißeln|5geißelt:ißeln|7gefrevelt:freveln|8geschwelt:schwelen|6geähnelt:ähneln|6gezahlt:zahlen|8gestrahlt:strahlen|7geprahlt:prahlen|6gekühlt:kühlen|6gefühlt:fühlen|6gewühlt:wühlen|6gewählt:wählen|6gezählt:zählen|6gekohlt:kohlen|6gejohlt:johlen|6gehöhlt:höhlen|6gebuhlt:buhlen|6gesuhlt:suhlen|6gefeilt:feilen|6geheilt:heilen|6geseilt:seilen|6geteilt:teilen|10gevierteilt:vierteilen|6gekeilt:keilen|6gepeilt:peilen|4geilt:geilen|5geeilt:eilen|10gelangweilt:langweilen|8geemailt:e-mailen|5geholt:holen|5gepolt:polen|5gemalt:malen|7geschalt:schalen|5geaalt:aalen|6gequält:quälen|7geschält:schälen|6gespult:spulen|5gepult:pulen|6gefault:faulen|7gekrault:kraulen|6gejault:jaulen|6gemault:maulen|6gebeult:beulen|6geheult:heulen|7geschult:schulen|6gefoult:foulen|6gespült:spülen|4geölt:ölen|5egrölt:rölen|6geperlt:perlen|7geblasst:bblassen|6gefasst:fassen|6gepasst:passen|6gehasst:hassen|6geküsst:küssen|7gepresst:pressen|8gestresst:stressen|6gemusst:müssen|6gewusst:wissen|7gebraust:brausen|6egraust:rausen|7gekraust:krausen|6gesaust:sausen|6gepaust:pausen|9geschleust:schleusen|8geschmust:schmusen|7gebremst:bremsen|7geheimst:heimsen|6gebimst:bimsen|6gebumst:bumsen|5egrast:grasen|5gerast:rasen|5eglast:lasen|7geknapst:knapsen|6gejapst:japsen|6getapst:tapsen|7getrapst:trapsen|7geknipst:knipsen|5egipst:ipsen|8geplumpst:plumpsen|6gehopst:hopsen|6gemopst:mopsen|7gepiepst:piepsen|7gerülpst:rülpsen|5gelöst:lösen|5gedöst:dösen|7gemurkst:murksen|8geknackst:knacksen|8getrickst:tricksen|8geknickst:knicksen|8gedruckst:drucksen|7egluckst:lucksen|7gemuckst:mucksen|6gekokst:koksen|6gereist:reisen|7gekreist:kreisen|7gespeist:speisen|6egleist:leisen|5geeist:eisen|6egrinst:rinsen|7gefranst:fransen|6gehalst:halsen|6gehülst:hülsen|5gedost:dosen|5getost:tosen|7gebrowst:browsen|5gedüst:düsen|7gefliest:fliesen|6geniest:niesen|5gepest:pesen|6gefräst:fräsen|6gelotst:lotsen|6gemorst:morsen|6geparst:parsen|8geschubst:schubsen|8geblättert:blättern|7gefüttert:füttern|10geschmettert:schmettern|8geklettert:klettern|7gewettert:wettern|9gesplittert:splittern|8geflittert:flittern|10geschlittert:schlittern|7gezittert:zittern|6egittert:gittern|8getwittert:twittern|8gestottert:stottern|10geschlottert:schlottern|9geschottert:schottern|7gefuttert:futtern|7gebuttert:buttern|8geknattert:knattern|10geschnattert:schnattern|7gerattert:rattern|8gehalftert:halftern|7gemustert:mustern|8geplustert:plustern|9geschustert:schustern|8gepolstert:polstern|8geflüstert:flüstern|9gekleistert:kleistern|8gemeistert:meistern|8geknistert:knistern|8gehamstert:hamstern|7gelästert:lästern|7gerastert:rastern|7geheitert:heitern|9gescheitert:scheitern|7gemuntert:muntern|6geentert:entern|7gekentert:kentern|7gekontert:kontern|7gefiltert:filtern|7gekeltert:keltern|7gefoltert:foltern|7gepoltert:poltern|9geschultert:schultern|9getrichtert:trichtern|7gedoktert:doktern|7gemeutert:meutern|6gefedert:federn|6geledert:ledern|7gebiedert:biedern|7egliedert:liedern|7gefiedert:fiedern|7gefordert:fordern|7gemildert:mildern|9geschildert:schildern|7gewildert:wildern|6gerudert:rudern|8geplaudert:plaudern|9geschaudert:schaudern|7gezaudert:zaudern|6gepudert:pudern|10geschleudert:schleudern|7gesondert:sondern|7gewandert:wandern|6geändert:ändern|8geplündert:plündern|7gelindert:lindern|10geschlendert:schlendern|6geködert:ködern|6gewidert:widern|10geschneidert:schneidern|6gelodert:lodern|6gehadert:hadern|6gerädert:rädern|6gefeiert:feiern|6geleiert:leiern|5geeiert:eiern|9geschmiert:schmieren|8gepoliert:kpolieren|14oktroyiert:aufoktroyieren|6gefeuert:feuern|8gescheuert:scheuern|6geheuert:heuern|7gesteuert:steuern|6gedauert:dauern|6gelauert:lauern|6gemauert:mauern|6gekauert:kauern|7getrauert:trauern|10gebildhauert:bildhauern|6gesäuert:säuern|7gefiebert:fiebern|8geknabbert:knabbern|7gelabbert:labbern|10geschlabbert:schlabbern|7gebibbert:bibbern|7eglibbert:libbern|8geblubbert:blubbern|7gezaubert:zaubern|7gesäubert:säubern|7gestöbert:stöbern|6gelabert:labern|6egaunert:aunern|7gedonnert:donnern|7gebohnert:bohnern|11gesaugbohnert:saugbohnern|7egärtnert:ärtnern|8gekellnert:kellnern|9geklempnert:klempnern|10geschreinert:schreinern|7gewienert:wienern|8geklappert:klappern|8geplappert:plappern|7geläppert:läppern|8geflippert:flippern|9gescheppert:scheppern|8geklimpert:klimpern|8gestümpert:stümpern|6gehapert:hapern|6gekapert:kapern|6getapert:tapern|7geholpert:holpern|8gestolpert:stolpern|7gekaspert:kaspern|8geknuspert:knuspern|8geräuspert:räuspern|7gewispert:wispern|6gelagert:lagern|6gemagert:magern|7gebaggert:baggern|8geprangert:prangern|7gehungert:hungern|7gelungert:lungern|10geschlingert:schlingern|10geschwängert:schwängern|7gebürgert:bürgern|6geärgert:ärgern|6getigert:tigern|7gefolgert:folgern|7gepilgert:pilgern|7geliefert:liefern|9geschiefert:schiefern|6geopfert:opfern|7getöpfert:töpfern|5geufert:ufern|9geschläfert:schläfern|6geeifert:eifern|7geschert:scheren|10gezwitschert:zwitschern|10geplätschert:plätschern|7geäschert:äschern|7gesichert:sichern|9gespeichert:speichern|8gereichert:reichern|7gekichert:kichern|8geräuchert:räuchern|7gebechert:bechern|7gefächert:fächern|8gestochert:stochern|6genähert:nähern|7gereihert:reihern|7gewiehert:wiehern|8geklammert:klammern|7gejammert:jammern|7gedämmert:dämmern|7gehämmert:hämmern|9geschimmert:schimmern|7gezimmert:zimmern|8geflimmert:flimmern|7eglimmert:glimmern|7gewimmert:wimmern|10geschlummert:schlummern|8gestromert:stromern|7gebessert:bessern|10geschlossert:schlossern|6gefasert:fasern|6gemasert:masern|8geknausert:knausern|7gemausert:mausern|6gemosert:mosern|8gesponsert:sponsern|7gelockert:lockern|10geschleckert:schleckern|7gemeckert:meckern|8geflackert:flackern|8geklackert:klackern|7egluckert:luckern|7gebunkert:bunkern|8geflunkert:flunkern|8gezwinkert:zwinkern|10geschlenkert:schlenkern|7gekerkert:kerkern|6geimkert:imkern|9geschmökert:schmökern|6gepowert:powern|6geleert:leeren|6geteert:teeren|7gekellert:kellern|7geballert:ballern|7gebullert:bullern|9geschillert:schillern|8getrillert:trillern|8geträllert:trällern|13geschauspielert:schauspielern|9geschmälert:schmälern|9getischlert:tischlern|7gepanzert:panzern|6geführt:führen|6gerührt:rühren|6gekehrt:kehren|6gewehrt:wehren|6gezehrt:zehren|6gebohrt:bohren|6gebahrt:bahren|6gewährt:währen|5gehört:hören|6geklärt:klären|8geschirrt:schirren|9geschwirrt:schwirren|7geklirrt:klirren|7gesperrt:sperren|7gestarrt:starren|8gescharrt:scharren|7geknarrt:knarren|6gebarrt:barren|6gekarrt:karren|6gedörrt:dörren|5egurrt:urren|7geknurrt:knurren|9geschnurrt:schnurren|6gemurrt:murren|6gesurrt:surren|6gezurrt:zurren|9geschnorrt:schnorren|8geschnürt:schnüren|6gespürt:spüren|7geschürt:schüren|6gespart:sparen|9gebauspart:bausparen|6geklart:klaren|7geschart:scharen|6gepaart:paaren|4egart:garen|8geschmort:schmoren|6gespurt:spuren|6geblüht:blühen|5eglüht:lühen|6gebrüht:brühen|7gesprüht:sprühen|5gemüht:mühen|7gebracht:bringen|5acht:denken{e,ver}|6gedacht:denken|6gelacht:lachen|10gehohnlacht:hohnlachen|6gemacht:machen|6gebucht:buchen|6gesucht:suchen|7getaucht:tauchen|8gestaucht:stauchen|7gefaucht:fauchen|7gehaucht:hauchen|7geraucht:rauchen|7gebaucht:bauchen|10geschlaucht:schlauchen|9gescheucht:scheuchen|6gedeucht:dünken|7gekeucht:keuchen|7geduscht:duschen|8gerauscht:rauschen|8gebauscht:bauschen|8getauscht:tauschen|9geplauscht:plauschen|8getäuscht:täuschen|7gehuscht:huschen|7gekuscht:kuschen|7gepuscht:puschen|7gefischt:fischen|7gewischt:wischen|7gezischt:zischen|8gefrischt:frischen|7getischt:tischen|7gemischt:mischen|9gekreischt:kreischen|8gefälscht:fälschen|9gefeilscht:feilschen|8egrätscht:rätschen|9geklatscht:klatschen|8gelatscht:latschen|9geplatscht:platschen|9gequatscht:quatschen|8gepatscht:patschen|9geknutscht:knutschen|8gerutscht:rutschen|8geputscht:putschen|9geflutscht:flutschen|8gelutscht:lutschen|9gedeutscht:deutschen|9gequetscht:quetschen|11gedolmetscht:dolmetschen|9gefletscht:fletschen|10gequietscht:quietschen|8eglitscht:litschen|9gepeitscht:peitschen|9gepritscht:pritschen|8getitscht:titschen|9gepantscht:pantschen|8gepirscht:pirschen|8geforscht:forschen|9geherrscht:herrschen|8egrabscht:rapschen|8gewünscht:wünschen|9geflanscht:flanschen|9geplanscht:planschen|8gepanscht:panschen|8geprescht:preschen|11gemähdrescht:mähdreschen|7gehorcht:horchen|8gepfercht:pferchen|10geschnarcht:schnarchen|6gekocht:kochen|6gelocht:lochen|5gemocht:mögen|6gepocht:pochen|7gereicht:reichen|7geweicht:weichen|7gedeicht:deichen|6geeicht:eichen|9geehelicht:ehelichen|9geschwächt:schwächen|6gerächt:rächen|7gesiecht:siechen|6gezecht:zechen|7geblecht:blechen|9gestrolcht:strolchen|6gedreht:drehen|6gefleht:flehen|5geweht:wehen|5gemäht:mähen|5genäht:nähen|6gebläht:blähen|6gespäht:spähen|6gekräht:krähen|5gesäht:sähen|6gedroht:drohen|6gerauht:rauhen|5geruht:ruhen|5gebuht:buhen|6gereiht:reihen|6geweiht:weihen|5annt:ennen|7gebrannt:brennen|6gerannt:rennen|7gespannt:spannen|7getrennt:trennen|7geflennt:flennen|6gekonnt:können|6gesonnt:sonnen|6gepinnt:pinnen|6gedient:dienen|9geargwöhnt:argwöhnen|6gesöhnt:söhnen|7gedröhnt:dröhnen|6geföhnt:föhnen|7geklöhnt:klöhnen|6gelöhnt:löhnen|6gelehnt:lehnen|6gedehnt:dehnen|6gesehnt:sehnen|6gesahnt:sahnen|6gebahnt:bahnen|6gemahnt:mahnen|6gezahnt:zahnen|6gewohnt:wohnen|5egähnt:gähnen|5getönt:tönen|5gefönt:fönen|6geklönt:klönen|6gekrönt:krönen|6gezäunt:zäunen|6geraunt:raunen|8gestreunt:streunen|6geleint:leinen|6geweint:weinen|6gemeint:meinen|6gelernt:lernen|6gekernt:kernen|7gespornt:spornen|6getörnt:törnen|6geturnt:turnen|6geplant:planen|8geschwant:schwanen|6geclont:clonen|6geklont:klonen|6getränt:tränen|5gebüßt:büßen|5gemaßt:maßen|8gemutmaßt:mutmaßen|6gepaßt:neinpassen|6gespaßt:spaßen|6gefaßt:fassen{h,ter}|7gepreßt:pressen{an,in,h}|7gespießt:spießen|9geschweißt:schweißen|6geflößt:flößen|6genäßt:nässen|4ßt:tnässen|5gefußt:fußen|7gedampft:dampfen|8gestampft:stampfen|7gekämpft:kämpfen|7gedämpft:dämpfen|8gestumpft:stumpfen|10geschrumpft:schrumpfen|8getrumpft:trumpfen|9geschimpft:schimpfen|6geimpft:impfen|7gerümpft:rümpfen|7geklopft:klopfen|7getropft:tropfen|8gepfropft:pfropfen|7gestopft:stopfen|6getopft:topfen|7geknöpft:knöpfen|9geschröpft:schröpfen|8geschöpft:schöpfen|6geköpft:köpfen|6gerupft:rupfen|6getupft:tupfen|6gezupft:zupfen|6gelupft:lupfen|6gezapft:zapfen|7gestapft:stapfen|7geknüpft:knüpfen|9geschlüpft:schlüpfen|6gehüpft:hüpfen|6gekauft:kaufen|9geschnauft:schnaufen|6getauft:taufen|6gerauft:raufen|6gestuft:stufen|7geträuft:träufen|8geschafft:schaffen{b,an,g}|9geschlafft:schlaffen|7geblafft:blaffen|7geklafft:klaffen|5egafft:affen|6gerafft:raffen|6gepafft:paffen|8geschifft:schiffen|6gekifft:kiffen|5geäfft:äffen|7gekläfft:kläffen|7geknufft:knuffen|6gemufft:muffen|9geschleift:schleifen|9geschweift:schweifen|6geseift:seifen|7gesteift:steifen|8gestreift:streifen|6gereift:reifen|6gekeift:keifen|8geschürft:schürfen|9geschlürft:schlürfen|6gedurft:dürfen|7gestraft:strafen|6geprüft:prüfen|9geschnieft:schniefen|7getrieft:triefen|5egolft:olfen|6getankt:tanken|6gezankt:zanken|7geflankt:flanken|9geschwankt:schwanken|6gewankt:wanken|6gelenkt:lenken|9geschwenkt:schwenken|6gesenkt:senken|6gerenkt:renken|8geschenkt:schenken|9geschminkt:schminken|6gewinkt:winken|7geklinkt:klinken|7geblinkt:blinken|6gehinkt:hinken|6gefunkt:funken|6getunkt:tunken|5geunkt:unken|6gedeckt:decken|9geschreckt:schrecken|8gestreckt:strecken|7gesteckt:stecken|7gecheckt:checken|8gequieckt:quiecken|9geschmeckt:schmecken|7gedruckt:drucken|7gespuckt:spucken|6geduckt:ducken|6gekuckt:kucken|6gezuckt:zucken|7gedrückt:drücken|6gerückt:rücken|6gebückt:bücken|9geschmückt:schmücken|6gehackt:hacken|6gepackt:packen|8gesackt:absacken|7geknickt:knicken|6genickt:nicken|7geblickt:blicken|8geschickt:schicken|7gespickt:spicken|6gekickt:kicken|7gestockt:stocken|7geflockt:flocken|6gedockt:docken|6gehockt:hocken|8geschockt:schocken|5gehakt:haken|6gequakt:quaken|6gemerkt:merken|6gewerkt:werken|6geparkt:parken|11gebrandmarkt:brandmarken|6gewirkt:wirken|6gekorkt:korken|6getürkt:türken|6gemelkt:melken|6gewelkt:welken|7gestalkt:stalken|6gebölkt:bölken|5gelikt:liken|6gepaukt:pauken|6gespukt:spuken|6geblökt:blöken|6gekiekt:kieken|6gedarbt:darben|6gefärbt:färben|6gekerbt:kerben|4gerbt:gerben|5geebbt:ebben|6gejobbt:jobben|6gerobbt:robben|9geschrubbt:schrubben|7geklaubt:klauben|6eglaubt:glauben|9geschraubt:schrauben|6geraubt:rauben|7gestaubt:stauben|9geschnaubt:schnauben|8gesträubt:sträuben|6geklebt:kleben|5gelebt:leben|7gestrebt:streben|6gesiebt:sieben|5gewebt:weben|8geschwebt:schweben|7geschabt:schaben|5gehabt:haben|9gehandhabt:handhaben|6getrabt:traben|5gelabt:laben|6gebombt:bomben|5getobt:toben|6geprobt:proben|4geübt:üben|6getrübt:trüben|6gesalbt:salben|6gekalbt:kalben|6gewölbt:wölben|6gedämmt:dämmen|6gekämmt:kämmen|9geschlämmt:schlämmen|7geflämmt:flämmen|7geklemmt:klemmen|9geschlemmt:schlemmen|9geschwemmt:schwemmen|7gestemmt:stemmen|7gestammt:stammen|7geflammt:flammen|6gerammt:rammen|7gestimmt:stimmen|7gebrummt:brummen|6gefilmt:filmen|6geformt:formen|6genormt:normen|8geschirmt:schirmen|6gefirmt:firmen|7gestürmt:stürmen|6getürmt:türmen|6gewärmt:wärmen|9geschwärmt:schwärmen|6gelärmt:lärmen|6gewurmt:wurmen|6geräumt:räumen|7geträumt:träumen|8geschäumt:schäumen|6gezäumt:zäumen|6gebäumt:bäumen|6gesäumt:säumen|8gepflaumt:pflaumen|7geströmt:strömen|6gecremt:cremen|6geleimt:leimen|9geschleimt:schleimen|6gekeimt:keimen|6gereimt:reimen|6gekramt:kramen|6gerahmt:rahmen|6gerühmt:rühmen|6gelähmt:lähmen|6gezähmt:zähmen|6geboomt:boomen|12geschämt:fremdschämen|6gekappt:kappen|9geschnappt:schnappen|7geklappt:klappen|6gelappt:lappen|9geschlappt:schlappen|6getappt:tappen|7getrappt:trappen|6gepappt:pappen|9geschwappt:schwappen|9geschleppt:schleppen|7gesteppt:steppen|6geneppt:neppen|7gestoppt:stoppen|6getoppt:toppen|6gepoppt:poppen|7gefloppt:floppen|6gefoppt:foppen|6gehoppt:hoppen|8geschoppt:schoppen|6getippt:tippen|7gestippt:stippen|7geflippt:flippen|6gekippt:kippen|6gedippt:dippen|6genippt:nippen|9geschnippt:schnippen|6gerippt:rippen|8gestrippt:strippen|6gewippt:wippen|7gefluppt:fluppen|6gepumpt:pumpen|7gestülpt:stülpen|5gedopt:dopen|5gehupt:hupen|5gepupt:pupen|6gepiept:piepen|6geskypt:skypen|6gesandt:senden|5andt:enden{ts,vers,bers,tw,rw}|6gewandt:wenden|5gefaxt:faxen|5gefixt:fixen|5gemixt:mixen|5gebüxt:büxen|5geboxt:boxen|4gesät:säen|6gehievt:hieven|6gekurvt:kurven|8geschneit:schneien|5gefeit:feien|6gehalten:halten|7gespalten:spalten|4golten:elten|5olten:rgelten|8gescholten:schelten|6gebeten:bitten|5eten:rbitten|6getreten:treten|6eglitten:gleiten|5itten:en{eit{tgl,r{sch{e,h,ter,ber},est,rst}},eid{rl,schn{e,er}}}|6gelitten:leiden|6geritten:reiten|9geschritten:schreiten|8gestritten:streiten|9geschnitten:schneiden|5geraten:abraten|6gebraten:braten|6geboten:bieten|5oten:erbieten|7gefochten:fechten|6ochten:echten{rf,rfl,hfl}|8geflochten:flechten|7geborsten:bersten|5issen:eißen|6gebissen:beißen|6gerissen:reißen|8geschissen:scheißen|9geschmissen:schmeißen|8gesplissen:spleißen|5gegessen:essen|7gefressen:fressen|6gemessen:messen|6gesessen:sitzen|5essen:besitzen|5ossen:ießen|7geflossen:fließen|9geschlossen:schließen|5egossen:gießen|8geschossen:schießen|8gesprossen:sprießen|6gelassen:lassen|6geblasen:blasen|5gelesen:lesen|5iesen:weisen{e,er}|6gewiesen:weisen|7gepriesen:preisen|4gewesen:sein|7gewachsen:wachsen|0:en{komm{be,nt,ver,ber},fang{r,p}}|6gekommen:kommen|6genommen:nehmen|9geschwommen:schwimmen|9 geschwommen:schwimmen{st,fin,phin}|5ommen:immen{rschw,rgl,kl}|6eglommen:limmen|5gerufen:rufen|6gelaufen:laufen|6egriffen:greifen|7gekniffen:kneifen|7gepfiffen:pfeifen|5offen:fen{sau{e,r},tref{e,r}}|6gesoffen:saufen|7getroffen:treffen|8geschaffen:schaffen|5olfen:helfen{e,ver}|6geholfen:helfen|5orfen:werfen{e,ver,ter,nt}|6geworfen:werfen|8geschlafen:schlafen|6gebogen:biegen|7geflogen:fliegen|4ogen:ügen{el,r}|5gelogen:lügen|6gewogen:wiegen|5ogen:ziehen{e,er,nt,l}|6gezogen:ziehen|6gedungen:dingen|7geklungen:klingen|9geschlungen:schlingen|6gerungen:ringen|8gesprungen:springen|7gedrungen:dringen|7gewrungen:wringen|9geschwungen:schwingen|7gezwungen:zwingen|6gesungen:singen|6gefangen:fangen|3gangen:ehen|4angen:begehen|6gehangen:hängen|8geschlagen:schlagen|6getragen:tragen|5iegen:eigen{st{e,t,ber},rschw}|7gestiegen:steigen|9geschwiegen:schweigen|6gelegen:liegen|5orgen:verbergen|6gebunden:binden|6gefunden:finden|8geschunden:schinden|6gewunden:winden|9geschwunden:schwinden|6gestanden:stehen|4anden:stehen{be,er,nt}|5geladen:laden|8geschieden:scheiden|5ieden:eiden{sch{t,r},m}|6geworden:werden|7geblieben:bleiben|6gerieben:reiben|9geschrieben:schreiben|7getrieben:treiben|3geben:geben|5egraben:raben|5gehoben:heben|8geschoben:schieben|5oben:verschieben|7gestoben:stieben|7gestorben:sterben|5orben:erben{rst,ew,rw,mw,d}|6geworben:werben|7gebrochen:brechen|5ochen:echen{r{hb,erb,sp{e,nt,er}},est,zerst}|8gesprochen:sprechen|8gekrochen:kriechen|6ochen:verkriechen|7gerochen:riechen|7gestochen:stechen|7eglichen:leichen|10geschlichen:schleichen|8geblichen:bleichen|9gestrichen:streichen|7geloschen:löschen|6oschen:schen{rlö,rdre}|8gedroschen:dreschen|7gewaschen:waschen|5gesehen:sehen|5iehen:eihen|5ohen:iehen|6gefahren:fahren|7gefroren:frieren|4oren:ren{schwö{e,r},rsche,bä}|8geschworen:schwören|5oren:kiesen,rlieren|4egoren:ären|6gefallen:fallen|6gemahlen:mahlen|5ohlen:ehlen|7gestohlen:stehlen|5onnen:innen|7gesponnen:spinnen|8geschienen:scheinen|5gehauen:hauen|9geschmolzen:schmelzen|5olzen:rschmelzen|6gesalzen:salzen|6gestoßen:stoßen|6geheißen:heißen|5unken:inken{etr,rtr,rst,ts,vers}|7getrunken:trinken|7gestunken:stinken|6gesunken:sinken|6gebacken:backen|4ien:schreien{e,ver}|8geschrien:schreien|6gespien:speien|3an:tuen|3getan:tun~0:,begraben|9dursten:gedurstet|9wursten:gewurstet|9fristen:gefristet|9brüsten:gebrüstet|9dünsten:gedünstet|10fruchten:gefruchtet|8achten:geachtet|10trachten:getrachtet|10frachten:gefrachtet|9pachten:gepachtet|10fürchten:gefürchtet|9drahten:gedrahtet|7iften:egiftet|8duften:geduftet|14wirtschaften:gewirtschaftet|8haften:gehaftet|8saften:gesaftet|11antworten:geantwortet|7orten:geortet|8wirten:gewirtet|8fluten:geflutet|8walten:gewaltet|8wetten:gewettet|9spotten:gespottet|7röten:gerötet|7hüten:gehütet|10schulden:geschuldet|8dulden:geduldet|7enden:geendet|8munden:gemundet|8ründen:gegründet|9pfänden:gepfändet|8neiden:geneidet|8sieden:gesiedet|6öden:geödet|8morden:gemordet|9schaden:geschadet|9leugnen:geleugnet|8öffnen:geöffnet|9waffnen:gewaffnet|8swingen:geswingt|9festigen:gefestigt|10ängstigen:geängstigt|10kräftigen:gekräftigt|10sänftigen:gesänftigt|8nötigen:genötigt|8tätigen:getätigt|9sättigen:gesättigt|9sündigen:gesündigt|10schädigen:geschädigt|9huldigen:gehuldigt|10kreuzigen:gekreuzigt|1e:t{rvereinig,ier{is{al{tkoloni,tkommun,tkrimin,ution},tbürokrat},hstruktur}}|9reinigen:gereinigt|8einigen:geeinigt|9billigen:gebilligt|7klagen:geklagt|6tagen:getagt|6zagen:gezagt|7siegen:gesiegt|6fugen:gefugt|7zeugen:gezeugt|7bürgen:gebürgt|7sorgen:gesorgt|6rügen:gerügt|8flaggen:geflaggt|7klauen:geklaut|7petzen:gepetzt|7fetzen:gefetzt|7rotzen:gerotzt|1en:t{beglotz,begrenz,eel,r{e{i,qu,hw,e},gehö{n,rher,u}},begrabsch,ann{b,m},begaff}|7patzen:gepatzt|7nützen:genützt|8franzen:gefranzt|7filzen:gefilzt|7kürzen:gekürzt|10schmerzen:geschmerzt|9scherzen:gescherzt|7herzen:geherzt|7hellen:gehellt|9schellen:geschellt|8prellen:geprellt|7hüllen:gehüllt|7zollen:gezollt|7rillen:gerillt|1n:elt,ert|9mitteln:gemittelt|11spachteln:gespachtelt|1:rentwickelt,hterhalten|10stückeln:gestückelt|11sprenkeln:gesprenkelt|8kakeln:gekakelt|8kokeln:gekokelt|12schlüsseln:geschlüsselt|9fesseln:gefesselt|10kräuseln:gekräuselt|8duseln:geduselt|9pieseln:gepieselt|9rätseln:gerätselt|10häckseln:gehäckselt|9tändeln:getändelt|8sudeln:gesudelt|9trödeln:getrödelt|9doppeln:gedoppelt|12schrumpeln:geschrumpelt|10dribbeln:gedribbelt|8nebeln:genebelt|12schmunzeln:geschmunzelt|10spitzeln:gespitzelt|9siegeln:gesiegelt|8segeln:gesegelt|10klüngeln:geklüngelt|8hageln:gehagelt|12schnüffeln:geschnüffelt|10zweifeln:gezweifelt|8täfeln:getäfelt|11hätscheln:gehätschelt|11schimmeln:geschimmelt|8ammeln:egammelt|9rammeln:gerammelt|9fummeln:gefummelt|9bummeln:gebummelt|10stümmeln:gestümmelt|9krümeln:gekrümelt|7sohlen:gesohlt|7fehlen:gefehlt|9urteilen:geurteilt|7weilen:geweilt|7raulen:egrault|6nölen:genölt|8quirlen:gequirlt|7pissen:gepisst|7missen:gemisst|7hausen:gehaust|7zausen:gezaust|7lausen:gelaust|5asen:egast|9klecksen:gekleckst|6losen:gelost|11schüttern:geschüttert|10knittern:geknittert|9lottern:gelottert|10flattern:geflattert|8istern:gegeistert|8eitern:geeitert|8altern:gealtert|9martern:gemartert|8ordern:geordert|9fördern:gefördert|11schludern:geschludert|9hindern:gehindert|9mindern:gemindert|9wundern:gewundert|10fleddern:gefleddert|3:iert{skristallis,skompliment}|2:tkommerzialisiert|8stieren:gestiert|7zieren:geziert|6ieren:gegiert|8sauern:gesauert|9sabbern:gesabbert|8albern:gealbert|12schnuppern:geschnuppert|10plempern:geplempert|10steigern:gesteigert|9weigern:geweigert|8zögern:gezögert|10pfeffern:gepfeffert|9wuchern:gewuchert|11schachern:geschachert|9löchern:gelöchert|9kümmern:gekümmert|9wässern:gewässert|10kleckern:gekleckert|8ankern:geankert|10stänkern:gestänkert|8pokern:gepokert|9böllern:geböllert|9pulvern:gepulvert|8äußern:geäußert|5hren:gegehrt|6ehren:geehrt|7lehren:gelehrt|7mehren:gemehrt|7wahren:gewahrt|7nähren:genährt|7stören:gestört|6irren:geirrt|7zerren:gezerrt|7harren:geharrt|7narren:genarrt|6küren:gekürt|7haaren:gehaart|4ingen:bracht|8krachen:gekracht|7dachen:bgedacht|8flachen:geflacht|7fachen:gefacht|7wachen:gewacht|9brauchen:gebraucht|8fluchen:geflucht|9lauschen:gelauscht|9pfuschen:gepfuscht|9tatschen:getatscht|11knautschen:geknautscht|10knirschen:geknirscht|9lupschen:geglupscht|8naschen:genascht|8haschen:gehascht|9ramschen:geramscht|8tünchen:getüncht|7kennen:gekannt|7nennen:genannt|7bannen:gebannt|7pennen:gepennt|7dünnen:gedünnt|6önnen:egönnt|8stöhnen:gestöhnt|6ahnen:geahnt|7lohnen:gelohnt|7sühnen:gesühnt|7wähnen:gewähnt|7saunen:gesaunt|8staunen:gestaunt|6einen:geeint|7tarnen:getarnt|7warnen:gewarnt|7zürnen:gezürnt|8thronen:gethront|8schonen:geschont|6rüßen:gegrüßt|6süßen:gesüßt|7blassen:geblaßt|10schleißen:geschleißt|8mampfen:gemampft|9krampfen:gekrampft|11schrumpfe:engeschrumpft|8sumpfen:gesumpft|7häufen:gehäuft|7hoffen:gehofft|7puffen:gepufft|9schärfen:geschärft|7miefen:gemieft|7danken:gedankt|8kranken:gekrankt|7ranken:gerankt|7zinken:gezinkt|10schränken:geschränkt|7wecken:geweckt|8flecken:gefleckt|6ucken:geguckt|10schlucken:geschluckt|7lücken:geglückt|9pflücken:gepflückt|8knacken:geknackt|7picken:gepickt|7locken:gelockt|8stärken:gestärkt|7kalken:gekalkt|6ulken:geulkt|9streiken:gestreikt|6erben:geerbt|7lieben:geliebt|6beben:gebebt|7leiben:geleibt|7hemmen:gehemmt|10schrammen:geschrammt|8trimmen:getrimmt|8krümmen:gekrümmt|8qualmen:gequalmt|6mimen:gemimt|6samen:gesamt|7lahmen:gelahmt|6ahmen:geahmt|6rämen:egrämt|8kloppen:gekloppt|8klumpen:geklumpt|10schlampen:geschlampt|6hexen:gehext|7nerven:genervt|7raten:geraten{an,u}|5ehmen:ommen|11schwimme:rgeschwommen|9klimmen:geklommen|5eifen:iffen|4iegen:gen{o,e}|8trügen:getrogen|5ingen:ungen|5ehen:angen,ugestanden|8bergen:geborgen|5inden:unden|8meiden:gemieden|5eiben:ieben|4eben:oben|5eichen:ichen{,begl}|8leihen:geliehen|8fliehen:geflohen|8sinnen:gesonnen|5einen:ienen~1t:auskristallisiere,ten{erbe,ertas,gelei,gestat}|5ossen:ießen{durchfl,erg,ersch}|4anden:stehen{ge,einge,über}|5acht:erbringen,erdenken|0:en{fahr{er,über,um},ergeb,erhalt,erlauf,erschaff,ag{erschl,ertr{,üb}},erseh,überfall}|5unden:erfinden|2t:en{erfolg,erhäng,l{l{erha,erste{,üb}},erho,erei},erkämpf,ch{rei{er,über,ge},gehor},ersehn,ersetz,erstreck,app{ert,überl},gehör,gewähr,überführ,überschau}|5iffen:ergreifen|4oben:erheben|5ungen:ingen{erkl,err,erzw}|5egen:erliegen|5ienen:erscheinen|6ichen:erschleichen|4ogen:erwägen|6gezählt:herzählen|5ogen:umfliegen,überziehen|6geachtet:achten|5geahmt:ahmen|5geahnt:ahnen|6gealbert:albern|6gealtert:altern|6geankert:ankern|9geantwortet:antworten|6gebannt:bannen|6geborgen:bergen|5gebebt:beben|8gebilligt:billigen|7geblaßt:blassen|8gebraucht:brauchen|7gebrüstet:brüsten|7gebummelt:bummeln|7geböllert:böllern|6gebürgt:bürgen|6gedacht:dachen|6gedankt:danken|7gedoppelt:doppeln|7gedrahtet:drahten|8gedribbelt:dribbeln|6geduftet:duften|6geduldet:dulden|7gedurstet:dursten|6geduselt:duseln|6gedünnt:dünnen|7gedünstet:dünsten|5geehrt:ehren|5geeint:einen|7geeinigt:einigen|6geeitert:eitern|5geendet:enden|5geerbt:erben|6gefacht:fachen|6gefehlt:fehlen|7gefesselt:fesseln|8gefestigt:festigen|6gefetzt:fetzen|6gefilzt:filzen|7geflacht:flachen|7geflaggt:flaggen|8geflattert:flattern|7gefleckt:flecken|8gefleddert:fleddern|7geflohen:fliehen|7geflucht:fluchen|6geflutet:fluten|8gefrachtet:frachten|7gefranzt:franzen|7gefristet:fristen|8gefruchtet:fruchten|5gefugt:fugen|7gefummelt:fummeln|7gefördert:fördern|8gefürchtet:fürchten|6egammelt:gammeln|4egast:gasen|4gehrt:gehren|6geistert:geistern|5egiert:gieren|5egiftet:giften|8eglupscht:glupschen|6eglückt:glücken|6egrault:graulen|5egrämt:grämen|6egründet:gründen|5egrüßt:grüßen|5eguckt:gucken|5egönnt:gönnen|6gehaart:haaren|6gehaftet:haften|6gehagelt:hageln|6geharrt:harren|7gehascht:haschen|6gehaust:hausen|6gehellt:hellen|6gehemmt:hemmen|6geherzt:herzen|5gehext:hexen|7gehindert:hindern|6gehofft:hoffen|8gehuldigt:huldigen|8gehäckselt:häckseln|9gehätschelt:hätscheln|6gehäuft:häufen|6gehüllt:hüllen|5gehütet:hüten|5geirrt:irren|6gekakelt:kakeln|6gekalkt:kalken|6gekannt:kennen|6geklagt:klagen|6geklaut:klauen|8gekleckert:kleckern|8gekleckst:klecksen|7geklommen:klimmen|7gekloppt:kloppen|7geklumpt:klumpen|8geklüngelt:klüngeln|7geknackt:knacken|10geknautscht:knautschen|9geknirscht:knirschen|8geknittert:knittern|6gekokelt:kokeln|7gekracht:krachen|8gekrampft:krampfen|7gekrankt:kranken|9gekreuzigt:kreuzigen|9gekräftigt:kräftigen|8gekräuselt:kräuseln|7gekrümelt:krümeln|7gekrümmt:krümmen|7gekümmert:kümmern|5gekürt:küren|6gekürzt:kürzen|6gelahmt:lahmen|8gelauscht:lauschen|6gelaust:lausen|6gelehrt:lehren|6geleibt:leiben|7geleugnet:leugnen|6geliebt:lieben|6geliehen:leihen|6gelockt:locken|6gelohnt:lohnen|5gelost:losen|7gelottert:lottern|7gelöchert:löchern|7gemampft:mampfen|7gemartert:martern|6gemehrt:mehren|6gemieden:meiden|6gemieft:miefen|5gemimt:mimen|7gemindert:mindern|6gemisst:missen|7gemittelt:mitteln|6gemordet:morden|6gemundet:munden|6genannt:nennen|6genarrt:narren|7genascht:naschen|6genebelt:nebeln|6geneidet:neiden|6genervt:nerven|6genährt:nähren|5genölt:nölen|7genötigt:nötigen|6genützt:nützen|6geordert:ordern|5geortet:orten|7gepachtet:pachten|6gepatzt:patzen|6gepennt:pennen|6gepetzt:petzen|8gepfeffert:pfeffern|8gepflückt:pflücken|8gepfuscht:pfuschen|7gepfändet:pfänden|6gepickt:picken|7gepieselt:pieseln|6gepisst:pissen|8geplempert:plempern|6gepokert:pokern|7geprellt:prellen|6gepufft:puffen|7gepulvert:pulvern|7gequalmt:qualmen|7gequirlt:quirlen|7gerammelt:rammeln|8geramscht:ramschen|6gerankt:ranken|8gereinigt:reinigen|6gerillt:rillen|6gerotzt:rotzen|7gerätselt:rätseln|5gerötet:röten|5gerügt:rügen|7gesabbert:sabbern|6gesaftet:saften|5gesamt:samen|6gesauert:sauern|6gesaunt:saunen|9geschachert:schachern|7geschadet:schaden|8geschellt:schellen|8gescherzt:scherzen|9geschimmelt:schimmeln|9geschlampt:schlampen|9geschleißt:schleißen|9geschluckt:schlucken|9geschludert:schludern|10geschlüsselt:schlüsseln|9geschmerzt:schmerzen|10geschmunzelt:schmunzeln|10geschnuppert:schnuppern|10geschnüffelt:schnüffeln|7geschont:schonen|9geschrammt:schrammen|10geschrumpelt:schrumpeln|9geschränkt:schränken|8geschuldet:schulden|8geschworen:schwären|9geschädigt:schädigen|8geschärft:schärfen|9geschüttert:schüttern|6gesegelt:segeln|6gesiedet:sieden|7gesiegelt:siegeln|6gesiegt:siegen|6gesohlt:sohlen|6gesonnen:sinnen|6gesorgt:sorgen|9gespachtelt:spachteln|8gespitzelt:spitzeln|7gespottet:spotten|9gesprenkelt:sprenkeln|7gestaunt:staunen|8gesteigert:steigern|7gestiert:stieren|8gestreikt:streiken|8gestänkert:stänkern|7gestärkt:stärken|7gestöhnt:stöhnen|6gestört:stören|8gestückelt:stückeln|8gestümmelt:stümmeln|6gesudelt:sudeln|7gesumpft:sumpfen|7geswingt:swingen|9gesänftigt:sänftigen|8gesättigt:sättigen|6gesühnt:sühnen|8gesündigt:sündigen|5gesüßt:süßen|5getagt:tagen|6getarnt:tarnen|8getatscht:tatschen|7gethront:thronen|8getrachtet:trachten|7getrimmt:trimmen|6getrogen:trügen|7getrödelt:trödeln|6getäfelt:täfeln|7getändelt:tändeln|7getätigt:tätigen|7getüncht:tünchen|5geulkt:ulken|8geurteilt:urteilen|6gewacht:wachen|7gewaffnet:waffnen|6gewahrt:wahren|6gewaltet:walten|6gewarnt:warnen|6geweckt:wecken|7geweigert:weigern|6geweilt:weilen|6gewettet:wetten|6gewirtet:wirten|12gewirtschaftet:wirtschaften|7gewuchert:wuchern|7gewundert:wundern|7gewurstet:wursten|6gewähnt:wähnen|7gewässert:wässern|5gezagt:zagen|6gezaust:zausen|6gezerrt:zerren|6gezeugt:zeugen|6geziert:zieren|6gezinkt:zinken|6gezollt:zollen|8gezweifelt:zweifeln|6gezögert:zögern|6gezürnt:zürnen|9geängstigt:ängstigen|6geäußert:äußern|4geödet:öden|6geöffnet:öffnen|5ieben:eiben{unterbl,erschr{unt,üb}}|5ommen:unternehmen|4angen:übergehen"
    },
    "nouns": {
      "plural": "1e:otta|1en:a{aur,gend,mad,ub,en,onn,un,aum,rm,ul,al,ri,gi,ig,av,ns}|0s:sigma,r{e{dinn,ouch,sf,dtim,hart,lett,i{son,nn,el,k,met,at,m},ap,ov,oy},ko,bo,a{st,b,ll,ad,g},i},n{i{grat,llet,s{bas,kas,des,u},räule,sk,ra,u,p},o{,ciati,conditi,et,est,art,lk},ie,oke,ee,a{-ut,c,v,rik,l,f,og},w,eschö,eer,ger,tör,g},l{mina,va,ca,e{ot,ni,od,ump,sp,r,v,n},l{era,ewa,cha,se,i},oo,ou,r},e{t{guet,clet,le,bsi,tra,da,y},oup,ouss,eas,r{tu,sai,oi,do,to,n,v},n{ce,rli,eli,rri,tpho},saf,i{gen,oog,rb,mb,ll,oth,lf,pp,ld,k,na},crem,l{b{eara,u,m,ai},le,y,z,g},riv,hav,u{ue,q,d,n},e,ffe,one,ac,ok,fk,é,y},au{gr,l,e,t},d{n{ye,re,-sta,fo},r{co,lo,va,ca,da},ki},g{n{,sla,ta,i{arl,il,el,ar,or}},shta,ga,lle,o,blo,gi},t{r{o{rp,ip,f,s},a{t,h,d,e},ogu,hu,be,se,li,shi},t{e{ol,mel,rik,s},pa,pu},i{im,ud,ku,a,p,az,tf,b},trä,n{e{m{ne,ge,te,h},ev},issa,aura,tna,i},oas,tes,c,fia,ela,ou,deu,pu,e,po,ko,bü},h{c{ho,oa,un,ar,at},ru,s,b},f{e,ckau,f,erif,ti,d},k{c{pu,i,ckni,a,e{rbest,h,tr,d},do,ho},a,ar,ei,tan,rin,un,as,o},um{lik,le,f},rlei,fei,sitiv,kz|0en:r,rbar,ron,eun,bell,ull,tess,ins,au,reu,d{ul,en,oran,toi,oli,era,m},t{ach,uch,r,i,ä,n,haf,rf,as,ys,ürs,ba,punk{end,t,r},eu,me,ne,wel,g},th,zeh,reif,raf,ek,ink,rv,z,bub,ump,x|0n:r{e{ith,ph,steu,trau,mau,leb,ziff,gf,amm,numm,plund,leud,fed,t{lf,aus,wes,ol,ul,lei{h,el,tt},nat,nmut,vet},fas,lei,fei,op,sp,ay},achba},l{e{t{ut,at,is,hach},s{ach,m,s{nne,fe,o,fu,hü},n,gei,au,ap},d{na,n,d,nu,i,e},p{rem,up,pap,au},g{an,in,re,or,u},k{arun,parti,ri,fac,s},f{rtof,trüf,af,a,au},m{m{bi,bu,e,o},r,i},b{m,i,a,wie,r},z{et,e,an,ur},h},u},e{,liqu,e{ll,rm,d,uss,kt,f,er,osch,n}},nerkenntnis,dollerei|0:er{kleb,jamm,i{orn,ib,ub,chle},lov,re,ne},en,l{e{pins,d{n{hwi,ü,wa,e},pad},iang,ärm,emb,kab,irb,ch{üs,pei,mi,nor}},nker},e{häng,eleg,werb,rieb,äll},s{ou,na,pa,i},oni|1n:mter|0e:r{e{rakt,i{non,rn,kur,ap,is,enad,wel,pal,ol,b,sag,lav,ev,t,fiz},e},o{ent,ont,es,l,e,o},h{ru,e{hw,ew,uw,g},ro,ja,ö},eu,bitu,lu,ä,a,tar,ir,ö,wü,pü,pi},n{,i{cer,bur,pent,rot,res,ub,x,rph,lph,ith,e,nz,az,elf,ek,ill,pel,mpol,a,rm,am,gu},o{pi,f,ph,zet,it,ant,lik,hal,kl,ar,hr,m},e{änom,tig,og,yl,äz},moh,por},l{,ta{k,or,ar},ie,ame,istal,uir,ker},s{,ga,ei,ki},rhau,ptau,äu,d{ol,n{,be,ze,se,lbu,ila},ie,r,i,gra,fa,rag,to},g{,in{l,r,nd,rs,m},rla,ta,slu,eu,lo,so},t{,r{o{,w{or,er,a,tich}},wa,gu,e,wi},agot,i{re,an,en,et,ed,ul,lor,pr,z,f,h},rä,n{e{m,dv,kz,roz,at,äs,in,l},zo,h},s{aori,zwi,ra,tte,rote,rlu},mira,ria,agia,lau,spu,e{b,be,ak,r,i}},h{,c{su,ltu,bars,la},nt},f{,rie,if,puf,of},k{,c{i{bl,n,h,str},la,verde},ba},maß,äß,eiß,m{,mono,hal,ram,lsa,na,ble},i{hre,bre,ble,ha},iv,z{it,et,ar,cher,ei,l,u},b{e,au,shu,lo,r},p{al,üp,oto,ko,eoty},fix,lex,nx|5äuser:auser|2en:dion,s{u{m,di,kl,ir},asi,xi,ho},um{,at,pt}|2ien:xon|2ina:lumen|5ärten:arten|2sse:hoße|2era:enus|3üsse:uss|0se:bis|0sen:mes|3änder:land|3ände:band{n,hl,ver,t}|0er:leid,iest,iech,ib|3ätten:tatt|3ücke:druck{lb,p,in,s}|2a:kum|0a:lom|3änze:anz{kr,w}|1i:hino|2ices:codex~0s:,e{d{co,ko,cor,gra},vic},ail,m{oo,alo,a,e{ar,kr,it,l,ui,nd},ri,fü,w}|12s provocateurs: provocateur|8s complets: complet|1ines:ago|1zes:ix|2izes:dex|2ites:imes|1ies:story|0es:kbox,sär,dress,pgloss,wich|5s fixes: fixe|0:s{de,u{sk,ok,rzirk,i,pl,s,lism,at},yro,orp,il,m,á,los},r{e,cto,rumo,kta},n{flade,tfade,boge,oster,lei,-ärzti,ba},e{final,douill,s{tinteres,äch,äu,mü,kä,lä},d{n{vore,elä,ebi,ewi},ewei,trei,bil,äl,äu,b,ta},g{tän,he,fe,fü,ela,au,ir}, latt,lllist,würz,viz,ölz,gim,geweb,ölb,amper,ceder,kni,cop},el,erl,moll,pasta,hini,olt,fax,mb,mmerierung,uiz,sherry|2ices:ex|7 mobiles: mobile|3änner:mann|3ühner:uhn|3örner:orn|0er:iking,d{l,kin,rin,li,lie},t{ch{li,esi,sewi,hle},bret,mü,geis,pens,nes,schwer,chei,gimen},äuch,ski|3älger:balg|3älder:ald|3ünder:mund|3änder:and{b,ew,f}|2äder:bad,rad|4üder:bruder|6öchter:ochter|3ämter:amt|3ötter:gott|3ätter:latt|5ütter:mutter|6ömeter:hometer|2üter:gut|5öster:loster|3älter:gehalt|4äupter:aupt|3örter:wort|3äuter:kraut|4äter:vater|3ächer:ach|3ücher:uch|3öcher:loch|3örfer:orf|2äler:al{nkm,bm,t}|3äuler:maul|2ümer:tum|3ürmer:wurm|5ämmer:hammer|3ämmer:lamm|3äcker:mack|3ölker:olk|3älber:alb|2äber:rab|5ässer:bwasser|2ässer:faß|3össer:ross|2össer:loß|2äser:glas,ras|3äuser:aus|3ölzer:olz|0nen:in|0en:n{ran,pli,o{i,rs,nis,iak,ot},bah,sa,rstir,dir,dor},t{bet,guns,is,u{na,fl,h,bstit},tal,ewal,twor,sumen,e{nalphab,h,hl,rol,pr,o},ch{llma,nma,uflu,i{s,pfl,hr,h}},rif,k{da,sta,te,äfe,nse},ilo,a{s,kr,ir,id,ld,t{os,el,un,e,f,zu},i,a,om,leg,äl},y},klop,yp,ams,els,d{n{a{ob,m,gr,er,it},abu},hel,eroi,ai,g},ung,urg,r{e{mani,bau{ß,in}},rta,ha,bä,gö},lif,ölf,hluff,h{nsc,nuc,sop,ap},verb,ei,m{far,or,ono,al},l{qua,ah,gal,we},patz,k{ban{z,al},i,is}|5ästen:asten|0ten:bau|5n beten: bete|6chnachten:hnacht|2en:faktum|1en:a{vit,ram,hem,gm,vill,izz}|0anden:oktor|1den:tis|4äden:aden|4öden:boden|4ögen:ebogen|4ägen:magen|0n:sture|4äfen:afen|4öfen:ofen|4äben:raben|0ien:diz,ileg,l{ria,inera,mmobi,nsi,pti},zip,nod|1zien:äsens|1ien:hivale|3älle:all{f,b,st}|3ölle:zoll|3ühle:uhl|3ähle:fahl|3äule:aul|2äle:al{ner,an,din}|3äle:saal|1sse:ß|0se:s{u,ni,ro,a},tnisse|2üsse:uß|2sse:biße|2ässe:aß|4üchse:uchs|4ächse:uwachs|3äuse:aus{m,l}|3änse:ans|3äpse:naps|3älse:als|3üche:uch{r,l}|5ärsche:arsch|5äusche:ausch{b,r}|4üsche:busch|4ösche:osch|5ünsche:unsch|1:licher,deter|3äche:bach|4äuche:auch|3öche:koch|4örche:orch|2öhe:oh|2ühe:kuh|4ämpfe:ampf|4ümpfe:umpf|3öpfe:opf|3äpfe:apf|3äufe:auf|3ürfe:urf|2öfe:of|3ölfe:olf|3öcke:ock|3äcke:sack|3änke:ank|3ünde:und{r,b}|3ände:and|3ägde:magd|3änge:ang|3ünge:ung{w,pr}|2äge:ag|2üge:ug|3ärge:arg|2öge:zog,trog|2äte:rat{bei,m,l,n,or}|3ärte:bart|3äbte:abt|4ärkte:markt|11n-bete-salate:-bete-salat|0te:ima|3äfte:aft|4ünfte:unft|3üfte:uft|3äufte:itlauf|4ärzte:arzt|3ädte:adt|5ängste:angst|3äste:ast{g,al}|4äuste:aust|4ünste:unst|4ürste:urst|3üste:ust{br,l}|3öste:frost|4äpste:apst|4ülste:hwulst|3älte:walt|4üchte:ucht{fl,s,r}|4ächte:acht{m,n,h}|3ähte:aht|3äute:aut|4leute:fmann|3äxte:axt|2öte:not|3ätze:atz|3ötze:lotz|3ürze:urz|3äume:aum|3ürme:urm|3ärme:darm|3ämme:amm|6s crème: crème|2öme:trom|3örbe:orb|2äbe:tab|2übe:hub|2äre:ltar|2öre:hor,nor|2üre:wur,nur|3öhne:ohn|3ähne:ahn|2äne:an{pl,kr,w,sp}|2öne:ton|3äune:aun|2öße:toß|2üße:fuß,ruß|2äße:spaß|3äuße:auß|3ämpe:kamp|8a vitae:um vitae|5ättel:sattel|5äntel:antel|5ändel:handel|5äpfel:apfel|4ögel:ogel|4ägel:nagel|4äbel:nabel|2a:um{kt,it,l,m,rn,v},on{k,or,on}|0ta:ma{m,rko,ug}|3zera:lkus|2ora:pus{em,tkor}|0ja:mni|2i:us{mn,in,mod,r,mul}|1i:erone,o{torn,fit,int,os,azz},pos|0i:wik|10ora delicti:us delicti|3zi:ikus|8s au lait: au lait|1it:uk|1ä:mina,ova|4uareg:argi|7iatantum:etantum|0im:eraph~0:s{ana,xpa,i{em,ov,la,ass,ir},sou,inu},er{d{l{usbi,efe,örfe,me,o},flie},hlicht,äch{w,r},gentüm,reib,dgräb,äus{m,lnh}},en{renn,runn,t{hat,lit,hus,pos,fos,rhal,ach{t,n},kno,bra,spa},p{p{a{rl,ischl,h,w},ho,ro},um{h,kl,t}},s{kis,bis,htes,ei,mmei,bu,we,be,re},d{rie,or,gul,lei},g{rei,fan,prin,kra,wa,mö,gal,nlie,de,re,mor,nü},hr{ege,erfa,tfa},f{rei{-,st,al},ref,hau,p},h{c{,zei,s{s,ie,gro,äu,pu,ö,äl,ä,än},rsu,rau,ku,no,re},le,ge,se},b{ha,ol,ster,rei,be,le},m{kom,xa,prono,erneh,rah,dau,gau,ie},l{foh,l{po,wi,ba,efa}},z{lran,tut,bol,wei},k{den,hin,zin,ne,broc,zac,bec,kor,ha,bal,ü},eß},e{gefäll,gehäng,geleg,getrieb,gewerb}|3x:endizes|1:ums,n{,e{n{in{hrr,chr,p},noto},t{s{gla,pla,i{e,l{s,ß,tel,n,h},tr,k,wa},rä},bau{e,r},pur,n{e{di,fizi,esid,ad,mpon},a{k,pik,fik,t{i,e,ns,nn,l},s,eress,mbul,pl,al,ler,etr,g,ri,arm,n,rd,w,v}},athe,ch{bra,kra,eschi},i{che,heze,rm,ul,xquis},bia},eotyp,eis{n,w,m,r,l,p},rfried,hord,päd,ung{erz,sz,j},r{furo,po,äu,au,eu,tü{t,i,ver,k},st},läf,mpf,epf,ch{i,s,wäs,a,ä,ol,ü,r{a,le,he,u,lä,i},an,ün,u,o,e,fre,y},frei,blei,m{r{ffa,bno,eno,onfo},hkom,tono,pal,nthe,trie},ahl{f,k},z{n{a{fl,mer,g,m,h,w},gre,mi},ker,kiz},k{nti,pi,apothe,ubec}}},e{,fühl,ss{sze,tre,ho,pa},ch{eräus,ebüs,hli},tränk,häft,erücht,läut,rhör,eschwür,föhn},oma|5and:änder{l{hr,en,z,h,m},r}|2:er{kleid,biest,viech,eib},en{ktron,uron,neun,t{s{für,a{m,l,i,nt},hei,ly},zeu,peu,r{fah,a{nk,ng,n,r},u,derhi},n{e{i,oeffizi,v,ag,rig,eg,efer,nkurr,oz,uz,ssist,d,ns,ss,nqu,bstitu,on,rn,ah},a{,ik,ss,his,ig,nson},fro},agne,ane,ome,ch{a{r,nd,hl,j,p,y},u{kb,rchla,hl,w}},erf,chaf,punk,i{e{k,h,z,b},on,m,band,l,or,s,u,i,t},tä,iä,kroba},alp,stess,eins,zins,d{en{geg,tug,nu,vid,hen},hul,mera,hem,etoi,boli},r{arba,za,o,h{u,we,ü,wä,fa,o},u,tü,her},elf,graf,ath,ith,ebell,null,nerv,au{fr,ch,f,s},z{an,en,in,ischüt,rot,ili,ti,er},fink,othek,box,ntax},rbisse|5auser:senhäuser|2a:en{donn,aren,mens,rmad,slig,ggi,eteri,irm,traum,skal}|2um:en{plen,ipt,dat,impress,nivers,for,tr,i{rem,ort,nas,os,r{na,ste,ite,to},d{po,e,si,n}},du,ku,use,lä}|5att:rkstätten|3:terbauten,rmessen|5arten:gärten|2o:konten|2us:en{vir,adi,thm,sm,ykl}|2on:tadien,xiken|2is:raxen|4uss:üsse{bfl,bschl,n}|4uß:enüsse|3ß:mbisse|4uck:rücke|1a:cotte|3ut:hüte|4anz:änze|3au:säue|5angel:mängel|1um:tika|3us:era|3en:ina~3ücke:abdruck|0s:er{ab,din,pi},t{al,bo,ro,eta,ka,fak,hi,skrip},eck{,l},game,gin,im,rum,ich,kord,mädel,tag|0n:e{abkomm,g{au,lau,lun,zun},t{eli,kulan,tan,pis,toma},final,gall,inn{f,r},kolb,lanz,pur,se,streif},er{ad,ord,bau,kief,leit},el{amp,ass,riff},lohn|0en:t{ach,buch,ak,punk,ar,predig,ras,ta,wel},alp,lump,au,streu,bub,elf,reif,kür,narr,zar,leid,mark,zeh|5äcker:acker|1en:a{agend,aul,aur,lav,lig,saun,tub},konto|2en:album,visum,lexikon|0:en{am,sam,ess,ras,hod,rach,ranz,rück,schreck},minus,nabel|3äste:ast|0e:bund,ding,gel,mahl,gen,urin,lauch,mus,pionier,rektor|1n:beamter|0er:ei|3üsse:fluss|2üte:hut|3änder:and{l,r}|5ängel:mangel|2ina:nomen|2era:opus|3ötte:pott|2äte:rat|0a:rom|2äue:sau|3änze:tanz|5ässer:wasser"
    }
  };

  // uncompress them
  Object.keys(model$3).forEach(k => {
    Object.keys(model$3[k]).forEach(form => {
      model$3[k][form] = uncompress(model$3[k][form]);
    });
  });

  const prefixes = [
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
    for (let i = 0; i < prefixes.length; i += 1) {
      const p = prefixes[i];
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
    "Adjective": "true¦0:07R;1:093;2:08Q;3:07N;4:07J;5:072;6:08L;7:06E;8:03M;9:08A;A:07X;B:08T;C:078;D:033;E:08O;F:07Q;G:07Y;H:01G;I:077;J:08X;K:032;a03ObZYcZQdY1eV5fSQgQ8hO0iM6jLXkJ1lHPmG7nFGoEWpD3quCWrBFs74t62u30v1Uw0IzUäTödip3übL;eLriggM1;l,rL;alWMdimensDCf05VgPhöBlebensGXnä042regiYYsNtLwin08Bzeugt;eJTrL;a01Xi046;chLe08H;arf,uSH;a02Yroß;quatV8rmeHEußH;a06e00iZollJuTwMähLügeHD;!lb1mb1;angQeL;ckOiLrgK;dY0fLgetRRt;aGelL;ha8l0sJ;entfremdEgeVYl0;ha8l0sw086;ch04Xf8YgOsammenL;geMhangLklappb1;l0sl0;s03Owürfe7;eLriffsWX;knöp8reist;eGYg07Kn053rkZ2vil;itOllZ1ntMrL;faA7knirWVreiR7schli068;nersSXrL;al,ifug3;gLl0;e0NlA;gDhLrt,ubT2;l032m,nl0;a0Ne0Bi00oTuNähMüL;nsch059rde06Mst;lb1rscD;nLtentZF;dMschL;gV8l0;!erL;b1hü00DsLvo5;am,chön;chW0hNlkenMnneYQrtL;geHYkarg,l0;l0verhaED;lMnL;bVOsitQ3;beLgen05Qtemper9verdWK;d058hütE;derTedergebUKlQnOrLss04UtQ0;kLr,sG;lichkeitsLsFu064;fremd,geHP;dLtS;elwAschief;dMlenL;l0ss031;!fremd;le00FsL;pruch044t043;hViQltOrNsMttL;er072;ensH8td059;beBEt72;beLfremd,ge03Qklug,oPOweit;k05Grühmt;chOsungsgeNtLß;!hergeho7verL;brO5zweigt;buVImäß;!gSF;muMIrl0;ag01CcShPrOsL;chMserL;dSJfest,s036;b1ecB;m,tHC;lMrL;!hOZn03O;bURfrei,l0w06G;hsFkH;a0Pe01iWoL;g7KlSrL;bePdHe12hOlNnehm,sLt11urteilsJwurfsXL;chLtXC;ne5riftTW;aut,etzte;aV0erse067;hal02Zla3FstL;immt,ra8;ksMlLumFR;!bUFe00HkM1sP8t8A;d04Ffremd;eMolett,sLt3;iWVue5;lLrt;beLfaG;acM7fa88suCW;getationsarm,heme4rL;a05b03d02ein045f00gl01AhYkUlSmRsOtrMwLzwN9ände056;anzt,er065itwEorr2un05L;aLe064;ckt,gTFuensX2;chMe043if8tL;e05QoRMreut,ändnis04O;oll2ämt;ei05FögensA7;etV7iebt,oL;bt,g2;aMehrsLoh7raf05W;beruhigt,rAsc03O;te6ufsL;fT9oOC;aCGeiLängnP6;r02XßuTF;rSQügL;b1uTP;atTFutzt;al,iLlümt;esTDss2tTD;bscheu02Vc002ltEntwortungsL;bIFl0vo5;ri04LteX8;feX7lt01Zm2KnNrL;a7ban,cool,d03JinLlaubG6;al,ös;a29be1Od1Me1Hf1Dg0QheilWEiversW1k0Nl0Lm0Kn0Jorthodox,p0HqL5r0Es0Bt05umsM6vRwOzMüberL;brüc00Wlegt,se053;eitgSQuL;f5VstW3;ahr,e026iLohl;lKWrL;ksFsG;erPoL;lKTrL;berMAeMherO1stVXtL;eilD;ingenKR;blümt,dSfRge034hQkraLVlSWmOr8PsMwec000zLänOPöffentlQR;i02Aol7;chämt,tLucB;aTIeFZ;ei04FiLutEäh7;nOKtO6;eI0of8ül7;rRWälTK;aut,ie4oY8ün4;alEFerMrL;aXXeu;beNeMg005haltsLrepräsEDschei048;am,bSS;ntwicke7rn02U;legt,wuHLzM4;aMchLi01Wo00O;arf,ei048laXRön;chgRZgb1n8ubH;as9eLund;cBflekt9iLnt03M;f,n;opI0rL;ak9CoFPäzis;a045o2Aütz;itteZDoJN;autHiL;ebNGm02X;lMoL;llG6mfoG3nK5rrF7;ar,ug;eLlAut;b05dW1eNVf03h00kZleYnWo04HpfLWrTsQtOwNzL;og2wuAVähLüNS;lt,mt;eiBiß,ol7;ei7rL;ö11übt;chMittEtLund;ra8ö6üm;ickt,minkt,or2ützt;ade,eL;chtLge7imt;!ferX6;au,ieLutzt;rt,ßb1;g2r4;lä6ürzt;a0TeMinNEoLö6;be7rsF;izt,mmt,uH;ragt,ährL;!dE;et2iNDor2raucBuS5;aNeMrL;omm,u00T;hYIin;ir,llJ;b2cBhrKingeschränkt,ntschOrL;fMhö6k01TleJSschroNVwL;a00SünS4;a5Fül7;iKYlo01FulJP;anYVenYVicBurchL;fYLscha040;a03f01gZhWkVlUmTnVIquem,rRsOteiYwMzahlL;b1t;aLoh4uG5;cBf4B;chMonn2pie7tL;immt,äWF;eid2o06we6äJG;eR6üL;ckWh6;an4erkt;aZiebt;an4lKEümWU;eLolf2;lLrrRM;ligt;abt,lK0rL;enzt,üWY;a9IlUNriL;eJ4stE;bLcIR;siQT;bQchWLngeNuL;fLsgegPP;geforMAhQDmeY8;br00AfocNVmeMnehm,taL;stE;ldEss2;dVBgegoLse029;lt2;fangrAkLnacIHsJ9weltbFD;eh01HäJ9;a0Ie0Bhe0Ai06oZrOuMöL;lpQQnern,rO3;gendLrbuOQ;ha8sF;aQeOiNoMäLüb;ge,neU5;ck2sYS;ebDnk023st,umES;nnLu004;b1sJF;ditionNgb1nsLumD;alpin,itCkontiG0pL;a018oDW;e5sL;bEXrA;dQlOtL;!alHFenblMgeL;bOZglaubt;aß,eiG;eGYlL;!kühn;geweiBkrTUmüde,schick;efLlUY;!beMgeLschwarz;frOSkQ6;trübt,wegt;rm3;ilQl020mpOnNrLuH;minLrO6tiär;al,gP0;denziKNor3;erament008orL;al,är;b1erBKnWLweis;deA7kY0lB3nNpfHteVUuL;bLsend00S;!stumm;genti3zbegeisP6;a3Mch26e1Pi1Gk1Ema6o16p0OtUuQystemPäNüL;ddZFffiYRndDßL;!sauH;kS4urefL;est,rei;konform,l0;bNchtMgW1kzeZYpLrjeX5;erb,plemCS;ha8krT5;atom1jeX2stanRItil;a07e03iYoVrOuMählern,örBNüL;ckw00TmpM3;bA1feVEmm,ndPBpid,rL;!mJ;aOeNiMohdumm,ukturL;e5scYS;kt,nGU;bsFng;fLpaDJ;b1fLmildWA;!rei;ckLlz,ß00N;nü7BsL;auHteif;lNmmMnkL;fR0rA;bOPuOC;ecBgV2lLvo5;!os;iMrLuCL;bensB6eotyp,il;l,nL;a7ern,rA;ateUTbil,dtbekYThlU8mmvX1ndPrNtMuL;bJnXQ;iQZtD;k,r,tL;beTBkl1;esLfest,ha8ortAD;bB5gNO;a01eXiUlitterSoRrNuMät,üL;lmaschinRWrb1;kDrl0;achNuLöde;c00SngL;beT3ha8;geWPl0un84;ntan,rtC;fLn006;aseLTrei;eLnd3WrituK1tz;gelLlJ;blRXg00O;iAOkNndYZrMs00FziL;alW3e5;mE2rangG7;takDCulI;lZTrsF;g97lRnPrgNuverän,ziL;alLokuDJ;!l8V;enLl0sF;frei,l0vo5;deYNnenL;arm,gebräu4kl1;ch,ide;aLizzKrupe89urril;l1ndalös;chRegQgnifika4lOJmPnNtL;tLuI;eTSsF;gCXnL;bildDgMRl0vo5;pel,ultan;esgewiß,rA;erheitsLtb1;bC5rele2F;eZgenYRhYiVkundUlPnMparat,quLYriIAssDxLßD;ue5y;il,krTNsLtiJA;ationLi5F;e5slüs7Y;bstMeV1tL;en,sF;bBXgeMl0zufL;riGL;mWNrTGsUC;enTJär;cBdenMtenL;lang,verkGI;!matt;enW6nsuchEF;krQTlenL;l0vVD;a0We0Ui0Ql0Im0Dn0Ao09r04uYwMätzSBön,üL;ch7KlJRttH;aUeOindNuLül;l,ngL;ha8l0vo5;elJ;iVHrL;!beNeMkrQKrAverL;lMDwuSN;l0rF2;hHXsESwafL;fnE;ch,nLrz,tzD;gHzwedW5;bwY4lMssLtGUßL;beRBfest;dMfrei,rYZterL;frei,lang;beLenJl0;lMFwuB5;anSJeNiMoLullK;ff,t04;ll,ttwXW;ckDibL;fOFgeUP;kolM9nuSB;eLöd;eLll;frei,weiß;aNeLieUUuckVV;ichM9lN7rzL;enXFfrei,ha8l0vo5;cLl;hOUkD;aNeMiL;cBmm;cBiIS;chOfMgb1nLu;gKk;l0tL;runk2;trYA;ckNer,kanös,zoL;id,pL;hr2;!salD;el,inLmKrzD;b1tot;dNlMmR6rLttKudIG;f,ma4;kDldJ2;enfJAha8stoffarm;chSfTUgKkraRlQmtwAnPtNuL;bLdumm,erDT;er,löd;tLzKK;!elX2;dQJft,itär;buKUopp,zl0;l,meH9;gKHte;a0TeWiSoQuOätsLEüL;ckLde,pLD;geLsichtsVO;biGQkML;dim8KhLinös,st0JtschWT;el0mrA;bust,h,stJtL;!zfreG;chtuR3esenNgMsL;ikorAka4;id,or0;groß,ha8;a0Echt09d08e5flexCg02i00kYlUnTpRsNueNQvoluNAzL;eptLiprok;frei,iv;iMolut,pektLtl0;abel,l0vo5;dLsAZ;e4u3;arVMetA0rLuBE;eV9o7RäsSS;iAVomm9tVK;aNeMigiL;onTAös;va4;tCxt;t3urL;re4sC;buQJf,n,zLßW5;b1l0vo5;eNiMl0reUZuL;lR2ngT2;erun6Eon3strV6;lMnL;erIrA;l0rQK;a9ZegeSOuzH0;!sL;extrem,geMl56radL;ik3;lDKrL;icBX;ktiMlL;!isUV;onär,v;biat,diRffin9pPsOtNuL;!cEMh,schL;arm,ha8;iFRl0sF;a4ch,tl0;id,pL;eldürr;al,k3oaRK;aNeLietschvergnügt;er,rL;gestrei8schnittsgelähmt;drophon,lLntitI;iLvo5;fB8tL;atCäB0;a11e0Vf0Sh0Ri0Ql0Mo0BrPsychoOuL;blikumsMdelnaLnMZppKr,tzmuntH;ckt,ß;wiQW;g2soRB;a04e01iZoPunkM9äLüde;dikImienNseMzL;is;nt,rvI;begünsOFfrei;bSduR2fQgrOletKmNnom3QpLvinzRWzentu3;ortLpenM3;ionEX;iJ9pt;ammgeLeTR;mäß,s5Y;an,essLitU1;ioRNor3;at,lemL;gJ1l0o4G;mLnzipRMvat;itCär;isLkär,ziös;geLwe6;buJ9krö4;chtLPkLxi5F;tikTR;lSmpös,p86rRsNtenL;tLzRE;!ie5;itCsKtL;hum,lagPZmoMnatLopLF;al,iKM;dern,rt3;toJös;ar,ivaGSyL;gLm7Ophon;am,on3;aLump;kInMtLusF9zeEG;inblond,t8L;gHNl0vo5;ekGOka4;antasieSVrasKänomen3;eilschQWlLänTN;egeFTichtL;b70gHI;da4jorInPrL;fNiphHmMplex,sLv58zeJU;is8FoQR;aI8utT3;ekt,id;et90ibel;aALpVrRsOtMusL;ch3eO9;e4schL;enaß,naß;sLtor3;abel,iL;eSSon9v;aNeDVtL;eiLikKJ;in2Il0;dSnoid,sKAt;i7Ap0E;b02ff00kYll,mWnkHXpTrMstL;dRNmitteldRN;bJDdQiginPnaDNtL;hoMsfL;est,rPM;dLgJK;ox;al,e5är;inär,nGP;eraMferHZpoLt7XuFP;rtXsitQ0;bel,tC;inös,nipL;o7MräH3;kLul1;asPVlFVu7;enLizPX;!sC;dacBXerLjeP1seRU;!lehrE3;aZeUiSoOuMymphoman,äO9üL;ch1U;kle1tzD7ßbraL;un;bel,m3FrNtL;arPOgedruL;ng2;ddQXmaDJ;edHkotinarm,mmerL;satt;gInnQ2rvOtt,uL;!geMhoQDnmalkQBrLtr3vermäh7;eiGon3;bFPschaB8;en3Aös;cUgCPhTiv,mSrrIsQtLßR;iNurL;e5geLintereDDrein,trüb;gNXmäß,treu;onalLv;!b5Dl1N;al,chDsL;!forsGka7;eMRha8;!egelSPrDtl0;hLkt;ahmPMprüPDvoll8VweiNY;a0Pe0FiZoQuNyste18ärchKüL;de,hLrbe;eQWsF;ltiMndgMNskulLtl0;är,ös;d63funk5Wku5YliKMmedi3;bil,dQl5Omentan,nNrMtL;iv9orOB;bid,sG;oLtan,uC5;kaus3tL;on;al,eLul1;b4TrL;at,n;eZlXmosKnSsPtLßQ;glieder0QtL;eLlH;iGJlL;b1groß,hoPEl0;erQTsL;geL;biBFstimmt;derOiNuL;tLziös;enM6iös;m3steriBM;begabt;d,iE6limeterL;groß;s,tJ;diRhrQiNlodiös,nMrMYssLterM0ßb1;b1ers8N;schensNPt3;len3RstL;erDgeL;flKMnPN;dGQfaG;al,kamentös,tL;atCerrL;an;chWgHkUli3TnSrPsMtNWx5QßL;geschneiARl0stabge1Dvo5;chineMkKsL;enDiv;ll,nleMO;gMitim,kLode;a4ie6tgLF;in3;gF9ipulPXnLue5;ha8igQ8;abHeL;ll0;b1tl0;a0Ne06iVoUuPöNüL;gKsLtt;tern;sb1wenL;stME;ftOkrIngen1ApNstMxuL;riös;bA6l0vo5;enMK;dC8leH;bNTckHk3se,trKZ;bTchtReOnL;e1gu3kL;!slL;ibJ0;bLfePE;!eLl0;nNNvo5;durchflutEsL;ch1KtLZ;er3idL;inös;bYckHer,gVhrUiOnLPrnbNsNHtztL;!er,gL;enOH;ar,eh9J;chPdH2sL;e,tungsL;oLstLQ;riL;ent9;enblaß,t;ha8rA;al,endär,iL;slItL;im;ensLha8l0;ecBfBPgrLlang,müde;oß;bil,chDiKmmfroSnPpid1sOteNuLx;nKtLwarm;l0stLD;nt,r3;ch,tAM;dMgL;!sFzeitarbeitME;frLN;mm;a1Ye1Wi1Rl1Jn1Eo07rVuQöNüL;hLnOW;l,n;lsGniL;gsL;treu;gelOlNnstMrLssJRß17;i0sCz;gJOvo5;a4t31;fest,rund;aTeOiL;mMsenLti77;fest,geschüt8C;in94;atCbsOiMuzL;ungsJ;deblAsL;frei,rund;krGX;ftNKmpfDnkLss,ß;!enhauLha8;srPI;axi3ch0QedukIffeinJgn2AhäNYkett,l0Nm0AnUopFPpfRrPstMtzL;übel;b1enL;bLfrei,iL4l0;ewußt;puB1rL;ekt,upt;gesLl0schüttMD;teL;ue6;di2AfZgrEZjunkt2DkYsVtNventL8zeL;ptL7rtLssC;ie6rP5;aktQi2CrL;aMovLär;ers;proMstL;iv,rA;duK9;arm,schL;eu,waG;eMis2MpirItL;a4it2DruK5;qEMrvI;av,orda4rEurren6M;essionKZorm,us;foWmSpL;aQetPlMromiL;ss0Sß0S;an1eLiz9;mLtt,x;entär;e4itC;kt,t8U;eNuL;nLtI;al,ikI;ntaFIrzKK;rtMU;lMoL;ni3ss3;egi3;ecBfest;aOiMöcFPüppelL;dick,ha6;eJttL;erJ;bKllHA;aPeiNiLopfNCug;scheeDtL;schnPzeklein;dsFnL;g8Rkar9laut;g7Kmm,ngM0r,tschL;ha8nL;aß;lometerOndL;erLgAMha8;lLrA;e8Vieb,os;lang,weit;ck,imJrLusGß;nl0zengerade;fka4Shl00lUmpfTpPrNtLus3;astroLeg9L;ph3;g,iL;kat84tIös;iMriLutt;ziös;ll1tL;aliJ8elMP;beFSl0;orienNtL;!geLlächKI;preNschleu6D;arm,bL;ewuL;sst,ßt;!geL;freKNsch9M;aQeck,uLäh;geB1ngMstiL;tiLLziLL;enDgMverheL;irJN;ebliHT;gdbAGhrLmmDD;eGYhunderteLzehnteGY;a7lang;de6Dgno1Dll1Bm14nOrrMsomLtD7;orph;a00eL;al,duz76gRparLBvers76;ak0Zbegri4Rd0UeffeI5f0Oh0MjeI5ko0Jn0Ho0Gs09tL;akt,eRim,ole18rLuN;aLiIC;liELmMnsLzellCY;itC;olMuskL;ulär;ekCU;g00llZnYrL;aHWdWesJDfraVkQnOpNrogIsLterr8H;exHRteL;ll1;lanet1retI;!aL;tiBX;onNuL;ltL;ure5;fessIEtiL;ne5T;ktIC;isziplinär;sCtiBP;eD6i1H;er,rI;ektQtLuffizAH;aOiMruL;ktCment5I;nHDtL;utI3;bil,nd96;izid;ffizI3p0O;erLovI;!dJC;mpat66nsL;eqBNisL;te4;altsLäKA;leHrAs5W;aPektiös,initNlaBNormMrarL;ot;atCe5;!esL;im3;m,ntil;iMuL;ktCstrHO;ffeK0rekt,sLvidGP;kLpIC;rEutJW;tCzeptJV;aginFMmQpL;erOoMreJHuL;lsC;sLte4;a4s5L;i3ti8U;a8Ti8Tun;eg3usL;iB4tH;ra4;a1De0Wi0PoYuRyOöMüL;bsGlleETnK;lzern,rL;b1enHQg0Onern;brid,perL;korrekt,moLsens5A;dern;mPndL;eNsL;gIFmisL;erJA;ka7rtJI;anLorIT;!itär;chPffIPhNlMmoLnorJ6rizo48;g2sCG;d,zJ;eiLl;tsAZ;!a05b02d01eZfreqAEgeWintelliVkoSmoRqPsOverNwilL;lkL;omm2;d8Ueh6;chwangHpezialG2;ualifL;iz9;dern,tiv9;mplMnL;zentr9;ex,iz9;ge4;acMbi3Deh6lobt,sL;chätzt,tBF;htE;rLxplosC;freut,hitzt;euHLot9;eLriGV;gLtagt,z0V;abt,lückt;chtu72ktF7n29ufgeschoHF;ebJ7lfQmmPngebu71rnLtzegeplagt;gLl0verAU;esL;chäL;digt;elweit;l0rAs7T;iUktaTlQmmuDErLterCH;ausObNreDHzL;allerliLensgut,ha8l0;eb;!süß;zieIQ;dKlL;!lLwaG;icBodED;rwIN;kel,lQmaFEsHtHzb1ßL;!beg0Gerseh4gelOumL;käMsL;tri4D;mp8;aAJiebt;b1f4Nl0sF;arWfIPgHlUndQrNsseFOuLßeFO;chLsgemGBteng;dünn,za6;ml0sGtL;!geL;fr5KkDQso44;bBHfest,geLwarm;arbMbu70näBstrLwebt;ickt;eitE;bLog2sfern,t2M;!fett,leHnIIvo5waG;genau,l0sL;chaL;rf;a21e0Gl0Anad4Bo08rRuLymnasi3önn3Aü7C;ssPtLßP;!bezNgeLsiGO;klLl2Hm5B;eidE;ah7;ei07;aXeUiToPundLün;falsGl0schlCIverL;kMschiL;ed2;eh6;b,tNßL;!angeLdFZ;legt;esk;ff6GmmsGpp3;iLll,nzeC5;fb1sL;!enD;dDJmNndi0uMziL;l,ös;!enDmel9sF;eEMvo5;ldeLtE4;maill9n;aPeichOob3äNüL;cLhendheiß;kl0;sern;b5Hgesin4;nzG2tt,ubDzi3;b13d12e11f0Vh0Qist0Nküns0Ml0Imein0Hn0Cpols55r04sPtau8wL;altNiMohnhL;eit4O;e8l7ssenB1tzt;l0sF;aWchQeOiMpa6tLund;alDQe92;nnungsLttE;l0treu;gnEndEtL;zl0;ePiOlLmackFQnie0Ou7wind,ätzt;echtsMiL;ff2;kr8ZrHN;ckt,ed2;it,nkt;lz2mL;me7tL;!dEXha8;aRecBiQnPtensOuMäL;de6uschFG;cLhsF;hl0;chl8P;gesU;ng,ss2;um;aOerNiLuC5üDH;al,eLt3;ßb1;e5ös;nt,u;!sF;aMb,iL;eh2;ckme9ngwLu4;ei7;te7;eLl0rA;rDsL;g2Ikr88scE2;aObehNeimLorsFör4;!nL;is75;inR;lt73ndicapt;ahrEQechts4PiePlüOühlL;l0sLvo5;bLka7;eto4;ge7;de6;ignE;anA7iG7uBNächtnisscDP;iLlümt,urtBIührGD;ldE;la4n8X;a1He11i0Ul0Lo0CrXuNäk3öderMüL;hAPn8;al,ie6;lmi5FnNrLßJ;chtLi0;b1l0sF;daPkL;elnagNtiL;onL;al,e5;elneu;meL;nt3;aXeUiQoNuchtMühL;!rG1;b1l0;hLmm,nt3;!gelL;au4;e4Lgid,sL;chgebaMtL;g9Ml0;ck2;ch,i,mdMq5KudLv3G;sGvo5;!wortJ;chtJgLkt3tzKuK;il,l0;kuSlgPrLssil,t8B;mLsG;aMb1elLl0sc7Gvolle91;ha8l;l,tC;enLsF;l0sL;chwH;ss9;aQeNiMott,ügL;ellahm,ge;eder81nk;ischMktDNxL;ibel;ern,fa7Zl0;ch,mbMttLumwA;erD;ie6oya4;cQeOgNkDPnLschrAt,x;aLit,stH;l,nzB7;ur3;berLs;frei,ha8;ht2;derYhlerXinTls5Yminin,rQstPttNuL;chtLd3erE4;!warm;!arm,gLrA;edrEK;an77umriC7verwC4;nsehMtiggL;ek9A;g8Imüde;!geL;maMschniL;tt2;hl2;frei,ha8l0;leL;icB;b00chYd,hXir,kultIlVmTrbPsMt3uLßb1;l,stdick;chistoMeLs6N;rnDW;id;eLl0;cBnL;blind,fLrA;roh;iliLos;eng80är;sGtL;en8K;l,rb3E;fr9LgeL;mäß,r7W;elDulL;ös;cht2Ddel,ff2Ah26i1Pk1Ol1Lm19n0Xr04ss03tabl9vent96xNßL;b1gL;estö6;akt,ek96istZklYorbiXpUquisit,tNzeL;lLssC;le4;eNrL;aLem;fein;nsCrL;n,rL;itL;ori3;a9EeMlLonent9RreBQ;izit,osC;nsCrimente5;ta4;usC;en38;b1en37;b0Bd08eignis7Uf02geb6Zho1Jk01lYnVog2reUsQtrOwLzä0Sört77;artungsMerb9MäLün1G;gA1hnA1;g03vo5;agLäuCO;b1l0rA;atz4Set1WtL;geLreb9W;bLnAX;or2;gb1icC8;eut,stL;!gemLha8;ei4;auMeL;rBZs2;bt,cB;enBXläBC;ahrMindBSolgL;l0rAsverwöh4;ungL;sgL;emL;äß;fa5IverMölfL;örd7J;bu0L;armLb03;en9CuAN;dl0ergierAgVorm,tL;eiTgePhOlCAsMworf2zL;iffeAYünBE;aguLchulBDetzt;ngs2V;al5Q;genMisL;te6;gesL;etzt;se4;!befr5R;bry1RiVotionRpfL;aNeMindL;sFu5U;hl8V;ngsbL;ereL;ch4R;al,e5sL;frei,gL;elL;ad2;ne4;eMitär,lLoq1Rter5O;en5V;ga4ment1;elD;dottergelb,nOsLtel;eMfrei,gekLig7Cka7;üh7;n4Wrn;dWfTgefleiSkRprä7ZsNtreibb1verstaMwaLzeln;ndJ;nd2;aMteL;insGl5Y;m,tzL;be3W;la41ommenss6L;scB;aMlu6EühL;lsF;ch,lls5U;im0Kr66;eNrL;b1enLl0;ha8vo5we6;l0s6Z;ektMizL;ie4;iv,vo5;!goMsilL;bern;ld2;a16e0Li03o00rUuOämonKüL;nnLrr,stH;!beLgesät;siede7v0E;al,bi0lPmOnkel,rchL;fMsetL;zb1;ormul9üh9A;m,pf;dsF;aPeLitt,uckrAUöge;hNiL;dLfaGst;imW;b1zah2Z;h6Kng11;ll,miRof,ppeltL;!gemL;oppe7;aZcVenstbUffSgRmQrekt0LsMverL;ge4s;krEruNsoMtingu9ziplinL;ie6l0är;na4;ptC;ensiV;it3;erenLizil,us;t6Gz8O;ar,e2M;htLk;!beLgedrängt;vLwölkt;ölke6;gMlektJmL;ant2etr3;on3;du5DfYgXh91kWliUmSnPpNrb,solat,u7JzL;entLim3;!r3;laLre83;c9tz9z9;kLt3;b1fLsc73;aul;enLin54onstrI;t5Yz5Y;kat,nqL;ue4;ade4lin86orI;enYre7T;eQiNlaL;tiL;onär;nitMzL;itär;!iv;kt,nsC;gew46nk2ErstMt7UuL;erDmenb1S;el3R;hOlevHooMurricL;ul1;l,pL;erI;arLic;aktLma4;erL;vo5;a32e19i0Tl08o06rSuOöse,üL;g17hnenMndLrgera4GschL;elw88;r94wi41;bKkk3nLtterwA;dLt0A;esLw84;d6Fweit;aRePi5QoOuMüL;hwarm,nett;chLt3;fest,l0stückD;nz2tl0;itLn7S;!gefäche6;ch,ndOuLv;c7TnL;!geL;br6E;aMheLneu;iß;kt3S;de2AmbLrn9sD;en7R;a00eWiSondRuMätteLöd,üteQ;rl0;meOtL;arm,beflMjung,sv4DunterlaL;uf2;eckt;nrA;!gefärbt;nd,tzL;blMgescheit,sL;aubHch4B;ank;cMiL;eMfrei;heL;rn;m6InkMs9ttLu,ß;l0w75;!gepLpol9;utL;zt;bZeXlQnPrk2sOtterMzaL;rr;!böse,sL;üß;ex30;är;atQdMiL;ngu3;e69hMscL;hön;a8üL;bsG;er3;dHgLrernst;b1sF;el6Q;ac1Cd10f0Wg0Uh0Ni0Kjamm19k0Il0Fm0Cn0Bquem,r02sVtQwNzL;ah1SwL;inX;egMoh6DuL;nd15sst4Nß39;b1u0Y;agt,riebsMteLucB;larm;am,beL;reL;it;chPen2JiNondHserLtim6J;gestel7;er;eLnnu0P;gb1;eLlußr72w49äftigu0N;id2ue6;eRnsteinPufsbeNüL;chLhmt;tigt;d44zL;og2;faL;rb2;che5Rit;em;achba6eM;erkMitleL;id3C;b1en3C;aMeLiebt,ämU;ibt,mTs2;ng4Ls5Y;an4lLn61ümR;ag36oppt;nMspielL;ha8l0;ha6;aa6eOuNäL;mLnd;me6;tsF;iMrL;r0Mzt;m2Szb1;ehLierdel0rüß2V;b1r2U;aNrL;euL;ndE;h4Gng2;aSeOingMürfL;ni28;t,uL;ng26;nMppe6utL;sFu3W;keL;nl0;rfsgMuL;ern2H;erL;ecB;ht2D;kt1SlladKn3rOuL;mLr5O;laL;ng;!geldl0oLsGtl0;ck;enD;ha8;alg5Kb48cht44d3Sff3Lg3Jh3Fk38l2Cm27n1Dp19r0Ws0St0OuL;di0Lf09genzwink08sOtoLßerd2V;frei,g2nom,ritMsugL;gestC;atCär;dr03eZfYgSlandsd2RnRsPtauOweL;cLgl0ndiggeler4;hseL;lb1;sc4A;ichtsLprec49;l0rA;ahm1C;eMlL;eic45;buf8fuMkL;ocB;chst;ft;üh3B;inandergesMrlL;es2;chriL;eb2;ucks2T;ernd;geUlPmeOsL;chluMtecL;kb1;s3JßrA;rksF;agMöL;sb1;ensL;c1PtL;ark;duLregt2;ns2;ovisLtC;ue5;eml0om1trL;aMibL;utC;ktC;chblNoMphalt9soziItL;rein;zi3;eiGond;beitsSgQomatProOschNtL;frLglAv01;emd;ka7;ga4;is9;!l0umL;entI;am,iNl0sL;chL;eu;nteL;nsC;felgrün,pL;arIetiMroxL;imI;tl0;alog,dersgea0Derk0Afe09gZnYoXsTtiNvLwen2H;erL;wandt;baktOkLqu9;!onzeptL;ioL;ne5;erL;ie5;chmieNpruchs1FtL;andL;sl0;gsF;m3nym;eh2M;eOreiNsteL;rfL;ül7;fb1;bPgraut,heiNjah6me0JneMrauLstammt;ht,t;hm;rLte6;atE;or2r0P;ch2C;an4ennL;enL;swe6;rtE;bNput9tsmüMüL;sa4;de;itiLula4;on9;arm9e6kohol0Fl07pin,tL;!bew05d03ePhMkLüberliefe6;lug;ergebrMoL;chd00;acB;ingeTrL;nativRsNtümL;elL;nd;bedMscL;hwaG;inL;gt;!l0;seOwL;urL;ze7;lt;ss2;euL;tsG;äh6;bePerNgL;emeL;in;besLersL;te;kMlieL;bt;an4;frei,is9;kOtNut,zeL;nLpt07;tu9;iv,ue5;redMurL;at;it9;nuL;ngsL;l0vo5;ll;greLil;ssC;eOiL;n,rmI;atC;iv;ktiMngeL;il;on9v;diTeShäQoNsorbL;ieL;rb1;lesze4rL;abL;el;re4;nt;rrA;tiL;on3v;al;b1faGl0sFzigL;faG;am;os;b0Rg07lei06n03onn9rYsStrenRweL;chslMnL;db1;ungL;srA;eiG;ch;nb1;atzwOeNolMtLurd;iegsgefährdErakt;ut;hb1;eiL;se;iebMuL;pt;feL;st;ie6;ehMormL;!al;mb1;tb1;aZeL;brüBfVlToRsNwL;irtschaftErL;acU;chirNpL;act,er6;rt;mt;rdnE;et;eg2;en;ucL;kt;ht;bMsaL;rm;enJ;frL;ei;aNrucL;hrL;eif;ub1;ar;laL;tt",
    "MaleNoun": "true¦0:BX;1:C4;2:BR;3:BW;4:C3;5:BE;6:8P;7:A7;8:BU;9:AT;A:5L;B:BV;C:AW;D:96;aAMb9Ec8Xd8Me81f77g6Jh5Ti5Mj5Dk4Hl48m3Qn3Io3Bp2Fr1Ys0Vt0Gu08vZwPxiao1WyigDzE;aeh7eLiKuEwa1ypri9C;ck6eg0gIkae1SsEwae2L;ammenFchEt0B;au6uCB;ha1sE;chC8to9Z;!a1;ns8vi73;do1iEntralraBrouD;g6tE;g89raum,so9Zungs2F;aMeIiEortlaut,unsch;derspB7lFnd,rE;kungsgrad,tschaftsBK;lenEs5;!berg;chselBPiGltFstE;-p0en73;kriBCm77raum;hnachtsbaum,n04;ggoChlBGld;at6eHiGorE;b8Qga1ha1jahreszeitBBo96ra1sEwuerf0;cAXi8BpM;etnam8Jttorio;rEteran0;bGda9Mein65hA2lu2sEt9Q;e,tE;o9Cyn0;ae86raucherpr97;eberKmInGrEs-9E;laub,nenB5spEwald;ru1;-9Bf9Tmut,terEwi9U;ga1nehmensgewin7;fa1ga1stEwelt2W;ae7Z;ga1sch10;aQeNhMiKoHrEsche5Luerk0;aEes0;ktAuE;ergae2m;desschuB8eFn,rEurist8;eros,nados;ne,pf0;erv9PschE;!e;e4Gier4orvald,r5;e,ilnehme2CppiFrEst68;mi7rori2;ch;g,milenEnz,rif2U;!rebe9B;a0Fch01eYiWk36low3KoTpQtGuEwiad;edEpermarkt;en61o2paz1Kwe2;aKeJolIrGuE;dEehl0hl;e3ien9O;eiEumpf;fenw4Qk,t5W;pe,tX;i2Lr2L;atEdtt9Qe90hl,ndo81r,use0;en,sE;b4Sp7RsekretaAB;d-73e3Ki4LonsArE;it,uE;eng0ng;eh7ld9mmerFwjeByinka,zialE;d78i2plae7staaB;!nachtst9Y;cherheitsEn7;g4Tk2W;g0ktAnErb0ssel;atEiAsA;or0s;aPeNiMlLmKnJolz,rIuGwE;aEu1;n83rz04;es7Xhe,ldE;en5K;ank,i67;aps,ee;idt,oldt;achtbu8Eüssel;enen6Vl7Im5nk0;rbenhaEwardnad4;uf0;deCed0rEtt0;pi1;al,e92ft,rg,tell5D;aTeNiKoIuE;eEmaen0ss0;ckEhe;en,ga1schlE;üs4;ck,tE;or0stift;e7EngFos,sEval0zD;ikofa34se;!o;be7XchtsIfe20gFh4iEktApraesenta3ser12xrodt;chtum,n7Fz;enFiE;erungsk20ss6E;wald;ext53s36;diergummi,ng,tko,um,viv;a01eYhilXiWlToQrFsych2QuE;llov6ts8Q;aesidentNeLiKoE;duHfGjek0VtEz70;ago5ZestE;a3en;essAit;ktivitaetszuwäEze3;ch4;mas,nz8vat4C;i4sseE;bericht0;en,schaftskand1Y;lizFol,rtE;illo,ugi5S;eik1Hi2;aEeitg0;eEn6Ktz;ne6Utz0;cassos,errGl5S;ippe,osoph0;nFrE;ot;!g;es4netta,p5rJsGtFzE;ifik;ie3riar2Wt0;sEtA;!aE;gi8Ant;kEtei52;!pl7F;berJeHffizi87goni-Ypa,rFsEweC;t3Lwald;der80ganisEtsverein0;atAm0;koElk6N;l5Wnom0;kommandiere4Won;aHeuGiFordE;o2we2;ed2Ilakout;an45ba6X;chbaGehrb31me65tionalE;i2sE;o14ta9;rs64;aTeRiPoGuFythE;en,os;enteferi1s6Tt;enche,nJrIsE;che,lemE;-Es;aktiE;vi2;g0ill5;aFiE;tor;r20t09;nisterp4WtgliedsEyazawa;s5Qta9;chanism0nE;g,s1W;er6Hn0YrktEsssta1Utthias;!platz;aLeJiIoEöffel;bbyi2ch6eFhnE;absch7H;hEw0;ne5F;ami7ban5efe3Un3L;bens6Xhr6iE;be,tzins8;ed0fontai7i0stw1C;a02ell01inderZleiderhYnut,oIrGuEw5;ch0gelschreib6nde59rE;d0on,se58;eEo9;d2Pi4;ch,epf0gnak,hlhau3Cll6MmQnGrrEsteng1M;espon4DuptionsskE;andD;fKkurJrIsGtFzernE;e51s;inentJrahe3;eCumE;!e3;ad;re3;erenzkFliktE;en,s;reis0;mFpE;liz0o3Iromis4;and3Ou3H;ak0;ga43sE;chuh0o4J;er,n6;ffee,kao,mpfeins5JnIpita0rEtholik8;amira,dinDlEst0;-EhF;hEotto;einz;al,dE;id9;aKeJiIoGuE;d0e0CngsoEri2;zia19;ch0erg,schEurna18;ka;a1gD;ns,ts;cks5hrEns0;esan25ga1;deJg-metall-2Pmpul4nGrFsE;a1la1U;aCrtum;dustries44go,itiatAsa29teEvestA;nEresse3;da3;ol3K;aNeKiJoGuEwa1;ngerEt;!streik;chschulreEef0;ktA;or0;mmel,nw3Fpparcos;inz,lFnErr8;ni1rik;d8mJ;bermSeRf0mburg6nJrHushaltE;en,sE;!sE;treit;ald,tmE;ut;dlungsspiKg,sE;-Ee9georg;hHjE;oFueE;rg0;ch0erg;ag0;el4V;f0upt2T;as;-39aXeNinzburg,laMoKrEuld0;enzuebIieHossEue1T;bEku1Sraum;etriE;ebe;ch0;er4P;izueEldsto7uvern1Z;ta;nz;burtstag,dank0fange7nKorg,rIsHwiE;nnFssensgE;rue1I;e,s;a1ichtspun3Qundheitsschaed0;h0PichtssaDstensaE;ft;eraEo0Y;el0lE;!inspe1M;eGmsachurdia,ng,rt0zaE;-sEsE;treif0;rt0st0;a02eYiSluNortschri0OrJuEüll6;eHndamentaGs4ßE;!bE;od0;li2;hrerscheiCr2s27;aFeiEiedKüh1X;d16landv2Y;geb1XnzE;!o23;echtling8gEr;haElots0;ef0fE;enE;!s;lInFrmenEsche;ku0Q;anzEg6n0;e1Gjongl10mE;aer2X;ipinos,ms;ldFrE;dos,nseh6;beE;rg;d0eHhrschein,ktGnFvorE;it8;g,s;en,or0;d0ll0;be19g5hrgeiz,iRlQmOngLrloe1ItKuIwald,xE;-Gpe14tE;reE;mi2;kommu0Dp0T;-Eg0;kommissionsp0Rs1M;aBo;elhEpa3J;arE;dt;igVpE;fa1;efa3lemann-jens0;dgInEsr2T;b2Hdring0Uf3BgGkla1sEtrittskarte,wohn6zelvert1E;ae2IchniE;tt0;a1r2J;enoE;ss0;aMeJiGonalds5ruck6uE;ft,rE;ch2Qst;eEplom9s0A;nstEpg0;ag,en;al,moEng;kr9nstE;ra3;eEhrendorf;mon0n0;astro,hJlint5omHsu-E;vorsiE;tzeE;nd0;monwealth0Rput6;er;aNeJinIrE;istFoE;ni2;dEen;emokr9;es0;fredaFmieE;rie4;ktE;eur;ot0;a0HeZiXluem,oTrNuE;chstab0ll0nGrCsFtrE;os;!s0;desFzenthD;al;pEs09;raeE;siE;de3;anGei,iEock0unn0;efEt0;en,ka2;cheneEdt;xpeE;rt0;d0eEg0rk;d0rsenE;ga1neuE;li1;ldschirm,olE;og0;amt0itUneluxSrKsHtriebFwEzirk;ei4;e,sraE;et0;chluEen;esE;seL;eicheKg,iJtHufE;!sE;soE;ld9;hoE;ld;chB;!n;-sE;ta9;ra0R;c5hnhoGlk5rnevWuE;loew0m,stei7t0;ne;ef0f;b12erzt0ffront,ge3irporBkt0Tl0Om0Ln07p04rYsTtOuE;fKgenzJsGtoE;kEm9r0;onzerC;flu0Iga1nahmefEweis;aeE;ll0;eug0;schFtraE;eg0gs0I;rei,wu1;em,laGomE;tesBvE;ersuche;ntEs;ik;i9peLtE;a,ronE;aEom0;ut0;at0;beitsHchiteGeCm,tiEzt;keln;ns;kt0;plE;aeN;fFpetE;it;el;aPdNfa1grMrKsGtFzuE;eg0g;eil0;aeGcFpE;rueche;hlaN;tz0;eEuf;iz;iff0;ers5ra1;on;ly2rE;chi2;aFtskollE;eg0;to;!kohol,lGptE;raE;um;einE;ga1;eur8iE;enGonaFvi2;st0;er0;kur4;!en;ts;nt0;en;ga1sE;chFtricE;he;luE;es4;se;ng",
    "Adverb": "true¦0:2N;1:25;2:1Y;3:2M;a2Eb24circa,d1Re1Gf1Fg15h0Yi0Rj0Lk0Kl0Gm07n00oZpYquasi,rund,sQtPunNvIwDz6äußer2üb4;er4rig08;all,haupt;i9u5w4;ar,eimal;er2g6letzt,m5n1Vs4t0Zvor;amm3ehY;ei2inde2;lLrunde,u2G;em0rka;ahr7e6ieder5o4;a20hl,mög0;!um;g3it1nig;haft,lich;er7i5or4;ab,er2gest0Tn,weg;a,el4;!erorts,leicht;gebQmut0sus;bedingt,geachtet,te4weit;n,rdess3;eil1Roi,rotz;amt,chAe7icher0o4tets;!eb3fort,g4mit,n2;ar,l4;eich;hr,i5lb4;er,st;nerXth1;l1Qon;er,ro;b3ft0LhnehI;a9e8i6o5u4äm0;n,r;ch0Itf1Z;e0Hrg4;ends;benan,tto,u0;chts,m0Ktür0;eBit6org5öglich4;er18st;ens;einand1saQt4unt1;e4lerweile;ls,n4;!dr4;in;h1Ni2;e5i4;eb1nks;dig0id1tzt4;end0lich;aum,einesf1Hnapp,ürz0;a,e4u2;!d5h1mals,t4wN;zt;e4och;nf1Cr4;zeit;mm1n5rgend4;!wie;des,klusive,ner0Rs4zwisch3;besondere,ge5o4;fHweit;h0Asa4;mt;eu7i4;er5n4;geg3sicht0;!zulanE;er,t4;e,zut4;age;aCe6leich5rößtent4;eils;!wohl;nauso8r5st4wiß;ern;a5n4;!e;de;!gut;nz,r;a2ern1olg0rei0;benDheCi6n5rst4twa,xtra;!mals;d0tsprechend;g7n4;m5s4;c01t;al;en4;s,t0;mals,r;!f0Bso;aEe8oBr7urch4;a5w4;eg;us;auß3in;mn7nnoYr4sC;a5weil,ze4;it;rt;äch2;st;h4mals,nn;eim;ald,e8i5loß,rut4;to;nn3s4;h1lang;er;i6kannt0rgab,s4wußt;o4tenfR;nders;nahe,spiels4;weise;beOlKnCu4;ch,fgruAs6ße4;n,r4;halb;gerechn6sc4;hl4;ieß0;et;nd;der8faDgesichAläß0so4;nst3;en;li4;ch;n4s;f8or4;ts;le4so;in,nf5rdi4;ngs;al5;rma4;ls",
    "Infinitive": "true¦0:1OY;1:1O5;2:1OD;3:1OL;4:1OX;5:1O8;6:1M2;7:1JZ;8:1OC;9:1OE;A:1OP;B:1NM;C:1NY;D:1NC;E:1ON;F:1O1;G:1M7;H:1NZ;I:1H2;J:1OJ;K:1LH;L:1OW;M:1LO;N:1GR;O:1MM;P:1IW;Q:1N7;R:1FE;a12Db0UPc0UHd0P5e0GCf0CQg0AKh04Hi03Nj03Gk004lYVmWRnUAoTYpRXquRPrPXsLAtJVuHBv97w6Qz1Aä18ö17übS;eSrigb079;l0TXn,rS;a13b10d0Ye0Vf0Rg0Qh0Pk0Ll0Hm0GnJRor1M4prVZqueONr0Bs00tXvWwTzS;aJe0GMi7äJücC;aKKeHDiSuc1KGä0WU;eg0nS;d0te2;ePSo1J6;rTöSün1;l1NAn0;ag0e1CHumF;chYe13LpWtTäS;ttBue2;eVEiArSü1D3;aSei1DEöm0;hl0pa1LM;a1O1iSr076;el0nn0tz0;aUla1JNn7Zr0PGwTäS;tz0um0;a1J5eA;tt0u0;aVeToEuS;m1MWnd0;a1L8d0iSnn0;ch0z0;g0s1;a0YKit1KTüd0;aUeTiS;e1DVst0;b0g0it0s0;d0ge2pp0s1DXuf0;i1ITl1HUoTrS;iGu1NX;ch0mS;m0penL;and0SYeiz0i9ol0ä07Fö121;e1B7i1MTre1M2;a19JlUorMrSü1MY;a051eS;md0ss0;ie1CEut0ü1KO;iSss0;gn0nS;koAsWY;a39eSoLr7;hn0nk0;au0eTi1H4liHrS;at0i5üH;ansp10Hha1O4koAl0YUt0T4we1BC;nstre5r1O6;d0f0VIl0;chIUff0hG4n9Hr1FIsStz0u9G;c1J3t0;a55e3Ui3QoEuZwVäUö1FGüS;c0X3ge3nSrn0;de1EDge3;h143u1GL;angsumsie1HXei9DiSä5;e1D9nTr1D9schenSt1GM;bleRlaR;g0ke2;ar1NUb3Eck0d3Be3Af35g32h30j2Zk2Vl2Tm2Rn2Qor1KGp2Or1Cs00tYvor1LVwUzS;aJi7uSwin183äJ;ge1IWla1MCm13DrecQsWEtr1H0weR;anMeUiS;derSnk0;h10Zla1NJ;h0is0nd0rf0;e1HHrS;a9WeHRiP;a00chWe11XiVpUtS;ande1LLeSiAo11Lr03Wu9öp1MLü1BG;c1B3h0ig0ll0ue2;e14Li1B8r15Q;c1IHtz0;aUie1BQlTme1BMnSr0D9us8ü1IX;a1IZei1FIür0;ag0i1LO;nz0u125;g0mmenS;ar1NBb0Pd06Mf0Mg043h0Jk0Cl0An17Ep09r04sXtrVwUzS;i7uSäJ;f0N6s1N1t87;ac1A9e0BEi0WY;ag0e1AEoS;c1H7m1GS;chVe9iUpTtSu1;au1e0CWiAoß0r0GMü1B0;a1AUe146;nk0tz0;ar0YHie1BBlTme1GTnR4rSwe1B7ü1II;a1IGe1IFumpfe;ag0ie1IP;aVeTin1J7oSuf0ä1J1üH;ll0tt0;cQiS;h0m0ß0;ff0uf0;a1LDfer1r1JD;aV2eSiGäp1KGüg0;b0g0im0s0;a1MKeXi1I7lVnToWJraSup1KP;mXYtz0;e1K7üS;ll0pf0;aG0eSi5;b0is8;hr0tt0;aTeSä5;ft0il0;e5lt0u0;aTeg0iRlSü0LC;ecCi1KP;hr0l0HNss0;aUeTiRle13Eo1FSrS;au0e1i5;iß0t1IB;ll0u0;a12e0Xi0WoEr0u0LüS;ckSst0;b0Gd0Ee0Bf0Ag0Qh0IFjOk09l08m07ne1FApraEr06sYtXverVwTzSübMV;aJi7;anMeSi0VVü0XH;i17Mrf0;fo17ClSse9we170;a5eg0;au1FNr0GY;chWeViPpUtS;e0V8oß0rSu9;aJei1A6öm0;ri5ul0;hn0nd0tz0;aTeu1IVi1F1lOneErSwiA;a1HAe1H9;ff0l0H2uAK;ei0A8oEuf0;ar1IOe0Z6;aU0eQiG;a1LJeDla1FUoAäA;a16PiRlFGorMrOüD;il0rS;bi1H3ha1LJin1K0la5o1KCsM3wS;a18Qe0S1;a6ePrS;eh0ä5;eTi0NDlSri5;e12IiH;g05Wha1LDkoAug0wG;eckSf0;bLWe00fZgXhWkVne1EHtr1E9zS;aJi7uS;drae5eYfüDgVHh0HKkSzi7;a1L5eDoA;a1L4eD;ab0ol0;eSre1IR;b0h0wi1K4;a167iR;ro1JV;cCe1HD;chSd0i1JC;n0tS;biGfiRk03XlGma1sTwe15YzS;im1ANuTJ;chus8e9tu9;t0un0;aHfSro1K7;en,roF;a1H4e1HKäh0;aSe1JEut0;ch0ue2;aSe0GYäc1GGöt0;ch0d0ng0ss0uf0;eDlUnToSriG;mm0rk0;aEöF;a1ESeb0iP;auc15Bu19Y;aSe1EFo4ä5ör0;k0lt0u0;eSi1ITre1I2;b0h01CsS;eEt7;aVlUrieSäc1G4ü0JC;denSr0;g1DKla1IYs1K6z21;ie1J0üs8;ll0ss0x0;ck0ge3i172r1J7;ePiTrS;eh0üH;en0k6;aUeTiSlin1BDri5ut8;llBnd0;iß0koAre1K6toK;l0PHu0;eUgeu1IHm19Qnk0rkTs1tS;i4te2;e3uN;h0l0m0r0;ch0hr0i16Slt0m165n0ZrSt1FZug0;b0Vd0Tf0Og0Nh0Lk0Dl0Bm09n07p05que1I3r03sVtTwüJzS;a1JDuF;e1DQrS;am1HUeTFüm19I;a1DMchWe9iede1A7pUtSäg0;amFe1o4reSä1F9ör0ü6E;it0u0;a1JOl1EIrS;e5i5;eTi03BlOmeSne1F8;iß0lz0t8;ll0r0ue2;eSi1IJuFüt12P;d0i17Vn;fSiHla9re1I4;e1H2lüNC;aSicC;g0rb0;aSet1AMü0PW;hl0lm0r8;aSeg0;ts1uf0;au0lXnUo1rS;aSäu1ICü1CX;ch0tz0;aTe1GSiSüE;rs1t8;ck0ll0u1HC;eSu0DU;b0i1HJ;aSäck1I5;ck0ge3u0;eh0lBC;aVe9lTrS;a191e1HK;at8eSi1H9;dMis1;ll0se2;amFeEon1HArS;ö1HWüH;eTiGlOCo72rS;e1öc1I6;iß0ul0;si4trS;a1AKiS;er0fu1F1;eJg0h0W7nk0p1C1uS;be2de2s0;a1Ze0Ri01o00ri5uWäUö2IüS;hl0ns1rSt0;dBfe3g0z0;g0hSlz0rm0s1AV;l0n0r0;chUeTnMrSse3;m0s11Jze3;ns1rdB;e2t0;hn0ll0;c0Gd0BeXlWmme1C3nVpp0rUsTtS;te2ze3;ch0pe2s0;be3k0t0PF;d0ke18Lse3;de2lB;derSge18Jhe2ne2;auf03b01erZfiRgeYhWimFkVli1BBsUverTzS;ug1BA;einige,ka1HX;ag0eh0;eDoAriGäu0;ab0erSol0;s1HRz0R6;b0wi1GV;g08Fha1HUke1GUla5stSzäJ;a1DDeh0;eSri5;koAl1B0;t04Uzu0M7;erSm0;faDhaEkYRlGn,r1HLsS;che09Le9pTtS;eh0r1AV;ie1DXre1;h1DNke3;b0c0Yde3g09h0T2iXlWnd0rUtS;tSz0;e16Fma1;b0d0f0ke17WtS;en,s03Y;k0l0;ch0d0ge2h02l0n0s01teS;n,rS;ar1HEbYdePeWf000ge142hePRkoAlVma11Lre12BsUtrOverTzuS;entwic1GQf0HAma1;bBJfo12Lka1H6mi1A7;ag0eh0pi1G8;a1H4e1HB;mpfeJntwickelSrO6;!n;e1CBi0UMri5;en,sO;en,n0SA;b0Dd0Ce1FOf0Age13Sh09jOk08l07ma1ne1A7r05sWtVwTzS;au1FTi7;eSis1;nd0rf0;au1r0BX;a1GTchVe19XpUtS;eSoß0r13L;ck0hl0ll0rb0;i0H5re5ül0;aVe0EAiUlTmeXCnSü1CC;a1AZe1CD;ei1i1F3;ck0eb0;ff0u0VJ;aSe14WoEuf0ä1CT;di4ff0;aOYeg0;eDoAra9;a1GJeb0ol0ä5;aSeg0lADre1F5üD;hr0ll0ng0;ePrüH;e1EJlTrS;e1FEi5;as0e0XHiH;h1FGk0;b15QcXeJf0NRg0hrWlVnUppn0rTs1tS;en,sc1C1;m101n0t0;de1A2k0;l0t0z0;en,ne19CsOzu0KN;hSke3;en,ha1G4rSs0zu0ZW;uf0üt1C6;ar124er1Fi1EoSö1CE;ll1ArSti4;a14b0Xd0We0Vf0Tg0Sh0Mjam15Qk0Ll0Hm0Gne1CSor1CPpr0Fq0ZVr0Ds07t06ver05wYzSüberg7;au1ESei12Vi7uSäJ;bUd0QKf0FYgTlGne194sSwe7Yzi7;c0PFteE;au1FCeh0;eSri5;re1FYug0;aXeWiGäTöS;lb0;hl0rS;m0tsS;g7koA;g0K5is0rf0;g0rn0;lGu19I;a16Gr0ALu13Dä0SR;ag0chVe18Li1ACo192pUtS;e0OVoß0üS;lp0rm0;a1EHie1ACr0XSul0;ie13TlOne1B2re0WKwSü9;eb0in19Hä12X;eSicCüH;cQd0it0;es1o0D9;a1e0P4;aUeTieSüg0;b0JQg0;b0g0s0;d0uf0;au0eXGnöFoA;aWeSä5;rTuS;c1AUl0;faDrs1sS;ag0p0PN;lt0rr0;au1EFe11Qre1CL;a102e11QinSlun0ZBormSUueDüh15C;an1BHd0;nt0YOrLW;a6ePrX6;au0eTiSl11KoDri5;ld0nd0;ha0JMiSre1EWs1ENt0ug0;be0J8fUg7koAlaN4mar1BRreTs0J6tSzu0B7;re17U;d0nn0;aDl8JüD;nUr1EQusS;bF7g7sS;ag0ch17We17M;b0P6g7koAt0VNzuS;koAt0VM;b0P4e5Nfü0ZMgi1CVkrit15Rla1DBma157pfroFqua1CQsStaPzi7;chSpri9toF;lOmi4re0VK;erteMKsi4;a5Vb5Gd54e50f4Og4Ch45i44j43k3Ml3Dm35n2Yo2Wp2Lqu2Jr2Cs0Xt0Nu0Iv0Fw02zVäSö2Xübe14U;nTp1CFr15Us1AGuS;ße2;de2g0PH;aXeViUoTweiSäJö15R;fe3g0;e15Pll0;cCe0RRn0F6;hr0iSrr0t1A9;cQh0;g0hn0pf0u1CX;a02eZiWoVuTäh14HöQüS;ns1st0;c194nMrS;s0X6ze3;eQhn0;c1DEnTrSs1;k0DIr0;d0ke3;ch1CZh0PEiTlSnd0r1B5s0tt0;k0t0DF;ch0DEge2l0s0;c10WhrSis0lt0n17Urn0;en,lNY;ielfTollS;kommn0s0V;a1ä0L5;lk0nTrS;sa1te17J;faEglTreinBsStrM4;ic18Nta1DK;imFüH;a00eXiWon0rTu0ZCäS;fe3n17J;aTe0RDiAoc17Kä19MöS;de3st0;g0u0;ef0lg0pp0;iTuS;e2fe3;dBl0;g0us1;a15ch0Fe0Ci0Aklav0o09p05tVuUäTöQüS;hn0ndBß0;be3um0;ch0mF;aYeWiAo0R8rVuAäTüS;c1CJm16S;nSrk0;dBke2;aJe0R3om0;ck0h0iSll0rb0ue2;f0ge2ne2;at0CIeTuS;b0ch0en;ndBrk0;aUeTi0D6o18ErSät0ür0;e1i17Lüh0;is0kuNrr0;ch18Unn0;eQhl0rg0;c17SeSl1BInk0tt0CA;b0ch0ge134;ge3h0O6lbstSn16Btz0u1;ae11ZsSä11Z;tä11Y;a0Ee0Bi0Al02m00nZon0rXu0Q2wUä09Oö1B1üS;ch8ttS;en,g7;a9eTiSä13Yör0;mm0nd0tz0;i10Hnd0;aSe0VNo17Yum1AGäP;mm0ub0;a1C9ei14IuFör1BSür0;eSi4u9äh0;lz0rz0;aXeViTuSüs1BD;ck0de2;e180mmSng0;b29e2;ch8iSpp0uM;e2m0ß0;f0g0mS;m0p0;ck0e10Eff0m15Q;iTnk0rSu0VG;be3z0;d0ße2;chTe006ff0l0TFnSrr0u1BD;de3z0;e2te3;ch0BFe180g0lz0m15Jnd0uPA;aWeUiSo1B6u1A1ä0J7ü10C;cCe184nS;ge2n0;cQgn0iSn09G;b0s0ß0;mSt0us1;me3s1;aSirl0;lm0ts1;a01e00fXi1A7lUo0VXrTuSön0;ff0lve2pp0tz0;a1A5eEü17U;aTem198oS;mb0;n0p196uM;eTlSus1äR;a128eg0icC;f18Iif0;nn0st0tz0;c00Lss0tz0;eSr17Y;d0ffent0AT;aVeUiSäh0;cCeS;d0AQt0;be3hm0i0JKtz0;chlSge3r05s1;aeSäS;ssB;aYeWiTuSäJö10F;mm0r17Vt0;eTm0nSs0WJt171;de2en;f0s0t0;hr0id0ld0nSrk0ss0;g0sch0AF;ch0l0mFrkt0s19X;aYeVieUoTuMän129öS;s1t0;b0ck0s0t8;b0r0;b0g0iTrn0s0tz0uS;gn0md0;b0h0m0t0;d0en122ge2ngSss0u17V;en,s19;a07e06i163l02nZoYrVuUöTüS;hl0m108nd0MCrz0;r188stB;e0YFp18I;aTie1u19SüS;mLEp18G;ch0ft0mFtz0;hl0ke3mm0nsu12Pr178st0;aTe0BNit8oSueFüF;r18Ct0;ck19Yll0pp0;aUeSi5o14Gu04Zär0ün16K;b0iSmm0;d0ne2s8;g0m0ZVu199;hr0il0nn0tt0;be3c15UlkNZnt0pp0uf0;ag0u0ZHäDü5;nner09Mrr0;aWeUinMohnepie182un8BäTöSü116;hn0ke2r0;ng0rt0tP2;b0dMer0hl0iSlf0rr09Ix0;l0m09Hr10Sz0ß0;ft0ge3l057n13XrSs17Xu0;mlK1r0;a02e00iZlYn10Qo0NBrUuHöTüS;n0KYt0;nn0t8;aUe17CoTäm0öS;be2ße2;es123;b0ul0;as0ei1iAüh0;eß0ft0lb0t8;b0genwä0WCh0ig0lt0ss0ud0wS;a0H0is11Y;eEm137s0;a02e00iI1lYoXrUuTä181üS;g0hr0t8;eg0g0m134t8;aSe04Küh0;cCnS;s0z0;lg0rm0;a1ecCie0XCu1üS;c0LOssB;cChl0inSstBue2;d0e2;hr0ll0ng0ss0ul0;bb0de3hr0iSleRn15Frb0wB;d0KYnSs0te12Y;b0LMen,fa1heit08Oig0na129sSze3;am0;a02e01i00oZrVuUäc0LGünS;nSst0;en,iL;ft0mm0n0AYr18B;aUeTiSä5üH;b0YBeß0;ck0h0ifa1s1;e5ht0;n17Ap16V;cCen0ng0;ck0nk0rb0ut08C;m164nk0u0;a05e03i01lZoDrVuTöl0E5üS;nd0rg0ß0;ch0d12PeSm12C;nd0ss0;aUeTi5üS;de2h0;ch0iWms0nn0;t0u1;a174e0Q4ut0öd0üS;ff0h0;e0U4llBnd0tS;te0XC;amt0iß0rg0s10SuS;g0l0;l0DRnn0rri0L0u0;bZcCeYlXnTrSusg10U;be18Dm0s1zt0;ke2laUsStwo0VG;chSta187;au07RlO;g0ss0;be2lgemei16Lte0X2;nMus10I;reUsS;chSolu6;eu0i0KL;d0i1;eb20fe2lk0m0InTpgr0AHrSti0ZV;ba0ZHiKte11U;if0Fk0terS;b0Adr09fa16Ig07haXYju0XAk06l05m03ne111or14Kpfl0YSqu4r0ILsZtXverWwUzS;e118i7uS;b0IFg7;anMeS;is0rf0;mi10OsDV;au1e11Mre0LMunS;ne3;ag0chTe9iPpül0tSu1;e0GYre0LPue9ü9;ae9e137i10UlSr082ä9;ag0üF;aSe5is1;l0ue2;aFUiG;el0CWoArie08OüJ;eh0lSr0ZZ;ieM;ueHüH;ewe0UKiUle0OGrS;eSi5;ch0it0;et0nd0;i13Sor0ZL;ar18b15d13er03Nf11g0Yh0PiF2k0Ll0Im0Hnäh0o087p0Fq050r0As01tZwXzSänM;e10KiVuSä0MI;bTg7keDsSw0KI;chu0KMe9t104;au0ri5;eh0n13E;an113eSä10WüJ;nd0r10R;auSoFre0O3;f0s1;at130chXe07BiWo10FpVtSä133;eTiAoß0r82üS;lp0rz0;ch0ig0ll0;a15Ti075ri5ul0;e10Unk0;aCAiTlOme0V0naEre0NVul0YXwSü12B;ePä0U8;cCff0;aVeTue161ä12UüS;hr0st0;cQiSnn0;ss0t0ß0;hm0n108;flSol0ro04G;a0XDüg0;e0JZo10J;aTeS;g0it0nk0rn0;d0ge2u13O;eDi10LlTniHoAreS;is0m14E;aSe11X;m0W0pp0;au0erSä5ör0üE;fXi0NEjOkrUUr0JDsUtTwSzi7;anMim0ZW;aXOre0NA;chStWQ;au0leS;i1nM;aDlS;at8iG;a0TSeTi14DrS;ab0up0WAä147;b0h0s0MI;a0HSlSo0TFrOunA0ä0CGüE;ie0TY;e0WXiSr7;cCs5Y;au0eTi059lSr0O4u1;as0ät8;ha15Rne14Rse9tt0;be15Um0;eSrigb0DX;n,rS;b68dePfP0g7lTJnZprC7rYsWtUwSzeWV;aSe0QMiR;ch0e0ZG;reSün1;ff0ib0;chSe9;re15L;as1ed0;acCe0YL;a0Xe0Uh0Si0Qo0Ir01uZw108yYäVöUüS;f11Gn1rSt0;k0m0;n0p12Hrn0t0;fe3nTtSus1;ig0owi4sc110;de3ze3;piLran0WR;c0PJm0YVnY5pf0rSsch29t0;n0te3;a02e0NQiZoWuVäTöSü0CV;de3p11Est0;l0AIn0uS;fe0VHm0;de3mF;c0Z3ll0mTpf0tS;t0z0;me3p0XV;cTeSl0ACmm0nk0p12Yump11X;f0z0;h8ks0;b0cCd0CNe10Zg0iKk6m12VnsUpTsLuS;e0TQmw0I5;p0s0;c11RfTpS;lan6o082;eIor0X1;a140b0et0lYpHGrXs0tS;aVla1sStr0XKär0W3;ag0chTteS;ch0ll0;lOweB;liLr14L;ke3pe120;eIl0;ge2lg0n10Rppe0UVschSts1;en,le2;eSr09D;ma0WGore0WGra0UNsauI;ch0VVer0ilTl0YLmpeIn11UrSst0C5xt0;miKro09E;en,h0WTne0XFzu08Q;bYde3e0HEg0kXm4CnWpUrTst0ts1uSxi4;ch0en,f0g0me3s1;i4n0;eSp0s0;rn,zi4;gi4k0z0;e3ti4;ellSui4;a094i4;a46ch20e1Ui1Pk1No1Jp13t01uXwi5yVäTöQüS;f109hn0lz0ndBß0;be3en,g0h0ku7Bn0E3ttBuS;be2e2m0se3;mSnthe0VZste0VY;bo0VRpatTI;bTch0de3ffi108ggeIhl0mSrr0spen11C;mi4pf0;sStra10S;tit0VKu0W3;a0Je0Fi0Ao07rXuWäVöUüS;c134lp0mSr00Jtz0;me3pe2;be2hn0p12Qr0;n0NYrk0;di4e0XZf0mFnd0tz0;aYeViUoTuSä0Z2öm0;de3kUAll0;l1me2tz0;e0ZSpp0;b0ck0iTng0ss0uS;en,n0se3;cE4f0k0t0;f1Hhl0mTnSpa0ZWuc0Z3;d0guN;m0YHpe3;cGEer0lTpSrKss0t8ß0;f0pe0TO;pe2zi4;bi9c0YXeVft0g0V9lTmSnk0pp0;m0uN;iLlS;en,lGschweB;b0fe3l0r0;c0QOh0B7iUll0mTpp0rSue2;b0i0UX;m0pe3;f0ge0RWnB;bi0UUc0YOe0CQff00gKlk0mZnXp1PrWtUuS;bSch0en,n0;en,saU3;ioKtSui4;en,fiRg0W2;r0t0;dSz0;arBRha12Q;me0T5pf0;e3i4;a05e02iZlYoXrTuSäh0ü0T1;ck0er0k0l0r0K4t0;eTiSu0WNüh0;e0YDn0O9tz0;ch0iz0nS;g0ke3;n0UWrn0tt0;e0QPit8;ck0eTnn0oKtzS;be10Ie0SUkRJ;ge3l0ß0;iTkuNnd0A6rr0ziS;a0U8fi0YV;c0XDen,s0;ch0YClt0nn0r0zierenSß0;!füDg7;hl0lUnTrSzGZ;g0ti4;di4n0;ida078l0;aSelT6iz0YNyp0;l0SDn0ZL;chUeTgXWmuNnStz0;g0k0n09U;ch0de0SFge0SFz0;erSt0;n,s11Sz0B7;gWhTOiVkSGlTnSpaIr0WXtz0u0KZzi4;d0g0k0sibi0TS;ek6igS;pre0MTsp0OA;f0l0n;e3m0O0n0;a1Re1Oi1Il14m0Wn0No0Mr0Fu0CwYäXöWüS;rUtS;teSz0;ln,n,rn;en,f0;n070pf0;dBl0m0nd0rf0tz0um0;a01eXiVäSör0;be3ch0nTrS;en,m0z0;ge2z0;mm0nSrr0tz0;de0RUg0;b0fe3iUlTmm0nk0rS;faEtun;en,g0l0;f0g0ß0;b0QOfe3nUpp0rzStz0;ar11Bh0N0mal0sS;chl0CFeh0;en,k0;bs0c10LeTft0lSm0UUn10Ls8tzimF;d0en,te2;r0tz0;aXeVuTäSöF;g0nk0;bb0mpS;e3f0;ck0iS;b0en,ne2;f0F3mm0ub0;ck0n0pp0t8;aYeWiVorUuTä0FGüS;f0X4r0;p0YJrr0;c0WIr0;ef0p0YJtz0;iSll0uz0;de0PMen;l0J6pp0r1t8uS;b0f0z0;aYeWiUoTuSä061ö0KYüH;d0UMeHg0WWn0RTs0;ll0r0;eSnk0r0WU;d0g0r0;ck0iSlz0rz0t8;c0W6ss0ß0;cCro9tz0;a03eYiXoWuUäTüS;pf0rf0s0ZG;fe2mm0n0WN;cSde2m0Q0;hz0k0;s0SNt8;e0W0n3CtPE;cViUmm0nTpp0uS;de2s0;de2ke2z0;ch0f0m0ß0;hters0ZXke2;b0YUcCfSg0mp0pp030u1;en,f0w0DD;cPAeUff0kaKlTmSnd0r0VW;me0TSpf0;de2le2;b0fSl0ß0;e2g7lS;a1iG;f0W4iTlV5ma0RXnk0p0XKr0XSuS;ch0e0OQ;d0n0te2ß0;b0chWd0eNZff0lVmUnz0rTt6uS;de2en,fe3ke3spie055;en,fs0ZJmüt0QXr0;poK;en,l0t0;e2te0Q1;bYft0g0hn0lXm0O1nWrg0tUuS;b0JAe0OHf0gSn0s0;boh0XZen;tSuI;e3s7;i4kt0HB;b0u6z0;be0T7o6;a17e0Di07o05u01äZöYüS;ckSg0h0V8l0OVmFst0t0VE;bVda6eTveSwärt0HP;rs5E;n,rsS;ta0UR;liH;c0UWntg0st0t0;ch0de2ke3t0Y8uS;c0U6m0s0WU;b0OHc0YIde2eZTf0h0iKmUnSpf0ts1;d0tSze3;er0G1;hä5or0;bb0c0VZde0PEll0st0tS;fä05Gi4t0z0;b0OBchtVeUf0V7ll0nTpp0s0KUtS;ua0QSz0;d0ge0PAn0;ch0ge3se3;en,igS;liGs0YM;a0Kb02Ic0Hd0GetabNf0Eg0AhabiJRi04k03lax0m02n01oZQpZq0QOsVtUvolut0GMzS;enLiSykN;pi4ti4;ar0W6t0u0VNwe0RL;er0TNiUoTp0BtrSul6ü0QZ;ukPD;r0TKzDC;di4gKs6;aIrS;odu0V1äs0KQ;aP8k0n0o0THti4u0QQ;ili01Zon6pe3;apituNla0QRonstr0Q8ru6ti0UXurI;b0c0NAf0he0NBm0nSs0t0z0ß0;faEig0rTwS;as1ü0RT;eSie1;d0iS;t0ß0;eTiSn0uN;er0stI;ln,nS;!eI;eIin00TlSor0QGun0VM;ek6;en,u0UL;hTycS;e3l0;n0tfe0KQ;gi4liL;bat6d01e1ff00g0hm0mZnXp0VYsWtUuS;b0ch0en,f0h0n0sS;ch0la0XR;en,iSte2z0;fi0UCon0NL;c0TIen,i4pe3se3te0MP;daNgi4kSschme0LZz0;en,lo9riG;me0O4poKs1;en,iK; faDe3faDiS;er0ka0PI;aWeUiSo6äl0;eSrl0t6;ck0ts1;ll0n0TTrSts1;dePlGs01V;dIk0lTnRMrSs0WJts1;ti4z0;i0TWm0;a1Je1Af16h15i11l0Uo0JrXuTäp0VEöSüI;be3ke3;bUde2ff0lTmp0nkt054p0r0OJs0VMtS;s1t0z0;en,si4ve2;er6li0TR;a0Ae07i06oUuTäSüY4;des0PEfi0TKg0mi4paIs0JEziL;ef0st0;b02du0TNf00gZhi0S3jYkla0PGle00NmWpUsTtSvo0TNz0PK;es6ok3Tz0;peIt0;agShezEJ;an0UIi4;eKoS;t0vi4;ek6i0TG;nZXrUT;essSOiS;li4ti4;en,i4le0OV;ts1va0OV;dBisTll0sS;ch0s04J;en,g0PX;eThl0kZQll0nSs0VR;ge0LK;g0s0IU;ch0e0OOke2lZpXrtVsSt0DWwe2;a0BViTtS;en,i4uN;er0t0ED;iSrä6;er0oK;e3p0uS;la01H;a01GeTiSs8te2;er0tiL;miLn;aWem0U0oVuUäSünM;di4tS;sc0RAt0;m0LQs8;m0R5tt0;g0ka6nSp0TVt0G2uOYzi4;en,i4s1;cUeTgm0IBl0NJnSrs1ss0;ke3n0se3;p0VPse3;he3k0;antaLilosop0SZot02R;eUlSroFus1äR;a0KQeg0icCüS;ck0g0;f0T0if0r1;dikZiYll0nXrTs0tS;it0DOz0;fTio4Sl0mu6sonSv7C;a0NNi0S9;eSoI;kt0DK;de3n0s0DJ;l0nBts1;ür0;ar0cKVd0PMff0nZpp0rVss03EtUuS;k0sS;chaliGBen,i4;en6s1z0;aTfü0NTi4keSs0tiRCzZ8;n,t6;bo0NBg00GlSphraL;lelsc0F5yL;i4s1ts1ze2;b02ef02RffeYhrfeBkWmit6naKpVrSszilNxi0SUzo0MV;dTgSi0HJt0;a0MTe3;e2iKn0;eIfe2poKti0NK;kSt0FB;lu0SOu0LG;nSri4;bTha0V3lIZzuS;ha0V2lG;ar0le0C5;du0RKjek5Wser0Q1;a0Oe0Li04o00uYäTöSü9;l0r0RAtB;c07ChTsS;e3se0LC;eSr0;n,rS;b05Fn;de3e9ll0mSsc0QJtz0;eImeI;mUrSti4;d0mS;a0MLen,i4;a3Oin0KG;ck0eSpp0st0;derSse0L1t0;b04faEgDZh02k00lIGmZpras0TOrYsUtrTweITzS;ulIFwi5;am0SKet0;a0U0chUe9iPtS;amFeSoß0reH;ch0ig0;i0SRlOmM9rei0II;e0IMi5;a1et0LLäh0;nSämF;i0üp0SC;aSol0;lt0u0;eLFiGlSrTKü0QJ;as0;beTgi4hm0i0QFnn0pp0rv0s0Q8uS;ma1ro0M8tXB;ln,nor0QS;be3chWge0KIheVrUsTtS;ioPWuX8;aNch0;ko0M3r0;b04Kg7koAl006st7tr0MW;a15b11d0Ze0Wf0Ug0Sh0QimFjOk0Ml0Jm0Ine0N3p0Gr0Cs05t03vZwVzSä0N1;aJe0NAi7uSäJ;dePg7h04PkoAlSpruef0spiU7voYwe0EV;a0TRes0;ac0GXeTiS;eg0nk0rk0;iSrf0;n0s0;erToS;llQ4;sStYN;ic0OP;aPraSön0;g0ue2;ag0chWe07YiVpUtSu1;eSiAr0MRü0HH;h0ig0ll0;iTSr0BRü0JU;n01Vtz0;aC7lSme0HNne0P0re0AIwiAü0OY;ag0e9Z;eTuf0üS;hm0st0;cQd0iSnn0;ch0f0s0;fe0QUrS;üf0;a0JVe0Q4;aTeSie0QBös0;b0g0rn0s0;d0ss0uf0;aUli5oS;mm0ntrS;olN;rt0uf0;aSe1EiPol0ä5;k0ll0;eSi0R9rü0IBär0;b0h0r0JR;aLPe45i1EoLNrOüS;hl0ll0;iTmp1ErSss0;zäJ;fe2l0;a6ePicCrSun0S5;i5uHä5;au0eTi065lSoDri5;ei0AAiHut0;reSs0SGt0;cQit0;hm0r0SM;a1Le1Hi0Bo03uYysMPäWöUüS;h0m0M6nSss0;d0z0;bSg0r0OI;e3li4;hSke3st0ßB;dres1en;c0P7ffe0IRmi0OUnVrUsTtS;en,i4maß0;i0OTte2;ks0me3r0;d0ke3te2;bi0K3dVge3nUps0rTse2tS;i0N6oX9t0z0;a0K1d0s0ti0ON;i4oMBti4;eSi0OLuN;lTrS;i4niL;li4n;e0P8gIl0Wm0n0Us0PtWx0ßS;acCbTfaEg0Rh05AiSli5r0ITtr0L8v0Qwir0LJ;ntIF;ilSrEZ;d0lB;a0Jb0GdePe0Ef0Bge0Ah08k07l04m03ne0KZre01sZtWwi01MzS;i7uSäJ;bTma1r04CtSwi01K;e0LNrO;es0Eri5;a0IJeTrS;ag0iP;il0ln;a0RIchSi5pFF;le0NEne0N6re08Owi5;cQd0iS;s0ß0;a1is1;aTeS;id0rn0;ss0uf0;riGämF;a0RCeSör0;lf0;b0s07U;aDiTliGrSüJ;eu0;lm0;mpSrl0KFss0;fiR;eSri5;koAnu9sSweXM;tiA;ns7r0R4;ch0sSt0;acCbUen,faEgTh04CioKli5r0HVtr0KAvS;er0M5;lüH;iY8rE0;de2iS;atuVYm0GN;de2iUD;c0B5di6hr0iUl0KGmoIng0r0L4ss0tSu8;al0IOhoSze3;diL;d0s8ße3;ch0ge2h04Al00mFnYrXsWtVuTxi0J1ßS;en,ha0QN;e2l0sS;c0MCe2;er5Che0IN;e2ki4si4tur0LJ;iKki4moIsc0NJte2;ag0ge3iS;fGYpuN;en,ne0JL;a0Se0Ni0FoWuVäUöTüS;ft0g0m0K2;c0LFf0MNhn0s0NFt0;c0M2di4hm0p0O2rm0s8ut0;g0ll0n0HRpf0stw03Nts1;b0c09de2es0gg0hn0ka0I6mbar0NSsTtS;en,s0te2;ar0QAb05don0OOe04ge0CYhUNk02l00ma0AHpla9rYsVtreUwe0BOzS;i7uS;scZNwe0BM;nn0t0;ag0chTpr08EtS;e0H5ü0DK;i0OElOra0LK;as0eS;iß0nn0;aSeg0ös0;ch0ss0uf0;a0PTe0LGoS;mm0p0NX;is0n;e0NXiRrS;a0PBe1i5;h0ke0EP;beSXcCeVft0k0mi6nUqui0N9sTteraS;liLriL;pe3t0;de2i4;bSfe2gAL;be09Den,gTkSäu0LX;os0;ewi0OJ;b0ckYZde2erVgUh02AiTktoIm0HLnk0rn0s0uSxika0HF;cCgn0;b0d0e2h0m0n0st0t0;a0HCen,iti0HS;en,st7;bYcXd0ge2hmWk6ll0mVnTpp0s0EOts1uS;e2f0g0s0MFt0;d0gS;dr7en,we0J7;en6iK;en,lG;h0ki4;be2e0E4oI;a2Ke2Bi29l1Tn1Jo0Ir04uVäUöTüS;be3hl0m0EUndBr0N3ss0;de2nn0pf0;m0MGu0;ck0eYge3lXmuNnVp0N3rTscSt0M1;he0FG;be3i4si4v0zS;ar0P1ha0OYsch98tr0HW;dSge3;g0I5s0IJ;ti0JW;m0EKrzeS;n,rtr0HR;a01eZiWummUäTön0ümS;e3m0;c09IftBh0nz0u0NU;biGlSne0HV;a1eg0;b0E2ePVmiKIn0KZsTtS;iLze3;e3tIV;de0FFiSm0MMpi4uz00E;d0er0s0LM;b0DXch0keOUll0mUnkStz0u3J;en,feSla1s9W;ie2;en,pf0;ch0hl0k0Ql0Mm0CnXoWpVrTstStz0;en,ü0GQ;k0rS;eNi0KQum0EM;f0JHi4pe3;peIrdiK;d05f02gr0G2ju0KNk01sYtUvTzS;entIi0EI;er6;aUe2rS;aSolN;hi4s6;ktVWmiK;oli0LKpiItTuS;l6mi4;a6erKit0FTr0FT;re0G2urI;eTiSli0KCron6ödeI;guIr0G9s0KG;kt05Rri4;enLit05Q;biKmXpS;aIenLiNlToSri0G5;ni4s6;eTiSot6;m09Yzi4;m09Xt6;an0L6eTunS;a0FJi0K6;nSrz2D;!ti4;lToniS;a0FFsi4;abSi0L0;i4oI;eSs0;ln,t6;aXeWiVoUuTöFüS;ll0p0GS;eFff0rr0s0L2ts1;be3t0;ck0MYen,ps0rs1s8t8;be3cCif0t0;b0M0ck0MWll0pUrTt8uS;se2ts1;r0z0;p06Ws0;a04e00iXoVuHUäUöTüS;ge3n0JE;hn0n0;ff0r0;n0pStz0;f0p0;mTnSrr0;ge0DCk0;a0EZm0pe2;b7TckX3iTmSt8;m0p0LA;d0nSs8;kBWschne0ID;bas8c073er0ff0g0m02VpBYrSssi0Qts1u0AU;en,k5Oma1sS;eh0teE;cSek0ff0ll0pp0t0KH;he2k0;ge3hr0iZlXnTrSs0LPtt0u1;b0ke2n0;nSte2;enSze0FW;! Sle0A9zuS;le0A8;lSte2;e2ne2;f0l0m0;c0I3hl09ke3l07n05p01rWsVtTuS;e0B9f0;aSegoREho0E7;lPApul6;c0J9erKpe2si4;amZ1iVr0tS;eToS;gSZni4;lNn;er0ki4;e2iTp0se3uttS;g7kB6la1ma1;er0tS;a0DWuN;a0DVdiSo6Qt0ze3;di4er0;b0kSts0LR;en,uN;f9Psch4;aWoVuSät0;bTc06Kri4stiS;er0fi0IB;e3iN;bb0de3gg0hl0;g0m0BEps0uS;c06Fl0;d0Jg0Illu0Hm0FnVo0D6rrTsS;la07KoN;eSi6;füDle0LNn;d08einander07f05ha04ji0I2krem07Rlinesk0CEne03sYtTvS;es6ol0GI;eShro0D0oKri0HV;gInUrS;esLn0B7pSveK;oNre6u0D8;di4si0GD;eIpiVtSzeK;aTitutionFZruS;i4ment0B2;lNndbe029;ri4zi4;ha0L6woQ;f6li4;iSor0DH;ltIzi4;f0BZgBN;exi4i0HLuS;strSzi4;ia0CW;i6ke2mu0CIpS;f0li0HHoOAroviL;miKstI;e3noI;eSio0CX;a0CQnF0oRF;a5Ee2Li0Ko02u00yZäVöUüS;lSpf0t0;l0s0;hl0r0;ck0JSke3m0AEnTrt0tSu0HY;sc0GE;dBgenSse3;!bSTla0J8;dIpno0CO;ldBmSn0C0p0s0IV;a0C2i0H1;be3cXer0fWhnVlUmoge0C1noIpSr0ITspi6;pe0AWsS;en,g7ne0DL;en,pe2z0;la1sp06U;f0i4;hSk0;a01b00diWDfaDg7h42jZkYl0DJne0DGpäp0ICreXsTtr8KzS;i7ücC;chUe0D9pTtS;a0I9eXGi0C4r0DG;iKIül0;au0JLneEreHä9;cQiß0nn0;la0EBäA;ag0u09H;iRri5;cCr0K3;e1Mm0DOnS;a1Cb18d15ei0Yf0Wg0Th0Sk0Rl0Pma1ne0GQp9Rr0Ms0Bt02unter00wWzTüberS;b3VfüDla0E5r3NsM7zi7;au0IPeBi7uSäJ;dePf0ASgeseEkoAne0D1se9tr0CTwe04VzS;ufuGäJ;eSiTM;gSis0lk0nd0rf0;koAse0CStS;aeWWrö0J3äWW;b3NfSstü07Ozi7;li0I1üD;an0EUeSrEN;nXrS;e0I8frOgVhSk0CWl7Hzi7;ak0erS;faDrä0FPsS;chwimme,eRpU4;eh0i0HU;ansSRüberS;faEki0DN;ag0chVe0CFiO3tS;eTrSü07C;eb0öm0;ll0rb0ue2;a23e0EWi0CJlVmTre00EwiSü0EU;mm0nd0;eSi4;iß0lz0;aTeS;i1pp0;cCg0;a0C7eSicC;iSnn0;b0ch0s0ß0;aSeg0üm0CP;ng0ss0uf0;a0A1en,lo9ni0oAriG;aKCor1ä5ör0;eSi0H9;b0hSr09R;en,ör0;a03XiRlSüD;e0F4ie06Uäz0;l0nS;bWfVhä5l0FUpUr0H1sSzi7;chStü06O;li5;a0HAroji0F7;re0H9üD;em2KoD;eTrä5urchSäm08A;ar0IMf2Tkr75zwä5;nk0rn,ut0;eUiGlTrS;i5üt0;aAAät8;g1Tm2Ds0I9;bsZr0IGuS;fWsS;g7komplimenti,r051sS;chStü069;i0GMrS;ei0;b25r04XsSwiRzi7;cSVteE;eh0iP;rSv0;bVherS;bTe0BZfüDgeh03UhSWkoAlGre032sStr6CwO;ch0Te9teE;em1Zi0DKri5;e01RleZ3;b0ch2Jft0g0i2Al29mm0rTtz0uSx0;c0DOe2l0;a1Cb10dePein0Yf0Xg0B5h0WjOk0Vl0Rma1ne0B2oiLr0Qs0Mtr66u08vorXwWzTüberS;b1TfüDla5r1LtrOzi7;au0GNeTi7uSäJ;e0BQs0HO;ig0n;e60iP;br001dr01g7h0AZkZl25q01LrYsSt4UwOzau0GJ;chVprUtSu1;eSoß0ü05N;ch0h0;i5u0BO;au0iS;eß0m07A;ag0uf0;eSoA;hr0im0;i5ä5;eberDVmYnterS;bWd6VfaEkoAma1ne0AKrTsStrO;c1Le9;as0GGeSoE;iSnn0;ch0ß0;em18ri5;fXhä5lWr03YsUtTwir06NzS;i7uscQP;a081ön0;cQNprS;e1i9;iGun08K;aDliGüD;ag0chTe8SpRNtS;aAeE;aSi0A8le0B7;ff0u0;ei1icCs1uf0ü05G;aUeS;g0iS;e2h0t0;ng0uf0;oAriG;a0GRol0ör0;aEiRliGüD;faErS;ei1uf0;eSi0C7ri5;g01iSkoAm0LorMqu081s0GHt0;bR7dZe0AIfYhRFla0GIrXsUtrOwTzS;i6ufGK;iPüRY;chTeQpR4tS;rA2ü04G;a09Kle0AOw028;e0FFuf0;liGüD;rä5;le0GG;b0Hn0BuS;f05sS;ar0GCb03f02g09Ih01k00l7Hpu9rZsUwe4IzuS;fSha0G8koAne09Es0G3;iRueD;chiVpSteEu1;iGHrS;e5iSu0A6;eß0ng0tz0;eß0nd0;ei1üH;oAristallisi;a0FZeb0;il8üD;e046iTFre1;bUfTrSse9zi7;ei1oE;aEli0E7üD;emS;üh0;g7kr4Dma1rWsUwac02VzS;uSücC;fFPkoAzi7;chSpiG0;l02Dme03W;e0D8üH;fVreUsSzuWM;cSe9iP;hie03W;gn0iß0;li0DU;f0l0;lZmSr06Bte2z0ßIE;bWe3fVgeBhQ8kUlTne08Kre00EsStrOzaJ;en,u1;eucC;eDoA;aEiRüD;egSri5;eb0le0FC;en,igsp01O;e3t0;ar0b05ck0de2ft04ge3k0l02m01nZpe2rVsUuS;ch0en,sS;en,i4si4;ch0pe3s0t0;moTpuKr0tSz0;ko1löt0;niS;er0si4;dSge3ti4;e3h07G;pe3s8;bi4f8lSs0tHT;en,uziK;enMZ;en,iS;li6;a1Ue0Ti0Ql0Do0CrXuUäSö0DP;hn0n0B0rS;en,t0D4;ck0m06ZrTtS;he02UtZ;ge3r0t0;a00e0CSiZoßWuVäUöl0üS;be3nSß0;d0fäL0;m0ts1;e0D2m084nz0p04Qse3;ma1sTtS;un;chVF;ll0ns0;b0dWps1sVtTuS;l0pe3s0;iSuN;fi0ARni4;en,si4;i4ui4;e0D4lf0n09Io0AG;a02eiXiWoVuUäTüS;ck0h0;nz0tt0;ckO9ps1;ri0AItz0;b0CReMmme02Wts1;chSs0t0;en,la0DTsTzS;i7uUW;cXMe9tS;eN5iA;sLMttSub0;bü0A3g7ho036str00Hzi7;eTft0pSt8;fe3s0;r0ß0;b0Qd0Of0Mgen0Hh0Fi0El0DmCKn0Ar02sWttoiLwSzi052;aeTiSoeQäTöQ;cCnn0t8;hrS;en,lei0CW;ch7eEtVundS;b06Fen,ma1pflGsS;chrStoß0;eUJumF;aSeh0iZK;lt0tt0;aWb0ei1iSma04Wnh05W;er0nS;gSn0;acCsS;chä9;deSt0;biGrNWsS;e9i9;eTieSuGüg0;r0ss0ß0;hmBr02Vs0;a5e0D5i5ob0t0ü0CE;g0l0s8z0ße3;eSor1r0ör0;imWQnJE;bu1leVsUzTüberS;sM7tr05U;e069usS;te03X;nk0s0;aSri4ähY9;ehY8ll0ngenWJ;eSuQ8;ih0nk0;en,i05MrSär04UüD;au1;be3ff0l02Wm06BnzYTrTs6uS;ke3ne2;an6en,ko1ni4;a35e25i21l1Fo0Jr02uXäVöUüS;g0h02Wll0rSt8;cCliebGY;der029hn0n0rM;che069de3lSrb0;l0s1;ch08GeXHg0m062nUrTsSt8ß0;ioKse3;ni4z0;di4gi4kS;e02Ption022;a06eWiTot03HuSäs0ös08B;cCst0;er0sTtS;i4ti4;chF3i4t0;iUmdTquYCss0uSve3;en,nd0;e3g7schäm0;be0A4g059haXka0BXlWma1ne056pVsSzube0A4;cHOe9pTteS;h0ll0m0A0;iC9re1;re0AJ;a0AIeg0;b0lt0;cCg0ktTPnSp024ter03D;ki4s0z0;erMkusLl0Mpp0rTtoSul0;graPXko021;ci4de2m0Is0A1tS;b0Ed0De05Lf0Cg0BjOk09l08maVYne04UpfL9r05sZtrYwUzS;aJeSTuS;fBMse9;eUiTäSüN0;hr0lz0;rk0s1;rf0;ag0eSL;chUeTpM2tS;eJür8A;hn0tz0;eTi04MleSneEreSHwiA;i1pp0uM;r0u1;eSä07G;iSnn0;s0t0ß0;a09Ueb0;oArS;ie1;eb0i09H;aEliGüD;a025ePrä5;eTiOJlSri5;as0eS4;g048st7wG;aSen,i4uN;liLti4;geZUte2;a07e05i01oYuXäWöUüS;cCsS;sigX0te2;tenSß0;!g7;mm0z0;chS7kt02JnV2pp0tWJ;ck0pp0ri4ttS;be08RkS;riG;eUm00BpTtS;te2z0;peZH;g0h0s0ß0;cSdMge3h0k6nn0ts1;ht0k0;cUgg0mTnSt8u0;i4kI8s1;bi4m0;hSke2;dSen,faE;rüH;eUlTnSrmI3s1xI3;an06Sd0gi4;e6m0te2z0;be2de040;cCde2g0hl0Ki0Fr0AsUtSu00R;iscSt0z0;hiL;se3tS;beYAf05h03ig0k01lZma1nYsVtr02ZwUzuS;ha0A0lGsS;chR2teE;ur017;chrTe9i9teS;ck0h0ll0;a05EeQZ;a066e030;a09QeSiG;g0s0;e03OlS;amZGe07FoF;aSe08U;k0lt0;aDre08A;ke3nUtigS;bSen,ko1ma1s09GweV2;e07Ori5;bHRha09JlePsSzuTB;eh0pVZte00L;eYFlVnS;d0maTschS;le071ne051;ch0hl0;bi02Ben,s1;bi04Wen,gXinTle09GschS;i07OlO;tTvS;es6;erpS;re6;re06S;ch0hYkXlVng0sUuSx0;ch0lenSst0;!z0;e02Ws0t0ziK;lFGsSt0z0;chFCi05J;tuI;nd0r0;-ma02Ub8Jga00Uh8Hi4VjaV3ke3l4Um4Hn23r03s01tZuropäiLvak00RxS;eXhWis6pTtraS;hi4poN;an06DerimV3lSoC7;aKi05DoS;di4ri4;i03Ru014;ku6r05A;abNikS;et6;kSs0;aNor6;a1Qb1Ld1Iei1Hf1Cg19h15in072k11l0Xm0Un0So0Qp0Or0Ls04t01ui4wUzSö0RübrB;aeJeSie01Xwi5äJüWC;ug0;aXeViTäSü020;g0hM3rm0;de2rSs1;k0ts022;ck0iSrb0;s0te2;ch081eQrt0;aTe028rS;ag0iPä04G;pp0st0;a085ch01eZi078pYtSu1;aVeUiTreS;b0ck0ik0;ck0nk0;h0iZLll0;rStt0un0;k0r0;ar0i8Däh0;hStz0;en,n0;aXeWie03RlUreHuTwSöFüt8;er0in01Z;et8;aSei1ie03O;ff0g0;in0;ff0ll0;at0eTiSöt0;cCng0;cQg0i1;i1rS;e06Aob0;be2eStiL;fF1r8;aeDeSiedrBt0äD;nn0ue2;aTit03LoSutBäcJXög73üd0;eg72rd0;hn0tt0;aUeSiGäu8ös04I;b0dBg0iSrn0;ch8d0;eu8hm0ng0ss0uUE;aUe06Bi04FlTraPundJ5äS;lt0mF;a4i4Fär0;lt0uf0;aUeTi9oSäX2öKR;eh0ff0l0;b0i8ll0;l2Gs1;aTeTUi05GrSäXY;e04OüR;eXWt8u05I;aViRoTrSueEüE;ag0eu0is1;lg0rS;de2s1;hr0ss0;fe2gn0l0;enTol1rSuKC;ei066os05X;!k0;aVeUi02BlSrP2;a05Dei1iSüh0;ck0nd0;b0n,t06Hut0;rm0u0;cChn0r06P;d0g24tS;a22b20carBQdeHe1Xf1Og1Fh1Cjung03Qk11l0Vm0Qn0Np0Lr0Is03t01wXzS;au05CeNPiVweiSüR;bThAYma1reURschS;lOne023;eUPre1;eh0f03L;aUeTiSurXNöQ;c05Trr0s1;i1nd0r03M;fDRrn0;aSechXUhrBAäJG;bY3rn0;aG4chZeYiXoZQpWtS;aUeTrSör0;öm0;h0iELll0;c01Vmm0ub0;a053ie02FrOE;c015n3S;nd0u1;aeXe01MlTuldHUwiSäX;nd0rr0;af0eiUi04BuTüS;pf0s051;es050mVM;ch0m0;dBrf0;aIZeU2iTo056ät04XüS;ck0m03Ust0;cCe023nn0;aHeEoliXUuS;de2pp0;aTeSä04B;hm0rv0;tu8Tzi025;acCetViUonoTutBysSüUY;ti023;poXG;ef0li92st0;alXE;aUeTibe8NoSü04L;b0ck0hn0;dBer0ih0;d0ngTrv0sUOuS;f0s0;faDg7la058;aCDeT2l00oUrSup03C;aSiminYä04EüYY;e04DmF;loniWmSp039rk0;mTpS;li01PriXI;eSunT;n,rzialisie;alL0;amURe00NuS;mp0;aTe02OoYUäSüE;rt0ut0;ar0lt0upt0;eSi041lI1rät0;gSh0;enSn0;ar04WbFFeYQfWha9NkoAla04QneXZsUtrTwiEMzuS;koAse9wiEL;ag0eIO;chaEeXRtS;eE1üSO;aDie03HüD;aYeXiYIlUormaWKrSug0äB6üD;acCeSo03Z;md0;aTieSu02S;g0h0;gg0mm0t8;rn0s03Ltt0;ch0lS;l0t0;hr0iTrS;b0n;gn0l0s0;alVUeDiRlSre03BürokratK9;ät8öß0;lkoW0rt0utoWC;a00Nen,se9;an03eri6ot01pSul00M;fZorSör0;ar048dERfAHheXrWsSwiR;chTpEQtS;eBrXC;au0neEwS;eb0i5;ag0icC;b0lf0;a5eJiR;ioS;naVT;ziU6;aboIektriGVi73;ch0e2fe2gn0l0nTsSte2;en,la03P;aPMb31c30d2We2Vf2Pg2Jh2Ei2DjOk24l21m1Wn1To1Sp1Lq1Kr1Ds0Ht0DverBZw08zSäWJöl0üb0;aJeX4i7uSwä5äJ2;b04d03f02g01h00lXmLXneWVrWsStrWNweR;aHchTe9pi40tS;eCZuf0;aSraeP;e9lt0;aeZQei1icC;aTeSo00N;g0it0;d0ss0;a03Gol0;eh0re011;orMue2D;aeAri5;eSiR;zi7;aVeTiSoQurUJ;c02Peg0llBnk0rk0;b0ch02CiSnd0rf0;ch0h0s0;cQAnM;aTeX2oFrSuPüt0;ag0eQEich8ocX8uX6äuZFüb0;nz0uS;ch0s1;a0Lch04e03i02or6p01tUäS;g0uS;e2m0;aXeWiVrH0uUüS;lp0rS;m0z0;di4f0;mm0pp0;cQGh0ig0ll0;mFub0;aQLeLRi33rQH;nIUtz0;gn0h0if0nYZtz0;a07e06i05l02mZnYrWul0wTäSüY8;rf0tz0;eTiSäQLör0;mm0ng0;b0fe3nk0;aSei31umFäP;ePub0;aWPeiUNi9ür0;eSi4ugYS;iSlz0;cY5ß0;aX1eSieY6umS3äZJ;iSpp0us0;ch0f0m0;eQNff0;nk0r0;chYBlt0rr0;g0lSmVWrg0uG7;b0z0;aXeUiToSäuH4üYA;ll0st0;cCeYFtz0;cQd0gn0iTnS;k0n0;b0ch0h0s0t0ß0;eY5hm0mm0st0;uar6;aXenVZfWin011lan0rTuSö01D;de2mp0;e00IoSäg0;grS;amU6;er1laSNroF;ck0rk0ss0uk0;peIrYF;eTi012äS;h0ss0;be3hm0;aVeUiToX6üS;mVAnd0;et0s1;iLSng0;ch0hn0rYIue2;aTeSieQOo1uEäH5öQS;b0g0it0nk0rn0s0ucC;d0ge2ng0ss0uf0;aZeXiWYlVnUo1rS;a9eSiG;is0uz0;eYXiHot0öFüF;aQZeSiPoF;b0id0mm0;hr0il0l6OrSs00C;b0ke2;cWXlNCp00AsLuf0;ge3mF;aVeSiev0ol0änHEüSA;b0ft0iTlf0rS;bra00Lg7jOre016schlenM;l0ms0rRXz0;k0lt0nV2u0;eViUlTrS;ab0eZ7upR9;as0eLXieM;eß0ps0t8;b0h0mSst7wöQ;eiR;aZQeWiRlUorMrTueSäLYüR6;g0hr0;eZEi4;ecCiSöß0üs8;eZFpp0;tt0ue2;bn0ng0rnt0;aUeTos0rSäA;eh0iIUüH;i1ll0uYS;eAmF;heHrRX;a00eYiXlVoot0rUuTüS;rRXß0;cCdUHnKS;eLXi5;as0eSäu0;nd0u0;eg0ld0nd0;ha00AkeZAr007s005tSzi7;oKt0;lsaSLu0;eSr0;li1;b0n0;a41e38i2So2Mr25uXynaM3ämWöVüS;be3mY5nTpi4rSs0;f0st0;g0k0n0st0;rr0s0;meOXpf0;ck0de3elNft0ld0n1YrTsSz0;ch0e3;chSst0;aLQb1Nd1Le1Jf1Dg1Bh18jOk11l0Ym0Xn0Wo0Vp0Rqu4r0Ls02t01wXzS;eVi7uSwä5äJ;drD9fTsS;c9Ae9;ueD;ch0icQ;aUeTiSursVSäMOüJ;nd0rk0s1;b0i1tz0;nMs1;aQGeYYreTR;a09chZeYiXpVtSu1äg0;aMReTiAoß0rSöYCüN1;eiNTukturFHöm0;ch0h0ig0ll0;iSrHRül0;el0;eb0nFItz0;ge3h0tz0;a00eZiYlWmVneUYrTwiSütVF;mm0nTDtz0;eiS;b0t0;eT3ugVK;aTVeSi5änVJüF;i1pp0us0;eNImOV;in0ue2;b0ll0u0;g0uV4;aWeViUoYEuTüS;hr0tV3;f0ts1;eY2ng0;cQgn0iVBnn0;s2Pus1;auUeiX3lumOFrS;eXHob6OüS;f0ge3;k0s0;rgaQB;ag0eRWuR0;aIZeXC;aTeSiGöcTRü8K;b0s0ucC;d0ng0ss0uf0;au0li5nWoUrSämVZ;eD6ieS;ch0g0;mSst0;m0poK;eSöF;if0t0;aTeSol0unPVä5ör0;cU4iz0lf0;lt0uVF;eL2lSreVX;ieMüh0;aJDeWiRlVorUrWVuTüS;hOMt8;eDt8;m0st0;ecCieM7utJZ;cCde2iX0;iSss0;l0nanderb8O;ePisP2rS;eh0i5ueHä5üH;eYiXlVoUrSürXC;aSeJHi5;t0us0;hr0x0;as0eu0iHut0äS;t8u0;eg0ld0;iß0koAtTVuTV;ke3st0;a01eXiVoUuTänNDöSüH;hn0se3;ckXDeH;h0sWR;bN1ft0ll0nStTP;b5Tg0si9;h0inTsS;ch0si4;fiRrA3sS;chQS;ht0maPKnVufS;gQOlSma1zaJ;eg0osS;arXGlaXA;b5KgTkSma1neQIse9;lQKoAriG;eb0saN;ck0gPCkVlmeVHmUnVQpTs53ti4uMOwnloSzi4;ad0;en,pe3;es09iK;tSumJE;e2oI;a03cht02en0ff00k6mensEZnZpXriTIsS;kUpoKquaTKsTtS;anTL;er6iUJ;rSu6;eOZi07;lomSp0;aP0i4;g0i4;aP7erSunUD;enTDi4;en,ma1;gnTlS;o3DyL;osS;tiT8;b0Jc0IduT7eskaNf0HgraU6hn0ich0GjP5k0Bl09m03n02pZsXtVuFTzS;entTiS;di4mME;raOH;erSoK;miK;er6iS;llusECnSZ;laToSriOSu6;ni4r6;ci4tSXzi4;aziSVk0unSW;aWen6iUoSütB;duNk1Kli4nSraO7;stIti4;liSssE4;ta1B;sI4theO9;eSKfSl0phS;in1S;artVlToIreS;di6mIB;aSiK;ri4sL;elN;en,se3;iKorOA;k0oTF;at6ü6;b0Qch0emFfür0Pgegen0Nh0El0Dm0Cn07r01s00ti4ue2voXzS;uVwischenS;fTrSst7trOQ;ed0uf0;aDuP;koAleJHsCRzaJ;nTrS;l1Vs4Y;b3UePJf0DkoAlaVJma1steJtrOzi7;i9t7;anWbVinsi9lGrIAsVFunterUz4UüberS;faDlGsS;chCLt7;b3PfaEhOQsCJ;en,iOEri5;klOOse9;ebenSk0;beUfaEhTliGsS;chiTP;auSE;neOG;e3pf0;aTViG;erZinS;dämKWeP3fXgeHXlOFraOAsUterSwe29;kSst7;leAni0oA;chTiSteE;e1nk0;eQNleP9meOWwiR;aDliG;f1BkoAlaUWr7K;haSwi4R;lt0nOZ;haUWköTWst7;eSleBZ;haUUiS;b31si9;aXhTlSoSBrM7;on0;arakteUeHiEoreogS;raS;fi4pRP;riL;mKXrS;boM5;a70e1Fi15l0Lo0Hr04uXäWölVüS;ck0fQUge3nOLrSx0ß0;d0geJGokSst0;raML;k0le2;ndBum0;chXdOGeWgLhVlUm12nSt8;ke2tS;fä0V;le2;en,l0;nOBss0;en,staP8t0;a01eZiYoXuUöcTNüS;h0ll0sSt0;ki4t0;mm0stStLD;scS;hwiA;de3ws0;lNng0;ch0itSms0nn0;en,ma1sc3GtrMW;bJCch09ndTt0uS;ch0en,s0;en,ma3O;hUlz0mbTniQDoSrg0taLEx0;m0t0;arRBen;ne2r0;a07e03i00oVuUäTöSüh0;de3k0;h0t8u0;bSGt0;cFKndVßS;lTstS;eEramRM;eg0iG;fä01i4;ckWnStz0;dfSk0ze3;liG;ch0iSnd0u0;bSch0;enS;!laRY;ff0mi4nkpUsSZuS;fäSma1;rb0;oNu9;bYeXlVmUnd0oStt0;loS;giL;me3s0;anPMdSlB;en,haK4;de2g0t0;be2liS;ogS;rapPY;a54b53c52d4Xe4Sf4Hg40h3Ui3Bj3Ak30l2Rm2Mn2Jo2Ip2FquKBr1Ws0Tt0Ku0Iv0EwYzTäS;ng41ug0;aVeUiTuschuRHweS;ck0iP4;c57eh0fPYrz0;icQug0;hl0uRJ;a04eZiWoQuUäTöS;lk0;hr0ltBsL2;cNPnMsstS;ma1weE2;llBrS;k0tS;en,sM5;g0iUnd0rS;b0f0ksteSt0;llB;hräSn0s0;ucNG;chS1eTfShr0;fn0;ltB;oSölCM;llm48rS;muRst7teM4zuS;g0st7;g0l0nruhBrSteIL;kuRlaNNteM1;aZeYiO6onXrTteIJuFäSör0;tBub0;aUeTiPäuOCüS;b0g0;ff0ib0t0u0;cCg0u0;en,i4;ilBn,ue2;etBnk0ts1;a0Tch0De0Ci09o08p04se2tTuSwi5än20;ch0de3;a01eXiArTuJäSöQüFR;rk0tBub0;aUeS;iSu0;k0t0;f0hl0;ch0hSig0ll0ue2;enSl0;!bS;le8N;etBtt0un0;aQHiUrSuH;eSi9üh0;ch0nQV;el0tIN;hl0ld0rg0;c3ReTnStz0;g0n0;de3geHQ;el0ge3itBtz0;a06e04i03l00mYnXoenBrVuUwTäSönBü9;dBftB;er0ic3Lör0;h0ldB;aePeiSiQ9äP;b0en,t0;eMOupOTüfND;i4uS;nI9tz0;agTeSieMS;i1unB;en,naK3;cCeß0lMmFrm0;iSnk0r0;n2Oß0;d0edBff0ll0tt0u0;bPLen0Yg0it0m0uf0;a06eYgXicWst0uTüS;cUhr0st0;eSf0h2J;cShr0;ks31;ht2G;en,steB;chYd0iSu0;cLMf0nBs0tS;eVhaQIma1sTzS;usQC;teS;h0ll0;n,rklär0;n0tB;pp0tTuS;b0m0;en,scS;hlO;aHfTiS;ePBnPBss0;laH1;b1DrM;achTeSot0u9ötBü9;be3hm0id0nn0tz0;r2GteilB;aVeUitleLNut8äSüh0;c2FnS;ge3te3;rk0;l0nn0;aYeWiUl0oQu12äTüS;ft0g0;cLLmFKstB;cCeS;b0fe2;b0g0hr0iSmFHucC;dBh0;d0ge2ng0sF0uS;e2f0s1;aZeYlUni0oA8rSuRämFö0TüDM;aeSeuzBiGäSüJB;ftB;aUeS;b0ckSid0mm0;e2s0;g0ts1u0;hr0nn0;emFke3nntS;gINma1weAV;ah0uES;b09cCdr7f08ge07h06koAl05m03n94orM1pfl02rr0sVtrUwoQzSß0;en,uS;be92lGtrO;ag0et0;cXeVi9pUtS;eSiA;h0ue2;ri5;iteStz0;lGschiIC;haI6;icC;eSis1;ng0ss0;ad0eg0iG;ol0;b0seE;oA7üg0;e8MiGri5;aVeSinMä5üt0;b0iz0lTrS;beI9rs1zB;f0lB;ft0lt0nIRrr0uS;en,pt0s0;a07e05i04l00nZrWuUüS;nSte2;stB;ck0tS;acC;aTeMRueRüS;nGNß0;bAAdB;adBuGüg0;aubBeiMQo9uUückS;en,wüS;ns1;eHps1;eß0nn0;b0gn0hSis8;en,r0;ff0tt0;a01eZiRlXoWrTumHVähBörMürS;cCsoHNwoBD;ag0eTiSucC;edBst0;i0md0;erMlg0;a4UeSüKC;ck0iß0;hlSstBuEK;en,ig0;hr0ll0ss0;hr0iTnd0rS;b0dB;l0nS;druHfluMFtrS;äc06;aVeUiTrSuMU;oh0uHä5üH;en0;ck0nk0ut0;nk0ue2;he2irc0;au0en,ilM;bsXcCnTrNMtm0ufS;sWtrO;sTtS;rOwoAO;pStaR;ru1;icS;htB;ck0d0g04h03l02n01rYsXuS;chUen,me3sS;ch0pS;ar0;en,rS;ed0;i4te3;bi4rS;en,iS;kaKL;aEYde3g0krottg7n0;aXd4Tg0kaEKleBYsaFDz0;n0r0;atSge2;elEU;al0bFHchtFFdFCeFAffF8gF3hF1kEOlEHmEEn97pp96r90s8Wt8SuUvSxioEZ;aSiL;nci4;f4Qkt4PsVtS;hentiToS;maEVriL;fiJAsi4;a4Jb43cheHd3Ue3Nf3Ag34h2Xk2Jl2Bm28n27p1Xqu1Vr1Ms0Ot0Iu0HverkaMMw0CzSüb0;a09eG2i07uSäJ;arMQb04d02g01h00lYma1nu9pf0rXsUtaTuFWwS;eiBX;us1;ag0chlFNeFLp91tS;aI3eS;ig0ll0;aeINicCuf0;ad0ieJMoS;es0s0;anGG;eb0l93reD8;eQrS;ueH;au0iSreME;ld0;eSrLOs1;h0r0;hSnk0;l0n0;aVeTiSri5ucCä93;cLJeg0nd0rk0s1;chL6iSrJCtz0;ch0d0n0s0t0;c94eJlz0nMs1;eb0fe2;aWeFVi7Aob0rSuFüfI1;ag0eUiToSäI3;cG0mpEU;cIRnk0;ib0t0;ri4us1;a0Och08e07i05o04p00tTu1äSöQ;en,g0;aWeVoUrSülp0;aJeSöm0;i1u0;pf0ß0;ch0h0iGAll0rb0ue2;fSnz0tt0;fi4;a9DeUiTrSuHäh0ül0;e99i9üh0;el0oK;i0rr0;nMr6;eStz0;b0de3;h0nd0tz0;a05e04i03l00mZnWrVuUwSäl0öFüt4H;eSiG2ä8S;fe3iFXmm0nk0;eGSl0;aGQei9B;aTeANäS;uz0;pp0u86;eEYi4;aTe5SieGVäAüS;pf0rf0;cCf0g0;eß0ff0lMmFrr0;id0lt0nk0r0;b0chH0l2Frr0uS;en,fe3;g0lz0uFJ;aYeWicCoVuUäuTüS;ck0st0;cFVm0;f0h0pf0ts1;d0ll0tt0;cQd0gn0iSnk0;b0ch0f0s0t0z0ß0;di4nH2sSu2B;i4t0;aSeIT;r6ts1;a00eZfYlWoUrTuS;mp0st0tz0;eJ4oFHäg0;ls8saSwe2;un0;aSünM;pI4uM;eHYlaB7;iIJnED;ck0rk0;eDFu9;aTeSiJLus8üR;i4Glk0rz0ss0;ch0hl0l0;aXeViHAoUäTöSüJA;fGFsH7;ut0;es0s0t0;b0er0g0iSrn0s0ucC;d0e2h0;ch0d0ge2ng0s9Ats1uS;f0g0t0;e03l00nZoYrTuSämHBüJ;ge3ndsDJpHYri4;aViS;e1stallS;isS;iere;m0tz0;ch0mm0st0;eHBi99o94;amTe9CinSoFüG0;g0k0;me2üC1;ge3hr0iSl8nn0rn0;l0m0;aXeWoVuUäSöJüls0;nSrt0;dBg0;nAXst0;lHEr1;be9Uil0lf0;k0lt0nDFuGG;eViHPlTrS;ab0eHK;eiHMiSüh0;eMmm0ts1;b0h0iz0sS;taJ7;a03e02i01lYoWrUuTäSüHP;de3ll0;e48g0;aSeHQi4;g0ns0;lg0rS;muNs1;aTiSoH;e70pp0;gg0;l8s1;cCg0il0rtB;hr0ll0se2;inanderTrSss0;kiFWs7wäJ;g7sTzuS;se9;chSe9;reS;ib0;a9PeZiXrUuTöS;rr0;eHKnHX;eTi5uSüH;ck0eH;h0s1;en0fferSs9H;enEZ;hn0nk0ut0;a05e03i02lZoYrWuUüS;ge3rSx0;ge2st0;chSdCC;en,t0;at0eSi5üt0;ch0it0ms0nn0;hr0mb0ot0rg0;as0eSut0;iSnd0;b0ch0;e3Rld0tt0;iß0sAGtoKuSzaJ;l0te8G;d0g9GldSuF2;owe2;rStm0;beI0t0;ioK;a3Pb39d37e34f2Xg2Rh2Nja2Lk2Cl25m21n20o1Yp1Qq1Pr1Ds0It0Ew07zS;e05i7uUwiTäS;hl0um0;ng0r76;b00fXgWhVkla4lUma1neAWpoNsStrAOzwi5;tSu1;eEoH;eg0oER;aHMeb0o4;eb0reF7;aTrS;is1;ll0ng0;au0es9WrS;e1i5;hr0i4B;aWeViUärSüJ;m0tS;sg7;e6Ynd0r6Qs1;ck0i2Vnd0rEK;chGYlSrt0s1;l0z0;aUeB4is1rSü4P;ag0eSumF;ff0ib0nn0t0;ke3nk0uE7;a0Lch07e05i9pZtSu1;aXeWiVoUreTöFVüS;lp0tz0;b0i1;ck0ß0;el0ft0;c4Kh0ig0ll0mm0;cCNmFpe3u0;aWeViTrSul0ür0;e5iBM;eSnn0;l0ß0;icBUrr0;lt0r0;h0tz0uS;fz0;au04e02i01lZme4WnXrVwUüS;rf0tS;te71;a9eAi5;aC2eSumF;ck0i4M;aC4eSür0;id0ll0;ag0iSuc17äAüsFJ;eß0tz0;cCe4Qnd0;in0uS;ch0e2;en,ke3;g0m9Yug0;a01eViUoEuTäCEüS;hr0st0tCA;f0nd0;b5KcC;chTg0iS;b0h0t0z0ß0;n0tS;erhalte,zuS;erS;haFZ;ff0g0pE0uS;ch0en,h0;ueE;aEIfYlXoVrUuSäpDX;mp0tS;s1z0;aEoASäg0;lSpp0;i4s8;a9us8;la6JroF;ktSpCT;royi4;aBXe8Räh0;aUeSo9un8ö4Z;iSrk0;ße3;ch0rCH;aWeViUoSös0;cSde2es0;ke2;cCe4Kst0;b0g0hn0im0s0ucC;ch0d0s4MuS;e2f0;aF6eZlWnVoUrSäAü4M;a9eSiG;mD9uz0;ch0mm0;ot0öFüF;aTeb0inSär0;ge3k0;er0pp0r0ub0;im0;g0ucS;hz0;aUeToSä4Tör0;er0l0r1;b0i8ll0tz0;k0l46u0;aWeViD7lSreCG;eTiSüh0;eMmm0;is0;b0h0il0;be3l4Z;aDLiXlWorVrUäTüS;hr0ll0;de3rb0;eD8is1;de2st0;aAiG;nd0s1;inanderfoTrSss0;lGst7;lg0;amFeHonCVrSäA;ae5eh0ä5öDHüH;a05e02i00lYrUueTäAIüS;ge3rd0;rd0;aTeSi5uAüh0;ch0nn0;t0uS;ch0s0;as0eDTi9äSüh0;h0t8;eSnd0;g0t0;geDhaE1iß0koAreE5sStt0waD;chwSse2;ör0;ck0hr0uS;en,s1;rDZtm0;m0oUtS;acSes6;ki4;miL;phal6sS;iTozS;ii4;miNs6;beDRgVmUo5QranA2tS;en,iS;kuN;ma1;umSwöQ;en6;elNlauB0or6re6;alyLb4Kd4Ee46f3Sg3Hh3Aim39jOk2Sl2Lm2Hn2CorA5p25quäl0r1Ys0Ut0Mv0Lw0EzSöd0;a0Ce0Ai7uSwei9QäJüR;bi6Ce07fe06g03h01k00lZnYpaXrDBsTtreSv0JweR;ff0t0;chUe6Die7EpTtS;e4Er6K;re1;au0l6C;ck0ss0;ae8Ae6D;aCJeg0;lOoAur2K;aD4eS;b0iz0;eTlS;ei1;b0h0;rtB;iSrBX;gn0;iSt8Z;cQg0;hl0pf0uBN;aWeUiToQur42äS;hl0rm0;de2nC7;h0is0nd0rS;b0f0;cSeJn6Q;hs0;ertr5X;aYeBYiXrUwoTöS;n0rn0;rt0;aTeSiP;ff0ib0t0;b0g0u0;pp0zi2Q;nz0st0;a0Tch0Ae09i08oJp02tUu1äS;en,g0uS;e2se3;aYeWiVoß0rTüS;rm0;aJeS;b0i1ng0;ft0mm0nk0;cSh0ig0ll0mm0ue2;h0k0;c7Umm0rr0u07;aWei0iVoUrSül0;eSi6Tüh0;ch0ng0;rn0;el0tz0;nn0r0;e5Yng0tz0;h0il0ng0tz0;a09ei08i06l04m01nZrXwS;eUiTäS;rz0;mm0n5T;iSll0mm0;g0ß0;a77eiSäg0;b0en;aSe78;ll0uz0;eTieS;g0r0;iß0;ag0eiSie7AäA;ch0f0;eSff0rr0;b0ß0;n0ß0;ff0lt0u0;g0mSu5Z;en,me3;aWeUicCoEuTüS;ck0hr0;de2f0;cQd0g0iSm98nn0;b0c02h0s0t0z0ß0;nz0t0uS;en,h0;aXe4ZfVirs1rSu7Oö0H;aTeSo61;is0ss0;ll0n2G;e8KlaS;nz0um0;ck0d4Yss0;aVeUi3TulNäS;heS;n,rn;hm0k6;e5Uge17;aUeTi3Oo9uS;s8t0;ld0rk0ss0;ch0hn0l0r7Nß0;aWeUieToHäSöt0üg0;c6Cut0;fe2g0;g0hn0iSrn0s0ucC;m0n0t0;ch0ge2sSu7R;s0t0;a07e06l01nYoXrVuTämFöMüS;ndB;p8FrS;be3;aEeS;id0uz0;hl0mm0p8Btz0;aTiSöFüF;ps0;b8Zc72;aUeTinSoF;ge0K;b0id0;g0mS;me2;il0rn,tt0;emFuf0;a1Vi4;aXeUim3MoTäSör0;ng0rt0;er0l0;b0ft0iSue2;mSz0;e3faEg31s9N;ft0k0l7Wu6U;aZeXiWlVrTuS;ck0rt0;e7XiS;ns0;ei1ieMo9;eß0ft0;b0hSln,wöQ;en,o4ör0;ff0lS;opS;pi4;a03e00iZlYorMrWuUüS;g0hSll0;l0r0;eDnkeS;ln,n;ag0eSi4;ss0uR;eh0iG;nd0x0;cCiRrtBuS;cCe2;nd0;ch0hr0ll0ng0ss0uSx0;ch0l0;iTke3rS;ke80zi7;gn0nanderS;fVgShä5;erTreS;nz0;at0;üg0;aWeViTrS;eh0i5oh0ä5;cCen0sS;ku6;nk0ut0;ue2;a03e00iYlUoDrS;at0e84i5uAüS;ll0t0;aUiS;ck0nStz0;ze3;ff0s0;eSnd0;de2t0;ha8Eiß0la5quTra4KtS;en,re1Hte3;em0;ck0gShn0n2Du0;ge2;eriSor0Dpu6ti4üL;kaS;niL;ar0Jbe2kWleinVphabe0AtS;erSma1;i4nStü1T;!i4;la6Pst7;aYoS;hoX;kYqXtVupuUzeS;ntSp6;ui4;nk6;i2WuaS;liL;uiI;lUommo5BreTumuN;li4;di6;a02iS;maS;tiL;m0nS;d0en;glSi4;oTuS;tiK;meI;ri4;ek6irS;mi4;cCnMusS;se2;di4e3jTrSsor2B;esL;us6;en,g0HhS;ab0;a78b6Hd67e64f5Og5Ch52jOk4Il48m40n3Xo3Up3Rqu3Nr3As1Jt14u12verla5w0NzTäS;nMst0;a0Je0Ii0GuXwUäS;hl0uS;m0n0;eBiS;ng0tS;sc22;b09f08g07ha6YjOl05milMne04pf0r03sXtrWwSzi7;aTeSic6D;i1nd0;eSrt0;hl0lz0;et0;chUeTic1Vpa6StS;eEiA;h0tz0;aTiYlSuet2S;ie5B;ff0;at0u4U;hm0;eSie3Qo3O;g0hn0s0;eb0;eMueD;au0;eSr5Vs1t8;h0l0;icQ;hl0pS;f0pe3;a03e00iVoQäTüS;rg0;g0hl0lz0rtsS;faDg7;c5Meg0mVnUrSs1;tsS;cha59;d0k0;me3;ch55hr0iTnd0rStz0;b0f0t0;ch0d0s0;eTndeSrt0s1;ln,rn;lz0;rteS;il0;a04e02i01rUuTöS;n0t0;n,pf0;aXeWiPoTuSäu21;de3;cSpf0tz0;kn0;nk0;ib0nn0t0;g0nspor6;pp0;il0lS;efoK;ke3nSst0u2J;k0z0;a1Fch0Ne0Ii0Go0Dp04tSu1ä27;a02e00iZoYrUuTüS;rz0tz0;f0mF;aUeSöm0;b0iS;ch0f0t0;f0hl0m39;pp0t8ß0;el0ll0mm0;ch0h0iSll0m36pp0rb0;f0g0;mm0tt0ub0;aZeXieWlVrSul0ül0;eTiSüh0;ng0tz0;ch0iz0ng0;it8;ge3l0;iSrr0;cXs0;lt0nn0r0;lTnMrS;bi4;vi4;cSng0tz0;he2;gn0h0iTnStz0;d0g0k0ti4;f0l0tsS;st7;eh0;a0Ie0Hi0El0Am06n03o02rZuYwUäTöFüS;rf0t0K;l0tz0um0;a9eUiSä1ör0;nSrr0;de3g0;if0ll0nk0;et0Eft0;aTeSäg0öF;ck0ib0;ub0;tt0;aTeSür0;id0;ll0pp0;a9eTiS;er0nk0;icSlz0t8;he3;aUeTieSäA;ss0ß0;if0pp0;cCff0g0;eTnd0rS;m0r0;b0fe2ß0;id0r0ue2;b0ff0lt0u0;ck0g0hn0tTuS;f0g0s0;te3;a03e00iWoVuUäTüS;ck0hr0st0;um0;de2f0nd0pf0ts1;d0ll0;cCeUfTnS;d0g0;fe3;ge3;aTcQg0iS;b0ch0s0t0ß0;gi4;si4t0us1;aSe1Iäl0;liS;fiS;zi4;a1TeEfe0Sla9rTuS;mp0tz0;aEe1R;nKrS;dn0;ni4;aTeSu9äh0;hm0ig0;be3g0;aWeVilMon6uSäh0üh0;rSs8;ks0;de2;ld0ss0;ch0ge2l0rS;scS;hi4;aYeWiUoTösS;ch0en;es0;cCeS;fe2;b0de2g0hn0iSnk0s0ucC;st0t0;ch0d0ge2k6ss0ts1uS;f0t0;ti4;a07eDl03nZoWrUup0HämTüS;hl0rz0ss0;m0pf0;a9iG;eg0;ch0mmSp0Ctz0;anSen;di4;aUeTiSu0FöF;ck0ps0;if0;b0Xll0ps0;aTeSi5oFär0;b0mm0;pSts1ub0;pe2;nTpSrt0sLuf0;p0se3;t0ze3;ag0;aWeVoTäSör0;ng0rt0ut0;be3lSr1;en,z0;b0ft0il0lf0tz0;ck0e5k0lVndeTsSu0;pe3;ln,nS;koA;f8t0;au02eZiYlWrS;aUeTäS;ts1;if0nz0;b0s0;eiS;ch0t0;eß0;b0h0lt0wS;i0CöQ;hn0;ne2;a06e03i01lYorXrVueDäTüS;hr0ll0t8;ls1rb0;hr0;ag0eSi4;ss0;de2m0;aTieSucC;g0ss0ß0;ch0u0;eSlm0nd0s1;be2;de2iTrtBue2;ig0;e2l0;hr0ll0ng0ss0;bb0rSss0;keS;nn0;aZeHiWrTuSäA;n05s1zi4;eh0iTosSuHä5üH;se3;ft0;cCen0ng0zi4;ht0;ck0;ch0mFnk0rb0;pf0;a0He07i06l00rVu1üS;rSß0;st0;ch0;aVeUi5öcSüh0;ke3;ng0;ch0ms0nn0;us0;asWeVi9ät8üh0;te2;rn;tz0;ib0nd0;en,s0;eg0ld0nd0tt0;ha00iZkoArXsVtTzaJ;hl0;en,te3;ln;teE;ll0;uf0;mm0;z0ß0;lt0;lg0u0;isLrS;beS;it0;si4;er0;en",
    "FemaleName": "true¦0:FZ;1:G3;2:FS;3:FE;4:FD;5:FT;6:ES;7:EQ;8:GG;9:F0;A:GC;B:E6;C:G9;D:FP;E:FM;F:EH;aE3bD5cB9dAJe9Hf92g8Ih84i7Tj6Vk61l4Pm39n2Uo2Rp2Gqu2Fr1Ps0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7FeHol1UvG;et7onBA;le0sen3;an9endBOhiB5iG;lInG;if3BniGo0;e,f3A;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9YenG2;kD0tor3;da,lma,nus,rG;a,nGonica;a,ice;leGnesED;nDMrG;i1y;aSePhNiMoJrGu6y4;acG4iGudy;c3na,sG;h9Nta;nHrG;a,i;i9Kya;a5Jffany,na,s5;al3eGomasi0;a,lma,o6Yres1;gan,o6XrHssG;!a,ie;eFi,ri8;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmCBra;!ka;a,t5;at5it5;a06carlet2Ze04hUiSkye,oQtMuHyG;bil,lvi1;e,sHzG;an2Uet7ie,y;anGi8;!a,e,nG;aEe;aIeG;fGl3EphG;an2;cF9r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobhan;dy;aKeGirlBMo0y6;ba,e0i6lIrG;iGrBQyl;!dan;ia,lBW;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;lGre0;en1i0ma;bMdLi9lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBNome;e,ie;in1ri0;a02eXhViToHuG;by,thBK;bQcPlOnNsHwe0xG;an94ie,y;aHeGie,lC;ann8ll1marBFtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an9;hel53io;bin,erByn;a,cGkki,na,ta;helle,ki;ea,iannon,oG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cca,kaE;chGe,i0mo0ndi,quel,vDy0;ael,elGi9;!e,le;een2ia0;aMeLhJoIrG;iGudence;scil1Uyamva9;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvati,tHulG;a,et7in1;ricGsy,tA8;a,e,ia;ctav3deHfAWlGphAW;a,ga,iv3;l3t7;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hole,k8BolG;a,eBH;!mh;l7Tna,risF;dIima,nHomi,taG;li1s5;cy,et7;eAiCO;a01ckenz2eViLoIrignayani,uriel,yG;a,rG;a,na,tle;i4ll9XnG;a,iG;ca,ka,que;a,chOkaNlJmi,nIrGtzi;aGiam;!n9;a,dy,erva,h,n2;a,dIica,lG;iGy;cent,e;red;!e6;ae6el3G;agan,gKi,lHrG;edith,isFyl;an2iGliF;nGsAM;a,da;!an,han;b08c9Ed06e,g04i03l01nZrKtJuHvis,x87yGz2;a,bell,ra;de,rG;a,eD;h75il9t2;a,cSgOiJjor2l6In2s5tIyG;!aGbeth,jaAlou;m,n9S;a,ha,i0;!aIbel,eHja,lCna,sGtza;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri7;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlory;a,ka,n9;a,re,s2;daGg2;!l2W;alCd2elGge,ison,on0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9SnGsey;!a,e9R;a,sey;ann,cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n9;is,l1GrHtt2uG;el6is1;aIeHi8na,rG;a6Zi8;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,beth,et7z2;a,et7;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8Ge;!n4F;b7Terty;!n5R;aNda,e0iLla,nKoIslARtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Si6kes5na,rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5B;a,en,iGy;!e,n48;ri,urtney;aMerLley,mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6PiJlInHrG;a,i,ri;d4na;ey,i,l9Qs2y;ra,s5;cey,i5XlOma6nyakumari,rMss5LtJviByG;!e,lG;a,eG;e,igh;a5EeHhGi3PlCri0y;ar5Cer5Cie,leDr9Fy;!lyn73;a,en,iGl4Uyn;!ma,n31sF;eigh,i,l2;a04eVilToMuG;anKdJliGst56;aHeGsF;!nAt0W;!n8X;ith,y;a,iB;!anLcelCd5Velle,han6IlJni,sHva0yG;a,ce;eGie;fi0lCph4X;eGie;en,n1;!a,e,n36;!ian,lG;!ian;anLle0nIrHsG;ica,sica;i,ri;!a,elle,ifer,nG;a,et7iGy;!e,fer;a,e72iHnG;a,e71iG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min8;a8eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGobel;do4;!belGdo4;!a,e,l2G;e0i0ma;a,di4es,grid;el9ogG;en1;a,eAia0o0se;aNeKilHoGyacinth;ll2rtense;aHdGlaH;a,egard;ry;ather,iHlGnrietBrmiAster;en24ga;di;iley,lKnJrGtt2yley,zel;iGmony,ri4G;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyneth;!dolC;acHetGisel9;a,chD;e,ieG;!la;adys,enGor3ynis;a,da,na;aJgi,lHna,ov71selG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald35i,m2Strude;et7i5T;a,eGna;sis,vieve;briel3Fil,le,rnet,yle;aReOio0loMrG;anHe9iG;da,e9;!cG;esHiGoise;n1sca;!ca;!rG;a,ence;lHrnG;!an9;ec3ic3;rHtiGy8;ma;ah,rah;d0FileDkBl00mUnid,rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2H;geni1la,nice;hel,ta;meral9peranJtG;eHhGrel6;er;l2Pr;za;iGma,nest29yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;a,en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoGulce;lores,minique,n30rGtt2;a,eDis,la,othGthy;ea,y;an09naEonAx2;anPbOde,eNiLja,lImetr3nGsiree;a,iG;ce,se;a,iHla,orGphiA;es,is;a,lah;dGrdG;re;!dee,na;!b2CoraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1WyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et7iG;!ca,el1Aka;arGia;is;a0Qe0Mh04i02lUoJrHynG;di,th3;istGy04;al,i0;lOnLrHurG;tn1D;aId28iGn28riA;!nG;a,e,n1;!l1S;n2sG;tanGuelo;ce,za;eGleD;en,t7;aIeoHotG;ilde;!pat4;ir8rIudG;et7iG;a,ne;a,e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHiGy;!an1e,n1;!l;lseHrG;!i8yl;a,y;nLrG;isJlHmG;aiA;a,eGot7;n1t7;!sa;d4elle,tG;al,elle;cHlG;es7i3F;el3ilG;e,ia,y;iYlXmilWndVrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2GsG;a2Fie;a,iMlKmeIolHrG;ie,ol;!e,in1yn;lGn;!a,la;a,eGie,y;ne,y;na,sF;ace,ice;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok8;an2NdgKgid,tG;ney,tG;!aHnG;ey,i,y;ny;etG;!t8;an0e,nG;da,na;i8y;bbi8nG;iBn2;ancGossom,ythe;a,he;ca;aRcky,lin9niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy8;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et7iA;!triG;ce,z;a4ie,ra;aliyah,b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,ril;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGton;eHi8yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t7;an19elG;le;aYdWeUgQiOja,nHtoGya;inet7n3;!aJeHiGmI;e,ka;!mGt7;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t7;te;je6rea;la;!bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n9;da;aTba,eNiKlIma,ta,yG;a,c3sG;a,on,sa;iGyson;e,son;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i8y;!e;il;ah",
    "NeuterNoun": "true¦0:CU;1:CS;2:CI;3:CA;4:BD;5:CM;6:BL;7:AW;8:CL;9:9U;A:CE;aBKbA7cA1d94e8Df7Ng6Ch5Li57j53k3Vl3Km2Xn2Lo2Ep1Vquart1Ur1Js0St0Au04vSwGzB;ahl02eDiCuB;eri7gestaend8Lsammens2T;el,mm1tat;hnt3iBntr0ug;ch0ta7B;aIeEiCoBu94;chenend0ert1hlwoll0lfenbueCCrt6Q;eBsmar;n,sBA;issruß5SrkDsBtt1;en,tB;d24f2Bjordan5Q;es,s;hDrCsBttenme1;hington,s47;enCJschau;lergebBTrzC8;at5EeIiGoBukovar;elk8lErB;bi9Qh5VjahreBkommBQstandsmitglied6Nur6Xwort;n,sB;!niveau;k2um0;chy-regim2deo,eBgan,si1;lfach2rt3;hik3rB;bundu6Hdikt,gnu8AhBkehrsBRmo8A;aelt7Vo1uetB;ungsBP;eberFf1mDnBrte8Xs-repraesentanC4;gBheil,terC4weA0;ezief1lQ;la4satzB;minus,plus;e11lA3mass;aReNhIiHoFrDschetsche5NuB;chBeb5Otzing;!olsky-zitat;avnik,iB;bu17est;desBnbandgerät,r6;opf1urteil6;bAckAer6;eBuer5H;aterBm0;!haus,sB;!tB;ue9;am,heran,lBrrito32;!eB;fonBkommunikations7I;!e,gesprae7;bus,gebue28iwan,l2uzi8Ixi;aZchTeShandong,iRoPpNrinagar,tEuByst0H;b0OedBjA;frankr3IosB;seti0taAV;aGeEich3KrCuBü9;di0eck5A;aBeichhoelz1;f43lsu4ssenki7L;ak,uergeB;heimn8Sld8;atsCbilitaets2LdtBedtAY;schloss,werk0;d4Doberhaeupt1t8H;ekt80ielB;!zeug;fBndierungsg5Y;a,twareB1;bi2Glve7U;chst3kretariat,me7T;aEiffDkopau,lBmier88nitz3ott41weine5;aBepptau,oss8L;chtpferd0g33;!e;fe,uB;fen7Ns0P;arBc0Jigon,ngerhaus0;brueck0la4;aKeFhein3TiDosto9uB;d1eBhrgA2mae4Dndschreib0ss7G;g0ssels17;ese7AndBsik0;er5fle5P;chnu8KgEiDpraesentantenhaus89sButl4Bvi1;ervoir,tBultat;-5Zaurant;ch86seu4R;al,im2;dio,ed1statt,tAG;ett,i1;aRePfNhaenom0ilotproMlKoIrB;aGe7KiFoB;-kopf-eDblCduBfil,gra6WjeBra,tokoll;kt6;em0;in6S;nziA3vile4D;bang,g;k1rBsGtsdam;t2Xzellan;aBus;edoy1kat0;jekt;arrA1erd6lichBu4;tfa7;acekeeping,ki2OrsoB;nals;kApier6rBssau;adi2kett,la90tner5E;bFeEffen81goniDhr0pf1rche6PstBxford;dBslawonien2Y;eutsch2W;-volk2la4;ko-audit,l,sterreich7H;dachlosen09erBjekt,st;haus3Nschle96;aIeGiDordB;bos3Bir2Qrhein-westfBzypern;al0;eBger-delta,veau;dersacBmands2N;hs0;st,tz3GuB;-delhi,g65see68;chBhrungs8Jshoern1;barlaCsB;pi3;endern,nd;aReOiHoEuB;enCsBtt28;e0ikt6Mt1;ch0st1;dell6Yrsl7BsCtBvie;ive5orrad;kau6Wtar;ami,liGnFtB;gliedCleid,telB;!a3Kme1;!er5sB;!l1J;is0Fus;eus,ta1;cklenburg-vorpommern,diCer,isBnschenre3Jss0Ltall;s0ter-baf7F;en,ka80;ed8MiFnDrkeCssBterials;!aker4Ge;nz8Jting;d7NnBoev1;heim;la4nz;aJeHiGoEuB;dwig3IeCmpur,xB;em6Eor;be9n0;b,ch,eB;ch1;c2Yed,ssabon;bens7Ld1eds,nzBtt59utB;kir7;bor,denschlussg22eBg03nd64teinis87;cheln,nd8;a08er51i03lZnYoLrEuBänn85;erz3pf1rB;distBsbaromet1;an;aEeDiB;egsBteP;g7Lverbre7Z;ditinst0Luz2;f73nkenB;bett,haB;e1Fus;blenz,eMllektivs,mLnEpCrB;n,ps;enhag0fB;-an-kopf-re7Gki84;kurs6ZsGt0vergenzDzB;eBil;ntrationslag1pt0rt;kriB;teB;ri0;tanz,ulat;ite2mando;ln,nigrU;ie;agenfurt,eDische2oB;!e4IstB;er5D;id;el,gali,nBrchenvolksbege6Msangani;dBo;!eB;rBs;!n,z3Y;binett,iserIlGnin77pitFrDsCvaliersdeliB;kt;chmNs3;atscBlsruhe,tel4T;hi;als,el;iBku3;b1for0X;rBslautern;ei7;aBorda0Uu2N;-ChrBzzfest;e1Rhundert6tause4zeh6C;wort;mMnCsraels,zmB;ir;dGkrafttret0la4nFsDterCvestmentbankiB;ng;e2Jieurs,nA;ekt0tB;itut0;ern,sbru9;iDustrieB;lBu12;ae47;vidu0z;itBmobilie3D;at;aTeMiJoCuB;hn,ndert0;-chi-minh-3LchGeCf,lPngkoBrmon,t4B;ng4B;chstDrB;geBn1;raA;mass;lohnJwa1S;lfs63nB;der5PtB;erG;bronGer40ft,iDlCmd,rzBss0u;!ogenaura7;lerau,ms-burton-28;l5SmBzo3;!atB;la4;!-2O;aHeGlbjahr2m3WnEsch18uB;ptquarti1sB;!e3ThaltsdB;efizit;au,dBnov1sa-spar2E;elsb11tu7y;us8;g,r;eQiPlOoMrFuB;atemala-2VeteDtB;a0GhB;ab0;r5sieg3;emi0iechische5ossFuB;en,ndB;gCsB;atzur07tueck6;esetz3C;britanBuW;ni0;ettBrl3O;ing0;as,eis,ue9;ft,pfeltreff0;b03f01genZhXlRmNn,orMpae9rJsDtraenk0wB;aBerbe36i5K;e0Rnd;amtmetall,chDetzCicht8praechBtod0undheit3E;!e5s;!eZ;aeftBi9lPosse,äft;!en,sB;fe2Kv42;aeCichtBueT;en,s47;t0usche;gi0;einschaftsuDueBüse;se,tB;!er;nt10;aEdB;eChaB;e11us2M;r5s;ecB;ht1;aeBirn,o1;lt1;teB;il;aeng0AeBuehl0ühl;cht0;aeudeBet,iet2C;n,s;aUeQi1lLoKrDuB;eBtt1;hrung1Fnft3;ankreichs,iedCueBäulein,üB;hstü9;ensCrichB;shaf0;ab0YgB;espraecB;he;r0to;aggschiff,eEoreDugB;bBzL;latt;nz;is7;hlverhalt0ld8n10rnsehduell,stCuB;er,illeton;!ivaBla4spiel44;ls;ch,e13hrCss,x,zB;it;rDwaCzB;eug6;ss1;ad;hepaar,iSlQnMrFschborn,u-ExB;-Bemp3il;juB;goslawi0;lae03;be,dGeigFfuEgebBmittlungs2R;niB;sseB;!n,s;rt;nisse5;b1Ogeschoss,o3;d2glDsembl2tB;setz0wicklungslaB;e0Xnd;a4is7;eBsass;me2Nnd;!er,gentumsv2NnB;fEkDvCwanderungsBzelanliF;gesetz;ernehm0;aufszentrum,oU;amilienhaeCuehlungsvermoB;eg0;us1;ar;a02eViRoJrDuB;eBschanbe,tze4;ll,sseldorf;ama,eEittB;el,laB;eBnd;nd1;hBie9sd0;bu7;erfHku20ppelCrB;f,tmu4;besteuerungsCzB;imm1;abB;koB;mm0;ch0er5;amanteBenstmaed2Fng,sziplinar1O;ngB;eschaeB;ft;bGfizit6krAlegationFsDtaCutschBzib3;lands;il08;aBogestr3sau;st1;smitglied1;ak3;ch,eEmaskus,rBt0yton;lCmB;stadt;eh0;ch8;afé,hEoCreB;do;meba9rps;ck;eBil2;mnitz;a0Fe03iZlaXoUrOuByt2;chMdgAeJkarest,ndesErgtDssB;geB;ld1;heat1;aEg1AkriminaDlaB;eBndK;nd8;laB;mt2;ch8ndB;el,nB;iss2;!eF;andenFem0uB;essCttoinlandsproduktB;!es;elB;!s;burgs;nn,rd,sB;ni0tB;on;eBtt;tt1;er,ldB;er5uB;ngB;sw0P;duerf0KiKlHrDsBtt;chaeftigungsverhä0ItrB;eb0;g-karaCnB;au;ba7;ch;faCgraB;ds;st;nBspiel6;!e5;dGfFgElleDnd,ugewerCyeB;rn;be;tt;!an;oeg;!en-B;bad0;b0Ne0Ji0Hk0Bl07mt2n03rRsOtJuB;ftragsvHgeEktions0OsBto;chwiCla4maF;nd;tz;nBs;!maB;ss;olum0;eli1h0lanEomkrafDtentB;at6;!en;twerks;ta;i0ylB;verfaB;hr0;beitsDchiv0guCzneiB;mittel5;meE;gIlosengeld2vEzeitB;koCmodeB;ll;nt0;erhaeB;ltB;nisB;se;ebiA;daluDgel2siCwBzM;es0;nn0;si0;gi1lheilBt1;miB;tt3;el;tBw;enzDienB;pakA;et;eiB;ch0;ds,r2;es;gypt0mt8thioB;pi0;er5;!n;enEgeordneBhoer0;tenB;haB;us;deCteu1;er;ss0;en",
    "Verb": "true¦0:3A;1:33;2:39;3:2O;a2Wb2Cd29e1Sf1Lg0Uh0List,k0Kl0Fm0Dn0Cp0Br0As00tXuUvMwBz4äußer3übersp28;e9og0u4ög0;ge7rück4sammengeb39;ge5zu4;drä1erobern;ga1wies0;la34sp35w2Y;igArstört;aCeAi7o6u5äre1Iü4;ns1Orde1H;rd0ß3;lle,rd0;ch0der1Ce4rSsse;derhol4s;e,te;i4rde;gere,st;chse,ndt0r4;!en,f,n3;er6or4;ausg06ge4lC;d1Nga1schlag0;b7dient,g2Eloren6mAs4öffentlicht;pr4ucht1Z;icht,o2;!g01;ot0u0O;mgZnter4;b2Jl4strichR;ag;hront,r4ue,ät0;a4inke,ug;f,t0;age,chAe8in7olWpra2t4;a5e4ü0G;cke,ige,ll3;mm1FndJ;d,ke;i4tzt0;!d,en;a5ienFlage,rie4;!b;fHue;ei17ief,äum3ücke;asAla1Drophezeit;ahm0iedeG;ach10ein3ü4;s7ß0E;a5ehn3iege,ud,ä4;dt,g0;g5s4;se;!en;am0omme,önne,ünd17;a9er6i1of5ä4;nge,t06;fe;rs0Cvo4;rg4;ega1;be,l3nde5t4;!te01;le;ab0e5i4li2;b,ng;bNdMfuLga1halt0lu1macht,pHru1sAt8w5z4;og0wu1;a5es0o4;nn0rd0;ndt,s2;an,r4;ag0o0L;ch7p1Bt6u4;cht,n4;g0k0;aZorb0ri2;a0Gl4;eu4o15;st;a5la4;nt;a4rkt;rt;nd0;acSru1;e7o6r4;a4o2;cPucP;r0t0;!t0;i9order7reige6üh4;le,r4;e,te6;sp0Q;te4;!n;elYng0;ingeImpfing,ntBr4;fr00ga1h9inne8klä8mögliOr6s4z0C;ch4to2;i0o0I;ei4u1;che;rtR;ob0öhJ;ga1s4;ch7pr5ta4;nd;a2ic4o2;ht;ei4ied0;de;d4frMga1;ru1;en5ra1ürf4;e,t0;ke;aue,e8i7liebDra4;cht0u4;ch4;e,t;e3n;absichGgEkam0nöGrichte3s9t4;o6r4;aFo4;ff0;nt4;!e;ch5itze,pRtät4;ig3;ied,loOw4;or0;te;an4li2onn0;g0n;ti4;ge;bgeEngeAu4;fge7sge4;bGg5s4;cDpF;a1li2;bDfa1ga1hob0z4;wu1;bot0fa1ga1spBw4;an4;dt;ng0;b7s4;c4traft;hlo4;ss0;ro2;ch0;en",
    "Preposition": "true¦aHbFdDentBfürKge9hintJi8laut,m7n6ohne,se7u4vo2z0üb5;!u0wischB;!folge,m,r;m,n,r0;!m,s;mFnt0;erE;a7eb5;it;m,nB;gen0mäß;!üb8;geg0lang;en;ank,ur0;ch;ei0is;!m;!b,m,n2u0;f1s,ß0;er;!s",
    "LastName": "true¦0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Kd2Ae27f22g1Wh1Mi1Hj1Ck16l0Ym0Mn0Ho0Ep03rWsLtGvEwCxBy8zh6;a6ou,u;ng,o;a6eun2Qoshida,un;ma6ng;da,guchi,moto,sh1YzaP;iao,u;a6eb0illi37o4right,u;gn0lk0ng,tanabe;a6ivaldi;ssiljev,zqu1;a9h8ian,o7r6sui,urn0;an,ynisI;lstoy,rres,th;atch0omps2;kah0Unaka,ylor;aDchulz,eChimizu,iBmiAo9t7u6zabo;ar1llivan,zuD;a6ein0;lin,rm0;sa,u4;rn3th;lva,mmons,ngh;mjon3rrano;ito,n7sa6to;ki;ch1dLtos,z;amBeagan,i9o7u6;bio,iz,sD;b6dri1KgIjas,meQosevelt,ssi,ux;erts,ins2;c6vera;ci,hards2;ir1os;aEeAh8ic6ow1X;as6hl0;so;a6illips;m,n1R;ders5et8r7t6;e0Mr3;ez,ry;ers;h1Yrk0t6vl3;el,te0I;baCg0Aliveira,r6;t6w1L;ega,iz;a6eils2guy5ix2owak,yman;gy,ka7var6;ro;ji6muV;ma;aEeCiBo8u6;ll0n6rray,ssolini,ñ6;oz;lina,oKr6zart;ales,e6ris;au,no;hhail3ll0;rci0ssi6y0;!er;eUmmad3r6tsu05;in6tin1;!o;aCe8i6op1uo;!n6u;coln,dholm;fe7nin,r6wis;oy;bv6v6;re;mmy,rs5u;aAennedy,imu9lein,o7u6wok;mar,znets3;bay6vacs;asX;ra;hn,rl9to,ur,zl3;anssens,en9ha4imen1o6u4;h6nXu4;an6ns2;ss2;kins,s5;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a4b0ghNynh;a4ffmann,rvat;mingw7nde6rM;rs2;ay;ns5rrPs7y6;asDes;an3hi6;moI;a9il,o8r7u6;o,tierr1;ayli4ub0;m1nzal1;nd6o,rcia;hi;er9lor8o7uj6;ita;st0urni0;es;nand1;d7insteHsposi6vaL;to;is2wards;aCeBi9omin8u6;bo6rand;is;gu1;az,mitr3;ov;lgado,vi;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u4we;i,ng,u4w,y;!n,on6u4;!g;mpb6rt0;ell;aBe8ha4lanco,oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "Noun": "true¦0:7W;1:7M;2:7V;3:79;4:76;5:74;6:7D;7:70;8:59;9:7E;A:7T;B:7R;C:75;D:49;a73b66c60d5Re5Ff4Ug45h3Oi3Jj3Fk31l2Pm24n1Yo1Xp1Ir15s0Ht09u05vTwJzFäEölvor5B;gypten4Nngs3rz3;aGeFuEwic39;ge,kä19;c4hn3Lit06l3;c6Ggreb;aLeHiFochenEäDört2ürst2;!enC;dersEnt1ssen49;a4Tp5G;ge,hrpfliUiGnCrEsen4N;n1rat32tE;!e,papi6N;g1se;ff0hl0ige8lE;den3Wes;arian3eKieJoE;igt,lk,rE;ab1Kg7AsEwürfeA;chußlorbe6GitzendeFtandsE;sp2Lv7;!r;l6Zrteljahrhundert;nedig,rE;antwortlic9brau4EdFgleic4haEkä0Olus3teid68;l4Tndlungst2P;acBäE;chtige;ltent2LmFnterErO;geb4Kschri3P;brü2sEwelt38;chuldungs4Ftänd0;aIei8hyss0iHoCreFürE;!en;ndEpp2uhanda5G;!w5;ere,g1;s2tFuE;be,s5;sac9;aZchVeUiTkand2JpOtGuFynod2Jz4MüE;d0pp2;c4detendeuts2mmeA;aJeIimme,rFudieEädt2;ngebühr0r5;aFeE;et,ß;t58ß0;inkohleze2lle;atsEdtrat,rza3P;a02di5O;arHd GrE;ac4echE;chör0er;frak3Hl4Nv7;er,te;cBgnal6Nnn;i6Kuc9;arpings,ere,in,neid1rFwE;ierig0Käc4;eibt1QiEöd1;fts25tt;chEnkt,rajewo;en,sen-an5O;aPeIiHoGu4üE;ckEd53he;s14t5F;bert,lle;tu1Rv1;chHgierungsRisEst;ch,eFighaE;uf0;!nC;er2tE;e,saE;nwa6;c4hmen36;aOeLfKhänom3Lioni4UoIrE;eFoEä07; kopf 07grammv1Tjek3tes3;isEsseG;absp5Uverfal8;lizeiErD;sp0U;ennig,l0M;itDrE;es,sE;onal,pek3U;lästinensern,pieGrE;lamentEol0teiv7;es,swahl0;re;berfläc4f1Pliv1ppenheim1stslawonie1B;achIeGieForEä4;bert,drhein westf11;r0tzD;andert0PgativtrEuk23;end;bar,r08;aUcdonnTeQiKoJuIäHöglichGüE;lEn2;heim kärlich,l1;keit0;d2rk3;l0Iseum;dellcharakt1nats5rd;chae8eIlHnEtgefang2F;destFisterpräEut0;sident0;ein2A;itär,lia3T;rt,te;nFrE;kmale,rF;achem,em,ge,schenre1E;ell;astrQl1nGrktn43schinenFßE;e,n2E;!pistol0;ge8n;aKeIiHokales,uEä31;dEft;ewig,wigE;!shaf3N;cBs3;ch,g5iEu4O;c9pzig;ch1fontaines,ndEteiniD;eFgerE;icB;!sE;e18k14v7;aOern,iMoIrFurt,öE;ln,nig4Ir3;ach,iegsEuD;enCverbE;re1A;h8llekTmmun0nE;flik3tE;ak3rolE;le;nEr2;ke8;bel,mpagn0rFss0tschthEuf;al1;isch;ahrGerusalFuEürg0;gendliche3Sppé;em;!es5hundertw5tausendw5zehnt;deHmperaGnFrEtali2W;an,ene;ha6itiativeA;tiv;al0;aLeHoFundertEäf0Tö4;taus5;eErst;chst,n0;broGnne,rEß;bst,rn,sEzog;tell1;n 0S;ftLlKnIuE;ptFshaltE;!sstreits;urs2LvE;erantwor0A;delsEs jo2;!ab0M;s,t;!a1N;ast,eKipJläub32mbh,oIrEünt1;oßofGundFöße,ünE;de,en;ig;fens31;lft1Ztt;fe8;bie3faTha6lRmeinCnQrMsGwE;a6erkschaftE;en,sv7;chHeEicBpräc9ta6;llEtze;schaE;ft0;iEwor07;ch3;ichtFäuD;sc4;!eE;!s;era8f;d,senkE;ir2;hr,ngeneE;n,r;aXdp0GeViQlMoJrFührungseE;bene;aFeiheiE;tli2;kEu0;tion1Q;lge,rE;meln,sE;ch1;a09uFäc9üchE;tlinge;cBgangE;st;lialeAschE;!erE;!eiE;abE;komm0;ld,stgenommE;en0;ll26milienangehöriU;bOiInHpoc4rFuE;le,ropä1;achEde,folg,ha6löse,wachsene1R;tens;de,tge6;m1nE;bHheiGnFzelhande8;ls;ahm0;m10t0;rüc4;eneA;am0eKgbJiGraFu10örfE;ch0er;ch;enstFnEvid5;ge;e,mäd2; v7;fizi3legiert0utE;sc9;du HhEo6;arakter1Jef,iE;le,nabesuchE;es;lEv7;ande0K;a04eVilUlutvergieß0oRrMuIüE;ch1hGrgerE;!initiaE;tiv0;ne;ndesErs2;aFhaus0GläEtagsabgeordne3v7;nderA;nsta6;ancheFief,oEöt2;schür0t;!nE;!kollE;eg0;rcEusquN;heE;rt;d,l;am3freiungstLhöKrIsGtrE;iEoffQ;eb;chäftig0RucheE;r,s;ekEgsteGicht0Rnd;et;rd0;ig1;dInGrriFsf,ueE;rn;er0;an0kE;darleh0en;en1;a2b0Bgab,kbar,l06nYrUsQuE;fHge,sE;lä06sE;chußv7icBprE;ac4;entKsFtE;ritt;ichtsratFtändE;is2;sv7;orsiE;tz5;ha6;c4ylsuch5;enC;de;he;beitsGgumen3tenvielE;fa6;te;plätz0we6;geIhHlag0sEwa6;icBprüc9ta6;lt;heA;äng1;hörEklagt0stellP;igeE;!n,r;exaFternatE;ive;nd1;er;ar;endJgeordneHsE;icBpE;ra2;ht;teA;!n;!e;ch0;en",
    "MaleName": "true¦0:CA;1:BK;2:BY;3:B4;4:9N;5:BV;6:AS;7:9V;8:BC;9:AW;A:AN;aB3bA8c97d87e7Gf6Yg6Hh5Xi5Jj4Mk4Cl3Sm2Qn2Fo29p23qu21r1Bs0Qt06u05v00wNxavi4yGzB;aBor0;cBhid,ne;hCkB;!ary;ar52ery;ass2i,oCuB;sDuma;nEsDusB;oBsC;uf;ef;at0g;aJeHiCoByatt;lfgang,odrow;lBn1P;bDey,frBHlB;ard,iB;am,e,s;ert,ur;i,nde7sB;!l6t1;de,lCrr5yB;l1ne;lBt4;ace,y;aEern1iB;cCha0nceBrgil,va0;!nt;ente,tor;lentin4Ance,ughn;lysses,sm0;aTeOhKiIoErCyB;!l4ro8s1;avis,eBist0oy,um0;nt9Ivor,y;bDd7XmBny;!as,mBoharu;aso,ie,y;ias,y;mBt9;!my,othy;adDeoCiago,omB;!as;!dore;!de9;dErB;ence,rB;ance,eBy;ll,nce;!dy;dgh,ichi,nn4req,ts46;aScotQeOhKiIoGpenc4tBuraj,ylve8Gzym1;anEeBuart;f0phCvBwart;e57ie;an,en;!islaw,l6;lom1nny,uB;leyma8ta;dBlas,m1;!n6;aDeB;lBrm0;d1t1;hid,ne,qu0Uun,wn,y8;aBbasti0kou,lim,rgio,th,ymour;m9n;!tB;!ie,y;lCmBntino,qib,ul;!mAu3;ik,vatore;aWeShett,iOoFuCyB;an,ou;b6KdCf9pert,ssB;!elAD;olph,y;an,bIcHdGel,geFh0landA4mEnDry,sCyB;!ce;coe,s;!ald,nA;an,eo;lio,r;e4Pg4n6olfo,rigo;co,ky;bAerto;cBl6;ardo,c5MhCkBo;!ey,ie,y;ard,ie;gCid,ub5x,yBza;ansh,nS;gie,iB;nald,s;chid,fa3lDmCndBpha3shad,ul,ymond;al9Tolph,y;iro,on;f,ph;ent2inB;cy,t1;aFeDhilCierre,ol,reB;st1;!ip,lip;dro,rcy,tB;ar,e2V;blo,draig,t43ul;ctavio,m91rFsCtBumar,w5;is,to;aCcar,vB;aldo;ma;i,l48vJ;athJeHiDoB;aBel,l0ma0rm0;h,m;cCg3ilo,kB;hil,ola;holas,kBolas;!olas;al,d,il,ls1vB;ille;anBy;!a3i3;aWeTiKoFuCyB;les,r1;hamCrad,staB;fa,pha;ed,mF;dibo,e,hamDises,ntCsBussa;es,he;e,y;ad,ed,mB;ad,ed;cGgu3kElDnCtchB;!e7;ato,ik;house,o03t1;e,olB;aj;ah,hBk6;a3eB;al,l;hClv2rB;le,ri7v2;di,met;ck,hNlLmOnu3rHs1tDuricCxB;!imilian87we7;e,io;eo,hCias,tB;!eo,hew,ia;eBis;us,w;cDio,ko,lCquis,sha7tBv2;i2Gy;in,on;!el,oKus;achBcolm,ik;ai,y;amBdi,moud;adB;ou;aReNiMloyd,oIuCyB;le,nd1;cEiDkBth4;aBe;!s;gi,s;as,iaB;no;g0nnie,renDuBwe7;!iB;e,s;!zo;am,on3;a76evi,land,nDoBst4vi;!nB;!a5Yel;!ny;mCnBrry,ur4Rwr4R;ce,d1;ar,ont;aIeDhaled,iBrist4Turtis,yle;er0p,rB;by,k,ollos;en0iEnBrmit,v2;!dCnBt5B;eth,y;a7rick;r,th;nata,rBthem;im,l;aYeQiOoDuB;an,liBst2;an,o,us;aqu2eJhnInGrEsB;eChBiah,ue;!ua;!ph;dBge;an,i,on;!aBny;h,s,th4W;!ath4Vie,nA;!l,sBy;ph;an,e,mB;!mA;d,ffGrDsB;sBus;!e;ald,emCmai8oBry;me,nimo;iah,y;!ery,rB;ey,y;cHd5kGmFrDsCvi4yB;!d5s1;on,p4;ed,od,rBvis;ett,od;al,es,is1;e,ob,ub;k,ob,quB;es;aNbrahMchika,gKkeJlija,nuIrGsDtBv0;ai,sB;uki;aBha0iah,ma3sac;ac,iaB;h,s;a,vinBw2;!g;k,nnguaq;!r;nacBor;io;im;in,n;aJeFinata,oDuBydar;bert,gBmberto,sD;h,o;m4race,sBward;se2;aDctCitCnry,rB;bert,m0;or;th;bKlJmza,nIo,rDsCyB;ato,d5;an,s0;lEold,rDuBv6;hito,ki,tB;a,o;is1y;an,ey;k,s;!im;ib;aPeLiKlenJoHrDuB;illerBstavo;mo;aDegBov4;!g,orB;io,y;dy,ham,nt;nzaBrd1;lo;!n;lb4Mno,ovanni;ne,oDrB;aBry;ld,rd4Q;ffr6rge;bri3l5rBv2;land,r3Dth,y;aReNiLlJorr0IrB;anDedBitz;!dAeBrick;rick;cDkB;!ie,lB;in,yn;esJisB;!co,zek;etch4oB;yd;d3lBonn;ip;deriDliCng,rnB;ando;pe,x;co;bi0di;arZdUfrTit0lNmGnFo2rCsteb0th0uge8vBym5zra;an,erett;gi,iCnBrol,v2w2;est41ie;c07k;och,rique,zo;aGerFiCmB;aFett;lCrB;!h0;!io;s1y;nu3;bert,d1iEliDmCt1viBwood;n,s;er,o;ot1Ts;!as,jah,sB;ha;a2en;!dAgar,mEuCwB;a24in;arB;do;ond,und;l,nB;est;aYeOiLoErDuCwByl0;ay8ight;a8dl6nc0st2;ag0ew;minFnDri0ugCyB;le;!las;!ald,nBov0;e7ie,y;go,icB;!k;armuCeBll1on,rk;go;id;anIj0lbeHmetri9nFon,rEsDvCwBxt4;ay8ey;en,in;hawn,mond;ek,rick;is,nBv4;is,y;rt;!dB;re;lKmInHrDvB;e,iB;!d;en,iDne7rByl;eBin,yl;l2Rn;n,o,us;!e,i3ny;iBon;an,en,on;e,lB;as;a06e04hViar0lKoFrDurtCyrB;il,us;!is;aBistobal;ig;dy,lEnCrB;ey,neli9y;or,rB;ad;by,e,in,l2t1;aGeDiByI;fBnt;ford,t1;meCt9velaB;nd;nt;rDuCyB;!t1;de;enB;ce;aGeErisCuB;ck;!tB;i0oph4;st4;er;d,rlBs;eBie;s,y;cBdric,sar;il;lEmer1rB;ey,lCro7y;ll;!os,t1;eb,v2;ar01eTilSlaRoOrCuByr1;ddy,rtI;aJeEiDuCyB;an,ce,on;ce,no;an,ce;nCtB;!t;dCtB;!on;an,on;dBnd1;!foBl6y;rd;bCrByd;is;!by;i8ke;al,lA;nFrBshoi;at,nCtB;!ram;aBie;rd0P;!edict,iCjam2nA;ie,y;to;n6rBt;eBy;tt;ey;ar0Ub0Kd0Ggust2hm0Did5jani,lZmXnPputsiOrFsaEuCveBya0ziz;ry;gust9st2;us;hi;aIchHi3jun,maFnDon,tBy0;hBuro;ur;av,oB;ld;an,nd07;el;ie;ta;aq;dGgel02tB;hoEoB;i8nB;!iZy;ne;ny;reBy;!as,s,w;ir,mBos;ar;an,bLd5eHfEi,l0onDphonGt1vB;aJin;on;so,zo;onCrB;edN;so;c,jaCksandBssaCx;ar,er;ndB;ro;ertH;ni;en;ad,eB;d,t;in;aColfBri0vik;!o;mBn;!a;dFeEraCuB;!bakr,lfazl;hBm;am;!l;allEel,oulaye,ulB;!lCrahm0;an;ah,o;ah;av,on",
    "Conjunction": "true¦aFbDdAentwedGfalls,in9nach9o6s4u3w0zumal;e0ohingegen,ähre2;dEil,nn0;!g5;nd;eit4o0;bald,dass,lange,ndern,wie;b0d9;!g0wohl;lei2;dem;a1enn,o0;ch;mit,ss,ß;e0zw;vor,ziehungsweise;b0ls;er",
    "Determiner": "true¦d2ein0;!e0;!m,n,r,s;as,e0ie;m,n,r,s",
    "City": "true¦0:3A;a2Yb29c1Yd1Te1Sf1Qg1Kh1Ci1Ajakarta,k11l0Um0Gn0Co0ApZquiYrVsLtCuBv8w3y1zurich;angon,e1okohama;katerin1Krev0;ars4e3i1rocl4;cklow,n1;nipeg,terthur;llington,xford;aw;a2i1;enna,lnius;lencia,ncouver,rna;lan bator,trecht;a7bilisi,e6he5i4o3rondheim,u1;nWr1;in,ku;kyo,ronJulouD;anjin,l16miso2Mrana; haKssaloniki;gucigalpa,hr0l aviv;i1llinn,mpere,ngier,rtu;chung,n0pU;a4e3h2kopje,t1ydney;ockholm,uttgart;anghai,enzhen;oul,v01;int peters0Xl4n1pporo; 1ti1F;jo1salv3;se;v1z0T;adW;eykjavik,i2o1;me,sario,t28;ga,o de janeiro;to;a9e7h6i5o3r1uebla,yongyang;a1etoria;gue;rt1zn0; elizabe4o;lsen,raeus;iladelphia,nom penh,oenix;r1tah tikva;th;lerLr1tras;is;dessa,s1ttawa;aka,lo;a3ew 1is;delWtaip1york city;ei;goya,ntes,ples,v0;a7e6i5o2u1;mbai,nich;nt2sco1;u,w;evideo,real;l0nsk,skolc;dellín,lbourne;drid,l6n4r1;ib2se1;ille;or;chest1dalYila;er;mo;a6i3o1vCyon;nd1s angeles;on,res;ma1nz,sbon,verpo2;!ss1;ol; plata,usanne;a6hark5i4laipeda,o2rak1uala lump3;ow;be,pavog1sice;ur;ev,ng9;iv;b4mpala,ndy,ohsiung,ra1unas;c1j;hi;ncheNstanb1̇zmir;ul;a6e4o1; chi mi2ms,u1;stJ;nh;lsin1rakliH;ki;ifa,m1noi,vana;burg,iltE;alw5dan4en3hent,iza,othen2raz,ua1;dalaj0Hngzhou;burg;eWoa,ève;sk;ay;es,rankfu1;rt;dmont5indhov8;a2haka,oha,u1;blTrb0shanbe;e1kar,mascus,ugavpiL;gu,je1;on;a9ebu,h4o1raioLuritiba;lo2nstanLpenhag1rk;en;gGmbo;enn4i2ristchur1;ch;ang m2c1ttagoL;ago;ai;i1lgary,pe town,rac5;ro;aHeCirminghWogoBr6u1;char4dap4enos air3r1s0;g1sa;as;es;est;a3isba2usse1;ls;ne;silQtisla1;va;ta;i3lgrade,r1;l1n;in;ji1rut;ng;ku,n4r1sel;celo2ranquil1;la;na;g2ja lu1;ka;alo1kok;re;aDbBhmedabad,l8m5n3qa2sh1thens,uckland;dod,gabat;ba;k1twerp;ara;m0s1;terd1;am;exandr2ma1;ty;ia;idj0u dhabi;an;lbo2rh1;us;rg",
    "Country": "true¦0:2P;1:2O;a2Hb22c20d1Re1Kf1Gg18h17i12j0Zk0Ql0Mm0Dn04o03pYrVsKtEu7v4weißrusXz3ä2öster1H;quatorial01thiopi0;entralafrik1Sype9;anuatu,e2ietnam;nezuela,reinigte 2;arabische emirate,staat0;.6ganda,kraiLn2ruVsbeD;ga4ited 2;arab emirates,kingdom,states2;! of ame1S;rn;k.,s.2; virgin islands,a.;a5ha9o4rinidad und tobago,sch3u2ürkei;n0Srkme2Dvalu;ad,echi0;go,nga;dschi2nsania;ki2A;aAchwed0e9i7low6omalia,pa1ri lanka,t. 5u4was3y25ão tomé und príncipe,üd2;afrika,kMsudan;il1C;dan,riname;kitts und nevis,lucia,vincent und die grenadC;akei,e1;erra leo2mbabwe,ngapur;ne;negJr02ychell0;lomon0m2n marino,udi-ara01;bia,oa;e14u2;anda,mä1s2;sl11;a3eFhilipp2ortugD;in0;ki1Tlau,nama,pua-neu3ra2;guay;guinea;man,sttimor;a8e6i4or2;dk2weg0;orea;caragua,ederlanRger2;!ia;p2useel0P;al;mibia,u2;ru;a4exi7ikronUo2yanmK;ldawi0n2sambik;aco,golei,tenegro;dagaskHl5r3ur2zedo1;eta1itius;ok2shallinseln;ko;a2ediv0i,ta;wi,ysU;aos,e4i2uxemburg;b2echtenstein,tau0;erRy0;sotho,tX;a6enPir5o3roati0u2önigreich großbritan1;ba,wait;lum2mor0;bi0;gisi0ZibaZ;m4nada,p ver3sach0Yt2;ar;de;bodscha,erI;a2em0;mai2pan;ka;nd4r3s2ta0H;lVrael;ak,lU;i0on2;esi0;aiMonduras;a6hana,r5u2;atemala,inea2yana;!-biss2;au;enada,ieche8;b3mb2;ia;un;i3rank2;reiX;dschi,n2;nlF;cu6l4ritr3s2;tlD;ea; salv3fenbeinküs2;te;ad2;or;e6omini3schibu2änemark;ti;ca,k2;anische republ2;ik;mokratische re3utschl2;and;publik kon2;go;hi9osta 2;rica;aAe8hutSo6r4u2;lgaMr2;kina faso,undi;asiEun2;ei;livi0snien und herzegowi2tswa2;na;l2n7;gi0ize;h4nglades3rbad2;os;ch;am3ra2;in;as;fghaBl7n4r3serbaidschDustra2;li0;genti1me1;dorra,go3tigua und barbu2;da;la;ba1ge2;ri0;ni0;en;ni2;st2;an",
    "Region": "true¦0:1S;1:20;a1Yb1Rc1Hd1Ces1Bf18g12h0Zi0Wj0Uk0Sl0Rm0GnZoXpSqPrMsDtAut9v6w4y2zacatecas;o05u2;catan,kZ;a2est vi4isconsin,yoming;rwick0shington dc;er3i2;rginia;acruz,mont;ah,tar pradesh;a3e2laxcala,uscaB;nnessee,xas;basco,maulipas,smK;a7i5o3taf0Ou2ylhet;ffWrrey,s0Y;me10nora,uth 2;cTdS;beria,c2naloa;huan,ily;n3skatchewan,xo2;ny; luis potosi,ta catari1;a2hode8;j2ngpur;asthan,shahi;inghai,u2;e2intana roo;bec,ensYretaro;ara5e3rince edward2; isW;i,nnsylv2rnambuco;ania;!na;axaca,disha,h2klahoma,ntar2reg5x04;io;ayarit,eCo4u2;evo le2navut;on;r2tt0Rva scotia;f7mandy,th2; 2ampton0;c4d3yo2;rk0;akota;aroli1;olk;braska,vada,w2; 3foundland2;! and labrador;brunswick,hamp0jers3mexiJyork2;! state;ey;a7i3o2;nta1relos;ch4dlands,n3ss2;issippi,ouri;as geraFnesota;igPoacP;dhya,harashtra,ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca0eiHincoln0ouis7;a2entucky,hul1;nsas,rnataka,shmir;alis2iangxi;co;daho,llino3nd2owa;ia1;is;a3ert2idalFunB;ford0;mp0waii;ansu,eorgWlou6u2;an3erre2izhou,jarat;ro;ajuato,gdo2;ng;cester0;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby0;a9ea8hi7o2umbrH;ahui5l4nnectic3rsi2ventry;ca;ut;iMorado;la;apEhuahua;ra;l8m2;bridge0peche;a5ritish columb7uck2;ingham0;shi2;re;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo1kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "FemaleNoun": "true¦0:3F;1:3J;2:3T;3:3O;4:3N;5:3D;6:3X;7:3R;8:2V;a3Sb3Ec3Dd31e2Qf2Fg26h1Xin1Wj1Uk1Jl1Dm0Zn0Uo0Sp0Nr0GsYtQuNvKwAyoko,zei2Nüb9;erraschu5u5;aGeEiCoAto,u9;r2t;c8h9;lf6nungsnot;edergeburt,rtschaft9;!sh4;lt,r9;bu5kstatt,leigh;f3llf6nd9;!e08;e9w-tocJ;ag,r9;bin2Jmoeg2K;-Nhr,n9;i9s0Rternehmenssteuern;!cef,versität;aEelefonnu09imes,oCrAu9;er,gend;auer9euhand;!fei0;c9des1Xec9il2Nrte;ht0;lf6s9t,u3;c8se;aPchJeIms,oHpFs,t9uchocV;aDerbeh4ra9u3;fBße9;!n9;bahn;e,kaWtat;dlmay0hm0si;e9ur;rb0zies;cke,n7zialh4;d,henswürdigkeit;aDneebar,ulCw9;e9ienbach0;i9st0P;nepe2z;d,e,t0;er3u;ar,c8h7;aEeAied1u9;eck,ndP;d,g1pAservie9;ru5;ara09ubli9;ka;f,umf6;aBds,e2flanLhilharmonia,izza,lo,oAr9;aeamb1opaga2Nüfu5;lizistin,st27;rlamentska9use;mm0;eko1Fma,no,p08rd9;ers,nu5;aAe9ot,umm06;tzhaut,ubau0;belAcht,se,t9zE;o,ur;schau;aJeIiEorDuAüt9;ze;eAkakama9tt0;li;ller-münDtt0;al,genpo2;lBneraloel12ss,t9;h4s9;chuld;ch;hrwert0Yrk1taph0;nArk,schi7tthaeus-mai0u9;er,s;dari7i0;aBeinwaQpgs,u9;ft9st;f6waf3;mpe,ndAs9;ker-schuel0t;k1Fschaft;aEirc8lDoerper0Hprf,rBu9önigin,üc8;er,l9n2;tur;awatte,e9;ditk1Aide;a0Qient1;mAsse9;!tte;eras,m9;er9;!n;ahresfri2uge9;nd;formaTgeboBs1;aDeBil3o9rk,ütte;chbu9se;rg;i9ll0;mat,rat;ftPlbins1ndBu9;s9t;haltYtu0;!voll;aFeAglf,itarre,osalia,u9;n2s;burt,dBgenAis1ldJrvais9werbekapitalZ;es;d,wart;enktaf1u9;ld;b1r9sse;aLdi7;aHeFinanzh4lut,oErBu9;ess1nk9;tion;aAeiheits9g,i2;stra3;ge,u;lt0rm1tografie;d0i0s9;tu5;hr9u2;k08t;-mail,g,hefrIiDnBrbAta9;ge;schaftF;dstu3twicklung9;sh4;le,n9;kommAla9;du5;en9;steu0;au;-mark,aHecke,hs,iskGoEpa,rBu9;nkelziff0sc8;he;ittstaatenklaAogenmaf9;ia;us1;lmetscher9ppel-cds,se;in;etP;g9u0;!m9;ar;ds,ity,ola;aGeDgag,ibCluAr9;ille,u2ücR;se,tt9;at;el,liothek;dienu5ih4s9tt0;chreibu5tellu5;ng;chmann,erb1nkArm0yernhypo;er;!k9;ar9;te;el;bf6dresKgInGpDr9;beitslosenh4m9t;ut;il3;fe;felsi7othe9;ke;ne;g2twoE;st;!e9;nda;se;ah9;rt",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;gw,hr;ax,cn,ndianG;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Month": "true¦a6dez4febr3j1m0nov4okto5sept4;ai,ärz;an1u0;li,ni;uar;em0;ber;pril,ugust",
    "WeekDay": "true¦donner3freit4m2s0;am2onn0;abend,t2;ittwoch,ont1;st0;ag",
    "Pronoun": "true¦a06b03dYeUiPjeKkeinJletzteres,mCnichts,paar,s6uns5viele05w0;a3e2i1o0;!bei,gegen,mOnaTrin,von;ev5r;l5nXr;nn,rum,s;!er;i4o0ämtP;l1v0;iele;che0;m,n,r,s;ch,e;an3e1i0;ch,r;hrere6i0;n,stO;!ch0;!e0;!m,n,s;!eL;d1gliche0neN;!n;e0weder;!m,n,r0s;!mann;c3h1nwiewe0;it;m,n0r;!en;h,k;inige2r,s,t1u0;ch;liche;n,r,s;e3i0u;ch,e0r;jen0s6;ig2;n1r1ss1;eide1ißch0;en;!n,r;ll0nderem;!e0;!m,n,r,s",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "Person": "true¦ashton kutchSbRcNdKeIgastMhGinez,jEkDleCmBnettJoAp8r4s3t2v0;a0irgin maG;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uB;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipJ;lmIris hiltC;prah winfrFra;essiaen,itt romnEubarek;bron james,e;anye west,iefer sutherland,obe bryant;aime,effers7k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt1ick wolf;lt0nte;on;ar0ruz;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Currency": "true¦cent2dollar2euro2frank1krone0rubel,y1;!n;en;!s",
    "Unit": "true¦ampere,bHgEheDk5litAm1quadrat6t0volt,w9zenti6;erFonneA;e1illi0;g9li4me4;ga0t6;bCw4;ilo2ubik0;me0;ter;!b8g3met1w0;att;er0;!n;ramm;ktar,rtz;ig1ra0;d,mm;ab0;yte",
    "Modal": "true¦d9k7m2soll1w0;illBollt7;!st,t6;ag9och7u2ö1ü0;sst,ßt;ch5gt;ss0ß0;!t1;ann4onn2önnt0;!e2;arf2urf0ürft;te0;!n,st,t;!st",
    "Possessive": "true¦d3eu1ihr0m3s3unse1;e1s;re0;!m,n,r,s;ein0;e0s;!m,n,r",
    "TextCardinal": "true¦achtBbillionen,drei9e8fünfBhundert,milli6n5s2tausend,vierBz0;eCw0;anz8ei,ölf;ech1ieb0;en,z8;s,z7;eun5ull;arde,on0;!en;ins,lf;!ze3ß0;ig;!z0;e0ig;hn",
    "TextOrdinal": "true¦achtHbillioGdrEeDfünfChundertBmilli9n6s3tausenAvierCz0;eJieb1w0;an0eiJölfJ;ziG;ech1ieb0;enGte,zeF;sFzC;eun0ullE;te,z0;ehCiA;ar0o6;dsA;ers9s9;te,z5;lf7rs7;ei0it6;ze4ßi3;ns4;e,z0;e1i0;gs1;hn0;te"
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

  const toArray = function (trie) {
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
    return toArray(trie)
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

  const verbForm = function (term) {
    const want = [
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
        const str = term.implicit || term.normal || term.text;
        // get infinitive form of the verb
        if (term.tags.has('Verb')) {
          const form = verbForm(term);
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

  const tags = Object.assign({}, nouns$2, verbs$2, values$1, dates, misc);

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
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
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

    const words = terms[0].splits || [];
    // console.log(words)
    const tags = terms[0].tags;
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
        const mult = toNumber[w] || 1;
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
    const arr = str.split(/([0-9.,]*)/);
    let [prefix, num] = arr;
    let suffix = arr.slice(2).join('');
    // german format - '.' groups thousands, ',' marks the decimal
    num = num.replace(/[.,]$/, '');
    const hasComma = /\d\.\d/.test(num);
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
    const terms = m.docs[0];
    let num = null;
    let prefix = '';
    let suffix = '';
    let hasComma = false;
    const isText = m.has('#TextValue');
    if (isText) {
      num = parseNumbers(terms);
    } else {
      const res = fromNumber(m);
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

  const tens = data.tens.reverse();
  const teens = data.teens.reverse();
  const ones = data.ones.reverse();
  const hundreds = data.hundreds.reverse();


  const doThousands = function (num) {
    const words = [];
    // hunderttausend
    if (num >= 100000) {
      for (let i = 0; i < ones.length; i += 1) {
        if (num >= ones[i][0] * 100000) {
          const found = ones[i][0] === 1 ? 'ein' : ones[i][1];
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
        const found = ones[i][0] === 1 ? 'ein' : ones[i][1];
        return [found, 'tausend']
      }
    }
    return words
  };

  const doHundreds = function (num) {
    const words = [];
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
    const words = [];
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
          const found = ones[i][0] === 1 ? 'ein' : ones[i][1];
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
      const res = doThousands(num);
      words = words.concat(res);
      num %= 1000;
    }
    // do '[zwei][hundert]'
    if (num >= 100) {
      const res = doHundreds(num);
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
      const words = toText(parsed.num);
      const last = words[words.length - 1];
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
        const doc = getNth$3(this, n);
        return doc.map(p => {
          const json = p.toView().json(n)[0];
          const parsed = parseNumber(p);
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
        const m = this.if('#TextValue');
        const res = m.map(val => {
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          const str = formatNumber(obj, fmt);
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
        const m = this;
        const res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          const str = formatNumber(obj, fmt);
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
        const m = this;
        const res = m.map(val => {
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
            val.replaceWith(str, { tags: true });
            val.tag('Cardinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert cardinal to ordinal form, like 'eighth', or '8th' */
      toOrdinal() {
        const m = this;
        const res = m.map(val => {
          if (val.has('#Ordinal')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          const str = formatNumber(obj, fmt);
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
        if (typeof n === 'string') {
          n = parseNumber(n).num;
        }
        const m = this;
        const res = m.map((val) => {
          const obj = parseNumber(val);
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
        const m = this;
        const res = m.map((val) => {
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          const str = formatNumber(obj, fmt);
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

  var version = '0.1.1';

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
