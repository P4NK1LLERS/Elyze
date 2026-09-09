/**
 * Page de comparaison des pistes de logo.
 *
 *   node scripts/icon-preview.js
 *
 * Les images intégrées dans la page sont les PNG RÉELLEMENT PRODUITS par le
 * rastériseur, encodés en data URI — pas une reconstitution en SVG qui
 * pourrait diverger de ce qui finira dans l'app. Ce qu'on voit est ce qu'on
 * livre, aux pixels près.
 */

const fs = require('fs');
const path = require('path');
const { Canvas } = require('./icon-lib');
const { computeFit, extent } = require('./icon-fit');
const { CONCEPTS, VIOLET } = require('./icon-concepts');

// Dans docs/ et non assets/ : cette planche est un outil de travail, elle
// n'est chargee par rien dans l'app. assets/ ne contient que ce que l'app lit.
const OUT = path.join(__dirname, '..', 'docs', 'logo-preview.html');

function dataUri(canvas) {
  return `data:image/png;base64,${canvas.toPng().toString('base64')}`;
}

// Icône complète (fond violet), telle qu'elle sera livrée pour iOS.
function iconAt(concept, size) {
  const c = new Canvas(1024).background(VIOLET).setTransform(computeFit(concept.draw));
  concept.draw(c);
  return size === 1024 ? c : c.resize(size);
}

// Marque seule sur fond transparent : c'est le calque monochrome d'Android,
// que le système recolore selon le fond d'écran. On produit vraiment les deux
// encres plutôt que de recolorer par un filtre CSS, dont le rendu exact
// n'est pas garanti d'un navigateur à l'autre.
function markAt(concept, size, ink = '#FFFFFF') {
  const c = new Canvas(1024).setTransform(computeFit(concept.draw));
  concept.draw(c, { hole: null });
  if (ink !== '#FFFFFF') {
    // Le calque monochrome est plein : on remplace l'encre en gardant l'alpha.
    const [r, g, b] = require('./icon-lib').hexToRgb(ink);
    for (let i = 0; i < c.width * c.height; i++) {
      if (c.a[i] <= 0) continue;
      c.r[i] = r;
      c.g[i] = g;
      c.b[i] = b;
    }
  }
  return size === 1024 ? c : c.resize(size);
}

const rows = CONCEPTS.map((concept) => {
  const fit = computeFit(concept.draw);
  const e = extent(concept.draw, fit);
  return {
    id: concept.id,
    label: concept.label,
    note: concept.note,
    big: dataUri(iconAt(concept, 256)),
    s180: dataUri(iconAt(concept, 180)),
    s96: dataUri(iconAt(concept, 96)),
    s48: dataUri(iconAt(concept, 48)),
    mark: dataUri(markAt(concept, 160)),
    markDark: dataUri(markAt(concept, 160, '#17161E')),
    // Toutes les marques sont ramenées au même rayon par le cadrage
    // automatique : c'est leur emprise réelle qui les distingue.
    box: `${Math.round(e.w)} × ${Math.round(e.h)}`,
  };
});

// Le logo actuel, pour comparaison honnête.
const current = fs.readFileSync(path.join(__dirname, '..', 'assets', 'icon.png'));
const currentUri = `data:image/png;base64,${current.toString('base64')}`;

