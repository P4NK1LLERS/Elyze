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
export const FEEDBACK_EMAIL = 'vfalchun@gmail.com';

export type FeedbackKind = 'bug' | 'idee' | 'avis';

export type FeedbackKindInfo = {
  kind: FeedbackKind;
  label: string;
  // Ce que l'objet du courriel annonce : trier une boîte de réception sans
  // ouvrir chaque message est le minimum qu'on doive à qui la relève.
  subject: string;
  // Texte affiché en filigrane dans le champ de saisie. Il appelle le détail
  // utile à CE type de retour, plutôt qu'un « ton message » universel.
  placeholder: string;
};

export const FEEDBACK_KINDS: FeedbackKindInfo[] = [
  {
    kind: 'bug',
    label: 'Un bug',
    subject: 'Bug',
    placeholder:
      'Ce qui s’est passé, et ce que tu faisais juste avant. Si tu peux le refaire à volonté, dis-le : c’est le renseignement le plus utile.',
  },
  {
    kind: 'idee',
    label: 'Une idée',
    subject: 'Idée',
    placeholder: 'Ce qui te manque, ou ce que tu aimerais pouvoir faire.',
  },
  {
    kind: 'avis',
    label: 'Un avis',
    subject: 'Avis',
    placeholder: 'Ce qui t’a plu, ce qui t’a gêné, ce qui t’a paru douteux.',
  },
];

export const FEEDBACK_KINDS_BY_ID: Record<FeedbackKind, FeedbackKindInfo> = Object.fromEntries(
  FEEDBACK_KINDS.map((k) => [k.kind, k])
) as Record<FeedbackKind, FeedbackKindInfo>;

// Longueur retenue du message.
//
// Ce n'est pas une limite éditoriale mais une limite technique : un `mailto:`
// est une URL, et les systèmes la tronquent au-delà de quelques milliers de
// caractères. Un message coupé au milieu d'une phrase, sans que rien ne
// l'annonce, serait le pire des comportements — on borne donc franchement, et
// le compteur le dit pendant la frappe.
export const FEEDBACK_MAX = 1500;

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
// `encodeURIComponent` est indispensable sur les deux champs : un retour à la
// ligne, un `&` ou un accent non échappés coupent l'URL, et le message arrive
// amputé sans qu'aucune erreur ne soit levée.
export function buildFeedbackMailto(kind: FeedbackKind, message: string): string {
  const info = FEEDBACK_KINDS_BY_ID[kind];
  const objet = `Élyze · ${info.subject}`;
  const corps = `${message.trim()}\n\n---\n${feedbackContext()}`;
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`;
}
