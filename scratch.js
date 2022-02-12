import nlp from './src/index.js'


let text = 'Ich, ich bin dann König. Und du, du Königin. Werden wir Helden für einen Tag.'
var dok = nlp(text)
dok.debug()