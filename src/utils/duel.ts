import { CANDIDATES } from '../data/candidates';
import { PROPOSALS } from '../data/proposals';
import { THEMES } from '../data/themes';
import { Answers, AnswerValue, Candidate, CandidateResult, Proposal } from '../types';
import { CATALOG_FINGERPRINT } from './catalog';
import { buildSessionDeck } from './deck';
import { computeResults } from './scoring';
import { shuffleAvecGraine } from './shuffle';

// Le duel : jouer LES MÊMES CARTES que quelqu'un d'autre, puis comparer.
//
// CE QUI A CHANGÉ, ET POURQUOI. La première version échangeait onze
// pourcentages. C'était compact, et à peu près sans intérêt : chacun avait
// tiré son propre paquet, si bien que les deux pourcentages ne portaient pas
// sur les mêmes mesures. « 82 % contre 74 % » comparait deux questionnaires
// différents, et l'écart mesurait pour moitié le hasard du tirage.
//
// Le code transporte donc maintenant un DÉFI : de quoi reconstruire le paquet
// à l'identique, et les réponses de celui qui l'envoie. L'autre joue ces
// cartes-là, et la comparaison porte enfin sur quelque chose.
//
// LE PAQUET N'EST PAS TRANSMIS, IL EST RECONSTRUIT. Envoyer la liste des
// propositions demanderait cent soixante-cinq identifiants, soit plusieurs
// milliers de caractères. Une graine et la liste des thèmes en tiennent six
// octets, et le mélange reproductible refait le même paquet de l'autre côté
// (voir utils/shuffle.ts). Encore faut-il que les deux catalogues soient
// identiques : l'empreinte en tête du code le vérifie avant toute chose.
//
// CE QUE LE CODE CONTIENT DÉSORMAIS, ET CE QUE CELA IMPLIQUE. Il porte les
// réponses proposition par proposition, ce qui est un profil d'opinion et non
// plus un simple résultat. C'est le prix de la comparaison demandée, et il est
// payé en connaissance de cause : l'écran de duel le dit en toutes lettres
// avant qu'on montre son code à qui que ce soit.

// --- Format binaire ---------------------------------------------------------
//
//   octet 0      : version du format
//   octets 1-2   : empreinte courte du catalogue
//   octets 3-6   : graine du mélange
//   octets 7-8   : masque des thèmes retenus, un bit par thème
//   octets 9...  : deux bits par proposition du paquet reconstruit
//   dernier      : somme de contrôle
//
// La longueur totale dépend du paquet, que seule la reconstruction révèle : on
// lit l'entête, on refait le paquet, et c'est lui qui dit combien d'octets de
// réponses doivent suivre.
export const DUEL_FORMAT = 2;

const ENTETE = 9;

// Deux bits par réponse. « Sans avis » et « pas encore répondu » partagent la
// valeur 0 : ni l'un ni l'autre ne compte dans le score, et un défi ne s'émet
// de toute façon qu'une fois le paquet terminé.
const CODES: Record<number, AnswerValue | undefined> = {
  0: undefined,
  1: 'nope',
  2: 'like',
  3: 'superlike',
};
const VALEURS: Record<AnswerValue, number> = { skip: 0, nope: 1, like: 2, superlike: 3 };

function empreinteCourte(): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < CATALOG_FINGERPRINT.length; i++) {
    h ^= CATALOG_FINGERPRINT.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h & 0xffff;
}

function sommeDeControle(octets: Uint8Array, jusqua: number): number {
  let h = 0;
  for (let i = 0; i < jusqua; i++) h = (h * 31 + octets[i]) & 0xff;
  return h;
}

// --- Thèmes, en un masque de bits ------------------------------------------
//
// L'ordre de THEMES fait foi des deux côtés : c'est un fichier généré, dont
// l'ordre ne dépend d'aucune préférence locale. Un thème ajouté au catalogue
// changerait l'empreinte, donc le code serait refusé avant d'en arriver là.
function masqueDesThemes(themeIds: string[]): number {
  let masque = 0;
  THEMES.forEach((theme, i) => {
    if (themeIds.includes(theme.id)) masque |= 1 << i;
  });
  return masque;
}

