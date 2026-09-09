import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { Avatar } from './Avatar';
import { AnimatedPercent } from './AnimatedPercent';
import { CandidateResult } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useMedalColors } from '../theme/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const STEP_HEIGHTS: Record<number, number> = { 1: 84, 2: 58, 3: 42 };
const AVATAR_SIZES: Record<number, number> = { 1: 64, 2: 52, 3: 48 };

// Un rang peut dépasser trois quand des ex æquo occupent les places du dessus
// (1, 1, 3 : il n'y a pas de deuxième). On retombe alors sur l'apparence du
// bronze, faute de médaille au-delà.
const medal = (rank: number) => MEDALS[rank] ?? MEDALS[3];
const stepHeight = (rank: number) => STEP_HEIGHTS[rank] ?? STEP_HEIGHTS[3];
const avatarSize = (rank: number) => AVATAR_SIZES[rank] ?? AVATAR_SIZES[3];

// DÉVOILEMENT PAR PLACES, DU TROISIÈME AU PREMIER.
//
// Tout afficher d'un coup gâche la seule chose que l'écran a à raconter. Les
// jeux de quiz l'ont compris depuis longtemps : on annonce le troisième,
// puis le deuxième, et on garde le vainqueur pour la fin. Chaque place monte
// sur sa marche, qui pousse depuis le sol et soulève celui qui s'y tient.
//
// L'intervalle est assez long pour qu'on ait le temps de lire un nom, assez
// court pour ne pas faire attendre : on tient sur une seconde et demie pour
// les trois.
export const PODIUM_STEP_MS = 480;

// Retard d'une place donnée par rapport au début du dévoilement. Exporté :
// l'écran de résultat s'en sert pour faire coïncider la vibration, les
// confettis et le décompte du pourcentage avec l'arrivée du premier.
export function podiumRevealDelay(rank: number): number {
  return (3 - rank) * PODIUM_STEP_MS;
}

// Podium visuel du top 3 (comme un podium olympique) : 2e à gauche, 1er au
// centre (plus grand, marche plus haute), 3e à droite. Remplace l'ancien
// affichage "un seul candidat en avant" pour montrer d'un coup d'œil qui
// arrive juste derrière le meilleur match.
export function Podium({
  results,
  instant,
  countDelayMs = 0,
  revealAt,
  nameLines = 1,
  onCandidatePress,
}: {
  results: CandidateResult[];
  instant?: boolean;
  // Instant, en millisecondes après le montage, où le dévoilement commence.
  // `undefined` = tout est là d'emblée : c'est le cas partout sauf sur
  // l'écran de résultat (onglet Classement, carte de partage).
  revealAt?: number;
  // Retard du décompte du pourcentage du premier. Le podium peut arriver
  // caché derrière le rideau de la révélation (voir CurtainReveal) : le
  // chiffre ne doit défiler qu'une fois les pans écartés.
  countDelayMs?: number;
  // Absent sur la carte de partage, qui est une image : rien n'y est tactile.
  onCandidatePress?: (candidateId: string) => void;
  // Les colonnes sont étroites : sur la carte de partage, où la largeur est
  // fixe et plus contrainte qu'à l'écran, deux lignes évitent de tronquer les
  // noms longs. Les marches restent alignées en bas quoi qu'il arrive.
  nameLines?: number;
}) {
  const colors = useColors();
  // Or / argent / bronze, ou trois teintes tirées au sort en mode
  // arc-en-ciel. Dans les deux cas le texte blanc du rang y tient 4.5:1.
  const [gold, silver, bronze] = useMedalColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // LE RANG VIENT DU RÉSULTAT, PLUS DE LA POSITION.
  //
  // C'était le défaut : la place dans la liste tenait lieu de rang, si bien
  // que trois candidats à égalité recevaient l'or, l'argent et le bronze
  // selon leur ordre alphabétique. Le rang est maintenant calculé avec les
  // égalités (voir utils/scoring), et le podium se contente de l'afficher :
  // deux ex æquo portent la même médaille, sur des marches de même hauteur.
  const top = results.slice(0, 3).map((result) => ({ result, rank: result.rank }));
  if (top.length === 0) return null;

  const order = top.length === 3 ? [top[1], top[0], top[2]] : top.length === 2 ? [top[1], top[0]] : top;

  const stepColor = (rank: number) => (rank === 1 ? gold : rank === 2 ? silver : bronze);

  return (
    <View style={styles.row}>
      {order.map(({ result, rank }) => (
        <PodiumColumn
          key={result.candidate.id}
          result={result}
          rank={rank}
          styles={styles}
          stepColor={stepColor(rank)}
          instant={instant}
          countDelayMs={countDelayMs}
          revealAt={revealAt}
          nameLines={nameLines}
          onCandidatePress={onCandidatePress}
        />
      ))}
    </View>
  );
}

