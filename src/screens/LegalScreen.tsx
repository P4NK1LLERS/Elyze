import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { CANDIDATES } from '../data/candidates';
import { CANDIDATE_PHOTO_CREDITS } from '../data/candidatePhotos';
import { LEGAL_DOCUMENTS, LEGAL_UPDATED, LegalSection, LegalTopic } from '../data/legal';
import { openUrl } from '../data/source';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

// Affichage d'un des trois textes légaux (voir data/legal).
//
// Une feuille par-dessus les réglages plutôt qu'un écran de plus dans la
// navigation d'App.tsx : on y entre depuis un seul endroit et on en ressort
// au même, il n'y a donc pas d'historique à tenir. Le bouton retour matériel
// est géré par `onRequestClose`.
export function LegalScreen({
  topic,
  onClose,
}: {
  // `null` ferme la feuille. Passer le sujet plutôt que trois écrans permet
  // de partager toute la mise en page entre les trois documents.
  topic: LegalTopic | null;
  onClose: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const document = topic ? LEGAL_DOCUMENTS[topic] : null;

  return (
    <Modal visible={topic !== null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title={document?.title ?? ''} onBack={onClose} />

        {document && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.lead}>{document.lead}</Text>

            {document.sections.map((section) => (
              <Section key={section.title} section={section} styles={styles} colors={colors} />
            ))}

            <Text style={styles.updated}>Dernière mise à jour : {LEGAL_UPDATED}</Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function Section({
  section,
  styles,
  colors,
}: {
  section: LegalSection;
  styles: ReturnType<typeof makeStyles>;
  colors: ColorTokens;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{section.title}</Text>
      {section.body && <Text style={styles.body}>{section.body}</Text>}

      {section.bullets?.map((bullet) => (
        <View key={bullet} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}

      {section.photos && <PhotoCredits styles={styles} />}

      {section.link && (
        <Pressable
          onPress={() => openUrl(section.link!.url)}
          hitSlop={8}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          accessibilityRole="link"
          accessibilityLabel={section.link.label}
        >
          <Text style={styles.linkText}>{section.link.label}</Text>
          <Ionicons name="open-outline" size={14} color={colors.accentText} />
        </Pressable>
      )}
    </View>
  );
}

// Attribution des portraits, construite depuis les données plutôt que
// recopiée : une photo remplacée met à jour cette page toute seule, ce qui
// est exactement ce qu'une mention légale ne doit pas rater.
function PhotoCredits({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  const lignes = useMemo(
    () =>
      CANDIDATES.map((candidate) => ({
        candidate,
        credit: CANDIDATE_PHOTO_CREDITS[candidate.id],
      })).filter((l) => l.credit),
    []
  );

  return (
    <View style={styles.credits}>
      {lignes.map(({ candidate, credit }) => (
        <Pressable
          key={candidate.id}
          onPress={() => openUrl(credit.page)}
          style={({ pressed }) => [styles.creditRow, pressed && styles.pressed]}
          accessibilityRole="link"
          accessibilityLabel={`Portrait de ${candidate.name}, par ${credit.auteur}, licence ${credit.licence}. Voir le fichier sur Wikimedia Commons.`}
        >
          <View style={styles.creditText}>
            <Text style={styles.creditName}>{candidate.name}</Text>
            <Text style={styles.creditMeta}>
              {credit.auteur} · {credit.licence}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={styles.chevron.color} />
        </Pressable>
      ))}
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    lead: {
      fontSize: fonts.body + 1,
      lineHeight: (fonts.body + 1) * 1.5,
      fontWeight: '700',
      color: colors.textPrimary,
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: fonts.body,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    body: {
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.55,
      color: colors.textSecondary,
    },
    bulletRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingRight: spacing.xs,
    },
    bulletDot: {
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.55,
      color: colors.accentText,
    },
    bulletText: {
      flex: 1,
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.55,
      color: colors.textSecondary,
    },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingTop: spacing.xs,
    },
    linkText: {
      fontSize: fonts.small,
      fontWeight: '700',
      color: colors.accentText,
    },
    pressed: {
      opacity: 0.6,
    },
    credits: {
      gap: 2,
      paddingTop: spacing.xs,
    },
    creditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm + 2,
    },
    creditText: {
      flex: 1,
      gap: 1,
    },
    creditName: {
      fontSize: fonts.tiny + 1,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    creditMeta: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.4,
      color: colors.textSecondary,
    },
    // `StyleSheet` sert aussi de porte-couleur pour l'icône, qui ne prend pas
    // de style mais une prop.
    chevron: {
      color: colors.textMuted,
    },
    updated: {
      fontSize: fonts.tiny,
      color: colors.textMuted,
      textAlign: 'center',
      paddingTop: spacing.sm,
    },
  });
}
