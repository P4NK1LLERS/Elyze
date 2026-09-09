#!/usr/bin/env node
/**
 * Génère les fichiers de données de l'app à partir de l'export Poligraph.
 *
 *   node scripts/generate-data.js
 *
 * Produit : src/data/candidates.ts, themes.ts, categories.ts, proposals.ts
 *
 * Deux arbitrages structurent la génération, parce que l'export brut ne peut
 * pas être utilisé tel quel :
 *
 * 1. VOLUME — l'export contient 1360 mesures. Swiper 1360 cartes n'a aucun
 *    sens ; on en retient un sous-ensemble.
 *
 * 2. ÉQUILIBRE — la répartition brute est très inégale (Mélenchon 759 mesures,
 *    soit 56 % du total, contre 2 pour d'autres). Or l'app calcule un
 *    pourcentage de compatibilité PAR CANDIDAT : si un candidat occupait la
 *    moitié du paquet, il gagnerait mécaniquement, et les candidats à 2 ou 3
 *    mesures afficheraient des scores de 0 % ou 100 % dénués de sens.
 *    On applique donc un quota identique pour tous.
 *
 * 3. QUI FIGURE DANS L'APP — voir ROSTER plus bas. C'est une liste explicite,
 *    et non plus un seuil automatique : le changement est assumé et l'écran
 *    « Comment ça marche » le dit aux utilisateurs.
 *
 * La source est double : l'export machine de Poligraph, et un fichier
 * complémentaire produit par scripts/fetch-candidates.js pour les candidats
 * apparus depuis (voir ce script pour le pourquoi).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'poligraph_presidentielle_2027_export.json');
const AJOUTS = path.join(ROOT, 'poligraph_candidats_ajoutes.json');
const OUT = path.join(ROOT, 'src', 'data');

// Taille du VIVIER par candidat : ce que l'app embarque.
//
// Le paquet d'une session n'en tire qu'une partie (voir utils/deck.ts), pour
// qu'un deuxième passage ne repose pas sur les mêmes cartes. Deux fois le
// quota donne environ la moitié de cartes nouvelles à chaque partie.
//
// Certains candidats n'ont pas publié assez de mesures pour atteindre ce
// vivier (Bertrand 23, Cazeneuve 24) : on prend alors ce qui existe. La
// variété est moindre pour eux, mais l'ÉQUITÉ ne bouge pas — c'est le paquet
// tiré, pas le vivier, qui doit compter le même nombre pour tout le monde.
const POOL_PAR_CANDIDAT = 30;

// Nombre de propositions tirées par candidat dans une session. Identique pour
// tous : c'est ce qui rend les pourcentages comparables entre eux.
const QUOTA_PAR_CANDIDAT = 15;

// Un candidat qui n'atteint pas ce seuil ne peut de toute façon pas être
// comparé : le pourcentage affiché reposerait sur trop peu de réponses pour
// vouloir dire quoi que ce soit. C'est une condition nécessaire, plus
// suffisante (voir ROSTER).
const MIN_MESURES = QUOTA_PAR_CANDIDAT;

// --- Qui figure dans l'app -------------------------------------------------
//
// Liste explicite, tenue à la main. Elle a remplacé la règle automatique
// « tout candidat ayant publié au moins QUOTA mesures », qui admettait
// 16 candidatures — dont plusieurs sans fonction élective nationale ni
// représentation parlementaire.
//
// Le critère retenu est indiqué en regard de chaque nom, et il est
// VÉRIFIABLE plutôt que pronostique : avoir exercé une fonction exécutive
// nationale, diriger un parti disposant d'un groupe au Parlement, ou avoir
// conduit une liste nationale au dernier scrutin européen. Aucun pronostic
// électoral n'entre ici — ce serait invérifiable et daté.
//
// Ce choix est éditorial et l'app doit le dire : voir la section « Pourquoi
// ces candidats » de screens/HowItWorksScreen.tsx, qui décrit ce critère.
// Modifier cette liste sans modifier cet écran ferait mentir l'app.
const ROSTER = {
  'Édouard Philippe': 'ancien Premier ministre',
  'Gabriel Attal': 'ancien Premier ministre',
  'Bernard Cazeneuve': 'ancien Premier ministre',
  'Dominique de Villepin': 'ancien Premier ministre',
  'Marine Le Pen': 'préside le groupe RN à l’Assemblée',
  'Jean-Luc Mélenchon': 'fondateur de LFI, groupe à l’Assemblée',
  'Bruno Retailleau': 'ancien ministre de l’Intérieur, président de LR',
  'Xavier Bertrand': 'ancien ministre, président de région',
  'Raphaël Glucksmann': 'tête de liste nationale aux européennes de 2024',
  'Marine Tondelier': 'secrétaire nationale des Écologistes',
  'François Ruffin': 'député, candidature déclarée',
};

// Correspondance slug Poligraph -> identité, pour les mesures récupérées sur
// le site (scripts/fetch-candidates.js) et fusionnées ici.
//
// L'export du 29 août est devenu très incomplet : le site a publié depuis des
// centaines de mesures pour des candidats qui n'en avaient qu'une poignée
// (Attal 15 -> 251, Tondelier 16 -> 192). On lit donc le site pour TOUS les
// candidats. L'export garde une utilité : il est le seul à porter la
// qualification « objectif chiffré » et le document source, absents des pages
// publiques. Comme il est fusionné EN PREMIER et que le dédoublonnage garde
// la première occurrence d'un texte, ses métadonnées survivent.
const CANDIDATS_AJOUTES = {
  'gabriel-attal': { nom: 'Gabriel Attal', parti: 'Renaissance' },
  'bernard-cazeneuve': { nom: 'Bernard Cazeneuve', parti: 'La Convention' },
  'marine-le-pen': { nom: 'Marine Le Pen', parti: 'RN' },
  'jean-luc-melenchon': { nom: 'Jean-Luc Mélenchon', parti: 'LFI' },
  'edouard-philippe': { nom: 'Édouard Philippe', parti: 'Horizons' },
  'bruno-retailleau': { nom: 'Bruno Retailleau', parti: 'LR' },
  'francois-ruffin': { nom: 'François Ruffin', parti: 'Nous président' },
  'marine-tondelier': { nom: 'Marine Tondelier', parti: 'EELV' },
  'xavier-bertrand': { nom: 'Xavier Bertrand', parti: 'Nous France' },
  'dominique-de-villepin': { nom: 'Dominique de Villepin', parti: 'LFH' },
  'raphael-glucksmann': { nom: 'Raphaël Glucksmann', parti: 'Place publique' },
};

// Les textes très longs débordent de la carte de swipe, les très courts sont
// souvent trop vagues pour qu'on puisse se prononcer.
//
// LONGUEUR_MAX est un filtre STRICT, plus une simple préférence. Tant que
// l'app tirait 15 mesures par candidat dans un export étroit, l'imposer aurait
// pu vider certains paquets ; on l'assouplissait donc, et une mesure de 448
// caractères s'est retrouvée dans le vivier — au delà de ce que la carte peut
// afficher (voir le budget de place dans components/SwipeCard.tsx). Avec plus
// de mille mesures disponibles, la contrainte ne coûte plus rien.
const LONGUEUR_MIN = 40;
const LONGUEUR_MAX = 240;
const LONGUEUR_IDEALE = 130;

// --- Métadonnées éditoriales des 15 thèmes de l'export ---------------------
// (slug Poligraph -> identifiant court, libellé affiché, icône, catégorie)
const THEME_META = {
  'economie-budget': { id: 'economie', label: 'Économie & budget', icon: '💶', categoryId: 'economie' },
  'emploi-travail': { id: 'emploi', label: 'Emploi & travail', icon: '🤝', categoryId: 'economie' },
  retraites: { id: 'retraites', label: 'Retraites', icon: '🧓', categoryId: 'economie' },
  'solidarites-protection-sociale': { id: 'solidarites', label: 'Solidarités & protection sociale', icon: '🫱', categoryId: 'economie' },

  sante: { id: 'sante', label: 'Santé', icon: '🏥', categoryId: 'education_sante' },
  'education-culture': { id: 'education', label: 'Éducation & culture', icon: '🎓', categoryId: 'education_sante' },
  'numerique-tech': { id: 'numerique', label: 'Numérique & tech', icon: '💻', categoryId: 'education_sante' },

  'logement-urbanisme': { id: 'logement', label: 'Logement & urbanisme', icon: '🏠', categoryId: 'cadre_vie' },
  transports: { id: 'transports', label: 'Transports', icon: '🚆', categoryId: 'cadre_vie' },
  'environnement-energie': { id: 'environnement', label: 'Environnement & énergie', icon: '🌱', categoryId: 'cadre_vie' },
  'agriculture-alimentation': { id: 'agriculture', label: 'Agriculture & alimentation', icon: '🌾', categoryId: 'cadre_vie' },

  'securite-justice': { id: 'securite', label: 'Sécurité & justice', icon: '⚖️', categoryId: 'regalien' },
  immigration: { id: 'immigration', label: 'Immigration', icon: '🌍', categoryId: 'regalien' },
  'affaires-etrangeres-defense': { id: 'defense', label: 'Affaires étrangères & défense', icon: '🛡️', categoryId: 'regalien' },
  institutions: { id: 'institutions', label: 'Institutions', icon: '🏛️', categoryId: 'regalien' },
};

const CATEGORIES = [
  { id: 'economie', label: 'Économie & social', icon: '💶' },
  { id: 'education_sante', label: 'Santé, éducation & numérique', icon: '🎓' },
  { id: 'cadre_vie', label: 'Cadre de vie & environnement', icon: '🏠' },
  { id: 'regalien', label: 'Régalien & institutions', icon: '⚖️' },
];

// Identifiants stables et initiales, par nom tel qu'il apparaît dans l'export.
// Les identifiants reprennent ceux déjà utilisés par l'app quand le candidat
// y figurait, pour que les photos existantes restent associées.
const CANDIDAT_META = {
  'Gabriel Attal': { id: 'attal', initials: 'GA' },
  'Bernard Cazeneuve': { id: 'cazeneuve', initials: 'BC' },
  'Jérôme Guedj': { id: 'guedj', initials: 'JG' },
  'Anasse Kazib': { id: 'kazib', initials: 'AK' },
  'Marine Le Pen': { id: 'lepen', initials: 'MLP' },
  'David Lisnard': { id: 'lisnard', initials: 'DL' },
  'Jean-Luc Mélenchon': { id: 'melenchon', initials: 'JLM' },
  'Édouard Philippe': { id: 'philippe', initials: 'EP' },
  'Bruno Retailleau': { id: 'retailleau', initials: 'BR' },
  'François Ruffin': { id: 'ruffin', initials: 'FR' },
  'Marine Tondelier': { id: 'tondelier', initials: 'MT' },
  'Nathalie Arthaud': { id: 'arthaud', initials: 'NA' },
  'Clara Egger': { id: 'egger', initials: 'CE' },
  'Antoine Mikolajczak': { id: 'mikolajczak', initials: 'AM' },
  'Nicolas Dupont-Aignan': { id: 'dupont_aignan', initials: 'NDA' },
  'Raphaël Glucksmann': { id: 'glucksmann', initials: 'RG' },
  'Xavier Bertrand': { id: 'bertrand', initials: 'XB' },
  'Dominique de Villepin': { id: 'villepin', initials: 'DDV' },
};

// Libellés de partis harmonisés (l'export donne parfois un sigle brut).
const PARTI_LABEL = {
  Renaissance: 'Renaissance',
  'La Convention': 'La Convention',
  PS: 'Parti socialiste',
  'Révolution permanente': 'Révolution permanente',
  RN: 'Rassemblement national',
  'Nouvelle Énergie': 'Nouvelle Énergie',
  LFI: 'La France insoumise',
  Horizons: 'Horizons',
  LR: 'Les Républicains',
  'Nous président': 'Nous président',
  EELV: 'Les Écologistes',
  'Nous France': 'Nous France',
  'Place publique': 'Place publique',
  // Le site n'affiche que le sigle ; sa notice donne le nom complet.
  LFH: 'La France humaniste',
};

// Identifiants dont une explication existe déjà, pour les préférer au tirage
// du vivier. L'identifiant dérivant du texte de la mesure, une mesure encore
// présente sur le site retrouve exactement le même.
const EXPLICATIONS = (() => {
  const f = path.join(OUT, 'proposalExplanations.ts');
  if (!fs.existsSync(f)) return new Set();
  const src = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  return new Set([...src.matchAll(/^ {2}'([a-z0-9-]+)':/gm)].map((m) => m[1]));
})();

function dejaExplique(mesure) {
  const meta = CANDIDAT_META[mesure.nom];
  if (!meta) return false;
  return EXPLICATIONS.has(`${meta.id}-${mesure.themeId}-${slugifyId(mesure.texte).slice(0, 32)}`);
}

function slugifyId(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

// Échappe une chaîne pour l'insérer entre apostrophes simples dans du TS.
function q(str) {
  if (str === undefined || str === null) return undefined;
  return `'${String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

  // 1. Aplatir l'export (thème > candidat > mesures) en une liste de mesures.
  const toutes = [];
  for (const theme of raw.themes) {
    const meta = THEME_META[theme.theme_slug];
    if (!meta) throw new Error(`Thème inconnu dans l'export : ${theme.theme_slug}`);
    for (const cand of theme.candidats) {
      for (const mesure of cand.mesures || []) {
        const texte = (mesure.texte || '').trim();
        if (!texte) continue;
        // Le lien de chaque mesure commence par le slug du candidat sur
        // Poligraph : on le récupère ici plutôt que de le déduire du nom, pour
        // que le lien vers sa fiche soit toujours celui du site.
        const fiche = (mesure.url_fiche || '').split('/mesures/')[1] || null;
        toutes.push({
          slugSource: fiche,
          themeId: meta.id,
          themeSlug: theme.theme_slug,
          nom: cand.nom,
          parti: cand.parti,
          texte,
          precision: mesure.precision_code || null,
          detailUrl: mesure.url_fiche || null,
          source: (mesure.sources || [])[0] || null,
        });
      }
    }
  }

  // 1 bis. Fusionner les candidats récupérés séparément, ramenés à la même
  //        forme. Le fichier est facultatif : sans lui, la génération se
  //        poursuit avec le seul export, et le contrôle du ROSTER plus bas
  //        signalera les candidats manquants.
  if (fs.existsSync(AJOUTS)) {
    const ajouts = JSON.parse(fs.readFileSync(AJOUTS, 'utf8'));
    for (const cand of ajouts.candidats || []) {
      const meta = CANDIDATS_AJOUTES[cand.slug];
      if (!meta) throw new Error(`Candidat ajouté sans métadonnées : ${cand.slug}`);
      for (const mesure of cand.mesures || []) {
        const themeMeta = THEME_META[mesure.themeSlug];
        if (!themeMeta) continue; // thème absent de l'app
        const texte = (mesure.texte || '').trim();
        if (!texte) continue;
        toutes.push({
          slugSource: mesure.fiche,
          themeId: themeMeta.id,
          themeSlug: mesure.themeSlug,
          nom: meta.nom,
          parti: meta.parti,
          texte,
          // La qualification n'est pas publiée sur le site : elle reste vide
          // plutôt que d'être devinée (voir scripts/fetch-candidates.js).
          precision: null,
          detailUrl: `https://poligraph.fr/elections/presidentielle-2027/mesures/${mesure.fiche}`,
          source: mesure.source
            ? { type: mesure.source.type, date: mesure.source.date, url: mesure.source.url }
            : null,
        });
      }
    }
  }

  // 2. Dédoublonner (l'export contient quelques textes identiques), et écarter
  //    ce que la carte ne peut pas afficher.
  const vus = new Set();
  const uniques = toutes.filter((m) => {
    if (m.texte.length < LONGUEUR_MIN || m.texte.length > LONGUEUR_MAX) return false;
    const cle = `${m.nom}::${m.texte.toLowerCase()}`;
    if (vus.has(cle)) return false;
    vus.add(cle);
    return true;
  });

  // 3. Regrouper par candidat, écarter ceux sous le seuil.
  const parCandidat = new Map();
  for (const m of uniques) {
    if (!parCandidat.has(m.nom)) parCandidat.set(m.nom, []);
    parCandidat.get(m.nom).push(m);
  }

  // Deux conditions, dans cet ordre : figurer dans la liste éditoriale, ET
  // avoir assez de mesures pour que le quota soit tenable. La seconde n'est
  // pas redondante — un candidat de la liste dont la source aurait retiré des
  // mesures produirait un paquet déséquilibré en silence.
  const retenus = [];
  const ecartes = [];
  for (const [nom, mesures] of parCandidat) {
    const dansListe = Object.prototype.hasOwnProperty.call(ROSTER, nom);
    (dansListe && mesures.length >= MIN_MESURES ? retenus : ecartes).push({ nom, mesures });
  }

  const manquants = Object.keys(ROSTER).filter((nom) => !retenus.some((r) => r.nom === nom));
  if (manquants.length) {
    throw new Error(
      `Candidats de la liste sans assez de mesures disponibles : ${manquants.join(', ')}.\n` +
        `Lancer d'abord : node scripts/fetch-candidates.js <slug>`
    );
  }
  retenus.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  ecartes.sort((a, b) => b.mesures.length - a.mesures.length);

  // 4. Pour chaque candidat retenu, choisir QUOTA mesures réparties sur ses
  //    thèmes (tourniquet), en privilégiant les textes de longueur lisible.
  const ordreThemes = Object.values(THEME_META).map((t) => t.id);

  const selection = [];
  for (const { mesures } of retenus) {
    const parTheme = new Map();
    for (const m of mesures) {
      if (!parTheme.has(m.themeId)) parTheme.set(m.themeId, []);
      parTheme.get(m.themeId).push(m);
    }
    // Tri déterministe. Les mesures DÉJÀ EXPLIQUÉES passent devant : chaque
    // proposition du vivier demande une explication et deux arguments écrits
    // à la main, et régénérer les données ne doit pas jeter ce travail sans
    // raison. À défaut, on préfère les longueurs proches de l'idéal, puis
    // l'ordre alphabétique pour lever les ex aequo.
    for (const liste of parTheme.values()) {
      liste.sort((a, b) => {
        const dejaA = dejaExplique(a) ? 0 : 1;
        const dejaB = dejaExplique(b) ? 0 : 1;
        if (dejaA !== dejaB) return dejaA - dejaB;
        const scoreA = noteLongueur(a.texte);
        const scoreB = noteLongueur(b.texte);
        if (scoreA !== scoreB) return scoreA - scoreB;
        return a.texte.localeCompare(b.texte, 'fr');
      });
    }

    const choisies = [];
    let tour = 0;
    while (choisies.length < POOL_PAR_CANDIDAT) {
      let ajoutTour = 0;
      for (const themeId of ordreThemes) {
        const liste = parTheme.get(themeId);
        if (!liste || liste.length <= tour) continue;
        choisies.push(liste[tour]);
        ajoutTour++;
        if (choisies.length >= POOL_PAR_CANDIDAT) break;
      }
      if (ajoutTour === 0) break; // plus rien à prendre
      tour++;
    }
    selection.push(...choisies);
  }

  // 5. Ordre final stable : par thème (ordre éditorial), puis par candidat.
  selection.sort((a, b) => {
    const ta = ordreThemes.indexOf(a.themeId);
    const tb = ordreThemes.indexOf(b.themeId);
    if (ta !== tb) return ta - tb;
    if (a.nom !== b.nom) return a.nom.localeCompare(b.nom, 'fr');
    return a.texte.localeCompare(b.texte, 'fr');
  });

  // 6. Identifiants de propositions, uniques et stables.
  const idsUtilises = new Set();
  for (const m of selection) {
    const meta = CANDIDAT_META[m.nom];
    if (!meta) throw new Error(`Candidat sans identifiant défini : ${m.nom}`);
    let base = `${meta.id}-${m.themeId}-${slugifyId(m.texte).slice(0, 32)}`;
    let id = base;
    let n = 2;
    while (idsUtilises.has(id)) id = `${base}-${n++}`;
    idsUtilises.add(id);
    m.id = id;
    m.candidateId = meta.id;
  }

  ecrireFichiers({ raw, selection, retenus, ecartes });
  rapport({ raw, uniques, selection, retenus, ecartes });
}

// Plus la note est basse, meilleure est la longueur.
function noteLongueur(texte) {
  const n = texte.length;
  if (n < LONGUEUR_MIN || n > LONGUEUR_MAX) return 1_000_000 + Math.abs(n - LONGUEUR_IDEALE);
  return Math.abs(n - LONGUEUR_IDEALE);
}

function ecrireFichiers({ raw, selection, retenus }) {
  const entete = (quoi) =>
    `// FICHIER GÉNÉRÉ — ne pas modifier à la main.\n` +
    `// Source : ${raw.source}\n` +
    `// Export du ${raw.extrait_le} · ${raw.licence}\n` +
    `// Régénérer avec : node scripts/generate-data.js\n` +
    `// (${quoi})\n\n`;

  // --- categories.ts ---
  const categories =
    entete('regroupement éditorial des thèmes, pour l’écran de sélection') +
    `import { Category } from '../types';\n\n` +
    `export const CATEGORIES: Category[] = [\n` +
    CATEGORIES.map((c) => `  { id: ${q(c.id)}, label: ${q(c.label)}, icon: ${q(c.icon)} },`).join('\n') +
    `\n];\n\n` +
    `export const CATEGORIES_BY_ID: Record<string, Category> = Object.fromEntries(\n` +
    `  CATEGORIES.map((c) => [c.id, c])\n);\n`;
  fs.writeFileSync(path.join(OUT, 'categories.ts'), categories, 'utf8');

  // --- themes.ts (uniquement les thèmes réellement représentés) ---
  const themesPresents = new Set(selection.map((m) => m.themeId));
  const themes = Object.values(THEME_META).filter((t) => themesPresents.has(t.id));
  const themesTs =
    entete('les 15 thèmes de l’export Poligraph') +
    `import { ThemeTag } from '../types';\n\n` +
    `export const THEMES: ThemeTag[] = [\n` +
    themes
      .map(
        (t) =>
          `  { id: ${q(t.id)}, label: ${q(t.label)}, icon: ${q(t.icon)}, categoryId: ${q(t.categoryId)} },`
      )
      .join('\n') +
    `\n];\n\n` +
    `export const THEMES_BY_ID: Record<string, ThemeTag> = Object.fromEntries(\n` +
    `  THEMES.map((t) => [t.id, t])\n);\n`;
  fs.writeFileSync(path.join(OUT, 'themes.ts'), themesTs, 'utf8');

  // --- candidates.ts ---
  const partiParNom = new Map();
  const slugParNom = new Map();
  for (const m of selection) {
    if (!partiParNom.has(m.nom)) partiParNom.set(m.nom, m.parti);
    if (m.slugSource) {
      const connu = slugParNom.get(m.nom);
      if (!connu) slugParNom.set(m.nom, m.slugSource);
      else {
        // Plus long préfixe commun entre deux liens du même candidat.
        let i = 0;
        while (i < connu.length && i < m.slugSource.length && connu[i] === m.slugSource[i]) i++;
        slugParNom.set(m.nom, connu.slice(0, i));
      }
    }
  }
  const candidatsTs =
    entete(
      `${retenus.length} candidats retenus : ceux ayant au moins ${MIN_MESURES} mesures publiées`
    ) +
    `import { Candidate } from '../types';\n\n` +
    `export const CANDIDATES: Candidate[] = [\n` +
    retenus
      .map(({ nom }) => {
        const meta = CANDIDAT_META[nom];
        const parti = partiParNom.get(nom);
        const label = PARTI_LABEL[parti] || parti || 'Sans étiquette';
        const slug = (slugParNom.get(nom) || '').replace(/-+$/, '');
        const slugField = slug ? `, poligraphSlug: ${q(slug)}` : '';
        return `  { id: ${q(meta.id)}, name: ${q(nom)}, initials: ${q(meta.initials)}, party: ${q(label)}${slugField} },`;
      })
      .join('\n') +
    `\n];\n\n` +
    `export const CANDIDATES_BY_ID: Record<string, Candidate> = Object.fromEntries(\n` +
    `  CANDIDATES.map((c) => [c.id, c])\n);\n`;
  fs.writeFileSync(path.join(OUT, 'candidates.ts'), candidatsTs, 'utf8');

  // --- proposals.ts ---
  const lignes = selection.map((m) => {
    const champs = [
      `    id: ${q(m.id)},`,
      `    themeId: ${q(m.themeId)},`,
      `    candidateId: ${q(m.candidateId)},`,
      `    text: ${q(m.texte)},`,
    ];
    if (m.precision === 'CHIFFREE') champs.push(`    precision: 'chiffree',`);
    else if (m.precision === 'OBJECTIF_SANS_CHIFFRE') champs.push(`    precision: 'non_chiffree',`);
    if (m.source?.type) champs.push(`    sourceType: ${q(m.source.type)},`);
    if (m.source?.date) champs.push(`    sourceDate: ${q(m.source.date)},`);
    if (m.source?.url) champs.push(`    sourceUrl: ${q(m.source.url)},`);
    if (m.detailUrl) champs.push(`    detailUrl: ${q(m.detailUrl)},`);
    return `  {\n${champs.join('\n')}\n  },`;
  });

  const proposalsTs =
    entete(
      `${selection.length} propositions — ${QUOTA_PAR_CANDIDAT} par candidat, réparties sur ses thèmes`
    ) +
    `import { Proposal } from '../types';\n\n` +
    `export const PROPOSALS: Proposal[] = [\n${lignes.join('\n')}\n];\n\n` +
    `export const PROPOSALS_BY_ID: Record<string, Proposal> = Object.fromEntries(\n` +
    `  PROPOSALS.map((p) => [p.id, p])\n);\n`;
  fs.writeFileSync(path.join(OUT, 'proposals.ts'), proposalsTs, 'utf8');
}

function rapport({ uniques, selection, retenus, ecartes }) {
  console.log(`Mesures uniques dans l'export : ${uniques.length}`);
  console.log(`Candidats retenus (>= ${MIN_MESURES} mesures) : ${retenus.length}`);
  console.log(`Propositions générées : ${selection.length}\n`);

  const parCand = {};
  const parTheme = {};
  for (const m of selection) {
    parCand[m.nom] = (parCand[m.nom] || 0) + 1;
    parTheme[m.themeId] = (parTheme[m.themeId] || 0) + 1;
  }
  console.log('Par candidat :');
  for (const [n, v] of Object.entries(parCand).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.padEnd(24)} ${v}`);
  }
  console.log('\nPar thème :');
  for (const [t, v] of Object.entries(parTheme).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(16)} ${v}`);
  }
  // Deux motifs bien distincts, qu'il ne faut pas confondre dans le rapport :
  // un candidat peut avoir publié des centaines de mesures et ne pas figurer
  // dans la liste éditoriale.
  console.log('\nCandidats écartés (hors liste, ou trop peu de mesures) :');
  for (const { nom, mesures } of ecartes) console.log(`  ${nom.padEnd(24)} ${mesures.length}`);

  const longueurs = selection.map((m) => m.texte.length).sort((a, b) => a - b);
  console.log(
    `\nLongueur des textes retenus : min ${longueurs[0]} / médiane ${
      longueurs[Math.floor(longueurs.length / 2)]
    } / max ${longueurs[longueurs.length - 1]}`
  );
}

main();
