import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Candidate } from '../types';
import { CANDIDATE_PHOTOS } from '../data/candidatePhotos';
import { useColors } from '../theme/ThemeContext';

type Props = {
  candidate: Candidate;
  size: number;
  emphasized?: boolean;
  // Rend la photo tactile : ouvre la fiche du candidat. À ne câbler que là où
  // l'avatar est assez grand pour être visé, et où il n'est pas déjà dans une
  // zone tactile qui fait autre chose.
  onPress?: () => void;
};

export function Avatar({ candidate, size, emphasized, onPress }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(), []);
  const photo = CANDIDATE_PHOTOS[candidate.id];
  const borderColor = emphasized ? colors.accent : colors.border;
  const shape = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  // Plus aucun recadrage à l'affichage : les onze portraits sont carrés et
  // déjà cadrés sur le visage (voir data/candidatePhotos). Trois d'entre eux
  // étaient auparavant redressés ici, à coups de hauteur calculée et de marge
  // négative, parce que `resizeMode="cover"` rogne au centre et décapitait un
  // portrait vertical. Le problème se règle dans le fichier, pas à l'écran.
  const content = photo ? (
    <Image
      source={photo}
      resizeMode="cover"
      accessible
      accessibilityRole="image"
      accessibilityLabel={candidate.name}
      style={[shape, styles.photo, { borderColor, borderWidth: emphasized ? 2 : StyleSheet.hairlineWidth }]}
    />
  ) : (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={candidate.name}
      style={[
        shape,
        styles.fallback,
        {
          borderColor,
          backgroundColor: emphasized ? colors.accent : colors.surfaceAlt,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: size * 0.32, color: emphasized ? colors.onAccent : colors.textSecondary },
        ]}
      >
        {candidate.initials}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
      accessibilityRole="button"
      accessibilityLabel={`${candidate.name}, voir sa fiche`}
    >
      {content}
    </Pressable>
  );
}

function makeStyles() {
  return StyleSheet.create({
    photo: {
      borderWidth: StyleSheet.hairlineWidth,
    },
    fallback: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
    },
    initials: {
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
