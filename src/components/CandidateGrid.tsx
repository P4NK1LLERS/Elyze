import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { CANDIDATES } from '../data/candidates';
import { CANDIDATE_BIOS } from '../data/candidateBios';
import { Candidate } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

// Trombinoscope des candidats du questionnaire : qui est dans l'app, et rien
// d'autre. Toucher une fiche ouvre la notice détaillée (CandidateInfoDialog),
// qui porte la biographie Wikipédia et le lien vers la source.
//
// CE QUI N'EST PAS ICI, ET POURQUOI.
//
// Aucun score, aucun pourcentage, aucun classement : c'est le travail de
// l'onglet Classement, et les mélanger inviterait à lire cette grille comme
// un palmarès. Aucun décompte de propositions non plus — pendant une partie
// tous les candidats en ont exactement le même nombre (le paquet est tiré à
// quota égal, voir utils/deck.ts), donc l'afficher n'apprendrait rien tout en
// suggérant qu'il y a là une différence à observer.
//
// L'ORDRE EST ALPHABÉTIQUE, et c'est une décision, pas un défaut. Classer des
// personnes réelles par score, par sondage ou par « importance » ferait dire à
// l'app quelque chose qu'elle n'a pas les moyens d'affirmer. L'ordre de
// CANDIDATES est repris tel quel, sans tri local : il vient du fichier généré
// et ne dépend d'aucune réponse de l'utilisateur, donc deux personnes voient
// la même grille.
//
// La grille reste entièrement visible pendant le swipe. Elle ne dit pas qui
// propose quoi — c'est cela seul que l'app protège — et la fiche détaillée
// masque de son côté la liste des sujets abordés tant que le paquet n'est pas
// terminé.
// PLUS D'ONGLET À ELLE : cette grille est une vue du panneau Classement.
//
// Elle a occupé le cinquième bouton de la barre du bas, et il ne le méritait
// pas. Ce qu'elle montre — onze photos, onze noms, onze partis — se consulte
// une fois et ne change jamais : ni score, ni compte, ni réponse, rien qui
// évolue d'une visite à l'autre. Un onglet permanent promet le contraire, et
// il le promettait au prix du seul libellé long de la barre, « Propositions »,
// qui devait rétrécir pour tenir à cinq.
//
// Elle avait en outre un effet qu'aucune autre vue n'a : mettre onze visages
// devant quelqu'un dont le travail, à cet instant, est de juger des textes
// sans savoir de qui ils sont. Rien n'était révélé, mais rien n'y invitait.
//
// Elle n'est pas supprimée pour autant : la savoir accessible est une
// garantie de transparence sur qui est comparé, et les notices Wikipédia
// n'ont pas d'autre porte d'entrée avant la fin du paquet. Elle rejoint donc
// le panneau qui parle déjà des personnes, à un toucher de là.
//
// Sans ScrollView : c'est le panneau qui défile, et deux zones de défilement
// vertical imbriquées se disputent le geste.
export function CandidateGrid({ onSelect }: { onSelect: (candidateId: string) => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={styles.title}>Les {CANDIDATES.length} candidats</Text>
        <Text style={styles.caption}>
          Ceux dont les mesures alimentent le paquet. Touche une photo pour sa notice et le
          lien vers ses propositions publiées.
        </Text>
      </View>

      <View style={styles.grid}>
        {CANDIDATES.map((candidate) => (
          <CandidateTile
            key={candidate.id}
            candidate={candidate}
            styles={styles}
            onPress={() => onSelect(candidate.id)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
        <Text style={styles.footerText}>
          Ordre alphabétique. Ce n’est pas un classement : le tien est juste à côté, dans
          « Classement ».
        </Text>
      </View>
    </View>
  );
}

function CandidateTile({
  candidate,
  styles,
  onPress,
}: {
  candidate: Candidate;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  const bio = CANDIDATE_BIOS[candidate.id];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      accessibilityRole="button"
      // Le libellé complet est annoncé ici parce que les deux textes visibles
      // sont tronqués à deux lignes : un lecteur d'écran doit entendre le nom
      // et le parti entiers, pas leur version coupée.
      accessibilityLabel={`${candidate.name}, ${candidate.party}. Ouvrir sa notice.`}
    >
      {/* L'avatar n'est pas rendu tactile : la tuile entière l'est déjà, et
          deux zones tactiles concentriques se disputent le toucher. */}
      <Avatar candidate={candidate} size={AVATAR} />
      <Text style={styles.name} numberOfLines={2} maxFontSizeMultiplier={MAX_TILE_SCALE}>
        {candidate.name}
      </Text>
      <Text style={styles.party} numberOfLines={2} maxFontSizeMultiplier={MAX_TILE_SCALE}>
        {candidate.party}
      </Text>
      {bio?.role && (
        <Text style={styles.role} numberOfLines={1} maxFontSizeMultiplier={MAX_TILE_SCALE}>
          {bio.role}
        </Text>
      )}
    </Pressable>
  );
}

const AVATAR = 68;

// Deux tuiles par rangée, à hauteur libre : au delà de ce grossissement le nom
// et le parti mangent la rangée entière et la grille cesse d'être scannable.
// Le libellé complet reste annoncé aux lecteurs d'écran par la tuile.
const MAX_TILE_SCALE = 1.5;

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.md,
    },
    intro: {
      paddingTop: spacing.xs,
      gap: 4,
    },
    title: {
      fontSize: fonts.title - 4,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: colors.textPrimary,
    },
    caption: {
      fontSize: fonts.small,
      lineHeight: fonts.small * 1.45,
      color: colors.textSecondary,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm + 2,
    },
    tile: {
      // Deux colonnes : la largeur est donnée en pourcentage pour suivre la
      // rotation de l'écran sans mesure. La moitié moins la moitié du `gap`.
      //
      // Surtout PAS de `flexGrow` ici. Le nombre de candidats est impair : la
      // dernière rangée n'en contient qu'un, et il s'étirerait alors sur toute
      // la largeur, donnant à un candidat une tuile deux fois plus grande que
      // les autres — exactement la hiérarchie visuelle que cet écran refuse.
      width: '48%',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.sm,
      gap: 3,
      shadowColor: '#1A1730',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 18,
      elevation: 2,
    },
    tilePressed: {
      opacity: 0.65,
    },
    name: {
      marginTop: spacing.sm,
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    party: {
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.35,
      fontWeight: '600',
      color: colors.accentText,
      textAlign: 'center',
    },
    role: {
      fontSize: fonts.tiny,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    footer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    footerText: {
      flex: 1,
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny * 1.45,
      color: colors.textSecondary,
    },
  });
}
