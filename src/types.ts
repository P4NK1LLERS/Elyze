export type ThemeTag = {
  id: string;
  label: string;
  icon: string;
  categoryId: string;
};

export type Category = {
  id: string;
  label: string;
  icon: string;
};

export type Candidate = {
  id: string;
  name: string;
  initials: string;
  party: string;
  // Identifiant de sa fiche sur Poligraph, extrait des liens de ses mesures.
  // Sert à ouvrir sa page publique — l'app ne stocke aucune biographie, elle
  // renvoie à la source plutôt que d'écrire elle-même sur des personnes réelles.
  poligraphSlug?: string;
};

export type Proposal = {
  id: string;
  themeId: string;
  candidateId: string;
  text: string;
  // Nature de l'engagement, telle que qualifiée par la source : 'chiffree'
  // quand la mesure porte un objectif chiffré, 'non_chiffree' quand c'est un
  // objectif sans chiffre. Absent quand la source ne se prononce pas.
  precision?: 'chiffree' | 'non_chiffree';
  // Provenance de la mesure (document d'où elle est tirée). Affichée sur la
  // carte à la place d'un texte explicatif : les propositions sont citées
  // telles quelles, l'app n'y ajoute aucun commentaire de son cru.
  sourceType?: string;
  sourceDate?: string;
  sourceUrl?: string;
  // Fiche détaillée de la mesure sur Poligraph.
  detailUrl?: string;
};

// 'like' = j'adhère, 'superlike' = j'adhère fortement (compte plus dans le
// score, voir utils/scoring.ts), 'nope' = pas pour moi, 'skip' = pas d'avis
// (exclu du score).
export type AnswerValue = 'like' | 'superlike' | 'nope' | 'skip';

export type Answers = Record<string, AnswerValue>;

export type CandidateResult = {
  candidate: Candidate;
  // Score de compatibilité arrondi : c'est LE nombre affiché à l'écran, et
  // c'est le même qui décide du classement (voir utils/scoring.ts). Il tient
  // compte du nombre de réponses, si bien que deux propositions approuvées
  // donnent 75 % et non 100 %.
  pct: number;
  // Le même score, non arrondi. Sert au tri et à l'écart de confiance : deux
  // candidats affichant 94 % peuvent valoir 94,1 et 93,8.
  score: number;
  // `agree` et `total` sont PONDÉRÉS : un « super like » y compte pour 3 (voir
  // utils/scoring.ts). Ce sont les termes du calcul, pas des nombres de
  // propositions — pour afficher un décompte à l'écran, utiliser `answered`.
  agree: number;
  total: number;
  // Nombre réel de propositions de ce candidat auxquelles tu as répondu
  // « j'adhère », « super like » ou « pas pour moi ». Non pondéré.
  answered: number;
  // Rang au classement, ÉGALITÉS COMPRISES : deux candidats affichant le même
  // pourcentage portent le même rang, et le suivant saute d'autant (1, 1, 3).
  // Sans ce champ, la position dans la liste tenait lieu de rang, et l'ordre
  // interne d'une égalité — l'ordre alphabétique — passait pour un résultat.
  rank: number;
  // Vrai si au moins un autre candidat partage ce rang.
  tied: boolean;
};

// Ce que tu as retenu sur un thème, et de qui. Volontairement exprimé en
// nombres bruts ("2 sur 2") et non en pourcentage : sur un thème donné, un
// candidat n'a souvent qu'une ou deux propositions dans le paquet, un taux y
// donnerait une fausse impression de précision.
export type ThemeAgreement = {
  theme: ThemeTag;
  // Propositions du thème auxquelles tu as répondu fermement, et parmi elles
  // celles que tu as approuvées.
  answered: number;
  approved: number;
  // Candidats dont tu as approuvé au moins une proposition sur ce thème.
  candidates: {
    candidate: Candidate;
    agreed: number;
    answered: number;
  }[];
};
