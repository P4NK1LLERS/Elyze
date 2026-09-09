import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { THEMES } from '../data/themes';
import { CATEGORIES } from '../data/categories';
import { PROPOSALS } from '../data/proposals';
import { CANDIDATES } from '../data/candidates';
import { candidatesQuota, QUOTA_PAR_CANDIDAT } from '../utils/deck';
import { ThemeTag } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

const COUNT_BY_THEME: Record<string, number> = {};
const CANDIDATES_BY_THEME: Record<string, Set<string>> = {};
for (const p of PROPOSALS) {
  COUNT_BY_THEME[p.themeId] = (COUNT_BY_THEME[p.themeId] ?? 0) + 1;
  (CANDIDATES_BY_THEME[p.themeId] ??= new Set()).add(p.candidateId);
}

// En dessous de ce nombre de propositions par candidat, le pourcentage affiché
// à la fin ne repose sur presque rien : avec une seule réponse, il ne peut
// valoir que 0 % ou 100 %. On prévient avant de lancer, plutôt que de laisser
// l'app afficher un podium d'apparence définitive.
const MIN_PAR_CANDIDAT = 3;

const GROUPS = CATEGORIES.map((category) => ({
  category,
  themes: THEMES.filter((t) => t.categoryId === category.id),
})).filter((g) => g.themes.length > 0);

