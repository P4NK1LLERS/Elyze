import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorTokens, fonts, radii, spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Boîte de confirmation aux couleurs de l'app (au lieu de l'Alert natif du
// système, qui ignore complètement le thème clair/sombre et l'accent choisi).
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel="Fermer" />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                destructive ? styles.destructiveButton : styles.confirmButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={destructive ? styles.destructiveText : styles.confirmText}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10,9,14,0.55)',
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#1A1730',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 8,
    },
    title: {
      fontSize: fonts.body + 2,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    message: {
      fontSize: fonts.small + 1,
      lineHeight: (fonts.small + 1) * 1.4,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    button: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md - 2,
      borderRadius: radii.pill,
    },
    buttonPressed: {
      opacity: 0.8,
    },
    cancelButton: {
      backgroundColor: colors.surfaceAlt,
    },
    cancelText: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    confirmButton: {
      backgroundColor: colors.accent,
    },
    confirmText: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: colors.onAccent,
    },
    destructiveButton: {
      backgroundColor: colors.danger,
    },
    destructiveText: {
      fontSize: fonts.small + 1,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
