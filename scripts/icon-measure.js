/**
 * Contrôle géométrique des pistes de logo.
 *
 *   node scripts/icon-measure.js
 *
 * Deux choses qu'on ne peut pas juger à l'œil :
 *
 *  1. Le CENTRAGE OPTIQUE. Une marque inclinée n'est presque jamais centrée
 *     quand ses coordonnées le sont : on mesure la boîte englobante réelle
 *     des pixels opaques et l'écart au centre de la toile.
 *
 *  2. La ZONE SÛRE ANDROID. Le système masque l'icône adaptative et ne
 *     garantit qu'un cercle central de 66 % du côté, soit un rayon de 338 px
 *     sur 1024. Ce qui compte est le point de la marque LE PLUS ÉLOIGNÉ du
 *     centre — un coin de carte inclinée, typiquement, pas son bord.
 */

const { Canvas } = require('./icon-lib');
const { CONCEPTS } = require('./icon-concepts');

const SIZE = 1024;
const SAFE_RADIUS = (SIZE * 0.66) / 2; // 337.9 px

function measure(concept) {
  // Sur fond transparent : seuls les pixels de la marque comptent.
  const c = new Canvas(SIZE);
  concept.draw(c, { hole: null });

  let minX = SIZE, minY = SIZE, maxX = -1, maxY = -1, maxR = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (c.a[y * SIZE + x] < 0.5) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const r = Math.hypot(x + 0.5 - SIZE / 2, y + 0.5 - SIZE / 2);
      if (r > maxR) maxR = r;
    }
  }

  return {
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    offsetX: (minX + maxX) / 2 - SIZE / 2,
    offsetY: (minY + maxY) / 2 - SIZE / 2,
    maxR,
  };
}

console.log('piste                        largeur×hauteur   décentrage    rayon max   zone sûre Android');
console.log('─'.repeat(94));

for (const concept of CONCEPTS) {
  const m = measure(concept);
  const fits = m.maxR <= SAFE_RADIUS;
  const centred = Math.abs(m.offsetX) <= 6 && Math.abs(m.offsetY) <= 6;
  console.log(
    concept.label.padEnd(28) +
      `${String(m.w).padStart(4)}×${String(m.h).padEnd(4)}     ` +
      `${(m.offsetX >= 0 ? '+' : '') + m.offsetX.toFixed(0).padStart(4)},${(m.offsetY >= 0 ? '+' : '') + m.offsetY.toFixed(0).padStart(4)}` +
      (centred ? '  ' : ' !') +
      `   ${m.maxR.toFixed(0).padStart(5)}      ` +
      (fits ? `OK (marge ${(SAFE_RADIUS - m.maxR).toFixed(0)} px)` : `DÉBORDE de ${(m.maxR - SAFE_RADIUS).toFixed(0)} px`)
  );
}

console.log('─'.repeat(94));
console.log(`zone sûre : rayon ${SAFE_RADIUS.toFixed(0)} px  ·  « ! » = décentrage optique supérieur à 6 px`);
