import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { haptics } from '../utils/haptics';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemeBadge } from './ThemeBadge';
import { PROPOSAL_ARGUMENTS } from '../data/proposalArguments';
import { PROPOSAL_EXPLANATIONS } from '../data/proposalExplanations';
import { Proposal, ThemeTag } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useThemeSettings } from '../theme/ThemeContext';
import { RainbowGradient } from './RainbowGradient';
import { cardFrameSweep, cardSweep } from '../theme/rainbowGradient';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { precisionLabel, proposalProvenance } from '../data/source';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.4 };
const REDUCED_SPRING_CONFIG = { damping: 30, stiffness: 900, mass: 0.4 };

// Au delà de cette vitesse, un mouvement bref suffit à valider la carte même
// si elle n'a pas franchi le seuil de distance.
const FLICK_VELOCITY = 700;
// La sortie suit la vitesse du doigt : un lancer vif part vite, un glissement
// posé part doucement. Bornes pour éviter l'instantané comme l'interminable.
const EXIT_MIN_MS = 130;
const EXIT_MAX_MS = 320;
// Vitesse plancher (px/s) quand la carte est relâchée quasiment à l'arrêt.
const EXIT_MIN_SPEED = 900;
// Le geste ne prend la main qu'au delà de ce déplacement : en deçà, l'appui
// reste disponible et la carte ne tremble pas au moindre effleurement.
const PAN_ACTIVATION = 8;

// --- Grossissement des polices ---------------------------------------------
//
// La carte est une boîte de taille fixe : contrairement à une liste, son texte
// ne peut pas simplement s'allonger, il déborde. Or l'app suit intégralement
// le réglage système, qui peut doubler la taille des caractères.
//
// Deux garde-fous :
//
//  1. la taille de base baisse quand le texte est long, au lieu d'être fixe ;
//  2. le grossissement système est plafonné en conséquence.
//
// Le plafond ne peut pas être une constante unique : une proposition courte a
// de la marge, une longue n'en a aucune. On raisonne donc sur le produit
// « nombre de caractères × taille rendue », qui approxime la hauteur occupée
// par un bloc de texte. Ce budget est PARTAGÉ entre la mesure et son
// explication — ce que prend l'une n'est plus disponible pour l'autre.
//
// D'OÙ VIENT LE 309. C'est ce que la carte affichait déjà sans déborder : la
// plus longue proposition d'alors, à 21 px, plus une ligne de provenance d'une
// trentaine de caractères.
//
// Le vivier a changé depuis, et un filtre de longueur strict a été ajouté à la
// génération : la plus longue proposition embarquée fait aujourd'hui 234
// caractères sur 311, médiane 131. La calibration est donc plus généreuse que
// nécessaire, ce qui est le bon sens de l'erreur — mais elle n'était plus
// vérifiable, et un chiffre dont personne ne sait s'il tient encore ne protège
// personne. `scripts/check-data.js` compare désormais les deux à chaque
// exécution et échoue si une proposition dépasse cette calibration.
const EXPLANATION_SIZE = fonts.small + 1;
const TEXT_BUDGET = 309 * (fonts.cardText - 2) + 36 * fonts.small;

// LE BUDGET SUIT LA HAUTEUR DE LA CARTE.
//
// Le chiffre ci-dessus décrit une quantité de texte, pas une place : il vaut
// pour une carte d'une certaine hauteur, et pour aucune autre. Tant que la
// moitié des mesures n'avaient pas d'explication, l'approximation tenait.
// Depuis que les 311 en ont une, le bloc du bas est toujours là, et sur un
// écran de 640 ou 667 px le « en clair » venait recouvrir l'indice « Glisse
// la carte ».
//
// La hauteur de référence a été MESURÉE, en pilotant l'app sur sept tailles
// d'écran et en relevant l'écart entre le bas du texte et le haut de
// l'indice : positif (donc chevauchement) jusqu'à une carte de 503 px,
// négatif à partir de 543. Le point de bascule tombe vers 508 ; on garde
// 530 pour une marge, sans conséquence sur les grands écrans où la taille
// reste de toute façon plafonnée à `fonts.cardText - 2`.
const REFERENCE_CARD_HEIGHT = 530;

