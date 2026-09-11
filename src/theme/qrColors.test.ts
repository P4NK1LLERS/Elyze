import jsQR from 'jsqr';
import { ACCENT_PRESETS } from './index';
import { buildRainbowColors, contrastRatio } from './rainbow';
import { QR_BACKGROUND, QR_MIN_CONTRAST, qrModuleColor } from './qrColors';
import { qrMatrix } from '../utils/qr';

// METTRE UN QR CODE AUX COULEURS DE L'APP EST LE GENRE DE DEMANDE QUI CASSE
// TOUT SANS BRUIT.
//
// Un décodeur ne voit pas de couleur : il ramène chaque pixel à une luminosité
// et tranche. Une teinte trop claire fait basculer les modules du mauvais côté
// du seuil, et le code devient illisible tout en gardant l'air parfaitement
// normal — trois repères aux angles, une belle trame, et rien à scanner. On ne
// s'en aperçoit qu'en pointant un téléphone dessus.
//
// Ces tests font donc les deux choses : ils mesurent le contraste, et ils
// RELISENT vraiment le code avec jsQR, pour chaque accent de l'app et pour
// deux cents palettes tirées au hasard par le mode arc-en-ciel.

const TEXTE = 'elyze://d?c=0773 75HW892N4CHQ6WTM4K1NWM'.replace(/ /g, '');

function versPixels(couleur: string): { data: Uint8ClampedArray; cote: number } {
  const { size, modules } = qrMatrix(TEXTE);
  const MARGE = 4;
  const ECHELLE = 4;
  const cote = (size + MARGE * 2) * ECHELLE;
  const data = new Uint8ClampedArray(cote * cote * 4);

  const teinte = (hex: string) => {
    const c = hex.replace('#', '');
    return [
      parseInt(c.slice(0, 2), 16),
      parseInt(c.slice(2, 4), 16),
      parseInt(c.slice(4, 6), 16),
    ];
  };
  const sombre = teinte(couleur);
  const clair = teinte(QR_BACKGROUND);

  for (let y = 0; y < cote; y++) {
    for (let x = 0; x < cote; x++) {
      const ligne = Math.floor(y / ECHELLE) - MARGE;
      const colonne = Math.floor(x / ECHELLE) - MARGE;
      const plein =
        ligne >= 0 && ligne < size && colonne >= 0 && colonne < size && modules[ligne][colonne];
      const [r, v, b] = plein ? sombre : clair;
      const i = (y * cote + x) * 4;
      data[i] = r;
      data[i + 1] = v;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { data, cote };
}

function relire(couleur: string): string | null {
  const { data, cote } = versPixels(couleur);
  return jsQR(data, cote, cote)?.data ?? null;
}

describe('couleur des modules', () => {
  it('garde le fond clair, quel que soit le thème de l’app', () => {
    // Un décodeur attend du sombre sur du clair ; beaucoup refusent l'inverse.
    expect(QR_BACKGROUND).toBe('#FFFFFF');
  });

  describe.each(ACCENT_PRESETS)('accent $label', (preset) => {
    const couleur = qrModuleColor(preset.accent);

    it('franchit le seuil de contraste', () => {
      expect(contrastRatio(couleur, QR_BACKGROUND)).toBeGreaterThanOrEqual(QR_MIN_CONTRAST);
    });

    it('se relit une fois dessiné', () => {
      expect(relire(couleur)).toBe(TEXTE);
    });

    // Assombrir ne doit pas revenir à peindre en noir : ce serait respecter la
    // consigne en perdant ce qu'on voulait.
    it('reste une couleur, et non un noir déguisé', () => {
      const c = couleur.replace('#', '');
      const canaux = [
        parseInt(c.slice(0, 2), 16),
        parseInt(c.slice(2, 4), 16),
        parseInt(c.slice(4, 6), 16),
      ];
      // Au moins un canal franchement au-dessus des autres : il reste de la
      // teinte, pas un gris.
      expect(Math.max(...canaux) - Math.min(...canaux)).toBeGreaterThan(25);
    });
  });

  // Le mode arc-en-ciel tire ses teintes au hasard : c'est le seul endroit de
  // l'app où une couleur n'a pas été choisie par quelqu'un.
  describe('mode arc-en-ciel', () => {
    const graines = Array.from({ length: 200 }, (_, i) => i * 7919 + 13);

    it('produit toujours un contraste suffisant', () => {
      for (const graine of graines) {
        const accent = buildRainbowColors('light', graine).accent;
        const couleur = qrModuleColor(accent);
        expect(contrastRatio(couleur, QR_BACKGROUND)).toBeGreaterThanOrEqual(QR_MIN_CONTRAST);
      }
    });

    // Vingt palettes relues pour de bon : mesurer un contraste est une chose,
    // constater qu'un décodeur s'en sort en est une autre.
    it('produit toujours un code que l’on relit', () => {
      for (const graine of graines.slice(0, 20)) {
        const couleur = qrModuleColor(buildRainbowColors('light', graine).accent);
        expect(relire(couleur)).toBe(TEXTE);
      }
    });
  });

  // Le contre-exemple : sans cette précaution, l'accent brut passerait sous le
  // seuil. C'est ce qui justifie l'existence de tout ce fichier.
  it('l’accent brut ne suffirait pas', () => {
    const brut = ACCENT_PRESETS.map((p) => contrastRatio(p.accent, QR_BACKGROUND));
    expect(Math.min(...brut)).toBeLessThan(QR_MIN_CONTRAST);
  });
});
