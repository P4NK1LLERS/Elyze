import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../components/ProgressBar';
import { SwipeDeck, SwipeDeckHandle } from '../components/SwipeDeck';
import { ActionButtons } from '../components/ActionButtons';
import { SwipeTutorialOverlay } from '../components/SwipeTutorialOverlay';
import { BottomTabBar, BottomTabItem } from '../components/BottomTabBar';
import { ThemeMosaic } from '../components/ThemeMosaic';
import { CandidateGrid } from '../components/CandidateGrid';
import { RankingPanel } from '../components/RankingPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  AnswerGroups,
  CandidateAnswersDialog,
  emptyAnswerGroups,
} from '../components/CandidateAnswersDialog';
import { CandidateInfoDialog } from '../components/CandidateInfoDialog';
import { ProposalDebateDialog } from '../components/ProposalDebateDialog';
import { SwipeDirection } from '../components/SwipeCard';
import { PROPOSALS } from '../data/proposals';
import { THEMES, THEMES_BY_ID } from '../data/themes';
import { CANDIDATES, CANDIDATES_BY_ID } from '../data/candidates';
import {
  computeResults,
  computeThemeAgreement,
  matchConfidenceLabel,
  pickTopMatch,
} from '../utils/scoring';
import { haptics } from '../utils/haptics';
import {
  countedAnswers,
  Milestone,
  MIN_COUNTED_FOR_PREVIEW,
  milestonesToShow,
  passedMilestones,
} from '../utils/milestones';
import { loadRevealCandidates, saveRevealCandidates } from '../utils/storage';
import { Answers, Proposal } from '../types';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

type Props = {
  proposals: Proposal[];
  currentIndex: number;
  answers: Answers;
  onAnswer: (proposalId: string, direction: SwipeDirection) => void;
  onUndo: () => void;
  onFinish: () => void;
  onSeeResult: () => void;
  onRestart: () => void;
  onExit: () => void;
  onOpenThemeFilter: () => void;
  // Thèmes retenus pour cette session. Sert uniquement à signaler dans la
  // barre du bas qu'on ne swipe pas tout le catalogue — le paquet, lui, est
  // déjà filtré en amont et arrive tout fait dans `proposals`.
  selectedThemeIds: string[];
  onOpenSettings: () => void;
  showTutorial: boolean;
  onDismissTutorial: () => void;
};

type SwipeTab = 'swipe' | 'ranking' | 'propositions' | 'candidats';

// Quatre onglets, plus l'action « Thèmes » que la barre affiche à part (voir
// BottomTabBar). Cette action a brièvement été déplacée dans l'en-tête pour
// libérer un slot ; c'était une erreur, elle y devenait une icône muette alors
// qu'elle commande ce qu'on swipe. L'en-tête n'a de toute façon pas la place
// d'un libellé : la piste de la barre de progression n'y fait qu'une centaine
// de pixels, et un troisième bouton la réduisait de moitié.
const SWIPE_TABS: BottomTabItem<SwipeTab>[] = [
  { key: 'swipe', label: 'Swiper', icon: 'layers-outline' },
  { key: 'ranking', label: 'Classement', icon: 'trophy-outline' },
  { key: 'propositions', label: 'Propositions', icon: 'grid-outline' },
  { key: 'candidats', label: 'Candidats', icon: 'people-outline' },
];

