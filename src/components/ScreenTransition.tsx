import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Petit fondu d'entrée pour chaque écran, pour que les changements d'écran
// (accueil → thèmes → swipe → résultat...) ne soient plus des coupures
// brutales. Pas d'animation de sortie (l'écran précédent disparaît
// simplement), mais l'effet perçu reste celui d'une transition fluide.
export function ScreenTransition({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View style={styles.flex} entering={reducedMotion ? undefined : FadeIn.duration(220)}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
