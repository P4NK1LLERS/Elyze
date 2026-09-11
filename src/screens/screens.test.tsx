import React from 'react';
import renderer, { ReactTestInstance, ReactTestRenderer } from 'react-test-renderer';
import { Text } from 'react-native';
import { IntroScreen } from './IntroScreen';
import { SwipeScreen } from './SwipeScreen';
import { ReviewScreen } from './ReviewScreen';
import { ResultsScreen } from './ResultsScreen';
import { ThemeSelectScreen } from './ThemeSelectScreen';
import { SettingsScreen } from './SettingsScreen';
import { HowItWorksScreen } from './HowItWorksScreen';
import { DuelScreen } from './DuelScreen';
import { CANDIDATES } from '../data/candidates';
import { computeResults } from '../utils/scoring';
import { encoderDuel } from '../utils/duel';
import { ThemeProvider } from '../theme/ThemeContext';
import { PROPOSALS } from '../data/proposals';
import { THEMES, THEMES_BY_ID } from '../data/themes';
import { buildDeck, QUOTA_PAR_CANDIDAT } from '../utils/deck';
import { Answers } from '../types';

// Tests de MONTAGE des sept écrans.
//
// Ils ne vérifient pas une mise en page — un moteur de rendu de test ne
// calcule aucune géométrie, donc ils ne diront jamais qu'un texte est coupé ou
// qu'un bouton sort de l'écran. Ce n'est pas leur rôle.
//
// Ce qu'ils attrapent est la catégorie de panne qui, jusqu'ici, ne se voyait
// qu'en branchant un téléphone : un écran qui ne se monte plus du tout, une
// entrée de navigation disparue, un bouton devenu inerte. La couverture des
// écrans était de 0 % et celle des composants de 2 % ; c'est ce trou-là qu'on
// bouche, pas la vérification visuelle, qui demande un vrai rendu.
//
// Les modules natifs sont neutralisés dans jest.setup.js.

// Un paquet réaliste : le vrai tirage, sur les vraies données.
const DECK = buildDeck(PROPOSALS, QUOTA_PAR_CANDIDAT);

// Des réponses sur les vingt premières cartes, réparties sur les quatre
// gestes, pour que les écrans de résultat aient de quoi calculer.
const ANSWERS: Answers = Object.fromEntries(
  DECK.slice(0, 20).map((p, i) => [p.id, (['like', 'nope', 'superlike', 'skip'] as const)[i % 4]])
);

// Les arbres montés sont démontés après chaque test. Sans cela, la liste
// virtualisée de l'écran de révision continuait de planifier du travail une
// fois le test terminé, et jest s'en plaignait à juste titre : ce qui tourne
// encore après la fin d'un test n'est plus observé par personne.
const montes: ReactTestRenderer[] = [];

afterEach(() => {
  renderer.act(() => {
    while (montes.length) montes.pop()!.unmount();
  });
});

function mount(element: React.ReactElement): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(<ThemeProvider>{element}</ThemeProvider>);
  });
  montes.push(tree);
  return tree;
}

// Les nombres comptent autant que les chaînes : « Reprendre (42/165) » est un
// `Text` dont les enfants alternent chaînes et nombres, et n'en garder que les
// chaînes donnait « Reprendre ( / ) ».
function texts(tree: ReactTestRenderer): string[] {
  const out: string[] = [];
  const visiter = (child: unknown) => {
    if (typeof child === 'string' || typeof child === 'number') out.push(String(child));
    else if (Array.isArray(child)) child.forEach(visiter);
  };
  for (const node of tree.root.findAllByType(Text)) visiter(node.props.children);
  return out;
}

function touchables(tree: ReactTestRenderer): ReactTestInstance[] {
  return tree.root.findAll(
    (node: ReactTestInstance) =>
      typeof node.type !== 'string' && typeof node.props?.onPress === 'function'
  );
}

