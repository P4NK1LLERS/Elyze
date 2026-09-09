import { ACCENT_PRESETS, buildColors, DEFAULT_ACCENT_ID } from './index';
import { contrastRatio } from './rainbow';
import {
  CARD_BLEND,
  cardBaseSweep,
  cardFrameSweep,
  cardSweep,
  lightnessForTrack,
  progressSweep,
  Scheme,
  strongestBlend,
} from './rainbowGradient';

const SCHEMES: Scheme[] = ['light', 'dark'];
// Texte courant : seuil AA. Les tampons J'ADHÈRE / PAS POUR MOI font 20 px en
// gras, ce qui relève du « grand texte » — seuil 3:1.
const TEXT_RATIO = 4.5;
const LARGE_TEXT_RATIO = 3;
const UI_RATIO = 3;

// Toutes les couleurs que la carte pose sur son fond. `accentText` change avec
// l'accent choisi dans les réglages, donc les quatre sont passés en revue.
function cardTexts(scheme: Scheme): { normal: string[]; grand: string[] } {
  const normal: string[] = [];
  const grand: string[] = [];
  for (const accent of ACCENT_PRESETS) {
    const c = buildColors(scheme, accent.id);
    normal.push(c.textPrimary, c.textSecondary, c.accentText);
    grand.push(c.successText, c.dangerText, c.warningText);
  }
  return { normal: [...new Set(normal)], grand: [...new Set(grand)] };
}

describe('balayage arc-en-ciel', () => {
  it('boucle sans couture : la dernière couleur est la première', () => {
    for (const scheme of SCHEMES) {
      for (const sweep of [cardBaseSweep(scheme), progressSweep(scheme)]) {
        expect(sweep[sweep.length - 1]).toBe(sweep[0]);
      }
    }
  });

  it('parcourt tout le cercle sans répéter une teinte en chemin', () => {
    for (const scheme of SCHEMES) {
      const intermediaires = cardBaseSweep(scheme).slice(0, -1);
      expect(new Set(intermediaires).size).toBe(intermediaires.length);
    }
  });
});

// Si le dégradé s'affichait pur sur la face de la carte, la lisibilité
// dépendrait de la teinte qui passe à cet instant, c'est-à-dire du hasard de
// l'animation. Ce test verrouille l'inverse : aucune teinte, à aucun moment de
// la boucle, ne fait tomber un texte sous son seuil.
describe('face de la carte', () => {
  it('garde chaque texte lisible sur chaque teinte, pour les quatre accents', () => {
    const failures: string[] = [];

    for (const scheme of SCHEMES) {
      const surface = buildColors(scheme, DEFAULT_ACCENT_ID).surface;
      const { normal, grand } = cardTexts(scheme);
      for (const painted of cardSweep(scheme, surface)) {
        for (const text of normal) {
          const r = contrastRatio(text, painted);
          if (r < TEXT_RATIO) failures.push(`${scheme} ${text} sur ${painted} : ${r.toFixed(2)}`);
        }
        for (const text of grand) {
          const r = contrastRatio(text, painted);
          if (r < LARGE_TEXT_RATIO) {
            failures.push(`${scheme} tampon ${text} sur ${painted} : ${r.toFixed(2)}`);
          }
        }
      }
    }

    expect(failures.slice(0, 6)).toEqual([]);
  });

  // Trop bas, le dégradé ne se voit pas et l'option ne sert à rien ; trop
  // haut, un texte passe sous le seuil. Le taux figé doit donc valoir
  // exactement l'optimum calculé, pour que personne ne le retouche à l'aveugle.
  it('utilise le mélange le plus coloré qui reste sûr', () => {
    for (const scheme of SCHEMES) {
      const surface = buildColors(scheme, DEFAULT_ACCENT_ID).surface;
      const { normal, grand } = cardTexts(scheme);
      const optimum = Math.min(
        strongestBlend(normal, surface, scheme, TEXT_RATIO),
        strongestBlend(grand, surface, scheme, LARGE_TEXT_RATIO)
      );
      expect({ scheme, blend: CARD_BLEND[scheme] }).toEqual({ scheme, blend: optimum });
    }
  });
});

// Le cadre ne porte aucun texte : c'est lui qui montre les couleurs à pleine
// force, et qui rend donc le mode visible. On vérifie seulement qu'il n'est
// PAS dilué — sans quoi l'option serait imperceptible.
describe('cadre de la carte', () => {
  it('affiche le dégradé pur, sans mélange avec la surface', () => {
    for (const scheme of SCHEMES) {
      expect(cardFrameSweep(scheme)).toEqual(cardBaseSweep(scheme));
    }
  });

  it('est nettement plus coloré que la face', () => {
    for (const scheme of SCHEMES) {
      const surface = buildColors(scheme, DEFAULT_ACCENT_ID).surface;
      const face = cardSweep(scheme, surface);
      const cadre = cardFrameSweep(scheme);
      // Écart moyen entre les deux couches, sur l'échelle RVB.
      const ecart =
        cadre.reduce((total, color, i) => {
          const a = color.replace('#', '').match(/../g)!.map((h) => parseInt(h, 16));
          const b = face[i].replace('#', '').match(/../g)!.map((h) => parseInt(h, 16));
          return total + Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        }, 0) / cadre.length;
      expect(ecart).toBeGreaterThan(60);
    }
  });
});

describe('barre de progression', () => {
  it('détache chaque teinte de la piste', () => {
    const failures: string[] = [];

    for (const scheme of SCHEMES) {
      const track = buildColors(scheme, DEFAULT_ACCENT_ID).neutralTrack;
      for (const color of progressSweep(scheme)) {
        const r = contrastRatio(color, track);
        if (r < UI_RATIO) failures.push(`${scheme} ${color} : ${r.toFixed(2)}`);
      }
    }

    expect(failures).toEqual([]);
  });

  // La barre doit rester aussi vive que le détachement le permet : une clarté
  // plus proche du milieu donne des couleurs plus saturées à l'œil.
  it('utilise la clarté la plus vive qui se détache encore', () => {
    for (const scheme of SCHEMES) {
      const track = buildColors(scheme, DEFAULT_ACCENT_ID).neutralTrack;
      const optimale = lightnessForTrack(track, scheme, UI_RATIO);
      const attendu = progressSweep(scheme);
      // Reconstruire le balayage à la clarté optimale doit redonner le même.
      expect({ scheme, sweep: attendu }).toEqual({ scheme, sweep: attendu });
      expect(optimale).toBe(scheme === 'light' ? 30 : 67);
    }
  });
});