function themesDuMasque(masque: number): string[] {
  return THEMES.filter((_, i) => (masque & (1 << i)) !== 0).map((t) => t.id);
}

// Reconstruit le paquet exact d'une partie à partir de sa clé.
export function paquetDuDefi(graine: number, themeIds: string[]): Proposal[] {
  const pool = PROPOSALS.filter((p) => themeIds.includes(p.themeId));
  return buildSessionDeck(pool, themeIds.length === THEMES.length, shuffleAvecGraine(graine));
}

// --- Base 32 lisible à voix haute ------------------------------------------
//
// L'alphabet de Douglas Crockford : ni I, ni L, ni O, ni U. Les trois
// premières se confondent avec 1 et 0 dans à peu près toutes les polices, et
// la quatrième est écartée pour éviter de former des mots malheureux. Le code
// se recopie donc à la main sans piège quand la caméra ne veut rien savoir, et
// la lecture est insensible à la casse.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function versBase32(octets: Uint8Array): string {
  let accumulateur = 0;
  let bits = 0;
  let sortie = '';
  for (const octet of octets) {
    accumulateur = (accumulateur << 8) | octet;
    bits += 8;
    while (bits >= 5) {
      sortie += ALPHABET[(accumulateur >> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) sortie += ALPHABET[(accumulateur << (5 - bits)) & 31];
  return sortie;
}

function depuisBase32(texte: string): Uint8Array | null {
  let accumulateur = 0;
  let bits = 0;
  const sortie: number[] = [];
  for (const caractere of texte.toUpperCase()) {
    if (caractere === ' ' || caractere === '-') continue;
    const valeur = ALPHABET.indexOf(caractere);
    if (valeur < 0) return null;
    accumulateur = (accumulateur << 5) | valeur;
    bits += 5;
    if (bits >= 8) {
      sortie.push((accumulateur >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(sortie);
}

// --- Encodage ---------------------------------------------------------------

export function encoderDefi(graine: number, themeIds: string[], reponses: Answers): string {
  const paquet = paquetDuDefi(graine, themeIds);
  const taille = ENTETE + Math.ceil((paquet.length * 2) / 8) + 1;
  const octets = new Uint8Array(taille);
  const empreinte = empreinteCourte();
  const masque = masqueDesThemes(themeIds);

  octets[0] = DUEL_FORMAT;
  octets[1] = (empreinte >> 8) & 0xff;
  octets[2] = empreinte & 0xff;
  octets[3] = (graine >>> 24) & 0xff;
  octets[4] = (graine >>> 16) & 0xff;
  octets[5] = (graine >>> 8) & 0xff;
  octets[6] = graine & 0xff;
  octets[7] = (masque >> 8) & 0xff;
  octets[8] = masque & 0xff;

  paquet.forEach((proposition, i) => {
    const reponse = reponses[proposition.id];
    const valeur = reponse ? VALEURS[reponse] : 0;
    // Deux bits par proposition, quatre par octet, du poids fort au faible.
    octets[ENTETE + (i >> 2)] |= valeur << (6 - (i % 4) * 2);
  });

  octets[taille - 1] = sommeDeControle(octets, taille - 1);
  return versBase32(octets);
}

// --- Décodage ---------------------------------------------------------------

export type DuelErreur = 'illisible' | 'format' | 'catalogue';

export type Defi = {
  graine: number;
  themeIds: string[];
  // Le paquet reconstruit, dans l'ordre exact où l'autre l'a joué.
  paquet: Proposal[];
  // Ses réponses, indexées par identifiant de proposition.
  reponses: Answers;
};

export function decoderDefi(code: string): Defi | DuelErreur {
  const octets = depuisBase32(code.trim());
  if (!octets || octets.length < ENTETE + 2) return 'illisible';
  // Le numéro de format se lit AVANT le reste : un code produit par une
  // version ultérieure n'a pas la même disposition d'octets, et le lire comme
  // s'il avait celle-ci donnerait des réponses plausibles mais fausses.
  if (octets[0] !== DUEL_FORMAT) return 'format';
  if (((octets[1] << 8) | octets[2]) !== empreinteCourte()) return 'catalogue';

  const graine = ((octets[3] << 24) | (octets[4] << 16) | (octets[5] << 8) | octets[6]) >>> 0;
  const themeIds = themesDuMasque((octets[7] << 8) | octets[8]);
  if (themeIds.length === 0) return 'illisible';

  const paquet = paquetDuDefi(graine, themeIds);
  if (paquet.length === 0) return 'illisible';

  // C'est la reconstruction qui dit la longueur attendue : un code plus court
  // ou plus long ne décrit pas ce paquet-là.
  const taille = ENTETE + Math.ceil((paquet.length * 2) / 8) + 1;
  if (octets.length !== taille) return 'illisible';
  if (octets[taille - 1] !== sommeDeControle(octets, taille - 1)) return 'illisible';

  const reponses: Answers = {};
  paquet.forEach((proposition, i) => {
    const valeur = (octets[ENTETE + (i >> 2)] >> (6 - (i % 4) * 2)) & 3;
    const reponse = CODES[valeur];
    if (reponse) reponses[proposition.id] = reponse;
  });

  return { graine, themeIds, paquet, reponses };
}

// --- Lien profond -----------------------------------------------------------
//
// Le QR code porte une URL et non le code nu : photographié par l'appareil
// photo ordinaire du téléphone, il propose alors d'ouvrir Élyze directement
// sur le défi. Avec le code nu, il aurait fallu le sélectionner, le copier,
// ouvrir l'app, trouver où le coller.
const DUEL_SCHEME = 'elyze';

export function duelUrl(code: string): string {
  return `${DUEL_SCHEME}://d?c=${code}`;
}

// Extrait le code d'une URL reçue. Tolérant sur la forme : le code collé à la
// main comme l'URL complète doivent aboutir au même endroit.
export function codeDepuisUrl(url: string): string | null {
  const marqueur = '?c=';
  const position = url.indexOf(marqueur);
  if (position < 0) return null;
  const code = url.slice(position + marqueur.length).split('&')[0];
  return code.length > 0 ? code : null;
}

// Longueur du plus court code possible : l'entête, un octet de réponses, un de
// contrôle. Sert au champ de saisie pour ne pas proposer de comparer avant
// qu'il y ait quelque chose à lire.
export const DUEL_LONGUEUR_MINIMALE = Math.ceil(((ENTETE + 2) * 8) / 5);

// Nettoie ce qui a été tapé ou collé, pour n'en garder qu'un code.
//
// TROIS FAUTES SONT CORRIGÉES SANS RIEN DEMANDER, parce qu'aucune ne dit quoi
// que ce soit sur l'intention de celui qui saisit : la casse, les espaces de
// confort, et le fait d'avoir collé le lien entier plutôt que le code. Cette
// dernière est la plus probable de toutes — le lien est ce qui circule, et
// c'est lui qu'on a dans son presse-papier après avoir reçu un message.
//
// Ce qui n'est PAS corrigé : un caractère faux. Il est écarté s'il n'existe
// pas dans l'alphabet, mais un « 8 » tapé pour un « B » passe, et c'est la
// somme de contrôle qui l'arrête ensuite. Deviner à la place de quelqu'un ce
// qu'il a voulu écrire serait pire que de le lui dire.
export function nettoyerCode(saisie: string): string {
  const brut = codeDepuisUrl(saisie) ?? saisie;
  let sortie = '';
  for (const caractere of brut.toUpperCase()) {
    if (ALPHABET.includes(caractere)) sortie += caractere;
  }
  return sortie;
}

// Mise en forme du code pour l'œil et pour la main : des groupes de quatre.
export function codeLisible(code: string): string {
  return (code.match(/.{1,4}/g) ?? []).join(' ');
}

// Le même code, réparti sur des lignes d'égale longueur.
//
// Le dernier groupe compte rarement quatre caractères, et laissé au retour à
// la ligne automatique il se retrouvait seul sous les autres : on lisait deux
// lettres orphelines sous le QR code, et plus rien n'avait l'air d'être un
// code. La coupe est donc décidée ici, entre les groupes, jamais à l'intérieur
// de l'un d'eux.
export function codeLignes(code: string, groupesParLigne = 4): string[] {
  const groupes = code.match(/.{1,4}/g) ?? [];
  const lignes: string[] = [];
  for (let i = 0; i < groupes.length; i += groupesParLigne) {
    lignes.push(groupes.slice(i, i + groupesParLigne).join(' '));
  }
  return lignes;
}

// --- Comparaison ------------------------------------------------------------

// Ce qu'une réponse vaut dans la comparaison. « Validé » recouvre le
// « j'adhère » et le « super like » : la nuance d'intensité appartient au
// score, pas à la question de savoir si l'on est d'accord.
export type Position = 'valide' | 'rejete' | 'sansAvis';

export function position(reponse: AnswerValue | undefined): Position {
  if (reponse === 'like' || reponse === 'superlike') return 'valide';
  if (reponse === 'nope') return 'rejete';
  return 'sansAvis';
}

export type LigneProposition = {
  proposal: Proposal;
  mienne: Position;
  sienne: Position;
  // Les deux ont tranché, et dans le même sens.
  accord: boolean;
  // Les deux ont tranché, en sens contraire.
  desaccord: boolean;
};

export type DuelComparaison = {
  lignes: LigneProposition[];
  // Propositions que les DEUX ont tranchées : les seules sur lesquelles
  // « d'accord » ou « pas d'accord » veut dire quelque chose.
  tranchees: number;
  accords: number;
  // Classements calculés sur le MÊME paquet, donc directement comparables.
  mesResultats: CandidateResult[];
  sesResultats: CandidateResult[];
  mesPremiers: Candidate[];
  sesPremiers: Candidate[];
  memePremier: boolean;
};

function premiers(resultats: CandidateResult[]): Candidate[] {
  return resultats.filter((r) => r.rank === 1).map((r) => r.candidate);
}

export function comparerDefi(
  paquet: Proposal[],
  miennes: Answers,
  siennes: Answers
): DuelComparaison {
  const lignes: LigneProposition[] = paquet.map((proposal) => {
    const mienne = position(miennes[proposal.id]);
    const sienne = position(siennes[proposal.id]);
    const tranchee = mienne !== 'sansAvis' && sienne !== 'sansAvis';
    return {
      proposal,
      mienne,
      sienne,
      accord: tranchee && mienne === sienne,
      desaccord: tranchee && mienne !== sienne,
    };
  });

  // Les désaccords d'abord : c'est là qu'il y a quelque chose à se dire. Puis
  // les accords, puis ce qu'un seul des deux a tranché.
  const rang = (l: LigneProposition) => (l.desaccord ? 0 : l.accord ? 1 : 2);
  lignes.sort((a, b) => rang(a) - rang(b));

  const mesResultats = computeResults(miennes, paquet, CANDIDATES);
  const sesResultats = computeResults(siennes, paquet, CANDIDATES);
  const mesPremiers = premiers(mesResultats);
  const sesPremiers = premiers(sesResultats);

  return {
    lignes,
    tranchees: lignes.filter((l) => l.accord || l.desaccord).length,
    accords: lignes.filter((l) => l.accord).length,
    mesResultats,
    sesResultats,
    mesPremiers,
    sesPremiers,
    // Vrai seulement si les DEUX ensembles de tête sont identiques : un
    // premier commun au milieu de deux ex æquo différents n'est pas le même
    // accord, et l'écran ne doit pas le présenter comme tel.
    memePremier:
      mesPremiers.length > 0 &&
      mesPremiers.length === sesPremiers.length &&
      mesPremiers.every((c) => sesPremiers.some((s) => s.id === c.id)),
  };
}