// Un écran vide se « monte » sans erreur : on exige donc du contenu et de quoi
// en sortir, sans quoi le test passerait sur une page blanche.
function expectUsable(tree: ReactTestRenderer, minTouchables = 1) {
  expect(texts(tree).length).toBeGreaterThan(0);
  expect(touchables(tree).length).toBeGreaterThanOrEqual(minTouchables);
}

const noop = () => {};

describe('montage des écrans', () => {
  it("l'accueil propose de commencer et de choisir ses thèmes", () => {
    const tree = mount(
      <IntroScreen
        onStartFresh={noop}
        onCustomizeThemes={noop}
        restorable={null}
        onResume={noop}
        onOpenHowItWorks={noop}
        onOpenSettings={noop}
      />
    );
    expectUsable(tree, 3);
    expect(texts(tree)).toContain('Commencer');
    // Le choix des thèmes commande ce qu'on swipe : il doit rester atteignable
    // depuis l'accueil, là où il ne coûte encore aucune progression.
    expect(texts(tree)).toContain('Choisir mes thèmes');
  });

  it("l'accueil propose de reprendre une session en cours", () => {
    const tree = mount(
      <IntroScreen
        onStartFresh={noop}
        onCustomizeThemes={noop}
        restorable={{ currentIndex: 42, total: 165, isComplete: false }}
        onResume={noop}
        onOpenHowItWorks={noop}
        onOpenSettings={noop}
      />
    );
    expect(texts(tree).join(' ')).toContain('42');
  });

  it('le swipe expose ses trois onglets et le choix des thèmes', () => {
    const tree = mount(
      <SwipeScreen
        proposals={DECK}
        currentIndex={0}
        answers={{}}
        onAnswer={noop}
        onUndo={noop}
        onFinish={noop}
        onSeeResult={noop}
        onRestart={noop}
        onExit={noop}
        onOpenThemeFilter={noop}
        selectedThemeIds={THEMES.map((t) => t.id)}
        onOpenSettings={noop}
        showTutorial={false}
        onDismissTutorial={noop}
      />
    );
    const found = texts(tree);
    for (const label of ['Swiper', 'Classement', 'Propositions', 'Thèmes']) {
      expect(found).toContain(label);
    }
    // « Candidats » a quitté la barre pour devenir une vue du panneau
    // Classement : il ne doit plus y figurer comme onglet.
    expect(found).not.toContain('Candidats');
  });

  it('le swipe sort vers l’accueil par le bouton du haut', () => {
    let sorti = false;
    const tree = mount(
      <SwipeScreen
        proposals={DECK}
        currentIndex={12}
        answers={ANSWERS}
        onAnswer={noop}
        onUndo={noop}
        onFinish={noop}
        onSeeResult={noop}
        onRestart={noop}
        onExit={() => {
          sorti = true;
        }}
        onOpenThemeFilter={noop}
        selectedThemeIds={THEMES.map((t) => t.id)}
        onOpenSettings={noop}
        showTutorial={false}
        onDismissTutorial={noop}
      />
    );
    // Ce bouton quitte la session ; son libellé doit le dire, parce que son
    // icône était un chevron qui promettait un simple pas en arrière.
    const sortie = touchables(tree).find(
      (n: ReactTestInstance) =>
        n.props.accessibilityLabel === 'Revenir à l’accueil, ta progression est gardée'
    );
    expect(sortie).toBeDefined();
    renderer.act(() => sortie!.props.onPress());
    expect(sorti).toBe(true);
  });

  it('le swipe signale une sélection de thèmes restreinte', () => {
    const tree = mount(
      <SwipeScreen
        proposals={DECK}
        currentIndex={0}
        answers={{}}
        onAnswer={noop}
        onUndo={noop}
        onFinish={noop}
        onSeeResult={noop}
        onRestart={noop}
        onExit={noop}
        onOpenThemeFilter={noop}
        selectedThemeIds={['sante', 'education', 'logement']}
        onOpenSettings={noop}
        showTutorial={false}
        onDismissTutorial={noop}
      />
    );
    expect(texts(tree)).toContain('3 thèmes');
  });

  it('le swipe affiche son écran de fin quand le paquet est terminé', () => {
    const tree = mount(
      <SwipeScreen
        proposals={DECK}
        currentIndex={DECK.length}
        answers={ANSWERS}
        onAnswer={noop}
        onUndo={noop}
        onFinish={noop}
        onSeeResult={noop}
        onRestart={noop}
        onExit={noop}
        onOpenThemeFilter={noop}
        selectedThemeIds={THEMES.map((t) => t.id)}
        onOpenSettings={noop}
        showTutorial={false}
        onDismissTutorial={noop}
      />
    );
    expect(texts(tree)).toContain('Voir mon résultat');
  });

  it('la révision se monte avec les réponses données', () => {
    const tree = mount(
      <ReviewScreen
        proposals={DECK}
        themesById={THEMES_BY_ID}
        answers={ANSWERS}
        onChangeAnswer={noop}
        onContinue={noop}
        onBack={noop}
      />
    );
    expectUsable(tree, 2);
  });

  it('la révision ouvre une proposition en entier', () => {
    const tree = mount(
      <ReviewScreen
        proposals={DECK}
        themesById={THEMES_BY_ID}
        answers={ANSWERS}
        onChangeAnswer={noop}
        onContinue={noop}
        onBack={noop}
      />
    );
    const premiere = DECK[0];
    // La liste tronque à trois lignes ; ce bouton est le seul moyen de lire
    // une mesure longue en entier avant de trancher.
    const ouvrir = touchables(tree).find(
      (n: ReactTestInstance) =>
        n.props.accessibilityLabel === `Lire en entier : ${premiere.text}`
    );
    expect(ouvrir).toBeDefined();

    // On vise un marqueur propre à la fiche, et non le texte de la mesure :
    // `numberOfLines` tronque à l'affichage seulement, si bien que le texte
    // entier est déjà dans l'arbre rendu de la ligne de liste.
    const MARQUEUR = 'CE QU’EN DISENT SES PARTISANS';
    expect(texts(tree)).not.toContain(MARQUEUR);
    renderer.act(() => ouvrir!.props.onPress());
    expect(texts(tree)).toContain(MARQUEUR);
    expect(texts(tree)).toContain(premiere.text);
  });

  it('le résultat se monte et nomme un candidat', () => {
    const tree = mount(
      <ResultsScreen
        proposals={DECK}
        answers={ANSWERS}
        onRestart={noop}
        onBack={noop}
        onGoHome={noop}
        onOpenHowItWorks={noop}
        onOpenSettings={noop}
        onOpenDuel={noop}
        alreadyRevealed
        onReveal={noop}
      />
    );
    expectUsable(tree, 2);
    // À la fin du paquet, le voile est levé : c'est le seul moment où l'app
    // relie une proposition à son auteur, et l'écran ne vaudrait rien sans.
    expect(texts(tree).join(' ')).toMatch(/[A-ZÉÈ][a-zéèêë]+ [A-ZÉÈ]/);
  });

  it('le résultat offre de sortir vers l’accueil à côté du partage', () => {
    const sorties: string[] = [];
    const tree = mount(
      <ResultsScreen
        proposals={DECK}
        answers={ANSWERS}
        onRestart={noop}
        onBack={() => sorties.push('review')}
        onGoHome={() => sorties.push('accueil')}
        onOpenHowItWorks={noop}
        onOpenSettings={noop}
        onOpenDuel={noop}
        alreadyRevealed
        onReveal={noop}
      />
    );
    expect(texts(tree)).toContain('Accueil');
    expect(texts(tree)).toContain('Partager');

    const accueil = touchables(tree).find(
      (n: ReactTestInstance) =>
        n.props.accessibilityLabel === 'Revenir à l’accueil, ton résultat est gardé'
    );
    expect(accueil).toBeDefined();
    renderer.act(() => accueil!.props.onPress());
    // Sortir n'est pas revenir en arrière : les deux gestes cohabitent sur cet
    // écran et ne doivent pas mener au même endroit.
    expect(sorties).toEqual(['accueil']);
  });

  it('le choix des thèmes se monte avec la sélection reçue', () => {
    const tree = mount(
      <ThemeSelectScreen initialSelection={['sante']} onConfirm={noop} onBack={noop} />
    );
    expectUsable(tree, 3);
    expect(texts(tree)).toContain('Santé');
  });

  it('les réglages se montent', () => {
    const tree = mount(<SettingsScreen onBack={noop} onResetAllData={noop} />);
    expectUsable(tree, 3);
  });

  it('« comment ça marche » se monte', () => {
    const tree = mount(<HowItWorksScreen onBack={noop} />);
    expectUsable(tree);
  });
});

