import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { fonts, spacing } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Animation du logo au lancement.
//
// UNE PRÉCISION QUI ÉVITE UN MALENTENDU : ceci n'est pas l'écran de démarrage
// natif. Aucune plateforme ne sait jouer une vidéo à cet endroit — iOS
// n'accepte qu'une image fixe, Android une image ou un dessin vectoriel. Ce
// qui se passe réellement est un enchaînement de deux écrans :
//
//   1. l'écran natif, un simple aplat violet, pendant le chargement du code ;
//   2. cette animation, par-dessus l'app qui démarre derrière.
//
// Les deux portent le même violet, si bien que le passage de l'un à l'autre
// ne se voit pas. Le fond de la vidéo est mesuré à #5B50E9 contre #5B4FE9
// pour la marque : un point d'écart sur un seul canal, invisible à l'œil.
//
// L'app se monte DERRIÈRE cette animation, pas après : la session est relue
// et l'écran de destination préparé pendant les trois secondes et demie. Le
// temps du logo n'est donc pas du temps perdu.

const SOURCE = require('../../assets/logo-animation.mp4');

// Le violet du fond de la vidéo, repris par l'écran natif et par le cadre
// autour de l'image : c'est ce qui rend les raccords invisibles.
export const INTRO_BACKGROUND = '#5B4FE9';

// Durée réelle du fichier, mesurée : 3,57 s.
const DUREE_MS = 3570;

// Filet de sécurité. Si la vidéo ne démarre pas — fichier illisible, décodeur
// absent, appareil exotique —, l'utilisateur resterait bloqué sur un écran
// violet sans rien pour en sortir. Passé ce délai, on continue quoi qu'il
// arrive. Un écran de lancement qui ne finit jamais est le pire des défauts.
const SECURITE_MS = DUREE_MS + 2500;

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const reducedMotion = useReducedMotion();

  // `onDone` ne doit partir qu'une fois : la fin de la vidéo, le filet de
  // sécurité et un appui peuvent se déclencher coup sur coup.
  const fini = useRef(false);
  const terminer = useCallback(() => {
    if (fini.current) return;
    fini.current = true;
    onDone();
  }, [onDone]);

  const player = useVideoPlayer(SOURCE, (p) => {
    p.muted = true;
    p.loop = false;
  });

  useEffect(() => {
    // La lecture est lancée ICI, et non dans la fonction de création du
    // lecteur. Celle-ci s'exécute avant que la vue vidéo ne soit montée : sur
    // le web, l'ordre est lancé dans le vide et l'élément reste en pause à
    // zéro seconde — constaté à l'inspection, `paused: true`, `currentTime: 0`,
    // sans la moindre erreur pour le signaler.
    player.play();

    const abonnement = player.addListener('playToEnd', terminer);
    const filet = setTimeout(terminer, SECURITE_MS);
    return () => {
      abonnement.remove();
      clearTimeout(filet);
    };
  }, [player, terminer]);

  // Réglage système « réduire les animations » : on passe directement.
  useEffect(() => {
    if (reducedMotion) terminer();
  }, [reducedMotion, terminer]);

  return (
    // Toute la surface est tactile : on ne fait pas attendre quelqu'un qui a
    // déjà vu l'animation vingt fois.
    <Pressable
      style={styles.plein}
      onPress={terminer}
      accessibilityRole="button"
      accessibilityLabel="Passer l’animation de démarrage"
    >
      <VideoView
        style={styles.video}
        player={player}
        contentFit="contain"
        nativeControls={false}
      />
      <Text style={styles.passer}>Toucher pour passer</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plein: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: INTRO_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // La vidéo est carrée : `contain` la centre, et les bandes qui restent
  // portent le même violet que son propre fond.
  video: {
    width: '100%',
    height: '100%',
    // Rien à toucher sur la vidéo elle-même : c'est le calque au-dessus qui
    // reçoit l'appui. En style et non en propriété, cette dernière forme
    // étant dépréciée.
    pointerEvents: 'none',
  },
  passer: {
    position: 'absolute',
    bottom: spacing.xxl,
    fontSize: fonts.tiny,
    fontWeight: '600',
    // Blanc très atténué : présent pour qui le cherche, effacé pour les
    // autres. Il n'a rien à dire d'essentiel, l'appui marche partout.
    color: 'rgba(255,255,255,0.55)',
  },
});
