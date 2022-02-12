// https://www.linguistik.hu-berlin.de/de/institut/professuren/korpuslinguistik/mitarbeiter-innen/hagen/STTS_Tagset_Tiger
export default {
  ADJA: 'JJ', // adjective, //attributive [das] große [Haus]
  ADJD: 'JJ', //adjective, //adverbial or predicative [er fahrt] ¨ schnell, //[er ist] schnell
  ADV: 'Adverb', //adverb schon, //bald, //doch
  APPR: 'Adverb', //preposition; circumposition left in [der Stadt], //ohne [mich]
  APPRART: 'Preposition', //preposition with article im [Haus], //zur [Sache]
  APPO: '', //postposition [ihm] zufolge, //[der Sache] wegen
  APZR: '', //circumposition right [von jetzt] an
  ART: 'Determiner', //definite or indefinite article der, //die, //das, //ein, //eine, //...
  CARD: 'Value', //cardinal number zwei [Mann ¨ er], //[im Jahre] 1994
  FM: 'Expression', //foreign language material [Er hat das mit “] A big fish [”uber ¨ setzt]
  ITJ: 'Interjection', //interjection mhm, //ach, //tja
  KOUI: 'Conjunction', //subordinate conjunction with zuand infinitiveum [zu leben], //anstatt [zu fragen]
  KOUS: 'Conjunction', //subordinate conjunction with sentence weil, //daß, //damit, //wenn, //ob
  KON: 'Conjunction', //coordinate conjunction und, //oder, //aber
  KOKOM: 'Conjunction', //comparative conjunction als, //wie
  NN: 'Noun', //common noun Tisch, //Herr, //[das] Reisen
  NE: 'Noun', //proper noun Hans, //Hamburg, //HSV
  PDS: 'Pronoun', //substituting demonstrative pronoun dieser, //jener
  PDAT: 'Pronoun', //attributive demonstrative pronoun jener [Mensch]
  PIS: 'Pronoun', //substituting indefinite pronoun keiner, //viele, //man, //niemand
  PIAT: 'Pronoun', //attributive indefinite pronoun without determiner kein [Mensch], //irgendein [Glas]
  PIDAT: 'Pronoun', //attributive indefinite pronoun with determiner [ein] wenig [Wasser], //[die] beiden [Bruder ¨ ]
  PPER: 'Pronoun', //non-reflexive personal pronoun ich, //er, //ihm, //mich, //dir
  PPOSS: 'Pronoun', //substituting possessive pronoun meins, //deiner
  PPOSAT: 'Pronoun', //attributive possessive pronoun mein [Buch], //deine [Mutter]12
  PRELS: 'Pronoun', //substituting relative pronoun [der Hund ,] der
  PRELAT: 'Pronoun', //attributive relative pronoun [der Mann ,] dessen [Hund]
  PRF: 'Pronoun', //reflexive personal pronoun sich, //dich, //mir
  PWS: 'Pronoun', //substituting interrogative pronoun wer, //was
  PWAT: 'Pronoun', //attributive interrogative pronoun welche [Farbe], //wessen [Hut]
  PWAV: 'Pronoun', //adverbial interrogative or relative pronoun warum, //wo, //wann, //woruber ¨ , //wobei
  PAV: 'Pronoun', //pronominal adverb dafur¨ , //dabei, //deswegen, //trotzdem
  PTKZU: 'Auxiliary', //zu before infinitive zu [gehen]
  PTKNEG: 'Particle', //negative particle nicht
  PTKVZ: 'Particle', //separable verbal particle [er kommt] an, //[er fahrt] ¨ rad
  PTKANT: 'Particle', //answer particle ja, //nein, //danke, //bitte
  PTKA: 'Particle', //particle with adjective or adverb am [schonste ¨ n], //zu [schnell]
  SGM: '', // SGML markup  turnid=n022k TS2004
  SPELL: '', //letter sequence S-C-H-W-E-I-K-L
  TRUNC: '', //word remnant An- [und Abreise]

  VVFIN: 'Verb', //finite verb, //full [du] gehst, //[wir] kommen [an]
  VVIMP: 'Verb', //imperative, //full komm [!]
  VVINF: 'Infinitive', //infinitive, //full gehen, //ankommen
  VVIZU: 'Infinitive', //Infinitive with zu, //full anzukommen, //loszulassen
  VVPP: 'Verb', //perfect participle, //full gegangen, //angekommen
  VAFIN: 'Copula', //finite verb, //auxiliary [du] bist, //[wir] werden
  VAIMP: 'Verb', //imperative, //auxiliary sei [ruhig !]
  VAINF: 'Inf', //infinitive, //auxiliary werden, //sein
  VAPP: 'Verb', //perfect participle, //auxiliary gewesen
  VMFIN: 'Modal', //finite verb, //modal dur¨ fen
  VMINF: 'Infinitive', //infinitive, //modal wollen
  VMPP: 'Verb', //perfect participle, //modal gekonnt, //[er hat gehen] kon¨ nen
  XY: '', //non-word containing non-letter 3:7, //H2O, //D2XW3
};