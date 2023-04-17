import fs from 'fs';
import tags from './tags.js';
import XmlStream from 'xml-stream';

const parseXml = function (file, cb, end) {
  try {


    const stream = fs.createReadStream(file);
    const xml = new XmlStream(stream);

    xml.collect('t');
    xml.on('endElement: terminals', function (s) {
      let terms = s.t;
      let sentence = [];
      terms.forEach((t) => {
        let obj = t['$'];
        if (!obj || !obj.word || !obj.pos || obj.pos === '$') {
          return;
        }
        if (typeof obj.pos !== 'string') {
          return
        }
        let res = {
          w: obj.word,
          lemma: obj.word,
          tag: tags[obj.pos] || obj.pos,
        };
        if (obj.lemma !== '--') {
          res.lemma = obj.lemma;
        }
        //   //nouns
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
      // console.log(sentence.length);
      cb(sentence)
    });

    xml.on('end', function () {
      console.log('end')
      end()
    })
  } catch (e) {
    console.log(e)
  }
}
export default parseXml