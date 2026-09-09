/**
 * Cadrage automatique d'une marque.
 *
 * Une marque inclinée n'est presque jamais centrée quand ses coordonnées le
 * sont, et rien ne dit à l'œil à quelle taille elle remplit la zone sûre
 * d'Android. Plutôt que de tâtonner sur des constantes, on mesure : on rend
 * la marque, on relève la boîte englobante réelle de ses pixels opaques, puis
 * on en déduit la translation qui la centre et l'homothétie qui l'amène pile
 * au rayon voulu.
 *
 * Le résultat est réappliqué au moment du rendu final, ce qui garde le dessin
 * vectoriel — on ne redimensionne jamais une image déjà rastérisée.
 */

const { Canvas } = require('./icon-lib');

const SIZE = 1024;
// Android masque l'icône adaptative : seul un cercle central de 66 % du côté
// est garanti visible. On vise 94 % de ce rayon, pour garder un peu d'air.
const SAFE_RADIUS = (SIZE * 0.66) / 2;
const TARGET_RADIUS = SAFE_RADIUS * 0.94;

// Boîte englobante des pixels opaques, et distance du point le plus éloigné
// du centre — c'est ce rayon-là qui décide si la marque tient dans le masque,
// pas sa largeur (un coin de carte inclinée dépasse toujours son bord).
function extent(draw, transform) {
  const c = new Canvas(SIZE);
  if (transform) c.setTransform(transform);
  draw(c, { hole: null });

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

  if (maxX < 0) throw new Error('marque vide : rien de dessiné');
  return {
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    offsetX: (minX + maxX) / 2 - SIZE / 2,
    offsetY: (minY + maxY) / 2 - SIZE / 2,
    maxR,
  };
}

// Deux passes : on centre d'abord, puis on mesure le rayon DE LA MARQUE
// CENTRÉE pour calculer l'échelle. L'inverse donnerait un rayon faussé par le
// décentrage.
function computeFit(draw, targetRadius = TARGET_RADIUS) {
  const raw = extent(draw, null);
  const centred = { dx: -raw.offsetX, dy: -raw.offsetY, scale: 1 };

  const afterCentring = extent(draw, centred);
  const scale = targetRadius / afterCentring.maxR;

  // Le décalage est mesuré avant l'homothétie : il doit suivre l'échelle,
  // sinon la marque agrandie repart de travers.
  return { dx: centred.dx * scale, dy: centred.dy * scale, scale };
}

module.exports = { SIZE, SAFE_RADIUS, TARGET_RADIUS, extent, computeFit };
