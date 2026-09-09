import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { buildColors, ColorTokens, DEFAULT_ACCENT_ID, isKnownAccentId } from './index';
import { buildRainbowColors, buildRainbowMedals, buildRainbowThemeColors, randomSeed } from './rainbow';
import { getThemeColor as fixedThemeColor } from '../data/themeColors';
import { THEMES } from '../data/themes';
import { setHapticsFlag } from '../utils/haptics';
import {
  loadAccentId,
  loadHapticsEnabled,
  loadRainbow,
  loadSchemePreference,
  loadRainbowGradient,
  loadRainbowUnlocked,
  saveAccentId,
  saveHapticsEnabled,
  saveRainbow,
  saveSchemePreference,
  saveRainbowGradient,
  saveRainbowUnlocked,
  SchemePreference,
} from '../utils/storage';

// Or / argent / bronze du podium hors mode arc-en-ciel (voir Podium.tsx pour
// le détail des contrastes).
const FIXED_MEDALS: [string, string, string] = ['#8F6A00', '#6B7280', '#B45309'];

type ThemeContextValue = {
  colors: ColorTokens;
  effectiveScheme: 'light' | 'dark';
  schemePreference: SchemePreference;
  setSchemePreference: (pref: SchemePreference) => void;
  accentId: string;
  setAccentId: (id: string) => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  // Le mode arc-en-ciel est caché tant que l'easter egg de l'accueil n'a pas
  // été trouvé (sept appuis sur le titre, voir IntroScreen).
  rainbowUnlocked: boolean;
  setRainbowUnlocked: (unlocked: boolean) => void;
  rainbowEnabled: boolean;
  setRainbowEnabled: (enabled: boolean) => void;
  // Dégradé animé sur la carte et la barre de progression.
  gradientEnabled: boolean;
  setGradientEnabled: (enabled: boolean) => void;
  // Retire une nouvelle palette au hasard sans quitter le mode.
  rerollRainbow: () => void;
  // Couleur d'une tuile de thème et d'une marche du podium : elles suivent le
  // mode arc-en-ciel, d'où leur passage par le contexte plutôt que par un
  // import direct de la palette fixe.
  themeColor: (themeId: string) => string;
  medalColors: [string, string, string];
};

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [schemePreference, setSchemePreferenceState] = useState<SchemePreference>('system');
  const [accentId, setAccentIdState] = useState<string>(DEFAULT_ACCENT_ID);
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(true);
  const [rainbowUnlocked, setRainbowUnlockedState] = useState(false);
  const [gradientEnabled, setGradientFlag] = useState(false);
  const [rainbow, setRainbow] = useState<{ enabled: boolean; seed: number }>({
    enabled: false,
    seed: 1,
  });

  useEffect(() => {
    loadRainbow().then((saved) => {
      if (saved) setRainbow(saved);
    });
    loadSchemePreference().then(setSchemePreferenceState);
    loadAccentId().then((id) => {
      if (id && isKnownAccentId(id)) setAccentIdState(id);
    });
    loadRainbowUnlocked().then(setRainbowUnlockedState);
    loadRainbowGradient().then(setGradientFlag);
    loadHapticsEnabled().then((value) => {
      setHapticsEnabledState(value);
      setHapticsFlag(value);
    });
  }, []);

  const setSchemePreference = (pref: SchemePreference) => {
    setSchemePreferenceState(pref);
    saveSchemePreference(pref);
  };

  const setAccentId = (id: string) => {
    setAccentIdState(id);
    saveAccentId(id);
  };

  const setHapticsEnabled = (value: boolean) => {
    setHapticsEnabledState(value);
    setHapticsFlag(value);
    saveHapticsEnabled(value);
  };

  // Ces deux fonctions-ci sont mémoïsées, contrairement aux réglages
  // au-dessus : ce sont les seules à LIRE `rainbow.seed`, donc les seules dont
  // l'identité doit changer quand la graine change.
  //
  // Cela fonctionnait déjà, mais par un couplage tacite : le `value` plus bas
  // listait `rainbow.seed` dans ses dépendances, ce qui le reconstruisait avec
  // des fermetures fraîches. La graine y tenait le rôle des fonctions sans que
  // rien ne le dise — et le jour où l'on retire cette dépendance devenue
  // apparemment inutile, ces deux réglages se figent sur une vieille graine
  // sans qu'aucun test n'en parle. Le lien est désormais écrit.
  const setRainbowUnlocked = useCallback(
    (unlocked: boolean) => {
      setRainbowUnlockedState(unlocked);
      saveRainbowUnlocked(unlocked);
      // Reverrouiller (réinitialisation des données) doit aussi éteindre le
      // mode : sinon l'app resterait bariolée sans réglage visible pour en
      // sortir, l'interrupteur étant caché tant que l'egg n'est pas retrouvé.
      if (!unlocked) {
        const next = { enabled: false, seed: rainbow.seed };
        setRainbow(next);
        saveRainbow(next);
      }
    },
    [rainbow.seed]
  );

  // Activer le mode tire une palette neuve ; la désactiver garde la graine en
  // mémoire, pour retrouver les mêmes couleurs si on le réactive.
  const setRainbowEnabled = useCallback(
    (enabled: boolean) => {
      const next = { enabled, seed: enabled ? randomSeed() : rainbow.seed };
      setRainbow(next);
      saveRainbow(next);
    },
    [rainbow.seed]
  );

  const setGradientEnabled = useCallback((enabled: boolean) => {
    setGradientFlag(enabled);
    saveRainbowGradient(enabled);
  }, []);

  const rerollRainbow = () => {
    const next = { enabled: true, seed: randomSeed() };
    setRainbow(next);
    saveRainbow(next);
  };

  const effectiveScheme: 'light' | 'dark' =
    schemePreference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : schemePreference;

  // Ceinture et bretelles : un enregistrement incohérent (mode actif mais
  // verrou remis) ne doit pas repeindre l'app.
  const rainbowActive = rainbow.enabled && rainbowUnlocked;

  const colors = useMemo(
    () =>
      rainbowActive
        ? buildRainbowColors(effectiveScheme, rainbow.seed)
        : buildColors(effectiveScheme, accentId),
    [effectiveScheme, accentId, rainbowActive, rainbow.seed]
  );

  const rainbowThemeColors = useMemo(
    () =>
      rainbowActive
        ? buildRainbowThemeColors(THEMES.map((t) => t.id), rainbow.seed)
        : null,
    [rainbowActive, rainbow.seed]
  );

  const themeColor = useMemo(
    () => (themeId: string) => rainbowThemeColors?.[themeId] ?? fixedThemeColor(themeId),
    [rainbowThemeColors]
  );

  const medalColors = useMemo<[string, string, string]>(
    () => (rainbowActive ? buildRainbowMedals(rainbow.seed) : FIXED_MEDALS),
    [rainbowActive, rainbow.seed]
  );

  const value = useMemo(
    () => ({
      colors,
      effectiveScheme,
      schemePreference,
      setSchemePreference,
      accentId,
      setAccentId,
      hapticsEnabled,
      setHapticsEnabled,
      rainbowUnlocked,
      setRainbowUnlocked,
      rainbowEnabled: rainbowActive,
      setRainbowEnabled,
      gradientEnabled,
      setGradientEnabled,
      rerollRainbow,
      themeColor,
      medalColors,
    }),
    [
      colors,
      effectiveScheme,
      schemePreference,
      accentId,
      hapticsEnabled,
      rainbowUnlocked,
      rainbowActive,
      // Les deux réglages arc-en-ciel remplacent ici `rainbow.seed`, qui en
      // tenait lieu : ce sont eux qui dépendent de la graine, et ils le
      // déclarent maintenant eux-mêmes.
      setRainbowEnabled,
      setRainbowUnlocked,
      gradientEnabled,
      setGradientEnabled,
      themeColor,
      medalColors,
    ]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    throw new Error('useColors/useTheme doit être utilisé à l’intérieur de <ThemeProvider>.');
  }
  return ctx;
}

export function useColors(): ColorTokens {
  return useThemeContext().colors;
}

// Couleur de la tuile d'un thème (mosaïque des propositions, pastilles).
export function useThemeColor(): (themeId: string) => string {
  return useThemeContext().themeColor;
}

// Couleurs des trois marches du podium, dans l'ordre 1er / 2e / 3e.
export function useMedalColors(): [string, string, string] {
  return useThemeContext().medalColors;
}

export function useThemeSettings() {
  const {
    effectiveScheme,
    schemePreference,
    setSchemePreference,
    accentId,
    setAccentId,
    hapticsEnabled,
    setHapticsEnabled,
    rainbowUnlocked,
    setRainbowUnlocked,
    rainbowEnabled,
    setRainbowEnabled,
    gradientEnabled,
    setGradientEnabled,
    rerollRainbow,
  } = useThemeContext();
  return {
    effectiveScheme,
    schemePreference,
    setSchemePreference,
    accentId,
    setAccentId,
    hapticsEnabled,
    setHapticsEnabled,
    rainbowUnlocked,
    setRainbowUnlocked,
    rainbowEnabled,
    setRainbowEnabled,
    gradientEnabled,
    setGradientEnabled,
    rerollRainbow,
  };
}
