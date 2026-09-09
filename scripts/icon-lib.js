/**
 * Petit rastériseur vectoriel, sans dépendance de rendu.
 *
 * Aucun outil de conversion SVG n'est installé sur cette machine (ni
 * ImageMagick, ni Inkscape, ni Pillow). Plutôt que d'ajouter une dépendance
 * lourde pour six fichiers PNG, on dessine directement : chaque forme est
 * décrite par sa FONCTION DE DISTANCE SIGNÉE, c'est-à-dire la distance en
 * pixels entre un point et le bord de la forme (négative à l'intérieur).
 *
 * L'intérêt : l'anticrénelage devient exact et gratuit. La couverture d'un
 * pixel vaut `0.5 - d` bornée à [0,1] — un pixel pile sur le bord est à 50 %,
 * un pixel à un demi-pixel dedans est plein. Pas de suréchantillonnage, pas
 * d'escalier sur les diagonales des cartes inclinées.
 */

const { PNG } = require('pngjs');

// --- Formes -----------------------------------------------------------------

// Rectangle arrondi, centré en (cx, cy), tourné de `angle` degrés.
// La rotation préserve les distances : la SDF reste exacte une fois le point
// ramené dans le repère de la forme.
function roundedRect({ cx, cy, w, h, r, angle = 0 }) {
  const rad = (-angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = w / 2 - r;
  const hh = h / 2 - r;

  return (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const u = dx * cos - dy * sin;
    const v = dx * sin + dy * cos;
    const qx = Math.abs(u) - hw;
    const qy = Math.abs(v) - hh;
    const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
    return outside + Math.min(Math.max(qx, qy), 0) - r;
  };
}

function circle({ cx, cy, r }) {
  return (x, y) => Math.hypot(x - cx, y - cy) - r;
}

// Anneau (cercle évidé) — sert au repère du bulletin.
function ring({ cx, cy, r, width }) {
  return (x, y) => Math.abs(Math.hypot(x - cx, y - cy) - r) - width / 2;
}

// Réunion de plusieurs formes : la distance est celle de la plus proche.
function union(...shapes) {
  return (x, y) => Math.min(...shapes.map((s) => s(x, y)));
}

// Intersection : on n'est dedans que si l'on est dedans partout, d'où le
// maximum des distances. Sert à l'amande de l'œil, qui est exactement le
// recouvrement de deux grands disques décalés — la façon dont un œil se
// construit géométriquement, plutôt qu'une ellipse approchée.
function intersect(...shapes) {
  return (x, y) => Math.max(...shapes.map((s) => s(x, y)));
}

// Différence : dans `shape`, mais hors de `cut`. Utilisée pour creuser la
// pupille et pour la barre oblique de l'œil barré.
//
// Attention, ces deux opérateurs ne rendent qu'une distance MINORÉE, non
// exacte, hors de la forme. C'est sans conséquence ici : le rendu ne lit la
// distance que dans la bande d'un demi-pixel autour du bord, où elle l'est.
function subtract(shape, cut) {
  return (x, y) => Math.max(shape(x, y), -cut(x, y));
}

// --- Toile ------------------------------------------------------------------

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}

class Canvas {
  constructor(width, height = width) {
    this.width = width;
    this.height = height;
    // `size` reste pratique pour les icônes, toujours carrées.
    this.size = width;
    // Canaux séparés en flottant : on compose proprement puis on quantifie
    // une seule fois, à l'écriture.
    // Transformation appliquée à toute forme dessinée ensuite. Sert au
    // recentrage optique et à la mise à l'échelle automatiques, mesurés puis
    // rejoués (voir icon-measure.js).
    this.t = { dx: 0, dy: 0, scale: 1, ox: width / 2, oy: height / 2 };
    const n = width * height;
    this.r = new Float64Array(n);
    this.g = new Float64Array(n);
    this.b = new Float64Array(n);
    this.a = new Float64Array(n);
  }

  // Remplit toute la toile (fond opaque des icônes iOS).
  background(hex) {
    const [r, g, b] = hexToRgb(hex);
    this.r.fill(r);
    this.g.fill(g);
    this.b.fill(b);
    this.a.fill(1);
    return this;
  }

  // Cadrage appliqué aux formes suivantes. `scale` est une homothétie autour
  // du centre de la toile, `dx`/`dy` un décalage en pixels.
  setTransform({ dx = 0, dy = 0, scale = 1 } = {}) {
    this.t = { dx, dy, scale, ox: this.width / 2, oy: this.height / 2 };
    return this;
  }