const html = `<title>Le logo d’Élyze</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans+Condensed:wght@600&family=IBM+Plex+Sans:wght@400;600;700&display=swap">
<style>
  :root {
    color-scheme: light dark;
    --ground: #FBFAFC;
    --surface: #FFFFFF;
    --sunken: #F3F2F7;
    --line: rgba(23,22,30,.10);
    --ink: #17161E;
    --ink-2: #4A4857;
    --ink-3: #6F6D7B;
    --accent: #5B4FE9;
    --accent-ink: #4638C2;
    --ok: #0E7A3D;
    --shadow: 0 1px 2px rgba(23,22,30,.04), 0 10px 30px rgba(23,22,30,.07);
    --measure: 64ch;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #121016; --surface: #1C1A22; --sunken: #26242E;
      --line: rgba(255,255,255,.11);
      --ink: #F6F5F8; --ink-2: #C4C2CE; --ink-3: #9694A2;
      --accent: #A79EFF; --accent-ink: #B9B2FF; --ok: #4FD68C;
      --shadow: 0 1px 2px rgba(0,0,0,.3), 0 10px 30px rgba(0,0,0,.3);
    }
  }
  :root[data-theme="dark"] {
    --ground: #121016; --surface: #1C1A22; --sunken: #26242E;
    --line: rgba(255,255,255,.11);
    --ink: #F6F5F8; --ink-2: #C4C2CE; --ink-3: #9694A2;
    --accent: #A79EFF; --accent-ink: #B9B2FF; --ok: #4FD68C;
    --shadow: 0 1px 2px rgba(0,0,0,.3), 0 10px 30px rgba(0,0,0,.3);
  }

  * { box-sizing: border-box; }
  body {
    background: var(--ground);
    color: var(--ink);
    font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
    font-size: 16px; line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .page { max-width: 880px; margin: 0 auto; padding: 56px 28px 96px; }
  h1, h2, h3 { margin: 0; text-wrap: balance; }
  code, .mono { font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace; font-variant-numeric: tabular-nums; }
  .eyebrow {
    font-family: "IBM Plex Sans Condensed", sans-serif; font-weight: 600;
    font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3);
  }

  header { padding-bottom: 30px; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 14px; }
  header h1 { font-size: clamp(28px, 5vw, 40px); font-weight: 700; letter-spacing: -.028em; line-height: 1.12; }
  header p { margin: 0; max-width: var(--measure); font-size: 17px; color: var(--ink-2); }

  .now { display: flex; align-items: center; gap: 20px; margin: 30px 0 0; padding: 20px 22px;
         background: var(--sunken); border-radius: 14px; }
  .now img { width: 72px; height: 72px; border-radius: 17px; display: block; }
  .now div { flex: 1; min-width: 0; }
  .now p { margin: 3px 0 0; font-size: 15px; color: var(--ink-2); }

  .list { list-style: none; padding: 0; margin: 40px 0 0; display: flex; flex-direction: column; gap: 22px; }
  .item {
    background: var(--surface); border: 1px solid var(--line); border-radius: 16px;
    padding: 26px; box-shadow: var(--shadow);
    display: grid; grid-template-columns: 256px 1fr; gap: 28px; align-items: start;
  }
  .item > img { width: 256px; height: 256px; border-radius: 58px; display: block; }
  .body { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .item h3 { font-size: 21px; font-weight: 700; letter-spacing: -.02em; }
  .item p { margin: 0; font-size: 15.5px; color: var(--ink-2); max-width: var(--measure); }

  .sizes { display: flex; align-items: flex-end; gap: 18px; padding-top: 4px; }
  .sizes figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 7px; }
  .sizes img { display: block; border-radius: 22.5%; }
  .sizes figcaption { font-family: "IBM Plex Mono", monospace; font-size: 11px; color: var(--ink-3); }

  .checks { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding-top: 4px; }
  .mono-chip { display: flex; align-items: center; gap: 9px; padding: 7px 12px 7px 7px; border-radius: 999px; font-size: 12.5px; color: var(--ink-2); }
  .mono-chip img { width: 34px; height: 34px; display: block; }
  .on-light { background: #E9E8EF; color: #17161E; }
  .on-dark  { background: #221F2B; color: #F6F5F8; }

  .safe { font-family: "IBM Plex Mono", monospace; font-size: 12.5px; color: var(--ok); }

  footer { margin-top: 64px; padding-top: 22px; border-top: 1px solid var(--line); max-width: var(--measure); }
  footer p { font-size: 14px; color: var(--ink-3); margin: 10px 0 0; }

  @media (max-width: 720px) {
    .page { padding: 40px 18px 72px; }
    .item { grid-template-columns: 1fr; gap: 20px; }
    .item > img { width: 180px; height: 180px; border-radius: 41px; }
  }
</style>

<div class="page">
  <header>
    <span class="eyebrow">Élyze 2027 · identité</span>
    <h1>Cinq pistes pour remplacer le cœur</h1>
    <p>
      Le logo actuel dit « application de rencontre ». Voici cinq marques tirées de ce que
      l’app fait vraiment : on parcourt un paquet de cartes, une proposition à la fois, sans
      savoir qui la porte. Chacune est présentée à la taille où un logo se joue — 48 px.
      <strong>La piste A a été retenue et installée</strong> ; les autres restent dessinées,
      et changer d’avis tient à un argument de ligne de commande.
    </p>
  </header>

  <div class="now">
    <img src="${currentUri}" alt="Le logo actuel : un cœur blanc sur fond violet">
    <div>
      <span class="eyebrow">Aujourd’hui</span>
      <p>Un cœur plein. Juste, pour un « j’adhère » — mais c’est le symbole d’un tout autre
      genre d’app, et il ne dit rien des propositions ni du paquet à parcourir.</p>
    </div>
  </div>

  <ul class="list">
${rows
  .map(
    (r) => `    <li class="item">
      <img src="${r.big}" alt="${r.label}">
      <div class="body">
        <h3>${r.label}</h3>
        <p>${r.note}</p>
        <div class="sizes">
          <figure><img src="${r.s180}" width="88" height="88" alt=""><figcaption>écran d’accueil</figcaption></figure>
          <figure><img src="${r.s96}" width="64" height="64" alt=""><figcaption>liste</figcaption></figure>
          <figure><img src="${r.s48}" width="48" height="48" alt=""><figcaption>48 px réels</figcaption></figure>
        </div>
        <div class="checks">
          <span class="mono-chip on-dark"><img src="${r.mark}" alt="">icône thématique Android</span>
          <span class="mono-chip on-light"><img src="${r.markDark}" alt="">sur fond clair</span>
          <span class="safe">tient dans le masque Android · emprise ${r.box}</span>
        </div>
      </div>
    </li>`
  )
  .join('\n')}
  </ul>

  <footer>
    <span class="eyebrow">Comment c’est fabriqué</span>
    <p>
      Aucun outil de conversion d’image n’étant installé, ces marques sont dessinées
      directement par un rastériseur écrit pour l’occasion : chaque forme est décrite par sa
      fonction de distance, ce qui donne un anticrénelage exact sur les diagonales des cartes
      inclinées. Le cadrage n’est pas réglé à l’œil — la boîte englobante réelle de chaque
      marque est mesurée, puis la marque est recentrée et mise à l’échelle pour remplir le
      cercle que le masque d’Android garantit.
    </p>
    <p>
      Les images de cette page sont les PNG produits par ce rastériseur, intégrés tels quels.
      Ce que tu vois est exactement ce qui sera livré.
    </p>
  </footer>
</div>
`;

fs.writeFileSync(OUT, html, 'utf8');
console.log(`Page écrite : docs/logo-preview.html (${(html.length / 1024).toFixed(0)} Ko)`);
rows.forEach((r) => console.log(`  ${r.label.padEnd(30)} emprise ${r.box}`));
