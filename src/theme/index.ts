import { mixHex } from '../utils/color';

export type ColorTokens = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  accent: string;
  accentStrong: string;
  accentSoft: string;
  // Couleur d'accent à utiliser comme TEXTE/ICÔNE directement sur un fond
  // neutre (surface, accentSoft) — distincte d'`accent`, qui reste réservée
  // aux fonds pleins avec du texte blanc dessus. En clair, `accent` seul
  // passe déjà le contraste AA sur texte, donc accentText = accentStrong
  // (identique à avant). En sombre, `accent`/`accentStrong` sont trop foncés
  // pour du texte sur fond sombre (contraste < 4.5:1 vérifié) : accentText y
  // est une version éclaircie de l'accent, réservée à cet usage.
  accentText: string;
  onAccent: string;

  success: string;
  successSoft: string;
  // Variantes de `success`/`danger` réservées au TEXTE (et petites icônes) sur
  // fond neutre — même logique que `accentText` : `success`/`danger` sont
  // calibrés pour des fonds pleins/bordures et ne passent pas 4.5:1 en tant
  // que texte sur `bg`/`surface` en mode clair (ex. success clair ≈ 3:1).
  // En sombre, `success`/`danger` passent déjà largement, donc identiques.
  successText: string;
  dangerText: string;
  warning: string;
  warningSoft: string;
  // `warning` lui-même ne passe 4.5:1 comme texte sur aucun fond neutre en
  // clair (≈3.2-3.6:1, voir Podium.tsx qui a le même souci pour ses fonds) ;
  // réservé à un usage graphique (icônes, bordures) où le seuil est 3:1.
  // `warningText` est la même teinte "or" que Podium.tsx utilise déjà comme
  // fond de la médaille d'or (vérifiée ≥4.5:1 sur fond clair), réutilisée ici
  // comme couleur de TEXTE.
  warningText: string;
  danger: string;
  dangerSoft: string;

  neutralFill: string;
  neutralTrack: string;
};

// Couleurs qui ne dépendent pas de l'accent choisi.
type BaseColors = Omit<
  ColorTokens,
  'accent' | 'accentStrong' | 'accentSoft' | 'accentText' | 'onAccent'
>;

const lightBase: BaseColors = {
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F3F8',
  border: 'rgba(19,18,24,0.08)',

  textPrimary: '#131218',
  textSecondary: '#6C6A78',
  // #9997A3 ne passait pas le contraste WCAG AA (2.87:1 sur blanc, minimum
  // requis 4.5:1) ; ce ton passe à 4.68:1.
  textMuted: '#757379',

  success: '#1FAA59',
  successSoft: '#E4F8EC',
  successText: '#0E7A3D',
  dangerText: '#C81E3A',
  warning: '#B8790E',
  warningSoft: '#FBF0DA',
  // Légèrement plus sombre que l'or du podium (#8F6A00) : il faut aussi tenir
  // 4.5:1 sur `warningSoft`, où cet or ne donnait que 4.39:1. Ici : 5.27:1 sur
  // surface, 4.67:1 sur warningSoft, 5.05:1 sur le fond.
  warningText: '#8A6600',
  danger: '#F0405C',
  dangerSoft: '#FDE8EC',

  neutralFill: '#8D8B99',
  neutralTrack: '#E7E6ED',
};

const darkBase: BaseColors = {
  bg: '#121016',
  surface: '#1C1A22',
  surfaceAlt: '#26242E',
  border: 'rgba(255,255,255,0.09)',

  textPrimary: '#F6F5F8',
  textSecondary: '#B7B5C0',
  textMuted: '#8A8894',

  success: '#34C77B',
  successSoft: '#173323',
  successText: '#34C77B',
  dangerText: '#FF5C7A',
  warning: '#E3A83D',
  warningSoft: '#3A2C12',
  warningText: '#E3A83D',
  danger: '#FF5C7A',
  dangerSoft: '#3A1620',

  neutralFill: '#9E9CAA',
  neutralTrack: '#322F3B',
};

export type AccentPreset = {
  id: string;
  label: string;
  // Même teinte utilisée en clair et en sombre : vérifié au contraste WCAG
  // (≥ 4.5:1 sur blanc et ≥ 3:1 sur les deux fonds), une teinte "éclaircie"
  // pour le sombre donnait un contraste insuffisant avec le texte blanc.
  accent: string;
  accentStrong: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'violet', label: 'Violet', accent: '#5B4FE9', accentStrong: '#4638C2' },
  { id: 'bleu', label: 'Bleu', accent: '#2E6BE6', accentStrong: '#1E4FB8' },
  { id: 'rose', label: 'Rose', accent: '#D6336C', accentStrong: '#A82753' },
  { id: 'orange', label: 'Orange', accent: '#C2410C', accentStrong: '#963309' },
];

export const DEFAULT_ACCENT_ID = ACCENT_PRESETS[0].id;

export function getAccentPreset(id: string): AccentPreset {
  return ACCENT_PRESETS.find((a) => a.id === id) ?? ACCENT_PRESETS[0];
}

export function isKnownAccentId(id: string): boolean {
  return ACCENT_PRESETS.some((a) => a.id === id);
}

export function buildColors(scheme: 'light' | 'dark', accentId: string): ColorTokens {
  const base = scheme === 'dark' ? darkBase : lightBase;
  const preset = getAccentPreset(accentId);
  const isDark = scheme === 'dark';

  // Teinte pastel dérivée automatiquement (accent mélangé à la surface),
  // plutôt qu'une valeur choisie à la main par accent et par mode. En sombre,
  // le mélange se fait avec `surfaceAlt` (plus claire que `surface`) et à un
  // ratio plus faible, pour rester un fond légèrement teinté plutôt qu'une
  // teinte sombre et saturée trop proche d'`accentStrong` (contraste texte
  // insuffisant, voir `accentText`).
  const accentSoft = isDark
    ? mixHex(preset.accent, base.surfaceAlt, 0.08)
    : mixHex(preset.accent, base.surface, 0.12);

  // Voir le commentaire sur `ColorTokens.accentText` : en clair, `accentStrong`
  // passe déjà largement le contraste AA sur fond neutre. En sombre, ni
  // `accent` ni `accentStrong` n'atteignent 4.5:1 sur `surface`/`accentSoft` —
  // on éclaircit l'accent vers le blanc pour cet usage précis.
  const accentText = isDark ? mixHex('#FFFFFF', preset.accent, 0.32) : preset.accentStrong;

  return {
    ...base,
    accent: preset.accent,
    accentStrong: preset.accentStrong,
    accentSoft,
    accentText,
    onAccent: '#FFFFFF',
  };
}

// Palettes fixes, indépendantes du contexte de thème — utilisées uniquement
// par l'ErrorBoundary, qui doit pouvoir s'afficher même si le système de thème
// lui-même est en cause. Il choisit entre les deux avec `useColorScheme()` de
// React Native, sans passer par le contexte de l'app : on garde l'indépendance
// vis-à-vis du code suspect, sans envoyer un écran blanc en pleine nuit.
export const lightColors: ColorTokens = buildColors('light', DEFAULT_ACCENT_ID);
export const darkColors: ColorTokens = buildColors('dark', DEFAULT_ACCENT_ID);

export const radii = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fonts = {
  hero: 56,
  title: 26,
  cardText: 23,
  body: 16,
  small: 13,
  tiny: 11,
} as const;
