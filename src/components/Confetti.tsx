import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useColors, useMedalColors } from '../theme/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Confettis sur l'arrivée du vainqueur.
//
// Ils ne décorent pas : ils DATENT un instant. Le podium se dévoile place par
// place, et sans rien pour marquer la dernière, la troisième arrivée
// ressemble aux deux précédentes. La pluie tombe donc exactement quand le
// premier monte sur sa marche, avec la vibration.
//
// Aucune image, aucune bibliothèque : des rectangles peints, dont la couleur
// vient des jetons du thème. Le mode arc-en-ciel tire de nouvelles teintes,
// et les confettis suivent sans qu'on ait à y penser.

const NOMBRE = 28;
const CHUTE_MS = 2100;
// Étalement des départs : lâchés tous ensemble, ils forment une barre qui
// descend, pas une pluie.
const ETALEMENT_MS = 520;

type Grain = {
  gauche: number;
  taille: number;
  allonge: number;
  derive: number;
  tour: number;
  retard: number;
  duree: number;
  teinte: number;
};

// Générateur reproductible : les grains sont tirés une fois pour toutes au
// montage, sinon chaque rendu redistribuerait la pluie.
function tirer(graine: number): () => number {
  let etat = graine;
  return () => {
    etat = (etat * 1103515245 + 12345) % 2147483648;
    return etat / 2147483648;
  };
}

export function Confetti({ play, delayMs = 0 }: { play: boolean; delayMs?: number }) {
  const colors = useColors();
  const [gold, silver, bronze] = useMedalColors();
  const reducedMotion = useReducedMotion();
  const [taille, setTaille] = useState({ largeur: 0, hauteur: 0 });

  const palette = useMemo(
    () => [gold, silver, bronze, colors.accent, colors.success, colors.warning, colors.danger],
    [gold, silver, bronze, colors.accent, colors.success, colors.warning, colors.danger]
  );

  const grains = useMemo<Grain[]>(() => {
    const hasard = tirer(20260908);
    return Array.from({ length: NOMBRE }, () => ({
      gauche: hasard(),
      taille: 5 + hasard() * 5,
      allonge: 1.4 + hasard() * 1.4,
      derive: (hasard() - 0.5) * 90,
      tour: 240 + hasard() * 620,
      retard: hasard() * ETALEMENT_MS,
      duree: CHUTE_MS * (0.75 + hasard() * 0.5),
      teinte: Math.floor(hasard() * 7),
    }));
  }, []);

  const mesurer = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setTaille((p) => (p.largeur === width && p.hauteur === height ? p : { largeur: width, hauteur: height }));
  };

  if (reducedMotion) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={mesurer}>
      {taille.hauteur > 0 &&
        grains.map((grain, i) => (
          <Paillette
            key={i}
            grain={grain}
            couleur={palette[grain.teinte % palette.length]}
            largeur={taille.largeur}
            hauteur={taille.hauteur}
            play={play}
            delayMs={delayMs}
          />
        ))}
    </View>
  );
}

function Paillette({
  grain,
  couleur,
  largeur,
  hauteur,
  play,
  delayMs,
}: {
  grain: Grain;
  couleur: string;
  largeur: number;
  hauteur: number;
  play: boolean;
  delayMs: number;
}) {
  const chute = useSharedValue(0);

  useEffect(() => {
    if (!play) return;
    // Linéaire : un confetti tombe à vitesse à peu près constante, freiné par
    // l'air. Une courbe d'accélération le ferait tomber comme une pierre.
    chute.value = withDelay(
      delayMs + grain.retard,
      withTiming(1, { duration: grain.duree, easing: Easing.linear })
    );
  }, [play, chute, delayMs, grain.retard, grain.duree]);

  const style = useAnimatedStyle(() => {
    const t = chute.value;
    return {
      transform: [
        { translateY: -20 + t * (hauteur + 60) },
        { translateX: t * grain.derive },
        { rotate: `${t * grain.tour}deg` },
      ],
      // Disparaît sur le dernier quart plutôt que d'être coupé net par le bord.
      opacity: t === 0 ? 0 : 1 - Math.max(0, (t - 0.75) / 0.25),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: grain.gauche * largeur,
          width: grain.taille,
          height: grain.taille * grain.allonge,
          borderRadius: 1.5,
          backgroundColor: couleur,
        },
        style,
      ]}
    />
  );
}
