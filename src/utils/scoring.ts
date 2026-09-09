import {
  Answers,
  Candidate,
  CandidateResult,
  Proposal,
  ThemeAgreement,
  ThemeTag,
} from '../types';

// --- Le score de compatibilité ---
//
// Deux grandeurs entrent dans ce score, et TOUTE LA DIFFICULTÉ est de ne pas
// les confondre :
//
//   1. À QUEL POINT tu es d'accord — le taux d'accord. Un « super like »
//      y pèse trois fois plus qu'un « j'adhère » : c'est en swipant,
//      proposition par proposition, qu'on dit ce qui compte vraiment.
//
//   2. SUR COMBIEN DE RÉPONSES on le sait — la fiabilité. Là, un super like
//      ne vaut qu'une seule réponse : dire fortement oui à cinq propositions
//      ne t'apprend pas autant sur quelqu'un que répondre à quinze.
//
// Une version précédente additionnait les deux : le poids du super like
// gonflait aussi le nombre de réponses, si bien que cinq super likes
// affichaient la même fiabilité que quinze « j'adhère ». L'intensité d'une
// préférence était comptée comme une quantité de preuves.
//
// La correction, standard pour classer des notes reposant sur des nombres
// d'avis différents (Reddit, IMDb) : partir d'un a priori neutre — une
// réponse « pour » et une « contre » virtuelles — et le laisser s'effacer à
// mesure que de VRAIES réponses s'accumulent.
//
//   score = (taux × réponses + 0,5 × 2) / (réponses + 2)
//
// Avec peu de réponses, l'a priori tire le score vers 50 %. Avec beaucoup, il
// devient négligeable et le score rejoint le taux d'accord. Deux propositions
// approuvées donnent donc 75 % et non 100 % — ce qui est l'information juste.
//
// Ce score est À LA FOIS celui qui classe et celui qui s'affiche. C'était le
// défaut précédent : l'écran montrait le taux brut (trois candidats à 100 %)
// pendant qu'un autre nombre décidait de l'ordre en coulisses, sans que rien
// n'explique pourquoi l'un passait devant l'autre.
const PRIOR = 2;
const PRIOR_RATE = 0.5;

const SUPERLIKE_WEIGHT = 3;

function compatibility(agreeWeight: number, totalWeight: number, answered: number): number {
  if (totalWeight <= 0 || answered <= 0) return PRIOR_RATE * 100;
  const rate = agreeWeight / totalWeight;
  return ((rate * answered + PRIOR_RATE * PRIOR) / (answered + PRIOR)) * 100;
}

function isCounted(answer: Answers[string] | undefined): answer is 'like' | 'superlike' | 'nope' {
  return answer === 'like' || answer === 'superlike' || answer === 'nope';
}

function isAgree(answer: Answers[string] | undefined): boolean {
  return answer === 'like' || answer === 'superlike';
}

function answerWeight(answer: Answers[string] | undefined): number {
  return answer === 'superlike' ? SUPERLIKE_WEIGHT : 1;
}

// Le tri se fait sur le score NON ARRONDI : deux candidats affichant tous
// deux 94 % peuvent valoir 94,1 et 93,8, et c'est bien dans cet ordre qu'il
// faut les mettre. Les départages suivants ne servent qu'aux égalités
// exactes, pour que l'ordre reste stable d'un rendu à l'autre.
function sortByScore<T extends { score: number; answered: number; candidate: { name: string } }>(
  results: T[]
): T[] {
  return results.sort(
    (a, b) =>
      b.score - a.score ||
      b.answered - a.answered ||
      a.candidate.name.localeCompare(b.candidate.name, 'fr')
  );
}

export function computeResults(
  answers: Answers,
  proposals: Proposal[],
  candidates: Candidate[]
): CandidateResult[] {
  const byCandidate: Record<string, { agree: number; total: number; answered: number }> = {};

  for (const proposal of proposals) {
    const answer = answers[proposal.id];
    if (!isCounted(answer)) continue; // non répondu, ou "pas d'avis" : exclu du score
    // Un "j'adhère fortement" compte pour plusieurs réponses normales, sans
    // changer la logique de lissage (le "+1/+2" reste fixe).
    const weight = answerWeight(answer);
    const bucket = byCandidate[proposal.candidateId] ?? { agree: 0, total: 0, answered: 0 };
    bucket.total += weight;
    // Décompte réel, non pondéré : c'est lui qu'on affiche ("3 propositions"),
    // sinon un super like ferait apparaître 3 propositions là où il n'y en a
    // qu'une seule.
    bucket.answered += 1;
    if (isAgree(answer)) bucket.agree += weight;
    byCandidate[proposal.candidateId] = bucket;
  }

  const results = candidates
    .map((candidate) => {
      const bucket = byCandidate[candidate.id] ?? { agree: 0, total: 0, answered: 0 };
      const score = compatibility(bucket.agree, bucket.total, bucket.answered);
      return {
        candidate,
        score,
        pct: Math.round(score),
        agree: bucket.agree,
        total: bucket.total,
        answered: bucket.answered,
      };
    })
    .filter((result) => result.total > 0);

  return withRanks(sortByScore(results));
}

