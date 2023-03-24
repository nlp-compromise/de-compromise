import nlp from './src/index.js'
nlp.verbose('tagger')


// können (can, to be able to), 
// müssen (must, to have to), 
// wollen (will, to want to), 
// sollen (should, am to, ought to, to be supposed to), 
// dürfen (may, to be allowed to), 
// mögen (to like, to like to).

// [`kulturell`, `{kulturell}`],
// [`kultureller`, `{kulturell}`],
// [`kulturelle`, `{kulturell}`],
// [`kulturellen`, `{kulturell}`],
// [`kulturelles`, `{kulturell}`],

// let doc = nlp('kultureller').debug()

let arr = [
  'ich [muss] hinzufügen dass',
  // '[Mach] [dir] keine [Sorgen] ',//do not worry
]
let doc = nlp(arr[0]).debug()
doc.compute('root')

