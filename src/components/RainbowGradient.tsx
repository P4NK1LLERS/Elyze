import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Dégradé arc-en-ciel animé, en boucle continue.
//
// COMMENT LE MOUVEMENT EST OBTENU. Pas en changeant les couleurs à chaque
// image : recalculer un dégradé soixante fois par seconde passerait par le fil
// JavaScript, qui est déjà occupé par le geste de swipe, et le mouvement
// saccaderait précisément au moment où l'on manipule la carte.
//
// À la place, le dégradé est peint UNE FOIS, sur une bande deux fois plus
// large que son conteneur, et cette bande est translatée. La translation est
// une propriété animée par Reanimated sur le fil natif : le fil JavaScript n'a
// plus rien à faire une fois l'animation lancée.
//
// La bande contient le balayage DEUX FOIS de suite. Quand elle s'est déplacée
// d'exactement une largeur de conteneur, l'image est identique à celle du
// départ : on peut donc revenir à zéro sans que rien ne se voie. C'est ce qui
// rend la boucle infinie sans à-coup ni retour en arrière visible.
export function RainbowGradient({
  colors,
  durationMs = 9000,
  style,
}: {
  // Le balayage, première couleur répétée en fin de liste (voir
  // theme/rainbowGradient.ts).
  colors: string[];
  durationMs?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      // Le système demande de réduire les animations : le dégradé reste, mais
      // figé. Il garde sa fonction décorative sans mouvement imposé.
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      // Linéaire, sans accélération ni ralentissement : toute autre courbe
      // produirait une pulsation au raccord de la boucle.
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [durationMs, progress, reducedMotion]);

  // La bande fait 200 % de large ; on la décale d'une demi-longueur, soit
  // exactement une largeur de conteneur.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${-50 * progress.value}%` }],
  }));

  // Le balayage deux fois de suite, sans doubler la couleur de jonction.
  const doubled = [...colors, ...colors.slice(1)];

  return (
    <View style={[styles.clip, style]} pointerEvents="none">
      <Animated.View style={[styles.band, animatedStyle]}>
        <LinearGradient
          colors={doubled as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '200%',
  },
});
