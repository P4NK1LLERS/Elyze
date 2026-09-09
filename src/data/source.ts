import { Linking } from 'react-native';
import { Proposal } from '../types';

// Poligraph recense les mesures des candidats et les rattache à leur document
// d'origine. La licence des données (AGPL-3.0) impose de citer la source :
// cette mention apparaît sur l'accueil, l'écran de résultat et "Comment ça
// marche", et chaque carte renvoie à la fiche de sa propre mesure.
export const POLIGRAPH_NAME = 'Poligraph';
export const POLIGRAPH_SOURCE_URL = 'https://poligraph.fr/elections/presidentielle-2027';
export const POLIGRAPH_LICENCE = 'AGPL-3.0, réutilisation libre avec mention de la source';

// `Linking.openURL` rejette si aucune application ne sait ouvrir le lien
// (appareil sans navigateur, profil restreint...). Non attrapé, ce rejet
// remonte en "unhandled promise rejection" ; ici on absorbe l'échec, l'appui
// ne fait simplement rien plutôt que de faire du bruit.
export function openUrl(url: string): void {
  Linking.openURL(url).catch(() => {});
}

export function openSourceUrl(): void {
  openUrl(POLIGRAPH_SOURCE_URL);
}

// Lien le plus précis disponible pour une proposition : sa fiche Poligraph si
// on l'a, sinon le document d'origine, sinon le comparateur complet.
export function proposalSourceUrl(proposal: Proposal): string {
  return proposal.detailUrl ?? proposal.sourceUrl ?? POLIGRAPH_SOURCE_URL;
}

// Ligne de provenance affichée sous la proposition : d'où vient la mesure, et
// à quelle date elle a été publiée. L'app ne reformule pas les propositions,
// elle les cite : ce bloc remplace l'ancien texte d'explication rédigé.
export function proposalProvenance(proposal: Proposal): string {
  const parts: string[] = [];
  if (proposal.sourceType) parts.push(proposal.sourceType);
  if (proposal.sourceDate) parts.push(proposal.sourceDate);
  if (parts.length === 0) return POLIGRAPH_NAME;
  return parts.join(' · ');
}

// Qualification de l'engagement, telle que donnée par la source.
//
// Seul le cas "chiffré" est affiché. La source distingue en réalité trois
// états — chiffré, non chiffré, et non qualifié (51 propositions sur 165, où
// Poligraph ne s'est pas prononcé) — mais l'écran n'en montrait que deux :
// l'absence de pastille se lisait alors comme "non chiffré", ce qui était faux
// une fois sur trois. En n'affichant que l'affirmation positive, ce qui est
// écrit est toujours vrai.
export function precisionLabel(proposal: Proposal): string | null {
  return proposal.precision === 'chiffree' ? 'Objectif chiffré' : null;
}
