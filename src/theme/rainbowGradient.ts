import { mixHex } from '../utils/color';
import { contrastRatio } from './rainbow';

// Dégradé arc-en-ciel animé : la palette, et les calculs qui la rendent sûre.
//
// Ce fichier ne dessine rien. Il produit les suites de couleurs et les
// réglages, pour que ces décisions soient vérifiables par un test plutôt que
// posées à l'œil dans une feuille de style.
//
// POURQUOI UNE ROTATION DE TEINTE, ET NON SIX COULEURS CHOISIES. Un
// « arc-en-ciel » fait de rouge, orange, jaune, vert, bleu et violet pris tels
// quels jure : ces couleurs n'ont ni la même saturation ni la même clarté, et
// le dégradé bat au passage du jaune. En parcourant le cercle chromatique à
// saturation et clarté CONSTANTES, on obtient un balayage régulier, sans point
// dur. C'est ce qui donne l'impression de fluidité, autant que l'animation.

// Nombre de teintes du balayage. Douze donnent une transition continue sans
// allonger inutilement la liste passée au moteur de rendu.
const STOPS = 12;

export type Scheme = 'light' | 'dark';

function hsl(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) =>
    lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const part = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${part(f(0))}${part(f(8))}${part(f(4))}`.toUpperCase();
}

// Un tour complet du cercle, PREMIÈRE COULEUR RÉPÉTÉE À LA FIN.
//
// Sans cette répétition, la boucle de l'animation se verrait : le dégradé
// reviendrait brutalement du violet au rouge à chaque tour. Ici les deux
// extrémités sont identiques, donc la jonction est invisible.
function sweepAt(saturation: number, lightness: number): string[] {
  const stops: string[] = [];
  for (let i = 0; i < STOPS; i++) {
    stops.push(hsl((360 / STOPS) * i, saturation, lightness));
  }
  stops.push(stops[0]);
  return stops;
}

const SATURATION = 78;

// --- Fond de la carte -------------------------------------------------------
//
// La carte porte le texte de la proposition. Si le dégradé s'y affichait pur,
// la lisibilité dépendrait de la teinte qui passe à cet instant, c'est-à-dire
// du hasard de l'animation. Le dégradé est donc MÉLANGÉ à la surface, et le
// taux est le plus élevé qui garde TOUTES les couleurs de texte de la carte
// au-dessus du seuil — calculé, jamais choisi.
//
// La clarté du balayage reste du côté du fond sur lequel il est posé : clair
// en thème clair, sombre en thème sombre. Le dégradé colore alors sans
// renverser le rapport entre le texte et son support.
const CARD_LIGHTNESS: Record<Scheme, number> = { light: 62, dark: 42 };

export function cardBaseSweep(scheme: Scheme): string[] {
  return sweepAt(SATURATION, CARD_LIGHTNESS[scheme]);
}

// Cherche le mélange le plus coloré qui laisse chaque texte lisible sur
// chaque teinte. Pas de 1 %, du plus coloré au plus discret.
export function strongestBlend(
  textColors: string[],
  surface: string,
  scheme: Scheme,
  minRatio: number
): number {
  const sweep = cardBaseSweep(scheme);
  for (let blend = 100; blend >= 0; blend--) {
    const ok = sweep.every((color) => {
      const painted = mixHex(color, surface, blend / 100);
      return textColors.every((text) => contrastRatio(text, painted) >= minRatio);
    });
    if (ok) return blend / 100;
  }
  return 0;
}

// Valeur figée, vérifiée par le test face à `strongestBlend`.
// 11 % dans les deux thèmes. C'est peu, et ce n'est pas un choix esthétique :
// c'est le plafond. Au-delà, `textSecondary` puis `accentText` passent sous
// 4.5:1 sur les teintes claires du balayage. Le dégradé est donc discret sur
// la FACE de la carte — c'est son cadre, qui ne porte aucun texte, qui montre
// les couleurs à pleine force (voir `cardFrameSweep`).
export const CARD_BLEND: Record<Scheme, number> = { light: 0.11, dark: 0.11 };

// Le cadre de la carte ne porte aucun texte : le dégradé y est pur, à la
// clarté du balayage de base. C'est lui qui rend le mode visible.
export function cardFrameSweep(scheme: Scheme): string[] {
  return cardBaseSweep(scheme);
}

// Ce qui est réellement peint sur la carte : le test mesure ces couleurs-là,
// pas une intention.
export function cardSweep(scheme: Scheme, surface: string): string[] {
  return cardBaseSweep(scheme).map((color) => mixHex(color, surface, CARD_BLEND[scheme]));
}

// --- Barre de progression ---------------------------------------------------
//
// Elle ne porte aucun texte : le dégradé y est pur. La contrainte n'est donc
// pas la lisibilité mais le DÉTACHEMENT de la piste, au seuil de 3:1 des
// éléments d'interface.
//
// Les teintes de la carte ne peuvent pas servir ici : elles sont choisies pour
// s'approcher de la surface, quand celles-ci doivent s'en éloigner. En thème
// clair la piste est presque blanche, il faut donc des couleurs franchement
// plus sombres ; en sombre, l'inverse.
const PROGRESS_LIGHTNESS: Record<Scheme, number> = { light: 30, dark: 67 };

export function progressSweep(scheme: Scheme): string[] {
  return sweepAt(SATURATION, PROGRESS_LIGHTNESS[scheme]);
}

// Cherche la clarté qui détache toutes les teintes de la piste, en partant de
// la plus proche du milieu — la plus vive — et en s'en écartant seulement
// autant qu'il le faut.
export function lightnessForTrack(track: string, scheme: Scheme, minRatio: number): number {
  const sens = scheme === 'light' ? -1 : 1;
  for (let step = 0; step <= 50; step++) {
    const lightness = 50 + sens * step;
    const ok = sweepAt(SATURATION, lightness).every(
      (color) => contrastRatio(color, track) >= minRatio
    );
    if (ok) return lightness;
  }
  return scheme === 'light' ? 0 : 100;
}
