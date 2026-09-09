import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';

const DURATION_MS = 900;

// Fait défiler le pourcentage de 0 jusqu'à sa valeur finale, pour donner
// au moment de la révélation du résultat un peu de poids. Respecte le
// réglage "réduire les animations" du système en affichant la valeur finale
// directement.
export function AnimatedPercent({
  value,
  style,
  instant,
  delayMs = 0,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  // Retard avant le début du défilement. Sert quand le chiffre est encore
  // caché à l'arrivée sur l'écran : derrière le rideau du podium, un décompte
  // lancé tout de suite serait fini avant d'être visible.
  delayMs?: number;
  // Affiche la valeur finale sans défilement — utilisé quand le "moment de
  // révélation" a déjà eu lieu plus tôt dans la session (voir ResultsScreen)
  // et ne doit pas se rejouer à chaque retour sur l'écran.
  instant?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const skip = reducedMotion || instant;
  const [displayed, setDisplayed] = useState(skip ? value : 0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (skip) {
      setDisplayed(value);
      return;
    }

    const tick = (start: number) => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(value * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(() => tick(start));
      }
    };

    const lancer = () => {
      const start = Date.now();
      frameRef.current = requestAnimationFrame(() => tick(start));
    };

    let attente: ReturnType<typeof setTimeout> | null = null;
    if (delayMs > 0) {
      setDisplayed(0);
      attente = setTimeout(lancer, delayMs);
    } else {
      lancer();
    }

    return () => {
      if (attente !== null) clearTimeout(attente);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, skip, delayMs]);

  return <Text style={style}>{displayed}%</Text>;
}
