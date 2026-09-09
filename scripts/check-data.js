#!/usr/bin/env node
/**
 * Contrôles d'intégrité sur les données générées (scripts/generate-data.js).
 * Lit les fichiers TS en texte : pas de compilation nécessaire.
 *
 *   node scripts/check-data.js
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'src', 'data');
const read = (f) => fs.readFileSync(path.join(DATA, f), 'utf8');

// Extrait les valeurs d'un champ `nom: '...'` en gérant les apostrophes échappées.
function pluck(src, field) {
  const re = new RegExp(`${field}: '((?:[^'\\\\]|\\\\.)*)'`, 'g');
  return [...src.matchAll(re)].map((m) => m[1].replace(/\\'/g, "'"));
}

const proposals = read('proposals.ts');
const candidates = read('candidates.ts');
const themes = read('themes.ts');
const categories = read('categories.ts');
const colors = read('themeColors.ts');

const problemes = [];
const ok = [];

// --- Identifiants connus ---
const candidateIds = new Set(pluck(candidates, 'id'));
const themeIds = new Set(pluck(themes, 'id'));
const categoryIds = new Set(pluck(categories, 'id'));

// --- Propositions ---
const blocs = proposals.split(/\n  \{\n/).slice(1);
const propIds = pluck(proposals, 'id');
const propThemes = pluck(proposals, 'themeId');
const propCands = pluck(proposals, 'candidateId');
const propTexts = pluck(proposals, 'text');

if (new Set(propIds).size !== propIds.length) problemes.push('identifiants de propositions dupliqués');
else ok.push(`${propIds.length} identifiants de propositions uniques`);

const themesInconnus = [...new Set(propThemes.filter((t) => !themeIds.has(t)))];
if (themesInconnus.length) problemes.push(`themeId inconnus : ${themesInconnus.join(', ')}`);
else ok.push('tous les themeId référencés existent');

const candsInconnus = [...new Set(propCands.filter((c) => !candidateIds.has(c)))];
if (candsInconnus.length) problemes.push(`candidateId inconnus : ${candsInconnus.join(', ')}`);
else ok.push('tous les candidateId référencés existent');

// --- Vivier par candidat -----------------------------------------------------
//
// Ce fichier n'est plus le paquet d'une partie mais le VIVIER dans lequel
// chaque session tire (voir src/utils/deck.ts). Il est donc volontairement
// inégal : on prend jusqu'à trente propositions par candidat, et ceux qui en
// ont publié moins gardent ce qu'ils ont.
//
// L'invariant à tenir ici n'est plus l'égalité des viviers, mais que CHACUN
// puisse fournir le quota d'une partie — sans quoi le tirage rabaisserait
// tout le monde à son niveau et raccourcirait le paquet. L'égalité du paquet
// lui-même est vérifiée par src/utils/deck.test.ts.
const QUOTA_PAR_CANDIDAT = 15;
const parCand = {};
for (const c of propCands) parCand[c] = (parCand[c] || 0) + 1;
const counts = Object.values(parCand);
const min = Math.min(...counts);
const max = Math.max(...counts);
const tropMaigres = Object.entries(parCand).filter(([, n]) => n < QUOTA_PAR_CANDIDAT);
if (tropMaigres.length) {
  problemes.push(
    `vivier insuffisant pour le quota de ${QUOTA_PAR_CANDIDAT} : ` +
      tropMaigres.map(([c, n]) => `${c} (${n})`).join(', ')
  );
} else {
  ok.push(
    `vivier suffisant pour tous : de ${min} à ${max} propositions, quota de ${QUOTA_PAR_CANDIDAT}`
  );
}

const sansProposition = [...candidateIds].filter((c) => !parCand[c]);
if (sansProposition.length) problemes.push(`candidats sans proposition : ${sansProposition.join(', ')}`);
else ok.push('aucun candidat sans proposition');

// --- Thèmes ---
const themesVides = [...themeIds].filter((t) => !propThemes.includes(t));
if (themesVides.length) problemes.push(`thèmes sans aucune proposition : ${themesVides.join(', ')}`);
else ok.push(`les ${themeIds.size} thèmes ont au moins une proposition`);

const catsInconnues = [...new Set(pluck(themes, 'categoryId').filter((c) => !categoryIds.has(c)))];
if (catsInconnues.length) problemes.push(`categoryId inconnus : ${catsInconnues.join(', ')}`);
else ok.push('toutes les catégories référencées existent');

// --- Couleurs de thème : une par thème, sinon la mosaïque retombe sur le repli ---
const couleursDefinies = new Set([...colors.matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1]));
const sansCouleur = [...themeIds].filter((t) => !couleursDefinies.has(t));
if (sansCouleur.length) problemes.push(`thèmes sans couleur dédiée : ${sansCouleur.join(', ')}`);
else ok.push('chaque thème a sa couleur de mosaïque');

// --- Textes ---
const vides = propTexts.filter((t) => t.trim().length < 20);
if (vides.length) problemes.push(`${vides.length} textes trop courts (< 20 caractères)`);
else ok.push('aucun texte de proposition trop court');

const dupTexts = propTexts.filter((t, i) => propTexts.indexOf(t) !== i);
if (dupTexts.length) problemes.push(`${dupTexts.length} textes de proposition dupliqués`);
else ok.push('aucun texte de proposition dupliqué');

// --- Explications ---------------------------------------------------------
//
// proposalExplanations.ts est écrit à la main, alors que proposals.ts est
// généré. Régénérer les données peut donc introduire des propositions sans
// explication, ou laisser des explications orphelines derrière des mesures
// disparues. Sans ce contrôle, la carte afficherait un bloc vide.
// Les fins de ligne du dépôt sont mixtes : on normalise avant de lire, sinon
// l'ancre `$` du motif tombe sur un retour chariot et ne trouve rien.
const explications = read('proposalExplanations.ts').replace(/\r\n/g, '\n');
const expEntries = [
  ...explications.matchAll(/^ {2}'([a-z0-9-]+)':\s*\n?\s*'((?:[^'\\]|\\.)*)',$/gm),
].map((m) => [m[1], m[2]]);
const expById = new Map(expEntries);

if (expEntries.length !== expById.size) problemes.push('clés d’explication dupliquées');

// L'explication est OBLIGATOIRE pour chaque proposition.
//
// Elle a été facultative un temps, et pour une bonne raison : la règle
// d'origine obligeait à remplir le cadre même sur une mesure limpide, et
// produisait des paraphrases (40 explications sur 165 reprenaient plus de
// 60 % du vocabulaire de leur mesure). Mais l'exception avait son propre
// coût : la carte annonce « EN CLAIR », et une fois sur deux il n'y avait
// rien. L'obligation revient donc AVEC le garde-fou anti-paraphrase, qui est
// plus bas dans ce fichier et qui n'existait pas la première fois. Les deux
// contrôles ne valent que pris ensemble : celui-ci exige une phrase, l'autre
// exige qu'elle apporte quelque chose.
const sansExplication = propIds.filter((id) => !expById.has(id));
if (sansExplication.length) {
  problemes.push(
    `${sansExplication.length} proposition(s) sans explication « en clair » : ` +
      `${sansExplication.slice(0, 3).join(', ')}...`
  );
} else {
  ok.push(`les ${propIds.length} propositions ont leur explication « en clair »`);
}

const orphelines = [...expById.keys()].filter((id) => !propIds.includes(id));
if (orphelines.length)
  problemes.push(`${orphelines.length} explication(s) sans proposition : ${orphelines.slice(0, 3).join(', ')}`);
else ok.push('aucune explication orpheline');

// La carte de swipe est une boîte de taille fixe : au-delà, le texte déborde.
const LIMITE = 160;
const tropLongues = expEntries.filter(([, t]) => t.length > LIMITE);
if (tropLongues.length)
  problemes.push(
    `${tropLongues.length} explication(s) de plus de ${LIMITE} caractères : ${tropLongues
      .map(([id, t]) => `${id} (${t.length})`)
      .slice(0, 3)
      .join(', ')}`
  );
else ok.push(`aucune explication au-dessus de ${LIMITE} caractères`);

// Une explication qui reprend le vocabulaire de sa mesure n'explique rien.
//
// Le contrôle porte sur les mots PLEINS : on ignore les mots-outils, et on
// mesure la part du vocabulaire de l'explication déjà présente dans la
// mesure. Au-delà du seuil, c'est une paraphrase — soit elle décode vraiment
// quelque chose, soit elle ne doit pas exister.
const MOTS_OUTILS = new Set(
  ('le la les un une des du de d a à au aux et ou en dans pour par sur avec sans sous ce cet ' +
    'cette ces son sa ses leur leurs qui que quoi dont où est sont être avoir plus moins tout ' +
    'tous toute toutes ne pas y il elle on nous vous ils elles se lui l s c n j m t qu chaque ' +
    'plutôt donc alors même aussi entre vers chez").split(/\\s+/)').split(/\s+/)
);
const motsPleins = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !MOTS_OUTILS.has(w));

const SEUIL_REDONDANCE = 0.6;
const redondantes = [];
propIds.forEach((id, i) => {
  const explication = expById.get(id);
  if (!explication) return;
  const mesure = new Set(motsPleins(propTexts[i]));
  const mots = motsPleins(explication);
  if (mots.length === 0) return;
  const part = mots.filter((w) => mesure.has(w)).length / mots.length;
  if (part >= SEUIL_REDONDANCE) redondantes.push(`${id} (${Math.round(part * 100)} %)`);
});
if (redondantes.length)
  problemes.push(
    `${redondantes.length} explication(s) paraphrasent leur mesure : ${redondantes.slice(0, 4).join(', ')}`
  );
else ok.push(`aucune explication ne paraphrase sa mesure (seuil ${SEUIL_REDONDANCE * 100} %)`);

// --- Arguments pour / contre -------------------------------------------------
//
// L'app y rapporte le débat existant, elle ne rend pas de verdict. Deux
// contraintes mécaniques valent mieux qu'une bonne intention :
//
//  - LES DEUX CÔTÉS OU AUCUN. Un argument seul ferait pencher l'app.
//  - AUCUN NOM DE CANDIDAT. Le paquet est aveugle : nommer quelqu'un dans un
//    argument révélerait l'auteur de la carte qu'on est en train de juger.
const argsFile = path.join(DATA, 'proposalArguments.ts');
if (fs.existsSync(argsFile)) {
  const argsSrc = read('proposalArguments.ts').replace(/\r\n/g, '\n');
  const blocs = [
    ...argsSrc.matchAll(
      /^ {2}'([a-z0-9-]+)': \{\n\s*pour:\s*\n?\s*'((?:[^'\\]|\\.)*)',\n\s*contre:\s*\n?\s*'((?:[^'\\]|\\.)*)',\n\s*\},$/gm
    ),
  ];
  const argsById = new Map(blocs.map((m) => [m[1], { pour: m[2], contre: m[3] }]));

  const sansArgs = propIds.filter((id) => !argsById.has(id));
  if (sansArgs.length)
    problemes.push(
      `${sansArgs.length} proposition(s) sans arguments : ${sansArgs.slice(0, 3).join(', ')}...`
    );
  else ok.push(`les ${propIds.length} propositions ont un argument pour et un contre`);

  const argsOrphelins = [...argsById.keys()].filter((id) => !propIds.includes(id));
  if (argsOrphelins.length)
    problemes.push(`${argsOrphelins.length} argument(s) sans proposition`);
  else ok.push('aucun argument orphelin');

  const LIMITE_ARG = 220;
  const trop = [...argsById.entries()].filter(
    ([, a]) => a.pour.length > LIMITE_ARG || a.contre.length > LIMITE_ARG
  );
  if (trop.length)
    problemes.push(`${trop.length} argument(s) de plus de ${LIMITE_ARG} caractères`);
  else ok.push(`aucun argument au-dessus de ${LIMITE_ARG} caractères`);

  // Symétrie des longueurs, PAR CANDIDAT.
  //
  // C'est le contrôle qui compte le plus, et le seul qui puisse attraper un
  // biais involontaire. Écrire systématiquement des objections plus longues
  // et plus fouillées pour un candidat que pour un autre ferait pencher
  // l'app sans que personne ne le remarque à la lecture d'une carte isolée.
  // On compare donc la longueur moyenne des deux camps, candidat par
  // candidat : l'écart doit rester dans le bruit.
  const ECART_MAX = 15;
  const parCandidat = {};
  for (const [id, a] of argsById) {
    const cand = id.split('-')[0];
    (parCandidat[cand] ??= { pour: 0, contre: 0, n: 0 });
    parCandidat[cand].pour += a.pour.length;
    parCandidat[cand].contre += a.contre.length;
    parCandidat[cand].n++;
  }
  const desequilibres = Object.entries(parCandidat)
    .map(([c, v]) => ({ c, ecart: v.contre / v.n - v.pour / v.n }))
    .filter((x) => Math.abs(x.ecart) > ECART_MAX);
  if (desequilibres.length) {
    problemes.push(
      `arguments déséquilibrés pour ${desequilibres.length} candidat(s) : ` +
        desequilibres.map((x) => `${x.c} (${x.ecart > 0 ? '+' : ''}${x.ecart.toFixed(0)})`).join(', ')
    );
  } else {
    const ecarts = Object.values(parCandidat).map((v) => Math.abs(v.contre / v.n - v.pour / v.n));
    ok.push(
      `arguments symétriques : écart pour/contre au plus ${Math.max(...ecarts).toFixed(0)} caractères par candidat`
    );
  }

  // Noms de famille des candidats du paquet : aucun ne doit apparaître.
  const noms = pluck(candidates, 'name').map((n) => n.split(' ').pop());
  const fuites = [];
  for (const [id, a] of argsById) {
    const texte = `${a.pour} ${a.contre}`;
    for (const nom of noms) if (nom.length > 3 && texte.includes(nom)) fuites.push(`${id} → ${nom}`);
  }
  if (fuites.length)
    problemes.push(`${fuites.length} argument(s) nomment un candidat : ${fuites.slice(0, 3).join(', ')}`);
  else ok.push('aucun argument ne nomme un candidat');
}

if (blocs.length !== propIds.length) {
  problemes.push(`incohérence : ${blocs.length} blocs pour ${propIds.length} identifiants`);
}

// --- Sigles ---
//
// Une mesure qui emploie un sigle sans le développer est illisible pour qui ne
// le connaît pas, et c'est exactement ce que la ligne « EN CLAIR » doit
// rattraper. La règle : tout sigle d'une proposition doit être développé SOIT
// dans la mesure elle-même, SOIT dans son explication.
//
// Les mesures sont citées mot pour mot et ne peuvent pas être corrigées : quand
// le sigle n'y est pas développé, c'est l'explication qui doit le faire.
{
  // Sigles d'usage courant, dont le développement n'apprendrait rien à
  // personne. Volontairement court : dans le doute, on explique.
  const COURANTS = new Set(['ONU', 'UE', 'GPS', 'SNCF', 'RATP', 'SMIC', 'PME', 'TPE']);
  const reSigle = /\b[A-ZÉÈÀÂÎÔÛ]{2,}(?:-[A-ZÉÈ0-9]+)*\b/g;

  const manquants = [];
  propIds.forEach((id, i) => {
    const texte = propTexts[i];
    const expl = expById.get(id);
    const sigles = [...new Set(texte.match(reSigle) || [])].filter((s) => !COURANTS.has(s));
    for (const sigle of sigles) {
      // Développé dans la mesure : le sigle y apparaît entre parenthèses, ou
      // l'explication le reprend.
      const dansLaMesure = texte.includes(`(${sigle})`);
      const dansExpl = expl ? expl.includes(sigle) : false;
      // Cas particulier : l'explication écrit le sens en toutes lettres sans
      // répéter le sigle (« intelligence artificielle » pour IA). On l'accepte,
      // c'est le but recherché.
      const EN_TOUTES_LETTRES = { IA: 'intelligence artificielle' };
      const developpeAilleurs =
        EN_TOUTES_LETTRES[sigle] && expl && expl.toLowerCase().includes(EN_TOUTES_LETTRES[sigle]);
      if (!dansLaMesure && !dansExpl && !developpeAilleurs) manquants.push(`${id} → ${sigle}`);
    }
  });

  if (manquants.length) {
    problemes.push(
      `${manquants.length} sigle(s) ni développés dans la mesure ni expliqués : ${manquants
        .slice(0, 4)
        .join(', ')}`
    );
  } else {
    ok.push('tout sigle est développé dans sa mesure ou expliqué en clair');
  }
}

// --- Les données face au code qui les affiche ---
//
// Les contrôles ci-dessus vérifient que les données sont cohérentes entre
// elles. Ceux-ci vérifient qu'elles sont encore cohérentes avec les constantes
// et les phrases qui, ailleurs dans l'app, prétendent les décrire. C'est le
// genre d'écart qu'aucun test ne voit et qu'aucun typage n'attrape : rien ne
// casse, l'app se contente de dire quelque chose de faux.
{
  const SRC = path.join(__dirname, '..', 'src');
  const lireSrc = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

  // 1. La carte dimensionne son texte sur un budget « nombre de caractères ×
  //    taille rendue », calibré sur la proposition la plus longue. Si une
  //    proposition dépasse cette calibration, le texte déborde de la carte.
  const swipeCard = lireSrc(path.join('components', 'SwipeCard.tsx'));
  const budget = swipeCard.match(/const TEXT_BUDGET = (\d+) \* \(fonts\.cardText - 2\)/);
  if (!budget) {
    problemes.push('TEXT_BUDGET introuvable dans SwipeCard.tsx (calibration non vérifiable)');
  } else {
    const calibre = Number(budget[1]);
    const plusLongue = Math.max(...propTexts.map((t) => t.length));
    if (plusLongue > calibre) {
      problemes.push(
        `une proposition fait ${plusLongue} caractères, au-delà de la calibration de la carte (${calibre})`
      );
    } else {
      ok.push(
        `calibration de la carte (${calibre}) couvre la plus longue proposition (${plusLongue})`
      );
    }
  }

  // 2. Deux écrans écrivent le quota en toutes lettres (« quinze propositions
  //    par candidat »). La valeur, elle, vit dans utils/deck.ts. Changer l'une
  //    sans l'autre fait mentir l'app sans rien casser.
  const deck = lireSrc(path.join('utils', 'deck.ts'));
  const quota = deck.match(/QUOTA_PAR_CANDIDAT = (\d+)/);
  const EN_LETTRES = { 15: 'quinze', 10: 'dix', 12: 'douze', 20: 'vingt' };
  if (!quota) {
    problemes.push('QUOTA_PAR_CANDIDAT introuvable dans utils/deck.ts');
  } else {
    const mot = EN_LETTRES[Number(quota[1])];
    const ecrans = [
      path.join('screens', 'HowItWorksScreen.tsx'),
      path.join('screens', 'ResultsScreen.tsx'),
    ];
    if (!mot) {
      problemes.push(
        `quota ${quota[1]} : ajouter son écriture en lettres dans check-data.js pour vérifier les écrans`
      );
    } else {
      const fautifs = ecrans.filter((f) => !lireSrc(f).includes(mot));
      if (fautifs.length) {
        problemes.push(
          `le quota est ${quota[1]} (« ${mot} ») mais ${fautifs.join(', ')} ne l'écrit plus ainsi`
        );
      } else {
        ok.push(`le quota (${quota[1]}) correspond au « ${mot} » écrit dans les deux écrans`);
      }
    }
  }
}

// --- Rapport ---
for (const l of ok) console.log('  OK   ' + l);
for (const l of problemes) console.log('  FAIL ' + l);
console.log('');
if (problemes.length) {
  console.log(`${problemes.length} problème(s) détecté(s).`);
  process.exit(1);
}
console.log('Données cohérentes.');
