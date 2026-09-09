// Modules natifs neutralisés pour tous les tests.
//
// Chargé par `setupFiles` (voir package.json), donc exécuté AVANT chaque
// fichier de test. C'est ce qui permet de monter de vrais composants sous
// jest : sans ces trois substituts, le simple fait d'importer un écran
// échouait avant d'avoir rendu quoi que ce soit.
//
// Chacun remplace une dépendance qui exige un environnement natif absent ici,
// et aucun ne simule un comportement dont les tests dépendraient — ils ne font
// que laisser le code s'exécuter.

// `@expo/vector-icons` tire `expo-font`, qui tire `expo-asset`, absent de
// node_modules. Les icônes deviennent des composants hôtes inertes : leur nom
// reste inspectable dans l'arbre rendu, ce qui suffit largement.
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Pas de module natif de stockage sous jest. Le stockage rend systématiquement
// « rien d'enregistré », état par défaut d'une première ouverture.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Les vibrations n'ont pas de sens hors appareil.
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// `SafeAreaView` a besoin des marges réelles de l'appareil ; on rend une vue
// simple et des marges nulles.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children }) => React.createElement(View, null, children),
    useSafeAreaInsets: () => insets,
  };
});

// `expo-linear-gradient` s'appuie sur une vue native. Un composant hôte inerte
// suffit : les tests vérifient les couleurs qu'on lui passe, pas le dégradé
// qu'il peint.
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
