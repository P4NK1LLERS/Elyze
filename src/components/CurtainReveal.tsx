import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ColorTokens, radii } from '../theme';
import { useColors } from '../theme/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Rideau de théâtre sur la révélation du podium.
//
// L'écran de résultat est le seul moment de l'app où quelque chose est
// réellement dévoilé : pendant tout le paquet, on a jugé des mesures sans
// savoir qui les portait. Une simple apparition en fondu ne disait rien de ce
// basculement. Deux pans qui s'écartent, si.
//
// Le rideau n'est PAS une image : il est peint. Un fichier aurait figé une
// couleur, alors que l'app en a quatre au choix, plus le mode arc-en-ciel qui
// en tire de nouvelles à chaque fois. Les plis sont donc des bandes noires et
// blanches translucides posées sur la couleur d'accent courante — le tissu
// prend la teinte du thème sans qu'aucune couleur ne soit écrite ici.

// Temps rideau fermé avant l'écartement. Ce silence a un rôle : il laisse voir
// qu'il y a un rideau. Sans lui, l'animation démarre avant que l'œil n'ait
// compris ce qu'il regarde, et ne se lit plus que comme un volet qui glisse.
// Elle couvre aussi l'arrivée de la carte elle-même (fondu de 400 ms) : les
// pans ne bougent qu'une fois la carte posée, sinon deux mouvements se
// superposent et aucun ne se lit.
const ATTENTE_MS = 420;
// Écartement. Assez long pour qu'on suive le mouvement, assez court pour ne
// pas retarder la lecture du podium. Raccourci depuis que le podium se
// dévoile ensuite place par place : le rideau n'est plus la révélation, il en
// est l'ouverture, et deux longueurs à la suite feraient attendre.
const ECART_MS = 720;
// La cantonnière remonte pendant que les pans s'écartent, un peu après eux :
// c'est ce décalage qui donne l'impression d'une machinerie, et non d'un seul
// bloc qui se désassemble.
const CANTONNIERE_DELAI_MS = 240;
const CANTONNIERE_MS = 620;

// Instant où la scène commence à se découvrir, à mi-écartement.
//
// C'est là que le podium commence à se remplir, place par place, et non à
// l'ouverture complète : le troisième monte sur sa marche alors que les pans
// finissent de glisser, si bien qu'on aperçoit le mouvement derrière le
// rideau. Attendre la fin laisserait une scène vide une demi-seconde, ce qui
// est exactement ce qu'un rideau ne doit pas révéler.
//
// L'écran de résultat en dérive tout le reste : l'arrivée du vainqueur, la
// vibration, les confettis et le décompte du pourcentage (voir
// podiumRevealDelay dans Podium).
export const CURTAIN_STAGE_MS = ATTENTE_MS + ECART_MS / 2;

// Hauteur de la cantonnière, en proportion de la zone couverte.
const CANTONNIERE_PART = 0.17;

// Plis du tissu. Ombre au creux, lumière sur l'arête : c'est l'alternance qui
// fait le drapé, pas la couleur. Le pan gauche reçoit cette suite telle
// quelle, le pan droit son miroir, pour que les deux soient éclairés depuis
// leur bord extérieur.
const PLIS: readonly [string, string, ...string[]] = [
  'rgba(0,0,0,0.42)',
  'rgba(255,255,255,0.10)',
  'rgba(0,0,0,0.30)',
  'rgba(255,255,255,0.14)',
  'rgba(0,0,0,0.34)',
  'rgba(255,255,255,0.09)',
  'rgba(0,0,0,0.26)',
  'rgba(255,255,255,0.16)',
  'rgba(0,0,0,0.22)',
];

// Le pan droit reçoit la suite inversée, calculée une fois pour toutes.
const PLIS_MIROIR = [...PLIS].reverse() as unknown as readonly [string, string, ...string[]];

