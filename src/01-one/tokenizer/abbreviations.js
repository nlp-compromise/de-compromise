// words that end in a period, but don't end a sentence - 'Dr.'
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default toObj(`
  dr prof dipl ing dipl.-ing med jur rer nat phil hr fr fa hrsg inh univ hbf bhf
  bzw ggf evtl inkl exkl zzgl ca vgl sog bzgl bspw bsp ggü lt gem allg bes
  einschl ausschl entspr ehem geb gest verh gegr mind zus zw od
  nr abs kap anm abb tab bd aufl ebd ff resp tel st str co ltd vs
  mio mrd tsd mwst jh jhd chr min std rd mtl
  tägl monatl jährl nördl südl östl westl
  mo di sa usw usf etc
  jan feb mär apr jun jul aug sep sept okt nov dez
`)
