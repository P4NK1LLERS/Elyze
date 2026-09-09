import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeTag } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

export function ThemeBadge({ theme }: { theme: ThemeTag }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>{theme.icon}</Text>
      <Text style={styles.label}>{theme.label}</Text>
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.accentSoft,
      borderRadius: radii.pill,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    icon: {
      fontSize: fonts.body,
    },
    label: {
      fontSize: fonts.small,
      fontWeight: '700',
      color: colors.accentText,
      letterSpacing: 0.2,
    },
  });
}