// --- Les égalités, dites plutôt que masquées ---------------------------------
//
// Le tri devait bien départager les ex æquo pour produire une liste, et il le
// faisait par ordre alphabétique. Sur le paquet complet, l'égalité parfaite est
// rare (2 % des parties). Mais une partie filtrée sur un ou deux thèmes est
// courte, et l'égalité y devient la règle : simulation faite, le vainqueur y
// est désigné par son NOM dans 80 % des parties à deux thèmes, 93 % à un seul.
// Le podium remettait alors une médaille d'or à celui qui passait le premier
// dans l'alphabet, sans que rien ne le signale.
//
// L'ÉGALITÉ SE MESURE SUR LE POURCENTAGE AFFICHÉ, pas sur le score brut. Ce
// fichier tient depuis le début que le nombre montré est celui qui classe —
// « il n'y a pas un nombre à l'écran et un autre en coulisses ». Deux
// candidats qui affichent tous deux 82 % ne peuvent donc pas être départagés
// par une décimale que personne ne voit : ils sont à égalité, et l'app le dit.
//
// Rang de compétition standard : 1, 1, 3 — deux premiers ex æquo, puis un
// troisième. L'ordre interne d'un groupe reste alphabétique, mais il ne
// prétend plus rien.
function withRanks(sorted: Omit<CandidateResult, 'rank' | 'tied'>[]): CandidateResult[] {
  const rangs = sorted.map((result, i) => {
    if (i === 0) return 1;
    return sorted[i - 1].pct === result.pct ? -1 : i + 1;
  });
  // Deuxième passe : les -1 reprennent le rang du précédent.
  for (let i = 1; i < rangs.length; i++) if (rangs[i] === -1) rangs[i] = rangs[i - 1];

  return sorted.map((result, i) => ({
    ...result,
    rank: rangs[i],
    tied: rangs.filter((r) => r === rangs[i]).length > 1,
  }));
}

// Tous les candidats en tête, et non « le » premier : quand il y a égalité,
// désigner un vainqueur est un choix que les données ne permettent pas.
export function topMatches(results: CandidateResult[]): CandidateResult[] {
  return results.filter((r) => r.rank === 1);
}

export function pickTopMatch(results: CandidateResult[]): CandidateResult | null {
  // `results` est déjà classé par score ajusté (voir computeResults) : le
  // meilleur match est donc simplement le premier, plus besoin d'un seuil
  // arbitraire de "nombre minimum de propositions" — le lissage s'en charge
  // de façon continue et proportionnée.
  return results[0] ?? null;
}

// Traduit l'écart (en score ajusté) entre le 1er et le 2e du classement en
// un message qualitatif — plus honnête qu'un chiffre brut, qui pourrait
// entrer en contradiction avec les pourcentages bruts affichés juste à côté.
export function matchConfidenceLabel(results: CandidateResult[]): string | null {
  if (results.length < 2) return null;

  // L'égalité passe avant l'écart : annoncer « résultat serré » quand il y a
  // en réalité trois premiers ex æquo revenait à décrire comme une avance
  // ténue ce qui n'est pas une avance du tout.
  const premiers = topMatches(results);
  if (premiers.length > 1) {
    return `${premiers.length} candidats à égalité en tête : rien ne les départage sur ces réponses.`;
  }

  const gap = results[0].score - results[1].score;
  if (gap >= 15) return 'Match net : l’écart est clair avec le reste du classement.';
  if (gap >= 6) return 'Bonne avance sur le reste du classement.';
  return 'Résultat serré avec le 2ᵉ du classement.';
}

// Pour chaque thème : ce que tu y as approuvé, et de quels candidats.
//
// Volontairement PAS un classement par thème. Dans le paquet, un candidat n'a
// le plus souvent qu'une seule proposition sur un thème donné (72 % des
// paires thème/candidat) : désigner un « gagnant du thème » reviendrait à
// départager des égalités au hasard, tout en affichant un résultat qui aurait
// l'air catégorique. On montre donc les nombres bruts, et le lecteur juge de
// leur poids lui-même.
export function computeThemeAgreement(
  answers: Answers,
  proposals: Proposal[],
  candidates: Candidate[],
  themes: ThemeTag[]
): ThemeAgreement[] {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const perTheme = new Map<string, { answered: number; approved: number; per: Map<string, { agreed: number; answered: number }> }>();

  for (const proposal of proposals) {
    const answer = answers[proposal.id];
    if (!isCounted(answer)) continue; // "pas d'avis" et non répondu : ignorés
    if (!byId.has(proposal.candidateId)) continue;

    const bucket =
      perTheme.get(proposal.themeId) ??
      { answered: 0, approved: 0, per: new Map<string, { agreed: number; answered: number }>() };
    const agreed = isAgree(answer);

    bucket.answered += 1;
    if (agreed) bucket.approved += 1;

    const forCandidate = bucket.per.get(proposal.candidateId) ?? { agreed: 0, answered: 0 };
    forCandidate.answered += 1;
    if (agreed) forCandidate.agreed += 1;
    bucket.per.set(proposal.candidateId, forCandidate);

    perTheme.set(proposal.themeId, bucket);
  }

  return themes
    .map((theme) => {
      const bucket = perTheme.get(theme.id);
      if (!bucket) return null;
      const list = [...bucket.per.entries()]
        .filter(([, v]) => v.agreed > 0)
        .map(([id, v]) => ({ candidate: byId.get(id)!, agreed: v.agreed, answered: v.answered }))
        // Le plus d'accords d'abord ; à égalité, celui dont on a approuvé la
        // plus grande part ; puis l'ordre alphabétique, pour rester stable.
        .sort(
          (a, b) =>
            b.agreed - a.agreed ||
            b.agreed / b.answered - a.agreed / a.answered ||
            a.candidate.name.localeCompare(b.candidate.name, 'fr')
        );
      return {
        theme,
        answered: bucket.answered,
        approved: bucket.approved,
        candidates: list,
      };
    })
    .filter((t): t is ThemeAgreement => t !== null);
}
