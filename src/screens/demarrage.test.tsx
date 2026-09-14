import React from 'react';
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { EmitterSubscription, Linking, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import App from '../../App';
import { PROPOSALS } from '../data/proposals';
import { CATALOG_FINGERPRINT } from '../utils/catalog';
import { buildDeck, QUOTA_PAR_CANDIDAT } from '../utils/deck';
import { THEMES } from '../data/themes';
import { encoderDefi, paquetDuDefi } from '../utils/duel';
import { Answers } from '../types';

// LE DÉMARRAGE, qui n'est observable ni à l'écran ni dans un test d'écran.
//
// Trois choses s'y disputent la main en même temps : la lecture de la session
// enregistrée, un éventuel lien de duel reçu, et le retrait de l'écran natif.
// Chacune est asynchrone, aucune n'a d'ordre garanti, et toutes trois écrivent
// sur le même état. C'est exactement le genre d'enchevêtrement qui marche
// quatre fois sur cinq et laisse la cinquième sans explication.
//
// Deux défauts réels sont couverts ici : l'app qui repart sur les cartes
// plutôt que sur le duel quand la session répond en dernier, et la session qui
// n'était pas remise en place du tout quand c'est le lien qui gagnait.

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));

// Seul `GestureHandlerRootView` est remplacé, et seulement ici : il installe au
// rendu un module natif absent sous jest. Le reste de la bibliothèque est celui
// que l'app utilise vraiment, comme dans les autres tests d'écran.
jest.mock('react-native-gesture-handler', () => {
  const { View } = jest.requireActual('react-native');
  return { ...jest.requireActual('react-native-gesture-handler'), GestureHandlerRootView: View };
});

const DECK = buildDeck(PROPOSALS, QUOTA_PAR_CANDIDAT);
const REPONSES: Answers = Object.fromEntries(
  DECK.map((p, i) => [p.id, (['like', 'nope', 'superlike', 'like'] as const)[i % 4]])
);

const SESSION_FINIE = JSON.stringify({
  selectedThemeIds: [...new Set(DECK.map((p) => p.themeId))],
  proposalIds: DECK.map((p) => p.id),
  currentIndex: DECK.length,
  answers: REPONSES,
  catalog: CATALOG_FINGERPRINT,
  graine: 5,
});

// Le défi d'un adversaire quelconque, sur un paquet reproductible.
const GRAINE_DEFI = 99;
const PAQUET_DEFI = paquetDuDefi(GRAINE_DEFI, THEMES.map((t) => t.id));
const CODE_AUTRE = encoderDefi(
  GRAINE_DEFI,
  THEMES.map((t) => t.id),
  Object.fromEntries(PAQUET_DEFI.map((p, i) => [p.id, i % 2 ? 'like' : 'nope'])) as Answers
);

const montes: ReactTestRenderer[] = [];

afterEach(() => {
  renderer.act(() => {
    while (montes.length) montes.pop()!.unmount();
  });
  jest.clearAllMocks();
});

// LES DEUX RETARDS SONT LE CŒUR DU TEST.
//
// La session et le lien se résolvent tous deux de façon asynchrone, et le code
// se comporte différemment selon celui qui arrive en premier. Une version
// précédente de ce fichier ne réglait que le retard du lien, en laissant le
// stockage répondre immédiatement : la session gagnait donc TOUJOURS, la
// branche « le lien est arrivé avant » n'était jamais parcourue, et le test
// passait tout aussi bien sur le code fautif. Vérifié en réintroduisant le
// défaut : sept succès sur sept.
//
// Il faut donc pouvoir ralentir le stockage autant que le lien.
function preparer({ session, lien, retardSession = 0, retardLien = 0 }: {
  session: string | null;
  lien: string | null;
  retardSession?: number;
  retardLien?: number;
}) {
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    (cle: string) =>
      new Promise((r) =>
        setTimeout(() => r(cle === 'elyze:session:v2' ? session : null), retardSession)
      )
  );
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockImplementation(
      () => new Promise((r) => setTimeout(() => r(lien), retardLien)) as Promise<string | null>
    );
  // Aucun lien ne survient en cours d'exécution dans ces tests : l'abonnement
  // n'a qu'à être résiliable. Seul le RETOUR est forcé, pas la signature.
  jest
    .spyOn(Linking, 'addEventListener')
    .mockImplementation(() => ({ remove: () => {} }) as unknown as EmitterSubscription);
}

