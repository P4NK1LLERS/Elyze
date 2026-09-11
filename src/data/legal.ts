import { POLIGRAPH_LICENCE, POLIGRAPH_SOURCE_URL } from './source';

// Les trois textes légaux de l'app : confidentialité, conditions, crédits.
//
// Ils vivent ici, en données, et non dans l'écran qui les affiche. D'abord
// parce qu'un écran de 400 lignes de prose est illisible. Ensuite parce que
// ces textes AFFIRMENT des choses vérifiables sur le code — « aucun appel
// réseau », la liste de ce qui est enregistré — et qu'un test peut les
// confronter au reste du dépôt tant qu'ils sont atteignables comme données
// (voir legal.test.ts).
//
// Deux règles ont guidé la rédaction :
//
//  1. NE RIEN PROMETTRE QU'ON NE TIENNE. Chaque phrase de la page
//     confidentialité correspond à quelque chose de constatable dans le
//     code : la liste des clés de stockage vient de utils/storage.ts,
//     l'absence de réseau se vérifie par l'absence de tout appel sortant.
//  2. NE PARLER QU'AU NOM DE L'APP. Rien ici ne prête d'intention aux
//     candidats, ne qualifie leurs mesures, ni ne se prononce sur la
//     campagne.

export type LegalTopic = 'privacy' | 'terms' | 'credits';

export type LegalSection = {
  title: string;
  body?: string;
  // Liste à puces, quand l'énumération est le fond du propos (ce qui est
  // enregistré, par exemple) et non une mise en forme d'agrément.
  bullets?: string[];
  link?: { label: string; url: string };
  // Rendu particulier : la table d'attribution des portraits, tirée des
  // données plutôt que recopiée à la main (voir data/candidatePhotos).
  photos?: true;
};

export type LegalDocument = {
  title: string;
  // Phrase d'accroche : le fond du document en une ligne.
  lead: string;
  sections: LegalSection[];
};

// Dernière révision de ces textes. Affichée en bas de chaque page : une
// politique sans date ne dit pas si elle décrit encore l'app installée.
export const LEGAL_UPDATED = '8 septembre 2026';

const WIKIPEDIA_LICENCE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr';

