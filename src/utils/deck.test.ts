import { buildDeck, buildSessionDeck, candidatesQuota } from './deck';
import { Proposal } from '../types';
import { PROPOSALS } from '../data/proposals';

const THEMES = ['economie', 'sante', 'education', 'logement', 'securite'];

function pool(parCandidat: Record<string, number>): Proposal[] {
  const out: Proposal[] = [];
  for (const [candidateId, n] of Object.entries(parCandidat)) {
    for (let i = 0; i < n; i++) {
      out.push({
        id: `${candidateId}-${i}`,
        themeId: THEMES[i % THEMES.length],
        candidateId,
        text: `proposition ${i} de ${candidateId}`,
      });
    }
  }
  return out;
}

const compte = (deck: Proposal[], cle: 'candidateId' | 'themeId') => {
  const m: Record<string, number> = {};
  for (const p of deck) m[p[cle]] = (m[p[cle]] ?? 0) + 1;
  return m;
};

describe('buildDeck', () => {
  it('donne exactement le même nombre de cartes à chaque candidat', () => {
    const deck = buildDeck(pool({ a: 30, b: 30, c: 30 }), 15);
    expect(compte(deck, 'candidateId')).toEqual({ a: 15, b: 15, c: 15 });
    expect(deck).toHaveLength(45);
  });

  // C'est l'invariant dont dépend tout le calcul du score : un candidat plus
  // représenté qu'un autre serait mécaniquement avantagé.
  it('s’aligne sur le plus petit vivier plutôt que d’avantager quelqu’un', () => {
    const deck = buildDeck(pool({ a: 30, b: 30, petit: 9 }), 15);
    expect(compte(deck, 'candidateId')).toEqual({ a: 9, b: 9, petit: 9 });
  });

  it('ne dépasse jamais le quota demandé', () => {
    const deck = buildDeck(pool({ a: 100, b: 100 }), 15);
    expect(compte(deck, 'candidateId')).toEqual({ a: 15, b: 15 });
  });

  it('répartit les cartes d’un candidat sur ses thèmes', () => {
    // 30 propositions sur 5 thèmes, on en tire 15 : chaque thème doit être
    // représenté, et aucun ne doit rafler la mise.
    const deck = buildDeck(pool({ a: 30 }), 15);
    const parTheme = compte(deck, 'themeId');
    expect(Object.keys(parTheme).sort()).toEqual([...THEMES].sort());
    expect(Math.max(...Object.values(parTheme))).toBeLessThanOrEqual(3);
  });

  it('tire un paquet différent d’une partie à l’autre', () => {
    const p = pool({ a: 30, b: 30 });
    const ids = (d: Proposal[]) => new Set(d.map((x) => x.id));
    const premier = ids(buildDeck(p, 15));

    // Sur dix tirages, au moins un doit différer du premier : sinon le vivier
    // ne sert à rien.
    const differents = Array.from({ length: 10 }, () => buildDeck(p, 15)).filter((d) => {
      const s = ids(d);
      return [...premier].some((id) => !s.has(id));
    });
    expect(differents.length).toBeGreaterThan(0);
  });

  it('renvoie un paquet vide plutôt qu’un paquet bancal si le vivier est vide', () => {
    expect(buildDeck([], 15)).toEqual([]);
    expect(candidatesQuota([], 15)).toBe(0);
  });

  it('mélange les candidats, pour ne pas les servir par blocs', () => {
    const deck = buildDeck(pool({ a: 30, b: 30, c: 30 }), 15);
    // Un paquet servi candidat par candidat aurait de longues séries.
    let plusLongueSerie = 1;
    let serie = 1;
    for (let i = 1; i < deck.length; i++) {
      serie = deck[i].candidateId === deck[i - 1].candidateId ? serie + 1 : 1;
      plusLongueSerie = Math.max(plusLongueSerie, serie);
    }
    expect(plusLongueSerie).toBeLessThan(10);
  });
});

describe('sur le vivier réel embarqué', () => {
  it('produit un paquet équilibré de 165 cartes', () => {
    const deck = buildDeck(PROPOSALS, 15);
    const parCandidat = compte(deck, 'candidateId');
    const valeurs = Object.values(parCandidat);

    expect(new Set(valeurs).size).toBe(1); // tout le monde au même nombre
    expect(valeurs[0]).toBe(15);
    expect(deck).toHaveLength(Object.keys(parCandidat).length * 15);
  });

  it('couvre tous les thèmes du vivier', () => {
    const deck = buildDeck(PROPOSALS, 15);
    const themesVivier = new Set(PROPOSALS.map((p) => p.themeId));
    const themesPaquet = new Set(deck.map((p) => p.themeId));
    expect(themesPaquet.size).toBe(themesVivier.size);
  });

  it('renouvelle une bonne part du paquet d’une partie à l’autre', () => {
    const a = new Set(buildDeck(PROPOSALS, 15).map((p) => p.id));
    const b = buildDeck(PROPOSALS, 15).map((p) => p.id);
    const communes = b.filter((id) => a.has(id)).length;
    // Le vivier fait environ deux fois le paquet : on attend grosso modo la
    // moitié de cartes nouvelles. On vérifie surtout qu'il y en a vraiment.
    expect(communes).toBeLessThan(b.length * 0.85);
  });
});

describe('composition du paquet selon l’étendue de la sélection', () => {
  // LE DÉFAUT CORRIGÉ : sur un thème où le candidat le moins prolixe n'a
  // qu'une seule mesure, le quota ramenait TOUT LE MONDE à une carte. On
  // choisissait un sujet de trente propositions et la partie en servait
  // quelques-unes.
  const inegal = pool({ a: 12, b: 9, c: 1 });

  it('sur une sélection de thèmes, prend toutes les propositions', () => {
    const paquet = buildSessionDeck(inegal, false);
    expect(paquet).toHaveLength(inegal.length);
    // Rien n'est perdu ni dupliqué : c'est le même ensemble, mélangé.
    expect(new Set(paquet.map((p) => p.id))).toEqual(new Set(inegal.map((p) => p.id)));
  });

  it('sur tous les thèmes, garde le quota qui égalise les candidats', () => {
    const paquet = buildSessionDeck(inegal, true);
    const parCandidat = new Map<string, number>();
    for (const p of paquet) parCandidat.set(p.candidateId, (parCandidat.get(p.candidateId) ?? 0) + 1);
    // Le plus petit vivier vaut 1 : tout le monde y est ramené.
    expect([...parCandidat.values()]).toEqual([1, 1, 1]);
  });

  it('ne laisse plus une sélection tomber à une poignée de cartes', () => {
    const avant = buildDeck(inegal, 15).length;
    const apres = buildSessionDeck(inegal, false).length;
    expect(avant).toBe(3);
    expect(apres).toBe(22);
  });

  it('mélange, pour que les cartes ne sortent pas candidat par candidat', () => {
    const paquet = buildSessionDeck(pool({ a: 20, b: 20 }), false);
    // Sans mélange, les vingt premières cartes seraient toutes du même
    // candidat, ce qui laisserait deviner qui porte quoi.
    const vingtPremiers = new Set(paquet.slice(0, 20).map((p) => p.candidateId));
    expect(vingtPremiers.size).toBe(2);
  });
});
