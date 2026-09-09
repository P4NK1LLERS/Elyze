import { THEME_COLORS, themeChipColors } from './themeColors';
import { buildRainbowThemeColors, contrastRatio } from '../theme/rainbow';
import { THEMES } from './themes';
import { ACCENT_PRESETS, buildColors } from '../theme';

// Les pastilles de thème posent un texte teinté sur un fond très pâle de la
// même teinte. Le dosage doit tenir quelle que soit la couleur de départ, y
// compris celles tirées au sort par le mode arc-en-ciel.
const TEXT_RATIO = 4.5;
const LIGHT_SURFACE = '#FFFFFF';
const DARK_SURFACE = '#1C1A22';

// Les graines de test sont TIRÉES D'UNE SUITE DÉTERMINISTE, pas de
// `Math.random()`.
//
// Le but n'a pas changé : couvrir bien plus que les quinze couleurs de la
// palette fixe, puisque le mode arc-en-ciel en fabrique à la volée. Mais un
// échec sur une graine aléatoire n'était pas rejouable — on aurait su qu'une
// couleur cassait le contraste sans jamais pouvoir la reproduire, ce qui est
// la seule chose qu'on demande à un test qui échoue.
//
// Générateur congruentiel linéaire (constantes de Numerical Recipes) : la
// suite est fixe, donc les mêmes couleurs sont vérifiées à chaque exécution.
function seeds(count: number, start: number): number[] {
  const out: number[] = [];
  let state = start >>> 0;
  for (let i = 0; i < count; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out.push(state);
  }
  return out;
}

function check(base: string, surface: string, isDark: boolean): number {
  const { background, text } = themeChipColors(base, surface, isDark);
  return contrastRatio(text, background);
}

describe('themeChipColors', () => {
  it('reste lisible pour les quinze couleurs de thème, en clair comme en sombre', () => {
    const failures: string[] = [];

    for (const [id, base] of Object.entries(THEME_COLORS)) {
      const light = check(base, LIGHT_SURFACE, false);
      const dark = check(base, DARK_SURFACE, true);
      if (light < TEXT_RATIO) failures.push(`${id} clair ${light.toFixed(2)}`);
      if (dark < TEXT_RATIO) failures.push(`${id} sombre ${dark.toFixed(2)}`);
    }

    expect(failures).toEqual([]);
  });

  it('reste lisible avec les couleurs tirées au sort du mode arc-en-ciel', () => {
    const failures: string[] = [];
    const themeIds = THEMES.map((t) => t.id);

    for (const seed of seeds(300, 0x5eed1)) {
      for (const base of Object.values(buildRainbowThemeColors(themeIds, seed))) {
        const light = check(base, LIGHT_SURFACE, false);
        const dark = check(base, DARK_SURFACE, true);
        if (light < TEXT_RATIO) failures.push(`${base} clair ${light.toFixed(2)}`);
        if (dark < TEXT_RATIO) failures.push(`${base} sombre ${dark.toFixed(2)}`);
      }
    }

    // Le rapport est tronqué pour rester lisible, mais le nombre total est
    // affirmé à part : sans lui, une panne sur mille couleurs se lirait comme
    // une panne sur cinq.
    expect({ total: failures.length, premiers: failures.slice(0, 5) }).toEqual({
      total: 0,
      premiers: [],
    });
  });
});

// Les tuiles de la mosaïque portent du texte blanc : le libellé du thème et,
// juste en dessous, le décompte de propositions. Ce dernier était posé à 85 %
// d'opacité, ce qui laissait remonter la couleur de la tuile et faisait tomber
// le contraste sous le seuil sur un tiers de la palette. Les deux textes sont
// désormais en blanc plein — ce test verrouille l'invariant qui rend ce choix
// sûr : toute couleur de tuile doit tenir 4.5:1 face au blanc.
describe('couleurs des tuiles de la mosaïque', () => {
  it('tiennent le contraste avec du texte blanc, pour les quinze thèmes', () => {
    const failures: string[] = [];

    for (const [id, color] of Object.entries(THEME_COLORS)) {
      const ratio = contrastRatio('#FFFFFF', color);
      if (ratio < TEXT_RATIO) failures.push(`${id} ${color} : ${ratio.toFixed(2)}`);
    }

    expect(failures).toEqual([]);
  });

  it('tiennent le contraste avec du texte blanc, en mode arc-en-ciel', () => {
    const failures: string[] = [];
    const themeIds = THEMES.map((t) => t.id);

    for (const seed of seeds(200, 0xb1a2c)) {
      for (const color of Object.values(buildRainbowThemeColors(themeIds, seed))) {
        const ratio = contrastRatio('#FFFFFF', color);
        if (ratio < TEXT_RATIO) failures.push(`${color} : ${ratio.toFixed(2)}`);
      }
    }

    expect({ total: failures.length, premiers: failures.slice(0, 5) }).toEqual({
      total: 0,
      premiers: [],
    });
  });
});

// Le multiplicateur « ×3 » de la légende d'accueil est une pastille pleine :
// du texte pris dans `bg` posé sur un fond `warningText`. C'est un usage
// inversé de ce jeton, prévu à l'origine comme couleur de TEXTE, donc le
// contraste ne va pas de soi — d'autant qu'il doit tenir pour les deux thèmes
// ET les quatre accents proposés dans les réglages.
describe('pastille du multiplicateur', () => {
  it('reste lisible dans les deux thèmes et pour les quatre accents', () => {
    const failures: string[] = [];

    for (const scheme of ['light', 'dark'] as const) {
      for (const accent of ACCENT_PRESETS) {
        const c = buildColors(scheme, accent.id);
        const ratio = contrastRatio(c.bg, c.warningText);
        if (ratio < TEXT_RATIO) {
          failures.push(`${scheme}/${accent.id} : ${ratio.toFixed(2)}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});

// L'interrupteur « candidats masqués / visibles » est dessiné à la main : une
// piste et un curseur, deux aplats côte à côte. Rien n'y est du texte, donc le
// seuil applicable est celui des éléments d'interface — 3:1. Une première
// version posait un curseur en `surface`, invisible sur sa piste (1.24:1 en
// thème clair) : présent, mais impossible à situer d'un coup d'œil, ce qui est
// précisément ce qu'on demande à un interrupteur.
describe('interrupteur de révélation', () => {
  const UI_RATIO = 3;

  it('détache son curseur de la piste, éteint comme allumé', () => {
    const failures: string[] = [];

    for (const scheme of ['light', 'dark'] as const) {
      for (const accent of ACCENT_PRESETS) {
        const c = buildColors(scheme, accent.id);

        const eteint = contrastRatio(c.textMuted, c.neutralTrack);
        if (eteint < UI_RATIO) failures.push(`${scheme}/${accent.id} éteint : ${eteint.toFixed(2)}`);

        const allume = contrastRatio('#FFFFFF', c.accent);
        if (allume < UI_RATIO) failures.push(`${scheme}/${accent.id} allumé : ${allume.toFixed(2)}`);
      }
    }

    expect(failures).toEqual([]);
  });
});
