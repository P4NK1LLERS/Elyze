import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { haptics } from '../utils/haptics';
import { ThemeAgreement } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useThemeColor } from '../theme/ThemeContext';

// Sujet par sujet : ce qu'on a retenu, et de qui. Chaque thème est replié au
// départ — la liste sert d'abord de vue d'ensemble, on n'ouvre que ce qu'on
// veut lire. Partagé par l'onglet Classement et l'écran de résultat, pour que
// les deux disent exactement la même chose.
export function ThemeAgreementList({
  entries,
  showCandidates,
  hiddenNote,
}: {
  entries: ThemeAgreement[];
  // Les noms des candidats ne s'affichent que si l'écran appelant l'autorise :
  // avant la fin du paquet, un thème ne comptant qu'une proposition par
  // candidat désignerait sinon l'auteur d'une carte précise.
  showCandidates: boolean;
  hiddenNote: string;
}) {
  const colors = useColors();
  const getThemeColor = useThemeColor();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (themeId: string) => {
    haptics.selection();
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(themeId)) next.delete(themeId);
      else next.add(themeId);
      return next;
    });
  };

  if (entries.length === 0) {
    return <Text style={styles.empty}>Aucune proposition répondue pour l’instant.</Text>;
  }

  return (
    <>
      {entries.map((entry) => {
        const isOpen = expanded.has(entry.theme.id);
        const plural = entry.approved > 1 ? 's' : '';
        return (
          <View key={entry.theme.id} style={styles.block}>
            <Pressable
              onPress={() => toggle(entry.theme.id)}
              style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={`${entry.theme.label}, ${entry.approved} proposition${plural} retenue${plural} sur ${entry.answered}. ${
                isOpen ? 'Toucher pour replier' : 'Toucher pour voir avec qui'
              }`}
            >
              <View style={[styles.dot, { backgroundColor: getThemeColor(entry.theme.id) }]}>
                <Text style={styles.dotIcon}>{entry.theme.icon}</Text>
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {entry.theme.label}
              </Text>
              <Text style={styles.score}>
                {entry.approved}/{entry.answered}
              </Text>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>

            {isOpen && !showCandidates && <Text style={styles.note}>{hiddenNote}</Text>}

            {isOpen &&
              showCandidates &&
              (entry.candidates.length === 0 ? (
                <Text style={styles.note}>Tu n’as retenu aucune proposition sur ce sujet.</Text>
              ) : (
                entry.candidates.map(({ candidate, agreed, answered }) => (
                  <View key={candidate.id} style={styles.row}>
                    <Avatar candidate={candidate} size={26} />
                    <Text style={styles.name} numberOfLines={1}>
                      {candidate.name}
                    </Text>
                    <Text style={styles.count}>
                      {agreed}/{answered}
                    </Text>
                  </View>
                ))
              ))}
          </View>
        );
      })}
    </>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    empty: {
      fontSize: fonts.small,
      color: colors.textMuted,
      paddingVertical: spacing.sm,
    },
    block: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      // Ligne entière tactile, et assez haute pour être visée sans effort.
      paddingVertical: spacing.xs + 2,
    },
    headerPressed: {
      opacity: 0.6,
    },
    dot: {
      width: 24,
      height: 24,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotIcon: {
      fontSize: 12,
    },
    label: {
      flex: 1,
      fontSize: fonts.small,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    score: {
      fontSize: fonts.tiny + 1,
      fontWeight: '800',
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    note: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.45,
      color: colors.textMuted,
      paddingLeft: 32,
      paddingBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingLeft: 32,
      paddingVertical: 4,
    },
    name: {
      flex: 1,
      fontSize: fonts.tiny + 1,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    count: {
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
  });
}
