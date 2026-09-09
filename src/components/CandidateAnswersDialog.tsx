import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { THEMES_BY_ID } from '../data/themes';
import { themeChipColors } from '../data/themeColors';
import { AnswerValue, Candidate, Proposal } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useThemeColor, useThemeSettings } from '../theme/ThemeContext';

// Les propositions d'un candidat, rangées par la réponse qu'on leur a donnée.
// Une proposition pas encore vue n'apparaît dans aucun groupe.
export type AnswerGroups = Record<AnswerValue, Proposal[]>;

export function emptyAnswerGroups(): AnswerGroups {
  return { like: [], superlike: [], skip: [], nope: [] };
}

type TabDef = {
  key: AnswerValue;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  empty: string;
};

// Mêmes libellés que les boutons de swipe, mot pour mot : un onglet doit
// nommer l'action exactement comme elle se présente pendant le jeu.
const TABS: TabDef[] = [
  { key: 'like', label: 'J’adhère', icon: 'heart', empty: 'Aucune proposition approuvée.' },
  { key: 'superlike', label: 'Super like', icon: 'star', empty: 'Aucun super like.' },
  { key: 'skip', label: 'Pas d’avis', icon: 'remove-outline', empty: 'Aucune proposition laissée sans avis.' },
  { key: 'nope', label: 'Pas pour moi', icon: 'close', empty: 'Aucune proposition refusée.' },
];

