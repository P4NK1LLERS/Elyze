#!/usr/bin/env node
/**
 * Récupère les résumés biographiques des candidats depuis Wikipédia et écrit
 * src/data/candidateBios.ts.
 *
 *   node scripts/fetch-bios.js
 *
 * Pourquoi passer par Wikipédia plutôt que d'écrire ces notices : l'app parle
 * de personnes réelles. Un texte rédigé de mémoire y glisserait tôt ou tard
 * une date ou un mandat faux, sans que rien ne le signale. Le résumé de
 * Wikipédia est sourcé, daté, corrigible, et son article est cité dans la
 * fiche — le lecteur peut vérifier.
 *
 * Licence : le texte de Wikipédia est sous CC BY-SA 4.0. L'attribution et le
 * lien vers l'article sont affichés dans l'app (voir CandidateInfoDialog).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, '..', 'src', 'data', 'candidateBios.ts');
const UA = 'elyze-app/1.0 (perso)';

// Identifiant du candidat dans l'app -> titre de l'article sur fr.wikipedia.
// Doit rester aligné sur ROSTER dans generate-data.js : un candidat sans
// notice ici verrait sa fiche s'ouvrir sans biographie.
const ARTICLES = {
  attal: 'Gabriel Attal',
  bertrand: 'Xavier Bertrand',
  cazeneuve: 'Bernard Cazeneuve',
  glucksmann: 'Raphaël Glucksmann',
  lepen: 'Marine Le Pen',
  melenchon: 'Jean-Luc Mélenchon',
  philippe: 'Édouard Philippe',
  retailleau: 'Bruno Retailleau',
  ruffin: 'François Ruffin',
  tondelier: 'Marine Tondelier',
  villepin: 'Dominique de Villepin',
};

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA } }, (res) => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} ${url}`));
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function q(str) {
  return `'${String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

(async () => {
  const entries = [];

  for (const [id, title] of Object.entries(ARTICLES)) {
    const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const j = await getJson(url);
    if (!j.extract) throw new Error(`Aucun résumé pour ${title}`);
    entries.push({
      id,
      role: j.description || null,
      summary: j.extract.trim(),
      article: j.content_urls?.desktop?.page || `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    });
    console.log(`${id.padEnd(12)} ${j.extract.length} caractères`);
    // Wikimedia limite le débit : on espace les appels.
    await new Promise((r) => setTimeout(r, 1200));
  }

  const body =
    `// FICHIER GÉNÉRÉ — ne pas modifier à la main.\n` +
    `// Résumés issus de Wikipédia en français, sous licence CC BY-SA 4.0.\n` +
    `// L'app ne rédige aucune notice elle-même : elle cite la source et lie\n` +
    `// vers l'article, qui reste la référence à jour.\n` +
    `// Régénérer avec : node scripts/fetch-bios.js\n\n` +
    `export type CandidateBio = {\n` +
    `  // Description courte ("femme politique française").\n` +
    `  role: string | null;\n` +
    `  // Premier paragraphe de l'article.\n` +
    `  summary: string;\n` +
    `  article: string;\n` +
    `};\n\n` +
    `export const CANDIDATE_BIOS: Record<string, CandidateBio> = {\n` +
    entries
      .map(
        (e) =>
          `  ${e.id}: {\n` +
          `    role: ${e.role ? q(e.role) : 'null'},\n` +
          `    summary: ${q(e.summary)},\n` +
          `    article: ${q(e.article)},\n` +
          `  },`
      )
      .join('\n') +
    `\n};\n`;

  fs.writeFileSync(OUT, body, 'utf8');
  console.log(`\n${entries.length} notices écrites dans src/data/candidateBios.ts`);
})();
