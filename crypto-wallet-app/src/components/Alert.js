import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal
} from 'react-native';
import { UI_CONFIG } from '../utils/constants';

const Alert = ({
  visible = false,
  title = '提示',
  message = '',
  type = 'info', // 'info', 'success', 'warning', 'error'
  showCancel = false,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm = () => {},
  onCancel = () => {},
  onClose = () => {},
  style = {}
}) => {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return UI_CONFIG.colors.success;
      case 'warning':
        return UI_CONFIG.colors.warning;
      case 'error':
        return UI_CONFIG.colors.error;
      default:
        return UI_CONFIG.colors.info;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, style]}>
          <View style={styles.header}>
            <Text style={styles.icon}>{getIcon()}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
          
          <View style={styles.buttons}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: getTypeColor() }
              ]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.lg,
  },
  container: {
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: UI_CONFIG.borderRadius.lg,
    padding: UI_CONFIG.spacing.lg,
    minWidth: 280,
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.md,
  },
  icon: {
    fontSize: 24,
    marginRight: UI_CONFIG.spacing.sm,
  },
  title: {
    fontSize: UI_CONFIG.fontSize.lg,
    fontWeight: '600',
    color: UI_CONFIG.colors.text,
    flex: 1,
  },
  message: {
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.textSecondary,
    lineHeight: 20,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: UI_CONFIG.spacing.sm,
  },
  button: {
    paddingHorizontal: UI_CONFIG.spacing.lg,
    paddingVertical: UI_CONFIG.spacing.sm,
    borderRadius: UI_CONFIG.borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: UI_CONFIG.colors.background,
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  confirmButton: {
    backgroundColor: UI_CONFIG.colors.primary,
  },
  cancelButtonText: {
    fontSize: UI_CONFIG.fontSize.sm,
    fontWeight: '500',
    color: UI_CONFIG.colors.text,
  },
  confirmButtonText: {
    fontSize: UI_CONFIG.fontSize.sm,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default Alert;
