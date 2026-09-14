import { CANDIDATES } from '../data/candidates';
import { PROPOSALS } from '../data/proposals';
import { THEMES } from '../data/themes';
import { Answers, AnswerValue } from '../types';
import {
  codeDepuisUrl,
  codeLignes,
  codeLisible,
  comparerDefi,
  decoderDefi,
  Defi,
  DUEL_FORMAT,
  DUEL_LONGUEUR_MINIMALE,
  duelUrl,
  encoderDefi,
  nettoyerCode,
  paquetDuDefi,
  position,
} from './duel';
import { QR_CAPACITE_MAX, qrMatrix } from './qr';

const TOUS = THEMES.map((t) => t.id);
const GRAINE = 0x5b4fe901;

// Des réponses déterministes sur un paquet : de quoi comparer sans hasard.
function repondre(ids: string[], motif: readonly AnswerValue[]): Answers {
  return Object.fromEntries(ids.map((id, i) => [id, motif[i % motif.length]]));
}

function attendreDefi(code: string): Defi {
  const lu = decoderDefi(code);
  if (typeof lu === 'string') throw new Error(`décodage refusé : ${lu}`);
  return lu;
}

describe('paquet reconstruit à partir d’une graine', () => {
  // C'EST TOUTE LA BASE DU DUEL : sans reproductibilité, il faudrait faire
  // voyager la liste des cent soixante-cinq propositions.
  it('la même graine redonne exactement le même paquet', () => {
    const a = paquetDuDefi(GRAINE, TOUS);
    const b = paquetDuDefi(GRAINE, TOUS);
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
    expect(a).toHaveLength(165);
  });

  it('une autre graine donne un autre paquet', () => {
    const a = paquetDuDefi(GRAINE, TOUS).map((p) => p.id);
    const b = paquetDuDefi(GRAINE + 1, TOUS).map((p) => p.id);
    expect(a).not.toEqual(b);
  });

  it('une sélection de thèmes reconstruit toutes leurs propositions', () => {
    const themeIds = [THEMES[0].id, THEMES[1].id];
    const attendu = PROPOSALS.filter((p) => themeIds.includes(p.themeId)).length;
    expect(paquetDuDefi(GRAINE, themeIds)).toHaveLength(attendu);
  });
});