// Le « en clair » rétrécit lui aussi sur une carte courte, et il le faut :
// la mesure seule ne peut pas absorber tout l'écart, puisqu'elle s'arrête à
// MIN_PROPOSAL_SIZE. Sur un écran de 640 px, sans cela, il restait dix-sept
// pixels de recouvrement sur l'indice du bas.
const MIN_EXPLANATION_SIZE = 12;

function explanationSizeFor(cardHeight: number): number {
  if (cardHeight <= 0) return EXPLANATION_SIZE;
  const suivi = (EXPLANATION_SIZE * cardHeight) / REFERENCE_CARD_HEIGHT;
  return Math.round(Math.min(EXPLANATION_SIZE, Math.max(MIN_EXPLANATION_SIZE, suivi)));
}

// Marge intérieure haute et basse de la carte. Trente-deux pixels de chaque
// côté sont justes sur un grand écran et coûteux sur un petit, où ils valent
// deux lignes de texte. En dessous de la hauteur de référence, on les réduit
// plutôt que de rapetisser encore la mesure, déjà à son plancher.
const CARD_PADDING = spacing.xl;
const CARD_PADDING_COMPACT = spacing.md + 4;

function cardPaddingFor(cardHeight: number): number {
  if (cardHeight <= 0 || cardHeight >= REFERENCE_CARD_HEIGHT) return CARD_PADDING;
  return CARD_PADDING_COMPACT;
}

// Air autour du filet qui sépare la mesure de son « en clair ». Vingt-quatre
// pixels de chaque côté, soit quarante-huit en tout : c'est le plus gros poste
// de la carte après les textes eux-mêmes, et il ne dépendait de rien. Le
// réduire sur une carte courte rend deux lignes de texte, sans toucher à la
// taille des caractères — ce qui vaut mieux que de rapetisser encore.
const DIVIDER_MARGIN = spacing.lg;
const DIVIDER_MARGIN_COMPACT = spacing.sm + 2;

function dividerMarginFor(cardHeight: number): number {
  if (cardHeight <= 0 || cardHeight >= REFERENCE_CARD_HEIGHT) return DIVIDER_MARGIN;
  return DIVIDER_MARGIN_COMPACT;
}

// La pastille « Objectif chiffré » n'apparaît que sur une partie des cartes,
// et le budget l'ignorait : elle s'ajoutait sous l'explication sans que rien
// n'ait été mis de côté pour elle. C'est ce qui restait de recouvrement sur
// les quatre dernières cartes du balayage. La réserve est exprimée dans la
// même unité que le budget (caractères × taille), comme celle déjà prévue
// pour la ligne de provenance.
const PRECISION_RESERVE = 26 * fonts.small;

// Le modèle « caractères × taille » approche la hauteur d'un bloc de texte,
// il ne la calcule pas : le retour à la ligne est quantifié, et un mot qui ne
// tient pas coûte une ligne entière. L'écart se voit d'autant plus que la
// carte est courte, où une ligne pèse un dixième de la hauteur disponible.
// D'où cette marge, appliquée aux seules cartes compactes : sur les grandes,
// le modèle a déjà de l'air, et la rogner ferait rapetisser du texte qui
// tenait très bien.
const COMPACT_SAFETY = 0.9;

function budgetFor(cardHeight: number, hasPrecision: boolean): number {
  // `0` = pas encore mesuré (première image) : on s'en tient à la référence.
  if (cardHeight <= 0) return TEXT_BUDGET - (hasPrecision ? PRECISION_RESERVE : 0);
  const suivi = (TEXT_BUDGET * cardHeight) / REFERENCE_CARD_HEIGHT;
  const total = cardHeight < REFERENCE_CARD_HEIGHT ? suivi * COMPACT_SAFETY : suivi;
  return total - (hasPrecision ? PRECISION_RESERVE : 0);
}

// En dessous de cette taille le texte de la carte devient pénible à lire :
// mieux vaut alors le laisser frôler les bords que continuer à le réduire.
const MIN_PROPOSAL_SIZE = 16;

// Epaisseur du cadre arc-en-ciel, quand le degrade est actif.
const FRAME_WIDTH = 3;

