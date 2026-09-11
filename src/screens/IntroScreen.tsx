import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors, useThemeSettings } from '../theme/ThemeContext';
import { haptics } from '../utils/haptics';
import { PROPOSALS } from '../data/proposals';
import { CANDIDATES } from '../data/candidates';
import { ConfirmDialog } from '../components/ConfirmDialog';

// Easter egg : sept appuis rapides sur le titre débloquent un accent caché.
const SECRET_TAPS_REQUIRED = 7;
// Au delà de ce délai entre deux appuis, le compteur repart de zéro : c'est
// une suite d'appuis volontaire, pas des appuis isolés cumulés sur la durée.
const SECRET_TAP_TIMEOUT_MS = 1200;

// Quatre libelles cote a cote sur une seule ligne : au dela de ce
// grossissement, « Pas pour moi » deborde de sa colonne. Le libelle complet des
// quatre choix reste annonce par l'accessibilityLabel du bloc.
const LEGEND_MAX_SCALE = 1.3;

export type RestorableSummary = {
  currentIndex: number;
  total: number;
  isComplete: boolean;
  topCandidateName?: string;
  topPct?: number;
  // Nombre de candidats en tête. Au-delà d'un seul, nommer quelqu'un serait
  // désigner un vainqueur que le classement ne connaît pas.
  topCount?: number;
};

type Props = {
  onStartFresh: () => void;
  onCustomizeThemes: () => void;
  restorable: RestorableSummary | null;
  onResume: () => void;
  onOpenHowItWorks: () => void;
  onOpenSettings: () => void;
};

