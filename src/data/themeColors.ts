import { mixHex } from '../utils/color';

// Une couleur par thème pour la mosaïque de l'onglet « Propositions » — fixe,
// indépendante de l'accent choisi dans les réglages (le but est ici la variété
// colorée, pas la cohérence avec un seul accent).
//
// Trois contraintes façonnent ces valeurs, dans cet ordre :
//
//  1. LE TEXTE BLANC DOIT TENIR. La clarté n'est donc jamais choisie mais
//     CALCULÉE : pour chaque teinte on descend jusqu'à atteindre le contraste
//     visé. Mesuré ici de 4.60:1 à 5.76:1, là où le seuil AA est 4.5:1.
//
//     C'est la contrainte qui gouverne tout le reste, et elle est plus dure
//     qu'il n'y paraît. Une palette pastel demandée pour son côté clair
//     (clarté moyenne 73 %) ne peut PAS être reprise telle quelle : le blanc
//     n'y atteint que 1.39:1 à 3.33:1. La ramener au seuil la fait retomber à
//     43 % de clarté, où seule sa saturation subsiste. Un aplat qui porte du
//     texte blanc ne peut pas être pastel — les deux exigences s'excluent.
//
//  2. LES TEINTES DOIVENT RESTER DISTINCTES. Dériver mécaniquement une
//     palette existante rendait retraites/solidarités et santé/sécurité
//     rigoureusement identiques. Les quinze teintes sont donc réparties à la
//     main sur tout le cercle chromatique.
//
//  3. LES VOISINES DE GRILLE D'ABORD. La mosaïque a deux colonnes, et deux
//     cibles de contraste sont alternées EN DAMIER — alterner sur le seul
//     rang ne séparait que les voisines horizontales, jamais celles l'une
//     sous l'autre. Distance minimale entre deux tuiles qui se touchent : 57
//     sur l'échelle RVB.
export const THEME_COLORS: Record<string, string> = {
  economie: '#6F61E7',
  emploi: '#855F14',
  retraites: '#BF1D83',
  solidarites: '#DF2A48',

  sante: '#DC3021',
  education: '#127638',
  numerique: '#803EE2',

  logement: '#B731E0',
  transports: '#476BE3',
  environnement: '#267612',
  agriculture: '#497111',

  securite: '#2074D5',
  immigration: '#CE1FBD',
  defense: '#15708A',
  institutions: '#AF471A',
};

const FALLBACK_COLOR = '#4338CA';

export function getThemeColor(themeId: string): string {
  return THEME_COLORS[themeId] ?? FALLBACK_COLOR;
}

// Version douce d'une couleur de thème, pour les pastilles.
//
// Les valeurs ci-dessus sont des aplats saturés pensés pour porter du texte
// blanc : alignées à quinze dans une même liste, elles saturent l'écran. Ici
// on garde la teinte comme repère mais on la pose en fond très pâle, avec le
// texte dans la même teinte assombrie. Le dosage a été éprouvé sur les 360
// teintes possibles, et pas seulement sur les quinze de la palette fixe : le
// mode arc-en-ciel tire des couleurs au hasard, et les bleus très sombres
// tombaient à 4.34:1 avec un premier réglage. Pire cas actuel : 5.30:1 en
// thème clair, 5.37:1 en sombre.
export function themeChipColors(
  baseColor: string,
  surface: string,
  isDark: boolean
): { background: string; text: string } {
  return isDark
    ? {
        background: mixHex(baseColor, surface, 0.1),
        text: mixHex('#FFFFFF', baseColor, 0.5),
      }
    : {
        background: mixHex(baseColor, surface, 0.08),
        text: mixHex('#000000', baseColor, 0.1),
      };
}
