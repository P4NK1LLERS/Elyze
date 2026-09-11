import { CANDIDATES, CANDIDATES_BY_ID } from '../data/candidates';
import { Candidate, CandidateResult } from '../types';
import { CATALOG_FINGERPRINT } from './catalog';

// Le duel : comparer son classement à celui de quelqu'un d'autre.
//
// TOUT TIENT DANS SEIZE OCTETS, et ce n'est pas une coquetterie. Le code doit
// voyager dans un QR code qu'un téléphone lit à cinquante centimètres, dans une
// lumière quelconque, tenu à la main. Plus la charge est courte, plus la
// grille est grossière, et plus elle se lit vite et de loin. Seize octets
// tiennent en version 3, soit 29 modules de côté : gros carrés, lecture
// immédiate.
//
// CE QUI EST DANS LE CODE, ET CE QUI N'Y EST PAS.
//
// Y sont : onze pourcentages, un décompte de réponses, l'empreinte du
// catalogue, un numéro de format et une somme de contrôle. Le résultat, donc,
// et rien de plus.
//
// N'y sont PAS : les réponses proposition par proposition. Elles auraient
// permis une comparaison bien plus fine — carte par carte, « vous n'êtes pas
// d'accord sur ces trois-là » — mais c'est précisément ce qu'on ne veut pas
// faire circuler. Un classement est un avis que l'on choisit de montrer ; la
// liste de ses réponses à cent soixante-cinq mesures politiques est un profil
// d'opinion, qui se recopie, se conserve et se recoupe. Un QR code est fait
// pour être photographié par des inconnus. On s'en tient donc à ce qui est
// déjà affiché à l'écran de résultat.
//
// AUCUN NOM N'Y FIGURE NON PLUS, et pas seulement par économie de place : un
// prénom dans le code ferait du duel un échange nominatif, avec ce que cela
// suppose de données personnelles à protéger. L'écran demande donc simplement
// « qui est-ce ? » à l'arrivée, et la réponse reste sur le téléphone.

// --- Format binaire ---------------------------------------------------------
//
//   octet 0      : version du format
//   octets 1-2   : empreinte courte du catalogue
//   octet 3      : nombre de réponses comptabilisées, borné à 255
//   octets 4-14  : un pourcentage par candidat, dans l'ordre de CANDIDATES
//   octet 15     : somme de contrôle
export const DUEL_FORMAT = 1;

// Marque un candidat absent du classement de l'autre : ses propositions n'ont
// pas été tirées (partie par thèmes), ou toutes laissées « sans avis ». 255
// est hors de portée d'un pourcentage, donc sans ambiguïté.
const ABSENT = 255;

const TAILLE = 4 + CANDIDATES.length + 1;

// Empreinte du catalogue réduite à seize bits. Elle ne sert qu'à refuser une
// comparaison entre deux versions de l'app dont les propositions diffèrent :
// les pourcentages ne porteraient plus sur les mêmes mesures, et l'écart
// affiché mesurerait la mise à jour, pas le désaccord.
export function empreinteCourte(): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < CATALOG_FINGERPRINT.length; i++) {
    h ^= CATALOG_FINGERPRINT.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h & 0xffff;
}

function sommeDeControle(octets: Uint8Array): number {
  let h = 0;
  for (let i = 0; i < TAILLE - 1; i++) h = (h * 31 + octets[i]) & 0xff;
  return h;
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
  // Les bits restants forment un dernier caractère, complété par des zéros.
  if (bits > 0) sortie += ALPHABET[(accumulateur << (5 - bits)) & 31];
  return sortie;
}

