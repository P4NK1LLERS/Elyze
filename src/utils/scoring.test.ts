import { Answers, Candidate, CandidateResult, Proposal, ThemeTag } from '../types';
import {
  computeResults,
  computeThemeAgreement,
  matchConfidenceLabel,
  pickTopMatch,
  topMatches,
} from './scoring';

const candidateA: Candidate = { id: 'a', name: 'Candidat A', initials: 'A', party: 'Parti A' };
const candidateB: Candidate = { id: 'b', name: 'Candidat B', initials: 'B', party: 'Parti B' };
const candidateC: Candidate = { id: 'c', name: 'Candidat C', initials: 'C', party: 'Parti C' };
const CANDIDATES = [candidateA, candidateB, candidateC];

const themeEco: ThemeTag = { id: 'eco', label: 'Économie', icon: '💶', categoryId: 'x' };
const themeSoc: ThemeTag = { id: 'soc', label: 'Social', icon: '🤝', categoryId: 'x' };
const THEMES = [themeEco, themeSoc];

function proposal(id: string, candidateId: string, themeId: string): Proposal {
  return { id, candidateId, themeId, text: `Texte ${id}` };
}

describe('computeResults', () => {
  it("calcule le pourcentage brut d'agrément par candidat", () => {
    const proposals = [
      proposal('p1', 'a', 'eco'),
      proposal('p2', 'a', 'eco'),
      proposal('p3', 'a', 'eco'),
    ];
    const answers: Answers = { p1: 'like', p2: 'like', p3: 'nope' };

    const results = computeResults(answers, proposals, CANDIDATES);
    const a = results.find((r) => r.candidate.id === 'a');

    expect(a?.agree).toBe(2);
    expect(a?.total).toBe(3);
    // 2 « j'adhère » et 1 « pas pour moi » : taux 2/3, sur 3 réponses.
    expect(a?.pct).toBe(Math.round(((2 / 3) * 3 + 1) / (3 + 2) * 100)); // 60
  });

  it('exclut les propositions "pas d’avis" du score', () => {
    const proposals = [proposal('p1', 'a', 'eco'), proposal('p2', 'a', 'eco')];
    const answers: Answers = { p1: 'like', p2: 'skip' };

    const results = computeResults(answers, proposals, CANDIDATES);
    const a = results.find((r) => r.candidate.id === 'a');

    expect(a?.total).toBe(1);
    expect(a?.agree).toBe(1);
    // Le score tient compte du nombre de réponses : jamais 100 % sur peu.
    expect(a?.pct).toBeLessThan(100);
  });

  it('exclut les propositions jamais répondues', () => {
    const proposals = [proposal('p1', 'a', 'eco'), proposal('p2', 'a', 'eco')];
    const answers: Answers = { p1: 'like' }; // p2 absent des réponses

    const results = computeResults(answers, proposals, CANDIDATES);
    const a = results.find((r) => r.candidate.id === 'a');

    expect(a?.total).toBe(1);
  });

  it("n'inclut pas les candidats sans aucune proposition répondue", () => {
    const proposals = [proposal('p1', 'a', 'eco')];
    const answers: Answers = { p1: 'like' };

    const results = computeResults(answers, proposals, CANDIDATES);

    expect(results.find((r) => r.candidate.id === 'b')).toBeUndefined();
    expect(results.find((r) => r.candidate.id === 'c')).toBeUndefined();
  });

  it('classe par score ajusté (lissage) et non par pourcentage brut seul', () => {
    // "small" : 1 proposition, 100 % d'accord — score brut parfait mais peu fiable.
    const smallProposals = [proposal('s1', 'small', 'eco')];
    // "big" : 10 propositions, 90 % d'accord — un peu moins parfait, bien plus fiable.
    const bigProposals = Array.from({ length: 10 }, (_, i) => proposal(`b${i}`, 'big', 'eco'));

    const proposals = [...smallProposals, ...bigProposals];
    const answers: Answers = { s1: 'like' };
    bigProposals.forEach((p, i) => {
      answers[p.id] = i < 9 ? 'like' : 'nope'; // 9 like, 1 nope => 90 %
    });

    const candidates: Candidate[] = [
      { id: 'small', name: 'Small', initials: 'S', party: 'P' },
      { id: 'big', name: 'Big', initials: 'B', party: 'P' },
    ];

    const results = computeResults(answers, proposals, candidates);

    // Le score brut de "small" (100%) est supérieur à celui de "big" (90%)...
    const small = results.find((r) => r.candidate.id === 'small')!;
    const big = results.find((r) => r.candidate.id === 'big')!;
    // « small » a un taux d'accord de 100 % mais sur une seule réponse ;
    // « big » un taux de 90 % sur dix. Le score affiché reflète les deux.
    expect(small.pct).toBe(67); // (1 x 1 + 1) / (1 + 2)
    expect(big.pct).toBe(83); // (0.9 x 10 + 1) / (10 + 2)

    // ...mais "big" doit être classé EN PREMIER grâce au lissage, car son
    // score repose sur beaucoup plus de propositions répondues.
    expect(results[0].candidate.id).toBe('big');
    expect(results[1].candidate.id).toBe('small');
    expect(results[0].score).toBeCloseTo(((0.9 * 10 + 1) / (10 + 2)) * 100, 5);
    expect(results[1].score).toBeCloseTo(((1 * 1 + 1) / (1 + 2)) * 100, 5);
  });

  it('compte un "superlike" pour plusieurs réponses normales', () => {
    // Candidat "a" : 1 "like" normal et 1 "nope" => 50% à poids égal.
    const proposals = [proposal('e1', 'a', 'eco'), proposal('s1', 'a', 'soc')];
    const normalAnswers: Answers = { e1: 'like', s1: 'nope' };

    const normal = computeResults(normalAnswers, proposals, CANDIDATES);
    const aNormal = normal.find((r) => r.candidate.id === 'a')!;
    expect(aNormal.pct).toBe(50); // taux 1/2 sur 2 réponses : reste 50

    // En remplaçant ce "like" par un "superlike" (poids 3), il pèse comme
    // 3 "like" contre 1 "nope" => le pourcentage brut doit remonter.
    const superlikeAnswers: Answers = { e1: 'superlike', s1: 'nope' };
    const superliked = computeResults(superlikeAnswers, proposals, CANDIDATES);
    const aSuperliked = superliked.find((r) => r.candidate.id === 'a')!;
    expect(aSuperliked.agree).toBe(3);
    expect(aSuperliked.total).toBe(4);
    // Taux d'accord 3/4, mais toujours sur 2 réponses seulement.
    expect(aSuperliked.pct).toBe(Math.round(((0.75 * 2 + 1) / (2 + 2)) * 100)); // 63

    // Le super like doit bien remonter le score par rapport au like simple.
    expect(aSuperliked.score).toBeGreaterThan(aNormal.score);
  });

  // Le défaut historique : le poids du super like était ajouté au nombre de
  // réponses servant à mesurer la fiabilité, si bien que cinq super likes
  // affichaient exactement le même score que quinze « j'adhère ».
  it('ne compte pas un super like comme trois réponses de plus', () => {
    const cinqSuper = Array.from({ length: 5 }, (_, i) => proposal(`s${i}`, 'a', 'eco'));
    const quinzeLikes = Array.from({ length: 15 }, (_, i) => proposal(`l${i}`, 'b', 'eco'));

    const answers: Answers = {};
    cinqSuper.forEach((p) => (answers[p.id] = 'superlike'));
    quinzeLikes.forEach((p) => (answers[p.id] = 'like'));

    const results = computeResults(answers, [...cinqSuper, ...quinzeLikes], CANDIDATES);
    const a = results.find((r) => r.candidate.id === 'a')!;
    const b = results.find((r) => r.candidate.id === 'b')!;

    // Les deux ont un taux d'accord de 100 %, mais pas la même assise.
    expect(a.answered).toBe(5);
    expect(b.answered).toBe(15);
    expect(b.score).toBeGreaterThan(a.score);
    expect(results[0].candidate.id).toBe('b');
  });

  // L'autre défaut : trois candidats affichaient 100 % puis étaient classés
  // dans un ordre que rien à l'écran n'expliquait. Le nombre affiché doit
  // désormais être celui qui classe.
  it('affiche le nombre qui décide du classement', () => {
    const build = (id: string, n: number) =>
      Array.from({ length: n }, (_, i) => proposal(`${id}${i}`, id, 'eco'));
    const props = [...build('a', 15), ...build('b', 13)];
    const answers: Answers = {};
    props.forEach((p) => (answers[p.id] = 'like'));

    const results = computeResults(answers, props, CANDIDATES);

    // Tous deux d'accord à 100 %, donc plus d'égalité trompeuse à l'écran.
    expect(results[0].pct).toBeGreaterThan(results[1].pct);
    // Et l'ordre suit exactement ce que l'écran montre.
    expect(results.map((r) => r.pct)).toEqual([...results.map((r) => r.pct)].sort((x, y) => y - x));
  });

  it('compte les propositions réellement répondues sans les pondérer', () => {
    // `total` est pondéré (un superlike y vaut 3) : c'est le dénominateur du
    // calcul, pas un décompte affichable. `answered` reste le nombre réel de
    // propositions répondues — c'est lui qu'affiche l'écran de classement.
    const proposals = [
      proposal('p1', 'a', 'eco'),
      proposal('p2', 'a', 'eco'),
      proposal('p3', 'a', 'soc'),
    ];
    const answers: Answers = { p1: 'superlike', p2: 'nope', p3: 'skip' };

    const a = computeResults(answers, proposals, CANDIDATES).find((r) => r.candidate.id === 'a')!;

    expect(a.total).toBe(4); // 3 (superlike) + 1 (nope)
    expect(a.answered).toBe(2); // "pas d'avis" exclu, superlike compté une fois
  });
});

