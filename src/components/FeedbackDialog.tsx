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
// CE QUI EST À L'ÉCRAN EN PERMANENCE : le choix de la nature, la ou les cases
// à remplir, un bouton. Rien d'autre.
//
// Une version précédente affichait aussi un paragraphe d'accueil et un
// encadré de six lignes expliquant que l'app ne se connecte à aucun serveur.
// Les deux disaient des choses justes, et tous deux repoussaient le bouton
// hors de l'écran dès que le clavier s'ouvrait : on lisait une explication
// qu'on n'avait pas demandée avant d'atteindre la seule chose qu'on était
// venu faire.
//
// LA PROMESSE RESTE, ELLE A CHANGÉ DE PLACE. Elle vit derrière le « i » de
// l'entête, à un toucher, et elle est écrite là où elle est utile : quand on
// se demande ce que le bouton va faire. C'est une information de confiance,
// pas une étape du parcours — et une garantie qu'on relit rarement deux fois.
// Elle reste par ailleurs en toutes lettres dans la page confidentialité.
//
// Voir data/feedback.ts pour le raisonnement complet sur le courriel.
export function FeedbackDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [kind, setKind] = useState<FeedbackKind>('bug');
  const [message, setMessage] = useState('');
  const [complement, setComplement] = useState('');
  const [infoOuverte, setInfoOuverte] = useState(false);

  // Une boîte rouverte repart à vide, explication repliée comprise. Retrouver
  // le brouillon de la fois précédente, déjà envoyé, inviterait à l'envoyer
  // deux fois.
  useEffect(() => {
    if (visible) {
      setKind('bug');
      setMessage('');
      setComplement('');
      setInfoOuverte(false);
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
            {/* Titre, explication et sortie sur une seule ligne. */}
            <View style={styles.entete}>
              <Text style={styles.title}>Un retour ?</Text>
              <Pressable
                onPress={() => setInfoOuverte((ouvert) => !ouvert)}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.rond,
                  infoOuverte && styles.rondActif,
                  pressed && styles.presse,
                ]}
                accessibilityRole="button"
                accessibilityState={{ expanded: infoOuverte }}
                accessibilityLabel="Ce que l’application fait de ton message"
              >
                <Ionicons
                  name="information"
                  size={17}
                  color={infoOuverte ? colors.onAccent : colors.textSecondary}
                />
              </Pressable>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={({ pressed }) => [styles.rond, pressed && styles.presse]}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {infoOuverte && (
              <Text style={styles.info}>
                L’app ne se connecte à aucun serveur. Elle écrit un brouillon dans ton
                application de messagerie : tu le relis et tu l’envoies toi-même. Deux lignes y
                sont ajoutées, celles-ci et rien d’autre : {feedbackContext()}.
              </Text>
            )}

            <View style={styles.kindRow}>
              {FEEDBACK_KINDS.map((nature) => {
                const actif = kind === nature.kind;
                return (
                  <Pressable
                    key={nature.kind}
                    onPress={() => setKind(nature.kind)}
                    style={[styles.kind, actif && styles.kindActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: actif }}
                    accessibilityLabel={nature.label}
                  >
                    <Text
                      style={[styles.kindText, actif && styles.kindTextActive]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {nature.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.champs}
            >
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
              {/* Le compteur n'apparaît qu'une fois qu'on écrit : « 0 / 1200 »
                  sous une case vide n'apprend rien et fait du bruit. */}
              {message.length > 0 && (
                <Text style={styles.compteur}>
                  {message.length} / {FEEDBACK_MAX}
                </Text>
              )}

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
            </ScrollView>

            {/* UNE SEULE ACTION EN BAS. « Annuler » y tenait la moitié de la
                largeur pour une sortie déjà offerte deux fois — la croix de
                l'entête et le fond touchable — et mettait sur le même rang
                celle qu'on vient chercher et celle qu'on prend par erreur. */}
            <Pressable
              onPress={envoyer}
              disabled={!pret}
              style={({ pressed }) => [
                styles.action,
                !pret && styles.actionEteinte,
                pressed && pret && styles.presse,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !pret }}
              accessibilityLabel="Ouvrir le brouillon dans mon application de messagerie"
            >
              <Ionicons name="mail-outline" size={18} color={colors.onAccent} />
              <Text style={styles.actionTexte}>Ouvrir mon mail</Text>
            </Pressable>
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
      // La boîte ne dépasse jamais l'écran : au-delà, ce sont les cases qui
      // défilent, et l'entête comme le bouton restent en place.
      maxHeight: '100%',
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#1A1730',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 8,
    },

    entete: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: fonts.body + 2,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    // Les deux boutons de l'entête ont la même forme : ils appartiennent au
    // cadre de la boîte, pas à son contenu.
    rond: {
      width: 32,
      height: 32,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    rondActif: {
      backgroundColor: colors.accent,
    },
    presse: {
      opacity: 0.7,
    },
    info: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.5,
      color: colors.textSecondary,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      padding: spacing.sm + 2,
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

    champs: {
      gap: spacing.xs,
      paddingBottom: spacing.xs,
    },
    // Intitulé de case. Il porte le même mot que l'intertitre du courriel,
    // pour qu'on sache en écrivant sous quel titre le texte arrivera.
    champTitre: {
      fontSize: fonts.tiny + 1,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginTop: spacing.xs,
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
      marginTop: spacing.xs,
    },
    input: {
      minHeight: 110,
      maxHeight: 200,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.md,
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.45,
      color: colors.textPrimary,
    },
    // La marche à suivre tient en quelques lignes : la case n'a pas à ouvrir
    // aussi grand que celle du récit. Elle doit tout de même contenir son
    // propre filigrane, qui fait trois lignes numérotées.
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

    action: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing.md,
    },
    // Éteint tant que rien n'est écrit : ouvrir une application de messagerie
    // sur un brouillon vide n'aide personne.
    actionEteinte: {
      opacity: 0.4,
    },
    actionTexte: {
      fontSize: fonts.body,
      fontWeight: '700',
      color: colors.onAccent,
    },
  });
}
