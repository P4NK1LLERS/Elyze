import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { milestonesFor } from '../utils/milestones';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useThemeSettings } from '../theme/ThemeContext';
import { RainbowGradient } from './RainbowGradient';
import { progressSweep } from '../theme/rainbowGradient';

// La barre est découpée aux paliers qui déclenchent les annonces de
// progression (voir utils/milestones). Trois paliers donnent quatre segments.
//
// L'intérêt n'est pas décoratif : une barre continue ne laisse rien deviner,
// et l'annonce tombe sans prévenir. Avec les coupures visibles, on voit le
// segment en cours se remplir et on sait qu'on approche de quelque chose.
//
// Le découpage se calcule à partir du paquet COURANT, et non une fois pour
// toutes au chargement du module : le nombre de paliers dépend désormais de
// la longueur de la partie, et une partie filtrée par thèmes en a moins.
// Recopier les bornes ici afficherait des coupures là où plus aucune annonce
// ne tombe.
function segmentsFor(total: number): { start: number; span: number }[] {
  const bounds = [0, ...milestonesFor(total).map((step) => step.ratio), 1];
  return bounds.slice(0, -1).map((start, i) => ({ start, span: bounds[i + 1] - start }));
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const colors = useColors();
  const { gradientEnabled, effectiveScheme } = useThemeSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const segments = useMemo(() => segmentsFor(total), [total]);
  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  const done = Math.min(current, total);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
      accessibilityLabel={`Progression : ${done} proposition${done > 1 ? 's' : ''} sur ${total}`}
    >
      <View style={styles.track}>
        {segments.map((segment) => (
          <Segment
            key={segment.start}
            ratio={ratio}
            styles={styles}
            gradient={gradientEnabled ? progressSweep(effectiveScheme) : null}
            {...segment}
          />
        ))}
      </View>
      <Text
        style={styles.label}
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        importantForAccessibility="no"
      >
        {done} / {total}
      </Text>
    </View>
  );
}

function Segment({
  start,
  span,
  ratio,
  styles,
  gradient,
}: {
  start: number;
  span: number;
  ratio: number;
  styles: ReturnType<typeof makeStyles>;
  // Balayage arc-en-ciel, ou `null` quand le dégradé est éteint.
  gradient: string[] | null;
}) {
  // Avancement à l'intérieur de CE segment : 0 tant qu'on ne l'a pas atteint,
  // 1 dès qu'il est franchi.
  const filled = Math.min(1, Math.max(0, (ratio - start) / span));
  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(`${filled * 100}%`, { duration: 220 }),
  }));

  // `flex` proportionnel à la largeur du segment : les paliers ne sont pas
  // forcément régulièrement espacés, et la barre doit rester juste s'ils
  // changent.
  // Ici le dégradé est PUR : la barre ne porte aucun texte, donc rien ne
  // limite la couleur. Ses teintes sont seulement choisies pour se détacher de
  // la piste (3:1, voir theme/rainbowGradient.ts).
  //
  // Chaque segment porte son propre dégradé plutôt qu'une bande unique
  // traversant la barre : les segments sont séparés par les coupures des
  // paliers, et une bande continue devrait les enjamber sans les remplir.
  return (
    <View style={[styles.segment, { flex: span }]}>
      <Animated.View style={[styles.fill, gradient ? styles.fillGradient : null, fillStyle]}>
        {gradient && <RainbowGradient colors={gradient} />}
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    track: {
      flex: 1,
      flexDirection: 'row',
      // L'écart entre deux segments EST le repère : c'est lui qui signale le
      // palier. Assez large pour se voir, assez étroit pour que la barre se
      // lise encore comme une seule progression.
      gap: 3,
    },
    segment: {
      height: 6,
      borderRadius: radii.pill,
      backgroundColor: colors.neutralTrack,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: radii.pill,
      backgroundColor: colors.accent,
    },
    // Le degrade remplace l'aplat d'accent ; `overflow` garde ses coins
    // arrondis, sans quoi la bande peinte deborderait du segment.
    fillGradient: {
      backgroundColor: 'transparent',
      overflow: 'hidden',
    },
    label: {
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: colors.textMuted,
      minWidth: 44,
      textAlign: 'right',
      fontVariant: ['tabular-nums'],
    },
  });
}