describe('code de défi', () => {
  const paquet = paquetDuDefi(GRAINE, TOUS);
  const miennes = repondre(
    paquet.map((p) => p.id),
    ['like', 'nope', 'superlike', 'skip']
  );

  it('fait l’aller-retour sans rien perdre', () => {
    const lu = attendreDefi(encoderDefi(GRAINE, TOUS, miennes));
    expect(lu.graine).toBe(GRAINE);
    expect(lu.themeIds).toEqual(TOUS);
    expect(lu.paquet.map((p) => p.id)).toEqual(paquet.map((p) => p.id));
    // « Sans avis » ne voyage pas : il ne compte pas dans le score, et son
    // absence se lit comme telle à l'arrivée.
    for (const p of paquet) {
      const attendue = miennes[p.id];
      expect(lu.reponses[p.id]).toBe(attendue === 'skip' ? undefined : attendue);
    }
  });

  it('distingue les trois réponses qui comptent', () => {
    const trois = repondre(
      paquet.map((p) => p.id),
      ['like', 'superlike', 'nope']
    );
    const lu = attendreDefi(encoderDefi(GRAINE, TOUS, trois));
    expect(lu.reponses[paquet[0].id]).toBe('like');
    expect(lu.reponses[paquet[1].id]).toBe('superlike');
    expect(lu.reponses[paquet[2].id]).toBe('nope');
  });

  it('se lit quelle que soit la casse et malgré les espaces de confort', () => {
    const code = encoderDefi(GRAINE, TOUS, miennes);
    expect(attendreDefi(codeLisible(code).toLowerCase()).graine).toBe(GRAINE);
  });

  it('transporte une sélection de thèmes, et elle seule', () => {
    const themeIds = [THEMES[2].id, THEMES[5].id];
    const court = paquetDuDefi(GRAINE, themeIds);
    const lu = attendreDefi(
      encoderDefi(GRAINE, themeIds, repondre(court.map((p) => p.id), ['like']))
    );
    expect(lu.themeIds).toEqual(themeIds);
    expect(lu.paquet).toHaveLength(court.length);
  });

  describe('refus', () => {
    const code = encoderDefi(GRAINE, TOUS, miennes);

    it('rejette un code tronqué ou hors alphabet', () => {
      expect(decoderDefi(code.slice(0, -3))).toBe('illisible');
      expect(decoderDefi('PAS UN CODE !!')).toBe('illisible');
      expect(decoderDefi('')).toBe('illisible');
    });

    // Le vrai danger : un caractère mal recopié qui donne quand même un code
    // de la bonne longueur. Sans somme de contrôle, il produirait des réponses
    // parfaitement plausibles et entièrement fausses.
    it('rejette la grande majorité des fautes de frappe d’un caractère', () => {
      const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
      let attrapes = 0;
      let total = 0;
      // On échantillonne : éprouver les 260 caractères contre 31 remplaçants
      // ferait huit mille décodages, chacun reconstruisant un paquet.
      for (let i = 0; i < code.length; i += 3) {
        for (const remplacant of alphabet.slice(0, 7)) {
          if (remplacant === code[i]) continue;
          total++;
          const abime = code.slice(0, i) + remplacant + code.slice(i + 1);
          if (typeof decoderDefi(abime) === 'string') attrapes++;
        }
      }
      expect(total).toBeGreaterThan(100);
      expect(attrapes / total).toBeGreaterThan(0.97);
    });

    it('rejette un format venu d’une version ultérieure', () => {
      expect(DUEL_FORMAT).toBe(2);
      expect(typeof decoderDefi('1' + code.slice(1))).toBe('string');
    });
  });
});

describe('lien profond', () => {
  const code = encoderDefi(GRAINE, TOUS, repondre(paquetDuDefi(GRAINE, TOUS).map((p) => p.id), ['like']));

  it('retrouve le code dans l’URL qu’il a produite', () => {
    expect(codeDepuisUrl(duelUrl(code))).toBe(code);
  });

  it('ne trouve rien dans une URL étrangère', () => {
    expect(codeDepuisUrl('https://poligraph.fr/')).toBeNull();
    expect(codeDepuisUrl('elyze://d?c=')).toBeNull();
  });

  // Le paquet complet est le cas courant : il doit tenir dans un QR code, sans
  // quoi la fonction principale du duel tomberait sur sa solution de secours.
  it('le défi d’un paquet complet tient dans un QR code', () => {
    const url = duelUrl(code);
    expect(url.length).toBeLessThanOrEqual(QR_CAPACITE_MAX);
    expect(qrMatrix(url).size).toBeLessThanOrEqual(41);
  });
});

describe('saisie du code', () => {
  const code = encoderDefi(GRAINE, TOUS, repondre(paquetDuDefi(GRAINE, TOUS).map((p) => p.id), ['nope']));

  it('remet la casse et retire les espaces de confort', () => {
    expect(nettoyerCode(codeLisible(code).toLowerCase())).toBe(code);
  });

  // La faute la plus probable de toutes : c'est le LIEN qui circule dans les
  // messages, donc le lien qu'on a dans son presse-papier.
  it('accepte le lien entier collé à la place du code', () => {
    expect(nettoyerCode(duelUrl(code))).toBe(code);
    expect(nettoyerCode(`Je te défie : ${duelUrl(code)}`)).toBe(code);
  });

  it('écarte les caractères hors alphabet plutôt que de les garder', () => {
    // I, L, O et U n'existent pas dans l'alphabet : ils se confondent avec 1
    // et 0, et un décodeur ne saurait qu'en faire.
    expect(nettoyerCode('0773-75HW')).toBe('077375HW');
    expect(nettoyerCode('ILOU')).toBe('');
  });

  it('annonce une longueur minimale cohérente avec le format', () => {
    expect(DUEL_LONGUEUR_MINIMALE).toBeGreaterThan(10);
    expect(code.length).toBeGreaterThan(DUEL_LONGUEUR_MINIMALE);
  });

  it('résiste à l’aller-retour affichage / saisie, à toute longueur', () => {
    for (let n = 0; n <= code.length; n += 13) {
      const partiel = code.slice(0, n);
      expect(nettoyerCode(codeLisible(partiel))).toBe(partiel);
    }
  });

  it('coupe l’affichage en lignes entières de groupes', () => {
    const lignes = codeLignes(code);
    expect(lignes.join(' ').replace(/ /g, '')).toBe(code);
    for (const ligne of lignes.slice(0, -1)) expect(ligne.split(' ')).toHaveLength(4);
  });
});

