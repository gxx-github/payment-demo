import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal
} from 'react-native';
import { UI_CONFIG } from '../utils/constants';

const LoadingSpinner = ({
  visible = false,
  text = '加载中...',
  size = 'large',
  color = UI_CONFIG.colors.primary,
  overlay = true,
  style = {}
}) => {
  if (!visible) return null;

  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
      >
        <View style={styles.overlay}>
          <View style={[styles.container, style]}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.text}>{text}</Text>}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: UI_CONFIG.borderRadius.lg,
    padding: UI_CONFIG.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 120,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONFIG.spacing.md,
  },
  text: {
    marginTop: UI_CONFIG.spacing.sm,
    fontSize: UI_CONFIG.fontSize.sm,
    color: UI_CONFIG.colors.text,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
