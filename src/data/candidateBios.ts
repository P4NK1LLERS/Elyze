// FICHIER GÉNÉRÉ — ne pas modifier à la main.
// Résumés issus de Wikipédia en français, sous licence CC BY-SA 4.0.
// L'app ne rédige aucune notice elle-même : elle cite la source et lie
// vers l'article, qui reste la référence à jour.
// Régénérer avec : node scripts/fetch-bios.js

export type CandidateBio = {
  // Description courte ("femme politique française").
  role: string | null;
  // Premier paragraphe de l'article.
  summary: string;
  article: string;
};

export const CANDIDATE_BIOS: Record<string, CandidateBio> = {
  attal: {
    role: 'homme d\'État français',
    summary: 'Gabriel Attal, né le 16 mars 1989 à Clamart (Hauts-de-Seine), est un homme d\'État français, Premier ministre du 9 janvier au 5 septembre 2024. Redevenu député, il est depuis juillet 2024 président du groupe Ensemble pour la République à l\'Assemblée nationale et est élu en décembre 2024 secrétaire général du parti Renaissance.',
    article: 'https://fr.wikipedia.org/wiki/Gabriel_Attal',
  },
  bertrand: {
    role: 'homme politique français',
    summary: 'Xavier Bertrand, né le 21 mars 1965 à Châlons-sur-Marne, est un homme politique français.',
    article: 'https://fr.wikipedia.org/wiki/Xavier_Bertrand',
  },
  cazeneuve: {
    role: 'homme d\'État français',
    summary: 'Bernard Cazeneuve, né le 2 juin 1963 à Senlis (Oise), est un homme d’État français. Longtemps membre du Parti socialiste (PS), il est Premier ministre du 6 décembre 2016 au 15 mai 2017, sous la présidence de François Hollande.',
    article: 'https://fr.wikipedia.org/wiki/Bernard_Cazeneuve',
  },
  glucksmann: {
    role: 'essayiste et homme politique français',
    summary: 'Raphaël Glucksmann, né le 15 octobre 1979 à Boulogne-Billancourt (Hauts-de-Seine), est un homme politique français, anciennement documentariste et journaliste.',
    article: 'https://fr.wikipedia.org/wiki/Rapha%C3%ABl_Glucksmann',
  },
  lepen: {
    role: 'femme politique française',
    summary: 'Marine Le Pen, née le 5 août 1968 à Neuilly-sur-Seine (Hauts-de-Seine), est une femme politique française. Elle est la figure principale du Front national (FN) renommé Rassemblement national (RN), principal parti d\'extrême droite en France, qu\'elle dirige de 2011 à 2021.',
    article: 'https://fr.wikipedia.org/wiki/Marine_Le_Pen',
  },
  melenchon: {
    role: 'homme politique français',
    summary: 'Jean-Luc Mélenchon, né le 19 août 1951 à Tanger, est un homme politique français. Il est le fondateur et la figure principale du parti La France insoumise (LFI), souvent considéré comme relevant de la gauche radicale et classé à gauche, voire à l\'extrême gauche.',
    article: 'https://fr.wikipedia.org/wiki/Jean-Luc_M%C3%A9lenchon',
  },
  philippe: {
    role: 'homme d\'État français',
    summary: 'Édouard Philippe, né le 28 novembre 1970 à Rouen (Seine-Maritime), est un homme d\'État français. Il est Premier ministre du 15 mai 2017 au 3 juillet 2020.',
    article: 'https://fr.wikipedia.org/wiki/%C3%89douard_Philippe',
  },
  retailleau: {
    role: 'homme politique français',
    summary: 'Bruno Retailleau, né le 20 novembre 1960 à Cholet (Maine-et-Loire), est un homme politique français. Il est ministre de l\'Intérieur du 21 septembre 2024 au 12 octobre 2025 dans les gouvernements Barnier, Bayrou et Lecornu I.',
    article: 'https://fr.wikipedia.org/wiki/Bruno_Retailleau',
  },
  ruffin: {
    role: 'journaliste, réalisateur et homme politique français',
    summary: 'François Ruffin, né le 18 octobre 1975 à Calais (Pas-de-Calais), est un journaliste, essayiste, documentariste et homme politique français.',
    article: 'https://fr.wikipedia.org/wiki/Fran%C3%A7ois_Ruffin',
  },
  tondelier: {
    role: 'femme politique française',
    summary: 'Marine Tondelier, née le 23 août 1986 à Bois-Bernard (Pas-de-Calais), est une femme politique française.',
    article: 'https://fr.wikipedia.org/wiki/Marine_Tondelier',
  },
  villepin: {
    role: 'diplomate, écrivain et homme d\'État français',
    summary: 'Dominique Galouzeau de Villepin, dit Dominique de Villepin, né le 14 novembre 1953 à Rabat, est un homme d\'État français, Premier ministre du 31 mai 2005 au 17 mai 2007.',
    article: 'https://fr.wikipedia.org/wiki/Dominique_de_Villepin',
  },
};