describe('le voile sur les candidats', () => {
  // La règle centrale de l'app : pendant le swipe, aucun écran ne dit quel
  // candidat a proposé quelle mesure. Le classement provisoire peut montrer
  // des noms — c'est un agrégat — mais jamais accolés au texte d'une carte.
  it('aucun nom de candidat n’apparaît sur les cartes en cours de partie', () => {
    const tree = mount(
      <SwipeScreen
        proposals={DECK}
        currentIndex={0}
        answers={{}}
        onAnswer={noop}
        onUndo={noop}
        onFinish={noop}
        onSeeResult={noop}
        onRestart={noop}
        onExit={noop}
        onOpenThemeFilter={noop}
        selectedThemeIds={THEMES.map((t) => t.id)}
        onOpenSettings={noop}
        showTutorial={false}
        onDismissTutorial={noop}
      />
    );

    // Les trois premières cartes de la pile sont montées ; on vérifie qu'aucun
    // nom de famille ne se trouve dans le texte rendu de l'onglet Swiper.
    const rendu = texts(tree).join(' ');
    const auteurs = DECK.slice(0, 3).map((p) => p.candidateId);
    const noms: Record<string, string> = {
      cazeneuve: 'Cazeneuve',
      retailleau: 'Retailleau',
      villepin: 'Villepin',
      philippe: 'Philippe',
      ruffin: 'Ruffin',
      attal: 'Attal',
      melenchon: 'Mélenchon',
      lepen: 'Le Pen',
      tondelier: 'Tondelier',
      glucksmann: 'Glucksmann',
      bertrand: 'Bertrand',
    };
    for (const id of auteurs) {
      expect(rendu).not.toContain(noms[id]);
    }
  });
});

