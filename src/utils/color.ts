// Mélange deux couleurs hexadécimales (#RRGGBB) : `ratio` est le poids de
// `hexA` (0 = full hexB, 1 = full hexA). Sert à dériver automatiquement une
// teinte pastel ("soft") à partir d'une couleur d'accent et de la couleur de
// surface courante, sans avoir à vérifier une couleur à la main par thème.
export function mixHex(hexA: string, hexB: string, ratio: number): string {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  const r = Math.round(a.r * ratio + b.r * (1 - ratio));
  const g = Math.round(a.g * ratio + b.g * (1 - ratio));
  const bl = Math.round(a.b * ratio + b.b * (1 - ratio));
  return toHex(r, g, bl);
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const part = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}
