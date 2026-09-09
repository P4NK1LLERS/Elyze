import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { CANDIDATES_BY_ID } from '../data/candidates';
import { THEMES } from '../data/themes';
import { PROPOSAL_EXPLANATIONS } from '../data/proposalExplanations';
import { Answers, AnswerValue, Proposal, ThemeTag } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useThemeColor } from '../theme/ThemeContext';

// Mosaïque colorée des thèmes, portant sur TOUT LE CATALOGUE embarqué et non
// sur le seul paquet de la session.
//
// Une version précédente n'affichait que le paquet, pour que ses décomptes
// recoupent ceux de l'onglet Classement juste à côté. Mais l'app embarque
// désormais bien plus de propositions qu'une partie n'en tire : n'en montrer
// que la moitié revenait à cacher ce qu'on a sous la main. Le risque de
// confusion est traité autrement, en le disant — l'en-tête annonce les deux
// nombres, et chaque proposition déjà répondue porte la réponse donnée.
//
// Qui propose quoi reste masqué par défaut, pour ne pas biaiser les réponses
// pendant le swipe. L'état de la bascule est tenu par l'écran parent, qui
// l'applique aussi au classement par thème (voir SwipeScreen).
export function ThemeMosaic({
  proposals,
  deckIds,
  answers,
  revealCandidates,
  onToggleReveal,
}: {
  // Tout le catalogue, pas seulement le paquet en cours.
  proposals: Proposal[];
  // Identifiants des propositions tirées pour cette partie.
  deckIds: Set<string>;
  answers: Answers;
  revealCandidates: boolean;
  onToggleReveal: () => void;
}) {
  const colors = useColors();
  const getThemeColor = useThemeColor();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeTag | null>(null);

  const { countByTheme, proposalsByTheme, themes } = useMemo(() => {
    const count: Record<string, number> = {};
    const byTheme: Record<string, Proposal[]> = {};
    for (const p of proposals) {
      count[p.themeId] = (count[p.themeId] ?? 0) + 1;
      (byTheme[p.themeId] ??= []).push(p);
    }
    return {
      countByTheme: count,
      proposalsByTheme: byTheme,
      themes: THEMES.filter((t) => count[t.id] > 0),
    };
  }, [proposals]);

  const toggleReveal = onToggleReveal;

  // Une RANGÉE PLEINE LARGEUR, pas une pastille centrée.
  //
  // La pastille flottait seule au-dessus de la mosaïque, bordée de vide des
  // deux côtés, et la phrase qui l'expliquait vivait en dessous, séparée : le
  // bandeau montait à près de 280 px avant la première tuile, pour un seul
  // réglage. En rassemblant l'interrupteur et son explication dans un même
  // bloc qui occupe toute la largeur, on supprime le vide latéral et on gagne
  // la hauteur d'un bloc — et l'explication redevient ce qu'elle doit être :
  // le sous-titre du bouton, pas un paragraphe indépendant.
  const revealToggle = (
    <Pressable
      onPress={toggleReveal}
      style={({ pressed }) => [
        styles.revealToggle,
        revealCandidates && styles.revealToggleOn,
        pressed && styles.revealTogglePressed,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: revealCandidates }}
      accessibilityLabel={
        revealCandidates
          ? 'Masquer les candidats, pour garder le suspense'
          : 'Afficher les candidats, cela révélera qui propose quoi'
      }
    >
      <View style={[styles.revealIcon, revealCandidates && styles.revealIconOn]}>
        <Ionicons
          name={revealCandidates ? 'eye-outline' : 'eye-off-outline'}
          size={18}
          color={revealCandidates ? colors.accentText : colors.textSecondary}
        />
      </View>
      <View style={styles.revealTexts}>
        <Text style={[styles.revealToggleText, revealCandidates && styles.revealToggleTextOn]}>
          {revealCandidates ? 'Candidats visibles' : 'Candidats masqués'}
        </Text>
        <Text style={styles.revealHint}>
          {revealCandidates
            ? 'Le nom s’affiche sous chaque proposition. Touche pour le masquer.'
            : 'Les propositions sont visibles, pas leurs auteurs. Touche pour les découvrir.'}
        </Text>
      </View>
      {/* Interrupteur dessiné, et non une icône.
          `toggle` et `toggle-outline` d'Ionicons portent TOUTES DEUX le
          curseur à droite : elles ne diffèrent que par le remplissage. L'état
          éteint s'affichait donc avec le curseur du côté allumé, ce qui disait
          exactement le contraire de la vérité. Deux vues suffisent, et la
          position du curseur devient la conséquence de l'état plutôt qu'une
          ressemblance approximative. */}
      <View style={[styles.switchTrack, revealCandidates && styles.switchTrackOn]}>
        <View style={[styles.switchKnob, revealCandidates && styles.switchKnobOn]} />
      </View>
    </Pressable>
  );

  if (selectedTheme) {
    const themeProposals = proposalsByTheme[selectedTheme.id] ?? [];
    return (
      <View style={styles.detail}>
        <View style={styles.detailHeader}>
          <Pressable
            onPress={() => setSelectedTheme(null)}
            hitSlop={8}
            style={({ pressed }) => [styles.detailBack, pressed && styles.detailBackPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Retour à la mosaïque des thèmes, actuellement : ${selectedTheme.label}`}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            <View style={[styles.detailIconBadge, { backgroundColor: getThemeColor(selectedTheme.id) }]}>
              <Text style={styles.detailIconText}>{selectedTheme.icon}</Text>
            </View>
            <Text style={styles.detailTitle} numberOfLines={1}>
              {selectedTheme.label}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.detailList} showsVerticalScrollIndicator={false}>
          {themeProposals.map((proposal) => {
            const candidate = revealCandidates ? CANDIDATES_BY_ID[proposal.candidateId] : null;
            if (revealCandidates && !candidate) return null;
            return (
              <View key={proposal.id} style={styles.propRow}>
                {candidate && <Avatar candidate={candidate} size={32} />}
                <View style={styles.propTextWrap}>
                  {candidate && <Text style={styles.propCandidateName}>{candidate.name}</Text>}
                  <Text style={styles.propText}>{proposal.text}</Text>
                  <AnswerBadge
                    answer={answers[proposal.id]}
                    inDeck={deckIds.has(proposal.id)}
                    colors={colors}
                    styles={styles}
                  />
                  {/* Même décodage que sur la carte de swipe, et seulement
                      quand la mesure en a besoin : les explications sont
                      facultatives depuis qu'une paraphrase ne compte plus
                      comme une explication. */}
                  {PROPOSAL_EXPLANATIONS[proposal.id] && (
                    <Text style={styles.propExplanation}>
                      {PROPOSAL_EXPLANATIONS[proposal.id]}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
      <View style={styles.gridToggleRow}>
        {revealToggle}
        {/* Les deux nombres sont dits explicitement : la mosaïque montre tout
            le catalogue, alors que le classement ne porte que sur le paquet
            tiré. Sans cette ligne, l'écart entre les deux écrans passerait
            pour une incohérence. Alignée à gauche sur la largeur du bloc, et
            non centrée sur 320 px : centrer un texte court au milieu d'une
            colonne large est précisément ce qui creusait du vide. */}
        <Text style={styles.catalogueNote}>
          {proposals.length} propositions au total, dont {deckIds.size} tirées pour cette partie.
        </Text>
      </View>
      <View style={styles.gridRow}>
        {themes.map((theme) => (
          <Pressable
            key={theme.id}
            onPress={() => setSelectedTheme(theme)}
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: getThemeColor(theme.id) },
              pressed && styles.tilePressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${theme.label}, ${countByTheme[theme.id] ?? 0} propositions`}
          >
            <Text style={styles.tileIcon}>{theme.icon}</Text>
            <View>
              <Text style={styles.tileLabel} numberOfLines={2}>
                {theme.label}
              </Text>
              <Text style={styles.tileCount}>
                {countByTheme[theme.id] ?? 0} proposition{(countByTheme[theme.id] ?? 0) > 1 ? 's' : ''}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

// Ce que tu as répondu à cette proposition, ou le fait qu'elle ne soit pas
// dans ton paquet. C'est ta propre réponse : elle ne dit rien de l'auteur et
// ne trahit donc pas le principe aveugle.
function AnswerBadge({
  answer,
  inDeck,
  colors,
  styles,
}: {
  answer: AnswerValue | undefined;
  inDeck: boolean;
  colors: ColorTokens;
  styles: ReturnType<typeof makeStyles>;
}) {
  if (answer) {
    const map: Record<AnswerValue, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
      like: { icon: 'heart', label: 'Tu as adhéré', color: colors.successText },
      superlike: { icon: 'star', label: 'Super like', color: colors.warningText },
      nope: { icon: 'close', label: 'Pas pour toi', color: colors.dangerText },
      skip: { icon: 'remove-outline', label: 'Sans avis', color: colors.textMuted },
    };
    const { icon, label, color } = map[answer];
    return (
      <View style={styles.badgeRow}>
        <Ionicons name={icon} size={12} color={color} />
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.badgeRow}>
      <Ionicons
        name={inDeck ? 'ellipse-outline' : 'layers-outline'}
        size={12}
        color={colors.textMuted}
      />
      <Text style={[styles.badgeText, { color: colors.textMuted }]}>
        {inDeck ? 'Pas encore vue' : 'Pas dans ce paquet'}
      </Text>
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    catalogueNote: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.45,
      color: colors.textMuted,
      paddingHorizontal: spacing.xs,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    badgeText: {
      fontSize: fonts.tiny - 1,
      fontWeight: '700',
    },
    grid: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    gridToggleRow: {
      alignSelf: 'stretch',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    revealHint: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.4,
      color: colors.textSecondary,
    },
    revealToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    revealIcon: {
      width: 34,
      height: 34,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    revealIconOn: {
      backgroundColor: colors.accentSoft,
    },
    // Piste et curseur de l'interrupteur. La position du curseur vient de
    // `alignItems` : pas de positionnement absolu, donc rien a recalculer si
    // les dimensions changent.
    switchTrack: {
      width: 46,
      height: 28,
      borderRadius: radii.pill,
      padding: 3,
      justifyContent: 'center',
      alignItems: 'flex-start',
      backgroundColor: colors.neutralTrack,
    },
    switchTrackOn: {
      alignItems: 'flex-end',
      backgroundColor: colors.accent,
    },
    // Le curseur change de couleur avec l'etat, et pas seulement de cote.
    // Un curseur en `surface` ne donnait que 1.24:1 sur la piste en theme
    // clair et 1.32:1 en sombre : present, mais invisible. Ces deux teintes
    // tiennent le seuil de 3:1 des elements d'interface, verifie par un test.
    switchKnob: {
      width: 22,
      height: 22,
      borderRadius: radii.pill,
      backgroundColor: colors.textMuted,
    },
    switchKnobOn: {
      backgroundColor: '#FFFFFF',
    },
    // Occupe tout l'espace entre l'icone et l'interrupteur : c'est ce qui
    // colle le titre a gauche et l'interrupteur a droite, sans marge morte.
    revealTexts: {
      flex: 1,
      gap: 1,
    },
    revealToggleOn: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentSoft,
    },
    revealTogglePressed: {
      opacity: 0.7,
    },
    revealToggleText: {
      fontSize: fonts.tiny + 1,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    revealToggleTextOn: {
      color: colors.accentText,
    },
    gridRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    tile: {
      width: '48%',
      aspectRatio: 1.15,
      borderRadius: radii.lg,
      padding: spacing.md,
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    tilePressed: {
      opacity: 0.85,
    },
    tileIcon: {
      fontSize: 28,
    },
    tileLabel: {
      fontSize: fonts.small,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    // Blanc plein, et non `rgba(255,255,255,0.85)` : les 15 % de transparence
    // laissaient remonter la couleur de la tuile et faisaient tomber le
    // contraste sous 4.5:1 sur 5 des 15 thèmes (pire cas : emploi à 4.08:1),
    // et sur 84 % des teintes possibles en mode arc-en-ciel, dont les couleurs
    // sont choisies pile au seuil face au blanc et n'ont donc aucune marge à
    // céder. La hiérarchie avec le libellé passe par la taille et la graisse.
    tileCount: {
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: 2,
    },
    detail: {
      flex: 1,
    },
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    detailBack: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    detailBackPressed: {
      opacity: 0.7,
    },
    detailIconBadge: {
      width: 30,
      height: 30,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailIconText: {
      fontSize: 15,
    },
    detailTitle: {
      flex: 1,
      fontSize: fonts.body,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    detailList: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    propRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.sm + 2,
    },
    propTextWrap: {
      flex: 1,
      gap: 2,
    },
    propCandidateName: {
      fontSize: fonts.tiny + 1,
      fontWeight: '700',
      color: colors.accentText,
    },
    propText: {
      fontSize: fonts.tiny + 2,
      lineHeight: (fonts.tiny + 2) * 1.35,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    propExplanation: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.4,
      color: colors.textSecondary,
    },
  });
}