describe('pickTopMatch', () => {
  it('retourne null si la liste est vide', () => {
    expect(pickTopMatch([])).toBeNull();
  });

  it('retourne le premier résultat (déjà trié par score ajusté)', () => {
    const proposals = [proposal('p1', 'a', 'eco'), proposal('p2', 'b', 'eco')];
    const answers: Answers = { p1: 'like', p2: 'nope' };
    const results = computeResults(answers, proposals, CANDIDATES);

    expect(pickTopMatch(results)?.candidate.id).toBe('a');
  });
});

// Le classement doit dire quand il ne sait pas départager.
//
// Avant, la position dans la liste tenait lieu de rang, et l'ordre interne
// d'une égalité était alphabétique : sur une partie filtrée par thèmes — donc
// courte — le podium décernait l'or au candidat dont le nom passait le
// premier, dans 80 à 93 % des parties selon le nombre de thèmes. Ces tests
// tiennent la correction.
describe('égalités au classement', () => {
  // Mêmes réponses pour deux candidats : rien ne peut les départager.
  const memeChose = () => {
    const proposals = [
      proposal('a1', 'a', 'eco'),
      proposal('a2', 'a', 'eco'),
      proposal('b1', 'b', 'eco'),
      proposal('b2', 'b', 'eco'),
      proposal('c1', 'c', 'eco'),
      proposal('c2', 'c', 'eco'),
    ];
    const answers: Answers = {
      a1: 'like', a2: 'nope',
      b1: 'like', b2: 'nope',
      c1: 'nope', c2: 'nope',
    };
    return computeResults(answers, proposals, CANDIDATES);
  };

  it('donne le même rang à deux candidats qui affichent le même pourcentage', () => {
    const results = memeChose();
    const a = results.find((r) => r.candidate.id === 'a');
    const b = results.find((r) => r.candidate.id === 'b');
    expect(a?.pct).toBe(b?.pct);
    expect(a?.rank).toBe(1);
    expect(b?.rank).toBe(1);
    expect(a?.tied).toBe(true);
  });

  it('saute le rang consommé par les ex æquo (1, 1, 3)', () => {
    const results = memeChose();
    expect(results.map((r) => r.rank)).toEqual([1, 1, 3]);
    expect(results.find((r) => r.candidate.id === 'c')?.tied).toBe(false);
  });

  it('rend tous les premiers, pas seulement celui que l’alphabet a mis devant', () => {
    const premiers = topMatches(memeChose());
    expect(premiers.map((r) => r.candidate.id).sort()).toEqual(['a', 'b']);
  });

  it('numérote normalement quand il n’y a aucune égalité', () => {
    const proposals = [
      proposal('a1', 'a', 'eco'),
      proposal('b1', 'b', 'eco'),
      proposal('b2', 'b', 'eco'),
    ];
    const answers: Answers = { a1: 'like', b1: 'nope', b2: 'nope' };
    const results = computeResults(answers, proposals, CANDIDATES);
    expect(results.map((r) => r.rank)).toEqual([1, 2]);
    expect(results.every((r) => !r.tied)).toBe(true);
    expect(topMatches(results)).toHaveLength(1);
  });
});