describe('duel', () => {
  // L'écran de duel rend un QR code entier, soit quelques centaines de vues
  // imbriquées produites par un encodeur écrit à la main. C'est exactement le
  // genre d'écran qui se monte en théorie et explose en pratique.
  it('le duel affiche un code à montrer', () => {
    const tree = mount(
      <DuelScreen proposals={DECK} answers={ANSWERS} deckDone={false} codeRecu={null} onBack={noop} />
    );
    const rendu = texts(tree).join(' ');
    expect(rendu).toContain('Ton code');
    expect(rendu).toContain('Le code de l’autre');
  });

  it('le duel compare deux classements quand un code arrive par lien', () => {
    // Le code de « l'autre » est fabriqué à partir de réponses différentes,
    // pour que la comparaison ait quelque chose à montrer.
    const autresReponses: Answers = Object.fromEntries(
      DECK.slice(0, 20).map((p, i) => [p.id, (['nope', 'like'] as const)[i % 2]])
    );
    const code = encoderDuel(computeResults(autresReponses, DECK, CANDIDATES));

    const tree = mount(
      <DuelScreen proposals={DECK} answers={ANSWERS} deckDone codeRecu={code} onBack={noop} />
    );
    const rendu = texts(tree).join(' ');
    expect(rendu).toContain('points d’écart en moyenne');
    // Le QR code de saisie a laissé la place à la comparaison.
    expect(rendu).not.toContain('Le code de l’autre');
  });
});