function proposalFontSize(
  textLength: number,
  explanationLength: number,
  cardHeight: number,
  hasPrecision: boolean
): number {
  const left =
    budgetFor(cardHeight, hasPrecision) - explanationLength * explanationSizeFor(cardHeight);
  const fits = left / Math.max(1, textLength);
  return Math.round(Math.min(fonts.cardText - 2, Math.max(MIN_PROPOSAL_SIZE, fits)));
}

function proposalMaxMultiplier(
  textLength: number,
  explanationLength: number,
  cardHeight: number,
  hasPrecision: boolean
): number {
  const left =
    budgetFor(cardHeight, hasPrecision) - explanationLength * explanationSizeFor(cardHeight);
  const fits = left / Math.max(1, textLength);
  const used = proposalFontSize(textLength, explanationLength, cardHeight, hasPrecision);
  // Jamais sous 1 — on ne va pas rapetisser le texte de quelqu'un qui a
  // demandé plus gros. Jamais au-delà de 2 : passé ce point on tient trois
  // mots par ligne, et la lisibilité n'y gagne plus rien.
  return Math.min(2, Math.max(1, fits / used));
}

// Lignes secondaires de la carte (étiquette, explication, indice, tampons) :
// elles vivent dans les marges hautes et basses, où la place est comptée.
const SECONDARY_MAX_SCALE = 1.3;

export type SwipeDirection = 'like' | 'superlike' | 'nope' | 'skip';

// Prolonge légèrement le mouvement vertical pendant la sortie, borné pour que
// la carte quitte l'écran sur les côtés et pas par le haut ou le bas.
function offsetYTarget(current: number, velocityY: number): number {
  'worklet';
  const projected = current + velocityY * 0.12;
  return Math.min(140, Math.max(-140, projected));
}

type Props = {
  proposal: Proposal;
  themeTag: ThemeTag;
  stackPosition: number;
  // Hauteur disponible pour la carte, mesurée une fois par le paquet.
  // `0` tant que la mise en page n'a pas eu lieu (voir budgetFor).
  cardHeight: number;
  onSwiped: (direction: SwipeDirection) => void;
  // Ouvre le débat autour de la mesure. Absent sur les cartes du dessous,
  // qui ne sont pas interactives.
  onOpenDebate?: () => void;
  onBecomeTop?: (trigger: (direction: SwipeDirection) => void) => void;
};

