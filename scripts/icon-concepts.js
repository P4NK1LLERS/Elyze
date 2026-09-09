/**
 * Les pistes de logo, décrites une seule fois et réutilisées pour tous les
 * formats (iOS, calques Android, splash, favicon) et pour la planche de
 * contact qui sert à les comparer.
 *
 * Espace de dessin : 1024 × 1024, marque centrée en (512, 512). Les formats
 * plus petits sont produits par rééchantillonnage, jamais redessinés.
 *
 * Deux contraintes gouvernent ces dessins :
 *
 *  - Android masque l'icône adaptative et ne garantit qu'un cercle central
 *    d'environ 66 % du côté. C'est la DIAGONALE de la boîte englobante qui
 *    doit y tenir, pas sa largeur.
 *
 *  - Un logo se juge à 48 px. Les cartes empilées ne peuvent donc pas être
 *    distinguées par des nuances d'opacité — elles fusionnent en une tache.
 *    Chacune est séparée de la suivante par un LISERÉ du fond, creusé avant
 *    de la poser : la silhouette reste lisible à toutes les tailles.
 */

const { roundedRect, circle, ring, union, intersect, subtract } = require('./icon-lib');

const VIOLET = '#5B4FE9';
const WHITE = '#FFFFFF';

// Épaisseur du liseré qui sépare deux cartes.
const GAP = 22;

// Pose une carte en creusant d'abord son liseré. `hole` à null = mode
// découpe : le liseré devient un vrai trou transparent, ce qu'exigent le
// calque Android monochrome et l'avant-plan adaptatif.
function card(c, geom, { color = WHITE, hole = VIOLET, gap = GAP } = {}) {
  if (gap > 0) {
    const halo = { ...geom, w: geom.w + gap * 2, h: geom.h + gap * 2, r: geom.r + gap };
    if (hole === null) c.fill(roundedRect(halo), WHITE, { mode: 'erase' });
    else c.fill(roundedRect(halo), hole);
  }
  c.fill(roundedRect(geom), color);
}

// Pile de cartes : même inclinaison pour toutes, décalées d'un pas régulier
// en diagonale, comme un paquet posé de travers sur une table.
//
// Deux mises en page ont été rendues puis écartées avant celle-ci :
//
//  - l'éventail (cartes pivotant autour d'un point bas commun) : elles y
//    divergent en haut mais convergent en bas, où elles se réduisent à des
//    éclats pointus, et la masse tombe dans un coin ;
//  - l'inclinaison progressive (-15°, -3°, +10°) : même défaut en plus
//    discret, les bandes des cartes du fond s'effilant vers le bas.
//
// Des cartes strictement parallèles donnent des bandes de largeur constante,
// seule forme qui survive à 48 px.
function fan(angles, { w = 268, h = 366, r = 48, stepX = 60, stepY = -30 } = {}) {
  const mid = (angles.length - 1) / 2;
  return angles.map((deg, i) => ({
    cx: 512 + (i - mid) * stepX,
    cy: 512 + (i - mid) * stepY,
    w,
    h,
    r,
    angle: deg,
  }));
}

// Repère local d'une carte : place un élément dans SON plan incliné.
function inCard(geom, lx, ly) {
  const rad = (geom.angle * Math.PI) / 180;
  return {
    cx: geom.cx + lx * Math.cos(rad) - ly * Math.sin(rad),
    cy: geom.cy + lx * Math.sin(rad) + ly * Math.cos(rad),
    angle: geom.angle,
  };
}

// --- A · Le paquet ----------------------------------------------------------
// Trois cartes en pile inclinée, séparées par le fond. C'est l'objet même de
// l'app : un paquet dont on fait tomber les cartes une à une, et dont on ne
// voit jamais le dos. Aucun texte, silhouette en escalier reconnaissable.
function paquet(c, { hole = VIOLET } = {}) {
  for (const geom of fan([9, 9, 9])) card(c, geom, { hole });
}