async function demarrer() {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<App />);
  });
  // Les promesses du démarrage (stockage, lien) se résolvent sur plusieurs
  // tours : on les laisse toutes aboutir avant d'observer.
  await renderer.act(async () => {
    await new Promise((r) => setTimeout(r, 120));
  });
  montes.push(tree);
  return tree;
}

function textes(tree: ReactTestRenderer): string {
  const out: string[] = [];
  const visiter = (child: unknown) => {
    if (typeof child === 'string' || typeof child === 'number') out.push(String(child));
    else if (Array.isArray(child)) child.forEach(visiter);
  };
  for (const node of tree.root.findAllByType(Text)) visiter(node.props.children);
  return out.join(' ');
}

describe('démarrage de l’application', () => {
  it('ouvre l’accueil quand rien n’est enregistré', async () => {
    preparer({ session: null, lien: null });
    const tree = await demarrer();
    expect(textes(tree)).toContain('Commencer');
  });

  it('reprend une partie terminée sur son résultat', async () => {
    preparer({ session: SESSION_FINIE, lien: null });
    const tree = await demarrer();
    expect(textes(tree)).toContain('Partager');
  });

  // L'écran natif porte le logo : il ne doit pas se retirer sur l'écran
  // d'attente, qui ne peint que le fond.
  it('garde le logo à l’écran jusqu’à ce qu’il y ait quelque chose à montrer', async () => {
    preparer({ session: SESSION_FINIE, lien: null });

    // `act` SYNCHRONE ici, à l'inverse du reste du fichier : un `act`
    // asynchrone vide la file des microtâches, donc la lecture de la session
    // aboutit avant même qu'on ait pu observer quoi que ce soit, et l'instant
    // « booting » n'existe plus pour le test.
    let tree!: ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<App />);
    });
    montes.push(tree);
    // Premier rendu : on est encore sur `booting`, le logo reste.
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    await renderer.act(async () => {
      await new Promise((r) => setTimeout(r, 120));
    });
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  describe('lien de duel reçu au lancement', () => {
    it.each([
      ['le lien arrive avant la session', 40, 0],
      ['la session arrive avant le lien', 0, 40],
    ])('ouvre le duel quand %s', async (_cas, retardSession, retardLien) => {
      preparer({
        session: SESSION_FINIE,
        lien: `elyze://d?c=${CODE_AUTRE}`,
        retardSession,
        retardLien,
      });
      const tree = await demarrer();
      expect(textes(tree)).toContain('Un défi t’attend');
    });

    // LE DÉFAUT QUI COMPTE : arriver par le QR code de quelqu'un ne doit pas
    // effacer la partie en cours. Relever le défi la remplacera, mais
    // seulement après confirmation, et il faut donc qu'elle soit encore là.
    // Le lien arrive EN PREMIER : c'est le seul ordre où la restauration de
    // la session risque d'être abandonnée.
    it('garde la session enregistrée sous le défi reçu', async () => {
      preparer({
        session: SESSION_FINIE,
        lien: `elyze://d?c=${CODE_AUTRE}`,
        retardSession: 40,
        retardLien: 0,
      });
      const tree = await demarrer();
      const vu = textes(tree);
      expect(vu).toContain('Un défi t’attend');
      // La partie en cours est intacte : relever le défi demandera confirmation
      // avant de la remplacer, ce qui suppose qu'elle existe encore.
      expect(vu).toContain('Relever le défi');
    });

    it('ignore un lien qui ne porte pas de code', async () => {
      preparer({ session: SESSION_FINIE, lien: 'elyze://autre-chose' });
      const tree = await demarrer();
      expect(textes(tree)).toContain('Partager');
    });
  });
});
