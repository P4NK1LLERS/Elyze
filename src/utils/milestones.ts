import { Answers, Proposal } from '../types';

// Paliers de progression auxquels on prévient que le premier aperçu (onglet
// Classement) devient lisible, puis qu'il s'affine — pour signaler l'info
// plutôt que de compter sur le petit onglet du bas pour être découvert seul.
//
// Cette logique vit ici, hors de l'écran, pour deux raisons. D'abord elle est
// testable telle quelle. Ensuite elle avait un bug que seule une simulation
// rendait visible : l'ensemble des paliers déjà annoncés était tenu dans un
// `useRef`, qui repart vide à chaque montage de l'écran — or l'écran est
// démonté dès qu'on le quitte (retour à l'accueil, passage par la révision,
// relance de l'app). Au remontage, tous les seuils franchis semblaient
// nouveaux et le popup se rejouait. D'où `passedMilestones`, qui permet à
// l'écran de rattraper silencieusement ce qui est déjà derrière lui.

export type Milestone = {
  ratio: number;
  title: string;
  message: string;
};

// Messages, du plus tôt au plus tardif. Ils n'ont PAS de position : c'est
// `milestonesFor` qui la calcule, parce qu'elle dépend de la longueur du
// paquet.
const MILESTONE_MESSAGES: { title: string; message: string }[] = [
  {
    title: 'Premier aperçu disponible',
    message:
      'Tu as répondu à assez de propositions pour voir une première tendance. Ton classement provisoire est visible dans l’onglet Classement.',
  },
  {
    title: 'Ton aperçu s’affine',
    message: 'À mi-chemin, ton classement provisoire devient plus fiable.',
  },
  {
    title: 'Résultat presque prêt',
    message:
      'Ton classement est presque définitif. Termine le questionnaire pour le résultat complet.',
  },
];

// COMBIEN de paliers, et non plus où : le nombre suit la longueur du paquet.
//
// Les trois paliers étaient posés à 25 / 50 / 75 % quelle que soit la partie.
// Sur le paquet complet (165 cartes) cela fait une annonce toutes les
// quarante et une cartes, ce qui est le rythme voulu. Mais un paquet filtré
// par thèmes est bien plus court — le tirage descend jusqu'à 22 ou 33 cartes
// (voir utils/deck.ts) — et le même pourcentage y produisait trois popups en
// moins de trois minutes de jeu, pour un classement qui de toute façon
// n'avait pas le temps de beaucoup bouger entre deux.
//
// On raisonne donc en CARTES et non en pourcentage : un palier par tranche
// d'environ quarante cartes, au plus trois. Les positions restent réparties
// régulièrement, ce qui redonne exactement 25 / 50 / 75 % sur le paquet
// complet — l'ancien comportement est le cas particulier du nouveau.
export const CARTES_PAR_JALON = 40;

// En dessous, aucun palier : une partie de moins de vingt cartes se finit
// avant qu'un classement provisoire ait un sens à annoncer.
export const MIN_TOTAL_POUR_JALON = 20;

export function milestonesFor(total: number): Milestone[] {
  if (total < MIN_TOTAL_POUR_JALON) return [];

  const combien = Math.min(
    MILESTONE_MESSAGES.length,
    Math.max(1, Math.floor(total / CARTES_PAR_JALON))
  );

  // Réparties régulièrement : `combien` paliers découpent la barre en
  // `combien + 1` segments égaux.
  return MILESTONE_MESSAGES.slice(0, combien).map((message, i) => ({
    ...message,
    ratio: (i + 1) / (combien + 1),
  }));
}

// En dessous de ce nombre de réponses réellement comptabilisées (« j’adhère »
// ou « pas pour moi » ; « pas d’avis » ne compte pas), on ne notifie aucun
// palier — trop peu de signal pour qu'un classement veuille dire quelque chose.
export const MIN_COUNTED_FOR_PREVIEW = 4;

// Rang de carte à partir duquel un palier est considéré comme franchi.
export function milestoneThreshold(total: number, ratio: number): number {
  return Math.ceil(total * ratio);
}

// Paliers déjà derrière soi à cet avancement. Appelé une seule fois, au
// montage de l'écran : ce qui est déjà franchi est marqué comme vu sans rien
// afficher, pour qu'une reprise de session ne réannonce pas un palier passé.
export function passedMilestones(currentIndex: number, total: number): number[] {
  if (total <= 0) return [];
  return milestonesFor(total)
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => currentIndex >= milestoneThreshold(total, step.ratio))
    .map(({ index }) => index);
}

// Paliers franchis depuis la dernière vérification, et celui qu'il faut
// annoncer : le plus avancé des nouveaux, puisqu'empiler trois popups d'un
// coup n'aurait aucun sens.
export function milestonesToShow(
  currentIndex: number,
  total: number,
  alreadyShown: ReadonlySet<number>
): { reached: number[]; announce: Milestone | null } {
  if (total <= 0) return { reached: [], announce: null };

  const reached = passedMilestones(currentIndex, total).filter((i) => !alreadyShown.has(i));
  const last = reached[reached.length - 1];

  return {
    reached,
    announce: last === undefined ? null : milestonesFor(total)[last],
  };
}

// Réponses réellement comptabilisées parmi les cartes déjà vues — celles qui
// pèsent dans le score. Un paquet entièrement laissé en « pas d'avis » ne doit
// pas déclencher d'annonce de classement : il n'y aurait rien à classer.
export function countedAnswers(
  proposals: Proposal[],
  currentIndex: number,
  answers: Answers
): number {
  let counted = 0;
  for (let i = 0; i < Math.min(currentIndex, proposals.length); i++) {
    const answer = answers[proposals[i].id];
    if (answer === 'like' || answer === 'superlike' || answer === 'nope') counted++;
  }
  return counted;
}
