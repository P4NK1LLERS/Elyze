import { ImageSourcePropType } from 'react-native';

// Portraits des candidats.
//
// Tous viennent de Wikimedia Commons, sous licence libre, et ont été choisis
// UN PAR UN plutôt que pris automatiquement — c'est le seul moyen d'obtenir
// une série cohérente. La récupération automatique donnait ce que la fiche
// Wikipédia mettait en avant, avec les défauts que ça implique : un voisin de
// tribune dans le cadre, une photo de dos, un fond de meeting saturé, et deux
// fois un cliché qui n'était même pas la bonne personne (la catégorie
// « Marine Le Pen » de Commons contient un portrait de Florian Philippot, et
// celle de Jean-Luc Mélenchon une caricature en bulldog).
//
// Les critères retenus, appliqués aux onze :
//
//  - le visage de face ou de trois quarts, regard vers l'objectif ;
//  - la tête ENTIÈRE dans le cadre, avec de la marge au-dessus du crâne — le
//    rond de l'avatar rogne les coins, et un cadrage juste y décapite ;
//  - un fond calme, sans deuxième personne nette ;
//  - des visages de taille comparable d'une fiche à l'autre, sans quoi le
//    trombinoscope donne l'impression que certains sont plus proches.
//
// Chaque image a ensuite été recadrée en carré à la main (recadrage réglé au
// centième près sur le rendu en rond), puis réduite à 400 × 400. C'est la
// raison pour laquelle il n'y a plus de table de recadrage à l'affichage :
// les onze fichiers sont carrés, `resizeMode="cover"` ne rogne plus rien.
export const CANDIDATE_PHOTOS: Partial<Record<string, ImageSourcePropType>> = {
  attal: require('../../assets/candidates/attal.jpg'),
  bertrand: require('../../assets/candidates/bertrand.jpg'),
  cazeneuve: require('../../assets/candidates/cazeneuve.jpg'),
  glucksmann: require('../../assets/candidates/glucksmann.jpg'),
  lepen: require('../../assets/candidates/lepen.jpg'),
  melenchon: require('../../assets/candidates/melenchon.jpg'),
  philippe: require('../../assets/candidates/philippe.jpg'),
  retailleau: require('../../assets/candidates/retailleau.jpg'),
  ruffin: require('../../assets/candidates/ruffin.jpg'),
  tondelier: require('../../assets/candidates/tondelier.jpg'),
  villepin: require('../../assets/candidates/villepin.jpg'),
};

export type PhotoCredit = {
  // Nom du fichier sur Wikimedia Commons, tel qu'il y figure.
  fichier: string;
  // Auteur, repris mot pour mot du champ « Artist » de Commons.
  auteur: string;
  licence: string;
  page: string;
};

// Attribution, fichier par fichier.
//
// Ce n'est pas une politesse : CC BY et CC BY-SA imposent de nommer l'auteur,
// de citer la licence et de signaler que l'image a été modifiée — elle l'est
// ici, puisqu'elle est recadrée. La version précédente renvoyait le lecteur à
// « la page Commons de chaque fichier » sans dire laquelle, ce qui ne remplit
// aucune des trois conditions. L'écran Réglages › Crédits affiche maintenant
// cette table telle quelle.
export const CANDIDATE_PHOTO_CREDITS: Record<string, PhotoCredit> = {
  attal: {
    fichier: 'Gabriel Attal 2025 (close crop).jpg',
    auteur: 'Ismail Aissoub',
    licence: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Gabriel_Attal_2025_(close_crop).jpg',
  },
  bertrand: {
    fichier: 'Xavier Bertrand 2025 (cropped).jpg',
    auteur: 'Claudio Centonze / European Union, 2025 / EC - Audiovisual Service',
    licence: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Xavier_Bertrand_2025_(cropped).jpg',
  },
  cazeneuve: {
    fichier: 'Bernard Cazeneuve, (42399145362) (cropped).jpg',
    auteur: 'Jérémy Barande',
    licence: 'CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Bernard_Cazeneuve,_(42399145362)_(cropped).jpg',
  },
  glucksmann: {
    fichier: '1720448398743 20240708 GLUCKSMANN Raphael FR 006.jpg',
    auteur: 'European Union 2024 - Source : EP',
    licence: 'Attribution',
    page: 'https://commons.wikimedia.org/wiki/File:1720448398743_20240708_GLUCKSMANN_Raphael_FR_006.jpg',
  },
  lepen: {
    fichier: 'Le Pen, Marine-9586 (cropped).jpg',
    auteur: 'Foto-AG Gymnasium Melle',
    licence: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Le_Pen,_Marine-9586_(cropped).jpg',
  },
  melenchon: {
    fichier: 'Portrait JLM 03-05-2026.jpg',
    auteur: 'jlm2017.fr',
    licence: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Portrait_JLM_03-05-2026.jpg',
  },
  philippe: {
    fichier: 'Edouard Philippe 3x4 crop.jpg',
    auteur: 'Wasasaq8',
    licence: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:Edouard_Philippe_3x4_crop.jpg',
  },
  retailleau: {
    fichier: 'Bruno RETAILLEAU (Minister for the Interior, France).jpg',
    auteur: '© European Union, 1998 – 2025',
    licence: 'Attribution',
    page: 'https://commons.wikimedia.org/wiki/File:Bruno_RETAILLEAU_(Minister_for_the_Interior,_France).jpg',
  },
  ruffin: {
    fichier: 'François Ruffin (cropped).jpg',
    auteur: 'Thinkerview',
    licence: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Fran%C3%A7ois_Ruffin_(cropped).jpg',
  },
  tondelier: {
    fichier: '20210819 tondelier.m-cr3.jpg',
    auteur: 'Greenbox',
    licence: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:20210819_tondelier.m-cr3.jpg',
  },
  villepin: {
    fichier: 'Dominique de Villepin 2003.jpg',
    auteur: 'European Parliament Multimedia Centre',
    licence: 'Attribution',
    page: 'https://commons.wikimedia.org/wiki/File:Dominique_de_Villepin_2003.jpg',
  },
};
