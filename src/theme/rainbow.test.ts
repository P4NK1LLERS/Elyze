import {
  buildRainbowColors,
  buildRainbowMedals,
  buildRainbowThemeColors,
  contrastRatio,
  randomSeed,
} from './rainbow';
import { THEMES } from '../data/themes';

// Le mode arc-en-ciel tire des teintes au hasard : impossible de vérifier une
// palette à la main comme on le fait pour les couleurs fixes. On rejoue donc
// un grand nombre de tirages et on contrôle chaque paire texte/fond, pour que
// n'importe quelle combinaison reste lisible.
const RUNS = 400;
const TEXT_RATIO = 4.5;
const GRAPHIC_RATIO = 3;
const SCHEMES: ('light' | 'dark')[] = ['light', 'dark'];

function seeds(count: number): number[] {
  return Array.from({ length: count }, () => randomSeed());
}

describe('mode arc-en-ciel', () => {
  it('garde tous les textes lisibles sur tous les fonds, quelle que soit la graine', () => {
    const failures: string[] = [];

    for (const seed of seeds(RUNS)) {
      for (const scheme of SCHEMES) {
        const c = buildRainbowColors(scheme, seed);
        const backgrounds = [
          c.bg,
          c.surface,
          c.surfaceAlt,
          c.accentSoft,
          c.successSoft,
          c.warningSoft,
          c.dangerSoft,
        ];
        const texts = {
          textPrimary: c.textPrimary,
          textSecondary: c.textSecondary,
          textMuted: c.textMuted,
          accentText: c.accentText,
          successText: c.successText,
          warningText: c.warningText,
          dangerText: c.dangerText,
        };

        for (const [name, fg] of Object.entries(texts)) {
          for (const bg of backgrounds) {
            const ratio = contrastRatio(fg, bg);
            if (ratio < TEXT_RATIO) {
              failures.push(`${scheme}/${seed} ${name} ${fg} sur ${bg} : ${ratio.toFixed(2)}`);
            }
          }
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('garde le texte blanc lisible sur les aplats pleins', () => {
    const failures: string[] = [];

    for (const seed of seeds(RUNS)) {
      for (const scheme of SCHEMES) {
        const c = buildRainbowColors(scheme, seed);
        // Fonds pleins portant du texte blanc.
        for (const [name, hex] of Object.entries({ accent: c.accent, accentStrong: c.accentStrong })) {
          const ratio = contrastRatio(c.onAccent, hex);
          if (ratio < TEXT_RATIO) failures.push(`${scheme}/${seed} ${name} : ${ratio.toFixed(2)}`);
        }
        // Icônes pleines : seuil graphique, ce n'est pas du texte.
        for (const [name, hex] of Object.entries({
          success: c.success,
          warning: c.warning,
          danger: c.danger,
        })) {
          const ratio = contrastRatio('#FFFFFF', hex);
          if (ratio < GRAPHIC_RATIO) failures.push(`${scheme}/${seed} ${name} : ${ratio.toFixed(2)}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('garde les tuiles de thèmes et les marches du podium lisibles', () => {
    const failures: string[] = [];
    const themeIds = THEMES.map((t) => t.id);

    for (const seed of seeds(RUNS)) {
      const tiles = buildRainbowThemeColors(themeIds, seed);
      expect(Object.keys(tiles)).toHaveLength(themeIds.length);

      for (const [id, hex] of Object.entries(tiles)) {
        const ratio = contrastRatio('#FFFFFF', hex);
        if (ratio < TEXT_RATIO) failures.push(`tuile ${id} (${seed}) : ${ratio.toFixed(2)}`);
      }
      buildRainbowMedals(seed).forEach((hex, i) => {
        const ratio = contrastRatio('#FFFFFF', hex);
        if (ratio < TEXT_RATIO) failures.push(`marche ${i + 1} (${seed}) : ${ratio.toFixed(2)}`);
      });
    }

    expect(failures).toEqual([]);
  });

  it('redonne exactement la même palette pour une même graine', () => {
    const seed = randomSeed();
    expect(buildRainbowColors('light', seed)).toEqual(buildRainbowColors('light', seed));
    expect(buildRainbowMedals(seed)).toEqual(buildRainbowMedals(seed));
  });

  it('donne des palettes différentes pour des graines différentes', () => {
    const a = buildRainbowColors('light', 1);
    const b = buildRainbowColors('light', 2);
    expect(a.accent).not.toEqual(b.accent);
  });
});
