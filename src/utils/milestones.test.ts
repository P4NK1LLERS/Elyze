import {
  CARTES_PAR_JALON,
  countedAnswers,
  milestonesFor,
  milestonesToShow,
  milestoneThreshold,
  passedMilestones,
} from './milestones';
import { Answers, Proposal } from '../types';

const TOTAL = 165;

function deck(size: number): Proposal[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `p${i}`,
    themeId: 'sante',
    candidateId: 'attal',
    text: `proposition ${i}`,
  }));
}

describe('paliers de progression', () => {
  it('place les seuils au quart, à la moitié et aux trois quarts du paquet', () => {
    expect(milestonesFor(TOTAL).map((s) => milestoneThreshold(TOTAL, s.ratio))).toEqual([42, 83, 124]);
  });

  it('n’annonce rien tant qu’aucun seuil n’est franchi', () => {
    expect(milestonesToShow(41, TOTAL, new Set()).announce).toBeNull();
  });

  it('annonce le palier au moment exact où il est franchi', () => {
    const { reached, announce } = milestonesToShow(42, TOTAL, new Set());
    expect(reached).toEqual([0]);
    expect(announce?.title).toBe('Premier aperçu disponible');
  });

  it('n’annonce qu’une fois le même palier', () => {
    const shown = new Set([0]);
    expect(milestonesToShow(60, TOTAL, shown).announce).toBeNull();
  });

  it('n’empile pas les popups quand plusieurs seuils tombent d’un coup', () => {
    // Cas d'un grand saut d'index : on marque les deux comme vus, mais on
    // n'affiche que le plus avancé.
    const { reached, announce } = milestonesToShow(90, TOTAL, new Set());
    expect(reached).toEqual([0, 1]);
    expect(announce?.title).toBe('Ton aperçu s’affine');
  });

  // C'est le bug du deuxième audit : l'écran est démonté dès qu'on le quitte,
  // donc l'ensemble des paliers vus repartait vide et le popup se rejouait à
  // chaque reprise de session.
  describe('reprise de session', () => {
    it('ne réannonce aucun palier déjà franchi au moment du remontage', () => {
      for (const index of [0, 20, 42, 60, 83, 100, 124, 150, 165]) {
        const rattrapage = new Set(passedMilestones(index, TOTAL));
        expect(milestonesToShow(index, TOTAL, rattrapage).announce).toBeNull();
      }
    });

    it('annonce quand même les paliers franchis APRÈS la reprise', () => {
      // Reprise à 100 : les deux premiers paliers sont derrière, le troisième
      // doit encore pouvoir se déclencher.
      const rattrapage = new Set(passedMilestones(100, TOTAL));
      expect(rattrapage).toEqual(new Set([0, 1]));
      expect(milestonesToShow(124, TOTAL, rattrapage).announce?.title).toBe(
        'Résultat presque prêt'
      );
    });
  });

  it('ne divise pas par zéro sur un paquet vide', () => {
    expect(passedMilestones(0, 0)).toEqual([]);
    expect(milestonesToShow(0, 0, new Set())).toEqual({ reached: [], announce: null });
  });

  // La barre de progression découpe ses segments sur ces mêmes ratios (voir
  // components/ProgressBar). Un palier à 0 ou à 1, ou deux paliers dans le
  // désordre, produirait un segment de largeur nulle ou négative — donc une
  // division par zéro et une barre cassée. L'invariant se vérifie ici, à la
  // source, plutôt que d'être supposé par le composant.
  it('expose des ratios strictement croissants et strictement entre 0 et 1', () => {
    const ratios = milestonesFor(TOTAL).map((step) => step.ratio);

    expect(ratios.length).toBeGreaterThan(0);
    for (const ratio of ratios) {
      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThan(1);
    }
    expect([...ratios].sort((a, b) => a - b)).toEqual(ratios);
    expect(new Set(ratios).size).toBe(ratios.length);
  });

  it('découpe la barre en un segment de plus qu’il n’y a de paliers', () => {
    const bounds = [0, ...milestonesFor(TOTAL).map((s) => s.ratio), 1];
    const spans = bounds.slice(0, -1).map((start, i) => bounds[i + 1] - start);

    expect(spans).toHaveLength(milestonesFor(TOTAL).length + 1);
    spans.forEach((span) => expect(span).toBeGreaterThan(0));
    expect(spans.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  // Le repère visuel doit tomber pile là où l'annonce se déclenche : un
  // segment se remplit exactement quand son palier est franchi.
  it('remplit chaque segment au moment exact où son palier est atteint', () => {
    const bounds = [0, ...milestonesFor(TOTAL).map((s) => s.ratio), 1];

    milestonesFor(TOTAL).forEach((step, i) => {
      const seuil = milestoneThreshold(TOTAL, step.ratio);
      const start = bounds[i];
      const span = bounds[i + 1] - start;
      const rempli = (index: number) =>
        Math.min(1, Math.max(0, (index / TOTAL - start) / span));

      expect(rempli(seuil - 1)).toBeLessThan(1);
      expect(rempli(seuil)).toBe(1);
    });
  });
});

// Le nombre de paliers suit la longueur du paquet : un paquet filtré par
// thèmes descend jusqu'à 22 cartes, où trois annonces se marchaient dessus.
describe('nombre de paliers selon la longueur du paquet', () => {
  // Les tailles réellement possibles sont des multiples de onze (onze
  // candidats à quota égal — voir utils/deck.ts).
  it.each([
    [11, 0],
    [22, 1],
    [44, 1],
    [77, 1],
    [88, 2],
    [110, 2],
    [121, 3],
    [165, 3],
  ])('un paquet de %i cartes a %i palier(s)', (total, attendu) => {
    expect(milestonesFor(total)).toHaveLength(attendu);
  });

  it('retrouve exactement 25 / 50 / 75 % sur le paquet complet', () => {
    expect(milestonesFor(165).map((s) => s.ratio)).toEqual([0.25, 0.5, 0.75]);
  });

  it('place le palier unique au milieu, et les deux paliers aux tiers', () => {
    expect(milestonesFor(44).map((s) => s.ratio)).toEqual([0.5]);
    expect(milestonesFor(88).map((s) => s.ratio)).toEqual([1 / 3, 2 / 3]);
  });

  it('garde des ratios croissants et strictement entre 0 et 1, quelle que soit la taille', () => {
    for (let total = 0; total <= 200; total++) {
      const ratios = milestonesFor(total).map((s) => s.ratio);
      for (const r of ratios) {
        expect(r).toBeGreaterThan(0);
        expect(r).toBeLessThan(1);
      }
      expect([...ratios].sort((a, b) => a - b)).toEqual(ratios);
    }
  });

  // C'est l'invariant qui justifie la constante : sur toute taille de paquet,
  // deux annonces restent séparées d'au moins une vingtaine de cartes.
  it('espace toujours deux annonces d’au moins vingt cartes', () => {
    for (let total = 0; total <= 200; total++) {
      const seuils = milestonesFor(total).map((s) => milestoneThreshold(total, s.ratio));
      for (let i = 1; i < seuils.length; i++) {
        expect(seuils[i] - seuils[i - 1]).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it('ne dépasse jamais trois paliers, même sur un paquet démesuré', () => {
    expect(milestonesFor(10 * CARTES_PAR_JALON)).toHaveLength(3);
  });

  // Un paquet court n'annonce rien : le rattrapage au montage ne doit pas
  // pour autant se croire en retard.
  it('n’annonce rien sur un paquet trop court', () => {
    expect(passedMilestones(10, 11)).toEqual([]);
    expect(milestonesToShow(10, 11, new Set()).announce).toBeNull();
  });
});

describe('countedAnswers', () => {
  const proposals = deck(10);

  it('ne compte que les réponses qui pèsent dans le score', () => {
    const answers: Answers = {
      p0: 'like',
      p1: 'superlike',
      p2: 'nope',
      p3: 'skip', // « pas d'avis » : exclu du score, donc pas compté
    };
    expect(countedAnswers(proposals, 10, answers)).toBe(3);
  });

  it('ignore les cartes pas encore vues', () => {
    const answers: Answers = { p0: 'like', p8: 'like' };
    expect(countedAnswers(proposals, 2, answers)).toBe(1);
  });

  it('ne déborde pas si l’index dépasse la taille du paquet', () => {
    expect(countedAnswers(proposals, 999, { p0: 'like' })).toBe(1);
  });
});
