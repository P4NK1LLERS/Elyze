import React from 'react';
import renderer, { ReactTestInstance, ReactTestRenderer } from 'react-test-renderer';
import { Text } from 'react-native';
import { BottomTabBar, BottomTabItem } from './BottomTabBar';
import { ThemeProvider } from '../theme/ThemeContext';

// Les modules natifs (icônes, stockage, marges d'écran) sont neutralisés une
// fois pour toutes dans jest.setup.js.

// La barre du bas a perdu un onglet en silence une fois : un élément ajouté à
// côté des autres avait fait sortir le dernier de la barre, sans erreur ni
// avertissement, et la seule façon de s'en apercevoir était de regarder un
// téléphone. Ces tests rendent la barre pour de vrai et vérifient que CHAQUE
// entrée déclarée est présente et touchable.
type Tab = 'a' | 'b' | 'c' | 'd';

const TABS: BottomTabItem<Tab>[] = [
  { key: 'a', label: 'Swiper', icon: 'layers-outline' },
  { key: 'b', label: 'Classement', icon: 'trophy-outline' },
  { key: 'c', label: 'Propositions', icon: 'grid-outline' },
  { key: 'd', label: 'Candidats', icon: 'people-outline' },
];

function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(<ThemeProvider>{element}</ThemeProvider>);
  });
  return tree;
}

// Tous les textes rendus, à plat.
function labels(tree: ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(Text)
    .map((node: ReactTestInstance) => node.props.children)
    .filter((child: unknown): child is string => typeof child === 'string');
}

// Les éléments réellement touchables : un libellé affiché mais sans zone
// tactile associée serait tout aussi inaccessible.
function pressables(tree: ReactTestRenderer): ReactTestInstance[] {
  return tree.root.findAll(
    (node: ReactTestInstance) =>
      typeof node.type !== 'string' &&
      typeof node.props?.onPress === 'function' &&
      typeof node.props?.accessibilityRole === 'string'
  );
}

describe('BottomTabBar', () => {
  it('affiche les quatre onglets déclarés', () => {
    const tree = render(<BottomTabBar tabs={TABS} active="a" onChange={() => {}} />);
    const found = labels(tree);
    for (const tab of TABS) {
      expect(found).toContain(tab.label);
    }
    expect(pressables(tree)).toHaveLength(TABS.length);
  });

  it('garde les quatre onglets quand une action est ajoutée à côté', () => {
    const tree = render(
      <BottomTabBar
        tabs={TABS}
        active="a"
        onChange={() => {}}
        extra={{ label: 'Thèmes', icon: 'pricetags-outline', onPress: () => {} }}
      />
    );
    const found = labels(tree);
    for (const tab of TABS) {
      expect(found).toContain(tab.label);
    }
    expect(found).toContain('Thèmes');
    // Quatre onglets + l'action : rien n'a été évincé.
    expect(pressables(tree)).toHaveLength(TABS.length + 1);
  });

  it('touche le bon onglet', () => {
    const onChange = jest.fn();
    const tree = render(<BottomTabBar tabs={TABS} active="a" onChange={onChange} />);
    const candidats = pressables(tree).find(
      (node) => node.props.accessibilityLabel === 'Candidats'
    );
    expect(candidats).toBeDefined();
    renderer.act(() => candidats!.props.onPress());
    expect(onChange).toHaveBeenCalledWith('d');
  });

  it("distingue l'action des onglets par son rôle d'accessibilité", () => {
    const tree = render(
      <BottomTabBar
        tabs={TABS}
        active="a"
        onChange={() => {}}
        extra={{
          label: 'Thèmes',
          icon: 'pricetags-outline',
          onPress: () => {},
          accessibilityLabel: 'Choisir les thèmes à swiper',
        }}
      />
    );
    const roles = pressables(tree).map((node) => node.props.accessibilityRole);
    expect(roles.filter((r) => r === 'tab')).toHaveLength(TABS.length);
    // L'action n'est pas un onglet : elle quitte l'écran et redémarre la
    // session. Un lecteur d'écran ne doit pas l'annoncer comme une vue.
    expect(roles.filter((r) => r === 'button')).toHaveLength(1);
  });
});
