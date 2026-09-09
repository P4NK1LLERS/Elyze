import AsyncStorage from '@react-native-async-storage/async-storage';
import { Answers } from '../types';
import { CATALOG_FINGERPRINT } from './catalog';

// v2 : la session porte désormais l'empreinte du catalogue qui l'a produite
// (voir `isValidSession`). Les sessions v1 n'en ont pas et ne sont pas
// reprises — elles datent d'avant le remaniement des candidats, donc leurs
// identifiants ne désignent plus les mêmes cartes de toute façon.
const SESSION_KEY = 'elyze:session:v2';
const LEGACY_SESSION_KEYS = ['elyze:session:v1'];
const TUTORIAL_KEY = 'elyze:hasSeenTutorial:v1';
const SCHEME_PREF_KEY = 'elyze:schemePreference:v1';
const ACCENT_KEY = 'elyze:accentId:v1';
const HAPTICS_KEY = 'elyze:hapticsEnabled:v1';
const REVEAL_CANDIDATES_KEY = 'elyze:revealCandidates:v1';
const RAINBOW_UNLOCKED_KEY = 'elyze:rainbowUnlocked:v1';
const RAINBOW_KEY = 'elyze:rainbow:v1';
const GRADIENT_KEY = 'elyze:rainbowGradient:v1';

const ALL_STORAGE_KEYS = [
  SESSION_KEY,
  ...LEGACY_SESSION_KEYS,
  TUTORIAL_KEY,
  SCHEME_PREF_KEY,
  ACCENT_KEY,
  HAPTICS_KEY,
  REVEAL_CANDIDATES_KEY,
  RAINBOW_UNLOCKED_KEY,
  RAINBOW_KEY,
  GRADIENT_KEY,
];

export type StoredSession = {
  selectedThemeIds: string[];
  proposalIds: string[];
  currentIndex: number;
  answers: Answers;
  // Empreinte du catalogue au moment de l'enregistrement (voir utils/catalog).
  catalog: string;
};

const ANSWER_VALUES = ['like', 'superlike', 'nope', 'skip'];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

// Contrôle de forme sur ce qui sort du stockage.
//
// Le reste du fichier validait déjà ses données (voir `loadRainbow`), mais la
// session — la plus grosse et la seule imbriquée — était rendue par un simple
// `as StoredSession`, c'est-à-dire une promesse au compilateur que personne ne
// tenait. Un blob tronqué donnait `proposalIds: undefined`, puis un `.map` sur
// `undefined` à l'intérieur d'un `.then` : rejet non capté, restauration
// perdue sans un mot, et l'ErrorBoundary — qui ne voit que le rendu —
// n'apprenait rien.
//
// L'empreinte du catalogue est vérifiée ici même : une session écrite face à
// d'autres propositions n'est pas « à moitié valable », elle est inutilisable,
// et c'est le même refus.
function isValidSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;

  if (s.catalog !== CATALOG_FINGERPRINT) return false;
  if (!isStringArray(s.selectedThemeIds)) return false;
  if (!isStringArray(s.proposalIds)) return false;
  if (typeof s.currentIndex !== 'number' || !Number.isInteger(s.currentIndex)) return false;
  if (s.currentIndex < 0 || s.currentIndex > s.proposalIds.length) return false;
  if (typeof s.answers !== 'object' || s.answers === null || Array.isArray(s.answers)) return false;

  return Object.values(s.answers as Record<string, unknown>).every(
    (a) => typeof a === 'string' && ANSWER_VALUES.includes(a)
  );
}

export async function saveSession(
  session: Omit<StoredSession, 'catalog'>
): Promise<void> {
  try {
    const payload: StoredSession = { ...session, catalog: CATALOG_FINGERPRINT };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Stockage indisponible (mode privé, quota...) : on continue sans
    // persister, ce n'est pas bloquant pour l'utilisation de l'app.
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSession(parsed)) {
      // Session illisible ou d'un autre catalogue : on l'efface plutôt que de
      // la relire en vain à chaque lancement.
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // ignoré
  }
}