export function IntroScreen({
  onStartFresh,
  onCustomizeThemes,
  restorable,
  onResume,
  onOpenHowItWorks,
  onOpenSettings,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const { rainbowUnlocked, setRainbowUnlocked, setRainbowEnabled } = useThemeSettings();
  const [secretRevealed, setSecretRevealed] = useState(false);
  const tapCount = useRef(0);
  const lastTapAt = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    []
  );

  const handleTitleTap = () => {
    if (rainbowUnlocked) return;

    const now = Date.now();
    tapCount.current = now - lastTapAt.current > SECRET_TAP_TIMEOUT_MS ? 1 : tapCount.current + 1;
    lastTapAt.current = now;

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, SECRET_TAP_TIMEOUT_MS);

    if (tapCount.current >= SECRET_TAPS_REQUIRED) {
      tapCount.current = 0;
      if (resetTimer.current) clearTimeout(resetTimer.current);
      haptics.notification(Haptics.NotificationFeedbackType.Success);
      setRainbowUnlocked(true);
      setSecretRevealed(true);
      return;
    }
    // À mi-parcours, une vibration discrète confirme qu'il se passe quelque
    // chose, sans rien dévoiler de ce qui est en train d'être débloqué.
    if (tapCount.current >= Math.ceil(SECRET_TAPS_REQUIRED / 2)) {
      haptics.selection();
    }
  };

  const handleStartFreshPress = () => {
    if (restorable && !restorable.isComplete) {
      setConfirmingRestart(true);
      return;
    }
    onStartFresh();
  };

  const handleConfirmRestart = () => {
    setConfirmingRestart(false);
    onStartFresh();
  };

  // Une session terminée n'a pas forcément produit de résultat : si on a
  // répondu « pas d'avis » à tout, aucun candidat n'est classé et le nom
  // comme le pourcentage sont absents. Sans ce garde-fou, l'encart affichait
  // littéralement « undefined% avec undefined ».
  const hasLastResult =
    restorable?.isComplete &&
    restorable.topCandidateName !== undefined &&
    restorable.topPct !== undefined;

  // « 82 % avec Édouard Philippe », ou « 82 % avec 3 candidats à égalité ».
  const resume = !hasLastResult
    ? ''
    : (restorable.topCount ?? 1) > 1
      ? `${restorable.topPct}% avec ${restorable.topCount} candidats à égalité`
      : `${restorable.topPct}% avec ${restorable.topCandidateName}`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable
        onPress={onOpenSettings}
        hitSlop={10}
        style={({ pressed }) => [
          styles.settingsButton,
          { top: insets.top + spacing.sm },
          pressed && styles.settingsButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Réglages"
      >
        <Ionicons name="options-outline" size={22} color={colors.textSecondary} />
      </Pressable>

      {/* L'ACCUEIL DÉFILE, au lieu d'entasser.
          Il ne défilait pas : `content` portait `flex: 1`, donc aussi
          `flexShrink: 1`, et se laissait comprimer sous sa hauteur naturelle
          dès que le pied de page grossissait — ce qui arrive précisément quand
          une session est terminée, le rappel du dernier résultat s'ajoutant
          aux deux boutons. Centrant ses enfants, il les faisait alors déborder
          des DEUX côtés : le titre sortait par le haut, tandis que le nombre
          de propositions et « comment ça marche » disparaissaient sous la
          carte de résultat.
          `flexGrow: 1` sans `flexShrink` garde très exactement l'allure
          actuelle tant que tout tient — le contenu s'étire et le pied reste en
          bas — et laisse le défilement prendre le relais au lieu du
          chevauchement quand ça ne tient plus. */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        // Le rebond ferait flotter un écran qui, la plupart du temps, tient
        // tout entier et n'a donc rien à défiler.
        bounces={false}
      >
        <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRÉSIDENTIELLE 2027</Text>
        </View>

        <Pressable onPress={handleTitleTap} accessibilityRole="header" accessibilityLabel="Élyze">
          <Text style={styles.title}>Élyze</Text>
        </Pressable>
        <Text style={styles.pitch}>
          Swipe des propositions sans savoir qui les porte. Découvre qui te ressemble.
        </Text>

        {/* QUATRE choix, pas trois. Le super like est une réponse à part
            entière : sa place est ici, avec les autres, et non dans un encart
            séparé sous la légende. Cet encart-là coûtait une cinquantaine de
            pixels sur un écran qui doit tenir sans défilement, pour dire une
            chose qui se loge dans une colonne déjà présente.
            Le « ×3 » est posé sur l'icône plutôt qu'écrit en toutes lettres :
            c'est ce qui distingue ce geste des autres, et l'explication
            complète est annoncée aux lecteurs d'écran par le libellé du bloc.
            Il reste à la taille des libellés, jamais en dessous. */}
        <View
          style={styles.legend}
          accessible
          accessibilityLabel="Quatre choix possibles : pas pour moi, pas d’avis, j’adhère, ou super like qui compte trois fois plus dans ton résultat"
        >
          <View style={styles.legendItem} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <View style={[styles.legendIcon, styles.legendIconNope]}>
              <Ionicons name="close" size={18} color={colors.danger} />
            </View>
            <Text style={styles.legendText} numberOfLines={1} maxFontSizeMultiplier={LEGEND_MAX_SCALE}>
              Pas pour moi
            </Text>
          </View>
          <View style={styles.legendItem} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <View style={[styles.legendIcon, styles.legendIconSkip]}>
              <Ionicons name="remove-outline" size={16} color={colors.textSecondary} />
            </View>
            <Text style={styles.legendText} numberOfLines={1} maxFontSizeMultiplier={LEGEND_MAX_SCALE}>
              Pas d’avis
            </Text>
          </View>
          <View style={styles.legendItem} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <View style={[styles.legendIcon, styles.legendIconLike]}>
              <Ionicons name="heart" size={16} color={colors.success} />
            </View>
            <Text style={styles.legendText} numberOfLines={1} maxFontSizeMultiplier={LEGEND_MAX_SCALE}>
              J’adhère
            </Text>
          </View>
          <View style={styles.legendItem} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <View style={[styles.legendIcon, styles.legendIconSuper]}>
              <Ionicons name="star" size={16} color={colors.warningText} />
              <View style={styles.legendMultiplier}>
                <Text style={styles.legendMultiplierText}>×3</Text>
              </View>
            </View>
            <Text style={styles.legendText} numberOfLines={1} maxFontSizeMultiplier={LEGEND_MAX_SCALE}>
              Super like
            </Text>
          </View>
        </View>

        {/* Le compte et le lien tiennent sur UNE ligne, au lieu de trois
            blocs empilés. L'accueil doit tenir dans un écran sans défilement,
            et chaque bloc centré y coûtait une trentaine de pixels pour une
            information de deux mots.
            La mention du « super like » a quitté cet écran : c'est un détail
            de règle, et il est déjà dit à l'endroit où il sert, le tutoriel du
            premier swipe, puis dans « comment ça marche ». */}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {PROPOSALS.length} propositions · {CANDIDATES.length} candidats
          </Text>
          <Text style={styles.metaSep}>·</Text>
          <Pressable
            onPress={onOpenHowItWorks}
            hitSlop={10}
            style={styles.exploreLinkWrap}
            accessibilityRole="button"
            accessibilityLabel="Comment ça marche"
          >
            <Text style={styles.exploreLink}>Comment ça marche ?</Text>
          </Pressable>
        </View>

      </View>

      <View style={styles.footer}>
        {/* Le rappel du dernier résultat est une action : il vit avec les
            autres, en bas. Placé plus haut, il s'ajoutait à un bloc centré et
            faisait remonter tout le contenu de l'écran selon qu'on avait ou
            non un résultat précédent. */}
        {hasLastResult && (
          <Pressable
            onPress={onResume}
            style={({ pressed }) => [styles.resultCard, pressed && styles.resultCardPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Revoir ton dernier résultat : ${resume}`}
          >
            <View style={styles.resultCardText}>
              <Text style={styles.resultCardLabel}>TON DERNIER RÉSULTAT</Text>
              <Text style={styles.resultCardValue} numberOfLines={1}>
                {resume}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.accentText} />
          </Pressable>
        )}

        {restorable && !restorable.isComplete && (
          <>
            <Pressable
              onPress={onResume}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Reprendre ta session, ${restorable.currentIndex} sur ${restorable.total}`}
            >
              <Text style={styles.ctaText}>
                Reprendre ({restorable.currentIndex}/{restorable.total})
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.onAccent} />
            </Pressable>
            <Pressable
              onPress={handleStartFreshPress}
              hitSlop={8}
              style={styles.restartLinkWrap}
              accessibilityRole="button"
              accessibilityLabel="Recommencer à zéro"
            >
              <Text style={styles.restartLink}>Recommencer à zéro</Text>
            </Pressable>
          </>
        )}

        {(!restorable || restorable.isComplete) && (
          <>
            <Pressable
              onPress={onStartFresh}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              accessibilityRole="button"
              accessibilityLabel={
                restorable?.isComplete
                  ? 'Refaire le test, toutes les propositions'
                  : 'Commencer, toutes les propositions'
              }
            >
              <Text style={styles.ctaText}>
                {restorable?.isComplete ? 'Refaire le test' : 'Commencer'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.onAccent} />
            </Pressable>
            {/* Bouton plein et non lien discret. C'est ici, avant de lancer,
                que choisir ses thèmes est à la fois utile et gratuit : une
                fois la session commencée, en changer la redémarre. Traité
                comme « Recommencer à zéro » — même gris muet — il se lisait
                comme une note de bas de page. */}
            <Pressable
              onPress={onCustomizeThemes}
              style={({ pressed }) => [styles.themeCta, pressed && styles.themeCtaPressed]}
              accessibilityRole="button"
              accessibilityLabel="Choisir les thèmes à swiper"
            >
              <Ionicons name="pricetags-outline" size={18} color={colors.accentText} />
              <Text style={styles.themeCtaText}>Choisir mes thèmes</Text>
            </Pressable>
          </>
        )}

        {/* La mention de la source est une obligation de la licence : elle
            reste. La garantie d'un nombre égal de propositions par candidat a
            rejoint « comment ça marche », où elle est expliquée plutôt
            qu'affirmée en une ligne. */}
        <Text style={styles.disclaimer}>
          Propositions publiques recensées par Poligraph.
        </Text>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingRestart}
        title="Recommencer à zéro ?"
        message="Ta session en cours sera effacée définitivement."
        confirmLabel="Recommencer"
        onConfirm={handleConfirmRestart}
        onCancel={() => setConfirmingRestart(false)}
      />

      <ConfirmDialog
        visible={secretRevealed}
        title="🌈 Mode arc-en-ciel débloqué !"
        message="Sept appuis sur le titre, bien joué. Deux réglages viennent d’apparaître dans tes paramètres : un fond animé, où un dégradé multicolore parcourt lentement les cartes, et le mode couleurs au hasard, qui repeint toute l’app à chaque tirage. Ils se cumulent, et s’éteignent aussi facilement."
        confirmLabel="Activer maintenant"
        cancelLabel="Plus tard"
        onConfirm={() => {
          setSecretRevealed(false);
          setRainbowEnabled(true);
        }}
        onCancel={() => setSecretRevealed(false)}
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
    // `space-between` a déménagé du conteneur vers le contenu défilant : c'est
    // lui qui, avec `flexGrow`, tient le pied de page en bas quand l'écran est
    // assez haut.
    scroll: {
      flexGrow: 1,
      justifyContent: 'space-between',
    },
    settingsButton: {
      position: 'absolute',
      right: spacing.lg,
      zIndex: 1,
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    settingsButtonPressed: {
      opacity: 0.7,
    },
    content: {
      // `flexGrow` sans `flexShrink` : le bloc s'étire pour occuper la place
      // libre, mais ne descend jamais sous sa hauteur naturelle. C'est cette
      // seconde moitié qui manquait — `flex: 1` autorisait la compression, et
      // le contenu débordait alors sur le pied de page.
      flexGrow: 1,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      gap: spacing.md,
    },
    badge: {
      backgroundColor: colors.accentSoft,
      borderRadius: radii.pill,
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    badgeText: {
      fontSize: fonts.tiny,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.accentText,
    },
    title: {
      fontSize: 56,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -1,
    },
    pitch: {
      fontSize: fonts.body + 2,
      lineHeight: (fonts.body + 2) * 1.4,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
    // Quatre colonnes egales plutot qu'un ecartement fixe : a trois choix un
    // `gap` de 24 suffisait, a quatre il poussait « Pas pour moi » hors de sa
    // colonne. Chaque choix prend maintenant le quart de la largeur.
    legend: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    legendItem: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
    },
    legendIcon: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      // Le multiplicateur deborde du cercle : il doit rester visible.
      overflow: 'visible',
    },
    legendIconSuper: {
      borderColor: colors.warningSoft,
      backgroundColor: colors.warningSoft,
    },
    legendMultiplier: {
      position: 'absolute',
      right: -8,
      bottom: -4,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: radii.pill,
      backgroundColor: colors.warningText,
    },
    legendMultiplierText: {
      // Jamais sous le plus petit jeton de police de l'app.
      fontSize: fonts.tiny,
      lineHeight: fonts.tiny + 3,
      fontWeight: '800',
      color: colors.bg,
      fontVariant: ['tabular-nums'],
    },
    legendIconNope: {
      borderColor: colors.dangerSoft,
      backgroundColor: colors.dangerSoft,
    },
    legendIconSkip: {
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    legendIconLike: {
      borderColor: colors.successSoft,
      backgroundColor: colors.successSoft,
    },
    legendText: {
      fontSize: fonts.tiny,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    meta: {
      fontSize: fonts.small,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    // Compte et lien sur une seule ligne, separes par un point median.
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 6,
    },
    metaSep: {
      fontSize: fonts.tiny + 1,
      color: colors.textMuted,
    },
    exploreLinkWrap: {
      paddingVertical: spacing.xs,
    },
    exploreLink: {
      fontSize: fonts.tiny + 1,
      fontWeight: '600',
      color: colors.textMuted,
      textDecorationLine: 'underline',
    },
    resultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accentSoft,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.lg,
    },
    resultCardPressed: {
      opacity: 0.8,
    },
    resultCardText: {
      // Occupe la place restante pour que le chevron reste collé à droite et
      // qu'un nom long soit tronqué plutôt que de pousser la mise en page.
      flex: 1,
      gap: 2,
    },
    resultCardLabel: {
      fontSize: fonts.tiny,
      fontWeight: '700',
      color: colors.accentText,
      letterSpacing: 0.5,
    },
    resultCardValue: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      // Écart minimal avec le bloc du dessus. Il venait jusqu'ici du
      // `space-between`, qui ne produit plus rien dès que le contenu défile :
      // sans lui, « comment ça marche » se retrouvait collé à la carte de
      // résultat sur les écrans courts.
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing.md + 2,
    },
    ctaPressed: {
      backgroundColor: colors.accentStrong,
    },
    ctaText: {
      fontSize: fonts.body + 1,
      fontWeight: '700',
      color: colors.onAccent,
    },
    // Second bouton de l'accueil : même gabarit que le principal, mais posé
    // sur l'accent atténué au lieu de l'accent plein. Il se voit sans
    // disputer la primauté à « Commencer ».
    themeCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
      backgroundColor: colors.accentSoft,
      borderRadius: radii.pill,
      paddingVertical: spacing.md - 2,
    },
    themeCtaPressed: {
      opacity: 0.65,
    },
    themeCtaText: {
      fontSize: fonts.body,
      fontWeight: '700',
      color: colors.accentText,
    },
    restartLinkWrap: {
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    // L'ACCENT CHOISI DANS LES RÉGLAGES, et non un gris de service.
    // Recommencer est une action ordinaire et volontaire : la teinte de l'app
    // est ce qui dit « ceci se touche ». En `textMuted`, ce lien portait la
    // couleur des mentions qu'on ne touche pas — juste au-dessous du bouton
    // « Reprendre », il passait pour une légende de celui-ci.
    restartLink: {
      fontSize: fonts.small,
      fontWeight: '700',
      color: colors.accentText,
    },
    disclaimer: {
      fontSize: fonts.tiny,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: fonts.tiny * 1.5,
      paddingHorizontal: spacing.md,
    },
  });
}