export function ThemeSelectScreen({
  initialSelection,
  onConfirm,
  onBack,
}: {
  initialSelection: string[];
  onConfirm: (themeIds: string[]) => void;
  onBack: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection));

  const toggle = (themeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(themeId)) next.delete(themeId);
      else next.add(themeId);
      return next;
    });
  };

  const toggleCategory = (themes: ThemeTag[]) => {
    const allIn = themes.every((t) => selected.has(t.id));
    setSelected((prev) => {
      const next = new Set(prev);
      themes.forEach((t) => (allIn ? next.delete(t.id) : next.add(t.id)));
      return next;
    });
  };

  const allSelected = selected.size === THEMES.length;
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(THEMES.map((t) => t.id)));
  };

  // Ce que la sélection contient, et ce que la partie en tirera VRAIMENT.
  //
  // Le bouton annonçait jusqu'ici la taille du vivier — la somme des mesures
  // des thèmes cochés. Or le tirage ramène tout le monde au plus petit vivier
  // disponible et ignore les candidats absents : sur le seul thème « Santé »,
  // le bouton promettait 18 propositions et la partie en servait 9. On calcule
  // donc ici exactement ce que fera utils/deck.
  const tirage = useMemo(() => {
    const ids = [...selected];
    const vivier = ids.reduce((sum, id) => sum + (COUNT_BY_THEME[id] ?? 0), 0);
    const presents = new Set<string>();
    for (const id of ids) {
      for (const c of CANDIDATES_BY_THEME[id] ?? []) presents.add(c);
    }
    const pool = PROPOSALS.filter((p) => selected.has(p.themeId));
    const parCandidat = candidatesQuota(pool, QUOTA_PAR_CANDIDAT);
    return {
      vivier,
      presents: presents.size,
      // Candidats qui n'ont aucune mesure dans ces thèmes : ils ne seront pas
      // du tout comparés, ce que rien n'indiquait auparavant.
      absents: CANDIDATES.length - presents.size,
      parCandidat,
      cartes: parCandidat * presents.size,
    };
  }, [selected]);

  const totalCount = tirage.cartes;

  const thinDeck = useMemo(() => {
    if (selected.size === 0 || tirage.presents === 0) return null;
    if (tirage.parCandidat >= MIN_PAR_CANDIDAT && tirage.absents === 0) return null;
    return tirage;
  }, [selected, tirage]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Choisis tes thèmes" onBack={onBack} />
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          Swipe tout, ou concentre-toi sur ce qui t’intéresse. Pendant le swipe, le bouton
          « super like » te permet de dire ce qui compte vraiment pour toi.
        </Text>
        <Pressable
          onPress={toggleAll}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
        >
          <Text style={styles.toggleAll}>
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {GROUPS.map(({ category, themes }) => {
          const selectedCount = themes.filter((t) => selected.has(t.id)).length;
          const allIn = selectedCount === themes.length;
          const someIn = selectedCount > 0 && !allIn;

          return (
            <View key={category.id} style={styles.group}>
              <Pressable
                onPress={() => toggleCategory(themes)}
                style={styles.groupHeader}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: allIn ? true : someIn ? 'mixed' : false }}
                accessibilityLabel={`Catégorie ${category.label}, ${selectedCount} sur ${themes.length} thèmes sélectionnés`}
              >
                <Text style={styles.groupIcon}>{category.icon}</Text>
                <Text style={styles.groupLabel}>{category.label}</Text>
                <View
                  style={[
                    styles.checkbox,
                    allIn && styles.checkboxSelected,
                    someIn && styles.checkboxPartial,
                  ]}
                >
                  {allIn && <Ionicons name="checkmark" size={14} color={colors.onAccent} />}
                  {someIn && <View style={styles.checkboxDash} />}
                </View>
              </Pressable>

              {themes.map((theme) => {
                const isSelected = selected.has(theme.id);
                const count = COUNT_BY_THEME[theme.id] ?? 0;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => toggle(theme.id)}
                    style={({ pressed }) => [
                      styles.row,
                      isSelected && styles.rowSelected,
                      pressed && styles.rowPressed,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`${theme.label}, ${count} proposition${count > 1 ? 's' : ''}`}
                  >
                    <Text style={styles.rowIcon}>{theme.icon}</Text>
                    <View style={styles.rowMiddle}>
                      <Text style={styles.rowLabel} numberOfLines={1}>
                        {theme.label}
                      </Text>
                      <Text style={styles.rowCount}>
                        {count} proposition{count > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color={colors.onAccent} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        {thinDeck && (
          <View style={styles.warning}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warningText} />
            <Text style={styles.warningText}>
              {thinDeck.absents > 0 && (
                <>
                  {thinDeck.absents} candidat{thinDeck.absents > 1 ? 's' : ''} n
                  {thinDeck.absents > 1 ? '’ont' : '’a'} aucune proposition sur ces thèmes et ne
                  ser{thinDeck.absents > 1 ? 'ont' : 'a'} pas comparé
                  {thinDeck.absents > 1 ? 's' : ''}.{' '}
                </>
              )}
              {thinDeck.parCandidat < MIN_PAR_CANDIDAT && (
                <>
                  {thinDeck.parCandidat} proposition{thinDeck.parCandidat > 1 ? 's' : ''} par
                  candidat seulement : à égalité, le classement ne pourra pas départager.{' '}
                </>
              )}
              Le résultat sera très approximatif.
            </Text>
          </View>
        )}
        <Pressable
          onPress={() => onConfirm(Array.from(selected))}
          disabled={selected.size === 0}
          style={({ pressed }) => [
            styles.cta,
            selected.size === 0 && styles.ctaDisabled,
            pressed && selected.size > 0 && styles.ctaPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: selected.size === 0 }}
          accessibilityLabel={
            selected.size === 0 ? 'Choisis au moins un thème' : `Commencer, ${totalCount} propositions`
          }
        >
          <Text style={styles.ctaText}>
            {selected.size === 0 ? 'Choisis au moins un thème' : `Commencer (${totalCount})`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
      gap: spacing.xs,
    },
    subtitle: {
      fontSize: fonts.small,
      color: colors.textSecondary,
      lineHeight: fonts.small * 1.4,
    },
    toggleAll: {
      marginTop: spacing.sm,
      fontSize: fonts.small,
      fontWeight: '700',
      color: colors.accentText,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    group: {
      gap: spacing.xs,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.xs,
    },
    groupIcon: {
      fontSize: 15,
    },
    groupLabel: {
      flex: 1,
      fontSize: fonts.tiny + 1,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    rowSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    rowPressed: {
      opacity: 0.8,
    },
    rowIcon: {
      fontSize: 20,
    },
    rowMiddle: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      fontSize: fonts.body + 1,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.1,
    },
    rowCount: {
      fontSize: fonts.tiny,
      color: colors.textMuted,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radii.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    checkboxPartial: {
      borderColor: colors.accent,
    },
    checkboxDash: {
      width: 8,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.accent,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      paddingTop: spacing.sm,
    },
    warning: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.warningSoft,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    warningText: {
      flex: 1,
      fontSize: fonts.tiny + 1,
      lineHeight: (fonts.tiny + 1) * 1.4,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cta: {
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
    },
    ctaDisabled: {
      opacity: 0.4,
    },
    ctaPressed: {
      backgroundColor: colors.accentStrong,
    },
    ctaText: {
      fontSize: fonts.body + 1,
      fontWeight: '700',
      color: colors.onAccent,
    },
  });
}
