import { ColorTokens } from './index';

// --- Mode arc-en-ciel -------------------------------------------------------
//
// Repeint TOUTE l'application avec des couleurs tirées au hasard : fonds,
// textes, accents, couleurs des thèmes, marches du podium. Comme chaque
// composant construit ses styles à partir de `ColorTokens`, il suffit de
// fabriquer un jeu de tokens aléatoire pour que tout l'écran suive.
//
// Ce qui est tiré au sort, c'est la TEINTE (et un peu la saturation) : la
// CLARTÉ, elle, est calculée. Une couleur totalement aléatoire donnerait une
// fois sur deux du texte illisible sur son fond ; ici chaque couleur de texte
// est descendue (ou remontée) juste ce qu'il faut pour atteindre le contraste
// WCAG AA sur tous les fonds où elle peut apparaître. Le résultat reste
// franchement bariolé, mais l'app reste lisible.

// Générateur pseudo-aléatoire déterministe : une même graine redonne
// exactement la même palette, ce qui permet de la mémoriser et de la
// retrouver au redémarrage.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

function channelLuminance(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Cherche la clarté la MOINS extrême qui atteigne `minRatio` face à tous les
// fonds donnés : on garde ainsi la couleur aussi vive que possible, sans
// jamais descendre sous le seuil de lisibilité.
function pickReadable(
  hue: number,
  saturation: number,
  backgrounds: string[],
  minRatio: number,
  direction: 'darker' | 'lighter'
): string {
  const step = direction === 'darker' ? -1 : 1;
  for (let i = 0; i <= 100; i++) {
    const l = 50 + step * i * 0.5;
    if (l < 0 || l > 100) break;
    const candidate = hslToHex(hue, saturation, l);
    if (backgrounds.every((bg) => contrastRatio(candidate, bg) >= minRatio)) return candidate;
  }
  return direction === 'darker' ? '#000000' : '#FFFFFF';
}

// Seuils WCAG : 4.5:1 pour du texte courant, 3:1 pour un élément graphique.
const TEXT_RATIO = 4.5;
const GRAPHIC_RATIO = 3;

export function buildRainbowColors(scheme: 'light' | 'dark', seed: number): ColorTokens {
  const rand = mulberry32(seed);
  const hue = () => Math.floor(rand() * 360);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const isDark = scheme === 'dark';

  // Fonds : teinte libre, mais clarté cantonnée aux extrêmes pour rester des
  // fonds (très clairs en thème clair, très sombres en thème sombre).
  const surfaceL = isDark ? between(10, 16) : between(97, 100);
  const bgL = isDark ? between(6, 11) : between(94, 98);
  const altL = isDark ? between(17, 23) : between(90, 95);

  const bg = hslToHex(hue(), between(12, 45), bgL);
  const surface = hslToHex(hue(), between(8, 35), surfaceL);
  const surfaceAlt = hslToHex(hue(), between(15, 50), altL);

  // Teintes pastel (thème clair) ou sourdes (thème sombre) servant de fond aux
  // pastilles colorées : elles accueillent du texte, donc elles comptent parmi
  // les fonds à vérifier.
  const softL = isDark ? between(14, 21) : between(88, 94);
  const accentSoft = hslToHex(hue(), between(30, 70), softL);
  const successSoft = hslToHex(hue(), between(30, 70), softL);
  const warningSoft = hslToHex(hue(), between(30, 70), softL);
  const dangerSoft = hslToHex(hue(), between(30, 70), softL);

  // Tout texte doit rester lisible sur n'importe lequel de ces fonds.
  const allBackgrounds = [bg, surface, surfaceAlt, accentSoft, successSoft, warningSoft, dangerSoft];
  const textDirection = isDark ? 'lighter' : 'darker';

  const textPrimary = pickReadable(hue(), between(20, 60), allBackgrounds, 7, textDirection);
  const textSecondary = pickReadable(hue(), between(25, 65), allBackgrounds, TEXT_RATIO, textDirection);
  const textMuted = pickReadable(hue(), between(20, 55), allBackgrounds, TEXT_RATIO, textDirection);

  // Les couleurs "pleines" portent du texte blanc : c'est donc face au blanc
  // qu'elles doivent tenir le contraste, pas face au fond.
  const onAccent = '#FFFFFF';
  const accent = pickReadable(hue(), between(55, 95), [onAccent], TEXT_RATIO, 'darker');
  const accentStrong = pickReadable(hue(), between(55, 95), [onAccent], 7, 'darker');
  const success = pickReadable(hue(), between(55, 95), [onAccent], GRAPHIC_RATIO, 'darker');
  const warning = pickReadable(hue(), between(55, 95), [onAccent], GRAPHIC_RATIO, 'darker');
  const danger = pickReadable(hue(), between(55, 95), [onAccent], GRAPHIC_RATIO, 'darker');

  // Déclinaisons "texte" des couleurs sémantiques, posées sur les fonds.
  const accentText = pickReadable(hue(), between(45, 90), allBackgrounds, TEXT_RATIO, textDirection);
  const successText = pickReadable(hue(), between(45, 90), allBackgrounds, TEXT_RATIO, textDirection);
  const warningText = pickReadable(hue(), between(45, 90), allBackgrounds, TEXT_RATIO, textDirection);
  const dangerText = pickReadable(hue(), between(45, 90), allBackgrounds, TEXT_RATIO, textDirection);

  // Éléments graphiques : seuil 3:1, il ne s'agit pas de texte.
  const neutralFill = pickReadable(hue(), between(35, 75), [bg, surface], GRAPHIC_RATIO, textDirection);
  const neutralTrack = hslToHex(hue(), between(20, 55), isDark ? between(22, 30) : between(85, 92));
  const border = hslToHex(hue(), between(20, 60), isDark ? between(26, 34) : between(78, 86));

  return {
    bg,
    surface,
    surfaceAlt,
    border,
    textPrimary,
    textSecondary,
    textMuted,
    accent,
    accentStrong,
    accentSoft,
    accentText,
    onAccent,
    success,
    successSoft,
    successText,
    warning,
    warningSoft,
    warningText,
    danger,
    dangerSoft,
    dangerText,
    neutralFill,
    neutralTrack,
  };
}

// Couleurs des tuiles de la mosaïque : du texte blanc est posé dessus, elles
// doivent donc tenir 4.5:1 avec le blanc, comme la palette fixe habituelle.
export function buildRainbowThemeColors(themeIds: string[], seed: number): Record<string, string> {
  // Décalage de graine pour ne pas rejouer la même suite que la palette.
  const rand = mulberry32(seed + 0x9e3779b9);
  const out: Record<string, string> = {};
  for (const id of themeIds) {
    const hue = Math.floor(rand() * 360);
    const sat = 55 + rand() * 40;
    out[id] = pickReadable(hue, sat, ['#FFFFFF'], 4.5, 'darker');
  }
  return out;
}

// Marches du podium : fond plein avec le rang écrit en blanc dessus.
export function buildRainbowMedals(seed: number): [string, string, string] {
  const rand = mulberry32(seed + 0x85ebca6b);
  const pick = () => pickReadable(Math.floor(rand() * 360), 55 + rand() * 40, ['#FFFFFF'], 4.5, 'darker');
  return [pick(), pick(), pick()];
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}
