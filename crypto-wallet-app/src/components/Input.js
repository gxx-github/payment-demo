import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { UI_CONFIG } from '../utils/constants';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  rightIcon = null,
  leftIcon = null,
  onRightIconPress = null,
  disabled = false,
  style = {},
  inputStyle = {},
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const getContainerStyle = () => {
    const baseStyle = [styles.container];
    
    if (error) {
      baseStyle.push(styles.container_error);
    } else if (isFocused) {
      baseStyle.push(styles.container_focused);
    }
    
    if (disabled) {
      baseStyle.push(styles.container_disabled);
    }
    
    return [...baseStyle, style];
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];
    
    if (multiline) {
      baseStyle.push(styles.input_multiline);
    }
    
    return [...baseStyle, inputStyle];
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={getContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={UI_CONFIG.colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.eyeIcon}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: UI_CONFIG.spacing.md,
  },
  label: {
    fontSize: UI_CONFIG.fontSize.sm,
    fontWeight: '500',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_CONFIG.colors.border,
    borderRadius: UI_CONFIG.borderRadius.md,
    backgroundColor: UI_CONFIG.colors.surface,
    minHeight: 44,
  },
  container_focused: {
    borderColor: UI_CONFIG.colors.primary,
    borderWidth: 2,
  },
  container_error: {
    borderColor: UI_CONFIG.colors.error,
    borderWidth: 2,
  },
  container_disabled: {
    backgroundColor: UI_CONFIG.colors.background,
    borderColor: UI_CONFIG.colors.border,
  },
  input: {
    flex: 1,
    fontSize: UI_CONFIG.fontSize.md,
    color: UI_CONFIG.colors.text,
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
    ...Platform.select({
      ios: {
        paddingVertical: UI_CONFIG.spacing.md,
      },
    }),
  },
  input_multiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  leftIcon: {
    paddingLeft: UI_CONFIG.spacing.md,
    paddingRight: UI_CONFIG.spacing.sm,
  },
  rightIcon: {
    paddingRight: UI_CONFIG.spacing.md,
    paddingLeft: UI_CONFIG.spacing.sm,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: UI_CONFIG.fontSize.xs,
    color: UI_CONFIG.colors.error,
    marginTop: UI_CONFIG.spacing.xs,
    marginLeft: UI_CONFIG.spacing.xs,
  },
});

export default Input;
