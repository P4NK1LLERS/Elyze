import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IntroScreen, RestorableSummary } from './src/screens/IntroScreen';
import { ThemeSelectScreen } from './src/screens/ThemeSelectScreen';
import { SwipeScreen } from './src/screens/SwipeScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { DuelScreen } from './src/screens/DuelScreen';
import { HowItWorksScreen } from './src/screens/HowItWorksScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { IntroAnimation } from './src/components/IntroAnimation';
import { ScreenTransition } from './src/components/ScreenTransition';
import { SwipeDirection } from './src/components/SwipeCard';
import { Answers, Proposal } from './src/types';
import { PROPOSALS, PROPOSALS_BY_ID } from './src/data/proposals';
import { CANDIDATES } from './src/data/candidates';
import { THEMES, THEMES_BY_ID } from './src/data/themes';
import { buildDeck, QUOTA_PAR_CANDIDAT } from './src/utils/deck';
import { computeResults, pickTopMatch, topMatches } from './src/utils/scoring';
import { codeDepuisUrl } from './src/utils/duel';
import {
  clearSession,
  hasSeenTutorial,
  loadSession,
  markTutorialSeen,
  resetAllData,
  saveSession,
  StoredSession,
} from './src/utils/storage';
import { ThemeProvider, useColors, useThemeSettings } from './src/theme/ThemeContext';
import { DEFAULT_ACCENT_ID } from './src/theme';

type Screen =
  // Écran d'attente du tout premier rendu, le temps de savoir s'il y a une
  // session à reprendre. Il ne peint que le fond : sans lui, l'accueil
  // apparaîtrait un instant avant d'être remplacé par le paquet en cours.
  | 'booting'
  | 'intro'
  | 'themes'
  | 'swipe'
  | 'review'
  | 'results'
  | 'howItWorks'
  | 'settings'
  | 'duel';

const ALL_THEME_IDS = THEMES.map((t) => t.id);

// L'écran natif ne se retire plus tout seul : sinon il disparaîtrait avant
// que l'animation du logo ne soit à l'écran, et on verrait un éclair blanc
// entre les deux. On le garde jusqu'au premier rendu (voir plus bas).
SplashScreen.preventAutoHideAsync().catch(() => {});