// --- B · L'auteur inconnu ---------------------------------------------------
// Une carte, et à la place de la photo de son auteur un cercle vide. La
// proposition est là, lisible ; la personne qui la porte, non. C'est la
// promesse de l'app en une image.
function auteurInconnu(c, { hole = VIOLET } = {}) {
  const geom = { cx: 512, cy: 512, w: 330, h: 440, r: 58, angle: 10 };
  card(c, geom, { hole, gap: 0 });

  const erase = hole === null;
  const opts = erase ? { mode: 'erase' } : {};
  const ink = erase ? WHITE : hole;

  // L'emplacement de la photo, resté vide.
  const avatar = inCard(geom, 0, -108);
  c.fill(ring({ cx: avatar.cx, cy: avatar.cy, r: 62, width: 24 }), ink, opts);

  // La mesure, elle, est bien là.
  const l1 = inCard(geom, 0, 34);
  const l2 = inCard(geom, -24, 88);
  c.fill(roundedRect({ ...l1, w: 196, h: 26, r: 13 }), ink, opts);
  c.fill(roundedRect({ ...l2, w: 148, h: 26, r: 13 }), ink, opts);
}

// --- C · Le paquet à l'aveugle ----------------------------------------------
// La pile, et sur la carte du dessus le seul cercle vide. Le paquet dit
// « on swipe », le cercle dit « à l'aveugle ».
function paquetAveugle(c, { hole = VIOLET } = {}) {
  const cards = fan([9, 9, 9]);
  for (const geom of cards) card(c, geom, { hole });

  const erase = hole === null;
  const opts = erase ? { mode: 'erase' } : {};
  const top = cards[2];
  const avatar = inCard(top, 0, -18);
  c.fill(ring({ cx: avatar.cx, cy: avatar.cy, r: 58, width: 24 }), erase ? WHITE : hole, opts);
}

// --- D · Le monogramme ------------------------------------------------------
// Un É géométrique. L'accent aigu fait tout le travail : aucune autre app
// n'aura cette lettre-là, et elle dit « français » sans drapeau ni Marianne.
function monogramme(c) {
  const x0 = 388; // bord gauche du fût
  const stem = 62;
  const arm = 60;
  const top = 372;
  const bottom = 700;
  const width = 268;

  c.fill(
    union(
      // Fût vertical.
      roundedRect({ cx: x0 + stem / 2, cy: (top + bottom) / 2, w: stem, h: bottom - top, r: 18 }),
      // Trois bras. Le médian est plus court, comme dans un E dessiné.
      roundedRect({ cx: x0 + width / 2, cy: top + arm / 2, w: width, h: arm, r: 18 }),
      roundedRect({ cx: x0 + width * 0.44, cy: (top + bottom) / 2, w: width * 0.88, h: arm, r: 18 }),
      roundedRect({ cx: x0 + width / 2, cy: bottom - arm / 2, w: width, h: arm, r: 18 })
    ),
    WHITE
  );

  // L'accent aigu, incliné comme celui d'un caractère.
  c.fill(roundedRect({ cx: 520, cy: 292, w: 52, h: 116, r: 26, angle: 32 }), WHITE);
}

// --- E · Le choix -----------------------------------------------------------
// La carte, et de part et d'autre les deux directions du geste : à gauche on
// refuse, à droite on adhère.
function leChoix(c) {
  c.fill(roundedRect({ cx: 512, cy: 512, w: 262, h: 356, r: 46 }), WHITE);

  const chevron = (cx, dir) =>
    union(
      roundedRect({ cx: cx + 18 * dir, cy: 466, w: 36, h: 122, r: 18, angle: dir * 38 }),
      roundedRect({ cx: cx + 18 * dir, cy: 558, w: 36, h: 122, r: 18, angle: dir * -38 })
    );

  // Vers l'EXTÉRIEUR : la carte part à gauche ou à droite. Pointés vers
  // l'intérieur, les mêmes chevrons se lisaient « replier ».
  c.fill(chevron(232, 1), WHITE);
  c.fill(chevron(792, -1), WHITE);
}


// --- L'œil : la brique commune aux pistes « à l'aveugle » --------------------
//
// L'amande est l'INTERSECTION de deux grands disques décalés verticalement.
// C'est la construction géométrique réelle d'un œil, et elle donne des
// pointes franches aux commissures, là où une ellipse s'arrondit et perd le
// caractère « œil » dès qu'on réduit.
//
// `w` est la largeur totale, `h` l'ouverture au centre. Le rayon des disques
// et leur écartement s'en déduisent, donc un seul couple de nombres suffit à
// décrire l'œil quelle que soit sa taille.
function amande({ cx, cy, w, h }) {
  const a = w / 2;
  const b = h / 2;
  // Rayon du disque passant par les deux commissures et par le sommet.
  const r = (a * a + b * b) / (2 * b);
  const d = r - b;
  return intersect(circle({ cx, cy: cy + d, r }), circle({ cx, cy: cy - d, r }));
}

