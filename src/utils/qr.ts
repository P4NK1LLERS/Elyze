// Génération d'un QR code, en TypeScript et sans dépendance.
//
// POURQUOI ÉCRIRE ÇA PLUTÔT QUE D'INSTALLER UNE BIBLIOTHÈQUE.
//
// Les paquets habituels (`react-native-qrcode-svg`) dessinent en SVG et
// tirent `react-native-svg`, un module natif de près d'un mégaoctet. Pour une
// grille de carrés noirs et blancs, c'est cher : React Native sait poser des
// rectangles, et c'est tout ce qu'un QR code est. L'app garde ainsi zéro
// module natif de plus, et fonctionne à l'identique sur le web.
//
// Le risque de l'écrire soi-même est réel : un encodeur faux produit une
// image parfaitement plausible que personne ne peut lire. D'où le test qui
// accompagne ce fichier, et qui ne se contente pas de vérifier que le code
// est cohérent avec lui-même : il REDÉCODE l'image avec `jsQR`, un lecteur
// écrit par quelqu'un d'autre, sur le pixel près. Un encodeur juste face à
// son propre décodeur ne prouve rien.
//
// CE QUI EST COUVERT, ET CE QUI NE L'EST PAS. Mode octet, correction de
// niveau M, versions 1 à 6 (jusqu'à 106 octets). C'est assez pour une URL de
// duel, et cela évite deux complications inutiles ici : les blocs de tailles
// inégales (ils n'apparaissent qu'à partir de la version 7 en niveau M) et le
// bloc d'information de version, réservé lui aussi aux versions 7 et plus.
// Au-delà de la capacité, on lève : mieux vaut une erreur franche qu'un code
// tronqué que la caméra refusera sans dire pourquoi.

export type QrMatrix = {
  size: number;
  // `modules[ligne][colonne]` : vrai pour un module sombre.
  modules: boolean[][];
};

// --- Corps de Galois GF(256) ------------------------------------------------
//
// Le code correcteur Reed-Solomon travaille sur des octets traités comme les
// éléments d'un corps fini à 256 valeurs. Multiplier y revient à additionner
// des logarithmes, d'où ces deux tables construites une fois pour toutes.
// 0x11D est le polynôme primitif imposé par la norme QR.
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function mul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

// Polynôme générateur de degré `degre`, produit des (x - α^i).
function generateur(degre: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degre; i++) {
    const suivant = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      suivant[j] ^= poly[j];
      suivant[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = suivant;
  }
  return poly;
}

// Octets de correction d'un bloc : reste de la division polynomiale.
function correction(donnees: Uint8Array, longueur: number): Uint8Array {
  const gen = generateur(longueur);
  const reste = new Uint8Array(donnees.length + longueur);
  reste.set(donnees);
  for (let i = 0; i < donnees.length; i++) {
    const coef = reste[i];
    if (coef === 0) continue;
    // `gen[0]` vaut 1, donc ce premier tour remet `reste[i]` à zéro.
    for (let j = 0; j < gen.length; j++) reste[i + j] ^= mul(gen[j], coef);
  }
  return reste.slice(donnees.length);
}

// --- Caractéristiques des versions 1 à 6, niveau M --------------------------
//
// `blocs` × `donneesParBloc` + `blocs` × `correctionParBloc` = total des mots
// de code de la version. Tous les blocs ont la même taille jusqu'à la version
// 6 incluse, ce qui rend l'entrelacement trivial.
type Specification = {
  version: number;
  blocs: number;
  donneesParBloc: number;
  correctionParBloc: number;
  // Centres des motifs d'alignement. Vide en version 1.
  alignements: number[];
};

const SPECIFICATIONS: Specification[] = [
  { version: 1, blocs: 1, donneesParBloc: 16, correctionParBloc: 10, alignements: [] },
  { version: 2, blocs: 1, donneesParBloc: 28, correctionParBloc: 16, alignements: [6, 18] },
  { version: 3, blocs: 1, donneesParBloc: 44, correctionParBloc: 26, alignements: [6, 22] },
  { version: 4, blocs: 2, donneesParBloc: 32, correctionParBloc: 18, alignements: [6, 26] },
  { version: 5, blocs: 2, donneesParBloc: 43, correctionParBloc: 24, alignements: [6, 30] },
  { version: 6, blocs: 4, donneesParBloc: 27, correctionParBloc: 16, alignements: [6, 34] },
];

// Quatre bits de mode, huit bits de longueur : deux octets d'entête retirés de
// la place disponible.
const ENTETE_OCTETS = 2;