export function SwipeCard({
  proposal,
  themeTag,
  stackPosition,
  cardHeight,
  onSwiped,
  onBecomeTop,
  onOpenDebate,
}: Props) {
  const colors = useColors();
  const { gradientEnabled, effectiveScheme } = useThemeSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const reducedMotionEnabled = useReducedMotion();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  // Position de la carte au moment où le doigt se pose : permet de reprendre
  // une carte en plein retour élastique sans qu'elle saute à l'origine.
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const exitOpacity = useSharedValue(1);
  const stackAnim = useSharedValue(stackPosition);
  const reducedMotion = useSharedValue(reducedMotionEnabled);
  // Ne sert qu'à choisir quel tampon afficher (J'ADHÈRE vs SUPER LIKE) quand
  // le swipe part d'un bouton ; reste `null` pendant un drag, qui affiche
  // toujours le tampon "like" normal.
  const [exitKind, setExitKind] = useState<'like' | 'superlike' | null>(null);

  useEffect(() => {
    reducedMotion.value = reducedMotionEnabled;
  }, [reducedMotionEnabled, reducedMotion]);

  useEffect(() => {
    // Durée finie et décélération douce, plutôt qu'un ressort : un ressort
    // s'approche de sa cible sans jamais l'atteindre exactement, et cette
    // traîne maintient l'échelle de la carte sur des valeurs fractionnaires
    // pendant que le texte se re-rend — d'où un tremblement à l'arrivée. Ici
    // la carte se pose exactement à l'échelle 1, puis plus rien ne bouge.
    stackAnim.value = withTiming(stackPosition, {
      duration: reducedMotionEnabled ? 0 : 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [stackPosition, stackAnim, reducedMotionEnabled]);

  const finishSwipe = useCallback(
    (direction: SwipeDirection) => {
      // Un haptique différent par action, déclenché une seule fois ici (que le
      // swipe vienne d'un drag ou d'un appui sur les boutons), pour donner à
      // chaque choix une signature différente au toucher.
      if (direction === 'like' || direction === 'superlike') {
        haptics.notification(Haptics.NotificationFeedbackType.Success);
      } else if (direction === 'nope') {
        haptics.impact(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        haptics.impact(Haptics.ImpactFeedbackStyle.Light);
      }
      onSwiped(direction);
    },
    [onSwiped]
  );

  // Le geste est mémoïsé (pour ne pas être détaché/rattaché à chaque rendu) et
  // fige donc les fonctions qu'il capture. On passe par une référence tenue à
  // jour : sans elle, une carte pourrait valider sa réponse avec un
  // `onSwiped` périmé, donc un index de session obsolète.
  const finishRef = useRef(finishSwipe);
  useEffect(() => {
    finishRef.current = finishSwipe;
  }, [finishSwipe]);

  // UNE CARTE NE VALIDE QU'UNE FOIS, quoi qu'il arrive.
  //
  // Sans ce verrou, deux appuis rapprochés faisaient répondre deux fois pour
  // la même carte. On pourrait croire le cas impossible — une seconde
  // animation sur une valeur partagée annule la première, dont le callback
  // reçoit alors `finished: false` — mais les sorties n'utilisent pas toutes
  // la même valeur : « passer » valide depuis `exitOpacity`, les trois autres
  // depuis `translateX`. Deux valeurs indépendantes, donc aucune n'annule
  // l'autre, et les deux callbacks se déclenchaient avec `finished: true`.
  //
  // La conséquence n'était pas une réponse en double mais une carte SAUTÉE :
  // les deux validations tombant à une vingtaine de millisecondes d'écart, un
  // rendu s'intercalait, et la seconde poussait un `currentIndex` déjà
  // incrémenté. La proposition suivante n'était jamais montrée.
  //
  // La référence se réinitialise d'elle-même : chaque carte est montée sous sa
  // propre clé et démontée en quittant la pile (y compris lors d'un retour en
  // arrière, qui la remonte à neuf).
  const committed = useRef(false);
  const commitSwipe = useCallback((direction: SwipeDirection) => {
    if (committed.current) return;
    committed.current = true;
    finishRef.current(direction);
  }, []);

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      // Sortie déclenchée au bouton : un peu plus courte qu'avant (240 ms),
      // car ici aucun geste ne précède l'animation — l'attente était perçue
      // comme un temps mort entre l'appui et la carte suivante.
      const d = reducedMotion.value ? 0 : 190;
      if (direction === 'skip') {
        translateY.value = withTiming(-SCREEN_WIDTH, { duration: d });
        exitOpacity.value = withTiming(0, { duration: reducedMotion.value ? 0 : 170 }, (finished) => {
          if (finished) runOnJS(commitSwipe)(direction);
        });
        return;
      }
      if (direction === 'like' || direction === 'superlike') setExitKind(direction);
      const target = (direction === 'nope' ? -1 : 1) * SCREEN_WIDTH * 1.5;
      translateX.value = withTiming(target, { duration: d }, (finished) => {
        if (finished) runOnJS(commitSwipe)(direction);
      });
      translateY.value = withTiming(translateY.value - 30, { duration: d });
    },
    [commitSwipe, translateX, translateY, exitOpacity, reducedMotion]
  );

  useEffect(() => {
    if (stackPosition === 0 && onBecomeTop) {
      onBecomeTop(triggerSwipe);
    }
    // Cette réaction ne doit se déclencher que quand la carte devient (ou cesse
    // d'être) la carte du dessus, pas à chaque nouvelle identité de `triggerSwipe`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackPosition]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(stackPosition === 0)
        // Sans seuil d'activation, le moindre tremblement du doigt déplaçait
        // déjà la carte et volait l'appui destiné au lien de la source.
        .activeOffsetX([-PAN_ACTIVATION, PAN_ACTIVATION])
        .activeOffsetY([-PAN_ACTIVATION, PAN_ACTIVATION])
        .onBegin(() => {
          // Reprend la carte là où elle est (elle peut être en plein retour
          // élastique) plutôt que de repartir de zéro au premier mouvement.
          startX.value = translateX.value;
          startY.value = translateY.value;
        })
        .onUpdate((event) => {
          translateX.value = startX.value + event.translationX;
          translateY.value = startY.value + event.translationY * 0.35;
        })
        .onEnd((event) => {
          const offset = translateX.value;
          const flick = Math.abs(event.velocityX) > FLICK_VELOCITY;
          const passedThreshold = Math.abs(offset) > SWIPE_THRESHOLD;

          if (flick || passedThreshold) {
            // Sur un lancer, c'est le sens du geste qui décide : on peut
            // relancer vers la gauche une carte encore à droite de l'origine.
            const goRight = flick ? event.velocityX > 0 : offset > 0;
            const direction: SwipeDirection = goRight ? 'like' : 'nope';
            const target = (goRight ? 1 : -1) * SCREEN_WIDTH * 1.5;

            const distance = Math.abs(target - offset);
            const speed = Math.max(Math.abs(event.velocityX), EXIT_MIN_SPEED);
            const natural = (distance / speed) * 1000;
            const duration = reducedMotion.value
              ? 0
              : Math.min(EXIT_MAX_MS, Math.max(EXIT_MIN_MS, natural));

            translateX.value = withTiming(target, { duration }, (finished) => {
              if (finished) runOnJS(commitSwipe)(direction);
            });
            // La carte continue sur sa lancée verticale au lieu de se figer.
            translateY.value = withTiming(offsetYTarget(translateY.value, event.velocityY), {
              duration,
            });
          } else {
            // Le ressort repart avec la vitesse du doigt : le retour prolonge
            // le geste au lieu de démarrer à l'arrêt.
            const springConfig = reducedMotion.value ? REDUCED_SPRING_CONFIG : SPRING_CONFIG;
            translateX.value = withSpring(0, { ...springConfig, velocity: event.velocityX });
            translateY.value = withSpring(0, { ...springConfig, velocity: event.velocityY });
          }
        }),
    // `finishSwipe` est stable ; seul le passage au sommet de la pile doit
    // reconstruire le geste, sinon il serait détaché/rattaché à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stackPosition]
  );

  const cardStyle = useAnimatedStyle(() => {
    const restScale = 1 - stackAnim.value * 0.06;
    const restTranslateY = stackAnim.value * 16;
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + restTranslateY },
        { rotateZ: `${rotate}deg` },
        { scale: restScale },
      ],
      opacity: exitOpacity.value,
    };
    // Pas de `zIndex` ici : l'empilement vient de l'ordre de rendu du paquet
    // (voir SwipeDeck). L'ancien facteur d'opacité `stackPosition > 2` était
    // par ailleurs mort — la fenêtre ne monte que trois cartes, positions 0 à 2.
  });

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [10, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, -10], [1, 0], Extrapolation.CLAMP),
  }));

  const isTop = stackPosition === 0;
  const precision = precisionLabel(proposal);
  const provenance = proposalProvenance(proposal);
  const explanation = PROPOSAL_EXPLANATIONS[proposal.id];
  const hasDebate = Boolean(PROPOSAL_ARGUMENTS[proposal.id]) && Boolean(onOpenDebate);
  const proposalSize = proposalFontSize(
    proposal.text.length,
    explanation?.length ?? 0,
    cardHeight,
    Boolean(precision)
  );
  const explanationSize = explanationSizeFor(cardHeight);
  const cardPadding = cardPaddingFor(cardHeight);
  const dividerMargin = dividerMarginFor(cardHeight);
  const cardA11yLabel = `Thème : ${themeTag.label}. Proposition : ${proposal.text}.${
    explanation ? ` En clair : ${explanation}` : ''
  }${precision ? ` ${precision}.` : ''} Source : ${provenance}`;

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        { paddingVertical: cardPadding },
        gradientEnabled && styles.cardOnGradient,
        cardStyle,
      ]}
      accessible={isTop}
      accessibilityLabel={isTop ? cardA11yLabel : undefined}
      accessibilityElementsHidden={!isTop}
      importantForAccessibility={isTop ? 'yes' : 'no-hide-descendants'}
    >
      {/* DEUX COUCHES, ET C'EST VOULU.
          Le CADRE porte le dégradé à pleine force : il ne supporte aucun
          texte, donc rien n'y limite la couleur, et c'est lui qui rend le mode
          visible. La FACE, elle, porte la mesure : le dégradé n'y est mélangé
          qu'à 11 %, seul taux qui garde tous les textes de la carte au-dessus
          de 4.5:1 sur chacune des douze teintes du balayage (calculé dans
          theme/rainbowGradient.ts, vérifié par son test).
          Vouloir un fond franchement coloré ET un texte lisible n'est pas un
          réglage à trouver : les deux s'excluent. */}
      {gradientEnabled && (
        <>
          <RainbowGradient colors={cardFrameSweep(effectiveScheme)} style={styles.cardFrame} />
          <RainbowGradient
            colors={cardSweep(effectiveScheme, colors.surface)}
            style={styles.cardFace}
          />
        </>
      )}

      <ThemeBadge theme={themeTag} />

      <View style={styles.textWrap}>
        {/* Taille de base adaptée à la longueur, et grossissement système
            plafonné en conséquence : la carte est une boîte fixe, le texte
            n'a pas la possibilité de simplement s'allonger. */}
        <Text
          style={[
            styles.proposalText,
            { fontSize: proposalSize, lineHeight: proposalSize * 1.3 },
          ]}
          maxFontSizeMultiplier={proposalMaxMultiplier(
            proposal.text.length,
            explanation?.length ?? 0,
            cardHeight,
            Boolean(precision)
          )}
        >
          {proposal.text}
        </Text>
        <View style={[styles.divider, { marginVertical: dividerMargin }]} />
        {/* La mesure est citée mot pour mot au-dessus ; en dessous, la même
            chose en français courant. L'étiquette « EN CLAIR » dit que cette
            phrase est de l'app, pas du candidat — c'est le seul endroit de
            l'app où un texte est reformulé (voir data/proposalExplanations). */}
        {explanation && (
          <>
            <Text style={styles.explanationLabel} maxFontSizeMultiplier={SECONDARY_MAX_SCALE}>
              EN CLAIR
            </Text>
            <Text
              style={[
                styles.explanationText,
                { fontSize: explanationSize, lineHeight: explanationSize * 1.45 },
              ]}
              maxFontSizeMultiplier={SECONDARY_MAX_SCALE}
            >
              {explanation}
            </Text>
          </>
        )}
        {precision && (
          <View style={styles.precisionPill}>
            <Text style={styles.precisionPillText} maxFontSizeMultiplier={SECONDARY_MAX_SCALE}>
              {precision}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.hintText} maxFontSizeMultiplier={SECONDARY_MAX_SCALE}>
        Glisse la carte, ou choisis ci-dessous
      </Text>

      {/* À la place de l'ancien lien vers la fiche Poligraph, retiré : son
          adresse commençait par le nom de l'auteur
          (…/mesures/xavier-bertrand-instaurer-des-quotas-migratoires), ce qui
          révélait qui portait la carte qu'on est en train de juger. La source
          reste citée sur l'accueil, le résultat et « Comment ça marche », ce
          que la licence des données exige. */}
      {isTop && hasDebate && (
        <Pressable
          onPress={onOpenDebate}
          hitSlop={8}
          style={({ pressed }) => [styles.debateButton, pressed && styles.debatePressed]}
          accessibilityRole="button"
          accessibilityLabel="Lire les arguments pour et contre cette mesure"
        >
          <Ionicons name="swap-horizontal" size={13} color={colors.textSecondary} />
          <Text style={styles.debateText} maxFontSizeMultiplier={SECONDARY_MAX_SCALE}>
            Arguments pour et contre
          </Text>
        </Pressable>
      )}

      <Animated.View
        style={[
          styles.stamp,
          styles.likeStamp,
          exitKind === 'superlike' && styles.superlikeStamp,
          likeStampStyle,
        ]}
        pointerEvents="none"
      >
        <Text
          style={[
            styles.stampText,
            exitKind === 'superlike' ? styles.superlikeStampText : styles.likeStampText,
          ]}
          maxFontSizeMultiplier={SECONDARY_MAX_SCALE}
        >
          {exitKind === 'superlike' ? '★ SUPER LIKE' : 'J’ADHÈRE'}
        </Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStampStyle]} pointerEvents="none">
        {/* Le libellé reprend mot pour mot celui du bouton : "passe" pouvait
            se lire comme "pas d'avis", qui est une autre action. */}
        <Text style={[styles.stampText, styles.nopeStampText]} maxFontSizeMultiplier={SECONDARY_MAX_SCALE}>
          PAS POUR MOI
        </Text>
      </Animated.View>
    </Animated.View>
  );

  if (!isTop) {
    return cardContent;
  }

  return <GestureDetector gesture={pan}>{cardContent}</GestureDetector>;
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    // Le cadre est peint DANS la carte, sur ses trois pixels de pourtour :
    // pas de conteneur supplementaire, donc aucune reprise des ombres ni du
    // rayon de coin.
    cardFrame: {
      borderRadius: radii.lg,
    },
    cardFace: {
      top: FRAME_WIDTH,
      left: FRAME_WIDTH,
      right: FRAME_WIDTH,
      bottom: FRAME_WIDTH,
      borderRadius: radii.lg - FRAME_WIDTH,
    },
    // La surface opaque laisse place aux deux couches peintes.
    cardOnGradient: {
      backgroundColor: 'transparent',
    },
    card: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#1A1730',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    textWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    // `fontSize` et `lineHeight` sont posés à l'usage : ils dépendent de la
    // longueur de la proposition (voir `proposalFontSize`).
    proposalText: {
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: spacing.lg,
    },
    explanationLabel: {
      fontSize: fonts.tiny - 1,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.accentText,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    explanationText: {
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.45,
      fontWeight: '500',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    precisionPill: {
      alignSelf: 'center',
      marginTop: spacing.sm,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceAlt,
    },
    precisionPillText: {
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    debateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: spacing.xs,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceAlt,
    },
    debatePressed: {
      opacity: 0.65,
    },
    debateText: {
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    // L'UN DES DEUX TEXTES QUI ÉCHOUAIENT AU CONTRASTE (l'autre est le
    // compteur des pastilles de thème, voir CandidateInfoDialog).
    //
    // Il était en `textMuted` à 70 % d'opacité, ce qui donnait 2,70:1 là où la
    // norme AA en exige 4,5. L'opacité était le vrai coupable : la couleur
    // seule vaut déjà 4,68:1.
    //
    // Mais retirer l'opacité ne suffisait pas. Sur la carte teintée du mode
    // arc-en-ciel, `textMuted` retombe à 4,01:1 — mesuré sur les douze teintes
    // du balayage — et le remonter aurait obligé à pâlir le dégradé jusqu'à le
    // rendre invisible. `textSecondary`, lui, tient 4,53:1 au pire, et il fait
    // déjà partie des couleurs sur lesquelles le mélange de la carte est
    // calibré (voir theme/rainbowGradient.test.ts) : le dégradé garde donc
    // exactement la même force. La discrétion de l'indice vient maintenant de
    // sa taille, pas d'une transparence qui l'effaçait.
    hintText: {
      fontSize: fonts.tiny,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    stamp: {
      position: 'absolute',
      top: spacing.xl,
      borderWidth: 3,
      borderRadius: radii.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    likeStamp: {
      left: spacing.lg,
      borderColor: colors.success,
      transform: [{ rotate: '-14deg' }],
    },
    superlikeStamp: {
      borderColor: colors.warning,
    },
    nopeStamp: {
      right: spacing.lg,
      borderColor: colors.danger,
      transform: [{ rotate: '14deg' }],
    },
    stampText: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 1,
    },
    // Les bordures gardent la couleur vive ; le TEXTE passe par les variantes
    // dédiées, qui tiennent le contraste sur `surface` en mode clair (le vert
    // vif n'y atteignait que 3.02:1).
    likeStampText: { color: colors.successText },
    superlikeStampText: { color: colors.warningText },
    nopeStampText: { color: colors.dangerText },
  });
}
