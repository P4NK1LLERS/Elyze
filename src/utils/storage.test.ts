import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadSession, saveSession } from './storage';
import { CATALOG_FINGERPRINT } from './catalog';
import { PROPOSALS } from '../data/proposals';

// Le stockage est neutralisé globalement (jest.setup.js) et rend toujours
// `null`. Ici on veut piloter ce qu'il rend, donc on manipule directement les
// fonctions simulées.
const store = AsyncStorage as unknown as {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
};

const SESSION_VALIDE = {
  selectedThemeIds: ['sante', 'education'],
  proposalIds: ['a', 'b', 'c'],
  currentIndex: 1,
  answers: { a: 'like' },
  catalog: CATALOG_FINGERPRINT,
};

beforeEach(() => {
  store.getItem.mockReset().mockResolvedValue(null);
  store.setItem.mockReset().mockResolvedValue(undefined);
  store.removeItem.mockReset().mockResolvedValue(undefined);
});

describe('session enregistrée', () => {
  it('relit une session valide', async () => {
    store.getItem.mockResolvedValue(JSON.stringify(SESSION_VALIDE));
    await expect(loadSession()).resolves.toEqual(SESSION_VALIDE);
  });

  it("appose l'empreinte du catalogue à l'enregistrement", async () => {
    await saveSession({
      selectedThemeIds: [],
      proposalIds: ['a'],
      currentIndex: 0,
      answers: {},
    });
    const [, brut] = store.setItem.mock.calls[0];
    expect(JSON.parse(brut).catalog).toBe(CATALOG_FINGERPRINT);
  });

  // Le cœur du garde-fou : une session écrite face à un autre catalogue
  // désigne des propositions qui n'existent plus, et son `currentIndex` pointe
  // dans un ordre disparu. La reprendre à moitié menait sur une carte sans
  // rapport, en silence.
  it("refuse une session écrite face à un autre catalogue", async () => {
    store.getItem.mockResolvedValue(
      JSON.stringify({ ...SESSION_VALIDE, catalog: '999-deadbeef' })
    );
    await expect(loadSession()).resolves.toBeNull();
    expect(store.removeItem).toHaveBeenCalled();
  });

  it("refuse une session sans empreinte (format v1)", async () => {
    const { catalog, ...sansEmpreinte } = SESSION_VALIDE;
    expect(catalog).toBeDefined();
    store.getItem.mockResolvedValue(JSON.stringify(sansEmpreinte));
    await expect(loadSession()).resolves.toBeNull();
  });

  it.each([
    ['proposalIds absent', { ...SESSION_VALIDE, proposalIds: undefined }],
    ['proposalIds non textuel', { ...SESSION_VALIDE, proposalIds: [1, 2] }],
    ['selectedThemeIds absent', { ...SESSION_VALIDE, selectedThemeIds: undefined }],
    ['currentIndex non entier', { ...SESSION_VALIDE, currentIndex: 1.5 }],
    ['currentIndex négatif', { ...SESSION_VALIDE, currentIndex: -1 }],
    ['currentIndex au-delà du paquet', { ...SESSION_VALIDE, currentIndex: 99 }],
    ['answers absent', { ...SESSION_VALIDE, answers: undefined }],
    ['answers est un tableau', { ...SESSION_VALIDE, answers: [] }],
    ['réponse inconnue', { ...SESSION_VALIDE, answers: { a: 'peut-être' } }],
  ])('refuse une session dont %s', async (_cas, charge) => {
    store.getItem.mockResolvedValue(JSON.stringify(charge));
    await expect(loadSession()).resolves.toBeNull();
  });

  // Avant le contrôle de forme, ce cas levait une exception dans un `.then`
  // d'App.tsx : rejet non capté, restauration perdue sans un mot.
  it('ne lève pas sur du JSON illisible', async () => {
    store.getItem.mockResolvedValue('{"proposalIds":');
    await expect(loadSession()).resolves.toBeNull();
  });

  it('rend null quand rien n’est enregistré', async () => {
    store.getItem.mockResolvedValue(null);
    await expect(loadSession()).resolves.toBeNull();
    expect(store.removeItem).not.toHaveBeenCalled();
  });
});

describe('empreinte du catalogue', () => {
  it('est stable d’un appel à l’autre', () => {
    expect(CATALOG_FINGERPRINT).toBe(CATALOG_FINGERPRINT);
    expect(CATALOG_FINGERPRINT).toMatch(/^\d+-[0-9a-f]{8}$/);
  });

  it('annonce le nombre de propositions embarquées', () => {
    expect(CATALOG_FINGERPRINT.startsWith(`${PROPOSALS.length}-`)).toBe(true);
  });
});
