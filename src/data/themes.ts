// FICHIER GÉNÉRÉ — ne pas modifier à la main.
// Source : https://poligraph.fr/elections/presidentielle-2027
// Export du 2026-08-29 · AGPL-3.0 / usage libre avec mention de la source (Poligraph)
// Régénérer avec : node scripts/generate-data.js
// (les 15 thèmes de l’export Poligraph)

import { ThemeTag } from '../types';

export const THEMES: ThemeTag[] = [
  { id: 'economie', label: 'Économie & budget', icon: '💶', categoryId: 'economie' },
  { id: 'emploi', label: 'Emploi & travail', icon: '🤝', categoryId: 'economie' },
  { id: 'retraites', label: 'Retraites', icon: '🧓', categoryId: 'economie' },
  { id: 'solidarites', label: 'Solidarités & protection sociale', icon: '🫱', categoryId: 'economie' },
  { id: 'sante', label: 'Santé', icon: '🏥', categoryId: 'education_sante' },
  { id: 'education', label: 'Éducation & culture', icon: '🎓', categoryId: 'education_sante' },
  { id: 'numerique', label: 'Numérique & tech', icon: '💻', categoryId: 'education_sante' },
  { id: 'logement', label: 'Logement & urbanisme', icon: '🏠', categoryId: 'cadre_vie' },
  { id: 'transports', label: 'Transports', icon: '🚆', categoryId: 'cadre_vie' },
  { id: 'environnement', label: 'Environnement & énergie', icon: '🌱', categoryId: 'cadre_vie' },
  { id: 'agriculture', label: 'Agriculture & alimentation', icon: '🌾', categoryId: 'cadre_vie' },
  { id: 'securite', label: 'Sécurité & justice', icon: '⚖️', categoryId: 'regalien' },
  { id: 'immigration', label: 'Immigration', icon: '🌍', categoryId: 'regalien' },
  { id: 'defense', label: 'Affaires étrangères & défense', icon: '🛡️', categoryId: 'regalien' },
  { id: 'institutions', label: 'Institutions', icon: '🏛️', categoryId: 'regalien' },
];

export const THEMES_BY_ID: Record<string, ThemeTag> = Object.fromEntries(
  THEMES.map((t) => [t.id, t])
);
