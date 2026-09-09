// Configuration ESLint (format « flat », celui d'ESLint 9).
//
// Le dépôt portait six `// eslint-disable-next-line react-hooks/exhaustive-deps`
// sans qu'ESLint soit installé : des directives adressées à un outil absent.
// Chacune documente une fermeture volontairement figée et mérite d'être lue —
// mais tant que rien ne faisait tourner la règle, rien ne vérifiait non plus
// les tableaux de dépendances qui n'en avaient pas.
//
// La base `eslint-config-expo` apporte les règles React, React Hooks et
// React Native adaptées au SDK.
const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: [
      // Fichiers générés par scripts/generate-data.js et fetch-bios.js : les
      // corriger à la main serait effacé à la prochaine génération.
      'src/data/proposals.ts',
      'src/data/proposalArguments.ts',
      'src/data/proposalExplanations.ts',
      'src/data/candidates.ts',
      'src/data/candidateBios.ts',
      'node_modules/**',
      'docs/**',
      '.expo/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // La règle qui motive tout ce fichier. En avertissement et non en
      // erreur : les six exceptions existantes sont délibérées et commentées,
      // et transformer d'un coup tout le dépôt en échec de build apprendrait
      // moins que de voir la liste.
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // Les scripts de génération et d'outillage tournent sous Node, pas dans
    // React Native : ils utilisent `require`, `module` et `process`.
    files: ['scripts/**/*.js', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    // Globales injectées par jest, dans les tests comme dans leur fichier de
    // préparation.
    files: ['**/*.test.{ts,tsx}', 'jest.setup.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        require: 'readonly',
      },
    },
  },
];
