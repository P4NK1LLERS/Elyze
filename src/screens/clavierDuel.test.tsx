import React from 'react';
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { Keyboard, ScrollView } from 'react-native';
import { DuelScreen } from './DuelScreen';
import { ThemeProvider } from '../theme/ThemeContext';
import { PROPOSALS } from '../data/proposals';
import { buildDeck, QUOTA_PAR_CANDIDAT } from '../utils/deck';
import { Answers } from '../types';

// LE CLAVIER, QUI N'EXISTE NI DANS UN NAVIGATEUR NI DANS UNE CAPTURE.
//
// Ce test attrape un défaut constaté sur un vrai téléphone : le champ où l'on
// recopie le code de l'autre restait sous le clavier. La cause n'était pas le
// défilement, qui atteignait bien le bas du contenu, mais le fait que ce bas
// se trouve DERRIÈRE le clavier — depuis le SDK 54, Android est en mode bord à
// bord par défaut et ne redimensionne plus la fenêtre à l'ouverture du
// clavier. Il n'y avait donc nulle part où remonter.
//
// L'invariant à tenir est celui-là, et pas « on fait défiler » : il faut de la
// HAUTEUR DISPONIBLE sous le dernier bloc. Sans elle, aucun défilement,
// automatique ou à la main, ne peut dégager le champ.

const DECK = buildDeck(PROPOSALS, QUOTA_PAR_CANDIDAT);
const REPONSES: Answers = Object.fromEntries(
  DECK.map((p, i) => [p.id, (['like', 'nope'] as const)[i % 2]])
);

const montes: ReactTestRenderer[] = [];

afterEach(() => {
  renderer.act(() => {
    while (montes.length) montes.pop()!.unmount();
  });
});

async function monter() {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <DuelScreen
          proposals={DECK}
          answers={REPONSES}
          deckDone
          codeRecu={null}
          onBack={() => {}}
        />
      </ThemeProvider>
    );
  });
  montes.push(tree);
  return tree;
}

// Le rembourrage bas effectivement appliqué à la zone défilante.
function reserveBasse(tree: ReactTestRenderer): number {
  const defilant = tree.root.findAllByType(ScrollView)[0];
  const style = StyleAplati(defilant.props.contentContainerStyle);
  return style.paddingBottom ?? 0;
}

function StyleAplati(style: unknown): { paddingBottom?: number } {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(StyleAplati));
  if (style && typeof style === 'object') return style as { paddingBottom?: number };
  return {};
}

// On attrape les écouteurs à leur inscription, puis on les appelle. C'est
// exactement ce que fait le système, et `Keyboard` n'expose plus de méthode
// pour émettre soi-même depuis React Native 0.81.
type Ecouteur = (evenement: unknown) => void;
const ecouteurs = new Map<string, Ecouteur>();

beforeEach(() => {
  ecouteurs.clear();
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((nom: string, gestionnaire: Ecouteur) => {
    ecouteurs.set(nom, gestionnaire);
    return { remove: () => ecouteurs.delete(nom) };
  }) as unknown as typeof Keyboard.addListener);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function ouvrirClavier(hauteur: number) {
  const gestionnaire = ecouteurs.get('keyboardDidShow');
  expect(gestionnaire).toBeDefined();
  renderer.act(() => {
    gestionnaire!({
      endCoordinates: { height: hauteur, screenX: 0, screenY: 800 - hauteur, width: 390 },
    });
  });
}

function fermerClavier() {
  const gestionnaire = ecouteurs.get('keyboardDidHide');
  expect(gestionnaire).toBeDefined();
  renderer.act(() => {
    gestionnaire!({ endCoordinates: { height: 0, screenX: 0, screenY: 800, width: 390 } });
  });
}

describe('place laissée au champ quand le clavier s’ouvre', () => {
  it('ne réserve rien tant que le clavier est fermé', async () => {
    const tree = await monter();
    // Le rembourrage de repos, celui qui aère le bas de la page.
    expect(reserveBasse(tree)).toBeLessThan(100);
  });

  it('réserve au moins la hauteur du clavier annoncée', async () => {
    const tree = await monter();
    const auRepos = reserveBasse(tree);
    ouvrirClavier(312);
    expect(reserveBasse(tree)).toBeGreaterThanOrEqual(auRepos + 312);
  });

  // Le cas qui compte le plus : un système qui n'annonce pas de hauteur. Sans
  // plancher, la réserve tomberait à zéro et le défaut reviendrait, en ne se
  // manifestant que sur certains appareils.
  it('réserve quand même de la place si la hauteur annoncée est nulle', async () => {
    const tree = await monter();
    const auRepos = reserveBasse(tree);
    ouvrirClavier(0);
    expect(reserveBasse(tree)).toBeGreaterThanOrEqual(auRepos + 260);
  });

  it('rend la place dès que le clavier se referme', async () => {
    const tree = await monter();
    const auRepos = reserveBasse(tree);
    ouvrirClavier(312);
    fermerClavier();
    expect(reserveBasse(tree)).toBe(auRepos);
  });
});