function depuisBase32(texte: string): Uint8Array | null {
  let accumulateur = 0;
  let bits = 0;
  const sortie: number[] = [];
  for (const caractere of texte.toUpperCase()) {
    // Les séparateurs de confort (espaces, tirets) sont ignorés : on veut
    // qu'un code recopié depuis un écran, groupé par paquets de quatre, se
    // colle tel quel.
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

// --- Encodage et décodage ---------------------------------------------------

export type DuelResultat = {
  // Empreinte du catalogue de celui qui a produit le code.
  catalogue: number;
  reponses: number;
  // Pourcentage par identifiant de candidat. Un candidat absent du classement
  // de l'autre n'y figure pas.
  pourcentages: Record<string, number>;
};

export function encoderDuel(resultats: CandidateResult[]): string {
  const parId = new Map(resultats.map((r) => [r.candidate.id, r]));
  const octets = new Uint8Array(TAILLE);
  const empreinte = empreinteCourte();
  const reponses = resultats.reduce((somme, r) => somme + r.answered, 0);

  octets[0] = DUEL_FORMAT;
  octets[1] = (empreinte >> 8) & 0xff;
  octets[2] = empreinte & 0xff;
  octets[3] = Math.min(255, reponses);
  CANDIDATES.forEach((candidat, i) => {
    const trouve = parId.get(candidat.id);
    octets[4 + i] = trouve ? Math.max(0, Math.min(100, trouve.pct)) : ABSENT;
  });
  octets[TAILLE - 1] = sommeDeControle(octets);

  return versBase32(octets);
}

export type DuelErreur = 'illisible' | 'format' | 'catalogue';

export function decoderDuel(code: string): DuelResultat | DuelErreur {
  const octets = depuisBase32(code.trim());
  if (!octets || octets.length !== TAILLE) return 'illisible';
  if (octets[TAILLE - 1] !== sommeDeControle(octets)) return 'illisible';
  // Le numéro de format se lit AVANT le reste : un code produit par une
  // version ultérieure n'a pas la même disposition d'octets, et le lire comme
  // s'il avait celle-ci donnerait des pourcentages plausibles mais faux.
  if (octets[0] !== DUEL_FORMAT) return 'format';
  if (((octets[1] << 8) | octets[2]) !== empreinteCourte()) return 'catalogue';

  const pourcentages: Record<string, number> = {};
  CANDIDATES.forEach((candidat, i) => {
    const valeur = octets[4 + i];
    if (valeur <= 100) pourcentages[candidat.id] = valeur;
  });

  return {
    catalogue: (octets[1] << 8) | octets[2],
    reponses: octets[3],
    pourcentages,
  };
}

// --- Lien profond -----------------------------------------------------------
//
// Le QR code porte une URL et non le code nu : photographié par l'appareil
// photo ordinaire du téléphone, il propose alors d'ouvrir Élyze directement
// sur la comparaison. Avec le code nu, il aurait fallu le sélectionner, le
// copier, ouvrir l'app, trouver où le coller.
//
// `elyze://` est déclaré dans app.json. Quand l'app n'est pas installée, rien
// ne s'ouvre : c'est acceptable, un duel suppose deux joueurs équipés, et
// l'écran affiche le code en clair juste en dessous pour tous les autres cas.
export const DUEL_SCHEME = 'elyze';

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

// Mise en forme du code pour l'œil et pour la main : des groupes de quatre.
export function codeLisible(code: string): string {
  return (code.match(/.{1,4}/g) ?? []).join(' ');
}

// --- Comparaison ------------------------------------------------------------

export type DuelLigne = {
  candidate: Candidate;
  mien: number | null;
  sien: number | null;
  // Écart en points, absent si l'un des deux manque.
  ecart: number | null;
};

export type DuelComparaison = {
  lignes: DuelLigne[];
  // Candidats classés des deux côtés : les seuls sur lesquels un écart a un
  // sens.
  communs: number;
  // Écart moyen en points sur ces candidats. `null` s'il n'y en a aucun.
  ecartMoyen: number | null;
  // Les têtes de chaque classement. Plusieurs si égalité, comme partout
  // ailleurs dans l'app : désigner un vainqueur unique serait inventer.
  mesPremiers: Candidate[];
  sesPremiers: Candidate[];
  memePremier: boolean;
};

function premiers(pourcentages: Record<string, number>): Candidate[] {
  const entrees = Object.entries(pourcentages);
  if (entrees.length === 0) return [];
  const sommet = Math.max(...entrees.map(([, v]) => v));
  return entrees
    .filter(([, v]) => v === sommet)
    .map(([id]) => CANDIDATES_BY_ID[id])
    .filter((c): c is Candidate => Boolean(c));
}

export function comparerDuel(
  miens: CandidateResult[],
  autre: DuelResultat
): DuelComparaison {
  const mesPourcentages: Record<string, number> = {};
  for (const r of miens) mesPourcentages[r.candidate.id] = r.pct;

  const lignes: DuelLigne[] = CANDIDATES.map((candidate) => {
    const mien = mesPourcentages[candidate.id] ?? null;
    const sien = autre.pourcentages[candidate.id] ?? null;
    return {
      candidate,
      mien,
      sien,
      ecart: mien !== null && sien !== null ? Math.abs(mien - sien) : null,
    };
  })
    // Le plus gros désaccord en premier : c'est là qu'il y a quelque chose à
    // se dire. Les candidats qu'un seul des deux a classés ferment la marche,
    // faute de comparaison possible.
    .sort((a, b) => {
      if (a.ecart === null && b.ecart === null) {
        return a.candidate.name.localeCompare(b.candidate.name, 'fr');
      }
      if (a.ecart === null) return 1;
      if (b.ecart === null) return -1;
      return b.ecart - a.ecart || a.candidate.name.localeCompare(b.candidate.name, 'fr');
    });

  const comparables = lignes.filter((l) => l.ecart !== null);
  const mesPremiers = premiers(mesPourcentages);
  const sesPremiers = premiers(autre.pourcentages);

  return {
    lignes,
    communs: comparables.length,
    ecartMoyen:
      comparables.length > 0
        ? Math.round(
            comparables.reduce((somme, l) => somme + (l.ecart as number), 0) / comparables.length
          )
        : null,
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
