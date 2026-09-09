import * as Haptics from 'expo-haptics';

// Interrupteur global, tenu à jour par ThemeContext (qui charge/persiste le
// réglage) — permet aux composants qui déclenchent des vibrations (carte de
// swipe, boutons d'action, révélation du résultat...) de rester de simples
// appels synchrones sans dépendre eux-mêmes du contexte React.
let enabled = true;

export function setHapticsFlag(value: boolean): void {
  enabled = value;
}

export const haptics = {
  impact(style: Haptics.ImpactFeedbackStyle) {
    if (enabled) Haptics.impactAsync(style).catch(() => {});
  },
  notification(type: Haptics.NotificationFeedbackType) {
    if (enabled) Haptics.notificationAsync(type).catch(() => {});
  },
  selection() {
    if (enabled) Haptics.selectionAsync().catch(() => {});
  },
};