export const QR_CAPACITE_MAX =
  SPECIFICATIONS[SPECIFICATIONS.length - 1].blocs *
    SPECIFICATIONS[SPECIFICATIONS.length - 1].donneesParBloc -
  ENTETE_OCTETS;

function choisirVersion(octets: number): Specification {
  for (const spec of SPECIFICATIONS) {
    if (octets <= spec.blocs * spec.donneesParBloc - ENTETE_OCTETS) return spec;
  }
  throw new Error(
    `QR : ${octets} octets dépassent la capacité de ${QR_CAPACITE_MAX} octets (versions 1 à 6, niveau M).`
  );
}

// --- Flux binaire -----------------------------------------------------------

function motsDeCode(octets: Uint8Array, spec: Specification): Uint8Array {
  const total = spec.blocs * spec.donneesParBloc;
  const bits: number[] = [];
  const pousser = (valeur: number, largeur: number) => {
    for (let i = largeur - 1; i >= 0; i--) bits.push((valeur >> i) & 1);
  };

  pousser(0b0100, 4); // mode octet
  pousser(octets.length, 8); // longueur, 8 bits jusqu'à la version 9
  for (const octet of octets) pousser(octet, 8);

  // Terminateur : jusqu'à quatre zéros, tronqué s'il ne reste pas la place.
  const capaciteBits = total * 8;
  for (let i = 0; i < 4 && bits.length < capaciteBits; i++) bits.push(0);
  // Complément jusqu'à l'octet.
  while (bits.length % 8 !== 0) bits.push(0);

  const mots = new Uint8Array(total);
  for (let i = 0; i < bits.length; i += 8) {
    let octet = 0;
    for (let j = 0; j < 8; j++) octet = (octet << 1) | bits[i + j];
    mots[i / 8] = octet;
  }
  // Remplissage imposé par la norme : 0xEC et 0x11 en alternance.
  for (let i = bits.length / 8, alterne = 0; i < total; i++, alterne++) {
    mots[i] = alterne % 2 === 0 ? 0xec : 0x11;
  }
  return mots;
}

// Les blocs sont entrelacés mot à mot : c'est ce qui répartit une rayure ou
// une tache sur plusieurs blocs au lieu d'en détruire un seul entièrement.
function entrelacer(mots: Uint8Array, spec: Specification): Uint8Array {
  const blocsDonnees: Uint8Array[] = [];
  const blocsCorrection: Uint8Array[] = [];
  for (let b = 0; b < spec.blocs; b++) {
    const debut = b * spec.donneesParBloc;
    const bloc = mots.slice(debut, debut + spec.donneesParBloc);
    blocsDonnees.push(bloc);
    blocsCorrection.push(correction(bloc, spec.correctionParBloc));
  }

  const sortie: number[] = [];
  for (let i = 0; i < spec.donneesParBloc; i++) {
    for (const bloc of blocsDonnees) sortie.push(bloc[i]);
  }
  for (let i = 0; i < spec.correctionParBloc; i++) {
    for (const bloc of blocsCorrection) sortie.push(bloc[i]);
  }
  return new Uint8Array(sortie);
}

// --- Construction de la grille ---------------------------------------------

type Grille = {
  taille: number;
  modules: boolean[][];
  // Modules occupés par les motifs de service : ils ne portent pas de données
  // et ne subissent pas le masque.
  reserves: boolean[][];
};

function grilleVide(taille: number): Grille {
  return {
    taille,
    modules: Array.from({ length: taille }, () => new Array<boolean>(taille).fill(false)),
    reserves: Array.from({ length: taille }, () => new Array<boolean>(taille).fill(false)),
  };
}

function poserReperes(g: Grille, ligne0: number, colonne0: number) {
  // La boucle va de -1 à 7 pour peindre du même geste le séparateur clair qui
  // entoure le repère : sans lui, le repère se confond avec les données
  // voisines et n'est plus reconnaissable.
  for (let dl = -1; dl <= 7; dl++) {
    for (let dc = -1; dc <= 7; dc++) {
      const l = ligne0 + dl;
      const c = colonne0 + dc;
      if (l < 0 || l >= g.taille || c < 0 || c >= g.taille) continue;
      const bord = dl >= 0 && dl <= 6 && dc >= 0 && dc <= 6 && (dl === 0 || dl === 6 || dc === 0 || dc === 6);
      const coeur = dl >= 2 && dl <= 4 && dc >= 2 && dc <= 4;
      g.modules[l][c] = bord || coeur;
      g.reserves[l][c] = true;
    }
  }
}

function poserAlignement(g: Grille, ligne: number, colonne: number) {
  for (let dl = -2; dl <= 2; dl++) {
    for (let dc = -2; dc <= 2; dc++) {
      g.modules[ligne + dl][colonne + dc] = Math.max(Math.abs(dl), Math.abs(dc)) !== 1;
      g.reserves[ligne + dl][colonne + dc] = true;
    }
  }
}

