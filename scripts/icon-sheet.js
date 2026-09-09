/**
 * Planche de contact des pistes de logo.
 *
 *   node scripts/icon-sheet.js
 *
 * Chaque piste est rendue en 1024 puis rééchantillonnée, et présentée à
 * quatre tailles : grande, taille d'écran d'accueil (180), taille de liste
 * (96) et taille de favicon (48). Un logo se juge petit — c'est là qu'il vit.
 */

const fs = require('fs');
const path = require('path');
const { Canvas } = require('./icon-lib');
const { computeFit } = require('./icon-fit');
const { CONCEPTS, VIOLET } = require('./icon-concepts');

const OUT = path.join(__dirname, '..', 'assets', 'logo-planche.png');

const SIZES = [256, 180, 96, 48];
const PAD = 26;
const ROW = 256 + PAD;

const WIDTH = PAD + SIZES.reduce((n, s) => n + s + PAD, 0);
const HEIGHT = PAD + CONCEPTS.length * ROW;

const sheet = new Canvas(WIDTH, HEIGHT).background('#15131C');

CONCEPTS.forEach((concept, i) => {
  // Cadrage mesuré, pas estimé : chaque marque est centrée optiquement et
  // mise à l'échelle pour remplir la zone sûre d'Android.
  const full = new Canvas(1024).background(VIOLET).setTransform(computeFit(concept.draw));
  concept.draw(full);

  let x = PAD;
  const rowTop = PAD + i * ROW;
  for (const s of SIZES) {
    // Alignées par le bas de la rangée, pour comparer les tailles entre elles.
    sheet.paste(full.resize(s), x, rowTop + (256 - s));
    x += s + PAD;
  }
});

fs.writeFileSync(OUT, sheet.toPng());
console.log(`Planche : assets/logo-planche.png — ${WIDTH}×${HEIGHT}`);
console.log('Tailles par rangée :', SIZES.join(' · '), 'px');
CONCEPTS.forEach((c, i) => console.log(`  rangée ${i + 1} — ${c.label}`));
