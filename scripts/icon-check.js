#!/usr/bin/env node
/**
 * Contrôles sur les fichiers d'icônes réellement écrits.
 *
 *   node scripts/icon-check.js
 *
 * Ce qu'un coup d'œil ne dit pas : que les liserés entre les cartes sont de
 * VRAIS trous. Peints en violet, ils auraient l'air corrects sur l'icône iOS
 * et se verraient sur Android dès que l'utilisateur applique une icône
 * thématique ou un calque de fond différent. On le vérifie sur les pixels.
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ASSETS = path.join(__dirname, '..', 'assets');
const VIOLET = [91, 79, 233];

function load(name) {
  return PNG.sync.read(fs.readFileSync(path.join(ASSETS, name)));
}

function stats(png) {
  let opaque = 0;
  let clear = 0;
  let partial = 0;
  for (let i = 3; i < png.data.length; i += 4) {
    const a = png.data[i];
    if (a === 255) opaque++;
    else if (a === 0) clear++;
    else partial++;
  }
  const total = png.width * png.height;
  return { opaque, clear, partial, total };
}

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`  ${ok ? 'OK  ' : 'ÉCHEC'} ${label.padEnd(46)} ${detail}`);
  if (!ok) failures++;
};

console.log('\nDimensions et format');
const expected = {
  'icon.png': 1024,
  'android-icon-foreground.png': 1024,
  'android-icon-background.png': 1024,
  'android-icon-monochrome.png': 1024,
  'splash-icon.png': 512,
  'favicon.png': 196,
};
for (const [name, size] of Object.entries(expected)) {
  const png = load(name);
  check(name, png.width === size && png.height === size, `${png.width}×${png.height}`);
}

console.log('\nOpacité');
const icon = load('icon.png');
const iconStats = stats(icon);
check(
  'icon.png entièrement opaque (exigence iOS)',
  iconStats.clear === 0 && iconStats.partial === 0,
  `${iconStats.opaque}/${iconStats.total} pixels pleins`
);

for (const name of ['android-icon-foreground.png', 'android-icon-monochrome.png', 'splash-icon.png']) {
  const s = stats(load(name));
  const ratio = (s.clear / s.total) * 100;
  check(`${name} sur fond transparent`, s.clear > s.total * 0.4, `${ratio.toFixed(0)} % de pixels vides`);
}

console.log('\nLes liserés sont-ils de vrais trous ?');
// On échantillonne le liseré entre deux cartes. S'il était peint, on y
// trouverait du violet opaque au lieu de la transparence.
const fg = load('android-icon-foreground.png');
let paintedGap = 0;
let realGap = 0;
for (let i = 0; i < fg.data.length; i += 4) {
  const [r, g, b, a] = [fg.data[i], fg.data[i + 1], fg.data[i + 2], fg.data[i + 3]];
  if (a < 200) continue;
  const isViolet =
    Math.abs(r - VIOLET[0]) < 24 && Math.abs(g - VIOLET[1]) < 24 && Math.abs(b - VIOLET[2]) < 24;
  if (isViolet) paintedGap++;
}
// Un trou traversant : au centre géométrique d'un liseré, l'avant-plan doit
// être transparent alors que l'icône iOS y est violette.
for (let y = 0; y < fg.height; y++) {
  for (let x = 0; x < fg.width; x++) {
    const i = (y * fg.width + x) * 4;
    if (fg.data[i + 3] !== 0) continue;
    const j = (y * icon.width + x) * 4;
    const isViolet =
      Math.abs(icon.data[j] - VIOLET[0]) < 24 &&
      Math.abs(icon.data[j + 1] - VIOLET[1]) < 24 &&
      Math.abs(icon.data[j + 2] - VIOLET[2]) < 24;
    if (isViolet) realGap++;
  }
}
check('aucun violet peint dans l’avant-plan', paintedGap === 0, `${paintedGap} pixel(s) violet(s)`);
check('les liserés traversent bien', realGap > 10000, `${realGap} pixels évidés`);

console.log('\nCalque monochrome');
// Android ne garde que l'alpha et applique sa propre couleur : le calque doit
// être d'une seule encre, sinon la marque perd ses séparations une fois
// recolorée.
const mono = load('android-icon-monochrome.png');
const inks = new Set();
for (let i = 0; i < mono.data.length; i += 4) {
  if (mono.data[i + 3] < 250) continue;
  inks.add(`${mono.data[i]},${mono.data[i + 1]},${mono.data[i + 2]}`);
}
check('une seule encre (le système la remplace)', inks.size === 1, `${inks.size} encre(s) : ${[...inks].join(' ')}`);

console.log(
  failures === 0 ? '\nTous les contrôles passent.\n' : `\n${failures} contrôle(s) en échec.\n`
);
process.exit(failures === 0 ? 0 : 1);
