// FICHIER GÉNÉRÉ — ne pas modifier à la main.
// Source : https://poligraph.fr/elections/presidentielle-2027
// Export du 2026-08-29 · AGPL-3.0 / usage libre avec mention de la source (Poligraph)
// Régénérer avec : node scripts/generate-data.js
// (11 candidats retenus : ceux ayant au moins 15 mesures publiées)

import { Candidate } from '../types';

export const CANDIDATES: Candidate[] = [
  { id: 'cazeneuve', name: 'Bernard Cazeneuve', initials: 'BC', party: 'La Convention', poligraphSlug: 'bernard-cazeneuve' },
  { id: 'retailleau', name: 'Bruno Retailleau', initials: 'BR', party: 'Les Républicains', poligraphSlug: 'bruno-retailleau' },
  { id: 'villepin', name: 'Dominique de Villepin', initials: 'DDV', party: 'La France humaniste', poligraphSlug: 'dominique-de-villepin' },
  { id: 'philippe', name: 'Édouard Philippe', initials: 'EP', party: 'Horizons', poligraphSlug: 'edouard-philippe' },
  { id: 'ruffin', name: 'François Ruffin', initials: 'FR', party: 'Nous président', poligraphSlug: 'francois-ruffin' },
  { id: 'attal', name: 'Gabriel Attal', initials: 'GA', party: 'Renaissance', poligraphSlug: 'gabriel-attal' },
  { id: 'melenchon', name: 'Jean-Luc Mélenchon', initials: 'JLM', party: 'La France insoumise', poligraphSlug: 'jean-luc-melenchon' },
  { id: 'lepen', name: 'Marine Le Pen', initials: 'MLP', party: 'Rassemblement national', poligraphSlug: 'marine-le-pen' },
  { id: 'tondelier', name: 'Marine Tondelier', initials: 'MT', party: 'Les Écologistes', poligraphSlug: 'marine-tondelier' },
  { id: 'glucksmann', name: 'Raphaël Glucksmann', initials: 'RG', party: 'Place publique', poligraphSlug: 'raphael-glucksmann' },
  { id: 'bertrand', name: 'Xavier Bertrand', initials: 'XB', party: 'Nous France', poligraphSlug: 'xavier-bertrand' },
];

export const CANDIDATES_BY_ID: Record<string, Candidate> = Object.fromEntries(
  CANDIDATES.map((c) => [c.id, c])
);
