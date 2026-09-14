export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Le même brassage, mais REPRODUCTIBLE à partir d'une graine.
//
// C'est ce qui rend le duel possible. Faire jouer à deux personnes exactement
// les mêmes cartes demanderait, sans cela, de faire voyager la liste des
// propositions elle-même : cent soixante-cinq identifiants, soit plusieurs
// milliers de caractères, là où une graine en tient quatre octets. Le paquet
// n'est pas transmis, il est RECONSTRUIT à l'identique sur l'autre téléphone
// (voir utils/duel.ts).
//
// Deux conditions pour que cela tienne, et elles valent d'être dites :
//
//  1. la même graine doit donner le même paquet sur les deux appareils, donc
//     le générateur ne peut pas être `Math.random` ni dépendre de quoi que ce
//     soit de local ;
//  2. le catalogue doit être le même des deux côtés, ce que le code de duel
//     vérifie par une empreinte avant de reconstruire quoi que ce soit.
//
// Mulberry32 : trente-deux bits d'état, une poignée d'opérations entières, et
// une distribution largement suffisante pour mélanger des cartes. Ce n'est pas
// un générateur cryptographique et il n'a pas à l'être : personne ne gagne
// quoi que ce soit à deviner l'ordre de son propre paquet.
export function shuffleAvecGraine(graine: number): <T>(items: T[]) => T[] {
  let etat = graine >>> 0;
  const suivant = () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return <T,>(items: T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(suivant() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
}

// Graine tirée au hasard pour une nouvelle partie. Trente-deux bits, ce qui
// tient dans les quatre octets que le code de duel lui réserve.
export function graineAleatoire(): number {
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}
