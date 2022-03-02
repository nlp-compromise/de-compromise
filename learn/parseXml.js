import fs from 'fs';
import tags from './tags.js';
import XmlStream from 'xml-stream';

const parseXml = function (file, cb, end) {

  const stream = fs.createReadStream(file);
  const xml = new XmlStream(stream);

  xml.collect('t');
  xml.on('endElement: terminals', function (s) {
    let terms = s.t;
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
      if (obj.lemma !== '--') {
        res.lemma = obj.lemma;
      }
      //nouns
      if (obj.number !== '--') {
        if (obj.number === 'Sg') {
          res.plural = false
        } else if (obj.number === 'Pl') {
          res.plural = true
        }
      }
      if (obj.gender !== '--') {
        res.g = obj.gender;
      }
      //verbs
      if (obj.tense !== '--') {
        res.tense = obj.tense;
      }
      if (obj.mood !== '--') {
        res.mood = obj.mood;
      }
      if (obj.person !== '--') {
        res.person = obj.person;
      }
      if (obj.case !== '--') {
        res.case = obj.case;
      }
      sentence.push(res);
    });
    // console.log(sentence);
    cb(sentence)
  });

  xml.on('end', function () {
    console.log('end')
  })

}
export default parseXml