function resolveProposals(ids: string[]): Proposal[] {
  return ids.map((id) => PROPOSALS_BY_ID[id]).filter((p): p is Proposal => Boolean(p));
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const colors = useColors();
  const {
    effectiveScheme,
    setSchemePreference,
    setAccentId,
    setHapticsEnabled,
    setRainbowUnlocked,
  } = useThemeSettings();

  const [screen, setScreen] = useState<Screen>('booting');
  // L'animation du logo se joue PAR-DESSUS l'app, qui se monte derrière : la
  // session est relue et l'écran de destination préparé pendant ces trois
  // secondes et demie, au lieu de les attendre.
  const [introDone, setIntroDone] = useState(false);
  const [howItWorksReturnTo, setHowItWorksReturnTo] = useState<Screen>('intro');
  const [settingsReturnTo, setSettingsReturnTo] = useState<Screen>('intro');
  const [themesReturnTo, setThemesReturnTo] = useState<Screen>('intro');
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>(ALL_THEME_IDS);
  const [sessionProposals, setSessionProposals] = useState<Proposal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  // Résumé de la session enregistrée au lancement de l'app. Dès qu'une session
  // est en cours en mémoire, c'est elle qui fait foi (voir `restorable`).
  const [storedRestorable, setStoredRestorable] = useState<RestorableSummary | null>(null);
  const [pendingRestore, setPendingRestore] = useState<StoredSession | null>(null);

  // Code de duel reçu par lien profond (elyze://d?c=…), le cas échéant.
  const [duelCode, setDuelCode] = useState<string | null>(null);

  const [showTutorial, setShowTutorial] = useState(false);
  // Le "moment de révélation" (haptique + animations) de l'écran de résultat
  // ne doit jouer qu'une fois par résultat, pas à chaque retour sur l'écran
  // (ex. après avoir ouvert l'explorateur ou "Comment ça marche").
  const [resultsRevealed, setResultsRevealed] = useState(false);

  // Où revenir en quittant le duel. Calculé plutôt que mémorisé : on y entre
  // aussi bien depuis l'écran de résultat que par un lien profond ouvert
  // l'app fermée, cas où aucun « écran précédent » n'a jamais existé.
  const quitterDuel = useCallback(() => {
    setDuelCode(null);
    if (sessionProposals.length === 0) {
      setScreen('intro');
      return;
    }
    setScreen(currentIndex >= sessionProposals.length ? 'results' : 'swipe');
  }, [sessionProposals.length, currentIndex]);

  useEffect(() => {
    const handler = () => {
      if (screen === 'duel') {
        quitterDuel();
        return true;
      }
      if (screen === 'settings') {
        setScreen(settingsReturnTo);
        return true;
      }
      if (screen === 'howItWorks') {
        setScreen(howItWorksReturnTo);
        return true;
      }
      if (screen === 'themes') {
        setScreen(themesReturnTo);
        return true;
      }
      if (screen === 'results') {
        // Symétrique au bouton retour visible sur cet écran : on revient à la
        // révision des réponses, pas à l'accueil (rien n'est perdu).
        setScreen('review');
        return true;
      }
      if (screen === 'review') {
        // Symétrique au bouton retour visible de cet écran.
        setScreen('swipe');
        return true;
      }
      if (screen === 'swipe') {
        // Pas de perte de données : la session est déjà persistée à chaque
        // réponse, donc revenir à l'accueil laisse la carte "Reprendre"
        // disponible plutôt que de fermer l'app.
        setScreen('intro');
        return true;
      }
      // Écran racine (accueil) : on laisse le comportement par défaut du
      // système (quitter l'app), comme c'est la convention Android.
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => subscription.remove();
  }, [screen, howItWorksReturnTo, settingsReturnTo, themesReturnTo, quitterDuel]);

  // Au lancement, on ne passe PAS par l'accueil quand une partie est en cours.
  //
  // L'accueil est un point de départ, pas un point de reprise : y revenir à
  // chaque ouverture obligeait à retrouver la carte « Reprendre » avant de
  // pouvoir enchaîner une carte, alors que quitter l'app en plein paquet est
  // le cas normal — on swipe quelques minutes, on ferme, on y revient. On
  // reprend donc là où la session s'est arrêtée, et l'accueil reste à un
  // toucher (icône maison en haut à gauche).
  // Un lien de duel l'emporte sur la reprise de session.
  //
  // Les deux se résolvent de façon asynchrone au démarrage et appellent tous
  // deux `setScreen` : sans arbitre, c'est le plus lent qui gagne, et scanner
  // le QR code d'un ami ouvrait l'app sur les cartes une fois sur deux. Cette
  // marque est posée AVANT le `setScreen` du lien, donc de façon synchrone, et
  // la reprise de session la consulte avant de décider quoi que ce soit.
  const lienTraite = useRef(false);

  useEffect(() => {
    const traiter = (url: string | null) => {
      if (!url) return;
      const code = codeDepuisUrl(url);
      if (!code) return;
      lienTraite.current = true;
      setDuelCode(code);
      setScreen('duel');
    };

    // Lien qui a lancé l'app (elle était fermée)…
    Linking.getInitialURL()
      .then(traiter)
      .catch(() => {});
    // …et lien reçu alors qu'elle tournait déjà.
    const abonnement = Linking.addEventListener('url', (evenement) => traiter(evenement.url));
    return () => abonnement.remove();
  }, []);

  useEffect(() => {
    loadSession().then((session) => {
      if (lienTraite.current) return;
      if (!session) {
        setScreen('intro');
        return;
      }
      const proposals = resolveProposals(session.proposalIds);
      if (proposals.length === 0) {
        setScreen('intro');
        return;
      }

      const isComplete = session.currentIndex >= proposals.length;
      let topCandidateName: string | undefined;
      let topPct: number | undefined;
      let topCount: number | undefined;
      if (isComplete) {
        const classement = computeResults(session.answers, proposals, CANDIDATES);
        const top = pickTopMatch(classement);
        topCandidateName = top?.candidate.name;
        topPct = top?.pct;
        topCount = topMatches(classement).length;
      }

      setPendingRestore(session);
      setStoredRestorable({
        currentIndex: session.currentIndex,
        total: proposals.length,
        isComplete,
        topCandidateName,
        topPct,
        topCount,
      });

      // Même remise en état que « Reprendre », jouée d'office.
      setSelectedThemeIds(session.selectedThemeIds);
      setSessionProposals(proposals);
      setCurrentIndex(session.currentIndex);
      setAnswers(session.answers);
      // Un paquet déjà terminé rouvre sur son résultat, et sans rejouer la
      // révélation : ce moment appartient à la fois où le paquet s'est
      // terminé, pas à chaque ouverture de l'app.
      setResultsRevealed(isComplete);
      // Une dernière fois : la lecture de la session a pu prendre plus
      // longtemps que celle du lien.
      if (!lienTraite.current) setScreen(isComplete ? 'results' : 'swipe');
    });

    hasSeenTutorial().then((seen) => setShowTutorial(!seen));
  }, []);

  // Retrait de l'écran natif dès que React a peint quelque chose. Le violet
  // de l'animation est celui de l'écran natif, à un point près sur un canal :
  // la bascule est invisible.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Une session démarrée pendant cette exécution de l'app reste "reprenable"
  // tant qu'elle n'a pas été explicitement effacée. Sans ce calcul, revenir à
  // l'accueil (bouton retour Android depuis le swipe, ou après un détour par
  // l'onglet Classement) faisait disparaître le bouton "Reprendre" : la
  // progression semblait perdue, et "Commencer" l'écrasait pour de bon.
  const liveRestorable = useMemo<RestorableSummary | null>(() => {
    if (sessionProposals.length === 0) return null;
    const isComplete = currentIndex >= sessionProposals.length;
    if (!isComplete) {
      return { currentIndex, total: sessionProposals.length, isComplete: false };
    }
    const classement = computeResults(answers, sessionProposals, CANDIDATES);
    const top = pickTopMatch(classement);
    return {
      currentIndex,
      total: sessionProposals.length,
      isComplete: true,
      topCandidateName: top?.candidate.name,
      topPct: top?.pct,
      topCount: topMatches(classement).length,
    };
  }, [sessionProposals, currentIndex, answers]);

  const restorable = liveRestorable ?? storedRestorable;

  const persist = (
    currentIndexToSave: number,
    answersToSave: Answers,
    proposalsToSave: Proposal[],
    themeIds: string[]
  ) => {
    saveSession({
      selectedThemeIds: themeIds,
      proposalIds: proposalsToSave.map((p) => p.id),
      currentIndex: currentIndexToSave,
      answers: answersToSave,
    });
  };

  // Le swipe sur l'ensemble des propositions est le cœur de l'app : "Commencer"
  // y va directement, sans passer par la sélection des thèmes. Choisir des
  // thèmes en particulier reste possible, mais comme une option secondaire
  // (voir `handleCustomizeThemes`), pas comme une étape imposée.
  const startSession = (themeIds: string[]) => {
    // Le paquet est TIRÉ du vivier embarqué, il ne l'est pas tout entier :
    // l'app connaît environ deux fois plus de propositions qu'une partie n'en
    // montre, pour qu'un deuxième passage apporte des cartes neuves. Le
    // tirage garantit le même nombre par candidat, sans quoi le score serait
    // faussé (voir utils/deck.ts).
    const filtered = PROPOSALS.filter((p) => themeIds.includes(p.themeId));
    const order = buildDeck(filtered, QUOTA_PAR_CANDIDAT);
    setSelectedThemeIds(themeIds);
    setSessionProposals(order);
    setCurrentIndex(0);
    setAnswers({});
    setStoredRestorable(null);
    setPendingRestore(null);
    setResultsRevealed(false);
    setScreen('swipe');
    persist(0, {}, order, themeIds);
  };

  const handleStartFresh = () => startSession(ALL_THEME_IDS);

  const handleCustomizeThemes = () => {
    setThemesReturnTo(screen);
    setScreen('themes');
  };

  const handleThemesConfirmed = (themeIds: string[]) => {
    startSession(themeIds);
  };

  const handleResume = () => {
    // Session déjà chargée en mémoire (on est simplement repassé par
    // l'accueil) : il n'y a rien à recharger, juste à revenir au bon écran.
    if (sessionProposals.length > 0) {
      setScreen(currentIndex >= sessionProposals.length ? 'results' : 'swipe');
      return;
    }
    if (!pendingRestore) return;
    const proposals = resolveProposals(pendingRestore.proposalIds);
    setSelectedThemeIds(pendingRestore.selectedThemeIds);
    setSessionProposals(proposals);
    setCurrentIndex(pendingRestore.currentIndex);
    setAnswers(pendingRestore.answers);
    setScreen(pendingRestore.currentIndex >= proposals.length ? 'results' : 'swipe');
  };

  const handleAnswer = (proposalId: string, direction: SwipeDirection) => {
    const nextAnswers = { ...answers, [proposalId]: direction };
    const nextIndex = currentIndex + 1;
    setAnswers(nextAnswers);
    setCurrentIndex(nextIndex);
    persist(nextIndex, nextAnswers, sessionProposals, selectedThemeIds);
  };

  const handleUndo = () => {
    if (currentIndex === 0) return;
    const prevProposal = sessionProposals[currentIndex - 1];
    const nextAnswers = { ...answers };
    delete nextAnswers[prevProposal.id];
    const nextIndex = currentIndex - 1;
    setAnswers(nextAnswers);
    setCurrentIndex(nextIndex);
    persist(nextIndex, nextAnswers, sessionProposals, selectedThemeIds);
  };

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    markTutorialSeen();
  };

  const handleSwipeFinish = () => setScreen('review');

  const handleReviewChange = (proposalId: string, direction: SwipeDirection) => {
    const nextAnswers = { ...answers, [proposalId]: direction };
    setAnswers(nextAnswers);
    persist(currentIndex, nextAnswers, sessionProposals, selectedThemeIds);
  };

  const handleReviewContinue = () => setScreen('results');

  const handleRestart = () => {
    clearSession();
    setStoredRestorable(null);
    setPendingRestore(null);
    setSessionProposals([]);
    setCurrentIndex(0);
    setAnswers({});
    setResultsRevealed(false);
    setScreen('intro');
  };

  // Réinitialisation complète (bouton "Réinitialiser les données" des
  // réglages) : distincte de `handleRestart`, qui ne remet à zéro que la
  // session en cours — ici on efface aussi le thème, l'accent et les
  // vibrations, et on repart de l'état par défaut de l'app.
  const handleResetAllData = () => {
    resetAllData();
    setSchemePreference('system');
    setAccentId(DEFAULT_ACCENT_ID);
    setHapticsEnabled(true);
    // Reverrouiller éteint déjà le mode arc-en-ciel (voir ThemeContext).
    setRainbowUnlocked(false);
    setStoredRestorable(null);
    setPendingRestore(null);
    setSelectedThemeIds(ALL_THEME_IDS);
    setSessionProposals([]);
    setCurrentIndex(0);
    setAnswers({});
    setResultsRevealed(false);
    setScreen('intro');
  };

  const openHowItWorks = () => {
    setHowItWorksReturnTo(screen);
    setScreen('howItWorks');
  };

  const openSettings = () => {
    setSettingsReturnTo(screen);
    setScreen('settings');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />

        <ErrorBoundary>
          {screen === 'intro' && (
            <ScreenTransition>
              <IntroScreen
                onStartFresh={handleStartFresh}
                onCustomizeThemes={handleCustomizeThemes}
                restorable={restorable}
                onResume={handleResume}
                onOpenHowItWorks={openHowItWorks}
                onOpenSettings={openSettings}
              />
            </ScreenTransition>
          )}

          {screen === 'settings' && (
            <ScreenTransition>
              <SettingsScreen
                onBack={() => setScreen(settingsReturnTo)}
                onResetAllData={handleResetAllData}
              />
            </ScreenTransition>
          )}

          {screen === 'howItWorks' && (
            <ScreenTransition>
              <HowItWorksScreen onBack={() => setScreen(howItWorksReturnTo)} />
            </ScreenTransition>
          )}

          {screen === 'themes' && (
            <ScreenTransition>
              <ThemeSelectScreen
                initialSelection={selectedThemeIds}
                onConfirm={handleThemesConfirmed}
                onBack={() => setScreen(themesReturnTo)}
              />
            </ScreenTransition>
          )}

          {screen === 'swipe' && (
            <ScreenTransition>
              <SwipeScreen
                proposals={sessionProposals}
                currentIndex={currentIndex}
                answers={answers}
                onAnswer={handleAnswer}
                onUndo={handleUndo}
                onFinish={handleSwipeFinish}
                onSeeResult={() => setScreen('results')}
                onRestart={handleRestart}
                onExit={() => setScreen('intro')}
                onOpenThemeFilter={handleCustomizeThemes}
                selectedThemeIds={selectedThemeIds}
                onOpenSettings={openSettings}
                showTutorial={showTutorial}
                onDismissTutorial={handleDismissTutorial}
              />
            </ScreenTransition>
          )}

          {screen === 'review' && (
            <ScreenTransition>
              <ReviewScreen
                proposals={sessionProposals}
                themesById={THEMES_BY_ID}
                answers={answers}
                onChangeAnswer={handleReviewChange}
                onContinue={handleReviewContinue}
                // Retour vers le paquet : une fois terminé, l'onglet Swiper
                // affiche l'écran de fin (message + Recommencer) plutôt que
                // des cartes, et donne accès aux onglets Classement et
                // Propositions.
                onBack={() => setScreen('swipe')}
              />
            </ScreenTransition>
          )}

          {screen === 'results' && (
            <ScreenTransition>
              <ResultsScreen
                proposals={sessionProposals}
                answers={answers}
                onRestart={handleRestart}
                onBack={() => setScreen('review')}
                // Rien n'est effacé : la session complète reste enregistrée,
                // et l'accueil rouvre ce résultat par sa carte dédiée.
                onGoHome={() => setScreen('intro')}
                onOpenHowItWorks={openHowItWorks}
                onOpenSettings={openSettings}
                onOpenDuel={() => setScreen('duel')}
                alreadyRevealed={resultsRevealed}
                onReveal={() => setResultsRevealed(true)}
              />
            </ScreenTransition>
          )}

          {screen === 'duel' && (
            <ScreenTransition>
              <DuelScreen
                proposals={sessionProposals}
                answers={answers}
                deckDone={
                  sessionProposals.length > 0 && currentIndex >= sessionProposals.length
                }
                codeRecu={duelCode}
                onBack={quitterDuel}
              />
            </ScreenTransition>
          )}
        </ErrorBoundary>

        {/* En dernier, donc au-dessus de tout le reste. */}
        {!introDone && <IntroAnimation onDone={() => setIntroDone(true)} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
