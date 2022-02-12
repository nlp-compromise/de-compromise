import fs from 'fs';
import tags from './tags.js';
import XmlStream from 'xml-stream';

const parseXml = function (file, cb) {

  const stream = fs.createReadStream(file);
  const xml = new XmlStream(stream);

  xml.collect('t');
  xml.on('endElement: terminals', function (term) {
    let terms = term.t;
    let sentence = [];
    terms.forEach((t) => {
      let obj = t['$'];
      if (!obj.word || obj.pos[0] === '$') {
        return;
      }
      let res = {
        w: obj.word,
        tag: tags[obj.pos] || obj.pos,
      };
      //nouns
      if (obj.number !== '--') {
        obj.num = obj.number;
      }
      if (obj.gender !== '--') {
        obj.g = obj.gender;
      }
      //verbs
      if (obj.tense !== '--') {
        obj.tense = obj.tense;
      }
      if (obj.mood !== '--') {
        obj.mood = obj.mood;
      }
      sentence.push(res);
    });
    // console.log(sentence);
    cb(sentence)
  });

}
export default parseXml