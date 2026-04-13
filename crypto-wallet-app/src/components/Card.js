import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle
} from 'react-native';
import { UI_CONFIG } from '../utils/constants';

const Card = ({
  children,
  style = {},
  onPress = null,
  variant = 'default',
  padding = 'md',
  margin = 'none',
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card, styles[`card_${variant}`]];
    
    // 添加内边距
    if (padding !== 'none') {
      baseStyle.push(styles[`padding_${padding}`]);
    }
    
    // 添加外边距
    if (margin !== 'none') {
      baseStyle.push(styles[`margin_${margin}`]);
    }
    
    return [...baseStyle, style];
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={getCardStyle()} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: UI_CONFIG.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // 卡片变体
  card_default: {
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
  },
  card_elevated: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6.27,
    elevation: 8,
  },
  card_outlined: {
    borderWidth: 2,
    borderColor: UI_CONFIG.colors.primary,
    backgroundColor: 'transparent',
  },
  card_flat: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
  },
  // 内边距
  padding_none: {},
  padding_xs: {
    padding: UI_CONFIG.spacing.xs,
  },
  padding_sm: {
    padding: UI_CONFIG.spacing.sm,
  },
  padding_md: {
    padding: UI_CONFIG.spacing.md,
  },
  padding_lg: {
    padding: UI_CONFIG.spacing.lg,
  },
  padding_xl: {
    padding: UI_CONFIG.spacing.xl,
  },
  // 外边距
  margin_none: {},
  margin_xs: {
    margin: UI_CONFIG.spacing.xs,
  },
  margin_sm: {
    margin: UI_CONFIG.spacing.sm,
  },
  margin_md: {
    margin: UI_CONFIG.spacing.md,
  },
  margin_lg: {
    margin: UI_CONFIG.spacing.lg,
  },
  margin_xl: {
    margin: UI_CONFIG.spacing.xl,
  },
});

export default Card;