export function SwipeScreen({
  proposals,
  currentIndex,
  answers,
  onAnswer,
  onUndo,
  onFinish,
  onSeeResult,
  onRestart,
  onExit,
  onOpenThemeFilter,
  selectedThemeIds,
  onOpenSettings,
  showTutorial,
  onDismissTutorial,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const deckRef = useRef<SwipeDeckHandle>(null);
  const [tab, setTab] = useState<SwipeTab>('swipe');
  // Rattrapage silencieux : les paliers déjà franchis au montage sont marqués
  // comme vus sans rien afficher. Cet écran est démonté dès qu'on le quitte
  // (accueil, révision, relance de l'app) ; sans ce rattrapage, une reprise de
  // session à mi-parcours réannonçait un palier déjà vu.
  const shownMilestones = useRef<Set<number>>(
    new Set(passedMilestones(currentIndex, proposals.length))
  );
  const [milestoneNotice, setMilestoneNotice] = useState<Milestone | null>(null);
  const [milestoneVisible, setMilestoneVisible] = useState(false);
  const [confirmingThemeFilter, setConfirmingThemeFilter] = useState(false);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  // Fiche d'un candidat, ouverte en touchant sa photo.
  const [infoCandidateId, setInfoCandidateId] = useState<string | null>(null);
  // Débat autour d'une mesure, ouvert depuis la carte.
  const [debateProposal, setDebateProposal] = useState<Proposal | null>(null);
  // Une seule bascule "montrer qui propose quoi" pour tout l'écran : elle
  // gouverne la mosaïque ET le classement par thème. Auparavant le classement
  // par thème affichait les noms sans condition, ce qui désignait l'auteur
  // d'une carte précise (un candidat n'a souvent qu'une proposition par thème)
  // alors même que la mosaïque, juste à côté, les masquait par défaut.
  const [revealCandidates, setRevealCandidates] = useState(false);

  useEffect(() => {
    loadRevealCandidates().then(setRevealCandidates);
  }, []);

  const toggleReveal = () => {
    const next = !revealCandidates;
    setRevealCandidates(next);
    saveRevealCandidates(next);
    haptics.selection();
  };

  // Ce qui a été tiré pour cette partie, pour distinguer dans l'onglet
  // Propositions les cartes du paquet des autres.
  const deckIds = useMemo(() => new Set(proposals.map((p) => p.id)), [proposals]);

  const isDeckDone = currentIndex >= proposals.length;
  // Une fois le paquet terminé, plus rien à protéger : les noms s'affichent.
  const showCandidates = revealCandidates || isDeckDone;

  // On enchaîne vers la révision au MOMENT où la dernière carte est répondue,
  // mais pas si l'écran est rouvert alors que le paquet est déjà terminé :
  // sinon revenir ici renverrait aussitôt ailleurs, et l'écran de fin
  // ci-dessous serait inatteignable.
  const finishReported = useRef(isDeckDone);
  useEffect(() => {
    if (!isDeckDone) {
      finishReported.current = false;
      return;
    }
    if (finishReported.current) return;
    finishReported.current = true;
    onFinish();
    // onFinish est stable pour la durée de vie de l'écran ; seule l'atteinte
    // de la fin du paquet doit déclencher la transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeckDone]);

  const canUndo = currentIndex > 0;

  const results = useMemo(
    () => computeResults(answers, proposals, CANDIDATES),
    [answers, proposals]
  );
  const topMatch = useMemo(() => pickTopMatch(results), [results]);
  const confidenceLabel = useMemo(() => matchConfidenceLabel(results), [results]);
  const themeAgreement = useMemo(
    () => computeThemeAgreement(answers, proposals, CANDIDATES, THEMES),
    [answers, proposals]
  );
  const selectedCandidateAnswers = useMemo<AnswerGroups>(() => {
    const groups = emptyAnswerGroups();
    if (!selectedCandidateId) return groups;
    for (const p of proposals) {
      if (p.candidateId !== selectedCandidateId) continue;
      const a = answers[p.id];
      if (a) groups[a].push(p);
    }
    return groups;
  }, [selectedCandidateId, proposals, answers]);

  useEffect(() => {
    if (isDeckDone) return;

    const { reached, announce } = milestonesToShow(
      currentIndex,
      proposals.length,
      shownMilestones.current
    );
    // Un palier franchi n'est jamais reproposé, même si on renonce à
    // l'annoncer faute de réponses comptabilisées : il appartient au passé.
    reached.forEach((i) => shownMilestones.current.add(i));
    if (!announce) return;

    if (countedAnswers(proposals, currentIndex, answers) < MIN_COUNTED_FOR_PREVIEW || !topMatch) {
      return;
    }

    setMilestoneNotice(announce);
    setMilestoneVisible(true);
    // Ne réagir qu'à la progression du paquet ; `answers`/`topMatch` sont lus
    // au moment du calcul mais ne doivent pas déclencher une revérification
    // indépendamment de l'avancement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isDeckDone]);

  // Depuis un autre onglet (Classement, Propositions), le retour matériel
  // ramène d'abord au swipe plutôt que de quitter l'écran : consulter son
  // classement provisoire ne doit pas donner l'impression d'avoir perdu sa
  // progression. Enregistré ici pour passer avant le handler global d'App.tsx.
  useEffect(() => {
    if (tab === 'swipe') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setTab('swipe');
      return true;
    });
    return () => subscription.remove();
  }, [tab]);

  // Un thème sans proposition ne peut pas être sélectionné (l'écran de choix
  // ne l'affiche pas), donc le total de référence est le nombre de thèmes
  // réellement proposables, pas THEMES.length.
  const themeFilter = useMemo(() => {
    const total = THEMES.filter((t) => PROPOSALS.some((p) => p.themeId === t.id)).length;
    const selected = selectedThemeIds.length;
    return { selected, total, filtered: selected > 0 && selected < total };
  }, [selectedThemeIds]);

  // Boutons éteints le temps que la carte sorte de l'écran.
  //
  // La double validation est déjà rendue impossible dans SwipeCard, qui ne
  // laisse une carte répondre qu'une fois. Cet état-ci ne sert donc pas à la
  // correction mais à la lisibilité : sans lui, un second appui pendant les
  // 190 ms de sortie ne produit rien du tout, et l'absence de réaction se lit
  // comme un appui manqué.
  //
  // Il ne peut pas rester bloqué : on ne l'arme que si une animation a
  // réellement démarré (`swipeTop` le dit), et il retombe dès que l'index
  // avance — ce que la validation de la carte provoque toujours.
  const [swiping, setSwiping] = useState(false);
  useEffect(() => {
    setSwiping(false);
  }, [currentIndex]);

  const triggerSwipe = (direction: SwipeDirection) => {
    if (swiping) return;
    if (deckRef.current?.swipeTop(direction)) setSwiping(true);
  };

  const handleOpenThemeFilter = () => {
    if (currentIndex > 0) {
      setConfirmingThemeFilter(true);
    } else {
      onOpenThemeFilter();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {/* UNE MAISON, PAS UN CHEVRON.
            Ce bouton n'a jamais fait « page précédente » : il quitte la
            session pour l'accueil. Un chevron promet un pas en arrière dans un
            fil de navigation, alors qu'ici on sort d'un parcours de 165
            cartes — l'icône annonçait une chose et en faisait une autre.
            L'action, elle, n'a pas changé : la session étant enregistrée à
            chaque réponse, revenir à l'accueil ne perd rien et « Reprendre »
            attend sur place.
            Sans ce bouton, iOS n'offrirait aucune sortie, le retour n'étant
            câblé que sur la touche matérielle d'Android. */}
        <Pressable
          onPress={onExit}
          hitSlop={8}
          style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Revenir à l’accueil, ta progression est gardée"
        >
          <Ionicons name="home-outline" size={20} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.progressWrap}>
          <ProgressBar current={currentIndex} total={proposals.length} />
        </View>
        {/* Les thèmes ne sont PAS ici. L'en-tête n'a pas la place d'un
            libellé : la piste de la barre de progression n'y fait déjà qu'une
            centaine de pixels, et un troisième bouton la réduisait de moitié.
            L'accès aux thèmes est dans la barre du bas, où il peut porter son
            nom et son état. */}
        <Pressable
          onPress={onOpenSettings}
          hitSlop={8}
          style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Réglages"
        >
          <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {tab === 'swipe' &&
        (isDeckDone ? (
          <View style={styles.doneArea}>
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark" size={34} color={colors.onAccent} />
            </View>
            <Text style={styles.doneTitle}>Tu as répondu à toutes les propositions</Text>
            <Text style={styles.doneText}>
              Il n’y a plus de carte à swiper. Ton classement complet t’attend, et tu peux
              toujours parcourir les propositions par thème.
            </Text>

            <Pressable
              onPress={onSeeResult}
              style={({ pressed }) => [styles.donePrimary, pressed && styles.donePrimaryPressed]}
              accessibilityRole="button"
              accessibilityLabel="Voir mon résultat"
            >
              <Text style={styles.donePrimaryText}>Voir mon résultat</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
            </Pressable>

            <Pressable
              onPress={() => setConfirmingRestart(true)}
              style={({ pressed }) => [styles.doneSecondary, pressed && styles.doneSecondaryPressed]}
              accessibilityRole="button"
              accessibilityLabel="Recommencer à zéro"
            >
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
              <Text style={styles.doneSecondaryText}>Recommencer</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.deckArea}>
              <SwipeDeck
                ref={deckRef}
                proposals={proposals}
                currentIndex={currentIndex}
                themesById={THEMES_BY_ID}
                onSwipe={onAnswer}
                onOpenDebate={setDebateProposal}
              />
            </View>

            <View style={styles.actionsArea}>
              <ActionButtons
                canUndo={canUndo}
                disabled={swiping}
                onUndo={onUndo}
                onNope={() => triggerSwipe('nope')}
                onSkip={() => triggerSwipe('skip')}
                onLike={() => triggerSwipe('like')}
                onSuperlike={() => triggerSwipe('superlike')}
              />
            </View>
          </>
        ))}

      {tab === 'propositions' && (
        <ThemeMosaic
          // Tout le catalogue embarqué, et non le seul paquet tiré : cet
          // onglet sert à parcourir ce que l'app contient, pas à refléter
          // la partie en cours.
          proposals={PROPOSALS}
          deckIds={deckIds}
          answers={answers}
          revealCandidates={showCandidates}
          onToggleReveal={toggleReveal}
        />
      )}

      {tab === 'candidats' && <CandidateGrid onSelect={setInfoCandidateId} />}

      {tab === 'ranking' && (
        <RankingPanel
          results={results}
          topMatch={topMatch}
          confidenceLabel={confidenceLabel}
          themeAgreement={themeAgreement}
          showCandidates={showCandidates}
          onSelectCandidate={setSelectedCandidateId}
          onOpenCandidateInfo={setInfoCandidateId}
        />
      )}

      {showTutorial && currentIndex === 0 && tab === 'swipe' && !isDeckDone && (
        <SwipeTutorialOverlay onDismiss={onDismissTutorial} />
      )}

      <BottomTabBar
        tabs={SWIPE_TABS}
        active={tab}
        onChange={setTab}
        extra={{
          // Le compte ne s'affiche que s'il y a quelque chose à signaler :
          // « 15 thèmes » en permanence banaliserait le repère, alors que
          // c'est en swipant une sélection restreinte qu'on a besoin de s'en
          // souvenir sans quitter l'écran.
          label: themeFilter.filtered ? `${themeFilter.selected} thèmes` : 'Thèmes',
          icon: 'pricetags-outline',
          onPress: handleOpenThemeFilter,
          accessibilityLabel: themeFilter.filtered
            ? `Thèmes : ${themeFilter.selected} sur ${themeFilter.total} sélectionnés. En changer redémarrera la session.`
            : 'Choisir les thèmes à swiper. En changer redémarrera la session.',
        }}
      />

      <ConfirmDialog
        visible={milestoneVisible}
        title={milestoneNotice?.title ?? ''}
        message={milestoneNotice?.message ?? ''}
        confirmLabel="Voir le classement"
        cancelLabel="Continuer à swiper"
        onConfirm={() => {
          setMilestoneVisible(false);
          setTab('ranking');
        }}
        onCancel={() => setMilestoneVisible(false)}
      />

      <ConfirmDialog
        visible={confirmingRestart}
        title="Recommencer ?"
        message="Ta session actuelle (réponses et résultat) sera effacée définitivement."
        confirmLabel="Recommencer"
        destructive
        onConfirm={() => {
          setConfirmingRestart(false);
          onRestart();
        }}
        onCancel={() => setConfirmingRestart(false)}
      />

      <ConfirmDialog
        visible={confirmingThemeFilter}
        title="Changer de thèmes ?"
        message="Choisir d’autres thèmes redémarrera ta session actuelle : tes réponses en cours seront perdues."
        confirmLabel="Changer"
        destructive
        onConfirm={() => {
          setConfirmingThemeFilter(false);
          onOpenThemeFilter();
        }}
        onCancel={() => setConfirmingThemeFilter(false)}
      />

      <CandidateAnswersDialog
        visible={selectedCandidateId !== null}
        candidate={selectedCandidateId ? CANDIDATES_BY_ID[selectedCandidateId] : null}
        groups={selectedCandidateAnswers}
        // Même verrou que la vue par thème. Le classement provisoire peut
        // montrer des noms et des pourcentages — c'est un agrégat, il ne dit
        // pas qui a écrit telle carte. Le détail, lui, cite le texte des
        // propositions sous un nom : tant qu'on swipe, il reste fermé.
        revealProposals={showCandidates}
        onClose={() => setSelectedCandidateId(null)}
        // On referme le détail avant d'ouvrir la fiche : deux modales
        // empilées ne s'affichent pas de façon fiable sur iOS.
        onOpenInfo={() => {
          const id = selectedCandidateId;
          setSelectedCandidateId(null);
          setInfoCandidateId(id);
        }}
      />

      <ProposalDebateDialog
        visible={debateProposal !== null}
        proposal={debateProposal}
        theme={debateProposal ? THEMES_BY_ID[debateProposal.themeId] ?? null : null}
        onClose={() => setDebateProposal(null)}
      />

      <CandidateInfoDialog
        visible={infoCandidateId !== null}
        candidate={infoCandidateId ? CANDIDATES_BY_ID[infoCandidateId] : null}
        proposals={proposals}
        answers={answers}
        // La notice biographique n'a rien à cacher ; la liste des sujets sur
        // lesquels ce candidat se prononce, si — croisée avec la mosaïque des
        // thèmes, elle réduit le champ des cartes qu'on est en train de voir.
        revealThemes={showCandidates}
        onClose={() => setInfoCandidateId(null)}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    progressWrap: {
      flex: 1,
    },

    headerButton: {
      width: 32,
      height: 32,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      marginHorizontal: spacing.md,
    },
    headerButtonPressed: {
      opacity: 0.7,
    },
    deckArea: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    actionsArea: {
      paddingBottom: spacing.lg,
      paddingTop: spacing.sm,
    },
    doneArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    doneBadge: {
      width: 72,
      height: 72,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      marginBottom: spacing.md,
    },
    doneTitle: {
      fontSize: fonts.title - 2,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    doneText: {
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.45,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
      marginBottom: spacing.lg,
    },
    donePrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      alignSelf: 'stretch',
      maxWidth: 320,
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing.md,
    },
    donePrimaryPressed: {
      backgroundColor: colors.accentStrong,
    },
    donePrimaryText: {
      fontSize: fonts.body,
      fontWeight: '700',
      color: colors.onAccent,
    },
    doneSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    doneSecondaryPressed: {
      opacity: 0.65,
    },
    doneSecondaryText: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.textSecondary,
    },
  });
}
