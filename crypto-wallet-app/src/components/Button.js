import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View
} from 'react-native';
import { UI_CONFIG } from '../utils/constants';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon = null,
  style = {},
  textStyle = {},
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.button_disabled);
    } else {
      baseStyle.push(styles[`button_${variant}`]);
    }
    
    return [...baseStyle, style];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text_${size}`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.text_disabled);
    } else {
      baseStyle.push(styles[`text_${variant}`]);
    }
    
    return [...baseStyle, textStyle];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#FFFFFF' : UI_CONFIG.colors.primary}
            style={styles.loader}
          />
        )}
        {icon && !loading && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        <Text style={getTextStyle()}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: UI_CONFIG.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: UI_CONFIG.spacing.sm,
  },
  iconContainer: {
    marginRight: UI_CONFIG.spacing.sm,
  },
  // 尺寸样式
  button_xs: {
    paddingHorizontal: UI_CONFIG.spacing.sm,
    paddingVertical: UI_CONFIG.spacing.xs,
    minHeight: 32,
  },
  button_sm: {
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
    minHeight: 36,
  },
  button_md: {
    paddingHorizontal: UI_CONFIG.spacing.lg,
    paddingVertical: UI_CONFIG.spacing.md,
    minHeight: 44,
  },
  button_lg: {
    paddingHorizontal: UI_CONFIG.spacing.xl,
    paddingVertical: UI_CONFIG.spacing.lg,
    minHeight: 52,
  },
  // 变体样式
  button_primary: {
    backgroundColor: UI_CONFIG.colors.primary,
  },
  button_secondary: {
    backgroundColor: UI_CONFIG.colors.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_danger: {
    backgroundColor: UI_CONFIG.colors.error,
  },
  button_success: {
    backgroundColor: UI_CONFIG.colors.success,
  },
  button_disabled: {
    backgroundColor: UI_CONFIG.colors.border,
  },
  // 文本样式
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_xs: {
    fontSize: UI_CONFIG.fontSize.xs,
  },
  text_sm: {
    fontSize: UI_CONFIG.fontSize.sm,
  },
  text_md: {
    fontSize: UI_CONFIG.fontSize.md,
  },
  text_lg: {
    fontSize: UI_CONFIG.fontSize.lg,
  },
  // 文本颜色
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: UI_CONFIG.colors.primary,
  },
  text_ghost: {
    color: UI_CONFIG.colors.primary,
  },
  text_danger: {
    color: '#FFFFFF',
  },
  text_success: {
    color: '#FFFFFF',
  },
  text_disabled: {
    color: UI_CONFIG.colors.textSecondary,
  },
});

export default Button;
