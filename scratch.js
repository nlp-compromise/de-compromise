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
  'Ich wohne bei meinem Freund.',
  'die [Kette] durch [die] der Kronleuchter ',//The [excited] crowd pushing the [chain] through [the] chandeliers
  `einen Sünder`,//a sinner
  ' in der [Stille] ', //in the silence
  'über ihre [Erfolge] und Misserfolge ',//about their successes and fialures
  '[Mach] [dir] keine [Sorgen] ',//do not worry
  'Dieser [Zustand] war rein frei ',//this state was free
  `Die [Löhne] der Technikfreaks `,//the wages of the techies
  `von [meinem] [Rücken]  `,//from my back
  `in der linken [Kralle] `,//in the left claw
  `Das [ferne] [Stöhnen] `,//the distant moan
  `meine Erfahrung mit [eritreischem] [äthiopischem] [Essen] `,//my experience with [Eritrean] [Ethiopian] [food]
  `[und] [eine] die [ich] so schnell vergessen werde `,//[and] [one] that [I] will soon forget
  ' Das [Böse] ist real und es [muss] bekämpft werden',//The [evil] is real and it [must] be fought
  'der [Unterschied] zwischen ',//the difference between
  'ich [muss] hinzufügen dass [das] ',//i must add that
  ' [hinzu] [neutrale] Monster',//add neutral monsters
  '[einige] seiner [heftigsten] [Angriffe] ',//some of his most violent attacks
]
let doc = nlp(arr[0]).debug()