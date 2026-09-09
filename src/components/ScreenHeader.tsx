import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorTokens, fonts, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

// En-tête partagé (chevron retour + titre) pour les écrans secondaires, afin
// qu'ils restent visuellement alignés entre eux.
export function ScreenHeader({
  title,
  onBack,
  rightAccessory,
}: {
  title: string;
  onBack?: () => void;
  rightAccessory?: React.ReactNode;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={styles.side}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{rightAccessory}</View>
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    side: {
      width: 32,
      alignItems: 'center',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: fonts.body + 2,
      fontWeight: '800',
      color: colors.textPrimary,
    },
  });
}