describe('comparaison sur le même paquet', () => {
  const paquet = paquetDuDefi(GRAINE, TOUS);
  const ids = paquet.map((p) => p.id);

  it('compte les accords sur les seules propositions tranchées par les deux', () => {
    // L'un valide tout, l'autre alterne validé / rejeté / sans avis.
    const miennes = repondre(ids, ['like']);
    const siennes = repondre(ids, ['like', 'nope', 'skip']);
    const vu = comparerDefi(paquet, miennes, siennes);

    const attenduTranchees = ids.filter((_, i) => i % 3 !== 2).length;
    const attenduAccords = ids.filter((_, i) => i % 3 === 0).length;
    expect(vu.tranchees).toBe(attenduTranchees);
    expect(vu.accords).toBe(attenduAccords);
  });

  it('met les désaccords en tête, puis les accords', () => {
    const vu = comparerDefi(paquet, repondre(ids, ['like']), repondre(ids, ['like', 'nope', 'skip']));
    const rangs = vu.lignes.map((l) => (l.desaccord ? 0 : l.accord ? 1 : 2));
    expect([...rangs].sort((a, b) => a - b)).toEqual(rangs);
  });

  // LE DÉFAUT DE LA PREMIÈRE VERSION : deux paquets différents rendaient les
  // pourcentages incomparables. Ici les deux classements portent sur les mêmes
  // cartes, donc sur les mêmes candidats et le même nombre de mesures.
  it('produit deux classements portant sur les mêmes cartes', () => {
    const vu = comparerDefi(paquet, repondre(ids, ['like', 'nope']), repondre(ids, ['nope', 'like']));
    expect(vu.mesResultats).toHaveLength(CANDIDATES.length);
    expect(vu.sesResultats).toHaveLength(CANDIDATES.length);
    for (const mien of vu.mesResultats) {
      const sien = vu.sesResultats.find((r) => r.candidate.id === mien.candidate.id)!;
      // Même paquet : chacun a vu exactement le même nombre de mesures de ce
      // candidat, quelles que soient ses réponses.
      expect(sien.answered).toBe(mien.answered);
    }
  });

  it('repère un premier commun, et seulement quand il l’est vraiment', () => {
    const memes = repondre(ids, ['like', 'nope', 'superlike']);
    expect(comparerDefi(paquet, memes, memes).memePremier).toBe(true);
    const autres = repondre(ids, ['nope', 'like', 'nope']);
    expect(comparerDefi(paquet, memes, autres).memePremier).toBe(false);
  });

  it('ne se noie pas quand l’un n’a rien tranché', () => {
    const vu = comparerDefi(paquet, repondre(ids, ['like']), {});
    expect(vu.tranchees).toBe(0);
    expect(vu.accords).toBe(0);
    expect(vu.sesPremiers).toEqual([]);
    expect(vu.memePremier).toBe(false);
  });

  it('range les réponses en trois positions, et une seule vaut validation', () => {
    expect(position('like')).toBe('valide');
    expect(position('superlike')).toBe('valide');
    expect(position('nope')).toBe('rejete');
    expect(position('skip')).toBe('sansAvis');
    expect(position(undefined)).toBe('sansAvis');
  });
});