// Détail par candidat : on peut passer d'un type de réponse à l'autre, y
// compris les « pas d'avis » — qui ne comptent pas dans le score mais font
// partie de ce qu'on a répondu, et qu'on veut donc pouvoir relire.
export function CandidateAnswersDialog({
  visible,
  candidate,
  groups,
  revealProposals,
  onClose,
  onOpenInfo,
}: {
  visible: boolean;
  candidate: Candidate | null;
  groups: AnswerGroups;
  // Le texte des propositions n'est montré que si l'écran appelant
  // l'autorise. Tant que le paquet est en cours, les afficher sous le nom du
  // candidat reviendrait à désigner l'auteur de cartes précises — c'est
  // exactement ce que l'app promet de ne pas faire avant la fin. Les
  // décomptes par onglet restent visibles : ils n'attribuent rien.
  revealProposals: boolean;
  onClose: () => void;
  onOpenInfo?: () => void;
}) {
  const colors = useColors();
  const getThemeColor = useThemeColor();
  const { effectiveScheme } = useThemeSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [active, setActive] = useState<AnswerValue>('like');

  // À chaque ouverture, revenir sur le premier onglet plutôt que de garder
  // celui consulté pour le candidat précédent.
  useEffect(() => {
    if (visible) setActive('like');
  }, [visible]);

  const tint = (key: AnswerValue) => {
    if (key === 'like') return { text: colors.successText, soft: colors.successSoft };
    if (key === 'superlike') return { text: colors.warningText, soft: colors.warningSoft };
    if (key === 'nope') return { text: colors.dangerText, soft: colors.dangerSoft };
    return { text: colors.textSecondary, soft: colors.surfaceAlt };
  };

  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0];
  const items = groups[active] ?? [];
  const repondues = TABS.reduce((n, t) => n + (groups[t.key]?.length ?? 0), 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.eyebrow}>PROFIL DU CANDIDAT</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          {candidate && (
            <View style={styles.headerInfo}>
              <Avatar candidate={candidate} size={56} emphasized onPress={onOpenInfo} />
              <View style={styles.headerText}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {candidate.name}
                </Text>
                <Text style={styles.headerCaption} numberOfLines={1}>
                  {candidate.party} · {repondues} réponse{repondues > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const isActive = tab.key === active;
            const { text, soft } = tint(tab.key);
            const count = groups[tab.key]?.length ?? 0;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActive(tab.key)}
                style={({ pressed }) => [
                  styles.tab,
                  isActive && { backgroundColor: soft },
                  pressed && styles.tabPressed,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${tab.label}, ${count} proposition${count > 1 ? 's' : ''}`}
              >
                <Ionicons name={tab.icon} size={16} color={isActive ? text : colors.textMuted} />
                <Text
                  style={[styles.tabLabel, isActive && { color: text, fontWeight: '800' }]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                <Text style={[styles.tabCount, isActive && { color: text }]}>{count}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {!revealProposals ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="eye-off-outline" size={26} color={colors.textMuted} />
              <Text style={styles.lockedTitle}>Propositions masquées</Text>
              <Text style={styles.emptyText}>
                Les décomptes ci-dessus sont à toi, mais dire quelles propositions viennent de ce
                candidat reviendrait à te montrer qui a écrit les cartes que tu es en train de
                swiper. Tu peux lever le voile depuis l’onglet Propositions, ou finir le paquet.
              </Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name={activeTab.icon} size={26} color={colors.textMuted} />
              <Text style={styles.emptyText}>{activeTab.empty}</Text>
            </View>
          ) : (
            items.map((p) => {
              const theme = THEMES_BY_ID[p.themeId];
              return (
                <View key={p.id} style={styles.item}>
                  {theme && (
                    <ThemeChip
                      label={theme.label}
                      icon={theme.icon}
                      // Pastille en teinte douce, comme la fiche du candidat :
                      // le thème reste reconnaissable à sa couleur, mais une
                      // pastille par proposition en aplat saturé saturait
                      // l'écran, celles-ci s'empilant verticalement.
                      tint={themeChipColors(
                        getThemeColor(theme.id),
                        colors.surface,
                        effectiveScheme === 'dark'
                      )}
                      styles={styles}
                    />
                  )}
                  <Text style={styles.itemText}>{p.text}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ThemeChip({
  label,
  icon,
  tint,
  styles,
}: {
  label: string;
  icon: string;
  tint: { background: string; text: string };
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={[styles.themeChip, { backgroundColor: tint.background }]}>
      <Text style={styles.themeChipIcon}>{icon}</Text>
      <Text style={[styles.themeChipLabel, { color: tint.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    eyebrow: {
      fontSize: fonts.tiny,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.textMuted,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    closeButtonPressed: {
      opacity: 0.7,
    },
    headerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    headerName: {
      fontSize: fonts.title - 2,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    headerCaption: {
      fontSize: fonts.small,
      color: colors.textSecondary,
    },
    tabRow: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: spacing.sm,
      paddingHorizontal: 2,
      borderRadius: radii.sm,
    },
    tabPressed: {
      opacity: 0.7,
    },
    tabLabel: {
      fontSize: fonts.tiny - 1,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'center',
    },
    tabCount: {
      fontSize: fonts.small,
      fontWeight: '800',
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    list: {
      padding: spacing.md,
      gap: spacing.md,
      paddingBottom: spacing.xxl,
    },
    item: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      padding: spacing.md,
      gap: spacing.sm,
      alignItems: 'flex-start',
      // Ombre douce plutôt qu'un cadre : la fiche se détache du fond sans
      // ajouter un trait de plus à l'écran.
      shadowColor: '#1A1730',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    themeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      maxWidth: '100%',
      paddingVertical: 4,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radii.pill,
    },
    themeChipIcon: {
      fontSize: 12,
    },
    // La couleur du texte vient de `themeChipColors`, appariée au fond de la
    // pastille : elle est posée à l'usage, pas ici.
    themeChipLabel: {
      flexShrink: 1,
      fontSize: fonts.tiny,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    itemText: {
      fontSize: fonts.small + 2,
      lineHeight: (fonts.small + 2) * 1.45,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    emptyWrap: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    lockedTitle: {
      fontSize: fonts.body,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: fonts.small,
      lineHeight: fonts.small * 1.5,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 320,
    },
  });
}
