#!/usr/bin/env node
/**
 * Récupère les mesures de candidats absents de l'export Poligraph et écrit
 * poligraph_candidats_ajoutes.json, dans la même forme que l'export.
 *
 *   node scripts/fetch-candidates.js raphael-glucksmann xavier-bertrand ...
 *
 * Pourquoi ce script existe : l'export local date du 29 août 2026 et Poligraph
 * a depuis publié les programmes de plusieurs candidats qui n'y figuraient pas
 * (Glucksmann n'avait aucune mesure, il en a 310). Aucun point d'entrée d'API
 * ne redonne l'export complet — la documentation n'expose que les affaires,
 * les politiques et les fact-checks. On lit donc les pages publiques.
 *
 * Deux niveaux de lecture, parce que la donnée est répartie :
 *
 *  - la liste paginée d'un candidat porte le thème, le texte et le lien de
 *    chaque mesure, vingt par page ;
 *  - la précision (« objectif chiffré ») et la source ne figurent que sur la
 *    fiche de chaque mesure, qu'il faut donc ouvrir une par une.
 *
 * Le fichier produit est FUSIONNÉ avec l'export d'origine par
 * generate-data.js : l'export reste intact, et on voit d'un coup d'œil quelles
 * données viennent d'où.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, '..', 'poligraph_candidats_ajoutes.json');
const BASE = 'https://poligraph.fr/elections/presidentielle-2027';
const UA = 'elyze-app/1.0 (perso)';

// Poligraph est un service bénévole : on espace les appels.
const DELAI_MS = 1200;

// Libellé de thème sur le site -> slug de thème dans l'export. Les thèmes
// absents de cette table (« Société, droits et libertés », apparu depuis) sont
// ignorés : l'app n'en a pas.
const THEME_SLUGS = {
  'Logement et urbanisme': 'logement-urbanisme',
  Santé: 'sante',
  'Emploi et travail': 'emploi-travail',
  Retraites: 'retraites',
  'Solidarités et protection sociale': 'solidarites-protection-sociale',
  'Économie et budget': 'economie-budget',
  'Environnement et énergie': 'environnement-energie',
  'Sécurité et justice': 'securite-justice',
  'Éducation et culture': 'education-culture',
  Immigration: 'immigration',
  Transports: 'transports',
  'Agriculture et alimentation': 'agriculture-alimentation',
  'Numérique et technologies': 'numerique-tech',
  'Affaires étrangères et défense': 'affaires-etrangeres-defense',
  Institutions: 'institutions',
};

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA } }, (res) => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} ${url}`));
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(body));
      })
      .on('error', reject);
  });
}

const pause = () => new Promise((r) => setTimeout(r, DELAI_MS));

// Next.js pousse le rendu dans self.__next_f sous forme de chaînes échappées.
function payloadOf(html) {
  let out = '';
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)) {
    try {
      out += JSON.parse('"' + m[1] + '"');
    } catch {
      // Fragment tronqué : sans importance, les mesures sont réparties sur
      // plusieurs fragments et un seul illisible n'en perd qu'une poignée.
    }
  }
  return out;
}

// Lecture d'une liste de mesures.
//
// On part des LIENS de fiche et on remonte vers le texte, plutôt que de
// décrire la suite « thème puis texte puis lien » par un seul motif. Cette
// première version perdait les deux tiers des mesures de certains candidats :
// beaucoup portent des étiquettes supplémentaires (« Santé mentale »,
// « Justice ») insérées entre le texte et le lien, ce qui repoussait celui-ci
// hors de la fenêtre de recherche. Remonter depuis le lien est insensible à
// ce qui s'intercale.
const LIEN_RE = /"href":"\/elections\/presidentielle-2027\/mesures\/([a-z0-9-]+)"/g;
const TEXTE_RE = /max-w-\[75ch\][^}]*?"children":"((?:[^"\\]|\\.)*)"/g;
const THEME_RE = /uppercase[^}]*?"children":"([^"]+)"/g;

// Dernière occurrence d'un motif dans une portion de texte.
function dernier(re, portion) {
  let trouve = null;
  re.lastIndex = 0;
  for (const m of portion.matchAll(re)) trouve = m;
  return trouve;
}

function parseListe(payload) {
  const out = [];
  const vus = new Set();

  for (const lien of payload.matchAll(LIEN_RE)) {
    const fiche = lien[1];
    if (vus.has(fiche)) continue;

    // Fenêtre large en amont : elle doit contenir le texte et son thème, quel
    // que soit le nombre d'étiquettes intercalées.
    const debut = Math.max(0, lien.index - 4000);
    const amont = payload.slice(debut, lien.index);

    const texteMatch = dernier(TEXTE_RE, amont);
    if (!texteMatch) continue;
    const texte = JSON.parse('"' + texteMatch[1] + '"').trim();
    if (texte.length < 20) continue;

    // Le thème est le dernier libellé en capitales AVANT le texte : ceux qui
    // suivent sont les étiquettes de la mesure.
    const themeMatch = dernier(THEME_RE, amont.slice(0, texteMatch.index));
    if (!themeMatch) continue;
    const themeLabel = themeMatch[1].trim();
    if (!THEME_SLUGS[themeLabel]) continue;

    vus.add(fiche);
    out.push({ themeLabel, themeSlug: THEME_SLUGS[themeLabel], texte, fiche });
  }
  return out;
}

async function mesuresDe(slug, maxPages) {
  const vues = new Map();
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? `${BASE}/candidats/${slug}/mesures` : `${BASE}/candidats/${slug}/mesures?page=${page}`;
    const payload = payloadOf(await get(url));
    const lot = parseListe(payload);
    const avant = vues.size;
    for (const m of lot) if (!vues.has(m.fiche)) vues.set(m.fiche, m);
    process.stdout.write(`\r  ${slug} — page ${page}, ${vues.size} mesures`);
    // Page vide, ou aucune nouveauté : on est au bout.
    if (lot.length === 0 || vues.size === avant) break;
    await pause();
  }
  process.stdout.write('\n');
  return [...vues.values()];
}

// La fiche d'une mesure porte sa qualification et son document d'origine.
//
// L'extraction est volontairement ancrée sur la SECTION « sources » de la
// page. Une première version cherchait la première date du document : elle
// ramassait la date de mise à jour du site, la même pour toutes les mesures.
// Une date fausse est pire qu'une date absente, l'app affirmant alors quelque
// chose d'inexact sur la mesure de quelqu'un.
function parseFiche(payload) {
  // La qualification de l'engagement (« objectif chiffré ») n'est PAS
  // récupérable : elle figure dans l'export machine de Poligraph mais n'est
  // affichée nulle part sur les pages publiques — vérifié sur une mesure dont
  // l'export dit qu'elle est chiffrée, aucun libellé correspondant sur sa
  // fiche. On la laisse donc vide plutôt que de la déduire du texte : l'app
  // n'affiche cette pastille que sur l'affirmation de la source, pour que ce
  // qui est écrit soit toujours vrai (voir data/source.ts). Conséquence
  // assumée : les mesures ajoutées par ce script n'afficheront jamais la
  // pastille, comme les 960 mesures non qualifiées de l'export.
  const precision = null;

  // La section commence à id":"sources" ; on s'arrête au premier bloc, qui
  // est la source principale.
  const debut = payload.indexOf('"id":"sources"');
  const bloc = debut === -1 ? '' : payload.slice(debut, debut + 2500);

  // « Source primaire · Interview de presse » : deux libellés successifs,
  // séparés par un point médian. Le second est le type de document.
  const libelles = [...bloc.matchAll(/"children":"([^"·]{3,60})"\}\]/g)].map((m) => m[1]);
  const type = libelles.find((l) => l !== 'Source primaire' && l !== 'Source secondaire' && l !== 'Sources') ?? null;

  const date = bloc.match(/"Publiée le ","([^"]+)"/);
  const url = bloc.match(/"href":"(https?:\/\/(?!poligraph\.fr)[^"]+)"/);

  return {
    precision,
    source: {
      type,
      date: date ? date[1] : null,
      url: url ? url[1] : null,
    },
  };
}

(async () => {
  const args = process.argv.slice(2);
  const pagesArg = args.find((a) => a.startsWith('--pages='));
  const sansFiches = args.includes('--sans-fiches');
  const maxPages = pagesArg ? parseInt(pagesArg.split('=')[1], 10) : 40;
  const slugs = args.filter((a) => !a.startsWith('--'));

  if (slugs.length === 0) {
    console.error('Usage : node scripts/fetch-candidates.js [--pages=N] [--sans-fiches] <slug>...');
    process.exit(1);
  }

  const resultat = { extrait_le: new Date().toISOString().slice(0, 10), source: BASE, candidats: [] };

  for (const slug of slugs) {
    console.log(`\n${slug}`);
    const mesures = await mesuresDe(slug, maxPages);

    if (sansFiches) {
      // La carte n'affiche plus ni la provenance ni le lien vers la fiche
      // (celui-ci révélait l'auteur par son adresse). Ouvrir 300 fiches pour
      // des champs que rien n'affiche coûterait dix minutes pour rien.
      console.log(`  ${mesures.length} mesures listées, fiches non ouvertes`);
      for (const m of mesures) {
        m.precision = null;
        m.source = { type: null, date: null, url: null };
      }
    } else {
      console.log(`  ${mesures.length} mesures listées, lecture des fiches...`);
      let i = 0;
      for (const m of mesures) {
        i++;
        try {
          const detail = parseFiche(payloadOf(await get(`${BASE}/mesures/${m.fiche}`)));
          m.precision = detail.precision;
          m.source = detail.source;
        } catch {
          m.precision = null;
          m.source = { type: null, date: null, url: null };
        }
        process.stdout.write(`\r  fiches ${i}/${mesures.length}`);
        await pause();
      }
      process.stdout.write('\n');
    }

    resultat.candidats.push({ slug, mesures });
  }

  fs.writeFileSync(OUT, JSON.stringify(resultat, null, 1), 'utf8');
  console.log(`\nÉcrit : poligraph_candidats_ajoutes.json`);
  resultat.candidats.forEach((c) => {
    const parTheme = {};
    for (const m of c.mesures) parTheme[m.themeSlug] = (parTheme[m.themeSlug] || 0) + 1;
    console.log(`  ${c.slug.padEnd(24)} ${String(c.mesures.length).padStart(4)} mesures sur ${Object.keys(parTheme).length} thèmes`);
  });
})();