function PodiumColumn({
  result,
  rank,
  styles,
  stepColor,
  instant,
  countDelayMs,
  revealAt,
  nameLines,
  onCandidatePress,
}: {
  result: CandidateResult;
  rank: number;
  styles: ReturnType<typeof makeStyles>;
  stepColor: string;
  instant?: boolean;
  countDelayMs: number;
  revealAt?: number;
  nameLines: number;
  onCandidatePress?: (candidateId: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const anime = revealAt !== undefined && !reducedMotion;

  // `1` = en place. On part de 1 quand il n'y a rien à animer, ce qui rend le
  // composant identique à sa version précédente partout ailleurs.
  const arrivee = useSharedValue(anime ? 0 : 1);

  useEffect(() => {
    if (!anime) {
      arrivee.value = 1;
      return;
    }
    // Un ressort plutôt qu'une durée : la marche dépasse légèrement sa
    // hauteur avant de s'y poser, et c'est ce petit rebond qui fait la
    // différence entre « apparaître » et « monter sur le podium ».
    arrivee.value = withDelay(
      (revealAt ?? 0) + podiumRevealDelay(rank),
      withSpring(1, { damping: 11, stiffness: 170, mass: 0.9 })
    );
  }, [anime, arrivee, rank, revealAt]);

  // Hauteur de la marche, calculée ICI et non dans les worklets ci-dessous.
  //
  // Un worklet est envoyé au fil d'exécution de l'interface avec tout ce qu'il
  // capture. Une valeur y passe ; une FONCTION ordinaire, non. Appeler
  // `stepHeight(rank)` à l'intérieur faisait arriver la fonction là-bas sous
  // forme d'objet, et l'app plantait sur « stepHeight is not a function (it is
  // Object) » dès l'ouverture du podium.
  //
  // Le piège vient de la lecture : le code paraît juste, et il l'est sur le
  // web, où tout tourne sur le même fil. Il ne casse que sur l'appareil.
  const hauteurMarche = stepHeight(rank);

  // La marche pousse depuis le sol, et emporte avec elle celui qui s'y tient.
  //
  // ELLE NE GRANDIT PAS VRAIMENT : sa hauteur est réservée dès le départ, et
  // c'est un aplat glissé par en dessous qui la remplit. Animer la hauteur
  // pour de bon marchait, mais refaisait la mise en page à chaque image : la
  // carte entière s'allongeait au fur et à mesure des arrivées, et tout ce qui
  // se trouve dessous — les onglets, le classement — montait et descendait
  // avec elle. Ici la place est prise d'avance et seules des transformations
  // bougent, donc rien ne remue autour.
  const stepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - Math.min(1, arrivee.value)) * hauteurMarche }],
  }));

  // Le bloc du haut descend d'autant : à l'arrêt il est au sol, et la marche
  // le hisse. Le vainqueur monte donc plus haut que les autres, ce qui est
  // exactement ce qu'un podium raconte.
  const contentStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, arrivee.value * 1.6),
    transform: [
      { translateY: (1 - Math.min(1, arrivee.value)) * hauteurMarche },
      { scale: 0.86 + Math.min(1, arrivee.value) * 0.14 },
    ],
  }));

  return (
    // Le podium se lit d'un coup d'œil, mais un lecteur d'écran y trouvait une
    // suite de fragments ("médaille d'or", le nom, "84%", "1"). On le regroupe
    // en une seule annonce et on masque la décoration.
    <View
      style={styles.column}
      // Quand la photo est tactile, on ne regroupe pas la colonne en un seul
      // élément : cela masquerait le bouton aux lecteurs d'écran.
      accessible={!onCandidatePress}
      accessibilityRole={onCandidatePress ? undefined : 'text'}
      accessibilityLabel={
        onCandidatePress
          ? undefined
          : `${result.tied ? 'Ex æquo, ' : ''}${rank === 1 ? '1er' : `${rank}e`} : ${result.candidate.name}, ${result.candidate.party}, ${result.pct}% de compatibilité`
      }
    >
      <Animated.View style={[styles.head, contentStyle]}>
        <Text style={styles.medal} accessibilityElementsHidden importantForAccessibility="no">
          {medal(rank)}
        </Text>
        <Avatar
          candidate={result.candidate}
          size={avatarSize(rank)}
          emphasized={rank === 1}
          onPress={onCandidatePress ? () => onCandidatePress(result.candidate.id) : undefined}
        />
        <Text style={styles.name} numberOfLines={nameLines}>
          {result.candidate.name}
        </Text>
        {rank === 1 ? (
          <AnimatedPercent
            value={result.pct}
            style={styles.pctPrimary}
            instant={instant}
            delayMs={countDelayMs}
          />
        ) : (
          <Text style={styles.pct}>{result.pct}%</Text>
        )}
      </Animated.View>
      <View
        style={[styles.step, { height: stepHeight(rank) }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View style={[styles.stepFill, { backgroundColor: stepColor }, stepStyle]}>
          <Text style={styles.stepNumber}>{rank}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    column: {
      flex: 1,
      maxWidth: 120,
      alignItems: 'center',
      gap: 4,
    },
    // Regroupe ce qui surmonte la marche, pour l'animer d'un bloc.
    //
    // `width: 100 %` n'est pas décoratif : le nom se limite à la largeur de
    // son parent, et sans contrainte ici ce parent prenait la largeur du nom
    // lui-même. Un nom long débordait alors de sa colonne et se faisait
    // rogner par la gauche.
    head: {
      width: '100%',
      alignItems: 'center',
      gap: 4,
    },
    medal: {
      fontSize: 20,
    },
    name: {
      fontSize: fonts.tiny + 1,
      fontWeight: '700',
      color: colors.textPrimary,
      maxWidth: '100%',
      textAlign: 'center',
    },
    pct: {
      fontSize: fonts.body,
      fontWeight: '800',
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    pctPrimary: {
      fontSize: fonts.title,
      fontWeight: '800',
      color: colors.accentText,
      fontVariant: ['tabular-nums'],
    },
    // Boîte de la marche : sa hauteur est fixe et réservée dès le premier
    // rendu. Elle ne porte aucune couleur, seulement le rognage.
    step: {
      width: '100%',
      overflow: 'hidden',
      borderTopLeftRadius: radii.sm,
      borderTopRightRadius: radii.sm,
      marginTop: spacing.xs,
    },
    // L'aplat qui monte à l'intérieur.
    stepFill: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumber: {
      fontSize: fonts.body + 2,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
}
