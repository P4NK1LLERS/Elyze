import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FeedbackDialog } from '../components/FeedbackDialog';
import { LegalScreen } from './LegalScreen';
import { APP_VERSION } from '../data/appInfo';
import { LEGAL_DOCUMENTS, LEGAL_TOPICS, LegalTopic } from '../data/legal';
import { ACCENT_PRESETS, ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useThemeSettings } from '../theme/ThemeContext';
import { SchemePreference } from '../utils/storage';

// Icône de chaque texte légal. Le sujet, lui, vient des données.
const LEGAL_ICONS: Record<LegalTopic, keyof typeof Ionicons.glyphMap> = {
  privacy: 'lock-closed-outline',
  terms: 'document-text-outline',
  credits: 'ribbon-outline',
};

const SCHEME_OPTIONS: { value: SchemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'Système', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Clair', icon: 'sunny-outline' },
  { value: 'dark', label: 'Sombre', icon: 'moon-outline' },
];

export function SettingsScreen({
  onBack,
  onResetAllData,
}: {
  onBack: () => void;
  onResetAllData: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    schemePreference,
    setSchemePreference,
    accentId,
    setAccentId,
    hapticsEnabled,
    setHapticsEnabled,
    rainbowUnlocked,
    rainbowEnabled,
    setRainbowEnabled,
    rerollRainbow,
    gradientEnabled,
    setGradientEnabled,
  } = useThemeSettings();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [legalTopic, setLegalTopic] = useState<LegalTopic | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Réglages" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apparence</Text>
          <View style={styles.schemeRow}>
            {SCHEME_OPTIONS.map((opt) => {
              const isActive = schemePreference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setSchemePreference(opt.value)}
                  style={[styles.schemeOption, isActive && styles.schemeOptionActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                  accessibilityLabel={`Thème ${opt.label}`}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={isActive ? colors.onAccent : colors.textSecondary}
                  />
                  <Text style={[styles.schemeOptionText, isActive && styles.schemeOptionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* TOUT L'ARC-EN-CIEL EST DERRIÈRE L'EASTER EGG, fond animé compris.
            Le dégradé vivait jusqu'ici dans une section ordinaire, au-dessus
            de celle que l'egg débloque : deux sections voisines, au nom
            presque identique, dont l'une apparaissait et l'autre pas. Ce
            qu'on découvrait n'était donc pas « l'arc-en-ciel » mais sa
            moitié, et l'egg semblait n'avoir rien apporté à qui avait déjà
            allumé le fond animé. Les deux réglages sont désormais la même
            trouvaille, dans le même bloc. */}
        {rainbowUnlocked && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mode arc-en-ciel</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Fond animé</Text>
              <Switch
                value={gradientEnabled}
                onValueChange={setGradientEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
                accessibilityLabel="Activer le dégradé arc-en-ciel animé"
              />
            </View>
            <Text style={styles.sectionCaption}>
              Un dégradé multicolore parcourt lentement le cadre des cartes et la barre de
              progression. Le fond des cartes n’est que teinté : au-delà, le texte cesserait
              d’être lisible. Le mouvement s’arrête si ton système demande de réduire les
              animations.
            </Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Couleurs au hasard</Text>
              <Switch
                value={rainbowEnabled}
                onValueChange={setRainbowEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
                accessibilityLabel="Activer le mode arc-en-ciel"
              />
            </View>
            <Text style={styles.sectionCaption}>
              Repeint toute l’application avec des couleurs tirées au sort. Les teintes changent,
              mais chaque texte reste lisible sur son fond.
            </Text>

            {rainbowEnabled && (
              <Pressable
                onPress={rerollRainbow}
                style={({ pressed }) => [styles.rerollButton, pressed && styles.rerollButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Tirer de nouvelles couleurs"
              >
                <Ionicons name="shuffle" size={18} color={colors.accentText} />
                <Text style={styles.rerollButtonText}>Tirer de nouvelles couleurs</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Couleur d’accent</Text>
          <View style={styles.accentRow}>
            {ACCENT_PRESETS.map((preset) => {
              const isActive = accentId === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => setAccentId(preset.id)}
                  style={styles.accentOption}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                  accessibilityLabel={`Accent ${preset.label}`}
                >
                  <View style={[styles.swatch, { backgroundColor: preset.accent }]}>
                    {isActive && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.accentLabel}>{preset.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {rainbowEnabled && (
            <Text style={styles.sectionCaption}>
              Sans effet tant que le mode arc-en-ciel est actif. Ton choix sera repris dès que
              tu le désactiveras.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retour haptique</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Vibrations</Text>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.border}
              accessibilityLabel="Activer les vibrations"
            />
          </View>
        </View>

        {/* Un retour, et une seule porte pour les trois.
            Bogue, idée et avis partagent le même geste — écrire à quelqu'un —
            et trois entrées distinctes dans les réglages auraient obligé à
            trancher avant d'avoir écrit, là où la nature du message est
            souvent claire seulement une fois rédigé. Le choix se fait donc
            dans la boîte, où il reste modifiable. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ton avis</Text>
          <Pressable
            onPress={() => setFeedbackOpen(true)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Signaler un bogue, proposer une idée ou donner un avis"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.accentText} />
            <View style={styles.rowTexts}>
              <Text style={[styles.rowLabel, styles.rowLabelStacked]}>
                Signaler un bogue ou proposer une idée
              </Text>
              <Text style={styles.rowHint}>
                Prépare un message dans ton application de messagerie. L’app n’envoie rien.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Confidentialité, conditions, crédits. Trois pages plutôt qu'une :
            elles ne se lisent pas dans les mêmes circonstances, et un seul
            pavé de mentions légales ne se lit pas du tout. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <View style={styles.rows}>
            {LEGAL_TOPICS.map((sujet) => (
              <Pressable
                key={sujet}
                onPress={() => setLegalTopic(sujet)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel={LEGAL_DOCUMENTS[sujet].title}
              >
                <Ionicons name={LEGAL_ICONS[sujet]} size={19} color={colors.textSecondary} />
                <Text style={styles.rowLabel}>{LEGAL_DOCUMENTS[sujet].title}</Text>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
          {/* La version, là où on la cherche quand on veut la donner. */}
          <Text style={styles.sectionCaption}>Version {APP_VERSION}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données</Text>
          <Pressable
            onPress={() => setConfirmingReset(true)}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.dangerButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Réinitialiser les données de l’application"
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.dangerButtonText}>Réinitialiser les données de l’application</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LegalScreen topic={legalTopic} onClose={() => setLegalTopic(null)} />

      <FeedbackDialog visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <ConfirmDialog
        visible={confirmingReset}
        title="Réinitialiser l’application ?"
        message="Tes réponses en cours, ton dernier résultat et tes réglages (thème, accent, vibrations) seront effacés définitivement."
        confirmLabel="Réinitialiser"
        destructive
        onConfirm={() => {
          setConfirmingReset(false);
          onResetAllData();
        }}
        onCancel={() => setConfirmingReset(false)}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: fonts.tiny + 1,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.textMuted,
      paddingHorizontal: spacing.xs,
    },
    schemeRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      padding: 4,
      gap: 4,
    },
    schemeOption: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: spacing.md,
      borderRadius: radii.sm,
    },
    schemeOptionActive: {
      backgroundColor: colors.accent,
    },
    schemeOptionText: {
      fontSize: fonts.tiny + 1,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    schemeOptionTextActive: {
      color: colors.onAccent,
    },
    sectionCaption: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.5,
      color: colors.textSecondary,
      paddingHorizontal: spacing.xs,
    },
    rerollButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accentSoft,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 4,
    },
    rerollButtonPressed: {
      opacity: 0.75,
    },
    rerollButtonText: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.accentText,
    },
    accentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.lg,
      paddingHorizontal: spacing.xs,
    },
    accentOption: {
      alignItems: 'center',
      gap: 6,
    },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accentLabel: {
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    // Les trois textes légaux sont des DESTINATIONS distinctes, pas les trois
    // lignes d'une même liste : à 2 px d'écart, leurs fonds se touchaient et
    // le bloc se lisait comme un seul pavé gris coupé par deux traits. Un
    // intervalle franc, celui qui sépare déjà les autres blocs de l'écran.
    rows: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    rowPressed: {
      opacity: 0.7,
    },
    // Une rangée peut porter un sous-titre : `rowTexts` prend alors le `flex`
    // que le libellé tenait seul, sinon les deux textes se tassent à gauche.
    rowTexts: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      flex: 1,
      fontSize: fonts.small + 1,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    // Empilé sous un sous-titre, le libellé ne doit plus s'étirer : `flex: 1`
    // dans une colonne le fait grandir en HAUTEUR et décolle le sous-titre.
    rowLabelStacked: {
      flex: 0,
    },
    rowHint: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.4,
      color: colors.textSecondary,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    switchLabel: {
      fontSize: fonts.small + 1,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.dangerSoft,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    dangerButtonPressed: {
      opacity: 0.8,
    },
    dangerButtonText: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.danger,
    },
  });
}