export const LEGAL_DOCUMENTS: Record<LegalTopic, LegalDocument> = {
  privacy: {
    title: 'Confidentialité',
    lead: 'Tout reste sur ton téléphone. L’app ne collecte rien, n’envoie rien, et ne sait pas qui tu es.',
    sections: [
      {
        title: 'Aucune donnée ne sort de l’appareil',
        body:
          'L’application ne fait aucun appel réseau. Les propositions, les notices biographiques et les portraits sont embarqués dans l’app au moment de son installation : rien n’est téléchargé à l’usage, et rien n’est envoyé. Il n’y a ni compte, ni inscription, ni adresse à donner.',
      },
      {
        title: 'Ce qui est enregistré, et où',
        body:
          'Quelques informations sont conservées dans le stockage local du téléphone, celui réservé à l’application. Elles ne servent qu’à retrouver ta partie et tes réglages au lancement suivant.',
        bullets: [
          'La partie en cours : les thèmes choisis, l’ordre des cartes tirées, tes réponses et l’endroit où tu t’es arrêté.',
          'Le fait que le petit tutoriel de départ a déjà été vu.',
          'Tes réglages : thème clair ou sombre, couleur d’accent, vibrations, dégradé animé, mode arc-en-ciel, et l’affichage ou non des noms de candidats.',
        ],
      },
      {
        title: 'Ni mesure d’audience, ni publicité',
        body:
          'Aucun traceur, aucune statistique de fréquentation, aucune publicité, aucun identifiant publicitaire, aucun rapport d’erreur transmis. Personne, y compris l’auteur de l’app, ne peut savoir que tu l’as ouverte ni ce que tu as répondu.',
      },
      {
        title: 'Tout effacer',
        body:
          'Réglages, puis « Réinitialiser les données de l’application » : la partie en cours, le dernier résultat et les réglages sont supprimés définitivement. Désinstaller l’application produit le même effet.',
      },
      {
        title: 'Les liens vers l’extérieur',
        body:
          'Certaines pages proposent d’ouvrir une source : Poligraph, Wikipédia, Wikimedia Commons. Le lien s’ouvre dans ton navigateur, et c’est alors la politique de confidentialité de ces sites qui s’applique. L’app ne leur transmet rien d’autre que l’adresse demandée.',
      },
      {
        title: 'Le partage de ton résultat',
        body:
          'Le bouton « Partager » fabrique une image sur ton téléphone, puis te laisse choisir dans quelle application l’envoyer. Tant que tu ne choisis pas, l’image ne quitte pas l’appareil.',
      },
      {
        title: 'Le retour que tu envoies',
        body:
          'Signaler un bug ou proposer une idée n’envoie rien depuis l’app : elle prépare un brouillon et l’ouvre dans ton application de messagerie. Tu le relis, tu le modifies, et tu l’envoies toi-même depuis ta propre adresse. Deux lignes techniques y sont ajoutées, affichées avant l’envoi : la version de l’app et le nom de ton système. Ni tes réponses, ni ton résultat, ni aucun identifiant.',
      },
    ],
  },

  terms: {
    title: 'Conditions d’utilisation',
    lead: 'Un comparateur de propositions, pas un conseil de vote.',
    sections: [
      {
        title: 'Ce que fait l’application',
        body:
          'Elle te montre des mesures réelles sans dire qui les porte, puis mesure ton accord avec chacun des candidats. Le pourcentage obtenu décrit tes réponses à ces cartes-là : il ne dit pas pour qui voter, ne prédit aucun résultat, et n’est l’avis de personne.',
      },
      {
        title: 'Un échantillon, pas un programme',
        body:
          'Une partie tire quinze propositions par candidat dans un vivier qui en compte plusieurs centaines. Ton résultat porte donc sur cet échantillon, pas sur l’intégralité d’un programme, et deux parties successives ne posent pas les mêmes questions.',
      },
      {
        title: 'D’où viennent les textes, et lequel fait foi',
        body:
          'Les mesures viennent de Poligraph et sont citées mot pour mot, sans coupe ni reformulation. L’app ne les vérifie pas et ne garantit ni leur exactitude ni leur exhaustivité : en cas de doute, c’est le document d’origine du candidat qui fait foi. La ligne « en clair » et les arguments pour et contre, eux, sont écrits par l’app ; ils reformulent et rapportent un débat, ils ne tranchent pas.',
        link: { label: 'Voir la source', url: POLIGRAPH_SOURCE_URL },
      },
      {
        title: 'Indépendance',
        body:
          'L’application est un projet indépendant. Elle n’est affiliée à aucun candidat, aucun parti et aucune institution, et n’est financée par aucun d’eux. Le fait de retenir onze candidats plutôt que d’autres est un choix éditorial, assumé et expliqué dans « Comment ça marche » : ce n’est pas une appréciation de leurs chances.',
      },
      {
        title: 'Fournie en l’état',
        body:
          'L’application est gratuite, sans achat ni abonnement, et destinée à un usage personnel. Elle est fournie telle quelle, sans garantie de disponibilité ni d’absence d’erreur. Ses données sont figées à la date de leur collecte et peuvent avoir vieilli.',
      },
      {
        title: 'Ce qui appartient à qui',
        body:
          'Le code, les illustrations et les textes rédigés par l’application appartiennent à son auteur. Les mesures, les notices biographiques et les portraits restent la propriété de leurs auteurs respectifs et sont réutilisés au titre des licences détaillées dans les crédits.',
      },
    ],
  },

  credits: {
    title: 'Crédits et droits d’auteur',
    lead: 'Presque rien de ce que tu lis ici n’a été écrit par l’app. Voici d’où vient chaque chose.',
    sections: [
      {
        title: 'Les propositions',
        body: `Recensées par Poligraph, qui relie chaque mesure à son document d’origine. Licence ${POLIGRAPH_LICENCE}.`,
        link: { label: 'poligraph.fr', url: POLIGRAPH_SOURCE_URL },
      },
      {
        title: 'Les notices biographiques',
        body:
          'Reprises du premier paragraphe de l’article Wikipédia de chaque candidat, sous licence CC BY-SA 4.0. La fiche de chaque candidat renvoie vers l’article correspondant, qui reste la version à jour.',
        link: { label: 'Licence CC BY-SA 4.0', url: WIKIPEDIA_LICENCE_URL },
      },
      {
        title: 'Les portraits',
        body:
          'Tous issus de Wikimedia Commons, sous licence libre. Chacun a été recadré en carré pour l’affichage en rond ; aucune autre retouche n’a été faite. Auteur et licence, fichier par fichier :',
        photos: true,
      },
      {
        title: 'Les icônes',
        body: 'Ionicons, par Ionic, sous licence MIT.',
        link: { label: 'ionic.io/ionicons', url: 'https://ionic.io/ionicons' },
      },
      {
        title: 'Le logiciel',
        body:
          'Construite avec React Native et Expo, tous deux sous licence MIT. Les emoji affichés sont ceux de ton système : leur apparence dépend de ton téléphone, et ils ne sont pas fournis par l’app.',
      },
      {
        title: 'Un mot sur la citation',
        body:
          'Les mesures sont reproduites mot pour mot, avec l’indication de leur source et de leur date, à des fins d’information. Elles engagent leurs auteurs, et eux seuls.',
      },
    ],
  },
};

// Ordre d'apparition dans les réglages, du plus consulté au plus rare.
export const LEGAL_TOPICS: LegalTopic[] = ['privacy', 'terms', 'credits'];