describe('matchConfidenceLabel', () => {
  // Ces cas fabriquent des résultats sans passer par computeResults ; il faut
  // donc leur donner un rang cohérent, sinon deux scores différents
  // passeraient tous deux pour des premiers ex æquo.
  const classer = (...scores: number[]): CandidateResult[] => {
    const noms = 'abcdefgh'.split('');
    const rangs = scores.map((score, i) =>
      i > 0 && Math.round(scores[i - 1]) === Math.round(score) ? -1 : i + 1
    );
    for (let i = 1; i < rangs.length; i++) if (rangs[i] === -1) rangs[i] = rangs[i - 1];
    return scores.map((score, i) => ({
      candidate: { id: noms[i], name: noms[i], initials: noms[i], party: 'P' },
      pct: Math.round(score),
      score,
      agree: 1,
      total: 1,
      answered: 1,
      rank: rangs[i],
      tied: rangs.filter((r) => r === rangs[i]).length > 1,
    }));
  };

  it("retourne null s'il y a moins de deux résultats", () => {
    expect(matchConfidenceLabel([])).toBeNull();
    expect(matchConfidenceLabel(classer(80))).toBeNull();
  });

  it('signale un résultat serré quand l’écart est petit (< 6 points)', () => {
    expect(matchConfidenceLabel(classer(80, 76))).toMatch(/serré/i);
  });

  it('signale une bonne avance pour un écart moyen (6 à 14 points)', () => {
    expect(matchConfidenceLabel(classer(80, 70))).toMatch(/avance/i);
  });

  it('signale un match net pour un grand écart (≥ 15 points)', () => {
    expect(matchConfidenceLabel(classer(90, 70))).toMatch(/net/i);
  });

  // C'est le cas qui manquait : annoncer « résultat serré » quand personne
  // n'a d'avance revenait à présenter une égalité comme une victoire courte.
  it('annonce l’égalité plutôt qu’un écart, quand il y a égalité', () => {
    const label = matchConfidenceLabel(classer(82, 82));
    expect(label).toMatch(/égalité/i);
    expect(label).toMatch(/^2 candidats/);
  });

  it('compte tous les ex æquo de tête, pas seulement les deux premiers', () => {
    expect(matchConfidenceLabel(classer(82, 82, 82, 60))).toMatch(/^3 candidats/);
  });

  it('ne voit pas d’égalité entre deux scores qui s’affichent différemment', () => {
    // 82 % et 81 % : deux nombres distincts à l'écran, donc un vrai écart.
    expect(matchConfidenceLabel(classer(82.4, 80.6))).toMatch(/serré/i);
  });

  // Choix assumé, et c'est le cœur de la correction : l'égalité se mesure sur
  // le nombre AFFICHÉ. 82,4 et 81,6 montrent tous deux « 82 % » ; les
  // départager reviendrait à classer sur une décimale que personne ne voit,
  // ce que ce fichier s'interdit depuis le début.
  it('traite comme égaux deux scores qui affichent le même pourcentage', () => {
    expect(matchConfidenceLabel(classer(82.4, 81.6))).toMatch(/égalité/i);
  });
});

