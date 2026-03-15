import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type ModalAction = {
  label: string;
  onPress?: () => void;
  type?: 'primary' | 'secondary';
};

type AppModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  actions?: ModalAction[];
  children?: React.ReactNode;
};

export default function AppModal({
  visible,
  title,
  message,
  onClose,
  actions,
  children,
}: AppModalProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const resolvedActions = actions && actions.length > 0
    ? actions
    : [{ label: 'Close', type: 'secondary' as const }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {children}
          </View>
          <View style={styles.footer}>
            {resolvedActions.map((action, index) => {
              const isPrimary = action.type === 'primary';
              return (
                <TouchableOpacity
                  key={`${action.label}-${index}`}
                  onPress={() => {
                    action.onPress?.();
                    onClose();
                  }}
                  style={[styles.actionBtn, isPrimary ? styles.primaryBtn : styles.secondaryBtn]}
                >
                  <Text style={[styles.actionText, isPrimary ? styles.primaryText : styles.secondaryText]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: typeof import('../constants/theme').DarkColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 18, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.cardBgSolid,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    gap: 10,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFF',
  },
  secondaryText: {
    color: colors.text,
  },
});
