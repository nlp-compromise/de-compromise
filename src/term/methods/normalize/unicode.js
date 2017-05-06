const noUmlaut = (str) => {
  // ä, ö and ü, ß
  str = str.replace(/ä/u, 'ae');
  str = str.replace(/ö/u, 'oe');
  str = str.replace(/ü/u, 'ue');
  str = str.replace(/ß/u, 'ss');
  return str;
};
module.exports = noUmlaut;
