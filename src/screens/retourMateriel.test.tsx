import React from 'react';
import renderer, { ReactTestInstance, ReactTestRenderer } from 'react-test-renderer';
import { BackHandler, Text } from 'react-native';
import { SwipeScreen } from './SwipeScreen';
import { ThemeProvider } from '../theme/ThemeContext';
import { PROPOSALS } from '../data/proposals';
import { THEMES } from '../data/themes';
import { buildDeck, QUOTA_PAR_CANDIDAT } from '../utils/deck';

// LE RETOUR MATÉRIEL D'ANDROID, QUI NE S'EXÉCUTE NULLE PART AILLEURS.
//
// Il n'apparaît sur aucune capture d'écran, le navigateur ne le déclenche pas,
// et le rendu de test ne l'appelle pas tout seul : c'est du code qui ne tourne
// que sur un téléphone Android, entre les mains de quelqu'un. Il s'est cassé
// une fois sans que rien ne le signale — depuis l'intérieur d'un thème de
// l'onglet Propositions, il reculait de DEUX pas d'un coup et atterrissait sur
// les cartes, alors que le chevron affiché juste à l'écran, lui, revenait
// correctement à la mosaïque.
//
// On attrape donc le gestionnaire à son inscription et on l'appelle
// directement, ce qui est exactement ce que fait le système.

const DECK = buildDeck(PROPOSALS, QUOTA_PAR_CANDIDAT);
const noop = () => {};

// Le dernier gestionnaire inscrit est celui qui a cours : React le réinscrit à
// chaque changement d'onglet ou de thème ouvert.
let dernierGestionnaire: (() => boolean) | null = null;

beforeEach(() => {
  dernierGestionnaire = null;
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((
    _type: string,
    handler: () => boolean
  ) => {
    dernierGestionnaire = handler;
    return { remove: () => {} };
  }) as typeof BackHandler.addEventListener);
});

afterEach(() => {
  jest.restoreAllMocks();
  renderer.act(() => {
    while (montes.length) montes.pop()!.unmount();
  });
});

const montes: ReactTestRenderer[] = [];

// `act` asynchrone, et pas seulement pour faire taire un avertissement :
// l'écran lit le stockage local au montage (`loadRevealCandidates`). Sans un
// tour de boucle des microtâches ici, cette résolution retombe au milieu du
// test, hors de tout `act`, et l'arbre observé n'est pas celui que React aura
// fini de rendre.
async function monter() {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <SwipeScreen
          proposals={DECK}
          currentIndex={30}
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
      </ThemeProvider>
    );
  });
  montes.push(tree);
  return tree;
}

function toucher(tree: ReactTestRenderer, label: string) {
  const cible = tree.root.find(
    (node: ReactTestInstance) =>
      typeof node.type !== 'string' &&
      typeof node.props?.onPress === 'function' &&
      node.props?.accessibilityLabel === label
  );
  renderer.act(() => {
    cible.props.onPress();
  });
}

function textes(tree: ReactTestRenderer): string[] {
  const out: string[] = [];
  const visiter = (child: unknown) => {
    if (typeof child === 'string' || typeof child === 'number') out.push(String(child));
    else if (Array.isArray(child)) child.forEach(visiter);
  };
  for (const node of tree.root.findAllByType(Text)) visiter(node.props.children);
  return out;
}

function reculer(): boolean {
  expect(dernierGestionnaire).not.toBeNull();
  let consomme = false;
  renderer.act(() => {
    consomme = dernierGestionnaire!();
  });
  return consomme;
}

describe('retour matériel depuis le swipe', () => {
  it('ne s’inscrit pas sur l’onglet des cartes, pour laisser sortir de l’écran', async () => {
    await monter();
    expect(dernierGestionnaire).toBeNull();
  });

  it('ramène aux cartes depuis un autre onglet', async () => {
    const tree = await monter();
    toucher(tree, 'Classement');
    expect(reculer()).toBe(true);
    // Les boutons de réponse ne sont présents que sur l'onglet des cartes.
    expect(textes(tree)).toContain('J’ADHÈRE');
  });

  it('referme d’abord le thème ouvert, et seulement ensuite l’onglet', async () => {
    const tree = await monter();
    toucher(tree, 'Propositions');

    const theme = THEMES.find((t) => PROPOSALS.some((p) => p.themeId === t.id))!;
    const compte = PROPOSALS.filter((p) => p.themeId === theme.id).length;
    toucher(tree, `${theme.label}, ${compte} propositions`);
    // On est bien entré : l'entête de la liste porte le retour vers la mosaïque.
    expect(textes(tree)).toContain(theme.label);

    // PREMIER retour : on revient à la mosaïque, pas aux cartes.
    expect(reculer()).toBe(true);
    expect(textes(tree)).not.toContain('J’ADHÈRE');
    expect(textes(tree).some((t) => t.includes('propositions au total'))).toBe(true);

    // SECOND retour : cette fois on quitte l'onglet.
    expect(reculer()).toBe(true);
    expect(textes(tree)).toContain('J’ADHÈRE');
  });
});
