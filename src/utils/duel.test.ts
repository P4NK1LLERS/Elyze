import { CANDIDATES } from '../data/candidates';
import { CandidateResult } from '../types';
import {
  codeDepuisUrl,
  codeLisible,
  comparerDuel,
  decoderDuel,
  DUEL_FORMAT,
  duelUrl,
  DuelResultat,
  encoderDuel,
} from './duel';
import { QR_CAPACITE_MAX, qrMatrix } from './qr';

// Fabrique un classement à partir de pourcentages, dans la forme que produit
// utils/scoring.
function classement(parId: Record<string, number>): CandidateResult[] {
  return CANDIDATES.filter((c) => c.id in parId).map((candidate, i) => ({
    candidate,
    score: parId[candidate.id],
    pct: parId[candidate.id],
    agree: 0,
    total: 10,
    answered: 10,
    rank: i + 1,
    tied: false,
  }));
}

const TOUS = Object.fromEntries(CANDIDATES.map((c, i) => [c.id, 40 + i * 5])) as Record<
  string,
  number
>;

function attendreResultat(code: string): DuelResultat {
  const lu = decoderDuel(code);
  if (typeof lu === 'string') throw new Error(`décodage refusé : ${lu}`);
  return lu;
}

describe('code de duel', () => {
  it('fait l’aller-retour sans rien perdre', () => {
    const lu = attendreResultat(encoderDuel(classement(TOUS)));
    expect(lu.pourcentages).toEqual(TOUS);
    expect(lu.reponses).toBe(CANDIDATES.length * 10);
  });

  it('se lit quelle que soit la casse et malgré les espaces de confort', () => {
    const code = encoderDuel(classement(TOUS));
    const lu = attendreResultat(codeLisible(code).toLowerCase());
    expect(lu.pourcentages).toEqual(TOUS);
  });

  // Une partie filtrée par thèmes ne classe pas tout le monde. Le code doit
  // dire « absent » et non « zéro pour cent » : l'un veut dire qu'on ne sait
  // pas, l'autre qu'on est en total désaccord.
  it('distingue un candidat absent d’un candidat à zéro', () => {
    const partiel = { [CANDIDATES[0].id]: 0, [CANDIDATES[3].id]: 77 };
    const lu = attendreResultat(encoderDuel(classement(partiel)));
    expect(lu.pourcentages).toEqual(partiel);
    expect(Object.keys(lu.pourcentages)).toHaveLength(2);
  });

  it('tient les bornes du pourcentage', () => {
    const extremes = { [CANDIDATES[0].id]: 0, [CANDIDATES[1].id]: 100 };
    expect(attendreResultat(encoderDuel(classement(extremes))).pourcentages).toEqual(extremes);
  });

  describe('refus', () => {
    it('rejette un code tronqué ou hors alphabet', () => {
      const code = encoderDuel(classement(TOUS));
      expect(decoderDuel(code.slice(0, -3))).toBe('illisible');
      expect(decoderDuel('PAS UN CODE !!')).toBe('illisible');
      expect(decoderDuel('')).toBe('illisible');
    });

    // Le vrai danger : un caractère mal recopié qui donne quand même un code
    // de la bonne longueur. Sans somme de contrôle, il produirait des
    // pourcentages parfaitement plausibles et entièrement faux.
    it('rejette une faute de frappe d’un seul caractère', () => {
      const code = encoderDuel(classement(TOUS));
      let attrapes = 0;
      const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
      for (let i = 0; i < code.length; i++) {
        for (const remplacant of alphabet) {
          if (remplacant === code[i]) continue;
          const abime = code.slice(0, i) + remplacant + code.slice(i + 1);
          if (typeof decoderDuel(abime) === 'string') attrapes++;
        }
      }
      const total = code.length * (alphabet.length - 1);
      // Une somme de contrôle sur un octet laisse passer une altération sur
      // 256 en moyenne. On exige d'en arrêter au moins 99 sur 100.
      expect(attrapes / total).toBeGreaterThan(0.99);
    });

    it('rejette un format venu d’une version ultérieure', () => {
      // On force le premier octet à une valeur inconnue en reconstruisant un
      // code valide autour d'elle : c'est ce que produirait une future
      // version de l'app.
      expect(DUEL_FORMAT).toBe(1);
      const code = encoderDuel(classement(TOUS));
      // Le premier caractère porte les cinq premiers bits, donc le format.
      const abime = '1' + code.slice(1);
      expect(typeof decoderDuel(abime)).toBe('string');
    });
  });
});

