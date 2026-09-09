import { PROPOSALS } from '../data/proposals';

// Empreinte du catalogue embarqué.
//
// Une session enregistrée ne retient que des IDENTIFIANTS de proposition, et
// son `currentIndex` désigne une position dans l'ordre où elle les avait
// rangés. Les deux ne valent que face au catalogue qui les a produits.
//
// Or ce catalogue change : les identifiants dérivent du nom du candidat
// (`cazeneuve-economie-instaurer-…`), si bien que retirer un candidat fait
// disparaître tous les siens d'un coup. Sans contrôle, une reprise résolvait
// ce qu'elle pouvait, le paquet rétrécissait, et `currentIndex` continuait de
// pointer dans l'ancien ordre — la reprise atterrissait sur une carte sans
// rapport avec l'endroit où l'on s'était arrêté, en silence.
//
// Comparer cette empreinte règle le cas d'un coup, et sans avoir à penser à
// incrémenter un numéro de version à chaque régénération des données : elle
// change d'elle-même dès que l'ensemble des propositions change.
//
// FNV-1a 32 bits : ce n'est pas de la cryptographie, on ne se défend contre
// personne. On veut seulement qu'une modification du catalogue produise une
// autre valeur, pour un coût négligeable au démarrage.
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Multiplication par le nombre premier FNV, en arithmétique 32 bits non
    // signée. `Math.imul` évite la perte de précision des flottants.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

// Les identifiants sont triés : l'empreinte décrit l'ENSEMBLE des
// propositions, pas l'ordre dans lequel le fichier généré les a écrites.
// Réordonner le fichier sans rien changer au contenu n'invalide donc pas les
// sessions en cours.
export const CATALOG_FINGERPRINT = `${PROPOSALS.length}-${fnv1a(
  PROPOSALS.map((p) => p.id)
    .sort()
    .join('\n')
)}`;
