import { Proposal } from '../types';
import { shuffle } from './shuffle';

// Tirage du paquet d'une session dans le vivier embarqué.
//
// L'app embarque environ deux fois plus de propositions qu'une partie n'en
// montre, pour qu'un deuxième passage ne repose pas sur les mêmes cartes.
// Le tirage doit respecter deux contraintes, et la première n'est pas
// négociable :
//
//  1. LE MÊME NOMBRE POUR CHAQUE CANDIDAT. Tout le calcul du score suppose
//     que chacun pèse pareil (voir utils/scoring.ts). Un candidat qui aurait
//     18 cartes contre 12 à un autre serait mécaniquement avantagé, et aucun
//     lissage ne rattraperait ça.
//
//  2. UNE RÉPARTITION PAR THÈME. Prendre au hasard dans le vivier d'un
//     candidat donnerait, une fois sur deux, cinq cartes sur l'économie et
//     aucune sur la santé — alors que la vue « par thème » de l'écran de
//     résultat suppose de croiser plusieurs sujets. On tourne donc sur ses
//     thèmes, en en prenant une à chaque tour.
//
// Le nombre par candidat est ramené au plus petit vivier disponible : si un
// candidat n'a que 12 propositions dans les thèmes choisis, tout le monde en
// aura 12. Mieux vaut un paquet plus court qu'un paquet biaisé.

// Nombre de propositions tirées par candidat. Doit rester aligné sur
// QUOTA_PAR_CANDIDAT de scripts/generate-data.js, qui dimensionne le vivier
// en conséquence.
export const QUOTA_PAR_CANDIDAT = 15;

type ShuffleFn = <T>(items: T[]) => T[];

export function candidatesQuota(pool: Proposal[], quota: number): number {
  const parCandidat = new Map<string, number>();
  for (const p of pool) parCandidat.set(p.candidateId, (parCandidat.get(p.candidateId) ?? 0) + 1);
  if (parCandidat.size === 0) return 0;
  return Math.min(quota, ...parCandidat.values());
}

export function buildDeck(
  pool: Proposal[],
  quota: number,
  melange: ShuffleFn = shuffle
): Proposal[] {
  const effectif = candidatesQuota(pool, quota);
  if (effectif === 0) return [];

  const parCandidat = new Map<string, Proposal[]>();
  for (const p of pool) {
    const liste = parCandidat.get(p.candidateId);
    if (liste) liste.push(p);
    else parCandidat.set(p.candidateId, [p]);
  }

  const choisies: Proposal[] = [];

  for (const propositions of parCandidat.values()) {
    // Regroupement par thème, chaque groupe mélangé : c'est ce qui fait
    // qu'une même proposition ne revient pas systématiquement d'une partie
    // à l'autre.
    const parTheme = new Map<string, Proposal[]>();
    for (const p of melange(propositions)) {
      const liste = parTheme.get(p.themeId);
      if (liste) liste.push(p);
      else parTheme.set(p.themeId, [p]);
    }

    // L'ordre des thèmes change aussi : sans cela, les premiers thèmes de la
    // liste seraient toujours servis en premier quand le quota ne permet pas
    // de faire un tour complet.
    const themes = melange([...parTheme.keys()]);

    const prises: Proposal[] = [];
    let tour = 0;
    while (prises.length < effectif) {
      let ajout = 0;
      for (const themeId of themes) {
        const liste = parTheme.get(themeId)!;
        if (liste.length <= tour) continue;
        prises.push(liste[tour]);
        ajout++;
        if (prises.length >= effectif) break;
      }
      if (ajout === 0) break; // vivier épuisé
      tour++;
    }

    choisies.push(...prises);
  }

  // Mélange final : sinon les cartes sortiraient candidat par candidat, ce
  // qui laisserait deviner qui porte quoi.
  return melange(choisies);
}
