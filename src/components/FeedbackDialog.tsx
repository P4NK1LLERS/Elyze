import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
  FeedbackKind,
  feedbackContext,
} from '../data/feedback';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

// Signaler un bug, proposer une idée, donner un avis.
//
// CE QUI EST À L'ÉCRAN : le choix de la nature, une case, un bouton.
//
// Il y en a eu davantage, et chaque retrait a eu sa raison. Un paragraphe
// d'accueil disait ce que le titre disait déjà. Un encadré de six lignes sur
// l'absence de serveur repoussait le bouton hors de l'écran dès l'ouverture du
// clavier. Une seconde case demandait au bug sa marche à suivre : bonne
// intention, mais deux zones de texte dans une fenêtre posée sur les réglages,
// cela ressemble à un formulaire administratif, et un formulaire décourage
// d'écrire plus sûrement qu'une consigne manquante ne gêne la correction.
//
// LA TYPOGRAPHIE SUIT LE MÊME PRINCIPE. Les intitulés étaient en capitales
// espacées et les trois natures en pastilles pleines sur un rail : beaucoup
// d'appareil pour une fenêtre qu'on ouvre trente secondes. Les intitulés sont
// redevenus des phrases, et la nature retenue se signale par une teinte
// plutôt que par un aplat.
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
  const [infoOuverte, setInfoOuverte] = useState(false);

  // Une boîte rouverte repart à vide, explication repliée comprise. Retrouver
  // le brouillon de la fois précédente, déjà envoyé, inviterait à l'envoyer
  // deux fois.
  useEffect(() => {
    if (visible) {
      setKind('bug');
      setMessage('');
      setInfoOuverte(false);
    }
  }, [visible]);

  const info = FEEDBACK_KINDS_BY_ID[kind];
  const pret = message.trim().length > 0;

  const envoyer = () => {
    if (!pret) return;
    openUrl(buildFeedbackMailto(kind, message));
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

            <View style={styles.champs}>
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
            </View>

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
      fontSize: fonts.body + 1,
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

    // Trois choix posés sur le fond de la boîte, sans rail ni aplat. Le rail
    // gris plus l'aplat d'accent faisaient de ce simple choix l'élément le
    // plus appuyé de la fenêtre, avant même la case où l'on écrit.
    kindRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    kind: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
    },
    kindActive: {
      backgroundColor: colors.accentSoft,
    },
    kindText: {
      fontSize: fonts.small,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    // `accentText` est le jeton prévu pour de l'accent en texte sur un fond
    // neutre ou `accentSoft` : c'est exactement ce cas, et il tient le
    // contraste là où `accent` ne le tiendrait pas.
    kindTextActive: {
      color: colors.accentText,
      fontWeight: '800',
    },

    champs: {
      gap: spacing.xs,
    },
    // Intitulé de case. Il porte le même mot que l'intertitre du courriel,
    // pour qu'on sache en écrivant sous quel titre le texte arrivera. En
    // phrase et non en capitales espacées : c'est une question posée, pas
    // l'étiquette d'un bordereau.
    champTitre: {
      fontSize: fonts.small,
      fontWeight: '600',
      color: colors.textSecondary,
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
