// FICHIER GÉNÉRÉ — ne pas modifier à la main.
// Source : https://poligraph.fr/elections/presidentielle-2027
// Export du 2026-08-29 · AGPL-3.0 / usage libre avec mention de la source (Poligraph)
// Régénérer avec : node scripts/generate-data.js
// (regroupement éditorial des thèmes, pour l’écran de sélection)

import { Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'economie', label: 'Économie & social', icon: '💶' },
  { id: 'education_sante', label: 'Santé, éducation & numérique', icon: '🎓' },
  { id: 'cadre_vie', label: 'Cadre de vie & environnement', icon: '🏠' },
  { id: 'regalien', label: 'Régalien & institutions', icon: '⚖️' },
];

export const CATEGORIES_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);
