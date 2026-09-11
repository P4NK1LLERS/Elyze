import jsQR from 'jsqr';
import { QR_CAPACITE_MAX, qrMatrix } from './qr';

// LE SEUL TEST QUI PROUVE QUELQUE CHOSE ICI EST CELUI QUI RELIT.
//
// Un encodeur QR écrit à la main produit, quand il se trompe, une image tout à
// fait convaincante : des repères aux trois coins, une trame plausible, rien
// qui ait l'air anormal. Elle est simplement illisible, et on ne l'apprend
// qu'en pointant un téléphone dessus. Vérifier que la grille est carrée, que
// les repères sont en place ou que deux appels donnent le même résultat ne
// démontre donc rien du tout.
//
// `jsQR` est un décodeur écrit par quelqu'un d'autre, à partir de la norme, et
// sans rien connaître de ce fichier. S'il relit le texte de départ, l'encodeur
// est juste — repères, synchronisation, alignement, format, masque,
// entrelacement des blocs et correction d'erreurs compris, puisque le moindre
// écart sur l'un de ces points empêche le décodage.

// Rend la matrice en pixels, comme le ferait un appareil photo, et la redonne
// au décodeur.
//
// La marge de quatre modules n'est pas décorative : la norme l'impose, et sans
// elle un décodeur ne trouve pas les bords du code. L'échelle de 4 pixels par
// module reproduit une photo correcte plutôt qu'un cas limite.
function relire(texte: string): string | null {
  const { size, modules } = qrMatrix(texte);
  const MARGE = 4;
  const ECHELLE = 4;
  const cote = (size + MARGE * 2) * ECHELLE;
  const pixels = new Uint8ClampedArray(cote * cote * 4);

  for (let y = 0; y < cote; y++) {
    for (let x = 0; x < cote; x++) {
      const ligne = Math.floor(y / ECHELLE) - MARGE;
      const colonne = Math.floor(x / ECHELLE) - MARGE;
      const sombre =
        ligne >= 0 && ligne < size && colonne >= 0 && colonne < size && modules[ligne][colonne];
      const valeur = sombre ? 0 : 255;
      const i = (y * cote + x) * 4;
      pixels[i] = valeur;
      pixels[i + 1] = valeur;
      pixels[i + 2] = valeur;
      pixels[i + 3] = 255;
    }
  }

  return jsQR(pixels, cote, cote)?.data ?? null;
}

describe('encodeur QR', () => {
  it('produit une grille carrée à la taille de sa version', () => {
    // Version 1 pour un texte court : 17 + 4 × 1.
    expect(qrMatrix('OK').size).toBe(21);
    // 40 octets imposent la version 3 : 17 + 4 × 3.
    expect(qrMatrix('x'.repeat(40)).size).toBe(29);
  });

  it('se relit par un décodeur indépendant', () => {
    expect(relire('elyze://d?c=ABCD1234')).toBe('elyze://d?c=ABCD1234');
  });

  it.each([1, 10, 14, 26, 42, 62, 84, 106])(
    'se relit pour une charge de %i octets, toutes versions confondues',
    (longueur) => {
      // Ces longueurs sont exactement les capacités maximales des versions 1 à
      // 6 : elles forcent le passage à la version suivante, donc un
      // découpage en blocs et une table d'alignement différents à chaque fois.
      const texte = 'A'.repeat(longueur);
      expect(relire(texte)).toBe(texte);
    }
  );

  it('se relit sur un jeu de textes quelconques', () => {
    for (const texte of [
      '0',
      'elyze://d?c=0123456789ABCDEFGHJKMNPQRSTV',
      'https://poligraph.fr/elections/presidentielle-2027',
      'ÉLYZE 2027 · duel',
    ]) {
      expect(relire(texte)).toBe(texte);
    }
  });

  it('refuse franchement ce qui dépasse sa capacité', () => {
    expect(QR_CAPACITE_MAX).toBe(106);
    expect(() => qrMatrix('x'.repeat(QR_CAPACITE_MAX + 1))).toThrow(/capacité/);
  });
});