// Œil ouvert : l'amande, sa pupille creusée, et un contour épais. Le contour
// est obtenu en soustrayant une amande plus petite — pas en dessinant deux
// formes pleines, ce qui laisserait le fond apparaître entre elles.
function oeilOuvert({ cx, cy, w, h, trait = 34, pupille = 0.3 }) {
  const contour = subtract(amande({ cx, cy, w, h }), amande({ cx, cy, w: w - trait * 2.4, h: h - trait * 2 }));
  return union(contour, circle({ cx, cy, r: w * pupille * 0.5 }));
}

// Œil fermé : la paupière baissée, un arc épais qui BOMBE VERS LE HAUT.
//
// Le sens de la courbure fait tout. Un arc creux (∪) se lit comme un sourire,
// ou pire, comme le bas arrondi de la carte sur laquelle il est posé — c'est
// ce qui a fait échouer une première version. Un arc bombé (∩), lui, se lit
// comme une paupière close, surtout accompagné des cils.
function oeilFerme({ cx, cy, w, trait = 34, cils = true }) {
  const r = w / 2;
  const yc = cy + r * 0.42;
  const arc = subtract(circle({ cx, cy: yc, r }), circle({ cx, cy: yc, r: r - trait }));
  // Moitié haute de l'anneau seulement.
  const haut = intersect(arc, roundedRect({ cx, cy: cy - r * 0.5, w: w * 1.4, h: r, r: 0 }));
  if (!cils) return haut;

  // Trois cils courts sous la paupière : sans eux, l'arc seul reste ambigu à
  // petite taille.
  const cil = (dx, angle) =>
    roundedRect({ cx: cx + dx, cy: cy + trait * 1.5, w: trait * 0.7, h: trait * 1.5, r: trait * 0.35, angle });
  return union(haut, cil(-w * 0.3, -24), cil(0, 0), cil(w * 0.3, 24));
}

// Barre oblique de l'œil barré. Elle est TOUJOURS accompagnée d'un liseré
// creusé du même angle : sans lui, la barre se confond avec l'amande qu'elle
// traverse dès que l'icône rapetisse.
function barre({ cx, cy, len, trait = 40, angle = -38 }) {
  return roundedRect({ cx, cy, w: len, h: trait, r: trait / 2, angle });
}

// --- F · La pastille barrée -------------------------------------------------
// La pile intacte, et un macaron rond posé sur son coin bas-droit, comme le
// badge d'un dossier scellé. L'œil y est barré.
//
// POURQUOI UN MACARON. Une première version posait l'œil à cheval sur les
// cartes : il fallait creuser un liseré autour de lui pour l'en détacher, et
// ce liseré mordait la silhouette du paquet — on n'y reconnaissait plus ni
// une carte ni un œil. Un disque plein est une masse franche : il se pose sur
// la pile sans l'entamer, et son bord circulaire reste lisible partout.
function paquetOeilBarre(c, { hole = VIOLET } = {}) {
  const cards = fan([9, 9, 9], { w: 240, h: 328, stepX: 54, stepY: -27 });
  for (const geom of cards) card(c, geom, { hole });

  const erase = hole === null;
  const bx = 690;
  const by = 690;
  const R = 152;

  // Le macaron mange la pile : liseré creusé, puis disque plein.
  if (erase) c.fill(circle({ cx: bx, cy: by, r: R + 20 }), WHITE, { mode: 'erase' });
  else c.fill(circle({ cx: bx, cy: by, r: R + 20 }), hole);
  c.fill(circle({ cx: bx, cy: by, r: R }), WHITE);

  // L'œil barré est évidé DANS le macaron : du violet sur du blanc, donc
  // aucun liseré supplémentaire à prévoir.
  const ink = erase ? WHITE : hole;
  const opts = erase ? { mode: 'erase' } : {};
  c.fill(oeilOuvert({ cx: bx, cy: by, w: 186, h: 106, trait: 22 }), ink, opts);
  c.fill(barre({ cx: bx, cy: by, len: 214, trait: 24 }), ink, opts);
}