export function CurtainReveal({
  play,
  children,
}: {
  // `false` rend les enfants seuls, sans jamais monter le rideau : résultat
  // déjà révélé plus tôt dans la session, ou animations réduites.
  play: boolean;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const actif = play && !reducedMotion;

  // Le rideau disparaît pour de bon une fois joué : le laisser monté, même
  // transparent, garderait deux dégradés inutiles au-dessus du podium.
  const [fini, setFini] = useState(false);
  const [largeur, setLargeur] = useState(0);
  const [hauteur, setHauteur] = useState(0);

  const ouverture = useSharedValue(0);
  const leve = useSharedValue(0);

  // L'animation ne démarre qu'une fois la zone mesurée : les pans se déplacent
  // d'une largeur en pixels, qu'on ne connaît pas avant la mise en page.
  const mesurer = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setLargeur((precedente) => {
        if (precedente > 0 || width === 0) return precedente;
        ouverture.value = withDelay(
          ATTENTE_MS,
          withTiming(1, { duration: ECART_MS, easing: Easing.inOut(Easing.cubic) }, (termine) => {
            'worklet';
            if (termine) runOnJS(setFini)(true);
          })
        );
        leve.value = withDelay(
          ATTENTE_MS + CANTONNIERE_DELAI_MS,
          withTiming(1, { duration: CANTONNIERE_MS, easing: Easing.in(Easing.cubic) })
        );
        return width;
      });
      setHauteur(height);
    },
    [ouverture, leve]
  );

  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const panGauche = useAnimatedStyle(() => ({
    transform: [{ translateX: -ouverture.value * largeur * 0.55 }],
  }));
  const panDroit = useAnimatedStyle(() => ({
    transform: [{ translateX: ouverture.value * largeur * 0.55 }],
  }));
  const cantonniere = useAnimatedStyle(() => ({
    transform: [{ translateY: -leve.value * hauteur * CANTONNIERE_PART }],
    opacity: 1 - leve.value,
  }));

  // Le conteneur reste monté même quand le rideau ne joue pas : sa présence
  // change la mise en page du podium (largeur pleine plutôt qu'ajustée au
  // contenu), et le monter puis le démonter ferait sauter les colonnes au
  // moment exact où l'on veut que le regard s'y pose.
  return (
    <View style={styles.zone} onLayout={actif ? mesurer : undefined}>
      {children}
      {/* `pointerEvents` désactivé : les photos du podium restent tactiles
          pendant l'animation plutôt que d'avaler un appui dans le vide. */}
      {actif && !fini && (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[styles.pan, styles.panGauche, panGauche]}>
          <LinearGradient
            colors={PLIS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[styles.pan, styles.panDroit, panDroit]}>
          <LinearGradient
            colors={PLIS_MIROIR}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[styles.cantonniere, cantonniere]}>
          <LinearGradient
            colors={PLIS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Voile sombre : sans lui, la cantonnière a exactement le tissu
              des pans et ne se distingue plus d'eux. */}
          <View style={styles.ombreCantonniere} />
          {/* Liseré clair sous la cantonnière : c'est lui qui la détache des
              pans, sans quoi le haut du rideau se lit comme une tache. */}
          <View style={styles.galon} />
        </Animated.View>
      </View>
      )}
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    zone: {
      width: '100%',
      // Les pans sortent du cadre : sans rognage, ils déborderaient sur le
      // reste de la carte pendant tout l'écartement.
      overflow: 'hidden',
      borderRadius: radii.md,
    },
    pan: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      // Un demi-point de recouvrement : à 50 % pile, l'arrondi du rendu
      // laissait par moments un cheveu de fond entre les deux pans.
      width: '50.5%',
      backgroundColor: colors.accent,
      overflow: 'hidden',
    },
    panGauche: {
      left: 0,
    },
    panDroit: {
      right: 0,
    },
    cantonniere: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: `${CANTONNIERE_PART * 100}%`,
      backgroundColor: colors.accentStrong,
      overflow: 'hidden',
    },
    ombreCantonniere: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.30)',
    },
    galon: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 3,
      backgroundColor: 'rgba(255,255,255,0.32)',
    },
  });
}
