import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openUrl } from '../data/source';
import {
  buildFeedbackMailto,
  FEEDBACK_KINDS,
  FEEDBACK_KINDS_BY_ID,
  FEEDBACK_MAX,
  FEEDBACK_MAX_COMPLEMENT,
  FeedbackKind,
  feedbackContext,
} from '../data/feedback';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

// Signaler un bug, proposer une idée, donner un avis.
//
// LE POINT DÉLICAT EST LA PROMESSE, PAS LE FORMULAIRE. L'app affirme partout
// qu'elle n'envoie rien ; une boîte intitulée « envoyer » y contredit tout,
// même quand elle ne fait que préparer un brouillon. L'encadré du bas dit donc
// noir sur blanc ce qui se passe — le brouillon s'ouvre dans TON application
// de messagerie, et c'est toi qui l'envoies — et énumère les deux lignes
// techniques jointes, en les affichant telles quelles. Rien n'est à croire sur
// parole : tout est relisible dans le brouillon avant d'appuyer sur envoyer.
//
// Voir data/feedback.ts pour le raisonnement complet sur le courriel.
export function FeedbackDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [kind, setKind] = useState<FeedbackKind>('bug');
  const [message, setMessage] = useState('');
  const [complement, setComplement] = useState('');

  // Une boîte rouverte repart à vide. Retrouver le brouillon de la fois
  // précédente, déjà envoyé, inviterait à l'envoyer deux fois.
  useEffect(() => {
    if (visible) {
      setKind('bug');
      setMessage('');
      setComplement('');
    }
  }, [visible]);

  const info = FEEDBACK_KINDS_BY_ID[kind];
  const pret = message.trim().length > 0;

  const envoyer = () => {
    if (!pret) return;
    openUrl(buildFeedbackMailto(kind, message, complement));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Fermer" />
        {/* Le champ de saisie occupe le bas de la boîte : sans cela, le
            clavier le recouvre entièrement sur un écran court, et on écrit
            sans voir ce qu'on écrit. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centrage}
        >
          <View style={styles.card}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardContent}
            >
              <Text style={styles.title}>Un retour ?</Text>
              <Text style={styles.lead}>
                Un défaut, une idée, un mot : tout se lit. Choisis de quoi il s’agit, écris,
                et ton application de messagerie s’ouvrira avec le texte.
              </Text>

              <View style={styles.kindRow}>
                {FEEDBACK_KINDS.map((info) => {
                  const actif = kind === info.kind;
                  return (
                    <Pressable
                      key={info.kind}
                      onPress={() => setKind(info.kind)}
                      style={[styles.kind, actif && styles.kindActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: actif }}
                      accessibilityLabel={info.label}
                    >
                      <Text
                        style={[styles.kindText, actif && styles.kindTextActive]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {info.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* L'intitulé du champ est celui-là même qui servira
                  d'intertitre dans le courriel : ce qu'on écrit ici arrive
                  là-bas sous la question à laquelle on répond. */}
              <Text style={styles.champTitre}>{info.champ}</Text>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder={info.placeholder}
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={FEEDBACK_MAX}
                accessibilityLabel={info.champ}
              />
              <Text style={styles.compteur}>
                {message.length} / {FEEDBACK_MAX}
              </Text>

              {/* Seconde case, réservée au bug : sans marche à suivre, un
                  défaut se corrige rarement. Facultative, et absente du
                  courriel si on la laisse vide. */}
              {info.complement && (
                <>
                  <View style={styles.champEntete}>
                    <Text style={styles.champTitre}>{info.complement.champ}</Text>
                    <Text style={styles.facultatif}>facultatif</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.inputCourt]}
                    value={complement}
                    onChangeText={setComplement}
                    placeholder={info.complement.placeholder}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                    maxLength={FEEDBACK_MAX_COMPLEMENT}
                    accessibilityLabel={`${info.complement.champ}, facultatif`}
                  />
                </>
              )}

              <View style={styles.notice}>
                <Ionicons name="lock-closed-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.noticeText}>
                  L’app n’envoie rien elle-même et ne se connecte à aucun serveur. Elle prépare
                  un brouillon que tu relis et envoies toi-même. Y sont ajoutées deux lignes,
                  celles-ci et rien d’autre : {feedbackContext()}.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Annuler"
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={envoyer}
                disabled={!pret}
                style={({ pressed }) => [
                  styles.button,
                  styles.confirm,
                  !pret && styles.confirmDisabled,
                  pressed && pret && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !pret }}
                accessibilityLabel="Ouvrir le brouillon dans mon application de messagerie"
              >
                <Ionicons name="mail-outline" size={17} color={colors.onAccent} />
                <Text style={styles.confirmText}>Ouvrir mon mail</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10,9,14,0.55)',
    },
    centrage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      // La boîte ne dépasse jamais l'écran : au-delà, c'est son contenu qui
      // défile, et les deux boutons restent posés en bas, hors du défilement.
      maxHeight: '100%',
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#1A1730',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 8,
    },
    cardContent: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: {
      fontSize: fonts.body + 2,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    lead: {
      fontSize: fonts.small,
      lineHeight: fonts.small * 1.45,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    kindRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.pill,
      padding: 4,
      gap: 4,
    },
    kind: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
    },
    kindActive: {
      backgroundColor: colors.accent,
    },
    kindText: {
      fontSize: fonts.tiny + 1,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    kindTextActive: {
      color: colors.onAccent,
    },
    // Intitulé de case. Il porte le même mot que l'intertitre du courriel,
    // pour qu'on sache en écrivant sous quel titre le texte arrivera.
    champTitre: {
      fontSize: fonts.tiny + 1,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    champEntete: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    facultatif: {
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    input: {
      minHeight: 120,
      maxHeight: 200,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.md,
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.45,
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
    // La marche à suivre tient en quelques lignes : la case n'a pas à ouvrir
    // aussi grand que celle du récit. Elle doit tout de même contenir son
    // propre filigrane, qui fait trois lignes numérotées : à 84 px, il
    // arrivait déjà avec une barre de défilement, ce qui donnait l'impression
    // d'un champ trop petit avant même d'avoir écrit un mot.
    inputCourt: {
      minHeight: 104,
      maxHeight: 150,
    },
    compteur: {
      alignSelf: 'flex-end',
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      padding: spacing.sm + 2,
      marginTop: spacing.xs,
    },
    noticeText: {
      flex: 1,
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.5,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.md - 2,
      borderRadius: radii.pill,
    },
    pressed: {
      opacity: 0.8,
    },
    cancel: {
      backgroundColor: colors.surfaceAlt,
    },
    cancelText: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    confirm: {
      backgroundColor: colors.accent,
    },
    // Éteint tant que rien n'est écrit : ouvrir une application de messagerie
    // sur un brouillon vide n'aide personne.
    confirmDisabled: {
      opacity: 0.4,
    },
    confirmText: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.onAccent,
    },
  });
}