describe('lien profond', () => {
  it('retrouve le code dans l’URL qu’il a produite', () => {
    const code = encoderDuel(classement(TOUS));
    expect(codeDepuisUrl(duelUrl(code))).toBe(code);
  });

  it('ne trouve rien dans une URL étrangère', () => {
    expect(codeDepuisUrl('https://poligraph.fr/')).toBeNull();
    expect(codeDepuisUrl('elyze://d?c=')).toBeNull();
  });

  // C'est la contrainte qui a dicté la taille du format binaire : l'URL doit
  // tenir dans un QR code assez grossier pour se lire de loin.
  it('produit une URL qui tient largement dans un QR code', () => {
    const url = duelUrl(encoderDuel(classement(TOUS)));
    expect(url.length).toBeLessThan(QR_CAPACITE_MAX);
    // Version 3 : 17 + 4 × 3 modules de côté.
    expect(qrMatrix(url).size).toBeLessThanOrEqual(29);
  });
});

describe('comparaison', () => {
  const miens = classement({ ...TOUS, [CANDIDATES[0].id]: 90 });

  it('classe les plus gros désaccords en premier', () => {
    const sien = attendreResultat(
      encoderDuel(classement({ ...TOUS, [CANDIDATES[0].id]: 10 }))
    );
    const vu = comparerDuel(miens, sien);
    expect(vu.lignes[0].candidate.id).toBe(CANDIDATES[0].id);
    expect(vu.lignes[0].ecart).toBe(80);
    expect(vu.communs).toBe(CANDIDATES.length);
  });

  it('donne l’écart moyen en points', () => {
    const sien = attendreResultat(encoderDuel(classement(TOUS)));
    // Un seul candidat diffère, de 90 contre sa valeur de départ (40).
    const vu = comparerDuel(miens, sien);
    expect(vu.ecartMoyen).toBe(Math.round(50 / CANDIDATES.length));
  });

  it('repère un premier commun, et seulement quand il l’est vraiment', () => {
    const meme = attendreResultat(
      encoderDuel(classement({ ...TOUS, [CANDIDATES[0].id]: 90 }))
    );
    expect(comparerDuel(miens, meme).memePremier).toBe(true);

    const autre = attendreResultat(encoderDuel(classement(TOUS)));
    expect(comparerDuel(miens, autre).memePremier).toBe(false);
  });

  // Un candidat classé d'un seul côté n'a pas d'écart : il ne doit ni compter
  // dans la moyenne, ni remonter en tête de liste comme un désaccord.
  it('met de côté les candidats qu’un seul des deux a classés', () => {
    const partiel = attendreResultat(
      encoderDuel(classement({ [CANDIDATES[1].id]: 50, [CANDIDATES[2].id]: 50 }))
    );
    const vu = comparerDuel(miens, partiel);
    expect(vu.communs).toBe(2);
    expect(vu.lignes).toHaveLength(CANDIDATES.length);
    expect(vu.lignes.filter((l) => l.ecart === null)).toHaveLength(CANDIDATES.length - 2);
    expect(vu.lignes[vu.lignes.length - 1].ecart).toBeNull();
  });

  it('ne se noie pas sur une comparaison sans rien de commun', () => {
    const vide = attendreResultat(encoderDuel(classement({})));
    const vu = comparerDuel(miens, vide);
    expect(vu.communs).toBe(0);
    expect(vu.ecartMoyen).toBeNull();
    expect(vu.sesPremiers).toEqual([]);
    expect(vu.memePremier).toBe(false);
  });
});
