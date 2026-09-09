import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProposalDebateDialog } from '../components/ProposalDebateDialog';
import { haptics } from '../utils/haptics';
import { Answers, AnswerValue, Proposal, ThemeTag } from '../types';
import { SwipeDirection } from '../components/SwipeCard';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

type Props = {
  proposals: Proposal[];
  themesById: Record<string, ThemeTag>;
  answers: Answers;
  onChangeAnswer: (proposalId: string, direction: SwipeDirection) => void;
  onContinue: () => void;
  onBack: () => void;
};

// Filtres de la liste. Les « pas d'avis » sont exclus du score : ce sont
// précisément ceux qu'on veut pouvoir retrouver pour trancher, et parcourir
// à l'œil une liste de plus de cent lignes ne le permettait pas.
type ReviewFilter = 'all' | AnswerValue;

const FILTERS: { key: ReviewFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'like', label: 'J’adhère' },
  { key: 'superlike', label: 'Super like' },
  { key: 'skip', label: 'Pas d’avis' },
  { key: 'nope', label: 'Pas pour moi' },
];

export function ReviewScreen({
  proposals,
  themesById,
  answers,
  onChangeAnswer,
  onContinue,
  onBack,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [filter, setFilter] = useState<ReviewFilter>('all');
  // Proposition ouverte en grand depuis la liste.
  const [openProposal, setOpenProposal] = useState<Proposal | null>(null);

  const counts = useMemo(() => {
    const c: Record<ReviewFilter, number> = {
      all: proposals.length,
      like: 0,
      superlike: 0,
      skip: 0,
      nope: 0,
    };
    for (const p of proposals) {
      const a = answers[p.id];
      if (a) c[a] += 1;
    }
    return c;
  }, [proposals, answers]);

  const visible = useMemo(
    () => (filter === 'all' ? proposals : proposals.filter((p) => answers[p.id] === filter)),
    [filter, proposals, answers]
  );

  const likeCount = counts.like + counts.superlike;

  const selectFilter = (next: ReviewFilter) => {
    haptics.selection();
    setFilter(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Vérifie tes réponses" onBack={onBack} />
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          {proposals.length} propositions · {likeCount} approuvées. Touche une proposition pour la
          lire en entier, une icône pour changer d’avis.
        </Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => selectFilter(f.key)}
              style={({ pressed }) => [
                styles.filterChip,
                isActive && styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${f.label}, ${counts[f.key]} proposition${counts[f.key] > 1 ? 's' : ''}`}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f.label} {counts[f.key]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyFilter}>Aucune proposition dans cette catégorie.</Text>
        }
        renderItem={({ item }) => (
          <ReviewRow
            proposal={item}
            theme={themesById[item.themeId]}
            answer={answers[item.id]}
            onChange={onChangeAnswer}
            onOpen={setOpenProposal}
            colors={colors}
            styles={styles}
          />
        )}
      />

      <View style={styles.footer}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
          accessibilityLabel="Voir mon résultat"
        >
          <Text style={styles.ctaText}>Voir mon résultat</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
        </Pressable>
      </View>

      <ProposalDebateDialog
        visible={openProposal !== null}
        proposal={openProposal}
        theme={openProposal ? themesById[openProposal.themeId] ?? null : null}
        onClose={() => setOpenProposal(null)}
      />
    </SafeAreaView>
  );
}

function ReviewRow({
  proposal,
  theme,
  answer,
  onChange,
  onOpen,
  colors,
  styles,
}: {
  proposal: Proposal;
  theme: ThemeTag;
  answer: AnswerValue | undefined;
  onChange: (proposalId: string, direction: SwipeDirection) => void;
  onOpen: (proposal: Proposal) => void;
  colors: ColorTokens;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.row}>
      {/* La mesure est tronquée à trois lignes pour que la liste reste
          parcourable, mais certaines dépassent 200 caractères : sans moyen de
          les ouvrir, on devait trancher sur une phrase coupée. Toucher la
          proposition rouvre donc la fiche complète, celle-là même que la carte
          proposait pendant le swipe (texte entier, « EN CLAIR », arguments).
          Elle ne nomme jamais le candidat. */}
      <Pressable
        onPress={() => onOpen(proposal)}
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowMainPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Lire en entier : ${proposal.text}`}
      >
        <Text style={styles.rowIcon}>{theme.icon}</Text>
        <Text style={styles.rowText} numberOfLines={3}>
          {proposal.text}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </Pressable>
      <View style={styles.toggleGroup}>
        <Pressable
          onPress={() => onChange(proposal.id, 'nope')}
          style={[styles.toggleBtn, answer === 'nope' && styles.toggleNopeActive]}
          hitSlop={8}
          accessibilityRole="radio"
          accessibilityState={{ checked: answer === 'nope' }}
          accessibilityLabel="Pas pour moi"
        >
          <Ionicons name="close" size={16} color={answer === 'nope' ? colors.onAccent : colors.danger} />
        </Pressable>
        <Pressable
          onPress={() => onChange(proposal.id, 'skip')}
          style={[styles.toggleBtn, answer === 'skip' && styles.toggleSkipActive]}
          hitSlop={8}
          accessibilityRole="radio"
          accessibilityState={{ checked: answer === 'skip' }}
          accessibilityLabel="Pas d’avis"
        >
          <Ionicons
            name="remove-outline"
            size={14}
            color={answer === 'skip' ? colors.onAccent : colors.textSecondary}
          />
        </Pressable>
        <Pressable
          onPress={() => onChange(proposal.id, 'like')}
          style={[styles.toggleBtn, answer === 'like' && styles.toggleLikeActive]}
          hitSlop={8}
          accessibilityRole="radio"
          accessibilityState={{ checked: answer === 'like' }}
          accessibilityLabel="J’adhère"
        >
          <Ionicons name="heart" size={14} color={answer === 'like' ? colors.onAccent : colors.success} />
        </Pressable>
        <Pressable
          onPress={() => onChange(proposal.id, 'superlike')}
          style={[styles.toggleBtn, answer === 'superlike' && styles.toggleSuperlikeActive]}
          hitSlop={8}
          accessibilityRole="radio"
          accessibilityState={{ checked: answer === 'superlike' }}
          accessibilityLabel="Super like, compte plus dans le résultat"
        >
          <Ionicons name="star" size={13} color={answer === 'superlike' ? colors.onAccent : colors.warning} />
        </Pressable>
      </View>
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
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
      gap: spacing.xs,
    },
    subtitle: {
      fontSize: fonts.small,
      color: colors.textSecondary,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    filterChip: {
      paddingVertical: 6,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterChipPressed: {
      opacity: 0.7,
    },
    filterText: {
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    filterTextActive: {
      color: colors.onAccent,
    },
    emptyFilter: {
      fontSize: fonts.small,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radii.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    // La zone de lecture occupe toute la place laissee par les trois boutons
    // de reponse ; c'est elle qui ouvre la fiche complete.
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    rowMainPressed: {
      opacity: 0.6,
    },
    rowIcon: {
      fontSize: 16,
    },
    rowText: {
      flex: 1,
      fontSize: fonts.tiny + 1,
      lineHeight: (fonts.tiny + 1) * 1.35,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    toggleGroup: {
      flexDirection: 'row',
      gap: 6,
    },
    toggleBtn: {
      width: 28,
      height: 28,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    toggleNopeActive: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    toggleSkipActive: {
      backgroundColor: colors.textMuted,
      borderColor: colors.textMuted,
    },
    toggleLikeActive: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    toggleSuperlikeActive: {
      backgroundColor: colors.warning,
      borderColor: colors.warning,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      paddingTop: spacing.sm,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing.md,
    },
    ctaPressed: {
      backgroundColor: colors.accentStrong,
    },
    ctaText: {
      fontSize: fonts.body,
      fontWeight: '700',
      color: colors.onAccent,
    },
  });
}