function poserMotifs(g: Grille, spec: Specification) {
  const t = g.taille;
  poserReperes(g, 0, 0);
  poserReperes(g, 0, t - 7);
  poserReperes(g, t - 7, 0);

  // Lignes de synchronisation : une alternance qui donne au lecteur l'échelle
  // exacte d'un module.
  for (let i = 8; i < t - 8; i++) {
    g.modules[6][i] = i % 2 === 0;
    g.reserves[6][i] = true;
    g.modules[i][6] = i % 2 === 0;
    g.reserves[i][6] = true;
  }

  for (const l of spec.alignements) {
    for (const c of spec.alignements) {
      // Les trois coins sont déjà occupés par les repères.
      const coin =
        (l === 6 && c === 6) ||
        (l === 6 && c === t - 7) ||
        (l === t - 7 && c === 6);
      if (!coin) poserAlignement(g, l, c);
    }
  }

  // Emplacements du format, réservés avant la pose des données.
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      g.reserves[8][i] = true;
      g.reserves[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) g.reserves[8][t - 1 - i] = true;
  for (let i = 0; i < 8; i++) g.reserves[t - 1 - i][8] = true;

  // Module toujours sombre, imposé par la norme.
  g.modules[t - 8][8] = true;
  g.reserves[t - 8][8] = true;
}

// Parcours en zigzag, par colonnes de deux, de la droite vers la gauche.
function poserDonnees(g: Grille, mots: Uint8Array) {
  const t = g.taille;
  let bit = 0;
  const total = mots.length * 8;
  let versLeHaut = true;

  for (let droite = t - 1; droite >= 1; droite -= 2) {
    // La colonne 6 est celle de la synchronisation : on l'enjambe toute
    // entière, sans quoi le décalage fausse tout ce qui suit.
    if (droite === 6) droite = 5;
    for (let vertical = 0; vertical < t; vertical++) {
      for (let j = 0; j < 2; j++) {
        const colonne = droite - j;
        const ligne = versLeHaut ? t - 1 - vertical : vertical;
        if (g.reserves[ligne][colonne]) continue;
        if (bit < total) {
          g.modules[ligne][colonne] = ((mots[bit >> 3] >> (7 - (bit & 7))) & 1) === 1;
        }
        bit++;
      }
    }
    versLeHaut = !versLeHaut;
  }
}

// --- Masques ---------------------------------------------------------------
//
// Le masque inverse une partie des modules de données pour éviter les grandes
// plages uniformes et les figures qui imitent un repère. Les huit sont
// essayés, et le moins pénalisé gagne.
const MASQUES: ((l: number, c: number) => boolean)[] = [
  (l, c) => (l + c) % 2 === 0,
  (l) => l % 2 === 0,
  (_l, c) => c % 3 === 0,
  (l, c) => (l + c) % 3 === 0,
  (l, c) => (Math.floor(l / 2) + Math.floor(c / 3)) % 2 === 0,
  (l, c) => ((l * c) % 2) + ((l * c) % 3) === 0,
  (l, c) => (((l * c) % 2) + ((l * c) % 3)) % 2 === 0,
  (l, c) => (((l + c) % 2) + ((l * c) % 3)) % 2 === 0,
];

function appliquerMasque(g: Grille, numero: number) {
  const masque = MASQUES[numero];
  for (let l = 0; l < g.taille; l++) {
    for (let c = 0; c < g.taille; c++) {
      if (!g.reserves[l][c] && masque(l, c)) g.modules[l][c] = !g.modules[l][c];
    }
  }
}