// --- G · L'œil fermé dans la carte ------------------------------------------
// Même construction que H, mais l'œil est CLOS au lieu d'être barré : une
// paupière bombée et ses cils, évidés dans la carte du dessus. Plus doux que
// la barre, et une silhouette plus simple à petite taille.
function paquetOeilFerme(c, { hole = VIOLET } = {}) {
  const cards = fan([9, 9, 9]);
  for (const geom of cards) card(c, geom, { hole });

  const erase = hole === null;
  const opts = erase ? { mode: 'erase' } : {};
  const ink = erase ? WHITE : hole;
  const top = cards[2];
  const centre = inCard(top, 0, -6);

  c.fill(oeilFerme({ cx: centre.cx, cy: centre.cy, w: 190, trait: 26 }), ink, opts);
}

// --- H · L'œil dans la carte ------------------------------------------------
// L'œil n'est plus posé SUR le paquet mais DEDANS, à la place où se trouverait
// la photo de l'auteur. La silhouette extérieure reste exactement celle du
// logo actuel : c'est la piste qui change le moins la marque.
function paquetOeilDedans(c, { hole = VIOLET } = {}) {
  const cards = fan([9, 9, 9]);
  for (const geom of cards) card(c, geom, { hole });

  const erase = hole === null;
  const opts = erase ? { mode: 'erase' } : {};
  const ink = erase ? WHITE : hole;
  const top = cards[2];
  const centre = inCard(top, 0, -6);

  // Barre inclinée comme la carte : posée droite sur une carte de travers,
  // elle se lirait comme un autocollant collé au mauvais angle.
  c.fill(oeilOuvert({ cx: centre.cx, cy: centre.cy, w: 196, h: 112, trait: 22 }), ink, opts);
  c.fill(barre({ cx: centre.cx, cy: centre.cy, len: 232, trait: 24, angle: -29 }), ink, opts);
}

// --- I · Le paquet dans l'œil -----------------------------------------------
// Le rapport s'inverse : l'œil devient le contenant, et le paquet sa pupille.
// C'est le paquet qu'on regarde, et il occupe la place de l'iris.
function oeilPaquet(c, { hole = VIOLET } = {}) {
  const erase = hole === null;
  const cy = 512;

  const contour = subtract(
    amande({ cx: 512, cy, w: 780, h: 462 }),
    amande({ cx: 512, cy, w: 684, h: 386 })
  );
  c.fill(contour, WHITE);

  // La pile, réduite pour tenir dans l'ouverture, séparée du contour par le
  // même liseré que les cartes entre elles.
  const cards = fan([9, 9, 9], { w: 148, h: 204, r: 28, stepX: 34, stepY: -17 });
  for (const geom of cards) card(c, geom, { hole, gap: 20 });

  if (erase) {
    // En découpe, le liseré intérieur doit redevenir un vrai trou : la pile
    // vient de le recouvrir, on le recreuse.
    const interieur = subtract(
      amande({ cx: 512, cy, w: 684, h: 386 }),
      amande({ cx: 512, cy, w: 644, h: 352 })
    );
    c.fill(interieur, WHITE, { mode: 'erase' });
  }
}

// --- J · L'œil sous le paquet ------------------------------------------------
// L'œil barré n'est plus posé sur les cartes mais dessous, en pied de marque.
// Deux masses distinctes, séparées par du fond : rien ne se recouvre, donc
// rien à creuser, et chacune garde sa forme entière.
//
// C'est la seule des cinq qui ne touche pas du tout au dessin du paquet.
function paquetPaupiere(c, { hole = VIOLET } = {}) {
  const cards = fan([9, 9, 9], { w: 228, h: 312, r: 42, stepX: 52, stepY: -26 }).map((g) => ({
    ...g,
    cy: g.cy - 92,
  }));
  for (const geom of cards) card(c, geom, { hole });

  const cy = 830;
  c.fill(
    union(
      oeilOuvert({ cx: 512, cy, w: 286, h: 158, trait: 30 }),
      barre({ cx: 512, cy, len: 340, trait: 34 })
    ),
    WHITE
  );
}

