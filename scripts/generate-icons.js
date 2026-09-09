#!/usr/bin/env node
/**
 * Fabrique les six icônes de l'app à partir d'une piste de logo.
 *
 *   node scripts/generate-icons.js            → la piste retenue (paquet)
 *   node scripts/generate-icons.js monogramme → une autre piste
 *
 * Les pistes vivent dans icon-concepts.js, celles écartées comprises : changer
 * de logo tient en un argument, et les alternatives restent consultables
 * plutôt que d'avoir à être redessinées.
 *
 * Chaque format a ses contraintes propres :
 *
 *  - icon.png (iOS) : opaque, le système n'arrondit que les coins. La marque
 *    peut donc être plus généreuse que sur Android.
 *
 *  - android-icon-foreground / monochrome : la marque seule sur fond
 *    transparent, et les liserés entre les cartes doivent être de VRAIS trous
 *    — c'est le calque de fond qui doit apparaître au travers, pas du violet
 *    peint par-dessus. Le calque monochrome est en plus recoloré par le
 *    système : seul son canal alpha compte.
 *
 *  - splash-icon.png : posé par Expo sur #5B4FE9 en clair et #121016 en
 *    sombre (voir app.json). Transparent, donc, pour tenir sur les deux.
 */

const fs = require('fs');
const path = require('path');
const { Canvas } = require('./icon-lib');
const { computeFit, TARGET_RADIUS } = require('./icon-fit');
const { CONCEPTS, VIOLET } = require('./icon-concepts');

const ASSETS = path.join(__dirname, '..', 'assets');

const wanted = process.argv[2] || 'paquet';
const concept = CONCEPTS.find((c) => c.id === wanted);
if (!concept) {
  console.error(`Piste inconnue : « ${wanted} ». Disponibles : ${CONCEPTS.map((c) => c.id).join(', ')}`);
  process.exit(1);
}

// Le masque d'Android impose son cercle ; iOS non. La marque est donc posée
// plus grande là où rien ne la rogne, sinon l'icône iOS paraît flotter au
// milieu de son carré.
const fitAndroid = computeFit(concept.draw, TARGET_RADIUS);
const fitFull = computeFit(concept.draw, TARGET_RADIUS * 1.18);

// Marque sur fond violet plein.
function solid(fit) {
  const c = new Canvas(1024).background(VIOLET).setTransform(fit);
  concept.draw(c, { hole: VIOLET });
  return c;
}

// Marque seule, liserés réellement évidés.
function cutout(fit) {
  const c = new Canvas(1024).setTransform(fit);
  concept.draw(c, { hole: null });
  return c;
}

const files = [
  { name: 'icon.png', size: 1024, make: () => solid(fitFull) },
  { name: 'favicon.png', size: 196, make: () => solid(fitFull) },
  { name: 'splash-icon.png', size: 512, make: () => cutout(fitFull) },
  { name: 'android-icon-foreground.png', size: 1024, make: () => cutout(fitAndroid) },
  { name: 'android-icon-monochrome.png', size: 1024, make: () => cutout(fitAndroid) },
  {
    name: 'android-icon-background.png',
    size: 1024,
    make: () => new Canvas(1024).background(VIOLET),
  },
];

console.log(`Piste : ${concept.label}\n`);

for (const file of files) {
  const canvas = file.make();
  const out = canvas.size === file.size ? canvas : canvas.resize(file.size);
  const bytes = out.toPng();
  fs.writeFileSync(path.join(ASSETS, file.name), bytes);
  console.log(
    `  ${file.name.padEnd(30)} ${String(file.size).padStart(4)}px  ${(bytes.length / 1024).toFixed(1).padStart(6)} Ko`
  );
}

console.log('\nSix fichiers écrits dans assets/.');
