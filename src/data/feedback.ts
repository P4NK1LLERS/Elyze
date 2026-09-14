import { Platform } from 'react-native';
import { APP_VERSION } from './appInfo';

// Envoyer un retour : bug, idée, ou simple commentaire.
//
// POURQUOI UN COURRIEL ET PAS UN FORMULAIRE.
//
// Un formulaire suppose un serveur, donc un appel réseau sortant. L'app n'en
// fait aucun, la page confidentialité l'affirme, et un test l'impose au dépôt
// (voir legal.test.ts) : ajouter un `fetch` ici ferait de cette page un
// mensonge, et casserait la construction avant d'y arriver. Ce n'est pas une
// contrainte subie, c'est la promesse principale de l'app.
//
// On prépare donc un message et on le confie à l'application de messagerie du
// téléphone. L'app n'envoie rien : elle écrit un brouillon, et c'est la
// personne qui décide de l'envoyer, depuis sa propre adresse, en voyant
// exactement ce qu'elle transmet. Rien ne part dans son dos.
//
// CE QUI EST JOINT AU MESSAGE, ET RIEN D'AUTRE : la version de l'app et le
// système. Deux lignes, visibles dans le brouillon avant envoi, qui évitent
// l'aller-retour « quelle version ? » sur tout rapport de bug. Ni réponses,
// ni résultat, ni identifiant : ils ne diraient rien d'utile sur un défaut
// d'affichage, et l'app n'a de toute façon rien de tel à donner.
export const FEEDBACK_EMAIL = 'elyze2027@ik.me';

export type FeedbackKind = 'bug' | 'idee' | 'avis';

// UN MODÈLE PAR NATURE DE RETOUR, ET UNE SEULE CASE.
//
// Le bug a un temps eu sa propre case « comment le refaire », au motif qu'un
// rapport sans marche à suivre se corrige rarement. C'était vrai, et c'était
// tout de même une mauvaise idée : deux zones de texte dans une fenêtre posée
// sur les réglages, cela ressemble à un formulaire administratif, et un
// formulaire décourage d'écrire bien plus sûrement qu'une consigne manquante
// ne gêne la correction.
//
// La demande n'a pas disparu pour autant, elle a changé de forme : le
// filigrane du bug l'appelle en une phrase. Qui a la marche à suivre l'écrira
// dans la foulée ; qui ne l'a pas ne se sera pas heurté à une case vide.
export type FeedbackKindInfo = {
  kind: FeedbackKind;
  label: string;
  // Ce que l'objet du courriel annonce : trier une boîte de réception sans
  // ouvrir chaque message est le minimum qu'on doive à qui la relève.
  subject: string;
  // Intitulé du champ principal. Il sert DEUX FOIS : au-dessus de la case
  // dans l'app, et comme intertitre dans le courriel. Le message arrive donc
  // sous le titre de la question à laquelle il répond.
  champ: string;
  // Texte affiché en filigrane dans le champ de saisie. Il appelle le détail
  // utile à CE type de retour, plutôt qu'un « ton message » universel.
  placeholder: string;
};

export const FEEDBACK_KINDS: FeedbackKindInfo[] = [
  {
    kind: 'bug',
    label: 'Un bug',
    subject: 'Bug',
    champ: 'Ce qui s’est passé',
    placeholder:
      'Ce que tu as vu, et ce que tu attendais à la place. Si tu sais le refaire, dis comment.',
  },
  {
    kind: 'idee',
    label: 'Une idée',
    subject: 'Idée',
    champ: 'L’idée',
    placeholder: 'Ce qui te manque, ou ce que tu aimerais pouvoir faire.',
  },
  {
    kind: 'avis',
    label: 'Un avis',
    subject: 'Avis',
    champ: 'Ton avis',
    placeholder: 'Ce qui t’a plu, ce qui t’a gêné, ce qui t’a paru douteux.',
  },
];

export const FEEDBACK_KINDS_BY_ID: Record<FeedbackKind, FeedbackKindInfo> = Object.fromEntries(
  FEEDBACK_KINDS.map((k) => [k.kind, k])
) as Record<FeedbackKind, FeedbackKindInfo>;

// Longueur retenue des deux cases.
//
// Ce n'est pas une limite éditoriale mais une limite technique : un `mailto:`
// est une URL, et les systèmes la tronquent au-delà de quelques milliers de
// caractères. Un message coupé au milieu d'une phrase, sans que rien ne
// l'annonce, serait le pire des comportements.
//
// CE NOMBRE EST CALCULÉ À L'ENVERS, DEPUIS LE PIRE CAS. Ce qui compte n'est
// pas la longueur du texte mais celle de l'URL une fois échappée, et
// l'échappement n'a pas un coût fixe : un « é » devient `%C3%A9` et un retour
// à la ligne `%0A`, si bien qu'un texte fait uniquement de lettres accentuées
// et de retours à la ligne pèse quatre fois et demie son poids. Un test mesure
// ce cas extrême et exige que l'URL reste sous 8000 caractères.
//
// 1200 caractères font environ deux cents mots : la borne ne se rencontre pas
// en écrivant un retour ordinaire.
export const FEEDBACK_MAX = 1200;

// Contexte technique, en clair et lisible par la personne qui l'envoie.
//
// Le numéro de version du système n'est repris que là où il veut dire quelque
// chose. Sur le web, `Platform.Version` vaut « 0.0.0 » : un numéro qui ne
// désigne rien, et qui donne au lecteur l'impression d'une information alors
// qu'il n'y en a pas.
export function feedbackContext(): string {
  if (Platform.OS === 'ios') return `Élyze ${APP_VERSION} · iOS ${String(Platform.Version)}`;
  if (Platform.OS === 'android') return `Élyze ${APP_VERSION} · Android ${String(Platform.Version)}`;
  return `Élyze ${APP_VERSION} · ${Platform.OS}`;
}

// Le brouillon complet, prêt à être confié à l'application de messagerie.
//
// LA MISE EN FORME EST CELLE D'UN COURRIEL, PAS CELLE D'UN FORMULAIRE.
// Intertitres en capitales, sections séparées par une ligne vide, et le bloc
// technique renvoyé en pied sous un filet : ce qui compte se lit d'abord, ce
// qui sert au diagnostic attend en bas. Rien n'est masqué pour autant, tout
// reste relisible et modifiable dans le brouillon avant l'envoi.
//
// L'OBJET PORTE LA VERSION. Une boîte qui reçoit cinquante « Élyze · Bug »
// ne se trie pas ; « Élyze 1.1.0 · Bug » se regroupe d'un coup d'œil, et dit
// tout de suite si le défaut concerne encore la version en cours.
//
// `encodeURIComponent` est indispensable sur les deux champs : un retour à la
// ligne, un `&` ou un accent non échappés coupent l'URL, et le message arrive
// amputé sans qu'aucune erreur ne soit levée.
const FILET = '-----';

export function buildFeedbackMailto(kind: FeedbackKind, message: string): string {
  const info = FEEDBACK_KINDS_BY_ID[kind];
  const objet = `Élyze ${APP_VERSION} · ${info.subject}`;

  const corps = [
    `${info.champ.toUpperCase()}\n${message.trim()}`,
    `${FILET}\n${feedbackContext()}\nÉcrit depuis les réglages de l’application.`,
  ].join('\n\n');

  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`;
}
