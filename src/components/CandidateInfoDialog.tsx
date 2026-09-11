import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar } from './Avatar';
import { THEMES_BY_ID } from '../data/themes';
import { themeChipColors } from '../data/themeColors';
import { CANDIDATE_BIOS } from '../data/candidateBios';
import { openUrl, POLIGRAPH_SOURCE_URL } from '../data/source';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Answers, Candidate, Proposal } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useThemeColor, useThemeSettings } from '../theme/ThemeContext';

// Fiche d'un candidat : une notice biographique, puis sa présence dans le
// questionnaire.
//
// La notice n'est pas écrite par l'app. C'est le résumé de l'article Wikipédia
// correspondant (voir scripts/fetch-bios.js), affiché avec son attribution et
// un lien vers l'article. Rédiger nous-mêmes sur des personnes réelles
// finirait par produire une date ou un mandat faux que rien ne signalerait ;
// ici la source est citée et vérifiable d'un toucher.
export function CandidateInfoDialog({
  visible,
  candidate,
  proposals,
  answers,
  revealThemes,
  onClose,
}: {
  visible: boolean;
  candidate: Candidate | null;
  proposals: Proposal[];
  answers: Answers;
  // La notice biographique est publique et n'a rien à protéger. La liste des
  // sujets sur lesquels ce candidat se prononce, si : croisée avec la mosaïque
  // de l'onglet Propositions, elle réduit le champ des cartes en cours. Elle
  // n'apparaît donc qu'une fois le voile levé, ou le paquet terminé.
  revealThemes: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const getThemeColor = useThemeColor();
  const { effectiveScheme } = useThemeSettings();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tousLesSujets, setTousLesSujets] = useState(false);

  // Chaque fiche s'ouvre repliée. Sans cette remise à zéro, avoir déplié les
  // sujets d'un candidat laissait la fiche du suivant ouverte en grand.
  useEffect(() => {
    setTousLesSujets(false);
  }, [candidate?.id]);

  const stats = useMemo(() => {
    if (!candidate) return null;
    const mine = proposals.filter((p) => p.candidateId === candidate.id);
    const byTheme = new Map<string, number>();
    let answered = 0;
    let approved = 0;

    for (const p of mine) {
      byTheme.set(p.themeId, (byTheme.get(p.themeId) ?? 0) + 1);
      const a = answers[p.id];
      if (a === 'like' || a === 'superlike') {
        answered++;
        approved++;
      } else if (a === 'nope') {
        answered++;
      }
    }

    const themes = [...byTheme.entries()]
      .map(([id, count]) => ({ theme: THEMES_BY_ID[id], count }))
      .filter((t) => t.theme)
      .sort((a, b) => b.count - a.count || a.theme.label.localeCompare(b.theme.label, 'fr'));

    return { themes, answered, approved };
  }, [candidate, proposals, answers]);

  const bio = candidate ? CANDIDATE_BIOS[candidate.id] : undefined;

  const profileUrl = candidate?.poligraphSlug
    ? `https://poligraph.fr/politiques/${candidate.poligraphSlug}`
    : POLIGRAPH_SOURCE_URL;

  // Entrée en cascade : chaque bloc arrive légèrement après le précédent.
  // Désactivée si le système demande de réduire les animations.
  const enter = (index: number) =>
    reducedMotion ? undefined : FadeInDown.delay(60 + index * 55).duration(320);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {candidate && stats && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Animated.View style={styles.hero} entering={enter(0)}>
              <View style={styles.avatarRing}>
                <Avatar candidate={candidate} size={AVATAR} />
              </View>
              <Text style={styles.name}>{candidate.name}</Text>
              <Text style={styles.subtitle}>
                {candidate.party}
                {bio?.role ? ` · ${bio.role}` : ''}
              </Text>
            </Animated.View>

            {/* PAS DE COMPTE DE PROPOSITIONS ICI.
                Le paquet est tiré à quota égal (voir utils/deck.ts) : les onze
                candidats en ont donc rigoureusement le même nombre. Afficher
                « 15 propositions » sur chaque fiche ne distinguait personne,
                tout en laissant croire qu'il y avait là une différence à
                comparer. Ne restent que les deux chiffres qui varient
                réellement d'une fiche à l'autre.

                Le nombre de sujets suit la même règle que leur liste, juste
                en dessous : il échappait au voile, ce qui revenait à masquer
                les pastilles tout en publiant leur cardinal. */}
            {(revealThemes || stats.answered > 0) && (
              <Animated.View style={styles.statsRow} entering={enter(1)}>
                {revealThemes && (
                  <Stat styles={styles} value={String(stats.themes.length)} label="sujets abordés" />
                )}
                {stats.answered > 0 && (
                  <Stat
                    styles={styles}
                    value={`${stats.approved}/${stats.answered}`}
                    label="approuvées par toi"
                  />
                )}
              </Animated.View>
            )}

            {bio && (
              <Animated.View style={styles.card} entering={enter(2)}>
                <Text style={styles.bioText}>{bio.summary}</Text>
                <Pressable
                  onPress={() => openUrl(bio.article)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.source, pressed && styles.pressed]}
                  accessibilityRole="link"
                  accessibilityLabel={`Lire l’article Wikipédia sur ${candidate.name}`}
                >
                  <Ionicons name="book-outline" size={13} color={colors.accentText} />
                  <Text style={styles.sourceText}>Wikipédia · CC BY-SA</Text>
                  <Ionicons name="arrow-forward" size={13} color={colors.accentText} />
                </Pressable>
              </Animated.View>
            )}

            <Animated.View style={styles.themeBlock} entering={enter(3)}>
              <Text style={styles.label}>Sujets abordés</Text>
              {revealThemes ? (
                // PAVÉ QUI S'ENROULE, REPLIÉ PAR DÉFAUT.
                //
                // Trois dispositions ont été essayées ici, et chacune corrige
                // le défaut de la précédente.
                //
                // 1. Toutes les pastilles à la ligne : quatre ou cinq rangées,
                //    près du tiers de la fiche pour une information d'appoint.
                // 2. Une bande horizontale qui défile : la hauteur tombait à
                //    une seule pastille, mais au prix du reste. Une bande qui
                //    glisse est un CONTENU CACHÉ — au-delà de la troisième
                //    pastille, plus rien ne s'atteint sans deviner qu'il faut
                //    pousser de côté, geste qu'aucune autre partie de l'app
                //    ne demande. Et elle piégeait le doigt : posé sur la
                //    bande, un glissement vertical pour lire la suite de la
                //    fiche était pris pour un glissement de la bande.
                // 3. Ici : les pastilles s'enroulent, mais on n'en montre que
                //    les six premières, triées par nombre décroissant. Deux
                //    rangées, la même hauteur qu'avant en pratique, et la
                //    suite est à un toucher franc plutôt qu'à un geste
                //    latéral. Tout est atteignable, rien n'est imposé.
                <View style={styles.wrap}>
                  {(tousLesSujets ? stats.themes : stats.themes.slice(0, SUJETS_REPLIES)).map(
                    ({ theme, count }) => {
                      const tint = themeChipColors(
                        getThemeColor(theme.id),
                        colors.surface,
                        effectiveScheme === 'dark'
                      );
                      return (
                        <View
                          key={theme.id}
                          style={[styles.chip, { backgroundColor: tint.background }]}
                        >
                          <Text style={styles.chipIcon}>{theme.icon}</Text>
                          <Text style={[styles.chipLabel, { color: tint.text }]} numberOfLines={1}>
                            {theme.label}
                          </Text>
                          <Text style={[styles.chipCount, { color: tint.text }]}>{count}</Text>
                        </View>
                      );
                    }
                  )}

                  {stats.themes.length > SUJETS_REPLIES && (
                    <Pressable
                      onPress={() => setTousLesSujets((ouvert) => !ouvert)}
                      style={({ pressed }) => [styles.moreChip, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: tousLesSujets }}
                      accessibilityLabel={
                        tousLesSujets
                          ? 'Replier la liste des sujets'
                          : `Afficher les ${stats.themes.length - SUJETS_REPLIES} autres sujets`
                      }
                    >
                      <Text style={styles.moreChipText}>
                        {tousLesSujets
                          ? 'Replier'
                          : `+${stats.themes.length - SUJETS_REPLIES}`}
                      </Text>
                      <Ionicons
                        name={tousLesSujets ? 'chevron-up' : 'chevron-down'}
                        size={13}
                        color={colors.accentText}
                      />
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={styles.lockedRow}>
                  <Ionicons name="eye-off-outline" size={15} color={colors.textSecondary} />
                  <Text style={styles.lockedText}>
                    Masqués tant que tu swipes : savoir sur quels sujets ce candidat se prononce
                    aiderait à deviner les cartes en cours.
                  </Text>
                </View>
              )}
            </Animated.View>

            <Animated.View entering={enter(4)}>
              <Pressable
                onPress={() => openUrl(profileUrl)}
                style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                accessibilityRole="link"
                accessibilityLabel={`Ouvrir la fiche de ${candidate.name} sur Poligraph`}
              >
                <Text style={styles.ctaText}>Toutes ses mesures sur Poligraph</Text>
                <Ionicons name="open-outline" size={18} color={colors.onAccent} />
              </Pressable>

              <Text style={styles.note}>
                Cette fiche ne décrit que la présence de ce candidat dans le questionnaire, pas
                l’ensemble de son programme.
              </Text>
            </Animated.View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function Stat({
  styles,
  value,
  label,
}: {
  styles: ReturnType<typeof makeStyles>;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const AVATAR = 112;
const RING = 4;

// Pastilles montrées avant dépliage. Six, parce que deux rangées suffisent à
// dire de quoi ce candidat parle le plus : la liste est triée par nombre
// décroissant, donc les six premières portent l'essentiel. Au-delà, on entre
// dans la queue de distribution, celle qu'on va chercher si on la cherche.
const SUJETS_REPLIES = 6;

function makeStyles(colors: ColorTokens) {
  // Ombre douce commune aux cartes : c'est elle qui les détache du fond, à la
  // place des bordures d'un pixel qui donnaient un rendu très "formulaire".
  const soft = {
    shadowColor: '#1A1730',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 2,
  } as const;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    topBar: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    close: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    pressed: {
      opacity: 0.6,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },

    hero: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
      ...soft,
    },
    // Anneau teinté autour de la photo : la seule touche de couleur d'accent
    // de la fiche, à l'endroit où le regard se pose en premier.
    avatarRing: {
      padding: RING,
      borderRadius: radii.pill,
      backgroundColor: colors.accentSoft,
      marginBottom: spacing.sm,
    },
    name: {
      fontSize: fonts.title + 4,
      fontWeight: '800',
      letterSpacing: -0.8,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.4,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      gap: 2,
      ...soft,
    },
    statValue: {
      fontSize: fonts.title,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: colors.accentText,
      fontVariant: ['tabular-nums'],
    },
    statLabel: {
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.md,
      ...soft,
    },
    bioText: {
      fontSize: fonts.body,
      lineHeight: fonts.body * 1.6,
      color: colors.textPrimary,
    },
    source: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
    },
    sourceText: {
      fontSize: fonts.tiny + 1,
      fontWeight: '700',
      color: colors.accentText,
    },

    themeBlock: {
      paddingHorizontal: spacing.xs,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    label: {
      fontSize: fonts.tiny,
      fontWeight: '800',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    // Le bouton de dépliage prend la forme d'une pastille et se range dans la
    // même grille : il se lit comme la suite de la liste, pas comme une
    // commande posée à côté d'elle.
    moreChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingVertical: 7,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radii.pill,
      backgroundColor: colors.accentSoft,
    },
    moreChipText: {
      fontSize: fonts.tiny + 1,
      fontWeight: '800',
      color: colors.accentText,
      fontVariant: ['tabular-nums'],
    },
    lockedRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    lockedText: {
      flex: 1,
      fontSize: fonts.tiny + 1,
      lineHeight: (fonts.tiny + 1) * 1.45,
      color: colors.textSecondary,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: spacing.sm + 4,
      borderRadius: radii.pill,
    },
    chipIcon: {
      fontSize: 12,
    },
    chipLabel: {
      fontSize: fonts.tiny + 1,
      fontWeight: '700',
    },
    // Pas d'opacité ici. Le nombre est posé sur une pastille déjà teintée, et
    // l'atténuer le faisait tomber à 2,85:1 en thème clair (4,04 en sombre)
    // pour un seuil de 4,5 — mesuré sur les quinze couleurs de thème. À pleine
    // opacité il tient 4,85:1. Sa discrétion vient de sa taille.
    chipCount: {
      fontSize: fonts.tiny,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },

    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing.md + 2,
    },
    ctaPressed: {
      backgroundColor: colors.accentStrong,
    },
    ctaText: {
      fontSize: fonts.body,
      fontWeight: '700',
      color: colors.onAccent,
    },
    note: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.5,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
      marginTop: spacing.md,
    },
  });
}