export async function hasSeenTutorial(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TUTORIAL_KEY)) === '1';
  } catch {
    return true; // en cas de doute, ne pas imposer le tuto
  }
}

export async function markTutorialSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(TUTORIAL_KEY, '1');
  } catch {
    // ignoré
  }
}

export type SchemePreference = 'system' | 'light' | 'dark';

export async function loadSchemePreference(): Promise<SchemePreference> {
  try {
    const raw = await AsyncStorage.getItem(SCHEME_PREF_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return 'system';
  } catch {
    return 'system';
  }
}

export async function saveSchemePreference(pref: SchemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(SCHEME_PREF_KEY, pref);
  } catch {
    // ignoré
  }
}

export async function loadAccentId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACCENT_KEY);
  } catch {
    return null;
  }
}

export async function saveAccentId(accentId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ACCENT_KEY, accentId);
  } catch {
    // ignoré
  }
}

export async function loadHapticsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(HAPTICS_KEY);
    return raw !== '0';
  } catch {
    return true;
  }
}

export async function saveHapticsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(HAPTICS_KEY, enabled ? '1' : '0');
  } catch {
    // ignoré
  }
}

// Affichage des candidats dans l'onglet Propositions. Par défaut masqué :
// c'est le principe de l'app de ne pas dire qui propose quoi, l'utilisateur
// décide lui-même de lever le voile (voir components/ThemeMosaic.tsx).
export async function loadRevealCandidates(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(REVEAL_CANDIDATES_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function saveRevealCandidates(reveal: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(REVEAL_CANDIDATES_KEY, reveal ? '1' : '0');
  } catch {
    // ignoré
  }
}

// Dégradé arc-en-ciel animé sur la carte et la barre de progression.
//
// Réglage ORDINAIRE, contrairement au mode « couleurs au hasard » qui vit
// derrière l'easter egg de l'accueil : c'est une préférence d'apparence, pas
// une découverte. Éteint par défaut.
export async function loadRainbowGradient(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(GRADIENT_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function saveRainbowGradient(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(GRADIENT_KEY, enabled ? '1' : '0');
  } catch {
    // ignoré
  }
}

// Mode arc-en-ciel débloqué : il reste invisible dans les réglages tant que
// l'easter egg de l'écran d'accueil n'a pas été trouvé (voir IntroScreen).
export async function loadRainbowUnlocked(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(RAINBOW_UNLOCKED_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function saveRainbowUnlocked(unlocked: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(RAINBOW_UNLOCKED_KEY, unlocked ? '1' : '0');
  } catch {
    // ignoré
  }
}

// Mode arc-en-ciel : actif ou non, et la graine de la palette en cours (une
// même graine redonne exactement les mêmes couleurs, voir theme/rainbow.ts).
export type RainbowState = { enabled: boolean; seed: number };

export async function loadRainbow(): Promise<RainbowState | null> {
  try {
    const raw = await AsyncStorage.getItem(RAINBOW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RainbowState>;
    if (typeof parsed?.enabled !== 'boolean' || typeof parsed?.seed !== 'number') return null;
    return { enabled: parsed.enabled, seed: parsed.seed };
  } catch {
    return null;
  }
}

export async function saveRainbow(state: RainbowState): Promise<void> {
  try {
    await AsyncStorage.setItem(RAINBOW_KEY, JSON.stringify(state));
  } catch {
    // ignoré
  }
}

// Efface toutes les données de l'app (session, tutoriel vu, thème, accent,
// vibrations) — utilisé par le bouton "Réinitialiser" des réglages, distinct
// de `clearSession` qui ne touche qu'à la session en cours.
export async function resetAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(ALL_STORAGE_KEYS);
  } catch {
    // ignoré
  }
}