module.exports = {
  VIOLET,
  WHITE,
  CONCEPTS: [
    {
      id: 'paquet',
      label: 'A · Le paquet',
      draw: paquet,
      note:
        'Trois cartes en pile inclinée, séparées par un liseré du fond. C’est l’objet même de ' +
        'l’app : un paquet dont on fait tomber les cartes une à une, et dont on ne voit ' +
        'jamais le dos. Aucun texte, donc aucune traduction à prévoir, et une silhouette ' +
        'en escalier qui tient jusqu’en 48 px.',
    },
    {
      id: 'auteur-inconnu',
      label: 'B · L’auteur inconnu',
      draw: auteurInconnu,
      note:
        'Une carte, et à la place de la photo de son auteur un cercle resté vide. La ' +
        'proposition est là, lisible ; la personne qui la porte, non. C’est la promesse de ' +
        'l’app en une image — la plus parlante des cinq, mais aussi la plus chargée en petit.',
    },
    {
      id: 'paquet-aveugle',
      label: 'C · Le paquet à l’aveugle',
      draw: paquetAveugle,
      note:
        'Les deux précédentes réunies : la pile dit « on swipe », le cercle vide de la ' +
        'carte du dessus dit « à l’aveugle ». Le sens le plus complet, au prix d’un détail ' +
        'de plus à faire tenir dans les petites tailles.',
    },
    {
      id: 'monogramme',
      label: 'D · Le monogramme É',
      draw: monogramme,
      note:
        'Un É géométrique. L’accent aigu fait tout le travail : il dit « français » sans ' +
        'drapeau ni Marianne, et aucune autre app n’aura cette lettre-là. De loin la plus ' +
        'nette en 48 px — mais elle nomme l’app au lieu de raconter ce qu’elle fait.',
    },
    {
      id: 'choix',
      label: 'E · Le choix',
      draw: leChoix,
      note:
        'La carte, et de part et d’autre les deux directions du geste : à gauche on refuse, ' +
        'à droite on adhère. La plus explicite, celle qui montre le mode d’emploi — mais ' +
        'aussi la plus large, donc la carte y reste petite une fois le masque d’Android passé.',
    },
    {
      id: 'paquet-oeil-barre',
      label: 'F · La pastille barrée',
      draw: paquetOeilBarre,
      note:
        'La pile actuelle, et par-dessus un œil barré à cheval sur la carte du dessus. La ' +
        'lecture est immédiate : on regarde, mais pas encore. La plus explicite des cinq, ' +
        'et la plus chargée une fois réduite.',
    },
    {
      id: 'paquet-oeil-ferme',
      label: 'G · L’œil fermé dans la carte',
      draw: paquetOeilFerme,
      note:
        'Même pile, mais l’œil est clos au lieu d’être barré : un seul arc, la paupière ' +
        'baissée. Moins littéral que la barre, et nettement plus net en petit — un arc ' +
        'épais reste un arc à 48 px.',
    },
    {
      id: 'paquet-oeil-dedans',
      label: 'H · L’œil dans la carte',
      draw: paquetOeilDedans,
      note:
        'L’œil barré n’est plus posé sur le paquet mais dedans, à la place où se trouverait ' +
        'la photo de l’auteur. La silhouette extérieure reste exactement celle du logo ' +
        'actuel : c’est la piste qui change le moins la marque.',
    },
    {
      id: 'oeil-paquet',
      label: 'I · Le paquet dans l’œil',
      draw: oeilPaquet,
      note:
        'Le rapport s’inverse : l’œil devient le contenant et le paquet sa pupille. C’est le ' +
        'paquet qu’on regarde. La plus mémorable, et celle qui s’éloigne le plus de la ' +
        'silhouette actuelle.',
    },
    {
      id: 'paquet-paupiere',
      label: 'J · L’œil sous le paquet',
      draw: paquetPaupiere,
      note:
        'La paupière close coiffe la pile au lieu de s’y superposer, comme un couvercle. ' +
        'Deux masses nettement séparées, donc la lecture tient très bas — mais la marque ' +
        'est plus large, ce qui la rapetisse une fois le masque d’Android passé.',
    },
  ],
};