  // `mode` : 'over' pose la forme par-dessus, 'erase' la creuse (un trou
  // réellement transparent, indispensable pour le calque Android monochrome
  // où le système applique sa propre couleur).
  fill(rawShape, hex, { alpha = 1, mode = 'over' } = {}) {
    const [sr, sg, sb] = mode === 'erase' ? [0, 0, 0] : hexToRgb(hex);
    const n = this.width;
    const { dx, dy, scale, ox, oy } = this.t;
    const shape =
      dx === 0 && dy === 0 && scale === 1
        ? rawShape
        : (x, y) => rawShape(ox + (x - dx - ox) / scale, oy + (y - dy - oy) / scale) * scale;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < n; x++) {
        // Centre du pixel.
        const d = shape(x + 0.5, y + 0.5);
        if (d > 0.5) continue; // entièrement dehors
        const cov = Math.min(1, Math.max(0, 0.5 - d)) * alpha;
        if (cov <= 0) continue;

        const i = y * n + x;
        if (mode === 'erase') {
          this.a[i] *= 1 - cov;
          continue;
        }

        const da = this.a[i];
        const outA = cov + da * (1 - cov);
        if (outA <= 0) continue;
        const k = (da * (1 - cov)) / outA;
        this.r[i] = sr * (cov / outA) + this.r[i] * k;
        this.g[i] = sg * (cov / outA) + this.g[i] * k;
        this.b[i] = sb * (cov / outA) + this.b[i] * k;
        this.a[i] = outA;
      }
    }
    return this;
  }

  toPng() {
    const png = new PNG({ width: this.width, height: this.height });
    for (let i = 0; i < this.width * this.height; i++) {
      png.data[i * 4] = Math.round(this.r[i]);
      png.data[i * 4 + 1] = Math.round(this.g[i]);
      png.data[i * 4 + 2] = Math.round(this.b[i]);
      png.data[i * 4 + 3] = Math.round(this.a[i] * 255);
    }
    return PNG.sync.write(png, { deflateLevel: 9 });
  }

  // Rééchantillonnage par moyenne de boîte — sert à produire les petites
  // tailles depuis le rendu 1024, plutôt que de re-rastériser (une forme
  // dessinée directement en 48 px perdrait ses détails fins).
  resize(target) {
    const out = new Canvas(target);
    const ratio = this.width / target;
    for (let y = 0; y < target; y++) {
      for (let x = 0; x < target; x++) {
        let r = 0, g = 0, b = 0, a = 0, n = 0;
        const x0 = Math.floor(x * ratio);
        const y0 = Math.floor(y * ratio);
        const x1 = Math.min(this.width, Math.ceil((x + 1) * ratio));
        const y1 = Math.min(this.height, Math.ceil((y + 1) * ratio));
        for (let sy = y0; sy < y1; sy++) {
          for (let sx = x0; sx < x1; sx++) {
            const i = sy * this.width + sx;
            const av = this.a[i];
            // Moyenne pondérée par l'alpha : sans cela, les pixels
            // transparents tirent la couleur du bord vers le noir.
            r += this.r[i] * av;
            g += this.g[i] * av;
            b += this.b[i] * av;
            a += av;
            n++;
          }
        }
        const j = y * target + x;
        if (a > 0) {
          out.r[j] = r / a;
          out.g[j] = g / a;
          out.b[j] = b / a;
        }
        out.a[j] = a / n;
      }
    }
    return out;
  }

  // Colle une autre toile à une position donnée (planche de contact).
  paste(other, dx, dy) {
    for (let y = 0; y < other.height; y++) {
      for (let x = 0; x < other.width; x++) {
        const tx = dx + x;
        const ty = dy + y;
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) continue;
        const s = y * other.width + x;
        const i = ty * this.width + tx;
        const sa = other.a[s];
        if (sa <= 0) continue;
        const da = this.a[i];
        const outA = sa + da * (1 - sa);
        const k = (da * (1 - sa)) / outA;
        this.r[i] = other.r[s] * (sa / outA) + this.r[i] * k;
        this.g[i] = other.g[s] * (sa / outA) + this.g[i] * k;
        this.b[i] = other.b[s] * (sa / outA) + this.b[i] * k;
        this.a[i] = outA;
      }
    }
    return this;
  }
}

module.exports = { Canvas, roundedRect, circle, ring, union, intersect, subtract, hexToRgb };
