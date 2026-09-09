import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Podium } from './Podium';
import { ResultRow } from './ResultRow';
import { ThemeAgreementList } from './ThemeAgreementList';
import { CandidateResult, ThemeAgreement } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

// Contenu de l'onglet « Classement » pendant le swipe : le podium provisoire,
// puis au choix le classement complet ou l'accord thème par thème.
//
// Extrait de SwipeScreen, qui approchait les 740 lignes. Le découpage suit une
// ligne simple : l'écran garde ce qui relève de la SESSION (l'index courant,
// les réponses, le paquet, les modales qu'il pilote), et délègue chaque onglet
// à un composant qui ne reçoit que du calculé. Celui-ci ne connaît ni les
// réponses ni les propositions — seulement des résultats déjà agrégés.
//
// Le sous-onglet vit ici, pas dans l'écran : il ne concerne que ce panneau, et
// le remonter obligeait l'écran à tenir un état dont il ne faisait rien.
type RankingView = 'overview' | 'byTheme';

export function RankingPanel({
  results,
  topMatch,
  confidenceLabel,
  themeAgreement,
  showCandidates,
  onSelectCandidate,
  onOpenCandidateInfo,
}: {
  results: CandidateResult[];
  // `null` tant qu'aucune réponse comptabilisée n'a été donnée : le panneau
  // affiche alors son état vide plutôt qu'un podium de zéros.
  topMatch: CandidateResult | null;
  confidenceLabel: string | null;
  themeAgreement: ThemeAgreement[];
  // Le classement peut nommer les candidats — c'est un agrégat, il ne dit pas
  // qui a écrit telle carte. La vue par thème, elle, s'en approche assez pour
  // devoir suivre la même bascule que la mosaïque (voir SwipeScreen).
  showCandidates: boolean;
  onSelectCandidate: (candidateId: string) => void;
  onOpenCandidateInfo: (candidateId: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [view, setView] = useState<RankingView>('overview');

  if (!topMatch) {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🤔</Text>
          <Text style={styles.emptyText}>
            Pas encore assez de réponses pour un aperçu. Reviens sur l’onglet Swiper.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.hint}>
        Provisoire, ça va encore bouger. Continue à répondre pour un résultat plus fiable.
      </Text>

      <Podium results={results} instant onCandidatePress={onOpenCandidateInfo} />
      {confidenceLabel && <Text style={styles.confidence}>{confidenceLabel}</Text>}

      <View style={styles.subTabRow}>
        <SubTab
          styles={styles}
          label="Classement"
          accessibilityLabel="Classement des candidats"
          selected={view === 'overview'}
          onPress={() => setView('overview')}
        />
        <SubTab
          styles={styles}
          label="Par thème"
          accessibilityLabel="Avec qui tu es d’accord, sujet par sujet"
          selected={view === 'byTheme'}
          onPress={() => setView('byTheme')}
        />
      </View>

      {view === 'overview' ? (
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Qui a le plus de votes</Text>
          {results.map((result) => (
            <ResultRow
              key={result.candidate.id}
              result={result}
              // Le rang, égalités comprises : deux ex æquo portent la même
              // médaille, comme sur le podium juste au-dessus.
              rank={result.rank}
              emphasized={result.candidate.id === topMatch.candidate.id}
              onPress={() => onSelectCandidate(result.candidate.id)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Avec qui tu es d’accord, sujet par sujet</Text>
          <Text style={styles.sectionCaption}>
            Les nombres sont ceux de tes réponses, pas des pourcentages : sur un sujet donné, un
            candidat n’a souvent qu’une ou deux propositions dans le paquet.
          </Text>

          <ThemeAgreementList
            entries={themeAgreement}
            showCandidates={showCandidates}
            hiddenNote="Les noms restent masqués tant que tu swipes. Tu peux les afficher depuis l’onglet Propositions."
          />
        </View>
      )}
    </ScrollView>
  );
}

function SubTab({
  styles,
  label,
  accessibilityLabel,
  selected,
  onPress,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.subTab, selected && styles.subTabActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.subTabText, selected && styles.subTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    subTabRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.pill,
      padding: 4,
      gap: 4,
    },
    subTab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
    },
    subTabActive: {
      backgroundColor: colors.accent,
    },
    subTabText: {
      fontSize: fonts.tiny + 1,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    subTabTextActive: {
      color: colors.onAccent,
    },
    confidence: {
      marginTop: spacing.sm,
      fontSize: fonts.tiny + 1,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'center',
    },
    hint: {
      fontSize: fonts.tiny + 1,
      lineHeight: (fonts.tiny + 1) * 1.4,
      color: colors.textMuted,
      textAlign: 'center',
    },
    listSection: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: fonts.body,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    sectionCaption: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.45,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    emptyWrap: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    emptyEmoji: {
      fontSize: 32,
    },
    emptyText: {
      fontSize: fonts.body,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 280,
    },
  });
}