// Pénalité d'un masque, selon les quatre règles de la norme. Un écart de
// barème ne rendrait pas le code illisible : il ferait seulement choisir un
// masque un peu moins bon que le meilleur.
function penalite(g: Grille): number {
  const t = g.taille;
  const m = g.modules;
  let total = 0;

  // Règle 1 : suites de cinq modules de même couleur ou plus.
  const suites = (lire: (i: number) => boolean) => {
    let courant = lire(0);
    let longueur = 1;
    for (let i = 1; i < t; i++) {
      const v = lire(i);
      if (v === courant) {
        longueur++;
      } else {
        if (longueur >= 5) total += 3 + (longueur - 5);
        courant = v;
        longueur = 1;
      }
    }
    if (longueur >= 5) total += 3 + (longueur - 5);
  };
  for (let l = 0; l < t; l++) suites((c) => m[l][c]);
  for (let c = 0; c < t; c++) suites((l) => m[l][c]);

  // Règle 2 : carrés de deux modules de côté, d'une seule couleur.
  for (let l = 0; l < t - 1; l++) {
    for (let c = 0; c < t - 1; c++) {
      const v = m[l][c];
      if (v === m[l][c + 1] && v === m[l + 1][c] && v === m[l + 1][c + 1]) total += 3;
    }
  }

  // Règle 3 : la figure 1:1:3:1:1 bordée de quatre modules clairs, qui imite
  // un repère de position et égare le lecteur.
  const motif = [true, false, true, true, true, false, true];
  const clair = [false, false, false, false];
  const correspond = (lire: (i: number) => boolean, depart: number, suite: boolean[]) =>
    suite.every((attendu, k) => lire(depart + k) === attendu);
  const regle3 = (lire: (i: number) => boolean) => {
    for (let i = 0; i + 11 <= t; i++) {
      if (correspond(lire, i, motif) && correspond(lire, i + 7, clair)) total += 40;
      if (correspond(lire, i, clair) && correspond(lire, i + 4, motif)) total += 40;
    }
  };
  for (let l = 0; l < t; l++) regle3((c) => m[l][c]);
  for (let c = 0; c < t; c++) regle3((l) => m[l][c]);

  // Règle 4 : déséquilibre entre modules sombres et clairs.
  let sombres = 0;
  for (let l = 0; l < t; l++) for (let c = 0; c < t; c++) if (m[l][c]) sombres++;
  const pourcentage = (sombres * 100) / (t * t);
  total += Math.floor(Math.abs(pourcentage - 50) / 5) * 10;

  return total;
}

// --- Information de format --------------------------------------------------

function bitsDeFormat(masque: number): number {
  // 0b00 = niveau de correction M.
  const donnees = (0b00 << 3) | masque;
  let reste = donnees;
  for (let i = 0; i < 10; i++) reste = (reste << 1) ^ ((reste >>> 9) * 0x537);
  return ((donnees << 10) | reste) ^ 0x5412;
}

function poserFormat(g: Grille, masque: number) {
  const t = g.taille;
  const bits = bitsDeFormat(masque);
  const bit = (i: number) => ((bits >> i) & 1) === 1;

  // Première copie, autour du repère haut-gauche.
  for (let i = 0; i <= 5; i++) g.modules[i][8] = bit(i);
  g.modules[7][8] = bit(6);
  g.modules[8][8] = bit(7);
  g.modules[8][7] = bit(8);
  for (let i = 9; i < 15; i++) g.modules[8][14 - i] = bit(i);

  // Seconde copie, répartie le long des deux autres repères. Elle existe pour
  // que le format reste lisible même si un coin du code est abîmé.
  for (let i = 0; i < 8; i++) g.modules[8][t - 1 - i] = bit(i);
  for (let i = 8; i < 15; i++) g.modules[t - 15 + i][8] = bit(i);

  g.modules[t - 8][8] = true;
}

// --- Entrée publique --------------------------------------------------------

function octetsDe(texte: string): Uint8Array {
  // Encodage UTF-8 fait à la main : `TextEncoder` n'est pas garanti sur toutes
  // les versions de React Native, et l'URL de duel reste de toute façon en
  // ASCII (voir utils/duel.ts).
  const sortie: number[] = [];
  for (const caractere of texte) {
    let point = caractere.codePointAt(0) as number;
    if (point < 0x80) {
      sortie.push(point);
    } else if (point < 0x800) {
      sortie.push(0xc0 | (point >> 6), 0x80 | (point & 0x3f));
    } else if (point < 0x10000) {
      sortie.push(0xe0 | (point >> 12), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f));
    } else {
      sortie.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 0x3f),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f)
      );
    }
  }
  return new Uint8Array(sortie);
}

export function qrMatrix(texte: string): QrMatrix {
  const octets = octetsDe(texte);
  const spec = choisirVersion(octets.length);
  const mots = entrelacer(motsDeCode(octets, spec), spec);
  const taille = 17 + 4 * spec.version;

  let meilleur: Grille | null = null;
  let meilleurScore = Infinity;
  for (let masque = 0; masque < 8; masque++) {
    const g = grilleVide(taille);
    poserMotifs(g, spec);
    poserDonnees(g, mots);
    appliquerMasque(g, masque);
    poserFormat(g, masque);
    const score = penalite(g);
    if (score < meilleurScore) {
      meilleurScore = score;
      meilleur = g;
    }
  }

  // `meilleur` est forcément défini : la boucle tourne huit fois et toute
  // pénalité est finie. Le test rassure le compilateur, pas le lecteur.
  if (!meilleur) throw new Error('QR : aucun masque retenu');
  return { size: taille, modules: meilleur.modules };
}
