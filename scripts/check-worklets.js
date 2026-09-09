#!/usr/bin/env node
/**
 * Cherche les appels de fonction ordinaire à l'intérieur d'un worklet.
 *
 *   node scripts/check-worklets.js
 *
 * POURQUOI CE CONTRÔLE EXISTE.
 *
 * Un worklet (le corps d'un `useAnimatedStyle`, d'un `useDerivedValue`...)
 * part s'exécuter sur le fil de l'interface, avec tout ce qu'il capture. Les
 * valeurs font le voyage. Les fonctions ordinaires, non : elles arrivent
 * là-bas sous forme d'objet, et l'appel plante à l'exécution —
 * « X is not a function (it is Object) ».
 *
 * Le piège tient à ce que rien ne le signale avant l'appareil :
 *
 *  - TypeScript voit un appel parfaitement typé ;
 *  - eslint n'a pas de règle là-dessus dans cette configuration ;
 *  - les tests tournent avec la simulation de Reanimated, qui exécute les
 *    worklets sur place, donc sans sérialisation ;
 *  - le rendu web n'a qu'un seul fil, donc le problème n'y existe pas.
 *
 * C'est exactement ce qui s'est produit : remplacer `STEP_HEIGHTS[rank]` par
 * `stepHeight(rank)` dans le podium a passé les quatre filets et cassé l'app
 * au lancement du dévoilement.
 *
 * La règle : dans un worklet, on lit des valeurs. Ce qui doit être calculé par
 * une fonction se calcule AVANT, dans le corps du composant, et le worklet
 * n'en capture que le résultat.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

// Ce qu'un worklet peut appeler sans risque : les objets natifs, toujours
// présents sur le fil de l'interface, et les fabriques de Reanimated, qui
// sont elles-mêmes des worklets.
const SURS = new Set([
  'Math', 'Number', 'String', 'Array', 'Object', 'JSON', 'Date', 'Boolean',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'withTiming', 'withSpring', 'withDelay', 'withRepeat', 'withSequence', 'withDecay',
  'interpolate', 'interpolateColor', 'runOnJS', 'runOnUI', 'cancelAnimation',
  'Easing', 'Extrapolation', 'requestAnimationFrame', 'clearAnimation',
]);

// Les entrées qui ouvrent un worklet.
const OUVREURS = /\b(useAnimatedStyle|useDerivedValue|useAnimatedProps|useAnimatedReaction|useAnimatedScrollHandler|useFrameCallback)\s*\(/;

function fichiers(dossier) {
  return fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const complet = path.join(dossier, e.name);
    if (e.isDirectory()) return fichiers(complet);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [complet] : [];
  });
}

const problemes = [];
let worklets = 0;

for (const fichier of fichiers(SRC)) {
  const lignes = fs.readFileSync(fichier, 'utf8').split('\n');
  let profondeur = 0;
  let dedans = false;

  lignes.forEach((ligne, i) => {
    if (!dedans && OUVREURS.test(ligne)) {
      dedans = true;
      profondeur = 0;
      worklets++;
    }
    if (!dedans) return;

    for (const c of ligne) {
      if (c === '(' || c === '{') profondeur++;
      if (c === ')' || c === '}') profondeur--;
    }

    // Un appel : un identifiant suivi d'une parenthèse. On ignore ce qui est
    // précédé d'un point (`Math.min`, `liste.map`) : la propriété est portée
    // par un objet, qui lui traverse.
    for (const m of ligne.matchAll(/(^|[^.\w$])([a-zA-Z_$][\w$]*)\s*\(/g)) {
      const nom = m[2];
      if (SURS.has(nom)) continue;
      if (['if', 'for', 'while', 'switch', 'return', 'function', 'catch', 'typeof'].includes(nom)) continue;
      if (OUVREURS.test(nom + '(')) continue;
      problemes.push({
        fichier: path.relative(path.join(__dirname, '..'), fichier),
        ligne: i + 1,
        nom,
        texte: ligne.trim().slice(0, 100),
      });
    }

    if (profondeur <= 0) dedans = false;
  });
}

console.log(`  ${worklets} worklet(s) inspecté(s) dans src/`);

if (problemes.length === 0) {
  console.log('  OK   aucun appel de fonction ordinaire dans un worklet');
  console.log('');
  console.log('Worklets sains.');
  process.exit(0);
}

for (const p of problemes) {
  console.log(`  FAIL ${p.fichier}:${p.ligne} — appel « ${p.nom}(...) » dans un worklet`);
  console.log(`       ${p.texte}`);
}
console.log('');
console.log(
  `${problemes.length} appel(s) risqué(s). Calculer la valeur avant le worklet, ` +
    `ou marquer la fonction avec la directive worklet.`
);
process.exit(1);
