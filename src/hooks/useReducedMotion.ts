import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Reflète le réglage système "Réduire les animations" (iOS) /
// "Supprimer les animations" (Android), pour que les cartes ne soient pas
// forcées à des animations complètes quand l'utilisateur a explicitement
// demandé le contraire à son téléphone.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setReduced(value);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