describe('computeThemeAgreement', () => {
  it('regroupe par thème les candidats dont on a approuvé une proposition', () => {
    const proposals = [
      proposal('e1', 'a', 'eco'),
      proposal('e2', 'a', 'eco'),
      proposal('e3', 'b', 'eco'),
      proposal('s1', 'c', 'soc'),
    ];
    const answers: Answers = { e1: 'like', e2: 'like', e3: 'nope', s1: 'superlike' };

    const [eco, soc] = computeThemeAgreement(answers, proposals, CANDIDATES, THEMES);

    expect(eco.theme.id).toBe('eco');
    expect(eco.answered).toBe(3);
    expect(eco.approved).toBe(2);
    // "b" a été refusé : il n'apparaît pas parmi les candidats approuvés.
    expect(eco.candidates.map((c) => c.candidate.id)).toEqual(['a']);
    expect(eco.candidates[0]).toMatchObject({ agreed: 2, answered: 2 });

    expect(soc.theme.id).toBe('soc');
    expect(soc.candidates.map((c) => c.candidate.id)).toEqual(['c']);
  });

  it('classe d’abord par nombre d’accords, puis par part approuvée', () => {
    const proposals = [
      proposal('p1', 'a', 'eco'),
      proposal('p2', 'a', 'eco'),
      proposal('p3', 'b', 'eco'),
      proposal('p4', 'b', 'eco'),
      proposal('p5', 'c', 'eco'),
    ];
    // a : 2 accords sur 2 · b : 1 accord sur 2 · c : 1 accord sur 1
    const answers: Answers = { p1: 'like', p2: 'like', p3: 'like', p4: 'nope', p5: 'like' };

    const [eco] = computeThemeAgreement(answers, proposals, CANDIDATES, THEMES);

    expect(eco.candidates.map((c) => c.candidate.id)).toEqual(['a', 'c', 'b']);
  });

  it('ignore les "pas d’avis" et les thèmes sans aucune réponse', () => {
    const proposals = [proposal('e1', 'a', 'eco'), proposal('s1', 'b', 'soc')];
    const answers: Answers = { e1: 'skip' }; // s1 jamais répondu

    expect(computeThemeAgreement(answers, proposals, CANDIDATES, THEMES)).toEqual([]);
  });

  it('conserve un thème où tout a été refusé, mais sans candidat', () => {
    const proposals = [proposal('e1', 'a', 'eco')];
    const answers: Answers = { e1: 'nope' };

    const [eco] = computeThemeAgreement(answers, proposals, CANDIDATES, THEMES);

    expect(eco.answered).toBe(1);
    expect(eco.approved).toBe(0);
    expect(eco.candidates).toEqual([]);
  });
});
