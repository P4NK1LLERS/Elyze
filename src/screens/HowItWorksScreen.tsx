import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';
import { openSourceUrl, POLIGRAPH_LICENCE } from '../data/source';

const SECTIONS: { icon: string; title: string; body: string }[] = [
  {
    icon: '🃏',
    title: 'Le principe',
    body:
      'Chaque carte montre une proposition réelle, avec son thème, mais sans dire quel candidat la porte. Tu glisses à droite si tu adhères, à gauche sinon, ou tu choisis « pas d’avis » si le sujet ne te parle pas.',
  },
  {
    icon: '🧮',
    title: 'Le calcul du score',
    body:
      'Deux choses entrent dans le pourcentage. D’abord à quel point tu es d’accord : la part des propositions d’un candidat que tu as approuvées, un « super like » y pesant 3 fois plus qu’un « j’adhère ». Ensuite sur combien de réponses on le sait : approuver deux mesures n’en dit pas autant que d’en approuver quinze. Seuls « j’adhère », « super like » et « pas pour moi » comptent. Une proposition laissée en « pas d’avis », ou pas encore vue, est ignorée, ni pour ni contre.',
  },
  {
    icon: '⚖️',
    title: 'Pourquoi 100 % n’apparaît jamais',
    body:
      'Un candidat dont tu as approuvé les 2 seules propositions vues n’est pas forcément un meilleur match qu’un autre à 90 % sur 15 : le second repose sur bien plus de preuves. Chaque candidat démarre donc avec un a priori neutre (l’équivalent d’une réponse « pour » et d’une « contre » virtuelles), qui s’efface à mesure que de vraies réponses s’accumulent. C’est une technique classique, utilisée par exemple pour classer des avis en ligne. Concrètement : 2 propositions approuvées donnent 75 %, et 15 donnent 94 %. Le chiffre affiché est exactement celui qui décide du classement : il n’y a pas un nombre à l’écran et un autre en coulisses.',
  },
  {
    icon: '⭐',
    title: 'Le bouton « super like »',
    body:
      'Sur une proposition qui compte vraiment pour toi, utilise le bouton étoile plutôt que « j’adhère » classique : cette réponse pèse alors 3 fois plus dans le calcul de ton meilleur match. C’est en swipant, proposition par proposition, que tu indiques ce qui t’importe le plus, pas en choisissant des thèmes à l’avance.',
  },
  {
    icon: '📚',
    title: 'D’où viennent les propositions',
    body:
      'Les propositions viennent de Poligraph, qui recense les mesures des candidats et les relie à leur document d’origine (programme de parti, déclaration, interview). Le texte affiché en gros sur chaque carte est celui de la mesure, repris mot pour mot, sans coupe ni reformulation. Le lien vers la fiche de chaque mesure a été retiré des cartes : son adresse commence par le nom du candidat, ce qui revenait à te dire qui portait la carte que tu es en train de juger.',
  },
  {
    icon: '⚖️',
    title: 'Les arguments pour et contre',
    body:
      'Sous chaque carte, un bouton ouvre les deux camps : ce qu’avancent ceux qui défendent la mesure, ce qu’objectent ceux qui s’y opposent. Ces résumés sont écrits par l’app, pas par le candidat, et ils rapportent un débat existant. L’app ne dit jamais qui a raison. Les deux côtés sont toujours présents et de longueur comparable : un argument seul, ou plus développé d’un côté, serait un jugement déguisé. Aucun nom de candidat n’y apparaît, pour ne pas trahir l’auteur de la carte.',
  },
  {
    icon: '💡',
    title: 'Le « en clair », c’est nous',
    body:
      'Beaucoup de mesures sont rédigées en langage administratif, et rester incompréhensible n’aide personne à se prononcer. Sous chaque proposition, la ligne « EN CLAIR » la redit donc en français courant. Cette phrase-là est écrite par l’app, pas par le candidat : c’est pour cette raison qu’elle est signalée à part et jamais mise à la place du texte d’origine. Elle se contente de reformuler ce qui est écrit et d’expliquer les termes techniques, mais elle n’ajoute aucun chiffre, aucun contexte, aucun avis sur la mesure. En cas de doute, c’est le texte du dessus qui fait foi.',
  },
  {
    icon: '⚖️',
    title: 'Pourquoi ces candidats, et pas d’autres',
    body:
      'Poligraph recense une trentaine de personnalités. En retenir autant donnerait un questionnaire interminable, alors l’app en garde onze, choisies sur un critère qu’il faut assumer : avoir exercé une fonction exécutive nationale (Premier ministre, ministre), diriger un parti disposant d’un groupe au Parlement, ou avoir conduit une liste nationale aux dernières européennes. C’est un choix éditorial, pas une mesure de leurs chances : personne ici ne prédit le résultat de 2027, et être absent de cette liste ne dit rien de la qualité d’une candidature. Des candidats sérieux en sont écartés : c’est la limite de l’exercice.',
  },
  {
    icon: '⚖️',
    title: 'Pourquoi le même nombre de propositions pour tous',
    body:
      'Les programmes n’ont pas la même taille : certains comptent des centaines de mesures, d’autres une vingtaine. Si un candidat occupait la moitié du paquet, il gagnerait mécaniquement. L’app retient donc exactement quinze propositions par candidat, réparties sur ses différents thèmes, et un candidat qui n’en aurait pas assez de publiées ne peut pas figurer dans la comparaison. Chacun pèse ainsi le même poids dans ton résultat.',
  },
  {
    icon: '🔒',
    title: 'Tes données',
    body:
      'Tout reste sur ton téléphone. L’app ne fait aucun appel réseau, n’envoie rien nulle part et ne suit aucune statistique : tes réponses et ton résultat ne quittent jamais l’appareil.',
  },
];

export function HowItWorksScreen({ onBack }: { onBack: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Comment ça marche" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardIcon}>{section.icon}</Text>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        ))}

        <Pressable
          onPress={openSourceUrl}
          style={({ pressed }) => [styles.sourceLink, pressed && styles.sourceLinkPressed]}
          accessibilityRole="link"
          accessibilityLabel="Ouvrir Poligraph dans le navigateur"
        >
          <Ionicons name="open-outline" size={16} color={colors.accentText} />
          <Text style={styles.sourceLinkText}>Voir toutes les mesures sur Poligraph</Text>
        </Pressable>

        <Text style={styles.licence}>
          Données Poligraph, {POLIGRAPH_LICENCE}.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    cardIcon: {
      fontSize: 24,
      marginBottom: spacing.xs,
    },
    cardTitle: {
      fontSize: fonts.body,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    cardBody: {
      fontSize: fonts.small,
      lineHeight: fonts.small * 1.5,
      color: colors.textSecondary,
    },
    sourceLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
    },
    sourceLinkPressed: {
      opacity: 0.7,
    },
    sourceLinkText: {
      fontSize: fonts.small,
      fontWeight: '700',
      color: colors.accentText,
    },
    licence: {
      fontSize: fonts.tiny,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: fonts.tiny * 1.5,
      paddingHorizontal: spacing.md,
    },
  });
}
